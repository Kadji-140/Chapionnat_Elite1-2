// src/components/ui/StatCard.tsx
// Carte statistique avec icône, valeur, label et tendance optionnelle
// Design : glassmorphism, animations fluides, hover lift

import React, { useState } from 'react';
import { TrendingUp, TrendingDown, MoreHorizontal, type LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  trend?: {
    value: number;
    label?: string;
    positive?: boolean;
  };
  onClick?: () => void;
  animationDelay?: number;
  /** Affiche un menu contextuel (options) */
  menuOptions?: { label: string; onClick: () => void }[];
  /** Soustexte ou métrique secondaire */
  subtitle?: string;
  /** Variation en pourcentage */
  variation?: number;
  /** Couleur de bordure d'accentuation */
  accentColor?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon: Icon,
  iconColor = '#1B4332',
  iconBg = 'rgba(27,67,50,0.08)',
  trend,
  onClick,
  animationDelay = 0,
  menuOptions,
  subtitle,
  variation,
  accentColor = '#1B4332',
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const isPositive = trend?.positive !== undefined
    ? trend.positive
    : (trend?.value ?? 0) >= 0;

  const variationColor = variation !== undefined
    ? variation >= 0 ? '#15803d' : '#dc2626'
    : undefined;

  return (
    <div
      className="stat-card"
      style={{
        animationDelay: `${animationDelay}ms`,
        cursor: onClick ? 'pointer' : 'default',
        borderTop: `3px solid ${accentColor}`,
      }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    >
      {/* En-tête avec menu */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        {/* Icône avec effet de glow */}
        <div
          className="stat-icon-wrap"
          style={{
            background: iconBg,
            boxShadow: `0 4px 12px ${iconBg.replace(/[^,]+(?=\))/, '0.3') || 'rgba(0,0,0,0.05)'}`,
          }}
        >
          <Icon size={22} style={{ color: iconColor }} />
        </div>

        {/* Menu options (3 points) */}
        {menuOptions && menuOptions.length > 0 && (
          <div style={{ position: 'relative' }}>
            <button
              className="stat-menu-btn"
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              aria-label="Options"
            >
              <MoreHorizontal size={16} />
            </button>
            {showMenu && (
              <div className="stat-menu-dropdown">
                {menuOptions.map((opt, idx) => (
                  <button
                    key={idx}
                    className="stat-menu-item"
                    onClick={(e) => {
                      e.stopPropagation();
                      opt.onClick();
                      setShowMenu(false);
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Valeur principale */}
      <div className="stat-value" style={{ marginTop: '8px' }}>
        {value}
      </div>

      {/* Label */}
      <div className="stat-label">{label}</div>

      {/* Variation (pourcentage) */}
      {variation !== undefined && (
        <div className="stat-variation" style={{ color: variationColor }}>
          <span className="stat-variation-icon">
            {variation >= 0 ? '▲' : '▼'}
          </span>
          <span className="stat-variation-value">
            {Math.abs(variation)}%
          </span>
          <span className="stat-variation-label">vs mois dernier</span>
        </div>
      )}

      {/* Soustexte */}
      {subtitle && (
        <div className="stat-subtitle">{subtitle}</div>
      )}

      {/* Trend (évolution linéaire) */}
      {trend && (
        <div
          className="stat-trend"
          style={{ color: isPositive ? '#15803d' : '#dc2626' }}
        >
          {isPositive ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
          <span>
            {isPositive ? '+' : ''}{trend.value}
            {trend.label ? ` ${trend.label}` : ''}
          </span>
        </div>
      )}
    </div>
  );
};

// ── Grille de StatCards avec responsive ───────────────────────
interface StatCardGridProps {
  children: React.ReactNode;
  cols?: 2 | 3 | 4;
  /** Espacement entre les cartes (rem) */
  gap?: number;
}

export const StatCardGrid: React.FC<StatCardGridProps> = ({
  children,
  cols = 4,
  gap = 1,
}) => (
  <div
    className="stat-card-grid"
    style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${cols}, 1fr)`,
      gap: `${gap}rem`,
      marginBottom: '1.75rem',
    }}
  >
    {children}
  </div>
);