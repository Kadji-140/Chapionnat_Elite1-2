// src/pages/public/StatistiquesPasseursPage.tsx
import React, { useState, useEffect } from 'react';
import { getSharedSaisons, getSharedCompetitions } from '../../api/saisons.api';
import type { Saison, Competition } from '../../api/saisons.api';
import { getTopPasseurs } from '../../api/statistiques.api';
import type { StatJoueur } from '../../api/statistiques.api';
import { TopScorersList } from '../../components/classement/TopScorersList';
import { Award, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from '../../hooks/useTranslation';

export const StatistiquesPasseursPage: React.FC = () => {
  const { lang } = useTranslation();
  const isEn = lang === 'en';

  const [seasons, setSeasons] = useState<Saison[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<number | ''>('');
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [selectedCompetition, setSelectedCompetition] = useState<number | ''>('');

  // Filters
  const [selectedPoste, setSelectedPoste] = useState<string>('');
  const [selectedClubId, setSelectedClubId] = useState<number | ''>('');
  const [clubs, setClubs] = useState<{ id: number; nom: string }[]>([]);

  const [stats, setStats] = useState<StatJoueur[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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

  // Extract unique clubs from stats to populate the filter
  useEffect(() => {
    if (stats.length > 0) {
      const clubMap = new Map<number, string>();
      stats.forEach(s => {
        if (s.joueur.club) {
          clubMap.set(s.joueur.club.id, s.joueur.club.nom);
        }
      });
      const extractedClubs = Array.from(clubMap.entries()).map(([id, nom]) => ({ id, nom }));
      setClubs(extractedClubs);
    } else {
      setClubs([]);
    }
  }, [stats]);

  // Load Passeurs when Competition or filters change
  useEffect(() => {
    if (!selectedCompetition) {
      setStats([]);
      return;
    }
    const loadPasseurs = async () => {
      setIsLoading(true);
      try {
        const filters: any = {};
        if (selectedPoste) filters.poste = selectedPoste;
        if (selectedClubId) filters.club_id = Number(selectedClubId);

        const res = await getTopPasseurs(Number(selectedCompetition), filters);
        if (res.success && res.data) {
          setStats(res.data);
        }
      } catch (err) {
        console.error(err);
        toast.error(isEn ? 'Error loading assist providers.' : 'Erreur de chargement des passeurs.');
      } finally {
        setIsLoading(false);
      }
    };
    loadPasseurs();
  }, [selectedCompetition, selectedPoste, selectedClubId, isEn]);

  return (
    <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Title */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Award size={24} style={{ color: 'var(--primary)' }} />
            {isEn ? 'Top Assists Standings' : 'Classement des Meilleurs Passeurs'}
          </h1>
          <p className="page-subtitle">
            {isEn 
              ? 'View the standings of players with the most assists delivered this season.'
              : 'Visualisez le classement des joueurs ayant délivré le plus de passes décisives cette saison.'}
          </p>
        </div>
      </div>

      {/* Filters Card */}
      <div className="card" style={{ padding: '20px' }}>
        <h2 className="form-label" style={{ fontSize: '13px', textTransform: 'uppercase', color: 'var(--primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Search size={16} />
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
                  {s.intitule}
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

          {/* Position */}
          <div className="form-group">
            <label className="form-label">{isEn ? 'Position' : 'Poste'}</label>
            <select
              value={selectedPoste}
              onChange={(e) => setSelectedPoste(e.target.value)}
              className="form-select"
            >
              <option value="">{isEn ? 'All positions' : 'Tous les postes'}</option>
              <option value="gardien">{isEn ? 'Goalkeeper' : 'Gardien'}</option>
              <option value="defenseur">{isEn ? 'Defender' : 'Défenseur'}</option>
              <option value="milieu">{isEn ? 'Midfielder' : 'Milieu'}</option>
              <option value="attaquant">{isEn ? 'Forward' : 'Attaquant'}</option>
            </select>
          </div>

          {/* Club */}
          <div className="form-group">
            <label className="form-label">{isEn ? 'Club' : 'Club'}</label>
            <select
              value={selectedClubId}
              onChange={(e) => setSelectedClubId(e.target.value ? Number(e.target.value) : '')}
              disabled={clubs.length === 0}
              className="form-select"
            >
              <option value="">{isEn ? 'All clubs' : 'Tous les clubs'}</option>
              {clubs.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nom}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main List */}
      <div style={{ width: '100%' }}>
        <TopScorersList
          stats={stats}
          isLoading={isLoading}
          type="passeurs"
        />
      </div>
    </div>
  );
};

export default StatistiquesPasseursPage;
