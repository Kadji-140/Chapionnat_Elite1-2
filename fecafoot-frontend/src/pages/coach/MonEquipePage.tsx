// src/pages/coach/MonEquipePage.tsx
// Page d'effectif et de statistiques d'équipe pour le coach

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Users, Search, AlertCircle, Clock,
  ArrowLeft, Activity, Award
} from 'lucide-react';
import api from '../../api/axios';
import { ValidationBadge } from '../../components/ui/Badge';
import { SkeletonTable, EmptyState, Avatar } from '../../components/ui/DataTable';
import { useTranslation } from '../../hooks/useTranslation';

// Mappe des catégories de postes
const getPosteCategory = (poste: string | null): 'gardien' | 'defenseur' | 'milieu' | 'attaquant' | 'inconnu' => {
  if (!poste) return 'inconnu';
  const p = poste.toLowerCase();
  if (p.includes('gardien')) return 'gardien';
  if (p.includes('defenseur') || p.includes('lateral') || p.includes('def')) return 'defenseur';
  if (p.includes('milieu')) return 'milieu';
  if (p.includes('attaquant') || p.includes('avant') || p.includes('ailier')) return 'attaquant';
  return 'inconnu';
};

const getPosteLabel = (poste: string | null, isEn: boolean): string => {
  if (!poste) return isEn ? 'Undefined Position' : 'Poste non défini';
  
  const mapFr: Record<string, string> = {
    gardien: 'Gardien de but',
    defenseur_central: 'Défenseur central',
    lateral_droit: 'Latéral droit',
    lateral_gauche: 'Latéral gauche',
    milieu_defensif: 'Milieu défensif',
    milieu_central: 'Milieu central',
    milieu_offensif: 'Milieu offensif',
    ailier_droit: 'Ailier droit',
    ailier_gauche: 'Ailier gauche',
    attaquant_centre: 'Attaquant de pointe',
    avant_centre: 'Avant-centre',
  };

  const mapEn: Record<string, string> = {
    gardien: 'Goalkeeper',
    defenseur_central: 'Centre-back',
    lateral_droit: 'Right-back',
    lateral_gauche: 'Left-back',
    milieu_defensif: 'Defensive midfielder',
    milieu_central: 'Central midfielder',
    milieu_offensif: 'Attacking midfielder',
    ailier_droit: 'Right winger',
    ailier_gauche: 'Left winger',
    attaquant_centre: 'Striker',
    avant_centre: 'Centre-forward',
  };

  return isEn ? (mapEn[poste] ?? poste) : (mapFr[poste] ?? poste);
};

export const MonEquipePage: React.FC = () => {
  const navigate = useNavigate();
  const { lang } = useTranslation();
  const isEn = lang === 'en';

  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'gardien' | 'defenseur' | 'milieu' | 'attaquant'>('all');
  const [pageTab, setPageTab] = useState<'effectif' | 'stats'>('effectif');

  const { data: responseData, isLoading, error } = useQuery({
    queryKey: ['coach-joueurs-effectif'],
    queryFn: () => api.get('/coach/joueurs').then(r => r.data),
  });

  const { data: statsData, isLoading: isLoadingStats } = useQuery({
    queryKey: ['coach-joueurs-stats'],
    queryFn: () => api.get('/coach/joueurs/stats').then(r => r.data),
    enabled: pageTab === 'stats',
  });

  const joueurs = responseData?.data ?? [];
  const stats = responseData?.stats ?? { total: 0, valides: 0, en_attente: 0, rejetes: 0, soumis: 0 };

  // Calculer l'âge moyen
  const totalAge = joueurs.reduce((sum: number, j: any) => sum + (j.age || 0), 0);
  const avgAge = joueurs.length > 0 ? (totalAge / joueurs.length).toFixed(1) : '—';

  // Filtrer les joueurs de l'effectif
  let filtered = joueurs;
  if (activeTab !== 'all') {
    filtered = filtered.filter((j: any) => getPosteCategory(j.poste) === activeTab);
  }
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    filtered = filtered.filter((j: any) =>
      j.nom_complet?.toLowerCase().includes(term) ||
      j.num_licence?.toLowerCase().includes(term) ||
      (j.num_maillot && String(j.num_maillot).includes(term))
    );
  }

  // Filtrer les stats individuelles
  const statsList: any[] = statsData?.data ?? [];
  let filteredStats = statsList;
  if (activeTab !== 'all') {
    filteredStats = filteredStats.filter((s: any) => getPosteCategory(s.joueur?.poste) === activeTab);
  }
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    filteredStats = filteredStats.filter((s: any) => {
      const nomComplet = `${s.joueur?.prenom} ${s.joueur?.nom}`.toLowerCase();
      return nomComplet.includes(term) ||
        (s.joueur?.numero_maillot && String(s.joueur.numero_maillot).includes(term));
    });
  }

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => navigate('/coach/dashboard')}
          style={{ marginBottom: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <ArrowLeft size={15} /> {isEn ? 'Dashboard' : 'Tableau de bord'}
        </button>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 className="page-title">{isEn ? 'My Team' : 'Mon Équipe'}</h1>
            <p className="page-subtitle">{isEn ? 'Complete roster and squad license validation status' : "Roster complet et statut de validation des licences de l'effectif"}</p>
          </div>
        </div>
      </div>

      {/* Onglets Principaux */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '24px' }}>
        <button
          onClick={() => setPageTab('effectif')}
          className="btn"
          style={{
            background: 'transparent',
            borderRadius: '0',
            borderBottom: pageTab === 'effectif' ? '2.5px solid var(--primary)' : '2.5px solid transparent',
            color: pageTab === 'effectif' ? 'var(--primary)' : 'var(--text-muted)',
            padding: '12px 20px',
            fontWeight: 700,
            boxShadow: 'none'
          }}
        >
          {isEn ? 'Roster (Licenses)' : 'Effectif (Licences)'}
        </button>
        <button
          onClick={() => setPageTab('stats')}
          className="btn"
          style={{
            background: 'transparent',
            borderRadius: '0',
            borderBottom: pageTab === 'stats' ? '2.5px solid var(--primary)' : '2.5px solid transparent',
            color: pageTab === 'stats' ? 'var(--primary)' : 'var(--text-muted)',
            padding: '12px 20px',
            fontWeight: 700,
            boxShadow: 'none'
          }}
        >
          {isEn ? 'Individual Statistics' : 'Statistiques Individuelles'}
        </button>
      </div>

      {pageTab === 'effectif' && (
        <>
          {/* Raccourcis Statistiques d'équipe */}
          {!isLoading && !error && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '16px',
              marginBottom: '24px'
            }}>
              {/* Total Effectif */}
              <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ background: 'rgba(27, 67, 50, 0.08)', padding: '12px', borderRadius: '12px', color: 'var(--primary)' }}>
                  <Users size={24} />
                </div>
                <div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text)' }}>{stats.total}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{isEn ? 'Registered players' : 'Joueurs enregistrés'}</div>
                </div>
              </div>

              {/* Joueurs Validés */}
              <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ background: 'rgba(21, 128, 61, 0.08)', padding: '12px', borderRadius: '12px', color: '#15803d' }}>
                  <Award size={24} />
                </div>
                <div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#15803d' }}>{stats.valides}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{isEn ? 'Validated licenses' : 'Licences validées'}</div>
                </div>
              </div>

              {/* En attente */}
              <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ background: 'rgba(217, 119, 6, 0.08)', padding: '12px', borderRadius: '12px', color: '#d97706' }}>
                  <Clock size={24} />
                </div>
                <div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#d97706' }}>{stats.en_attente}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{isEn ? 'Pending validation' : 'En attente de validation'}</div>
                </div>
              </div>

              {/* Âge Moyen */}
              <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ background: 'rgba(37, 99, 235, 0.08)', padding: '12px', borderRadius: '12px', color: '#2563eb' }}>
                  <Activity size={24} />
                </div>
                <div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#2563eb' }}>{avgAge} {isEn ? 'years' : 'ans'}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{isEn ? 'Average squad age' : "Âge moyen de l'équipe"}</div>
                </div>
              </div>
            </div>
          )}

          {/* Section Filtres & Recherche */}
          <div className="card" style={{ padding: '18px 24px', marginBottom: '24px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px',
            }}>
              {/* Catégories de poste */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {([
                  { id: 'all', label: isEn ? 'All' : 'Tous' },
                  { id: 'gardien', label: isEn ? 'Goalkeepers' : 'Gardiens' },
                  { id: 'defenseur', label: isEn ? 'Defenders' : 'Défenseurs' },
                  { id: 'milieu', label: isEn ? 'Midfielders' : 'Milieux' },
                  { id: 'attaquant', label: isEn ? 'Forwards' : 'Attaquants' },
                ] as const).map(t => (
                  <button
                    key={t.id}
                    className={`tab-btn ${activeTab === t.id ? 'active' : ''}`}
                    onClick={() => setActiveTab(t.id)}
                    style={{
                      padding: '6px 14px',
                      fontSize: '13px',
                      fontWeight: 600,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      border: '1px solid var(--border)',
                      background: activeTab === t.id ? 'var(--primary)' : '#fff',
                      color: activeTab === t.id ? '#fff' : 'var(--text-muted)',
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Barre de Recherche */}
              <div style={{ position: 'relative', minWidth: '260px' }}>
                <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input
                  type="text"
                  className="form-input"
                  placeholder={isEn ? 'Name, license or jersey number...' : 'Nom, n° licence ou maillot...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ paddingLeft: '34px', fontSize: '13px', borderRadius: '8px' }}
                />
              </div>
            </div>
          </div>

          {/* Liste des Joueurs */}
          {isLoading ? (
            <div className="card" style={{ padding: '24px' }}>
              <SkeletonTable rows={6} cols={6} />
            </div>
          ) : error ? (
            <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
              <AlertCircle size={48} style={{ color: 'var(--secondary)', margin: '0 auto 16px' }} />
              <h3 style={{ fontWeight: 700, margin: 0 }}>{isEn ? 'Unable to load roster' : "Impossible de charger l'effectif"}</h3>
              <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>{isEn ? 'An error occurred while retrieving data.' : 'Une erreur est survenue lors de la récupération des données.'}</p>
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              title={isEn ? 'No players found' : 'Aucun joueur trouvé'}
              description={searchTerm 
                ? (isEn ? 'Modify your search to find other players.' : "Modifiez votre recherche pour trouver d'autres joueurs.")
                : (isEn ? 'No players in this category.' : "Aucun joueur dans cette catégorie.")}
            />
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '20px'
            }}>
              {filtered.map((j: any) => (
                <div
                  key={j.id}
                  className="card stagger-item"
                  onClick={() => navigate('/coach/joueurs/' + j.id)}
                  style={{
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px',
                    transition: 'var(--transition)',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-card)';
                  }}
                >
                  {/* Entête joueur : Photo + Nom + Numéro */}
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <Avatar src={j.photo_url} name={j.nom_complet} size={50} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          background: 'rgba(27, 67, 50, 0.1)',
                          color: 'var(--primary)',
                          fontWeight: 800,
                          fontSize: '15px',
                          width: '30px',
                          height: '30px',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          {j.num_maillot || '—'}
                        </span>
                        <h3 style={{
                          margin: 0,
                          fontWeight: 700,
                          fontSize: '15px',
                          color: 'var(--text)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {j.nom_complet}
                        </h3>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {getPosteLabel(j.poste, isEn)}
                      </div>
                    </div>
                  </div>

                  {/* Détails physiques / techniques */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '8px 16px',
                    fontSize: '12px',
                    padding: '10px 12px',
                    background: '#f8fafc',
                    borderRadius: '8px'
                  }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>{isEn ? 'Age:' : 'Âge :'}</span>{' '}
                      <strong style={{ color: 'var(--text)' }}>{j.age ? `${j.age} ${isEn ? 'years' : 'ans'}` : '—'}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>{isEn ? 'License:' : 'Licence :'}</span>{' '}
                      <code style={{ fontSize: '11px', background: '#fff', border: '1px solid #e2e8f0', padding: '1px 4px', borderRadius: '4px' }}>
                        {j.num_licence}
                      </code>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>{isEn ? 'Height:' : 'Taille :'}</span>{' '}
                      <strong style={{ color: 'var(--text)' }}>{j.taille_cm ? `${j.taille_cm} cm` : '—'}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>{isEn ? 'Weight:' : 'Poids :'}</span>{' '}
                      <strong style={{ color: 'var(--text)' }}>{j.poids_kg ? `${j.poids_kg} kg` : '—'}</strong>
                    </div>
                  </div>

                  {/* Statut de validation de la licence par la FECAFOOT */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderTop: '1px solid #f1f5f9',
                    paddingTop: '10px',
                    fontSize: '12px'
                  }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{isEn ? 'FECAFOOT License:' : 'Licence FECAFOOT :'}</span>
                    <ValidationBadge statut={j.statut_validation} />
                  </div>

                  {/* Motif de rejet si existant */}
                  {j.motif_rejet && j.statut_validation === 'rejete' && (
                    <div style={{
                      padding: '8px 12px',
                      background: 'rgba(229, 57, 70, 0.08)',
                      border: '1px solid rgba(229, 57, 70, 0.2)',
                      borderRadius: '8px',
                      color: 'var(--secondary-dark)',
                      fontSize: '11px',
                      lineHeight: 1.4
                    }}>
                      <strong>{isEn ? 'Rejection reason:' : 'Motif du rejet :'}</strong> {j.motif_rejet}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {pageTab === 'stats' && (
        <>
          {/* Section Filtres & Recherche */}
          <div className="card" style={{ padding: '18px 24px', marginBottom: '24px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px',
            }}>
              {/* Catégories de poste */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {([
                  { id: 'all', label: isEn ? 'All' : 'Tous' },
                  { id: 'gardien', label: isEn ? 'Goalkeepers' : 'Gardiens' },
                  { id: 'defenseur', label: isEn ? 'Defenders' : 'Défenseurs' },
                  { id: 'milieu', label: isEn ? 'Midfielders' : 'Milieux' },
                  { id: 'attaquant', label: isEn ? 'Forwards' : 'Attaquants' },
                ] as const).map(t => (
                  <button
                    key={t.id}
                    className={`tab-btn ${activeTab === t.id ? 'active' : ''}`}
                    onClick={() => setActiveTab(t.id)}
                    style={{
                      padding: '6px 14px',
                      fontSize: '13px',
                      fontWeight: 600,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      border: '1px solid var(--border)',
                      background: activeTab === t.id ? 'var(--primary)' : '#fff',
                      color: activeTab === t.id ? '#fff' : 'var(--text-muted)',
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Barre de Recherche */}
              <div style={{ position: 'relative', minWidth: '260px' }}>
                <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input
                  type="text"
                  className="form-input"
                  placeholder={isEn ? 'Name or number...' : 'Nom ou numéro...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ paddingLeft: '34px', fontSize: '13px', borderRadius: '8px' }}
                />
              </div>
            </div>
          </div>

          {isLoadingStats ? (
            <div className="card" style={{ padding: '24px' }}>
              <SkeletonTable rows={6} cols={8} />
            </div>
          ) : filteredStats.length === 0 ? (
            <EmptyState
              title={isEn ? 'No statistics found' : 'Aucune statistique trouvée'}
              description={isEn ? 'No player has recorded statistics yet or matches your filters.' : "Aucun joueur n'a encore enregistré de statistiques ou ne correspond à vos filtres."}
            />
          ) : (
            <div className="card" style={{ overflowX: 'auto', padding: '0' }}>
              <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{isEn ? 'Player' : 'Joueur'}</th>
                    <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'center' }}>{isEn ? 'Number' : 'Numéro'}</th>
                    <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'center' }}>{isEn ? 'Matches Played' : 'Matchs Joués'}</th>
                    <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'center' }}>{isEn ? 'Goals' : 'Buts'}</th>
                    <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'center' }}>{isEn ? 'Assists' : 'Passes D.'}</th>
                    <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'center' }}>{isEn ? 'Minutes' : 'Minutes'}</th>
                    <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'center' }}>{isEn ? 'Yellows' : 'Jaunes'}</th>
                    <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'center' }}>{isEn ? 'Reds' : 'Rouges'}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStats.map((s: any) => (
                    <tr 
                      key={s.id} 
                      onClick={() => navigate('/coach/joueurs/' + s.joueur?.id)}
                      style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s', cursor: 'pointer' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <Avatar src={s.joueur?.photo_url} name={`${s.joueur?.prenom} ${s.joueur?.nom}`} size={36} />
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text)' }}>
                              {s.joueur?.prenom} {s.joueur?.nom}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                              {getPosteLabel(s.joueur?.poste, isEn)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                        <span style={{ background: '#f1f5f9', color: '#475569', fontWeight: 700, padding: '3px 8px', borderRadius: '6px', fontSize: '12px' }}>
                          {s.joueur?.numero_maillot || '—'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 20px', textAlign: 'center', fontWeight: 700, color: 'var(--text)' }}>
                        {s.nb_matchs}
                      </td>
                      <td style={{ padding: '14px 20px', textAlign: 'center', fontWeight: 700, color: '#16a34a' }}>
                        {s.buts}
                      </td>
                      <td style={{ padding: '14px 20px', textAlign: 'center', fontWeight: 700, color: 'var(--primary)' }}>
                        {s.passes_decisives}
                      </td>
                      <td style={{ padding: '14px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        {s.minutes_jouees}'
                      </td>
                      <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                        {s.cartons_jaunes > 0 ? (
                          <span style={{ background: '#fef08a', color: '#854d0e', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', fontSize: '11px' }}>
                            {s.cartons_jaunes}
                          </span>
                        ) : '0'}
                      </td>
                      <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                        {s.cartons_rouges > 0 ? (
                          <span style={{ background: '#fee2e2', color: '#991b1b', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', fontSize: '11px' }}>
                            {s.cartons_rouges}
                          </span>
                        ) : '0'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MonEquipePage;
