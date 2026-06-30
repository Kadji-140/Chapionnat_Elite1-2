// src/pages/auth/ResetPasswordPage.tsx
// Réinitialisation du mot de passe — styles inline

import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, Shield, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { resetPasswordApi } from '../../api/auth.api';

// Composant PasswordStrength en styles inline
function PasswordStrength({ password }: { password: string }) {
    const checks = [
        { label: '8 caractères minimum', ok: password.length >= 8 },
        { label: 'Une majuscule', ok: /[A-Z]/.test(password) },
        { label: 'Un chiffre', ok: /[0-9]/.test(password) },
        { label: 'Un caractère spécial', ok: /[@$!%*?&.#_-]/.test(password) },
    ];
    const score = checks.filter((c) => c.ok).length;

    const getScoreColor = () => {
        if (score >= 4) return '#52B788';
        if (score >= 3) return '#FFB800';
        return '#C8102E';
    };

    const getScoreLabel = () => {
        const labels = ['', 'Très faible', 'Faible', 'Moyen', 'Fort'];
        return labels[score] || '';
    };

    if (!password) return null;

    return (
        <div style={{ marginTop: '12px' }}>
            {/* Barre de progression */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                {[1, 2, 3, 4].map((i) => (
                    <div
                        key={i}
                        style={{
                            height: '4px',
                            flex: 1,
                            borderRadius: '4px',
                            background: i <= score ? getScoreColor() : 'rgba(255,255,255,0.1)',
                            transition: 'background 0.3s',
                        }}
                    />
                ))}
            </div>

            {/* Label du score */}
            <p style={{
                fontSize: '11px',
                color: getScoreColor(),
                marginBottom: '8px',
            }}>
                {getScoreLabel()}
            </p>

            {/* Liste des critères */}
            <div style={{
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
                        }} />
                        <span style={{
                            fontSize: '10px',
                            color: c.ok ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.25)',
                        }}>
                            {c.label}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token') || '';
    const email = searchParams.get('email') || '';

    const [password, setPassword] = useState('');
    const [confirmation, setConfirmation] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [done, setDone] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const { mutate: resetPassword, isPending } = useMutation({
        mutationFn: resetPasswordApi,
        onSuccess: () => {
            setDone(true);
            setTimeout(() => navigate('/login'), 3000);
        },
        onError: (error: any) => {
            const msg = error.response?.data?.message || 'Lien expiré ou invalide.';
            toast.error(msg, {
                style: { background: '#1a1a2e', color: '#fff', borderLeft: '4px solid #C8102E' },
            });
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const errs: Record<string, string> = {};
        if (!password) errs.password = 'Mot de passe obligatoire';
        else if (password.length < 8) errs.password = 'Minimum 8 caractères';
        else if (!/[A-Z]/.test(password)) errs.password = 'Doit contenir une majuscule';
        else if (!/[0-9]/.test(password)) errs.password = 'Doit contenir un chiffre';
        else if (!/[@$!%*?&.#_-]/.test(password)) errs.password = 'Doit contenir un caractère spécial';
        if (password !== confirmation) errs.confirmation = 'Les mots de passe ne correspondent pas';
        if (Object.keys(errs).length > 0) return setErrors(errs);

        resetPassword({ token, email, password, password_confirmation: confirmation });
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
            <div style={{ width: '100%', maxWidth: '420px' }}>

                {/* Logo */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '40px' }}>
                    <div style={{
                        width: '48px', height: '48px',
                        borderRadius: '50%',
                        background: '#1B4332',
                        border: '2px solid rgba(255,184,0,0.4)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <Shield style={{ width: '24px', height: '24px', color: '#FFB800' }} />
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

                    {!done ? (
                        <>
                            {/* En-tête */}
                            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                                <div style={{
                                    width: '56px', height: '56px',
                                    borderRadius: '16px',
                                    background: 'rgba(27,67,50,0.3)',
                                    border: '1px solid rgba(27,67,50,0.5)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    margin: '0 auto 16px',
                                }}>
                                    <Lock style={{ width: '28px', height: '28px', color: '#52B788' }} />
                                </div>
                                <h2 style={{
                                    fontSize: '24px', fontWeight: 900, color: 'white',
                                    marginBottom: '8px', letterSpacing: '-0.5px',
                                }}>
                                    Nouveau mot de passe
                                </h2>
                                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>
                                    Choisissez un mot de passe sécurisé
                                </p>
                                {email && (
                                    <p style={{ color: '#FFB800', fontSize: '11px', marginTop: '6px' }}>
                                        {email}
                                    </p>
                                )}
                            </div>

                            {/* Formulaire */}
                            <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

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
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: '' })); }}
                                            placeholder="••••••••"
                                            style={{
                                                width: '100%',
                                                background: 'rgba(255,255,255,0.06)',
                                                border: `1.5px solid ${errors.password ? 'rgba(200,16,46,0.6)' : 'rgba(255,255,255,0.1)'}`,
                                                borderRadius: '12px',
                                                padding: '14px 48px 14px 44px',
                                                color: 'white',
                                                fontSize: '14px',
                                                outline: 'none',
                                                transition: 'all 0.2s ease',
                                                boxSizing: 'border-box',
                                            }}
                                            onFocus={(e) => {
                                                if (!errors.password) {
                                                    e.currentTarget.style.borderColor = 'rgba(27,67,50,0.8)';
                                                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(27,67,50,0.2)';
                                                    e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                                                }
                                            }}
                                            onBlur={(e) => {
                                                e.currentTarget.style.borderColor = errors.password ? 'rgba(200,16,46,0.6)' : 'rgba(255,255,255,0.1)';
                                                e.currentTarget.style.boxShadow = 'none';
                                                e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                                            }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
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
                                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                    {errors.password && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                                            <AlertCircle style={{ width: '13px', height: '13px', color: '#C8102E' }} />
                                            <span style={{ color: '#C8102E', fontSize: '12px' }}>{errors.password}</span>
                                        </div>
                                    )}
                                    <PasswordStrength password={password} />
                                </div>

                                {/* Confirmation */}
                                <div>
                                    <label style={{
                                        display: 'block', color: 'rgba(255,255,255,0.7)',
                                        fontSize: '13px', fontWeight: 500, marginBottom: '8px',
                                    }}>
                                        Confirmer le mot de passe
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
                                            onChange={(e) => { setConfirmation(e.target.value); setErrors((p) => ({ ...p, confirmation: '' })); }}
                                            placeholder="••••••••"
                                            style={{
                                                width: '100%',
                                                background: 'rgba(255,255,255,0.06)',
                                                border: `1.5px solid ${errors.confirmation ? 'rgba(200,16,46,0.6)' : 'rgba(255,255,255,0.1)'}`,
                                                borderRadius: '12px',
                                                padding: '14px 48px 14px 44px',
                                                color: 'white',
                                                fontSize: '14px',
                                                outline: 'none',
                                                transition: 'all 0.2s ease',
                                                boxSizing: 'border-box',
                                            }}
                                            onFocus={(e) => {
                                                if (!errors.confirmation) {
                                                    e.currentTarget.style.borderColor = 'rgba(27,67,50,0.8)';
                                                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(27,67,50,0.2)';
                                                    e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                                                }
                                            }}
                                            onBlur={(e) => {
                                                e.currentTarget.style.borderColor = errors.confirmation ? 'rgba(200,16,46,0.6)' : 'rgba(255,255,255,0.1)';
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

                                    {/* Indicateur correspondance */}
                                    {confirmation && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                                            <div style={{
                                                width: '6px', height: '6px',
                                                borderRadius: '50%',
                                                background: password === confirmation ? '#52B788' : '#C8102E',
                                            }} />
                                            <span style={{
                                                fontSize: '11px',
                                                color: password === confirmation ? '#52B788' : '#C8102E',
                                            }}>
                                                {password === confirmation ? 'Les mots de passe correspondent' : 'Ne correspondent pas'}
                                            </span>
                                        </div>
                                    )}

                                    {errors.confirmation && !confirmation && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                                            <AlertCircle style={{ width: '13px', height: '13px', color: '#C8102E' }} />
                                            <span style={{ color: '#C8102E', fontSize: '12px' }}>{errors.confirmation}</span>
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
                                        'Réinitialiser le mot de passe'
                                    )}
                                </button>
                            </form>
                        </>
                    ) : (
                        /* État succès */
                        <div style={{ textAlign: 'center', padding: '16px 0' }}>
                            <div style={{
                                width: '64px', height: '64px',
                                borderRadius: '50%',
                                background: 'rgba(27,67,50,0.4)',
                                border: '1px solid #1B4332',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                margin: '0 auto 24px',
                            }}>
                                <CheckCircle style={{ width: '32px', height: '32px', color: '#52B788' }} />
                            </div>
                            <h3 style={{ fontSize: '20px', fontWeight: 900, color: 'white', marginBottom: '12px' }}>
                                Mot de passe modifié !
                            </h3>
                            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginBottom: '16px' }}>
                                Votre mot de passe a été réinitialisé avec succès.
                            </p>
                            <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '11px' }}>
                                Redirection automatique vers la connexion...
                            </p>
                            {/* Barre de progression */}
                            <div style={{
                                marginTop: '16px',
                                width: '100%',
                                background: 'rgba(255,255,255,0.05)',
                                borderRadius: '4px',
                                height: '4px',
                                overflow: 'hidden',
                            }}>
                                <div style={{
                                    height: '100%',
                                    background: '#52B788',
                                    borderRadius: '4px',
                                    width: '100%',
                                    animation: 'shrink 3s linear forwards',
                                }} />
                            </div>
                        </div>
                    )}

                    {/* Retour */}
                    <div style={{
                        marginTop: '24px',
                        paddingTop: '24px',
                        borderTop: '1px solid rgba(255,255,255,0.05)',
                        textAlign: 'center',
                    }}>
                        <Link
                            to="/login"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                color: 'rgba(255,255,255,0.4)',
                                fontSize: '13px',
                                textDecoration: 'none',
                                transition: 'color 0.2s',
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
                            onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
                        >
                            <ArrowLeft style={{ width: '14px', height: '14px' }} />
                            Retour à la connexion
                        </Link>
                    </div>
                </div>
            </div>

            {/* Animations keyframes inline */}
            <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
        </div>
    );
}