// src/components/matchs/OfficielSelector.tsx
// Sélecteur de commissaire ou arbitre avec indicateur de disponibilité

import React, { useState } from 'react';
import { UserCheck, UserX, MapPin, Shield, Calendar, Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getCommissairesDisponibles, getArbitresDisponibles } from '../../api/matchs.api';

export interface Officiel {
    id: number;
    nom: string;
    email?: string;
    num_licence?: string;
    specification?: string;
    region?: string;
    ville?: string;
    disponible: boolean;
}

interface OfficielSelectorProps {
    type: 'commissaire' | 'arbitre';
    officiels: Officiel[];
    selectedId: number | null;
    onSelect: (id: number | null) => void;
    dateHeure?: string;
    isLoading?: boolean;
    disabled?: boolean;
    specificationFilter?: 'central' | 'assistant' | 'quatrieme';
}

export const OfficielSelector: React.FC<OfficielSelectorProps> = ({
    type,
    officiels: fallbackOfficiels,
    selectedId,
    onSelect,
    dateHeure,
    isLoading: parentIsLoading = false,
    disabled = false,
    specificationFilter,
}) => {
    const [search, setSearch] = useState('');
    const [isOpen, setIsOpen] = useState(false);

    // Fetch available officials for the specific match's date and time if open
    const { data: apiData, isLoading: apiIsLoading } = useQuery({
        queryKey: ['officiels-disponibles', type, dateHeure],
        queryFn: () => type === 'commissaire'
            ? getCommissairesDisponibles({ date_heure: dateHeure })
            : getArbitresDisponibles({ date_heure: dateHeure }),
        enabled: isOpen && !!dateHeure,
    });

    const isLoading = parentIsLoading || apiIsLoading;

    // Use fetched data if available, otherwise use fallback from props
    const rawOfficiels = (isOpen && dateHeure && (apiData as any)?.data) ? (apiData as any).data : fallbackOfficiels;

    const officiels = rawOfficiels.map((o: any) => ({
        ...o,
        disponible: o.disponible ?? true,
    }));

    const selected = fallbackOfficiels.find(o => o.id === selectedId) || ((apiData as any)?.data as any[])?.find(o => o.id === selectedId);

    // Ensure the currently selected official is always in the list
    const finalOfficiels = [...officiels];
    if (selectedId && !finalOfficiels.some(o => o.id === selectedId)) {
        const selObj = fallbackOfficiels.find(o => o.id === selectedId) || selected || {
            id: selectedId,
            nom: 'Officiel affecté',
            disponible: true
        };
        finalOfficiels.unshift({ ...selObj, disponible: true });
    }

    const filtered = finalOfficiels.filter(o => {
        // Filtre par spécification si spécifiée
        if (type === 'arbitre' && specificationFilter && o.specification && o.specification !== specificationFilter) {
            return false;
        }
        if (!search) return true;
        return o.nom.toLowerCase().includes(search.toLowerCase());
    });

    const getIcon = () => {
        if (type === 'commissaire') return <Shield size={16} style={{ color: '#2D6A4F' }} />;
        return <UserCheck size={16} style={{ color: '#2D6A4F' }} />;
    };

    const getLabel = () => {
        if (type === 'commissaire') return 'Commissaire';
        if (specificationFilter === 'central') return 'Arbitre central';
        if (specificationFilter === 'assistant') return 'Arbitre assistant';
        if (specificationFilter === 'quatrieme') return '4e Arbitre';
        return 'Arbitre';
    };

    const getSpecLabel = (spec: string) => {
        const specs: Record<string, string> = {
            central: 'Central',
            assistant: 'Assistant',
            quatrieme: '4e Arbitre',
        };
        return specs[spec] || spec;
    };

    return (
        <div style={{ position: 'relative', width: '100%' }}>
            {/* Bouton de sélection */}
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled || isLoading}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: `1px solid ${selected ? '#2D6A4F' : '#E2E8E0'}`,
                    background: selected ? '#D8F3DC' : '#fff',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    opacity: disabled ? 0.6 : 1,
                    transition: 'all 0.15s',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {getIcon()}
                    <span style={{ fontWeight: 500, fontSize: '13px', color: '#2C3E2F' }}>
                        {selected ? selected.nom : `Sélectionner un ${getLabel()}`}
                    </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {dateHeure && (
                        <span style={{
                            fontSize: '11px',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            background: '#FEF3C7',
                            color: '#92400E',
                        }}>
                            <Calendar size={10} style={{ display: 'inline', marginRight: '4px' }} />
                            {new Date(dateHeure).toLocaleDateString('fr-FR')}
                        </span>
                    )}
                    <span style={{ fontSize: '14px', color: '#6B8E6E' }}>{isOpen ? '▲' : '▼'}</span>
                </div>
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 4px)',
                    left: 0,
                    right: 0,
                    background: '#fff',
                    border: '1px solid #E2E8E0',
                    borderRadius: '12px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    zIndex: 50,
                    maxHeight: '320px',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                }}>
                    {/* Header avec recherche */}
                    <div style={{ padding: '12px', borderBottom: '1px solid #E2E8E0' }}>
                        <div style={{ position: 'relative' }}>
                            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                            <input
                                type="text"
                                placeholder="Rechercher..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '8px 12px 8px 32px',
                                    borderRadius: '8px',
                                    border: '1px solid #E2E8E0',
                                    fontSize: '13px',
                                    outline: 'none',
                                }}
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                    </div>

                    {/* Liste des officiels */}
                    <div style={{ overflowY: 'auto', maxHeight: '260px' }}>
                        {/* Option "Aucun" */}
                        <div
                            onClick={() => {
                                onSelect(null);
                                setIsOpen(false);
                            }}
                            style={{
                                padding: '12px 16px',
                                borderBottom: '1px solid #E2E8E0',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                background: selectedId === null ? '#D8F3DC' : 'transparent',
                                transition: 'background 0.15s',
                            }}
                            onMouseEnter={(e) => {
                                if (selectedId !== null) e.currentTarget.style.background = '#F5F7F5';
                            }}
                            onMouseLeave={(e) => e.currentTarget.style.background = selectedId === null ? '#D8F3DC' : 'transparent'}
                        >
                            <UserX size={16} style={{ color: '#6B8E6E' }} />
                            <span style={{ fontSize: '13px', color: '#6B8E6E' }}>
                                Aucun {type === 'commissaire' ? 'commissaire' : 'arbitre'}
                            </span>
                        </div>

                        {filtered.length === 0 ? (
                            <div style={{ padding: '20px', textAlign: 'center', color: '#94A3B8', fontSize: '13px' }}>
                                Aucun {type} trouvé
                            </div>
                        ) : (
                            filtered.map(officiel => {
                                const isDisponible = officiel.disponible;
                                return (
                                    <div
                                        key={officiel.id}
                                        onClick={() => {
                                            if (isDisponible) {
                                                onSelect(officiel.id);
                                                setIsOpen(false);
                                            }
                                        }}
                                        style={{
                                            padding: '12px 16px',
                                            borderBottom: '1px solid #E2E8E0',
                                            cursor: isDisponible ? 'pointer' : 'not-allowed',
                                            opacity: isDisponible ? 1 : 0.5,
                                            background: selectedId === officiel.id ? '#D8F3DC' : 'transparent',
                                            transition: 'background 0.15s',
                                        }}
                                        onMouseEnter={(e) => {
                                            if (isDisponible && selectedId !== officiel.id) e.currentTarget.style.background = '#F5F7F5';
                                        }}
                                        onMouseLeave={(e) => {
                                            if (selectedId !== officiel.id) e.currentTarget.style.background = 'transparent';
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                                    <span style={{ fontWeight: 600, fontSize: '13px', color: '#2C3E2F' }}>
                                                        {officiel.nom}
                                                    </span>
                                                    {type === 'arbitre' && officiel.specification && (
                                                        <span style={{
                                                            fontSize: '10px',
                                                            padding: '2px 8px',
                                                            borderRadius: '12px',
                                                            background: '#D8F3DC',
                                                            color: '#2D6A4F',
                                                        }}>
                                                            {getSpecLabel(officiel.specification)}
                                                        </span>
                                                    )}
                                                    {!isDisponible && (
                                                        <span style={{
                                                            fontSize: '10px',
                                                            padding: '2px 8px',
                                                            borderRadius: '12px',
                                                            background: '#FEE2E2',
                                                            color: '#991B1B',
                                                        }}>
                                                            Indisponible
                                                        </span>
                                                    )}
                                                </div>
                                                {officiel.ville && (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                                                        <MapPin size={10} style={{ color: '#94A3B8' }} />
                                                        <span style={{ fontSize: '11px', color: '#6B8E6E' }}>{officiel.ville}</span>
                                                    </div>
                                                )}
                                                {type === 'commissaire' && officiel.email && (
                                                    <div style={{ fontSize: '10px', color: '#94A3B8', marginTop: '2px' }}>
                                                        {officiel.email}
                                                    </div>
                                                )}
                                                {type === 'arbitre' && officiel.num_licence && (
                                                    <div style={{ fontSize: '10px', color: '#94A3B8', marginTop: '2px' }}>
                                                        Licence: {officiel.num_licence}
                                                    </div>
                                                )}
                                            </div>
                                            {selectedId === officiel.id && (
                                                <CheckCircle size={16} style={{ color: '#2D6A4F' }} />
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}

            {/* Indicateur de chargement */}
            {isLoading && (
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(255,255,255,0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '10px',
                }}>
                    <div style={{
                        width: '20px',
                        height: '20px',
                        border: '2px solid #2D6A4F',
                        borderTopColor: 'transparent',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite',
                    }} />
                </div>
            )}

            <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    );
};

// Composant d'import pour CheckCircle (ajouter dans les imports)
const CheckCircle: React.FC<{ size?: number; style?: React.CSSProperties }> = ({ size = 16, style }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={style}
    >
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
);

// Ajouter CheckCircle à l'import en haut du fichier
// ou utiliser lucide-react directement