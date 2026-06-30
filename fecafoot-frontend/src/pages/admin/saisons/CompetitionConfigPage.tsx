// src/pages/admin/saisons/CompetitionConfigPage.tsx
// Configuration complète des règles d'une compétition

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useBlocker } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Save, Zap, Trophy, RefreshCw, Info,
  ToggleLeft, ToggleRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getCompetition, getRegles, updateRegles,
  type Competition, type ReglesCompetition
} from '../../../api/saisons.api';
import { ConfirmDialog } from '../../../components/ui/Modal';

// ── Valeurs par défaut ─────────────────────────────────────────
const defaultsEliteOne: Partial<ReglesCompetition> = {
  nb_clubs: 12, format: 'poule_unique', nb_poules: 1,
  a_playoffs: true, nb_clubs_playoffs_up: 4, nb_clubs_playoffs_down: 4,
  points_reportes_playoffs: false, a_barrage: true, nb_clubs_barrage: 2,
  nb_promus_directs: 0, nb_relegues_directs: 2,
  criteres_egalite: ['points', 'diff_buts', 'buts_pour', 'confrontation_directe'],
  points_victoire: 3, points_nul: 1, points_defaite: 0,
  score_forfait_vainqueur: 3, score_forfait_perdant: 0, points_penalite_forfait: 0,
};

const defaultsEliteTwo: Partial<ReglesCompetition> = {
  nb_clubs: 16, format: 'poules_multiples', nb_poules: 2,
  a_playoffs: true, nb_clubs_playoffs_up: 6, nb_clubs_playoffs_down: 10,
  points_reportes_playoffs: false, a_barrage: true, nb_clubs_barrage: 2,
  nb_promus_directs: 2, nb_relegues_directs: 2,
  criteres_egalite: ['points', 'diff_buts', 'buts_pour', 'confrontation_directe'],
  points_victoire: 3, points_nul: 1, points_defaite: 0,
  score_forfait_vainqueur: 3, score_forfait_perdant: 0, points_penalite_forfait: 0,
};

// ── Critères d'égalité disponibles ────────────────────────────
const CRITERES_DISPONIBLES = [
  { key: 'points', label: 'Points' },
  { key: 'diff_buts', label: 'Différence de buts' },
  { key: 'buts_pour', label: 'Buts pour' },
  { key: 'confrontation_directe', label: 'Confrontation directe' },
  { key: 'cartons_jaunes', label: 'Cartons jaunes (moins)' },
  { key: 'fair_play', label: 'Classement fair-play' },
];

// ── Composants UI ─────────────────────────────────────────────
const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string; color?: string }> = ({ checked, onChange, label, hint, color = '#1B4332' }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
    <div>
      <div style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b' }}>{label}</div>
      {hint && <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>{hint}</div>}
    </div>
    <button
      onClick={() => onChange(!checked)}
      style={{ background: 'none', border: 'none', cursor: 'pointer', color: checked ? color : '#94a3b8' }}
    >
      {checked ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
    </button>
  </div>
);

const NumericInput: React.FC<{
  label: string; value: number; min?: number; max?: number;
  onChange: (v: number) => void; hint?: string; suffix?: string;
  disabled?: boolean;
}> = ({ label, value, min = 0, max, onChange, hint, suffix, disabled }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
    <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>{label}</label>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <input
        type="number"
        className="form-input"
        value={value}
        min={min}
        max={max}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: '100%', opacity: disabled ? 0.5 : 1 }}
      />
      {suffix && <span style={{ fontSize: '13px', color: '#64748b', whiteSpace: 'nowrap' }}>{suffix}</span>}
    </div>
    {hint && <span style={{ fontSize: '11px', color: '#94a3b8' }}>{hint}</span>}
  </div>
);

// ── Page principale ────────────────────────────────────────────
const CompetitionConfigPage: React.FC = () => {
  const { id, competitionId } = useParams<{ id: string; competitionId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const saisonId = Number(id);
  const compId = Number(competitionId);

  const [activeTab, setActiveTab] = useState<'general' | 'playoffs' | 'points' | 'criteres'>('general');
  const [form, setForm] = useState<Partial<ReglesCompetition>>(defaultsEliteOne);
  const [isDirty, setIsDirty] = useState(false);

  // Blocker de navigation React Router
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty && currentLocation.pathname !== nextLocation.pathname
  );

  // Blocker natif de rechargement/fermeture de page
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Chargement compétition
  const { data: compData } = useQuery({
    queryKey: ['admin-competition', compId],
    queryFn: () => getCompetition(compId),
  });

  const competition: Competition | undefined = compData?.data;

  // Chargement règles
  const { data: reglesData } = useQuery({
    queryKey: ['admin-regles', compId],
    queryFn: () => getRegles(compId),
    retry: false,
  });

  // Pré-remplir le formulaire
  useEffect(() => {
    if (reglesData?.data) {
      setForm(reglesData.data);
      setIsDirty(false);
    } else if (competition) {
      setForm(competition.niveau === 'elite_one' ? defaultsEliteOne : defaultsEliteTwo);
      setIsDirty(false);
    }
  }, [reglesData, competition]);

  const saveMutation = useMutation({
    mutationFn: () => updateRegles(compId, form),
    onSuccess: () => {
      toast.success('Règles sauvegardées avec succès !');
      setIsDirty(false);
      queryClient.invalidateQueries({ queryKey: ['admin-regles', compId] });
      queryClient.invalidateQueries({ queryKey: ['admin-competitions', saisonId] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Erreur lors de la sauvegarde.'),
  });

  const applyDefaults = () => {
    const defaults = competition?.niveau === 'elite_one' ? defaultsEliteOne : defaultsEliteTwo;
    setForm(defaults);
    setIsDirty(true);
    toast.success('Valeurs par défaut appliquées.');
  };

  const update = (key: keyof ReglesCompetition, value: any) => {
    setForm(p => ({ ...p, [key]: value }));
    setIsDirty(true);
  };

  // Calcul auto journées
  const clubsParPoule = (form.nb_poules ?? 1) > 0
    ? Math.floor((form.nb_clubs ?? 0) / (form.nb_poules ?? 1))
    : (form.nb_clubs ?? 0);
  const nbJournees = (clubsParPoule - 1) * 2;

  const toggleCritere = (key: string) => {
    const current = form.criteres_egalite ?? [];
    if (current.includes(key)) {
      update('criteres_egalite', current.filter(c => c !== key));
    } else {
      update('criteres_egalite', [...current, key]);
    }
  };

  const isEliteOne = competition?.niveau === 'elite_one';
  const themeColor = isEliteOne ? '#1B4332' : '#846D42';

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => navigate(`/admin/saisons/${saisonId}`)}
          style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <ArrowLeft size={15} /> Retour à la saison
        </button>

        <div style={{
          background: isEliteOne
            ? 'linear-gradient(135deg, #1B4332, #2D6A4F)'
            : 'linear-gradient(135deg, #846D42, #A89368)',
          borderRadius: '20px', padding: '20px 24px', color: '#fff',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {isEliteOne ? <Trophy size={24} style={{ color: '#FFB800' }} /> : <Zap size={24} style={{ color: '#FDE68A' }} />}
              <div>
                <div style={{ fontSize: '12px', opacity: 0.7, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Configuration
                </div>
                <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800 }}>
                  {competition?.nom ?? 'Chargement...'}
                </h1>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="btn btn-sm"
                onClick={applyDefaults}
                style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}
              >
                <RefreshCw size={13} /> Défauts
              </button>
              <button
                className="btn btn-sm"
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
                style={{ background: '#FFB800', color: '#1e293b', border: 'none', fontWeight: 700 }}
              >
                <Save size={13} />
                {saveMutation.isPending ? 'Sauvegarde...' : 'Sauvegarder'}
              </button>
            </div>
          </div>

          {/* Prévisualisation live */}
          <div style={{
            marginTop: '16px', background: 'rgba(255,255,255,0.12)',
            borderRadius: '12px', padding: '12px 16px',
            display: 'flex', gap: '24px', flexWrap: 'wrap',
          }}>
            {[
              { label: 'Clubs', value: form.nb_clubs ?? 0 },
              { label: 'Poules', value: form.nb_poules ?? 1 },
              { label: 'Clubs / poule', value: clubsParPoule },
              { label: 'Journées', value: nbJournees },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: 800 }}>{s.value}</div>
                <div style={{ fontSize: '11px', opacity: 0.7 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Onglets */}
      <div className="tabs" style={{ marginBottom: '24px' }}>
        {([
          { id: 'general', label: 'Général' },
          { id: 'playoffs', label: 'Playoffs & Barrage' },
          { id: 'points', label: 'Système de points' },
          { id: 'criteres', label: 'Critères d\'égalité' },
        ] as const).map(tab => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="card" style={{ padding: '28px' }}>

        {/* Tab: Général */}
        {activeTab === 'general' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ margin: 0, color: '#1e293b' }}>Structure de la phase régulière</h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <NumericInput
                label="Nombre de clubs"
                value={form.nb_clubs ?? 12}
                min={2} max={32}
                onChange={(v) => update('nb_clubs', v)}
              />
              <NumericInput
                label="Nombre de poules"
                value={form.nb_poules ?? 1}
                min={1} max={8}
                onChange={(v) => {
                  update('nb_poules', v);
                  update('format', v === 1 ? 'poule_unique' : 'poules_multiples');
                }}
              />
            </div>

            <div style={{
              padding: '14px 16px', background: '#f8fafc',
              borderRadius: '10px', border: '1px solid #e2e8f0',
              display: 'flex', alignItems: 'center', gap: '10px',
            }}>
              <Info size={16} style={{ color: themeColor, flexShrink: 0 }} />
              <div style={{ fontSize: '13px', color: '#475569' }}>
                <strong>Format :</strong> {(form.nb_poules ?? 1) === 1 ? 'Poule unique' : `${form.nb_poules} poules`}
                {' · '}<strong>Journées :</strong> {nbJournees} (formule aller-retour)
              </div>
            </div>

            <div className="divider" style={{ height: '1px', background: '#f1f5f9', margin: '4px 0' }} />

            <h3 style={{ margin: 0, color: '#1e293b' }}>Promotions / Relégations directes</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <NumericInput
                label="Promus directs"
                value={form.nb_promus_directs ?? 0}
                min={0}
                onChange={(v) => update('nb_promus_directs', v)}
                hint="Clubs montant directement en division supérieure"
              />
              <NumericInput
                label="Relégués directs"
                value={form.nb_relegues_directs ?? 2}
                min={0}
                onChange={(v) => update('nb_relegues_directs', v)}
                hint="Clubs descendant directement en division inférieure"
              />
            </div>
          </div>
        )}

        {/* Tab: Playoffs */}
        {activeTab === 'playoffs' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <Toggle
              checked={form.a_playoffs ?? false}
              onChange={(v) => update('a_playoffs', v)}
              label="Activer les playoffs"
              hint="Phases éliminatoires entre les équipes qualifiées"
              color={themeColor}
            />

            {form.a_playoffs && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <NumericInput
                  label="Clubs Playoffs montée"
                  value={form.nb_clubs_playoffs_up ?? 4}
                  min={0}
                  onChange={(v) => update('nb_clubs_playoffs_up', v)}
                  hint="Nombre de clubs jouant les playoffs pour la montée"
                />
                <NumericInput
                  label="Clubs Playoffs maintien"
                  value={form.nb_clubs_playoffs_down ?? 4}
                  min={0}
                  onChange={(v) => update('nb_clubs_playoffs_down', v)}
                  hint="Nombre de clubs jouant les playoffs pour le maintien"
                />
              </div>
            )}

            {form.a_playoffs && (
              <Toggle
                checked={form.points_reportes_playoffs ?? false}
                onChange={(v) => update('points_reportes_playoffs', v)}
                label="Points reportés en playoffs"
                hint="Si activé, les points de la phase régulière sont pris en compte en playoffs"
                color={themeColor}
              />
            )}

            <div style={{ height: '1px', background: '#f1f5f9' }} />

            <Toggle
              checked={form.a_barrage ?? false}
              onChange={(v) => update('a_barrage', v)}
              label="Activer les barrages inter-divisions"
              hint="Match(s) entre derniers de la division supérieure et premiers de la division inférieure"
              color={themeColor}
            />

            {form.a_barrage && (
              <NumericInput
                label="Clubs en barrage"
                value={form.nb_clubs_barrage ?? 2}
                min={2}
                onChange={(v) => update('nb_clubs_barrage', v)}
              />
            )}
          </div>
        )}

        {/* Tab: Points */}
        {activeTab === 'points' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <h3 style={{ margin: '0 0 16px', color: '#1e293b' }}>Résultat de match</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                <NumericInput
                  label="Points — Victoire"
                  value={form.points_victoire ?? 3}
                  min={0}
                  onChange={(v) => update('points_victoire', v)}
                  suffix="pts"
                />
                <NumericInput
                  label="Points — Nul"
                  value={form.points_nul ?? 1}
                  min={0}
                  onChange={(v) => update('points_nul', v)}
                  suffix="pts"
                />
                <NumericInput
                  label="Points — Défaite"
                  value={form.points_defaite ?? 0}
                  min={0}
                  onChange={(v) => update('points_defaite', v)}
                  suffix="pts"
                />
              </div>
            </div>

            <div>
              <h3 style={{ margin: '0 0 16px', color: '#1e293b' }}>Tapis vert (forfait)</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                <NumericInput
                  label="Score vainqueur"
                  value={form.score_forfait_vainqueur ?? 3}
                  min={0}
                  onChange={(v) => update('score_forfait_vainqueur', v)}
                />
                <NumericInput
                  label="Score perdant"
                  value={form.score_forfait_perdant ?? 0}
                  min={0}
                  onChange={(v) => update('score_forfait_perdant', v)}
                />
                <NumericInput
                  label="Pénalité (points retirés)"
                  value={form.points_penalite_forfait ?? 0}
                  min={0}
                  onChange={(v) => update('points_penalite_forfait', v)}
                  suffix="pts"
                  hint="Points retirés au club forfaitaire"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab: Critères d'égalité */}
        {activeTab === 'criteres' && (
          <div>
            <h3 style={{ margin: '0 0 8px', color: '#1e293b' }}>Critères de départage</h3>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>
              L'ordre dans lequel les critères sont cochés détermine leur priorité (du plus prioritaire au moins prioritaire).
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(() => {
                const activeKeys = form.criteres_egalite ?? [];
                const activeCriteres = activeKeys
                  .map(key => CRITERES_DISPONIBLES.find(c => c.key === key))
                  .filter((c): c is typeof CRITERES_DISPONIBLES[0] => !!c);
                const inactiveCriteres = CRITERES_DISPONIBLES.filter(c => !activeKeys.includes(c.key));
                const sortedCriteres = [...activeCriteres, ...inactiveCriteres];
                
                return sortedCriteres.map((c) => {
                  const isActive = activeKeys.includes(c.key);
                  const position = activeKeys.indexOf(c.key) + 1;
                  return (
                    <div
                      key={c.key}
                      onClick={() => toggleCritere(c.key)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '12px',
                        padding: '14px 16px', borderRadius: '10px', cursor: 'pointer',
                        border: `1px solid ${isActive ? themeColor : '#e2e8f0'}`,
                        background: isActive ? (isEliteOne ? 'rgba(27,67,50,0.04)' : 'rgba(132,109,66,0.04)') : '#fafafa',
                        transition: 'all 0.15s',
                      }}
                    >
                      {isActive ? (
                        <div style={{
                          width: '24px', height: '24px', borderRadius: '50%',
                          background: themeColor, color: '#fff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '12px', fontWeight: 700, flexShrink: 0,
                        }}>
                          {position}
                        </div>
                      ) : (
                        <div style={{
                          width: '24px', height: '24px', borderRadius: '50%',
                          border: '2px solid #e2e8f0', flexShrink: 0,
                        }} />
                      )}
                      <span style={{ fontSize: '14px', fontWeight: isActive ? 600 : 400, color: isActive ? themeColor : '#64748b' }}>
                        {c.label}
                      </span>
                      {isActive && (
                        <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#94a3b8' }}>Priorité {position}</span>
                      )}
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        )}
      </div>

      {/* Sticky Save */}
      <div style={{
        position: 'fixed', bottom: '24px', right: '24px',
        display: 'flex', gap: '12px', zIndex: 100,
      }}>
        <button
          className="btn btn-primary"
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          style={{
            boxShadow: isEliteOne ? '0 8px 24px rgba(27,67,50,0.3)' : '0 8px 24px rgba(132,109,66,0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: themeColor,
            border: 'none'
          }}
        >
          <Save size={16} />
          {saveMutation.isPending ? 'Sauvegarde...' : 'Sauvegarder les règles'}
        </button>
      </div>

      {/* Confirm Unsaved Changes Blocker */}
      <ConfirmDialog
        isOpen={blocker.state === 'blocked'}
        title="Modifications non sauvegardées"
        message="Vous avez modifié des paramètres de la compétition sans les enregistrer. Voulez-vous vraiment quitter cette page et perdre vos modifications ?"
        confirmLabel="Quitter sans sauvegarder"
        confirmVariant="danger"
        onConfirm={() => blocker.proceed && blocker.proceed()}
        onClose={() => blocker.reset && blocker.reset()}
      />
    </div>
  );
};

export default CompetitionConfigPage;
