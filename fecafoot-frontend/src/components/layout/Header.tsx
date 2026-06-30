// src/components/layout/Header.tsx

import React, { useState, useRef, useEffect } from 'react';
import { Menu, ChevronRight, Home, LogOut, User, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { RoleBadge } from '../ui/Badge';
import { NotificationCenter } from '../ui/NotificationCenter';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { useTranslation } from '../../hooks/useTranslation';

const getLogoUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  
  const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
  const baseUrl = apiUrl.endsWith('/api') ? apiUrl.slice(0, -4) : apiUrl;

  const cleanUrl = url.startsWith('/') ? url.substring(1) : url;
  if (cleanUrl.startsWith('storage/')) {
    return `${baseUrl}/${cleanUrl}`;
  }
  return `${baseUrl}/storage/${cleanUrl}`;
};

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface HeaderProps {
  breadcrumb?: BreadcrumbItem[];
  onMobileMenuToggle?: () => void;
}

// ── Avatar utilisateur ─────────────────────────────────────────
const UserAvatar: React.FC<{ nom?: string; prenom?: string; size?: number }> = ({
  nom, prenom, size = 36,
}) => {
  const initials = `${(prenom?.[0] ?? '').toUpperCase()}${(nom?.[0] ?? '').toUpperCase()}`;
  const colors = ['#1B4332', '#2D6A4F', '#C8102E', '#E53946', '#2563eb'];
  const idx = (nom?.charCodeAt(0) ?? 0) % colors.length;

  return (
    <div style={{
      width: size, height: size,
      borderRadius: '50%',
      background: `linear-gradient(135deg, ${colors[idx]}, ${colors[(idx + 1) % colors.length]})`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
      color: 'white',
      fontSize: size * 0.36,
      fontWeight: 700,
      letterSpacing: '-0.5px',
    }}>
      {initials || <User size={size * 0.5} />}
    </div>
  );
};

// ── Composant Header ───────────────────────────────────────────
export const Header: React.FC<HeaderProps> = ({
  breadcrumb = [],
  onMobileMenuToggle,
}) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const { lang, changeLanguage, t } = useTranslation();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const handleLogout = async () => {
    try { await api.post('/auth/logout'); } catch { /* ignore */ }
    logout();
    toast.success(t('header.logout_success'));
    navigate('/login');
  };

  // ⭐ Construire l'URL complète du logo du club
  const clubLogoUrl = getLogoUrl(user?.club?.logo_url);
  const club = user?.club;

  return (
    <header
      className="header animate-fade-in"
      style={{
        height: 'var(--header-height)',
        background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 30,
        boxShadow: '0 1px 8px rgba(0,0,0,0.05)',
        gap: '16px',
      }}
    >
      {/* ── Gauche : menu mobile + breadcrumb ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
        <button
          onClick={onMobileMenuToggle}
          className="btn btn-icon btn-ghost"
          aria-label="Menu"
          style={{ flexShrink: 0 }}
          id="mobile-menu-btn"
        >
          <Menu size={18} />
        </button>

        {breadcrumb.length > 0 && (
          <nav
            aria-label="Fil d'Ariane"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              minWidth: 0,
            }}
          >
            <Home size={13} style={{ color: 'var(--text-light)', flexShrink: 0 }} />
            {breadcrumb.map((item, i) => (
              <React.Fragment key={i}>
                <ChevronRight size={12} style={{ color: 'var(--text-light)', flexShrink: 0 }} />
                {item.href && i < breadcrumb.length - 1 ? (
                  <a
                    href={item.href}
                    style={{
                      fontSize: '13px',
                      color: 'var(--text-muted)',
                      textDecoration: 'none',
                      fontWeight: 500,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {item.label}
                  </a>
                ) : (
                  <span style={{
                    fontSize: '13px',
                    color: i === breadcrumb.length - 1 ? 'var(--text)' : 'var(--text-muted)',
                    fontWeight: i === breadcrumb.length - 1 ? 700 : 500,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {item.label}
                  </span>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}
      </div>

      {/* ── Droite : info club + notifs + user ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>

        {/* Nom du club si responsable */}
        {club && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 12px',
            background: 'rgba(27,67,50,0.08)',
            borderRadius: '40px',
            border: '1px solid rgba(27,67,50,0.12)',
          }}>
            {clubLogoUrl ? (
              <img
                src={clubLogoUrl}
                alt={club.nom}
                style={{ width: '24px', height: '24px', objectFit: 'contain', borderRadius: '4px' }}
                onError={(e) => {
                  // Si l'image ne charge pas, afficher l'initiale
                  (e.target as HTMLImageElement).style.display = 'none';
                  const parent = (e.target as HTMLImageElement).parentElement;
                  if (parent) {
                    const placeholder = document.createElement('div');
                    placeholder.style.cssText = 'width:24px;height:24px;background:#1B4332;border-radius:4px;display:flex;align-items:center;justify-content:center;color:white;font-size:12px;font-weight:700';
                    placeholder.textContent = club.nom.charAt(0).toUpperCase();
                    parent.appendChild(placeholder);
                  }
                }}
              />
            ) : (
              <div style={{
                width: '24px',
                height: '24px',
                background: '#1B4332',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <span style={{ fontSize: '12px', fontWeight: 800, color: 'white' }}>
                  {club.nom.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#1B4332', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {club.nom}
            </span>
          </div>
        )}

        <NotificationCenter />

        {/* Sélecteur de langue (FR/EN) */}
        <div style={{ display: 'flex', gap: '4px', background: '#F1F5F9', padding: '4px', borderRadius: '8px', marginLeft: '6px' }}>
          <button
            onClick={() => changeLanguage('fr')}
            style={{
              padding: '4px 8px',
              fontSize: '11px',
              fontWeight: 800,
              borderRadius: '6px',
              border: 'none',
              background: lang === 'fr' ? '#fff' : 'transparent',
              color: lang === 'fr' ? 'var(--primary-dark)' : '#64748B',
              cursor: 'pointer',
              boxShadow: lang === 'fr' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s',
            }}
          >
            FR
          </button>
          <button
            onClick={() => changeLanguage('en')}
            style={{
              padding: '4px 8px',
              fontSize: '11px',
              fontWeight: 800,
              borderRadius: '6px',
              border: 'none',
              background: lang === 'en' ? '#fff' : 'transparent',
              color: lang === 'en' ? 'var(--primary-dark)' : '#64748B',
              cursor: 'pointer',
              boxShadow: lang === 'en' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s',
            }}
          >
            EN
          </button>
        </div>

        <div style={{ width: '1px', height: '28px', background: 'var(--border)' }} />

        {/* Menu utilisateur */}
        <div ref={userMenuRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setUserMenuOpen(prev => !prev)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '5px 8px 5px 5px',
              borderRadius: '40px',
              border: '1px solid var(--border)',
              background: userMenuOpen ? '#f8fafc' : 'transparent',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <UserAvatar nom={user?.nom} prenom={user?.prenom} size={32} />
            <div style={{ textAlign: 'left', display: 'none', minWidth: 0 }} className="lg-show">
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', lineHeight: 1.2 }}>
                {user?.prenom} {user?.nom}
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', lineHeight: 1 }}>
                {user?.role?.replace('_', ' ')}
              </div>
            </div>
            <ChevronDown
              size={14}
              style={{
                color: '#64748b',
                transform: userMenuOpen ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.2s ease',
              }}
            />
          </button>

          {userMenuOpen && (
            <div
              className="animate-slide-down"
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: '240px',
                background: '#fff',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                overflow: 'hidden',
                zIndex: 100,
              }}
            >
              <div style={{
                padding: '16px',
                borderBottom: '1px solid #e2e8f0',
                background: '#f8fafc',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <UserAvatar nom={user?.nom} prenom={user?.prenom} size={40} />
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>
                      {user?.prenom} {user?.nom}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                      {user?.email}
                    </div>
                    {user?.role && (
                      <div style={{ marginTop: '4px' }}>
                        <RoleBadge role={user.role} />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ padding: '8px' }}>
                {/* Lien Mon profil */}
                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    const profileRoutes: Record<string, string> = {
                      admin:            '/admin/profil',
                      responsable_club: '/responsable/profil',
                      coach:            '/coach/profil',
                      commissaire:      '/commissaire/profil',
                      journaliste:      '/journaliste/profil',
                    };
                    const route = profileRoutes[user?.role ?? ''] ?? '/admin/profil';
                    navigate(route);
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    color: '#334155',
                    fontSize: '13px',
                    fontWeight: 600,
                    transition: 'background 0.15s ease',
                    marginBottom: '2px',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#f1f5f9')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                >
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '7px',
                    background: 'rgba(27,67,50,0.08)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <User size={14} style={{ color: '#1B4332' }} />
                  </div>
                  Mon profil
                </button>

                {/* Séparateur */}
                <div style={{ height: '1px', background: '#f1f5f9', margin: '4px 0' }} />

                <button
                  onClick={handleLogout}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    color: '#C8102E',
                    fontSize: '13px',
                    fontWeight: 600,
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#fef2f2')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                >
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '7px',
                    background: 'rgba(200,16,46,0.08)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <LogOut size={14} style={{ color: '#C8102E' }} />
                  </div>
                  {t('header.logout')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};