// src/components/matchs/PitchView.tsx
// Vue SVG du terrain de football avec positions tactiques améliorées

import React from 'react';
import { FORMATION_POSTES, type Formation } from '../../api/compositions.api';

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

interface PitchViewProps {
    formation: Formation;
    joueursParPoste: Record<string, { joueurId: number; nom: string; prenom: string; numero: number | null; estCapitaine: boolean; photo_url?: string | null } | null>;
    onPosteClick?: (posteId: string) => void;
    readonly?: boolean;
    onPlayerDrop?: (joueur: any, posteId: string) => void;
}

export const PitchView: React.FC<PitchViewProps> = ({
    formation,
    joueursParPoste,
    onPosteClick,
    readonly = false,
    onPlayerDrop,
}) => {
    const postes = FORMATION_POSTES[formation] || FORMATION_POSTES['4-3-3'];
    const largeur = 850;
    const hauteur = 550;

    const [activeDragPosteId, setActiveDragPosteId] = React.useState<string | null>(null);

    // Couleurs du terrain (style pelouse)
    const terrainColor = '#1a5c2e';
    const ligneColor = '#ffffff';
    const surfaceColor = '#2a7a3e';
    const cercleCentralColor = '#ffffff';

    const handlePosteClick = (posteId: string) => {
        if (!readonly && onPosteClick) {
            onPosteClick(posteId);
        }
    };

    // Fonction pour ajuster la position X selon la ligne (axe longitudinal en horizontal)
    const getPositionX = (ligne: string, baseX: number): number => {
        const offsets: Record<string, number> = {
            gardien: 30, // Décale le gardien vers la droite pour être bien dans les cages
            defense: 0,
            milieu: 8,
            attaque: 15,
        };
        return baseX + (offsets[ligne] || 0);
    };

    return (
        <div style={{
            position: 'relative',
            width: '100%',
            overflowX: 'auto',
            background: 'linear-gradient(135deg, #0d3d1a 0%, #1a5c2e 100%)',
            borderRadius: '20px',
            padding: '20px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
        }}>
            <svg
                viewBox={`0 0 ${largeur} ${hauteur}`}
                style={{
                    width: '100%',
                    height: 'auto',
                    display: 'block',
                    margin: '0 auto',
                    maxWidth: largeur,
                    borderRadius: '12px',
                }}
            >
                {/* Fond du terrain */}
                <rect
                    x="0"
                    y="0"
                    width={largeur}
                    height={hauteur}
                    fill={terrainColor}
                    rx="10"
                />

                {/* Lignes du terrain */}
                <rect
                    x="35"
                    y="20"
                    width={largeur - 70}
                    height={hauteur - 40}
                    fill="none"
                    stroke={ligneColor}
                    strokeWidth="2.5"
                    rx="6"
                />

                {/* Ligne médiane */}
                <line
                    x1={largeur / 2}
                    y1="20"
                    x2={largeur / 2}
                    y2={hauteur - 20}
                    stroke={ligneColor}
                    strokeWidth="2.5"
                />

                {/* Cercle central */}
                <circle
                    cx={largeur / 2}
                    cy={hauteur / 2}
                    r="60"
                    fill="none"
                    stroke={ligneColor}
                    strokeWidth="2.5"
                />

                {/* Point central */}
                <circle
                    cx={largeur / 2}
                    cy={hauteur / 2}
                    r="4"
                    fill={cercleCentralColor}
                />

                {/* Surface de réparation gauche */}
                <rect
                    x="35"
                    y={hauteur / 2 - 120}
                    width="110"
                    height="240"
                    fill={surfaceColor}
                    stroke={ligneColor}
                    strokeWidth="2"
                />

                {/* Surface de réparation droite */}
                <rect
                    x={largeur - 145}
                    y={hauteur / 2 - 120}
                    width="110"
                    height="240"
                    fill={surfaceColor}
                    stroke={ligneColor}
                    strokeWidth="2"
                />

                {/* Surface de but gauche */}
                <rect
                    x="35"
                    y={hauteur / 2 - 50}
                    width="40"
                    height="100"
                    fill="none"
                    stroke={ligneColor}
                    strokeWidth="2"
                />

                {/* Surface de but droite */}
                <rect
                    x={largeur - 75}
                    y={hauteur / 2 - 50}
                    width="40"
                    height="100"
                    fill="none"
                    stroke={ligneColor}
                    strokeWidth="2"
                />

                {/* Point de penalty gauche */}
                <circle
                    cx="120"
                    cy={hauteur / 2}
                    r="3.5"
                    fill={ligneColor}
                />

                {/* Point de penalty droit */}
                <circle
                    cx={largeur - 120}
                    cy={hauteur / 2}
                    r="3.5"
                    fill={ligneColor}
                />

                {/* Arc de cercle gauche */}
                <path
                    d={`M 145 ${hauteur / 2 - 45} A 45 45 0 0 1 145 ${hauteur / 2 + 45}`}
                    fill="none"
                    stroke={ligneColor}
                    strokeWidth="1.5"
                />

                {/* Arc de cercle droit */}
                <path
                    d={`M ${largeur - 145} ${hauteur / 2 - 45} A 45 45 0 0 0 ${largeur - 145} ${hauteur / 2 + 45}`}
                    fill="none"
                    stroke={ligneColor}
                    strokeWidth="1.5"
                />

                {/* Defs block for SVG clipping paths */}
                <defs>
                    {postes.map((p) => {
                        const joueur = joueursParPoste[p.id];
                        if (!joueur) return null;
                        const baseX = (p.y / 100) * largeur;
                        const x = getPositionX(p.ligne, baseX);
                        const y = (p.x / 100) * hauteur;
                        return (
                            <clipPath id={`clip-${p.id}`} key={`clip-${p.id}`}>
                                <circle cx={x} cy={y} r="27.5" />
                            </clipPath>
                        );
                    })}
                </defs>

                {/* Postes des joueurs */}
                {postes.map((poste) => {
                    const joueur = joueursParPoste[poste.id];
                    
                    // Rotation mathématique : y d'origine (longitudinal) -> X horizontal, x d'origine (latéral) -> Y vertical
                    const baseX = (poste.y / 100) * largeur;
                    const x = getPositionX(poste.ligne, baseX);
                    const y = (poste.x / 100) * hauteur;

                    return (
                        <g 
                            key={poste.id}
                            onDragOver={(e) => {
                                if (!readonly) {
                                    e.preventDefault();
                                }
                            }}
                            onDragEnter={(e) => {
                                if (!readonly) {
                                    e.preventDefault();
                                    setActiveDragPosteId(poste.id);
                                }
                            }}
                            onDragLeave={() => {
                                if (!readonly) {
                                    setActiveDragPosteId(null);
                                }
                            }}
                            onDrop={(e) => {
                                if (!readonly) {
                                    e.preventDefault();
                                    setActiveDragPosteId(null);
                                    try {
                                        const dataStr = e.dataTransfer.getData('application/json');
                                        if (dataStr && onPlayerDrop) {
                                            const joueur = JSON.parse(dataStr);
                                            onPlayerDrop(joueur, poste.id);
                                        }
                                    } catch (err) {
                                        console.error('Error handling drop:', err);
                                    }
                                }
                            }}
                        >
                            {/* Ombre du cercle */}
                            <circle
                                cx={x + 2}
                                cy={y + 2}
                                r="30"
                                fill="rgba(0,0,0,0.15)"
                            />

                            {/* Cercle du poste */}
                            <circle
                                cx={x}
                                cy={y}
                                r="30"
                                fill={activeDragPosteId === poste.id 
                                    ? 'rgba(255, 184, 0, 0.25)' 
                                    : joueur 
                                        ? '#1B4332' 
                                        : 'rgba(255,255,255,0.12)'}
                                stroke={activeDragPosteId === poste.id 
                                    ? '#FFB800' 
                                    : joueur 
                                        ? '#FFB800' 
                                        : '#ffffff'}
                                strokeWidth={activeDragPosteId === poste.id ? '4' : '2.5'}
                                strokeOpacity={activeDragPosteId === poste.id || joueur ? 1 : 0.6}
                                style={{ cursor: readonly ? 'default' : 'pointer', transition: 'all 0.2s ease' }}
                                onClick={() => handlePosteClick(poste.id)}
                                onMouseEnter={(e) => {
                                    if (!readonly && !joueur && activeDragPosteId !== poste.id) {
                                        e.currentTarget.setAttribute('fill', 'rgba(255,255,255,0.25)');
                                        e.currentTarget.setAttribute('stroke', '#FFB800');
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!readonly && !joueur && activeDragPosteId !== poste.id) {
                                        e.currentTarget.setAttribute('fill', 'rgba(255,255,255,0.12)');
                                        e.currentTarget.setAttribute('stroke', '#ffffff');
                                    }
                                }}
                            />

                            {/* Contenu joueur (Photo ou Initiales) */}
                            {joueur && (
                                <g pointerEvents="none">
                                    {/* Fallback Initialen / Background inside the circle (radius 27.5) */}
                                    <circle cx={x} cy={y} r="27.5" fill="#2d6a4f" />
                                    <text
                                        x={x}
                                        y={y + 5}
                                        textAnchor="middle"
                                        fontSize="15"
                                        fill="#E9C46A"
                                        fontWeight="800"
                                    >
                                        {((joueur.prenom?.[0] ?? '') + (joueur.nom?.[0] ?? '')).toUpperCase()}
                                    </text>

                                    {/* Photo du joueur avec clipping */}
                                    {joueur.photo_url && (
                                        <image
                                            href={getLogoUrl(joueur.photo_url)!}
                                            x={x - 27.5}
                                            y={y - 27.5}
                                            width="55"
                                            height="55"
                                            preserveAspectRatio="xMidYMid slice"
                                            clipPath={`url(#clip-${poste.id})`}
                                        />
                                    )}
                                </g>
                            )}

                            {/* Étiquette du poste */}
                            <text
                                x={x}
                                y={y - 35}
                                textAnchor="middle"
                                fontSize="10"
                                fill="#A3C4A6"
                                fontWeight="600"
                                letterSpacing="0.5"
                                pointerEvents="none"
                            >
                                {poste.label}
                            </text>

                            {/* Nom du joueur (sous le cercle) */}
                            {joueur && (
                                <g pointerEvents="none" style={{ textShadow: '0px 1.5px 3px rgba(0, 0, 0, 0.95)' }}>
                                    <text
                                        x={x}
                                        y={y + 42}
                                        textAnchor="middle"
                                        fontSize="11"
                                        fill="#ffffff"
                                        fontWeight="700"
                                        letterSpacing="-0.2"
                                    >
                                        {joueur.prenom.length > 8 ? joueur.prenom.substring(0, 7) + '..' : joueur.prenom}
                                    </text>
                                    <text
                                        x={x}
                                        y={y + 53}
                                        textAnchor="middle"
                                        fontSize="10"
                                        fill="#E9C46A"
                                        fontWeight="600"
                                    >
                                        {joueur.nom.length > 10 ? joueur.nom.substring(0, 9) + '..' : joueur.nom}
                                    </text>

                                    {/* Badge Numéro de maillot au coin inférieur droit */}
                                    {joueur.numero !== null && (
                                        <g>
                                            <circle cx={x + 20} cy={y + 20} r="9.5" fill="#FFB800" stroke="#1B4332" strokeWidth="1.5" />
                                            <text
                                                x={x + 20}
                                                y={y + 23}
                                                textAnchor="middle"
                                                fontSize="10"
                                                fill="#1B4332"
                                                fontWeight="800"
                                            >
                                                {joueur.numero}
                                            </text>
                                        </g>
                                    )}

                                    {/* Étoile capitaine au coin supérieur droit */}
                                    {joueur.estCapitaine && (
                                        <g>
                                            <circle cx={x + 20} cy={y - 20} r="9.5" fill="#1B4332" stroke="#FFB800" strokeWidth="1.5" />
                                            <text
                                                x={x + 20}
                                                y={y - 17}
                                                textAnchor="middle"
                                                fontSize="11"
                                                fill="#FFB800"
                                                fontWeight="900"
                                            >
                                                ★
                                            </text>
                                        </g>
                                    )}
                                </g>
                            )}

                            {/* Icône "+" si vide et pas readonly */}
                            {!joueur && !readonly && (
                                <text
                                    x={x}
                                    y={y + 6}
                                    textAnchor="middle"
                                    fontSize="22"
                                    fill="#ffffff"
                                    fontWeight="300"
                                    opacity="0.6"
                                    pointerEvents="none"
                                >
                                    +
                                </text>
                            )}
                        </g>
                    );
                })}
            </svg>

            {/* Légende améliorée */}
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '28px',
                marginTop: '20px',
                padding: '14px 20px',
                background: 'rgba(0,0,0,0.7)',
                backdropFilter: 'blur(8px)',
                borderRadius: '40px',
                flexWrap: 'wrap',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '18px', height: '18px', borderRadius: '9px', background: '#1B4332', border: '2px solid #FFB800' }} />
                    <span style={{ fontSize: '12px', color: '#ffffff', fontWeight: 500 }}>Titulaire</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '18px', height: '18px', borderRadius: '9px', background: 'rgba(255,255,255,0.15)', border: '2px solid #ffffff' }} />
                    <span style={{ fontSize: '12px', color: '#ffffff', fontWeight: 500 }}>Poste libre</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '16px', color: '#FFB800' }}>⭐</span>
                    <span style={{ fontSize: '12px', color: '#ffffff', fontWeight: 500 }}>Capitaine</span>
                </div>
                {!readonly && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '18px', color: '#ffffff', fontWeight: 300, opacity: 0.7 }}>+</span>
                        <span style={{ fontSize: '12px', color: '#ffffff', fontWeight: 500 }}>Cliquer pour placer</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PitchView;