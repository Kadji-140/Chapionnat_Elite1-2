// src/components/layout/JournalisteLayout.tsx
import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

const getBreadcrumb = (pathname: string) => {
  const map: Record<string, { label: string; href?: string }[]> = {
    '/journaliste/articles': [{ label: 'Mes articles' }],
    '/journaliste/actualites': [{ label: 'Actualités FECAFOOT' }],
  };

  if (map[pathname]) return map[pathname];
  return [];
};

const SIDEBAR_COLLAPSED_KEY = 'fecafoot_journaliste_sidebar_collapsed';

const JournalisteLayout: React.FC = () => {
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
        style={{
          marginLeft: `${sidebarWidth}px`,
          transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
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

export default JournalisteLayout;
