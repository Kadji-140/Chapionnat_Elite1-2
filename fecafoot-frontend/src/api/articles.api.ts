// src/api/articles.api.ts
import api from './axios';

export interface Article {
  id: number;
  auteur_id: number;
  valide_par_id: number | null;
  titre: string;
  contenu: string;
  image_principale: string | null;
  categorie: 'actualite' | 'match' | 'club' | 'joueur' | 'transfert' | 'officiel';
  statut: 'brouillon' | 'soumis' | 'valide' | 'rejete' | 'publie';
  motif_rejet: string | null;
  date_publication: string | null;
  est_a_la_une: boolean;
  created_at: string;
  updated_at: string;

  // Relations loaded via with
  auteur?: { id: number; nom: string; prenom: string; email: string };
  valide_par?: { id: number; nom: string; prenom: string } | null;
}

// Catégories d'articles pour les formulaires / filtres
export const CATEGORIES_ARTICLES = [
  { value: 'actualite', label: 'Actualité Générale' },
  { value: 'match',     label: 'Résultats & Matchs' },
  { value: 'club',      label: 'Infos Clubs' },
  { value: 'joueur',    label: 'Focus Joueurs' },
  { value: 'transfert', label: 'Mercato / Transferts' },
  { value: 'officiel',  label: 'Annonces Officielles' },
];

// ── Public ─────────────────────────────────────────────────────
export const getArticlesPublic = async (filters: { categorie?: string } = {}) => {
  const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== undefined && v !== ''));
  const res = await api.get('/articles', { params });
  return res.data;
};

export const getArticlePublic = async (id: number) => {
  const res = await api.get(`/articles/${id}`);
  return res.data;
};

// ── Journaliste ────────────────────────────────────────────────
export const getArticlesJournaliste = async () => {
  const res = await api.get('/journaliste/articles');
  return res.data;
};

export const getArticleJournaliste = async (id: number) => {
  const res = await api.get(`/journaliste/articles/${id}`);
  return res.data;
};

export const createArticleJournaliste = async (data: FormData) => {
  const res = await api.post('/journaliste/articles', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

export const updateArticleJournaliste = async (id: number, data: FormData) => {
  // En Laravel, pour faire un PUT avec multipart/form-data via POST, on ajoute _method=PUT
  data.append('_method', 'POST'); 
  // Wait, let's keep it POST since our controller update route accepts POST /articles/{id}
  const res = await api.post(`/journaliste/articles/${id}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

export const soumettreArticleJournaliste = async (id: number) => {
  const res = await api.patch(`/journaliste/articles/${id}/soumettre`);
  return res.data;
};

export const deleteArticleJournaliste = async (id: number) => {
  const res = await api.delete(`/journaliste/articles/${id}`);
  return res.data;
};

// ── Admin ──────────────────────────────────────────────────────
export const getArticlesAdmin = async (filters: { statut?: string } = {}) => {
  const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== undefined && v !== ''));
  const res = await api.get('/admin/articles', { params });
  return res.data;
};

export const validerArticleAdmin = async (id: number, est_a_la_une: boolean = false) => {
  const res = await api.patch(`/admin/articles/${id}/valider`, { est_a_la_une });
  return res.data;
};

export const rejeterArticleAdmin = async (id: number, motifRejet: string) => {
  const res = await api.patch(`/admin/articles/${id}/rejeter`, { motif_rejet: motifRejet });
  return res.data;
};

export const deleteArticleAdmin = async (id: number) => {
  const res = await api.delete(`/admin/articles/${id}`);
  return res.data;
};
