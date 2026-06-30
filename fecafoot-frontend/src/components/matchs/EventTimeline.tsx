// src/components/matchs/EventTimeline.tsx
import React from 'react';
import type { MatchEvent } from '../../api/matchEvents.api';
import { ArrowLeftRight, AlertCircle, Trash2, Edit3, ShieldAlert } from 'lucide-react';

interface EventTimelineProps {
  events: MatchEvent[];
  onEdit?: (event: MatchEvent) => void;
  onDelete?: (eventId: number) => void;
  showActions?: boolean;
}

const EventCard = ({ event, onEdit, onDelete, showActions }: {
  event: MatchEvent;
  onEdit?: (e: MatchEvent) => void;
  onDelete?: (id: number) => void;
  showActions: boolean;
}) => {
  const getStyle = (type: string): { dotBg: string; dotBorder: string; label: string; icon: React.ReactNode } => {
    switch (type) {
      case 'but':
      case 'penalty_marque':
        return { dotBg: '#dcfce7', dotBorder: '#22c55e', label: type === 'but' ? 'But' : 'Penalty marqué', icon: <span style={{ fontSize: '14px' }}>⚽</span> };
      case 'but_csc':
        return { dotBg: '#fee2e2', dotBorder: '#ef4444', label: 'But contre son camp', icon: <span style={{ fontSize: '13px' }}>⚽ <span style={{ fontSize: '9px', color: '#dc2626', fontWeight: 900 }}>CSC</span></span> };
      case 'penalty_rate':
        return { dotBg: '#fef3c7', dotBorder: '#f59e0b', label: 'Penalty manqué', icon: <ShieldAlert size={14} style={{ color: '#dc2626' }} /> };
      case 'carton_jaune':
        return { dotBg: '#fefce8', dotBorder: '#eab308', label: 'Carton Jaune', icon: <div style={{ width: '10px', height: '14px', background: '#facc15', borderRadius: '2px', border: '1px solid #ca8a04' }} /> };
      case 'carton_rouge':
        return { dotBg: '#fee2e2', dotBorder: '#ef4444', label: 'Carton Rouge', icon: <div style={{ width: '10px', height: '14px', background: '#dc2626', borderRadius: '2px', border: '1px solid #991b1b' }} /> };
      case 'carton_jaune_rouge':
        return { dotBg: '#fed7aa', dotBorder: '#f97316', label: '2ème jaune (Rouge)', icon: <span style={{ fontSize: '12px' }}>🟨🟥</span> };
      case 'remplacement':
        return { dotBg: '#dbeafe', dotBorder: '#3b82f6', label: 'Remplacement', icon: <ArrowLeftRight size={13} style={{ color: '#2563eb' }} /> };
      case 'tir_cadre':
        return { dotBg: '#e0f2fe', dotBorder: '#0284c7', label: 'Tir cadré', icon: <span style={{ fontSize: '13px' }}>🥅</span> };
      case 'tir_non_cadre':
        return { dotBg: '#f1f5f9', dotBorder: '#64748b', label: 'Tir non cadré', icon: <span style={{ fontSize: '13px' }}>⚽</span> };
      case 'arret':
        return { dotBg: '#f3e8ff', dotBorder: '#a855f7', label: 'Arrêt du gardien', icon: <span style={{ fontSize: '13px' }}>👐</span> };
      case 'faute':
        return { dotBg: '#fef2f2', dotBorder: '#ef4444', label: 'Faute', icon: <span style={{ fontSize: '13px' }}>💥</span> };
      case 'hors_jeu':
        return { dotBg: '#fffbeb', dotBorder: '#f59e0b', label: 'Hors-jeu', icon: <span style={{ fontSize: '13px' }}>🚩</span> };
      case 'corner':
        return { dotBg: '#ecfdf5', dotBorder: '#10b981', label: 'Corner', icon: <span style={{ fontSize: '13px' }}>📐</span> };
      default:
        return { dotBg: '#d1fae5', dotBorder: '#10b981', label: 'Incident', icon: <AlertCircle size={13} style={{ color: '#059669' }} /> };
    }
  };

  const { dotBg, dotBorder, label, icon } = getStyle(event.type);
  const minuteLabel = event.minute_additionnelle ? `${event.minute}+${event.minute_additionnelle}'` : `${event.minute}'`;
  const isInvalid = event.statut === 'invalide';

  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', padding: '12px', background: 'white', borderRadius: '12px', border: '1px solid #f0f4f8', transition: 'all 0.2s ease', opacity: isInvalid ? 0.4 : 1, textDecoration: isInvalid ? 'line-through' : 'none' }}>
      
      {/* Timeline dot */}
      <div style={{ position: 'absolute', left: '-33px', top: '14px', width: '26px', height: '26px', borderRadius: '50%', background: dotBg, border: `2px solid ${dotBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.1)', flexShrink: 0 }}>
        {icon}
      </div>

      {/* Content */}
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 900, color: '#1B4332', background: 'rgba(27,67,50,0.1)', padding: '2px 8px', borderRadius: '4px' }}>
            {minuteLabel}
          </span>
          <span style={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#1B4332' }}>
            {label}
          </span>
          {isInvalid && (
            <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', background: '#fee2e2', color: '#dc2626', padding: '2px 8px', borderRadius: '4px', border: '1px solid #fca5a5' }}>Annulé Admin</span>
          )}
          {event.contestation && (
            <span style={{
              fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', padding: '2px 8px', borderRadius: '4px', border: '1px solid',
              background: event.contestation.statut === 'soumise' ? '#fef3c7' : event.contestation.statut === 'acceptee' ? '#fee2e2' : '#d1fae5',
              color: event.contestation.statut === 'soumise' ? '#92400e' : event.contestation.statut === 'acceptee' ? '#991b1b' : '#065f46',
              borderColor: event.contestation.statut === 'soumise' ? '#fcd34d' : event.contestation.statut === 'acceptee' ? '#fca5a5' : '#6ee7b7'
            }}>
              Contestation {event.contestation.statut === 'soumise' ? 'en cours' : event.contestation.statut === 'acceptee' ? 'acceptée' : 'rejetée'}
            </span>
          )}
        </div>

        <div style={{ fontSize: '13px', color: '#374151', fontWeight: 500, marginTop: '4px' }}>
          {event.description ? event.description : (
            <>
              {event.type === 'remplacement' ? (
                <span>
                  Entrée : <strong style={{ color: '#1B4332' }}>{(event as any).joueur_remplacant?.nom_complet || ((event as any).joueur_remplacant ? `${(event as any).joueur_remplacant.prenom} ${(event as any).joueur_remplacant.nom}` : '')}</strong>{' '}
                  Sortie : <strong style={{ color: '#991b1b' }}>{event.joueur?.nom_complet || (event.joueur ? `${event.joueur.prenom} ${event.joueur.nom}` : '')}</strong>
                </span>
              ) : ['but', 'penalty_marque'].includes(event.type) && (event as any).joueur_remplacant ? (
                <span>
                  Buteur : <strong style={{ color: '#1B4332' }}>{event.joueur?.nom_complet || (event.joueur ? `${event.joueur.prenom} ${event.joueur.nom}` : '')}</strong>
                  {' '}· Passeur : <strong style={{ color: '#0369a1' }}>{(event as any).joueur_remplacant?.nom_complet || ((event as any).joueur_remplacant ? `${(event as any).joueur_remplacant.prenom} ${(event as any).joueur_remplacant.nom}` : '')}</strong>
                </span>
              ) : (
                <span>
                  {event.joueur && <strong style={{ color: '#1B4332' }}>{event.joueur.nom_complet || `${event.joueur.prenom} ${event.joueur.nom}`}</strong>}
                  {(event as any).club && (
                    <span style={{ fontSize: '11px', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginTop: '2px' }}>
                      {(event as any).club.nom}
                    </span>
                  )}
                </span>
              )}
            </>
          )}
        </div>
      </div>


      {/* Actions */}
      {showActions && !isInvalid && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', opacity: 0.5 }} onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = '1'} onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = '0.5'}>
          {onEdit && (
            <button onClick={() => onEdit(event)} title="Modifier" style={{ padding: '5px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#1B4332', borderRadius: '6px', display: 'flex' }}>
              <Edit3 size={14} />
            </button>
          )}
          {onDelete && (
            <button onClick={() => onDelete(event.id)} title="Supprimer" style={{ padding: '5px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#dc2626', borderRadius: '6px', display: 'flex' }}>
              <Trash2 size={14} />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export const EventTimeline: React.FC<EventTimelineProps> = ({ events, onEdit, onDelete, showActions = false }) => {
  if (events.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px', background: 'rgba(27,67,50,0.04)', borderRadius: '14px', border: '2px dashed rgba(27,67,50,0.2)', textAlign: 'center' }}>
        <AlertCircle size={28} style={{ color: '#2D6A4F', marginBottom: '8px', opacity: 0.6 }} />
        <p style={{ fontSize: '13px', color: '#1B4332', fontWeight: 600, margin: 0 }}>Aucun événement enregistré</p>
        <p style={{ fontSize: '11px', color: '#2D6A4F', marginTop: '4px', margin: '4px 0 0' }}>Le journal se remplira au fil des actions.</p>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', paddingLeft: '24px', borderLeft: '2px solid rgba(27,67,50,0.15)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {events.map((event) => (
        <EventCard key={event.id} event={event} onEdit={onEdit} onDelete={onDelete} showActions={showActions} />
      ))}
    </div>
  );
};

export default EventTimeline;
