// src/pages/admin/AdminTransfertsPage.tsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeftRight, Check, X, ShieldAlert, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getTransfertsAdmin,
  validerTransfertAdmin,
  rejeterTransfertAdmin,
} from '../../api/transferts.api';
import type { Transfert } from '../../api/transferts.api';
import { Modal, ConfirmDialog } from '../../components/ui/Modal';
import { ValidationBadge } from '../../components/ui/Badge';
import { SkeletonTable, EmptyState, Avatar } from '../../components/ui/DataTable';

// ── Formulaire Rejet Transfert ─────────────────────────────────
interface RejetFormProps {
  transfertId: number;
  onClose: () => void;
  isPending: boolean;
  onSubmit: (motif: string) => void;
}

const RejetForm: React.FC<RejetFormProps> = ({ onClose, isPending, onSubmit }) => {
  const [motif, setMotif] = useState('');

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (motif.trim().length < 5) {
      toast.error('Le motif doit faire au moins 5 caractères.');
      return;
    }
    onSubmit(motif);
  };

  return (
    <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div className="form-group">
        <label className="form-label">Motif du rejet <span className="required">*</span></label>
        <textarea
          rows={4}
          placeholder="Ex: Le montant du transfert ou les pièces justificatives ne sont pas conformes au règlement général..."
          value={motif}
          onChange={(e) => setMotif(e.target.value)}
          className="form-input"
          required
        />
        <span className="form-hint">Le club cédant verra ce motif pour pouvoir corriger sa demande.</span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
        <button type="button" className="btn btn-ghost" onClick={onClose} disabled={isPending}>
          Annuler
        </button>
        <button type="submit" className="btn btn-secondary" disabled={isPending}>
          {isPending && (
            <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full inline-block mr-2" />
          )}
          Confirmer le rejet
        </button>
      </div>
    </form>
  );
};

// ── Page principale ───────────────────────────────────────────
const AdminTransfertsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeFilter, setActiveFilter] = useState<'tous' | 'en_attente' | 'valide' | 'rejete'>('en_attente');
  
  // Modals / Dialogs states
  const [confirmValider, setConfirmValider] = useState<Transfert | null>(null);
  const [rejetTransfert, setRejetTransfert] = useState<Transfert | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['transferts-admin'],
    queryFn: getTransfertsAdmin,
  });

  const validerMutation = useMutation({
    mutationFn: (id: number) => validerTransfertAdmin(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['transferts-admin'] });
      toast.success(res.message ?? 'Le transfert a été validé ! Le joueur a été transféré.');
      setConfirmValider(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message ?? 'Erreur lors de la validation');
    },
  });

  const rejeterMutation = useMutation({
    mutationFn: ({ id, motif }: { id: number; motif: string }) => rejeterTransfertAdmin(id, motif),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['transferts-admin'] });
      toast.success(res.message ?? 'Le transfert a été rejeté.');
      setRejetTransfert(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message ?? 'Erreur lors du rejet');
    },
  });

  const transferts: Transfert[] = data?.data ?? [];

  // Filtrer les transferts selon l'état sélectionné
  const filteredTransferts = transferts.filter((t) => {
    if (activeFilter === 'tous') return true;
    return t.statut === activeFilter;
  });

  const formatCurrency = (val: string | null) => {
    if (!val) return 'Non renseigné';
    const amount = parseFloat(val);
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(amount);
  };

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Modération des Transferts (Mercato)</h1>
        <p className="page-subtitle">Homologation et validation officielle des mutations de joueurs entre clubs</p>
      </div>

      {/* Barre de Filtres */}
      <div
        style={{
          display: 'flex',
          gap: '4px',
          borderBottom: '1px solid var(--border)',
          marginBottom: '20px',
          paddingBottom: '2px',
          flexWrap: 'wrap',
        }}
      >
        {(['en_attente', 'valide', 'rejete', 'tous'] as const).map((status) => {
          const labels: Record<string, string> = {
            en_attente: '⏳ En attente de validation',
            valide: '✅ Validés',
            rejete: '❌ Rejetés',
            tous: 'Tout voir',
          };
          return (
            <button
              key={status}
              onClick={() => setActiveFilter(status)}
              style={{
                padding: '10px 16px',
                border: 'none',
                background: 'none',
                fontSize: '14px',
                fontWeight: 600,
                color: activeFilter === status ? 'var(--primary)' : 'var(--text-muted)',
                borderBottom: activeFilter === status ? '2px solid var(--primary)' : '2px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {labels[status]}
            </button>
          );
        })}
      </div>

      {/* Tableau / Liste */}
      <div className="card">
        {isLoading ? (
          <div style={{ padding: '4px' }}>
            <SkeletonTable rows={5} cols={6} />
          </div>
        ) : filteredTransferts.length === 0 ? (
          <EmptyState
            title="Aucune demande de transfert"
            description={
              activeFilter === 'en_attente'
                ? 'Il n\'y a actuellement aucune demande de transfert de joueur en attente de validation.'
                : 'Aucun transfert trouvé dans cette catégorie.'
            }
            icon={<ArrowLeftRight size={28} style={{ color: 'var(--text-light)' }} />}
          />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Joueur</th>
                  <th>Club cédant</th>
                  <th>Club acquéreur</th>
                  <th>Montant</th>
                  <th>Demandé le</th>
                  <th>Statut</th>
                  <th style={{ textAlign: 'right' }}>Actions / Détails</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransferts.map((t: Transfert, i: number) => (
                  <tr key={t.id} className="stagger-item" style={{ animationDelay: `${i * 30}ms` }}>
                    <td data-label="Joueur">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Avatar src={t.joueur?.photo_url} name={t.joueur?.nom_complet ?? ''} size={36} />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '14px' }}>{t.joueur?.nom_complet}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            {t.joueur?.poste_label}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td data-label="Club cédant">
                      <span style={{ fontWeight: 500 }}>{t.club_cedant?.nom}</span>
                    </td>
                    <td data-label="Club acquéreur">
                      <span style={{ fontWeight: 500, color: 'var(--primary)' }}>{t.club_acquereur?.nom}</span>
                    </td>
                    <td data-label="Montant" style={{ fontSize: '13px', fontWeight: 600 }}>
                      {formatCurrency(t.montant)}
                    </td>
                    <td data-label="Demandé le" style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                      {t.date_demande ? new Date(t.date_demande).toLocaleDateString('fr-FR') : '—'}
                    </td>
                    <td data-label="Statut">
                      <ValidationBadge statut={t.statut} />
                    </td>
                    <td data-label="Actions / Détails">
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', alignItems: 'center' }}>
                        {t.statut === 'en_attente' ? (
                          <>
                            <button
                              className="btn btn-ghost btn-sm"
                              style={{ color: '#15803d', display: 'flex', alignItems: 'center', gap: '4px' }}
                              onClick={() => setConfirmValider(t)}
                            >
                              <Check size={14} /> Valider
                            </button>
                            <button
                              className="btn btn-ghost btn-sm"
                              style={{ color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}
                              onClick={() => setRejetTransfert(t)}
                            >
                              <X size={14} /> Rejeter
                            </button>
                          </>
                        ) : (
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'right' }}>
                            {t.statut === 'valide' && t.date_validation && (
                              <span>
                                Validé le {new Date(t.date_validation).toLocaleDateString('fr-FR')}
                                {t.valide_par ? ` par ${t.valide_par.prenom} ${t.valide_par.nom}` : ''}
                              </span>
                            )}
                            {t.statut === 'rejete' && (
                              <div>
                                <span style={{ color: 'var(--secondary)', fontWeight: 600 }}>Rejeté</span>
                                {t.motif_rejet && (
                                  <div style={{ fontStyle: 'italic', fontSize: '11px', marginTop: '2px', maxWidth: '200px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={t.motif_rejet}>
                                    "{t.motif_rejet}"
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirm Valider */}
      <ConfirmDialog
        isOpen={!!confirmValider}
        onClose={() => setConfirmValider(null)}
        onConfirm={() => confirmValider && validerMutation.mutate(confirmValider.id)}
        title="Valider la mutation de joueur"
        message={
          confirmValider ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <p>
                Vous êtes sur le point de valider officiellement le transfert de <strong>{confirmValider.joueur?.nom_complet}</strong> de <strong>{confirmValider.club_cedant?.nom}</strong> vers <strong>{confirmValider.club_acquereur?.nom}</strong>.
              </p>
              <div
                style={{
                  background: 'rgba(21,128,61,0.06)',
                  border: '1px solid rgba(21,128,61,0.12)',
                  borderRadius: 'var(--border-radius-sm)',
                  padding: '10px',
                  fontSize: '13px',
                  color: '#14532d',
                  display: 'flex',
                  gap: '6px',
                  alignItems: 'center',
                }}
              >
                <ShieldAlert size={16} />
                <span>Cette action modifiera automatiquement l'effectif actuel du joueur dans la base de données.</span>
              </div>
            </div>
          ) : ''
        }
        confirmLabel="Valider et Transférer"
        confirmVariant="primary"
        isLoading={validerMutation.isPending}
      />

      {/* Modal Rejeter */}
      <Modal
        isOpen={!!rejetTransfert}
        onClose={() => setRejetTransfert(null)}
        title="Rejeter la demande de transfert"
        size="sm"
      >
        {rejetTransfert && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ fontSize: '14px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FileText size={16} />
              <span>
                Rejet du transfert de <strong>{rejetTransfert.joueur?.nom_complet}</strong> vers {rejetTransfert.club_acquereur?.nom}
              </span>
            </div>
            <RejetForm
              transfertId={rejetTransfert.id}
              onClose={() => setRejetTransfert(null)}
              isPending={rejeterMutation.isPending}
              onSubmit={(motif) => rejeterMutation.mutate({ id: rejetTransfert.id, motif })}
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminTransfertsPage;
