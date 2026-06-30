// src/pages/admin/arbitres/ArbitresListPage.tsx

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Gavel, ToggleLeft, ToggleRight, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getArbitres, createArbitre, updateArbitre,
  toggleArbitre, deleteArbitre, type Arbitre, type ArbitreFilters
} from '../../../api/arbitres.api';
import { Modal, ConfirmDialog } from '../../../components/ui/Modal';
import { StatutBadge } from '../../../components/ui/Badge';
import { SkeletonTable, EmptyState, Pagination } from '../../../components/ui/DataTable';
import { REGIONS_ET_VILLES } from '../../../constants/regionsVilles';

// ── Formulaire création/édition arbitre ──────────────────────
const ArbitreForm: React.FC<{
  initial?: Partial<Arbitre>;
  onSuccess: () => void;
  onClose: () => void;
}> = ({ initial, onSuccess, onClose }) => {
  const queryClient = useQueryClient();
  const isEdit = !!initial?.id;
  const [form, setForm] = useState({
    nom: initial?.nom ?? '',
    prenom: initial?.prenom ?? '',
    num_licence: initial?.num_licence ?? '',
    specification: initial?.specification ?? 'central',
    region: initial?.region ?? '',
    villes: initial?.villes ?? '',
  });
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [customVilles, setCustomVilles] = useState(false);

  const mutation = useMutation({
    mutationFn: () =>
      isEdit ? updateArbitre(initial!.id!, form) : createArbitre(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-arbitres'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      toast.success(isEdit ? 'Arbitre mis à jour !' : 'Arbitre enregistré !');
      onSuccess();
    },
    onError: (err: any) => {
      setErrors(err.response?.data?.errors ?? {});
      toast.error(err.response?.data?.message ?? 'Erreur');
    },
  });

  const f = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(p => ({ ...p, [key]: e.target.value })),
    className: `form-input${errors[key] ? ' error' : ''}`,
  });

  const SPECIFICATIONS = [
    { value: 'central', label: 'Arbitre Central' },
    { value: 'assistant', label: 'Arbitre Assistant' },
    { value: 'quatrieme', label: 'Quatrième Arbitre' },
  ];

  // Villes disponibles selon la région sélectionnée
  const villesDisponibles = REGIONS_ET_VILLES.find(r => r.region === form.region)?.villes ?? [];

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }}
      style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div className="form-group">
          <label className="form-label">Nom <span className="required">*</span></label>
          <input type="text" placeholder="Nom de famille" required {...f('nom')} />
          {errors.nom && <span className="form-error">{errors.nom[0]}</span>}
        </div>
        <div className="form-group">
          <label className="form-label">Prénom <span className="required">*</span></label>
          <input type="text" placeholder="Prénom" required {...f('prenom')} />
        </div>
        <div className="form-group">
          <label className="form-label">N° Licence <span className="required">*</span></label>
          <input type="text" placeholder="Ex: ARB-2025-001" required {...f('num_licence')} />
          {errors.num_licence && <span className="form-error">{errors.num_licence[0]}</span>}
        </div>
        <div className="form-group">
          <label className="form-label">Spécification <span className="required">*</span></label>
          <select
            className={`form-select${errors.specification ? ' error' : ''}`}
            value={form.specification}
            onChange={(e) => setForm(p => ({ ...p, specification: e.target.value as any }))}
          >
            {SPECIFICATIONS.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        {/* Région avec select prédéfini */}
        <div className="form-group">
          <label className="form-label">Région</label>
          <select
            className="form-select"
            value={form.region}
            onChange={(e) => {
              setForm(p => ({ ...p, region: e.target.value, villes: '' }));
              setCustomVilles(false);
            }}
          >
            <option value="">Sélectionner une région</option>
            {REGIONS_ET_VILLES.map(r => (
              <option key={r.region} value={r.region}>{r.region}</option>
            ))}
          </select>
        </div>

        {/* Villes avec prédéfinition + option personnalisée */}
        <div className="form-group">
          <label className="form-label">Villes d'intervention</label>
          {villesDisponibles.length > 0 && !customVilles ? (
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <select
                className="form-select"
                value={form.villes}
                onChange={(e) => setForm(p => ({ ...p, villes: e.target.value }))}
                style={{ flex: 1 }}
              >
                <option value="">Sélectionner une ville</option>
                {villesDisponibles.map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setCustomVilles(true)}
              >
                Autre ville
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="Ex: Douala, Yaoundé"
                className="form-input"
                value={form.villes}
                onChange={(e) => setForm(p => ({ ...p, villes: e.target.value }))}
                style={{ flex: 1 }}
              />
              {villesDisponibles.length > 0 && customVilles && (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    setCustomVilles(false);
                    if (villesDisponibles.length > 0) {
                      setForm(p => ({ ...p, villes: villesDisponibles[0] }));
                    }
                  }}
                >
                  Choisir une ville
                </button>
              )}
            </div>
          )}
          <span className="form-hint">Ville principale d'intervention de l'arbitre</span>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
        <button type="button" className="btn btn-ghost" onClick={onClose}>Annuler</button>
        <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
          {mutation.isPending && (
            <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full inline-block" />
          )}
          {isEdit ? <><Pencil size={15} /> Enregistrer</> : <><Plus size={15} /> Ajouter</>}
        </button>
      </div>
    </form>
  );
};

// ── Badges spécification ──────────────────────────────────────
const SpecBadge: React.FC<{ spec: string }> = ({ spec }) => {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    central: { label: 'Central', color: '#1B4332', bg: 'rgba(27,67,50,0.1)' },
    assistant: { label: 'Assistant', color: '#2563eb', bg: 'rgba(37,99,235,0.1)' },
    quatrieme: { label: '4e Arbitre', color: '#7c3aed', bg: 'rgba(124,58,237,0.1)' },
  };
  const c = map[spec] ?? { label: spec, color: 'var(--text-muted)', bg: 'var(--bg)' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      padding: '3px 10px', borderRadius: '999px',
      fontSize: '12px', fontWeight: 600,
      color: c.color, background: c.bg,
    }}>
      {c.label}
    </span>
  );
};

// ── Page principale ───────────────────────────────────────────
const ArbitresListPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<ArbitreFilters>({ page: 1, per_page: 15 });
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Arbitre | null>(null);
  const [confirmToggle, setConfirmToggle] = useState<{ id: number; nom: string; actif: boolean } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; nom: string } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-arbitres', filters],
    queryFn: () => getArbitres(filters),
    placeholderData: (prev) => prev,
  });

  const toggleMutation = useMutation({
    mutationFn: (id: number) => toggleArbitre(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin-arbitres'] });
      toast.success(res.message ?? 'Statut mis à jour');
      setConfirmToggle(null);
    },
    onError: () => toast.error('Erreur lors du changement de statut'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteArbitre(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin-arbitres'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      toast.success(res.message ?? 'Arbitre désactivé');
      setConfirmDelete(null);
    },
    onError: () => toast.error('Erreur'),
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters(prev => ({ ...prev, search, page: 1 }));
  };

  const openEdit = (arbitre: Arbitre) => { setEditTarget(arbitre); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditTarget(null); };

  const arbitres = data?.data ?? [];
  const meta = data?.meta;

  const SPECS = [
    { value: '', label: 'Toutes spécifications' },
    { value: 'central', label: 'Central' },
    { value: 'assistant', label: 'Assistant' },
    { value: 'quatrieme', label: '4e Arbitre' },
  ];

  // Debug : Afficher les données dans la console
  console.log('Arbitres data:', data);

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div
        className="page-header"
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}
      >
        <div>
          <h1 className="page-title">Gestion des arbitres</h1>
          <p className="page-subtitle">{meta?.total ?? 0} arbitre{(meta?.total ?? 0) > 1 ? 's' : ''} enregistré{(meta?.total ?? 0) > 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditTarget(null); setShowForm(true); }}>
          <Plus size={16} /> Ajouter un arbitre
        </button>
      </div>

      {/* Filtres */}
      <div className="card" style={{ marginBottom: '20px', padding: '16px 20px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px', flex: 1, minWidth: '200px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
              <input
                type="text" className="form-input" style={{ paddingLeft: '36px' }}
                placeholder="Nom, prénom ou n° licence…"
                value={search} onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary btn-sm">Rechercher</button>
          </form>

          <select
            className="form-select" style={{ width: 'auto', minWidth: '180px' }}
            value={filters.specification ?? ''}
            onChange={(e) => setFilters(prev => ({ ...prev, specification: e.target.value || undefined, page: 1 }))}
          >
            {SPECS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>

          <select
            className="form-select" style={{ width: 'auto', minWidth: '140px' }}
            value={filters.actif === undefined ? '' : String(filters.actif)}
            onChange={(e) => setFilters(prev => ({
              ...prev,
              actif: e.target.value === '' ? undefined : e.target.value === 'true',
              page: 1,
            }))}
          >
            <option value="">Tous statuts</option>
            <option value="true">Actifs</option>
            <option value="false">Inactifs</option>
          </select>
        </div>
      </div>

      {/* Tableau */}
      <div className="card">
        {isLoading ? (
          <div style={{ padding: '4px' }}>
            <SkeletonTable rows={8} cols={6} />
          </div>
        ) : arbitres.length === 0 ? (
          <EmptyState
            title="Aucun arbitre trouvé"
            description="Enregistrez vos premiers arbitres officiels."
            action={
              <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                <Plus size={16} /> Ajouter un arbitre
              </button>
            }
            icon={<Gavel size={28} style={{ color: 'var(--text-light)' }} />}
          />
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Arbitre</th>
                    <th>N° Licence</th>
                    <th>Spécification</th>
                    <th>Région</th>
                    <th>Matchs</th>
                    <th>Statut</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {arbitres.map((arb: Arbitre, i: number) => (
                    <tr key={arb.id} className="stagger-item" style={{ animationDelay: `${i * 40}ms` }}>
                      <td data-label="Arbitre">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '36px', height: '36px', borderRadius: '50%',
                            background: 'rgba(124,58,237,0.1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <Gavel size={16} style={{ color: '#7c3aed' }} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '14px' }}>{arb.prenom} {arb.nom}</div>
                          </div>
                        </div>
                      </td>
                      <td data-label="N° Licence">
                        <code style={{ fontSize: '12px', background: 'var(--bg)', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--border)' }}>
                          {arb.num_licence}
                        </code>
                      </td>
                      <td data-label="Spécification"><SpecBadge spec={arb.specification} /></td>
                      <td data-label="Région" style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                        {arb.region ?? '—'}
                      </td>
                      <td data-label="Matchs" style={{ fontWeight: 600 }}>{arb.nb_matchs ?? 0}</td>
                      <td data-label="Statut"><StatutBadge actif={arb.actif} /></td>
                      <td data-label="Actions">
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                          <button
                            className="btn btn-icon btn-ghost btn-sm"
                            title="Modifier"
                            onClick={() => openEdit(arb)}
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            className="btn btn-icon btn-ghost btn-sm"
                            title={arb.actif ? 'Désactiver' : 'Activer'}
                            onClick={() => setConfirmToggle({ id: arb.id, nom: arb.nom_complet, actif: arb.actif })}
                          >
                            {arb.actif
                              ? <ToggleRight size={16} style={{ color: 'var(--primary)' }} />
                              : <ToggleLeft size={16} style={{ color: 'var(--text-light)' }} />
                            }
                          </button>
                          <button
                            className="btn btn-icon btn-ghost btn-sm"
                            title="Supprimer"
                            style={{ color: 'var(--secondary)' }}
                            onClick={() => setConfirmDelete({ id: arb.id, nom: arb.nom_complet })}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {meta && meta.last_page > 1 && (
              <div style={{ padding: '0 16px 16px' }}>
                <Pagination
                  currentPage={meta.current_page} lastPage={meta.last_page}
                  total={meta.total} perPage={meta.per_page}
                  onPageChange={(page) => setFilters(prev => ({ ...prev, page }))}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal formulaire */}
      <Modal
        isOpen={showForm} onClose={closeForm}
        title={editTarget ? 'Modifier un arbitre' : 'Ajouter un arbitre'}
        size="lg"
      >
        <ArbitreForm
          initial={editTarget ?? undefined}
          onSuccess={closeForm}
          onClose={closeForm}
        />
      </Modal>

      {/* Confirm toggle */}
      <ConfirmDialog
        isOpen={!!confirmToggle} onClose={() => setConfirmToggle(null)}
        onConfirm={() => confirmToggle && toggleMutation.mutate(confirmToggle.id)}
        title={confirmToggle?.actif ? 'Désactiver l\'arbitre' : 'Activer l\'arbitre'}
        message={`Êtes-vous sûr de vouloir ${confirmToggle?.actif ? 'désactiver' : 'activer'} ${confirmToggle?.nom} ?`}
        confirmLabel={confirmToggle?.actif ? 'Désactiver' : 'Activer'}
        confirmVariant={confirmToggle?.actif ? 'danger' : 'primary'}
        isLoading={toggleMutation.isPending}
      />

      {/* Confirm delete */}
      <ConfirmDialog
        isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)}
        onConfirm={() => confirmDelete && deleteMutation.mutate(confirmDelete.id)}
        title="Supprimer l'arbitre"
        message={`Êtes-vous sûr de vouloir supprimer l'arbitre ${confirmDelete?.nom} ?`}
        confirmLabel="Supprimer" confirmVariant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

export default ArbitresListPage;