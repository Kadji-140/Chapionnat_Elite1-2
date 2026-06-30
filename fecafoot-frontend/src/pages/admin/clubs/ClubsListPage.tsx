// src/pages/admin/clubs/ClubsListPage.tsx
// Liste des clubs avec filtres, pagination, stagger animation et modal de création

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Eye, RefreshCw, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getAdminClubs, createClub, type ClubFilters
} from '../../../api/clubs.api';
import { Modal } from '../../../components/ui/Modal';
import { DivisionBadge, StatutBadge } from '../../../components/ui/Badge';
import { SkeletonTable, EmptyState, Pagination, Avatar } from '../../../components/ui/DataTable';
import { useNavigate } from 'react-router-dom';

// ── Formulaire de création de club ────────────────────────────
const CreateClubForm: React.FC<{ onSuccess: () => void; onClose: () => void }> = ({ onSuccess, onClose }) => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    nom: '', ville: '', division: 'elite_one',
    nom_responsable: '', prenom_responsable: '', email_responsable: '',
  });
  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const mutation = useMutation({
    mutationFn: (data: FormData) => createClub(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-clubs'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      toast.success(data.message ?? 'Club créé avec succès !');
      onSuccess();
    },
    onError: (err: any) => {
      const apiErrors = err.response?.data?.errors ?? {};
      setErrors(apiErrors);
      toast.error(err.response?.data?.message ?? 'Erreur lors de la création');
    },
  });

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogo(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (logo) fd.append('logo', logo);
    mutation.mutate(fd);
  };

  const field = (key: string) => ({
    className: `form-input ${errors[key] ? 'error' : ''}`,
    value: (form as any)[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(prev => ({ ...prev, [key]: e.target.value })),
  });

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Section Club */}
      <div style={{ padding: '14px', background: 'var(--bg)', borderRadius: 'var(--border-radius-sm)', marginBottom: '4px' }}>
        <p style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', marginBottom: '12px' }}>
          Informations du club
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div className="form-group">
            <label className="form-label">Nom du club <span className="required">*</span></label>
            <input type="text" placeholder="Ex: Canon Yaoundé" {...field('nom')} required />
            {errors.nom && <span className="form-error">{errors.nom[0]}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">
              Ville <span className="required">*</span>
            </label>
            <select
              {...field('ville')}
              className={`form-select ${errors.ville ? 'error' : ''}`}
              required
            >
              <option value="">Sélectionner une ville</option>
              <option value="Douala">Douala</option>
              <option value="Yaoundé">Yaoundé</option>
              <option value="Garoua">Garoua</option>
              <option value="Bamenda">Bamenda</option>
              <option value="Bafoussam">Bafoussam</option>
              <option value="Maroua">Maroua</option>
              <option value="Ngaoundéré">Ngaoundéré</option>
              <option value="Kousséri">Kousséri</option>
              <option value="Loum">Loum</option>
              <option value="Kumba">Kumba</option>
              <option value="Mbouda">Mbouda</option>
              <option value="Bertoua">Bertoua</option>
              <option value="Edéa">Edéa</option>
              <option value="Ebolowa">Ebolowa</option>
              <option value="Foumban">Foumban</option>
              <option value="Limbé">Limbé</option>
              <option value="Nkongsamba">Nkongsamba</option>
              <option value="Mbalmayo">Mbalmayo</option>
              <option value="Buea">Buea</option>
              <option value="Kribi">Kribi</option>
            </select>
            {errors.ville && <span className="form-error">{errors.ville[0]}</span>}
          </div>          <div className="form-group">
            <label className="form-label">Division <span className="required">*</span></label>
            <select {...field('division')} className={`form-select ${errors.division ? 'error' : ''}`} required>
              <option value="elite_one">Elite One</option>
              <option value="elite_two">Elite Two</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Logo du club</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {logoPreview && (
                <img src={logoPreview} alt="Logo" style={{ width: '40px', height: '40px', objectFit: 'contain', borderRadius: '8px', border: '1px solid var(--border)' }} />
              )}
              <label style={{ flex: 1 }}>
                <div className="upload-zone" style={{ padding: '10px', cursor: 'pointer' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {logo ? logo.name : 'Choisir une image'}
                  </span>
                </div>
                <input type="file" accept="image/*" onChange={handleLogoChange} style={{ display: 'none' }} />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Section Responsable */}
      <div style={{ padding: '14px', background: 'var(--bg)', borderRadius: 'var(--border-radius-sm)' }}>
        <p style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', marginBottom: '4px' }}>
          Responsable du club
        </p>
        <p style={{ fontSize: '12px', color: 'var(--text-light)', marginBottom: '12px' }}>
          Seul l'email est obligatoire. Le responsable complètera son profil lors de sa première connexion.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div className="form-group">
            <label className="form-label">Nom <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optionnel)</span></label>
            <input type="text" placeholder="Nom du responsable" {...field('nom_responsable')} />
          </div>
          <div className="form-group">
            <label className="form-label">Prénom <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optionnel)</span></label>
            <input type="text" placeholder="Prénom du responsable" {...field('prenom_responsable')} />
          </div>
          <div className="form-group" style={{ gridColumn: '1/-1' }}>
            <label className="form-label">Email <span className="required">*</span></label>
            <input type="email" placeholder="responsable@club.cm" {...field('email_responsable')} required />
            {errors.email_responsable && <span className="form-error">{errors.email_responsable[0]}</span>}
            <span className="form-hint">Un email avec les identifiants de connexion sera envoyé automatiquement.</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '4px' }}>
        <button type="button" className="btn btn-ghost" onClick={onClose}>Annuler</button>
        <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
          {mutation.isPending ? (
            <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
          ) : <Plus size={16} />}
          Créer le club
        </button>
      </div>
    </form>
  );
};

// ── Page principale ────────────────────────────────────────────
const ClubsListPage: React.FC = () => {
  const navigate = useNavigate();

  const [filters, setFilters] = useState<ClubFilters>({ page: 1, per_page: 15 });
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  // Requête avec debounce via React Query
  const { data, isLoading } = useQuery({
    queryKey: ['admin-clubs', filters],
    queryFn: () => getAdminClubs(filters),
    placeholderData: (prev) => prev,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters(prev => ({ ...prev, search, page: 1 }));
  };

  const clubs = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="animate-fade-in-up">
      {/* En-tête */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="page-title">Gestion des clubs</h1>
          <p className="page-subtitle">
            {meta?.total ?? 0} club{(meta?.total ?? 0) > 1 ? 's' : ''} enregistré{(meta?.total ?? 0) > 1 ? 's' : ''}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          <Plus size={16} />
          Ajouter un club
        </button>
      </div>

      {/* Filtres */}
      <div className="card" style={{ marginBottom: '20px', padding: '16px 20px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Recherche */}
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px', flex: '1', minWidth: '200px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '36px' }}
                placeholder="Rechercher par nom ou ville…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary btn-sm">Rechercher</button>
          </form>

          {/* Filtre division */}
          <select
            className="form-select"
            style={{ width: 'auto', minWidth: '150px' }}
            value={filters.division ?? ''}
            onChange={(e) => setFilters(prev => ({ ...prev, division: e.target.value || undefined, page: 1 }))}
          >
            <option value="">Toutes divisions</option>
            <option value="elite_one">Elite One</option>
            <option value="elite_two">Elite Two</option>
          </select>

          {/* Filtre statut */}
          <select
            className="form-select"
            style={{ width: 'auto', minWidth: '140px' }}
            value={filters.actif === undefined ? '' : filters.actif ? 'true' : 'false'}
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

          {/* Case à cocher pour les clubs supprimés */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer', color: 'var(--text-light)' }}>
            <input
              type="checkbox"
              checked={!!filters.include_deleted}
              onChange={(e) => setFilters(prev => ({ ...prev, include_deleted: e.target.checked ? true : undefined, page: 1 }))}
              style={{ cursor: 'pointer' }}
            />
            Inclure les clubs supprimés
          </label>

          {/* Bouton reset */}
          {(filters.search || filters.division || filters.actif !== undefined || filters.include_deleted) && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => { setFilters({ page: 1, per_page: 15 }); setSearch(''); }}
            >
              <RefreshCw size={14} />
              Réinitialiser
            </button>
          )}
        </div>
      </div>

      {/* Tableau */}
      <div className="card">
        {isLoading ? (
          <div style={{ padding: '4px' }}>
            <SkeletonTable rows={8} cols={6} />
          </div>
        ) : clubs.length === 0 ? (
          <EmptyState
            title="Aucun club trouvé"
            description="Ajoutez votre premier club pour commencer."
            action={
              <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
                <Plus size={16} /> Ajouter un club
              </button>
            }
            icon={<Building2 size={28} style={{ color: 'var(--text-light)' }} />}
          />
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Club</th>
                    <th>Ville</th>
                    <th>Division</th>
                    <th>Responsable</th>
                    <th>Effectif</th>
                    <th>Statut</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {clubs.map((club, i) => (
                    <tr
                      key={club.id}
                      className="stagger-item"
                      style={{ animationDelay: `${i * 40}ms` }}
                    >
                      <td data-label="Club">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <Avatar
                            src={club.logo_url}
                            name={club.nom}
                            size={36}
                          />
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '14px' }}>{club.nom}</div>
                            {!club.profile_completed && (
                              <span style={{ fontSize: '11px', color: 'var(--accent-dark)' }}>
                                ⚠ Profil incomplet
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td data-label="Ville" style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{club.ville}</td>
                      <td data-label="Division"><DivisionBadge division={club.division} /></td>
                      <td data-label="Responsable">
                        {club.responsable ? (
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: 500 }}>
                              {club.responsable.prenom} {club.responsable.nom}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                              {club.responsable.email}
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-light)', fontSize: '13px' }}>—</span>
                        )}
                      </td>
                      <td data-label="Effectif">
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
                          {club.nb_joueurs_valides ?? 0}
                          <span style={{ color: 'var(--text-light)', fontWeight: 400 }}>
                            /{club.nb_joueurs ?? 0}
                          </span>
                        </span>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>validés</div>
                      </td>
                      <td data-label="Statut">
                        {club.is_deleted ? (
                          <span style={{ fontSize: '11px', color: '#dc2626', fontWeight: 600, background: '#fee2e2', padding: '2px 8px', borderRadius: '12px' }}>
                            Supprimé
                          </span>
                        ) : (
                          <StatutBadge actif={club.est_actif} />
                        )}
                      </td>
                      <td data-label="Actions">
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                          <button
                            className="btn btn-icon btn-ghost btn-sm"
                            onClick={() => navigate(`/admin/clubs/${club.id}`)}
                            title="Voir le détail"
                          >
                            <Eye size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {meta && meta.last_page > 1 && (
              <div style={{ padding: '0 16px 16px' }}>
                <Pagination
                  currentPage={meta.current_page}
                  lastPage={meta.last_page}
                  total={meta.total}
                  perPage={meta.per_page}
                  onPageChange={(page) => setFilters(prev => ({ ...prev, page }))}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal création */}
      <Modal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        title="Créer un nouveau club"
        subtitle="Un email avec les identifiants sera envoyé au responsable."
        size="lg"
      >
        <CreateClubForm
          onSuccess={() => setShowCreate(false)}
          onClose={() => setShowCreate(false)}
        />
      </Modal>
    </div>
  );
};

export default ClubsListPage;
