// src/components/layout/CommissaireLayout.tsx
import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

const getBreadcrumb = (pathname: string) => {
  const map: Record<string, { label: string; href?: string }[]> = {
    '/commissaire/matchs': [{ label: 'Espace Commissaire' }],
  };

  if (map[pathname]) return map[pathname];

  if (pathname.match(/^\/commissaire\/live\/\d+$/)) {
    return [{ label: 'Espace Commissaire', href: '/commissaire/matchs' }, { label: 'Direct Live' }];
  }
  if (pathname.match(/^\/commissaire\/live\/\d+\/rapport/)) {
    return [{ label: 'Espace Commissaire', href: '/commissaire/matchs' }, { label: 'Rapport de Match' }];
  }

  return [];
};

const SIDEBAR_COLLAPSED_KEY = 'fecafoot_commissaire_sidebar_collapsed';

const CommissaireLayout: React.FC = () => {
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
      <Sidebar
        collapsed={collapsed}
        onToggle={handleToggle}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
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

export default CommissaireLayout;
