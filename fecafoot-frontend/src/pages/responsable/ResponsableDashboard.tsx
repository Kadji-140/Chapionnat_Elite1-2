// src/pages/responsable/ResponsableDashboard.tsx
// Dashboard dédié du responsable de club — Stats + Matchs + Classement + Transferts

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Users, UserCheck, Building2, ArrowRight,
  CheckCircle, AlertTriangle, Clock, Star,
  Calendar, Trophy, ArrowLeftRight, TrendingUp, Shield
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { getJoueursClub } from '../../api/joueurs.api';
import { getClubResponsable } from '../../api/clubs.api';
import api from '../../api/axios';

// ── Stat card du dashboard ─────────────────────────────────────
const DashStatCard: React.FC<{
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  subtitle?: string;
  delay?: number;
}> = ({ label, value, icon, color, bgColor, subtitle, delay = 0 }) => (
  <div
    className="stat-card"
    style={{
      animationDelay: `${delay}ms`,
      background: '#fff',
      borderRadius: '16px',
      padding: '20px',
      border: '1px solid #E2E8E0',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      boxShadow: 'var(--shadow-sm)',
    }}
  >
    <div style={{
      width: '52px', height: '52px',
      borderRadius: '14px',
      background: bgColor,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
      color,
    }}>
      {icon}
    </div>
    <div>
      <div className="stat-value" style={{ fontSize: '28px', fontWeight: 800, color, lineHeight: 1.2 }}>{value}</div>
      <div className="stat-label" style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>{label}</div>
      {subtitle && (
        <div style={{ fontSize: '11px', color: 'var(--text-light)', marginTop: '2px' }}>
          {subtitle}
        </div>
      )}
    </div>
  </div>
);

// ── Carte action rapide ────────────────────────────────────────
const QuickAction: React.FC<{
  to: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  accent?: boolean;
}> = ({ to, icon, title, description, accent }) => (
  <Link
    to={to}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '14px',
      padding: '16px 18px',
      borderRadius: '12px',
      border: `1px solid ${accent ? 'rgba(27,67,50,0.15)' : 'var(--border)'}`,
      background: accent ? 'rgba(27,67,50,0.03)' : 'var(--bg-card)',
      textDecoration: 'none',
      transition: 'all 0.2s ease',
      boxShadow: 'var(--shadow-card)',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-2px)';
      e.currentTarget.style.boxShadow = 'var(--shadow-md)';
      if (accent) e.currentTarget.style.borderColor = 'var(--primary)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'none';
      e.currentTarget.style.boxShadow = 'var(--shadow-card)';
      if (accent) e.currentTarget.style.borderColor = 'rgba(27,67,50,0.15)';
    }}
  >
    <div style={{
      width: '44px', height: '44px',
      borderRadius: '12px',
      background: accent ? 'rgba(27,67,50,0.08)' : 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
      color: accent ? 'var(--primary)' : 'var(--text-muted)',
    }}>
      {icon}
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>{title}</div>
      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '1px' }}>{description}</div>
    </div>
    <ArrowRight size={16} style={{ color: 'var(--text-light)', flexShrink: 0 }} />
  </Link>
);

// ── Dashboard responsable ──────────────────────────────────────
const ResponsableDashboard: React.FC = () => {
  const { user } = useAuthStore();

  const { data: joueursData } = useQuery({
    queryKey: ['joueurs-club'],
    queryFn: getJoueursClub,
  });

  const { data: clubData } = useQuery({
    queryKey: ['mon-club'],
    queryFn: getClubResponsable,
  });

  const { data: statsResponse, isLoading: loadingStats } = useQuery({
    queryKey: ['responsable-dashboard-stats'],
    queryFn: () => api.get('/responsable/dashboard-stats').then(r => r.data),
  });

  const stats = joueursData?.stats ?? { total: 0, valides: 0, en_attente: 0, rejetes: 0, soumis: 0 };
  const club = clubData?.data;
  const profileComplete = club?.profile_completed ?? false;

  const dashboardData = statsResponse?.data;
  const prochainMatch = dashboardData?.prochain_match;
  const derniersResultats = dashboardData?.derniers_resultats ?? [];
  const classement = dashboardData?.classement;
  const transfertsEnCours = dashboardData?.transferts_en_cours ?? 0;

  // Calcul du résultat de match
  const getOutcomeBadge = (match: any, clubId: number) => {
    const isDomicile = match.club_domicile_id === clubId;
    const scoreDom = match.score_domicile_officiel ?? match.score_domicile_terrain;
    const scoreExt = match.score_exterieur_officiel ?? match.score_exterieur_terrain;

    if (scoreDom === null || scoreExt === null) return { label: '?', color: '#94A3B8', bg: '#F1F5F9' };

    if (scoreDom === scoreExt) {
      return { label: 'N', color: '#D97706', bg: '#FEF3C7' }; // Draw
    }

    const won = isDomicile ? (scoreDom > scoreExt) : (scoreExt > scoreDom);
    return won 
      ? { label: 'V', color: '#166534', bg: '#DCFCE7' } // Win
      : { label: 'D', color: '#991B1B', bg: '#FEE2E2' }; // Loss
  };

  return (
    <div className="animate-fade-in-up">
      {/* ── En-tête ── */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 className="page-title">
              Bonjour, {user?.prenom} 👋
            </h1>
            <p className="page-subtitle">
              {club ? `Club : ${club.nom} · ${club.division === 'elite_one' ? 'Elite One' : 'Elite Two'}` : 'Votre espace responsable de club'}
            </p>
          </div>
          {/* Badge statut profil */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 14px',
            borderRadius: '10px',
            background: profileComplete ? 'rgba(21,128,61,0.08)' : 'rgba(217,119,6,0.08)',
            border: `1px solid ${profileComplete ? 'rgba(21,128,61,0.2)' : 'rgba(217,119,6,0.2)'}`,
          }}>
            {profileComplete
              ? <CheckCircle size={16} style={{ color: '#15803d' }} />
              : <AlertTriangle size={16} style={{ color: '#d97706' }} />
            }
            <span style={{
              fontSize: '13px',
              fontWeight: 600,
              color: profileComplete ? '#15803d' : '#d97706',
            }}>
              {profileComplete ? 'Profil complet' : 'Profil incomplet'}
            </span>
          </div>
        </div>
      </div>

      {/* ── Alerte profil incomplet ── */}
      {!profileComplete && (
        <div className="animate-slide-down" style={{
          padding: '14px 20px',
          borderRadius: '12px',
          background: 'rgba(217,119,6,0.06)',
          border: '1px solid rgba(217,119,6,0.2)',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <AlertTriangle size={20} style={{ color: '#d97706', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#92400e' }}>
              Complétez le profil de votre club
            </div>
            <div style={{ fontSize: '13px', color: '#a16207', marginTop: '2px' }}>
              Ajoutez les informations manquantes (stade, président, couleurs) pour finaliser l'inscription.
            </div>
          </div>
          <Link to="/responsable/mon-club" className="btn btn-accent btn-sm" style={{ flexShrink: 0 }}>
            Compléter maintenant
          </Link>
        </div>
      )}

      {/* ── Stat cards ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        marginBottom: '28px',
      }}>
        <DashStatCard
          label="Effectif Joueurs"
          value={dashboardData?.nb_joueurs ?? stats.total}
          icon={<Users size={24} />}
          color="var(--primary)"
          bgColor="rgba(27,67,50,0.08)"
          subtitle={`${dashboardData?.nb_joueurs_valides ?? stats.valides} licences validées`}
          delay={50}
        />
        <DashStatCard
          label="Standing Division"
          value={classement ? `#${classement.position}` : '—'}
          icon={<Trophy size={24} style={{ color: '#FFB800' }} />}
          color="#FFB800"
          bgColor="rgba(255,184,0,0.08)"
          subtitle={classement ? `${classement.points} points (${classement.nb_matchs} MJ)` : 'Saison non démarrée'}
          delay={100}
        />
        <DashStatCard
          label="Transferts en cours"
          value={transfertsEnCours}
          icon={<ArrowLeftRight size={24} style={{ color: '#3B82F6' }} />}
          color="#3B82F6"
          bgColor="rgba(59,130,246,0.08)"
          subtitle="En attente de validation"
          delay={150}
        />
        <DashStatCard
          label="Licences en attente"
          value={dashboardData?.nb_joueurs_en_attente ?? stats.en_attente}
          icon={<Clock size={24} style={{ color: '#d97706' }} />}
          color="#d97706"
          bgColor="rgba(217,119,6,0.08)"
          subtitle="Soumis à la FECAFOOT"
          delay={200}
        />
      </div>

      {/* ── Grid Principale ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 340px',
        gap: '24px',
        marginBottom: '28px'
      }} className="responsive-grid">
        {/* Colonne Gauche : Matchs & Calendrier */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Prochain Match */}
          <div className="card" style={{ padding: '20px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={18} style={{ color: 'var(--primary)' }} />
              Prochain match du club
            </h2>

            {prochainMatch ? (
              <div style={{
                background: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)',
                border: '1px solid #E2E8F0',
                borderRadius: '12px',
                padding: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  {/* Domicile */}
                  <div style={{ textAlign: 'center', width: '100px' }}>
                    <div style={{ width: '44px', height: '44px', background: '#e2e8f0', borderRadius: '50%', margin: '0 auto 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                      {prochainMatch.club_domicile?.logo_url ? <img src={prochainMatch.club_domicile.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <Shield size={20} />}
                    </div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {prochainMatch.club_domicile?.nom}
                    </div>
                  </div>

                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#64748B' }}>VS</div>

                  {/* Extérieur */}
                  <div style={{ textAlign: 'center', width: '100px' }}>
                    <div style={{ width: '44px', height: '44px', background: '#e2e8f0', borderRadius: '50%', margin: '0 auto 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                      {prochainMatch.club_exterieur?.logo_url ? <img src={prochainMatch.club_exterieur.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <Shield size={20} />}
                    </div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {prochainMatch.club_exterieur?.nom}
                    </div>
                  </div>
                </div>

                {/* Lieu & Heure */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'right' }}>
                  <span style={{
                    padding: '3px 10px',
                    borderRadius: '20px',
                    fontSize: '11px',
                    fontWeight: 700,
                    alignSelf: 'flex-end',
                    background: prochainMatch.club_domicile_id === club?.id ? 'rgba(27,67,50,0.1)' : '#F1F5F9',
                    color: prochainMatch.club_domicile_id === club?.id ? 'var(--primary)' : '#64748B',
                  }}>
                    {prochainMatch.club_domicile_id === club?.id ? 'Domicile' : 'Extérieur'}
                  </span>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-dark)' }}>
                    {new Date(prochainMatch.date_heure).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} à {new Date(prochainMatch.date_heure).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    🏟️ {prochainMatch.stade || 'Stade à définir'}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                Aucun match programmé à venir.
              </div>
            )}
          </div>

          {/* Derniers Résultats */}
          <div className="card" style={{ padding: '20px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={18} style={{ color: 'var(--primary)' }} />
              Derniers résultats
            </h2>

            {derniersResultats.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {derniersResultats.map((match: any) => {
                  const badge = getOutcomeBadge(match, club?.id);
                  const isDomicile = match.club_domicile_id === club?.id;
                  const opposant = isDomicile ? match.club_exterieur?.nom : match.club_domicile?.nom;
                  const scoreDom = match.score_domicile_officiel ?? match.score_domicile_terrain;
                  const scoreExt = match.score_exterieur_officiel ?? match.score_exterieur_terrain;

                  return (
                    <div
                      key={match.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        border: '1px solid #E2E8E0',
                        fontSize: '13px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{
                          width: '26px', height: '26px', borderRadius: '50%',
                          background: badge.bg, color: badge.color,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 800, fontSize: '11px'
                        }}>
                          {badge.label}
                        </span>
                        <span style={{ fontWeight: 600, color: '#334155' }}>
                          vs {opposant} ({isDomicile ? 'Dom' : 'Ext'})
                        </span>
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '14px', color: '#1E293B', letterSpacing: '1px' }}>
                        {scoreDom} - {scoreExt}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                Aucun match joué récemment.
              </div>
            )}
          </div>
        </div>

        {/* Colonne Droite : Mini-classement */}
        <div>
          <div className="card" style={{ padding: '20px', height: '100%' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Trophy size={18} style={{ color: '#FFB800' }} />
              Position au classement
            </h2>

            {classement ? (
              <div>
                <div style={{ textAlign: 'center', margin: '14px 0 20px' }}>
                  <div style={{ fontSize: '38px', fontWeight: 900, color: 'var(--primary)' }}>
                    #{classement.position}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>
                    sur la poule {classement.poule?.nom || 'Unique'}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #ECEFEE', paddingBottom: '6px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Points</span>
                    <strong style={{ color: 'var(--text-dark)' }}>{classement.points} pts</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #ECEFEE', paddingBottom: '6px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Matchs joués</span>
                    <strong style={{ color: 'var(--text-dark)' }}>{classement.nb_matchs}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #ECEFEE', paddingBottom: '6px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Victoires</span>
                    <strong style={{ color: '#166534' }}>{classement.victoires}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #ECEFEE', paddingBottom: '6px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Nuls</span>
                    <strong style={{ color: '#D97706' }}>{classement.nuls}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #ECEFEE', paddingBottom: '6px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Défaites</span>
                    <strong style={{ color: '#991B1B' }}>{classement.defaites}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '4px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Diff. Buts</span>
                    <strong style={{ color: classement.diff_buts >= 0 ? '#166534' : '#991B1B' }}>
                      {classement.diff_buts >= 0 ? `+${classement.diff_buts}` : classement.diff_buts}
                    </strong>
                  </div>
                </div>

                <div style={{ marginTop: '18px' }}>
                  <Link to="/responsable/classement" className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
                    Voir le classement complet <ArrowRight size={14} style={{ marginLeft: '4px' }} />
                  </Link>
                </div>
              </div>
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                Aucune donnée de classement disponible.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Actions rapides ── */}
      <div>
        <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)', marginBottom: '14px' }}>
          Actions rapides
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '12px',
        }}>
          <QuickAction
            to="/responsable/effectif"
            icon={<Users size={20} />}
            title="Gérer l'effectif"
            description={`${stats.total} joueur(s) · Ajouter, modifier, soumettre`}
            accent
          />
          <QuickAction
            to="/responsable/transferts"
            icon={<ArrowLeftRight size={20} />}
            title="Gérer les transferts"
            description={transfertsEnCours > 0 ? `${transfertsEnCours} demande(s) en cours` : "Faire une demande de transfert"}
            accent={transfertsEnCours > 0}
          />
          <QuickAction
            to="/responsable/mon-club"
            icon={<Building2 size={20} />}
            title="Profil du club"
            description={profileComplete ? 'Voir et modifier les informations' : '⚠️ Profil à compléter'}
            accent={!profileComplete}
          />
        </div>
      </div>

      {/* Styles responsive inline */}
      <style>{`
        @media (max-width: 768px) {
          .responsive-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ResponsableDashboard;
