// src/pages/responsable/SaisonEnCoursPage.tsx
// Page d'affichage de la saison active en cours pour le responsable du club

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Shield, Info, Layers, BookOpen } from 'lucide-react';
import { getSharedSaisons, getSharedSaison } from '../../api/saisons.api';
import { Avatar } from '../../components/ui/DataTable';

const SaisonEnCoursPage: React.FC = () => {
  const [activeCompId, setActiveCompId] = useState<number | null>(null);

  // 1. Récupérer toutes les saisons pour identifier celle en cours
  const { data: seasonsData, isLoading: isLoadingSeasons } = useQuery({
    queryKey: ['shared-saisons'],
    queryFn: getSharedSaisons,
  });

  const seasons = seasonsData?.data ?? [];
  const activeSeasonCompact = seasons.find((s: any) => s.statut === 'en_cours');

  // 2. Récupérer le détail complet de la saison active (si trouvée)
  const { data: seasonDetailData, isLoading: isLoadingDetail } = useQuery({
    queryKey: ['shared-saison-detail', activeSeasonCompact?.id],
    queryFn: () => getSharedSaison(activeSeasonCompact.id),
    enabled: !!activeSeasonCompact?.id,
  });

  const activeSeason = seasonDetailData?.data;
  const competitions = activeSeason?.competitions ?? [];

  // Définir la compétition sélectionnée par défaut si pas encore choisie
  React.useEffect(() => {
    if (competitions.length > 0 && activeCompId === null) {
      setActiveCompId(competitions[0].id);
    }
  }, [competitions, activeCompId]);

  const selectedCompetition = competitions.find((c: any) => c.id === activeCompId);

  const isLoading = isLoadingSeasons || isLoadingDetail;

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#1B4332] border-t-transparent" />
      </div>
    );
  }

  if (!activeSeason) {
    return (
      <div className="card" style={{ padding: '40px', textAlign: 'center', margin: '20px auto', maxWidth: '600px' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📅</div>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text)', marginBottom: '8px' }}>
          Aucune saison active
        </h2>
        <p style={{ color: 'var(--text-muted)' }}>
          Il n'y a pas de saison actuellement active ou programmée en cours de déroulement. 
          Veuillez repasser plus tard ou contacter l'administration de la FECAFOOT.
        </p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up">
      {/* Hero Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1B4332 0%, #2D6A4F 100%)',
        borderRadius: '20px',
        padding: '32px',
        color: 'white',
        marginBottom: '32px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-md)'
      }}>
        <div style={{
          position: 'absolute',
          top: -20,
          right: -20,
          width: '180px',
          height: '180px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.04)',
        }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
          <div style={{
            background: 'rgba(255,184,0,0.15)',
            color: 'var(--accent)',
            padding: '8px 16px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>
            Saison Active
          </div>
        </div>
        <h1 style={{ fontSize: '28px', fontWeight: 800, margin: '0 0 8px 0', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
          Saison {activeSeason.intitule}
        </h1>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', fontSize: '14px', color: 'rgba(255,255,255,0.85)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={15} style={{ color: 'var(--accent)' }} />
            Début : {new Date(activeSeason.date_debut).toLocaleDateString('fr-FR')}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={15} style={{ color: 'var(--accent)' }} />
            Fin estimée : {new Date(activeSeason.date_fin).toLocaleDateString('fr-FR')}
          </span>
        </div>
      </div>

      {/* Tabs for Competitions */}
      {competitions.length > 0 ? (
        <>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
            {competitions.map((comp: any) => (
              <button
                key={comp.id}
                onClick={() => setActiveCompId(comp.id)}
                className={`btn ${activeCompId === comp.id ? 'btn-primary' : 'btn-ghost'}`}
                style={{ borderRadius: '20px', padding: '8px 20px' }}
              >
                <Shield size={16} />
                {comp.nom}
              </button>
            ))}
          </div>

          {selectedCompetition ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', alignItems: 'start' }}>
              
              {/* Main Panel: Phases & Poules */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                {/* Phases details */}
                {selectedCompetition.phases && selectedCompetition.phases.length > 0 ? (
                  selectedCompetition.phases.map((phase: any) => (
                    <div key={phase.id} className="card" style={{ overflow: 'hidden' }}>
                      <div className="card-header" style={{ background: 'var(--primary-50)', borderBottom: '1px solid rgba(27,67,50,0.1)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <Layers size={18} color="var(--primary)" />
                          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--primary-dark)' }}>
                            {phase.nom}
                          </h3>
                        </div>
                        <span className={`badge ${phase.est_terminee ? 'badge-gray' : 'badge-success'}`}>
                          {phase.est_terminee ? 'Terminée' : 'En cours'}
                        </span>
                      </div>

                      <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {phase.poules && phase.poules.length > 0 ? (
                          phase.poules.map((poule: any) => (
                            <div key={poule.id} style={{ border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
                              <div style={{ background: '#fafafa', padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text)' }}>
                                  {poule.nom}
                                </span>
                                <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>
                                  {poule.clubs?.length ?? 0} clubs engagés
                                </span>
                              </div>

                              {poule.clubs && poule.clubs.length > 0 ? (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', padding: '16px' }}>
                                  {poule.clubs.map((club: any) => (
                                    <div 
                                      key={club.id} 
                                      style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '12px', 
                                        padding: '10px 14px', 
                                        background: '#fff', 
                                        borderRadius: '8px', 
                                        border: '1px solid #f1f5f9',
                                        boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                                      }}
                                    >
                                      <Avatar src={club.logo_url} name={club.nom} size={32} />
                                      <div style={{ minWidth: 0 }}>
                                        <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                          {club.nom}
                                        </div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-light)' }}>
                                          {club.ville}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div style={{ padding: '16px', textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)' }}>
                                  Aucun club affecté à cette poule.
                                </div>
                              )}
                            </div>
                          ))
                        ) : (
                          <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                            Aucune poule n'est configurée pour cette phase.
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="card" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Aucune phase générée pour cette compétition.
                  </div>
                )}
              </div>

              {/* Sidebar Panel: Rules */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div className="card" style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
                    <BookOpen size={18} color="var(--primary)" />
                    <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>
                      Règles de compétition
                    </h3>
                  </div>

                  {selectedCompetition.regles ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--border)', paddingBottom: '8px' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Format</span>
                        <span style={{ fontWeight: 600, color: 'var(--text)' }}>
                          {selectedCompetition.regles.format === 'poule_unique' ? 'Poule Unique' : 'Poules Multiples'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--border)', paddingBottom: '8px' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Clubs max</span>
                        <span style={{ fontWeight: 600, color: 'var(--text)' }}>
                          {selectedCompetition.regles.nb_clubs} clubs
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--border)', paddingBottom: '8px' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Victoire</span>
                        <span style={{ fontWeight: 700, color: 'var(--primary)' }}>
                          +{selectedCompetition.regles.points_victoire} pts
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--border)', paddingBottom: '8px' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Nul</span>
                        <span style={{ fontWeight: 700, color: 'var(--text)' }}>
                          +{selectedCompetition.regles.points_nul} pt
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--border)', paddingBottom: '8px' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Défaite</span>
                        <span style={{ fontWeight: 700, color: 'var(--secondary)' }}>
                          {selectedCompetition.regles.points_defaite} pt
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--border)', paddingBottom: '8px' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Playoffs activés</span>
                        <span className={`badge ${selectedCompetition.regles.a_playoffs ? 'badge-success' : 'badge-gray'}`}>
                          {selectedCompetition.regles.a_playoffs ? 'Oui' : 'Non'}
                        </span>
                      </div>
                      
                      {selectedCompetition.regles.criteres_egalite && (
                        <div style={{ marginTop: '8px' }}>
                          <span style={{ color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                            Critères d'égalité :
                          </span>
                          <ol style={{ paddingLeft: '16px', margin: 0, color: 'var(--text)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {selectedCompetition.regles.criteres_egalite.map((critere: string, index: number) => (
                              <li key={index} style={{ textTransform: 'capitalize' }}>
                                {critere.replace(/_/g, ' ')}
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)' }}>
                      <Info size={16} style={{ marginBottom: '6px' }} />
                      <p>Aucune règle spécifique configurée pour cette compétition.</p>
                    </div>
                  )}
                </div>
              </div>

            </div>
          ) : null}
        </>
      ) : (
        <div className="card" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Aucune compétition configurée pour cette saison.
        </div>
      )}
    </div>
  );
};

export default SaisonEnCoursPage;
