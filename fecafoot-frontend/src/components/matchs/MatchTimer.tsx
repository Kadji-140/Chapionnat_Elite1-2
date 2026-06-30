// src/components/matchs/MatchTimer.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RefreshCw, Plus, Minus } from 'lucide-react';

interface MatchTimerProps {
  statut: 'programme' | 'en_cours' | 'mi_temps' | 'termine' | 'homologue' | 'reporte' | 'annule' | 'litige';
  onTimeChange?: (minutes: number, seconds: number) => void;
  initialMinutes?: number;
  periode?: string;
  tempsAdditionnel?: number;
  dureeProlongation?: number;
  onPeriodEnd?: (minute: number) => void;
}

export const MatchTimer: React.FC<MatchTimerProps> = ({
  statut,
  onTimeChange,
  initialMinutes = 0,
  periode = '1ere_mi_temps',
  tempsAdditionnel = 0,
  dureeProlongation = 15,
  onPeriodEnd,
}) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(initialMinutes * 60);
  const [isPaused, setIsPaused] = useState(statut !== 'en_cours');

  const onTimeChangeRef = useRef(onTimeChange);
  useEffect(() => {
    onTimeChangeRef.current = onTimeChange;
  }, [onTimeChange]);

  useEffect(() => {
    setIsPaused(statut !== 'en_cours');
    setElapsedSeconds(initialMinutes * 60);
  }, [statut, initialMinutes]);

  useEffect(() => {
    let interval: any = null;
    if (!isPaused && statut === 'en_cours') {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => {
          const nextVal = prev + 1;
          const nextMins = Math.floor(nextVal / 60);

          // Arrêt automatique si le temps limite est atteint
          if (periode === '1ere_mi_temps') {
            const limit = 45 + tempsAdditionnel;
            if (nextMins >= limit) {
              setIsPaused(true);
              if (onPeriodEnd) setTimeout(() => onPeriodEnd(45), 10);
              return limit * 60;
            }
          } else if (periode === '2e_mi_temps') {
            const limit = 90 + tempsAdditionnel;
            if (nextMins >= limit) {
              setIsPaused(true);
              if (onPeriodEnd) setTimeout(() => onPeriodEnd(90), 10);
              return limit * 60;
            }
          } else if (periode === 'prolongation_1') {
            const limit = 90 + dureeProlongation + tempsAdditionnel;
            if (nextMins >= limit) {
              setIsPaused(true);
              if (onPeriodEnd) setTimeout(() => onPeriodEnd(90 + dureeProlongation), 10);
              return limit * 60;
            }
          } else if (periode === 'prolongation_2') {
            const limit = 90 + 2 * dureeProlongation + tempsAdditionnel;
            if (nextMins >= limit) {
              setIsPaused(true);
              if (onPeriodEnd) setTimeout(() => onPeriodEnd(90 + 2 * dureeProlongation), 10);
              return limit * 60;
            }
          }

          return nextVal;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPaused, statut, periode, tempsAdditionnel, dureeProlongation, onPeriodEnd]);

  // Synchronize elapsed time changes to parent component safely
  useEffect(() => {
    const nextMins = Math.floor(elapsedSeconds / 60);
    const nextSecs = elapsedSeconds % 60;
    if (onTimeChangeRef.current) {
      onTimeChangeRef.current(nextMins, nextSecs);
    }
  }, [elapsedSeconds]);

  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;

  const adjustMinutes = (amount: number) => {
    setElapsedSeconds((prev) => Math.max(0, prev + amount * 60));
  };

  const resetTimer = () => {
    setElapsedSeconds(0);
  };

  const formatNumber = (num: number) => num.toString().padStart(2, '0');

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '16px', background: 'rgba(5,46,22,0.85)', borderRadius: '14px',
      border: '1px solid rgba(45,106,79,0.5)', boxShadow: '0 4px 20px rgba(5,46,22,0.3)'
    }}>
      <div style={{ fontSize: '10px', fontWeight: 700, color: '#86efac', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '6px' }}>
        Chronomètre Officiel
      </div>
      
      {/* Timer display */}
      <div style={{
        fontSize: '40px', fontFamily: 'monospace', fontWeight: 900, color: 'white',
        letterSpacing: '4px', background: 'rgba(0,0,0,0.3)', padding: '8px 24px',
        borderRadius: '10px', border: '1px solid rgba(45,106,79,0.4)',
        boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.3)', userSelect: 'none', marginBottom: '10px'
      }}>
        {formatNumber(minutes)}:{formatNumber(seconds)}
      </div>

      {/* Controls */}
      {statut === 'en_cours' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => adjustMinutes(-1)}
            title="Retirer une minute"
            style={{ padding: '6px', background: 'rgba(45,106,79,0.4)', border: '1px solid rgba(45,106,79,0.5)', color: '#86efac', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          >
            <Minus size={14} />
          </button>

          <button
            onClick={() => setIsPaused(!isPaused)}
            title={isPaused ? 'Reprendre' : 'Pause'}
            style={{
              display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 12px',
              fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', borderRadius: '6px',
              border: '1px solid', cursor: 'pointer',
              background: isPaused ? '#d97706' : 'rgba(45,106,79,0.4)',
              borderColor: isPaused ? '#b45309' : 'rgba(45,106,79,0.5)',
              color: isPaused ? 'white' : '#86efac'
            }}
          >
            {isPaused ? <Play size={11} /> : <Pause size={11} />}
            {isPaused ? 'Pause' : 'Actif'}
          </button>

          <button
            onClick={() => adjustMinutes(1)}
            title="Ajouter une minute"
            style={{ padding: '6px', background: 'rgba(45,106,79,0.4)', border: '1px solid rgba(45,106,79,0.5)', color: '#86efac', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          >
            <Plus size={14} />
          </button>

          <button
            onClick={resetTimer}
            title="Réinitialiser"
            style={{ padding: '6px', background: 'rgba(5,46,22,0.6)', border: '1px solid rgba(45,106,79,0.3)', color: 'rgba(134,239,172,0.6)', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', marginLeft: '4px' }}
          >
            <RefreshCw size={13} />
          </button>
        </div>
      )}

      {/* Période active */}
      <div style={{
        marginTop: '8px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase',
        color: '#a3e635', background: 'rgba(163,230,53,0.1)', border: '1px solid rgba(163,230,53,0.25)',
        padding: '3px 10px', borderRadius: '6px', letterSpacing: '0.5px'
      }}>
        {periode === '1ere_mi_temps' && '1ère mi-temps'}
        {periode === 'mi_temps' && 'Mi-temps'}
        {periode === '2e_mi_temps' && '2ème mi-temps'}
        {periode === 'prolongation_1' && 'Prolongation (1ère P.)'}
        {periode === 'prolongation_mi_temps' && 'Mi-temps Prol.'}
        {periode === 'prolongation_2' && 'Prolongation (2ème P.)'}
        {periode === 'tirs_au_but' && 'Séance de Tirs au but'}
        {periode === 'termine' && 'Match Terminé'}
      </div>

      {statut === 'mi_temps' && (
        <div style={{ marginTop: '8px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#fcd34d', background: 'rgba(217,119,6,0.15)', border: '1px solid rgba(217,119,6,0.3)', padding: '4px 12px', borderRadius: '6px', letterSpacing: '0.5px' }}>
          Chrono arrêté (Mi-temps)
        </div>
      )}

      {statut === 'termine' && (
        <div style={{ marginTop: '8px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#9ca3af', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(75,85,99,0.4)', padding: '4px 12px', borderRadius: '6px', letterSpacing: '0.5px' }}>
          Match Terminé
        </div>
      )}
    </div>
  );
};

export default MatchTimer;
