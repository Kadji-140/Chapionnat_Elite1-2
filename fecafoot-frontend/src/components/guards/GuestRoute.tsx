import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export function GuestRoute({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, user } = useAuthStore();
    const getDashboardRoute = useAuthStore((s) => s.getDashboardRoute);

    if (isAuthenticated && user && !user.premiere_connexion) {
        return <Navigate to={getDashboardRoute()} replace />;
    }

    return <>{children}</>;
}