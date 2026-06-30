// src/components/classement/EvolutionGraph.tsx
import React from 'react';
import type { HistoriqueClubEntry } from '../../api/classement.api';
import { TrendingUp, AlertCircle } from 'lucide-react';

interface EvolutionGraphProps {
  historique: HistoriqueClubEntry[];
  isLoading: boolean;
  clubNom: string;
}

export const EvolutionGraph: React.FC<EvolutionGraphProps> = ({
  historique,
  isLoading,
  clubNom,
}) => {
  const [hoveredPoint, setHoveredPoint] = React.useState<HistoriqueClubEntry | null>(null);

  if (isLoading) {
    return (
      <div className="card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#e2e8f0', animation: 'pulse-soft 2s ease-in-out infinite' }}></div>
          <div style={{ height: '20px', width: '192px', borderRadius: '4px', background: '#e2e8f0', animation: 'pulse-soft 2s ease-in-out infinite' }}></div>
        </div>
        <div style={{ height: '240px', width: '100%', borderRadius: '8px', background: '#e2e8f0', animation: 'pulse-soft 2s ease-in-out infinite' }}></div>
      </div>
    );
  }

  if (!historique || historique.length === 0) {
    return (
      <div className="card" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
        <AlertCircle size={32} style={{ color: 'var(--text-light)', opacity: 0.5 }} />
        <span style={{ fontSize: '13px' }}>Pas assez de données de matchs pour tracer la courbe d'évolution.</span>
      </div>
    );
  }

  // Dimensions of our SVG chart
  const width = 600;
  const height = 250;
  const paddingX = 40;
  const paddingY = 30;

  // X coords: journées
  const maxJournee = Math.max(...historique.map((h) => h.journee), 1);
  const minJournee = 1;
  const rangeJournee = maxJournee - minJournee || 1;

  // Y coords: positions (rank 1 should be at the top, max rank at the bottom)
  const maxPosition = Math.max(...historique.map((h) => h.position), 10);
  const minPosition = 1;
  const rangePosition = maxPosition - minPosition || 1;

  // Helper to map data point to SVG coordinates
  const getCoordinates = (entry: HistoriqueClubEntry) => {
    // X axis calculation
    const x = paddingX + ((entry.journee - minJournee) / rangeJournee) * (width - 2 * paddingX);
    
    // Y axis calculation (inverted so position 1 is higher up)
    const y = paddingY + ((entry.position - minPosition) / rangePosition) * (height - 2 * paddingY);
    
    return { x, y };
  };

  const points = historique.map((h) => ({
    ...h,
    ...getCoordinates(h),
  }));

  // Create path line
  let pathD = '';
  if (points.length > 0) {
    pathD = `M ${points[0].x} ${points[0].y} ` + points.slice(1).map((p) => `L ${p.x} ${p.y}`).join(' ');
  }

  // Y-Axis labels (ranks)
  const yLabels = [];
  const yLabelStep = Math.ceil(rangePosition / 4) || 1;
  for (let pos = minPosition; pos <= maxPosition; pos += yLabelStep) {
    yLabels.push(pos);
  }
  // Ensure the max position is included
  if (!yLabels.includes(maxPosition)) {
    yLabels.push(maxPosition);
  }

  return (
    <div className="card animate-fade-in" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <TrendingUp size={20} style={{ color: 'var(--primary)' }} />
          <h3 style={{ margin: 0, fontWeight: 700, color: 'var(--text)', fontSize: '15px' }}>
            Évolution du classement — {clubNom}
          </h3>
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: 'var(--primary)' }}></span>
          <span>Rang par journée</span>
        </div>
      </div>

      <div className="relative">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
          {/* Grid lines & Y Axis Labels */}
          {yLabels.map((pos) => {
            const mappedY = paddingY + ((pos - minPosition) / rangePosition) * (height - 2 * paddingY);
            return (
              <g key={pos} style={{ opacity: 0.4 }}>
                <line
                  x1={paddingX}
                  y1={mappedY}
                  x2={width - paddingX}
                  y2={mappedY}
                  stroke="#E2E8F0"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                <text
                  x={paddingX - 10}
                  y={mappedY + 4}
                  textAnchor="end"
                  style={{ fontSize: '10px', fontWeight: 600, fill: 'var(--text-light)' }}
                >
                  {pos}
                </text>
              </g>
            );
          })}

          {/* X Axis Labels (Journées) */}
          {points.map((p, i) => {
            // Display only some labels if there are too many journées to avoid overcrowding
            const shouldDisplayLabel = points.length <= 12 || i % Math.ceil(points.length / 8) === 0 || i === points.length - 1;
            
            if (!shouldDisplayLabel) return null;

            return (
              <text
                key={p.journee}
                x={p.x}
                y={height - paddingY + 16}
                textAnchor="middle"
                style={{ fontSize: '10px', fontWeight: 600, fill: 'var(--text-light)' }}
              >
                J{p.journee}
              </text>
            );
          })}

          {/* SVG Line path with animation */}
          {points.length > 1 && (
            <>
              {/* Glow line */}
              <path
                d={pathD}
                fill="none"
                stroke="var(--primary-light)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ opacity: 0.1 }}
              />
              {/* Main line */}
              <path
                d={pathD}
                fill="none"
                stroke="var(--primary)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  strokeDasharray: '1000',
                  strokeDashoffset: 0,
                  transition: 'stroke-dashoffset 2s ease-in-out',
                }}
              />
            </>
          )}

          {/* Data Points */}
          {points.map((p) => {
            const isHovered = hoveredPoint?.journee === p.journee;
            return (
              <g
                key={p.journee}
                onMouseEnter={() => setHoveredPoint(p)}
                onMouseLeave={() => setHoveredPoint(null)}
                style={{ cursor: 'pointer' }}
              >
                {/* Invisible hover helper */}
                <circle cx={p.x} cy={p.y} r="10" fill="transparent" />
                {/* Dot */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isHovered ? 6 : 4.5}
                  fill={isHovered ? 'var(--accent)' : 'var(--primary)'}
                  stroke={isHovered ? 'var(--primary)' : '#FFF'}
                  strokeWidth="1.5"
                  style={{ transition: 'all 0.15s ease' }}
                />
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip */}
        {hoveredPoint && (
          <div
            style={{
              position: 'absolute',
              backgroundColor: '#1e293b',
              color: '#ffffff',
              fontSize: '12px',
              borderRadius: '8px',
              padding: '6px 12px',
              boxShadow: 'var(--shadow-md)',
              pointerEvents: 'none',
              transform: 'translate(-50%, -100%)',
              zIndex: 20,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              left: `${((hoveredPoint.journee - minJournee) / rangeJournee) * 100}%`,
              top: `${((hoveredPoint.position - minPosition) / rangePosition) * (height - 2 * paddingY) + paddingY - 10}px`,
              transition: 'all 0.1s ease',
            }}
          >
            <span style={{ fontWeight: 700, fontSize: '10px', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Journée {hoveredPoint.journee}
            </span>
            <span style={{ fontWeight: 600, marginTop: '2px' }}>
              Position : {hoveredPoint.position}
              {hoveredPoint.position === 1 ? 'er' : 'e'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

