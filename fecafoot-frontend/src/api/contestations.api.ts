// src/api/contestations.api.ts
import api from './axios';
import type { MatchEvent } from './matchEvents.api';
import type { Match } from './matchs.api';

export interface Contestation {
  id: number;
  match_event_id: number;
  coach_id: number;
  motif: string;
  statut: 'en_attente' | 'soumise' | 'acceptee' | 'rejete' | 'rejetee';
  decision: string | null;
  date_contestation: string;
  date_decision: string | null;
  created_at: string;
  traitee_par_id?: number | null;
  coach?: {
    id: number;
    nom: string;
    prenom: string;
    club: { id: number; nom: string };
  };
  match_event?: MatchEvent & {
    match: {
      id: number;
      club_domicile: { id: number; nom: string };
      club_exterieur: { id: number; nom: string };
    };
  };
}

export interface Penalite {
  id: number;
  club_id: number;
  saison_id: number;
  match_id: number | null;
  type: string;
  points_retires: number;
  motif: string;
  appliquee_par_id: number;
  date_application: string;
  active: boolean;
  saison?: { id: number; intitule: string };
  match?: Match;
}

// ── Coach Actions ─────────────────────────────────────────────

export const getCoachMatchEvents = (matchId: number): Promise<{ success: boolean; data: MatchEvent[] }> =>
  api.get(`/coach/matchs/${matchId}/events`).then(r => r.data);

export const lodgeContestation = (matchId: number, params: { match_event_id: number; motif: string }): Promise<{ success: boolean; data: Contestation }> =>
  api.post(`/coach/matchs/${matchId}/contestations`, params).then(r => r.data);

export const getCoachContestations = (): Promise<{ success: boolean; data: Contestation[] }> =>
  api.get('/coach/contestations').then(r => r.data);

// ── Admin Actions ─────────────────────────────────────────────

export const getAdminMatchsAHomologuer = (): Promise<{ success: boolean; data: Match[] }> =>
  api.get('/admin/matchs/a-homologuer').then(r => r.data);

export const homologuerMatch = (matchId: number): Promise<{ success: boolean; data: Match }> =>
  api.patch(`/admin/matchs/${matchId}/homologuer`).then(r => r.data);

export const litigeMatch = (matchId: number): Promise<{ success: boolean; data: Match }> =>
  api.patch(`/admin/matchs/${matchId}/litige`).then(r => r.data);

export const leverLitigeMatch = (matchId: number): Promise<{ success: boolean; data: Match }> =>
  api.patch(`/admin/matchs/${matchId}/lever-litige`).then(r => r.data);

export const tapisVertMatch = (matchId: number, params: { club_vainqueur_id: number; motif: string }): Promise<{ success: boolean; data: Match }> =>
  api.post(`/admin/matchs/${matchId}/tapis-vert`, params).then(r => r.data);

export const getAdminContestations = (): Promise<{ success: boolean; data: Contestation[] }> =>
  api.get('/admin/contestations').then(r => r.data);

export const accepterContestation = (id: number, decision: string): Promise<{ success: boolean; data: Contestation }> =>
  api.patch(`/admin/contestations/${id}/accepter`, { decision }).then(r => r.data);

export const rejeterContestation = (id: number, decision: string): Promise<{ success: boolean; data: Contestation }> =>
  api.patch(`/admin/contestations/${id}/rejeter`, { decision }).then(r => r.data);

export const appliquerPenalite = (clubId: number, params: {
  saison_id: number;
  points_retires: number;
  type: string;
  motif: string;
  match_id?: number | null;
}): Promise<{ success: boolean; message: string; penalite: Penalite }> =>
  api.post(`/admin/clubs/${clubId}/penalite`, params).then(r => r.data);

export const getClubPenalites = (clubId: number): Promise<Penalite[]> =>
  api.get(`/admin/clubs/${clubId}/penalites`).then(r => r.data);
