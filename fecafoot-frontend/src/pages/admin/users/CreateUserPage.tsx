// src/pages/admin/users/CreateUserPage.tsx
// Page de création d'un utilisateur (commissaire, journaliste) — Admin
// Design premium inline (sans Tailwind)

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  User, Mail, Shield, MapPin,
  CheckCircle2, ArrowLeft, Copy, Check,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { createUser } from '../../../api/users.api';

// ── Rôles disponibles pour création directe par l'admin ──────
const ROLES = [
  { value: 'commissaire', label: 'Commissaire de match', icon: '⚖️' },
  { value: 'journaliste', label: 'Journaliste / Médias', icon: '📰' },
];

// ── Formulaire ────────────────────────────────────────────────
interface FormData {
  nom: string;
  prenom: string;
  email: string;
  role: string;
  villes: string;
}

const INIT_FORM: FormData = { nom: '', prenom: '', email: '', role: 'commissaire', villes: '' };

// ── Styles mutualisés ─────────────────────────────────────────
const inputBaseStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--bg)',
  border: '1.5px solid var(--border)',
  borderRadius: '10px',
  padding: '11px 16px',
  fontSize: '14px',
  color: 'var(--text)',
  outline: 'none',
  transition: 'border-color 0.2s, box-shadow 0.2s',
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '13px',
  fontWeight: 600,
  color: 'var(--text)',
  marginBottom: '7px',
};

// ── Composant principal ───────────────────────────────────────
const CreateUserPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [form, setForm] = useState<FormData>(INIT_FORM);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [createdPassword, setCreatedPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const mutation = useMutation({
    mutationFn: createUser,
    onSuccess: (data) => {
      // Le mot de passe temporaire est retourné par l'API une seule fois
      const mdp = data?.data?.mot_de_passe_temporaire ?? data?.mot_de_passe_temporaire ?? null;
      setCreatedPassword(mdp);
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Compte créé ! Les identifiants ont été envoyés par email.');
    },
    onError: (err: any) => {
      const apiErrors = err?.response?.data?.errors ?? {};
      const newErrors: Partial<FormData> = {};
      Object.keys(apiErrors).forEach((k) => {
        newErrors[k as keyof FormData] = apiErrors[k]?.[0];
      });
      setErrors(newErrors);
      const msg = err?.response?.data?.message ?? 'Erreur lors de la création.';
      toast.error(msg);
    },
  });

  const validate = (): boolean => {
    const e: Partial<FormData> = {};
    if (!form.nom.trim())    e.nom    = 'Le nom est obligatoire.';
    if (!form.prenom.trim()) e.prenom = 'Le prénom est obligatoire.';
    if (!form.email.trim())  e.email  = 'L\'email est obligatoire.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Email invalide.';
    if (!form.role)          e.role   = 'Le rôle est obligatoire.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    mutation.mutate({
      nom: form.nom,
      prenom: form.prenom,
      email: form.email,
      role: form.role,
      villes: form.villes || undefined,
    });
  };

  const copyPassword = () => {
    if (!createdPassword) return;
    navigator.clipboard.writeText(createdPassword).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const set = (field: keyof FormData) => (ev: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((f) => ({ ...f, [field]: ev.target.value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const focusStyle = (hasError?: string): React.CSSProperties => ({
    ...inputBaseStyle,
    borderColor: hasError ? 'var(--secondary)' : undefined,
  });

  // ── État succès ─────────────────────────────────────────────
  if (createdPassword) {
    return (
      <div style={{ maxWidth: '520px', margin: '48px auto', padding: '0 24px' }}>
        <div style={{
          background: 'var(--bg-card)',
          borderRadius: '16px',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-card)',
          padding: '40px',
          textAlign: 'center',
          animation: 'fadeInUp 0.4s ease',
        }}>
          {/* Icône succès */}
          <div style={{
            width: '72px', height: '72px',
            borderRadius: '50%',
            background: 'var(--primary-100)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px',
          }}>
            <CheckCircle2 size={36} style={{ color: 'var(--primary)' }} />
          </div>

          <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text)', marginBottom: '8px' }}>
            Compte créé avec succès !
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '28px' }}>
            Un email a été envoyé à <strong style={{ color: 'var(--text)' }}>{form.email}</strong> avec les identifiants de connexion.
          </p>

          {/* Mot de passe affiché une seule fois */}
          <div style={{
            background: 'var(--accent-50)',
            border: '1px solid var(--accent)',
            borderRadius: '12px',
            padding: '16px 20px',
            marginBottom: '28px',
          }}>
            <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-dark)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              ⚠️ Mot de passe temporaire — Affiché une seule fois
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <code style={{
                flex: 1,
                fontSize: '18px', fontWeight: 800, letterSpacing: '2px',
                color: 'var(--primary-dark)',
                background: 'transparent', border: 'none',
                fontFamily: 'monospace',
              }}>
                {createdPassword}
              </code>
              <button
                onClick={copyPassword}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '8px 14px', borderRadius: '8px',
                  background: copied ? 'var(--primary-100)' : 'white',
                  border: `1px solid ${copied ? 'var(--primary-light)' : 'var(--border)'}`,
                  color: copied ? 'var(--primary)' : 'var(--text-muted)',
                  cursor: 'pointer', fontSize: '13px', fontWeight: 600,
                  transition: 'all 0.2s',
                }}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copié !' : 'Copier'}
              </button>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              onClick={() => { setForm(INIT_FORM); setCreatedPassword(null); }}
              style={{
                padding: '10px 20px', borderRadius: '10px',
                border: '1.5px solid var(--border)',
                background: 'transparent',
                color: 'var(--text)', fontSize: '14px', fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Créer un autre compte
            </button>
            <button
              onClick={() => navigate('/admin/users')}
              style={{
                padding: '10px 24px', borderRadius: '10px',
                border: 'none',
                background: 'var(--primary)',
                color: 'white', fontSize: '14px', fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Voir les utilisateurs
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Formulaire ──────────────────────────────────────────────
  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '0 0 48px' }}>

      {/* En-tête page */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '16px',
        marginBottom: '28px',
      }}>
        <button
          onClick={() => navigate('/admin/users')}
          style={{
            width: '38px', height: '38px',
            borderRadius: '10px',
            border: '1.5px solid var(--border)',
            background: 'var(--bg-card)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--text-muted)',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary-light)'}
          onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text)', margin: 0 }}>
            Créer un nouveau compte
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '3px 0 0' }}>
            L'utilisateur recevra ses identifiants par email
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate>

        {/* Carte principale */}
        <div style={{
          background: 'var(--bg-card)',
          borderRadius: '16px',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-card)',
          overflow: 'hidden',
        }}>

          {/* Section — Identité */}
          <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '8px',
                background: 'var(--primary-50)', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <User size={16} style={{ color: 'var(--primary)' }} />
              </div>
              <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>
                Identité
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {/* Prénom */}
              <div>
                <label style={labelStyle}>Prénom</label>
                <input
                  value={form.prenom}
                  onChange={set('prenom')}
                  placeholder="Jean"
                  style={focusStyle(errors.prenom)}
                  onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(27,67,50,0.1)'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = errors.prenom ? 'var(--secondary)' : 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
                />
                {errors.prenom && <p style={{ color: 'var(--secondary)', fontSize: '12px', marginTop: '4px' }}>{errors.prenom}</p>}
              </div>

              {/* Nom */}
              <div>
                <label style={labelStyle}>Nom</label>
                <input
                  value={form.nom}
                  onChange={set('nom')}
                  placeholder="Dupont"
                  style={focusStyle(errors.nom)}
                  onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(27,67,50,0.1)'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = errors.nom ? 'var(--secondary)' : 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
                />
                {errors.nom && <p style={{ color: 'var(--secondary)', fontSize: '12px', marginTop: '4px' }}>{errors.nom}</p>}
              </div>
            </div>
          </div>

          {/* Section — Contact */}
          <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '8px',
                background: 'rgba(200,16,46,0.08)', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Mail size={16} style={{ color: 'var(--secondary)' }} />
              </div>
              <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>
                Contact & Accès
              </span>
            </div>

            {/* Email */}
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Adresse email <span style={{ color: 'var(--secondary)' }}>*</span></label>
              <input
                type="email"
                value={form.email}
                onChange={set('email')}
                placeholder="jean.dupont@fecafoot.cm"
                style={focusStyle(errors.email)}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(27,67,50,0.1)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = errors.email ? 'var(--secondary)' : 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
              />
              {errors.email && <p style={{ color: 'var(--secondary)', fontSize: '12px', marginTop: '4px' }}>{errors.email}</p>}
            </div>
          </div>

          {/* Section — Rôle */}
          <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '8px',
                background: 'rgba(255,184,0,0.12)', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Shield size={16} style={{ color: 'var(--accent-dark)' }} />
              </div>
              <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>
                Rôle dans le système
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {ROLES.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => { setForm((f) => ({ ...f, role: r.value })); setErrors((e) => ({ ...e, role: undefined })); }}
                  style={{
                    padding: '16px',
                    borderRadius: '12px',
                    border: `2px solid ${form.role === r.value ? 'var(--primary)' : 'var(--border)'}`,
                    background: form.role === r.value ? 'var(--primary-50)' : 'var(--bg)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ fontSize: '22px', marginBottom: '6px' }}>{r.icon}</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: form.role === r.value ? 'var(--primary)' : 'var(--text)' }}>
                    {r.label}
                  </div>
                </button>
              ))}
            </div>
            {errors.role && <p style={{ color: 'var(--secondary)', fontSize: '12px', marginTop: '8px' }}>{errors.role}</p>}
          </div>

          {/* Section — Zone (commissaire uniquement) */}
          {form.role === 'commissaire' && (
            <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '8px',
                  background: 'rgba(27,67,50,0.08)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <MapPin size={16} style={{ color: 'var(--primary)' }} />
                </div>
                <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>
                  Zone d'intervention
                </span>
              </div>

              <div>
                <label style={labelStyle}>Villes / Régions couvertes <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optionnel)</span></label>
                <input
                  value={form.villes}
                  onChange={set('villes')}
                  placeholder="Yaoundé, Douala..."
                  style={inputBaseStyle}
                  onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(27,67,50,0.1)'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
                />
              </div>
            </div>
          )}

          {/* Footer avec bouton submit */}
          <div style={{
            padding: '20px 28px',
            display: 'flex', justifyContent: 'flex-end', gap: '12px',
          }}>
            <button
              type="button"
              onClick={() => navigate('/admin/users')}
              style={{
                padding: '11px 22px', borderRadius: '10px',
                border: '1.5px solid var(--border)',
                background: 'transparent',
                color: 'var(--text)', fontSize: '14px', fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              style={{
                padding: '11px 28px', borderRadius: '10px',
                border: 'none',
                background: mutation.isPending ? 'var(--primary-light)' : 'var(--primary)',
                color: 'white', fontSize: '14px', fontWeight: 700,
                cursor: mutation.isPending ? 'not-allowed' : 'pointer',
                opacity: mutation.isPending ? 0.8 : 1,
                display: 'flex', alignItems: 'center', gap: '8px',
                transition: 'all 0.2s',
                boxShadow: '0 4px 16px rgba(27,67,50,0.25)',
              }}
            >
              {mutation.isPending ? (
                <>
                  <svg style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} fill="none" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" strokeDasharray="30" strokeDashoffset="10" />
                  </svg>
                  Création en cours...
                </>
              ) : (
                <>
                  <User size={15} />
                  Créer le compte
                </>
              )}
            </button>
          </div>
        </div>

      </form>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default CreateUserPage;
