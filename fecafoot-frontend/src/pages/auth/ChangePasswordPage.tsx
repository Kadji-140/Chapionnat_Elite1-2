// src/pages/auth/ChangePasswordPage.tsx
// Changement de mot de passe (première connexion) — styles inline

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Lock, Eye, EyeOff, ShieldCheck, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { changePasswordApi } from '../../api/auth.api';
import { useAuthStore } from '../../store/authStore';

export default function ChangePasswordPage() {
    const navigate = useNavigate();
    const { user, setUser, getDashboardRoute } = useAuthStore();

    const [ancienPassword, setAncienPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmation, setConfirmation] = useState('');
    const [showOld, setShowOld] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const { mutate: changePassword, isPending } = useMutation({
        mutationFn: changePasswordApi,
        onSuccess: (data) => {
            setUser(data.user);
            toast.success('Mot de passe mis à jour !', {
                style: { background: '#1B4332', color: '#fff', borderLeft: '4px solid #FFB800' },
            });
            navigate(getDashboardRoute());
        },
        onError: (error: any) => {
            const msg = error.response?.data?.message || 'Erreur lors du changement.';
            if (error.response?.data?.errors?.ancien_password) {
                setErrors({ ancien: 'Mot de passe actuel incorrect' });
            } else {
                toast.error(msg, {
                    style: { background: '#1a1a2e', color: '#fff', borderLeft: '4px solid #C8102E' },
                });
            }
        },
    });

    const checks = [
        { label: '8 caractères minimum', ok: newPassword.length >= 8 },
        { label: 'Une majuscule', ok: /[A-Z]/.test(newPassword) },
        { label: 'Un chiffre', ok: /[0-9]/.test(newPassword) },
        { label: 'Un caractère spécial', ok: /[@$!%*?&.#_-]/.test(newPassword) },
    ];
    const isStrong = checks.every((c) => c.ok);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const errs: Record<string, string> = {};
        if (!ancienPassword) errs.ancien = 'Obligatoire';
        if (!newPassword) errs.new = 'Obligatoire';
        else if (!isStrong) errs.new = 'Le mot de passe ne respecte pas les critères';
        if (newPassword !== confirmation) errs.confirm = 'Ne correspondent pas';
        if (Object.keys(errs).length > 0) return setErrors(errs);
        changePassword({
            ancien_password: ancienPassword,
            nouveau_password: newPassword,
            nouveau_password_confirmation: confirmation,
        });
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: '#0F1923',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            fontFamily: "'Inter', -apple-system, sans-serif",
        }}>
            <div style={{ width: '100%', maxWidth: '540px' }}>

                {/* Logo */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '32px' }}>
                    <div style={{
                        width: '48px', height: '48px',
                        borderRadius: '50%',
                        background: '#1B4332',
                        border: '2px solid rgba(255,184,0,0.4)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <ShieldCheck style={{ width: '24px', height: '24px', color: '#FFB800' }} />
                    </div>
                </div>

                {/* Bannière première connexion */}
                <div style={{
                    background: 'rgba(255,184,0,0.1)',
                    border: '1px solid rgba(255,184,0,0.2)',
                    borderRadius: '12px',
                    padding: '16px',
                    marginBottom: '24px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                }}>
                    <ShieldCheck style={{ width: '20px', height: '20px', color: '#FFB800', flexShrink: 0, marginTop: '2px' }} />
                    <div>
                        <p style={{ color: '#FFB800', fontSize: '13px', fontWeight: 700, marginBottom: '2px' }}>
                            Première connexion détectée
                        </p>
                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', lineHeight: 1.4 }}>
                            Bonjour {user?.prenom} ! Pour votre sécurité, vous devez définir un nouveau mot de passe avant de continuer.
                        </p>
                    </div>
                </div>

                {/* Carte principale */}
                <div style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '16px',
                    padding: '32px',
                    backdropFilter: 'blur(8px)',
                }}>

                    {/* En-tête */}
                    <div style={{ marginBottom: '28px' }}>
                        <h2 style={{
                            fontSize: '24px', fontWeight: 900, color: 'white',
                            marginBottom: '6px', letterSpacing: '-0.5px',
                        }}>
                            Choisir un mot de passe
                        </h2>
                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>
                            Ce mot de passe remplacera celui qui vous a été attribué.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                        {/* Ancien mot de passe */}
                        <div>
                            <label style={{
                                display: 'block', color: 'rgba(255,255,255,0.7)',
                                fontSize: '13px', fontWeight: 500, marginBottom: '8px',
                            }}>
                                Mot de passe temporaire reçu par email
                            </label>
                            <div style={{ position: 'relative' }}>
                                <div style={{
                                    position: 'absolute', top: '50%', left: '16px',
                                    transform: 'translateY(-50%)',
                                    pointerEvents: 'none',
                                }}>
                                    <Lock style={{ width: '16px', height: '16px', color: 'rgba(255,255,255,0.3)' }} />
                                </div>
                                <input
                                    type={showOld ? 'text' : 'password'}
                                    value={ancienPassword}
                                    onChange={(e) => { setAncienPassword(e.target.value); setErrors((p) => ({ ...p, ancien: '' })); }}
                                    placeholder="Mot de passe temporaire"
                                    style={{
                                        width: '100%',
                                        background: 'rgba(255,255,255,0.06)',
                                        border: `1.5px solid ${errors.ancien ? 'rgba(200,16,46,0.6)' : 'rgba(255,255,255,0.1)'}`,
                                        borderRadius: '12px',
                                        padding: '14px 48px 14px 44px',
                                        color: 'white',
                                        fontSize: '14px',
                                        outline: 'none',
                                        transition: 'all 0.2s ease',
                                        boxSizing: 'border-box',
                                    }}
                                    onFocus={(e) => {
                                        if (!errors.ancien) {
                                            e.currentTarget.style.borderColor = 'rgba(27,67,50,0.8)';
                                            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(27,67,50,0.2)';
                                            e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                                        }
                                    }}
                                    onBlur={(e) => {
                                        e.currentTarget.style.borderColor = errors.ancien ? 'rgba(200,16,46,0.6)' : 'rgba(255,255,255,0.1)';
                                        e.currentTarget.style.boxShadow = 'none';
                                        e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowOld(!showOld)}
                                    style={{
                                        position: 'absolute', top: '50%', right: '16px',
                                        transform: 'translateY(-50%)',
                                        background: 'none', border: 'none', cursor: 'pointer',
                                        color: 'rgba(255,255,255,0.3)',
                                        display: 'flex', padding: '4px',
                                        transition: 'color 0.15s',
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
                                    onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
                                >
                                    {showOld ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            {errors.ancien && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                                    <AlertCircle style={{ width: '13px', height: '13px', color: '#C8102E' }} />
                                    <span style={{ color: '#C8102E', fontSize: '12px' }}>{errors.ancien}</span>
                                </div>
                            )}
                        </div>

                        <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />

                        {/* Nouveau mot de passe */}
                        <div>
                            <label style={{
                                display: 'block', color: 'rgba(255,255,255,0.7)',
                                fontSize: '13px', fontWeight: 500, marginBottom: '8px',
                            }}>
                                Nouveau mot de passe
                            </label>
                            <div style={{ position: 'relative' }}>
                                <div style={{
                                    position: 'absolute', top: '50%', left: '16px',
                                    transform: 'translateY(-50%)',
                                    pointerEvents: 'none',
                                }}>
                                    <Lock style={{ width: '16px', height: '16px', color: 'rgba(255,255,255,0.3)' }} />
                                </div>
                                <input
                                    type={showNew ? 'text' : 'password'}
                                    value={newPassword}
                                    onChange={(e) => { setNewPassword(e.target.value); setErrors((p) => ({ ...p, new: '' })); }}
                                    placeholder="Minimum 8 caractères"
                                    style={{
                                        width: '100%',
                                        background: 'rgba(255,255,255,0.06)',
                                        border: `1.5px solid ${errors.new ? 'rgba(200,16,46,0.6)' : 'rgba(255,255,255,0.1)'}`,
                                        borderRadius: '12px',
                                        padding: '14px 48px 14px 44px',
                                        color: 'white',
                                        fontSize: '14px',
                                        outline: 'none',
                                        transition: 'all 0.2s ease',
                                        boxSizing: 'border-box',
                                    }}
                                    onFocus={(e) => {
                                        if (!errors.new) {
                                            e.currentTarget.style.borderColor = 'rgba(27,67,50,0.8)';
                                            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(27,67,50,0.2)';
                                            e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                                        }
                                    }}
                                    onBlur={(e) => {
                                        e.currentTarget.style.borderColor = errors.new ? 'rgba(200,16,46,0.6)' : 'rgba(255,255,255,0.1)';
                                        e.currentTarget.style.boxShadow = 'none';
                                        e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNew(!showNew)}
                                    style={{
                                        position: 'absolute', top: '50%', right: '16px',
                                        transform: 'translateY(-50%)',
                                        background: 'none', border: 'none', cursor: 'pointer',
                                        color: 'rgba(255,255,255,0.3)',
                                        display: 'flex', padding: '4px',
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
                                    onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
                                >
                                    {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>

                            {/* Critères de sécurité */}
                            {newPassword && (
                                <div style={{
                                    marginTop: '12px',
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(2, 1fr)',
                                    gap: '6px',
                                }}>
                                    {checks.map((c) => (
                                        <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <div style={{
                                                width: '6px', height: '6px',
                                                borderRadius: '50%',
                                                background: c.ok ? '#52B788' : 'rgba(255,255,255,0.2)',
                                                transition: 'background 0.2s',
                                            }} />
                                            <span style={{
                                                fontSize: '11px',
                                                color: c.ok ? '#52B788' : 'rgba(255,255,255,0.3)',
                                                transition: 'color 0.2s',
                                            }}>
                                                {c.label}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Confirmation */}
                        <div>
                            <label style={{
                                display: 'block', color: 'rgba(255,255,255,0.7)',
                                fontSize: '13px', fontWeight: 500, marginBottom: '8px',
                            }}>
                                Confirmer le nouveau mot de passe
                            </label>
                            <div style={{ position: 'relative' }}>
                                <div style={{
                                    position: 'absolute', top: '50%', left: '16px',
                                    transform: 'translateY(-50%)',
                                    pointerEvents: 'none',
                                }}>
                                    <Lock style={{ width: '16px', height: '16px', color: 'rgba(255,255,255,0.3)' }} />
                                </div>
                                <input
                                    type={showConfirm ? 'text' : 'password'}
                                    value={confirmation}
                                    onChange={(e) => { setConfirmation(e.target.value); setErrors((p) => ({ ...p, confirm: '' })); }}
                                    placeholder="••••••••"
                                    style={{
                                        width: '100%',
                                        background: 'rgba(255,255,255,0.06)',
                                        border: `1.5px solid ${errors.confirm ? 'rgba(200,16,46,0.6)' : 'rgba(255,255,255,0.1)'}`,
                                        borderRadius: '12px',
                                        padding: '14px 48px 14px 44px',
                                        color: 'white',
                                        fontSize: '14px',
                                        outline: 'none',
                                        transition: 'all 0.2s ease',
                                        boxSizing: 'border-box',
                                    }}
                                    onFocus={(e) => {
                                        if (!errors.confirm) {
                                            e.currentTarget.style.borderColor = 'rgba(27,67,50,0.8)';
                                            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(27,67,50,0.2)';
                                            e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                                        }
                                    }}
                                    onBlur={(e) => {
                                        e.currentTarget.style.borderColor = errors.confirm ? 'rgba(200,16,46,0.6)' : 'rgba(255,255,255,0.1)';
                                        e.currentTarget.style.boxShadow = 'none';
                                        e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirm(!showConfirm)}
                                    style={{
                                        position: 'absolute', top: '50%', right: '16px',
                                        transform: 'translateY(-50%)',
                                        background: 'none', border: 'none', cursor: 'pointer',
                                        color: 'rgba(255,255,255,0.3)',
                                        display: 'flex', padding: '4px',
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
                                    onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
                                >
                                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            {confirmation && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                                    <div style={{
                                        width: '6px', height: '6px',
                                        borderRadius: '50%',
                                        background: newPassword === confirmation ? '#52B788' : '#C8102E',
                                    }} />
                                    <span style={{
                                        fontSize: '11px',
                                        color: newPassword === confirmation ? '#52B788' : '#C8102E',
                                    }}>
                                        {newPassword === confirmation ? 'Les mots de passe correspondent' : 'Ne correspondent pas'}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Bouton submit */}
                        <button
                            type="submit"
                            disabled={isPending}
                            style={{
                                width: '100%',
                                padding: '14px',
                                borderRadius: '12px',
                                border: '1px solid rgba(45,106,79,0.6)',
                                background: isPending
                                    ? 'rgba(27,67,50,0.6)'
                                    : 'linear-gradient(135deg, #1B4332 0%, #2D6A4F 100%)',
                                color: 'white',
                                fontSize: '14px',
                                fontWeight: 700,
                                cursor: isPending ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s ease',
                                boxShadow: '0 4px 20px rgba(27,67,50,0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                opacity: isPending ? 0.7 : 1,
                                marginTop: '8px',
                            }}
                            onMouseEnter={(e) => {
                                if (!isPending) {
                                    e.currentTarget.style.background = 'linear-gradient(135deg, #2D6A4F 0%, #40916C 100%)';
                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!isPending) {
                                    e.currentTarget.style.background = 'linear-gradient(135deg, #1B4332 0%, #2D6A4F 100%)';
                                    e.currentTarget.style.transform = 'none';
                                }
                            }}
                        >
                            {isPending ? (
                                <>
                                    <svg style={{ width: '18px', height: '18px', animation: 'spin 1s linear infinite' }} fill="none" viewBox="0 0 24 24">
                                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="30" strokeDashoffset="10" />
                                    </svg>
                                    Enregistrement...
                                </>
                            ) : (
                                'Définir mon mot de passe et accéder à la plateforme'
                            )}
                        </button>
                    </form>
                </div>
            </div>

            {/* Animation keyframes inline */}
            <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    );
}