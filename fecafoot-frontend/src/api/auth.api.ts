import api from './axios';
import type { AuthUser } from '../store/authStore';

export interface LoginPayload {
    email: string;
    password: string;
}

export interface LoginResponse {
    success: boolean;
    message: string;
    token: string;
    token_type: string;
    premiere_connexion: boolean;
    user: AuthUser;
}

export interface ChangePasswordPayload {
    ancien_password: string;
    nouveau_password: string;
    nouveau_password_confirmation: string;
}

export interface ForgotPasswordPayload {
    email: string;
}

export interface ResetPasswordPayload {
    token: string;
    email: string;
    password: string;
    password_confirmation: string;
}

// Login
export const loginApi = async (payload: LoginPayload): Promise<LoginResponse> => {
    const { data } = await api.post<LoginResponse>('/auth/login', payload);
    return data;
};

// Logout
export const logoutApi = async (): Promise<void> => {
    await api.post('/auth/logout');
};

// Utilisateur courant
export const getMeApi = async (): Promise<AuthUser> => {
    const { data } = await api.get<{ success: boolean; user: AuthUser }>('/auth/me');
    return data.user;
};

// Changer mot de passe
export const changePasswordApi = async (payload: ChangePasswordPayload) => {
    const { data } = await api.post('/auth/change-password', payload);
    return data;
};

// Mot de passe oublié → envoie un email avec lien reset
export const forgotPasswordApi = async (payload: ForgotPasswordPayload) => {
    const { data } = await api.post('/auth/forgot-password', payload);
    return data;
};

// Réinitialiser le mot de passe avec le token reçu par email
export const resetPasswordApi = async (payload: ResetPasswordPayload) => {
    const { data } = await api.post('/auth/reset-password', payload);
    return data;
}