// src/api/saisons.api.ts
import api from './axios';

export interface Saison {
  id: number;
  intitule: string;
  date_debut: string;
  date_fin: string;
  statut: 'planifiee' | 'en_cours' | 'terminee';
  statut_label: string;
  clonee_depuis_id: number | null;
  nb_competitions: number;
  competitions?: Competition[];
  created_at: string;
}

export interface Competition {
  id: number;
  saison_id: number;
  niveau: 'elite_one' | 'elite_two';
  niveau_label: string;
  nom: string;
  statut: string;
  statut_label: string;
  regles?: ReglesCompetition;
  phases?: Phase[];
  nb_phases: number;
}

export interface ReglesCompetition {
  id: number;
  competition_id: number;
  nb_clubs: number;
  format: 'poule_unique' | 'poules_multiples';
  nb_poules: number;
  nb_matchs_par_club: number;
  a_playoffs: boolean;
  nb_clubs_playoffs_up: number | null;
  nb_clubs_playoffs_down: number | null;
  points_reportes_playoffs: boolean;
  a_barrage: boolean;
  nb_clubs_barrage: number | null;
  nb_promus_directs: number;
  nb_relegues_directs: number;
  criteres_egalite: string[];
  points_victoire: number;
  points_nul: number;
  points_defaite: number;
  score_forfait_vainqueur: number;
  score_forfait_perdant: number;
  points_penalite_forfait: number;
}

export interface Phase {
  id: number;
  competition_id: number;
  nom: string;
  type: 'reguliere' | 'playoff_up' | 'playoff_down' | 'barrage';
  type_label: string;
  ordre: number;
  date_debut: string | null;
  date_fin: string | null;
  statut: string;
  est_terminee: boolean;
  poules?: Poule[];
  nb_poules: number;
}

export interface Poule {
  id: number;
  phase_id: number;
  nom: string;
  nb_equipes: number;
  clubs?: PouleClub[];
  nb_clubs_affectes: number;
}

export interface PouleClub {
  id: number;
  nom: string;
  ville: string;
  logo_url: string | null;
  division: string;
  ordre_tirage: number | null;
}

export interface SaisonsFilters {
  page?: number;
  per_page?: number;
}

// ── Saisons ──────────────────────────────────────────────────────

export const getSaisons = async (filters: SaisonsFilters = {}) => {
  const res = await api.get('/admin/saisons', { params: filters });
  return res.data;
};

export const getSaison = async (id: number) => {
  const res = await api.get(`/admin/saisons/${id}`);
  return res.data;
};

export const createSaison = async (data: {
  intitule: string;
  date_debut: string;
  date_fin: string;
  cloner_depuis_id?: number | null;
}) => {
  const res = await api.post('/admin/saisons', data);
  return res.data;
};

export const updateSaison = async (id: number, data: Partial<{
  intitule: string;
  date_debut: string;
  date_fin: string;
}>) => {
  const res = await api.put(`/admin/saisons/${id}`, data);
  return res.data;
};

export const deleteSaison = async (id: number) => {
  const res = await api.delete(`/admin/saisons/${id}`);
  return res.data;
};

export const activerSaison = async (id: number) => {
  const res = await api.patch(`/admin/saisons/${id}/activer`);
  return res.data;
};

export const cloturerSaison = async (id: number) => {
  const res = await api.patch(`/admin/saisons/${id}/cloturer`);
  return res.data;
};

export const clonerSaison = async (id: number, data: {
  intitule: string;
  date_debut: string;
  date_fin: string;
}) => {
  const res = await api.post(`/admin/saisons/${id}/cloner`, data);
  return res.data;
};

// ── Compétitions ─────────────────────────────────────────────────

export const getCompetitions = async (saisonId: number) => {
  const res = await api.get(`/admin/saisons/${saisonId}/competitions`);
  return res.data;
};

export const initialiserCompetitions = async (saisonId: number) => {
  const res = await api.post(`/admin/saisons/${saisonId}/competitions/initialiser`);
  return res.data;
};

export const createCompetition = async (saisonId: number, data: {
  niveau: 'elite_one' | 'elite_two';
  nom: string;
}) => {
  const res = await api.post(`/admin/saisons/${saisonId}/competitions`, data);
  return res.data;
};

export const getCompetition = async (id: number) => {
  const res = await api.get(`/admin/competitions/${id}`);
  return res.data;
};

export const getRegles = async (competitionId: number) => {
  const res = await api.get(`/admin/competitions/${competitionId}/regles`);
  return res.data;
};

export const updateRegles = async (competitionId: number, data: Partial<ReglesCompetition>) => {
  const res = await api.put(`/admin/competitions/${competitionId}/regles`, data);
  return res.data;
};

// ── Phases ───────────────────────────────────────────────────────

export const getPhases = async (competitionId: number) => {
  const res = await api.get(`/admin/competitions/${competitionId}/phases`);
  return res.data;
};

export const genererPhases = async (competitionId: number) => {
  const res = await api.post(`/admin/competitions/${competitionId}/phases/generer`);
  return res.data;
};

export const basculerPhase = async (phaseId: number) => {
  const res = await api.patch(`/admin/phases/${phaseId}/basculer`);
  return res.data;
};

// ── Poules ───────────────────────────────────────────────────────

export const getPoules = async (phaseId: number) => {
  const res = await api.get(`/admin/phases/${phaseId}/poules`);
  return res.data;
};

export const affecterClubs = async (pouleId: number, clubIds: number[]) => {
  const res = await api.post(`/admin/poules/${pouleId}/affecter-clubs`, { club_ids: clubIds });
  return res.data;
};

export const tirageAleatoire = async (pouleId: number, division: string) => {
  const res = await api.post(`/admin/poules/${pouleId}/tirage-aleatoire`, { division });
  return res.data;
};

// ── Shared Read-Only Connectors ──────────────────────────────────

export const getSharedSaisons = async () => {
  const res = await api.get('/shared/saisons');
  return res.data;
};

export const getSharedSaison = async (id: number) => {
  const res = await api.get(`/shared/saisons/${id}`);
  return res.data;
};

export const getSharedCompetitions = async (saisonId: number) => {
  const res = await api.get(`/shared/saisons/${saisonId}/competitions`);
  return res.data;
};

export const getSharedCompetition = async (id: number) => {
  const res = await api.get(`/shared/competitions/${id}`);
  return res.data;
};

export const getSharedPhases = async (competitionId: number) => {
  const res = await api.get(`/shared/competitions/${competitionId}/phases`);
  return res.data;
};

export const getSharedPoules = async (phaseId: number) => {
  const res = await api.get(`/shared/phases/${phaseId}/poules`);
  return res.data;
};
