// src/api/arbitres.api.ts
import api from './axios';

export interface Arbitre {
  id: number;
  nom: string;
  prenom: string;
  nom_complet: string;
  num_licence: string;
  specification: 'central' | 'assistant' | 'quatrieme';
  specification_label: string;
  region: string | null;
  villes: string | null;
  disponible: boolean;
  actif: boolean;
  nb_matchs?: number;
  created_at: string;
}

export interface ArbitreFilters {
  specification?: string;
  region?: string;
  actif?: boolean;
  search?: string;
  page?: number;
  per_page?: number;
}

export const getArbitres = async (filters: ArbitreFilters = {}) => {
  const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== undefined && v !== ''));
  const res = await api.get('/admin/arbitres', { params });
  return res.data;
};

export const createArbitre = async (data: {
  nom: string; prenom: string; num_licence: string;
  specification: string; region?: string; villes?: string;
}) => {
  const res = await api.post('/admin/arbitres', data);
  return res.data;
};

export const updateArbitre = async (id: number, data: Partial<Arbitre>) => {
  const res = await api.put(`/admin/arbitres/${id}`, data);
  return res.data;
};

export const toggleArbitre = async (id: number) => {
  const res = await api.patch(`/admin/arbitres/${id}/toggle`);
  return res.data;
};

export const deleteArbitre = async (id: number) => {
  const res = await api.delete(`/admin/arbitres/${id}`);
  return res.data;
};
