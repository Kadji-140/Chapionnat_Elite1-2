// src/pages/public/ActualitesPage.tsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Newspaper, Calendar, User, BookOpen, Search } from 'lucide-react';
import { getArticlesPublic, CATEGORIES_ARTICLES } from '../../api/articles.api';
import type { Article } from '../../api/articles.api';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/DataTable';
import { useTranslation } from '../../hooks/useTranslation';

// Helper pour l'URL de l'image de l'article
const getMediaUrl = (url: string | null | undefined): string | undefined => {
  if (!url) return undefined;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  
  const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
  const baseUrl = apiUrl.endsWith('/api') ? apiUrl.slice(0, -4) : apiUrl;

  if (url.startsWith('/storage')) {
    return `${baseUrl}${url}`;
  }
  return `${baseUrl}/storage/${url}`;
};

const ActualitesPage: React.FC = () => {
  const { lang } = useTranslation();
  const isEn = lang === 'en';
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  // Charger les articles publiés
  const { data, isLoading } = useQuery({
    queryKey: ['public-articles', selectedCategory],
    queryFn: () => getArticlesPublic({ categorie: selectedCategory }),
  });

  const articles: Article[] = data?.data ?? [];

  // Filtrer côté client par recherche textuelle (titre ou contenu)
  const filteredArticles = articles.filter((art) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      art.titre.toLowerCase().includes(query) ||
      art.contenu.toLowerCase().includes(query)
    );
  });

  // Repérer l'article à la une pour l'affichage Hero
  const featuredArticle = filteredArticles.find((art) => art.est_a_la_une);
  const showFeaturedHero = !selectedCategory && !searchQuery && !!featuredArticle;
  const mainGridArticles = showFeaturedHero
    ? filteredArticles.filter((art) => art.id !== featuredArticle.id)
    : filteredArticles;

  const getCategoryLabel = (cat: string) => {
    const categoryObj = CATEGORIES_ARTICLES.find((c) => c.value === cat);
    if (!categoryObj) return cat;
    
    // Simple translation mapping for article categories
    if (isEn) {
      const enMap: Record<string, string> = {
        'actualite': 'News',
        'match': 'Match',
        'club': 'Club',
        'joueur': 'Player',
        'transfert': 'Transfer',
        'officiel': 'Official'
      };
      return enMap[cat] || categoryObj.label;
    }
    return categoryObj.label;
  };

  const getCategoryBadgeVariant = (cat: string) => {
    const variants: Record<string, 'success' | 'danger' | 'warning' | 'info' | 'gray' | 'primary' | 'accent'> = {
      actualite: 'info',
      match: 'primary',
      club: 'gray',
      joueur: 'accent',
      transfert: 'warning',
      officiel: 'danger',
    };
    return variants[cat] ?? 'gray';
  };

  return (
    <div className="animate-fade-in-up" style={{ padding: '0 8px' }}>
      {/* Hero Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1B4332 0%, #081C15 100%)',
          borderRadius: '16px',
          padding: '40px 32px',
          color: 'white',
          marginBottom: '30px',
          boxShadow: '0 10px 30px -10px rgba(27,67,50,0.4)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'relative', zIndex: 2, maxWidth: '600px' }}>
          <span
            style={{
              background: 'rgba(255,255,255,0.15)',
              padding: '6px 12px',
              borderRadius: '30px',
              fontSize: '12px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '1px',
              display: 'inline-block',
              marginBottom: '14px',
            }}
          >
            {isEn ? 'Official News' : 'Actualités Officielles'}
          </span>
          <h1 style={{ fontSize: '32px', fontWeight: 800, lineHeight: 1.2, marginBottom: '8px', color: '#fff' }}>
            {isEn ? 'FECAFOOT Media & Press' : 'FECAFOOT Média & Presse'}
          </h1>
          <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>
            {isEn 
              ? 'Follow the transfer window, match results, official announcements and all the news of elite football in Cameroon live.'
              : "Suivez en direct le mercato, les résultats des matchs, les communiqués officiels et toute l'actualité du football d'élite au Cameroun."}
          </p>
        </div>
        <div
          style={{
            position: 'absolute',
            right: '-20px',
            bottom: '-40px',
            opacity: 0.1,
            transform: 'rotate(-10deg)',
          }}
        >
          <Newspaper size={280} color="white" />
        </div>
      </div>

      {/* Barre de Recherche et Filtres */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          flexWrap: 'wrap',
          marginBottom: '24px',
        }}
      >
        {/* Catégories (Pills) */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', flex: 1 }}>
          <button
            onClick={() => setSelectedCategory('')}
            style={{
              padding: '8px 16px',
              borderRadius: '30px',
              border: '1px solid #e2e8f0',
              background: selectedCategory === '' ? 'var(--primary)' : 'white',
              color: selectedCategory === '' ? 'white' : 'var(--text)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: selectedCategory === '' ? '0 4px 12px rgba(27,67,50,0.2)' : 'none',
            }}
          >
            {isEn ? 'All articles' : 'Tous les articles'}
          </button>
          {CATEGORIES_ARTICLES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              style={{
                padding: '8px 16px',
                borderRadius: '30px',
                border: '1px solid #e2e8f0',
                background: selectedCategory === cat.value ? 'var(--primary)' : 'white',
                color: selectedCategory === cat.value ? 'white' : 'var(--text)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: selectedCategory === cat.value ? '0 4px 12px rgba(27,67,50,0.2)' : 'none',
              }}
            >
              {getCategoryLabel(cat.value)}
            </button>
          ))}
        </div>

        {/* Input Recherche */}
        <div style={{ position: 'relative', width: '300px' }} className="sm-full">
          <input
            type="text"
            placeholder={isEn ? 'Search an article...' : 'Rechercher un article...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px 10px 38px',
              borderRadius: '30px',
              border: '1px solid #cbd5e1',
              fontSize: '14px',
              outline: 'none',
              transition: 'border-color 0.15s ease',
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--primary)')}
            onBlur={(e) => (e.currentTarget.style.borderColor = '#cbd5e1')}
          />
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#64748b',
            }}
          />
        </div>
      </div>

      {/* Grid Articles */}
      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
          {[1, 2, 3].map((n) => (
            <div key={n} className="card" style={{ height: '380px', display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px' }}>
              <div style={{ height: '180px', background: '#f1f5f9', borderRadius: '8px', animation: 'pulse 1.5s infinite' }} />
              <div style={{ height: '24px', background: '#f1f5f9', width: '40%', borderRadius: '4px', animation: 'pulse 1.5s infinite' }} />
              <div style={{ height: '32px', background: '#f1f5f9', width: '90%', borderRadius: '4px', animation: 'pulse 1.5s infinite' }} />
              <div style={{ height: '40px', background: '#f1f5f9', borderRadius: '4px', animation: 'pulse 1.5s infinite' }} />
            </div>
          ))}
        </div>
      ) : filteredArticles.length === 0 ? (
        <div className="card" style={{ padding: '60px 20px' }}>
          <EmptyState
            title={isEn ? 'No articles available' : 'Aucun article disponible'}
            description={isEn ? 'No articles match your search or filter criteria.' : 'Aucun article ne correspond à vos critères de recherche ou de filtrage.'}
            icon={<Newspaper size={36} style={{ color: 'var(--text-light)' }} />}
          />
        </div>
      ) : (
        <>
          {/* Article à la une (Featured) */}
          {showFeaturedHero && featuredArticle && (
            <div
              onClick={() => setSelectedArticle(featuredArticle)}
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                background: 'white',
                borderRadius: '24px',
                overflow: 'hidden',
                cursor: 'pointer',
                border: '2px solid #FFB800',
                boxShadow: '0 20px 40px -15px rgba(255, 184, 0, 0.25)',
                marginBottom: '40px',
                transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-6px)';
                e.currentTarget.style.boxShadow = '0 30px 50px -10px rgba(255, 184, 0, 0.35)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = '0 20px 40px -15px rgba(255, 184, 0, 0.25)';
              }}
            >
              {/* Image */}
              <div style={{
                height: '100%',
                minHeight: '260px',
                background: featuredArticle.image_principale 
                  ? `url(${getMediaUrl(featuredArticle.image_principale)}) center/cover no-repeat`
                  : 'linear-gradient(135deg, #1B4332 0%, #081C15 100%)',
                position: 'relative'
              }}>
                <div style={{ position: 'absolute', top: '20px', left: '20px', display: 'flex', gap: '8px' }}>
                  <Badge variant="accent">{isEn ? '🌟 FEATURED' : '🌟 À LA UNE'}</Badge>
                  <Badge variant={getCategoryBadgeVariant(featuredArticle.categorie)}>
                    {getCategoryLabel(featuredArticle.categorie)}
                  </Badge>
                </div>
              </div>

              {/* Text Content */}
              <div style={{
                padding: '32px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', gap: '14px', fontSize: '12px', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={14} />
                    {featuredArticle.date_publication ? new Date(featuredArticle.date_publication).toLocaleDateString(isEn ? 'en-US' : 'fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : (isEn ? 'Not published' : 'Non publié')}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <User size={14} />
                    {featuredArticle.auteur ? `${featuredArticle.auteur.prenom} ${featuredArticle.auteur.nom}` : 'Presse FECAFOOT'}
                  </span>
                </div>

                <h2 style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text)', lineHeight: 1.25, margin: 0 }}>
                  {featuredArticle.titre}
                </h2>

                <p style={{
                  fontSize: '14px',
                  color: 'var(--text-muted)',
                  lineHeight: 1.6,
                  margin: 0,
                  display: '-webkit-box',
                  WebkitLineClamp: 4,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {featuredArticle.contenu}
                </p>

                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: 'var(--primary)',
                  fontSize: '13px',
                  fontWeight: 800,
                  marginTop: '8px',
                  borderTop: '1px solid var(--border)',
                  paddingTop: '16px'
                }}>
                  <BookOpen size={16} /> {isEn ? 'Read full article' : "Lire l'article complet"}
                </div>
              </div>
            </div>
          )}

          {mainGridArticles.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
              {mainGridArticles.map((art: Article, i: number) => {
                const bgImage = getMediaUrl(art.image_principale);
                return (
                  <article
                    key={art.id}
                    className="card hover-card stagger-item"
                    onClick={() => setSelectedArticle(art)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: '16px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      padding: 0,
                      border: art.est_a_la_une ? '2px solid #FFB800' : '1px solid var(--border)',
                      boxShadow: art.est_a_la_une ? '0 6px 20px rgba(255,184,0,0.15)' : 'none',
                      animationDelay: `${i * 45}ms`,
                      background: 'white',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = art.est_a_la_une 
                        ? '0 12px 28px rgba(255,184,0,0.25)' 
                        : '0 12px 24px -10px rgba(0,0,0,0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.boxShadow = art.est_a_la_une 
                        ? '0 6px 20px rgba(255,184,0,0.15)' 
                        : 'none';
                    }}
                  >
                    {/* Image Banner */}
                    <div
                      style={{
                        height: '180px',
                        width: '100%',
                        background: bgImage ? `url(${bgImage}) center/cover no-repeat` : 'linear-gradient(135deg, #1B4332 0%, #2D6A4F 100%)',
                        position: 'relative',
                      }}
                    >
                      <div
                        style={{
                          position: 'absolute',
                          top: '12px',
                          left: '12px',
                          display: 'flex',
                          gap: '6px',
                          flexWrap: 'wrap',
                        }}
                      >
                        {art.est_a_la_une && (
                          <Badge variant="accent">
                            {isEn ? '🌟 FEATURED' : '🌟 À LA UNE'}
                          </Badge>
                        )}
                        <Badge variant={getCategoryBadgeVariant(art.categorie)}>
                          {getCategoryLabel(art.categorie)}
                        </Badge>
                      </div>
                      {!bgImage && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'white', opacity: 0.2 }}>
                          <Newspaper size={64} />
                        </div>
                      )}
                    </div>

                    {/* Content info */}
                    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                      {/* Meta date + author */}
                      <div style={{ display: 'flex', gap: '14px', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', flexWrap: 'wrap' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Calendar size={13} />
                          {art.date_publication ? new Date(art.date_publication).toLocaleDateString(isEn ? 'en-US' : 'fr-FR') : (isEn ? 'Not published' : 'Non publié')}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <User size={13} />
                          {art.auteur ? `${art.auteur.prenom} ${art.auteur.nom}` : (isEn ? 'Journalist' : 'Journaliste')}
                        </span>
                      </div>

                      <h2 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text)', lineHeight: 1.3, marginBottom: '8px' }}>
                        {art.titre}
                      </h2>

                      <p
                        style={{
                          fontSize: '13.5px',
                          color: 'var(--text-muted)',
                          lineHeight: 1.5,
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          marginBottom: '16px',
                          flex: 1,
                        }}
                      >
                        {art.contenu}
                      </p>

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          color: 'var(--primary)',
                          fontSize: '13px',
                          fontWeight: 700,
                          borderTop: '1px solid var(--border)',
                          paddingTop: '14px',
                        }}
                      >
                        <BookOpen size={14} /> {isEn ? 'Read more' : 'Lire la suite'}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Modal lecture article */}
      <Modal
        isOpen={!!selectedArticle}
        onClose={() => setSelectedArticle(null)}
        title={isEn ? 'Article Details' : "Détail de l'article"}
        size="md"
      >
        {selectedArticle && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Header info */}
            <div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap' }}>
                <Badge variant={getCategoryBadgeVariant(selectedArticle.categorie)}>
                  {getCategoryLabel(selectedArticle.categorie)}
                </Badge>
                <div style={{ width: '4px', height: '4px', background: 'var(--border)', borderRadius: '50%' }} />
                <span style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={13} />
                  {isEn ? 'Published on' : 'Publié le'} {selectedArticle.date_publication ? new Date(selectedArticle.date_publication).toLocaleDateString(isEn ? 'en-US' : 'fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
                </span>
              </div>
              <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text)', lineHeight: 1.25 }}>
                {selectedArticle.titre}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px', fontSize: '13px', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--primary)' }}>
                  {selectedArticle.auteur?.prenom.charAt(0)}{selectedArticle.auteur?.nom.charAt(0)}
                </div>
                <span>
                  {isEn ? 'By' : 'Par'} <strong>{selectedArticle.auteur?.prenom} {selectedArticle.auteur?.nom}</strong> (Presse FECAFOOT)
                </span>
              </div>
            </div>

            {/* Image d'illustration si existante */}
            {selectedArticle.image_principale && (
              <div style={{ width: '100%', maxHeight: '340px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                <img
                  src={getMediaUrl(selectedArticle.image_principale)}
                  alt={selectedArticle.titre}
                  style={{ width: '100%', height: 'auto', maxHeight: '340px', objectFit: 'cover' }}
                />
              </div>
            )}

            {/* Contenu textuel */}
            <div
              style={{
                fontSize: '15px',
                lineHeight: 1.6,
                color: 'var(--text)',
                whiteSpace: 'pre-line',
                padding: '8px 0',
                borderTop: '1px solid var(--border)',
                borderBottom: '1px solid var(--border)',
              }}
            >
              {selectedArticle.contenu}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setSelectedArticle(null)}>
                {isEn ? 'Close reader' : 'Fermer la lecture'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ActualitesPage;
