// src/api/matchEvents.api.ts
import api from './axios';
import type { Match } from './matchs.api';

export interface MatchEvent {
  id: number;
  match_id: number;
  type: 'but' | 'but_csc' | 'penalty_marque' | 'penalty_rate' | 'carton_jaune' | 'carton_rouge' | 'carton_jaune_rouge' | 'remplacement' | 'incident' | 'temps_additionnel' | 'tir_cadre' | 'tir_non_cadre' | 'arret' | 'faute' | 'hors_jeu' | 'corner';

  minute: number;
  minute_additionnelle?: number | null;
  timestamp_event: string;
  description: string | null;
  statut: 'valide' | 'invalide' | 'annule';
  club_id?: number | null;
  club?: { id: number; nom: string } | null;
  joueur_id?: number | null;
  joueur?: {
    id: number;
    nom: string;
    prenom: string;
    nom_complet: string;
    num_maillot?: number;
  } | null;
  joueur_remplacant_id?: number | null;
  joueur_remplacant?: {
    id: number;
    nom: string;
    prenom: string;
    nom_complet: string;
    num_maillot?: number;
  } | null;
  contestation?: {
    id: number;
    motif: string;
    statut?: 'en_attente' | 'soumise' | 'acceptee' | 'rejete' | 'rejetee';
    decision?: string | null;
  } | null;
}

export interface StoreEventParams {
  type: string;
  minute: number;
  minute_additionnelle?: number | null;
  joueur_id?: number | null;
  joueur_remplacant_id?: number | null;
  club_id?: number | null;
  description?: string | null;
}

// ── Commisssaire Actions ──────────────────────────────────────

export const getCommissaireMatchs = (): Promise<{ success: boolean; data: Match[] }> =>
  api.get('/commissaire/matchs').then(r => r.data);

export const getCommissaireMatch = (matchId: number): Promise<{ success: boolean; data: Match }> =>
  api.get(`/commissaire/matchs/${matchId}`).then(r => r.data);

export const demarrerMatch = (matchId: number): Promise<{ success: boolean; data: Match }> =>
  api.patch(`/commissaire/matchs/${matchId}/demarrer`).then(r => r.data);

export const miTempsMatch = (matchId: number): Promise<{ success: boolean; data: Match }> =>
  api.patch(`/commissaire/matchs/${matchId}/mi-temps`).then(r => r.data);

export const repriseMatch = (matchId: number): Promise<{ success: boolean; data: Match }> =>
  api.patch(`/commissaire/matchs/${matchId}/reprise`).then(r => r.data);

export const storeMatchEvent = (matchId: number, params: StoreEventParams): Promise<{ success: boolean; data: MatchEvent }> =>
  api.post(`/commissaire/matchs/${matchId}/events`, params).then(r => r.data);

export const updateMatchEvent = (eventId: number, params: StoreEventParams): Promise<{ success: boolean; data: MatchEvent }> =>
  api.put(`/commissaire/events/${eventId}`, params).then(r => r.data);

export const deleteMatchEvent = (eventId: number): Promise<{ success: boolean }> =>
  api.delete(`/commissaire/events/${eventId}`).then(r => r.data);

export const cloturerMatch = (matchId: number, incidents?: string): Promise<{ success: boolean; data: Match }> =>
  api.patch(`/commissaire/matchs/${matchId}/cloturer`, { incidents }).then(r => r.data);

export const soumettreRapport = (matchId: number, incidents?: string): Promise<{ success: boolean; chemin_pdf: string }> =>
  api.post(`/commissaire/matchs/${matchId}/rapport`, { incidents }).then(r => r.data);

export const traiterContestation = (matchId: number, contestationId: number, action: 'accepter' | 'rejeter', decision?: string): Promise<{ success: boolean; data: any }> =>
  api.patch(`/commissaire/matchs/${matchId}/contestations/${contestationId}/traiter`, { action, decision }).then(r => r.data);

export const ajouterTempsAdditionnel = (matchId: number, minutes: number): Promise<{ success: boolean; data: Match }> =>
  api.post(`/commissaire/matchs/${matchId}/temps-additionnel`, { minutes }).then(r => r.data);

export const activerProlongation = (matchId: number, dureeProlongation?: number): Promise<{ success: boolean; data: Match }> =>
  api.post(`/commissaire/matchs/${matchId}/prolongations`, { duree_prolongation: dureeProlongation }).then(r => r.data);

export const prolongationMiTemps = (matchId: number): Promise<{ success: boolean; data: Match }> =>
  api.post(`/commissaire/matchs/${matchId}/prolongations/mi-temps`).then(r => r.data);

export const prolongationReprise = (matchId: number): Promise<{ success: boolean; data: Match }> =>
  api.post(`/commissaire/matchs/${matchId}/prolongations/reprise`).then(r => r.data);

export const activerTirsAuBut = (matchId: number): Promise<{ success: boolean; data: Match }> =>
  api.post(`/commissaire/matchs/${matchId}/tirs-au-but`).then(r => r.data);
