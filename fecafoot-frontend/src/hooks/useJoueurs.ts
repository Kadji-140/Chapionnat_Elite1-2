// src/hooks/useJoueurs.ts
// Hooks TanStack Query pour la gestion des joueurs

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAdminJoueurs, getJoueursEnAttente, validerJoueur, rejeterJoueur,
  getJoueursClub, createJoueur, updateJoueur, deleteJoueur, soumettreEffectif,
} from '../api/joueurs.api';
import toast from 'react-hot-toast';

// ── Clés de cache ─────────────────────────────────────────────
export const JOUEURS_KEY     = ['joueurs'] as const;
export const EFFECTIF_KEY    = ['effectif'] as const;
export const EN_ATTENTE_KEY  = ['joueurs-en-attente'] as const;

// ─────────────────────────────────────────────────────────────
//  ADMIN — Validation des licences
// ─────────────────────────────────────────────────────────────

export function useAdminJoueurs(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: [...JOUEURS_KEY, filters],
    queryFn: () => getAdminJoueurs(filters),
  });
}

export function useJoueursEnAttente() {
  return useQuery({
    queryKey: EN_ATTENTE_KEY,
    queryFn: getJoueursEnAttente,
    refetchInterval: 30_000, // Polling 30s
  });
}

export function useValiderJoueur() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: validerJoueur,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EN_ATTENTE_KEY });
      queryClient.invalidateQueries({ queryKey: JOUEURS_KEY });
      toast.success('Joueur validé ✅');
    },
    onError: () => toast.error('Erreur lors de la validation.'),
  });
}

export function useRejeterJoueur() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, motif }: { id: number; motif: string }) => rejeterJoueur(id, motif),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EN_ATTENTE_KEY });
      queryClient.invalidateQueries({ queryKey: JOUEURS_KEY });
      toast.success('Licence rejetée.');
    },
    onError: () => toast.error('Erreur lors du rejet.'),
  });
}

// ─────────────────────────────────────────────────────────────
//  RESPONSABLE — Gestion de l'effectif
// ─────────────────────────────────────────────────────────────

export function useEffectif(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: [...EFFECTIF_KEY, filters],
    queryFn: () => getJoueursClub(filters),
  });
}

export function useCreateJoueur() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createJoueur,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EFFECTIF_KEY });
      toast.success('Joueur ajouté à l\'effectif.');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? 'Erreur lors de l\'ajout du joueur.';
      toast.error(msg);
    },
  });
}

export function useUpdateJoueur() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: FormData }) => updateJoueur(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EFFECTIF_KEY });
      toast.success('Joueur mis à jour.');
    },
  });
}

export function useDeleteJoueur() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteJoueur,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EFFECTIF_KEY });
      toast.success('Joueur retiré de l\'effectif.');
    },
  });
}

export function useSoumettreEffectif() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: soumettreEffectif,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EFFECTIF_KEY });
      toast.success('Effectif soumis à validation ✅');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? 'Erreur lors de la soumission.';
      toast.error(msg);
    },
  });
}
