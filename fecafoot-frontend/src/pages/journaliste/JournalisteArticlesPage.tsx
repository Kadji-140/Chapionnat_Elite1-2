// src/pages/journaliste/JournalisteArticlesPage.tsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit3, Trash2, Send, Eye, Image as ImageIcon, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getArticlesJournaliste,
  createArticleJournaliste,
  updateArticleJournaliste,
  soumettreArticleJournaliste,
  deleteArticleJournaliste,
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
    publie:    { variant: 'primary', label: 'Publié en ligne' },
  };
  const config = map[statut] ?? { variant: 'gray', label: statut };
  return <Badge variant={config.variant} dot>{config.label}</Badge>;
};

// ── Formulaire d'article ───────────────────────────────────────
interface ArticleFormProps {
  articleToEdit?: Article | null;
  onSuccess: () => void;
  onClose: () => void;
}

const ArticleForm: React.FC<ArticleFormProps> = ({ articleToEdit, onSuccess, onClose }) => {
  const queryClient = useQueryClient();
  const [titre, setTitre] = useState(articleToEdit?.titre ?? '');
  const [categorie, setCategorie] = useState(articleToEdit?.categorie ?? 'actualite');
  const [contenu, setContenu] = useState(articleToEdit?.contenu ?? '');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    articleToEdit?.image_principale ? (getMediaUrl(articleToEdit.image_principale) ?? null) : null
  );
  const [statutDemand, setStatutDemand] = useState<'brouillon' | 'soumis'>('brouillon');
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const mutation = useMutation({
    mutationFn: (formData: FormData) => {
      if (articleToEdit) {
        return updateArticleJournaliste(articleToEdit.id, formData);
      }
      return createArticleJournaliste(formData);
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['journaliste-articles'] });
      toast.success(res.message ?? 'Article enregistré avec succès !');
      onSuccess();
    },
    onError: (err: any) => {
      setErrors(err.response?.data?.errors ?? {});
      toast.error(err.response?.data?.message ?? 'Erreur lors de l\'enregistrement');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('titre', titre);
    formData.append('categorie', categorie);
    formData.append('contenu', contenu);
    formData.append('statut', statutDemand);

    if (imageFile) {
      formData.append('image_principale', imageFile);
    }

    mutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="form-group">
        <label className="form-label">Titre de l'article <span className="required">*</span></label>
        <input
          type="text"
          placeholder="Ex: Signature imminente du nouveau sélectionneur..."
          value={titre}
          onChange={(e) => setTitre(e.target.value)}
          className={`form-input ${errors.titre ? 'error' : ''}`}
          required
        />
        {errors.titre && <span className="form-error">{errors.titre[0]}</span>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }} className="sm-grid-cols-1">
        <div className="form-group">
          <label className="form-label">Catégorie <span className="required">*</span></label>
          <select
            value={categorie}
            onChange={(e) => setCategorie(e.target.value as any)}
            className="form-input"
            required
          >
            {CATEGORIES_ARTICLES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Image principale (Facultative)</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="form-input"
            style={{ padding: '6px 12px' }}
          />
          {errors.image_principale && <span className="form-error">{errors.image_principale[0]}</span>}
        </div>
      </div>

      {imagePreview && (
        <div style={{ width: '100%', height: '140px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)', position: 'relative' }}>
          <img src={imagePreview} alt="Aperçu" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <button
            type="button"
            onClick={() => { setImageFile(null); setImagePreview(null); }}
            style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.6)', border: 'none', color: 'white', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            &times;
          </button>
        </div>
      )}

      <div className="form-group">
        <label className="form-label">Contenu de l'article <span className="required">*</span></label>
        <textarea
          rows={10}
          placeholder="Rédigez le contenu complet de votre article ici..."
          value={contenu}
          onChange={(e) => setContenu(e.target.value)}
          className={`form-input ${errors.contenu ? 'error' : ''}`}
          required
        />
        {errors.contenu && <span className="form-error">{errors.contenu[0]}</span>}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
        <div style={{ display: 'flex', gap: '16px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
            <input
              type="radio"
              name="statutDemand"
              checked={statutDemand === 'brouillon'}
              onChange={() => setStatutDemand('brouillon')}
            />
            Brouillon
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
            <input
              type="radio"
              name="statutDemand"
              checked={statutDemand === 'soumis'}
              onChange={() => setStatutDemand('soumis')}
            />
            Soumettre pour modération
          </label>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={mutation.isPending}>
            Annuler
          </button>
          <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
            {mutation.isPending && (
              <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full inline-block mr-2" />
            )}
            {articleToEdit ? 'Enregistrer les modifications' : 'Créer l\'article'}
          </button>
        </div>
      </div>
    </form>
  );
};

// ── Page principale ───────────────────────────────────────────
const JournalisteArticlesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [articleToEdit, setArticleToEdit] = useState<Article | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [confirmSoumettre, setConfirmSoumettre] = useState<Article | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Article | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['journaliste-articles'],
    queryFn: getArticlesJournaliste,
  });

  const soumettreMutation = useMutation({
    mutationFn: (id: number) => soumettreArticleJournaliste(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['journaliste-articles'] });
      toast.success(res.message ?? 'Article soumis pour modération !');
      setConfirmSoumettre(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message ?? 'Erreur lors de la soumission');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteArticleJournaliste(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['journaliste-articles'] });
      toast.success(res.message ?? 'Article supprimé.');
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
          <h1 className="page-title">Mes Articles & Actualités</h1>
          <p className="page-subtitle">Espace rédaction et suivi des publications</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setArticleToEdit(null); setShowAdd(true); }}>
          <Plus size={16} /> Rédiger un article
        </button>
      </div>

      {/* Tableau / Liste */}
      <div className="card">
        {isLoading ? (
          <div style={{ padding: '4px' }}>
            <SkeletonTable rows={4} cols={6} />
          </div>
        ) : articles.length === 0 ? (
          <EmptyState
            title="Aucun article rédigé"
            description="Commencez à rédiger des articles et soumettez-les à la modération pour les publier sur la page publique."
            action={
              <button className="btn btn-primary" onClick={() => { setArticleToEdit(null); setShowAdd(true); }}>
                <Plus size={16} /> Rédiger un article
              </button>
            }
            icon={<FileText size={28} style={{ color: 'var(--text-light)' }} />}
          />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Aperçu</th>
                  <th>Titre</th>
                  <th>Catégorie</th>
                  <th>Créé le</th>
                  <th>Statut</th>
                  <th style={{ textAlign: 'right' }}>Actions / Détails</th>
                </tr>
              </thead>
              <tbody>
                {articles.map((art: Article, i: number) => {
                  const hasImage = !!art.image_principale;
                  const thumbUrl = getMediaUrl(art.image_principale);
                  const canEdit = !['valide', 'publie'].includes(art.statut);
                  const canDelete = art.statut !== 'publie';

                  return (
                    <tr key={art.id} className="stagger-item" style={{ animationDelay: `${i * 40}ms` }}>
                      <td data-label="Aperçu" style={{ width: '80px' }}>
                        {hasImage && thumbUrl ? (
                          <div style={{ width: '60px', height: '40px', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                            <img src={thumbUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                        ) : (
                          <div style={{ width: '60px', height: '40px', borderRadius: '4px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', border: '1px solid var(--border)' }}>
                            <ImageIcon size={16} />
                          </div>
                        )}
                      </td>
                      <td data-label="Titre" style={{ maxWidth: '280px' }}>
                        <div
                          style={{ fontWeight: 600, fontSize: '14px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', cursor: 'pointer' }}
                          onClick={() => setSelectedArticle(art)}
                          title="Cliquez pour lire l'aperçu"
                        >
                          {art.titre}
                        </div>
                      </td>
                      <td data-label="Catégorie" style={{ fontSize: '13px' }}>
                        {getCategoryLabel(art.categorie)}
                      </td>
                      <td data-label="Créé le" style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                        {art.created_at ? new Date(art.created_at).toLocaleDateString('fr-FR') : '—'}
                      </td>
                      <td data-label="Statut">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'flex-start' }}>
                          <ArticleStatusBadge statut={art.statut} />
                          {art.statut === 'rejete' && art.motif_rejet && (
                            <span style={{ fontSize: '11px', color: 'var(--secondary)', fontStyle: 'italic', maxWidth: '200px' }} title={art.motif_rejet}>
                              Motif : "{art.motif_rejet}"
                            </span>
                          )}
                        </div>
                      </td>
                      <td data-label="Actions / Détails">
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                          <button
                            className="btn btn-icon btn-ghost btn-sm"
                            title="Visualiser l'article"
                            onClick={() => setSelectedArticle(art)}
                          >
                            <Eye size={15} />
                          </button>
                          
                          {canEdit && (
                            <button
                              className="btn btn-icon btn-ghost btn-sm"
                              title="Modifier l'article"
                              onClick={() => { setArticleToEdit(art); setShowAdd(true); }}
                            >
                              <Edit3 size={15} style={{ color: 'var(--primary)' }} />
                            </button>
                          )}

                          {art.statut === 'brouillon' && (
                            <button
                              className="btn btn-icon btn-ghost btn-sm"
                              title="Soumettre pour publication"
                              style={{ color: '#d97706' }}
                              onClick={() => setConfirmSoumettre(art)}
                            >
                              <Send size={15} />
                            </button>
                          )}

                          {canDelete && (
                            <button
                              className="btn btn-icon btn-ghost btn-sm"
                              title="Supprimer"
                              style={{ color: 'var(--secondary)' }}
                              onClick={() => setConfirmDelete(art)}
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
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

      {/* Modal Rédiger / Éditer */}
      <Modal
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
        title={articleToEdit ? 'Modifier l\'article' : 'Rédiger un article'}
        size="md"
      >
        <ArticleForm
          articleToEdit={articleToEdit}
          onSuccess={() => setShowAdd(false)}
          onClose={() => setShowAdd(false)}
        />
      </Modal>

      {/* Modal Visualiser */}
      <Modal
        isOpen={!!selectedArticle}
        onClose={() => setSelectedArticle(null)}
        title="Aperçu de l'article"
        size="md"
      >
        {selectedArticle && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                <Badge variant="primary">{getCategoryLabel(selectedArticle.categorie)}</Badge>
                <div style={{ width: '4px', height: '4px', background: 'var(--border)', borderRadius: '50%' }} />
                <ArticleStatusBadge statut={selectedArticle.statut} />
              </div>
              <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text)', lineHeight: 1.2 }}>
                {selectedArticle.titre}
              </h1>
            </div>

            {selectedArticle.image_principale && (
              <div style={{ width: '100%', maxHeight: '240px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                <img
                  src={getMediaUrl(selectedArticle.image_principale)}
                  alt=""
                  style={{ width: '100%', height: 'auto', maxHeight: '240px', objectFit: 'cover' }}
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

            {selectedArticle.statut === 'rejete' && selectedArticle.motif_rejet && (
              <div style={{ padding: '12px', background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '8px', color: '#991b1b', fontSize: '13px' }}>
                <strong>Motif du rejet (modérateur) :</strong>
                <p style={{ marginTop: '4px', fontStyle: 'italic' }}>"{selectedArticle.motif_rejet}"</p>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button className="btn btn-ghost" onClick={() => setSelectedArticle(null)}>
                Fermer l'aperçu
              </button>
              {selectedArticle.statut === 'brouillon' && (
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setSelectedArticle(null);
                    setConfirmSoumettre(selectedArticle);
                  }}
                >
                  Soumettre l'article
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Confirm Soumettre */}
      <ConfirmDialog
        isOpen={!!confirmSoumettre}
        onClose={() => setConfirmSoumettre(null)}
        onConfirm={() => confirmSoumettre && soumettreMutation.mutate(confirmSoumettre.id)}
        title="Soumettre l'article pour publication"
        message={`Souhaitez-vous soumettre l'article "${confirmSoumettre?.titre}" à la modération ? Un administrateur devra le valider pour le rendre visible au public.`}
        confirmLabel="Soumettre"
        isLoading={soumettreMutation.isPending}
      />

      {/* Confirm Supprimer */}
      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => confirmDelete && deleteMutation.mutate(confirmDelete.id)}
        title="Supprimer l'article"
        message={`Attention, êtes-vous sûr de vouloir supprimer l'article "${confirmDelete?.titre}" ? Cette action est irréversible.`}
        confirmLabel="Supprimer"
        confirmVariant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

export default JournalisteArticlesPage;
