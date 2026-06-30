// src/components/classement/TopScorersList.tsx
import React from 'react';
import type { StatJoueur } from '../../api/statistiques.api';
import { User, Award, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useTranslation } from '../../hooks/useTranslation';

interface TopScorersListProps {
  stats: StatJoueur[];
  isLoading: boolean;
  type: 'buteurs' | 'passeurs';
}

export const TopScorersList: React.FC<TopScorersListProps> = ({
  stats,
  isLoading,
  type,
}) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { lang } = useTranslation();
  const isEn = lang === 'en';

  let prefix = '';
  if (user?.role === 'admin') prefix = '/admin';
  else if (user?.role === 'responsable_club') prefix = '/responsable';
  else if (user?.role === 'coach') prefix = '/coach';

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="card" style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#e2e8f0', animation: 'pulse-soft 2s ease-in-out infinite' }}></div>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#e2e8f0', animation: 'pulse-soft 2s ease-in-out infinite' }}></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ height: '16px', width: '128px', borderRadius: '4px', background: '#e2e8f0', animation: 'pulse-soft 2s ease-in-out infinite' }}></div>
                <div style={{ height: '12px', width: '80px', borderRadius: '4px', background: '#e2e8f0', animation: 'pulse-soft 2s ease-in-out infinite' }}></div>
              </div>
            </div>
            <div style={{ height: '32px', width: '48px', borderRadius: '8px', background: '#e2e8f0', animation: 'pulse-soft 2s ease-in-out infinite' }}></div>
          </div>
        ))}
      </div>
    );
  }

  if (stats.length === 0) {
    return (
      <div className="card" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
        {isEn ? 'No statistics data recorded at the moment.' : 'Aucune donnée de statistiques enregistrée pour le moment.'}
      </div>
    );
  }

  const labelSingle = type === 'buteurs' ? (isEn ? 'Goal' : 'But') : (isEn ? 'Assist' : 'Passe');
  const labelPlural = type === 'buteurs' ? (isEn ? 'Goals' : 'Buts') : (isEn ? 'Assists' : 'Passes');

  // Separating the #1 leader for a premium card layout
  const leader = stats[0];
  const runnersUp = stats.slice(1);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* #1 Leader premium card */}
      {leader && (
        <div 
          className="card" 
          onClick={() => prefix && navigate(prefix + '/joueurs/' + leader.joueur.id)}
          style={{ 
            background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))', 
            color: 'white', 
            border: 'none', 
            transition: 'transform 0.2s ease, box-shadow 0.2s ease', 
            position: 'relative', 
            overflow: 'hidden',
            cursor: prefix ? 'pointer' : 'default'
          }}
          onMouseEnter={(e) => {
            if (prefix) {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.15)';
            }
          }}
          onMouseLeave={(e) => {
            if (prefix) {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }
          }}
        >
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: '24px', flexWrap: 'wrap' }}>
            {/* Crown decoration in background */}
            <div style={{ position: 'absolute', right: '16px', top: '16px', color: 'var(--accent)', opacity: 0.15, transform: 'rotate(12deg)', pointerEvents: 'none' }}>
              <Award size={128} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '24px', flexWrap: 'wrap', zIndex: 1 }}>
              {/* Position badge & Avatar */}
              <div style={{ position: 'relative' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', border: '4px solid var(--accent)', background: 'white', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {leader.joueur.photo_url ? (
                    <img
                      src={leader.joueur.photo_url}
                      alt={`${leader.joueur.prenom} ${leader.joueur.nom}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <User size={40} style={{ color: 'var(--text-light)' }} />
                  )}
                </div>
                <div style={{ position: 'absolute', top: '-8px', left: '-8px', background: 'var(--accent)', color: 'var(--primary-dark)', fontWeight: 700, fontSize: '11px', padding: '2px 8px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '2px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                  <span>👑</span>
                  <span>{isEn ? '1st' : '1er'}</span>
                </div>
              </div>

              {/* Player details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Award size={14} />
                  <span>{type === 'buteurs' ? (isEn ? 'Top Scorer' : 'Meilleur Buteur') : (isEn ? 'Top Assist Provider' : 'Meilleur Passeur')}</span>
                </div>
                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>
                  {leader.joueur.prenom} {leader.joueur.nom}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', color: 'rgba(255,255,255,0.85)', fontSize: '13px', flexWrap: 'wrap' }}>
                  {leader.joueur.club?.logo_url ? (
                    <img
                      src={leader.joueur.club.logo_url}
                      alt={leader.joueur.club.nom}
                      style={{ width: '20px', height: '20px', objectFit: 'contain' }}
                    />
                  ) : (
                    <Shield size={16} style={{ color: 'rgba(255,255,255,0.7)' }} />
                  )}
                  <span>{leader.joueur.club?.nom || (isEn ? 'Without club' : 'Sans club')}</span>
                  <span>•</span>
                  <span style={{ background: 'rgba(255,255,255,0.15)', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>
                    {leader.joueur.poste}
                  </span>
                </div>
              </div>
            </div>

            {/* Score */}
            <div style={{ background: 'var(--accent)', color: 'var(--primary-dark)', padding: '12px 24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: '100px', boxShadow: '0 4px 10px rgba(0,0,0,0.15)', zIndex: 1 }}>
              <span style={{ fontSize: '28px', fontWeight: 900, lineHeight: 1 }}>
                {type === 'buteurs' ? leader.buts : leader.passes_decisives}
              </span>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, marginTop: '2px' }}>
                {(type === 'buteurs' ? leader.buts : leader.passes_decisives) > 1 ? labelPlural : labelSingle}
              </span>
              <span style={{ fontSize: '10px', opacity: 0.8, marginTop: '4px' }}>
                {leader.nb_matchs} {isEn ? 'matches' : 'matchs'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Runners-up List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {runnersUp.map((entry, index) => {
          const rank = index + 2;
          const score = type === 'buteurs' ? entry.buts : entry.passes_decisives;

          return (
            <div
              key={entry.id}
              className="card"
              onClick={() => prefix && navigate(prefix + '/joueurs/' + entry.joueur.id)}
              style={{ 
                padding: '12px 16px', 
                display: 'flex', 
                flexDirection: 'row', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                gap: '16px', 
                flexWrap: 'wrap',
                cursor: prefix ? 'pointer' : 'default',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (prefix) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                }
              }}
              onMouseLeave={(e) => {
                if (prefix) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }
              }}
            >
              {/* Player details */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {/* Rank */}
                <div style={{ width: '32px', textAlign: 'center', fontWeight: 800, color: 'var(--text-light)', fontSize: '14px' }}>
                  #{rank}
                </div>

                {/* Avatar */}
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', border: '1px solid var(--border)', background: 'var(--bg)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {entry.joueur.photo_url ? (
                    <img
                      src={entry.joueur.photo_url}
                      alt={`${entry.joueur.prenom} ${entry.joueur.nom}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <User size={24} style={{ color: 'var(--text-light)' }} />
                  )}
                </div>

                {/* Name & Club */}
                <div>
                  <h4 style={{ margin: 0, fontWeight: 700, color: 'var(--text)', fontSize: '14px' }}>
                    {entry.joueur.prenom} {entry.joueur.nom}
                  </h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px', flexWrap: 'wrap' }}>
                    {entry.joueur.club?.logo_url && (
                      <img
                        src={entry.joueur.club.logo_url}
                        alt={entry.joueur.club.nom}
                        style={{ width: '16px', height: '16px', objectFit: 'contain' }}
                      />
                    )}
                    <span>{entry.joueur.club?.nom || (isEn ? 'Without club' : 'Sans club')}</span>
                    <span>•</span>
                    <span style={{ textTransform: 'uppercase', fontSize: '10px', fontWeight: 600 }}>
                      {entry.joueur.poste}
                    </span>
                  </div>
                </div>
              </div>

              {/* Statistics right side */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginLeft: 'auto', flexWrap: 'wrap' }}>
                {/* Match count & ratio */}
                <div style={{ textAlign: 'right', fontSize: '12px', color: 'var(--text-muted)' }}>
                  <div>{entry.nb_matchs} {isEn ? 'matches played' : 'matchs joués'}</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-light)', marginTop: '2px' }}>
                    {isEn ? 'Ratio: ' : 'Ratio : '}{(score / Math.max(1, entry.nb_matchs)).toFixed(2)} {isEn ? '/ match' : '/ match'}
                  </div>
                </div>

                {/* Big score badge */}
                <div style={{ background: 'var(--bg)', color: 'var(--text)', fontWeight: 800, padding: '8px 16px', borderRadius: '12px', minWidth: '70px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontSize: '18px', color: 'var(--primary)' }}>{score}</span>
                  <span style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.5px' }}>
                    {score > 1 ? labelPlural : labelSingle}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
