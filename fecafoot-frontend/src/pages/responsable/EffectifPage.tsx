// src/pages/responsable/EffectifPage.tsx
// Gestion de l'effectif : liste joueurs, ajout, édition, suppression, soumission

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Pencil, Trash2, Send, Upload,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getJoueursClub, createJoueur, updateJoueur,
  deleteJoueur, soumettreEffectif, POSTES, type Joueur
} from '../../api/joueurs.api';
import { Modal, ConfirmDialog } from '../../components/ui/Modal';
import { ValidationBadge } from '../../components/ui/Badge';
import { SkeletonTable, EmptyState, Avatar } from '../../components/ui/DataTable';

// ── Formulaire ajout/édition joueur ──────────────────────────
const JoueurForm: React.FC<{
  initial?: Joueur | null;
  clubId?: number;
  isValidated?: boolean;
  onSuccess: () => void;
  onClose: () => void;
}> = ({ initial, isValidated = false, onSuccess, onClose }) => {
  const queryClient = useQueryClient();
  const isEdit = !!initial?.id;

  const [form, setForm] = useState({
    nom: initial?.nom ?? '',
    prenom: initial?.prenom ?? '',
    date_naissance: initial?.date_naissance ?? '',
    nationalite: initial?.nationalite ?? '',
    num_licence: initial?.num_licence ?? '',
    poste: initial?.poste ?? 'gardien',
    num_maillot: initial?.num_maillot?.toString() ?? '',
    taille_cm: initial?.taille_cm?.toString() ?? '',
    poids_kg: initial?.poids_kg?.toString() ?? '',
  });
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(initial?.photo_url ?? null);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const mutation = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v); });
      if (photo) fd.append('photo', photo);
      return isEdit ? updateJoueur(initial!.id, fd) : createJoueur(fd);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['joueurs-club'] });
      toast.success(isEdit ? 'Joueur mis à jour !' : 'Joueur ajouté à l\'effectif !');
      onSuccess();
    },
    onError: (err: any) => {
      setErrors(err.response?.data?.errors ?? {});
      toast.error(err.response?.data?.message ?? 'Erreur de validation');
    },
  });

  const f = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(p => ({ ...p, [key]: e.target.value })),
    className: `form-input${errors[key] ? ' error' : ''}`,
  });

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }}
      style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
    >
      {/* Photo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <Avatar src={preview} name={`${form.prenom} ${form.nom}`} size={56} />
        <label className="btn btn-ghost btn-sm" style={{ cursor: 'pointer' }}>
          <Upload size={14} /> {photo ? 'Changer la photo' : 'Ajouter une photo'}
          <input
            type="file" accept="image/*" style={{ display: 'none' }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              setPhoto(f);
              setPreview(URL.createObjectURL(f));
            }}
          />
        </label>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div className="form-group">
          <label className="form-label">Nom <span className="required">*</span></label>
          <input type="text" placeholder="Nom" required {...f('nom')} />
          {errors.nom && <span className="form-error">{errors.nom[0]}</span>}
        </div>
        <div className="form-group">
          <label className="form-label">Prénom <span className="required">*</span></label>
          <input type="text" placeholder="Prénom" required {...f('prenom')} />
        </div>
        <div className="form-group">
          <label className="form-label">Date de naissance <span className="required">*</span></label>
          <input type="date" required {...f('date_naissance')} />
          {errors.date_naissance && <span className="form-error">{errors.date_naissance[0]}</span>}
        </div>
        <div className="form-group">
          <label className="form-label">Nationalité</label>
          <input type="text" placeholder="Ex: Camerounaise" {...f('nationalite')} />
        </div>
        <div className="form-group">
          <label className="form-label">N° Licence <span className="required">*</span></label>
          <input
            type="text"
            placeholder="Ex: LIC-2025-001"
            required
            {...f('num_licence')}
            disabled={isValidated}
            style={isValidated ? { opacity: 0.6, cursor: 'not-allowed', background: 'var(--bg)' } : {}}
          />
          {isValidated && (
            <span className="form-hint" style={{ color: 'var(--accent-dark)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
              🔒 Le numéro de licence ne peut plus être modifié après validation FECAFOOT.
            </span>
          )}
          {errors.num_licence && <span className="form-error">{errors.num_licence[0]}</span>}
        </div>
        <div className="form-group">
          <label className="form-label">N° Maillot <span className="required">*</span></label>
          <input type="number" min={1} max={99} placeholder="Ex: 10" required {...f('num_maillot')} />
          {errors.num_maillot && <span className="form-error">{errors.num_maillot[0]}</span>}
        </div>
        <div className="form-group" style={{ gridColumn: '1/-1' }}>
          <label className="form-label">Poste <span className="required">*</span></label>
          <select
            className={`form-select${errors.poste ? ' error' : ''}`}
            value={form.poste}
            onChange={(e) => setForm(p => ({ ...p, poste: e.target.value }))}
          >
            {POSTES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Taille (cm)</label>
          <input type="number" placeholder="Ex: 182" {...f('taille_cm')} />
        </div>
        <div className="form-group">
          <label className="form-label">Poids (kg)</label>
          <input type="number" placeholder="Ex: 75" {...f('poids_kg')} />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '4px' }}>
        <button type="button" className="btn btn-ghost" onClick={onClose}>Annuler</button>
        <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
          {mutation.isPending && (
            <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full inline-block" />
          )}
          {isEdit ? <><Pencil size={15} /> Modifier</> : <><Plus size={15} /> Ajouter</>}
        </button>
      </div>
    </form>
  );
};

// ── Barre de progression effectif ─────────────────────────────
const EffectifProgress: React.FC<{ total: number; valides: number; enAttente: number }> = ({
  total, valides, enAttente
}) => {
  const MIN = 11;
  const pct = Math.min((valides / MIN) * 100, 100);

  return (
    <div className="card" style={{ padding: '16px 20px', marginBottom: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
        <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>
          Progression de l'effectif
        </span>
        <div style={{ display: 'flex', gap: '12px', fontSize: '13px' }}>
          <span style={{ color: '#15803d', fontWeight: 600 }}>✅ {valides} validés</span>
          <span style={{ color: 'var(--accent-dark)', fontWeight: 600 }}>⏳ {enAttente} en attente</span>
          <span style={{ color: 'var(--text-muted)' }}>Total : {total}</span>
        </div>
      </div>
      <div style={{ height: '8px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: pct >= 100 ? '#15803d' : 'var(--primary)',
          borderRadius: '4px',
          transition: 'width 0.6s ease',
        }} />
      </div>
      <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>
        {valides >= MIN
          ? `✅ Effectif minimum atteint (${MIN} joueurs validés requis)`
          : `⚠️ ${MIN - valides} joueur${MIN - valides > 1 ? 's' : ''} validé${MIN - valides > 1 ? 's' : ''} encore nécessaire${MIN - valides > 1 ? 's' : ''} (minimum ${MIN})`
        }
      </p>
    </div>
  );
};

// ── Page principale ───────────────────────────────────────────
const EffectifPage: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Joueur | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Joueur | null>(null);
  const [confirmSoumettre, setConfirmSoumettre] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['joueurs-club'],
    queryFn: () => getJoueursClub(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteJoueur(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['joueurs-club'] });
      toast.success(res.message ?? 'Joueur supprimé');
      setConfirmDelete(null);
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  });

  const soumMutation = useMutation({
    mutationFn: soumettreEffectif,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['joueurs-club'] });
      toast.success(res.message ?? `${res.count} joueur(s) soumis à validation !`, {
        duration: 5000,
        style: { borderLeft: '4px solid var(--primary)' },
      });
      setConfirmSoumettre(false);
    },
    onError: (err: any) => {
      const data = err.response?.data;
      const msg = data?.message ?? 'Aucun joueur à soumettre';

      // Afficher les postes manquants si disponibles
      if (data?.postes_manquants?.length > 0) {
        toast.error(
          `❌ ${msg}\n\nPostes manquants : ${data.postes_manquants.join(', ')}`,
          { duration: 8000 }
        );
      } else if (data?.details) {
        toast.error(
          `⚠️ ${msg} (${data.details.joueurs_total}/${data.details.minimum_requis})`,
          { duration: 8000 }
        );
      } else {
        toast.error(msg);
      }
      setConfirmSoumettre(false);
    },
  });

  const joueurs = data?.data ?? [];
  const stats = data?.stats ?? { total: 0, valides: 0, en_attente: 0, rejetes: 0, soumis: 0 };
  const nonSoumis = joueurs.filter((j: Joueur) => !j.est_soumis && j.statut_validation === 'en_attente').length;

  const openEdit = (joueur: Joueur) => { setEditTarget(joueur); setShowForm(true); };
  const isValidated = (j: Joueur) => j.statut_validation === 'valide';
  const closeForm = () => { setShowForm(false); setEditTarget(null); };

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div
        className="page-header"
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}
      >
        <div>
          <h1 className="page-title">Mon Effectif</h1>
          <p className="page-subtitle">{stats.total} joueur{stats.total > 1 ? 's' : ''} enregistré{stats.total > 1 ? 's' : ''}</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {nonSoumis > 0 && (
            <button className="btn btn-accent" onClick={() => setConfirmSoumettre(true)}>
              <Send size={15} /> Soumettre à validation ({nonSoumis})
            </button>
          )}
          <button className="btn btn-primary" onClick={() => { setEditTarget(null); setShowForm(true); }}>
            <Plus size={16} /> Ajouter un joueur
          </button>
        </div>
      </div>

      {/* Barre progression */}
      {!isLoading && (
        <EffectifProgress
          total={stats.total}
          valides={stats.valides}
          enAttente={stats.en_attente}
        />
      )}

      {/* Tableau */}
      <div className="card">
        {isLoading ? (
          <div style={{ padding: '4px' }}>
            <SkeletonTable rows={8} cols={6} />
          </div>
        ) : joueurs.length === 0 ? (
          <EmptyState
            title="Aucun joueur dans l'effectif"
            description="Ajoutez vos premiers joueurs pour constituer l'effectif."
            action={
              <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                <Plus size={16} /> Ajouter un joueur
              </button>
            }
          />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '50px' }}>N°</th>
                  <th>Joueur</th>
                  <th>Poste</th>
                  <th>Âge</th>
                  <th>Licence</th>
                  <th>Validation</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {joueurs.map((j: Joueur, i: number) => (
                  <tr key={j.id} className="stagger-item" style={{ animationDelay: `${i * 35}ms` }}>
                    <td data-label="N°">
                      <span style={{
                        fontWeight: 800, fontSize: '16px',
                        color: 'var(--primary)',
                      }}>
                        {j.num_maillot}
                      </span>
                    </td>
                    <td data-label="Joueur">
                      <div 
                        onClick={() => navigate('/responsable/joueurs/' + j.id)}
                        style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
                      >
                        <Avatar src={j.photo_url} name={j.nom_complet} size={36} />
                        <div>
                          <div 
                            style={{ 
                              fontWeight: 600, 
                              fontSize: '14px', 
                              color: 'var(--primary)'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.textDecoration = 'underline'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.textDecoration = 'none'; }}
                          >
                            {j.nom_complet}
                          </div>
                          {j.motif_rejet && (
                            <div style={{ fontSize: '11px', color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <AlertCircle size={10} /> {j.motif_rejet}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td data-label="Poste" style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                      {j.poste_label}
                    </td>
                    <td data-label="Âge" style={{ fontSize: '13px' }}>
                      {j.age ? `${j.age} ans` : '—'}
                    </td>
                    <td data-label="Licence">
                      <code style={{ fontSize: '12px', background: 'var(--bg)', padding: '2px 7px', borderRadius: '4px', border: '1px solid var(--border)' }}>
                        {j.num_licence}
                      </code>
                    </td>
                    <td data-label="Validation">
                      <div>
                        <ValidationBadge statut={j.statut_validation} />
                        {j.est_soumis && j.statut_validation === 'en_attente' && (
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                            Soumis
                          </div>
                        )}
                      </div>
                    </td>
                    <td data-label="Actions">
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                        <button
                          className="btn btn-icon btn-ghost btn-sm"
                          onClick={() => openEdit(j)}
                          title={isValidated(j) ? 'Modifier (licence verrouillée)' : 'Modifier'}
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          className="btn btn-icon btn-ghost btn-sm"
                          onClick={() => setConfirmDelete(j)}
                          title="Supprimer"
                          style={{ color: 'var(--secondary)' }}
                          disabled={isValidated(j)}
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
        )}
      </div>

      {/* Modal formulaire */}
      <Modal
        isOpen={showForm} onClose={closeForm}
        title={editTarget ? 'Modifier un joueur' : 'Ajouter un joueur'}
        subtitle="Les informations seront soumises à validation de la FECAFOOT."
        size="lg"
      >
        <JoueurForm
          initial={editTarget}
          isValidated={editTarget?.statut_validation === 'valide'}
          onSuccess={closeForm}
          onClose={closeForm}
        />
      </Modal>

      {/* Confirm soumettre */}
      <ConfirmDialog
        isOpen={confirmSoumettre}
        onClose={() => setConfirmSoumettre(false)}
        onConfirm={() => soumMutation.mutate()}
        title="Soumettre l'effectif à validation"
        message={`Vous êtes sur le point de soumettre ${nonSoumis} joueur${nonSoumis > 1 ? 's' : ''} à la validation de l'administration FECAFOOT. Cette action ne peut pas être annulée.`}
        confirmLabel="Soumettre"
        confirmVariant="primary"
        isLoading={soumMutation.isPending}
      />

      {/* Confirm delete */}
      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => confirmDelete && deleteMutation.mutate(confirmDelete.id)}
        title="Supprimer le joueur"
        message={`Êtes-vous sûr de vouloir supprimer ${confirmDelete?.nom_complet} de l'effectif ?`}
        confirmLabel="Supprimer"
        confirmVariant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

export default EffectifPage;
