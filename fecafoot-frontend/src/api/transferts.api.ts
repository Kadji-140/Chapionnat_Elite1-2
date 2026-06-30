// src/api/transferts.api.ts
import api from './axios';
import type { Joueur } from './joueurs.api';

export interface ClubTransfertInfo {
  id: number;
  nom: string;
  ville: string | null;
  logo_url: string | null;
}

export interface SaisonTransfertInfo {
  id: number;
  intitule: string;
  statut: string;
}

export interface Transfert {
  id: number;
  joueur_id: number;
  club_cedant_id: number;
  club_acquereur_id: number;
  saison_id: number;
  montant: string | null;
  statut: 'en_attente' | 'valide' | 'rejete';
  motif_rejet: string | null;
  valide_par_id: number | null;
  date_demande: string;
  date_validation: string | null;
  created_at: string;
  updated_at: string;
  
  // Relations loaded via with
  joueur?: Joueur;
  club_cedant?: ClubTransfertInfo;
  club_acquereur?: ClubTransfertInfo;
  saison?: SaisonTransfertInfo;
  valide_par?: { id: number; nom: string; prenom: string } | null;
}

// ── Responsable Club ───────────────────────────────────────────
export const getTransfertsResponsable = async () => {
  const res = await api.get('/responsable/transferts');
  return res.data;
};

export const createTransfertResponsable = async (data: {
  joueur_id: number;
  club_acquereur_id: number;
  montant?: number;
}) => {
  const res = await api.post('/responsable/transferts', data);
  return res.data;
};

// ── Admin ──────────────────────────────────────────────────────
export const getTransfertsAdmin = async () => {
  const res = await api.get('/admin/transferts');
  return res.data;
};

export const validerTransfertAdmin = async (id: number) => {
  const res = await api.patch(`/admin/transferts/${id}/valider`);
  return res.data;
};

export const rejeterTransfertAdmin = async (id: number, motifRejet: string) => {
  const res = await api.patch(`/admin/transferts/${id}/rejeter`, { motif_rejet: motifRejet });
  return res.data;
};
