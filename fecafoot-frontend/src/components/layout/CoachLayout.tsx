// src/components/layout/CoachLayout.tsx
// Layout principal pour toutes les pages coach (Sidebar + Header + contenu)

import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

// Mappe les routes vers des breadcrumbs lisibles
const getBreadcrumb = (pathname: string) => {
  const map: Record<string, { label: string; href?: string }[]> = {
    '/coach/dashboard': [{ label: 'Dashboard' }],
    '/coach/matchs':    [{ label: 'Mes Matchs' }],
    '/coach/classement': [{ label: 'Compétitions', href: '/coach/classement' }, { label: 'Classement' }],
    '/coach/statistiques/buteurs': [{ label: 'Compétitions', href: '/coach/classement' }, { label: 'Meilleurs Buteurs' }],
    '/coach/statistiques/passeurs': [{ label: 'Compétitions', href: '/coach/classement' }, { label: 'Meilleurs Passeurs' }],
    '/coach/mon-equipe': [{ label: 'Mon Équipe' }],
    '/coach/contestations': [{ label: 'Matchs & Compositions', href: '/coach/matchs' }, { label: 'Contestations' }],
    '/coach/actualites': [{ label: 'Média & Presse' }, { label: 'Actualités' }],
  };

  if (map[pathname]) return map[pathname];

  // Match /coach/matchs/:id/composition
  if (pathname.match(/^\/coach\/matchs\/\d+\/composition/)) {
    return [{ label: 'Mes Matchs', href: '/coach/matchs' }, { label: 'Saisie Composition' }];
  }

  // Match /coach/matchs/:id
  if (pathname.match(/^\/coach\/matchs\/\d+$/)) {
    return [{ label: 'Mes Matchs', href: '/coach/matchs' }, { label: 'Détail du Match' }];
  }

  return [];
};

const SIDEBAR_COLLAPSED_KEY = 'fecafoot_coach_sidebar_collapsed';

const CoachLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true'; } catch { return false; }
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const breadcrumb = getBreadcrumb(location.pathname);

  const handleToggle = () => {
    setCollapsed(prev => {
      const next = !prev;
      try { localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next)); } catch {}
      return next;
    });
  };

  const sidebarWidth = collapsed ? 72 : 256;

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <Sidebar
        collapsed={collapsed}
        onToggle={handleToggle}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* Main */}
      <div
        className="main-content"
        style={{ marginLeft: `${sidebarWidth}px`, transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}
      >
        <Header
          breadcrumb={breadcrumb}
          onMobileMenuToggle={() => setMobileOpen(true)}
        />
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default CoachLayout;
