// src/pages/commissaire/CommissaireDashboardPage.tsx
// Tableau de bord dédié du commissaire de match

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import {
  Calendar, CheckCircle, Clock, ShieldAlert,
  Play, FileText, Zap, Eye, Award
} from 'lucide-react';
import api from '../../api/axios';
import { useTranslation } from '../../hooks/useTranslation';

const StatCard: React.FC<{
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}> = ({ label, value, icon, color, bgColor }) => (
  <div style={{
    background: '#fff',
    borderRadius: '16px',
    padding: '18px 20px',
    border: '1px solid #E2E8E0',
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    boxShadow: 'var(--shadow-sm)',
  }}>
    <div style={{
      width: '48px',
      height: '48px',
      borderRadius: '14px',
      background: bgColor,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      color,
    }}>
      {icon}
    </div>
    <div>
      <div style={{ fontSize: '26px', fontWeight: 800, color, lineHeight: 1.2 }}>{value}</div>
      <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>{label}</div>
    </div>
  </div>
);

export const CommissaireDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { lang } = useTranslation();
  const isEn = lang === 'en';

  const { data: responseData, isLoading } = useQuery({
    queryKey: ['commissaire-matchs'],
    queryFn: () => api.get('/commissaire/matchs').then(r => r.data),
  });

  const matchs = responseData?.data ?? [];

  // Statistiques
  const totalMatchs = matchs.length;
  const matchsTermines = matchs.filter((m: any) => m.statut === 'termine' || m.statut === 'homologue').length;
  const matchsAvenir = matchs.filter((m: any) => m.statut === 'programme' || m.statut === 'reporte').length;
  const matchsEnCours = matchs.filter((m: any) => m.statut === 'live').length;

  // Match du jour (match programmé aujourd'hui ou actuellement en direct)
  const matchDuJour = matchs.find((m: any) => {
    if (m.statut === 'live') return true;
    if (m.statut === 'programme') {
      const matchDate = new Date(m.date_heure).toDateString();
      const todayDate = new Date().toDateString();
      return matchDate === todayDate;
    }
    return false;
  });

  // Historique récent
  const recentHistory = matchs
    .filter((m: any) => m.statut === 'termine' || m.statut === 'homologue')
    .slice(0, 4);

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1B4332 0%, #0F2D1F 100%)',
        borderRadius: '20px',
        padding: '28px 32px',
        color: '#fff',
        marginBottom: '24px',
        boxShadow: 'var(--shadow-md)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
              {isEn ? 'FECAFOOT Elite · Match Official' : 'FECAFOOT Elite · Officiel de Match'}
            </div>
            <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 800 }}>
              {isEn ? 'Match Commissioner Workspace 👋' : 'Espace Commissaire de Match 👋'}
            </h1>
            <p style={{ margin: '8px 0 0', fontSize: '14px', opacity: 0.8 }}>
              {isEn 
                ? 'Track your match assignments, supervise live, and write your official reports.' 
                : 'Suivez vos affectations de matchs, supervisez en direct, et rédigez vos rapports officiels.'}
            </p>
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '28px',
      }}>
        <StatCard
          label={isEn ? 'Total assigned matches' : 'Total matchs assignés'}
          value={totalMatchs}
          icon={<Calendar size={24} />}
          color="var(--primary)"
          bgColor="rgba(27,67,50,0.08)"
        />
        <StatCard
          label={isEn ? 'Matches in progress (LIVE)' : 'Matchs en cours (LIVE)'}
          value={matchsEnCours}
          icon={<Zap size={24} style={{ color: '#DC2626' }} />}
          color="#DC2626"
          bgColor="rgba(220,38,38,0.08)"
        />
        <StatCard
          label={isEn ? 'Refereed & closed matches' : 'Matchs arbitrés & clos'}
          value={matchsTermines}
          icon={<CheckCircle size={24} style={{ color: '#166534' }} />}
          color="#166534"
          bgColor="rgba(22,101,52,0.08)"
        />
        <StatCard
          label={isEn ? 'Upcoming matches' : 'Matchs à venir'}
          value={matchsAvenir}
          icon={<Clock size={24} style={{ color: '#D97706' }} />}
          color="#D97706"
          bgColor="rgba(217,119,6,0.08)"
        />
      </div>

      {/* Grid centrale */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', marginBottom: '28px' }} className="responsive-grid">
        
        {/* Colonne gauche : Match du jour */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div className="card" style={{ padding: '20px' }}>
            <h2 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={18} style={{ color: 'var(--secondary)' }} />
              {isEn ? 'Assignment and Match of the day' : 'Affectation et Match du jour'}
            </h2>

            {matchDuJour ? (
              <div style={{
                background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
                border: '1px solid #FDE68A',
                borderRadius: '12px',
                padding: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{
                      padding: '3px 10px',
                      borderRadius: '20px',
                      fontSize: '11px',
                      fontWeight: 700,
                      background: matchDuJour.statut === 'live' ? '#FEE2E2' : '#F59E0B',
                      color: matchDuJour.statut === 'live' ? '#991B1B' : '#FFF',
                    }}>
                      {matchDuJour.statut === 'live' ? (isEn ? '⚡ LIVE' : '⚡ EN DIRECT') : (isEn ? '📅 TODAY' : "📅 AUJOURD'HUI")}
                    </span>
                    <span style={{ fontSize: '12px', color: '#B45309', fontWeight: 600 }}>
                      🕒 {new Date(matchDuJour.date_heure).toLocaleTimeString(isEn ? 'en-US' : 'fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#92400E', marginBottom: '4px' }}>
                    {matchDuJour.club_domicile?.nom} vs {matchDuJour.club_exterieur?.nom}
                  </div>
                  <div style={{ fontSize: '13px', color: '#B45309' }}>
                    🏟️ {matchDuJour.stade || (isEn ? 'Stadium not defined' : 'Stade non défini')}
                  </div>
                </div>

                <button
                  className="btn"
                  onClick={() => navigate(`/commissaire/live/${matchDuJour.id}`)}
                  style={{
                    background: '#D97706',
                    color: '#fff',
                    border: 'none',
                    fontWeight: 700,
                    padding: '10px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <Play size={14} fill="#fff" /> {isEn ? 'Enter Live' : 'Entrer au Live'}
                </button>
              </div>
            ) : (
              <div style={{
                padding: '36px',
                textAlign: 'center',
                background: '#F8FAFC',
                borderRadius: '12px',
                border: '1px solid #E2E8F0',
                color: 'var(--text-light)'
              }}>
                <ShieldAlert size={36} style={{ margin: '0 auto 10px', color: '#94A3B8' }} />
                <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-dark)' }}>{isEn ? 'No matches today' : "Aucune rencontre aujourd'hui"}</div>
                <div style={{ fontSize: '12px', marginTop: '4px' }}>{isEn ? 'You have no match scheduled today.' : "Vous n'avez pas de match programmé aujourd'hui."}</div>
              </div>
            )}
          </div>

          {/* Historique Récent */}
          <div className="card" style={{ padding: '20px' }}>
            <h2 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={18} style={{ color: 'var(--primary)' }} />
              {isEn ? 'Latest supervised match sheets' : 'Dernières feuilles de match supervisées'}
            </h2>

            {recentHistory.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {recentHistory.map((m: any) => {
                  const date = new Date(m.date_heure);
                  const hasRapport = m.rapport_soumis || m.statut === 'homologue';
                  
                  return (
                    <div
                      key={m.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 16px',
                        borderRadius: '12px',
                        border: '1px solid #E2E8E0',
                        fontSize: '13px'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--text-dark)' }}>
                          {m.club_domicile?.nom} {m.score_domicile_officiel ?? m.score_domicile_terrain} - {m.score_exterieur_officiel ?? m.score_exterieur_terrain} {m.club_exterieur?.nom}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-light)', marginTop: '2px' }}>
                          📅 {date.toLocaleDateString(isEn ? 'en-US' : 'fr-FR')} · {m.stade}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: 700,
                          background: m.statut === 'homologue' ? '#DCFCE7' : (m.rapport_soumis ? '#E0F2FE' : '#FEF2F2'),
                          color: m.statut === 'homologue' ? '#15803D' : (m.rapport_soumis ? '#0369A1' : '#991B1B'),
                        }}>
                          {m.statut === 'homologue' 
                            ? (isEn ? 'Approved ✓' : 'Homologué ✓') 
                            : (m.rapport_soumis ? (isEn ? 'Report submitted' : 'Rapport soumis') : (isEn ? 'Report to write ⚠️' : 'Rapport à rédiger ⚠️'))}
                        </span>
                        <Link to={`/commissaire/live/${m.id}/rapport`} className="btn btn-icon btn-ghost btn-sm" style={{ padding: '4px' }}>
                          <Eye size={15} />
                        </Link>
                      </div>
                    </div>
                  );

                })}
              </div>
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                {isEn ? 'No match supervised recently.' : 'Aucun match supervisé récemment.'}
              </div>
            )}
          </div>

        </div>

        {/* Colonne droite : Actions et Règlements */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Actions rapides */}
          <div className="card" style={{ padding: '20px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)', marginBottom: '14px' }}>
              {isEn ? 'Quick actions' : 'Actions rapides'}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Link to="/commissaire/matchs" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', textDecoration: 'none', textAlign: 'center' }}>
                📅 {isEn ? 'View my assignments' : 'Consulter mes affectations'}
              </Link>
              <Link to="/commissaire/actualites" className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center', textDecoration: 'none', textAlign: 'center' }}>
                📰 {isEn ? 'View news' : 'Consulter les actualités'}
              </Link>
            </div>
          </div>

          {/* Charte du commissaire */}
          <div className="card" style={{ padding: '20px', background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <Award size={18} style={{ color: 'var(--primary)' }} />
              <strong style={{ fontSize: '13px', color: 'var(--text-dark)' }}>{isEn ? 'Commissioner Charter' : 'Charte du Commissaire'}</strong>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
              {isEn
                ? 'The match commissioner represents the supreme authority of FECAFOOT on the match. You must validate the match sheets, record incidents, and submit the final report within 24 hours.'
                : "Le commissaire de match représente l'autorité suprême de la FECAFOOT sur la rencontre. Vous devez impérativement valider les feuilles de match, enregistrer les incidents et soumettre le rapport final sous 24h."}
            </p>
          </div>
        </div>

      </div>
      
      <style>{`
        @media (max-width: 992px) {
          .responsive-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default CommissaireDashboardPage;
