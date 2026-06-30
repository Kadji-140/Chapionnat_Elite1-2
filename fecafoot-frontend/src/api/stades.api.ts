// src/api/stades.api.ts
import api from './axios';

export interface Stade {
  id: number;
  nom: string;
  ville: string;
  capacite: number | null;
  est_actif: boolean;
  created_at?: string;
}

export interface StadeFilters {
  search?: string;
  ville?: string;
  est_actif?: boolean;
  page?: number;
  per_page?: number;
  all?: boolean;
}

export const getStades = async (filters: StadeFilters = {}) => {
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== undefined && v !== '')
  );
  const res = await api.get('/admin/stades', { params });
  return res.data;
};

export const createStade = async (data: {
  nom: string;
  ville: string;
  capacite?: number;
  est_actif?: boolean;
}) => {
  const res = await api.post('/admin/stades', data);
  return res.data;
};

export const updateStade = async (id: number, data: Partial<Stade>) => {
  const res = await api.put(`/admin/stades/${id}`, data);
  return res.data;
};

export const toggleStade = async (id: number) => {
  const res = await api.patch(`/admin/stades/${id}/toggle`);
  return res.data;
};

export const deleteStade = async (id: number) => {
  const res = await api.delete(`/admin/stades/${id}`);
  return res.data;
};
