// src/pages/admin/AuditLogsPage.tsx
// Page d'audit logs pour l'administrateur — Visualisation des modifications avec Diff JSON

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, ShieldAlert, Eye, Calendar, User, Terminal, Globe } from 'lucide-react';
import { getAuditLogs, type AuditFilters } from '../../api/audit.api';
import { Modal } from '../../components/ui/Modal';
import { SkeletonTable, EmptyState, Pagination } from '../../components/ui/DataTable';

// Badge pour l'action
const ActionBadge: React.FC<{ action: string }> = ({ action }) => {
  let bg = '#F3F4F6';
  let color = '#374151';
  let text = action;

  switch (action) {
    case 'create':
      bg = '#D1FAE5';
      color = '#065F46';
      text = 'Création';
      break;
    case 'update':
      bg = '#DBEAFE';
      color = '#1E40AF';
      text = 'Modification';
      break;
    case 'delete':
      bg = '#FEE2E2';
      color = '#991B1B';
      text = 'Suppression';
      break;
    case 'login':
      bg = '#FEF3C7';
      color = '#92400E';
      text = 'Connexion';
      break;
    case 'logout':
      bg = '#ECEFEE';
      color = '#4A5568';
      text = 'Déconnexion';
      break;
  }

  return (
    <span style={{
      padding: '3px 8px',
      borderRadius: '20px',
      fontSize: '11px',
      fontWeight: 700,
      background: bg,
      color: color,
      textTransform: 'uppercase',
    }}>
      {text}
    </span>
  );
};

// Formateur de valeurs JSON pour l'affichage diff
const ValueRenderer: React.FC<{ val: any }> = ({ val }) => {
  if (val === null || val === undefined) return <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>null</span>;
  if (typeof val === 'boolean') return <span style={{ color: '#d97706', fontWeight: 700 }}>{val ? 'Vrai' : 'Faux'}</span>;
  if (typeof val === 'object') return <pre style={{ margin: 0, fontSize: '11px', background: '#F8FAFC', padding: '4px', borderRadius: '4px', border: '1px solid #E2E8F0' }}>{JSON.stringify(val, null, 2)}</pre>;
  return <span>{String(val)}</span>;
};

export default function AuditLogsPage() {
  const [filters, setFilters] = useState<AuditFilters>({
    action: '',
    entite_concernee: '',
    search: '',
    page: 1,
    per_page: 15,
  });

  const [selectedLog, setSelectedLog] = useState<any | null>(null);

  const { data: responseData, isLoading, error } = useQuery({
    queryKey: ['audit-logs', filters],
    queryFn: () => getAuditLogs(filters),
  });

  const logs = responseData?.data ?? [];
  const meta = responseData?.meta ?? { total: 0, current_page: 1, last_page: 1, per_page: 15 };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(p => ({ ...p, search: e.target.value, page: 1 }));
  };

  const handleActionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters(p => ({ ...p, action: e.target.value, page: 1 }));
  };

  const handleEntityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters(p => ({ ...p, entite_concernee: e.target.value, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters(p => ({ ...p, page }));
  };

  return (
    <div className="animate-fade-in-up">
      {/* En-tête */}
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldAlert size={26} style={{ color: 'var(--primary)' }} />
            Journal d'Audit & Sécurité
          </h1>
          <p className="page-subtitle">
            Suivi en temps réel des actions sensibles des utilisateurs et des modifications système
          </p>
        </div>
      </div>

      {/* Barre de filtres */}
      <div className="filters-card" style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
        <div style={{ flex: '1 1 250px', position: 'relative' }}>
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }}>
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Rechercher par utilisateur, IP, action..."
            value={filters.search || ''}
            onChange={handleSearchChange}
            className="form-input"
            style={{ paddingLeft: '36px', width: '100%' }}
          />
        </div>

        <div style={{ flex: '1 1 150px' }}>
          <select
            value={filters.action || ''}
            onChange={handleActionChange}
            className="form-select"
            style={{ width: '100%' }}
          >
            <option value="">Tous les types d'actions</option>
            <option value="create">Création (Create)</option>
            <option value="update">Modification (Update)</option>
            <option value="delete">Suppression (Delete)</option>
            <option value="login">Connexion</option>
            <option value="logout">Déconnexion</option>
          </select>
        </div>

        <div style={{ flex: '1 1 150px' }}>
          <select
            value={filters.entite_concernee || ''}
            onChange={handleEntityChange}
            className="form-select"
            style={{ width: '100%' }}
          >
            <option value="">Toutes les entités</option>
            <option value="User">Utilisateurs</option>
            <option value="Club">Clubs</option>
            <option value="Saison">Saisons</option>
            <option value="Competition">Compétitions</option>
            <option value="Phase">Phases</option>
            <option value="Poule">Poules</option>
            <option value="Arbitre">Arbitres</option>
            <option value="Joueur">Joueurs</option>
            <option value="Rencontre">Matchs / Rencontres</option>
            <option value="Composition">Compositions</option>
            <option value="Contestation">Contestations</option>
            <option value="Penalite">Pénalités</option>
            <option value="Transfert">Transferts</option>
            <option value="Article">Articles</option>
          </select>
        </div>
      </div>

      {/* Table des logs */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {isLoading ? (
          <SkeletonTable cols={6} rows={8} />
        ) : error ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--secondary)' }}>
            Erreur lors du chargement des logs.
          </div>
        ) : logs.length === 0 ? (
          <EmptyState
            title="Aucun log d'audit trouvé"
            description="Aucune action n'a encore été enregistrée dans cette plage de recherche."
          />
        ) : (
          <>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 700, color: 'var(--text-dark)' }}>Utilisateur</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 700, color: 'var(--text-dark)' }}>Action</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 700, color: 'var(--text-dark)' }}>Entité concernée</th>
                  <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 700, color: 'var(--text-dark)' }}>ID Cible</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 700, color: 'var(--text-dark)' }}>Adresse IP</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 700, color: 'var(--text-dark)' }}>Date & Heure</th>
                  <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 700, color: 'var(--text-dark)' }}>Détails</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log: any) => {
                  const date = new Date(log.timestamp);
                  return (
                    <tr
                      key={log.id}
                      style={{ borderBottom: '1px solid #ECEFEE', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#F9FBF9'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{
                            width: '28px', height: '28px', borderRadius: '50%',
                            background: 'var(--primary-light)', display: 'flex',
                            alignItems: 'center', justifyContent: 'center',
                            fontSize: '11px', fontWeight: 700, color: 'var(--primary)',
                          }}>
                            {log.user ? `${log.user.prenom[0]}${log.user.nom[0]}` : 'SYS'}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-dark)' }}>
                              {log.user ? `${log.user.prenom} ${log.user.nom}` : 'Système'}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                              {log.user ? log.user.email : 'system@fecafoot.cm'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <ActionBadge action={log.action} />
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: '#334155' }}>
                        {log.entite_concernee}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center', fontFamily: 'monospace', fontWeight: 600, color: 'var(--text-muted)' }}>
                        {log.entite_id || '—'}
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-light)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Globe size={12} />
                          {log.ip_address || 'n/a'}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-light)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Calendar size={12} />
                          {date.toLocaleDateString('fr-FR')} {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <button
                          className="btn btn-icon btn-ghost btn-sm"
                          onClick={() => setSelectedLog(log)}
                          title="Inspecter les données"
                          style={{ minHeight: 0, padding: '4px' }}
                        >
                          <Eye size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <Pagination meta={meta} onPageChange={handlePageChange} />
          </>
        )}
      </div>

      {/* Modal inspecteur de Diff */}
      <Modal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title="Inspection de l'action / Diff valeurs"
        size="lg"
      >
        {selectedLog && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Infos rapides */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px', background: '#F8FAFC', padding: '14px', borderRadius: '10px',
              border: '1px solid #E2E8F0', fontSize: '13px'
            }}>
              <div>
                <strong style={{ color: 'var(--text-muted)' }}><User size={13} style={{ display: 'inline', marginRight: '4px' }} /> Acteur :</strong>{' '}
                {selectedLog.user ? `${selectedLog.user.prenom} ${selectedLog.user.nom}` : 'Système'}
              </div>
              <div>
                <strong style={{ color: 'var(--text-muted)' }}><Terminal size={13} style={{ display: 'inline', marginRight: '4px' }} /> Action :</strong>{' '}
                <ActionBadge action={selectedLog.action} />
              </div>
              <div>
                <strong style={{ color: 'var(--text-muted)' }}>Cible :</strong>{' '}
                {selectedLog.entite_concernee} (ID: {selectedLog.entite_id ?? 'n/a'})
              </div>
              <div>
                <strong style={{ color: 'var(--text-muted)' }}><Globe size={13} style={{ display: 'inline', marginRight: '4px' }} /> IP :</strong>{' '}
                {selectedLog.ip_address ?? 'n/a'}
              </div>
            </div>

            {/* Dépouillement des valeurs (Diff) */}
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '8px', color: 'var(--text-dark)' }}>
                Valeurs modifiées ou enregistrées
              </h3>

              {/* Si c'est un update, on fait un diff ligne à ligne */}
              {selectedLog.action === 'update' && selectedLog.anciennes_valeurs && selectedLog.nouvelles_valeurs ? (
                <div style={{ border: '1px solid #E2E8F0', borderRadius: '10px', overflow: 'hidden' }}>
                  <div style={{
                    display: 'grid', gridTemplateColumns: '150px 1fr 1fr',
                    background: '#F1F5F9', borderBottom: '1px solid #E2E8F0',
                    fontWeight: 700, padding: '10px 14px', fontSize: '12px', color: '#475569'
                  }}>
                    <div>Champ</div>
                    <div>Ancienne valeur (Avant)</div>
                    <div>Nouvelle valeur (Après)</div>
                  </div>
                  <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                    {Object.keys(selectedLog.nouvelles_valeurs).map((key) => (
                      <div
                        key={key}
                        style={{
                          display: 'grid', gridTemplateColumns: '150px 1fr 1fr',
                          padding: '10px 14px', borderBottom: '1px solid #ECEFEE',
                          fontSize: '12px', alignItems: 'center'
                        }}
                      >
                        <div style={{ fontWeight: 700, color: '#334155', fontFamily: 'monospace' }}>{key}</div>
                        <div style={{ color: '#991B1B', background: '#FEF2F2', padding: '4px 8px', borderRadius: '4px', textDecoration: 'line-through', marginRight: '8px', overflowX: 'auto' }}>
                          <ValueRenderer val={selectedLog.anciennes_valeurs[key]} />
                        </div>
                        <div style={{ color: '#166534', background: '#F0FDF4', padding: '4px 8px', borderRadius: '4px', fontWeight: 600, overflowX: 'auto' }}>
                          <ValueRenderer val={selectedLog.nouvelles_valeurs[key]} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* Sinon (création, suppression, login, logout), on affiche le bloc brut */
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase' }}>Données antérieures</span>
                    <div style={{
                      marginTop: '4px', padding: '12px', background: '#F8FAFC',
                      borderRadius: '8px', border: '1px solid #E2E8F0', height: '200px',
                      overflow: 'auto', fontFamily: 'monospace', fontSize: '11px'
                    }}>
                      {selectedLog.anciennes_valeurs ? (
                        <pre style={{ margin: 0 }}>{JSON.stringify(selectedLog.anciennes_valeurs, null, 2)}</pre>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Aucune donnée antérieure</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase' }}>Données nouvelles</span>
                    <div style={{
                      marginTop: '4px', padding: '12px', background: '#F8FAFC',
                      borderRadius: '8px', border: '1px solid #E2E8F0', height: '200px',
                      overflow: 'auto', fontFamily: 'monospace', fontSize: '11px'
                    }}>
                      {selectedLog.nouvelles_valeurs ? (
                        <pre style={{ margin: 0 }}>{JSON.stringify(selectedLog.nouvelles_valeurs, null, 2)}</pre>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Aucune donnée nouvelle</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* User agent */}
            <div style={{ fontSize: '11px', color: 'var(--text-light)' }}>
              <strong>User Agent :</strong> {selectedLog.user_agent || 'inconnu'}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button className="btn btn-primary" onClick={() => setSelectedLog(null)}>
                Fermer
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
