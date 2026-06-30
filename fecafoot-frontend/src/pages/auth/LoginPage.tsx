// src/pages/auth/LoginPage.tsx
// Page de connexion FECAFOOT — Design premium pur CSS (sans dépendance Tailwind)

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Eye, EyeOff, Mail, Lock, AlertCircle, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import { loginApi } from '../../api/auth.api';
import { useAuthStore } from '../../store/authStore';

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const getDashboardRoute = useAuthStore((s) => s.getDashboardRoute);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  const { mutate: login, isPending } = useMutation({
    mutationFn: loginApi,
    onSuccess: (data) => {
      setAuth(data.token, data.user);
      toast.success(`Bienvenue, ${data.user.prenom} !`, {
        style: { background: '#1B4332', color: '#fff', borderLeft: '4px solid #FFB800' },
        iconTheme: { primary: '#FFB800', secondary: '#1B4332' },
      });
      if (data.premiere_connexion) {
        navigate('/changer-mot-de-passe');
      } else {
        navigate(getDashboardRoute());
      }
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || 'Identifiants incorrects.';
      toast.error(msg, {
        style: { background: '#1a1a2e', color: '#fff', borderLeft: '4px solid #C8102E' },
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    const errors: typeof fieldErrors = {};
    if (!email) errors.email = 'Email obligatoire';
    else if (!/\S+@\S+\.\S+/.test(email)) errors.email = 'Email invalide';
    if (!password) errors.password = 'Mot de passe obligatoire';
    if (Object.keys(errors).length > 0) return setFieldErrors(errors);
    login({ email, password });
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0F1923',
      display: 'flex',
      fontFamily: "'Inter', -apple-system, sans-serif",
    }}>

      {/* ── Panneau gauche : Branding (masqué sur mobile) ── */}
      <div style={{
        flex: '1 1 50%',
        display: 'none',
        position: 'relative',
        overflow: 'hidden',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px',
      }} className="login-left-panel">

        {/* Fond dégradé animé */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(135deg, #1B4332 0%, #0F2D1F 50%, #0F1923 100%)',
        }} />

        {/* Texture hexagonale */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.04,
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 5L55 20v30L30 55 5 50V20z' fill='none' stroke='%23ffffff' stroke-width='1'/%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px',
        }} />

        {/* Cercles décoratifs */}
        <div style={{
          position: 'absolute', top: '-100px', right: '-100px',
          width: '400px', height: '400px',
          borderRadius: '50%',
          background: 'rgba(27,67,50,0.4)',
          filter: 'blur(80px)',
        }} />
        <div style={{
          position: 'absolute', bottom: '-80px', left: '-80px',
          width: '300px', height: '300px',
          borderRadius: '50%',
          background: 'rgba(200,16,46,0.08)',
          filter: 'blur(60px)',
        }} />

        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: '380px' }}>

          {/* Logo */}
          <div style={{
            width: '112px', height: '112px',
            margin: '0 auto 32px',
            position: 'relative',
          }}>
            <div style={{
              width: '100%', height: '100%',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #1B4332 0%, #0a1f15 100%)',
              border: '4px solid rgba(255,184,0,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 40px rgba(255,184,0,0.1), 0 20px 60px rgba(0,0,0,0.4)',
            }}>
              <Shield style={{ width: '48px', height: '48px', color: '#FFB800' }} />
            </div>
            {/* Bandes tricolores */}
            <div style={{
              position: 'absolute', bottom: '-4px', left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex', gap: '4px',
            }}>
              <div style={{ width: '18px', height: '5px', borderRadius: '999px', background: '#009A44' }} />
              <div style={{ width: '18px', height: '5px', borderRadius: '999px', background: '#C8102E' }} />
              <div style={{ width: '18px', height: '5px', borderRadius: '999px', background: '#FFB800' }} />
            </div>
          </div>

          <h1 style={{
            fontSize: '42px', fontWeight: 900, color: 'white',
            marginBottom: '8px', letterSpacing: '-1px', lineHeight: 1.1,
          }}>
            FECAFOOT
          </h1>
          <p style={{
            color: '#FFB800', fontSize: '11px', fontWeight: 600,
            letterSpacing: '4px', textTransform: 'uppercase', marginBottom: '24px',
          }}>
            Elite Platform
          </p>

          <div style={{
            width: '64px', height: '1px',
            background: 'linear-gradient(90deg, transparent, #FFB800, transparent)',
            margin: '0 auto 24px',
          }} />

          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '15px', lineHeight: 1.7 }}>
            La plateforme officielle de gestion des championnats{' '}
            <span style={{ color: '#FFB800', fontWeight: 600 }}>Elite One</span>
            {' '}et{' '}
            <span style={{ color: '#FFB800', fontWeight: 600 }}>Elite Two</span>
            {' '}du Cameroun.
          </p>

          {/* Stats */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '12px', marginTop: '40px',
          }}>
            {[
              { value: '32', label: 'Clubs' },
              { value: '480+', label: 'Matchs/saison' },
              { value: '700+', label: 'Joueurs' },
            ].map((stat) => (
              <div key={stat.label} style={{
                background: 'rgba(255,255,255,0.05)',
                backdropFilter: 'blur(8px)',
                borderRadius: '12px',
                padding: '14px 8px',
                border: '1px solid rgba(255,255,255,0.08)',
              }}>
                <div style={{ color: '#FFB800', fontSize: '22px', fontWeight: 900 }}>{stat.value}</div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', marginTop: '2px' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Panneau droit : Formulaire ── */}
      <div style={{
        flex: '1 1 50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>

          {/* Logo mobile */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '40px',
          }} className="login-mobile-logo">
            <div style={{
              width: '40px', height: '40px',
              background: 'linear-gradient(135deg, #1B4332, #0a1f15)',
              borderRadius: '50%',
              border: '2px solid rgba(255,184,0,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Shield style={{ width: '20px', height: '20px', color: '#FFB800' }} />
            </div>
            <div>
              <span style={{ color: 'white', fontWeight: 900, fontSize: '18px' }}>FECAFOOT</span>
              <span style={{ color: '#FFB800', fontSize: '11px', marginLeft: '8px', letterSpacing: '2px' }}>ELITE</span>
            </div>
          </div>

          {/* En-tête formulaire */}
          <div style={{ marginBottom: '40px' }}>
            <h2 style={{
              fontSize: '32px', fontWeight: 900, color: 'white',
              marginBottom: '8px', letterSpacing: '-0.5px',
            }}>
              Connexion
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>
              Accédez à votre espace de gestion
            </p>
          </div>

          {/* Formulaire */}
          <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Email */}
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
                    color: fieldErrors.email ? '#C8102E' : 'rgba(255,255,255,0.3)',
                  }} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: undefined }));
                  }}
                  placeholder="votre@email.cm"
                  autoComplete="email"
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.06)',
                    border: `1.5px solid ${fieldErrors.email ? 'rgba(200,16,46,0.6)' : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: '12px',
                    padding: '14px 16px 14px 44px',
                    color: 'white',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => {
                    if (!fieldErrors.email) {
                      e.currentTarget.style.borderColor = 'rgba(27,67,50,0.8)';
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(27,67,50,0.2)';
                      e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                    }
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = fieldErrors.email ? 'rgba(200,16,46,0.6)' : 'rgba(255,255,255,0.1)';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                  }}
                />
              </div>
              {fieldErrors.email && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                  <AlertCircle style={{ width: '13px', height: '13px', color: '#C8102E' }} />
                  <span style={{ color: '#C8102E', fontSize: '12px' }}>{fieldErrors.email}</span>
                </div>
              )}
            </div>

            {/* Mot de passe */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', fontWeight: 500 }}>
                  Mot de passe
                </label>
                <Link
                  to="/mot-de-passe-oublie"
                  style={{
                    color: '#FFB800', fontSize: '12px', textDecoration: 'none',
                    transition: 'opacity 0.15s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '0.7'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                >
                  Mot de passe oublié ?
                </Link>
              </div>
              <div style={{ position: 'relative' }}>
                <div style={{
                  position: 'absolute', top: '50%', left: '16px',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                }}>
                  <Lock style={{
                    width: '16px', height: '16px',
                    color: fieldErrors.password ? '#C8102E' : 'rgba(255,255,255,0.3)',
                  }} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) setFieldErrors((p) => ({ ...p, password: undefined }));
                  }}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.06)',
                    border: `1.5px solid ${fieldErrors.password ? 'rgba(200,16,46,0.6)' : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: '12px',
                    padding: '14px 48px 14px 44px',
                    color: 'white',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => {
                    if (!fieldErrors.password) {
                      e.currentTarget.style.borderColor = 'rgba(27,67,50,0.8)';
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(27,67,50,0.2)';
                      e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                    }
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = fieldErrors.password ? 'rgba(200,16,46,0.6)' : 'rgba(255,255,255,0.1)';
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
                    transition: 'color 0.15s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
                >
                  {showPassword ? <EyeOff style={{ width: '16px', height: '16px' }} /> : <Eye style={{ width: '16px', height: '16px' }} />}
                </button>
              </div>
              {fieldErrors.password && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                  <AlertCircle style={{ width: '13px', height: '13px', color: '#C8102E' }} />
                  <span style={{ color: '#C8102E', fontSize: '12px' }}>{fieldErrors.password}</span>
                </div>
              )}
            </div>

            {/* Bouton connexion */}
            <button
              type="submit"
              disabled={isPending}
              style={{
                width: '100%',
                padding: '15px',
                borderRadius: '12px',
                border: '1px solid rgba(45,106,79,0.6)',
                background: isPending
                  ? 'rgba(27,67,50,0.6)'
                  : 'linear-gradient(135deg, #1B4332 0%, #2D6A4F 100%)',
                color: 'white',
                fontSize: '15px',
                fontWeight: 700,
                cursor: isPending ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 20px rgba(27,67,50,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                opacity: isPending ? 0.7 : 1,
                position: 'relative',
                overflow: 'hidden',
              }}
              onMouseEnter={(e) => {
                if (!isPending) {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #2D6A4F 0%, #40916C 100%)';
                  e.currentTarget.style.boxShadow = '0 6px 24px rgba(27,67,50,0.4)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isPending) {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #1B4332 0%, #2D6A4F 100%)';
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(27,67,50,0.3)';
                  e.currentTarget.style.transform = 'none';
                }
              }}
            >
              {isPending ? (
                <>
                  <svg
                    style={{ width: '18px', height: '18px', animation: 'spin 1s linear infinite' }}
                    fill="none" viewBox="0 0 24 24"
                  >
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="30" strokeDashoffset="10" />
                  </svg>
                  Connexion en cours...
                </>
              ) : (
                'Se connecter'
              )}
            </button>
          </form>

          {/* Accès Fan */}
          <div style={{ display: 'none', marginTop: '24px', textAlign: 'center' }}>
            <Link
              to="/fan"
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: '#FFB800',
                textDecoration: 'none',
                background: 'rgba(255,184,0,0.1)',
                padding: '10px 20px',
                borderRadius: '8px',
                border: '1px solid rgba(255,184,0,0.2)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,184,0,0.2)';
                e.currentTarget.style.borderColor = '#FFB800';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,184,0,0.1)';
                e.currentTarget.style.borderColor = 'rgba(255,184,0,0.2)';
              }}
            >
              📱 Accéder en tant que Fan (Simulateur Mobile)
            </Link>
          </div>

          {/* Footer */}
          <div style={{ marginTop: '40px', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
            <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '12px' }}>
              © 2026 FECAFOOT — Tous droits réservés
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '8px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#009A44' }} />
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#C8102E' }} />
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#FFB800' }} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Styles responsive inline ── */}
      <style>{`
        @media (min-width: 1024px) {
          .login-left-panel { display: flex !important; }
          .login-mobile-logo { display: none !important; }
        }
        @media (max-width: 1023px) {
          .login-mobile-logo { display: flex !important; }
        }
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus {
          -webkit-text-fill-color: white !important;
          -webkit-box-shadow: 0 0 0 30px rgba(255,255,255,0.06) inset !important;
          caret-color: white !important;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}