// src/pages/admin/AdminArticlesPage.tsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, X, Eye, Trash2, Newspaper, User, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getArticlesAdmin,
  validerArticleAdmin,
  rejeterArticleAdmin,
  deleteArticleAdmin,
  CATEGORIES_ARTICLES,
} from '../../api/articles.api';
import type { Article } from '../../api/articles.api';
import { Modal, ConfirmDialog } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { SkeletonTable, EmptyState } from '../../components/ui/DataTable';

// Helper pour l'URL de l'image de l'article
const getMediaUrl = (url: string | null | undefined): string | undefined => {
  if (!url) return undefined;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  
  const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
  const baseUrl = apiUrl.endsWith('/api') ? apiUrl.slice(0, -4) : apiUrl;

  if (url.startsWith('/storage')) {
    return `${baseUrl}${url}`;
  }
  return `${baseUrl}/storage/${url}`;
};

// Badge de statut spécifique aux articles
const ArticleStatusBadge: React.FC<{ statut: string }> = ({ statut }) => {
  const map: Record<string, { variant: 'success' | 'danger' | 'warning' | 'info' | 'gray' | 'primary' | 'accent'; label: string }> = {
    brouillon: { variant: 'gray', label: 'Brouillon' },
    soumis:    { variant: 'warning', label: 'Soumis (Modération)' },
    valide:    { variant: 'success', label: 'Validé' },
    rejete:    { variant: 'danger', label: 'Rejeté' },
    publie:    { variant: 'primary', label: 'Publié' },
  };
  const config = map[statut] ?? { variant: 'gray', label: statut };
  return <Badge variant={config.variant} dot>{config.label}</Badge>;
};

// ── Formulaire Rejet Article ───────────────────────────────────
interface RejetFormProps {
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
        <label className="form-label">Motif du rejet de l'article <span className="required">*</span></label>
        <textarea
          rows={4}
          placeholder="Ex: Le contenu nécessite des corrections orthographiques ou le titre n'est pas neutre..."
          value={motif}
          onChange={(e) => setMotif(e.target.value)}
          className="form-input"
          required
        />
        <span className="form-hint">Le journaliste verra ce message dans son espace pour modifier et soumettre de nouveau.</span>
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
const AdminArticlesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeFilter, setActiveFilter] = useState<'tous' | 'soumis' | 'publie' | 'rejete'>('soumis');
  
  // Modals / dialogs states
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [confirmValider, setConfirmValider] = useState<Article | null>(null);
  const [estALaUne, setEstALaUne] = useState(false);
  const [rejetArticle, setRejetArticle] = useState<Article | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Article | null>(null);

  // Charger tous les articles (côté admin)
  const { data, isLoading } = useQuery({
    queryKey: ['articles-admin', activeFilter],
    queryFn: () => getArticlesAdmin(activeFilter === 'tous' ? {} : { statut: activeFilter }),
  });

  const validerMutation = useMutation({
    mutationFn: ({ id, est_a_la_une }: { id: number; est_a_la_une: boolean }) => validerArticleAdmin(id, est_a_la_une),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['articles-admin'] });
      toast.success(res.message ?? 'L\'article a été approuvé et publié en ligne !');
      setConfirmValider(null);
      setSelectedArticle(null);
      setEstALaUne(false); // Reset state
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message ?? 'Erreur lors de la validation');
    },
  });

  const rejeterMutation = useMutation({
    mutationFn: ({ id, motif }: { id: number; motif: string }) => rejeterArticleAdmin(id, motif),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['articles-admin'] });
      toast.success(res.message ?? 'L\'article a été rejeté.');
      setRejetArticle(null);
      setSelectedArticle(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message ?? 'Erreur lors du rejet');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteArticleAdmin(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['articles-admin'] });
      toast.success(res.message ?? 'L\'article a été supprimé.');
      setConfirmDelete(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message ?? 'Erreur lors de la suppression');
    },
  });

  const articles: Article[] = data?.data ?? [];

  const getCategoryLabel = (cat: string) => {
    return CATEGORIES_ARTICLES.find((c) => c.value === cat)?.label ?? cat;
  };

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Modération des Actualités & Articles</h1>
        <p className="page-subtitle">Validation et gestion des contenus rédigés par les journalistes accrédités</p>
      </div>

      {/* Barre de Filtres de Statut */}
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
        {(['soumis', 'publie', 'rejete', 'tous'] as const).map((status) => {
          const labels: Record<string, string> = {
            soumis: '⏳ En attente de modération',
            publie: '✅ Publiés',
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
        ) : articles.length === 0 ? (
          <EmptyState
            title="Aucun article"
            description={
              activeFilter === 'soumis'
                ? 'Aucun article n\'est actuellement en attente de modération.'
                : 'Aucun article trouvé dans cette catégorie.'
            }
            icon={<Newspaper size={28} style={{ color: 'var(--text-light)' }} />}
          />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Auteur</th>
                  <th>Titre</th>
                  <th>Catégorie</th>
                  <th>Date demande</th>
                  <th>Statut</th>
                  <th style={{ textAlign: 'right' }}>Actions / Modération</th>
                </tr>
              </thead>
              <tbody>
                {articles.map((art: Article, i: number) => {
                  return (
                    <tr key={art.id} className="stagger-item" style={{ animationDelay: `${i * 35}ms` }}>
                      <td data-label="Auteur">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <User size={15} style={{ color: 'var(--text-light)' }} />
                          <span style={{ fontWeight: 600, fontSize: '13px' }}>
                            {art.auteur ? `${art.auteur.prenom} ${art.auteur.nom}` : 'Journaliste'}
                          </span>
                        </div>
                      </td>
                      <td data-label="Titre" style={{ maxWidth: '300px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {art.est_a_la_une && (
                            <span title="Cet article est à la une" style={{ color: '#FFB800', cursor: 'help' }}>🌟</span>
                          )}
                          <div
                            style={{ fontWeight: 500, fontSize: '14px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', cursor: 'pointer' }}
                            onClick={() => setSelectedArticle(art)}
                            title="Cliquez pour lire"
                          >
                            {art.titre}
                          </div>
                        </div>
                      </td>
                      <td data-label="Catégorie" style={{ fontSize: '13px' }}>
                        {getCategoryLabel(art.categorie)}
                      </td>
                      <td data-label="Date demande" style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                        {art.created_at ? new Date(art.created_at).toLocaleDateString('fr-FR') : '—'}
                      </td>
                      <td data-label="Statut">
                        <ArticleStatusBadge statut={art.statut} />
                      </td>
                      <td data-label="Actions / Modération">
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', alignItems: 'center' }}>
                          <button
                            className="btn btn-icon btn-ghost btn-sm"
                            title="Consulter l'article"
                            onClick={() => setSelectedArticle(art)}
                          >
                            <Eye size={15} />
                          </button>
                          
                          {art.statut === 'soumis' && (
                            <>
                              <button
                                className="btn btn-ghost btn-sm"
                                style={{ color: '#15803d', display: 'flex', alignItems: 'center', gap: '4px' }}
                                onClick={() => setConfirmValider(art)}
                              >
                                <Check size={14} /> Publier
                              </button>
                              <button
                                className="btn btn-ghost btn-sm"
                                style={{ color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}
                                onClick={() => setRejetArticle(art)}
                              >
                                <X size={14} /> Rejeter
                              </button>
                            </>
                          )}

                          <button
                            className="btn btn-icon btn-ghost btn-sm"
                            title="Supprimer"
                            style={{ color: 'var(--secondary)' }}
                            onClick={() => setConfirmDelete(art)}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Consultation & Modération Directe */}
      <Modal
        isOpen={!!selectedArticle}
        onClose={() => setSelectedArticle(null)}
        title="Détail de l'article soumis"
        size="md"
      >
        {selectedArticle && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                <Badge variant="primary">{getCategoryLabel(selectedArticle.categorie)}</Badge>
                {selectedArticle.est_a_la_une && (
                  <Badge variant="accent">🌟 À la une</Badge>
                )}
                <div style={{ width: '4px', height: '4px', background: 'var(--border)', borderRadius: '50%' }} />
                <ArticleStatusBadge statut={selectedArticle.statut} />
              </div>
              <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text)', lineHeight: 1.25 }}>
                {selectedArticle.titre}
              </h1>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '6px' }}>
                Rédigé par : <strong>{selectedArticle.auteur?.prenom} {selectedArticle.auteur?.nom}</strong> ({selectedArticle.auteur?.email})
              </p>
            </div>

            {selectedArticle.image_principale && (
              <div style={{ width: '100%', maxHeight: '260px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                <img
                  src={getMediaUrl(selectedArticle.image_principale)}
                  alt=""
                  style={{ width: '100%', height: 'auto', maxHeight: '260px', objectFit: 'cover' }}
                />
              </div>
            )}

            <div
              style={{
                fontSize: '14.5px',
                lineHeight: 1.6,
                color: 'var(--text)',
                whiteSpace: 'pre-line',
                maxHeight: '300px',
                overflowY: 'auto',
                padding: '12px',
                background: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid var(--border)',
              }}
            >
              {selectedArticle.contenu}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', borderTop: '1px solid var(--border)', paddingTop: '14px' }}>
              <div>
                {selectedArticle.statut === 'soumis' && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className="btn btn-primary"
                      onClick={() => setConfirmValider(selectedArticle)}
                    >
                      Approuver & Publier
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={() => setRejetArticle(selectedArticle)}
                    >
                      Rejeter
                    </button>
                  </div>
                )}
              </div>
              <button className="btn btn-ghost" onClick={() => setSelectedArticle(null)}>
                Fermer
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Valider */}
      <Modal
        isOpen={!!confirmValider}
        onClose={() => { setConfirmValider(null); setEstALaUne(false); }}
        title="Approuver & Publier l'article"
        size="sm"
      >
        {confirmValider && (
          <form onSubmit={(e) => {
            e.preventDefault();
            validerMutation.mutate({ id: confirmValider.id, est_a_la_une: estALaUne });
          }} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Confirmez-vous la publication de l'article <strong>"{confirmValider.titre}"</strong> ? Il sera visible par le grand public.
            </p>
            
            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px', 
              cursor: 'pointer', 
              fontSize: '13.5px', 
              padding: '10px 14px', 
              background: estALaUne ? 'rgba(255,184,0,0.08)' : '#f8fafc', 
              borderRadius: '10px', 
              border: estALaUne ? '1px solid rgba(255,184,0,0.4)' : '1px solid var(--border)',
              transition: 'all 0.2s ease',
            }}>
              <input
                type="checkbox"
                checked={estALaUne}
                onChange={(e) => setEstALaUne(e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              <div>
                <strong style={{ color: 'var(--text)' }}>Mettre cet article à la une 🌟</strong>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Il s'affichera tout en haut de la page d'actualités.
                </div>
              </div>
            </label>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid var(--border)', paddingTop: '14px' }}>
              <button type="button" className="btn btn-ghost" onClick={() => { setConfirmValider(null); setEstALaUne(false); }} disabled={validerMutation.isPending}>
                Annuler
              </button>
              <button type="submit" className="btn btn-primary" disabled={validerMutation.isPending}>
                {validerMutation.isPending && (
                  <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full inline-block mr-2" />
                )}
                Publier en ligne
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal Rejeter */}
      <Modal
        isOpen={!!rejetArticle}
        onClose={() => setRejetArticle(null)}
        title="Rejeter l'article rédigé"
        size="sm"
      >
        {rejetArticle && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ fontSize: '14px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FileText size={16} />
              <span>Rejet de l'article : "{rejetArticle.titre}"</span>
            </div>
            <RejetForm
              onClose={() => setRejetArticle(null)}
              isPending={rejeterMutation.isPending}
              onSubmit={(motif) => rejeterMutation.mutate({ id: rejetArticle.id, motif })}
            />
          </div>
        )}
      </Modal>

      {/* Confirm Supprimer */}
      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => confirmDelete && deleteMutation.mutate(confirmDelete.id)}
        title="Supprimer définitivement l'article"
        message={`Êtes-vous sûr de vouloir supprimer définitivement l'article "${confirmDelete?.titre}" de la base de données ?`}
        confirmLabel="Supprimer"
        confirmVariant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

export default AdminArticlesPage;
