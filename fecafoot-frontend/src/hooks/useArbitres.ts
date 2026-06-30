// src/hooks/useArbitres.ts
// Hooks TanStack Query pour la gestion des arbitres

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getArbitres, createArbitre, updateArbitre, toggleArbitre, deleteArbitre,
  type ArbitreFilters,
} from '../api/arbitres.api';
import toast from 'react-hot-toast';

// ── Clés de cache ─────────────────────────────────────────────
export const ARBITRES_KEY = ['arbitres'] as const;

// ── Liste paginée avec filtres ────────────────────────────────
export function useArbitres(filters?: ArbitreFilters) {
  return useQuery({
    queryKey: [...ARBITRES_KEY, filters],
    queryFn: () => getArbitres(filters),
  });
}

// ── Créer un arbitre ──────────────────────────────────────────
export function useCreateArbitre() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createArbitre,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ARBITRES_KEY });
      toast.success('Arbitre créé avec succès.');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? 'Erreur lors de la création de l\'arbitre.';
      toast.error(msg);
    },
  });
}

// ── Modifier un arbitre ───────────────────────────────────────
export function useUpdateArbitre() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => updateArbitre(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ARBITRES_KEY });
      toast.success('Arbitre mis à jour.');
    },
  });
}

// ── Activer / Désactiver un arbitre ──────────────────────────
export function useToggleArbitre() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: toggleArbitre,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ARBITRES_KEY });
    },
  });
}

// ── Supprimer un arbitre ──────────────────────────────────────
export function useDeleteArbitre() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteArbitre,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ARBITRES_KEY });
      toast.success('Arbitre supprimé.');
    },
  });
}
