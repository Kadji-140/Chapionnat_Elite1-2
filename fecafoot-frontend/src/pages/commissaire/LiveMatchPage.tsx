// src/pages/commissaire/LiveMatchPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  getCommissaireMatch,
  demarrerMatch,
  miTempsMatch,
  repriseMatch,
  cloturerMatch,
  storeMatchEvent,
  updateMatchEvent,
  deleteMatchEvent,
  traiterContestation,
  ajouterTempsAdditionnel,
  activerProlongation,
  prolongationMiTemps,
  prolongationReprise,
  activerTirsAuBut
} from '../../api/matchEvents.api';
import type { Match } from '../../api/matchs.api';
import type { MatchEvent, StoreEventParams } from '../../api/matchEvents.api';
import { ScoreBoard } from '../../components/matchs/ScoreBoard';
import { MatchTimer } from '../../components/matchs/MatchTimer';
import { EventTimeline } from '../../components/matchs/EventTimeline';
import { EventModal } from '../../components/matchs/EventModal';
import {
  Play,
  Pause,
  CheckSquare,
  PlusCircle,
  ArrowLeft,
  Shield,
  Loader2,
  AlertCircle,
  FileText,
  Activity,
  Settings,
  XCircle,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';

const getStadeImageUrl = (stadeNom: string | null | undefined): string => {
  if (!stadeNom) return '/stadium-bg.jpg';

  // Générer le slug du stade
  const slug = stadeNom
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Enlever accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  return `/stades/${slug}.jpg`;
};

const ShootoutKickForm: React.FC<{
  match: Match;
  clubId: number;
  clubNom: string;
  isEn: boolean;
  onSubmit: (joueurId: number | null, reussi: boolean) => Promise<void>;
}> = ({ match, clubId, clubNom, isEn, onSubmit }) => {
  const [selectedJoueur, setSelectedJoueur] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  // Récupérer les titulaires et remplaçants du club
  const players = React.useMemo(() => {
    const composition = match.compositions?.find((c: any) => c.club_id === clubId);
    if (!composition) return [];
    const tits = composition.titulaires || [];
    const remps = composition.remplacants || [];
    return [...tits, ...remps];
  }, [match.compositions, clubId]);

  const handleKick = async (reussi: boolean) => {
    setSubmitting(true);
    try {
      await onSubmit(selectedJoueur ? parseInt(selectedJoueur) : null, reussi);
      setSelectedJoueur('');
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ fontSize: '13px', fontWeight: 800, color: '#1e293b' }}>
        {isEn ? `Shoot for ${clubNom}` : `Tir pour ${clubNom}`}
      </div>
      
      <div>
        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>
          {isEn ? 'Select Shooter (Optional)' : 'Sélectionner le Tireur (Optionnel)'}
        </label>
        <select
          value={selectedJoueur}
          onChange={(e) => setSelectedJoueur(e.target.value)}
          style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px', background: 'white' }}
        >
          <option value="">-- {isEn ? 'Select Player' : 'Choisir le Joueur'} --</option>
          {players.map((p: any) => (
            <option key={p.joueur.id} value={p.joueur.id}>
              #{p.num_maillot || '?'} - {p.joueur.nom_complet || `${p.joueur.nom} ${p.joueur.prenom}`}
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '4px' }}>
        <button
          onClick={() => handleKick(true)}
          disabled={submitting}
          style={{
            padding: '12px', background: '#10b981', color: 'white', border: 'none',
            borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontSize: '12px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
          }}
        >
          {submitting ? <Loader2 size={14} className="animate-spin" /> : '✓'} {isEn ? 'Scored' : 'Réussi'}
        </button>
        <button
          onClick={() => handleKick(false)}
          disabled={submitting}
          style={{
            padding: '12px', background: '#ef4444', color: 'white', border: 'none',
            borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontSize: '12px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
          }}
        >
          {submitting ? <Loader2 size={14} className="animate-spin" /> : '✗'} {isEn ? 'Missed' : 'Manqué'}
        </button>
      </div>
    </div>
  );
};

export const LiveMatchPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const matchId = parseInt(id || '0', 10);
  const navigate = useNavigate();
  const { lang } = useTranslation();
  const isEn = lang === 'en';

  const [match, setMatch] = useState<Match | null>(null);
  const [stadeImageError, setStadeImageError] = useState<boolean>(false);
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Timer state
  const [currentMinute, setCurrentMinute] = useState<number>(0);
  const [formattedTime, setFormattedTime] = useState<string>('00:00');
  const [periodEndModal, setPeriodEndModal] = useState<{ show: boolean; minute: number } | null>(null);
  const [stoppageTimeInput, setStoppageTimeInput] = useState<string>('3');
  const [prolongationDurationInput, setProlongationDurationInput] = useState<string>('15');

  // Clock offset & tab state
  const [serverTimeOffset, setServerTimeOffset] = useState<number>(0);
  const [rightTab, setRightTab] = useState<'timeline' | 'contestations'>('timeline');
  const [decisionTexts, setDecisionTexts] = useState<Record<number, string>>({});

  // Event modal state
  const [isEventModalOpen, setIsEventModalOpen] = useState<boolean>(false);
  const [editingEvent, setEditingEvent] = useState<MatchEvent | null>(null);
  const [prepopulatedFields, setPrepopulatedFields] = useState<{
    type?: string;
    clubId?: number;
    joueurId?: number;
    joueurRemplacantId?: number;
  } | null>(null);
  const [savingEvent, setSavingEvent] = useState<boolean>(false);

  const getDemarrageError = (): string | null => {
    if (!match) return null;
    if (match.statut !== 'programme') return null;
    if (!match.stade || match.stade.trim() === '') {
      return isEn 
        ? "The stadium / match venue is not specified." 
        : "Le stade / lieu de la rencontre n'est pas renseigné.";
    }
    if (!match.arbitre_principal) {
      return isEn
        ? "No main referee is assigned to this match."
        : "Aucun arbitre principal n'est assigné à cette rencontre.";
    }

    const compoDom = match.compositions?.find((c: any) => c.club_id === match.club_domicile.id);
    const compoExt = match.compositions?.find((c: any) => c.club_id === match.club_exterieur.id);

    if (!compoDom || !compoDom.est_confirmee) {
      return isEn
        ? `The home team lineup (${match.club_domicile?.nom || 'Home'}) has not been confirmed yet by their coach.`
        : `La composition de l'équipe à domicile (${match.club_domicile?.nom || 'Domicile'}) n'est pas encore confirmée par son coach.`;
    }
    if (!compoExt || !compoExt.est_confirmee) {
      return isEn
        ? `The away team lineup (${match.club_exterieur?.nom || 'Away'}) has not been confirmed yet by their coach.`
        : `La composition de l'équipe à l'extérieur (${match.club_exterieur?.nom || 'Extérieur'}) n'est pas encore confirmée par son coach.`;
    }

    if (match.date_heure) {
      const matchTime = new Date(match.date_heure).getTime();
      const nowTime = new Date().getTime() + serverTimeOffset; // Corrigé avec l'offset serveur !
      const twoHours = 2 * 60 * 60 * 1000;

      if (nowTime < matchTime - twoHours) {
        const dateStr = new Date(match.date_heure).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return isEn
          ? `It is too early to start. Scheduled at ${dateStr}, you will be able to start 2 hours before.`
          : `Il est trop tôt pour démarrer. Prévue à ${dateStr}, vous pourrez démarrer 2 heures avant.`;
      }
    }

    return null;
  };

  const demarrageError = getDemarrageError();

  const fetchMatchData = async () => {
    try {
      const res = await getCommissaireMatch(matchId);
      if (res.success) {
        setMatch(res.data);

        // Calcul de la désynchronisation horaire
        if ((res.data as any).server_time) {
          const sTime = new Date((res.data as any).server_time).getTime();
          const cTime = new Date().getTime();
          setServerTimeOffset(sTime - cTime);
        }

        const matchEvents = (res.data as any).events || [];
        setEvents(matchEvents);

        if (res.data.statut === 'en_cours') {
          const elapsed = (res.data as any).elapsed_seconds || 0;
          setCurrentMinute(Math.floor(elapsed / 60));
        } else if (res.data.statut === 'mi_temps' || res.data.periode === 'mi_temps') {
          setCurrentMinute(45);
        } else if (res.data.periode === 'prolongation_mi_temps') {
          setCurrentMinute(90 + (res.data.duree_prolongation || 15));
        } else if (res.data.periode === 'tirs_au_but') {
          setCurrentMinute(90 + 2 * (res.data.duree_prolongation || 15));
        } else if (res.data.statut === 'termine' || res.data.statut === 'homologue') {
          const hasProlongation = res.data.prolongation_started_at || res.data.second_half_prolongation_started_at;
          setCurrentMinute(hasProlongation ? 90 + 2 * (res.data.duree_prolongation || 15) : 90);
        }
      } else {
        setError(isEn ? 'Unable to load match.' : 'Impossible de charger le match.');
      }
    } catch (err) {
      console.error(err);
      setError(isEn ? 'Network error while loading data.' : 'Erreur réseau lors du chargement des données.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatchData();
    const interval = setInterval(() => {
      fetchMatchData();
    }, 5000);
    return () => clearInterval(interval);
  }, [matchId]);

  const handleTimeChange = (mins: number, secs: number) => {
    setCurrentMinute(mins);
    setFormattedTime(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
  };

  const handleStart = async () => {
    setActionLoading(true);
    try {
      const res = await demarrerMatch(matchId);
      if (res.success) {
        setMatch(res.data);
        fetchMatchData();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || (isEn ? 'Error while starting the match.' : 'Erreur lors du démarrage du match.'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleHalftime = async () => {
    setActionLoading(true);
    try {
      const res = await miTempsMatch(matchId);
      if (res.success) {
        setMatch(res.data);
        fetchMatchData();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || (isEn ? 'Error while pausing for halftime.' : 'Erreur lors du passage à la mi-temps.'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleResume = async () => {
    setActionLoading(true);
    try {
      const res = await repriseMatch(matchId);
      if (res.success) {
        setMatch(res.data);
        fetchMatchData();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || (isEn ? 'Error while resuming the match.' : 'Erreur lors de la reprise du match.'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleCloturer = async () => {
    const confirmMsg = isEn
      ? 'Are you sure you want to end the match? Field stats will be saved.'
      : 'Êtes-vous sûr de vouloir siffler la fin du match ? Les statistiques terrain seront enregistrées.';
    if (!window.confirm(confirmMsg)) {
      return;
    }
    setActionLoading(true);
    try {
      const res = await cloturerMatch(matchId);
      if (res.success) {
        setMatch(res.data);
        navigate(`/commissaire/live/${matchId}/rapport`);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || (isEn ? 'Error while ending the match.' : 'Erreur lors de la clôture du match.'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmStoppageTime = async (minutes: number) => {
    setActionLoading(true);
    try {
      const res = await ajouterTempsAdditionnel(matchId, minutes);
      if (res.success) {
        setMatch(res.data);
        fetchMatchData();
        setPeriodEndModal(null);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de l\'ajout du temps additionnel.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmProlongation = async (duree: number) => {
    setActionLoading(true);
    try {
      const res = await activerProlongation(matchId, duree);
      if (res.success) {
        setMatch(res.data);
        fetchMatchData();
        setPeriodEndModal(null);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de l\'activation des prolongations.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleProlongationMiTemps = async () => {
    setActionLoading(true);
    try {
      const res = await prolongationMiTemps(matchId);
      if (res.success) {
        setMatch(res.data);
        fetchMatchData();
        setPeriodEndModal(null);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du passage à la mi-temps des prolongations.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleProlongationReprise = async () => {
    setActionLoading(true);
    try {
      const res = await prolongationReprise(matchId);
      if (res.success) {
        setMatch(res.data);
        fetchMatchData();
        setPeriodEndModal(null);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la reprise des prolongations.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmTirsAuBut = async () => {
    setActionLoading(true);
    try {
      const res = await activerTirsAuBut(matchId);
      if (res.success) {
        setMatch(res.data);
        fetchMatchData();
        setPeriodEndModal(null);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de l\'activation des tirs au but.');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePeriodEnd = (minute: number) => {
    setPeriodEndModal({ show: true, minute });
  };

  const handleEventSubmit = async (params: StoreEventParams) => {
    setSavingEvent(true);
    try {
      if (editingEvent) {
        await updateMatchEvent(editingEvent.id, params);
      } else {
        await storeMatchEvent(matchId, params);
      }
      await fetchMatchData();
    } catch (err: any) {
      setError(err.response?.data?.message || (isEn ? 'Error while saving the event.' : 'Erreur lors de l\'enregistrement de l\'événement.'));
    } finally {
      setSavingEvent(false);
      setEditingEvent(null);
    }
  };

  const handleEventDelete = async (eventId: number) => {
    const confirmMsg = isEn 
      ? 'Do you really want to delete this event? The score will be updated.'
      : 'Voulez-vous vraiment supprimer cet événement ? le score sera mis à jour.';
    if (!window.confirm(confirmMsg)) {
      return;
    }
    setSavingEvent(true);
    try {
      await deleteMatchEvent(eventId);
      await fetchMatchData();
    } catch (err: any) {
      setError(err.response?.data?.message || (isEn ? 'Error while deleting the event.' : 'Erreur lors de la suppression de l\'événement.'));
    } finally {
      setSavingEvent(false);
    }
  };

  const handleTraiterContestation = async (contestationId: number, action: 'accepter' | 'rejeter') => {
    const decision = decisionTexts[contestationId] || '';
    if (action === 'rejeter' && !decision.trim()) {
      alert(isEn ? 'Please enter a decision or comment to justify the rejection.' : 'Veuillez saisir une décision ou un commentaire pour justifier le rejet de la contestation.');
      return;
    }

    const confirmMsg = isEn
      ? `Are you sure you want to ${action === 'accepter' ? 'accept (invalidate event)' : 'reject'} this dispute?`
      : `Êtes-vous sûr de vouloir ${action === 'accepter' ? 'accepter (invalider l\'événement)' : 'rejeter'} cette contestation ?`;

    if (!window.confirm(confirmMsg)) {
      return;
    }

    setSavingEvent(true);
    try {
      const res = await traiterContestation(matchId, contestationId, action, decision);
      if (res.success) {
        await fetchMatchData();
        // Vider le champ de saisie
        setDecisionTexts(prev => {
          const next = { ...prev };
          delete next[contestationId];
          return next;
        });
      }
    } catch (err: any) {
      setError(err.response?.data?.message || (isEn ? 'Error while processing the dispute.' : 'Erreur lors du traitement de la contestation.'));
    } finally {
      setSavingEvent(false);
    }
  };

  const handleOpenAddModal = (fields?: {
    type?: string;
    clubId?: number;
    joueurId?: number;
    joueurRemplacantId?: number;
  }) => {
    setEditingEvent(null);
    setPrepopulatedFields(fields || null);
    setIsEventModalOpen(true);
  };

  const handleOpenEditModal = (event: MatchEvent) => {
    setEditingEvent(event);
    setIsEventModalOpen(true);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '16px' }}>
        <div style={{ position: 'relative', width: '64px', height: '64px' }}>
          <div className="animate-spin" style={{ width: '64px', height: '64px', border: '4px solid #dcfce7', borderTopColor: '#059669', borderRadius: '50%' }}></div>
          <Loader2 className="animate-pulse" style={{ position: 'absolute', inset: 0, margin: 'auto', width: '32px', height: '32px', color: '#059669' }} />
        </div>
        <p className="animate-pulse" style={{ fontSize: '14px', fontWeight: 500, color: '#475569' }}>
          {isEn ? 'Loading match...' : 'Chargement de la rencontre...'}
        </p>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="animate-fade-in-up" style={{ maxWidth: '400px', margin: '64px auto', padding: '32px', backgroundColor: '#ffffff', borderRadius: '24px', textAlign: 'center', border: '1px solid #E2E8F0', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
        <div style={{ width: '80px', height: '80px', backgroundColor: '#FEF2F2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <AlertCircle size={40} style={{ color: '#EF4444' }} />
        </div>
        <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#1E293B', marginBottom: '8px' }}>{isEn ? 'Match not found' : 'Match introuvable'}</h3>
        <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '24px', lineHeight: '1.5' }}>{isEn ? 'The requested match does not exist or is not accessible.' : 'La rencontre demandée n\'existe pas ou n\'est pas accessible.'}</p>
        <Link to="/commissaire/matchs" className="btn-back" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none', padding: '10px 20px', justifySelf: 'center', justifyContent: 'center' }}>
          <ArrowLeft size={18} />
          <span>{isEn ? 'Back to list' : 'Retour à la liste'}</span>
        </Link>
      </div>
    );
  }

  const isLive = ['en_cours', 'mi_temps'].includes(match.statut);

  const getClubPlayers = (cid: number) => {
    const composition = match?.compositions?.find((c: any) => c.club_id === cid);
    if (!composition) return [];
    const tits = composition.titulaires || [];
    const remps = composition.remplacants || [];
    return [...tits, ...remps];
  };

  return (
    <div className="live-container">
      <div className="live-content">

        {/* Navigation & Title */}
        <div className="live-header">
          <Link to="/commissaire/matchs" className="btn-back">
            <ArrowLeft size={20} />
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="header-icon-container">
              <Activity size={20} className="animate-pulse" />
            </div>
            <div>
              <h1 className="header-title">{isEn ? 'Match Live' : 'Direct Live'}</h1>
              <p className="header-subtitle">{isEn ? 'Control panel and match monitoring' : 'Panneau de contrôle et suivi de la rencontre'}</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="error-banner">
            <AlertCircle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '14px', fontWeight: 600, margin: 0 }}>{error}</p>
            </div>
            <button onClick={() => setError('')} className="error-close">
              <XCircle size={18} />
            </button>
          </div>
        )}

        {/* Main Score Board with Premium Stadium Background */}
        <div style={{
          marginBottom: '24px',
          transition: 'all 0.3s ease',
          backgroundImage: `linear-gradient(to bottom, rgba(0, 0, 0, 0.55), rgba(0, 0, 0, 0.80)), url('${stadeImageError ? '/stadium-bg.jpg' : getStadeImageUrl(match.stade)}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          borderRadius: '24px',
          padding: '24px',
          border: '1px solid rgba(74, 222, 128, 0.25)',
          boxShadow: '0 12px 30px rgba(27, 67, 50, 0.25)'
        }}>
          <img
            src={getStadeImageUrl(match.stade)}
            alt=""
            style={{ display: 'none' }}
            onError={() => setStadeImageError(true)}
          />
          <ScoreBoard match={match} liveTime={formattedTime} transparentBackground={true} />
        </div>

        {/* Penalty Shootout Panel */}
        {match && match.periode === 'tirs_au_but' && (
          <div className="card-container" style={{ marginBottom: '24px', border: '2px solid #1B4332' }}>
            <div className="card-header" style={{ background: 'linear-gradient(135deg, #1B4332 0%, #081C15 100%)' }}>
              <Activity size={18} style={{ color: '#86efac' }} />
              <h3 className="card-header-title">{isEn ? 'Penalty Shootout Session' : 'Séance de Tirs au But'}</h3>
              <div style={{ marginLeft: 'auto', background: '#16a34a', color: 'white', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 800 }}>
                LIVE TAB
              </div>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Shootout Score Display */}
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '32px', padding: '16px 0', borderBottom: '1px dashed #e2e8f0' }}>
                <div style={{ textAlign: 'right', flex: 1 }}>
                  <div style={{ fontWeight: 800, color: '#1e293b', fontSize: '16px' }}>{match.club_domicile.nom}</div>
                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', marginTop: '8px', flexWrap: 'wrap' }}>
                    {events.filter(e => e.type === 'tab' && e.club_id === match.club_domicile.id).map((e, idx) => (
                      <span key={e.id || idx} style={{
                        width: '24px', height: '24px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        background: e.description === 'reussi' ? '#10b981' : '#ef4444', color: 'white', fontSize: '12px', fontWeight: 900
                      }}>
                        {e.description === 'reussi' ? '✓' : '✗'}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div style={{
                  fontSize: '32px', fontWeight: 900, fontFamily: 'monospace', color: '#1B4332',
                  background: '#f0fdf4', padding: '8px 20px', borderRadius: '12px', border: '1px solid #bbf7d0'
                }}>
                  {match.score_domicile_tab || 0} - {match.score_exterieur_tab || 0}
                </div>

                <div style={{ textAlign: 'left', flex: 1 }}>
                  <div style={{ fontWeight: 800, color: '#1e293b', fontSize: '16px' }}>{match.club_exterieur.nom}</div>
                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-start', marginTop: '8px', flexWrap: 'wrap' }}>
                    {events.filter(e => e.type === 'tab' && e.club_id === match.club_exterieur.id).map((e, idx) => (
                      <span key={e.id || idx} style={{
                        width: '24px', height: '24px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        background: e.description === 'reussi' ? '#10b981' : '#ef4444', color: 'white', fontSize: '12px', fontWeight: 900
                      }}>
                        {e.description === 'reussi' ? '✓' : '✗'}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Record Kick Forms */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
                  <ShootoutKickForm
                    match={match}
                    clubId={match.club_domicile.id}
                    clubNom={match.club_domicile.nom}
                    isEn={isEn}
                    onSubmit={async (joueurId, reussi) => {
                      await storeMatchEvent(matchId, {
                        type: 'tab',
                        minute: 120,
                        club_id: match.club_domicile.id,
                        joueur_id: joueurId || null,
                        description: reussi ? 'reussi' : 'rate'
                      });
                      fetchMatchData();
                    }}
                  />

                  <ShootoutKickForm
                    match={match}
                    clubId={match.club_exterieur.id}
                    clubNom={match.club_exterieur.nom}
                    isEn={isEn}
                    onSubmit={async (joueurId, reussi) => {
                      await storeMatchEvent(matchId, {
                        type: 'tab',
                        minute: 120,
                        club_id: match.club_exterieur.id,
                        joueur_id: joueurId || null,
                        description: reussi ? 'reussi' : 'rate'
                      });
                      fetchMatchData();
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Control center & Split view */}
        <div className="live-grid">

          {/* Left Column (2/3 width) - Game Controls & Rosters */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {/* Action Center Card */}
            <div className="card-container">
              <div className="card-header">
                <Settings size={18} style={{ color: '#A3C4A6' }} />
                <h3 className="card-header-title">{isEn ? 'Control Panel' : 'Panneau de Contrôle'}</h3>
              </div>

              <div className="card-body">
                <div className="control-grid">
                  {/* Official Timer widget */}
                  <MatchTimer
                    statut={match.statut}
                    initialMinutes={currentMinute}
                    onTimeChange={handleTimeChange}
                    periode={match.periode}
                    tempsAdditionnel={
                      match.periode === '1ere_mi_temps'
                        ? (match.temps_additionnel_1er || 0)
                        : match.periode === '2e_mi_temps'
                        ? (match.temps_additionnel_2e || 0)
                        : match.periode === 'prolongation_1'
                        ? (match.temps_additionnel_prolongation_1 || 0)
                        : match.periode === 'prolongation_2'
                        ? (match.temps_additionnel_prolongation_2 || 0)
                        : 0
                    }
                    dureeProlongation={match.duree_prolongation}
                    onPeriodEnd={handlePeriodEnd}
                  />

                  {/* Match Workflow actions */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '1px' }}>
                      {isEn ? 'Match actions' : 'Commandes du match'}
                    </div>

                    {match.statut === 'programme' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {demarrageError && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '10px', color: '#92400E', fontSize: '12px', fontWeight: 500 }}>
                            <AlertCircle size={16} style={{ color: '#D97706', flexShrink: 0 }} />
                            <span>{demarrageError}</span>
                          </div>
                        )}
                        <button
                          onClick={handleStart}
                          disabled={actionLoading || !!demarrageError}
                          className="btn-workflow btn-start"
                          style={{ opacity: (actionLoading || !!demarrageError) ? 0.6 : 1, cursor: (actionLoading || !!demarrageError) ? 'not-allowed' : 'pointer' }}
                        >
                          <Play className="animate-pulse" style={{ width: '20px', height: '20px', fill: 'currentColor' }} />
                          <span>{isEn ? 'Start the match' : 'Démarrer la rencontre'}</span>
                        </button>
                      </div>
                    )}

                    {match.statut === 'en_cours' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {/* 1ère Mi-temps */}
                        {match.periode === '1ere_mi_temps' && (
                          <button
                            onClick={handleHalftime}
                            disabled={actionLoading}
                            className="btn-workflow btn-halftime"
                          >
                            <Pause style={{ width: '20px', height: '20px' }} />
                            <span>{isEn ? "Whistle Halftime" : "Siffler la Mi-temps"}</span>
                          </button>
                        )}

                        {/* 2ème Mi-temps */}
                        {match.periode === '2e_mi_temps' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <button
                              onClick={handleCloturer}
                              disabled={actionLoading}
                              className="btn-workflow btn-end"
                            >
                              <CheckSquare style={{ width: '20px', height: '20px' }} />
                              <span>{isEn ? "End of Match (90')" : "Fin de la Rencontre (90')"}</span>
                            </button>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                              <button
                                onClick={() => handleConfirmProlongation(15)}
                                disabled={actionLoading}
                                className="btn-workflow"
                                style={{ background: '#16a34a', padding: '10px' }}
                              >
                                {isEn ? 'Extra Time' : '+ Prolongations'}
                              </button>
                              <button
                                onClick={handleConfirmTirsAuBut}
                                disabled={actionLoading}
                                className="btn-workflow"
                                style={{ background: '#475569', padding: '10px' }}
                              >
                                {isEn ? 'Shootout' : 'Tirs au But'}
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Prolongation 1 */}
                        {match.periode === 'prolongation_1' && (
                          <button
                            onClick={handleProlongationMiTemps}
                            disabled={actionLoading}
                            className="btn-workflow btn-halftime"
                          >
                            <Pause style={{ width: '20px', height: '20px' }} />
                            <span>{isEn ? "ET Halftime" : "Mi-temps Prolongations"}</span>
                          </button>
                        )}

                        {/* Prolongation 2 */}
                        {match.periode === 'prolongation_2' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <button
                              onClick={handleCloturer}
                              disabled={actionLoading}
                              className="btn-workflow btn-end"
                            >
                              <CheckSquare style={{ width: '20px', height: '20px' }} />
                              <span>{isEn ? "End of Match (120')" : "Fin du Match (120')"}</span>
                            </button>
                            <button
                              onClick={handleConfirmTirsAuBut}
                              disabled={actionLoading}
                              className="btn-workflow"
                              style={{ background: '#475569' }}
                            >
                              {isEn ? 'Penalty Shootout' : 'Séance de Tirs au But'}
                            </button>
                          </div>
                        )}

                        {/* Tirs au but */}
                        {match.periode === 'tirs_au_but' && (
                          <button
                            onClick={handleCloturer}
                            disabled={actionLoading}
                            className="btn-workflow btn-end"
                          >
                            <CheckSquare style={{ width: '20px', height: '20px' }} />
                            <span>{isEn ? "End Match (After Shootout)" : "Clôturer après Tirs au But"}</span>
                          </button>
                        )}
                      </div>
                    )}

                    {match.statut === 'mi_temps' && (
                      <button
                        onClick={handleResume}
                        disabled={actionLoading}
                        className="btn-workflow btn-resume"
                      >
                        <Play style={{ width: '20px', height: '20px', fill: 'currentColor' }} />
                        <span>{isEn ? 'Resume match' : 'Reprendre le match'}</span>
                      </button>
                    )}

                    {match.periode === 'prolongation_mi_temps' && (
                      <button
                        onClick={handleProlongationReprise}
                        disabled={actionLoading}
                        className="btn-workflow btn-resume"
                      >
                        <Play style={{ width: '20px', height: '20px', fill: 'currentColor' }} />
                        <span>{isEn ? 'Resume ET' : 'Reprendre les Prolongations'}</span>
                      </button>
                    )}

                    {match.statut === 'termine' && (
                      <Link
                        to={`/commissaire/live/${matchId}/rapport`}
                        className="btn-workflow btn-report-link"
                      >
                        <FileText style={{ width: '20px', height: '20px' }} />
                        <span>{isEn ? 'Write and sign report' : 'Rédiger et signer le rapport'}</span>
                      </Link>
                    )}

                    {/* Saisie rapide d'événements */}
                    {isLive && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', border: '1px solid rgba(27, 67, 50, 0.15)', padding: '16px', borderRadius: '16px', background: 'rgba(27, 67, 50, 0.02)', boxShadow: '0 4px 12px rgba(0,0,0,0.01)' }}>
                        <div style={{ fontSize: '11px', fontWeight: 900, color: '#1B4332', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#10B981' }} className="animate-pulse"></span>
                          <span>{isEn ? 'Live Quick Input' : 'Saisie Rapide Live'}</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                          <button type="button" onClick={() => handleOpenAddModal({ type: 'but' })} title="But" style={{ padding: '8px 4px', fontSize: '11px', fontWeight: 700, borderRadius: '10px', border: '1px solid #E2E8F0', background: '#fff', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', transition: 'all 0.2s' }} className="quick-action-btn">
                            <span style={{ fontSize: '14px' }}>⚽</span>
                            <span style={{ color: '#334155' }}>{isEn ? 'Goal' : 'But'}</span>
                          </button>
                          <button type="button" onClick={() => handleOpenAddModal({ type: 'carton_jaune' })} title="Jaune" style={{ padding: '8px 4px', fontSize: '11px', fontWeight: 700, borderRadius: '10px', border: '1px solid #E2E8F0', background: '#fff', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', transition: 'all 0.2s' }} className="quick-action-btn">
                            <span style={{ fontSize: '14px' }}>🟨</span>
                            <span style={{ color: '#334155' }}>{isEn ? 'Yellow' : 'Jaune'}</span>
                          </button>
                          <button type="button" onClick={() => handleOpenAddModal({ type: 'carton_rouge' })} title="Rouge" style={{ padding: '8px 4px', fontSize: '11px', fontWeight: 700, borderRadius: '10px', border: '1px solid #E2E8F0', background: '#fff', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', transition: 'all 0.2s' }} className="quick-action-btn">
                            <span style={{ fontSize: '14px' }}>🟥</span>
                            <span style={{ color: '#334155' }}>{isEn ? 'Red' : 'Rouge'}</span>
                          </button>
                          <button type="button" onClick={() => handleOpenAddModal({ type: 'remplacement' })} title="Remplacement" style={{ padding: '8px 4px', fontSize: '11px', fontWeight: 700, borderRadius: '10px', border: '1px solid #E2E8F0', background: '#fff', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', transition: 'all 0.2s' }} className="quick-action-btn">
                            <span style={{ fontSize: '14px' }}>🔄</span>
                            <span style={{ color: '#334155' }}>{isEn ? 'Sub.' : 'Remp.'}</span>
                          </button>
                          <button type="button" onClick={() => handleOpenAddModal({ type: 'corner' })} title="Corner" style={{ padding: '8px 4px', fontSize: '11px', fontWeight: 700, borderRadius: '10px', border: '1px solid #E2E8F0', background: '#fff', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', transition: 'all 0.2s' }} className="quick-action-btn">
                            <span style={{ fontSize: '14px' }}>📐</span>
                            <span style={{ color: '#334155' }}>Corner</span>
                          </button>
                          <button type="button" onClick={() => handleOpenAddModal({ type: 'hors_jeu' })} title="Hors-jeu" style={{ padding: '8px 4px', fontSize: '11px', fontWeight: 700, borderRadius: '10px', border: '1px solid #E2E8F0', background: '#fff', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', transition: 'all 0.2s' }} className="quick-action-btn">
                            <span style={{ fontSize: '14px' }}>🚩</span>
                            <span style={{ color: '#334155' }}>{isEn ? 'Offside' : 'H-Jeu'}</span>
                          </button>
                          <button type="button" onClick={() => handleOpenAddModal({ type: 'faute' })} title="Faute" style={{ padding: '8px 4px', fontSize: '11px', fontWeight: 700, borderRadius: '10px', border: '1px solid #E2E8F0', background: '#fff', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', transition: 'all 0.2s' }} className="quick-action-btn">
                            <span style={{ fontSize: '14px' }}>💥</span>
                            <span style={{ color: '#334155' }}>{isEn ? 'Foul' : 'Faute'}</span>
                          </button>
                          <button type="button" onClick={() => handleOpenAddModal({ type: 'incident' })} title="Incident" style={{ padding: '8px 4px', fontSize: '11px', fontWeight: 700, borderRadius: '10px', border: '1px solid #E2E8F0', background: '#fff', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', transition: 'all 0.2s' }} className="quick-action-btn">
                            <span style={{ fontSize: '14px' }}>⚠️</span>
                            <span style={{ color: '#334155' }}>Incident</span>
                          </button>
                        </div>

                        <button
                          onClick={() => handleOpenAddModal()}
                          className="btn-action-outline"
                          style={{ marginTop: '8px', padding: '10px 16px' }}
                        >
                          <PlusCircle style={{ width: '16px', height: '16px' }} />
                          <span>{isEn ? 'Full Form' : 'Formulaire Complet'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Compositions / Lineups */}
            <div className="composition-grids">

              {/* Home Lineup */}
              <div className="card-container">
                <div className="card-header">
                  <Shield size={18} style={{ color: '#A3C4A6' }} />
                  <h4 className="card-header-title">{isEn ? 'Lineup' : 'Composition'} {match.club_domicile.nom}</h4>
                </div>

                <div className="card-body" style={{ padding: '20px' }}>
                  {getClubPlayers(match.club_domicile.id).length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '48px 20px', color: '#94A3B8', fontSize: '14px', backgroundColor: '#F8FAFC', borderRadius: '16px', border: '2px dashed #E2E8F0' }}>
                      <Shield style={{ width: '40px', height: '40px', margin: '0 auto 12px', opacity: 0.3 }} className="animate-pulse" />
                      <span>{isEn ? 'No confirmed lineup' : 'Aucune composition confirmée'}</span>
                    </div>
                  ) : (
                    <div className="composition-scroll" style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '420px', overflowY: 'auto', paddingRight: '4px' }}>
                      {/* Section Titulaires */}
                      <div>
                        <div className="section-title-badge section-title-badge-titular">
                          <span>{isEn ? 'Starters (XI)' : 'Titulaires (XI)'}</span>
                          <span className="badge-count badge-count-titular">
                            {getClubPlayers(match.club_domicile.id).filter((p: any) => p.role === 'titulaire').length}
                          </span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {getClubPlayers(match.club_domicile.id)
                            .filter((p: any) => p.role === 'titulaire')
                            .map((playerCompo: any) => {
                              const player = playerCompo.joueur;
                              if (!player) return null;
                              return (
                                <div key={playerCompo.id} className="player-item">
                                  <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span className="player-number player-number-titular">
                                      {player.num_maillot || player.numero_maillot || '-'}
                                    </span>
                                    <span className="player-name">{player.prenom} {player.nom}</span>
                                    {playerCompo.est_capitaine && (
                                      <span className="badge-captain" title="Capitaine">C</span>
                                    )}
                                  </span>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span className="player-position">
                                      {player.poste || 'N/A'}
                                    </span>
                                    {isLive && (
                                      <div className="player-quick-actions" style={{ display: 'flex', gap: '4px' }}>
                                        <button type="button" onClick={() => handleOpenAddModal({ type: 'but', clubId: match.club_domicile.id, joueurId: player.id })} title="But" style={{ border: '1px solid #C8E6C9', background: '#E8F5E9', borderRadius: '4px', cursor: 'pointer', padding: '2px 4px', fontSize: '11px' }}>⚽</button>
                                        <button type="button" onClick={() => handleOpenAddModal({ type: 'carton_jaune', clubId: match.club_domicile.id, joueurId: player.id })} title="Jaune" style={{ border: '1px solid #FEF3C7', background: '#FEF3C7', borderRadius: '4px', cursor: 'pointer', padding: '2px 4px', fontSize: '11px' }}>🟨</button>
                                        <button type="button" onClick={() => handleOpenAddModal({ type: 'carton_rouge', clubId: match.club_domicile.id, joueurId: player.id })} title="Rouge" style={{ border: '1px solid #FEE2E2', background: '#FEE2E2', borderRadius: '4px', cursor: 'pointer', padding: '2px 4px', fontSize: '11px' }}>🟥</button>
                                        <button type="button" onClick={() => handleOpenAddModal({ type: 'remplacement', clubId: match.club_domicile.id, joueurId: player.id })} title="Remplacement" style={{ border: '1px solid #E2E8F0', background: '#F1F5F9', borderRadius: '4px', cursor: 'pointer', padding: '2px 4px', fontSize: '11px' }}>🔄</button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>

                      {/* Section Remplaçants */}
                      <div>
                        <div className="section-title-badge section-title-badge-sub">
                          <span>{isEn ? 'Substitutes' : 'Remplaçants'}</span>
                          <span className="badge-count badge-count-sub">
                            {getClubPlayers(match.club_domicile.id).filter((p: any) => p.role === 'remplacant').length}
                          </span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {getClubPlayers(match.club_domicile.id)
                            .filter((p: any) => p.role === 'remplacant')
                            .map((playerCompo: any) => {
                              const player = playerCompo.joueur;
                              if (!player) return null;
                              return (
                                <div key={playerCompo.id} className="player-item">
                                  <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span className="player-number player-number-sub">
                                      {player.num_maillot || player.numero_maillot || '-'}
                                    </span>
                                    <span className="player-name" style={{ color: '#475569' }}>{player.prenom} {player.nom}</span>
                                    {playerCompo.est_capitaine && (
                                      <span className="badge-captain" title="Capitaine">C</span>
                                    )}
                                  </span>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span className="player-position">
                                      {player.poste || 'N/A'}
                                    </span>
                                    {isLive && (
                                      <div className="player-quick-actions" style={{ display: 'flex', gap: '4px' }}>
                                        <button type="button" onClick={() => handleOpenAddModal({ type: 'remplacement', clubId: match.club_domicile.id, joueurRemplacantId: player.id })} title="Faire entrer" style={{ border: '1px solid #C8E6C9', background: '#E8F5E9', borderRadius: '4px', cursor: 'pointer', padding: '2px 4px', fontSize: '11px', fontWeight: 'bold', display: 'flex', gap: '2px', alignItems: 'center' }}>
                                          🔄 <span style={{ fontSize: '9px', color: '#1B4332' }}>{isEn ? 'ENTER' : 'ENTRER'}</span>
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Away Lineup */}
              <div className="card-container">
                <div className="card-header">
                  <Shield size={18} style={{ color: '#A3C4A6' }} />
                  <h4 className="card-header-title">{isEn ? 'Lineup' : 'Composition'} {match.club_exterieur.nom}</h4>
                </div>

                <div className="card-body" style={{ padding: '20px' }}>
                  {getClubPlayers(match.club_exterieur.id).length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '48px 20px', color: '#94A3B8', fontSize: '14px', backgroundColor: '#F8FAFC', borderRadius: '16px', border: '2px dashed #E2E8F0' }}>
                      <Shield style={{ width: '40px', height: '40px', margin: '0 auto 12px', opacity: 0.3 }} className="animate-pulse" />
                      <span>{isEn ? 'No confirmed lineup' : 'Aucune composition confirmée'}</span>
                    </div>
                  ) : (
                    <div className="composition-scroll" style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '420px', overflowY: 'auto', paddingRight: '4px' }}>
                      {/* Section Titulaires */}
                      <div>
                        <div className="section-title-badge section-title-badge-titular">
                          <span>{isEn ? 'Starters (XI)' : 'Titulaires (XI)'}</span>
                          <span className="badge-count badge-count-titular">
                            {getClubPlayers(match.club_exterieur.id).filter((p: any) => p.role === 'titulaire').length}
                          </span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {getClubPlayers(match.club_exterieur.id)
                            .filter((p: any) => p.role === 'titulaire')
                            .map((playerCompo: any) => {
                              const player = playerCompo.joueur;
                              if (!player) return null;
                              return (
                                <div key={playerCompo.id} className="player-item">
                                  <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span className="player-number player-number-titular">
                                      {player.num_maillot || player.numero_maillot || '-'}
                                    </span>
                                    <span className="player-name">{player.prenom} {player.nom}</span>
                                    {playerCompo.est_capitaine && (
                                      <span className="badge-captain" title="Capitaine">C</span>
                                    )}
                                  </span>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span className="player-position">
                                      {player.poste || 'N/A'}
                                    </span>
                                    {isLive && (
                                      <div className="player-quick-actions" style={{ display: 'flex', gap: '4px' }}>
                                        <button type="button" onClick={() => handleOpenAddModal({ type: 'but', clubId: match.club_exterieur.id, joueurId: player.id })} title="But" style={{ border: '1px solid #C8E6C9', background: '#E8F5E9', borderRadius: '4px', cursor: 'pointer', padding: '2px 4px', fontSize: '11px' }}>⚽</button>
                                        <button type="button" onClick={() => handleOpenAddModal({ type: 'carton_jaune', clubId: match.club_exterieur.id, joueurId: player.id })} title="Jaune" style={{ border: '1px solid #FEF3C7', background: '#FEF3C7', borderRadius: '4px', cursor: 'pointer', padding: '2px 4px', fontSize: '11px' }}>🟨</button>
                                        <button type="button" onClick={() => handleOpenAddModal({ type: 'carton_rouge', clubId: match.club_exterieur.id, joueurId: player.id })} title="Rouge" style={{ border: '1px solid #FEE2E2', background: '#FEE2E2', borderRadius: '4px', cursor: 'pointer', padding: '2px 4px', fontSize: '11px' }}>🟥</button>
                                        <button type="button" onClick={() => handleOpenAddModal({ type: 'remplacement', clubId: match.club_exterieur.id, joueurId: player.id })} title="Remplacement" style={{ border: '1px solid #E2E8F0', background: '#F1F5F9', borderRadius: '4px', cursor: 'pointer', padding: '2px 4px', fontSize: '11px' }}>🔄</button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>

                      {/* Section Remplaçants */}
                      <div>
                        <div className="section-title-badge section-title-badge-sub">
                          <span>{isEn ? 'Substitutes' : 'Remplaçants'}</span>
                          <span className="badge-count badge-count-sub">
                            {getClubPlayers(match.club_exterieur.id).filter((p: any) => p.role === 'remplacant').length}
                          </span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {getClubPlayers(match.club_exterieur.id)
                            .filter((p: any) => p.role === 'remplacant')
                            .map((playerCompo: any) => {
                              const player = playerCompo.joueur;
                              if (!player) return null;
                              return (
                                <div key={playerCompo.id} className="player-item">
                                  <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span className="player-number player-number-sub">
                                      {player.num_maillot || player.numero_maillot || '-'}
                                    </span>
                                    <span className="player-name" style={{ color: '#475569' }}>{player.prenom} {player.nom}</span>
                                    {playerCompo.est_capitaine && (
                                      <span className="badge-captain" title="Capitaine">C</span>
                                    )}
                                  </span>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span className="player-position">
                                      {player.poste || 'N/A'}
                                    </span>
                                    {isLive && (
                                      <div className="player-quick-actions" style={{ display: 'flex', gap: '4px' }}>
                                        <button type="button" onClick={() => handleOpenAddModal({ type: 'remplacement', clubId: match.club_exterieur.id, joueurRemplacantId: player.id })} title="Faire entrer" style={{ border: '1px solid #C8E6C9', background: '#E8F5E9', borderRadius: '4px', cursor: 'pointer', padding: '2px 4px', fontSize: '11px', fontWeight: 'bold', display: 'flex', gap: '2px', alignItems: 'center' }}>
                                          🔄 <span style={{ fontSize: '9px', color: '#1B4332' }}>{isEn ? 'ENTER' : 'ENTRER'}</span>
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* Right Column (1/3 width) - Live Game Log / Event Timeline / Contestations */}
          <div className="card-container" style={{ alignSelf: 'start', minWidth: '300px' }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: '10px' }}>
              <div style={{ display: 'flex', gap: '16px' }}>
                <button
                  onClick={() => setRightTab('timeline')}
                  style={{
                    background: rightTab === 'timeline' ? 'rgba(27, 67, 50, 0.1)' : 'transparent',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 800,
                    color: rightTab === 'timeline' ? 'var(--primary-dark)' : '#64748B',
                    cursor: 'pointer',
                    padding: '8px 16px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    transition: 'all 0.2s',
                  }}
                >
                  {isEn ? 'Journal' : 'Journal'}
                </button>
                <button
                  onClick={() => setRightTab('contestations')}
                  style={{
                    background: rightTab === 'contestations' ? 'rgba(27, 67, 50, 0.1)' : 'transparent',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 800,
                    color: rightTab === 'contestations' ? 'var(--primary-dark)' : '#64748B',
                    cursor: 'pointer',
                    padding: '8px 16px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s',
                  }}
                >
                  {isEn ? 'Disputes' : 'Contestations'}
                  {events.filter(e => e.contestation && e.contestation.statut === 'en_attente').length > 0 && (
                    <span style={{ background: '#EF4444', color: '#fff', fontSize: '10px', fontWeight: 900, padding: '2px 6px', borderRadius: '10px' }} className="animate-pulse">
                      {events.filter(e => e.contestation && e.contestation.statut === 'en_attente').length}
                    </span>
                  )}
                </button>
              </div>
              {savingEvent && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#86efac', fontWeight: 600 }}>
                  <Loader2 className="animate-spin" size={12} />
                  <span>{isEn ? 'Updating...' : 'Mise à jour...'}</span>
                </div>
              )}
            </div>

            <div className="card-body" style={{ padding: '20px', opacity: savingEvent ? 0.6 : 1, transition: 'opacity 0.2s' }}>
              {rightTab === 'timeline' ? (
                <EventTimeline
                  events={events}
                  onEdit={handleOpenEditModal}
                  onDelete={handleEventDelete}
                  showActions={isLive}
                />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {events.filter(e => e.contestation).length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '32px 12px', color: '#94A3B8' }}>
                      <p style={{ fontSize: '13px', margin: 0 }}>{isEn ? 'No disputes submitted for this match.' : 'Aucune contestation déposée sur ce match.'}</p>
                    </div>
                  ) : (
                    events.filter(e => e.contestation).map(ev => {
                      const cont = ev.contestation!;
                      const isPending = cont.statut === 'en_attente';
                      return (
                        <div key={cont.id} style={{ padding: '14px', border: '1px solid #E2E8F0', borderRadius: '12px', background: '#F8FAFC', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--primary)', background: 'rgba(27,67,50,0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                              Min {ev.minute}' • {ev.type.toUpperCase().replace('_', ' ')}
                            </span>
                            <span className={`badge ${cont.statut === 'en_attente' ? 'badge-warning' :
                              cont.statut === 'acceptee' ? 'badge-success' : 'badge-danger'
                              }`} style={{ fontSize: '10px' }}>
                              {cont.statut === 'en_attente' ? (isEn ? 'Pending' : 'En attente') : cont.statut === 'acceptee' ? (isEn ? 'Accepted' : 'Acceptée') : (isEn ? 'Rejected' : 'Rejetée')}
                            </span>
                          </div>

                          <div style={{ fontSize: '12px', color: '#334155' }}>
                            <strong>{isEn ? 'Reason:' : 'Motif :'}</strong> <span style={{ fontStyle: 'italic' }}>"{cont.motif}"</span>
                          </div>

                          {isPending ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px', borderTop: '1px dashed #CBD5E1', paddingTop: '10px' }}>
                              <input
                                type="text"
                                className="form-input"
                                placeholder={isEn ? "Official decision/comment..." : "Décision/Commentaire officiel..."}
                                value={decisionTexts[cont.id] || ''}
                                onChange={e => setDecisionTexts(prev => ({ ...prev, [cont.id]: e.target.value }))}
                                style={{ fontSize: '12px', padding: '6px 10px', height: '32px' }}
                              />
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                  onClick={() => handleTraiterContestation(cont.id, 'accepter')}
                                  className="btn btn-sm"
                                  style={{ flex: 1, background: '#10B981', color: '#fff', border: 'none', height: '32px', fontSize: '11px', fontWeight: 700, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                                >
                                  <ThumbsUp size={12} /> {isEn ? 'Confirm' : 'Confirmer'}
                                </button>
                                <button
                                  onClick={() => handleTraiterContestation(cont.id, 'rejeter')}
                                  className="btn btn-sm"
                                  style={{ flex: 1, background: '#EF4444', color: '#fff', border: 'none', height: '32px', fontSize: '11px', fontWeight: 700, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                                >
                                  <ThumbsDown size={12} /> {isEn ? 'Overrule' : 'Infirmer'}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div style={{ fontSize: '11px', color: '#475569', background: '#F1F5F9', padding: '8px', borderRadius: '6px' }}>
                              <strong>{isEn ? 'Decision:' : 'Décision :'}</strong> {cont.decision || (isEn ? 'No explanation provided.' : 'Aucune explication fournie.')}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Modal Dialog */}
        <EventModal
          isOpen={isEventModalOpen}
          onClose={() => setIsEventModalOpen(false)}
          onSubmit={handleEventSubmit}
          match={match}
          events={events}
          editingEvent={editingEvent}
          currentMinute={currentMinute}
          prepopulatedFields={prepopulatedFields}
        />

        {/* Period End Modal */}
        {periodEndModal?.show && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(15,23,42,0.75)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: '16px'
          }}>
            <div style={{
              background: '#ffffff', borderRadius: '24px', width: '100%', maxWidth: '500px',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden',
              border: '1px solid rgba(226,232,240,0.8)'
            }}>
              {/* Header */}
              <div style={{
                background: 'linear-gradient(135deg, #1B4332 0%, #081C15 100%)',
                padding: '24px', color: '#ffffff', textAlign: 'center', position: 'relative'
              }}>
                <div style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', color: '#86efac', letterSpacing: '2px', marginBottom: '4px' }}>
                  {isEn ? 'Time Limit Reached' : 'Limite de Temps Atteinte'}
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: 900, margin: 0 }}>
                  {periodEndModal.minute}' {isEn ? 'Minute' : 'Minute'}
                </h3>
              </div>

              {/* Body */}
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <p style={{ margin: 0, fontSize: '14px', color: '#475569', textAlign: 'center', lineHeight: '1.6' }}>
                  {isEn 
                    ? 'The match timer has reached a regulation or period limit. Please select the next action to perform.'
                    : 'Le chronomètre du match a atteint une limite réglementaire ou de période. Veuillez sélectionner l\'action suivante.'}
                </p>

                {/* Actions based on period/minute */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* --- 45th Minute (First Half End) --- */}
                  {periodEndModal.minute === 45 && match?.periode === '1ere_mi_temps' && (
                    <>
                      <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>
                          {isEn ? 'Add Stoppage Time (minutes)' : 'Ajouter du Temps Additionnel (minutes)'}
                        </label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <input
                            type="number"
                            min="1"
                            max="15"
                            value={stoppageTimeInput}
                            onChange={(e) => setStoppageTimeInput(e.target.value)}
                            style={{ width: '80px', padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1', fontWeight: 700, textAlign: 'center' }}
                          />
                          <button
                            onClick={() => handleConfirmStoppageTime(parseInt(stoppageTimeInput) || 3)}
                            disabled={actionLoading}
                            style={{ flex: 1, padding: '10px 16px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}
                          >
                            {actionLoading ? <Loader2 size={16} className="animate-spin" /> : (isEn ? 'Announce' : 'Annoncer')}
                          </button>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setPeriodEndModal(null);
                          handleHalftime();
                        }}
                        disabled={actionLoading}
                        style={{
                          width: '100%', padding: '14px', background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                          color: 'white', border: 'none', borderRadius: '14px', fontWeight: 700, cursor: 'pointer',
                          boxShadow: '0 4px 12px rgba(245,158,11,0.2)'
                        }}
                      >
                        {isEn ? 'Signal Halftime' : 'Siffler la Mi-temps'}
                      </button>
                    </>
                  )}

                  {/* --- 90th Minute (Second Half End) --- */}
                  {periodEndModal.minute === 90 && match?.periode === '2e_mi_temps' && (
                    <>
                      <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>
                          {isEn ? 'Add Stoppage Time (minutes)' : 'Ajouter du Temps Additionnel (minutes)'}
                        </label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <input
                            type="number"
                            min="1"
                            max="15"
                            value={stoppageTimeInput}
                            onChange={(e) => setStoppageTimeInput(e.target.value)}
                            style={{ width: '80px', padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1', fontWeight: 700, textAlign: 'center' }}
                          />
                          <button
                            onClick={() => handleConfirmStoppageTime(parseInt(stoppageTimeInput) || 5)}
                            disabled={actionLoading}
                            style={{ flex: 1, padding: '10px 16px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}
                          >
                            {actionLoading ? <Loader2 size={16} className="animate-spin" /> : (isEn ? 'Announce' : 'Annoncer')}
                          </button>
                        </div>
                      </div>

                      <div style={{ padding: '16px', background: '#f0fdf4', borderRadius: '16px', border: '1px solid #dcfce7' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#166534', marginBottom: '8px' }}>
                          {isEn ? 'Activate Extra Time (Halves)' : 'Activer les Prolongations (Mi-temps)'}
                        </label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <input
                              type="number"
                              min="5"
                              max="30"
                              value={prolongationDurationInput}
                              onChange={(e) => setProlongationDurationInput(e.target.value)}
                              style={{ width: '70px', padding: '10px', borderRadius: '10px', border: '1px solid #bbf7d0', fontWeight: 700, textAlign: 'center' }}
                            />
                            <span style={{ fontSize: '11px', fontWeight: 600, color: '#166534' }}>min/mi-t.</span>
                          </div>
                          <button
                            onClick={() => handleConfirmProlongation(parseInt(prolongationDurationInput) || 15)}
                            disabled={actionLoading}
                            style={{ flex: 1, padding: '10px 16px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}
                          >
                            {isEn ? 'Start Extra Time' : 'Démarrer'}
                          </button>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <button
                          onClick={handleConfirmTirsAuBut}
                          disabled={actionLoading}
                          style={{
                            padding: '12px', background: '#475569', color: 'white', border: 'none',
                            borderRadius: '12px', fontWeight: 700, cursor: 'pointer', fontSize: '13px'
                          }}
                        >
                          {isEn ? 'Penalty Shootout' : 'Tirs au But'}
                        </button>

                        <button
                          onClick={() => {
                            setPeriodEndModal(null);
                            handleCloturer();
                          }}
                          disabled={actionLoading}
                          style={{
                            padding: '12px', background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                            color: 'white', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer',
                            fontSize: '13px', boxShadow: '0 4px 12px rgba(239,68,68,0.2)'
                          }}
                        >
                          {isEn ? 'End Match' : 'Fin du Match'}
                        </button>
                      </div>
                    </>
                  )}

                  {/* --- End of Extra Time 1st Half --- */}
                  {match?.periode === 'prolongation_1' && (
                    <>
                      <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>
                          {isEn ? 'Add Stoppage Time (minutes)' : 'Ajouter du Temps Additionnel (minutes)'}
                        </label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <input
                            type="number"
                            min="1"
                            max="15"
                            value={stoppageTimeInput}
                            onChange={(e) => setStoppageTimeInput(e.target.value)}
                            style={{ width: '80px', padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1', fontWeight: 700, textAlign: 'center' }}
                          />
                          <button
                            onClick={() => handleConfirmStoppageTime(parseInt(stoppageTimeInput) || 1)}
                            disabled={actionLoading}
                            style={{ flex: 1, padding: '10px 16px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}
                          >
                            {actionLoading ? <Loader2 size={16} className="animate-spin" /> : (isEn ? 'Announce' : 'Annoncer')}
                          </button>
                        </div>
                      </div>

                      <button
                        onClick={handleProlongationMiTemps}
                        disabled={actionLoading}
                        style={{
                          width: '100%', padding: '14px', background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                          color: 'white', border: 'none', borderRadius: '14px', fontWeight: 700, cursor: 'pointer'
                        }}
                      >
                        {isEn ? 'Signal ET Halftime' : 'Siffler la Mi-temps des Prol.'}
                      </button>
                    </>
                  )}

                  {/* --- End of Extra Time 2nd Half --- */}
                  {match?.periode === 'prolongation_2' && (
                    <>
                      <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>
                          {isEn ? 'Add Stoppage Time (minutes)' : 'Ajouter du Temps Additionnel (minutes)'}
                        </label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <input
                            type="number"
                            min="1"
                            max="15"
                            value={stoppageTimeInput}
                            onChange={(e) => setStoppageTimeInput(e.target.value)}
                            style={{ width: '80px', padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1', fontWeight: 700, textAlign: 'center' }}
                          />
                          <button
                            onClick={() => handleConfirmStoppageTime(parseInt(stoppageTimeInput) || 2)}
                            disabled={actionLoading}
                            style={{ flex: 1, padding: '10px 16px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}
                          >
                            {actionLoading ? <Loader2 size={16} className="animate-spin" /> : (isEn ? 'Announce' : 'Annoncer')}
                          </button>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <button
                          onClick={handleConfirmTirsAuBut}
                          disabled={actionLoading}
                          style={{
                            padding: '12px', background: '#475569', color: 'white', border: 'none',
                            borderRadius: '12px', fontWeight: 700, cursor: 'pointer', fontSize: '13px'
                          }}
                        >
                          {isEn ? 'Go to Shootout' : 'Passer aux Tirs au But'}
                        </button>

                        <button
                          onClick={() => {
                            setPeriodEndModal(null);
                            handleCloturer();
                          }}
                          disabled={actionLoading}
                          style={{
                            padding: '12px', background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                            color: 'white', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer',
                            fontSize: '13px'
                          }}
                        >
                          {isEn ? 'End Match' : 'Fin du Match'}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div style={{ padding: '16px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setPeriodEndModal(null)}
                  style={{
                    padding: '8px 16px', background: 'transparent', color: '#64748b', border: 'none',
                    fontWeight: 600, cursor: 'pointer', fontSize: '13px'
                  }}
                >
                  {isEn ? 'Close' : 'Fermer'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .live-container {
          font-family: 'Inter', -apple-system, sans-serif;
          width: 100%;
        }
        .live-content {
          width: 100%;
        }
        .live-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 24px;
        }
        .btn-back {
          padding: 10px;
          background: #ffffff;
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justifyContent: center;
          transition: all 0.2s ease;
          box-shadow: 0 2px 4px rgba(0,0,0,0.02);
          color: #475569;
        }
        .btn-back:hover {
          background: #f8fafc;
          transform: scale(1.05);
          border-color: #cbd5e1;
        }
        .header-icon-container {
          padding: 10px;
          background: rgba(27, 67, 50, 0.1);
          color: var(--primary);
          border-radius: 12px;
          border: 1px solid rgba(27, 67, 50, 0.15);
          display: flex;
          align-items: center;
          justifyContent: center;
        }
        .header-title {
          font-size: 24px;
          font-weight: 900;
          color: #1e293b;
          letter-spacing: -0.5px;
          margin: 0;
          line-height: 1.2;
        }
        .header-subtitle {
          font-size: 12px;
          color: #64748b;
          font-weight: 500;
          margin: 2px 0 0 0;
        }
        .error-banner {
          padding: 16px;
          background: #FEF2F2;
          border: 1px solid #FECACA;
          border-radius: 16px;
          color: #991B1B;
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 24px;
          animation: fadeIn 0.3s ease;
        }
        .error-close {
          padding: 4px;
          background: transparent;
          border: none;
          border-radius: 8px;
          color: #EF4444;
          cursor: pointer;
          display: flex;
          align-items: center;
          justifyContent: center;
          margin-left: auto;
          transition: background-color 0.2s;
        }
        .error-close:hover {
          background-color: #FEE2E2;
        }
        .card-container {
          background: #ffffff;
          border-radius: 20px;
          border: 1px solid #E2E8F0;
          box-shadow: 0 4px 20px rgba(0,0,0,0.02);
          overflow: hidden;
        }
        .card-header {
          background: var(--primary);
          padding: 16px 20px;
          display: flex;
          align-items: center;
          gap: 10px;
          border-bottom: 1px solid #143225;
        }
        .card-header-title {
          font-size: 13px;
          font-weight: 800;
          text-transform: uppercase;
          color: #ffffff;
          letter-spacing: 1px;
          margin: 0;
        }
        .card-body {
          padding: 24px;
        }
        .control-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
          align-items: center;
        }
        @media (min-width: 768px) {
          .control-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
        .btn-workflow {
          width: 100%;
          display: flex;
          align-items: center;
          justifyContent: center;
          gap: 10px;
          padding: 14px 20px;
          border-radius: 14px;
          font-weight: 700;
          font-size: 14px;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
          color: #ffffff;
        }
        .btn-start {
          background: linear-gradient(135deg, #10B981 0%, #059669 100%);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
        }
        .btn-start:hover:not(:disabled) {
          background: linear-gradient(135deg, #059669 0%, #047857 100%);
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(16, 185, 129, 0.3);
        }
        .btn-halftime {
          background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
          box-shadow: 0 4px 12px rgba(245, 158, 11, 0.2);
        }
        .btn-halftime:hover:not(:disabled) {
          background: linear-gradient(135deg, #D97706 0%, #B45309 100%);
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(245, 158, 11, 0.3);
        }
        .btn-end {
          background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);
        }
        .btn-end:hover:not(:disabled) {
          background: linear-gradient(135deg, #DC2626 0%, #B91C1C 100%);
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(239, 68, 68, 0.3);
        }
        .btn-resume {
          background: linear-gradient(135deg, #10B981 0%, #059669 100%);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
        }
        .btn-resume:hover:not(:disabled) {
          background: linear-gradient(135deg, #059669 0%, #047857 100%);
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(16, 185, 129, 0.3);
        }
        .btn-report-link {
          background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
          box-shadow: 0 4px 12px rgba(245, 158, 11, 0.2);
          text-decoration: none;
          text-align: center;
        }
        .btn-report-link:hover {
          background: linear-gradient(135deg, #D97706 0%, #B45309 100%);
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(245, 158, 11, 0.3);
        }
        .btn-action-outline {
          width: 100%;
          display: flex;
          align-items: center;
          justifyContent: center;
          gap: 10px;
          padding: 14px 20px;
          border-radius: 14px;
          font-weight: 700;
          font-size: 14px;
          border: 2px solid var(--primary);
          background: transparent;
          color: var(--primary);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .btn-action-outline:hover:not(:disabled) {
          background: rgba(27, 67, 50, 0.04);
          transform: translateY(-2px);
        }
        .live-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
        }
        @media (min-width: 1024px) {
          .live-grid {
            grid-template-columns: 2fr 1fr;
          }
        }
        .composition-grids {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
        }
        @media (min-width: 768px) {
          .composition-grids {
            grid-template-columns: 1fr 1fr;
          }
        }
        .player-item {
          display: flex;
          align-items: center;
          justifyContent: space-between;
          padding: 8px 12px;
          border-radius: 10px;
          transition: background-color 0.2s;
        }
        .player-item:hover {
          background-color: #F8FAFC;
        }
        .player-number {
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justifyContent: center;
          font-family: monospace;
          font-weight: 800;
          border-radius: 6px;
          font-size: 12px;
        }
        .player-number-titular {
          background: #E8F5E9;
          color: #1B4332;
          border: 1px solid #C8E6C9;
        }
        .player-number-sub {
          background: #F1F5F9;
          color: #475569;
          border: 1px solid #E2E8F0;
        }
        .player-name {
          font-weight: 600;
          color: #1e293b;
          font-size: 14px;
        }
        .badge-captain {
          font-size: 9px;
          font-weight: 900;
          color: #B45309;
          background: #FEF3C7;
          border: 1px solid #FCD34D;
          padding: 1px 5px;
          border-radius: 4px;
          margin-left: 6px;
        }
        .player-position {
          font-size: 11px;
          font-weight: 800;
          color: #94A3B8;
          background: #F8FAFC;
          padding: 2px 6px;
          border-radius: 6px;
          font-family: monospace;
          text-transform: uppercase;
        }
        .section-title-badge {
          font-size: 11px;
          font-weight: 800;
          padding: 6px 12px;
          border-radius: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          justifyContent: space-between;
        }
        .section-title-badge-titular {
          background: #E8F5E9;
          color: #1B4332;
          border: 1px solid rgba(27, 67, 50, 0.08);
        }
        .section-title-badge-sub {
          background: #F8FAFC;
          color: #475569;
          border: 1px solid #E2E8F0;
        }
        .badge-count {
          font-family: monospace;
          font-weight: 800;
          padding: 1px 6px;
          border-radius: 4px;
          font-size: 10px;
        }
        .badge-count-titular {
          background: #C8E6C9;
          color: #1B4332;
        }
        .badge-count-sub {
          background: #E2E8F0;
          color: #475569;
        }
        .composition-scroll::-webkit-scrollbar {
          width: 5px;
        }
        .composition-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .composition-scroll::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 9999px;
        }
        .composition-scroll::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        .quick-action-btn:hover {
          border-color: var(--primary) !important;
          background: rgba(27, 67, 50, 0.05) !important;
          transform: translateY(-1px);
          box-shadow: 0 4px 6px rgba(0,0,0,0.05);
        }
        .player-quick-actions button {
          opacity: 0.3;
          transition: all 0.2s;
        }
        .player-quick-actions button:hover {
          opacity: 1 !important;
          transform: scale(1.2);
        }
        .player-item:hover .player-quick-actions button {
          opacity: 0.8;
        }
      `}</style>
    </div>
  );
};

export default LiveMatchPage;
