// src/hooks/useClubs.ts
// Hooks TanStack Query pour la gestion des clubs

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getClubs, getClub, createClub, updateClub, deleteClub, toggleClub,
} from '../api/clubs.api';
import toast from 'react-hot-toast';

// ── Clés de cache ─────────────────────────────────────────────
export const CLUBS_KEY = ['clubs'] as const;

// ── Liste paginée avec filtres ────────────────────────────────
export function useClubs(params?: { division?: string; est_actif?: string; search?: string; page?: number }) {
  return useQuery({
    queryKey: [...CLUBS_KEY, params],
    queryFn: () => getClubs(params),
  });
}

// ── Détail d'un club ──────────────────────────────────────────
export function useClub(id: number | string | undefined) {
  return useQuery({
    queryKey: [...CLUBS_KEY, id],
    queryFn: () => getClub(Number(id)),
    enabled: !!id,
  });
}

// ── Créer un club ─────────────────────────────────────────────
export function useCreateClub() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createClub,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLUBS_KEY });
      toast.success('Club créé avec succès ! Le responsable a reçu ses identifiants par email.');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? 'Erreur lors de la création du club.';
      toast.error(msg);
    },
  });
}

// ── Modifier un club ──────────────────────────────────────────
export function useUpdateClub() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: FormData }) => updateClub(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLUBS_KEY });
      toast.success('Club mis à jour.');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? 'Erreur lors de la mise à jour.';
      toast.error(msg);
    },
  });
}

// ── Supprimer (soft delete) un club ──────────────────────────
export function useDeleteClub() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteClub,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLUBS_KEY });
      toast.success('Club désactivé.');
    },
  });
}

// ── Activer / Désactiver un club ──────────────────────────────
export function useToggleClub() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: toggleClub,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLUBS_KEY });
    },
  });
}
