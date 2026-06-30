// src/api/compositions.api.ts
// Couche API pour les compositions d'équipe

import api from './axios';

// ── Types ─────────────────────────────────────────────────────

export interface JoueurMini {
  id: number;
  nom: string;
  prenom: string;
  numero_maillot: number | null;
  poste: string | null;
  photo_url: string | null;
}

export interface CompositionJoueur {
  id: number;
  joueur_id: number;
  joueur: JoueurMini | null;
  role: 'titulaire' | 'remplacant';
  est_capitaine: boolean;
  minute_entree: number | null;
  minute_sortie: number | null;
}


export interface JoueurCompositionInput {
  joueur_id: number;
  role: 'titulaire' | 'remplacant';
  est_capitaine?: boolean;
  poste_index?: number;
}

export interface Composition {
  id: number;
  match_id: number;
  club_id: number;
  formation: Formation;
  statut: 'brouillon' | 'confirmee';
  est_confirmee: boolean;
  date_confirmation: string | null;
  titulaires: CompositionJoueur[];
  remplacants: CompositionJoueur[];
  nb_titulaires: number;
  nb_remplacants: number;
}

export type Formation = '4-3-3' | '4-4-2' | '3-5-2' | '4-2-3-1' | '5-3-2' | '4-1-4-1' | '3-4-3';

export interface JoueurCompositionInput {
  joueur_id: number;
  role: 'titulaire' | 'remplacant';
  est_capitaine?: boolean;
  poste_index?: number; // Index du poste sur le terrain
}

export interface SauvegarderCompositionParams {
  formation: Formation;
  joueurs: JoueurCompositionInput[];
  confirmer?: boolean;
}

// ── Endpoints ─────────────────────────────────────────────────

export const getComposition = (matchId: number): Promise<{
  success: boolean;
  data: Composition | null;
}> =>
  api.get(`/coach/matchs/${matchId}/composition`).then(r => r.data);

export const getClubComposition = (matchId: number, clubId: number): Promise<{
  success: boolean;
  data: Composition | null;
}> =>
  api.get(`/matchs/${matchId}/compositions/${clubId}`).then(r => r.data);

export const sauvegarderComposition = (matchId: number, params: SauvegarderCompositionParams) =>
  api.post(`/coach/matchs/${matchId}/composition`, params).then(r => r.data);

export const confirmerComposition = (matchId: number) =>
  api.patch(`/coach/matchs/${matchId}/composition/confirmer`).then(r => r.data);

export const getCompositionPrecedente = (exclureMatchId?: number): Promise<{
  success: boolean;
  data: Composition | null;
}> =>
  api.get(`/coach/compositions/precedente`, { params: { exclure_match_id: exclureMatchId } }).then(r => r.data);

// ── Formations & positions ─────────────────────────────────────

export const FORMATIONS: { value: Formation; label: string }[] = [
  { value: '4-3-3', label: '4-3-3 (Attaquant)' },
  { value: '4-4-2', label: '4-4-2 (Équilibré)' },
  { value: '4-2-3-1', label: '4-2-3-1 (Défensif)' },
  { value: '3-5-2', label: '3-5-2 (Milieux)' },
  { value: '5-3-2', label: '5-3-2 (Défensif)' },
  { value: '4-1-4-1', label: '4-1-4-1 (Pivot)' },
  { value: '3-4-3', label: '3-4-3 (Offensif)' },
];

/**
 * Définit les postes pour chaque formation.
 * Chaque poste a un nom, une ligne et une position latérale (0-1 gauche→droite).
 */
export const FORMATION_POSTES: Record<Formation, Array<{
  id: string;
  label: string;
  ligne: 'gardien' | 'defense' | 'milieu' | 'attaque';
  x: number; // 0-100 (% horizontal sur le terrain)
  y: number; // 0-100 (% vertical, 0=but propre, 100=but adverse)
}>> = {
  '4-3-3': [
    { id: 'G', label: 'Gardien', ligne: 'gardien', x: 50, y: 5 },
    { id: 'DD', label: 'Déf. D', ligne: 'defense', x: 80, y: 22 },
    { id: 'DCd', label: 'Déf. CD', ligne: 'defense', x: 62, y: 20 },
    { id: 'DCg', label: 'Déf. CG', ligne: 'defense', x: 38, y: 20 },
    { id: 'DG', label: 'Déf. G', ligne: 'defense', x: 20, y: 22 },
    { id: 'MC1', label: 'Mil. C', ligne: 'milieu', x: 50, y: 45 },
    { id: 'MD', label: 'Mil. D', ligne: 'milieu', x: 72, y: 42 },
    { id: 'MG', label: 'Mil. G', ligne: 'milieu', x: 28, y: 42 },
    { id: 'AD', label: 'Att. D', ligne: 'attaque', x: 75, y: 65 },
    { id: 'AC', label: 'Att. C', ligne: 'attaque', x: 50, y: 70 },
    { id: 'AG', label: 'Att. G', ligne: 'attaque', x: 25, y: 65 },
  ],
  '4-4-2': [
    { id: 'G', label: 'Gardien', ligne: 'gardien', x: 50, y: 5 },
    { id: 'DD', label: 'Déf. D', ligne: 'defense', x: 80, y: 22 },
    { id: 'DCd', label: 'Déf. CD', ligne: 'defense', x: 62, y: 20 },
    { id: 'DCg', label: 'Déf. CG', ligne: 'defense', x: 38, y: 20 },
    { id: 'DG', label: 'Déf. G', ligne: 'defense', x: 20, y: 22 },
    { id: 'MD', label: 'Mil. D', ligne: 'milieu', x: 75, y: 43 },
    { id: 'MCd', label: 'Mil. CD', ligne: 'milieu', x: 58, y: 42 },
    { id: 'MCg', label: 'Mil. CG', ligne: 'milieu', x: 42, y: 42 },
    { id: 'MG', label: 'Mil. G', ligne: 'milieu', x: 25, y: 43 },
    { id: 'ATd', label: 'Att. D', ligne: 'attaque', x: 62, y: 67 },
    { id: 'ATg', label: 'Att. G', ligne: 'attaque', x: 38, y: 67 },
  ],
  '4-2-3-1': [
    { id: 'G', label: 'Gardien', ligne: 'gardien', x: 50, y: 5 },
    { id: 'DD', label: 'Déf. D', ligne: 'defense', x: 80, y: 22 },
    { id: 'DCd', label: 'Déf. CD', ligne: 'defense', x: 62, y: 20 },
    { id: 'DCg', label: 'Déf. CG', ligne: 'defense', x: 38, y: 20 },
    { id: 'DG', label: 'Déf. G', ligne: 'defense', x: 20, y: 22 },
    { id: 'MDd', label: 'MDC D', ligne: 'milieu', x: 60, y: 38 },
    { id: 'MDg', label: 'MDC G', ligne: 'milieu', x: 40, y: 38 },
    { id: 'OD', label: 'Off. D', ligne: 'milieu', x: 75, y: 55 },
    { id: 'OC', label: 'Off. C', ligne: 'milieu', x: 50, y: 57 },
    { id: 'OG', label: 'Off. G', ligne: 'milieu', x: 25, y: 55 },
    { id: 'AT', label: 'Att.', ligne: 'attaque', x: 50, y: 72 },
  ],
  '3-5-2': [
    { id: 'G', label: 'Gardien', ligne: 'gardien', x: 50, y: 5 },
    { id: 'DCd', label: 'Déf. D', ligne: 'defense', x: 68, y: 20 },
    { id: 'DCC', label: 'Déf. C', ligne: 'defense', x: 50, y: 18 },
    { id: 'DCg', label: 'Déf. G', ligne: 'defense', x: 32, y: 20 },
    { id: 'MD', label: 'Piston D', ligne: 'milieu', x: 85, y: 40 },
    { id: 'MCd', label: 'Mil. CD', ligne: 'milieu', x: 65, y: 42 },
    { id: 'MCC', label: 'Mil. C', ligne: 'milieu', x: 50, y: 44 },
    { id: 'MCg', label: 'Mil. CG', ligne: 'milieu', x: 35, y: 42 },
    { id: 'MG', label: 'Piston G', ligne: 'milieu', x: 15, y: 40 },
    { id: 'ATd', label: 'Att. D', ligne: 'attaque', x: 62, y: 67 },
    { id: 'ATg', label: 'Att. G', ligne: 'attaque', x: 38, y: 67 },
  ],
  '5-3-2': [
    { id: 'G', label: 'Gardien', ligne: 'gardien', x: 50, y: 5 },
    { id: 'DD', label: 'Lat. D', ligne: 'defense', x: 88, y: 22 },
    { id: 'DCd', label: 'Déf. D', ligne: 'defense', x: 70, y: 20 },
    { id: 'DCC', label: 'Déf. C', ligne: 'defense', x: 50, y: 18 },
    { id: 'DCg', label: 'Déf. G', ligne: 'defense', x: 30, y: 20 },
    { id: 'DG', label: 'Lat. G', ligne: 'defense', x: 12, y: 22 },
    { id: 'MCd', label: 'Mil. D', ligne: 'milieu', x: 65, y: 45 },
    { id: 'MCC', label: 'Mil. C', ligne: 'milieu', x: 50, y: 47 },
    { id: 'MCg', label: 'Mil. G', ligne: 'milieu', x: 35, y: 45 },
    { id: 'ATd', label: 'Att. D', ligne: 'attaque', x: 62, y: 67 },
    { id: 'ATg', label: 'Att. G', ligne: 'attaque', x: 38, y: 67 },
  ],
  '4-1-4-1': [
    { id: 'G', label: 'Gardien', ligne: 'gardien', x: 50, y: 5 },
    { id: 'DD', label: 'Déf. D', ligne: 'defense', x: 80, y: 22 },
    { id: 'DCd', label: 'Déf. CD', ligne: 'defense', x: 62, y: 20 },
    { id: 'DCg', label: 'Déf. CG', ligne: 'defense', x: 38, y: 20 },
    { id: 'DG', label: 'Déf. G', ligne: 'defense', x: 20, y: 22 },
    { id: 'MV', label: 'Milieu V', ligne: 'milieu', x: 50, y: 36 },
    { id: 'MD', label: 'Mil. D', ligne: 'milieu', x: 75, y: 48 },
    { id: 'MCd', label: 'Mil. CD', ligne: 'milieu', x: 58, y: 50 },
    { id: 'MCg', label: 'Mil. CG', ligne: 'milieu', x: 42, y: 50 },
    { id: 'MG', label: 'Mil. G', ligne: 'milieu', x: 25, y: 48 },
    { id: 'AT', label: 'Avant-C', ligne: 'attaque', x: 50, y: 70 },
  ],
  '3-4-3': [
    { id: 'G', label: 'Gardien', ligne: 'gardien', x: 50, y: 5 },
    { id: 'DCd', label: 'Déf. D', ligne: 'defense', x: 68, y: 20 },
    { id: 'DCC', label: 'Déf. C', ligne: 'defense', x: 50, y: 18 },
    { id: 'DCg', label: 'Déf. G', ligne: 'defense', x: 32, y: 20 },
    { id: 'MD', label: 'Mil. D', ligne: 'milieu', x: 75, y: 43 },
    { id: 'MCd', label: 'Mil. CD', ligne: 'milieu', x: 58, y: 42 },
    { id: 'MCg', label: 'Mil. CG', ligne: 'milieu', x: 42, y: 42 },
    { id: 'MG', label: 'Mil. G', ligne: 'milieu', x: 25, y: 43 },
    { id: 'AD', label: 'Att. D', ligne: 'attaque', x: 75, y: 65 },
    { id: 'AC', label: 'Att. C', ligne: 'attaque', x: 50, y: 70 },
    { id: 'AG', label: 'Att. G', ligne: 'attaque', x: 25, y: 65 },
  ],
};
