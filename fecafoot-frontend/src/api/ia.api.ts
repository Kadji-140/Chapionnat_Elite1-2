// src/api/ia.api.ts
// Couche API pour le module d'intelligence artificielle

import api from './axios';

export interface PredictionData {
  victoire_domicile: number;
  nul: number;
  victoire_exterieur: number;
  prediction: 'domicile' | 'exterieur' | 'nul';
  confiance: 'elevee' | 'moyenne' | 'faible';
  date_calcul?: string;
  modele_version?: string;
}

export interface TalentDetails {
  score_offensive: number;
  score_defensive: number;
  score_discipline: number;
  score_regularite: number;
}

export interface TalentScoreData {
  talent_score: number;
  niveau: string;
  recommande_recrutement: boolean;
  details: TalentDetails;
  date_calcul?: string;
  modele_version?: string;
}

/**
 * Récupère la prédiction d'un match
 */
export const getPrediction = (matchId: number): Promise<{ success: boolean; data: PredictionData }> =>
  api.get(`/ia/predict/${matchId}`).then(r => r.data);

/**
 * Récupère le Talent Score d'un joueur
 */
export const getTalentScore = (joueurId: number): Promise<{ success: boolean; data: TalentScoreData }> =>
  api.get(`/ia/talent/${joueurId}`).then(r => r.data);

/**
 * Lance le recalcul général des Talent Scores (Admin uniquement)
 */
export const recalculerTalents = (): Promise<{ success: boolean; message: string; output?: string }> =>
  api.post('/ia/recalculer-talents').then(r => r.data);
