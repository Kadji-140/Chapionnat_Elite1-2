// src/api/classement.api.ts
import api from './axios';

export interface ClubClassementInfo {
  id: number;
  nom: string;
  logo_url: string | null;
  ville?: string;
}

export interface PouleClassementInfo {
  id: number;
  nom: string;
}

export interface ClassementEntry {
  id: number;
  club_id: number;
  poule_id: number;
  saison_id: number;
  club: ClubClassementInfo;
  poule?: PouleClassementInfo;
  nb_matchs: number;
  victoires: number;
  nuls: number;
  defaites: number;
  buts_pour: number;
  buts_contre: number;
  diff_buts: number;
  points: number;
  position: number;
  cartons_jaunes: number;
  cartons_rouges: number;
  points_penalite: number;
  points_nets: number; // calculated as points - points_penalite
}

export interface HistoriqueClubEntry {
  journee: number;
  position: number;
}

export interface HistoriqueClubResponse {
  club_id: number;
  club_nom: string;
  historique: HistoriqueClubEntry[];
  meilleur: number | null;
  pire: number | null;
  en_tete: number;
}

export const getClassementPoule = async (pouleId: number): Promise<{ success: boolean; data: ClassementEntry[] }> => {
  const res = await api.get(`/poules/${pouleId}/classement`);
  return res.data;
};

export const getClassementCompetition = async (competitionId: number): Promise<{ success: boolean; data: ClassementEntry[] }> => {
  const res = await api.get(`/competitions/${competitionId}/classement`);
  return res.data;
};

export const getClassementSaison = async (saisonId: number): Promise<{ success: boolean; data: ClassementEntry[] }> => {
  const res = await api.get(`/saisons/${saisonId}/classement`);
  return res.data;
};

export const getHistoriqueClub = async (clubId: number): Promise<{ success: boolean; data: HistoriqueClubResponse }> => {
  const res = await api.get(`/classements/historique/${clubId}`);
  return res.data;
};

// Admin actions
export const recalculerPoule = async (pouleId: number): Promise<{ success: boolean; message: string }> => {
  const res = await api.post(`/admin/classements/${pouleId}/recalculer`);
  return res.data;
};

export const toggleGelPoule = async (pouleId: number): Promise<{ success: boolean; message: string; gele: boolean }> => {
  const res = await api.post(`/admin/poules/${pouleId}/gel`);
  return res.data;
};

// ── Playoff APIs ─────────────────────────────────────────────────

export interface PlayoffStatus {
  competition_id: number;
  competition_nom: string;
  a_playoffs_configure: boolean;
  nb_clubs_playoffs_up: number;
  nb_clubs_playoffs_down: number;
  points_reportes_playoffs: boolean;
  playoffs_up_generes: boolean;
  playoffs_down_generes: boolean;
}

export interface ClubQualifiePlayoff {
  club_id: number;
  club_nom: string;
  club_logo: string | null;
  poule: string;
  position: number;
}

export interface PlayoffQualifiesResponse {
  success: boolean;
  qualifies_up: ClubQualifiePlayoff[];
  qualifies_down: ClubQualifiePlayoff[];
}

export interface PromotionsRelegationsResponse {
  success: boolean;
  saison: string;
  promus: { club_id: number; club_nom: string; club_logo: string | null; motif: string }[];
  relegues: { club_id: number; club_nom: string; club_logo: string | null; motif: string }[];
  barrages: any[];
}

export const getStatutPlayoffs = async (competitionId: number): Promise<{ success: boolean; data: PlayoffStatus }> => {
  const res = await api.get(`/admin/competitions/${competitionId}/playoffs`);
  return res.data;
};

export const getClubsQualifiesPlayoffs = async (competitionId: number): Promise<PlayoffQualifiesResponse> => {
  const res = await api.get(`/admin/competitions/${competitionId}/playoffs/qualifies`);
  return res.data;
};

export const genererPlayoffs = async (competitionId: number): Promise<{ success: boolean; message: string }> => {
  const res = await api.post(`/admin/competitions/${competitionId}/playoffs/generer`);
  return res.data;
};

export const getPromotionsRelegations = async (saisonId: number): Promise<PromotionsRelegationsResponse> => {
  const res = await api.get(`/admin/saisons/${saisonId}/promotions-relegations`);
  return res.data;
};
