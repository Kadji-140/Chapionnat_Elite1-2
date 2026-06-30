// src/pages/admin/matchs/MatchDetailPage.tsx
// Page de détails publics d'un match avec arrière-plan et composition

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, MapPin, Shield,
  RotateCcw, Ban, Settings, AlertTriangle, User,
  Calendar, Home, Award, Users, ClipboardList, CheckCircle, Brain
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getMatch, updateMatch, reporterMatch, annulerMatch, type Match } from '../../../api/matchs.api';
import { getPrediction } from '../../../api/ia.api';
import { getClubComposition, type Composition } from '../../../api/compositions.api';
import { getStades, type Stade } from '../../../api/stades.api';
import { useAuthStore } from '../../../store/authStore';
import { PitchView } from '../../../components/matchs/PitchView';
import { Modal } from '../../../components/ui/Modal';
import Avatar from '../../../components/ui/avatar';

const getLogoUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  
  const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
  const baseUrl = apiUrl.endsWith('/api') ? apiUrl.slice(0, -4) : apiUrl;

  const cleanUrl = url.startsWith('/') ? url.substring(1) : url;
  if (cleanUrl.startsWith('storage/')) {
    return `${baseUrl}/${cleanUrl}`;
  }
  return `${baseUrl}/storage/${cleanUrl}`;
};

// ── Helper : URL image stade (teste plusieurs chemins) ──────────────
const getStadeImageUrl = (stadeNom: string | null | undefined): string => {
  if (!stadeNom) return '/stadium-bg.jpg';

  // Générer le slug du stade
  const slug = stadeNom
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Enlever accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  // Retourner l'URL de l'image (le navigateur tentera de la charger)
  // Si l'image n'existe pas, une image par défaut sera utilisée via onError
  return `/stades/${slug}.jpg`;
};

// ── Helpers : Conversion de dates ───────────────────────────────────
const toLocalDatetimeLocal = (isoString: string | null): string => {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset();
  const localTime = new Date(date.getTime() - (offset * 60 * 1000));
  return localTime.toISOString().slice(0, 16);
};

const toUTCISOString = (localString: string): string => {
  if (!localString) return '';
  const date = new Date(localString);
  if (isNaN(date.getTime())) return '';
  return date.toISOString();
};

// ── Badge de statut ──────────────────────────────────────────────────
const MatchStatusBadge: React.FC<{ statut: string; label: string }> = ({ statut, label }) => {
  const styles: Record<string, { bg: string; color: string }> = {
    programme: { bg: '#D8F3DC', color: '#2D6A4F' },
    en_cours: { bg: '#FFF3CD', color: '#856404' },
    termine: { bg: '#E2E8F0', color: '#475569' },
    homologue: { bg: '#D8F3DC', color: '#1B4332' },
    reporte: { bg: '#FEE2E2', color: '#991B1B' },
    annule: { bg: '#F3F4F6', color: '#6B7280' },
    litige: { bg: '#FEF3C7', color: '#92400E' },
  };
  const s = styles[statut] ?? { bg: '#E2E8F0', color: '#64748B' };
  return (
    <span style={{
      padding: '6px 14px',
      borderRadius: '24px',
      fontSize: '12px',
      fontWeight: 800,
      background: s.bg,
      color: s.color,
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px'
    }}>
      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: s.color }} />
      {label}
    </span>
  );
};

// ── Carte d'information club avec composition ────────────────────────
const ClubInfoCard: React.FC<{
  club: any;
  isHome: boolean;
  composition?: Composition | null;
  onViewComposition?: (compo: Composition) => void;
}> = ({ club, isHome, composition, onViewComposition }) => {
  if (!club) return null;

  const hasComposition = composition && composition.titulaires && composition.titulaires.length > 0;
  const formation = composition?.formation;

  return (
    <div style={{
      background: '#fff',
      borderRadius: '20px',
      border: '1px solid #E2E8F0',
      overflow: 'hidden',
      transition: 'transform 0.2s, box-shadow 0.2s',
    }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}>
      <div style={{
        background: isHome ? 'linear-gradient(135deg, #1B4332, #2D6A4F)' : 'linear-gradient(135deg, #1e40af, #3b82f6)',
        padding: '16px 20px',
        color: '#fff',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {isHome ? <Home size={18} /> : <Award size={18} />}
          <span style={{ fontWeight: 700, fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>
            {isHome ? 'Club Domicile' : 'Club Extérieur'}
          </span>
        </div>
      </div>

      <div style={{ padding: '20px', textAlign: 'center' }}>
        {/* ⭐ Logo agrandi */}
        <div style={{
          width: '100px',
          height: '100px',
          margin: '0 auto 12px',
          background: '#F8FAFC',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '2px solid #E2E8F0',
          overflow: 'hidden',
        }}>
          <Avatar src={getLogoUrl(club.logo_url)} name={club.nom} size={80} />
        </div>
        <h3 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 4px 0', color: '#1E293B' }}>{club.nom}</h3>
        <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '16px' }}>{club.ville}</p>

        <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '16px', textAlign: 'left' }}>
          {club.stade && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <MapPin size={14} style={{ color: '#2D6A4F' }} />
              <span style={{ fontSize: '13px' }}>{club.stade}</span>
            </div>
          )}
          {club.president && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <User size={14} style={{ color: '#2D6A4F' }} />
              <span style={{ fontSize: '13px' }}>Président: {club.president}</span>
            </div>
          )}
          {club.couleurs && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <Award size={14} style={{ color: '#2D6A4F' }} />
              <span style={{ fontSize: '13px' }}>Couleurs: {club.couleurs}</span>
            </div>
          )}
        </div>

        {/* Section Composition */}
        <div style={{
          marginTop: '16px',
          padding: '12px',
          background: hasComposition ? '#D8F3DC' : '#F8FAFC',
          borderRadius: '12px',
          border: `1px solid ${hasComposition ? '#C2E0C6' : '#E2E8F0'}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <ClipboardList size={14} style={{ color: hasComposition ? '#1B4332' : '#64748B' }} />
            <span style={{ fontSize: '12px', fontWeight: 700, color: hasComposition ? '#1B4332' : '#64748B' }}>
              Composition d'équipe
            </span>
          </div>

          {hasComposition ? (
            <>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#1B4332', marginBottom: '8px' }}>
                Formation: {formation}
              </div>
              <div style={{ fontSize: '11px', color: '#2D6A4F' }}>
                <CheckCircle size={12} style={{ display: 'inline', marginRight: '4px' }} />
                {composition.titulaires?.length || 0} titulaires · {composition.remplacants?.length || 0} remplaçants
                {composition.est_confirmee && <span style={{ marginLeft: '8px' }}>✓ Confirmée</span>}
              </div>
              <button
                className="btn btn-primary btn-sm"
                style={{
                  marginTop: '12px',
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  padding: '6px 12px',
                }}
                onClick={() => onViewComposition && onViewComposition(composition)}
              >
                Voir la composition tactique
              </button>
            </>
          ) : (
            <div style={{ fontSize: '12px', color: '#64748B', fontStyle: 'italic' }}>
              Composition non encore saisie
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Modale : Modifier Match ──────────────────────────────────────────────────────
const ModifierMatchModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  match: Match;
  onSave: (data: { date_heure: string; stade: string; terrain_neutre: boolean }) => void;
  isLoading: boolean;
}> = ({ isOpen, onClose, match, onSave, isLoading }) => {
  const [dateHeure, setDateHeure] = useState('');
  const [stade, setStade] = useState('');
  const [stadeManuel, setStadeManuel] = useState('');
  const [neutre, setNeutre] = useState(false);

  // Charger tous les stades
  const { data: stadesData } = useQuery({
    queryKey: ['stades-all'],
    queryFn: () => getStades({ all: true, est_actif: true }),
    enabled: isOpen,
  });

  const tousStades: Stade[] = stadesData?.data ?? [];

  // Villes des clubs concernés
  const villeDomicile = match.club_domicile?.ville?.toLowerCase() ?? '';
  const villeExterieur = match.club_exterieur?.ville?.toLowerCase() ?? '';

  // Stades filtrés par ville des clubs (si pas neutre)
  const stadesLocaux = neutre
    ? tousStades
    : tousStades.filter(s =>
        s.ville.toLowerCase().includes(villeDomicile) ||
        s.ville.toLowerCase().includes(villeExterieur)
      );

  React.useEffect(() => {
    if (match) {
      setDateHeure(toLocalDatetimeLocal(match.date_heure));
      setStade(match.stade ?? '');
      setStadeManuel('');
      setNeutre(match.terrain_neutre);
    }
  }, [match, isOpen]);

  // Stade final : si stadeManuel renseigné, utiliser celui-là
  const stadeFinal = stadeManuel.trim() || stade;

  const minDate = toLocalDatetimeLocal(new Date().toISOString());

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Modifier le match"
      subtitle={`${match.club_domicile?.nom} vs ${match.club_exterieur?.nom}`}
      size="md"
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose} disabled={isLoading}>Annuler</button>
          <button
            className="btn btn-primary"
            onClick={() => onSave({ date_heure: toUTCISOString(dateHeure), stade: stadeFinal, terrain_neutre: neutre })}
            disabled={isLoading}
          >
            {isLoading ? 'Sauvegarde...' : 'Enregistrer'}
          </button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label className="form-label">Date et heure</label>
          <input type="datetime-local" className="form-input" value={dateHeure} min={minDate} onChange={e => setDateHeure(e.target.value)} />
        </div>

        {/* Terrain neutre toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input type="checkbox" id="neutre" checked={neutre} onChange={e => { setNeutre(e.target.checked); setStade(''); setStadeManuel(''); }} />
          <label htmlFor="neutre" style={{ fontSize: '14px', cursor: 'pointer', fontWeight: 600 }}>
            🏟️ Terrain neutre (autre ville)
          </label>
        </div>

        {/* Select stade */}
        <div>
          <label className="form-label">
            Stade
            {!neutre && (villeDomicile || villeExterieur) && (
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '8px', fontWeight: 400 }}>
                Stades de {neutre ? 'toutes les villes' : [match.club_domicile?.ville, match.club_exterieur?.ville].filter(Boolean).join(' / ')}
              </span>
            )}
          </label>
          <select
            className="form-select"
            value={stade}
            onChange={e => { setStade(e.target.value); setStadeManuel(''); }}
          >
            <option value="">-- Sélectionner un stade --</option>
            {/* Stade domicile en premier */}
            {match.club_domicile?.stade && (
              <option value={match.club_domicile.stade}>
                🏠 {match.club_domicile.stade} (Domicile)
              </option>
            )}
            {stadesLocaux
              .filter(s => s.nom !== match.club_domicile?.stade)
              .map(s => (
                <option key={s.id} value={s.nom}>
                  {s.nom} — {s.ville}{s.capacite ? ` (${s.capacite.toLocaleString('fr-FR')} pl.)` : ''}
                </option>
              ))}
          </select>
          {stadesLocaux.length === 0 && !neutre && (
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Aucun stade enregistré pour ces villes. Utilisez la saisie manuelle ci-dessous.
            </p>
          )}
        </div>

        {/* Saisie manuelle */}
        <div>
          <label className="form-label" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Ou saisir un stade manuellement (si absent de la liste)
          </label>
          <input
            type="text"
            className="form-input"
            value={stadeManuel}
            onChange={e => { setStadeManuel(e.target.value); if (e.target.value) setStade(''); }}
            placeholder={match.club_domicile?.stade ?? 'Nom du stade...'}
          />
          {stadeManuel && (
            <p style={{ fontSize: '11px', color: 'var(--primary)', marginTop: '4px' }}>
              ✅ Ce stade sera utilisé : <strong>{stadeManuel}</strong>
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
};

// ── Modale : Reporter Match ──────────────────────────────────────────────────────
const ReporterMatchModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  match: Match;
  onSave: (motif: string, dateReport: string) => void;
  isLoading: boolean;
}> = ({ isOpen, onClose, match, onSave, isLoading }) => {
  const [motif, setMotif] = useState('');
  const [dateReport, setDateReport] = useState('');

  // Date minimale : aujourd'hui (local)
  const today = new Date();
  const minDate = toLocalDatetimeLocal(today.toISOString());

  // Déterminer le contexte (match du jour ou modification future)
  const matchDate = match.date_heure ? new Date(match.date_heure) : null;
  const matchEstAujourdhui = matchDate
    ? matchDate.toDateString() === today.toDateString()
    : false;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={matchEstAujourdhui ? 'Reporter le match' : 'Modifier la date du match'}
      subtitle={`${match.club_domicile?.nom} vs ${match.club_exterieur?.nom}`}
      size="md"
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose} disabled={isLoading}>Annuler</button>
          <button
            className="btn"
            onClick={() => onSave(motif, dateReport)}
            disabled={isLoading || motif.length < 10 || !dateReport}
            style={{ background: '#E9C46A', color: '#2C3E2F', border: 'none', fontWeight: 700 }}
          >
            {isLoading ? 'En cours...' : matchEstAujourdhui ? 'Confirmer le report' : 'Modifier la date'}
          </button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Bandeau contextuel */}
        <div style={{
          padding: '12px 16px',
          borderRadius: '10px',
          background: matchEstAujourdhui ? 'rgba(233,196,106,0.12)' : 'rgba(27,67,50,0.06)',
          border: `1px solid ${matchEstAujourdhui ? 'rgba(233,196,106,0.4)' : 'rgba(27,67,50,0.15)'}`,
          fontSize: '13px',
          color: matchEstAujourdhui ? '#92400e' : '#1B4332',
          display: 'flex', gap: '10px', alignItems: 'flex-start',
        }}>
          <span style={{ fontSize: '18px' }}>{matchEstAujourdhui ? '⚠️' : '📅'}</span>
          <div>
            {matchEstAujourdhui ? (
              <><strong>Match du jour</strong> — Ce match sera marqué comme <em>reporté</em>. Les officiels et clubs seront notifiés.</>
            ) : (
              <><strong>Modification de date</strong> — Le match est encore futur. Le statut restera <em>programmé</em>, la date sera mise à jour.</>
            )}
          </div>
        </div>

        <div>
          <label className="form-label">Motif <span style={{ color: '#991B1B' }}>*</span></label>
          <textarea
            className="form-input"
            value={motif}
            onChange={e => setMotif(e.target.value)}
            rows={3}
            placeholder="Expliquez la raison (minimum 10 caractères)..."
            style={{ resize: 'vertical' }}
          />
          <span className="form-hint">{motif.length}/500 caractères (min. 10)</span>
        </div>
        <div>
          <label className="form-label">Nouvelle date <span style={{ color: '#991B1B' }}>*</span></label>
          <input type="datetime-local" className="form-input" value={dateReport} min={minDate} onChange={e => setDateReport(e.target.value)} />
        </div>
      </div>
    </Modal>
  );
};

// ── Modale : Annuler Match ───────────────────────────────────────────
const AnnulerMatchModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  match: Match;
  onConfirm: (motif: string) => void;
  isLoading: boolean;
}> = ({ isOpen, onClose, match, onConfirm, isLoading }) => {
  const [motif, setMotif] = useState('');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Annuler le match"
      subtitle={`${match.club_domicile?.nom} vs ${match.club_exterieur?.nom}`}
      size="md"
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose} disabled={isLoading}>Annuler</button>
          <button
            className="btn btn-secondary"
            onClick={() => onConfirm(motif || "Annulé par l'administration")}
            disabled={isLoading}
            style={{ background: '#DC2626', color: '#fff', border: 'none' }}
          >
            {isLoading ? 'Annulation en cours...' : 'Confirmer l\'annulation'}
          </button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', padding: '12px', background: '#FEF2F2', borderRadius: '10px', color: '#991B1B', fontSize: '13px' }}>
          <AlertTriangle size={18} style={{ flexShrink: 0 }} />
          <div>
            <strong>Attention :</strong> L'annulation d'un match est définitive.
          </div>
        </div>
        <div>
          <label className="form-label">Motif (facultatif)</label>
          <textarea
            className="form-input"
            value={motif}
            onChange={e => setMotif(e.target.value)}
            rows={2}
            placeholder="Motif de l'annulation..."
            style={{ resize: 'vertical' }}
          />
        </div>
      </div>
    </Modal>
  );
};

// ── Page Principale ──────────────────────────────────────────────────
export const MatchDetailPage: React.FC = () => {
  const { id: matchId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const isAdmin = user?.role === 'admin';

  const [showModifier, setShowModifier] = useState(false);
  const [showReporter, setShowReporter] = useState(false);
  const [showAnnuler, setShowAnnuler] = useState(false);
  const [stadeImageError, setStadeImageError] = useState(false);
  const [selectedCompoForModal, setSelectedCompoForModal] = useState<Composition | null>(null);
  const [selectedClubNameForModal, setSelectedClubNameForModal] = useState<string>('');

  const getJoueursParPosteForModal = (compo: Composition | null) => {
    if (!compo) return {};
    const postesMap: Record<string, any> = {};
    compo.titulaires?.forEach((t: any, index: number) => {
      const posteId = t.poste_id || `poste_${index}`;
      postesMap[posteId] = {
        joueurId: t.joueur_id,
        nom: t.joueur?.nom || '',
        prenom: t.joueur?.prenom || '',
        numero: t.joueur?.num_maillot ?? t.joueur?.numero_maillot ?? null,
        estCapitaine: t.est_capitaine || false,
      };
    });
    return postesMap;
  };

  // Charger le match
  const { data: responseData, isLoading, error } = useQuery({
    queryKey: ['match-details', matchId],
    queryFn: () => getMatch(Number(matchId)),
    enabled: !!matchId,
  });

  const match: Match | undefined = responseData?.data;

  // Charger la prédiction IA
  const { data: predictionResponse, isLoading: isLoadingPrediction } = useQuery({
    queryKey: ['match-prediction', matchId],
    queryFn: () => getPrediction(Number(matchId)),
    enabled: !!matchId,
  });

  const prediction = predictionResponse?.data;

  // Charger les compositions
  const { data: compositionDomicile } = useQuery({
    queryKey: ['composition', matchId, 'domicile', match?.club_domicile?.id],
    queryFn: () => getClubComposition(Number(matchId), Number(match?.club_domicile?.id)).then(res => res.data),
    enabled: !!matchId && !!match?.club_domicile?.id,
  });

  const { data: compositionExterieur } = useQuery({
    queryKey: ['composition', matchId, 'exterieur', match?.club_exterieur?.id],
    queryFn: () => getClubComposition(Number(matchId), Number(match?.club_exterieur?.id)).then(res => res.data),
    enabled: !!matchId && !!match?.club_exterieur?.id,
  });

  const modifierMutation = useMutation({
    mutationFn: (data: any) => updateMatch(Number(matchId), data),
    onSuccess: (res) => {
      toast.success(res.message ?? 'Match mis à jour.');
      setShowModifier(false);
      queryClient.invalidateQueries({ queryKey: ['match-details', matchId] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Erreur'),
  });

  const reporterMutation = useMutation({
    mutationFn: ({ motif, dateReport }: { motif: string; dateReport: string }) =>
      reporterMatch(Number(matchId), { motif, date_heure_report: toUTCISOString(dateReport) }),
    onSuccess: (res) => {
      toast.success(res.message ?? 'Match reporté.');
      setShowReporter(false);
      queryClient.invalidateQueries({ queryKey: ['match-details', matchId] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Erreur'),
  });

  const annulerMutation = useMutation({
    mutationFn: (motif: string) => annulerMatch(Number(matchId), motif),
    onSuccess: (res) => {
      toast.success(res.message ?? 'Match annulé.');
      setShowAnnuler(false);
      queryClient.invalidateQueries({ queryKey: ['match-details', matchId] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Erreur'),
  });

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', background: '#F5F7F5' }}>
        <div style={{ padding: '24px' }}>
          <div className="skeleton" style={{ height: '200px', borderRadius: '24px', marginBottom: '24px' }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
            <div className="skeleton" style={{ height: '350px', borderRadius: '20px' }} />
            <div className="skeleton" style={{ height: '350px', borderRadius: '20px' }} />
          </div>
        </div>
      </div>
    );
  }

  if (error || !match) {
    return (
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '40px 24px' }}>
        <button onClick={() => navigate(-1)} className="btn btn-ghost" style={{ marginBottom: '24px' }}>
          <ArrowLeft size={16} /> Retour
        </button>
        <div style={{ textAlign: 'center', padding: '60px', background: '#fff', borderRadius: '24px' }}>
          <AlertTriangle size={48} style={{ color: '#E53946', margin: '0 auto 16px' }} />
          <h2>Match introuvable</h2>
        </div>
      </div>
    );
  }

  const date = match.date_heure ? new Date(match.date_heure) : null;
  const canModify = !['termine', 'homologue', 'annule'].includes(match.statut);
  const stadeImageUrl = getStadeImageUrl(match.stade);
  const fallbackImageUrl = '/stadium-bg.jpg';

  return (
    <div style={{ minHeight: '100vh', background: '#F5F7F5' }}>

      {/* ── HERO PANEL AVEC IMAGE STADE ── */}
      <div style={{
        position: 'relative',
        backgroundImage: `url(${stadeImageError ? fallbackImageUrl : stadeImageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        borderRadius: '0 0 32px 32px',
        marginBottom: '32px',
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
      }}>
        {/* Overlay flouté */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.55)',
          backdropFilter: 'blur(4px)',
        }} />

        {/* Contenu */}
        <div style={{
          position: 'relative',
          zIndex: 2,
          padding: '32px 40px',
          color: '#fff',
        }}>
          {/* Image de fallback si erreur de chargement */}
          <img
            src={stadeImageUrl}
            alt=""
            style={{ display: 'none' }}
            onError={() => setStadeImageError(true)}
          />

          {/* Barre de navigation */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '32px',
            flexWrap: 'wrap',
            gap: '16px',
          }}>
            <button
              onClick={() => navigate(-1)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(8px)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '30px',
                padding: '10px 24px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '14px',
              }}
            >
              <ArrowLeft size={16} /> Retour
            </button>

            <MatchStatusBadge statut={match.statut} label={match.statut_label} />
          </div>

          {/* Clubs et score - avec logos plus grands */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: '60px',
            textAlign: 'center',
          }}>
            {/* Club domicile */}
            <div style={{ flex: 1, minWidth: '180px' }}>
              <div style={{ marginBottom: '16px' }}>
                <div style={{
                  width: '100px',
                  height: '100px',
                  margin: '0 auto',
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: '50%',
                  padding: '12px',
                  border: '2px solid rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Avatar src={getLogoUrl(match.club_domicile?.logo_url)} name={match.club_domicile?.nom} size={70} />
                </div>
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>{match.club_domicile?.nom}</h2>
              <span style={{ fontSize: '13px', opacity: 0.8 }}>{match.club_domicile?.ville}</span>
            </div>

            {/* VS / Score */}
            <div style={{ minWidth: '140px' }}>
              <div style={{
                background: ['termine', 'homologue'].includes(match.statut)
                  ? 'linear-gradient(135deg, #10B981, #059669)'
                  : 'rgba(255,255,255,0.15)',
                fontSize: '36px',
                fontWeight: 900,
                borderRadius: '20px',
                padding: '16px 32px',
                marginBottom: '12px',
                backdropFilter: 'blur(8px)',
              }}>
                {['termine', 'homologue'].includes(match.statut)
                  ? `${match.score_domicile ?? 0} - ${match.score_exterieur ?? 0}`
                  : 'VS'}
              </div>
              <div style={{ fontSize: '13px', opacity: 0.8 }}>Journée {match.journee}</div>
            </div>

            {/* Club exterieur */}
            <div style={{ flex: 1, minWidth: '180px' }}>
              <div style={{ marginBottom: '16px' }}>
                <div style={{
                  width: '100px',
                  height: '100px',
                  margin: '0 auto',
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: '50%',
                  padding: '12px',
                  border: '2px solid rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Avatar src={getLogoUrl(match.club_exterieur?.logo_url)} name={match.club_exterieur?.nom} size={70} />
                </div>
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>{match.club_exterieur?.nom}</h2>
              <span style={{ fontSize: '13px', opacity: 0.8 }}>{match.club_exterieur?.ville}</span>
            </div>
          </div>

          {/* Motif report */}
          {match.motif_report && (
            <div style={{
              marginTop: '24px',
              padding: '12px 20px',
              background: 'rgba(233, 196, 106, 0.15)',
              borderRadius: '12px',
              textAlign: 'center',
              fontSize: '13px',
            }}>
              <AlertTriangle size={14} style={{ display: 'inline', marginRight: '8px', color: '#E9C46A' }} />
              <strong>Match reporté :</strong> {match.motif_report}
            </div>
          )}
        </div>
      </div>

      {/* ── CONTENU PRINCIPAL ── */}
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '0 24px 60px',
      }}>

        {/* Grille d'informations rapides */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '32px' }}>

          {/* Carte date et stade */}
          <div style={{
            background: '#fff',
            borderRadius: '20px',
            border: '1px solid #E2E8F0',
            padding: '20px',
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 16px 0', color: '#2D6A4F', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={18} /> Date & Lieu
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Date</div>
                <div style={{ fontWeight: 700 }}>
                  {date ? date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : 'Non planifiée'}
                </div>
                <div style={{ fontSize: '13px', color: '#64748B' }}>
                  {date ? `${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}` : ''}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Stade</div>
                <div style={{ fontWeight: 700 }}>{match.stade ?? 'À déterminer'}</div>
                {match.terrain_neutre && (
                  <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '10px', background: '#FEF3C7', color: '#92400E', display: 'inline-block', marginTop: '4px' }}>
                    Terrain Neutre
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Carte officiels */}
          <div style={{
            background: '#fff',
            borderRadius: '20px',
            border: '1px solid #E2E8F0',
            padding: '20px',
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 16px 0', color: '#2D6A4F', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={18} /> Officiels
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B' }}>Arbitre principal</div>
                <div style={{ fontWeight: 700 }}>{match.arbitre_principal?.nom ?? 'À désigner'}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B' }}>Arbitre assistant 1</div>
                <div style={{ fontWeight: 700 }}>{match.arbitre_assistant_1?.nom ?? 'À désigner'}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B' }}>Arbitre assistant 2</div>
                <div style={{ fontWeight: 700 }}>{match.arbitre_assistant_2?.nom ?? 'À désigner'}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B' }}>4e Arbitre</div>
                <div style={{ fontWeight: 700 }}>{match.quatrieme_arbitre?.nom ?? 'À désigner'}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B' }}>Commissaire</div>
                <div style={{ fontWeight: 700 }}>{match.commissaire?.nom ?? 'À désigner'}</div>
              </div>
            </div>
          </div>

          {/* Carte prédiction IA */}
          <div style={{
            background: '#fff',
            borderRadius: '20px',
            border: '1px solid #E2E8F0',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 16px 0', color: '#2D6A4F', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Brain size={18} /> Prédiction de l'IA
              </h3>
              {isLoadingPrediction ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div className="skeleton" style={{ height: '14px', width: '80%', borderRadius: '4px' }} />
                  <div className="skeleton" style={{ height: '24px', width: '100%', borderRadius: '4px' }} />
                  <div className="skeleton" style={{ height: '14px', width: '60%', borderRadius: '4px' }} />
                </div>
              ) : prediction ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Probas bars */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700, marginBottom: '6px' }}>
                      <span style={{ color: '#2D6A4F' }}>Dom ({prediction.victoire_domicile}%)</span>
                      <span style={{ color: '#B45309' }}>Nul ({prediction.nul}%)</span>
                      <span style={{ color: '#3B82F6' }}>Ext ({prediction.victoire_exterieur}%)</span>
                    </div>
                    {/* Stacked progress bar */}
                    <div style={{ height: '12px', borderRadius: '6px', background: '#F1F5F9', overflow: 'hidden', display: 'flex' }}>
                      <div style={{ width: `${prediction.victoire_domicile}%`, background: '#2D6A4F', transition: 'width 0.5s ease-out' }} />
                      <div style={{ width: `${prediction.nul}%`, background: '#E9C46A', transition: 'width 0.5s ease-out' }} />
                      <div style={{ width: `${prediction.victoire_exterieur}%`, background: '#3B82F6', transition: 'width 0.5s ease-out' }} />
                    </div>
                  </div>

                  {/* Forecast and Confidence */}
                  <div style={{ background: '#F8FAFC', borderRadius: '12px', padding: '12px', border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: '4px' }}>
                      Pronostic
                    </div>
                    <div style={{ fontWeight: 800, color: '#1E293B', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {prediction.prediction === 'domicile' && `🏆 Victoire de ${match.club_domicile?.nom}`}
                      {prediction.prediction === 'exterieur' && `🏆 Victoire de ${match.club_exterieur?.nom}`}
                      {prediction.prediction === 'nul' && '🤝 Match Nul'}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px' }}>
                      <span style={{ fontSize: '12px', color: '#64748B' }}>Confiance :</span>
                      <span style={{
                        padding: '3px 10px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        background: prediction.confiance === 'elevee' ? '#D8F3DC' : prediction.confiance === 'moyenne' ? '#FEF3C7' : '#FEE2E2',
                        color: prediction.confiance === 'elevee' ? '#2D6A4F' : prediction.confiance === 'moyenne' ? '#B45309' : '#991B1B',
                      }}>
                        {prediction.confiance === 'elevee' && 'Élevée'}
                        {prediction.confiance === 'moyenne' && 'Moyenne'}
                        {prediction.confiance === 'faible' && 'Faible'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: '12px', color: '#64748B', fontStyle: 'italic' }}>
                  Aucune prédiction disponible.
                </div>
              )}
            </div>
            
            {prediction && (
              <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '10px', marginTop: '14px', fontSize: '10px', color: '#94A3B8', display: 'flex', justifyContent: 'space-between' }}>
                <span>Modèle : {prediction.modele_version || 'v1.0'}</span>
                <span>Calcul : {prediction.date_calcul ? new Date(prediction.date_calcul).toLocaleDateString('fr-FR') : 'n/a'}</span>
              </div>
            )}
          </div>
        </div>

        {/* Cartes des clubs avec composition */}
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 20px 0', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={18} style={{ color: '#2D6A4F' }} />
            Présentation des clubs
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
            <ClubInfoCard
              club={match.club_domicile}
              isHome={true}
              composition={compositionDomicile}
              onViewComposition={(compo) => {
                setSelectedCompoForModal(compo);
                setSelectedClubNameForModal(match.club_domicile?.nom || '');
              }}
            />
            <ClubInfoCard
              club={match.club_exterieur}
              isHome={false}
              composition={compositionExterieur}
              onViewComposition={(compo) => {
                setSelectedCompoForModal(compo);
                setSelectedClubNameForModal(match.club_exterieur?.nom || '');
              }}
            />
          </div>
        </div>

        {/* Actions admin */}
        {isAdmin && canModify && (
          <div style={{
            background: '#FFF5F5',
            border: '1px solid #FEB2B2',
            borderRadius: '20px',
            padding: '20px',
          }}>
            <h3 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 16px 0', color: '#C53030', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Settings size={16} /> Administration
            </h3>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button onClick={() => setShowModifier(true)} style={{ padding: '8px 16px', borderRadius: '10px', background: '#fff', border: '1px solid #CBD5E0', cursor: 'pointer', fontWeight: 600 }}>
                <Settings size={14} style={{ display: 'inline', marginRight: '6px' }} />
                Modifier
              </button>
              <button onClick={() => setShowReporter(true)} style={{ padding: '8px 16px', borderRadius: '10px', background: '#FEF3C7', color: '#92400E', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                <RotateCcw size={14} style={{ display: 'inline', marginRight: '6px' }} />
                Reporter
              </button>
              <button onClick={() => setShowAnnuler(true)} style={{ padding: '8px 16px', borderRadius: '10px', background: '#FEE2E2', color: '#991B1B', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                <Ban size={14} style={{ display: 'inline', marginRight: '6px' }} />
                Annuler
              </button>
            </div>
          </div>
        )}

        {/* Actions coach */}
        {user?.role === 'coach' && canModify && (
          <div style={{
            background: '#E8F5E9',
            border: '1px solid #A5D6A7',
            borderRadius: '20px',
            padding: '20px',
            marginTop: '20px',
          }}>
            <h3 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 16px 0', color: '#2E7D32', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ClipboardList size={16} /> Gestion de l'équipe
            </h3>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button
                onClick={() => navigate(`/coach/matchs/${match.id}/composition`)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '10px',
                  background: '#2D6A4F',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Users size={14} />
                Saisir / Modifier la composition
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modales */}
      {match && (
        <>
          <ModifierMatchModal
            isOpen={showModifier}
            onClose={() => setShowModifier(false)}
            match={match}
            onSave={(data) => modifierMutation.mutate(data)}
            isLoading={modifierMutation.isPending}
          />
          <ReporterMatchModal
            isOpen={showReporter}
            onClose={() => setShowReporter(false)}
            match={match}
            onSave={(motif, dateReport) => reporterMutation.mutate({ motif, dateReport })}
            isLoading={reporterMutation.isPending}
          />
          <AnnulerMatchModal
            isOpen={showAnnuler}
            onClose={() => setShowAnnuler(false)}
            match={match}
            onConfirm={(motif) => annulerMutation.mutate(motif)}
            isLoading={annulerMutation.isPending}
          />
          {selectedCompoForModal && (
            <Modal
              isOpen={!!selectedCompoForModal}
              onClose={() => setSelectedCompoForModal(null)}
              title={`Composition Tactique`}
              subtitle={`${selectedClubNameForModal} - Schéma : ${selectedCompoForModal.formation}`}
              size="lg"
              footer={
                <button className="btn btn-primary" onClick={() => setSelectedCompoForModal(null)}>
                  Fermer
                </button>
              }
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ borderRadius: '20px', overflow: 'hidden' }}>
                  <PitchView
                    formation={selectedCompoForModal.formation}
                    joueursParPoste={getJoueursParPosteForModal(selectedCompoForModal)}
                    readonly={true}
                  />
                </div>

                {/* Section Remplaçants */}
                {selectedCompoForModal.remplacants && selectedCompoForModal.remplacants.length > 0 && (
                  <div className="card" style={{ padding: '20px', background: 'var(--bg)' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--primary)', margin: '0 0 12px 0', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                      Remplaçants
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                      {selectedCompoForModal.remplacants.map((r: any) => (
                        <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#fff', padding: '10px 14px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                          <span style={{ minWidth: '24px', height: '24px', background: 'var(--accent-50)', color: 'var(--primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800 }}>
                            {r.joueur?.num_maillot ?? r.joueur?.numero_maillot ?? '-'}
                          </span>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>
                              {r.joueur?.nom} {r.joueur?.prenom}
                            </span>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                              {r.joueur?.poste || 'Joueur'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Modal>
          )}
        </>
      )}
    </div>
  );
};