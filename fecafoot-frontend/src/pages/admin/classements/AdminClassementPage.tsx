// src/pages/admin/AdminClassementPage.tsx
import React, { useState, useEffect } from 'react';
import { getSharedSaisons, getSharedCompetitions, getSharedPhases, getSharedPoules } from '../../../api/saisons.api';
import type { Saison, Competition, Phase, Poule } from '../../../api/saisons.api';
import { getClassementPoule, recalculerPoule, toggleGelPoule, getHistoriqueClub } from '../../../api/classement.api';
import type { ClassementEntry } from '../../../api/classement.api';
import { recalculerStats } from '../../../api/statistiques.api';
import { ClassementTable } from '../../../components/classement/ClassementTable';
import { EvolutionGraph } from '../../../components/classement/EvolutionGraph';
import { Shield, RefreshCw, AlertCircle, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';

export const AdminClassementPage: React.FC = () => {
  const [seasons, setSeasons] = useState<Saison[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<number | ''>('');
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [selectedCompetition, setSelectedCompetition] = useState<number | ''>('');
  const [phases, setPhases] = useState<Phase[]>([]);
  const [selectedPhase, setSelectedPhase] = useState<number | ''>('');
  const [poules, setPoules] = useState<Poule[]>([]);
  const [selectedPoule, setSelectedPoule] = useState<number | ''>('');

  const [classement, setClassement] = useState<ClassementEntry[]>([]);
  const [isLoadingClassement, setIsLoadingClassement] = useState(false);
  const [isGele, setIsGele] = useState(false);
  const [isGlobalLoading, setIsGlobalLoading] = useState(false);

  // Historical chart state
  const [selectedClubId, setSelectedClubId] = useState<number | null>(null);
  const [selectedClubNom, setSelectedClubNom] = useState<string>('');
  const [historiqueData, setHistoriqueData] = useState<any>(null);
  const [isLoadingHistorique, setIsLoadingHistorique] = useState(false);

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
    loadCompetitions();
  }, [selectedSeason]);

  // Load Phases when competition changes
  useEffect(() => {
    if (!selectedCompetition) {
      setPhases([]);
      setSelectedPhase('');
      return;
    }
    const loadPhases = async () => {
      try {
        const res = await getSharedPhases(selectedCompetition);
        if (res.success && res.data) {
          setPhases(res.data);
          if (res.data.length > 0) {
            const reg = res.data.find((p: Phase) => p.type === 'reguliere');
            setSelectedPhase(reg ? reg.id : res.data[0].id);
          }
        }
      } catch (err) {
        console.error(err);
        toast.error('Impossible de charger les phases.');
      }
    };
    loadPhases();
  }, [selectedCompetition]);

  // Load Poules when phase changes
  useEffect(() => {
    if (!selectedPhase) {
      setPoules([]);
      setSelectedPoule('');
      return;
    }
    const loadPoules = async () => {
      try {
        const res = await getSharedPoules(selectedPhase);
        if (res.success && res.data) {
          setPoules(res.data);
          if (res.data.length > 0) setSelectedPoule(res.data[0].id);
        }
      } catch (err) {
        console.error(err);
        toast.error('Impossible de charger les poules.');
      }
    };
    loadPoules();
  }, [selectedPhase]);

  // Fetch Classement when selected Poule changes
  const loadClassement = async () => {
    if (!selectedPoule) return;
    setIsLoadingClassement(true);
    try {
      const res = await getClassementPoule(Number(selectedPoule));
      if (res.success && res.data) {
        setClassement(res.data);
        if (res.data.length > 0) {
          setSelectedClubId(res.data[0].club_id);
          setSelectedClubNom(res.data[0].club?.nom || 'Club');
        }
      }
      
      // Determine freeze status from current Poule details
      const activePoule = poules.find(p => p.id === Number(selectedPoule));
      // In the backend schema, Poule contains classement_gele.
      // Since it might not be directly in the search details, we will trust the api response or the active poule item
      if (activePoule) {
        setIsGele((activePoule as any).classement_gele || false);
      }
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors du calcul du classement.');
    } finally {
      setIsLoadingClassement(false);
    }
  };

  useEffect(() => {
    if (!selectedPoule) {
      setClassement([]);
      setSelectedClubId(null);
      setHistoriqueData(null);
      return;
    }
    loadClassement();
  }, [selectedPoule, poules]);

  // Load history when selected club changes
  useEffect(() => {
    if (!selectedClubId) {
      setHistoriqueData(null);
      return;
    }
    const loadHistorique = async () => {
      setIsLoadingHistorique(true);
      try {
        const res = await getHistoriqueClub(selectedClubId);
        if (res.success && res.data) {
          setHistoriqueData(res.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoadingHistorique(false);
      }
    };
    loadHistorique();
  }, [selectedClubId]);

  // Recalculate standings for active Poule
  const handleRecalculerPoule = async () => {
    if (!selectedPoule) return;
    try {
      const res = await recalculerPoule(Number(selectedPoule));
      if (res.success) {
        toast.success(res.message);
        await loadClassement();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur lors du recalcul.');
    }
  };

  // Toggle freeze status for active Poule
  const handleToggleGelPoule = async () => {
    if (!selectedPoule) return;
    try {
      const res = await toggleGelPoule(Number(selectedPoule));
      if (res.success) {
        toast.success(res.message);
        setIsGele(res.gele);
        // Update poules list in state so local dropdown keeps status synchronized
        setPoules(prev =>
          prev.map(p => (p.id === Number(selectedPoule) ? { ...p, classement_gele: res.gele } : p))
        );
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur lors de la modification de l\'état.');
    }
  };

  // Recalculate stats for the active Competition
  const handleRecalculerStatsCompetition = async () => {
    if (!selectedCompetition) return;
    setIsGlobalLoading(true);
    try {
      const res = await recalculerStats(Number(selectedCompetition));
      if (res.success) {
        toast.success(res.message);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur lors du recalcul des stats.');
    } finally {
      setIsGlobalLoading(false);
    }
  };  return (
    <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Title block */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Shield size={24} style={{ color: 'var(--primary)' }} />
            Gestion des Classements & Stats
          </h1>
          <p className="page-subtitle">
            Gérez les points, forcez les recalculs globaux, figez les poules et mettez à jour les statistiques de joueurs.
          </p>
        </div>

        {selectedCompetition && (
          <button
            onClick={handleRecalculerStatsCompetition}
            disabled={isGlobalLoading}
            className="btn btn-primary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={14} className={isGlobalLoading ? 'animate-spin' : ''} />
            Recalculer Stats Joueurs
          </button>
        )}
      </div>

      {/* Filters Card */}
      <div className="card" style={{ padding: '20px' }}>
        <h2 className="form-label" style={{ fontSize: '13px', textTransform: 'uppercase', color: 'var(--primary)', marginBottom: '16px' }}>
          Sélectionner la poule à gérer
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          {/* Season */}
          <div className="form-group">
            <label className="form-label">Saison</label>
            <select
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(Number(e.target.value))}
              className="form-select"
            >
              <option value="">-- Sélectionner Saison --</option>
              {seasons.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.intitule}
                </option>
              ))}
            </select>
          </div>

          {/* Competition */}
          <div className="form-group">
            <label className="form-label">Compétition</label>
            <select
              value={selectedCompetition}
              onChange={(e) => setSelectedCompetition(Number(e.target.value))}
              disabled={competitions.length === 0}
              className="form-select"
            >
              <option value="">-- Sélectionner Compétition --</option>
              {competitions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nom}
                </option>
              ))}
            </select>
          </div>

          {/* Phase */}
          <div className="form-group">
            <label className="form-label">Phase</label>
            <select
              value={selectedPhase}
              onChange={(e) => setSelectedPhase(Number(e.target.value))}
              disabled={phases.length === 0}
              className="form-select"
            >
              <option value="">-- Sélectionner Phase --</option>
              {phases.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nom}
                </option>
              ))}
            </select>
          </div>

          {/* Poule */}
          <div className="form-group">
            <label className="form-label">Poule</label>
            <select
              value={selectedPoule}
              onChange={(e) => setSelectedPoule(Number(e.target.value))}
              disabled={poules.length === 0}
              className="form-select"
            >
              <option value="">-- Sélectionner Poule --</option>
              {poules.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nom} {(p as any).classement_gele ? '🔒' : '🔓'}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main standings layout */}
      {selectedPoule ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'flex-start', width: '100%' }}>
          {/* Table Column */}
          <div style={{ flex: '2 1 600px', minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <ClassementTable
              classement={classement}
              isLoading={isLoadingClassement}
              isGele={isGele}
              isAdmin={true}
              onRecalculer={handleRecalculerPoule}
              onToggleGel={handleToggleGelPoule}
            />
          </div>

          {/* Sidebar / Evolution Chart Column */}
          <div style={{ flex: '1 1 300px', minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {classement.length > 0 && (
              <div className="card" style={{ padding: '16px' }}>
                <label className="form-label" style={{ marginBottom: '8px' }}>Choisir un club pour l'évolution :</label>
                <select
                  value={selectedClubId || ''}
                  onChange={(e) => {
                    const id = Number(e.target.value);
                    setSelectedClubId(id);
                    const club = classement.find(c => c.club_id === id);
                    if (club) setSelectedClubNom(club.club?.nom || 'Club');
                  }}
                  className="form-select"
                >
                  {classement.map((entry) => (
                    <option key={entry.club_id} value={entry.club_id}>
                      {entry.position}. {entry.club?.nom || 'Club Inconnu'}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {selectedClubId && historiqueData && (
              <EvolutionGraph
                historique={historiqueData.historique}
                isLoading={isLoadingHistorique}
                clubNom={selectedClubNom}
              />
            )}

            {historiqueData && !isLoadingHistorique && (
              <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3 className="form-label" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', margin: 0 }}>
                  <TrendingUp size={16} style={{ color: 'var(--primary)' }} />
                  <span>Statistiques de parcours</span>
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', textAlign: 'center' }}>
                  <div style={{ background: 'var(--bg)', padding: '12px 8px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Meilleur</div>
                    <div style={{ fontSize: '18px', fontWeight: 900, color: '#16a34a', marginTop: '4px' }}>
                      #{historiqueData.meilleur || '-'}
                    </div>
                  </div>
                  <div style={{ background: 'var(--bg)', padding: '12px 8px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Pire</div>
                    <div style={{ fontSize: '18px', fontWeight: 900, color: '#dc2626', marginTop: '4px' }}>
                      #{historiqueData.pire || '-'}
                    </div>
                  </div>
                  <div style={{ background: 'var(--bg)', padding: '12px 8px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Journées Tête</div>
                    <div style={{ fontSize: '18px', fontWeight: 900, color: '#eab308', marginTop: '4px' }}>
                      {historiqueData.en_tete}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <AlertCircle size={48} style={{ color: 'var(--text-light)', opacity: 0.5, margin: '0 auto 12px' }} />
          <h3 style={{ margin: '0 0 4px', color: 'var(--text)', fontWeight: 700 }}>Aucune poule sélectionnée</h3>
          <p style={{ fontSize: '13px', margin: 0 }}>Sélectionnez une saison, une compétition et une phase ci-dessus pour gérer son classement.</p>
        </div>
      )}
    </div>
  );
};
