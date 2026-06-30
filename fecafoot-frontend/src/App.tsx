import { RouterProvider, createBrowserRouter, createRoutesFromElements, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { TranslationProvider } from './hooks/useTranslation';

// ── Guards ──────────────────────────────────────────────────────
import { ProtectedRoute } from './components/guards/ProtectedRoute';
import { GuestRoute } from './components/guards/GuestRoute';

// ── Layouts ─────────────────────────────────────────────────────
import AdminLayout from './components/layout/AdminLayout';
import ResponsableLayout from './components/layout/ResponsableLayout';
import CoachLayout from './components/layout/CoachLayout';

// ── Pages Auth (déjà existantes) ────────────────────────────────
import LoginPage from './pages/auth/LoginPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import ChangePasswordPage from './pages/auth/ChangePasswordPage';
import { NotAuthorizedPage } from './pages/auth/NotAuthorizedPage';

// ── Pages Admin — Module 1 ───────────────────────────────────────
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProfilePage from './pages/admin/AdminProfilePage';
import ClubsListPage from './pages/admin/clubs/ClubsListPage';
import ClubDetailPage from './pages/admin/clubs/ClubDetailPage';
import UsersListPage from './pages/admin/users/UsersListPage';
import CreateUserPage from './pages/admin/users/CreateUserPage';
import ArbitresListPage from './pages/admin/arbitres/ArbitresListPage';
import JoueursValidationPage from './pages/admin/joueurs/JoueursValidationPage';

// ── Pages Admin — Module 2 ───────────────────────────────────────
import SaisonsListPage from './pages/admin/saisons/SaisonsListPage';
import SaisonDetailPage from './pages/admin/saisons/SaisonDetailPage';
import CompetitionConfigPage from './pages/admin/saisons/CompetitionConfigPage';
import PoulesAffectationPage from './pages/admin/saisons/PoulesAffectationPage';

// ── Pages Admin — Module 3 ───────────────────────────────────────
import CalendrierPage from './pages/admin/calendrier/CalendrierPage';
import AffectationsPage from './pages/admin/matchs/AffectationsPage';
import { MatchDetailPage } from './pages/admin/matchs/MatchDetailPage';
import StadesListPage from './pages/admin/stades/StadesListPage';

// ── Pages Responsable — Module 1 ─────────────────────────────────
import FirstLoginPage from './pages/responsable/FirstLoginPage';
import ResponsableDashboard from './pages/responsable/ResponsableDashboard';
import MonClubPage from './pages/responsable/MonClubPage';
import EffectifPage from './pages/responsable/EffectifPage';
import CoachsPage from './pages/responsable/CoachsPage';
import SaisonEnCoursPage from './pages/responsable/SaisonEnCoursPage';

// ── Pages Coach — Module 3 ───────────────────────────────────────
import CoachDashboardPage from './pages/coach/CoachDashboardPage';
import CoachMatchsPage from './pages/coach/CoachMatchsPage';
import CompositionPage from './pages/coach/CompositionPage';
import { MonEquipePage } from './pages/coach/MonEquipePage';

// ── Pages Module 4 — Live, Contestations & Homologations ──
import { CommissaireMatchsPage } from './pages/commissaire/CommissaireMatchsPage';
import { LiveMatchPage } from './pages/commissaire/LiveMatchPage';
import { RapportPage } from './pages/commissaire/RapportPage';
import { CoachContestationsPage } from './pages/coach/CoachContestationsPage';
import { ContestationsPage } from './pages/admin/contestations/ContestationsPage';
import { HomologationPage } from './pages/admin/homologation/HomologationPage';
import CommissaireLayout from './components/layout/CommissaireLayout';

// ── Pages Module 5 — Classement, Stats & Playoffs ────────
import { ClassementPage } from './pages/public/ClassementPage';
import { StatistiquesButeursPage } from './pages/public/StatistiquesButeursPage';
import { StatistiquesPasseursPage } from './pages/public/StatistiquesPasseursPage';
import { JoueurDetailPage } from './pages/public/JoueurDetailPage';
import { AdminClassementPage } from './pages/admin/classements/AdminClassementPage';
import { PlayoffsPage } from './pages/admin/PlayoffsPage';

// ── Pages Module 6 & 7 ───────────────────────────────────────────
import ResponsableTransfertsPage from './pages/responsable/ResponsableTransfertsPage';
import AdminTransfertsPage from './pages/admin/AdminTransfertsPage';
import ActualitesPage from './pages/public/ActualitesPage';
import JournalisteArticlesPage from './pages/journaliste/JournalisteArticlesPage';
import AdminArticlesPage from './pages/admin/AdminArticlesPage';
import JournalisteLayout from './components/layout/JournalisteLayout';

// ── Pages Dashboards & Audit logs (NEW) ──────────────────────────
import AuditLogsPage from './pages/admin/AuditLogsPage';
import { CommissaireDashboardPage } from './pages/commissaire/CommissaireDashboardPage';
import { JournalisteDashboardPage } from './pages/journaliste/JournalisteDashboardPage';
import FanDashboardPage from './pages/public/FanDashboardPage';
import NotificationsPage from './pages/NotificationsPage';


// ── QueryClient global ───────────────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      {/* ── Racine → redirection ──────────────────────────── */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* ── Pages publiques ─────────── */}
      <Route path="/fan" element={<FanDashboardPage />} />

      <Route path="/login" element={
        <GuestRoute><LoginPage /></GuestRoute>
      } />
      <Route path="/mot-de-passe-oublie" element={
        <GuestRoute><ForgotPasswordPage /></GuestRoute>
      } />
      <Route path="/reinitialiser-mot-de-passe" element={
        <GuestRoute><ResetPasswordPage /></GuestRoute>
      } />

      {/* ── Changement MDP initiale (sans layout) ────────── */}
      <Route path="/changer-mot-de-passe" element={
        <ProtectedRoute><ChangePasswordPage /></ProtectedRoute>
      } />

      {/* ── Onboarding responsable (sans layout) ──────────── */}
      <Route path="/responsable/first-login" element={
        <ProtectedRoute roles={['responsable_club']}>
          <FirstLoginPage />
        </ProtectedRoute>
      } />

      {/* ════════════════════════════════════════════════════
          ADMIN — Modules 1, 2, 3
          ════════════════════════════════════════════════════ */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute roles={['admin']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        {/* Redirection /admin → /admin/dashboard */}
        <Route index element={<Navigate to="/admin/dashboard" replace />} />

        {/* Dashboard */}
        <Route path="dashboard" element={<AdminDashboard />} />

        {/* Module 1 — Clubs */}
        <Route path="clubs" element={<ClubsListPage />} />
        <Route path="clubs/:id" element={<ClubDetailPage />} />

        {/* Module 1 — Utilisateurs */}
        <Route path="users" element={<UsersListPage />} />
        <Route path="users/new" element={<CreateUserPage />} />

        {/* Module 1 — Arbitres */}
        <Route path="arbitres" element={<ArbitresListPage />} />

        {/* Module 1 — Licences joueurs */}
        <Route path="joueurs/validation" element={<JoueursValidationPage />} />

        {/* Module 2 — Saisons & Compétitions */}
        <Route path="saisons" element={<SaisonsListPage />} />
        <Route path="saisons/:id" element={<SaisonDetailPage />} />
        <Route path="saisons/:id/competitions/:competitionId" element={<CompetitionConfigPage />} />
        <Route path="saisons/:id/competitions/:competitionId/poules" element={<PoulesAffectationPage />} />

        {/* Module 3 — Calendrier & Officiels */}
        <Route path="calendrier" element={<CalendrierPage />} />
        <Route path="matchs/affectations" element={<AffectationsPage />} />
        <Route path="matchs/:id" element={<MatchDetailPage />} />
        <Route path="stades" element={<StadesListPage />} />

        {/* Module 4 — Homologation, pénalités et contestations */}
        <Route path="contestations" element={<ContestationsPage />} />
        <Route path="matchs/homologation" element={<HomologationPage />} />

        {/* Module 5 — Classement, Stats & Playoffs */}
        <Route path="classement" element={<AdminClassementPage />} />
        <Route path="playoffs" element={<PlayoffsPage />} />
        <Route path="statistiques/buteurs" element={<StatistiquesButeursPage />} />
        <Route path="statistiques/passeurs" element={<StatistiquesPasseursPage />} />
        <Route path="joueurs/:id" element={<JoueurDetailPage />} />
        <Route path="transferts" element={<AdminTransfertsPage />} />
        <Route path="articles" element={<AdminArticlesPage />} />
        <Route path="actualites" element={<ActualitesPage />} />
        <Route path="audit-logs" element={<AuditLogsPage />} />

        {/* Profil & Paramètres compte */}
        <Route path="profil" element={<AdminProfilePage />} />
        <Route path="notifications" element={<NotificationsPage />} />
      </Route>

      {/* ════════════════════════════════════════════════════
          RESPONSABLE DE CLUB — Module 1
          ════════════════════════════════════════════════════ */}
      <Route
        path="/responsable"
        element={
          <ProtectedRoute roles={['responsable_club']}>
            <ResponsableLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/responsable/dashboard" replace />} />

        {/* Dashboard responsable */}
        <Route path="dashboard" element={<ResponsableDashboard />} />

        {/* Mon club */}
        <Route path="mon-club" element={<MonClubPage />} />

        {/* Effectif */}
        <Route path="effectif" element={<EffectifPage />} />

        {/* Coachs */}
        <Route path="coachs" element={<CoachsPage />} />

        {/* Détails Match */}
        <Route path="matchs/:id" element={<MatchDetailPage />} />

        {/* Modules futurs */}
        <Route path="saison" element={<SaisonEnCoursPage />} />
        
        {/* Module 5 — Classement & Stats */}
        <Route path="classement" element={<ClassementPage />} />
        <Route path="statistiques/buteurs" element={<StatistiquesButeursPage />} />
        <Route path="statistiques/passeurs" element={<StatistiquesPasseursPage />} />
        <Route path="joueurs/:id" element={<JoueurDetailPage />} />
        <Route path="transferts" element={<ResponsableTransfertsPage />} />
        <Route path="actualites" element={<ActualitesPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
      </Route>

      {/* ════════════════════════════════════════════════════
          COACH — Module 3
          ════════════════════════════════════════════════════ */}
      <Route
        path="/coach"
        element={
          <ProtectedRoute roles={['coach']}>
            <CoachLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/coach/dashboard" replace />} />
        <Route path="dashboard" element={<CoachDashboardPage />} />
        <Route path="matchs" element={<CoachMatchsPage />} />
        <Route path="matchs/:id" element={<MatchDetailPage />} />
        <Route path="matchs/:id/composition" element={<CompositionPage />} />
        <Route path="mon-equipe" element={<MonEquipePage />} />
        <Route path="matchs/:id/live" element={<CoachContestationsPage />} />
        <Route path="contestations" element={<CoachContestationsPage />} />
        
        {/* Module 5 — Classement & Stats */}
        <Route path="classement" element={<ClassementPage />} />
        <Route path="statistiques/buteurs" element={<StatistiquesButeursPage />} />
        <Route path="statistiques/passeurs" element={<StatistiquesPasseursPage />} />
        <Route path="joueurs/:id" element={<JoueurDetailPage />} />
        <Route path="actualites" element={<ActualitesPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
      </Route>

      {/* ════════════════════════════════════════════════════
          COMMISSAIRE — Module 4
          ════════════════════════════════════════════════════ */}
      <Route
        path="/commissaire"
        element={
          <ProtectedRoute roles={['commissaire']}>
            <CommissaireLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/commissaire/dashboard" replace />} />
        <Route path="dashboard" element={<CommissaireDashboardPage />} />
        <Route path="matchs" element={<CommissaireMatchsPage />} />
        <Route path="live/:id" element={<LiveMatchPage />} />
        <Route path="live/:id/rapport" element={<RapportPage />} />
        <Route path="actualites" element={<ActualitesPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
      </Route>

      {/* ════════════════════════════════════════════════════
          JOURNALISTE — Module 7
          ════════════════════════════════════════════════════ */}
      <Route
        path="/journaliste"
        element={
          <ProtectedRoute roles={['journaliste']}>
            <JournalisteLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/journaliste/dashboard" replace />} />
        <Route path="dashboard" element={<JournalisteDashboardPage />} />
        <Route path="articles" element={<JournalisteArticlesPage />} />
        <Route path="actualites" element={<ActualitesPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
      </Route>

      {/* ── Erreurs ─────────────────────────────────────── */}
      <Route path="/non-autorise" element={<NotAuthorizedPage />} />

      <Route path="*" element={
        <div style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center',
          justifyContent: 'center', background: 'var(--bg)',
        }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: 'var(--accent)', fontSize: '80px', fontWeight: 900, lineHeight: 1 }}>404</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '18px', marginBottom: '24px' }}>Page introuvable</p>
            <a
              href="/login"
              className="btn btn-primary"
              style={{ display: 'inline-flex' }}
            >
              Retour à l'accueil
            </a>
          </div>
        </div>
      } />
    </>
  )
);

export default function App() {
  return (
    <TranslationProvider>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
  
        {/* ── Toaster (notifications) ─────────────────────────── */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#fff',
              color: 'var(--text)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              fontSize: '14px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
            },
            success: {
              iconTheme: { primary: '#15803d', secondary: '#f0fdf4' },
            },
            error: {
              iconTheme: { primary: 'var(--secondary)', secondary: '#fff1f2' },
            },
          }}
        />
      </QueryClientProvider>
    </TranslationProvider>
  );
}