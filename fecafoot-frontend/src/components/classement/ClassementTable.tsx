// src/components/classement/ClassementTable.tsx
import React from 'react';
import type { ClassementEntry } from '../../api/classement.api';
import { Shield, RefreshCw, Lock, Unlock, AlertTriangle, Info } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';

interface ClassementTableProps {
  classement: ClassementEntry[];
  isLoading: boolean;
  isGele?: boolean;
  isAdmin?: boolean;
  onRecalculer?: () => Promise<void>;
  onToggleGel?: () => Promise<void>;
  nbQualifiesUp?: number; // for highlighting playoff UP qualifiers
  nbQualifiesDown?: number; // for highlighting relegation zone
}

export const ClassementTable: React.FC<ClassementTableProps> = ({
  classement,
  isLoading,
  isGele = false,
  isAdmin = false,
  onRecalculer,
  onToggleGel,
  nbQualifiesUp = 2,
  nbQualifiesDown = 2,
}) => {
  const [isActionLoading, setIsActionLoading] = React.useState(false);
  const { lang } = useTranslation();
  const isEn = lang === 'en';

  const handleRecalculer = async () => {
    if (!onRecalculer) return;
    setIsActionLoading(true);
    try {
      await onRecalculer();
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleToggleGel = async () => {
    if (!onToggleGel) return;
    setIsActionLoading(true);
    try {
      await onToggleGel();
    } finally {
      setIsActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="card w-full overflow-hidden animate-pulse">
        <div className="card-header border-b border-[var(--border)] p-4 flex justify-between items-center bg-white">
          <div className="skeleton h-6 w-48"></div>
          <div className="skeleton h-8 w-24"></div>
        </div>
        <div className="p-4">
          <div className="space-y-3">
            <div className="skeleton h-10 w-full"></div>
            {[...Array(6)].map((_, i) => (
              <div key={i} className="skeleton h-12 w-full"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const hasPenalties = classement.some(entry => entry.points_penalite > 0);

  return (
    <div className="card w-full overflow-hidden bg-white shadow-sm border border-[var(--border)] animate-fade-in">
      {/* Header controls for Admins */}
      {(isAdmin || isGele) && (
        <div className="card-header flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 border-b border-[var(--border)] bg-gray-50">
          <div className="flex items-center gap-2">
            {isGele ? (
              <div className="badge badge-warning flex items-center gap-1.5 py-1 px-3">
                <Lock className="w-3.5 h-3.5" />
                <span>{isEn ? 'Frozen Standings (Final)' : 'Classement Gelé (Définitif)'}</span>
              </div>
            ) : (
              <div className="badge badge-success flex items-center gap-1.5 py-1 px-3">
                <Unlock className="w-3.5 h-3.5" />
                <span>{isEn ? 'Live Update' : 'Mise à jour en direct'}</span>
              </div>
            )}
            {isGele && (
              <span className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                <Info className="w-3 h-3" />
                {isEn ? 'Match results no longer affect these standings.' : "Les résultats de matchs n'affectent plus ce classement."}
              </span>
            )}
          </div>

          {isAdmin && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {onRecalculer && (
                <button
                  onClick={handleRecalculer}
                  disabled={isActionLoading || isGele}
                  className="btn btn-ghost btn-sm flex items-center gap-1.5 bg-white shadow-sm border border-gray-300 disabled:opacity-50"
                  title={isGele ? (isEn ? 'Cannot recalculate frozen standings' : 'Impossible de recalculer un classement gelé') : (isEn ? 'Force recalculation' : 'Forcer le recalcul')}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isActionLoading ? 'animate-spin' : ''}`} />
                  <span>{isEn ? 'Recalculate' : 'Recalculer'}</span>
                </button>
              )}
              {onToggleGel && (
                <button
                  onClick={handleToggleGel}
                  disabled={isActionLoading}
                  className={`btn btn-sm flex items-center gap-1.5 ${
                    isGele ? 'btn-accent' : 'btn-danger'
                  }`}
                >
                  {isGele ? (
                    <>
                      <Unlock className="w-3.5 h-3.5" />
                      <span>{isEn ? 'Unfreeze' : 'Dégeler'}</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span>{isEn ? 'Freeze standings' : 'Geler classement'}</span>
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="data-table w-full">
          <thead>
            <tr>
              <th className="w-12 text-center">Pos</th>
              <th>{isEn ? 'Club' : 'Club'}</th>
              <th className="w-12 text-center font-semibold">{isEn ? 'P' : 'J'}</th>
              <th className="w-12 text-center text-gray-500">{isEn ? 'W' : 'G'}</th>
              <th className="w-12 text-center text-gray-500">{isEn ? 'D' : 'N'}</th>
              <th className="w-12 text-center text-gray-500">{isEn ? 'L' : 'P'}</th>
              <th className="w-16 text-center text-gray-500">{isEn ? 'Goals' : 'Buts'}</th>
              <th className="w-12 text-center font-medium">{isEn ? 'Diff' : 'Diff'}</th>
              <th className="w-16 text-center text-[var(--primary)] font-bold bg-[var(--primary-50)]">{isEn ? 'Pts' : 'Pts'}</th>
            </tr>
          </thead>
          <tbody>
            {classement.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-8 text-[var(--text-muted)]">
                  {isEn 
                    ? 'No registered clubs or no matches played in this group.' 
                    : 'Aucun club enregistré ou aucun match joué dans cette poule.'}
                </td>
              </tr>
            ) : (
              classement.map((entry, index) => {
                const totalClubs = classement.length;
                const isPlayoffUp = index < nbQualifiesUp;
                const isPlayoffDown = index >= totalClubs - nbQualifiesDown;

                let rowBgClass = '';
                let posBadgeClass = 'bg-gray-100 text-gray-700';

                if (isPlayoffUp) {
                  rowBgClass = 'bg-emerald-50/30 hover:bg-emerald-50/50';
                  posBadgeClass = 'bg-emerald-600 text-white font-bold';
                } else if (isPlayoffDown) {
                  rowBgClass = 'bg-rose-50/30 hover:bg-rose-50/50';
                  posBadgeClass = 'bg-rose-600 text-white font-bold';
                }

                return (
                  <tr
                    key={entry.id}
                    className={`stagger-item border-b border-[var(--border)] ${rowBgClass}`}
                  >
                    {/* Position */}
                    <td className="text-center font-semibold">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs ${posBadgeClass}`}>
                        {entry.position || index + 1}
                      </span>
                    </td>

                    {/* Club */}
                    <td>
                      <div className="flex items-center gap-3">
                        {entry.club?.logo_url ? (
                          <img
                            src={entry.club.logo_url}
                            alt={entry.club.nom}
                            className="w-8 h-8 object-contain rounded-md"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-md bg-gray-100 flex items-center justify-center border border-gray-200">
                            <Shield className="w-4 h-4 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-gray-800 flex items-center gap-1.5">
                            {entry.club?.nom || 'Club Inconnu'}
                            {entry.points_penalite > 0 && (
                              <span
                                className="text-rose-600 flex items-center cursor-help"
                                title={isEn 
                                  ? `Deduction of ${entry.points_penalite} administrative penalty point(s)`
                                  : `Retrait de ${entry.points_penalite} point(s) de pénalité administratif`}
                              >
                                <AlertTriangle className="w-3.5 h-3.5" />
                              </span>
                            )}
                          </div>
                          {entry.club?.ville && (
                            <div className="text-xs text-[var(--text-muted)]">{entry.club.ville}</div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Played */}
                    <td className="text-center font-medium">{entry.nb_matchs}</td>

                    {/* Wins, Draws, Losses */}
                    <td className="text-center text-gray-600">{entry.victoires}</td>
                    <td className="text-center text-gray-600">{entry.nuls}</td>
                    <td className="text-center text-gray-600">{entry.defaites}</td>

                    {/* Goals */}
                    <td className="text-center text-xs text-gray-500">
                      {entry.buts_pour} - {entry.buts_contre}
                    </td>

                    {/* Goal Difference */}
                    <td className={`text-center font-medium ${
                      entry.diff_buts > 0 ? 'text-emerald-600' : entry.diff_buts < 0 ? 'text-rose-600' : 'text-gray-500'
                    }`}>
                      {entry.diff_buts > 0 ? `+${entry.diff_buts}` : entry.diff_buts}
                    </td>

                    {/* Points */}
                    <td className="text-center font-extrabold text-[var(--primary)] bg-[var(--primary-50)]/50">
                      <div className="flex flex-col items-center">
                        <span className="text-base">{Math.max(0, entry.points - entry.points_penalite)}</span>
                        {entry.points_penalite > 0 && (
                          <span className="text-[10px] text-rose-500 line-through font-normal" title={isEn ? `Initial points: ${entry.points}` : `Points initiaux: ${entry.points}`}>
                            {entry.points}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Playoff Legend & Penalties footnotes */}
      <div className="p-4 border-t border-[var(--border)] bg-gray-50 text-xs text-[var(--text-muted)] flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-sm bg-emerald-100 border border-emerald-300"></span>
            <span>{isEn ? 'Qualified Playoffs UP' : 'Qualifiés Playoffs UP'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-sm bg-rose-100 border border-rose-300"></span>
            <span>{isEn ? 'Relegation Zone / Playoffs DOWN' : 'Zone de Relégation / Playoffs DOWN'}</span>
          </div>
        </div>

        {hasPenalties && (
          <div className="flex items-center gap-1 text-rose-600 font-medium animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{isEn ? 'Some clubs have suffered administrative points deductions.' : 'Certains clubs ont subi des retraits de points administratifs.'}</span>
          </div>
        )}
      </div>
    </div>
  );
};
