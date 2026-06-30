// src/api/joueurs.api.ts
import api from './axios';

export interface Joueur {
  id: number;
  nom: string;
  prenom: string;
  nom_complet: string;
  date_naissance: string;
  age: number | null;
  nationalite: string | null;
  num_licence: string;
  poste: string;
  poste_label: string;
  num_maillot: number;
  photo_url: string | null;
  taille_cm: number | null;
  poids_kg: number | null;
  statut: string;
  statut_validation: 'en_attente' | 'valide' | 'rejete';
  est_soumis: boolean;
  motif_rejet: string | null;
  club?: { id: number; nom: string } | null;
}

// ── Admin ──────────────────────────────────────────────────────
export const getAdminJoueurs = async (filters: Record<string, unknown> = {}) => {
  const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== undefined && v !== ''));
  const res = await api.get('/admin/joueurs', { params });
  return res.data;
};

export const getJoueursEnAttente = async () => {
  const res = await api.get('/admin/joueurs/en-attente');
  return res.data;
};

export const validerJoueur = async (id: number) => {
  const res = await api.patch(`/admin/joueurs/${id}/valider`);
  return res.data;
};

export const rejeterJoueur = async (id: number, motif: string) => {
  const res = await api.patch(`/admin/joueurs/${id}/rejeter`, { motif });
  return res.data;
};

// ── Responsable ────────────────────────────────────────────────
export const getJoueursClub = async (filters: Record<string, unknown> = {}) => {
  const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== undefined && v !== ''));
  const res = await api.get('/responsable/joueurs', { params });
  return res.data;
};

export const createJoueur = async (data: FormData) => {
  const res = await api.post('/responsable/joueurs', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

export const updateJoueur = async (id: number, data: FormData) => {
  const res = await api.post(`/responsable/joueurs/${id}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

export const deleteJoueur = async (id: number) => {
  const res = await api.delete(`/responsable/joueurs/${id}`);
  return res.data;
};

export const soumettreEffectif = async () => {
  const res = await api.post('/responsable/joueurs/soumettre');
  return res.data;
};

// Postes disponibles (pour les selects)
export const POSTES = [
  { value: 'gardien',           label: 'Gardien de but' },
  { value: 'defenseur_central', label: 'Défenseur central' },
  { value: 'lateral_droit',     label: 'Latéral droit' },
  { value: 'lateral_gauche',    label: 'Latéral gauche' },
  { value: 'milieu_defensif',   label: 'Milieu défensif' },
  { value: 'milieu_central',    label: 'Milieu central' },
  { value: 'milieu_offensif',   label: 'Milieu offensif' },
  { value: 'ailier_droit',      label: 'Ailier droit' },
  { value: 'ailier_gauche',     label: 'Ailier gauche' },
  { value: 'attaquant_centre',  label: 'Attaquant de pointe' },
  { value: 'avant_centre',      label: 'Avant-centre' },
];
