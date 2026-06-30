// src/components/layout/AdminLayout.tsx
// Layout principal — sidebar collapsible, header, contenu

import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

const getBreadcrumb = (pathname: string) => {
  const map: Record<string, { label: string; href?: string }[]> = {
    '/admin/dashboard':           [{ label: 'Dashboard' }],
    '/admin/profil':              [{ label: 'Mon profil' }],
    '/admin/clubs':               [{ label: 'Clubs' }],
    '/admin/users':               [{ label: 'Utilisateurs' }],
    '/admin/users/new':           [{ label: 'Utilisateurs', href: '/admin/users' }, { label: 'Nouveau compte' }],
    '/admin/arbitres':            [{ label: 'Arbitres' }],
    '/admin/joueurs/validation':  [{ label: 'Validation des licences' }],
    '/admin/saisons':             [{ label: 'Saisons' }],
    '/admin/calendrier':          [{ label: 'Calendrier' }],
    '/admin/transferts':          [{ label: 'Transferts' }],
    '/admin/contestations':       [{ label: 'Litiges & Contestations' }],
    '/admin/classement':          [{ label: 'Classements' }],
    '/admin/actualites':          [{ label: 'Actualités' }],
    '/admin/articles':            [{ label: 'Articles' }],
  };

  if (map[pathname]) return map[pathname];
  if (pathname.match(/^\/admin\/clubs\/\d+/)) {
    return [{ label: 'Clubs', href: '/admin/clubs' }, { label: 'Détail du club' }];
  }
  if (pathname.match(/^\/admin\/matchs\//)) {
    return [{ label: 'Matchs' }];
  }
  return [];
};

const SIDEBAR_COLLAPSED_KEY = 'fecafoot_sidebar_collapsed';

const AdminLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true';
    } catch {
      return false;
    }
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

export default AdminLayout;
