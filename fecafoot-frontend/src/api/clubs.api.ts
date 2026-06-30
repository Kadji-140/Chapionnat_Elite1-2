// src/api/clubs.api.ts
// Fonctions API pour la gestion des clubs

import api from './axios';

export interface Club {
  id: number;
  nom: string;
  ville: string;
  division: 'elite_one' | 'elite_two';
  division_label: string;
  logo_url: string | null;
  est_actif: boolean;
  profile_completed: boolean;
  stade: string | null;
  president: string | null;
  couleurs: string | null;
  annee_creation: number | null;
  site_web: string | null;
  telephone: string | null;
  presentation: string | null;
  created_at: string;
  responsable?: {
    id: number;
    nom: string;
    prenom: string;
    email: string;
  } | null;
  nb_joueurs?: number;
  nb_joueurs_valides?: number;
  nb_coachs?: number;
  is_deleted?: boolean;
}

export interface ClubsListResponse {
  success: boolean;
  data: Club[];
  meta: {
    total: number;
    current_page: number;
    last_page: number;
    per_page: number;
  };
}

export interface ClubFilters {
  division?: string;
  actif?: boolean;
  search?: string;
  include_deleted?: boolean;
  page?: number;
  per_page?: number;
}

/** GET /api/admin/clubs — Liste paginée */
export const getAdminClubs = async (filters: ClubFilters = {}): Promise<ClubsListResponse> => {
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== undefined && v !== '')
  );
  const res = await api.get('/admin/clubs', { params });
  return res.data;
};

/** GET /api/shared/clubs — Liste partagée de tous les clubs */
export const getSharedClubs = async (filters: ClubFilters = {}): Promise<ClubsListResponse> => {
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== undefined && v !== '')
  );
  const res = await api.get('/shared/clubs', { params });
  return res.data;
};

/** GET /api/admin/clubs/{id} — Détail complet */
export const getAdminClub = async (id: number) => {
  const res = await api.get(`/admin/clubs/${id}`);
  return res.data;
};

/** POST /api/admin/clubs — Créer un club */
export const createClub = async (data: FormData) => {
  const res = await api.post('/admin/clubs', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

/** POST /api/admin/clubs/{id} — Modifier un club (multipart pour logo) */
export const updateClub = async (id: number, data: FormData) => {

  const res = await api.post(`/admin/clubs/${id}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

/** POST /api/responsable/mon-club/signaler-erreur - Signaler une erreur à l'admin */
export const signalerErreurAdmin = async (data: { message: string; club_id?: number }) => {
  const res = await api.post('/responsable/mon-club/signaler-erreur', data);
  return res.data;
};

/** DELETE /api/admin/clubs/{id} — Soft delete */
export const deleteClub = async (id: number) => {
  const res = await api.delete(`/admin/clubs/${id}`);
  return res.data;
};

/** PATCH /api/admin/clubs/{id}/toggle — Activer/désactiver */
export const toggleClub = async (id: number) => {
  const res = await api.patch(`/admin/clubs/${id}/toggle`);
  return res.data;
};

/** POST /api/admin/clubs/{id}/reset-password-responsable */
export const resetPasswordResponsable = async (id: number) => {
  const res = await api.post(`/admin/clubs/${id}/reset-password-responsable`);
  return res.data;
};

// ── Routes Responsable ─────────────────────────────────────────

/** GET /api/responsable/mon-club */
export const getMonClub = async () => {
  const res = await api.get('/responsable/mon-club');
  return res.data;
};

/** POST /api/responsable/mon-club */
export const updateMonClub = async (data: FormData) => {
  const res = await api.post('/responsable/mon-club', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

/** POST /api/responsable/mon-club/completer-profil */
export const completerProfil = async (data: FormData) => {
  const res = await api.post('/responsable/mon-club/completer-profil', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

/** Alias de getMonClub pour compatibilité */
export const getClubResponsable = getMonClub;

// Alias pour compatibilité avec useClubs
export const getClubs = getAdminClubs;
export const getClub = getAdminClub;


