// src/pages/coach/CoachMatchsPage.tsx
// Liste complète des matchs du coach (passés, présents, futurs)

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
    Calendar, MapPin, Trophy, Filter, Search, X
} from 'lucide-react';
import { getMatchsAVenir } from '../../api/matchs.api';
import { useTranslation } from '../../hooks/useTranslation';

// ── Badge statut match ─────────────────────────────────────────
const MatchStatutBadge: React.FC<{ statut: string; isEn: boolean }> = ({ statut, isEn }) => {
    const styles: Record<string, { bg: string; color: string; label: string }> = {
        programme: { bg: '#D8F3DC', color: '#2D6A4F', label: isEn ? 'Scheduled' : 'Programmé' },
        en_cours: { bg: '#FEF3C7', color: '#92400E', label: isEn ? 'Live' : 'En cours' },
        termine: { bg: '#F1F5F9', color: '#475569', label: isEn ? 'Finished' : 'Terminé' },
        homologue: { bg: '#D8F3DC', color: '#1B4332', label: isEn ? 'Approved' : 'Homologué' },
        reporte: { bg: '#FEE2E2', color: '#991B1B', label: isEn ? 'Postponed' : 'Reporté' },
        annule: { bg: '#F3F4F6', color: '#6B7280', label: isEn ? 'Cancelled' : 'Annulé' },
    };
    const s = styles[statut] ?? { bg: '#F1F5F9', color: '#64748B', label: statut };
    return (
        <span style={{
            padding: '3px 10px',
            borderRadius: '20px',
            fontSize: '11px',
            fontWeight: 700,
            background: s.bg,
            color: s.color,
        }}>
            {s.label}
        </span>
    );
};

// ── Carte match ────────────────────────────────────────────────
const MatchCard: React.FC<{
    match: any;
    isEn: boolean;
    onSelect: (matchId: number) => void;
}> = ({ match, isEn, onSelect }) => {
    const isDomicile = match.est_domicile;
    const lieu = isDomicile 
      ? (isEn ? '🏠 Home' : '🏠 Domicile') 
      : (isEn ? '✈️ Away' : '✈️ Extérieur');
    const date = match.date_heure ? new Date(match.date_heure) : null;
    const isCompositionSaisie = match.composition_statut !== 'non_saisie';
    const isConfirmee = match.composition_confirmee;
    const estJoue = ['termine', 'homologue'].includes(match.statut);
    const estFutur = !estJoue && date && date > new Date();

    const getCompositionBadge = () => {
        if (isConfirmee) return { bg: '#D8F3DC', color: '#1B4332', label: isEn ? '✓ Lineup confirmed' : '✓ Composition confirmée' };
        if (isCompositionSaisie) return { bg: '#FEF3C7', color: '#92400E', label: isEn ? '📝 Draft' : '📝 Brouillon' };
        if (estJoue) return { bg: '#F1F5F9', color: '#64748B', label: isEn ? 'Match played' : 'Match joué' };
        if (!estFutur && date && date < new Date()) return { bg: '#FEE2E2', color: '#991B1B', label: isEn ? 'Past match' : 'Match passé' };
        return { bg: '#FEE2E2', color: '#991B1B', label: isEn ? '⚠️ Missing lineup' : '⚠️ Composition manquante' };
    };

    const compoBadge = getCompositionBadge();
    const showCompositionButton = estFutur && !isConfirmee;

    return (
        <div
            onClick={() => onSelect(match.id)}
            style={{
                background: '#fff',
                border: `1px solid ${compoBadge.bg === '#FEE2E2' ? '#FECACA' : '#E2E8E0'}`,
                borderRadius: '16px',
                padding: '16px 20px',
                cursor: 'pointer',
                transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(45,106,79,0.1)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                {/* Infos match */}
                <div style={{ flex: 1, minWidth: '240px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '8px' }}>
                        <span style={{
                            padding: '3px 10px',
                            borderRadius: '20px',
                            fontSize: '11px',
                            fontWeight: 700,
                            background: '#D8F3DC',
                            color: '#2D6A4F',
                        }}>
                            {lieu}
                        </span>
                        <MatchStatutBadge statut={match.statut} isEn={isEn} />
                        {date && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#6B8E6E' }}>
                                <Calendar size={12} />
                                {date.toLocaleDateString(isEn ? 'en-US' : 'fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
                                {' '}
                                {date.toLocaleTimeString(isEn ? 'en-US' : 'fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        )}
                    </div>

                    <div style={{ fontWeight: 700, fontSize: '18px', color: '#2C3E2F', marginBottom: '4px' }}>
                        {match.club_domicile?.nom} vs {match.club_exterieur?.nom}
                    </div>

                    {match.stade && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#6B8E6E', marginTop: '4px' }}>
                            <MapPin size={12} />
                            {match.stade}
                        </div>
                    )}
                </div>

                {/* Badge composition + action */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px', minWidth: '150px' }} className="match-card-actions">
                    <span style={{
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '11px',
                        fontWeight: 700,
                        background: compoBadge.bg,
                        color: compoBadge.color,
                    }}>
                        {compoBadge.label}
                    </span>
                    {showCompositionButton && (
                        <button
                            className="btn btn-sm"
                            style={{
                                background: '#2D6A4F',
                                color: '#fff',
                                border: 'none',
                                fontSize: '12px',
                                fontWeight: 600,
                                padding: '6px 14px',
                                cursor: 'pointer',
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                                onSelect(match.id);
                            }}
                        >
                            {isEn ? 'Enter lineup →' : 'Saisir la composition →'}
                        </button>
                    )}
                </div>
            </div>

            {/* Score si match joué */}
            {(match.statut === 'termine' || match.statut === 'homologue') && (
                <div style={{
                    marginTop: '12px',
                    paddingTop: '10px',
                    borderTop: '1px solid #E2E8E0',
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '20px',
                }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '24px', fontWeight: 800, color: '#2C3E2F' }}>
                            {match.score_domicile ?? 0} - {match.score_exterieur ?? 0}
                        </div>
                        <div style={{ fontSize: '11px', color: '#6B8E6E' }}>{isEn ? 'Final score' : 'Score final'}</div>
                    </div>
                </div>
            )}
        </div>
    );
};

// ── Filtres ────────────────────────────────────────────────────
const FiltersBar: React.FC<{
    activeFilter: string;
    isEn: boolean;
    onFilterChange: (filter: string) => void;
    searchTerm: string;
    onSearchChange: (term: string) => void;
    stats: { total: number; avenir: number; passes: number; sansCompo: number };
}> = ({ activeFilter, isEn, onFilterChange, searchTerm, onSearchChange, stats }) => {
    const filters = [
        { id: 'all', label: isEn ? `All (${stats.total})` : `Tous (${stats.total})` },
        { id: 'avenir', label: isEn ? `Upcoming (${stats.avenir})` : `À venir (${stats.avenir})` },
        { id: 'passes', label: isEn ? `Past (${stats.passes})` : `Passés (${stats.passes})` },
        { id: 'sans_compo', label: isEn ? `No lineup (${stats.sansCompo})` : `Sans composition (${stats.sansCompo})` },
    ];

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            marginBottom: '20px',
        }}>
            <div className="tabs" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {filters.map(f => (
                    <button
                        key={f.id}
                        className={`tab-btn ${activeFilter === f.id ? 'active' : ''}`}
                        onClick={() => onFilterChange(f.id)}
                        style={{ padding: '6px 12px', fontSize: '12.5px' }}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            <div style={{ position: 'relative', minWidth: '220px', flex: '1 1 auto', maxWidth: '350px' }}>
                <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input
                    type="text"
                    className="form-input"
                    placeholder={isEn ? "Search opponent..." : "Rechercher un adversaire..."}
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    style={{ paddingLeft: '34px', width: '100%' }}
                />
                {searchTerm && (
                    <button
                        onClick={() => onSearchChange('')}
                        style={{
                            position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                            background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8',
                        }}
                    >
                        <X size={14} />
                    </button>
                )}
            </div>
        </div>
    );
};

// ── Page principale ────────────────────────────────────────────
const CoachMatchsPage: React.FC = () => {
    const navigate = useNavigate();
    const [activeFilter, setActiveFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const { lang } = useTranslation();
    const isEn = lang === 'en';

    const { data: matchsData, isLoading } = useQuery({
        queryKey: ['coach-matchs-a-venir'],
        queryFn: getMatchsAVenir,
    });

    const matchs = matchsData?.data ?? [];

    // Statistiques
    const now = new Date();
    const matchsAvecStats = matchs.map((m: any) => {
        const date = m.date_heure ? new Date(m.date_heure) : null;
        const estFutur = date && date > now && m.statut === 'programme';
        const estPasse = date && date < now;
        const sansCompo = estFutur && m.composition_statut === 'non_saisie';
        return { ...m, estFutur, estPasse, sansCompo };
    });

    const stats = {
        total: matchsAvecStats.length,
        avenir: matchsAvecStats.filter((m: any) => m.estFutur).length,
        passes: matchsAvecStats.filter((m: any) => m.estPasse).length,
        sansCompo: matchsAvecStats.filter((m: any) => m.sansCompo).length,
    };

    // Filtrage
    let filtered = matchsAvecStats;
    if (activeFilter === 'avenir') {
        filtered = filtered.filter((m: any) => m.estFutur);
    } else if (activeFilter === 'passes') {
        filtered = filtered.filter((m: any) => m.estPasse);
    } else if (activeFilter === 'sans_compo') {
        filtered = filtered.filter((m: any) => m.sansCompo);
    }

    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter((m: any) =>
            m.club_domicile?.nom?.toLowerCase().includes(term) ||
            m.club_exterieur?.nom?.toLowerCase().includes(term)
        );
    }

    // Tri par date (les plus proches d'abord)
    filtered.sort((a: any, b: any) =>
        new Date(a.date_heure).getTime() - new Date(b.date_heure).getTime()
    );

    const handleSelectMatch = (matchId: number) => {
        navigate(`/coach/matchs/${matchId}`);
    };

    return (
        <div className="animate-fade-in-up">
            {/* Header */}
            <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#2C3E2F', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Trophy size={24} style={{ color: '#2D6A4F' }} />
                    {isEn ? 'My Matches' : 'Mes matchs'}
                </h1>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6B8E6E' }}>
                    {isEn 
                      ? 'Find all your club matches and enter your lineups'
                      : 'Retrouvez tous les matchs de votre club et saisissez vos compositions'}
                </p>
            </div>

            {/* Filtres */}
            <FiltersBar
                activeFilter={activeFilter}
                isEn={isEn}
                onFilterChange={setActiveFilter}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                stats={stats}
            />

            {/* Liste des matchs */}
            {isLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="skeleton" style={{ height: '120px', borderRadius: '16px' }} />
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
                    <div style={{
                        width: '64px', height: '64px', borderRadius: '50%',
                        background: '#D8F3DC', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', margin: '0 auto 16px',
                    }}>
                        <Filter size={28} style={{ color: '#2D6A4F' }} />
                    </div>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#2C3E2F' }}>
                        {isEn ? 'No matches found' : 'Aucun match trouvé'}
                    </h3>
                    <p style={{ fontSize: '13px', color: '#6B8E6E', marginTop: '6px' }}>
                        {activeFilter === 'all' && searchTerm
                            ? (isEn ? "No matches match your search." : "Aucun match ne correspond à votre recherche.")
                            : activeFilter === 'avenir'
                                ? (isEn ? "No upcoming matches for now." : "Aucun match à venir pour le moment.")
                                : activeFilter === 'sans_compo'
                                    ? (isEn ? "All lineups are already entered!" : "Toutes les compositions sont déjà saisies !")
                                    : (isEn ? "No past matches for now." : "Aucun match passé pour le moment.")}
                    </p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {filtered.map((match: any) => (
                        <MatchCard
                            key={match.id}
                            match={match}
                            isEn={isEn}
                            onSelect={handleSelectMatch}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default CoachMatchsPage;