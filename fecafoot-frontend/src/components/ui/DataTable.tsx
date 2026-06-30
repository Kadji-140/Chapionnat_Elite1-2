// src/components/ui/DataTable.tsx
// Tableau de données avec skeleton de chargement, empty state, pagination et stagger animation

import React from 'react';
import { ChevronLeft, ChevronRight, Inbox } from 'lucide-react';

// ── Skeleton de chargement ────────────────────────────────────
export const SkeletonTable: React.FC<{ rows?: number; cols?: number }> = ({
  rows = 6,
  cols = 5,
}) => (
  <div style={{ overflow: 'hidden', borderRadius: 'var(--border-radius)' }}>
    <table className="data-table">
      <thead>
        <tr>
          {Array.from({ length: cols }).map((_, i) => (
            <th key={i}>
              <div className="skeleton skeleton-text" style={{ width: `${60 + (i * 10) % 30}%` }} />
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: rows }).map((_, rowIdx) => (
          <tr key={rowIdx}>
            {Array.from({ length: cols }).map((_, colIdx) => (
              <td key={colIdx}>
                <div
                  className="skeleton"
                  style={{
                    height: '14px',
                    width: colIdx === 0 ? '40px' : `${50 + (colIdx * rowIdx * 7) % 40}%`,
                    borderRadius: colIdx === 0 ? '50%' : undefined,
                  }}
                />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// ── Empty state ───────────────────────────────────────────────
interface EmptyStateProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'Aucun résultat',
  description = 'Aucune donnée à afficher pour le moment.',
  action,
  icon,
}) => (
  <div
    className="animate-fade-in"
    style={{
      textAlign: 'center',
      padding: '60px 24px',
      color: 'var(--text-muted)',
    }}
  >
    <div
      style={{
        width: '64px',
        height: '64px',
        background: '#f1f5f9',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 16px',
      }}
    >
      {icon ?? <Inbox size={28} style={{ color: 'var(--text-light)' }} />}
    </div>
    <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>
      {title}
    </h3>
    <p style={{ fontSize: '14px', maxWidth: '320px', margin: '0 auto 20px' }}>
      {description}
    </p>
    {action}
  </div>
);

// ── Pagination ────────────────────────────────────────────────
interface PaginationProps {
  currentPage: number;
  lastPage: number;
  total: number;
  perPage: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  lastPage,
  total,
  perPage,
  onPageChange,
}) => {
  const from = (currentPage - 1) * perPage + 1;
  const to   = Math.min(currentPage * perPage, total);

  // Calculer les pages à afficher (max 7)
  const getPages = (): (number | '...')[] => {
    if (lastPage <= 7) return Array.from({ length: lastPage }, (_, i) => i + 1);
    if (currentPage <= 4) return [1, 2, 3, 4, 5, '...', lastPage];
    if (currentPage >= lastPage - 3) return [1, '...', lastPage - 4, lastPage - 3, lastPage - 2, lastPage - 1, lastPage];
    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', lastPage];
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 0 4px',
        flexWrap: 'wrap',
        gap: '12px',
      }}
    >
      <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
        Affichage de <strong>{from}</strong> à <strong>{to}</strong> sur <strong>{total}</strong> résultats
      </span>

      <div className="pagination">
        <button
          className="page-btn"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Page précédente"
        >
          <ChevronLeft size={16} />
        </button>

        {getPages().map((page, i) =>
          page === '...' ? (
            <span
              key={`ellipsis-${i}`}
              style={{ padding: '0 4px', color: 'var(--text-muted)', fontSize: '13px' }}
            >
              …
            </span>
          ) : (
            <button
              key={page}
              className={`page-btn ${page === currentPage ? 'active' : ''}`}
              onClick={() => onPageChange(page as number)}
              aria-current={page === currentPage ? 'page' : undefined}
            >
              {page}
            </button>
          )
        )}

        <button
          className="page-btn"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === lastPage}
          aria-label="Page suivante"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

// ── Avatar avec initiales ─────────────────────────────────────
interface AvatarProps {
  src?: string | null;
  name: string;
  size?: number;
  bgColor?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  size = 36,
  bgColor,
}) => {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('');

  // Générer une couleur déterministe depuis le nom
  const colors = ['#1B4332', '#2D6A4F', '#C8102E', '#E53946', '#1d4ed8', '#7c3aed', '#b45309'];
  const colorIndex = name.charCodeAt(0) % colors.length;
  const bg = bgColor ?? colors[colorIndex];

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        width={size}
        height={size}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          objectFit: 'cover',
          border: '2px solid var(--border)',
          flexShrink: 0,
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: bg,
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.36,
        fontWeight: 700,
        flexShrink: 0,
        letterSpacing: '-0.5px',
      }}
      aria-label={name}
    >
      {initials}
    </div>
  );
};
