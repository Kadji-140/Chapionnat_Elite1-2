// src/pages/admin/saisons/SaisonsListPage.tsx
// Liste des saisons avec création, activation, clonage

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Calendar, Play, Lock, Copy, Trash2,
  Settings, CheckCircle2, Clock
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getSaisons, createSaison, deleteSaison, activerSaison, cloturerSaison, clonerSaison,
  type Saison,
} from '../../../api/saisons.api';
import { ConfirmDialog } from '../../../components/ui/Modal';

// ── Badge statut saison ────────────────────────────────────────
const StatutSaisonBadge: React.FC<{ statut: string }> = ({ statut }) => {
  const config = {
    planifiee: { label: 'Planifiée', bg: '#f1f5f9', color: '#475569', icon: <Clock size={11} /> },
    en_cours:  { label: 'En cours',  bg: '#dcfce7', color: '#15803d', icon: <CheckCircle2 size={11} /> },
    terminee:  { label: 'Terminée',  bg: '#f1f5f9', color: '#94a3b8', icon: <Lock size={11} /> },
  }[statut] ?? { label: statut, bg: '#f1f5f9', color: '#64748b', icon: null };

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      padding: '4px 10px', borderRadius: '20px',
      fontSize: '12px', fontWeight: 600,
      background: config.bg, color: config.color,
    }}>
      {config.icon}
      {config.label}
    </span>
  );
};

// ── Formulaire création / clonage ─────────────────────────────
const SaisonForm: React.FC<{
  saisons: Saison[];
  onClose: () => void;
  onSuccess: () => void;
  cloneSource?: Saison | null;
}> = ({ saisons, onClose, onSuccess, cloneSource }) => {
  const [form, setForm] = useState({
    intitule: '',
    date_debut: '',
    date_fin: '',
    cloner_depuis_id: cloneSource?.id ?? null as number | null,
  });
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const mutation = useMutation({
    mutationFn: () => {
      if (cloneSource) {
        return clonerSaison(cloneSource.id, {
          intitule: form.intitule,
          date_debut: form.date_debut,
          date_fin: form.date_fin,
        });
      }
      return createSaison(form);
    },
    onSuccess: () => {
      toast.success(cloneSource ? 'Saison clonée avec succès !' : 'Saison créée avec succès !');
      onSuccess();
      onClose();
    },
    onError: (err: any) => {
      const apiErrors = err.response?.data?.errors ?? {};
      if (Object.keys(apiErrors).length > 0) {
        setErrors(apiErrors);
      } else {
        toast.error(err.response?.data?.message ?? 'Erreur lors de la création.');
      }
    },
  });

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {cloneSource && (
        <div style={{
          background: 'rgba(27,67,50,0.06)', border: '1px solid rgba(27,67,50,0.15)',
          borderRadius: '10px', padding: '12px 16px',
          display: 'flex', alignItems: 'center', gap: '10px',
        }}>
          <Copy size={16} style={{ color: '#1B4332' }} />
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#1B4332' }}>
              Clonage depuis : {cloneSource.intitule}
            </div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>
              La configuration des compétitions et règles sera reprise automatiquement.
            </div>
          </div>
        </div>
      )}

      <div className="form-group">
        <label className="form-label">Intitulé <span className="required">*</span></label>
        <input
          type="text"
          className={`form-input ${errors.intitule ? 'error' : ''}`}
          placeholder="Ex: 2025-2026"
          value={form.intitule}
          onChange={(e) => setForm(p => ({ ...p, intitule: e.target.value }))}
        />
        {errors.intitule && <span className="form-error">{errors.intitule[0]}</span>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div className="form-group">
          <label className="form-label">Date de début <span className="required">*</span></label>
          <input
            type="date"
            className={`form-input ${errors.date_debut ? 'error' : ''}`}
            value={form.date_debut}
            onChange={(e) => setForm(p => ({ ...p, date_debut: e.target.value }))}
          />
          {errors.date_debut && <span className="form-error">{errors.date_debut[0]}</span>}
        </div>
        <div className="form-group">
          <label className="form-label">Date de fin <span className="required">*</span></label>
          <input
            type="date"
            className={`form-input ${errors.date_fin ? 'error' : ''}`}
            value={form.date_fin}
            onChange={(e) => setForm(p => ({ ...p, date_fin: e.target.value }))}
          />
          {errors.date_fin && <span className="form-error">{errors.date_fin[0]}</span>}
        </div>
      </div>

      {!cloneSource && saisons.length > 0 && (
        <div className="form-group">
          <label className="form-label">Cloner la configuration d'une saison existante</label>
          <select
            className="form-select"
            value={form.cloner_depuis_id ?? ''}
            onChange={(e) => setForm(p => ({ ...p, cloner_depuis_id: e.target.value ? Number(e.target.value) : null }))}
          >
            <option value="">Créer une saison vierge</option>
            {saisons.map(s => (
              <option key={s.id} value={s.id}>{s.intitule}</option>
            ))}
          </select>
          <span className="form-hint">Si sélectionné, les compétitions et règles seront copiées.</span>
        </div>
      )}

      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
        <button className="btn btn-ghost" onClick={onClose}>Annuler</button>
        <button
          className="btn btn-primary"
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending || !form.intitule || !form.date_debut || !form.date_fin}
        >
          {mutation.isPending ? (
            <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%' }} />
          ) : cloneSource ? <Copy size={15} /> : <Plus size={15} />}
          {cloneSource ? 'Cloner la saison' : 'Créer la saison'}
        </button>
      </div>
    </div>
  );
};

// ── Page principale ────────────────────────────────────────────
const SaisonsListPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showCreate, setShowCreate] = useState(false);
  const [cloneSource, setCloneSource] = useState<Saison | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Saison | null>(null);
  const [confirmActiver, setConfirmActiver] = useState<Saison | null>(null);
  const [confirmCloturer, setConfirmCloturer] = useState<Saison | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-saisons'],
    queryFn: () => getSaisons({ per_page: 50 }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteSaison(id),
    onSuccess: () => {
      toast.success('Saison supprimée.');
      queryClient.invalidateQueries({ queryKey: ['admin-saisons'] });
      setConfirmDelete(null);
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Erreur.'),
  });

  const activerMutation = useMutation({
    mutationFn: (id: number) => activerSaison(id),
    onSuccess: () => {
      toast.success('Saison activée !');
      queryClient.invalidateQueries({ queryKey: ['admin-saisons'] });
      setConfirmActiver(null);
    },
    onError: (err: any) => {
      const errors: string[] = err.response?.data?.errors ?? [];
      const msg = err.response?.data?.message ?? 'Erreur.';
      if (errors.length > 0) {
        errors.forEach(e => toast.error(e, { duration: 5000 }));
      } else {
        toast.error(msg);
      }
      setConfirmActiver(null);
    },
  });

  const cloturerMutation = useMutation({
    mutationFn: (id: number) => cloturerSaison(id),
    onSuccess: () => {
      toast.success('Saison clôturée.');
      queryClient.invalidateQueries({ queryKey: ['admin-saisons'] });
      setConfirmCloturer(null);
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Erreur.'),
  });

  const saisons: Saison[] = data?.data ?? [];

  const handleClone = (saison: Saison) => {
    setCloneSource(saison);
    setShowCreate(true);
  };

  const handleCloseForm = () => {
    setShowCreate(false);
    setCloneSource(null);
  };

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Calendar size={24} style={{ color: '#1B4332' }} />
            Saisons
          </h1>
          <p className="page-subtitle">Gestion des saisons et compétitions FECAFOOT</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowCreate(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Plus size={16} />
          Nouvelle saison
        </button>
      </div>

      {/* Liste des saisons */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="card skeleton" style={{ height: '100px' }} />
          ))}
        </div>
      ) : saisons.length === 0 ? (
        <div className="card" style={{ padding: '60px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏆</div>
          <h3 style={{ margin: '0 0 8px', color: '#1e293b' }}>Aucune saison créée</h3>
          <p style={{ color: '#64748b', marginBottom: '24px' }}>Créez votre première saison pour commencer à configurer les compétitions.</p>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            <Plus size={15} /> Créer la première saison
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {saisons.map((saison, idx) => (
            <div
              key={saison.id}
              className="card stagger-item"
              style={{
                animationDelay: `${idx * 60}ms`,
                padding: '20px 24px',
                borderLeft: `4px solid ${
                  saison.statut === 'en_cours' ? '#1B4332' :
                  saison.statut === 'planifiee' ? '#FFB800' : '#e2e8f0'
                }`,
                display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap',
              }}
            >
              {/* Icône statut */}
              <div style={{
                width: '48px', height: '48px', borderRadius: '12px',
                background: saison.statut === 'en_cours' ? 'rgba(27,67,50,0.1)' :
                           saison.statut === 'planifiee' ? 'rgba(255,184,0,0.1)' : '#f1f5f9',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Calendar size={22} style={{
                  color: saison.statut === 'en_cours' ? '#1B4332' :
                         saison.statut === 'planifiee' ? '#b45309' : '#94a3b8'
                }} />
              </div>

              {/* Infos */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>
                    {saison.intitule}
                  </span>
                  <StatutSaisonBadge statut={saison.statut} />
                  {saison.clonee_depuis_id && (
                    <span style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Copy size={10} /> Clonée
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '13px', color: '#64748b', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  <span>📅 {new Date(saison.date_debut).toLocaleDateString('fr-FR')} → {new Date(saison.date_fin).toLocaleDateString('fr-FR')}</span>
                  <span>🏆 {saison.nb_competitions} compétition{saison.nb_competitions !== 1 ? 's' : ''} configurée{saison.nb_competitions !== 1 ? 's' : ''}</span>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {/* Configurer */}
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => navigate(`/admin/saisons/${saison.id}`)}
                  title="Configurer"
                >
                  <Settings size={14} /> Configurer
                </button>

                {/* Activer (planifiée seulement) */}
                {saison.statut === 'planifiee' && (
                  <button
                    className="btn btn-sm"
                    style={{ background: '#1B4332', color: 'white', border: 'none' }}
                    onClick={() => setConfirmActiver(saison)}
                    title="Activer la saison"
                  >
                    <Play size={14} /> Activer
                  </button>
                )}

                {/* Clôturer (en_cours seulement) */}
                {saison.statut === 'en_cours' && (
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => setConfirmCloturer(saison)}
                    title="Clôturer la saison"
                  >
                    <Lock size={14} /> Clôturer
                  </button>
                )}

                {/* Cloner */}
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => handleClone(saison)}
                  title="Cloner cette saison"
                >
                  <Copy size={14} />
                </button>

                {/* Supprimer (planifiée seulement) */}
                {saison.statut === 'planifiee' && (
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => setConfirmDelete(saison)}
                    title="Supprimer"
                    style={{ color: '#C8102E' }}
                  >
                    <Trash2 size={14} />
                  </button>
                )}

              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Création / Clonage */}
      {showCreate && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 1000, padding: '16px',
        }}>
          <div style={{
            background: '#fff', borderRadius: '20px',
            width: '100%', maxWidth: '520px', overflow: 'hidden',
            animation: 'scaleIn 0.25s cubic-bezier(0.4,0,0.2,1)',
          }}>
            <div style={{
              padding: '20px 24px', borderBottom: '1px solid #e2e8f0',
              background: 'linear-gradient(135deg, #1B4332, #2D6A4F)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {cloneSource ? <Copy size={18} style={{ color: '#FFB800' }} /> : <Plus size={18} style={{ color: '#FFB800' }} />}
                <span style={{ fontSize: '16px', fontWeight: 700, color: '#fff' }}>
                  {cloneSource ? `Cloner : ${cloneSource.intitule}` : 'Nouvelle saison'}
                </span>
              </div>
              <button
                onClick={handleCloseForm}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', fontSize: '20px' }}
              >
                ×
              </button>
            </div>
            <SaisonForm
              saisons={saisons}
              onClose={handleCloseForm}
              onSuccess={() => queryClient.invalidateQueries({ queryKey: ['admin-saisons'] })}
              cloneSource={cloneSource}
            />
          </div>
        </div>
      )}

      {/* Confirm Delete */}
      <ConfirmDialog
        isOpen={!!confirmDelete}
        title="Supprimer la saison"
        message={`Êtes-vous sûr de vouloir supprimer la saison "${confirmDelete?.intitule}" ? Cette action est irréversible.`}
        confirmLabel="Supprimer"
        confirmVariant="danger"
        isLoading={deleteMutation.isPending}
        onConfirm={() => confirmDelete && deleteMutation.mutate(confirmDelete.id)}
        onClose={() => setConfirmDelete(null)}
      />

      {/* Confirm Activer */}
      <ConfirmDialog
        isOpen={!!confirmActiver}
        title="Activer la saison"
        message={`Activer "${confirmActiver?.intitule}" ? Toute autre saison en cours sera automatiquement archivée. Vérifiez que les compétitions, phases et poules sont bien configurées.`}
        confirmLabel="Activer"
        confirmVariant="primary"
        isLoading={activerMutation.isPending}
        onConfirm={() => confirmActiver && activerMutation.mutate(confirmActiver.id)}
        onClose={() => setConfirmActiver(null)}
      />

      {/* Confirm Clôturer */}
      <ConfirmDialog
        isOpen={!!confirmCloturer}
        title="Clôturer la saison"
        message={`Clôturer "${confirmCloturer?.intitule}" ? La saison passera en statut "Terminée". Cette action est définitive.`}
        confirmLabel="Clôturer"
        confirmVariant="danger"
        isLoading={cloturerMutation.isPending}
        onConfirm={() => confirmCloturer && cloturerMutation.mutate(confirmCloturer.id)}
        onClose={() => setConfirmCloturer(null)}
      />
    </div>
  );
};

export default SaisonsListPage;
