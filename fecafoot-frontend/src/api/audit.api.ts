// src/api/audit.api.ts
import api from './axios';

export interface AuditLog {
  id: number;
  user_id: number;
  user?: {
    id: number;
    nom: string;
    prenom: string;
    email: string;
    role: string;
  };
  action: string;
  entite_concernee: string;
  entite_id: number | null;
  anciennes_valeurs: any;
  nouvelles_valeurs: any;
  ip_address: string | null;
  user_agent: string | null;
  timestamp: string;
  created_at: string;
}

export interface AuditFilters {
  action?: string;
  entite_concernee?: string;
  user_id?: string;
  search?: string;
  page?: number;
  per_page?: number;
}

export const getAuditLogs = async (filters: AuditFilters = {}) => {
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== undefined && v !== '')
  );
  const res = await api.get('/admin/audit-logs', { params });
  return res.data;
};
