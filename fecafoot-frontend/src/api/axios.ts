
// src/api/axios.ts
// Instance Axios centrale — ajoute automatiquement le token Bearer

import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

// Intercepteur requête : ajoute le token Authorization automatiquement
api.interceptors.request.use((config) => {
    const token = useAuthStore.getState().token;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Intercepteur réponse : gère les 401 (token expiré)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            console.warn('Session expirée (401), déconnexion automatique.');
            useAuthStore.getState().logout();
        }
        return Promise.reject(error);
    }
);





export default api;