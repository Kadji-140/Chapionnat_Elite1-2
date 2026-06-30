// src/pages/admin/AdminProfilePage.tsx
// Page paramètres compte — layout horizontal pleine largeur, thème FECAFOOT vert/rouge/or

import React, { useState } from 'react';
import {
  User, Mail, Lock, ShieldCheck, Eye, EyeOff, Save,
  CheckCircle, AlertCircle, Key, Crown, LogIn,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import api from '../../api/axios';
import toast from 'react-hot-toast';

// ─── Constantes thème ────────────────────────────────────────────
const C = {
  green:  '#1B4332',
  greenL: '#2D6A4F',
  greenD: '#0D2E24',
  red:    '#C8102E',
  gold:   '#FFB800',
};

// ─── Avatar initiales ────────────────────────────────────────────
const Avatar: React.FC<{ nom?: string; prenom?: string; size?: number }> = ({ nom, prenom, size = 72 }) => {
  const initials = `${(prenom?.[0] ?? '').toUpperCase()}${(nom?.[0] ?? '').toUpperCase()}`;
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: `linear-gradient(135deg, ${C.green} 0%, ${C.greenL} 100%)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'white', fontSize: size * 0.32, fontWeight: 900, letterSpacing: '-1px',
      boxShadow: `0 6px 20px rgba(27,67,50,0.35)`,
      border: `3px solid rgba(255,184,0,0.4)`,
    }}>
      {initials || <User size={size * 0.45} />}
    </div>
  );
};

// ─── Champ texte ─────────────────────────────────────────────────
interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  icon?: React.FC<{ size?: number; style?: React.CSSProperties }>;
  placeholder?: string;
  required?: boolean;
}
const Field: React.FC<FieldProps> = ({ label, value, onChange, type = 'text', icon: Icon, placeholder, required }) => {
  const [show, setShow] = useState(false);
  const isPwd = type === 'password';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      <label style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
        {label}{required && <span style={{ color: C.red, marginLeft: '3px' }}>*</span>}
      </label>
      <div style={{ position: 'relative' }}>
        {Icon && (
          <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }}>
            <Icon size={14} />
          </div>
        )}
        <input
          type={isPwd ? (show ? 'text' : 'password') : type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          style={{
            width: '100%', padding: `10px ${isPwd ? '40px' : '14px'} 10px ${Icon ? '38px' : '14px'}`,
            border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '13px',
            color: '#1e293b', background: 'white', outline: 'none',
            transition: 'border-color 0.2s',
            fontFamily: 'inherit',
          }}
          onFocus={e => (e.target.style.borderColor = C.green)}
          onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
        />
        {isPwd && (
          <button type="button" onClick={() => setShow(p => !p)} style={{
            position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#94a3b8',
          }}>
            {show ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        )}
      </div>
    </div>
  );
};

// ─── Composant principal ─────────────────────────────────────────
const AdminProfilePage: React.FC = () => {
  const { user, setUser } = useAuthStore();

  const [nom, setNom] = useState(user?.nom ?? '');
  const [prenom, setPrenom] = useState(user?.prenom ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [savingInfo, setSavingInfo] = useState(false);

  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [savingPwd, setSavingPwd] = useState(false);

  const pwdRules = [
    { label: '8 caractères minimum', ok: newPwd.length >= 8 },
    { label: 'Une majuscule', ok: /[A-Z]/.test(newPwd) },
    { label: 'Un chiffre', ok: /\d/.test(newPwd) },
  ];
  const pwdStrength = pwdRules.filter(r => r.ok).length;

  const ROLE_LABELS: Record<string, string> = {
    admin: 'Administrateur FECAFOOT',
    responsable_club: 'Responsable de Club',
    coach: 'Coach',
    commissaire: 'Commissaire de Match',
    journaliste: 'Journaliste',
  };

  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom || !prenom || !email) { toast.error('Champs obligatoires manquants'); return; }
    setSavingInfo(true);
    try {
      await api.patch('/admin/profile', { nom, prenom, email });
      setUser({ ...user!, nom, prenom, email });
      toast.success('Informations mises à jour ✓');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Erreur de mise à jour');
    } finally { setSavingInfo(false); }
  };

  const handleSavePwd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPwd || !newPwd || !confirmPwd) { toast.error('Remplissez tous les champs'); return; }
    if (newPwd !== confirmPwd) { toast.error('Les mots de passe ne correspondent pas'); return; }
    if (newPwd.length < 8) { toast.error('Minimum 8 caractères'); return; }
    setSavingPwd(true);
    try {
      await api.patch('/admin/profile', { password: newPwd, password_confirmation: confirmPwd });
      toast.success('Mot de passe modifié ✓');
      setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Erreur de modification');
    } finally { setSavingPwd(false); }
  };

  const Spinner = () => (
    <div style={{ width: '14px', height: '14px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.35)', borderTopColor: 'white', animation: 'spin 0.8s linear infinite' }} />
  );

  return (
    <div className="animate-fade-in-up">

      {/* ── Bannière identité (pleine largeur) ─────────────────── */}
      <div style={{
        background: `linear-gradient(135deg, ${C.greenD} 0%, ${C.green} 55%, #16213e 100%)`,
        borderRadius: '20px', padding: '28px 32px', marginBottom: '24px',
        position: 'relative', overflow: 'hidden',
        boxShadow: `0 8px 32px rgba(13,46,36,0.28)`,
      }}>
        {/* Barre tricolore bottom */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px',
          background: `linear-gradient(90deg, ${C.green} 33%, ${C.red} 33% 66%, ${C.gold} 66%)`,
        }} />
        {/* Décoration */}
        <div style={{ position: 'absolute', top: -40, right: -40, width: '180px', height: '180px', borderRadius: '50%', background: 'rgba(255,184,0,0.07)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -30, right: 180, width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(200,16,46,0.08)', pointerEvents: 'none' }} />

        {/* Layout horizontal : avatar | info | stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: '24px', alignItems: 'center', position: 'relative', zIndex: 1 }}>

          {/* Avatar */}
          <div style={{ position: 'relative' }}>
            <Avatar nom={user?.nom} prenom={user?.prenom} size={76} />
            <div style={{
              position: 'absolute', bottom: 2, right: 2,
              width: '18px', height: '18px', borderRadius: '50%',
              background: '#4ade80', border: '2px solid rgba(255,255,255,0.5)',
            }} />
          </div>

          {/* Infos utilisateur */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '22px', fontWeight: 900, color: 'white', lineHeight: 1 }}>
                {user?.prenom} {user?.nom}
              </h1>
              <div style={{
                background: 'rgba(255,184,0,0.18)', border: '1px solid rgba(255,184,0,0.3)',
                borderRadius: '6px', padding: '3px 10px',
                display: 'flex', alignItems: 'center', gap: '5px',
              }}>
                <Crown size={10} style={{ color: C.gold }} />
                <span style={{ fontSize: '11px', fontWeight: 700, color: C.gold }}>
                  {ROLE_LABELS[user?.role ?? ''] ?? user?.role}
                </span>
              </div>
            </div>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginBottom: '8px' }}>{user?.email}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={12} style={{ color: '#4ade80' }} />
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', fontWeight: 600 }}>Compte actif · Accès complet</span>
            </div>
          </div>

          {/* Stats rapides identité */}
          <div style={{ display: 'flex', gap: '16px' }}>
            {[
              { label: 'ID Compte', value: `#${user?.id}` },
              { label: 'Rôle', value: user?.role === 'admin' ? 'Admin' : 'User' },
            ].map(s => (
              <div key={s.label} style={{
                textAlign: 'center',
                background: 'rgba(255,255,255,0.07)', borderRadius: '12px',
                padding: '12px 20px', border: '1px solid rgba(255,255,255,0.1)',
              }}>
                <div style={{ fontSize: '18px', fontWeight: 900, color: C.gold }}>{s.value}</div>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.45)', fontWeight: 600, marginTop: '2px' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Contenu principal : 2 colonnes ──────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

        {/* Colonne gauche — Infos personnelles */}
        <div style={{
          background: 'white', borderRadius: '18px',
          border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(27,67,50,0.06)',
          overflow: 'hidden',
        }}>
          {/* En-tête carte */}
          <div style={{
            padding: '18px 22px',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex', alignItems: 'center', gap: '12px',
            background: 'linear-gradient(135deg, rgba(27,67,50,0.04) 0%, rgba(27,67,50,0.01) 100%)',
          }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: `rgba(27,67,50,0.1)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <User size={17} style={{ color: C.green }} />
            </div>
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>Informations personnelles</h3>
              <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '1px' }}>Modifier vos coordonnées</p>
            </div>
          </div>

          <form onSubmit={handleSaveInfo} style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <Field label="Prénom" value={prenom} onChange={setPrenom} icon={User} placeholder="Votre prénom" required />
              <Field label="Nom" value={nom} onChange={setNom} icon={User} placeholder="Votre nom" required />
            </div>
            <Field label="Adresse e-mail" value={email} onChange={setEmail} type="email" icon={Mail} placeholder="admin@fecafoot.cm" required />

            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '4px' }}>
              <button
                type="submit"
                disabled={savingInfo}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '10px 22px', borderRadius: '10px', border: 'none',
                  background: `linear-gradient(135deg, ${C.green}, ${C.greenL})`,
                  color: 'white', fontWeight: 700, fontSize: '13px',
                  cursor: savingInfo ? 'not-allowed' : 'pointer',
                  opacity: savingInfo ? 0.75 : 1,
                  boxShadow: `0 4px 14px rgba(27,67,50,0.3)`,
                  transition: 'all 0.2s',
                }}
              >
                {savingInfo ? <Spinner /> : <Save size={14} />}
                {savingInfo ? 'Enregistrement…' : 'Sauvegarder'}
              </button>
            </div>
          </form>
        </div>

        {/* Colonne droite — Sécurité */}
        <div style={{
          background: 'white', borderRadius: '18px',
          border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(27,67,50,0.06)',
          overflow: 'hidden',
        }}>
          {/* En-tête carte */}
          <div style={{
            padding: '18px 22px',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex', alignItems: 'center', gap: '12px',
            background: 'linear-gradient(135deg, rgba(200,16,46,0.04) 0%, rgba(200,16,46,0.01) 100%)',
          }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: `rgba(200,16,46,0.08)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Lock size={17} style={{ color: C.red }} />
            </div>
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>Sécurité & Mot de passe</h3>
              <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '1px' }}>Changer votre mot de passe</p>
            </div>
          </div>

          <form onSubmit={handleSavePwd} style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <Field label="Mot de passe actuel" value={currentPwd} onChange={setCurrentPwd} type="password" icon={Key} placeholder="Votre mot de passe actuel" required />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <Field label="Nouveau mot de passe" value={newPwd} onChange={setNewPwd} type="password" icon={Lock} placeholder="Nouveau" required />
              <Field label="Confirmation" value={confirmPwd} onChange={setConfirmPwd} type="password" icon={Lock} placeholder="Répétez" required />
            </div>

            {/* Barre de force */}
            {newPwd.length > 0 && (
              <div>
                <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                  {[0,1,2].map(i => (
                    <div key={i} style={{
                      flex: 1, height: '4px', borderRadius: '999px',
                      background: i < pwdStrength
                        ? i < 1 ? C.red : i < 2 ? C.gold : C.green
                        : '#e2e8f0',
                      transition: 'background 0.3s',
                    }} />
                  ))}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  {pwdRules.map(rule => (
                    <div key={rule.label} style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                      {rule.ok
                        ? <CheckCircle size={12} style={{ color: C.green }} />
                        : <AlertCircle size={12} style={{ color: '#cbd5e1' }} />
                      }
                      <span style={{ fontSize: '11px', color: rule.ok ? C.green : '#94a3b8', fontWeight: rule.ok ? 600 : 400 }}>
                        {rule.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Erreur correspondance */}
            {confirmPwd.length > 0 && newPwd !== confirmPwd && (
              <div style={{
                background: '#fff1f2', borderRadius: '8px', padding: '9px 12px',
                display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #fecdd3',
              }}>
                <AlertCircle size={13} style={{ color: C.red }} />
                <span style={{ fontSize: '11px', color: C.red, fontWeight: 600 }}>Les mots de passe ne correspondent pas</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '2px' }}>
              <button
                type="submit"
                disabled={savingPwd || newPwd !== confirmPwd || newPwd.length < 8}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '10px 22px', borderRadius: '10px', border: 'none',
                  background: `linear-gradient(135deg, ${C.red}, #E53946)`,
                  color: 'white', fontWeight: 700, fontSize: '13px',
                  cursor: (savingPwd || newPwd !== confirmPwd || newPwd.length < 8) ? 'not-allowed' : 'pointer',
                  opacity: (savingPwd || newPwd !== confirmPwd || newPwd.length < 8) ? 0.6 : 1,
                  boxShadow: `0 4px 14px rgba(200,16,46,0.3)`,
                  transition: 'all 0.2s',
                }}
              >
                {savingPwd ? <Spinner /> : <Key size={14} />}
                {savingPwd ? 'Modification…' : 'Changer le mot de passe'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ── Barre d'infos compte (pleine largeur) ──────────────── */}
      <div style={{
        marginTop: '18px',
        background: 'white',
        borderRadius: '14px', padding: '16px 22px',
        border: '1px solid #f1f5f9',
        boxShadow: '0 2px 8px rgba(27,67,50,0.04)',
        display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: `rgba(27,67,50,0.07)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <LogIn size={13} style={{ color: C.green }} />
          </div>
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            Identifiant : <strong style={{ color: '#1e293b' }}>#{user?.id}</strong>
          </span>
        </div>
        <div style={{ width: '1px', height: '20px', background: '#e2e8f0' }} />
        <span style={{ fontSize: '12px', color: '#64748b' }}>
          Rôle : <strong style={{ color: '#1e293b' }}>{ROLE_LABELS[user?.role ?? ''] ?? user?.role}</strong>
        </span>
        <div style={{ width: '1px', height: '20px', background: '#e2e8f0' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#4ade80' }} />
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Compte actif</span>
        </div>
      </div>

    </div>
  );
};

export default AdminProfilePage;
