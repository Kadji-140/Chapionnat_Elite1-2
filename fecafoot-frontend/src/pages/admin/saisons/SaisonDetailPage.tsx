// src/pages/admin/saisons/SaisonDetailPage.tsx
// Vue détail d'une saison : onglets Compétitions, Phases, Poules, Aperçu

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Trophy, LayoutGrid, GitBranch,
  Zap, CheckCircle2, AlertCircle, Settings
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getSaison, getCompetitions, initialiserCompetitions,
  getPhases, genererPhases, basculerPhase,
  type Saison, type Competition, type Phase,
} from '../../../api/saisons.api';
import { ConfirmDialog } from '../../../components/ui/Modal';

// ── Badge statut ───────────────────────────────────────────────
const StatutBadge: React.FC<{ statut: string; label?: string }> = ({ statut, label }) => {
  const colors: Record<string, { bg: string; color: string }> = {
    planifiee: { bg: '#fef3c7', color: '#b45309' },
    en_cours: { bg: '#dcfce7', color: '#15803d' },
    terminee: { bg: '#f1f5f9', color: '#64748b' },
    en_attente: { bg: '#f1f5f9', color: '#64748b' },
  };
  const c = colors[statut] ?? { bg: '#f1f5f9', color: '#64748b' };
  return (
    <span style={{
      padding: '3px 10px', borderRadius: '20px',
      fontSize: '12px', fontWeight: 600,
      background: c.bg, color: c.color,
    }}>
      {label ?? statut}
    </span>
  );
};

// ── Timeline des phases ────────────────────────────────────────
const PhaseTimeline: React.FC<{
  phases: Phase[];
  onBasculer: (phase: Phase) => void;
  isLoading: boolean;
}> = ({ phases, onBasculer, isLoading }) => {
  if (phases.length === 0) return null;

  const typeColors: Record<string, string> = {
    reguliere: '#1B4332',
    playoff_up: '#2563eb',
    playoff_down: '#d97706',
    barrage: '#7c3aed',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
      {phases.map((phase, idx) => (
        <div key={phase.id} style={{ display: 'flex', gap: '16px' }}>
          {/* Connecteur vertical */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '40px', flexShrink: 0 }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '50%',
              background: phase.statut === 'en_cours' ? typeColors[phase.type] : '#f1f5f9',
              border: `2px solid ${typeColors[phase.type]}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: phase.statut === 'en_cours' ? '#fff' : typeColors[phase.type],
              fontWeight: 700, fontSize: '14px',
            }}>
              {idx + 1}
            </div>
            {idx < phases.length - 1 && (
              <div style={{ width: '2px', flex: 1, background: '#e2e8f0', margin: '4px 0' }} />
            )}
          </div>

          {/* Contenu de la phase */}
          <div style={{
            flex: 1, background: '#fff', border: '1px solid #e2e8f0',
            borderRadius: '12px', padding: '16px', marginBottom: '8px',
            borderLeft: `3px solid ${typeColors[phase.type]}`,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b' }}>{phase.nom}</span>
                  <StatutBadge statut={phase.statut} label={phase.statut === 'en_cours' ? '▶ En cours' : phase.statut === 'terminee' ? '✓ Terminée' : 'En attente'} />
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                  {phase.nb_poules} poule{phase.nb_poules > 1 ? 's' : ''}
                  {phase.date_debut && ` · ${new Date(phase.date_debut).toLocaleDateString('fr-FR')}`}
                  {phase.date_fin && ` → ${new Date(phase.date_fin).toLocaleDateString('fr-FR')}`}
                </div>
              </div>
              {phase.statut === 'en_cours' && (
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => onBasculer(phase)}
                  disabled={isLoading}
                >
                  <GitBranch size={13} /> Basculer vers la suivante
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// ── Carte Compétition ─────────────────────────────────────────
const CompetitionCard: React.FC<{
  competition: Competition;
  saisonId: number;
}> = ({ competition, saisonId }) => {
  const navigate = useNavigate();
  const isEliteOne = competition.niveau === 'elite_one';

  return (
    <div style={{
      background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px',
      overflow: 'hidden', transition: 'all 0.2s',
    }}
      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)')}
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = 'none')}
    >
      {/* Header coloré */}
      <div style={{
        background: isEliteOne
          ? 'linear-gradient(135deg, #1B4332, #2D6A4F)'
          : 'linear-gradient(135deg, #846D42, #A89368)',
        padding: '20px', color: '#fff',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          {isEliteOne ? <Trophy size={20} style={{ color: '#FFB800' }} /> : <Zap size={20} style={{ color: '#FDE68A' }} />}
          <span style={{ fontSize: '13px', fontWeight: 600, opacity: 0.8 }}>{competition.niveau_label}</span>
        </div>
        <div style={{ fontSize: '18px', fontWeight: 800 }}>{competition.nom}</div>
        <div style={{ marginTop: '8px' }}>
          <StatutBadge statut={competition.statut} label={competition.statut_label} />
        </div>
      </div>

      {/* Stats */}
      <div style={{ padding: '16px 20px' }}>
        {competition.regles ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            {[
              { label: 'Clubs', value: competition.regles.nb_clubs },
              { label: 'Poules', value: competition.regles.nb_poules },
              { label: 'Playoffs', value: competition.regles.a_playoffs ? 'Oui' : 'Non' },
              { label: 'Journées', value: competition.regles.nb_matchs_par_club ?? '—' },
            ].map(stat => (
              <div key={stat.label} style={{ textAlign: 'center', padding: '8px', background: '#f8fafc', borderRadius: '8px' }}>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#1e293b' }}>{stat.value}</div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            padding: '12px', background: '#fef9c3', borderRadius: '8px',
            fontSize: '12px', color: '#92400e', marginBottom: '16px',
            display: 'flex', alignItems: 'center', gap: '6px',
          }}>
            <AlertCircle size={14} /> Règles non configurées
          </div>
        )}

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="btn btn-primary btn-sm"
            style={{ flex: 1 }}
            onClick={() => navigate(`/admin/saisons/${saisonId}/competitions/${competition.id}`)}
          >
            <Settings size={13} /> Configurer
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Page principale ────────────────────────────────────────────
const SaisonDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const saisonId = Number(id);

  const [activeTab, setActiveTab] = useState<'competitions' | 'phases' | 'poules' | 'apercu'>('competitions');
  const [confirmBasculer, setConfirmBasculer] = useState<Phase | null>(null);

  const { data: saisonData, isLoading: loadingSaison } = useQuery({
    queryKey: ['admin-saison', saisonId],
    queryFn: () => getSaison(saisonId),
  });

  const { data: competitionsData, isLoading: loadingComps } = useQuery({
    queryKey: ['admin-competitions', saisonId],
    queryFn: () => getCompetitions(saisonId),
  });

  const saison: Saison | undefined = saisonData?.data;
  const competitions: Competition[] = competitionsData?.data ?? [];

  // Phases de toutes les compétitions
  const [allPhases, setAllPhases] = useState<Phase[]>([]);

  // ⭐ Query pour charger les phases
  const { refetch: refetchPhases, isLoading: loadingPhases } = useQuery({
    queryKey: ['admin-phases-all', saisonId],
    queryFn: async () => {
      const comps = competitionsData?.data ?? [];
      const phases: Phase[] = [];
      for (const comp of comps) {
        try {
          const res = await getPhases(comp.id);
          phases.push(...(res.data ?? []));
        } catch (e) { /* ignore */ }
      }
      setAllPhases(phases);
      return phases;
    },
    enabled: false, // ⭐ Désactivé par défaut, on l'appelle manuellement
  });

  // ⭐ Charge les phases au premier chargement et quand on change d'onglet
  useEffect(() => {
    if (competitionsData?.data && (activeTab === 'phases' || activeTab === 'poules')) {
      refetchPhases();
    }
  }, [competitionsData, activeTab, refetchPhases]);

  const initialiserMutation = useMutation({
    mutationFn: () => initialiserCompetitions(saisonId),
    onSuccess: () => {
      toast.success('Compétitions Elite One et Elite Two initialisées !');
      queryClient.invalidateQueries({ queryKey: ['admin-competitions', saisonId] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Erreur.'),
  });

  const genererPhasesMutation = useMutation({
    mutationFn: (competitionId: number) => genererPhases(competitionId),
    onSuccess: () => {
      toast.success('Phases générées avec succès !');
      refetchPhases();
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Erreur.'),
  });

  const basculerMutation = useMutation({
    mutationFn: (phaseId: number) => basculerPhase(phaseId),
    onSuccess: (res) => {
      toast.success(res.message ?? 'Phase basculée.');
      setConfirmBasculer(null);
      refetchPhases();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message ?? 'Erreur lors du basculement.');
      setConfirmBasculer(null);
    },
  });

  if (loadingSaison) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div style={{ width: 48, height: 48, border: '3px solid #1B4332', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  if (!saison) return null;

  const tabs = [
    { id: 'competitions', label: 'Compétitions', icon: <Trophy size={15} /> },
    { id: 'phases', label: 'Phases', icon: <GitBranch size={15} /> },
    { id: 'poules', label: 'Poules', icon: <LayoutGrid size={15} /> },
    { id: 'apercu', label: 'Aperçu', icon: <LayoutGrid size={15} /> },
  ] as const;

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => navigate('/admin/saisons')}
          style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <ArrowLeft size={15} /> Retour aux saisons
        </button>

        <div style={{
          background: 'linear-gradient(135deg, #1B4332 0%, #2D6A4F 100%)',
          borderRadius: '20px', padding: '24px 28px', color: '#fff',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, opacity: 0.7, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Saison
              </div>
              <h1 style={{ fontSize: '28px', fontWeight: 800, margin: 0 }}>{saison.intitule}</h1>
              <div style={{ marginTop: '8px', fontSize: '14px', opacity: 0.8 }}>
                📅 {new Date(saison.date_debut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                {' → '}
                {new Date(saison.date_fin).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
            </div>
            <div style={{
              background: saison.statut === 'en_cours' ? 'rgba(255,184,0,0.2)' : 'rgba(255,255,255,0.15)',
              border: `1px solid ${saison.statut === 'en_cours' ? '#FFB800' : 'rgba(255,255,255,0.2)'}`,
              borderRadius: '12px', padding: '12px 20px', textAlign: 'center',
            }}>
              <div style={{ fontSize: '12px', opacity: 0.7, marginBottom: '4px' }}>Statut</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: saison.statut === 'en_cours' ? '#FFB800' : '#fff' }}>
                {saison.statut === 'en_cours' ? '🟢 En cours' : saison.statut === 'planifiee' ? '🟡 Planifiée' : '⚫ Terminée'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Onglets */}
      <div className="tabs" style={{ marginBottom: '24px' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Onglet Compétitions */}
      {activeTab === 'competitions' && (
        <div className="animate-fade-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Compétitions de la saison</h2>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>
                Une saison contient exactement 2 compétitions : Elite One et Elite Two.
              </p>
            </div>
            {competitions.length < 2 && (
              <button
                className="btn btn-primary"
                onClick={() => initialiserMutation.mutate()}
                disabled={initialiserMutation.isPending}
              >
                <Zap size={15} />
                {initialiserMutation.isPending ? 'Initialisation...' : 'Initialiser les compétitions'}
              </button>
            )}
          </div>

          {loadingComps ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {[1, 2].map(i => <div key={i} className="card skeleton" style={{ height: '250px' }} />)}
            </div>
          ) : competitions.length === 0 ? (
            <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>🏆</div>
              <p style={{ color: '#64748b', marginBottom: '16px' }}>
                Aucune compétition configurée. Cliquez sur "Initialiser les compétitions" pour créer Elite One et Elite Two automatiquement.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
              {competitions.map(comp => (
                <CompetitionCard key={comp.id} competition={comp} saisonId={saisonId} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Onglet Phases */}
      {activeTab === 'phases' && (
        <div className="animate-fade-in">
          {competitions.length === 0 ? (
            <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
              <AlertCircle size={40} style={{ color: '#d97706', margin: '0 auto 12px', display: 'block' }} />
              <p style={{ color: '#64748b' }}>Configurez d'abord les compétitions avant de générer les phases.</p>
            </div>
          ) : (
            competitions.map(comp => {
              const phases = allPhases.filter(p => p.competition_id === comp.id);
              return (
                <div key={comp.id} style={{ marginBottom: '28px' }}>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    marginBottom: '16px', padding: '12px 16px',
                    background: comp.niveau === 'elite_one' ? 'rgba(27,67,50,0.05)' : 'rgba(132,109,66,0.05)',
                    borderRadius: '10px', border: `1px solid ${comp.niveau === 'elite_one' ? 'rgba(27,67,50,0.15)' : 'rgba(132,109,66,0.15)'}`,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
                      {comp.niveau === 'elite_one' ? <Trophy size={16} style={{ color: '#1B4332' }} /> : <Zap size={16} style={{ color: '#846D42' }} />}
                      {comp.nom}
                    </div>
                    {phases.length === 0 && (
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => genererPhasesMutation.mutate(comp.id)}
                        disabled={genererPhasesMutation.isPending}
                      >
                        <GitBranch size={13} />
                        {genererPhasesMutation.isPending ? 'Génération...' : 'Générer les phases'}
                      </button>
                    )}
                  </div>

                  {loadingPhases && phases.length === 0 ? (
                    <div className="skeleton" style={{ height: '120px', borderRadius: '12px' }} />
                  ) : phases.length === 0 ? (
                    <p style={{ color: '#94a3b8', fontSize: '13px', textAlign: 'center', padding: '20px' }}>
                      Aucune phase générée pour cette compétition.
                    </p>
                  ) : (
                    <PhaseTimeline
                      phases={phases}
                      onBasculer={(phase) => setConfirmBasculer(phase)}
                      isLoading={basculerMutation.isPending}
                    />
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Onglet Poules */}
      {activeTab === 'poules' && (
        <div className="animate-fade-in">
          {competitions.length === 0 ? (
            <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
              <p style={{ color: '#64748b' }}>Configurez d'abord les compétitions.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {competitions.map(comp => {
                const phases = allPhases.filter(p => p.competition_id === comp.id);
                const phaseReg = phases.find(p => p.type === 'reguliere');
                const nbPoules = phaseReg?.nb_poules ?? 0;
                const nbClubsAffectes = phaseReg?.poules?.reduce((acc, p) => acc + (p.nb_clubs_affectes ?? 0), 0) ?? 0;
                const nbClubsTotal = comp.regles?.nb_clubs ?? 0;

                return (
                  <div key={comp.id} className="card" style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {comp.niveau === 'elite_one' ? <Trophy size={18} color="#1B4332" /> : <Zap size={18} color="#846D42" />}
                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>{comp.nom}</h3>
                      </div>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => navigate(`/admin/saisons/${saisonId}/competitions/${comp.id}/poules`)}
                        disabled={!phaseReg || phases.length === 0}
                      >
                        <LayoutGrid size={13} /> Gérer les poules
                      </button>
                    </div>

                    {!phaseReg || phases.length === 0 ? (
                      <p style={{ color: '#d97706', fontSize: '13px' }}>
                        ⚠️ Générez d'abord les phases dans l'onglet "Phases"
                      </p>
                    ) : (
                      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                        <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '12px 16px', flex: 1 }}>
                          <div style={{ fontSize: '24px', fontWeight: 800, color: '#1e293b' }}>{nbPoules}</div>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>Poule(s)</div>
                        </div>
                        <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '12px 16px', flex: 1 }}>
                          <div style={{ fontSize: '24px', fontWeight: 800, color: '#1e293b' }}>{nbClubsAffectes}/{nbClubsTotal}</div>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>Clubs affectés</div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Onglet Aperçu */}
      {activeTab === 'apercu' && (
        <div className="animate-fade-in">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            {[
              { label: 'Compétitions', value: competitions.length + '/2', color: '#1B4332', icon: '🏆' },
              { label: 'Phases générées', value: allPhases.length, color: '#2563eb', icon: '📋' },
              { label: 'Phases actives', value: allPhases.filter(p => p.statut === 'en_cours').length, color: '#15803d', icon: '▶️' },
              { label: 'Statut saison', value: saison.statut_label ?? saison.statut, color: '#d97706', icon: '📅' },
            ].map(stat => (
              <div key={stat.label} className="card" style={{ padding: '20px', textAlign: 'center' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>{stat.icon}</div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: stat.color }}>{stat.value}</div>
                <div style={{ fontSize: '13px', color: '#64748b' }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {competitions.length > 0 && (
            <div style={{ marginTop: '24px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px' }}>Compétitions configurées</h3>
              {competitions.map(comp => (
                <div key={comp.id} className="card stagger-item" style={{ padding: '16px 20px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {comp.niveau === 'elite_one' ? <Trophy size={16} style={{ color: '#1B4332' }} /> : <Zap size={16} style={{ color: '#846D42' }} />}
                    <div>
                      <div style={{ fontWeight: 600 }}>{comp.nom}</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>
                        {comp.regles ? `${comp.regles.nb_clubs} clubs · ${comp.regles.nb_poules} poule(s)` : 'Règles non configurées'}
                      </div>
                    </div>
                  </div>
                  {comp.regles ? (
                    <CheckCircle2 size={18} style={{ color: '#15803d' }} />
                  ) : (
                    <AlertCircle size={18} style={{ color: '#d97706' }} />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {/* Confirm Basculer Phase */}
      <ConfirmDialog
        isOpen={!!confirmBasculer}
        title="Basculer vers la phase suivante"
        message={`Êtes-vous sûr de vouloir basculer vers la phase suivante ? La phase actuelle "${confirmBasculer?.nom}" sera clôturée et gelée définitivement.`}
        confirmLabel="Basculer"
        confirmVariant="danger"
        isLoading={basculerMutation.isPending}
        onConfirm={() => confirmBasculer && basculerMutation.mutate(confirmBasculer.id)}
        onClose={() => setConfirmBasculer(null)}
      />
    </div>
  );
};

export default SaisonDetailPage;