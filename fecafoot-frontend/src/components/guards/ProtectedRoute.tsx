import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

interface Props {
    children: React.ReactNode;
    roles?: string[];
}

export function ProtectedRoute({ children, roles }: Props) {
    const { isAuthenticated, user } = useAuthStore();
    const location = useLocation();

    // Non connecté → login
    if (!isAuthenticated || !user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Première connexion → forcer changement mdp
    if (user.premiere_connexion && location.pathname !== '/changer-mot-de-passe') {
        return <Navigate to="/changer-mot-de-passe" replace />;
    }

    // Rôle non autorisé
    if (roles && !roles.includes(user.role)) {
        return <Navigate to="/non-autorise" replace />;
    }

    return <>{children}</>;
}