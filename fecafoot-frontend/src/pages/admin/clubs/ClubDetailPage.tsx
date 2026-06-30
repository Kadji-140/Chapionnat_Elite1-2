// src/pages/admin/clubs/ClubDetailPage.tsx
// Page détail/édition d'un club avec onglets : Informations / Effectif / Coachs

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, Upload, RefreshCw, Users, ClipboardList, Info, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { getAdminClub, updateClub, resetPasswordResponsable, toggleClub, deleteClub } from '../../../api/clubs.api';
import { DivisionBadge, StatutBadge, ValidationBadge } from '../../../components/ui/Badge';
import { SkeletonTable, Avatar } from '../../../components/ui/DataTable';
import { ConfirmDialog } from '../../../components/ui/Modal';

// ⭐ Liste des villes du Cameroun
const VILLES_CAMEROUN = [
  'Douala', 'Yaoundé', 'Garoua', 'Bafoussam', 'Bamenda', 'Maroua',
  'Ngaoundéré', 'Bertoua', 'Ebolowa', 'Kribi', 'Limbé', 'Buea',
  'Kumba', 'Edéa', 'Nkongsamba', 'Mbalmayo', 'Foumban', 'Dschang'
];

// ⭐ Stades prédéfinis par ville
const STADES_PAR_VILLE: Record<string, string[]> = {
  'Douala': ['Stade de la Réunification', 'Stade de Bepanda', 'Stade Japoma'],
  'Yaoundé': ['Stade Omnisports', 'Stade Ahmadou Ahidjo', 'Stade Annex'],
  'Garoua': ['Stade Roumdé Adjia'],
  'Bafoussam': ['Stade Municipal', 'Stade de Kouekong'],
  'Bamenda': ['Stade de Bamenda'],
  'Limbé': ['Stade de Limbé'],
  'Buea': ['Stade de Buea', 'Stade Molyko'],
};

const ClubDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'info' | 'effectif' | 'coachs'>('info');
  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [confirmResetMdp, setConfirmResetMdp] = useState(false);
  const [confirmToggle, setConfirmToggle] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [formDirty, setFormDirty] = useState(false);
  const [customStade, setCustomStade] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-club', id],
    queryFn: () => getAdminClub(Number(id)),
    enabled: !!id,
  });

  useEffect(() => {
    const club = data?.data;
    if (club) {
      setFormData({
        nom: club.nom ?? '',
        ville: club.ville ?? '',
        division: club.division ?? 'elite_one',
        stade: club.stade ?? '',
        president: club.president ?? '',
        couleurs: club.couleurs ?? '',
        annee_creation: club.annee_creation?.toString() ?? '',
        site_web: club.site_web ?? '',
        telephone: club.telephone ?? '',
        presentation: club.presentation ?? '',
        nom_responsable: club.responsable?.nom ?? '',
        prenom_responsable: club.responsable?.prenom ?? '',
        email_responsable: club.responsable?.email ?? '',
      });

      // Vérifier si le stade est prédéfini
      const stadesDispo = STADES_PAR_VILLE[club.ville] || [];
      const isPredefini = stadesDispo.includes(club.stade ?? '');
      setCustomStade(!isPredefini && !!club.stade);
    }
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: (fd: FormData) => updateClub(Number(id), fd),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin-club', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-clubs'] });
      toast.success(res.message ?? 'Club mis à jour !');
      setFormDirty(false);
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Erreur lors de la mise à jour'),
  });

  const resetMdpMutation = useMutation({
    mutationFn: () => resetPasswordResponsable(Number(id)),
    onSuccess: (res) => { toast.success(res.message); setConfirmResetMdp(false); },
    onError: (err: any) => { toast.error(err.response?.data?.message ?? 'Erreur lors de la réinitialisation'); setConfirmResetMdp(false); },
  });

  const toggleMutation = useMutation({
    mutationFn: () => toggleClub(Number(id)),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin-club', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-clubs'] });
      toast.success(res.message);
      setConfirmToggle(false);
    },
    onError: () => { toast.error('Erreur lors du changement de statut'); setConfirmToggle(false); },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteClub(Number(id)),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin-clubs'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      toast.success(res.message);
      setConfirmDelete(false);
      navigate('/admin/clubs');
    },
    onError: () => { toast.error('Erreur lors de la suppression'); setConfirmDelete(false); },
  });

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogo(file);
    setLogoPreview(URL.createObjectURL(file));
    setFormDirty(true);
  };

  const handleSave = () => {
    const fd = new FormData();
    Object.entries(formData).forEach(([k, v]) => { if (v) fd.append(k, v); });
    if (logo) fd.append('logo', logo);
    updateMutation.mutate(fd);
  };

  const updateField = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setFormDirty(true);
  };

  // ⭐ Gestion du changement de ville (réinitialise le stade)
  const handleVilleChange = (value: string) => {
    updateField('ville', value);
    const stades = STADES_PAR_VILLE[value] || [];
    if (stades.length > 0) {
      updateField('stade', stades[0]);
      setCustomStade(false);
    } else {
      updateField('stade', '');
    }
  };

  const stadesDisponibles = STADES_PAR_VILLE[formData.ville] || [];

  if (isLoading) {
    return (
      <div className="animate-fade-in-up">
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
          <div className="skeleton" style={{ width: '80px', height: '36px', borderRadius: '8px' }} />
          <div className="skeleton" style={{ width: '200px', height: '36px', borderRadius: '8px' }} />
        </div>
        <div className="card" style={{ padding: '24px' }}>
          <SkeletonTable rows={6} cols={2} />
        </div>
      </div>
    );
  }

  const club = data?.data;
  const joueurs = data?.joueurs ?? [];
  const coachs = data?.coachs ?? [];
  const logoUrl = logoPreview ?? club?.logo_url;

  if (!club) {
    return (
      <div className="animate-fade-in" style={{ textAlign: 'center', padding: '60px' }}>
        <p style={{ color: 'var(--text-muted)' }}>Club introuvable.</p>
        <button className="btn btn-ghost" style={{ marginTop: '16px' }} onClick={() => navigate('/admin/clubs')}>
          Retour à la liste
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/admin/clubs')}>
          <ArrowLeft size={16} /> Retour
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
          <Avatar src={logoUrl} name={club.nom} size={44} />
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text)' }}>{club.nom}</h1>
            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              <DivisionBadge division={club.division} />
              {club.is_deleted ? (
                <span style={{ fontSize: '11px', color: '#dc2626', fontWeight: 600, background: '#fee2e2', padding: '2px 8px', borderRadius: '12px', display: 'inline-flex', alignItems: 'center' }}>
                  Supprimé
                </span>
              ) : (
                <StatutBadge actif={club.est_actif} />
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {club.is_deleted ? (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setConfirmToggle(true)}
              disabled={toggleMutation.isPending}
            >
              <RefreshCw size={14} /> Restaurer le club
            </button>
          ) : (
            <>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setConfirmToggle(true)}
                disabled={toggleMutation.isPending}
                style={{ border: '1px solid var(--border)' }}
              >
                {club.est_actif ? <ToggleLeft size={16} style={{ color: 'var(--primary)' }} /> : <ToggleRight size={16} style={{ color: 'var(--text-light)' }} />}
                {club.est_actif ? 'Désactiver' : 'Activer'}
              </button>
              <button
                className="btn btn-danger btn-sm"
                onClick={() => setConfirmDelete(true)}
                disabled={deleteMutation.isPending}
              >
                <Trash2 size={14} /> Supprimer
              </button>
            </>
          )}

          {formDirty && (
            <button
              className="btn btn-primary btn-sm"
              onClick={handleSave}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full inline-block" />
              ) : <Save size={14} />}
              Enregistrer
            </button>
          )}
        </div>
      </div>

      {/* Onglets */}
      <div className="tabs">
        <button className={`tab-btn ${activeTab === 'info' ? 'active' : ''}`} onClick={() => setActiveTab('info')}>
          <Info size={15} /> Informations
        </button>
        <button className={`tab-btn ${activeTab === 'effectif' ? 'active' : ''}`} onClick={() => setActiveTab('effectif')}>
          <ClipboardList size={15} /> Effectif ({joueurs.length})
        </button>
        <button className={`tab-btn ${activeTab === 'coachs' ? 'active' : ''}`} onClick={() => setActiveTab('coachs')}>
          <Users size={15} /> Coachs ({coachs.length})
        </button>
      </div>

      {/* Tab: Informations */}
      {activeTab === 'info' && (
        <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* Logo */}
          <div className="card" style={{ gridColumn: '1/-1', padding: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px' }}>Logo du club</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <Avatar src={logoUrl} name={club.nom} size={80} />
              <label className="btn btn-ghost" style={{ cursor: 'pointer' }}>
                <Upload size={15} /> Changer le logo
                <input type="file" accept="image/*" onChange={handleLogoChange} style={{ display: 'none' }} />
              </label>
            </div>
          </div>

          {/* Infos générales */}
          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px' }}>Informations générales</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Nom */}
              <div className="form-group">
                <label className="form-label">Nom du club <span className="required">*</span></label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.nom ?? ''}
                  onChange={(e) => updateField('nom', e.target.value)}
                />
              </div>

              {/* Ville avec stades prédéfinis */}
              <div className="form-group">
                <label className="form-label">Ville <span className="required">*</span></label>
                <select
                  className="form-select"
                  value={formData.ville ?? ''}
                  onChange={(e) => handleVilleChange(e.target.value)}
                >
                  <option value="">Sélectionner une ville</option>
                  {VILLES_CAMEROUN.map(v => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>

              {/* Stade avec prédéfinition + option personnalisée */}
              <div className="form-group">
                <label className="form-label">Stade domicile</label>
                {stadesDisponibles.length > 0 && !customStade ? (
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <select
                      className="form-select"
                      value={formData.stade ?? ''}
                      onChange={(e) => updateField('stade', e.target.value)}
                      style={{ flex: 1 }}
                    >
                      <option value="">Sélectionner un stade</option>
                      {stadesDisponibles.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => setCustomStade(true)}
                    >
                      Autre stade
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.stade ?? ''}
                      onChange={(e) => updateField('stade', e.target.value)}
                      placeholder="Nom du stade"
                      style={{ flex: 1 }}
                    />
                    {stadesDisponibles.length > 0 && customStade && (
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => {
                          setCustomStade(false);
                          updateField('stade', stadesDisponibles[0]);
                        }}
                      >
                        Choisir un stade
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Autres champs */}
              <div className="form-group">
                <label className="form-label">Président</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.president ?? ''}
                  onChange={(e) => updateField('president', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Couleurs officielles</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.couleurs ?? ''}
                  onChange={(e) => updateField('couleurs', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Année de création</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.annee_creation ?? ''}
                  onChange={(e) => updateField('annee_creation', e.target.value)}
                  placeholder="1958"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Division</label>
                <select
                  className="form-select"
                  value={formData.division ?? 'elite_one'}
                  onChange={(e) => updateField('division', e.target.value)}
                >
                  <option value="elite_one">Elite One</option>
                  <option value="elite_two">Elite Two</option>
                </select>
              </div>
            </div>
          </div>

          {/* Responsable */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700 }}>Responsable du club</h3>
              {club.responsable && club.responsable.premiere_connexion && (
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setConfirmResetMdp(true)}
                >
                  <RefreshCw size={13} /> Réinitialiser MDP
                </button>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Nom</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.nom_responsable ?? ''}
                  onChange={(e) => updateField('nom_responsable', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Prénom</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.prenom_responsable ?? ''}
                  onChange={(e) => updateField('prenom_responsable', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-input"
                  value={formData.email_responsable ?? ''}
                  onChange={(e) => updateField('email_responsable', e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Effectif */}
      {activeTab === 'effectif' && (
        <div className="card animate-fade-in">
          {joueurs.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Aucun joueur enregistré pour ce club.
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>N°</th>
                  <th>Joueur</th>
                  <th>Poste</th>
                  <th>Nationalité</th>
                  <th>Validation</th>
                </tr>
              </thead>
              <tbody>
                {joueurs.map((j: any, i: number) => (
                  <tr key={j.id} className="stagger-item" style={{ animationDelay: `${i * 30}ms` }}>
                    <td style={{ fontWeight: 700, color: 'var(--text-muted)', width: '50px' }}>
                      #{j.num_maillot}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Avatar src={j.photo_url} name={j.nom_complet} size={32} />
                        <span style={{ fontWeight: 600, fontSize: '14px' }}>{j.nom_complet}</span>
                      </div>
                    </td>
                    <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{j.poste_label}</td>
                    <td style={{ fontSize: '13px' }}>{j.nationalite ?? '—'}</td>
                    <td><ValidationBadge statut={j.statut_validation} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Tab: Coachs */}
      {activeTab === 'coachs' && (
        <div className="card animate-fade-in">
          {coachs.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Aucun coach enregistré pour ce club.
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Coach</th>
                  <th>Email</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {coachs.map((c: any, i: number) => (
                  <tr key={c.id} className="stagger-item" style={{ animationDelay: `${i * 40}ms` }}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Avatar src={null} name={`${c.prenom} ${c.nom}`} size={32} />
                        <span style={{ fontWeight: 600 }}>{c.prenom} {c.nom}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{c.email}</td>
                    <td><StatutBadge actif={c.acces_actif} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Confirm reset MDP */}
      <ConfirmDialog
        isOpen={confirmResetMdp}
        onClose={() => setConfirmResetMdp(false)}
        onConfirm={() => resetMdpMutation.mutate()}
        title="Réinitialiser le mot de passe"
        message={`Un nouveau mot de passe temporaire sera généré et envoyé par email à ${club.responsable?.email}. Le responsable devra le changer à sa prochaine connexion.`}
        confirmLabel="Réinitialiser"
        confirmVariant="primary"
        isLoading={resetMdpMutation.isPending}
      />

      {/* Confirm toggle */}
      <ConfirmDialog
        isOpen={confirmToggle}
        onClose={() => setConfirmToggle(false)}
        onConfirm={() => toggleMutation.mutate()}
        title={club.is_deleted ? 'Restaurer le club' : (club.est_actif ? 'Désactiver le club' : 'Activer le club')}
        message={club.is_deleted 
          ? `Êtes-vous sûr de vouloir restaurer le club "${club.nom}" ?`
          : `Êtes-vous sûr de vouloir ${club.est_actif ? 'désactiver' : 'activer'} le club "${club.nom}" ?`
        }
        confirmLabel={club.is_deleted ? 'Restaurer' : (club.est_actif ? 'Désactiver' : 'Activer')}
        confirmVariant={club.is_deleted ? 'primary' : (club.est_actif ? 'danger' : 'primary')}
        isLoading={toggleMutation.isPending}
      />

      {/* Confirm delete */}
      <ConfirmDialog
        isOpen={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => deleteMutation.mutate()}
        title="Supprimer le club"
        message={`Êtes-vous sûr de vouloir supprimer le club "${club.nom}" ? Cette action effectuera un soft delete.`}
        confirmLabel="Supprimer"
        confirmVariant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

export default ClubDetailPage;