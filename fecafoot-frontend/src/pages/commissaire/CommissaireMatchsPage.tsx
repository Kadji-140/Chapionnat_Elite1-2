// src/pages/commissaire/CommissaireMatchsPage.tsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getCommissaireMatchs } from '../../api/matchEvents.api';
import type { Match } from '../../api/matchs.api';
import { Link } from 'react-router-dom';
import { Play, ClipboardList, CheckCircle, AlertCircle, Loader2, Calendar, MapPin } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';

// ── Helper : Construction de l'URL complète du logo ─────────────────
const getLogoUrl = (url: string | null | undefined): string => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  
  const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
  const baseUrl = apiUrl.endsWith('/api') ? apiUrl.slice(0, -4) : apiUrl;

  const cleanUrl = url.startsWith('/') ? url.substring(1) : url;
  if (cleanUrl.startsWith('storage/')) {
    return `${baseUrl}/${cleanUrl}`;
  }
  return `${baseUrl}/storage/${cleanUrl}`;
};

const ClubLogo: React.FC<{ logoUrl: string | null | undefined; name: string }> = ({ logoUrl, name }) => {
  const [error, setError] = useState(false);
  const url = logoUrl ? getLogoUrl(logoUrl) : '';
  const initials = name ? name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase() : '';

  if (!url || error) {
    return (
      <div style={{
        width: '64px', height: '64px', borderRadius: '50%',
        background: '#E8F5E9', border: '1px solid #C8E6C9',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#2D6A4F', fontWeight: 800, fontSize: '18px',
        marginBottom: '8px', flexShrink: 0
      }}>
        {initials || '?'}
      </div>
    );
  }
  return (
    <div style={{
      width: '64px', height: '64px', borderRadius: '50%',
      background: '#F8FAFC', border: '1px solid #E2E8F0',
      overflow: 'hidden', marginBottom: '8px', flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <img 
        src={url} 
        alt={name} 
        style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#F8FAFC' }} 
        onError={() => setError(true)} 
      />
    </div>
  );
};

export const CommissaireMatchsPage: React.FC = () => {
  const [error] = useState<string>('');
  const { lang } = useTranslation();
  const isEn = lang === 'en';

  const { data: matchsData, isLoading: loading } = useQuery({
    queryKey: ['commissaire-matchs'],
    queryFn: getCommissaireMatchs,
  });

  const matchs: Match[] = matchsData?.data ?? [];

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '80px', gap: '12px' }}>
        <Loader2 className="animate-spin" size={32} style={{ color: '#2D6A4F' }} />
        <span style={{ fontSize: '14px', fontWeight: 600, color: '#64748B' }}>
          {isEn ? 'Loading your assignments...' : 'Chargement de vos affectations...'}
        </span>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up">
      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1B4332 0%, #2D6A4F 100%)',
        borderRadius: '24px',
        padding: '32px',
        color: '#fff',
        marginBottom: '32px',
        boxShadow: '0 8px 32px rgba(27,67,50,0.15)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative circle */}
        <div style={{
          position: 'absolute',
          right: '-50px',
          bottom: '-50px',
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.05)',
          pointerEvents: 'none'
        }} />
        
        <h1 style={{
          fontSize: '28px',
          fontWeight: 900,
          margin: '0 0 8px 0',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          letterSpacing: '-0.5px'
        }}>
          <Calendar size={28} style={{ color: '#A3C4A6' }} />
          {isEn ? 'Match Commissioner Space' : 'Espace Commissaire de Match'}
        </h1>
        <p style={{
          fontSize: '15px',
          color: '#A3C4A6',
          margin: 0,
          fontWeight: 500,
          maxWidth: '600px',
          lineHeight: '1.5'
        }}>
          {isEn 
            ? 'Welcome to your dashboard. Track your ongoing matches, enter events in real-time, and sign your official match reports.'
            : 'Bienvenue dans votre tableau de bord. Suivez vos rencontres en cours, saisissez les événements en temps réel et signez vos rapports de match officiels.'}
        </p>
      </div>

      {error && (
        <div style={{ padding: '16px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '12px', color: '#991B1B', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
          <AlertCircle size={18} />
          <span style={{ fontSize: '13px', fontWeight: 600 }}>{error}</span>
        </div>
      )}

      {matchs.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
          <Calendar size={48} style={{ color: '#2D6A4F', opacity: 0.4, margin: '0 auto 12px' }} />
          <h3 style={{ margin: '0 0 8px', color: '#1e293b', fontWeight: 700 }}>{isEn ? 'No assigned matches' : 'Aucun match assigné'}</h3>
          <p style={{ color: '#64748b', fontSize: '14px' }}>
            {isEn 
              ? 'You do not have any matches scheduled as a commissioner at the moment.'
              : "Vous n'avez pas de rencontre programmée en tant que commissaire pour le moment."}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {matchs.map((match, idx) => {
            const isLive = ['en_cours', 'mi_temps'].includes(match.statut);
            const date = match.date_heure ? new Date(match.date_heure) : null;

            return (
              <div 
                key={match.id} 
                className="stagger-item"
                style={{
                  animationDelay: `${idx * 60}ms`,
                  background: '#fff',
                  border: '1px solid var(--border)',
                  borderRadius: '24px',
                  padding: '24px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '20px',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 12px 30px rgba(27,67,50,0.08)';
                  e.currentTarget.style.borderColor = 'var(--primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.02)';
                  e.currentTarget.style.borderColor = 'var(--border)';
                }}
              >
                {/* Header status bar */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottom: '1px solid #F1F5F9',
                  paddingBottom: '14px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      padding: '4px 10px',
                      background: 'rgba(27,67,50,0.08)',
                      color: 'var(--primary)',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: 800,
                      textTransform: 'uppercase'
                    }}>
                      {isEn ? 'Matchday' : 'Journée'} {match.journee}
                    </span>
                    <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>
                      ID: #{match.id}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {/* Statut Badge */}
                    {match.statut === 'en_cours' && (
                      <span className="animate-pulse" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', background: '#FEE2E2', color: '#991B1B', borderRadius: '20px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#991B1B' }} />
                        {isEn ? 'Direct Live' : 'Direct Live'}
                      </span>
                    )}
                    {match.statut === 'mi_temps' && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', background: '#FEF3C7', color: '#92400E', borderRadius: '20px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>
                        {isEn ? 'Halftime' : 'Mi-Temps'}
                      </span>
                    )}
                    {match.statut === 'programme' && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', background: '#D8F3DC', color: '#2D6A4F', borderRadius: '20px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>
                        {isEn ? 'Scheduled' : 'Programmé'}
                      </span>
                    )}
                    {match.statut === 'termine' && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', background: '#F1F5F9', color: '#475569', borderRadius: '20px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>
                        {match.rapport_soumis ? (isEn ? 'Finished (Report submitted)' : 'Terminé (Rapport soumis)') : (isEn ? 'Finished' : 'Terminé')}
                      </span>
                    )}

                    {match.statut === 'homologue' && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', background: '#E0F2FE', color: '#0369A1', borderRadius: '20px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>
                        {isEn ? 'Approved' : 'Homologué'}
                      </span>
                    )}
                    {match.statut === 'litige' && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', background: '#FEE2E2', color: '#991B1B', borderRadius: '20px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>
                        {isEn ? 'In Dispute' : 'En Litige'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Match Content (Teams and score) */}
                <div className="match-teams-row" style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '24px',
                  padding: '10px 0'
                }}>
                  {/* Home Team */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                    <ClubLogo logoUrl={match.club_domicile?.logo_url} name={match.club_domicile?.nom ?? ''} />
                    <span style={{ fontSize: '15px', fontWeight: 800, color: '#1E293B' }}>{match.club_domicile?.nom}</span>
                    <span style={{ fontSize: '11px', color: '#64748B', textTransform: 'uppercase' }}>{match.club_domicile?.ville}</span>
                  </div>

                  {/* Score or VS */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '120px' }}>
                    <div style={{
                      fontSize: '28px',
                      fontWeight: 900,
                      fontFamily: 'monospace',
                      color: isLive ? 'var(--primary)' : '#1E293B',
                      background: '#F8FAFC',
                      padding: '8px 20px',
                      borderRadius: '16px',
                      border: '1px solid #E2E8F0',
                      letterSpacing: '2px',
                      textAlign: 'center'
                    }}>
                      {match.statut === 'programme' ? 'VS' : `${match.score_domicile ?? 0} - ${match.score_exterieur ?? 0}`}
                    </div>
                    {date && (
                      <span style={{ fontSize: '11px', color: '#64748B', marginTop: '6px', fontWeight: 600, textAlign: 'center' }}>
                        {date.toLocaleDateString(isEn ? 'en-US' : 'fr-FR', { day: 'numeric', month: 'short' })} {isEn ? 'at' : 'à'} {date.toLocaleTimeString(isEn ? 'en-US' : 'fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>

                  {/* Away Team */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                    <ClubLogo logoUrl={match.club_exterieur?.logo_url} name={match.club_exterieur?.nom ?? ''} />
                    <span style={{ fontSize: '15px', fontWeight: 800, color: '#1E293B' }}>{match.club_exterieur?.nom}</span>
                    <span style={{ fontSize: '11px', color: '#64748B', textTransform: 'uppercase' }}>{match.club_exterieur?.ville}</span>
                  </div>
                </div>

                {/* Footer and Actions */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderTop: '1px solid #F1F5F9',
                  paddingTop: '14px',
                  marginTop: '4px',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748B', fontWeight: 600 }}>
                    <MapPin size={14} style={{ color: 'var(--primary)' }} />
                    <span>{match.stade || (isEn ? 'Stadium not specified' : 'Stade non renseigné')}</span>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {match.statut === 'programme' && (
                      <Link
                        to={`/commissaire/live/${match.id}`}
                        className="btn btn-primary btn-sm"
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
                      >
                        <Play size={14} fill="currentColor" />
                        {isEn ? 'Start Match' : 'Démarrer le Match'}
                      </Link>
                    )}

                    {isLive && (
                      <Link
                        to={`/commissaire/live/${match.id}`}
                        className="btn btn-danger btn-sm animate-pulse"
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
                      >
                        <Play size={14} fill="currentColor" />
                        {isEn ? 'Access Live' : 'Accéder au Live'}
                      </Link>
                    )}

                    {match.statut === 'termine' && !match.rapport_soumis && (
                      <Link
                        to={`/commissaire/live/${match.id}/rapport`}
                        className="btn btn-accent btn-sm"
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
                      >
                        <ClipboardList size={14} />
                        {isEn ? 'Write Report' : 'Rédiger le Rapport'}
                      </Link>
                    )}

                    {match.statut === 'termine' && match.rapport_soumis && (
                      <Link
                        to={`/commissaire/live/${match.id}/rapport`}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', background: '#D8F3DC', color: '#1B4332', borderRadius: '12px', fontSize: '12px', fontWeight: 700, textDecoration: 'none' }}
                      >
                        <CheckCircle size={14} />
                        {isEn ? 'Report Submitted (View)' : 'Rapport Soumis (Consulter)'}
                      </Link>
                    )}

                    {match.statut === 'homologue' && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', background: '#D8F3DC', color: '#1B4332', borderRadius: '12px', fontSize: '12px', fontWeight: 700 }}>
                        <CheckCircle size={14} />
                        {isEn ? 'Report Submitted & Approved' : 'Rapport Soumis & Homologué'}
                      </span>
                    )}

                    {match.statut === 'litige' && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', background: '#FEE2E2', color: '#991B1B', borderRadius: '12px', fontSize: '12px', fontWeight: 700 }}>
                        <AlertCircle size={14} />
                        {isEn ? 'In Dispute' : 'En Litige'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        @media (max-width: 576px) {
          .match-teams-row {
            flex-direction: column !important;
            gap: 16px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default CommissaireMatchsPage;
