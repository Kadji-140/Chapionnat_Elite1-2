// src/pages/coach/CoachContestationsPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getCoachMatchEvents, lodgeContestation, getCoachContestations } from '../../api/contestations.api';
import type { Contestation } from '../../api/contestations.api';
import type { MatchEvent } from '../../api/matchEvents.api';
import { getMatch } from '../../api/matchs.api';
import type { Match } from '../../api/matchs.api';
import { AlertCircle, CheckCircle, Scale, Clock, MessageSquare, ListFilter, Send, Loader2 } from 'lucide-react';
import api from '../../api/axios';
import { useTranslation } from '../../hooks/useTranslation';

export const CoachContestationsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const urlMatchId = id ? parseInt(id, 10) : null;
  const { lang } = useTranslation();
  const isEn = lang === 'en';

  const [activeTab, setActiveTab] = useState<'lodge' | 'history'>(urlMatchId ? 'lodge' : 'history');
  const [matchIdInput, setMatchIdInput] = useState<string>(urlMatchId ? String(urlMatchId) : '');
  const [match, setMatch] = useState<Match | null>(null);
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [history, setHistory] = useState<Contestation[]>([]);
  
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Contestation Form
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [motif, setMotif] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Time remaining helper for the 30-minute rule
  const [minutesRemaining, setMinutesRemaining] = useState<number | null>(null);

  // Completed matches list for dropdown selection
  const [coachMatches, setCoachMatches] = useState<Match[]>([]);
  const [loadingMatches, setLoadingMatches] = useState<boolean>(false);

  // Load contestations history
  const loadHistory = () => {
    setLoading(true);
    getCoachContestations()
      .then((res) => {
        if (res.success) {
          setHistory(res.data);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  // Load match events for contestation
  const loadMatchEvents = (mid: number) => {
    setLoading(true);
    setError('');
    setSuccess('');
    setSelectedEventId(null);
    setMotif('');

    // Fetch match details to verify time limits
    getMatch(mid)
      .then((res) => {
        if (res.success) {
          setMatch(res.data);
          
          // Calculate time remaining (30 min rule)
          if (res.data.statut === 'termine') {
            setMinutesRemaining(35); // matches backend update
          } else {
            setMinutesRemaining(null);
          }

          // Fetch events
          return getCoachMatchEvents(mid);
        } else {
          throw new Error(isEn ? 'Match not found.' : 'Match introuvable.');
        }
      })
      .then((res) => {
        if (res && res.success) {
          setEvents(res.data);
        }
      })
      .catch((err) => {
        console.error(err);
        setError(err.response?.data?.message || (isEn ? 'Error loading match events.' : 'Erreur lors du chargement des événements de ce match.'));
        setMatch(null);
        setEvents([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let interval: any = null;

    if (activeTab === 'history') {
      loadHistory();
      interval = setInterval(() => {
        getCoachContestations()
          .then((res) => {
            if (res.success) {
              setHistory(res.data);
            }
          })
          .catch(err => console.error(err));
      }, 5000);
    } else if (activeTab === 'lodge') {
      const activeMatchId = urlMatchId || (matchIdInput ? parseInt(matchIdInput, 10) : null);
      
      if (activeMatchId) {
        loadMatchEvents(activeMatchId);
        interval = setInterval(() => {
          getMatch(activeMatchId)
            .then((res) => {
              if (res.success) {
                setMatch(res.data);
                if (res.data.statut === 'termine') {
                  setMinutesRemaining(35);
                } else {
                  setMinutesRemaining(null);
                }
                return getCoachMatchEvents(activeMatchId);
              }
            })
            .then((res) => {
              if (res && res.success) {
                setEvents(res.data);
              }
            })
            .catch(err => console.error(err));
        }, 5000);
      } else {
        setLoadingMatches(true);
        api.get('/coach/matchs-a-venir', { params: { statut: 'en_cours,mi_temps,termine' } })
          .then((res: any) => {
            if (res.data?.success) {
              setCoachMatches(res.data.data);
            } else {
              setCoachMatches(res.data || []);
            }
          })
          .catch((err: any) => {
            console.error('Erreur lors du chargement des matchs terminés:', err);
            setError(isEn ? 'Failed to load your matches.' : 'Impossible de charger vos matchs terminés.');
          })
          .finally(() => setLoadingMatches(false));
      }
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [activeTab, urlMatchId, matchIdInput]);

  const handleLodgeContestation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId || !motif.trim()) {
      setError(isEn ? 'Please select an event and write a reason.' : 'Veuillez sélectionner un événement et saisir un motif.');
      return;
    }

    const mid = match?.id || urlMatchId;
    if (!mid) return;

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const res = await lodgeContestation(mid, {
        match_event_id: selectedEventId,
        motif: motif
      });
      
      if (res.success) {
        setSuccess(isEn ? 'Contestation successfully submitted. It will be reviewed by FECAFOOT.' : 'Contestation enregistrée avec succès. Elle va être examinée par la FECAFOOT.');
        setMotif('');
        setSelectedEventId(null);
        // Reload events to show updated status
        loadMatchEvents(mid);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || (isEn ? 'Error submitting dispute.' : 'Erreur lors du dépôt de la contestation.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Scale size={24} style={{ color: '#1B4332' }} />
          {isEn ? 'Referee Disputes' : 'Contestations Arbitrales'}
        </h1>
        <p className="page-subtitle">
          {isEn 
            ? 'Dispute incorrect game events in real-time or right after your match.' 
            : 'Contestez les faits de jeu erronés en temps réel ou juste après la fin de votre match.'}
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '12px' }}>
        <button
          onClick={() => setActiveTab('history')}
          className="btn"
          style={{
            background: 'transparent',
            borderRadius: '0',
            borderBottom: activeTab === 'history' ? '2.5px solid var(--primary)' : '2.5px solid transparent',
            color: activeTab === 'history' ? 'var(--primary)' : 'var(--text-muted)',
            padding: '12px 20px',
            fontWeight: 700,
            boxShadow: 'none'
          }}
        >
          {isEn ? 'Your Dispute History' : 'Historique de vos plaintes'}
        </button>
        <button
          onClick={() => setActiveTab('lodge')}
          className="btn"
          style={{
            background: 'transparent',
            borderRadius: '0',
            borderBottom: activeTab === 'lodge' ? '2.5px solid var(--primary)' : '2.5px solid transparent',
            color: activeTab === 'lodge' ? 'var(--primary)' : 'var(--text-muted)',
            padding: '12px 20px',
            fontWeight: 700,
            boxShadow: 'none'
          }}
        >
          {isEn ? 'File a Dispute' : 'Déposer une contestation'}
        </button>
      </div>

      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '32px' }}>
          <Loader2 className="animate-spin" size={24} style={{ color: '#1B4332' }} />
        </div>
      )}

      {error && (
        <div style={{ padding: '16px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '12px', color: '#991B1B', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AlertCircle size={18} />
          <span style={{ fontSize: '13px', fontWeight: 600 }}>{error}</span>
        </div>
      )}

      {success && (
        <div style={{ padding: '16px', background: '#D8F3DC', border: '1px solid #C2E0C6', borderRadius: '12px', color: '#1B4332', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <CheckCircle size={18} />
          <span style={{ fontSize: '13px', fontWeight: 600 }}>{success}</span>
        </div>
      )}

      {/* Tab content: History */}
      {activeTab === 'history' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {history.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
              <Scale size={48} style={{ color: '#2D6A4F', opacity: 0.4, margin: '0 auto 12px' }} />
              <h3 style={{ margin: '0 0 8px', color: '#1e293b', fontWeight: 700 }}>
                {isEn ? 'No disputes found' : 'Aucune contestation trouvée'}
              </h3>
              <p style={{ color: '#64748b', fontSize: '14px' }}>
                {isEn ? "You haven't filed any disputes yet." : "Vous n'avez pas encore déposé de réclamation."}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {history.map((cont: Contestation) => {
                const matchLabel = cont.match_event?.match 
                  ? `${cont.match_event.match.club_domicile?.nom || ''} vs ${cont.match_event.match.club_exterieur?.nom || ''}`
                  : (isEn ? 'Unknown Match' : 'Match inconnu');

                const statusLabel = isEn
                  ? (cont.statut === 'soumise' ? 'Pending' : cont.statut === 'acceptee' ? 'Accepted' : 'Rejected')
                  : (cont.statut === 'soumise' ? 'En attente' : cont.statut === 'acceptee' ? 'Acceptée' : 'Rejetée');

                return (
                  <div key={cont.id} className="card stagger-item" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '16px' }}>
                      <div>
                        <span style={{ fontSize: '10px', fontWeight: 700, color: '#94A3B8', fontFamily: 'monospace', display: 'block' }}>
                          {isEn ? 'FILED ON' : 'DÉPOSÉ LE'} {new Date(cont.date_contestation).toLocaleString(isEn ? 'en-US' : 'fr-FR')}
                        </span>
                        <h4 style={{ margin: '4px 0 0', fontWeight: 800, fontSize: '16px', color: '#1e293b' }}>{matchLabel}</h4>
                      </div>
                      <span className={`badge ${
                        cont.statut === 'soumise' ? 'badge-warning' :
                        cont.statut === 'acceptee' ? 'badge-success' : 'badge-danger'
                      }`}>
                        {statusLabel}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
                      <div>
                        <div style={{ fontWeight: 700, color: '#1B4332', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                          <MessageSquare size={14} />
                          <span>{isEn ? 'Contested Event:' : 'Événement Contesté :'}</span>
                        </div>
                        <div style={{ background: '#F8FAFC', border: '1px solid var(--border)', padding: '12px', borderRadius: '8px' }}>
                          <span style={{ fontWeight: 700, fontSize: '13px', color: '#1e293b' }}>
                            {isEn ? 'Minute' : 'Minute'} {cont.match_event?.minute}' • {cont.match_event?.type?.toUpperCase() || ''}
                          </span>
                          <span style={{ fontSize: '12px', color: '#64748B', display: 'block', marginTop: '4px' }}>
                            {cont.match_event?.description || (isEn ? 'No further description' : 'Pas de description supplémentaire')}
                          </span>
                        </div>
                        <div style={{ marginTop: '12px' }}>
                          <span style={{ fontWeight: 700, color: '#1B4332', fontSize: '13px', display: 'block', marginBottom: '4px' }}>
                            {isEn ? 'Reason for your complaint:' : 'Motif de votre plainte :'}
                          </span>
                          <span style={{ fontStyle: 'italic', fontSize: '13px', color: '#1E293B' }}>"{cont.motif}"</span>
                        </div>
                      </div>

                      {cont.statut !== 'soumise' && (
                        <div style={{ background: 'rgba(27,67,50,0.03)', border: '1px solid rgba(27,67,50,0.12)', padding: '16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div style={{ fontWeight: 700, color: '#1B4332', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Clock size={14} />
                            <span>{isEn ? 'Federal Decision:' : 'Décision Fédérale :'}</span>
                          </div>
                          <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#1E293B' }}>
                            {cont.decision || (isEn ? 'No written comments.' : 'Aucun commentaire écrit.')}
                          </p>
                          <span style={{ fontSize: '11px', color: '#94A3B8', fontFamily: 'monospace', display: 'block', marginTop: 'auto' }}>
                            {isEn ? 'Processed on' : 'Traité le'} {cont.date_decision ? new Date(cont.date_decision).toLocaleDateString(isEn ? 'en-US' : 'fr-FR') : '-'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab content: Lodge Contestation */}
      {activeTab === 'lodge' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Match Lookup if not preloaded */}
          {!urlMatchId && (
            <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700, color: '#1B4332', marginBottom: '8px', display: 'block' }}>
                  {isEn ? 'Select a match to dispute' : 'Sélectionner un match terminé à contester'}
                </label>
                {loadingMatches ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 0' }}>
                    <Loader2 className="animate-spin" size={18} style={{ color: '#1B4332' }} />
                    <span style={{ fontSize: '13px', color: '#64748b' }}>
                      {isEn ? 'Loading matches...' : 'Chargement de vos matchs terminés...'}
                    </span>
                  </div>
                ) : coachMatches.length === 0 ? (
                  <div style={{ padding: '12px', background: '#F8FAFC', borderRadius: '8px', border: '1px dashed #CBD5E1', fontSize: '13px', color: '#64748b', textAlign: 'center' }}>
                    {isEn ? 'No recent matches available for dispute.' : "Aucun match terminé récent n'est disponible pour contestation."}
                  </div>
                ) : (
                  <select
                    className="form-input"
                    value={matchIdInput}
                    onChange={(e) => {
                      const val = e.target.value;
                      setMatchIdInput(val);
                      if (val) {
                        loadMatchEvents(parseInt(val, 10));
                      } else {
                        setMatch(null);
                        setEvents([]);
                      }
                    }}
                    style={{ width: '100%', height: '42px', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#fff' }}
                  >
                    <option value="">{isEn ? '-- Select a match --' : '-- Choisir un match terminé --'}</option>
                    {coachMatches.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.club_domicile?.nom} vs {m.club_exterieur?.nom} ({isEn ? 'Matchday' : 'Journée'} {m.journee}) - {m.date_heure ? new Date(m.date_heure).toLocaleDateString(isEn ? 'en-US' : 'fr-FR') : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          )}

          {match && (
            <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border)', paddingBottom: '12px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h3 style={{ margin: 0, fontWeight: 800, fontSize: '18px', color: '#1e293b' }}>
                    {match.club_domicile.nom} vs {match.club_exterieur.nom}
                  </h3>
                  <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', display: 'block', marginTop: '2px' }}>
                    {match.stade} • {match.date_heure ? new Date(match.date_heure).toLocaleString(isEn ? 'en-US' : 'fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : match.date_heure_fr}
                  </span>
                </div>
                
                {/* Check match state */}
                {!['en_cours', 'mi_temps', 'termine'].includes(match.statut) ? (
                  <div className="badge badge-warning" style={{ padding: '6px 12px' }}>
                    <Clock size={12} />
                    <span>{isEn ? 'Status:' : 'Statut :'} {match.statut_label} ({isEn ? 'Disabled' : 'Désactivées'})</span>
                  </div>
                ) : ['en_cours', 'mi_temps'].includes(match.statut) ? (
                  <div className="badge badge-success animate-pulse" style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={12} />
                    <span>{isEn ? 'Live Active' : 'Temps Réel Actif'}</span>
                  </div>
                ) : (
                  <div className="badge badge-danger animate-pulse" style={{ padding: '6px 12px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', height: 'auto', gap: '2px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} />
                      <span>{isEn ? 'Active Window (30 min)' : 'Fenêtre active (30 min)'}</span>
                    </div>
                    {minutesRemaining !== null && (
                      <span style={{ fontSize: '10px', opacity: 0.9 }}>{isEn ? 'Remaining:' : 'Limite :'} {minutesRemaining} min</span>
                    )}
                  </div>
                )}
              </div>

              {/* Match Events list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#1B4332', display: 'flex', alignItems: 'center', gap: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  <ListFilter size={16} style={{ color: '#2D6A4F' }} />
                  <span>{isEn ? 'Select the event to dispute' : "Sélectionnez l'événement à contester"}</span>
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                  {/* Event selector */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '380px', overflowY: 'auto', paddingRight: '8px' }}>
                    {events
                      .filter(e => e.statut === 'valide')
                      .map((ev) => {
                        const isSelected = selectedEventId === ev.id;
                        const hasCont = !!ev.contestation;

                        return (
                          <button
                            key={ev.id}
                            type="button"
                            disabled={hasCont || !['en_cours', 'mi_temps', 'termine'].includes(match.statut)}
                            onClick={() => setSelectedEventId(ev.id)}
                            className="w-full text-left flex items-start gap-3 select-none transition-all duration-200"
                            style={{
                              padding: '14px',
                              borderRadius: 'var(--border-radius-sm)',
                              border: isSelected ? '1.5px solid var(--primary)' : '1.5px solid var(--border)',
                              background: isSelected ? 'var(--primary-50)' : hasCont ? '#f8fafc' : 'var(--bg-card)',
                              opacity: hasCont ? 0.6 : 1,
                              cursor: hasCont || !['en_cours', 'mi_temps', 'termine'].includes(match.statut) ? 'not-allowed' : 'pointer',
                              boxShadow: isSelected ? '0 0 0 3px rgba(27, 67, 50, 0.10)' : 'none'
                            }}
                          >
                            <span style={{ fontFamily: 'monospace', fontWeight: 800, color: 'var(--primary)', background: 'rgba(27,67,50,0.1)', padding: '2px 6px', borderRadius: '4px', fontSize: '12px', marginTop: '2px' }}>
                              {ev.minute}'
                            </span>
                            <div style={{ flex: 1 }}>
                              <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', display: 'block', letterSpacing: '0.5px' }}>
                                 {ev.type?.replace('_', ' ') || ''}
                              </span>
                              <span style={{ fontSize: '13px', fontWeight: 600, color: '#1E293B', display: 'block', marginTop: '2px' }}>
                                {ev.joueur ? `${ev.joueur.prenom} ${ev.joueur.nom}` : ev.description}
                              </span>
                              {hasCont && (
                                <span className="badge badge-warning" style={{ marginTop: '6px', fontSize: '10px' }}>
                                  {isEn ? 'Already disputed' : 'Déjà contesté'}
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                  </div>

                  {/* Motive form */}
                  {selectedEventId ? (
                    <form onSubmit={handleLodgeContestation} className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', background: '#F8FAFC', height: 'fit-content' }}>
                      <h5 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#1B4332', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <MessageSquare size={16} style={{ color: '#2D6A4F' }} />
                        <span>{isEn ? 'Dispute Reason' : 'Motif du Litige'}</span>
                      </h5>

                      <div className="form-group">
                        <label className="form-label">
                          {isEn 
                            ? 'Why are you disputing this event? (Proof/Arguments - Min. 20 chars)'
                            : 'Pourquoi contestez-vous cet événement ? (Preuves/Arguments - Min. 20 caractères)'}
                        </label>
                        <textarea
                          rows={4}
                          value={motif}
                          onChange={(e) => setMotif(e.target.value)}
                          placeholder={isEn 
                            ? "Describe the error precisely: e.g., 'The goal scorer was not #9 but our defender scoring an own goal'."
                            : "Décrivez précisément l'erreur : e.g., 'Le buteur n'était pas le numéro 9 mais notre défenseur contre son camp'."}
                          className="form-textarea"
                        />
                        {motif.trim().length > 0 && motif.trim().length < 20 && (
                          <span style={{ fontSize: '11px', color: '#DC2626', fontWeight: 600, marginTop: '4px', display: 'block' }}>
                            {isEn 
                              ? `The reason must contain at least 20 characters (current: ${motif.trim().length}).`
                              : `Le motif doit contenir au moins 20 caractères (actuellement : ${motif.trim().length}).`}
                          </span>
                        )}
                      </div>

                      <button
                        type="submit"
                        disabled={submitting || motif.trim().length < 20}
                        className="btn btn-primary"
                        style={{ width: '100%', justifyContent: 'center' }}
                      >
                        <Send size={14} />
                        <span>{submitting ? (isEn ? 'Sending...' : 'Envoi...') : (isEn ? 'Submit Dispute' : 'Déposer la plainte')}</span>
                      </button>
                    </form>
                  ) : (
                    <div className="card" style={{ borderStyle: 'dashed', textAlign: 'center', padding: '32px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
                      <Scale size={32} style={{ color: '#2D6A4F', opacity: 0.4, marginBottom: '8px' }} />
                      <p style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>
                        {isEn ? 'Select an Event' : 'Sélectionnez un événement'}
                      </p>
                      <p style={{ color: '#64748b', fontSize: '12px', margin: 0 }}>
                        {isEn 
                          ? 'Choose a match event from the list on the left to detail your dispute.'
                          : 'Choisissez un fait de jeu dans la liste de gauche pour détailler votre contestation.'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
export default CoachContestationsPage;
