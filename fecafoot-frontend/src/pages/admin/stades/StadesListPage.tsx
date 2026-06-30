// src/pages/admin/stades/StadesListPage.tsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, MapPin, ToggleLeft, ToggleRight, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getStades, createStade, updateStade,
  toggleStade, deleteStade, type Stade, type StadeFilters
} from '../../../api/stades.api';
import { Modal, ConfirmDialog } from '../../../components/ui/Modal';
import { StatutBadge } from '../../../components/ui/Badge';
import { SkeletonTable, EmptyState, Pagination } from '../../../components/ui/DataTable';

// ── Formulaire création/édition stade ──────────────────────
const StadeForm: React.FC<{
  initial?: Partial<Stade>;
  onSuccess: () => void;
  onClose: () => void;
}> = ({ initial, onSuccess, onClose }) => {
  const queryClient = useQueryClient();
  const isEdit = !!initial?.id;
  const [form, setForm] = useState({
    nom: initial?.nom ?? '',
    ville: initial?.ville ?? '',
    capacite: initial?.capacite ?? '',
    est_actif: initial?.est_actif ?? true,
  });
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const mutation = useMutation({
    mutationFn: () => {
      const data = {
        ...form,
        capacite: form.capacite === '' ? undefined : Number(form.capacite)
      };
      return isEdit ? updateStade(initial!.id!, data) : createStade(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-stades'] });
      toast.success(isEdit ? 'Stade mis à jour !' : 'Stade enregistré !');
      onSuccess();
    },
    onError: (err: any) => {
      setErrors(err.response?.data?.errors ?? {});
      toast.error(err.response?.data?.message ?? 'Erreur');
    },
  });

  const f = (key: keyof typeof form) => ({
    value: form[key] as any,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const val = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
      setForm(p => ({ ...p, [key]: val }));
    },
    className: `form-input${errors[key] ? ' error' : ''}`,
  });

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }}
      style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div className="form-group">
          <label className="form-label">Nom du stade <span className="required">*</span></label>
          <input type="text" placeholder="Ex: Stade Ahmadou Ahidjo" required {...f('nom')} />
          {errors.nom && <span className="form-error">{errors.nom[0]}</span>}
        </div>
        <div className="form-group">
          <label className="form-label">Ville <span className="required">*</span></label>
          <input type="text" placeholder="Ex: Yaoundé" required {...f('ville')} />
          {errors.ville && <span className="form-error">{errors.ville[0]}</span>}
        </div>
        <div className="form-group">
          <label className="form-label">Capacité (spectateurs)</label>
          <input type="number" placeholder="Ex: 40000" {...f('capacite')} />
          {errors.capacite && <span className="form-error">{errors.capacite[0]}</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
          <input type="checkbox" id="est_actif" checked={form.est_actif} {...f('est_actif')} />
          <label htmlFor="est_actif" style={{ fontSize: '14px', cursor: 'pointer', fontWeight: 600 }}>Stade actif et disponible</label>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
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

// ── Page principale ───────────────────────────────────────────
const StadesListPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<StadeFilters>({ page: 1, per_page: 15 });
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Stade | null>(null);
  const [confirmToggle, setConfirmToggle] = useState<{ id: number; nom: string; est_actif: boolean } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; nom: string } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-stades', filters],
    queryFn: () => getStades(filters),
    placeholderData: (prev) => prev,
  });

  const toggleMutation = useMutation({
    mutationFn: (id: number) => toggleStade(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin-stades'] });
      toast.success(res.message ?? 'Statut mis à jour');
      setConfirmToggle(null);
    },
    onError: () => toast.error('Erreur lors du changement de statut'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteStade(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin-stades'] });
      toast.success(res.message ?? 'Stade supprimé');
      setConfirmDelete(null);
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters(prev => ({ ...prev, search, page: 1 }));
  };

  const openEdit = (stade: Stade) => { setEditTarget(stade); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditTarget(null); };

  const stades = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div
        className="page-header"
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}
      >
        <div>
          <h1 className="page-title">Gestion des stades</h1>
          <p className="page-subtitle">{meta?.total ?? 0} stade{(meta?.total ?? 0) > 1 ? 's' : ''} enregistré{(meta?.total ?? 0) > 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditTarget(null); setShowForm(true); }}>
          <Plus size={16} /> Ajouter un stade
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
                placeholder="Nom du stade ou ville…"
                value={search} onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary btn-sm">Rechercher</button>
          </form>

          <select
            className="form-select" style={{ width: 'auto', minWidth: '160px' }}
            value={filters.est_actif === undefined ? '' : String(filters.est_actif)}
            onChange={(e) => setFilters(prev => ({
              ...prev,
              est_actif: e.target.value === '' ? undefined : e.target.value === 'true',
              page: 1,
            }))}
          >
            <option value="">Tous les statuts</option>
            <option value="true">Actifs</option>
            <option value="false">Inactifs</option>
          </select>
        </div>
      </div>

      {/* Tableau */}
      <div className="card">
        {isLoading ? (
          <div style={{ padding: '4px' }}>
            <SkeletonTable rows={6} cols={5} />
          </div>
        ) : stades.length === 0 ? (
          <EmptyState
            title="Aucun stade trouvé"
            description="Enregistrez vos premiers stades de football."
            action={
              <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                <Plus size={16} /> Ajouter un stade
              </button>
            }
            icon={<MapPin size={28} style={{ color: 'var(--text-light)' }} />}
          />
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Stade</th>
                    <th>Ville</th>
                    <th>Capacité</th>
                    <th>Statut</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {stades.map((std: Stade, i: number) => (
                    <tr key={std.id} className="stagger-item" style={{ animationDelay: `${i * 40}ms` }}>
                      <td data-label="Stade">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '36px', height: '36px', borderRadius: '50%',
                            background: 'rgba(45,106,79,0.1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <MapPin size={16} style={{ color: 'var(--primary)' }} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '14px' }}>{std.nom}</div>
                          </div>
                        </div>
                      </td>
                      <td data-label="Ville" style={{ fontSize: '14px', fontWeight: 500 }}>
                        {std.ville}
                      </td>
                      <td data-label="Capacité" style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                        {std.capacite ? std.capacite.toLocaleString('fr-FR') + ' places' : 'Non précisée'}
                      </td>
                      <td data-label="Statut"><StatutBadge actif={std.est_actif} /></td>
                      <td data-label="Actions">
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                          <button
                            className="btn btn-icon btn-ghost btn-sm"
                            title="Modifier"
                            onClick={() => openEdit(std)}
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            className="btn btn-icon btn-ghost btn-sm"
                            title={std.est_actif ? 'Désactiver' : 'Activer'}
                            onClick={() => setConfirmToggle({ id: std.id, nom: std.nom, est_actif: std.est_actif })}
                          >
                            {std.est_actif
                              ? <ToggleRight size={16} style={{ color: 'var(--primary)' }} />
                              : <ToggleLeft size={16} style={{ color: 'var(--text-light)' }} />
                            }
                          </button>
                          <button
                            className="btn btn-icon btn-ghost btn-sm"
                            title="Supprimer"
                            style={{ color: 'var(--secondary)' }}
                            onClick={() => setConfirmDelete({ id: std.id, nom: std.nom })}
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
        title={editTarget ? 'Modifier un stade' : 'Ajouter un stade'}
        size="md"
      >
        <StadeForm
          initial={editTarget ?? undefined}
          onSuccess={closeForm}
          onClose={closeForm}
        />
      </Modal>

      {/* Confirm toggle */}
      <ConfirmDialog
        isOpen={!!confirmToggle} onClose={() => setConfirmToggle(null)}
        onConfirm={() => confirmToggle && toggleMutation.mutate(confirmToggle.id)}
        title={confirmToggle?.est_actif ? 'Désactiver le stade' : 'Activer le stade'}
        message={`Êtes-vous sûr de vouloir ${confirmToggle?.est_actif ? 'désactiver' : 'activer'} le stade "${confirmToggle?.nom}" ?`}
        confirmLabel={confirmToggle?.est_actif ? 'Désactiver' : 'Activer'}
        confirmVariant={confirmToggle?.est_actif ? 'danger' : 'primary'}
        isLoading={toggleMutation.isPending}
      />

      {/* Confirm delete */}
      <ConfirmDialog
        isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)}
        onConfirm={() => confirmDelete && deleteMutation.mutate(confirmDelete.id)}
        title="Supprimer le stade"
        message={`Êtes-vous sûr de vouloir supprimer définitivement le stade "${confirmDelete?.nom}" ?`}
        confirmLabel="Supprimer" confirmVariant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

export default StadesListPage;
