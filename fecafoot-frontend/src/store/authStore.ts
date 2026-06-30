import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UserClub {
    id: number;
    nom: string;
    logo_url: string | null;
    division: string;
}

export interface UserPermissions {
    gerer_clubs?: boolean;
    gerer_saisons?: boolean;
    gerer_matchs?: boolean;
    gerer_transferts?: boolean;
    valider_joueurs?: boolean;
    gerer_utilisateurs?: boolean;
    voir_audit_logs?: boolean;
    valider_articles?: boolean;
    appliquer_penalites?: boolean;
    gerer_effectif?: boolean;
    gerer_coach?: boolean;
    initier_transfert?: boolean;
    saisir_composition?: boolean;
    contester_evenement?: boolean;
    voir_scouting?: boolean;
    saisir_evenements?: boolean;
    gerer_match_live?: boolean;
    soumettre_rapport?: boolean;
    rediger_articles?: boolean;
    [key: string]: boolean | undefined;
}

export interface AuthUser {
    id: number;
    nom: string;
    prenom: string;
    email: string;
    role: 'admin' | 'responsable_club' | 'coach' | 'commissaire' | 'journaliste';
    acces_actif: boolean;
    premiere_connexion: boolean;
    club: UserClub | null;
    permissions: UserPermissions;
}

interface AuthState {
    token: string | null;
    user: AuthUser | null;
    isAuthenticated: boolean;

    setAuth: (token: string, user: AuthUser) => void;
    setUser: (user: AuthUser) => void;
    logout: () => void;
    hasPermission: (permission: string) => boolean;
    getDashboardRoute: () => string;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            token: null,
            user: null,
            isAuthenticated: false,

            setAuth: (token, user) =>
                set({ token, user, isAuthenticated: true }),

            setUser: (user) => set({ user }),

            logout: () =>
                set({ token: null, user: null, isAuthenticated: false }),

            hasPermission: (permission) => {
                const { user } = get();
                return user?.permissions?.[permission] === true;
            },

            // Redirige vers le bon dashboard selon le rôle
            getDashboardRoute: () => {
                const { user } = get();
                switch (user?.role) {
                    case 'admin': return '/admin/dashboard';
                    case 'responsable_club': return '/responsable/dashboard';
                    case 'coach': return '/coach/dashboard';
                    case 'commissaire': return '/commissaire/matchs';
                    case 'journaliste': return '/journaliste/articles';
                    default: return '/login';
                }
            },
        }),
        {
            name: 'fecafoot-auth', // Clé localStorage
            partialize: (state) => ({
                token: state.token,
                user: state.user,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
);