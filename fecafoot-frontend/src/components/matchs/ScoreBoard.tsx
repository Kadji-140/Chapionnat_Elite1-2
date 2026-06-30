// src/components/matchs/ScoreBoard.tsx
import React from 'react';
import type { Match } from '../../api/matchs.api';
import { Shield, Clock, MapPin, Award } from 'lucide-react';

const getLogoUrl = (url: string | null | undefined): string => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  
  const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
  const baseUrl = apiUrl.endsWith('/api') ? apiUrl.slice(0, -4) : apiUrl;

  const cleanUrl = url.startsWith('/') ? url.substring(1) : url;
  if (cleanUrl.startsWith('storage/')) return `${baseUrl}/${cleanUrl}`;
  return `${baseUrl}/storage/${cleanUrl}`;
};

const ClubLogo: React.FC<{ logoUrl: string | null | undefined; name: string }> = ({ logoUrl, name }) => {
  const [error, setError] = React.useState(false);
  const url = getLogoUrl(logoUrl);
  const initials = name ? name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase() : '';

  if (!url || error) {
    return (
      <div style={{
        width: '80px', height: '80px', borderRadius: '50%',
        background: 'rgba(45,106,79,0.4)', border: '2px solid rgba(45,106,79,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#86efac', fontWeight: 900, fontSize: '22px',
        marginBottom: '12px', letterSpacing: '1px', flexShrink: 0
      }}>
        {initials || <Shield size={32} style={{ color: '#86efac' }} />}
      </div>
    );
  }
  return (
    <div style={{
      width: '80px', height: '80px', borderRadius: '50%',
      background: 'rgba(0,0,0,0.3)', border: '2px solid rgba(45,106,79,0.6)',
      overflow: 'hidden', marginBottom: '12px', flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <img src={url} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setError(true)} />
    </div>
  );
};

interface ScoreBoardProps {
  match: Match;
  liveTime?: string;
  showDetails?: boolean;
  transparentBackground?: boolean;
}

export const ScoreBoard: React.FC<ScoreBoardProps> = ({ match, liveTime, showDetails = true, transparentBackground = false }) => {
  const getStatutBadge = () => {
    switch (match.statut) {
      case 'en_cours': return (
        <span className="animate-pulse" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', background: '#dc2626', color: 'white', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', borderRadius: '999px', letterSpacing: '0.5px' }}>
          <span style={{ width: '8px', height: '8px', background: 'white', borderRadius: '50%' }} />Direct
        </span>
      );
      case 'mi_temps': return (
        <span style={{ padding: '4px 12px', background: '#d97706', color: 'white', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', borderRadius: '999px' }}>Mi-temps</span>
      );
      case 'termine': return (
        <span style={{ padding: '4px 12px', background: '#475569', color: 'white', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', borderRadius: '999px' }}>Terminé</span>
      );
      case 'homologue': return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 12px', background: '#059669', color: 'white', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', borderRadius: '999px' }}>
          <Award size={12} />Homologué
        </span>
      );
      case 'litige': return (
        <span style={{ padding: '4px 12px', background: '#e11d48', color: 'white', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', borderRadius: '999px' }}>En Litige</span>
      );
      case 'reporte': return (
        <span style={{ padding: '4px 12px', background: '#d97706', color: 'white', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', borderRadius: '999px' }}>Reporté</span>
      );
      case 'annule': return (
        <span style={{ padding: '4px 12px', background: '#991b1b', color: 'white', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', borderRadius: '999px' }}>Annulé</span>
      );
      default: return (
        <span style={{ padding: '4px 12px', background: 'rgba(45,106,79,0.4)', color: '#86efac', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', borderRadius: '999px', border: '1px solid rgba(45,106,79,0.6)' }}>Programmé</span>
      );
    }
  };

  const scoreDom = (match as any).score_officiel_dom !== null && (match as any).score_officiel_dom !== undefined ? (match as any).score_officiel_dom : match.score_domicile;
  const scoreExt = (match as any).score_officiel_ext !== null && (match as any).score_officiel_ext !== undefined ? (match as any).score_officiel_ext : match.score_exterieur;

  return (
    <div style={{
      position: 'relative', overflow: 'hidden', borderRadius: '20px',
      background: transparentBackground ? 'transparent' : 'linear-gradient(135deg, #052e16 0%, #14532d 50%, #052e16 100%)',
      color: 'white',
      boxShadow: transparentBackground ? 'none' : '0 20px 60px rgba(5,46,22,0.4)',
      border: transparentBackground ? 'none' : '1px solid rgba(45,106,79,0.4)',
      padding: transparentBackground ? '0px' : '24px 32px'
    }}>
      {/* Background decorations */}
      <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(45,106,79,0.08)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-40px', left: '-40px', width: '160px', height: '160px', borderRadius: '50%', background: 'rgba(45,106,79,0.05)', pointerEvents: 'none' }} />

      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(45,106,79,0.35)', paddingBottom: '14px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#86efac', fontWeight: 700, textTransform: 'uppercase', fontSize: '13px', letterSpacing: '0.5px' }}>
          <Award size={16} style={{ color: '#86efac' }} />
          <span>Elite One</span>
          <span style={{ color: 'rgba(45,106,79,0.6)' }}>•</span>
          <span style={{ color: '#bbf7d0', fontWeight: 500 }}>Journée {match.journee}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {getStatutBadge()}
          {(match as any).est_forfait && (
            <span style={{ padding: '3px 10px', background: 'rgba(225,29,72,0.2)', color: '#fca5a5', border: '1px solid rgba(225,29,72,0.4)', borderRadius: '6px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' }}>Forfait</span>
          )}
        </div>
      </div>

      {/* Score area */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '24px' }}>
        {/* Home */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', textAlign: 'right' }}>
          <ClubLogo logoUrl={match.club_domicile?.logo_url} name={match.club_domicile?.nom} />
          <h2 style={{ fontSize: '20px', fontWeight: 900, color: 'white', margin: 0, lineHeight: 1.2 }}>{match.club_domicile?.nom}</h2>
          <span style={{ fontSize: '11px', color: '#86efac', marginTop: '4px', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>{match.club_domicile?.ville}</span>
        </div>

        {/* Score */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(0,0,0,0.25)', padding: '16px 24px', borderRadius: '16px', border: '1px solid rgba(45,106,79,0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '52px', fontWeight: 900, color: 'white', fontFamily: 'monospace', lineHeight: 1 }}>
              {match.statut === 'programme' ? '-' : (scoreDom ?? 0)}
            </span>
            <span style={{ fontSize: '20px', fontWeight: 700, color: '#4ade80', fontFamily: 'monospace' }}>VS</span>
            <span style={{ fontSize: '52px', fontWeight: 900, color: 'white', fontFamily: 'monospace', lineHeight: 1 }}>
              {match.statut === 'programme' ? '-' : (scoreExt ?? 0)}
            </span>
          </div>
          {match.statut === 'en_cours' && liveTime && (
            <div className="animate-pulse" style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 12px', background: 'rgba(220,38,38,0.3)', color: '#fca5a5', borderRadius: '8px', border: '1px solid rgba(220,38,38,0.4)', fontSize: '13px', fontWeight: 700, fontFamily: 'monospace' }}>
              <Clock size={14} /><span>{liveTime}</span>
            </div>
          )}
          {match.statut === 'mi_temps' && (
            <div style={{ marginTop: '8px', color: '#fcd34d', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase' }}>Pause</div>
          )}
          {match.statut === 'programme' && match.date_heure_fr && (
            <div style={{ marginTop: '8px', color: '#86efac', fontWeight: 700, fontSize: '13px', textAlign: 'center' }}>{match.date_heure_fr}</div>
          )}
        </div>

        {/* Away */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left' }}>
          <ClubLogo logoUrl={match.club_exterieur?.logo_url} name={match.club_exterieur?.nom} />
          <h2 style={{ fontSize: '20px', fontWeight: 900, color: 'white', margin: 0, lineHeight: 1.2 }}>{match.club_exterieur?.nom}</h2>
          <span style={{ fontSize: '11px', color: '#86efac', marginTop: '4px', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>{match.club_exterieur?.ville}</span>
        </div>
      </div>

      {/* Bottom details */}
      {showDetails && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', borderTop: '1px solid rgba(45,106,79,0.35)', paddingTop: '14px', marginTop: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#bbf7d0' }}>
            <MapPin size={15} style={{ color: '#86efac', flexShrink: 0 }} />
            <span style={{ fontWeight: 600, color: 'white' }}>Stade :</span>
            <span>{match.stade || 'Non renseigné'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#bbf7d0', justifyContent: 'flex-end' }}>
            <Award size={15} style={{ color: '#86efac', flexShrink: 0 }} />
            <span style={{ fontWeight: 600, color: 'white' }}>Arbitre :</span>
            <span>{(match as any).arbitre_principal?.nom || 'Non assigné'}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScoreBoard;
