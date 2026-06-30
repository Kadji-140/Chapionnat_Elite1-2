// src/components/layout/Sidebar.tsx
// Sidebar FECAFOOT — 5 grands menus accordéon collapsibles + sidebar réductible

import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Shield, Users, LayoutDashboard, Building2,
  Gavel, ChevronDown,
  LogOut, TrendingUp, Calendar,
  ArrowLeftRight, MapPin, Scale, Award,
  Newspaper, FileText, PanelLeftClose, PanelLeftOpen,
  Trophy, ClipboardCheck,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useTranslation } from '../../hooks/useTranslation';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { useNavigate } from 'react-router-dom';
import { ConfirmDialog } from '../ui/Modal';

// ── Assistant : Traduction des libellés de menus ────────────────
const getTranslationKey = (label: string): string => {
  const map: Record<string, string> = {
    'Dashboard': 'sidebar.dashboard',
    'Clubs & Utilisateurs': 'sidebar.clubs_divisions',
    'Clubs': 'sidebar.clubs_divisions',
    'Utilisateurs': 'sidebar.gerer_utilisateurs',
    'Arbitres': 'sidebar.arbitres',
    'Validation licences': 'sidebar.license_validation',
    "Journal d'audit": 'sidebar.audit_log',
    'Compétition': 'sidebar.seasons_phases',
    'Saisons': 'sidebar.seasons_phases',
    'Calendrier': 'sidebar.schedule_matches',
    'Affectation officiels': 'sidebar.match_management',
    'Stades': 'sidebar.stades',
    'Résultats & Sanctions': 'sidebar.resultats',
    'Homologations': 'sidebar.homologations',
    'Litiges & Plaintes': 'sidebar.contestations',
    'Classements': 'sidebar.classement',
    'Classement': 'sidebar.classement',
    'Playoffs': 'sidebar.playoffs',
    'Mercato & Presse': 'sidebar.mercato',
    'Transferts': 'sidebar.transferts',
    'Modération articles': 'sidebar.my_articles',
    'Actualités': 'sidebar.news_media',
    'Mon club': 'sidebar.my_club_roster',
    'Effectif': 'sidebar.my_club_roster',
    'Saison en cours': 'sidebar.schedule_matches',
    'Mes matchs': 'sidebar.my_matches',
    'Mes Matchs': 'sidebar.my_matches',
    'Contestations': 'sidebar.disputes_complaints',
    'Mon équipe': 'sidebar.my_club_roster',
    'Mes articles': 'sidebar.my_articles',
  };
  return map[label] || label;
};

// ── Types ──────────────────────────────────────────────────────
interface SubItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  isNew?: boolean;
}

interface MenuGroup {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  href?: string; // si c'est un lien direct sans sous-menu
  children?: SubItem[];
}

// ── Structure menus admin — 5 groupes ──────────────────────────
const ADMIN_MENUS: MenuGroup[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    href: '/admin/dashboard',
  },
  {
    id: 'clubs',
    label: 'Clubs & Utilisateurs',
    icon: Building2,
    children: [
      { label: 'Clubs', href: '/admin/clubs', icon: Building2 },
      { label: 'Utilisateurs', href: '/admin/users', icon: Users },
      { label: 'Arbitres', href: '/admin/arbitres', icon: Gavel },
      { label: 'Validation licences', href: '/admin/joueurs/validation', icon: ClipboardCheck, isNew: false },
      { label: "Journal d'audit", href: '/admin/audit-logs', icon: Shield, isNew: false },
    ],
  },
  {
    id: 'competition',
    label: 'Compétition',
    icon: Trophy,
    children: [
      { label: 'Saisons', href: '/admin/saisons', icon: Calendar, isNew: true },
      { label: 'Calendrier', href: '/admin/calendrier', icon: Calendar },
      { label: 'Affectation officiels', href: '/admin/matchs/affectations', icon: Shield },
      { label: 'Stades', href: '/admin/stades', icon: MapPin },
    ],
  },
  {
    id: 'resultats',
    label: 'Résultats & Sanctions',
    icon: Award,
    children: [
      { label: 'Homologations', href: '/admin/matchs/homologation', icon: Award },
      { label: 'Litiges & Plaintes', href: '/admin/contestations', icon: Scale },
      { label: 'Classements', href: '/admin/classement', icon: TrendingUp },
      { label: 'Playoffs', href: '/admin/playoffs', icon: Trophy },
    ],
  },
  {
    id: 'mercato',
    label: 'Mercato & Presse',
    icon: Newspaper,
    children: [
      { label: 'Transferts', href: '/admin/transferts', icon: ArrowLeftRight },
      { label: 'Modération articles', href: '/admin/articles', icon: FileText },
      { label: 'Actualités', href: '/admin/actualites', icon: Newspaper },
    ],
  },
];

// Menus pour les autres rôles (structure simple, pas d'accordéon)
interface SimpleMenu {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
}
function getSimpleMenus(role: string): SimpleMenu[] {
  if (role === 'responsable_club') return [
    { label: 'Dashboard', href: '/responsable/dashboard', icon: LayoutDashboard },
    { label: 'Mon club', href: '/responsable/mon-club', icon: Building2 },
    { label: 'Effectif', href: '/responsable/effectif', icon: Users },
    { label: 'Transferts', href: '/responsable/transferts', icon: ArrowLeftRight },
    { label: 'Saison en cours', href: '/responsable/saison', icon: Calendar },
    { label: 'Classement', href: '/responsable/classement', icon: TrendingUp },
    { label: 'Actualités', href: '/responsable/actualites', icon: Newspaper },
  ];
  if (role === 'coach') return [
    { label: 'Dashboard', href: '/coach/dashboard', icon: LayoutDashboard },
    { label: 'Mes matchs', href: '/coach/matchs', icon: Calendar },
    { label: 'Contestations', href: '/coach/contestations', icon: Scale },
    { label: 'Classement', href: '/coach/classement', icon: TrendingUp },
    { label: 'Mon équipe', href: '/coach/mon-equipe', icon: Users },
    { label: 'Actualités', href: '/coach/actualites', icon: Newspaper },
  ];
  if (role === 'commissaire') return [
    { label: 'Dashboard', href: '/commissaire/dashboard', icon: LayoutDashboard },
    { label: 'Mes Matchs', href: '/commissaire/matchs', icon: Calendar },
    { label: 'Actualités', href: '/commissaire/actualites', icon: Newspaper },
  ];
  if (role === 'journaliste') return [
    { label: 'Dashboard', href: '/journaliste/dashboard', icon: LayoutDashboard },
    { label: 'Mes articles', href: '/journaliste/articles', icon: FileText },
    { label: 'Actualités', href: '/journaliste/actualites', icon: Newspaper },
  ];
  return [];
}

// ── Détecte si un groupe contient la route active ──────────────
function groupIsActive(group: MenuGroup, pathname: string): boolean {
  if (group.href) return pathname === group.href;
  return group.children?.some(c =>
    pathname === c.href || pathname.startsWith(c.href + '/')
  ) ?? false;
}

// ── Logo ──────────────────────────────────────────────────────
const Logo: React.FC<{ collapsed: boolean }> = ({ collapsed }) => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: collapsed ? 0 : '11px', overflow: 'hidden' }}>
      <div style={{
        width: '38px', height: '38px', flexShrink: 0,
        background: 'linear-gradient(135deg, #FFB800 0%, #E6A500 100%)',
        borderRadius: '10px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 3px 12px rgba(255,184,0,0.35)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: '50%', bottom: '50%',
          background: 'rgba(255,255,255,0.22)', borderRadius: '10px 0 0 0',
        }} />
        <Shield size={18} style={{ color: '#1B4332', position: 'relative', zIndex: 1 }} />
      </div>
      <div style={{
        opacity: collapsed ? 0 : 1,
        transform: collapsed ? 'translateX(-6px)' : 'none',
        transition: 'all 0.25s ease',
        whiteSpace: 'nowrap', pointerEvents: collapsed ? 'none' : 'auto',
      }}>
        <div style={{ fontWeight: 900, fontSize: '14px', color: '#FFB800', letterSpacing: '-0.2px', lineHeight: 1.1 }}>
          FECAFOOT
        </div>
        {isAdmin && (
          <div style={{ fontSize: '8.5px', color: 'rgba(255,255,255,0.4)', letterSpacing: '1.6px', fontWeight: 600, textTransform: 'uppercase', marginTop: '1px' }}>
            Admin Pro
          </div>
        )}
      </div>
    </div>
  );
};

// ── Sidebar principale ─────────────────────────────────────────
interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed, onToggle, mobileOpen, onMobileClose,
}) => {
  const { user, logout } = useAuthStore();
  const { t, lang } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Groupes ouverts (accordéon) — par défaut ouvre le groupe actif
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    ADMIN_MENUS.forEach(g => {
      if (groupIsActive(g, location.pathname)) initial.add(g.id);
    });
    return initial;
  });

  // Fermer tous les accordéons quand sidebar se referme
  useEffect(() => {
    if (collapsed) setOpenGroups(new Set());
  }, [collapsed]);

  const toggleGroup = (id: string) => {
    if (collapsed) {
      // Si collapsed, on ouvre d'abord la sidebar
      onToggle();
      setTimeout(() => {
        setOpenGroups(new Set([id]));
      }, 350);
      return;
    }
    setOpenGroups(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    try { await api.post('/auth/logout'); } catch { }
    finally {
      setIsLoggingOut(false);
      setShowLogoutConfirm(false);
    }
    logout();
    toast.success('Déconnexion réussie');
    navigate('/login');
  };

  const sidebarW = collapsed ? 72 : 256;
  const isAdmin = user?.role === 'admin';
  const simpleMenus = !isAdmin ? getSimpleMenus(user?.role ?? '') : [];

  return (
    <>
      {mobileOpen && (
        <div className="animate-fade-in" style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(4px)', zIndex: 39,
        }} onClick={onMobileClose} />
      )}

      <aside
        className={`sidebar ${mobileOpen ? 'open' : ''}`}
        style={{
          width: `${sidebarW}px`,
          minHeight: '100vh',
          background: 'linear-gradient(170deg, #0A2218 0%, #1B4332 45%, #122B22 80%, #0F1C2E 100%)',
          display: 'flex', flexDirection: 'column',
          position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 40,
          transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'hidden',
          boxShadow: '4px 0 30px rgba(0,0,0,0.25)',
        }}
      >
        {/* Lueur décorative */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
          background: `
            radial-gradient(ellipse at 15% 15%, rgba(255,184,0,0.07) 0%, transparent 55%),
            radial-gradient(ellipse at 85% 85%, rgba(200,16,46,0.07) 0%, transparent 55%)
          `,
        }} />

        {/* Barre tricolore top */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
          background: 'linear-gradient(90deg, #1B4332 33%, #C8102E 33% 66%, #FFB800 66%)',
          zIndex: 2,
        }} />

        {/* ── Logo + bouton toggle ─────────────────────────── */}
        <div style={{
          padding: collapsed ? '20px 16px 16px' : '20px 16px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          position: 'relative', zIndex: 1, flexShrink: 0,
        }}>
          <Logo collapsed={collapsed} />
          <button
            onClick={onToggle}
            title={collapsed ? 'Ouvrir le menu' : 'Réduire'}
            style={{
              background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.09)',
              borderRadius: '7px', padding: '5px', cursor: 'pointer',
              color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center',
              flexShrink: 0, marginLeft: collapsed ? 'auto' : '6px',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.14)'; e.currentTarget.style.color = 'white'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
          >
            {collapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
          </button>
        </div>

        {/* Filet or */}
        <div style={{ height: '1px', margin: '0 14px', background: 'linear-gradient(90deg, transparent, rgba(255,184,0,0.2), transparent)', flexShrink: 0 }} />

        {/* ── Navigation ───────────────────────────────────── */}
        <nav style={{
          flex: 1, padding: '10px 8px',
          overflowY: 'auto', overflowX: 'hidden',
          position: 'relative', zIndex: 1,
        }}>

          {/* ── Menus admin avec accordéon ── */}
          {isAdmin && ADMIN_MENUS.map(group => {
            const isGroupActive = groupIsActive(group, location.pathname);
            const isOpen = openGroups.has(group.id);
            const Icon = group.icon;
            const isDirect = !group.children; // Dashboard

            // Item direct (Dashboard)
            if (isDirect && group.href) {
              const active = location.pathname === group.href;
              return (
                <NavLink
                  key={group.id}
                  to={group.href}
                  onClick={onMobileClose}
                  title={collapsed ? t(getTranslationKey(group.label)) : undefined}
                  style={{
                    display: 'flex', alignItems: 'center',
                    gap: collapsed ? 0 : '10px',
                    padding: collapsed ? '10px' : '10px 10px',
                    borderRadius: '10px',
                    background: active ? 'linear-gradient(135deg, rgba(255,184,0,0.16), rgba(255,184,0,0.06))' : 'transparent',
                    border: active ? '1px solid rgba(255,184,0,0.18)' : '1px solid transparent',
                    textDecoration: 'none', marginBottom: '3px',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    transition: 'all 0.18s ease', position: 'relative',
                  }}
                  onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.border = '1px solid rgba(255,255,255,0.07)'; } }}
                  onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.border = '1px solid transparent'; } }}
                >
                  {active && (
                    <div style={{
                      position: 'absolute', left: 0, top: '18%', bottom: '18%',
                      width: '3px', borderRadius: '0 3px 3px 0',
                      background: 'linear-gradient(180deg, #FFB800, #E6A500)',
                    }} />
                  )}
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: active ? 'rgba(255,184,0,0.18)' : 'rgba(255,255,255,0.05)',
                    transition: 'all 0.18s',
                  }}>
                    <Icon size={15} style={{ color: active ? '#FFB800' : 'rgba(255,255,255,0.6)' }} />
                  </div>
                  <span style={{
                    flex: 1, fontSize: '13px', fontWeight: active ? 700 : 500,
                    color: active ? 'white' : 'rgba(255,255,255,0.7)',
                    opacity: collapsed ? 0 : 1, maxWidth: collapsed ? 0 : '160px',
                    overflow: 'hidden', whiteSpace: 'nowrap', transition: 'all 0.25s',
                  }}>
                    {t(getTranslationKey(group.label))}
                  </span>
                </NavLink>
              );
            }

            // Groupe accordéon avec sous-menus
            return (
              <div key={group.id} style={{ marginBottom: '2px' }}>

                {/* Bouton groupe */}
                <button
                  onClick={() => toggleGroup(group.id)}
                  title={collapsed ? t(getTranslationKey(group.label)) : undefined}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center',
                    gap: collapsed ? 0 : '10px',
                    padding: collapsed ? '10px' : '10px 10px',
                    borderRadius: '10px', border: 'none', cursor: 'pointer',
                    background: isGroupActive
                      ? 'linear-gradient(135deg, rgba(255,184,0,0.14), rgba(255,184,0,0.05))'
                      : isOpen ? 'rgba(255,255,255,0.05)' : 'transparent',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    transition: 'all 0.18s ease', position: 'relative',
                  }}
                  onMouseEnter={e => { if (!isGroupActive && !isOpen) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                  onMouseLeave={e => { if (!isGroupActive && !isOpen) e.currentTarget.style.background = 'transparent'; }}
                >
                  {isGroupActive && (
                    <div style={{
                      position: 'absolute', left: 0, top: '18%', bottom: '18%',
                      width: '3px', borderRadius: '0 3px 3px 0',
                      background: 'linear-gradient(180deg, #FFB800, #E6A500)',
                    }} />
                  )}

                  {/* Icône du groupe */}
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: isGroupActive
                      ? 'rgba(255,184,0,0.18)'
                      : isOpen ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.05)',
                    transition: 'all 0.18s',
                  }}>
                    <Icon size={15} style={{
                      color: isGroupActive ? '#FFB800' : isOpen ? 'white' : 'rgba(255,255,255,0.6)',
                    }} />
                  </div>

                  {/* Label */}
                  <span style={{
                    flex: 1, fontSize: '13px', textAlign: 'left',
                    fontWeight: isGroupActive || isOpen ? 700 : 500,
                    color: isGroupActive ? 'white' : isOpen ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.65)',
                    opacity: collapsed ? 0 : 1, maxWidth: collapsed ? 0 : '140px',
                    overflow: 'hidden', whiteSpace: 'nowrap', transition: 'all 0.25s',
                  }}>
                    {t(getTranslationKey(group.label))}
                  </span>

                  {/* Chevron */}
                  {!collapsed && (
                    <ChevronDown
                      size={13}
                      style={{
                        color: 'rgba(255,255,255,0.3)',
                        transform: isOpen ? 'rotate(180deg)' : 'none',
                        transition: 'transform 0.25s ease',
                        flexShrink: 0,
                      }}
                    />
                  )}
                </button>

                {/* Sous-menus — accordéon animé */}
                <div style={{
                  overflow: 'hidden',
                  maxHeight: isOpen && !collapsed ? `${(group.children?.length ?? 0) * 42}px` : '0px',
                  transition: 'max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  opacity: isOpen && !collapsed ? 1 : 0,
                  transformOrigin: 'top',
                }}>
                  <div style={{ padding: '4px 0 4px 10px' }}>
                    {/* Ligne verticale connecteur */}
                    <div style={{ position: 'relative' }}>
                      <div style={{
                        position: 'absolute', left: '14px', top: '4px', bottom: '4px',
                        width: '1.5px',
                        background: 'linear-gradient(180deg, rgba(255,184,0,0.3), rgba(255,184,0,0.05))',
                        borderRadius: '1px',
                      }} />

                      {group.children?.map(child => {
                        const childActive = location.pathname === child.href ||
                          location.pathname.startsWith(child.href + '/');
                        const CIcon = child.icon;
                        return (
                          <NavLink
                            key={child.href}
                            to={child.href}
                            onClick={onMobileClose}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '8px',
                              padding: '7px 8px 7px 30px',
                              borderRadius: '8px', textDecoration: 'none',
                              background: childActive ? 'rgba(255,184,0,0.12)' : 'transparent',
                              marginBottom: '2px',
                              transition: 'all 0.15s ease', position: 'relative',
                            }}
                            onMouseEnter={e => { if (!childActive) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                            onMouseLeave={e => { if (!childActive) e.currentTarget.style.background = 'transparent'; }}
                          >
                            {/* Point connecteur */}
                            <div style={{
                              position: 'absolute', left: '12px',
                              width: '5px', height: '5px', borderRadius: '50%',
                              background: childActive ? '#FFB800' : 'rgba(255,255,255,0.25)',
                              border: childActive ? '1.5px solid rgba(255,184,0,0.4)' : 'none',
                              transition: 'all 0.15s',
                            }} />

                            <CIcon size={13} style={{
                              color: childActive ? '#FFB800' : 'rgba(255,255,255,0.5)',
                              flexShrink: 0,
                            }} />
                            <span style={{
                              fontSize: '12.5px', fontWeight: childActive ? 700 : 400,
                              color: childActive ? 'white' : 'rgba(255,255,255,0.6)',
                              whiteSpace: 'nowrap', overflow: 'hidden', flex: 1,
                            }}>
                              {t(getTranslationKey(child.label))}
                            </span>
                            {child.isNew && (
                              <span style={{
                                fontSize: '8.5px', fontWeight: 700, color: '#15803d',
                                background: '#dcfce7', padding: '1px 5px', borderRadius: '999px',
                              }}>NEW</span>
                            )}
                          </NavLink>
                        );
                      })}
                    </div>
                  </div>
                </div>

              </div>
            );
          })}

          {/* ── Menus non-admin (liste simple) ── */}
          {!isAdmin && simpleMenus.map(item => {
            const active = location.pathname === item.href || location.pathname.startsWith(item.href + '/');
            const Icon = item.icon;
            return (
              <NavLink
                key={item.href}
                to={item.href}
                onClick={onMobileClose}
                title={collapsed ? t(getTranslationKey(item.label)) : undefined}
                style={{
                  display: 'flex', alignItems: 'center', gap: collapsed ? 0 : '10px',
                  padding: collapsed ? '10px' : '9px 10px', borderRadius: '10px',
                  background: active ? 'linear-gradient(135deg, rgba(255,184,0,0.16), rgba(255,184,0,0.06))' : 'transparent',
                  border: active ? '1px solid rgba(255,184,0,0.18)' : '1px solid transparent',
                  textDecoration: 'none', marginBottom: '2px',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  transition: 'all 0.18s ease', position: 'relative',
                }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; } }}
              >
                {active && <div style={{ position: 'absolute', left: 0, top: '18%', bottom: '18%', width: '3px', borderRadius: '0 3px 3px 0', background: 'linear-gradient(180deg, #FFB800, #E6A500)' }} />}
                <div style={{ width: '30px', height: '30px', borderRadius: '8px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: active ? 'rgba(255,184,0,0.18)' : 'rgba(255,255,255,0.05)' }}>
                  <Icon size={14} style={{ color: active ? '#FFB800' : 'rgba(255,255,255,0.6)' }} />
                </div>
                <span style={{ flex: 1, fontSize: '13px', fontWeight: active ? 700 : 500, color: active ? 'white' : 'rgba(255,255,255,0.7)', opacity: collapsed ? 0 : 1, maxWidth: collapsed ? 0 : '160px', overflow: 'hidden', whiteSpace: 'nowrap', transition: 'all 0.25s' }}>
                  {t(getTranslationKey(item.label))}
                </span>
              </NavLink>
            );
          })}
        </nav>

        {/* Filet bas */}
        <div style={{ height: '1px', margin: '0 14px', background: 'linear-gradient(90deg, transparent, rgba(255,184,0,0.12), transparent)', flexShrink: 0, position: 'relative', zIndex: 1 }} />

        {/* ── Footer utilisateur ───────────────────────────── */}
        <div style={{ padding: collapsed ? '12px 8px' : '12px 10px', position: 'relative', zIndex: 1, flexShrink: 0 }}>

          {/* Avatar + infos */}
          {!collapsed ? (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '9px',
              padding: '9px 10px', borderRadius: '11px',
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)',
              marginBottom: '7px',
            }}>
              <div style={{
                width: '32px', height: '32px', flexShrink: 0,
                background: 'linear-gradient(135deg, #FFB800, #E6A500)',
                borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '11px', fontWeight: 800, color: '#1B4332',
              }}>
                {(user?.prenom?.[0] ?? '').toUpperCase()}{(user?.nom?.[0] ?? '').toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.prenom} {user?.nom}
                </div>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '1px' }}>
                  {user?.email}
                </div>
              </div>
              <div style={{ width: '6px', height: '6px', background: '#22c55e', borderRadius: '50%', flexShrink: 0, boxShadow: '0 0 0 2px rgba(34,197,94,0.2)' }} />
            </div>
          ) : (
            <div style={{
              width: '38px', height: '38px', margin: '0 auto 7px',
              background: 'linear-gradient(135deg, #FFB800, #E6A500)',
              borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '11px', fontWeight: 800, color: '#1B4332',
            }}>
              {(user?.prenom?.[0] ?? '').toUpperCase()}{(user?.nom?.[0] ?? '').toUpperCase()}
            </div>
          )}

          {/* Déconnexion */}
          <button
            onClick={() => setShowLogoutConfirm(true)}
            title={collapsed ? t('header.logout') : undefined}
            style={{
              width: '100%', display: 'flex', alignItems: 'center',
              gap: collapsed ? 0 : '9px', justifyContent: collapsed ? 'center' : 'flex-start',
              padding: collapsed ? '9px' : '8px 10px',
              borderRadius: '9px', border: '1px solid rgba(200,16,46,0.18)',
              background: 'rgba(200,16,46,0.07)', cursor: 'pointer',
              color: '#fca5a5', fontSize: '12.5px', fontWeight: 600,
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(200,16,46,0.18)'; e.currentTarget.style.borderColor = 'rgba(200,16,46,0.32)'; e.currentTarget.style.color = '#fecaca'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(200,16,46,0.07)'; e.currentTarget.style.borderColor = 'rgba(200,16,46,0.18)'; e.currentTarget.style.color = '#fca5a5'; }}
          >
            <LogOut size={14} style={{ flexShrink: 0 }} />
            {!collapsed && <span>{t('header.logout')}</span>}
          </button>
        </div>
      </aside>

      <ConfirmDialog
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleConfirmLogout}
        title={t('header.logout')}
        message={lang === 'en' ? 'Are you sure you want to log out?' : 'Êtes-vous sûr de vouloir vous déconnecter ?'}
        confirmLabel={t('header.logout')}
        confirmVariant="danger"
        isLoading={isLoggingOut}
      />
    </>
  );
};