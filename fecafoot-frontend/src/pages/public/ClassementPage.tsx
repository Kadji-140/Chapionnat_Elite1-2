// src/pages/public/ClassementPage.tsx
import React, { useState, useEffect } from 'react';
import { getSharedSaisons, getSharedCompetitions, getSharedPhases, getSharedPoules } from '../../api/saisons.api';
import type { Saison, Competition, Phase, Poule } from '../../api/saisons.api';
import { getClassementPoule, getHistoriqueClub } from '../../api/classement.api';
import type { ClassementEntry } from '../../api/classement.api';
import { ClassementTable } from '../../components/classement/ClassementTable';
import { EvolutionGraph } from '../../components/classement/EvolutionGraph';
import { TrendingUp, BarChart2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from '../../hooks/useTranslation';

export const ClassementPage: React.FC = () => {
  const { lang } = useTranslation();
  const isEn = lang === 'en';

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
          // Auto-select active season if available
          const active = res.data.find((s: Saison) => s.statut === 'en_cours');
          if (active) setSelectedSeason(active.id);
          else if (res.data.length > 0) setSelectedSeason(res.data[0].id);
        }
      } catch (err) {
        console.error(err);
        toast.error(isEn ? 'Unable to load seasons.' : 'Impossible de charger les saisons.');
      }
    };
    loadSeasons();
  }, [isEn]);

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
        toast.error(isEn ? 'Unable to load competitions.' : 'Impossible de charger les compétitions.');
      }
    };
    loadCompetitions();
  }, [selectedSeason, isEn]);

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
            // Prefer regular phase or just the first one
            const reg = res.data.find((p: Phase) => p.type === 'reguliere');
            setSelectedPhase(reg ? reg.id : res.data[0].id);
          }
        }
      } catch (err) {
        console.error(err);
        toast.error(isEn ? 'Unable to load phases.' : 'Impossible de charger les phases.');
      }
    };
    loadPhases();
  }, [selectedCompetition, isEn]);

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
        toast.error(isEn ? 'Unable to load groups.' : 'Impossible de charger les poules.');
      }
    };
    loadPoules();
  }, [selectedPhase, isEn]);

  // Load Classement when Poule changes
  useEffect(() => {
    if (!selectedPoule) {
      setClassement([]);
      setSelectedClubId(null);
      setHistoriqueData(null);
      return;
    }
    const loadClassement = async () => {
      setIsLoadingClassement(true);
      setSelectedClubId(null);
      setHistoriqueData(null);
      try {
        const res = await getClassementPoule(Number(selectedPoule));
        if (res.success && res.data) {
          setClassement(res.data);
          // Auto select the first club in the list for the evolution graph
          if (res.data.length > 0) {
            setSelectedClubId(res.data[0].club_id);
            setSelectedClubNom(res.data[0].club?.nom || 'Club');
          }
        }
      } catch (err) {
        console.error(err);
        toast.error(isEn ? 'Error calculating standings.' : 'Erreur lors du calcul du classement.');
      } finally {
        setIsLoadingClassement(false);
      }
    };
    loadClassement();
  }, [selectedPoule, isEn]);

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

  return (
    <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Title block */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BarChart2 size={24} style={{ color: 'var(--primary)' }} />
            {isEn ? 'Official Standings' : 'Classements Officiels'}
          </h1>
          <p className="page-subtitle">
            {isEn 
              ? 'Consult the results of the regular phase, playoffs and the evolution of clubs matchday by matchday.'
              : "Consultez les résultats de la phase régulière, des playoffs et l'évolution des clubs journée par journée."}
          </p>
        </div>
      </div>

      {/* Filters Card */}
      <div className="card" style={{ padding: '20px' }}>
        <h2 className="form-label" style={{ fontSize: '13px', textTransform: 'uppercase', color: 'var(--primary)', marginBottom: '16px' }}>
          {isEn ? 'Search Filters' : 'Filtres de recherche'}
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          {/* Season */}
          <div className="form-group">
            <label className="form-label">{isEn ? 'Season' : 'Saison'}</label>
            <select
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(Number(e.target.value))}
              className="form-select"
            >
              <option value="">{isEn ? '-- Select Season --' : '-- Sélectionner Saison --'}</option>
              {seasons.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.intitule} {s.statut === 'en_cours' ? (isEn ? '(Current)' : '(En cours)') : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Competition */}
          <div className="form-group">
            <label className="form-label">{isEn ? 'Competition' : 'Compétition'}</label>
            <select
              value={selectedCompetition}
              onChange={(e) => setSelectedCompetition(Number(e.target.value))}
              disabled={competitions.length === 0}
              className="form-select"
            >
              <option value="">{isEn ? '-- Select Competition --' : '-- Sélectionner Compétition --'}</option>
              {competitions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nom}
                </option>
              ))}
            </select>
          </div>

          {/* Phase */}
          <div className="form-group">
            <label className="form-label">{isEn ? 'Phase' : 'Phase'}</label>
            <select
              value={selectedPhase}
              onChange={(e) => setSelectedPhase(Number(e.target.value))}
              disabled={phases.length === 0}
              className="form-select"
            >
              <option value="">{isEn ? '-- Select Phase --' : '-- Sélectionner Phase --'}</option>
              {phases.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nom} ({p.type_label})
                </option>
              ))}
            </select>
          </div>

          {/* Poule */}
          <div className="form-group">
            <label className="form-label">{isEn ? 'Group' : 'Poule'}</label>
            <select
              value={selectedPoule}
              onChange={(e) => setSelectedPoule(Number(e.target.value))}
              disabled={poules.length === 0}
              className="form-select"
            >
              <option value="">{isEn ? '-- Select Group --' : '-- Sélectionner Poule --'}</option>
              {poules.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nom} ({p.nb_clubs_affectes} {isEn ? 'clubs' : 'clubs'})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'flex-start' }}>
        {/* Table Column */}
        <div style={{ flex: '2 1 600px', minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <ClassementTable
            classement={classement}
            isLoading={isLoadingClassement}
            isGele={false}
            isAdmin={false}
          />
        </div>

        {/* Sidebar / Evolution Chart Column */}
        <div style={{ flex: '1 1 300px', minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {classement.length > 0 && (
            <div className="card" style={{ padding: '16px' }}>
              <label className="form-label" style={{ marginBottom: '8px' }}>
                {isEn ? 'Choose a club for evolution:' : "Choisir un club pour l'évolution :"}
              </label>
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
                <span>{isEn ? 'Campaign Statistics' : 'Statistiques de parcours'}</span>
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', textAlign: 'center' }}>
                <div style={{ background: 'var(--bg)', padding: '12px 8px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    {isEn ? 'Best' : 'Meilleur'}
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 900, color: '#16a34a', marginTop: '4px' }}>
                    #{historiqueData.meilleur || '-'}
                  </div>
                </div>
                <div style={{ background: 'var(--bg)', padding: '12px 8px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    {isEn ? 'Worst' : 'Pire'}
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 900, color: '#dc2626', marginTop: '4px' }}>
                    #{historiqueData.pire || '-'}
                  </div>
                </div>
                <div style={{ background: 'var(--bg)', padding: '12px 8px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    {isEn ? 'Matchdays Lead' : 'Journées Tête'}
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 900, color: '#eab308', marginTop: '4px' }}>
                    {historiqueData.en_tete}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClassementPage;
