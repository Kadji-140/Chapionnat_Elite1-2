// src/components/ui/Badge.tsx
// Badge de statut coloré et réutilisable

import React from 'react';

type BadgeVariant =
  | 'success' | 'danger' | 'warning' | 'info'
  | 'gray' | 'primary' | 'accent';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  dot?: boolean;
  className?: string;
}

const variantMap: Record<BadgeVariant, string> = {
  success: 'badge-success',
  danger:  'badge-danger',
  warning: 'badge-warning',
  info:    'badge-info',
  gray:    'badge-gray',
  primary: 'badge-primary',
  accent:  'badge-accent',
};

export const Badge: React.FC<BadgeProps> = ({
  variant = 'gray',
  children,
  dot = false,
  className = '',
}) => {
  return (
    <span className={`badge ${variantMap[variant]} ${className}`}>
      {dot && (
        <span
          className="inline-block w-1.5 h-1.5 rounded-full"
          style={{ background: 'currentColor' }}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
};

// Badges spécialisés prêts à l'emploi
export const StatutBadge: React.FC<{ actif: boolean }> = ({ actif }) => (
  <Badge variant={actif ? 'success' : 'gray'} dot>
    {actif ? 'Actif' : 'Inactif'}
  </Badge>
);

export const DivisionBadge: React.FC<{ division: string }> = ({ division }) => (
  <Badge variant={division === 'elite_one' ? 'primary' : 'accent'}>
    {division === 'elite_one' ? 'Elite One' : 'Elite Two'}
  </Badge>
);

export const ValidationBadge: React.FC<{ statut: string }> = ({ statut }) => {
  const map: Record<string, { variant: BadgeVariant; label: string }> = {
    valide:     { variant: 'success', label: 'Validé' },
    en_attente: { variant: 'warning', label: 'En attente' },
    rejete:     { variant: 'danger',  label: 'Rejeté' },
  };
  const config = map[statut] ?? { variant: 'gray', label: statut };
  return <Badge variant={config.variant} dot>{config.label}</Badge>;
};

export const RoleBadge: React.FC<{ role: string }> = ({ role }) => {
  const map: Record<string, { variant: BadgeVariant; label: string }> = {
    admin:           { variant: 'danger',  label: 'Admin' },
    responsable_club:{ variant: 'primary', label: 'Responsable' },
    coach:           { variant: 'info',    label: 'Coach' },
    commissaire:     { variant: 'warning', label: 'Commissaire' },
    journaliste:     { variant: 'accent',  label: 'Journaliste' },
  };
  const config = map[role] ?? { variant: 'gray', label: role };
  return <Badge variant={config.variant}>{config.label}</Badge>;
};
