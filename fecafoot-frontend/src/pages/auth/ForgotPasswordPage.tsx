// src/pages/auth/ForgotPasswordPage.tsx
// Page "Mot de passe oublié" — styles inline (sans Tailwind)

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Mail, ArrowLeft, CheckCircle, AlertCircle, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import { forgotPasswordApi } from '../../api/auth.api';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [emailError, setEmailError] = useState('');
    const [sent, setSent] = useState(false);

    const { mutate: sendReset, isPending } = useMutation({
        mutationFn: forgotPasswordApi,
        onSuccess: () => {
            setSent(true);
        },
        onError: (error: any) => {
            const msg = error.response?.data?.message || 'Une erreur est survenue.';
            toast.error(msg, {
                style: { background: '#1a1a2e', color: '#fff', borderLeft: '4px solid #C8102E' },
            });
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setEmailError('');
        if (!email) return setEmailError('Email obligatoire');
        if (!/\S+@\S+\.\S+/.test(email)) return setEmailError('Email invalide');
        sendReset({ email });
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

                {/* Carte */}
                <div style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '16px',
                    padding: '32px',
                    backdropFilter: 'blur(8px)',
                }}>

                    {!sent ? (
                        <>
                            {/* En-tête */}
                            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                                <div style={{
                                    width: '56px', height: '56px',
                                    borderRadius: '16px',
                                    background: 'rgba(255,184,0,0.1)',
                                    border: '1px solid rgba(255,184,0,0.2)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    margin: '0 auto 16px',
                                }}>
                                    <Mail style={{ width: '28px', height: '28px', color: '#FFB800' }} />
                                </div>
                                <h2 style={{
                                    fontSize: '24px', fontWeight: 900, color: 'white',
                                    marginBottom: '8px', letterSpacing: '-0.5px',
                                }}>
                                    Mot de passe oublié
                                </h2>
                                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', lineHeight: 1.5 }}>
                                    Saisissez votre adresse email. Nous vous enverrons un lien pour réinitialiser votre mot de passe.
                                </p>
                            </div>

                            {/* Formulaire */}
                            <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div>
                                    <label style={{
                                        display: 'block', color: 'rgba(255,255,255,0.7)',
                                        fontSize: '13px', fontWeight: 500, marginBottom: '8px',
                                    }}>
                                        Adresse email
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                        <div style={{
                                            position: 'absolute', top: '50%', left: '16px',
                                            transform: 'translateY(-50%)',
                                            pointerEvents: 'none',
                                        }}>
                                            <Mail style={{
                                                width: '16px', height: '16px',
                                                color: emailError ? '#C8102E' : 'rgba(255,255,255,0.3)',
                                            }} />
                                        </div>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => {
                                                setEmail(e.target.value);
                                                if (emailError) setEmailError('');
                                            }}
                                            placeholder="votre@email.cm"
                                            autoComplete="email"
                                            style={{
                                                width: '100%',
                                                background: 'rgba(255,255,255,0.06)',
                                                border: `1.5px solid ${emailError ? 'rgba(200,16,46,0.6)' : 'rgba(255,255,255,0.1)'}`,
                                                borderRadius: '12px',
                                                padding: '14px 16px 14px 44px',
                                                color: 'white',
                                                fontSize: '14px',
                                                outline: 'none',
                                                transition: 'all 0.2s ease',
                                                boxSizing: 'border-box',
                                            }}
                                            onFocus={(e) => {
                                                if (!emailError) {
                                                    e.currentTarget.style.borderColor = 'rgba(27,67,50,0.8)';
                                                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(27,67,50,0.2)';
                                                    e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                                                }
                                            }}
                                            onBlur={(e) => {
                                                e.currentTarget.style.borderColor = emailError ? 'rgba(200,16,46,0.6)' : 'rgba(255,255,255,0.1)';
                                                e.currentTarget.style.boxShadow = 'none';
                                                e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                                            }}
                                        />
                                    </div>
                                    {emailError && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                                            <AlertCircle style={{ width: '13px', height: '13px', color: '#C8102E' }} />
                                            <span style={{ color: '#C8102E', fontSize: '12px' }}>{emailError}</span>
                                        </div>
                                    )}
                                </div>

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
                                            Envoi en cours...
                                        </>
                                    ) : (
                                        'Envoyer le lien de réinitialisation'
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
                                Email envoyé !
                            </h3>
                            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', lineHeight: 1.5, marginBottom: '8px' }}>
                                Un lien de réinitialisation a été envoyé à
                            </p>
                            <p style={{ color: '#FFB800', fontWeight: 600, fontSize: '13px', marginBottom: '24px' }}>
                                {email}
                            </p>
                            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', lineHeight: 1.5 }}>
                                Vérifiez aussi votre dossier spam. Le lien expire dans 60 minutes.
                            </p>
                            <button
                                onClick={() => { setSent(false); setEmail(''); }}
                                style={{
                                    marginTop: '24px',
                                    color: 'rgba(255,255,255,0.4)',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '13px',
                                    textDecoration: 'underline',
                                    transition: 'color 0.2s',
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
                                onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
                            >
                                Utiliser une autre adresse
                            </button>
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

                {/* Animation keyframes inline */}
                <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
            </div>
        </div>
    );
}