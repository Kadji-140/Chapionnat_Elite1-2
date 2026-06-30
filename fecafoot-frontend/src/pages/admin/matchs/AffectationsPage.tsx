// src/pages/admin/matchs/AffectationsPage.tsx
// Affectation des commissaires et arbitres aux matchs

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Shield, UserCheck, Calendar, MapPin,
    CheckCircle, RefreshCw, UserX
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
    getMatchsSansOfficiel,
    getCommissairesDisponibles,
    getArbitresDisponibles,
    affecterCommissaire,
    affecterArbitre,
    type Match
} from '../../../api/matchs.api';
import { OfficielSelector } from '../../../components/matchs/OfficielSelector';
import api from '../../../api/axios';

// ── Badge statut match ─────────────────────────────────────────
const MatchStatutBadge: React.FC<{ statut: string }> = ({ statut }) => {
    const styles: Record<string, { bg: string; color: string; label: string }> = {
        programme: { bg: '#D8F3DC', color: '#2D6A4F', label: 'Programmé' },
        reporte: { bg: '#FEF3C7', color: '#92400E', label: 'Reporté' },
        annule: { bg: '#F3F4F6', color: '#6B7280', label: 'Annulé' },
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

// ── Carte d'un match ───────────────────────────────────────────
import { Avatar } from '../../../components/ui/DataTable';

const getLogoUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  
  const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
  const baseUrl = apiUrl.endsWith('/api') ? apiUrl.slice(0, -4) : apiUrl;

  const cleanUrl = url.startsWith('/') ? url.substring(1) : url;
  if (cleanUrl.startsWith('storage/')) {
    return `${baseUrl}/${cleanUrl}`;
  }
  return `${baseUrl}/storage/${cleanUrl}`;
};

const MatchCard: React.FC<{
    match: Match;
    commissaires: any[];
    arbitres: any[];
    onAffecterCommissaire: (matchId: number, commissaireId: number | null) => void;
    onAffecterArbitre: (matchId: number, arbitreId: number | null, role: 'principal' | 'assistant_1' | 'assistant_2' | 'quatrieme') => void;
    isLoadingCommissaires: boolean;
    isLoadingArbitres: boolean;
}> = ({
    match,
    commissaires,
    arbitres,
    onAffecterCommissaire,
    onAffecterArbitre,
    isLoadingCommissaires,
    isLoadingArbitres,
}) => {
    const date = match.date_heure ? new Date(match.date_heure) : null;

    // Déterminer le statut global d'affectation
    const isComplet = match.commissaire && match.arbitre_principal && match.arbitre_assistant_1 && match.arbitre_assistant_2 && match.quatrieme_arbitre;
    
    return (
        <div style={{
            background: '#fff',
            border: isComplet ? '2px solid #2D6A4F' : '1px solid #E2E8F0',
            borderRadius: '16px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            boxShadow: isComplet ? '0 4px 16px rgba(45,106,79,0.06)' : '0 1px 3px rgba(0,0,0,0.02), 0 1px 2px rgba(0,0,0,0.04)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
            onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 10px 25px rgba(45,106,79,0.08)';
                if (!isComplet) e.currentTarget.style.borderColor = '#A7F3D0';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = isComplet ? '0 4px 16px rgba(45,106,79,0.06)' : '0 1px 3px rgba(0,0,0,0.02), 0 1px 2px rgba(0,0,0,0.04)';
                if (!isComplet) e.currentTarget.style.borderColor = '#E2E8F0';
            }}
        >
            {/* Meta Row: Status, Date, Stade */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <MatchStatutBadge statut={match.statut} />
                    {isComplet ? (
                        <span style={{
                            padding: '3px 10px',
                            borderRadius: '20px',
                            fontSize: '11px',
                            fontWeight: 700,
                            background: '#D8F3DC',
                            color: '#1B4332',
                        }}>
                            AFF. COMPLÈTE
                        </span>
                    ) : (
                        <span style={{
                            padding: '3px 10px',
                            borderRadius: '20px',
                            fontSize: '11px',
                            fontWeight: 700,
                            background: '#FEE2E2',
                            color: '#991B1B',
                        }}>
                            INCOMPLET
                        </span>
                    )}
                    {date && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#475569', fontWeight: 600 }}>
                            <Calendar size={14} style={{ color: '#2D6A4F' }} />
                            {date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
                            {' à '}
                            {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    )}
                    {match.stade && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#64748B' }}>
                            <MapPin size={14} style={{ color: '#6B8E6E' }} />
                            {match.stade}
                        </span>
                    )}
                </div>
                <div style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>
                    Journée {match.journee}
                </div>
            </div>

            {/* Teams Row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ flex: 1, minWidth: '150px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Avatar src={getLogoUrl(match.club_domicile?.logo_url)} name={match.club_domicile?.nom ?? ''} size={36} />
                    <div>
                        <div style={{ fontWeight: 700, fontSize: '15px', color: '#1E293B' }}>{match.club_domicile?.nom}</div>
                        <div style={{ fontSize: '11px', color: '#64748B' }}>{match.club_domicile?.ville}</div>
                    </div>
                </div>
                <div style={{ fontWeight: 800, fontSize: '14px', color: '#94A3B8', padding: '0 20px', textAlign: 'center' }}>VS</div>
                <div style={{ flex: 1, minWidth: '150px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px' }}>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 700, fontSize: '15px', color: '#1E293B' }}>{match.club_exterieur?.nom}</div>
                        <div style={{ fontSize: '11px', color: '#64748B' }}>{match.club_exterieur?.ville}</div>
                    </div>
                    <Avatar src={getLogoUrl(match.club_exterieur?.logo_url)} name={match.club_exterieur?.nom ?? ''} size={36} />
                </div>
            </div>

            {/* Selectors Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginTop: '8px', paddingTop: '16px', borderTop: '1px solid #F1F5F9' }}>
                {/* Commissaire */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Shield size={14} style={{ color: '#2D6A4F' }} />
                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#475569' }}>Commissaire</span>
                        {match.commissaire && (
                            <span style={{
                                fontSize: '10px',
                                padding: '2px 8px',
                                borderRadius: '12px',
                                background: '#ECFDF5',
                                color: '#047857',
                                border: '1px solid #A7F3D0',
                                fontWeight: 600
                            }}>
                                Affecté
                            </span>
                        )}
                    </div>

                    {match.commissaire ? (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px 14px',
                            background: '#F0FDF4',
                            borderRadius: '10px',
                            border: '1px solid #DCFCE7',
                        }}>
                            <div style={{ minWidth: 0, flex: 1 }}>
                                <div style={{ fontWeight: 700, fontSize: '13px', color: '#15803d', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {match.commissaire.nom}
                                </div>
                                <div style={{ fontSize: '11px', color: '#166534', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {match.commissaire.email}
                                </div>
                            </div>
                            <button
                                onClick={() => onAffecterCommissaire(match.id, null)}
                                className="btn btn-ghost btn-sm"
                                style={{ padding: '4px 8px', color: '#B91C1C', flexShrink: 0 }}
                                title="Retirer"
                            >
                                <UserX size={14} />
                            </button>
                        </div>
                    ) : (
                        <OfficielSelector
                            type="commissaire"
                            officiels={commissaires}
                            selectedId={null}
                            onSelect={(id) => onAffecterCommissaire(match.id, id)}
                            dateHeure={match.date_heure || undefined}
                            isLoading={isLoadingCommissaires}
                        />
                    )}
                </div>

                {/* Arbitre Principal (Central) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <UserCheck size={14} style={{ color: '#2D6A4F' }} />
                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#475569' }}>Arbitre principal</span>
                        {match.arbitre_principal && (
                            <span style={{
                                fontSize: '10px',
                                padding: '2px 8px',
                                borderRadius: '12px',
                                background: '#ECFDF5',
                                color: '#047857',
                                border: '1px solid #A7F3D0',
                                fontWeight: 600
                            }}>
                                Affecté
                            </span>
                        )}
                    </div>

                    {match.arbitre_principal ? (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px 14px',
                            background: '#F0FDF4',
                            borderRadius: '10px',
                            border: '1px solid #DCFCE7',
                        }}>
                            <div style={{ minWidth: 0, flex: 1 }}>
                                <div style={{ fontWeight: 700, fontSize: '13px', color: '#15803d', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {match.arbitre_principal.nom}
                                </div>
                                <div style={{ fontSize: '11px', color: '#166534', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    Central · {match.arbitre_principal.num_licence}
                                </div>
                            </div>
                            <button
                                onClick={() => onAffecterArbitre(match.id, null, 'principal')}
                                className="btn btn-ghost btn-sm"
                                style={{ padding: '4px 8px', color: '#B91C1C', flexShrink: 0 }}
                                title="Retirer"
                            >
                                <UserX size={14} />
                            </button>
                        </div>
                    ) : (
                        <OfficielSelector
                            type="arbitre"
                            officiels={arbitres}
                            selectedId={null}
                            onSelect={(id) => onAffecterArbitre(match.id, id, 'principal')}
                            dateHeure={match.date_heure || undefined}
                            isLoading={isLoadingArbitres}
                            specificationFilter="central"
                        />
                    )}
                </div>

                {/* Assistant 1 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <UserCheck size={14} style={{ color: '#2D6A4F' }} />
                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#475569' }}>Arbitre assistant 1</span>
                        {match.arbitre_assistant_1 && (
                            <span style={{
                                fontSize: '10px',
                                padding: '2px 8px',
                                borderRadius: '12px',
                                background: '#ECFDF5',
                                color: '#047857',
                                border: '1px solid #A7F3D0',
                                fontWeight: 600
                            }}>
                                Affecté
                            </span>
                        )}
                    </div>

                    {match.arbitre_assistant_1 ? (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px 14px',
                            background: '#F0FDF4',
                            borderRadius: '10px',
                            border: '1px solid #DCFCE7',
                        }}>
                            <div style={{ minWidth: 0, flex: 1 }}>
                                <div style={{ fontWeight: 700, fontSize: '13px', color: '#15803d', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {match.arbitre_assistant_1.nom}
                                </div>
                                <div style={{ fontSize: '11px', color: '#166534', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    Ligne · {match.arbitre_assistant_1.num_licence}
                                </div>
                            </div>
                            <button
                                onClick={() => onAffecterArbitre(match.id, null, 'assistant_1')}
                                className="btn btn-ghost btn-sm"
                                style={{ padding: '4px 8px', color: '#B91C1C', flexShrink: 0 }}
                                title="Retirer"
                            >
                                <UserX size={14} />
                            </button>
                        </div>
                    ) : (
                        <OfficielSelector
                            type="arbitre"
                            officiels={arbitres}
                            selectedId={null}
                            onSelect={(id) => onAffecterArbitre(match.id, id, 'assistant_1')}
                            dateHeure={match.date_heure || undefined}
                            isLoading={isLoadingArbitres}
                            specificationFilter="assistant"
                        />
                    )}
                </div>

                {/* Assistant 2 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <UserCheck size={14} style={{ color: '#2D6A4F' }} />
                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#475569' }}>Arbitre assistant 2</span>
                        {match.arbitre_assistant_2 && (
                            <span style={{
                                fontSize: '10px',
                                padding: '2px 8px',
                                borderRadius: '12px',
                                background: '#ECFDF5',
                                color: '#047857',
                                border: '1px solid #A7F3D0',
                                fontWeight: 600
                            }}>
                                Affecté
                            </span>
                        )}
                    </div>

                    {match.arbitre_assistant_2 ? (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px 14px',
                            background: '#F0FDF4',
                            borderRadius: '10px',
                            border: '1px solid #DCFCE7',
                        }}>
                            <div style={{ minWidth: 0, flex: 1 }}>
                                <div style={{ fontWeight: 700, fontSize: '13px', color: '#15803d', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {match.arbitre_assistant_2.nom}
                                </div>
                                <div style={{ fontSize: '11px', color: '#166534', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    Ligne · {match.arbitre_assistant_2.num_licence}
                                </div>
                            </div>
                            <button
                                onClick={() => onAffecterArbitre(match.id, null, 'assistant_2')}
                                className="btn btn-ghost btn-sm"
                                style={{ padding: '4px 8px', color: '#B91C1C', flexShrink: 0 }}
                                title="Retirer"
                            >
                                <UserX size={14} />
                            </button>
                        </div>
                    ) : (
                        <OfficielSelector
                            type="arbitre"
                            officiels={arbitres}
                            selectedId={null}
                            onSelect={(id) => onAffecterArbitre(match.id, id, 'assistant_2')}
                            dateHeure={match.date_heure || undefined}
                            isLoading={isLoadingArbitres}
                            specificationFilter="assistant"
                        />
                    )}
                </div>

                {/* Quatrième Arbitre */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <UserCheck size={14} style={{ color: '#2D6A4F' }} />
                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#475569' }}>4e Arbitre</span>
                        {match.quatrieme_arbitre && (
                            <span style={{
                                fontSize: '10px',
                                padding: '2px 8px',
                                borderRadius: '12px',
                                background: '#ECFDF5',
                                color: '#047857',
                                border: '1px solid #A7F3D0',
                                fontWeight: 600
                            }}>
                                Affecté
                            </span>
                        )}
                    </div>

                    {match.quatrieme_arbitre ? (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px 14px',
                            background: '#F0FDF4',
                            borderRadius: '10px',
                            border: '1px solid #DCFCE7',
                        }}>
                            <div style={{ minWidth: 0, flex: 1 }}>
                                <div style={{ fontWeight: 700, fontSize: '13px', color: '#15803d', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {match.quatrieme_arbitre.nom}
                                </div>
                                <div style={{ fontSize: '11px', color: '#166534', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    Table · {match.quatrieme_arbitre.num_licence}
                                </div>
                            </div>
                            <button
                                onClick={() => onAffecterArbitre(match.id, null, 'quatrieme')}
                                className="btn btn-ghost btn-sm"
                                style={{ padding: '4px 8px', color: '#B91C1C', flexShrink: 0 }}
                                title="Retirer"
                            >
                                <UserX size={14} />
                            </button>
                        </div>
                    ) : (
                        <OfficielSelector
                            type="arbitre"
                            officiels={arbitres}
                            selectedId={null}
                            onSelect={(id) => onAffecterArbitre(match.id, id, 'quatrieme')}
                            dateHeure={match.date_heure || undefined}
                            isLoading={isLoadingArbitres}
                            specificationFilter="quatrieme"
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

// ── Page principale ────────────────────────────────────────────
const AffectationsPage: React.FC = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [filterCompetition, setFilterCompetition] = useState<number | null>(null);
    const [filterDate, setFilterDate] = useState('');
    const [competitions, setCompetitions] = useState<Array<{ id: number; nom: string; niveau: string }>>([]);

    // Charger les compétitions (saison en cours)
    useEffect(() => {
        api.get('/admin/saisons?statut=en_cours')
            .then(res => {
                const saison = res.data?.data?.[0];
                if (saison) {
                    return api.get(`/admin/saisons/${saison.id}/competitions`);
                }
                return null;
            })
            .then(res => {
                if (res?.data?.data) {
                    setCompetitions(res.data.data);
                }
            })
            .catch(console.error);
    }, []);

    // Charger les matchs sans officiel
    const { data: matchsData, isLoading: loadingMatchs, refetch } = useQuery({
        queryKey: ['admin-matchs-sans-officiel', filterCompetition, filterDate],
        queryFn: () => getMatchsSansOfficiel({ competition_id: filterCompetition || undefined, date: filterDate || undefined }),
    });

    // Charger les commissaires disponibles
    const { data: commissairesData, isLoading: loadingCommissaires, refetch: refetchCommissaires } = useQuery({
        queryKey: ['admin-commissaires-disponibles'],
        queryFn: () => getCommissairesDisponibles(),
    });

    // Charger les arbitres disponibles
    const { data: arbitresData, isLoading: loadingArbitres, refetch: refetchArbitres } = useQuery({
        queryKey: ['admin-arbitres-disponibles'],
        queryFn: () => getArbitresDisponibles(),
    });

    const matchs = matchsData?.data ?? [];
    const commissaires = commissairesData?.data ?? [];
    const arbitres = arbitresData?.data ?? [];

    // Mutations
    const affecterCommissaireMutation = useMutation({
        mutationFn: ({ matchId, commissaireId }: { matchId: number; commissaireId: number | null }) =>
            affecterCommissaire(matchId, commissaireId),
        onSuccess: () => {
            toast.success('Commissaire affecté');
            queryClient.invalidateQueries({ queryKey: ['admin-matchs-sans-officiel'] });
            refetchCommissaires();
        },
        onError: (err: any) => toast.error(err.response?.data?.message || 'Erreur'),
    });

    const affecterArbitreMutation = useMutation({
        mutationFn: ({ matchId, arbitreId, role }: { matchId: number; arbitreId: number | null; role: 'principal' | 'assistant_1' | 'assistant_2' | 'quatrieme' }) =>
            affecterArbitre(matchId, arbitreId, role),
        onSuccess: () => {
            toast.success('Arbitre affecté');
            queryClient.invalidateQueries({ queryKey: ['admin-matchs-sans-officiel'] });
            refetchArbitres();
        },
        onError: (err: any) => toast.error(err.response?.data?.message || 'Erreur'),
    });

    const handleAffecterCommissaire = (matchId: number, commissaireId: number | null) => {
        affecterCommissaireMutation.mutate({ matchId, commissaireId });
    };

    const handleAffecterArbitre = (matchId: number, arbitreId: number | null, role: 'principal' | 'assistant_1' | 'assistant_2' | 'quatrieme') => {
        affecterArbitreMutation.mutate({ matchId, arbitreId, role });
    };

    const handleRefresh = () => {
        refetch();
        refetchCommissaires();
        refetchArbitres();
    };

    // Statistiques
    const sansCommissaire = matchs.filter((m: Match) => !m.a_commissaire).length;
    const sansArbitre = matchs.filter((m: Match) => !m.a_arbitre || !m.a_arbitre_assistant_1 || !m.a_arbitre_assistant_2 || !m.a_quatrieme_arbitre).length;
    const complet = matchs.filter((m: Match) => m.a_commissaire && m.a_arbitre && m.a_arbitre_assistant_1 && m.a_arbitre_assistant_2 && m.a_quatrieme_arbitre).length;

    return (
        <div className="animate-fade-in-up">
            {/* Header */}
            <div style={{ marginBottom: '24px' }}>
                <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => navigate('/admin/calendrier')}
                    style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                    <ArrowLeft size={15} /> Retour au calendrier
                </button>

                <div style={{
                    background: 'linear-gradient(135deg, #2D6A4F 0%, #40916C 100%)',
                    borderRadius: '20px',
                    padding: '24px 28px',
                    color: '#fff',
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                        <div>
                            <div style={{ fontSize: '12px', fontWeight: 600, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                                Module 3
                            </div>
                            <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Shield size={24} />
                                Affectation des officiels
                            </h1>
                            <p style={{ margin: '6px 0 0', fontSize: '14px', opacity: 0.8 }}>
                                Affectez les commissaires et arbitres aux matchs
                            </p>
                        </div>
                        <button
                            onClick={handleRefresh}
                            className="btn"
                            style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none' }}
                        >
                            <RefreshCw size={15} /> Rafraîchir
                        </button>
                    </div>

                    {/* Statistiques */}
                    <div style={{
                        marginTop: '20px',
                        display: 'flex',
                        gap: '24px',
                        flexWrap: 'wrap',
                        background: 'rgba(255,255,255,0.1)',
                        borderRadius: '12px',
                        padding: '12px 20px',
                    }}>
                        {[
                            { label: 'Matchs sans officiel', value: matchs.length, color: '#E9C46A' },
                            { label: 'Sans commissaire', value: sansCommissaire, color: '#FEE2E2' },
                            { label: 'Sans arbitre', value: sansArbitre, color: '#FEE2E2' },
                            { label: 'Complets', value: complet, color: '#D8F3DC' },
                        ].map(stat => (
                            <div key={stat.label} style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '22px', fontWeight: 800, color: stat.color }}>{stat.value}</div>
                                <div style={{ fontSize: '11px', opacity: 0.7 }}>{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Filtres */}
            <div style={{
                background: '#fff',
                borderRadius: '16px',
                border: '1px solid #E2E8E0',
                padding: '16px 20px',
                marginBottom: '20px',
                display: 'flex',
                gap: '12px',
                flexWrap: 'wrap',
                alignItems: 'flex-end',
            }}>
                <div style={{ flex: 1, minWidth: '180px' }}>
                    <label className="form-label">Compétition</label>
                    <select
                        className="form-select"
                        value={filterCompetition ?? ''}
                        onChange={(e) => setFilterCompetition(e.target.value ? Number(e.target.value) : null)}
                    >
                        <option value="">Toutes les compétitions</option>
                        {competitions.map(comp => (
                            <option key={comp.id} value={comp.id}>
                                {comp.nom}
                            </option>
                        ))}
                    </select>
                </div>
                <div style={{ minWidth: '160px' }}>
                    <label className="form-label">Date</label>
                    <input
                        type="date"
                        className="form-input"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                    />
                </div>
                {filterDate && (
                    <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => setFilterDate('')}
                        style={{ marginBottom: '2px' }}
                    >
                        <X size={14} /> Effacer
                    </button>
                )}
            </div>

            {/* Liste des matchs */}
            {loadingMatchs ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: '180px', borderRadius: '16px' }} />)}
                </div>
            ) : matchs.length === 0 ? (
                <div className="card" style={{ padding: '60px', textAlign: 'center' }}>
                    <CheckCircle size={48} style={{ color: '#2D6A4F', margin: '0 auto 16px' }} />
                    <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#2C3E2F', marginBottom: '8px' }}>
                        Tous les matchs sont complets !
                    </h3>
                    <p style={{ fontSize: '13px', color: '#6B8E6E' }}>
                        Tous les commissaires et arbitres sont déjà affectés.
                    </p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {matchs.map((match: Match) => (
                        <MatchCard
                            key={match.id}
                            match={match}
                            commissaires={commissaires}
                            arbitres={arbitres}
                            onAffecterCommissaire={handleAffecterCommissaire}
                            onAffecterArbitre={handleAffecterArbitre}
                            isLoadingCommissaires={loadingCommissaires}
                            isLoadingArbitres={loadingArbitres}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

// Composant X (croix) pour l'effacement
const X: React.FC<{ size?: number }> = ({ size = 14 }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

export default AffectationsPage;