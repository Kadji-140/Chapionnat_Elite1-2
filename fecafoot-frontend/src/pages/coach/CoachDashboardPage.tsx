// src/pages/coach/CoachDashboardPage.tsx
// Tableau de bord du coach — Matchs à venir, stats, warning compo, scouting IA, derniers résultats

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import {
    Calendar, Users, CheckCircle, AlertCircle,
    ArrowRight, Trophy, ClipboardList, Home,
    TrendingUp, Shield, Zap, AlertTriangle, Star
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { getMatchsAVenir } from '../../api/matchs.api';
import api from '../../api/axios';
import { useTranslation } from '../../hooks/useTranslation';

// ── Composant carte statistique ────────────────────────────────
const StatCard: React.FC<{
    label: string;
    value: number | string;
    icon: React.ReactNode;
    color: string;
    bgColor: string;
    subtitle?: string;
    delay?: number;
}> = ({ label, value, icon, color, bgColor, subtitle, delay = 0 }) => (
    <div
        className="stat-card"
        style={{
            animationDelay: `${delay}ms`,
            background: '#fff',
            borderRadius: '16px',
            padding: '18px 20px',
            border: '1px solid #E2E8E0',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
        }}
        onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(45,106,79,0.08)';
        }}
        onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
        }}
    >
        <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            background: bgColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
        }}>
            {icon}
        </div>
        <div>
            <div className="stat-value" style={{ fontSize: '28px', fontWeight: 800, color, lineHeight: 1.2 }}>{value}</div>
            <div className="stat-label" style={{ fontSize: '13px', color: '#6B8E6E', fontWeight: 500 }}>{label}</div>
            {subtitle && (
                <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>{subtitle}</div>
            )}
        </div>
    </div>
);

// ── Carte match à venir ────────────────────────────────────────
const MatchCard: React.FC<{
    match: any;
    isEn: boolean;
    onSaisirComposition: (matchId: number) => void;
}> = ({ match, isEn, onSaisirComposition }) => {
    const isDomicile = match.est_domicile;
    const adversaire = isDomicile ? match.club_exterieur?.nom : match.club_domicile?.nom;
    const lieu = isDomicile ? (isEn ? 'Home' : 'Domicile') : (isEn ? 'Away' : 'Extérieur');
    const date = match.date_heure ? new Date(match.date_heure) : null;
    const compositionStatut = match.composition_statut;
    const isConfirmee = match.composition_confirmee;

    const getStatutBadge = () => {
        if (isConfirmee) {
            return { label: isEn ? 'Confirmed ✓' : 'Confirmée ✓', bg: '#D8F3DC', color: '#1B4332' };
        }
        if (compositionStatut === 'brouillon') {
            return { label: isEn ? 'Draft' : 'Brouillon', bg: '#FEF3C7', color: '#92400E' };
        }
        return { label: isEn ? 'Not Entered' : 'Non saisie', bg: '#FEE2E2', color: '#991B1B' };
    };

    const badge = getStatutBadge();

    return (
        <div style={{
            background: '#fff',
            border: '1px solid #E2E8E0',
            borderRadius: '14px',
            padding: '16px 20px',
            transition: 'all 0.2s',
        }}
            onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(45,106,79,0.06)'}
            onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <span style={{
                            padding: '3px 10px',
                            borderRadius: '20px',
                            fontSize: '11px',
                            fontWeight: 700,
                            background: isDomicile ? '#D8F3DC' : '#E2E8F0',
                            color: isDomicile ? '#2D6A4F' : '#475569',
                        }}>
                            {lieu}
                        </span>
                        {date && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#6B8E6E' }}>
                                <Calendar size={12} />
                                {date.toLocaleDateString(isEn ? 'en-US' : 'fr-FR', { day: 'numeric', month: 'short' })}
                                {' '}
                                {date.toLocaleTimeString(isEn ? 'en-US' : 'fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        )}
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '15px', color: '#2C3E2F', marginBottom: '2px' }}>
                        vs {adversaire}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6B8E6E' }}>
                        🏟️ {match.stade || (isEn ? 'Stadium to define' : 'Stade à définir')}
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{
                        padding: '3px 10px',
                        borderRadius: '20px',
                        fontSize: '11px',
                        fontWeight: 700,
                        background: badge.bg,
                        color: badge.color,
                    }}>
                        {badge.label}
                    </span>
                    <button
                        className="btn btn-sm"
                        onClick={() => onSaisirComposition(match.id)}
                        style={{
                            background: isConfirmee ? '#E2E8E0' : '#2D6A4F',
                            color: isConfirmee ? '#64748B' : '#fff',
                            border: 'none',
                            fontSize: '12px',
                            fontWeight: 600,
                            padding: '6px 14px',
                            cursor: isConfirmee ? 'not-allowed' : 'pointer',
                        }}
                        disabled={isConfirmee}
                    >
                        {isConfirmee ? (isEn ? '🔒 Locked' : '🔒 Verrouillé') : (isEn ? '✏️ Lineup' : '✏️ Composer')}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ── Action rapide ─────────────────────────────────────────────
const QuickAction: React.FC<{
    to: string;
    icon: React.ReactNode;
    title: string;
    description: string;
    color: string;
}> = ({ to, icon, title, description, color }) => (
    <Link
        to={to}
        style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            padding: '16px 20px',
            borderRadius: '14px',
            border: '1px solid #E2E8E0',
            background: '#fff',
            textDecoration: 'none',
            transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(45,106,79,0.08)';
            e.currentTarget.style.borderColor = color;
        }}
        onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.borderColor = '#E2E8E0';
        }}
    >
        <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: `${color}10`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            color,
        }}>
            {icon}
        </div>
        <div style={{ flex: 1 }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#2C3E2F' }}>{title}</div>
            <div style={{ fontSize: '12px', color: '#6B8E6E', marginTop: '2px' }}>{description}</div>
        </div>
        <ArrowRight size={16} style={{ color: '#94A3B8', flexShrink: 0 }} />
    </Link>
);

// ── Page principale ────────────────────────────────────────────
const CoachDashboardPage: React.FC = () => {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const { lang } = useTranslation();
    const isEn = lang === 'en';

    // 1. Récupérer les matchs à venir
    const { data: matchsData, isLoading: loadingMatchs } = useQuery({
        queryKey: ['coach-matchs-a-venir'],
        queryFn: getMatchsAVenir,
    });

    // 2. Récupérer les derniers résultats
    const { data: pastMatchsResponse } = useQuery({
        queryKey: ['coach-matchs-passes'],
        queryFn: () => api.get('/coach/matchs-a-venir', { params: { statut: 'homologue' } }).then(r => r.data),
    });

    // 3. Récupérer les joueurs pour le scouting IA
    const { data: joueursResponse } = useQuery({
        queryKey: ['coach-joueurs-scouting'],
        queryFn: () => api.get('/coach/joueurs').then(r => r.data),
    });

    const matchsAVenir = matchsData?.data ?? [];
    const pastMatchs = pastMatchsResponse?.data ?? [];
    const joueurs = joueursResponse?.data ?? [];

    // Trier les joueurs par IA Talent Score décroissant (exclut ceux qui n'ont pas de score)
    const topPerformers = [...joueurs]
        .filter((j: any) => j.talent_score !== null && j.talent_score !== undefined)
        .sort((a: any, b: any) => b.talent_score - a.talent_score)
        .slice(0, 4);

    // Statistiques
    const matchsAVenirCount = matchsAVenir.length;
    const compositionsManquantes = matchsAVenir.filter((m: any) => m.composition_statut === 'non_saisie').length;
    const brouillonsCount = matchsAVenir.filter((m: any) => m.composition_statut === 'brouillon').length;
    const confirmeesCount = matchsAVenir.filter((m: any) => m.composition_confirmee).length;

    // Prochains matchs
    const prochainsMatchs = [...matchsAVenir]
        .sort((a: any, b: any) => new Date(a.date_heure).getTime() - new Date(b.date_heure).getTime())
        .slice(0, 3);

    // Détection d'un match urgent sans composition (dans les 48 heures)
    const matchUrgent = matchsAVenir.find((m: any) => {
        if (m.composition_confirmee) return false;
        const diffHours = (new Date(m.date_heure).getTime() - Date.now()) / (1000 * 60 * 60);
        return diffHours > 0 && diffHours <= 48;
    });

    const handleSaisirComposition = (matchId: number) => {
        navigate(`/coach/matchs/${matchId}/composition`);
    };

    return (
        <div className="animate-fade-in-up">
            {/* Header */}
            <div style={{
                background: 'linear-gradient(135deg, #2D6A4F 0%, #40916C 100%)',
                borderRadius: '20px',
                padding: '28px 32px',
                color: '#fff',
                marginBottom: '24px',
                boxShadow: 'var(--shadow-md)',
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                        <div style={{ fontSize: '11px', fontWeight: 600, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                            {isEn ? 'Coach Space' : 'Espace Coach'}
                        </div>
                        <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {isEn ? 'Hello' : 'Bonjour'}, {user?.prenom} {user?.nom} 👋
                        </h1>
                        <p style={{ margin: '8px 0 0', fontSize: '14px', opacity: 0.8, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Home size={14} /> {user?.club?.nom || (isEn ? 'No club assigned' : 'Club non assigné')}
                        </p>
                    </div>
                    <div style={{
                        background: 'rgba(255,255,255,0.15)',
                        borderRadius: '12px',
                        padding: '10px 16px',
                        textAlign: 'center',
                    }}>
                        <div style={{ fontSize: '11px', opacity: 0.7 }}>{isEn ? 'Current Season' : 'Saison en cours'}</div>
                        <div style={{ fontSize: '14px', fontWeight: 700 }}>2025-2026</div>
                    </div>
                </div>
            </div>

            {/* Warning Match Urgent / Missed Composition */}
            {matchUrgent && (
                <div className="animate-slide-down" style={{
                    padding: '16px 20px',
                    borderRadius: '16px',
                    background: 'rgba(220,38,38,0.06)',
                    border: '1px solid rgba(220,38,38,0.2)',
                    marginBottom: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <AlertTriangle size={24} style={{ color: '#DC2626', flexShrink: 0 }} />
                        <div>
                            <div style={{ fontSize: '14px', fontWeight: 700, color: '#991B1B' }}>
                                {isEn ? 'Urgent lineup required!' : 'Composition urgente requise !'}
                            </div>
                            <div style={{ fontSize: '13px', color: '#B91C1C', marginTop: '2px' }}>
                                {isEn ? 'The match vs ' : 'Le match vs '}<strong>{matchUrgent.est_domicile ? matchUrgent.club_exterieur?.nom : matchUrgent.club_domicile?.nom}</strong> {isEn ? 'starts on' : 'débute le'}{' '}
                                {new Date(matchUrgent.date_heure).toLocaleDateString(isEn ? 'en-US' : 'fr-FR')} {isEn ? 'at' : 'à'}{' '}
                                {new Date(matchUrgent.date_heure).toLocaleTimeString(isEn ? 'en-US' : 'fr-FR', { hour: '2-digit', minute: '2-digit' })}.
                            </div>
                        </div>
                    </div>
                    <button
                        className="btn btn-sm"
                        onClick={() => handleSaisirComposition(matchUrgent.id)}
                        style={{ background: '#DC2626', color: '#fff', border: 'none', fontWeight: 700 }}
                    >
                        {isEn ? 'Enter lineup' : 'Saisir la composition'}
                    </button>
                </div>
            )}

            {/* Statistiques */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '16px',
                marginBottom: '28px',
            }}>
                <StatCard
                    label={isEn ? 'Upcoming Matches' : 'Matchs à venir'}
                    value={matchsAVenirCount}
                    icon={<Calendar size={24} style={{ color: '#2D6A4F' }} />}
                    color="#2D6A4F"
                    bgColor="rgba(45,106,79,0.08)"
                    subtitle={isEn ? 'Next matches' : 'Prochains matchs'}
                    delay={0}
                />
                <StatCard
                    label={isEn ? 'Lineups to make' : 'Compositions à faire'}
                    value={compositionsManquantes}
                    icon={<ClipboardList size={24} style={{ color: '#E9C46A' }} />}
                    color="#D97706"
                    bgColor="rgba(233,196,106,0.1)"
                    subtitle={isEn ? 'To enter' : 'À saisir'}
                    delay={80}
                />
                <StatCard
                    label={isEn ? 'Drafts' : 'Brouillons'}
                    value={brouillonsCount}
                    icon={<AlertCircle size={24} style={{ color: '#D4A373' }} />}
                    color="#D4A373"
                    bgColor="rgba(212,163,115,0.1)"
                    subtitle={isEn ? 'To finalize' : 'À finaliser'}
                    delay={160}
                />
                <StatCard
                    label={isEn ? 'Validated Lineups' : 'Compositions validées'}
                    value={confirmeesCount}
                    icon={<CheckCircle size={24} style={{ color: '#2D6A4F' }} />}
                    color="#2D6A4F"
                    bgColor="rgba(45,106,79,0.08)"
                    subtitle={isEn ? 'Confirmed' : '✅ Confirmées'}
                    delay={240}
                />
            </div>

            {/* Section principale */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px' }} className="responsive-grid">

                {/* Colonne gauche : Matchs à venir & Résultats */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* Prochains matchs */}
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#2C3E2F', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Trophy size={18} style={{ color: '#E9C46A' }} />
                                {isEn ? 'Immediate Calendar' : 'Calendrier Immédiat'}
                            </h2>
                            <Link
                                to="/coach/matchs"
                                style={{ fontSize: '13px', fontWeight: 600, color: '#2D6A4F', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                                {isEn ? 'View all' : 'Voir tous'} <ArrowRight size={14} />
                            </Link>
                        </div>

                        {loadingMatchs ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {[1, 2].map(i => <div key={i} className="skeleton" style={{ height: '100px', borderRadius: '14px' }} />)}
                            </div>
                        ) : prochainsMatchs.length === 0 ? (
                            <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
                                <div style={{
                                    width: '64px', height: '64px', borderRadius: '50%',
                                    background: '#D8F3DC', display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', margin: '0 auto 16px',
                                }}>
                                    <Calendar size={28} style={{ color: '#2D6A4F' }} />
                                </div>
                                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#2C3E2F' }}>
                                    {isEn ? 'No scheduled matches' : 'Aucun match programmé'}
                                </h3>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {prochainsMatchs.map((match: any) => (
                                    <MatchCard
                                        key={match.id}
                                        match={match}
                                        isEn={isEn}
                                        onSaisirComposition={handleSaisirComposition}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Récents Résultats */}
                    <div>
                        <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#2C3E2F', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <TrendingUp size={18} style={{ color: '#2D6A4F' }} />
                            {isEn ? 'Recent Results' : 'Dernières prestations'}
                        </h2>

                        {pastMatchs.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {pastMatchs.slice(0, 3).map((match: any) => {
                                    const isDomicile = match.club_domicile_id === user?.club?.id;
                                    const opposant = isDomicile ? match.club_exterieur?.nom : match.club_domicile?.nom;
                                    const scoreDom = match.score_domicile_officiel ?? match.score_domicile_terrain;
                                    const scoreExt = match.score_exterieur_officiel ?? match.score_exterieur_terrain;

                                    return (
                                        <div
                                            key={match.id}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                padding: '12px 16px',
                                                borderRadius: '12px',
                                                border: '1px solid #E2E8E0',
                                                background: '#fff',
                                                fontSize: '13px'
                                            }}
                                        >
                                            <span style={{ fontWeight: 600, color: '#475569' }}>
                                                vs {opposant} ({isDomicile ? (isEn ? 'Home' : 'Domicile') : (isEn ? 'Away' : 'Extérieur')})
                                            </span>
                                            <strong style={{ fontSize: '14px', color: '#1E293B', letterSpacing: '0.5px' }}>
                                                {scoreDom} - {scoreExt}
                                            </strong>
                                        </div>
                                    );
                                })}
							</div>
                        ) : (
                            <div className="card" style={{ padding: '24px', textAlign: 'center', color: '#6B8E6E', fontSize: '13px' }}>
                                {isEn ? 'No recent match history available.' : 'Aucun historique de match joué disponible.'}
                            </div>
                        )}
                    </div>
                </div>

                {/* Colonne droite : Actions rapides & Top Performance IA */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* Actions rapides */}
                    <div>
                        <div style={{ marginBottom: '16px' }}>
                            <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#2C3E2F', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Zap size={18} style={{ color: '#E9C46A' }} />
                                {isEn ? 'Quick Actions' : 'Actions rapides'}
                            </h2>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <QuickAction
                                to="/coach/matchs"
                                icon={<Calendar size={20} />}
                                title={isEn ? 'All Matches' : 'Voir tous les matchs'}
                                description={isEn ? 'Complete match calendar' : 'Calendrier complet des matchs'}
                                color="#2D6A4F"
                            />
                            <QuickAction
                                to="/coach/mon-equipe"
                                icon={<Users size={20} />}
                                title={isEn ? 'My Team' : 'Mon équipe'}
                                description={isEn ? 'Full roster and stats' : 'Effectif complet et statistiques'}
                                color="#3B82F6"
                            />
                            <QuickAction
                                to="/classement"
                                icon={<TrendingUp size={20} />}
                                title={isEn ? 'Standings' : 'Classement'}
                                description={isEn ? 'League standings' : 'Classement général'}
                                color="#E9C46A"
                            />
                        </div>
                    </div>

                    {/* Top Performers IA Scouting */}
                    <div className="card" style={{ padding: '20px' }}>
                        <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#2C3E2F', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Star size={18} style={{ color: '#FFB800' }} />
                            {isEn ? 'Top AI Performances' : 'Top Performances IA'}
                        </h2>

                        {topPerformers.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {topPerformers.map((j: any) => (
                                    <div
                                        key={j.id}
                                        onClick={() => navigate(`/coach/joueurs/${j.id}`)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: '8px 10px',
                                            borderRadius: '8px',
                                            background: '#F8FAFC',
                                            cursor: 'pointer',
                                            transition: 'background 0.2s',
                                            border: '1px solid #E2E8F0'
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.background = '#F1F5F9'}
                                        onMouseLeave={e => e.currentTarget.style.background = '#F8FAFC'}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{
                                                width: '32px', height: '32px', borderRadius: '50%',
                                                background: '#E2E8F0', display: 'flex', alignItems: 'center',
                                                justifyContent: 'center', fontWeight: 700, fontSize: '11px', color: '#475569'
                                            }}>
                                                {j.prenom[0]}{j.nom[0]}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 700, fontSize: '12.5px', color: '#1E293B' }}>
                                                    {j.prenom} {j.nom}
                                                </div>
                                                <div style={{ fontSize: '11px', color: '#64748B' }}>
                                                    {j.poste_label || j.poste}
                                                </div>
                                            </div>
                                        </div>
                                        <span style={{
                                            padding: '3px 8px',
                                            borderRadius: '12px',
                                            fontSize: '11.5px',
                                            fontWeight: 800,
                                            background: 'rgba(27,67,50,0.1)',
                                            color: 'var(--primary)',
                                        }}>
                                            ★ {j.talent_score}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ fontSize: '12px', color: '#64748B', textAlign: 'center', padding: '12px' }}>
                                {isEn ? 'No AI talent scores available.' : 'Aucun score de talent IA disponible. Lancez un recalcul des scores.'}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Rule warning */}
            <div style={{
                marginTop: '24px',
                padding: '16px',
                background: '#D8F3DC',
                borderRadius: '14px',
                border: '1px solid #C2E0C6',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <Shield size={16} style={{ color: '#2D6A4F' }} />
                    <span style={{ fontWeight: 700, fontSize: '13px', color: '#1B4332' }}>{isEn ? 'Regulations Reminder' : 'Rappel règlement'}</span>
                </div>
                <p style={{ fontSize: '12px', color: '#2C3E2F', margin: 0, lineHeight: '1.5' }}>
                    {isEn 
                      ? "The lineup can be entered and modified (even after confirmation) until 30 minutes before kick-off. After this deadline, the lineup is locked."
                      : "La composition peut être saisie et modifiée (même après confirmation) jusqu'à 30 minutes avant le coup d'envoi. Passé ce délai, la composition est définitivement verrouillée."}
                </p>
            </div>
            
            <style>{`
                @media (max-width: 768px) {
                    .responsive-grid {
                        grid-template-columns: 1fr !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default CoachDashboardPage;