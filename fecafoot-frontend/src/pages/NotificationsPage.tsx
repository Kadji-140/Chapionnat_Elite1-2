// src/pages/NotificationsPage.tsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Bell, Trash2, CheckSquare, Square, Check, CheckCheck, Loader2, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  type AppNotification,
} from '../api/notifications.api';
import { useTranslation } from '../hooks/useTranslation';

export default function NotificationsPage() {
  const { t, translateNotification } = useTranslation();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Charger les notifications
  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: getNotifications,
  });

  const notifications = data?.data ?? [];

  // Mutations
  const readMutation = useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const readAllMutation = useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      toast.success(t('notif.marked_read_success'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteNotification,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  // Gérer la sélection
  const handleSelectAll = () => {
    if (selectedIds.length === notifications.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(notifications.map((n) => n.id));
    }
  };

  const handleToggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Actions de groupe
  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Voulez-vous vraiment supprimer les ${selectedIds.length} notifications sélectionnées ?`)) {
      return;
    }

    const toastId = toast.loading('Suppression en cours...');
    try {
      // Supprimer séquentiellement ou en parallèle
      await Promise.all(selectedIds.map((id) => deleteNotification(id)));
      setSelectedIds([]);
      qc.invalidateQueries({ queryKey: ['notifications'] });
      toast.success(t('notif.deleted_success'), { id: toastId });
    } catch (error) {
      toast.error('Erreur lors de la suppression.', { id: toastId });
    }
  };

  const handleItemClick = async (notif: AppNotification) => {
    if (!notif.lu) {
      await readMutation.mutateAsync(notif.id);
    }
    if (notif.lien) {
      navigate(notif.lien);
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <Loader2 className="animate-spin" size={36} style={{ color: 'var(--primary)' }} />
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up" style={{ maxWidth: '960px', margin: '0 auto', padding: '24px 0' }}>
      {/* Header de la page */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 900, color: 'var(--text)', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Bell size={26} style={{ color: 'var(--primary)' }} />
            {t('notif.title')}
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            {t('notif.subtitle')}
          </p>
        </div>

        {/* Actions de masse */}
        <div style={{ display: 'flex', gap: '10px' }}>
          {notifications.length > 0 && (
            <>
              <button
                onClick={readAllMutation.mutate}
                className="btn btn-ghost"
                style={{ fontSize: '13px', fontWeight: 700, gap: '6px', color: 'var(--primary)' }}
              >
                <CheckCheck size={16} />
                {t('notif.mark_all_read')}
              </button>

              <button
                onClick={handleDeleteSelected}
                disabled={selectedIds.length === 0}
                className="btn"
                style={{
                  fontSize: '13px',
                  fontWeight: 700,
                  gap: '6px',
                  background: selectedIds.length > 0 ? '#EF4444' : '#F1F5F9',
                  color: selectedIds.length > 0 ? '#fff' : '#94A3B8',
                  border: 'none',
                  cursor: selectedIds.length > 0 ? 'pointer' : 'not-allowed',
                }}
              >
                <Trash2 size={16} />
                {t('notif.delete_selected')} ({selectedIds.length})
              </button>
            </>
          )}
        </div>
      </div>

      {/* Liste des notifications */}
      {notifications.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px', background: '#fff' }}>
          <Bell size={48} style={{ color: '#CBD5E1', margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)', margin: '0 0 8px 0' }}>
            {t('header.no_notifications')}
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
            {t('notif.empty')}
          </p>
        </div>
      ) : (
        <div className="card" style={{ background: '#fff', overflow: 'hidden', padding: 0 }}>
          {/* Barre de contrôle du tableau */}
          <div style={{
            padding: '12px 20px',
            borderBottom: '1px solid #E2E8F0',
            background: '#F8FAFC',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}>
            <button
              onClick={handleSelectAll}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
                fontWeight: 700,
                color: 'var(--text-muted)',
                padding: 0,
              }}
            >
              {selectedIds.length === notifications.length ? (
                <CheckSquare size={18} style={{ color: 'var(--primary)' }} />
              ) : (
                <Square size={18} />
              )}
              {t('notif.select_all')}
            </button>
            <span style={{ fontSize: '13px', color: 'var(--text-light)', marginLeft: 'auto' }}>
              {notifications.length} notification(s)
            </span>
          </div>

          {/* Corps de la liste */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {notifications.map((n) => {
              const translated = translateNotification(n);
              const isSelected = selectedIds.includes(n.id);
              const isUnread = !n.lu;

              return (
                <div
                  key={n.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '16px',
                    padding: '16px 20px',
                    borderBottom: '1px solid #F1F5F9',
                    background: isUnread ? 'rgba(27, 67, 50, 0.02)' : '#fff',
                    transition: 'all 0.15s',
                    position: 'relative',
                  }}
                  className="notification-row"
                >
                  {/* Checkbox de sélection */}
                  <button
                    onClick={() => handleToggleSelect(n.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                      marginTop: '2px',
                      color: isSelected ? 'var(--primary)' : '#CBD5E1',
                    }}
                  >
                    {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                  </button>

                  {/* Indicateur Non Lu */}
                  {isUnread && (
                    <span style={{
                      width: '8px',
                      height: '8px',
                      background: 'var(--primary)',
                      borderRadius: '50%',
                      marginTop: '7px',
                      flexShrink: 0,
                    }} />
                  )}

                  {/* Contenu principal (cliquable pour redirection) */}
                  <div
                    style={{ flex: 1, minWidth: 0, cursor: n.lien ? 'pointer' : 'default' }}
                    onClick={() => handleItemClick(n)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h4 style={{
                        fontSize: '14px',
                        fontWeight: isUnread ? 800 : 600,
                        color: isUnread ? 'var(--text)' : '#475569',
                        margin: 0,
                      }}>
                        {translated.titre}
                      </h4>
                      {n.lien && <ExternalLink size={12} style={{ color: '#94A3B8', flexShrink: 0 }} />}
                    </div>
                    <p style={{
                      fontSize: '13px',
                      color: isUnread ? 'var(--text-muted)' : '#64748B',
                      margin: '4px 0 0 0',
                      lineHeight: 1.5,
                    }}>
                      {translated.message}
                    </p>
                    <span style={{ fontSize: '11px', color: 'var(--text-light)', display: 'block', marginTop: '6px' }}>
                      {n.created_at || n.envoyee_le}
                    </span>
                  </div>

                  {/* Actions unitaires */}
                  <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                    {isUnread && (
                      <button
                        title="Marquer comme lu"
                        onClick={() => readMutation.mutate(n.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'var(--text-light)',
                          padding: '6px',
                          borderRadius: '6px',
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#F1F5F9')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                      >
                        <Check size={16} />
                      </button>
                    )}
                    <button
                      title="Supprimer"
                      onClick={() => deleteMutation.mutate(n.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-light)',
                        padding: '6px',
                        borderRadius: '6px',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#FEF2F2', e.currentTarget.style.color = '#EF4444')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'none', e.currentTarget.style.color = 'var(--text-light)')}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
