// src/pages/admin/joueurs/JoueursValidationPage.tsx
// Validation des licences joueurs — accordéon par club, valider/rejeter avec motif

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2, XCircle, ChevronDown, ChevronUp,
  ClipboardCheck, AlertCircle, RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getJoueursEnAttente, validerJoueur, rejeterJoueur, type Joueur
} from '../../../api/joueurs.api';
import { Modal } from '../../../components/ui/Modal';
import { ValidationBadge } from '../../../components/ui/Badge';
import { Avatar } from '../../../components/ui/DataTable';

// ── Modal motif de rejet ──────────────────────────────────────
const RejetModal: React.FC<{
  joueur: Joueur | null;
  onConfirm: (motif: string) => void;
  onClose: () => void;
  isLoading: boolean;
}> = ({ joueur, onConfirm, onClose, isLoading }) => {
  const [motif, setMotif] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (motif.trim().length < 10) {
      setError('Le motif doit comporter au moins 10 caractères.');
      return;
    }
    onConfirm(motif);
  };

  return (
    <Modal
      isOpen={!!joueur} onClose={onClose}
      title="Rejeter la licence"
      subtitle={joueur ? `Joueur : ${joueur.nom_complet}` : ''}
      size="sm"
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose} disabled={isLoading}>Annuler</button>
          <button className="btn btn-danger" onClick={handleSubmit} disabled={isLoading || motif.length < 10}>
            {isLoading && <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full inline-block" />}
            <XCircle size={15} /> Confirmer le rejet
          </button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div className="form-group">
          <label className="form-label">Motif de rejet <span className="required">*</span></label>
          <textarea
            className={`form-textarea${error ? ' error' : ''}`}
            placeholder="Expliquez pourquoi cette licence est rejetée (document manquant, âge invalide, doublons…)"
            value={motif}
            onChange={(e) => { setMotif(e.target.value); setError(''); }}
            rows={4}
            minLength={10}
            maxLength={500}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            {error ? <span className="form-error">{error}</span> : <span />}
            <span style={{ fontSize: '12px', color: motif.length < 10 ? 'var(--secondary)' : 'var(--text-muted)' }}>
              {motif.length}/500
            </span>
          </div>
        </div>
      </div>
    </Modal>
  );
};

// ── Accordéon d'un club ───────────────────────────────────────
interface ClubAccordionProps {
  clubGroup: {
    club: { id: number; nom: string; logo_url: string | null; division: string };
    nb_en_attente: number;
    joueurs: Joueur[];
  };
  onValider: (joueur: Joueur) => void;
  onRejeter: (joueur: Joueur) => void;
  loadingId: number | null;
}

const ClubAccordion: React.FC<ClubAccordionProps> = ({
  clubGroup, onValider, onRejeter, loadingId
}) => {
  const [open, setOpen] = useState(true);
  const { club, nb_en_attente, joueurs } = clubGroup;
  const navigate = useNavigate();

  return (
    <div
      className="card animate-fade-in-up"
      style={{ marginBottom: '12px', overflow: 'hidden' }}
    >
      {/* Header accordéon */}
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%', background: 'none', border: 'none', cursor: 'pointer',
          padding: '16px 20px',
          display: 'flex', alignItems: 'center', gap: '14px',
          borderBottom: open ? '1px solid var(--border)' : 'none',
          transition: 'all 0.2s',
        }}
      >
        <Avatar src={club.logo_url} name={club.nom} size={40} />
        <div style={{ flex: 1, textAlign: 'left' }}>
          <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text)' }}>{club.nom}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            {club.division === 'elite_one' ? 'Elite One' : 'Elite Two'}
          </div>
        </div>
        <div style={{
          background: 'rgba(200,16,46,0.1)',
          color: 'var(--secondary)',
          padding: '4px 12px', borderRadius: '999px',
          fontSize: '13px', fontWeight: 700,
        }}>
          {nb_en_attente} en attente
        </div>
        {open ? <ChevronUp size={18} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={18} style={{ color: 'var(--text-muted)' }} />}
      </button>

      {/* Liste joueurs */}
      {open && (
        <div>
          {joueurs.map((joueur, i) => (
            <div
              key={joueur.id}
              className="stagger-item"
              style={{
                display: 'flex', alignItems: 'center', gap: '14px',
                padding: '14px 20px',
                borderBottom: i < joueurs.length - 1 ? '1px solid var(--border)' : 'none',
                animationDelay: `${i * 50}ms`,
              }}
            >
              {/* Photo & infos */}
              <div 
                onClick={() => navigate('/admin/joueurs/' + joueur.id)}
                style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, cursor: 'pointer' }}
              >
                <Avatar src={joueur.photo_url} name={joueur.nom_complet} size={44} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '14px' }}>
                    <span 
                      style={{ color: 'var(--primary)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.textDecoration = 'underline'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.textDecoration = 'none'; }}
                    >
                      {joueur.nom_complet}
                    </span>
                    <span style={{
                      marginLeft: '8px',
                      fontSize: '12px', fontWeight: 700,
                      color: 'var(--text-muted)',
                      background: 'var(--bg)',
                      padding: '1px 6px', borderRadius: '4px',
                      border: '1px solid var(--border)',
                    }}>
                      #{joueur.num_maillot}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', gap: '10px', marginTop: '2px', flexWrap: 'wrap' }}>
                    <span>🦵 {joueur.poste_label}</span>
                    <span>📅 {joueur.age ? `${joueur.age} ans` : joueur.date_naissance}</span>
                    {joueur.nationalite && <span>🌍 {joueur.nationalite}</span>}
                    <span>🪪 {joueur.num_licence}</span>
                  </div>
                </div>
              </div>

              {/* Statut actuel */}
              <ValidationBadge statut={joueur.statut_validation} />

              {/* Actions */}
              <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                <button
                  className="btn btn-sm"
                  style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0' }}
                  onClick={() => onValider(joueur)}
                  disabled={loadingId === joueur.id || joueur.statut_validation === 'valide'}
                  title="Valider la licence"
                >
                  {loadingId === joueur.id ? (
                    <span className="animate-spin w-4 h-4 border-2 border-green-700 border-t-transparent rounded-full inline-block" />
                  ) : (
                    <CheckCircle2 size={15} />
                  )}
                  Valider
                </button>
                <button
                  className="btn btn-sm"
                  style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca' }}
                  onClick={() => onRejeter(joueur)}
                  disabled={loadingId === joueur.id}
                  title="Rejeter la licence"
                >
                  <XCircle size={15} /> Rejeter
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Page principale ───────────────────────────────────────────
const JoueursValidationPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [rejetTarget, setRejetTarget] = useState<Joueur | null>(null);
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-joueurs-en-attente'],
    queryFn: getJoueursEnAttente,
  });

  const validerMutation = useMutation({
    mutationFn: (id: number) => validerJoueur(id),
    onMutate: (id) => setLoadingId(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin-joueurs-en-attente'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      toast.success(res.message ?? 'Joueur validé !');
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Erreur'),
    onSettled: () => setLoadingId(null),
  });

  const rejeterMutation = useMutation({
    mutationFn: ({ id, motif }: { id: number; motif: string }) => rejeterJoueur(id, motif),
    onMutate: ({ id }) => setLoadingId(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin-joueurs-en-attente'] });
      toast.success(res.message ?? 'Joueur rejeté.');
      setRejetTarget(null);
    },
    onError: () => { toast.error('Erreur lors du rejet'); setRejetTarget(null); },
    onSettled: () => setLoadingId(null),
  });

  const clubGroups = data?.data ?? [];
  const totalEnAttente = data?.total_attente ?? 0;

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div
        className="page-header"
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}
      >
        <div>
          <h1 className="page-title">Validation des licences</h1>
          <p className="page-subtitle">
            {isLoading ? '…' : totalEnAttente} joueur{totalEnAttente > 1 ? 's' : ''} en attente de validation
          </p>
        </div>
        <button className="btn btn-ghost" onClick={() => refetch()}>
          <RefreshCw size={15} /> Actualiser
        </button>
      </div>

      {/* Alert résumé */}
      {!isLoading && totalEnAttente > 0 && (
        <div
          className="animate-fade-in"
          style={{
            background: 'rgba(255,184,0,0.06)', border: '1px solid rgba(255,184,0,0.3)',
            borderRadius: 'var(--border-radius)', padding: '14px 18px',
            display: 'flex', alignItems: 'center', gap: '10px',
            marginBottom: '20px',
          }}
        >
          <AlertCircle size={18} style={{ color: 'var(--accent-dark)', flexShrink: 0 }} />
          <p style={{ fontSize: '14px', color: 'var(--text)', flex: 1 }}>
            <strong>{totalEnAttente} joueur{totalEnAttente > 1 ? 's' : ''}</strong> soumis par {clubGroups.length} club{clubGroups.length > 1 ? 's' : ''} attendent votre validation.
          </p>
        </div>
      )}

      {/* Contenu */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="card" style={{ padding: '20px', height: '80px' }}>
              <div className="skeleton" style={{ width: '100%', height: '100%' }} />
            </div>
          ))}
        </div>
      ) : clubGroups.length === 0 ? (
        <div className="card">
          <div style={{ textAlign: 'center', padding: '60px 24px' }}>
            <div style={{
              width: '64px', height: '64px', background: '#f0fdf4',
              borderRadius: '50%', display: 'flex', alignItems: 'center',
              justifyContent: 'center', margin: '0 auto 16px',
            }}>
              <ClipboardCheck size={28} style={{ color: '#15803d' }} />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>
              Tout est à jour !
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', maxWidth: '300px', margin: '0 auto' }}>
              Aucune licence en attente de validation. Tous les joueurs soumis ont été traités.
            </p>
          </div>
        </div>
      ) : (
        <div>
          {clubGroups.map((group: any) => (
            <ClubAccordion
              key={group.club.id}
              clubGroup={group}
              onValider={(joueur) => validerMutation.mutate(joueur.id)}
              onRejeter={(joueur) => setRejetTarget(joueur)}
              loadingId={loadingId}
            />
          ))}
        </div>
      )}

      {/* Modal rejet */}
      <RejetModal
        joueur={rejetTarget}
        onConfirm={(motif) => rejetTarget && rejeterMutation.mutate({ id: rejetTarget.id, motif })}
        onClose={() => setRejetTarget(null)}
        isLoading={rejeterMutation.isPending}
      />
    </div>
  );
};

export default JoueursValidationPage;
