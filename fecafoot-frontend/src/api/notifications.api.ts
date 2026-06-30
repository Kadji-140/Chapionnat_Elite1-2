// src/api/notifications.api.ts
// Service API pour les notifications in-app

import api from './axios';

export interface AppNotification {
  id: number;
  type: string;
  titre: string;
  message: string;
  lu: boolean;
  lien?: string | null;
  metadata?: Record<string, any> | null;
  created_at: string;
  created_at_iso?: string;
}

export interface NotificationsResponse {
  success: boolean;
  data: AppNotification[];
  nb_non_lues: number;
}

/** Récupérer toutes les notifications */
export const getNotifications = async (): Promise<NotificationsResponse> => {
  const res = await api.get('/notifications');
  return res.data;
};

/** Marquer une notification comme lue */
export const markNotificationAsRead = async (id: number): Promise<void> => {
  await api.patch(`/notifications/${id}/lire`);
};

/** Marquer toutes les notifications comme lues */
export const markAllNotificationsAsRead = async (): Promise<void> => {
  await api.patch('/notifications/lire-tout');
};

/** Supprimer une notification */
export const deleteNotification = async (id: number): Promise<void> => {
  await api.delete(`/notifications/${id}`);
};
