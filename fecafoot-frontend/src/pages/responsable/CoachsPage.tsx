// src/pages/responsable/CoachsPage.tsx
// Gestion des coachs du club par le responsable

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, ToggleLeft, ToggleRight, Trash2, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getCoachsClub, createCoach, toggleCoach, deleteCoach
} from '../../api/users.api';
import { Modal, ConfirmDialog } from '../../components/ui/Modal';
import { StatutBadge } from '../../components/ui/Badge';
import { SkeletonTable, EmptyState, Avatar } from '../../components/ui/DataTable';

// ── Formulaire ajout coach ────────────────────────────────────
const CoachForm: React.FC<{ onSuccess: () => void; onClose: () => void }> = ({ onSuccess, onClose }) => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ nom: '', prenom: '', email: '' });
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const mutation = useMutation({
    mutationFn: () => createCoach(form),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['coachs-club'] });
      toast.success(data.message ?? 'Coach ajouté avec succès !');
      onSuccess();
    },
    onError: (err: any) => {
      setErrors(err.response?.data?.errors ?? {});
      toast.error(err.response?.data?.message ?? 'Erreur lors de l\'ajout');
    },
  });

  const f = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm(p => ({ ...p, [key]: e.target.value })),
    className: `form-input${errors[key] ? ' error' : ''}`,
  });

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }}
      style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
    >
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
      </div>
      <div className="form-group">
        <label className="form-label">Email <span className="required">*</span></label>
        <input type="email" placeholder="coach@club.cm" required {...f('email')} />
        {errors.email && <span className="form-error">{errors.email[0]}</span>}
        <span className="form-hint">Un email avec les identifiants sera envoyé au coach.</span>
      </div>

      <div
        style={{
          background: 'rgba(27,67,50,0.05)',
          border: '1px solid rgba(27,67,50,0.1)',
          borderRadius: 'var(--border-radius-sm)',
          padding: '12px', fontSize: '13px', color: 'var(--text-muted)',
        }}
      >
        ℹ️ Le coach recevra un email avec ses identifiants de connexion. Il pourra accéder à l'espace coach.
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
        <button type="button" className="btn btn-ghost" onClick={onClose}>Annuler</button>
        <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
          {mutation.isPending && (
            <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full inline-block" />
          )}
          <Plus size={15} /> Ajouter le coach
        </button>
      </div>
    </form>
  );
};

// ── Page principale ───────────────────────────────────────────
const CoachsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd]       = useState(false);
  const [confirmToggle, setConfirmToggle] = useState<{ id: number; nom: string; actif: boolean } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; nom: string } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['coachs-club'],
    queryFn: getCoachsClub,
  });

  const toggleMutation = useMutation({
    mutationFn: (id: number) => toggleCoach(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['coachs-club'] });
      toast.success(res.message ?? 'Statut mis à jour');
      setConfirmToggle(null);
    },
    onError: () => toast.error('Erreur lors du changement de statut'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteCoach(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['coachs-club'] });
      toast.success(res.message ?? 'Coach retiré du club');
      setConfirmDelete(null);
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  });

  const coachs = data?.data ?? [];

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div
        className="page-header"
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}
      >
        <div>
          <h1 className="page-title">Gestion des coachs</h1>
          <p className="page-subtitle">{coachs.length} coach{coachs.length > 1 ? 's' : ''} dans votre club</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
          <Plus size={16} /> Ajouter un coach
        </button>
      </div>

      {/* Tableau */}
      <div className="card">
        {isLoading ? (
          <div style={{ padding: '4px' }}>
            <SkeletonTable rows={4} cols={4} />
          </div>
        ) : coachs.length === 0 ? (
          <EmptyState
            title="Aucun coach"
            description="Ajoutez des coachs pour gérer votre équipe technique."
            action={
              <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
                <Plus size={16} /> Ajouter un coach
              </button>
            }
            icon={<Users size={28} style={{ color: 'var(--text-light)' }} />}
          />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Coach</th>
                  <th>Email</th>
                  <th>Statut</th>
                  <th>Connexion</th>
                  <th>Ajouté le</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {coachs.map((coach: any, i: number) => (
                  <tr key={coach.id} className="stagger-item" style={{ animationDelay: `${i * 60}ms` }}>
                    <td data-label="Coach">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Avatar src={null} name={coach.nom_complet} size={36} />
                        <span style={{ fontWeight: 600, fontSize: '14px' }}>{coach.nom_complet}</span>
                      </div>
                    </td>
                    <td data-label="Email" style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                      {coach.email}
                    </td>
                    <td data-label="Statut"><StatutBadge actif={coach.acces_actif} /></td>
                    <td data-label="Connexion">
                      {coach.premiere_connexion ? (
                        <span style={{ fontSize: '12px', color: 'var(--accent-dark)', fontWeight: 600 }}>
                          ⏳ En attente
                        </span>
                      ) : (
                        <span style={{ fontSize: '12px', color: '#15803d', fontWeight: 600 }}>
                          ✅ Connecté
                        </span>
                      )}
                    </td>
                    <td data-label="Ajouté le" style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                      {coach.created_at ? new Date(coach.created_at).toLocaleDateString('fr-FR') : '—'}
                    </td>
                    <td data-label="Actions">
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                        <button
                          className="btn btn-icon btn-ghost btn-sm"
                          title={coach.acces_actif ? 'Désactiver' : 'Activer'}
                          onClick={() => setConfirmToggle({ id: coach.id, nom: coach.nom_complet, actif: coach.acces_actif })}
                        >
                          {coach.acces_actif
                            ? <ToggleRight size={16} style={{ color: 'var(--primary)' }} />
                            : <ToggleLeft size={16} style={{ color: 'var(--text-light)' }} />
                          }
                        </button>
                        <button
                          className="btn btn-icon btn-ghost btn-sm"
                          title="Retirer du club"
                          style={{ color: 'var(--secondary)' }}
                          onClick={() => setConfirmDelete({ id: coach.id, nom: coach.nom_complet })}
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

      {/* Modal ajout */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Ajouter un coach" size="sm">
        <CoachForm onSuccess={() => setShowAdd(false)} onClose={() => setShowAdd(false)} />
      </Modal>

      {/* Confirm toggle */}
      <ConfirmDialog
        isOpen={!!confirmToggle} onClose={() => setConfirmToggle(null)}
        onConfirm={() => confirmToggle && toggleMutation.mutate(confirmToggle.id)}
        title={confirmToggle?.actif ? 'Désactiver le coach' : 'Activer le coach'}
        message={`Êtes-vous sûr de vouloir ${confirmToggle?.actif ? 'désactiver' : 'activer'} l'accès de ${confirmToggle?.nom} ?`}
        confirmLabel={confirmToggle?.actif ? 'Désactiver' : 'Activer'}
        confirmVariant={confirmToggle?.actif ? 'danger' : 'primary'}
        isLoading={toggleMutation.isPending}
      />

      {/* Confirm delete */}
      <ConfirmDialog
        isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)}
        onConfirm={() => confirmDelete && deleteMutation.mutate(confirmDelete.id)}
        title="Retirer le coach du club"
        message={`Êtes-vous sûr de vouloir retirer ${confirmDelete?.nom} de votre staff ? Son compte sera désactivé.`}
        confirmLabel="Retirer" confirmVariant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

export default CoachsPage;
