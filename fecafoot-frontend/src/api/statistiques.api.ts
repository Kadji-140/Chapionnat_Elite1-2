// src/api/statistiques.api.ts
import api from './axios';

export interface ClubStatInfo {
  id: number;
  nom: string;
  logo_url: string | null;
}

export interface JoueurStatInfo {
  id: number;
  nom: string;
  prenom: string;
  poste: string;
  numero_maillot: number | null;
  photo_url: string | null;
  club: ClubStatInfo | null;
}

export interface CompetitionStatInfo {
  id: number;
  nom: string;
}

export interface StatJoueur {
  id: number;
  joueur_id: number;
  competition_id: number;
  buts: number;
  passes_decisives: number;
  cartons_jaunes: number;
  cartons_rouges: number;
  minutes_jouees: number;
  nb_matchs: number;
  joueur: JoueurStatInfo;
  competition?: CompetitionStatInfo;
}

export interface DisciplineClubEntry {
  club_id: number;
  club_nom: string;
  club_logo: string | null;
  cartons_jaunes: number;
  cartons_rouges: number;
  points_fairplay: number;
}

export interface StatsJoueurResponse {
  success: boolean;
  joueur: {
    id: number;
    nom: string;
    prenom: string;
    poste: string;
    numero: number | null;
    photo: string | null;
    club_nom: string;
    club_logo: string | null;
  };
  stats: StatJoueur[];
}

export const getTopButeurs = async (
  competitionId: number,
  filters: { poste?: string; club_id?: number } = {}
): Promise<{ success: boolean; data: StatJoueur[] }> => {
  const params: any = {};
  if (filters.poste) params.poste = filters.poste;
  if (filters.club_id) params.club_id = filters.club_id;
  const res = await api.get(`/competitions/${competitionId}/stats/buteurs`, { params });
  return res.data;
};

export const getTopPasseurs = async (
  competitionId: number,
  filters: { poste?: string; club_id?: number } = {}
): Promise<{ success: boolean; data: StatJoueur[] }> => {
  const params: any = {};
  if (filters.poste) params.poste = filters.poste;
  if (filters.club_id) params.club_id = filters.club_id;
  const res = await api.get(`/competitions/${competitionId}/stats/passeurs`, { params });
  return res.data;
};

export const getDisciplineClubs = async (
  competitionId: number
): Promise<{ success: boolean; data: DisciplineClubEntry[] }> => {
  const res = await api.get(`/competitions/${competitionId}/stats/discipline`);
  return res.data;
};

export const getStatsJoueur = async (joueurId: number): Promise<StatsJoueurResponse> => {
  const res = await api.get(`/joueurs/${joueurId}/stats`);
  return res.data;
};

export const getStatsCoachEffectif = async (): Promise<{ success: boolean; data: StatJoueur[] }> => {
  const res = await api.get('/coach/joueurs/stats');
  return res.data;
};

// Admin actions
export const recalculerStats = async (competitionId: number): Promise<{ success: boolean; message: string }> => {
  const res = await api.post('/admin/stats/recalculer', { competition_id: competitionId });
  return res.data;
};
