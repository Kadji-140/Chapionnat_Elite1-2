// src/components/layout/ResponsableLayout.tsx
// Layout pour le responsable de club

import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

const getBreadcrumb = (pathname: string) => {
  const map: Record<string, { label: string; href?: string }[]> = {
    '/responsable/dashboard': [{ label: 'Dashboard' }],
    '/responsable/mon-club':  [{ label: 'Mon Club' }],
    '/responsable/effectif':  [{ label: 'Effectif' }],
    '/responsable/coachs':    [{ label: 'Coachs' }],
  };
  return map[pathname] ?? [];
};

const SIDEBAR_COLLAPSED_KEY = 'fecafoot_responsable_sidebar_collapsed';

const ResponsableLayout: React.FC = () => {
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

export default ResponsableLayout;
