// src/pages/admin/PlayoffsPage.tsx
import React, { useState, useEffect } from 'react';
import { getSharedSaisons, getSharedCompetitions } from '../../api/saisons.api';
import type { Saison, Competition } from '../../api/saisons.api';
import { getStatutPlayoffs, getClubsQualifiesPlayoffs, genererPlayoffs, getPromotionsRelegations } from '../../api/classement.api';
import type { PlayoffStatus, ClubQualifiePlayoff, PromotionsRelegationsResponse } from '../../api/classement.api';
import { Award, RefreshCw, AlertCircle, Shield, TrendingUp, TrendingDown, CheckCircle, HelpCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export const PlayoffsPage: React.FC = () => {
  const [seasons, setSeasons] = useState<Saison[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<number | ''>('');
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [selectedCompetition, setSelectedCompetition] = useState<number | ''>('');

  // Status and qualifiers
  const [playoffStatus, setPlayoffStatus] = useState<PlayoffStatus | null>(null);
  const [qualifiesUp, setQualifiesUp] = useState<ClubQualifiePlayoff[]>([]);
  const [qualifiesDown, setQualifiesDown] = useState<ClubQualifiePlayoff[]>([]);
  const [promotionsRelegations, setPromotionsRelegations] = useState<PromotionsRelegationsResponse | null>(null);

  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [isLoadingBilan, setIsLoadingBilan] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Load Seasons on mount
  useEffect(() => {
    const loadSeasons = async () => {
      try {
        const res = await getSharedSaisons();
        if (res.success && res.data) {
          setSeasons(res.data);
          const active = res.data.find((s: Saison) => s.statut === 'en_cours');
          if (active) setSelectedSeason(active.id);
          else if (res.data.length > 0) setSelectedSeason(res.data[0].id);
        }
      } catch (err) {
        console.error(err);
        toast.error('Impossible de charger les saisons.');
      }
    };
    loadSeasons();
  }, []);

  // Load Competitions when season changes
  useEffect(() => {
    if (!selectedSeason) {
      setCompetitions([]);
      setSelectedCompetition('');
      setPromotionsRelegations(null);
      return;
    }
    const loadCompetitions = async () => {
      try {
        const res = await getSharedCompetitions(selectedSeason);
        if (res.success && res.data) {
          setCompetitions(res.data);
          if (res.data.length > 0) setSelectedCompetition(res.data[0].id);
        }
      } catch (err) {
        console.error(err);
        toast.error('Impossible de charger les compétitions.');
      }
    };
    const loadBilan = async () => {
      setIsLoadingBilan(true);
      try {
        const res = await getPromotionsRelegations(Number(selectedSeason));
        if (res.success) {
          setPromotionsRelegations(res);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoadingBilan(false);
      }
    };
    loadCompetitions();
    loadBilan();
  }, [selectedSeason]);

  // Load Playoff details when competition changes
  const loadPlayoffDetails = async () => {
    if (!selectedCompetition) {
      setPlayoffStatus(null);
      setQualifiesUp([]);
      setQualifiesDown([]);
      return;
    }
    setIsLoadingStatus(true);
    try {
      const statusRes = await getStatutPlayoffs(Number(selectedCompetition));
      if (statusRes.success) {
        setPlayoffStatus(statusRes.data);
      }

      const qualifiesRes = await getClubsQualifiesPlayoffs(Number(selectedCompetition));
      if (qualifiesRes.success) {
        setQualifiesUp(qualifiesRes.qualifies_up);
        setQualifiesDown(qualifiesRes.qualifies_down);
      }
    } catch (err: any) {
      console.error(err);
      setPlayoffStatus(null);
    } finally {
      setIsLoadingStatus(false);
    }
  };

  useEffect(() => {
    loadPlayoffDetails();
  }, [selectedCompetition]);

  // Generate Playoffs phases & matches
  const handleGenererPlayoffs = async () => {
    if (!selectedCompetition) return;
    setIsGenerating(true);
    try {
      const res = await genererPlayoffs(Number(selectedCompetition));
      if (res.success) {
        toast.success(res.message);
        await loadPlayoffDetails();
        // Refresh season promotions/relegations
        if (selectedSeason) {
          const prRes = await getPromotionsRelegations(Number(selectedSeason));
          if (prRes.success) setPromotionsRelegations(prRes);
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur lors de la génération.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Title */}
      <div className="page-header">
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Award size={24} style={{ color: 'var(--primary)' }} />
          Phases de Playoffs & Bilan de Saison
        </h1>
        <p className="page-subtitle">
          Générez les mini-championnats de playoffs Elite UP / DOWN et visualisez le tableau final des promus/relégués.
        </p>
      </div>

      {/* Selectors */}
      <div className="card" style={{ padding: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          {/* Season Selector */}
          <div className="form-group">
            <label className="form-label">Saison active</label>
            <select
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(Number(e.target.value))}
              className="form-select text-base font-semibold"
            >
              <option value="">-- Sélectionner Saison --</option>
              {seasons.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.intitule} {s.statut === 'en_cours' ? '(Active)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Competition Selector */}
          <div className="form-group">
            <label className="form-label">Compétition</label>
            <select
              value={selectedCompetition}
              onChange={(e) => setSelectedCompetition(Number(e.target.value))}
              disabled={competitions.length === 0}
              className="form-select text-base font-semibold"
            >
              <option value="">-- Sélectionner Compétition --</option>
              {competitions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nom} ({c.niveau_label})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {isLoadingStatus ? (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px', gap: '12px' }}>
          <RefreshCw className="animate-spin" size={32} style={{ color: 'var(--primary)' }} />
          <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-muted)' }}>Chargement des données de playoffs...</span>
        </div>
      ) : selectedCompetition && playoffStatus ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px', alignItems: 'start' }}>
          {/* Configuration & Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ margin: 0, paddingBottom: '8px', borderBottom: '1px solid var(--border)', fontSize: '14px', fontWeight: 800, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <HelpCircle size={16} style={{ color: 'var(--primary)' }} />
                Configuration Playoffs
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Playoffs Activés :</span>
                  <span style={{ fontWeight: 'bold', color: '#15803d' }}>Oui</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Clubs qualifiés UP :</span>
                  <span style={{ fontWeight: 'bold', color: 'var(--text)' }}>{playoffStatus.nb_clubs_playoffs_up} clubs</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Clubs qualifiés DOWN :</span>
                  <span style={{ fontWeight: 'bold', color: 'var(--text)' }}>{playoffStatus.nb_clubs_playoffs_down} clubs</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Report des points :</span>
                  <span style={{ fontWeight: 'bold', color: 'var(--text)' }}>
                    {playoffStatus.points_reportes_playoffs ? 'Oui (Phase Reg.)' : 'Non (Remise à zéro)'}
                  </span>
                </div>
              </div>

              {/* Status Indicator */}
              <div>
                {playoffStatus.playoffs_up_generes ? (
                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', padding: '16px', borderRadius: '12px', display: 'flex', alignItems: 'start', gap: '8px', fontSize: '12px' }}>
                    <CheckCircle size={16} style={{ color: '#15803d', flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <span style={{ fontWeight: 'bold' }}>Playoffs Générés</span>
                      <p style={{ margin: '4px 0 0' }}>Les mini-championnats UP et DOWN ont déjà été créés. Le calendrier est actif.</p>
                    </div>
                  </div>
                ) : (
                  <div style={{ background: '#fffbeb', border: '1px solid #fde68a', color: '#b45309', padding: '16px', borderRadius: '12px', display: 'flex', alignItems: 'start', gap: '8px', fontSize: '12px' }}>
                    <AlertCircle size={16} style={{ color: '#b45309', flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <span style={{ fontWeight: 'bold' }}>Prêt pour Génération</span>
                      <p style={{ margin: '4px 0 0' }}>La phase régulière est terminée. Vous pouvez lancer le tirage des playoffs.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Generation Action Button */}
              {!playoffStatus.playoffs_up_generes && (
                <button
                  onClick={handleGenererPlayoffs}
                  disabled={isGenerating}
                  className="btn btn-primary"
                  style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                >
                  <RefreshCw size={16} className={isGenerating ? 'animate-spin' : ''} />
                  Générer les Playoffs
                </button>
              )}
            </div>

            {/* Promotions / Relégations Card */}
            {isLoadingBilan ? (
              <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <RefreshCw className="animate-spin" size={24} style={{ color: 'var(--primary)' }} />
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Calcul du bilan final...</span>
              </div>
            ) : promotionsRelegations && (
              <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3 style={{ margin: 0, paddingBottom: '8px', borderBottom: '1px solid var(--border)', fontSize: '14px', fontWeight: 800, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Award size={16} style={{ color: '#d97706' }} />
                  Tableau Final - {promotionsRelegations.saison}
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Promus */}
                  <div>
                    <h4 style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: 700, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <TrendingUp size={14} />
                      Promus en division supérieure
                    </h4>
                    {promotionsRelegations.promus.length === 0 ? (
                      <p style={{ fontSize: '12px', color: 'var(--text-light)', fontStyle: 'italic', margin: 0 }}>Aucun club promu identifié.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {promotionsRelegations.promus.map((p) => (
                          <div key={p.club_id} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f0fdf4', padding: '8px 12px', borderRadius: '8px', border: '1px solid #dcfce7', fontSize: '12px' }}>
                            {p.club_logo && <img src={p.club_logo} alt={p.club_nom} style={{ width: '20px', height: '20px', objectFit: 'contain' }} />}
                            <span style={{ fontWeight: 'bold', color: 'var(--text)' }}>{p.club_nom}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Relégués */}
                  <div>
                    <h4 style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: 700, color: '#b91c1c', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <TrendingDown size={14} />
                      Relégués en division inférieure
                    </h4>
                    {promotionsRelegations.relegues.length === 0 ? (
                      <p style={{ fontSize: '12px', color: 'var(--text-light)', fontStyle: 'italic', margin: 0 }}>Aucun club relégué identifié.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {promotionsRelegations.relegues.map((r) => (
                          <div key={r.club_id} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fef2f2', padding: '8px 12px', borderRadius: '8px', border: '1px solid #fee2e2', fontSize: '12px' }}>
                            {r.club_logo && <img src={r.club_logo} alt={r.club_nom} style={{ width: '20px', height: '20px', objectFit: 'contain' }} />}
                            <span style={{ fontWeight: 'bold', color: 'var(--text)' }}>{r.club_nom}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Qualified Teams List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Playoff UP qualified */}
            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ borderBottom: '1px solid var(--border)', padding: '16px', background: 'rgba(21,128,61,0.05)' }}>
                <h3 style={{ margin: 0, fontWeight: 700, fontSize: '14px', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <TrendingUp size={16} style={{ color: '#15803d' }} />
                  Clubs Qualifiés : Playoffs UP (Course au titre)
                </h3>
              </div>
              <div style={{ padding: '16px' }}>
                {qualifiesUp.length === 0 ? (
                  <p style={{ textAlign: 'center', padding: '24px 0', fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
                    Aucun qualifié pour le moment. La phase régulière doit être terminée.
                  </p>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                    {qualifiesUp.map((c) => (
                      <div
                        key={c.club_id}
                        style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(21,128,61,0.03)', border: '1px solid rgba(21,128,61,0.08)', padding: '12px', borderRadius: '12px' }}
                      >
                        {c.club_logo ? (
                          <img src={c.club_logo} alt={c.club_nom} style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
                        ) : (
                          <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyItems: 'center', border: '1px solid #e2e8f0' }}>
                            <Shield size={20} style={{ color: '#94a3b8', margin: 'auto' }} />
                          </div>
                        )}
                        <div>
                          <div style={{ fontWeight: 'bold', color: 'var(--text)', fontSize: '14px' }}>{c.club_nom}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, marginTop: '2px' }}>
                            {c.poule} • Position : #{c.position}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Playoff DOWN qualified */}
            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ borderBottom: '1px solid var(--border)', padding: '16px', background: 'rgba(185,28,28,0.05)' }}>
                <h3 style={{ margin: 0, fontWeight: 700, fontSize: '14px', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <TrendingDown size={16} style={{ color: '#b91c1c' }} />
                  Clubs Qualifiés : Playoffs DOWN (Lutte pour le maintien)
                </h3>
              </div>
              <div style={{ padding: '16px' }}>
                {qualifiesDown.length === 0 ? (
                  <p style={{ textAlign: 'center', padding: '24px 0', fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
                    Aucun qualifié pour le maintien pour le moment.
                  </p>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                    {qualifiesDown.map((c) => (
                      <div
                        key={c.club_id}
                        style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(185,28,28,0.03)', border: '1px solid rgba(185,28,28,0.08)', padding: '12px', borderRadius: '12px' }}
                      >
                        {c.club_logo ? (
                          <img src={c.club_logo} alt={c.club_nom} style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
                        ) : (
                          <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyItems: 'center', border: '1px solid #e2e8f0' }}>
                            <Shield size={20} style={{ color: '#94a3b8', margin: 'auto' }} />
                          </div>
                        )}
                        <div>
                          <div style={{ fontWeight: 'bold', color: 'var(--text)', fontSize: '14px' }}>{c.club_nom}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, marginTop: '2px' }}>
                            {c.poule} • Position : #{c.position}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto' }}>
          <AlertCircle size={48} style={{ color: 'var(--text-light)', opacity: 0.5, margin: '0 auto 12px' }} />
          <h3 style={{ margin: '0 0 4px', color: 'var(--text)', fontWeight: 700 }}>Aucune compétition sélectionnée</h3>
          <p style={{ fontSize: '13px', margin: 0 }}>Choisissez une saison active et une compétition pour afficher les détails des playoffs.</p>
        </div>
      )}
    </div>
  );
};
