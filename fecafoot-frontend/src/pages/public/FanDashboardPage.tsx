// src/pages/public/FanDashboardPage.tsx
// Simulateur de l'application mobile Fan FECAFOOT Elite

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Calendar, Trophy, Newspaper, Users, Globe, Wifi, WifiOff,
  User, MessageSquare, Award, ArrowRight, Shield, Star,
  VolumeX, Volume2
} from 'lucide-react';
import api from '../../api/axios';
import { useAuthStore } from '../../store/authStore';
import { loginApi } from '../../api/auth.api';
import toast from 'react-hot-toast';

export default function FanDashboardPage() {
  const navigate = useNavigate();
  const { isAuthenticated, setAuth } = useAuthStore();
  
  // États de simulation
  const [lang, setLang] = useState<'FR' | 'EN'>('FR');
  const [is3GMode, setIs3GMode] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [activeTab, setActiveTab] = useState<'matchs' | 'classement' | 'actualites' | 'joueurs'>('matchs');
  
  // États d'interactions
  const [selectedMatch, setSelectedMatch] = useState<any | null>(null);
  const [pseudo, setPseudo] = useState(() => localStorage.getItem('fan_pseudo') || 'LionIndomptable237');
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState<Record<number, any[]>>({});
  const [votesPronostics, setVotesPronostics] = useState<Record<number, string>>({});
  const [votesHommeMatch, setVotesHommeMatch] = useState<Record<number, string>>({});
  const [searchPlayer, setSearchPlayer] = useState('');
  
  // Auto-authentification si visiteur anonyme pour appeler les API FECAFOOT
  useEffect(() => {
    if (!isAuthenticated) {
      const autoLogin = async () => {
        try {
          // Utilise le compte coach public comme session de lecture pour les API
          const data = await loginApi({ email: 'coach.canon@fecafoot.cm', password: 'password' });
          setAuth(data.token, data.user);
        } catch (err) {
          console.error("Auto-login fan failed", err);
        }
      };
      autoLogin();
    }
  }, [isAuthenticated, setAuth]);

  // Sauvegarder le pseudo
  const handleSavePseudo = (newPseudo: string) => {
    setPseudo(newPseudo);
    localStorage.setItem('fan_pseudo', newPseudo);
  };

  // Queries API (en tenant compte du mode hors ligne)
  const { data: articlesResponse } = useQuery({
    queryKey: ['fan-articles'],
    queryFn: () => api.get('/articles').then(r => r.data),
    enabled: !isOffline,
  });

  const { data: competitionsResponse } = useQuery({
    queryKey: ['fan-competitions'],
    queryFn: () => api.get('/shared/saisons/1/competitions').then(r => r.data), // Compétitions de la saison 1
    enabled: !isOffline,
  });

  // Récupérer le calendrier (matchs)
  const { data: matchsResponse } = useQuery({
    queryKey: ['fan-matchs'],
    queryFn: () => api.get('/admin/competitions/1/calendrier').then(r => r.data), // Matchs de Elite One (ID 1)
    enabled: !isOffline,
  });

  // Récupérer les joueurs
  const { data: joueursResponse } = useQuery({
    queryKey: ['fan-joueurs'],
    queryFn: () => api.get('/coach/joueurs').then(r => r.data),
    enabled: !isOffline,
  });

  // Classement de la poule A (ID 1)
  const { data: classementResponse } = useQuery({
    queryKey: ['fan-classement'],
    queryFn: () => api.get('/poules/1/classement').then(r => r.data),
    enabled: !isOffline,
  });

  const articles = articlesResponse?.data ?? [];
  const matchesList = matchsResponse?.data?.flatMap((j: any) => j.matchs) ?? [];
  const joueurs = joueursResponse?.data ?? [];
  const classement = classementResponse?.data ?? [];

  // Filtrer les joueurs
  const filteredJoueurs = joueurs.filter((j: any) => {
    const term = searchPlayer.toLowerCase();
    return `${j.prenom} ${j.nom}`.toLowerCase().includes(term) || (j.poste && j.poste.toLowerCase().includes(term));
  });

  // Ajouter un commentaire
  const handleAddComment = (matchId: number) => {
    if (!newComment.trim()) return;
    const commentObj = {
      id: Date.now(),
      pseudo,
      text: newComment,
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    };
    setComments(prev => ({
      ...prev,
      [matchId]: [commentObj, ...(prev[matchId] || [])]
    }));
    setNewComment('');
  };

  // Voter pour le pronostic
  const handleVotePronostic = (matchId: number, outcome: string) => {
    if (votesPronostics[matchId]) return; // vote unique
    setVotesPronostics(prev => ({ ...prev, [matchId]: outcome }));
    toast.success(lang === 'FR' ? 'Pronostic enregistré !' : 'Prediction registered!');
  };

  // Voter pour l'homme du match
  const handleVoteHommeMatch = (matchId: number, playerName: string) => {
    if (votesHommeMatch[matchId]) return;
    setVotesHommeMatch(prev => ({ ...prev, [matchId]: playerName }));
    toast.success(lang === 'FR' ? 'Vote enregistré !' : 'Vote registered!');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(circle at top, #142F22 0%, #0F1923 100%)',
      fontFamily: "'Inter', sans-serif",
      padding: '24px',
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }}>
      
      {/* ── Entête Bureau ── */}
      <div style={{ width: '100%', maxWidth: '1100px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <button onClick={() => navigate('/login')} className="btn btn-ghost btn-sm" style={{ color: '#FFB800', marginBottom: '8px' }}>
            ← Retour Connexion Pro
          </button>
          <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#fff', margin: 0, textTransform: 'uppercase', letterSpacing: '-0.5px' }}>
            FECAFOOT Elite Mobile App
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', margin: '4px 0 0' }}>
            Simulateur interactif de l'application mobile grand public (Fan)
          </p>
        </div>

        {/* Boutons de contrôle de la simulation */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setLang(l => l === 'FR' ? 'EN' : 'FR')}
            className="btn btn-sm"
            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', fontWeight: 700 }}
          >
            🌐 {lang}
          </button>
          <button
            onClick={() => setIs3GMode(!is3GMode)}
            className="btn btn-sm"
            style={{
              background: is3GMode ? '#E9C46A' : 'rgba(255,255,255,0.1)',
              border: 'none',
              color: is3GMode ? '#1E293B' : '#fff',
              fontWeight: 700
            }}
            title="Simule un chargement réseau ralenti pour tester les performances"
          >
            📉 {is3GMode ? '3G Active' : 'Mode 3G'}
          </button>
          <button
            onClick={() => {
              setIsOffline(!isOffline);
              if (!isOffline) {
                toast.error('Mode hors-ligne activé');
              } else {
                toast.success('Réseau connecté');
              }
            }}
            className="btn btn-sm"
            style={{
              background: isOffline ? '#C8102E' : 'rgba(255,255,255,0.1)',
              border: 'none',
              color: '#fff',
              fontWeight: 700
            }}
          >
            {isOffline ? <WifiOff size={14} style={{ marginRight: '4px' }} /> : <Wifi size={14} style={{ marginRight: '4px' }} />}
            {isOffline ? 'Hors ligne' : 'Mode Offline'}
          </button>
        </div>
      </div>

      {/* ── Grid Principale : Simulateur de téléphone + Panneau de Contrôle ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '400px 1fr',
        gap: '40px',
        width: '100%',
        maxWidth: '1100px',
        alignItems: 'start'
      }} className="fan-grid">
        
        {/* ── SMARTPHONE FRAME SIMULATOR ── */}
        <div style={{
          width: '380px',
          height: '740px',
          borderRadius: '40px',
          border: '12px solid #2D3748',
          boxShadow: '0 25px 60px rgba(0,0,0,0.8), 0 0 0 2px #4A5568',
          background: '#0F172A',
          overflow: 'hidden',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          userSelect: 'none'
        }}>
          {/* Encoche téléphone / Dynamic Island */}
          <div style={{
            position: 'absolute', top: '0', left: '50%', transform: 'translateX(-50%)',
            width: '110px', height: '24px', background: '#000', borderRadius: '0 0 16px 16px',
            zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#1A202C' }} />
          </div>

          {/* Barre de statut du téléphone */}
          <div style={{
            height: '36px', background: '#0B0F19', padding: '0 24px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.7)',
            flexShrink: 0
          }}>
            <span>12:28</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '9px', background: 'rgba(255,255,255,0.15)', padding: '1px 4px', borderRadius: '3px' }}>
                {is3GMode ? '3G' : '5G'}
              </span>
              {isOffline ? <WifiOff size={11} /> : <Wifi size={11} />}
              <div style={{ width: '18px', height: '9px', border: '1px solid rgba(255,255,255,0.7)', borderRadius: '2px', padding: '1px', display: 'flex' }}>
                <div style={{ flex: 1, background: '#22c55e', borderRadius: '1px' }} />
              </div>
            </div>
          </div>

          {/* Simulateur d'en-tête réseau hors-ligne */}
          {isOffline && (
            <div style={{
              background: '#C8102E', padding: '6px', textAlign: 'center',
              fontSize: '11px', fontWeight: 700, color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
            }}>
              <WifiOff size={12} /> {lang === 'FR' ? 'Mode hors-ligne actif (Données Simulées)' : 'Offline mode active (Simulated Data)'}
            </div>
          )}

          {/* ── CONTENU DE L'APP MOBILE ── */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', paddingBottom: '70px', position: 'relative' }} className="mobile-content">
            
            {/* Si un match est sélectionné (Vue Détail Match Live) */}
            {selectedMatch ? (
              <div className="animate-fade-in">
                <button
                  onClick={() => setSelectedMatch(null)}
                  style={{
                    background: 'none', border: 'none', color: '#FFB800',
                    fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '14px'
                  }}
                >
                  ← {lang === 'FR' ? 'Retour Matchs' : 'Back to Matches'}
                </button>

                {/* En-tête Match Score */}
                <div style={{
                  background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '16px', padding: '16px', textAlign: 'center',
                  marginBottom: '16px'
                }}>
                  <div style={{ fontSize: '11px', color: '#FFB800', fontWeight: 700, marginBottom: '6px' }}>
                    {selectedMatch.statut === 'live' ? '⚡ LIVE MATCH' : 'MATCH CLOS'}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700 }}>{selectedMatch.club_domicile?.nom}</div>
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 900, color: '#22C55E' }}>
                      {selectedMatch.score_domicile ?? 0} - {selectedMatch.score_exterieur ?? 0}
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700 }}>{selectedMatch.club_exterieur?.nom}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '8px' }}>
                    🏟️ {selectedMatch.stade || 'Stade Omnisports'}
                  </div>
                </div>

                {/* IA Predictions */}
                <div style={{
                  background: 'rgba(255,184,0,0.05)',
                  border: '1px solid rgba(255,184,0,0.2)',
                  borderRadius: '16px', padding: '16px', marginBottom: '16px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: '#FFB800', marginBottom: '8px' }}>
                    <Star size={14} fill="#FFB800" />
                    {lang === 'FR' ? 'Prédictions IA FECAFOOT' : 'FECAFOOT AI Predictions'}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>
                    <span>Dom: 55%</span>
                    <span>Nul: 25%</span>
                    <span>Ext: 20%</span>
                  </div>
                  <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', display: 'flex', overflow: 'hidden' }}>
                    <div style={{ width: '55%', background: '#22c55e' }} />
                    <div style={{ width: '25%', background: '#FFB800' }} />
                    <div style={{ width: '20%', background: '#EF4444' }} />
                  </div>
                  <div style={{ fontSize: '11px', color: '#22C55E', fontWeight: 700, marginTop: '8px', textAlign: 'center' }}>
                    🏆 {lang === 'FR' ? 'Favori IA : Victoire à domicile' : 'AI Favorite: Home win'} (Confiance Élevée)
                  </div>
                </div>

                {/* Vote Pronostic */}
                <div style={{ background: '#1E293B', borderRadius: '16px', padding: '16px', marginBottom: '16px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, marginBottom: '10px' }}>
                    🗳️ {lang === 'FR' ? 'Votre pronostic' : 'Your prediction'}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                    <button
                      onClick={() => handleVotePronostic(selectedMatch.id, 'domicile')}
                      className="btn btn-sm"
                      style={{
                        fontSize: '11px',
                        background: votesPronostics[selectedMatch.id] === 'domicile' ? '#22C55E' : 'rgba(255,255,255,0.1)',
                        border: 'none', color: '#fff', cursor: votesPronostics[selectedMatch.id] ? 'not-allowed' : 'pointer'
                      }}
                      disabled={!!votesPronostics[selectedMatch.id]}
                    >
                      Dom
                    </button>
                    <button
                      onClick={() => handleVotePronostic(selectedMatch.id, 'nul')}
                      className="btn btn-sm"
                      style={{
                        fontSize: '11px',
                        background: votesPronostics[selectedMatch.id] === 'nul' ? '#FFB800' : 'rgba(255,255,255,0.1)',
                        border: 'none', color: '#fff', cursor: votesPronostics[selectedMatch.id] ? 'not-allowed' : 'pointer'
                      }}
                      disabled={!!votesPronostics[selectedMatch.id]}
                    >
                      Nul
                    </button>
                    <button
                      onClick={() => handleVotePronostic(selectedMatch.id, 'exterieur')}
                      className="btn btn-sm"
                      style={{
                        fontSize: '11px',
                        background: votesPronostics[selectedMatch.id] === 'exterieur' ? '#EF4444' : 'rgba(255,255,255,0.1)',
                        border: 'none', color: '#fff', cursor: votesPronostics[selectedMatch.id] ? 'not-allowed' : 'pointer'
                      }}
                      disabled={!!votesPronostics[selectedMatch.id]}
                    >
                      Ext
                    </button>
                  </div>
                </div>

                {/* Section commentaires interactifs */}
                <div style={{ background: '#1E293B', borderRadius: '16px', padding: '16px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MessageSquare size={14} />
                    {lang === 'FR' ? 'Commentaires des fans' : 'Fans comments'}
                  </div>

                  {/* Saisie commentaire */}
                  <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
                    <input
                      type="text"
                      placeholder={lang === 'FR' ? 'Exprimez-vous...' : 'Write comment...'}
                      value={newComment}
                      onChange={e => setNewComment(e.target.value)}
                      style={{
                        flex: 1, background: '#0F172A', border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '6px', color: '#fff', fontSize: '12px', padding: '6px 10px'
                      }}
                    />
                    <button
                      onClick={() => handleAddComment(selectedMatch.id)}
                      className="btn btn-primary"
                      style={{ padding: '6px 12px', fontSize: '11px', minHeight: 0 }}
                    >
                      Ok
                    </button>
                  </div>

                  {/* Liste des commentaires */}
                  <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {((comments[selectedMatch.id] || [])).length === 0 ? (
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '12px' }}>
                        Soyez le premier à commenter !
                      </div>
                    ) : (
                      (comments[selectedMatch.id] || []).map((c: any) => (
                        <div key={c.id} style={{ background: 'rgba(255,255,255,0.03)', padding: '8px', borderRadius: '6px', fontSize: '11.5px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                            <span style={{ fontWeight: 700, color: '#FFB800' }}>{c.pseudo}</span>
                            <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)' }}>{c.time}</span>
                          </div>
                          <div style={{ color: 'rgba(255,255,255,0.85)' }}>{c.text}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            ) : (
              /* Vue Principale des Onglets */
              <div className="animate-fade-in">
                {/* ─ Onglet MATCHS ─ */}
                {activeTab === 'matchs' && (
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#fff', marginBottom: '12px' }}>
                      {lang === 'FR' ? 'Scores & Calendrier Live' : 'Live Scores & Schedule'}
                    </h3>

                    {/* Simulation de chargement ou mode Offline vide */}
                    {isOffline ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {/* Simulation de matchs Offline locaux */}
                        <div
                          onClick={() => setSelectedMatch({ id: 99, club_domicile: { nom: 'Canon Yaoundé' }, club_exterieur: { nom: 'Tonnerre Yde' }, score_domicile: 2, score_exterieur: 1, statut: 'termine', stade: 'Stade Ahmadou Ahidjo' })}
                          style={{ background: '#1E293B', borderRadius: '12px', padding: '12px', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.05)' }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
                            <span>Elite One · Offline Mode</span>
                            <span style={{ color: '#166534', fontWeight: 700 }}>CLOS</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                            <span style={{ fontWeight: 700 }}>Canon Yaoundé</span>
                            <strong style={{ fontSize: '15px', color: '#22C55E' }}>2 - 1</strong>
                            <span style={{ fontWeight: 700 }}>Tonnerre Yde</span>
                          </div>
                        </div>
                      </div>
                    ) : matchesList.length === 0 ? (
                      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '24px' }}>
                        Chargement des matchs en cours...
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {matchesList.slice(0, 10).map((m: any) => (
                          <div
                            key={m.id}
                            onClick={() => setSelectedMatch(m)}
                            style={{
                              background: '#1E293B',
                              borderRadius: '12px',
                              padding: '12px',
                              cursor: 'pointer',
                              border: '1px solid rgba(255,255,255,0.05)',
                              transition: 'transform 0.15s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#FFB800' }}>
                              <span>Elite One · Journée {m.journee}</span>
                              <span style={{
                                fontWeight: 700,
                                color: m.statut === 'live' ? '#EF4444' : m.statut === 'termine' || m.statut === 'homologue' ? '#22C55E' : '#94A3B8'
                              }}>
                                {m.statut === 'live' ? '⚡ LIVE' : m.statut === 'termine' || m.statut === 'homologue' ? 'CLOS' : 'PROG'}
                              </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                              <span style={{ fontWeight: 700, fontSize: '12.5px' }}>{m.club_domicile?.nom}</span>
                              <strong style={{ fontSize: '15px', color: '#22C55E' }}>
                                {m.statut === 'programme' ? 'VS' : `${m.score_domicile ?? 0} - ${m.score_exterieur ?? 0}`}
                              </strong>
                              <span style={{ fontWeight: 700, fontSize: '12.5px' }}>{m.club_exterieur?.nom}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ─ Onglet CLASSEMENT ─ */}
                {activeTab === 'classement' && (
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#fff', marginBottom: '12px' }}>
                      {lang === 'FR' ? 'Classement Elite One' : 'Elite One Standings'}
                    </h3>

                    {isOffline || classement.length === 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {[1, 2, 3].map(i => (
                          <div key={i} style={{ background: '#1E293B', padding: '10px', borderRadius: '8px', display: 'flex', justifyItems: 'space-between', fontSize: '12px' }}>
                            <span style={{ fontWeight: 700, marginRight: '8px' }}>{i}.</span>
                            <span>Club Mock {i}</span>
                            <span style={{ marginLeft: 'auto', fontWeight: 700 }}>{12 - i * 3} pts</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {classement.map((c: any) => (
                          <div
                            key={c.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              padding: '8px 10px',
                              background: '#1E293B',
                              borderRadius: '8px',
                              fontSize: '12px'
                            }}
                          >
                            <span style={{ width: '20px', fontWeight: 700, color: '#FFB800' }}>{c.position}</span>
                            <span style={{ flex: 1, fontWeight: 600 }}>{c.club?.nom}</span>
                            <span style={{ color: 'rgba(255,255,255,0.6)', marginRight: '10px' }}>{c.nb_matchs} MJ</span>
                            <strong style={{ color: '#22C55E' }}>{c.points} pts</strong>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ─ Onglet ACTUALITES ─ */}
                {activeTab === 'actualites' && (
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#fff', marginBottom: '12px' }}>
                      {lang === 'FR' ? 'Actualités & Presse' : 'News & Press'}
                    </h3>

                    {isOffline || articles.length === 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ background: '#1E293B', padding: '12px', borderRadius: '10px' }}>
                          <strong style={{ fontSize: '13px', color: '#FFB800' }}>Coup d'envoi Elite One !</strong>
                          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', margin: '4px 0 0' }}>La saison est lancée sous les meilleurs auspices. Suivez toute l'actualité sur l'application.</p>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {articles.slice(0, 5).map((a: any) => (
                          <div key={a.id} style={{ background: '#1E293B', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <strong style={{ fontSize: '13px', color: '#fff' }}>{a.titre}</strong>
                            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', margin: '6px 0 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                              {a.contenu}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ─ Onglet JOUEURS & IA ─ */}
                {activeTab === 'joueurs' && (
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#fff', marginBottom: '12px' }}>
                      {lang === 'FR' ? 'Joueurs & Talent IA' : 'Players & AI Talent'}
                    </h3>

                    <input
                      type="text"
                      placeholder={lang === 'FR' ? 'Rechercher un joueur...' : 'Search player...'}
                      value={searchPlayer}
                      onChange={e => setSearchPlayer(e.target.value)}
                      style={{
                        width: '100%', background: '#1E293B', border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px', color: '#fff', fontSize: '12.5px', padding: '8px 12px',
                        marginBottom: '12px'
                      }}
                    />

                    {isOffline ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ background: '#1E293B', padding: '10px', borderRadius: '8px', display: 'flex', justifyItems: 'space-between', fontSize: '12px' }}>
                          <div>
                            <strong>Samuel Etoo (Mock)</strong>
                            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Attaquant de pointe</div>
                          </div>
                          <span style={{ marginLeft: 'auto', padding: '3px 6px', background: 'rgba(255,184,0,0.1)', color: '#FFB800', borderRadius: '6px', fontSize: '11px', fontWeight: 800 }}>★ 92</span>
                        </div>
                      </div>
                    ) : filteredJoueurs.length === 0 ? (
                      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '24px' }}>
                        Aucun joueur trouvé.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '350px', overflowY: 'auto' }}>
                        {filteredJoueurs.slice(0, 15).map((j: any) => (
                          <div
                            key={j.id}
                            onClick={() => {
                              // Ouvre la vraie page de détails joueur publique
                              navigate(`/admin/joueurs/${j.id}`);
                            }}
                            style={{
                              background: '#1E293B',
                              padding: '10px',
                              borderRadius: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              fontSize: '12px',
                              cursor: 'pointer',
                              border: '1px solid rgba(255,255,255,0.03)'
                            }}
                          >
                            <div>
                              <strong style={{ color: '#fff' }}>{j.prenom} {j.nom}</strong>
                              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>
                                {j.poste_label || j.poste}
                              </div>
                            </div>
                            {j.talent_score !== null && j.talent_score !== undefined && (
                              <span style={{
                                padding: '3px 8px',
                                background: 'rgba(255,184,0,0.1)',
                                color: '#FFB800',
                                borderRadius: '12px',
                                fontSize: '11px',
                                fontWeight: 800
                              }}>
                                ★ {j.talent_score}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

              </div>
            )}

          </div>

          {/* ── BARRE DE NAVIGATION COMMUNE ── */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: '56px',
            background: '#0B0F19', borderTop: '1px solid rgba(255,255,255,0.08)',
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr',
            alignItems: 'center', justifyItems: 'center', zIndex: 5
          }}>
            <button
              onClick={() => { setActiveTab('matchs'); setSelectedMatch(null); }}
              style={{
                background: 'none', border: 'none', display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: '3px', cursor: 'pointer',
                color: activeTab === 'matchs' ? '#FFB800' : 'rgba(255,255,255,0.4)'
              }}
            >
              <Calendar size={18} />
              <span style={{ fontSize: '9px', fontWeight: 600 }}>Matchs</span>
            </button>

            <button
              onClick={() => { setActiveTab('classement'); setSelectedMatch(null); }}
              style={{
                background: 'none', border: 'none', display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: '3px', cursor: 'pointer',
                color: activeTab === 'classement' ? '#FFB800' : 'rgba(255,255,255,0.4)'
              }}
            >
              <Trophy size={18} />
              <span style={{ fontSize: '9px', fontWeight: 600 }}>Standings</span>
            </button>

            <button
              onClick={() => { setActiveTab('actualites'); setSelectedMatch(null); }}
              style={{
                background: 'none', border: 'none', display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: '3px', cursor: 'pointer',
                color: activeTab === 'actualites' ? '#FFB800' : 'rgba(255,255,255,0.4)'
              }}
            >
              <Newspaper size={18} />
              <span style={{ fontSize: '9px', fontWeight: 600 }}>News</span>
            </button>

            <button
              onClick={() => { setActiveTab('joueurs'); setSelectedMatch(null); }}
              style={{
                background: 'none', border: 'none', display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: '3px', cursor: 'pointer',
                color: activeTab === 'joueurs' ? '#FFB800' : 'rgba(255,255,255,0.4)'
              }}
            >
              <Users size={18} />
              <span style={{ fontSize: '9px', fontWeight: 600 }}>Scouting</span>
            </button>
          </div>

        </div>

        {/* ── PANNEAU DE CONTRÔLE / EXPLICATIF DE L'APPLI MOBILE ── */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '24px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#FFB800', marginBottom: '8px' }}>
              Panneau de Configuration Fan
            </h3>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>
              Personnalisez votre profil de simulation Fan. Ces informations affectent les interactions en direct sur les matchs (commentaires, votes).
            </p>
          </div>

          {/* Configuration pseudo */}
          <div className="form-group">
            <label className="form-label" style={{ color: '#fff', fontSize: '12px' }}>Votre pseudo Lion Indomptable :</label>
            <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
              <input
                type="text"
                value={pseudo}
                onChange={e => handleSavePseudo(e.target.value)}
                className="form-input"
                style={{ background: '#0F172A', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
              />
            </div>
          </div>

          <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)' }} />

          {/* Fonctionnalités validées */}
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#fff', marginBottom: '10px' }}>
              Fonctionnalités simulées :
            </h4>
            <ul style={{ fontSize: '12.5px', color: 'rgba(255,255,255,0.7)', paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '8px', margin: 0 }}>
              <li><strong>Régionalisation Cameroun (FR/EN)</strong> : Cliquez sur 🌐 FR/EN pour traduire l'interface.</li>
              <li><strong>Mode Économie de données (3G)</strong> : Réduit l'actualisation automatique pour préserver la bande passante.</li>
              <li><strong>Mode Hors Ligne (Offline)</strong> : Simule une coupure réseau locale en utilisant des caches ou des données locales hors-ligne.</li>
              <li><strong>Scouting & Radar Charts</strong> : Onglet Scouting → Cliquez sur un joueur pour ouvrir son profil IA et inspecter son radar chart.</li>
              <li><strong>Prédictions IA</strong> : Sélectionnez un match pour voir les probabilités calculées par l'algorithme FECAFOOT IA.</li>
            </ul>
          </div>
        </div>

      </div>

      <style>{`
        @media (max-width: 900px) {
          .fan-grid {
            grid-template-columns: 1fr !important;
            justify-items: center;
          }
        }
      `}</style>
    </div>
  );
}
