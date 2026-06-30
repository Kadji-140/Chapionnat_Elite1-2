// src/hooks/useUsers.ts
// Hooks TanStack Query pour la gestion des utilisateurs et coachs

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAdminUsers, createUser, updateUser, toggleUser, resetUserPassword,
  getCoachsClub, createCoach, toggleCoach, deleteCoach,
  type UserFilters,
} from '../api/users.api';
import toast from 'react-hot-toast';

// ── Clés de cache ─────────────────────────────────────────────
export const USERS_KEY  = ['users'] as const;
export const COACHS_KEY = ['coachs'] as const;

// ─────────────────────────────────────────────────────────────
//  ADMIN — Gestion des utilisateurs
// ─────────────────────────────────────────────────────────────

export function useAdminUsers(filters?: UserFilters) {
  return useQuery({
    queryKey: [...USERS_KEY, filters],
    queryFn: () => getAdminUsers(filters),
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_KEY });
      toast.success('Compte créé ! Le nouvel utilisateur a reçu ses identifiants par email.');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? 'Erreur lors de la création du compte.';
      toast.error(msg);
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_KEY });
      toast.success('Utilisateur mis à jour.');
    },
  });
}

export function useToggleUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: toggleUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_KEY });
      toast.success('Statut du compte mis à jour.');
    },
  });
}

export function useResetUserPassword() {
  return useMutation({
    mutationFn: resetUserPassword,
    onSuccess: () => {
      toast.success('Nouveau mot de passe envoyé par email.');
    },
    onError: () => {
      toast.error('Impossible de réinitialiser le mot de passe.');
    },
  });
}

// ─────────────────────────────────────────────────────────────
//  RESPONSABLE — Gestion des coachs
// ─────────────────────────────────────────────────────────────

export function useCoachs() {
  return useQuery({
    queryKey: COACHS_KEY,
    queryFn: getCoachsClub,
  });
}

export function useCreateCoach() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCoach,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COACHS_KEY });
      toast.success('Coach ajouté ! Il a reçu ses identifiants par email.');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? 'Erreur lors de l\'ajout du coach.';
      toast.error(msg);
    },
  });
}

export function useToggleCoach() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: toggleCoach,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COACHS_KEY });
    },
  });
}

export function useDeleteCoach() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteCoach,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COACHS_KEY });
      toast.success('Coach retiré du club.');
    },
  });
}
