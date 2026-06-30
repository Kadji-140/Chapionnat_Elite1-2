// src/pages/responsable/ResponsableTransfertsPage.tsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeftRight, ArrowDownLeft, ArrowUpRight, Plus, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';
import {
  getTransfertsResponsable,
  createTransfertResponsable,
} from '../../api/transferts.api';
import type { Transfert } from '../../api/transferts.api';
import { getJoueursClub } from '../../api/joueurs.api';
import { getSharedClubs } from '../../api/clubs.api';
import { Modal } from '../../components/ui/Modal';
import { ValidationBadge } from '../../components/ui/Badge';
import { SkeletonTable, EmptyState, Avatar } from '../../components/ui/DataTable';

// ── Formulaire de demande de transfert ────────────────────────
interface TransferFormProps {
  currentClubId: number;
  onSuccess: () => void;
  onClose: () => void;
}

const TransferForm: React.FC<TransferFormProps> = ({ currentClubId, onSuccess, onClose }) => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    joueur_id: '',
    club_acquereur_id: '',
    montant: '',
  });
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  // 1. Charger les joueurs validés de mon club
  const { data: joueursData, isLoading: isLoadingJoueurs } = useQuery({
    queryKey: ['my-club-players-validated'],
    queryFn: () => getJoueursClub({ statut_validation: 'valide' }),
  });
  const validPlayers = joueursData?.data ?? [];

  // 2. Charger les autres clubs actifs
  const { data: clubsData, isLoading: isLoadingClubs } = useQuery({
    queryKey: ['shared-clubs-list'],
    queryFn: () => getSharedClubs({ actif: true, per_page: 100 }),
  });
  const otherClubs = (clubsData?.data ?? []).filter((c) => c.id !== currentClubId);

  const mutation = useMutation({
    mutationFn: () => createTransfertResponsable({
      joueur_id: Number(form.joueur_id),
      club_acquereur_id: Number(form.club_acquereur_id),
      montant: form.montant ? Number(form.montant) : undefined,
    }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['transferts-responsable'] });
      toast.success(res.message ?? 'Demande de transfert soumise !');
      onSuccess();
    },
    onError: (err: any) => {
      setErrors(err.response?.data?.errors ?? {});
      toast.error(err.response?.data?.message ?? 'Erreur lors de la soumission');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.joueur_id || !form.club_acquereur_id) {
      toast.error('Veuillez remplir tous les champs obligatoires.');
      return;
    }
    mutation.mutate();
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="form-group">
        <label className="form-label">Joueur à transférer <span className="required">*</span></label>
        <select
          value={form.joueur_id}
          onChange={(e) => setForm((p) => ({ ...p, joueur_id: e.target.value }))}
          className={`form-input ${errors.joueur_id ? 'error' : ''}`}
          disabled={isLoadingJoueurs}
          required
        >
          <option value="">-- Sélectionner un joueur validé --</option>
          {validPlayers.map((j: any) => (
            <option key={j.id} value={j.id}>
              {j.nom_complet} ({j.poste_label} - N°{j.num_maillot})
            </option>
          ))}
        </select>
        {errors.joueur_id && <span className="form-error">{errors.joueur_id[0]}</span>}
        <span className="form-hint">Seuls les joueurs validés par la FECAFOOT peuvent être transférés.</span>
      </div>

      <div className="form-group">
        <label className="form-label">Club acquéreur <span className="required">*</span></label>
        <select
          value={form.club_acquereur_id}
          onChange={(e) => setForm((p) => ({ ...p, club_acquereur_id: e.target.value }))}
          className={`form-input ${errors.club_acquereur_id ? 'error' : ''}`}
          disabled={isLoadingClubs}
          required
        >
          <option value="">-- Sélectionner le club destinataire --</option>
          {otherClubs.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nom} ({c.ville}) - {c.division === 'elite_one' ? 'Elite One' : 'Elite Two'}
            </option>
          ))}
        </select>
        {errors.club_acquereur_id && <span className="form-error">{errors.club_acquereur_id[0]}</span>}
      </div>

      <div className="form-group">
        <label className="form-label">Montant du transfert (FCFA)</label>
        <input
          type="number"
          placeholder="Ex: 5000000"
          value={form.montant}
          onChange={(e) => setForm((p) => ({ ...p, montant: e.target.value }))}
          className={`form-input ${errors.montant ? 'error' : ''}`}
          min="0"
        />
        {errors.montant && <span className="form-error">{errors.montant[0]}</span>}
      </div>

      <div
        style={{
          background: 'rgba(37,99,235,0.06)',
          border: '1px solid rgba(37,99,235,0.12)',
          borderRadius: 'var(--border-radius-sm)',
          padding: '12px',
          fontSize: '13px',
          color: '#1e3a8a',
          display: 'flex',
          gap: '8px',
          alignItems: 'flex-start',
        }}
      >
        <Info size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
        <span>
          En initiant ce transfert, la demande sera envoyée à la FECAFOOT pour validation officielle. Une fois validée par la ligue, le joueur sera automatiquement muté dans l'effectif du club acquéreur.
        </span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
        <button type="button" className="btn btn-ghost" onClick={onClose}>
          Annuler
        </button>
        <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
          {mutation.isPending && (
            <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full inline-block mr-2" />
          )}
          Soumettre la demande
        </button>
      </div>
    </form>
  );
};

// ── Page principale ───────────────────────────────────────────
const ResponsableTransfertsPage: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const currentClubId = user?.club?.id ?? 0;

  const [activeTab, setActiveTab] = useState<'sortants' | 'entrants'>('sortants');
  const [showAdd, setShowAdd] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['transferts-responsable'],
    queryFn: getTransfertsResponsable,
  });

  const transfertsList: Transfert[] = data?.data ?? [];

  // Filtrer les transferts selon l'onglet actif
  const filteredTransferts = transfertsList.filter((t) => {
    if (activeTab === 'sortants') {
      return t.club_cedant_id === currentClubId;
    } else {
      return t.club_acquereur_id === currentClubId;
    }
  });

  const formatCurrency = (val: string | null) => {
    if (!val) return 'Non renseigné';
    const amount = parseFloat(val);
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(amount);
  };

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div
        className="page-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <h1 className="page-title">Transferts & Mercato</h1>
          <p className="page-subtitle">Suivi et gestion des mutations de joueurs pour votre club</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
          <Plus size={16} /> Demander un transfert
        </button>
      </div>

      {/* Onglets */}
      <div
        style={{
          display: 'flex',
          gap: '4px',
          borderBottom: '1px solid var(--border)',
          marginBottom: '20px',
          paddingBottom: '2px',
        }}
      >
        <button
          onClick={() => setActiveTab('sortants')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            border: 'none',
            background: 'none',
            fontSize: '14px',
            fontWeight: 600,
            color: activeTab === 'sortants' ? 'var(--primary)' : 'var(--text-muted)',
            borderBottom: activeTab === 'sortants' ? '2px solid var(--primary)' : '2px solid transparent',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <ArrowUpRight size={16} /> Transferts Sortants (Départs)
        </button>
        <button
          onClick={() => setActiveTab('entrants')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            border: 'none',
            background: 'none',
            fontSize: '14px',
            fontWeight: 600,
            color: activeTab === 'entrants' ? 'var(--primary)' : 'var(--text-muted)',
            borderBottom: activeTab === 'entrants' ? '2px solid var(--primary)' : '2px solid transparent',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <ArrowDownLeft size={16} /> Transferts Entrants (Arrivées)
        </button>
      </div>

      {/* Tableau / Liste */}
      <div className="card">
        {isLoading ? (
          <div style={{ padding: '4px' }}>
            <SkeletonTable rows={4} cols={5} />
          </div>
        ) : filteredTransferts.length === 0 ? (
          <EmptyState
            title="Aucun transfert enregistré"
            description={
              activeTab === 'sortants'
                ? 'Vous n\'avez initié aucune demande de transfert de joueur sortant pour le moment.'
                : 'Aucune mutation de joueur n\'est en cours en direction de votre club.'
            }
            action={
              activeTab === 'sortants' ? (
                <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
                  <Plus size={16} /> Demander un transfert
                </button>
              ) : undefined
            }
            icon={<ArrowLeftRight size={28} style={{ color: 'var(--text-light)' }} />}
          />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Joueur</th>
                  <th>{activeTab === 'sortants' ? 'Club acquéreur' : 'Club cédant'}</th>
                  <th>Montant</th>
                  <th>Date demande</th>
                  <th>Statut</th>
                  <th>Détails modération</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransferts.map((t: Transfert, i: number) => (
                  <tr key={t.id} className="stagger-item" style={{ animationDelay: `${i * 40}ms` }}>
                    <td data-label="Joueur">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Avatar src={t.joueur?.photo_url} name={t.joueur?.nom_complet ?? ''} size={36} />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '14px' }}>{t.joueur?.nom_complet}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            {t.joueur?.poste_label} • N°{t.joueur?.num_maillot}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td data-label={activeTab === 'sortants' ? 'Club acquéreur' : 'Club cédant'}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 500 }}>
                          {activeTab === 'sortants' ? t.club_acquereur?.nom : t.club_cedant?.nom}
                        </span>
                      </div>
                    </td>
                    <td data-label="Montant" style={{ fontSize: '13px', fontWeight: 600 }}>
                      {formatCurrency(t.montant)}
                    </td>
                    <td data-label="Date demande" style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                      {t.date_demande ? new Date(t.date_demande).toLocaleDateString('fr-FR') : '—'}
                    </td>
                    <td data-label="Statut">
                      <ValidationBadge statut={t.statut} />
                    </td>
                    <td data-label="Détails modération" style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                      {t.statut === 'valide' && t.date_validation && (
                        <span>
                          Validé le {new Date(t.date_validation).toLocaleDateString('fr-FR')} {t.valide_par ? `par ${t.valide_par.prenom} ${t.valide_par.nom}` : ''}
                        </span>
                      )}
                      {t.statut === 'rejete' && (
                        <div>
                          <span style={{ color: 'var(--secondary)', fontWeight: 600 }}>Rejeté</span>
                          {t.motif_rejet && (
                            <div style={{ fontSize: '12px', fontStyle: 'italic', marginTop: '2px', color: 'var(--text-muted)', maxWidth: '250px' }}>
                              " {t.motif_rejet} "
                            </div>
                          )}
                        </div>
                      )}
                      {t.statut === 'en_attente' && <span>—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal initier transfert */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Initier une demande de transfert" size="sm">
        {currentClubId > 0 ? (
          <TransferForm
            currentClubId={currentClubId}
            onSuccess={() => setShowAdd(false)}
            onClose={() => setShowAdd(false)}
          />
        ) : (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Impossible de charger le formulaire de transfert (aucun club associé).
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ResponsableTransfertsPage;
