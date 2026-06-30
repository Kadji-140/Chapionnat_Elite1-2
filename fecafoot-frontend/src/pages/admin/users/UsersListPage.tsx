// src/pages/admin/users/UsersListPage.tsx
// Liste des utilisateurs avec filtres, toggle, reset MDP et création inline

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Search, Users, ToggleLeft, ToggleRight,
  KeyRound, Eye, EyeOff, Copy, Check
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getAdminUsers, createUser, toggleUser,
  resetUserPassword, type UserFilters
} from '../../../api/users.api';
import { Modal, ConfirmDialog } from '../../../components/ui/Modal';
import { RoleBadge, StatutBadge } from '../../../components/ui/Badge';
import { SkeletonTable, EmptyState, Pagination, Avatar } from '../../../components/ui/DataTable';

// ── Formulaire création utilisateur ──────────────────────────
const CreateUserForm: React.FC<{
  onSuccess: (mdp: string) => void;
  onClose: () => void;
}> = ({ onSuccess, onClose }) => {
  const [form, setForm] = useState({ nom: '', prenom: '', email: '', role: 'commissaire', villes: '' });
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const mutation = useMutation({
    mutationFn: () => createUser(form),
    onSuccess: (data) => {
      toast.success('Compte créé avec succès !');
      onSuccess(data.mot_de_passe_tmp ?? '');
    },
    onError: (err: any) => {
      setErrors(err.response?.data?.errors ?? {});
      toast.error(err.response?.data?.message ?? 'Erreur lors de la création');
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
        <input type="email" placeholder="email@example.cm" required {...f('email')} />
        {errors.email && <span className="form-error">{errors.email[0]}</span>}
      </div>

      <div className="form-group">
        <label className="form-label">Rôle <span className="required">*</span></label>
        <select className="form-select" value={form.role}
          onChange={(e) => setForm(p => ({ ...p, role: e.target.value }))}>
          <option value="commissaire">Commissaire de match</option>
          <option value="journaliste">Journaliste accrédité</option>
        </select>
      </div>

      {form.role === 'commissaire' && (
        <div className="form-group">
          <label className="form-label">Zones d'intervention</label>
          <input type="text" placeholder="Ex: Yaoundé, Douala" {...f('villes')} />
          <span className="form-hint">Villes ou régions où le commissaire peut officier.</span>
        </div>
      )}

      <div
        style={{
          background: 'rgba(27,67,50,0.05)',
          border: '1px solid rgba(27,67,50,0.1)',
          borderRadius: 'var(--border-radius-sm)',
          padding: '12px',
          fontSize: '13px',
          color: 'var(--text-muted)',
        }}
      >
        ℹ️ Un mot de passe temporaire sera généré et envoyé par email. Il vous sera affiché une seule fois.
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
        <button type="button" className="btn btn-ghost" onClick={onClose}>Annuler</button>
        <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
          {mutation.isPending && (
            <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full inline-block" />
          )}
          <Plus size={15} /> Créer le compte
        </button>
      </div>
    </form>
  );
};

// ── Affichage mot de passe généré (une seule fois) ─────────────
const PasswordRevealBox: React.FC<{ password: string; onClose: () => void }> = ({ password, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [visible, setVisible] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div
        style={{
          background: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: 'var(--border-radius-sm)',
          padding: '16px',
          textAlign: 'center',
        }}
      >
        <p style={{ fontSize: '13px', color: '#166534', marginBottom: '10px' }}>
          ✅ Compte créé avec succès ! Voici le mot de passe temporaire :
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
          <code style={{
            fontSize: '18px',
            fontWeight: 700,
            letterSpacing: '2px',
            color: 'var(--primary)',
            fontFamily: 'monospace',
            filter: visible ? 'none' : 'blur(5px)',
            userSelect: visible ? 'text' : 'none',
          }}>
            {password}
          </code>
          <button className="btn btn-icon btn-ghost btn-sm" onClick={() => setVisible(v => !v)}>
            {visible ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
          <button className="btn btn-icon btn-ghost btn-sm" onClick={copy}>
            {copied ? <Check size={16} style={{ color: '#16a34a' }} /> : <Copy size={16} />}
          </button>
        </div>
      </div>
      <div
        style={{
          background: '#fffbeb',
          border: '1px solid #fde68a',
          borderRadius: 'var(--border-radius-sm)',
          padding: '12px',
          fontSize: '13px',
          color: '#92400e',
        }}
      >
        ⚠️ Ce mot de passe ne sera <strong>plus affiché</strong>. Un email a été envoyé à l'utilisateur.
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn btn-primary" onClick={onClose}>Terminé</button>
      </div>
    </div>
  );
};

// ── Page principale ───────────────────────────────────────────
const UsersListPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<UserFilters>({ page: 1, per_page: 15 });
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [generatedPwd, setGeneratedPwd] = useState<string | null>(null);
  const [confirmToggle, setConfirmToggle] = useState<{ id: number; nom: string; actif: boolean } | null>(null);
  const [confirmReset, setConfirmReset] = useState<{ id: number; email: string } | null>(null);
  const [resetPwd, setResetPwd] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', filters],
    queryFn: () => getAdminUsers(filters),
    placeholderData: (prev) => prev,
  });

  const toggleMutation = useMutation({
    mutationFn: (id: number) => toggleUser(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success(res.message ?? 'Statut mis à jour');
      setConfirmToggle(null);
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Erreur'),
  });

  const resetMutation = useMutation({
    mutationFn: (id: number) => resetUserPassword(id),
    onSuccess: (res) => {
      toast.success(res.message);
      setConfirmReset(null);
      setResetPwd(res.mot_de_passe_tmp ?? null);
    },
    onError: () => toast.error('Erreur lors de la réinitialisation'),
  });

  // Live search debouncing
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      setFilters(prev => {
        const queryVal = search.trim() || undefined;
        if (prev.search === queryVal) return prev;
        return { ...prev, search: queryVal, page: 1 };
      });
    }, 350);

    return () => clearTimeout(delayDebounce);
  }, [search]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters(prev => ({ ...prev, search: search.trim() || undefined, page: 1 }));
  };

  const users = data?.data ?? [];
  const meta  = data?.meta;

  const ROLES = [
    { value: '', label: 'Tous les rôles' },
    { value: 'responsable_club', label: 'Responsable' },
    { value: 'coach',            label: 'Coach' },
    { value: 'commissaire',      label: 'Commissaire' },
    { value: 'journaliste',      label: 'Journaliste' },
  ];

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div
        className="page-header"
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}
      >
        <div>
          <h1 className="page-title">Gestion des utilisateurs</h1>
          <p className="page-subtitle">{meta?.total ?? 0} utilisateur{(meta?.total ?? 0) > 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          <Plus size={16} /> Créer un compte
        </button>
      </div>

      {/* Filtres */}
      <div className="card" style={{ marginBottom: '20px', padding: '16px 20px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px', flex: 1, minWidth: '200px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
              <input
                type="text" className="form-input" style={{ paddingLeft: '36px' }}
                placeholder="Rechercher par nom ou email…"
                value={search} onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary btn-sm">Rechercher</button>
          </form>

          {ROLES.map(r => (
            <button
              key={r.value}
              className={`btn btn-sm ${filters.role === r.value || (!filters.role && !r.value) ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setFilters(prev => ({ ...prev, role: r.value || undefined, page: 1 }))}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tableau */}
      <div className="card">
        {isLoading ? (
          <div style={{ padding: '4px' }}>
            <SkeletonTable rows={8} cols={5} />
          </div>
        ) : users.length === 0 ? (
          <EmptyState
            title="Aucun utilisateur trouvé"
            description="Créez votre premier compte utilisateur."
            action={<button className="btn btn-primary" onClick={() => setShowCreate(true)}><Plus size={16} />Créer un compte</button>}
            icon={<Users size={28} style={{ color: 'var(--text-light)' }} />}
          />
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Utilisateur</th>
                    <th>Rôle</th>
                    <th>Club / Zone</th>
                    <th>Statut</th>
                    <th>Créé le</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user: any, i: number) => (
                    <tr key={user.id} className="stagger-item" style={{ animationDelay: `${i * 40}ms` }}>
                      <td data-label="Utilisateur">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <Avatar src={null} name={`${user.prenom} ${user.nom}`} size={36} />
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '14px' }}>{user.prenom} {user.nom}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td data-label="Rôle"><RoleBadge role={user.role} /></td>
                      <td data-label="Club / Zone" style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                        {user.club?.nom ?? user.villes ?? '—'}
                      </td>
                      <td data-label="Statut">
                        <StatutBadge actif={user.acces_actif} />
                        {user.premiere_connexion && (
                          <div style={{ fontSize: '11px', color: 'var(--accent-dark)', marginTop: '2px' }}>
                            ⚠ Première connexion non faite
                          </div>
                        )}
                      </td>
                      <td data-label="Créé le" style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                        {user.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR') : '—'}
                      </td>
                      <td data-label="Actions">
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                          <button
                            className="btn btn-icon btn-ghost btn-sm"
                            title={user.acces_actif ? 'Désactiver' : 'Activer'}
                            onClick={() => setConfirmToggle({ id: user.id, nom: `${user.prenom} ${user.nom}`, actif: user.acces_actif })}
                          >
                            {user.acces_actif
                              ? <ToggleRight size={16} style={{ color: 'var(--primary)' }} />
                              : <ToggleLeft size={16} style={{ color: 'var(--text-light)' }} />
                            }
                          </button>
                          {user.premiere_connexion && (
                            <button
                              className="btn btn-icon btn-ghost btn-sm"
                              title="Réinitialiser le mot de passe"
                              onClick={() => setConfirmReset({ id: user.id, email: user.email })}
                            >
                              <KeyRound size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

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
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)}
        title="Créer un compte utilisateur" subtitle="Commissaire ou Journaliste accrédité" size="md">
        <CreateUserForm
          onSuccess={(mdp) => { setShowCreate(false); setGeneratedPwd(mdp); }}
          onClose={() => setShowCreate(false)}
        />
      </Modal>

      {/* Affichage MDP généré */}
      <Modal isOpen={!!generatedPwd} onClose={() => { setGeneratedPwd(null); queryClient.invalidateQueries({ queryKey: ['admin-users'] }); }}
        title="Mot de passe généré" preventClose size="sm">
        {generatedPwd && (
          <PasswordRevealBox
            password={generatedPwd}
            onClose={() => { setGeneratedPwd(null); queryClient.invalidateQueries({ queryKey: ['admin-users'] }); }}
          />
        )}
      </Modal>

      {/* Affichage MDP reset */}
      <Modal isOpen={!!resetPwd} onClose={() => setResetPwd(null)} title="Nouveau mot de passe" preventClose size="sm">
        {resetPwd && <PasswordRevealBox password={resetPwd} onClose={() => setResetPwd(null)} />}
      </Modal>

      {/* Confirm toggle */}
      <ConfirmDialog
        isOpen={!!confirmToggle}
        onClose={() => setConfirmToggle(null)}
        onConfirm={() => confirmToggle && toggleMutation.mutate(confirmToggle.id)}
        title={confirmToggle?.actif ? 'Désactiver le compte' : 'Activer le compte'}
        message={`Êtes-vous sûr de vouloir ${confirmToggle?.actif ? 'désactiver' : 'activer'} le compte de "${confirmToggle?.nom}" ?`}
        confirmLabel={confirmToggle?.actif ? 'Désactiver' : 'Activer'}
        confirmVariant={confirmToggle?.actif ? 'danger' : 'primary'}
        isLoading={toggleMutation.isPending}
      />

      {/* Confirm reset MDP */}
      <ConfirmDialog
        isOpen={!!confirmReset}
        onClose={() => setConfirmReset(null)}
        onConfirm={() => confirmReset && resetMutation.mutate(confirmReset.id)}
        title="Réinitialiser le mot de passe"
        message={`Un nouveau mot de passe temporaire sera envoyé à ${confirmReset?.email}. L'utilisateur devra se reconnecter.`}
        confirmLabel="Réinitialiser"
        confirmVariant="primary"
        isLoading={resetMutation.isPending}
      />
    </div>
  );
};

export default UsersListPage;
