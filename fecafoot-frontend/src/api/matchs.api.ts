// src/api/matchs.api.ts
// Couche API pour les matchs, le calendrier et les officiels

import api from './axios';

// ── Types ─────────────────────────────────────────────────────

export interface ClubMini {
  id: number;
  nom: string;
  ville: string;
  logo_url: string | null;
  stade?: string;
}

export interface OfficielMini {
  id: number;
  nom: string;
  email?: string;
  num_licence?: string;
  specification?: string;
  region?: string;
  ville?: string;
}

export interface Match {
  id: number;
  competition_id: number;
  phase_id: number | null;
  poule_id: number | null;
  journee: number;
  type: 'regulier' | 'playoff_up' | 'playoff_down' | 'barrage';
  club_domicile: ClubMini;
  club_exterieur: ClubMini;
  commissaire: OfficielMini | null;
  arbitre_principal: OfficielMini | null;
  arbitre_assistant_1: OfficielMini | null;
  arbitre_assistant_2: OfficielMini | null;
  quatrieme_arbitre: OfficielMini | null;
  date_heure: string | null;
  date_heure_fr: string | null;
  stade: string | null;
  terrain_neutre: boolean;
  score_domicile: number;
  score_exterieur: number;
  statut: 'programme' | 'en_cours' | 'mi_temps' | 'termine' | 'homologue' | 'reporte' | 'annule' | 'litige';
  statut_label: string;
  est_homologue: boolean;
  motif_report: string | null;
  date_heure_report: string | null;
  a_commissaire: boolean;
  a_arbitre: boolean;
  a_arbitre_assistant_1: boolean;
  a_arbitre_assistant_2: boolean;
  a_quatrieme_arbitre: boolean;
  // Enrichi côté frontend pour coach
  composition_statut?: 'non_saisie' | 'brouillon' | 'confirmee';
  composition_confirmee?: boolean;
  est_domicile?: boolean;
  compositions?: any[];
  score_officiel_dom?: number | null;
  score_officiel_ext?: number | null;
  est_forfait?: boolean;
  rapport_soumis?: boolean;
  chemin_pdf?: string | null;
  incidents_rapport?: string | null;
  periode?: string;
  temps_additionnel_1er?: number;
  temps_additionnel_2e?: number;
  temps_additionnel_prolongation_1?: number;
  temps_additionnel_prolongation_2?: number;
  duree_prolongation?: number;
  score_domicile_prolongation?: number | null;
  score_exterieur_prolongation?: number | null;
  score_domicile_tab?: number | null;
  score_exterieur_tab?: number | null;
}

export interface Journee {
  journee: number;
  matchs: Match[];
  nb_matchs: number;
  nb_sans_officiel: number;
  date_premiere: string | null;
  statuts: string[];
}

export interface CalendrierMeta {
  total_matchs: number;
  total_journees: number;
  total_sans_officiel: number;
}

export interface GenererCalendrierParams {
  date_debut?: string;
  heure_defaut?: string;
  jour_semaine?: number;
}

export interface UpdateMatchParams {
  date_heure?: string;
  stade?: string;
  terrain_neutre?: boolean;
}

export interface ReporterMatchParams {
  motif: string;
  date_heure_report: string;
}

// ── Calendrier (Admin) ────────────────────────────────────────

export const genererCalendrier = (pouleId: number, params: GenererCalendrierParams) =>
  api.post(`/admin/poules/${pouleId}/generer-calendrier`, params)
    .then(r => r.data);

export const getCalendrier = (competitionId: number): Promise<{
  success: boolean;
  data: Journee[];
  meta: CalendrierMeta;
}> =>
  api.get(`/admin/competitions/${competitionId}/calendrier`).then(r => r.data);

export const getJournee = (competitionId: number, numJournee: number): Promise<{
  success: boolean;
  data: Match[];
  journee: number;
}> =>
  api.get(`/admin/competitions/${competitionId}/calendrier/journee/${numJournee}`).then(r => r.data);

// ── Modification de match ─────────────────────────────────────

export const getMatch = (matchId: number): Promise<{ success: boolean; data: Match }> =>
  api.get(`/matchs/${matchId}`).then(r => r.data);

export const updateMatch = (matchId: number, params: UpdateMatchParams) =>
  api.put(`/admin/matchs/${matchId}`, params).then(r => r.data);

export const reporterMatch = (matchId: number, params: ReporterMatchParams) =>
  api.patch(`/admin/matchs/${matchId}/reporter`, params).then(r => r.data);

export const annulerMatch = (matchId: number, motif?: string) =>
  api.patch(`/admin/matchs/${matchId}/annuler`, { motif }).then(r => r.data);

// ── Officiels ─────────────────────────────────────────────────

export const affecterCommissaire = (matchId: number, commissaireId: number | null) =>
  api.patch(`/admin/matchs/${matchId}/affecter-commissaire`, { commissaire_id: commissaireId }).then(r => r.data);

export const affecterArbitre = (
  matchId: number,
  arbitreId: number | null,
  role: 'principal' | 'assistant_1' | 'assistant_2' | 'quatrieme' = 'principal'
) =>
  api.patch(`/admin/matchs/${matchId}/affecter-arbitre`, { arbitre_id: arbitreId, role }).then(r => r.data);

export const getMatchsSansOfficiel = (params?: { competition_id?: number; date?: string }) =>
  api.get('/admin/matchs/sans-officiel', { params }).then(r => r.data);

export const getCommissairesDisponibles = (params?: { date_heure?: string }) =>
  api.get('/admin/commissaires/disponibles', { params }).then(r => r.data);

export const getArbitresDisponibles = (params?: { date_heure?: string }) =>
  api.get('/admin/arbitres/disponibles', { params }).then(r => r.data);
// ── Coach ─────────────────────────────────────────────────────

export const getMatchsAVenir = () =>
  api.get('/coach/matchs-a-venir').then(r => r.data);
