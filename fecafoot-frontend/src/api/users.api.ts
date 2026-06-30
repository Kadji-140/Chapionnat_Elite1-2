// src/api/users.api.ts
import api from './axios';

export interface AppUser {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role: string;
  acces_actif: boolean;
  premiere_connexion: boolean;
  villes?: string | null;
  created_at?: string;
  club?: { id: number; nom: string } | null;
}

export interface UserFilters {
  role?: string;
  actif?: boolean;
  search?: string;
  page?: number;
  per_page?: number;
}

export const getAdminUsers = async (filters: UserFilters = {}) => {
  const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== undefined && v !== ''));
  const res = await api.get('/admin/users', { params });
  return res.data;
};

export const createUser = async (data: { nom: string; prenom: string; email: string; role: string; villes?: string }) => {
  const res = await api.post('/admin/users', data);
  return res.data;
};

export const getUser = async (id: number) => {
  const res = await api.get(`/admin/users/${id}`);
  return res.data;
};

export const updateUser = async (id: number, data: Partial<AppUser>) => {
  const res = await api.put(`/admin/users/${id}`, data);
  return res.data;
};

export const toggleUser = async (id: number) => {
  const res = await api.patch(`/admin/users/${id}/toggle`);
  return res.data;
};

export const resetUserPassword = async (id: number) => {
  const res = await api.post(`/admin/users/${id}/reset-password`);
  return res.data;
};

// ── Coachs (Responsable) ──────────────────────────────────────
export const getCoachsClub = async () => {
  const res = await api.get('/responsable/coachs');
  return res.data;
};

export const createCoach = async (data: { nom: string; prenom: string; email: string }) => {
  const res = await api.post('/responsable/coachs', data);
  return res.data;
};

export const toggleCoach = async (id: number) => {
  const res = await api.patch(`/responsable/coachs/${id}/toggle`);
  return res.data;
};

export const deleteCoach = async (id: number) => {
  const res = await api.delete(`/responsable/coachs/${id}`);
  return res.data;
};
