// src/pages/auth/NotAuthorizedPage.tsx
// Page Accès refusé — styles inline

import { Link } from 'react-router-dom';
import { ShieldX } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export function NotAuthorizedPage() {
    const getDashboardRoute = useAuthStore((s) => s.getDashboardRoute);

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
            <div style={{ textAlign: 'center', maxWidth: '320px' }}>

                {/* Icône ShieldX */}
                <div style={{
                    width: '80px', height: '80px',
                    borderRadius: '16px',
                    background: 'rgba(200,16,46,0.1)',
                    border: '1px solid rgba(200,16,46,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 24px',
                }}>
                    <ShieldX style={{ width: '40px', height: '40px', color: '#C8102E' }} />
                </div>

                {/* Titre */}
                <h1 style={{
                    fontSize: '28px', fontWeight: 900, color: 'white',
                    marginBottom: '12px', letterSpacing: '-0.5px',
                }}>
                    Accès refusé
                </h1>

                {/* Description */}
                <p style={{
                    color: 'rgba(255,255,255,0.4)',
                    fontSize: '14px',
                    marginBottom: '32px',
                    lineHeight: 1.5,
                }}>
                    Vous n'avez pas les permissions nécessaires pour accéder à cette page.
                </p>

                {/* Bouton retour */}
                <Link
                    to={getDashboardRoute()}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '12px 24px',
                        borderRadius: '12px',
                        background: '#1B4332',
                        color: 'white',
                        fontSize: '14px',
                        fontWeight: 600,
                        textDecoration: 'none',
                        transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#2D6A4F';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#1B4332';
                        e.currentTarget.style.transform = 'none';
                    }}
                >
                    Retour à mon espace
                </Link>
            </div>
        </div>
    );
}