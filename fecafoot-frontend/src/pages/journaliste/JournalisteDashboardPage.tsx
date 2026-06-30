// src/pages/journaliste/JournalisteDashboardPage.tsx
// Tableau de bord dédié du journaliste accrédité

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import {
  FileText, CheckCircle, Clock, AlertTriangle,
  Plus, Edit3, ArrowRight, Eye, Newspaper, BookOpen
} from 'lucide-react';
import api from '../../api/axios';

const StatCard: React.FC<{
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}> = ({ label, value, icon, color, bgColor }) => (
  <div style={{
    background: '#fff',
    borderRadius: '16px',
    padding: '18px 20px',
    border: '1px solid #E2E8E0',
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    boxShadow: 'var(--shadow-sm)',
  }}>
    <div style={{
      width: '48px',
      height: '48px',
      borderRadius: '14px',
      background: bgColor,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      color,
    }}>
      {icon}
    </div>
    <div>
      <div style={{ fontSize: '26px', fontWeight: 800, color, lineHeight: 1.2 }}>{value}</div>
      <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>{label}</div>
    </div>
  </div>
);

export const JournalisteDashboardPage: React.FC = () => {
  const navigate = useNavigate();

  const { data: responseData, isLoading } = useQuery({
    queryKey: ['journaliste-articles'],
    queryFn: () => api.get('/journaliste/articles').then(r => r.data),
  });

  const articles = responseData?.data ?? [];

  // Statistiques articles
  const totalArticles = articles.length;
  const draftArticles = articles.filter((a: any) => a.statut === 'brouillon').length;
  const pendingArticles = articles.filter((a: any) => a.statut === 'en_attente').length;
  const publishedArticles = articles.filter((a: any) => a.statut === 'publie').length;
  const rejectedArticles = articles.filter((a: any) => a.statut === 'rejete').length;

  // Articles rejetés avec motif
  const rejets = articles.filter((a: any) => a.statut === 'rejete');

  // Dernières publications
  const publishedList = articles
    .filter((a: any) => a.statut === 'publie')
    .slice(0, 3);

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1B4332 0%, #0F2D1F 100%)',
        borderRadius: '20px',
        padding: '28px 32px',
        color: '#fff',
        marginBottom: '24px',
        boxShadow: 'var(--shadow-md)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
              FECAFOOT Presse · Journaliste Accrédité
            </div>
            <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 800 }}>
              Espace Presse & Articles 👋
            </h1>
            <p style={{ margin: '8px 0 0', fontSize: '14px', opacity: 0.8 }}>
              Rédigez des articles officiels ou des actualités, suivez leur validation et informez les fans camerounais.
            </p>
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '16px',
        marginBottom: '28px',
      }}>
        <StatCard
          label="Total rédigés"
          value={totalArticles}
          icon={<FileText size={24} />}
          color="var(--primary)"
          bgColor="rgba(27,67,50,0.08)"
        />
        <StatCard
          label="Publiés officiels"
          value={publishedArticles}
          icon={<CheckCircle size={24} style={{ color: '#166534' }} />}
          color="#166534"
          bgColor="rgba(22,101,52,0.08)"
        />
        <StatCard
          label="En attente de validation"
          value={pendingArticles}
          icon={<Clock size={24} style={{ color: '#D97706' }} />}
          color="#D97706"
          bgColor="rgba(217,119,6,0.08)"
        />
        <StatCard
          label="Rejetés / A corriger"
          value={rejectedArticles}
          icon={<AlertTriangle size={24} style={{ color: '#DC2626' }} />}
          color="#DC2626"
          bgColor="rgba(220,38,38,0.08)"
        />
      </div>

      {/* Grid centrale */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', marginBottom: '28px' }} className="responsive-grid">
        
        {/* Colonne gauche : Articles rejetés & Publications récentes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Articles rejetés à corriger */}
          {rejets.length > 0 && (
            <div className="card" style={{ padding: '20px', border: '1px solid rgba(220,38,38,0.3)', background: 'rgba(220,38,38,0.02)' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#991B1B', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={18} />
                Articles rejetés (Modifications demandées)
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {rejets.map((a: any) => (
                  <div
                    key={a.id}
                    style={{
                      background: '#FFF',
                      border: '1px solid rgba(220,38,38,0.15)',
                      borderRadius: '12px',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '14px', color: '#1E293B' }}>{a.titre}</strong>
                      <Link to="/journaliste/articles" className="btn btn-sm btn-ghost" style={{ padding: '4px 8px', fontSize: '11px', color: '#DC2626' }}>
                        <Edit3 size={12} style={{ marginRight: '4px' }} /> Corriger
                      </Link>
                    </div>
                    <div style={{
                      background: 'rgba(220,38,38,0.05)',
                      borderLeft: '3px solid #DC2626',
                      padding: '8px 12px',
                      borderRadius: '0 8px 8px 0',
                      fontSize: '12.5px',
                      color: '#991B1B',
                      fontStyle: 'italic'
                    }}>
                      Motif du rejet : {a.motif_rejet || 'Non renseigné'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Publications récentes */}
          <div className="card" style={{ padding: '20px' }}>
            <h2 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Newspaper size={18} style={{ color: 'var(--primary)' }} />
              Vos dernières publications en ligne
            </h2>

            {publishedList.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {publishedList.map((a: any) => (
                  <div
                    key={a.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: '1px solid #E2E8E0',
                      fontSize: '13px'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-dark)' }}>{a.titre}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-light)', marginTop: '2px' }}>
                        Publié le {new Date(a.updated_at).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                    <Link to="/actualites" className="btn btn-icon btn-ghost btn-sm" style={{ padding: '4px' }}>
                      <Eye size={15} />
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                Vous n'avez pas encore d'article publié en ligne.
              </div>
            )}
          </div>

        </div>

        {/* Colonne droite : Actions rapides & Conseil */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Actions rapides */}
          <div className="card" style={{ padding: '20px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)', marginBottom: '14px' }}>
              Actions rapides
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Link to="/journaliste/articles" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', gap: '6px' }}>
                <Plus size={15} /> Rédiger un article
              </Link>
              <Link to="/actualites" className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center' }}>
                📰 Voir le fil d'actualités
              </Link>
            </div>
          </div>

          {/* Guide de rédaction */}
          <div className="card" style={{ padding: '20px', background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <BookOpen size={18} style={{ color: 'var(--primary)' }} />
              <strong style={{ fontSize: '13px', color: 'var(--text-dark)' }}>Ligne éditoriale FECAFOOT</strong>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
              Vos articles doivent être impartiaux, précis et respecter la déontologie du journalisme sportif. 
              Les images libres de droit sont obligatoires pour illustrer vos chroniques.
            </p>
          </div>
        </div>

      </div>
      
      <style>{`
        @media (max-width: 768px) {
          .responsive-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default JournalisteDashboardPage;
