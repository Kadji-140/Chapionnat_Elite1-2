// src/pages/public/JoueurDetailPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getStatsJoueur } from '../../api/statistiques.api';
import type { StatsJoueurResponse } from '../../api/statistiques.api';
import { User, Shield, Award, Calendar, Clock, AlertTriangle, ArrowLeft, Brain, Sparkles, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { getTalentScore, recalculerTalents, type TalentScoreData } from '../../api/ia.api';
import { useAuthStore } from '../../store/authStore';

export const JoueurDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<StatsJoueurResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [talentScore, setTalentScore] = useState<TalentScoreData | null>(null);
  const [isLoadingTalent, setIsLoadingTalent] = useState(true);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (!id) return;
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        const res = await getStatsJoueur(Number(id));
        setData(res);
      } catch (err) {
        console.error(err);
        toast.error('Impossible de charger le profil du joueur.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const fetchTalent = async () => {
      setIsLoadingTalent(true);
      try {
        const res = await getTalentScore(Number(id));
        if (res.success) {
          setTalentScore(res.data);
        }
      } catch (err) {
        console.error("Erreur chargement talent score : ", err);
      } finally {
        setIsLoadingTalent(false);
      }
    };
    fetchTalent();
  }, [id]);

  const handleRecalculate = async () => {
    setIsRecalculating(true);
    const loadToast = toast.loading('Calcul des scores de talent en cours...');
    try {
      const res = await recalculerTalents();
      if (res.success) {
        toast.success('Scores de talent recalculés avec succès !', { id: loadToast });
        const refresh = await getTalentScore(Number(id));
        if (refresh.success) {
          setTalentScore(refresh.data);
        }
      } else {
        toast.error('Erreur lors du recalcul.', { id: loadToast });
      }
    } catch (err) {
      console.error(err);
      toast.error('Erreur de communication avec le serveur.', { id: loadToast });
    } finally {
      setIsRecalculating(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
        <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
          <div style={{ width: '96px', height: '96px', borderRadius: '50%', background: '#e2e8f0', animation: 'pulse-soft 2s ease-in-out infinite' }}></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: '1' }}>
            <div style={{ height: '24px', width: '192px', borderRadius: '4px', background: '#e2e8f0', animation: 'pulse-soft 2s ease-in-out infinite' }}></div>
            <div style={{ height: '16px', width: '128px', borderRadius: '4px', background: '#e2e8f0', animation: 'pulse-soft 2s ease-in-out infinite' }}></div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card" style={{ height: '96px', width: '100%', background: '#e2e8f0', animation: 'pulse-soft 2s ease-in-out infinite' }}></div>
          ))}
        </div>
      </div>
    );
  }

  if (!data || !data.joueur) {
    return (
      <div className="card" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)', maxWidth: '600px', margin: '48px auto 0' }}>
        <AlertTriangle size={48} style={{ color: 'var(--secondary)', margin: '0 auto 16px' }} />
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)', margin: '0 0 8px' }}>Joueur introuvable</h2>
        <p style={{ fontSize: '13px', margin: '0 0 16px' }}>Le joueur demandé n'existe pas ou n'a aucune donnée statistique enregistrée.</p>
        <Link to="/admin/dashboard" className="btn btn-primary btn-sm" style={{ display: 'inline-flex' }}>
          Retour au Dashboard
        </Link>
      </div>
    );
  }

  const { joueur, stats } = data;

  // Aggregate stats across all competitions
  const totalMatchs = stats.reduce((acc, curr) => acc + curr.nb_matchs, 0);
  const totalButs = stats.reduce((acc, curr) => acc + curr.buts, 0);
  const totalPasses = stats.reduce((acc, curr) => acc + curr.passes_decisives, 0);
  const totalJaunes = stats.reduce((acc, curr) => acc + curr.cartons_jaunes, 0);
  const totalRouges = stats.reduce((acc, curr) => acc + curr.cartons_rouges, 0);
  const totalMinutes = stats.reduce((acc, curr) => acc + curr.minutes_jouees, 0);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
      {/* Back button */}
      <div>
        <button
          onClick={() => window.history.back()}
          className="btn btn-ghost btn-sm"
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <ArrowLeft size={14} />
          Retour
        </button>
      </div>

      {/* Profile Card */}
      <div className="card" style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))', color: 'white', border: 'none' }}>
        <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
          {/* Photo */}
          <div style={{ position: 'relative' }}>
            <div style={{ width: '96px', height: '96px', borderRadius: '50%', border: '4px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.1)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-md)' }}>
              {joueur.photo ? (
                <img
                  src={joueur.photo}
                  alt={`${joueur.prenom} ${joueur.nom}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <User size={48} style={{ color: 'rgba(255,255,255,0.5)' }} />
              )}
            </div>
            {joueur.numero !== null && (
              <div style={{ position: 'absolute', bottom: '-8px', right: '-8px', background: 'var(--accent)', color: 'var(--primary-dark)', fontWeight: 900, width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', boxShadow: '0 2px 4px rgba(0,0,0,0.15)', border: '2px solid white' }}>
                N°{joueur.numero}
              </div>
            )}
          </div>

          {/* Details */}
          <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ alignSelf: 'flex-start', background: 'var(--accent)', color: 'var(--primary-dark)', padding: '2px 10px', borderRadius: '9999px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {joueur.poste}
            </div>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 900, letterSpacing: '-0.5px' }}>
              {joueur.prenom} {joueur.nom}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.85)', fontSize: '14px', fontWeight: 500 }}>
              {joueur.club_logo ? (
                <img
                  src={joueur.club_logo}
                  alt={joueur.club_nom}
                  style={{ width: '20px', height: '20px', objectFit: 'contain' }}
                />
              ) : (
                <Shield size={16} style={{ color: 'rgba(255,255,255,0.7)' }} />
              )}
              <span>{joueur.club_nom}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Aggregate Stats Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
        {/* Matchs */}
        <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: '4px' }}>
          <Calendar size={20} style={{ color: 'var(--primary)' }} />
          <span style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text)' }}>{totalMatchs}</span>
          <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Matchs</span>
        </div>

        {/* Buts */}
        <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: '4px' }}>
          <Award size={20} style={{ color: 'var(--accent)' }} />
          <span style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text)' }}>{totalButs}</span>
          <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Buts</span>
        </div>

        {/* Passes */}
        <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: '4px' }}>
          <Award size={20} style={{ color: '#10b981' }} />
          <span style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text)' }}>{totalPasses}</span>
          <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Passes Décs.</span>
        </div>

        {/* Minutes */}
        <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: '4px' }}>
          <Clock size={20} style={{ color: '#3b82f6' }} />
          <span style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text)' }}>{totalMinutes}'</span>
          <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Minutes</span>
        </div>
      </div>

      {/* Discipline Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        <div className="card" style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderLeft: '4px solid var(--accent)', background: 'rgba(255,184,0,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ display: 'inline-block', width: '20px', height: '28px', background: 'var(--accent)', borderRadius: '4px', border: '1px solid var(--accent-dark)' }}></span>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: '13px' }}>Cartons Jaunes</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>1 point disciplinaire</div>
            </div>
          </div>
          <span style={{ fontSize: '24px', fontWeight: 900, color: 'var(--accent-dark)' }}>{totalJaunes}</span>
        </div>

        <div className="card" style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderLeft: '4px solid var(--secondary)', background: 'rgba(200,16,46,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ display: 'inline-block', width: '20px', height: '28px', background: 'var(--secondary)', borderRadius: '4px', border: '1px solid var(--secondary-dark)' }}></span>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: '13px' }}>Cartons Rouges</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>3 points disciplinaires</div>
            </div>
          </div>
          <span style={{ fontSize: '24px', fontWeight: 900, color: 'var(--secondary-dark)' }}>{totalRouges}</span>
        </div>
      </div>

      {/* 🧠 Panel Analyse de Talent IA */}
      <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '12px', flexWrap: 'wrap', gap: '12px' }}>
          <h3 style={{ margin: 0, fontWeight: 800, fontSize: '16px', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Brain size={20} /> Analyse de Talent IA
          </h3>
          {isAdmin && (
            <button
              onClick={handleRecalculate}
              disabled={isRecalculating}
              className="btn btn-ghost btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '4px 10px' }}
            >
              <RefreshCw size={12} className={isRecalculating ? 'animate-spin' : ''} />
              Recalculer globalement
            </button>
          )}
        </div>

        {isLoadingTalent ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="skeleton" style={{ height: '80px', borderRadius: '12px' }} />
            <div className="skeleton" style={{ height: '150px', borderRadius: '12px' }} />
          </div>
        ) : talentScore ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', alignItems: 'center' }}>
            {/* Global Score Gauge */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', background: '#F8FAFC', borderRadius: '20px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
              <div style={{ position: 'relative', width: '120px', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                <svg style={{ transform: 'rotate(-90deg)', width: '120px', height: '120px' }}>
                  <circle cx="60" cy="60" r="50" fill="transparent" stroke="#E2E8F0" strokeWidth="10" />
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="transparent"
                    stroke="var(--primary)"
                    strokeWidth="10"
                    strokeDasharray={2 * Math.PI * 50}
                    strokeDashoffset={2 * Math.PI * 50 * (1 - talentScore.talent_score / 100)}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
                  />
                </svg>
                <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontSize: '28px', fontWeight: 900, color: 'var(--primary-dark)' }}>{talentScore.talent_score}</span>
                  <span style={{ fontSize: '9px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Score</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text)' }}>Niveau : {talentScore.niveau}</span>
                {talentScore.recommande_recrutement ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#D8F3DC', color: '#2D6A4F', padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', alignSelf: 'center', marginTop: '6px' }}>
                    <Sparkles size={12} /> Recrutement Recommandé
                  </span>
                ) : (
                  <span style={{ fontSize: '12px', color: '#64748B', fontStyle: 'italic' }}>Potentiel standard</span>
                )}
              </div>
            </div>

            {/* Skills Sub-Scores */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <h4 style={{ margin: '0 0 4px', fontWeight: 700, fontSize: '13px', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Caractéristiques du joueur
              </h4>
              
              {/* Offensif */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text)' }}>Attaque & Création</span>
                  <span style={{ color: 'var(--primary)' }}>{talentScore.details?.score_offensive}/100</span>
                </div>
                <div style={{ height: '6px', background: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${talentScore.details?.score_offensive || 0}%`, height: '100%', background: 'var(--primary)', borderRadius: '3px' }} />
                </div>
              </div>

              {/* Défensif */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text)' }}>Solidité Défensive</span>
                  <span style={{ color: '#3B82F6' }}>{talentScore.details?.score_defensive}/100</span>
                </div>
                <div style={{ height: '6px', background: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${talentScore.details?.score_defensive || 0}%`, height: '100%', background: '#3B82F6', borderRadius: '3px' }} />
                </div>
              </div>

              {/* Discipline */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text)' }}>Discipline Tactique</span>
                  <span style={{ color: '#10B981' }}>{talentScore.details?.score_discipline}/100</span>
                </div>
                <div style={{ height: '6px', background: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${talentScore.details?.score_discipline || 0}%`, height: '100%', background: '#10B981', borderRadius: '3px' }} />
                </div>
              </div>

              {/* Régularité */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text)' }}>Régularité & Temps de jeu</span>
                  <span style={{ color: '#F59E0B' }}>{talentScore.details?.score_regularite}/100</span>
                </div>
                <div style={{ height: '6px', background: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${talentScore.details?.score_regularite || 0}%`, height: '100%', background: '#F59E0B', borderRadius: '3px' }} />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ fontSize: '12px', color: '#64748B', fontStyle: 'italic', textAlign: 'center', padding: '16px' }}>
            Données de performance insuffisantes pour calculer le score de talent IA.
          </div>
        )}
      </div>

      {/* Breakdown per Competition */}
      <div className="card">
        <div style={{ borderBottom: '1px solid var(--border)', padding: '16px 20px', background: 'var(--bg)' }}>
          <h3 style={{ margin: 0, fontWeight: 700, fontSize: '14px', color: 'var(--text)' }}>
            Détails des performances par compétition
          </h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Compétition</th>
                <th style={{ width: '80px', textAlign: 'center' }}>Matchs</th>
                <th style={{ width: '80px', textAlign: 'center' }}>Buts</th>
                <th style={{ width: '80px', textAlign: 'center' }}>Passes</th>
                <th style={{ width: '80px', textAlign: 'center' }}>Jaunes</th>
                <th style={{ width: '80px', textAlign: 'center' }}>Rouges</th>
                <th style={{ width: '96px', textAlign: 'center' }}>Minutes</th>
              </tr>
            </thead>
            <tbody>
              {stats.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                    Aucune participation enregistrée.
                  </td>
                </tr>
              ) : (
                stats.map((s) => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text)' }}>
                      {s.competition?.nom || 'Championnat Pro'}
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 500 }}>{s.nb_matchs}</td>
                    <td style={{ textAlign: 'center', color: 'var(--accent-dark)', fontWeight: 700 }}>{s.buts}</td>
                    <td style={{ textAlign: 'center', color: '#059669', fontWeight: 700 }}>{s.passes_decisives}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="badge" style={{ background: 'var(--accent-50)', color: 'var(--accent-dark)', border: '1px solid var(--accent-light)', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 700 }}>
                        {s.cartons_jaunes}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="badge" style={{ background: 'var(--secondary-50)', color: 'var(--secondary)', border: '1px solid var(--secondary-light)', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 700 }}>
                        {s.cartons_rouges}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center', color: 'var(--text-muted)', fontWeight: 500 }}>{s.minutes_jouees}'</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

