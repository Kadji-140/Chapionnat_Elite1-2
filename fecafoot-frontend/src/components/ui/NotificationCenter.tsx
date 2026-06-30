// src/components/ui/NotificationCenter.tsx
// Centre de notifications in-app avec dropdown animé, badge non-lues, polling auto

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, X, Check, CheckCheck, Trash2, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  type AppNotification,
} from '../../api/notifications.api';
import { useAuthStore } from '../../store/authStore';
import { useTranslation } from '../../hooks/useTranslation';

// ── Son de notification (Web Audio API — aucun fichier requis) ─
const playNotificationSound = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();

    const playTone = (freq: number, startTime: number, duration: number, volume: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(volume, startTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const now = ctx.currentTime;
    // Séquence de cloche : Ding-Dong (ton haut puis bas)
    playTone(880, now, 0.35, 0.5);       // La 5 — premier coup
    playTone(660, now + 0.2, 0.5, 0.35); // Mi 5 — deuxième coup (résonance)
    playTone(1100, now + 0.5, 0.2, 0.2); // Ton plus aigu léger pour effet premium

    // Fermer le contexte après la lecture
    setTimeout(() => ctx.close(), 1200);
  } catch {
    // Silencieux si le navigateur bloque le son (ex: avant interaction utilisateur)
  }
};

// ── Icône par type de notification ────────────────────────────
const getNotifIcon = (type: string) => {
  const icons: Record<string, string> = {
    effectif_soumis: '🏟️',
    joueur_valide:   '✅',
    joueur_rejete:   '❌',
    compte_cree:     '🎉',
    mercato:         '🔄',
    alerte:          '⚠️',
    systeme:         '🔔',
    match_programme: '📅',
    match_demarre:   '⚽',
    match_cloture:   '🏁',
    match_homologue: '🏆',
    match_deprogramme: '⚠️',
    contestation_soumise: '⚖️',
    contestation_traitee: '⚖️',
    penalite_appliquee: '🚨',
    article_soumis: '📰',
    article_valide: '✅',
    article_rejete: '❌',
    article:         '📰',
    default:         '📋',
  };
  return icons[type] ?? icons.default;
};

// ── Couleur de fond par type ───────────────────────────────────
const getNotifColor = (type: string, lu: boolean) => {
  if (lu) return 'transparent';
  const colors: Record<string, string> = {
    effectif_soumis: 'rgba(27,67,50,0.05)',
    joueur_valide:   'rgba(21,128,61,0.05)',
    joueur_rejete:   'rgba(200,16,46,0.05)',
    compte_cree:     'rgba(255,184,0,0.05)',
    alerte:          'rgba(217,119,6,0.05)',
    match_deprogramme: 'rgba(217,119,6,0.06)',
    penalite_appliquee: 'rgba(200,16,46,0.06)',
  };
  return colors[type] ?? 'rgba(27,67,50,0.03)';
};

// ── Élément de notification ────────────────────────────────────
const NotifItem: React.FC<{
  notif: AppNotification;
  onRead: (id: number) => void;
  onDelete: (id: number) => void;
  onNavigate: (lien: string) => void;
}> = ({ notif, onRead, onDelete, onNavigate }) => {
  return (
    <div
      style={{
        padding: '12px 16px',
        borderBottom: '1px solid var(--border)',
        background: getNotifColor(notif.type, notif.lu),
        display: 'flex',
        gap: '12px',
        alignItems: 'flex-start',
        transition: 'background 0.15s ease',
        cursor: notif.lien ? 'pointer' : 'default',
      }}
      onClick={() => {
        if (!notif.lu) onRead(notif.id);
        if (notif.lien) onNavigate(notif.lien);
      }}
    >
      {/* Indicateur non-lu */}
      {!notif.lu && (
        <div style={{
          width: '8px', height: '8px',
          background: 'var(--primary)',
          borderRadius: '50%',
          flexShrink: 0,
          marginTop: '6px',
        }} />
      )}
      {!notif.lu || (
        <div style={{ width: '8px', flexShrink: 0 }} />
      )}

      {/* Icône */}
      <div style={{
        fontSize: '20px',
        flexShrink: 0,
        lineHeight: 1,
      }}>
        {getNotifIcon(notif.type)}
      </div>

      {/* Contenu */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '13px',
          fontWeight: notif.lu ? 500 : 700,
          color: 'var(--text)',
          marginBottom: '2px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {notif.titre}
        </div>
        <div style={{
          fontSize: '12px',
          color: 'var(--text-muted)',
          lineHeight: 1.4,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {notif.message}
        </div>
        <div style={{
          fontSize: '11px',
          color: 'var(--text-light)',
          marginTop: '4px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          {notif.created_at}
          {notif.lien && <ExternalLink size={10} />}
        </div>
      </div>

      {/* Actions */}
      <div
        style={{ display: 'flex', gap: '4px', flexShrink: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        {!notif.lu && (
          <button
            title="Marquer comme lu"
            onClick={() => onRead(notif.id)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-light)', padding: '4px',
              borderRadius: '4px', display: 'flex',
            }}
          >
            <Check size={13} />
          </button>
        )}
        <button
          title="Supprimer"
          onClick={() => onDelete(notif.id)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-light)', padding: '4px',
            borderRadius: '4px', display: 'flex',
          }}
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
};

// ── Composant principal ────────────────────────────────────────
export const NotificationCenter: React.FC = () => {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const prevNbNonLues = useRef<number>(0);

  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: getNotifications,
    refetchInterval: 5_000,
    staleTime: 2_000,
  });

  const notifications = data?.data ?? [];
  const nbNonLuesRaw = data?.nb_non_lues ?? 0;

  const [initialized, setInitialized] = useState(false);
  const [lastBellClickTime, setLastBellClickTime] = useState<number>(() => {
    const val = localStorage.getItem('last_bell_click_time');
    return val ? new Date(val).getTime() : 0;
  });

  // Compter uniquement les notifications non-lues postérieures au dernier clic sur la cloche
  const unreadCount = notifications.filter(n => {
    if (n.lu) return false;
    const sentTime = new Date(n.created_at || n.envoyee_le || Date.now()).getTime();
    return sentTime > lastBellClickTime;
  }).length;

  const { user } = useAuthStore();
  const { translateNotification } = useTranslation();

  const handleNavigate = useCallback((lien: string) => {
    navigate(lien);
  }, [navigate]);

  // ── Déclencher le son et un Toast quand de nouvelles notifications arrivent ──
  useEffect(() => {
    if (data !== undefined) {
      if (!initialized) {
        prevNbNonLues.current = unreadCount;
        setInitialized(true);
      } else {
        if (unreadCount > prevNbNonLues.current) {
          playNotificationSound();

          // Trouver les nouvelles notifications non-lues
          const newNotifs = notifications.filter(
            n => !n.lu && new Date(n.created_at || n.envoyee_le || Date.now()).getTime() > lastBellClickTime
          );
          if (newNotifs.length > 0) {
            const mostRecent = newNotifs[0];
            const translated = translateNotification(mostRecent);
            toast(
              (t) => (
                <div 
                  style={{ display: 'flex', gap: '10px', alignItems: 'center', cursor: 'pointer' }}
                  onClick={() => {
                    toast.dismiss(t.id);
                    if (mostRecent.lien) {
                      handleNavigate(mostRecent.lien);
                    }
                  }}
                >
                  <span style={{ fontSize: '20px' }}>{getNotifIcon(mostRecent.type)}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text)' }}>{translated.titre}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{translated.message}</div>
                  </div>
                </div>
              ),
              {
                duration: 6000,
                style: {
                  background: 'white',
                  borderLeft: '4px solid var(--primary)',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                }
              }
            );
          }
        }
        prevNbNonLues.current = unreadCount;
      }
    }
  }, [unreadCount, data, initialized, notifications, handleNavigate, lastBellClickTime, translateNotification]);

  const handleBellClick = () => {
    const now = Date.now();
    localStorage.setItem('last_bell_click_time', new Date(now).toISOString());
    setLastBellClickTime(now);
    
    if (unreadCount > 0) {
      playNotificationSound();
    }
    
    const prefix = user?.role === 'responsable_club' ? 'responsable' : user?.role;
    navigate(`/${prefix}/notifications`);
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* Bouton cloche */}
      <button
        id="notification-bell"
        onClick={handleBellClick}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} non lues)` : ''}`}
        style={{
          position: 'relative',
          width: '40px',
          height: '40px',
          borderRadius: '10px',
          border: '1px solid var(--border)',
          background: 'transparent',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: unreadCount > 0 ? 'var(--primary)' : 'var(--text-muted)',
          transition: 'all 0.2s ease',
        }}
      >
        <Bell
          size={18}
          style={{
            animation: unreadCount > 0 ? 'bell-shake 2s ease-in-out infinite' : 'none',
          }}
        />
        {/* Badge non-lues */}
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '6px',
              right: '6px',
              width: unreadCount > 9 ? '18px' : '14px',
              height: '14px',
              background: 'var(--secondary)',
              color: 'white',
              fontSize: '9px',
              fontWeight: 800,
              borderRadius: '999px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: 1,
              border: '1.5px solid white',
              animation: 'bounceIn 0.4s ease',
            }}
          >
              {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
    </div>
  );
};
