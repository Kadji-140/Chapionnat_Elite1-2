// src/pages/admin/calendrier/CalendrierPage.tsx
// Calendrier complet des matchs — Module 3

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Calendar, Trophy, Zap, ChevronDown, ChevronUp,
  Clock, MapPin, AlertTriangle,
  CheckCircle2, Settings, Ban, RotateCcw,
  Plus, Shield, UserCheck
} from 'lucide-react';
import toast from 'react-hot-toast';
import { type Competition } from '../../../api/saisons.api';
import {
  getCalendrier, genererCalendrier, annulerMatch, reporterMatch,
  type Journee, type Match
} from '../../../api/matchs.api';
import { Modal } from '../../../components/ui/Modal';
import { ConfirmDialog } from '../../../components/ui/Modal';
import api from '../../../api/axios';
import { Avatar } from '../../../components/ui/DataTable';

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

// ── Badge statut match ─────────────────────────────────────────
const MatchBadge: React.FC<{ statut: string; label: string }> = ({ statut, label }) => {
  const styles: Record<string, { bg: string; color: string }> = {
    programme: { bg: '#D8F3DC', color: '#2D6A4F' },
    en_cours: { bg: '#FFF3CD', color: '#856404' },
    termine: { bg: '#f1f5f9', color: '#475569' },
    homologue: { bg: '#D8F3DC', color: '#1B4332' },
    reporte: { bg: '#FEE2E2', color: '#991B1B' },
    annule: { bg: '#F3F4F6', color: '#6B7280' },
    litige: { bg: '#FEF3C7', color: '#92400E' },
  };
  const s = styles[statut] ?? { bg: '#f1f5f9', color: '#64748b' };
  return (
    <span style={{
      padding: '3px 10px', borderRadius: '20px',
      fontSize: '11px', fontWeight: 700,
      background: s.bg, color: s.color,
      textTransform: 'uppercase', letterSpacing: '0.3px',
    }}>
      {label}
    </span>
  );
};

// ── Carte d'un match ───────────────────────────────────────────
// ── Date utilities for handling local and UTC times properly ──
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


// ── Carte d'un match ───────────────────────────────────────────
const MatchCard: React.FC<{
  match: Match;
  onReporter: (m: Match) => void;
  onAnnuler: (m: Match) => void;
  onModifier: (m: Match) => void;
}> = ({ match, onReporter, onAnnuler, onModifier }) => {
  const navigate = useNavigate();
  const canModify = !['termine', 'homologue', 'annule'].includes(match.statut);
  const isAnnule = match.statut === 'annule';

  return (
    <div style={{
      background: '#fff',
      border: isAnnule ? '1px dashed #CBD5E1' : '1px solid #E2E8F0',
      borderRadius: '16px',
      padding: '20px',
      opacity: isAnnule ? 0.7 : 1,
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.02), 0 1px 2px rgba(0,0,0,0.04)',
    }}
      onMouseEnter={(e) => {
        if (!isAnnule) {
          e.currentTarget.style.boxShadow = '0 10px 20px rgba(45,106,79,0.06)';
          e.currentTarget.style.borderColor = '#A7F3D0';
        }
      }}
      onMouseLeave={(e) => {
        if (!isAnnule) {
          e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.02), 0 1px 2px rgba(0,0,0,0.04)';
          e.currentTarget.style.borderColor = '#E2E8F0';
        }
      }}
    >
      {/* Meta Row: Date, Stade, Statut */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {match.date_heure && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#475569', fontWeight: 600 }}>
              <Clock size={14} style={{ color: '#2D6A4F' }} />
              {new Date(match.date_heure).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
              {' à '}{new Date(match.date_heure).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          {match.stade && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#64748B' }}>
              <MapPin size={14} style={{ color: '#6B8E6E' }} />
              {match.stade} {match.terrain_neutre && <span style={{ fontSize: '11px', fontStyle: 'italic', color: '#94A3B8' }}>(Neutre)</span>}
            </span>
          )}
        </div>
        <MatchBadge statut={match.statut} label={match.statut_label} />
      </div>

      {/* Hero Row: Team Domicile vs Team Exterieur */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', flexWrap: 'wrap', gap: '16px' }}>
        {/* Domicile */}
        <div style={{ flex: 1, minWidth: '120px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ marginBottom: '8px' }}>
            <Avatar src={getLogoUrl(match.club_domicile?.logo_url)} name={match.club_domicile?.nom ?? ''} size={48} />
          </div>
          <div style={{ fontWeight: 700, fontSize: '15px', color: '#1E293B' }}>
            {match.club_domicile?.nom ?? '—'}
          </div>
          <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>{match.club_domicile?.ville}</div>
        </div>

        {/* Score / VS Center */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 24px', minWidth: '100px' }}>
          <div style={{
            background: ['termine', 'homologue'].includes(match.statut) ? '#2D6A4F' : '#F1F5F9',
            color: ['termine', 'homologue'].includes(match.statut) ? '#fff' : '#475569',
            borderRadius: '12px',
            padding: '10px 20px',
            fontWeight: 800,
            fontSize: '18px',
            minWidth: '90px',
            textAlign: 'center',
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
            letterSpacing: '1px'
          }}>
            {['termine', 'homologue'].includes(match.statut)
              ? `${match.score_domicile ?? 0} - ${match.score_exterieur ?? 0}`
              : 'VS'}
          </div>
          <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '6px', fontWeight: 600, textTransform: 'uppercase' }}>
            Journée {match.journee}
          </div>
        </div>

        {/* Exterieur */}
        <div style={{ flex: 1, minWidth: '120px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ marginBottom: '8px' }}>
            <Avatar src={getLogoUrl(match.club_exterieur?.logo_url)} name={match.club_exterieur?.nom ?? ''} size={48} />
          </div>
          <div style={{ fontWeight: 700, fontSize: '15px', color: '#1E293B' }}>
            {match.club_exterieur?.nom ?? '—'}
          </div>
          <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>{match.club_exterieur?.ville}</div>
        </div>
      </div>

      {/* Footer Row: Officiels & Actions */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderTop: '1px solid #F1F5F9', paddingTop: '16px', marginTop: '4px',
        flexWrap: 'wrap', gap: '12px'
      }}>
        {/* Officiels Status */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <span style={{
            padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
            background: match.a_commissaire ? '#ECFDF5' : '#FEF2F2',
            color: match.a_commissaire ? '#047857' : '#B91C1C',
            border: `1px solid ${match.a_commissaire ? '#A7F3D0' : '#FECACA'}`,
            display: 'flex', alignItems: 'center', gap: '4px'
          }}>
            <Shield size={12} />
            {match.a_commissaire ? 'Com. ✓' : 'Com. ✗'}
          </span>
          <span style={{
            padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
            background: match.a_arbitre ? '#ECFDF5' : '#FEF2F2',
            color: match.a_arbitre ? '#047857' : '#B91C1C',
            border: `1px solid ${match.a_arbitre ? '#A7F3D0' : '#FECACA'}`,
            display: 'flex', alignItems: 'center', gap: '4px'
          }}>
            <UserCheck size={12} />
            {match.a_arbitre ? 'Arb. ✓' : 'Arb. ✗'}
          </span>
        </div>

        {/* Actions buttons */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => navigate(`/admin/matchs/${match.id}`)}
            style={{
              display: 'flex', alignItems: 'center', gap: '4px',
              padding: '6px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
              background: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0', cursor: 'pointer',
              transition: 'all 0.15s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#D1FAE5'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#ECFDF5'; }}
          >
            Détails
          </button>
          {canModify && (
            <>
              <button
                onClick={() => onModifier(match)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '4px',
                  padding: '6px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
                  background: '#F1F5F9', color: '#334155', border: 'none', cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#E2E8F0'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#F1F5F9'; }}
              >
                <Settings size={13} /> Modifier
              </button>
              {match.statut !== 'annule' && (
                <>
                  <button
                    onClick={() => onReporter(match)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '4px',
                      padding: '6px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
                      background: '#FEF3C7', color: '#92400E', border: 'none', cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#FDE68A'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#FEF3C7'; }}
                  >
                    <RotateCcw size={13} /> Reporter
                  </button>
                  <button
                    onClick={() => onAnnuler(match)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '4px',
                      padding: '6px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
                      background: '#FEE2E2', color: '#991B1B', border: 'none', cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#FCA5A5'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#FEE2E2'; }}
                  >
                    <Ban size={13} /> Annuler
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Motif report */}
      {match.motif_report && (
        <div style={{
          padding: '10px 14px',
          background: '#FFFBEB', border: '1px solid #FEF3C7', borderRadius: '10px',
          fontSize: '13px', color: '#B45309',
          display: 'flex', alignItems: 'flex-start', gap: '8px',
        }}>
          <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div><strong>Report :</strong> {match.motif_report}</div>
        </div>
      )}
    </div>
  );
};

// ── Accordéon Journée ─────────────────────────────────────────
const JourneeAccordion: React.FC<{
  journee: Journee;
  defaultOpen?: boolean;
  onReporter: (m: Match) => void;
  onAnnuler: (m: Match) => void;
  onModifier: (m: Match) => void;
}> = ({ journee, defaultOpen = false, onReporter, onAnnuler, onModifier }) => {
  const [open, setOpen] = useState(defaultOpen);

  const dateStr = journee.date_premiere
    ? new Date(journee.date_premiere).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'Date à définir';

  const hasConflict = journee.nb_sans_officiel > 0;

  return (
    <div style={{
      background: '#fff',
      border: '1px solid #E2E8E0',
      borderRadius: '16px',
      overflow: 'hidden',
      marginBottom: '10px',
      transition: 'box-shadow 0.2s',
    }}>
      {/* Header de la journée */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center',
          padding: '16px 20px', background: 'none', border: 'none',
          cursor: 'pointer', gap: '12px', textAlign: 'left',
        }}
      >
        <div style={{
          width: '40px', height: '40px', borderRadius: '10px',
          background: 'linear-gradient(135deg, #2D6A4F, #40916C)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontWeight: 800, fontSize: '16px', flexShrink: 0,
        }}>
          {journee.journee}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: '15px', color: '#2C3E2F' }}>
            Journée {journee.journee}
          </div>
          <div style={{ fontSize: '12px', color: '#6B8E6E', marginTop: '2px' }}>
            {dateStr} · {journee.nb_matchs} match{journee.nb_matchs > 1 ? 's' : ''}
          </div>
        </div>
        {hasConflict && (
          <span style={{
            padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700,
            background: '#FEE2E2', color: '#991B1B',
          }}>
            {journee.nb_sans_officiel} sans officiel
          </span>
        )}
        {!hasConflict && (
          <CheckCircle2 size={16} style={{ color: '#2D6A4F', flexShrink: 0 }} />
        )}
        {open ? <ChevronUp size={16} style={{ color: '#6B8E6E', flexShrink: 0 }} /> : <ChevronDown size={16} style={{ color: '#6B8E6E', flexShrink: 0 }} />}
      </button>

      {/* Matchs */}
      {open && (
        <div style={{
          padding: '0 16px 16px',
          animation: 'fadeInUp 0.2s ease',
          display: 'flex', flexDirection: 'column', gap: '8px',
        }}>
          {journee.matchs.map(m => (
            <MatchCard
              key={m.id}
              match={m}
              onReporter={onReporter}
              onAnnuler={onAnnuler}
              onModifier={onModifier}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ── Modal : Générer le calendrier ─────────────────────────────
const GenererCalendrierModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  poules: Array<{ id: number; nom: string }>;
  onConfirm: (pouleId: number, params: object) => void;
  isLoading: boolean;
}> = ({ isOpen, onClose, poules, onConfirm, isLoading }) => {
  const [pouleId, setPouleId] = useState<number>(poules[0]?.id ?? 0);
  const [dateDebut, setDateDebut] = useState('');
  const [heure, setHeure] = useState('15:00');
  const [jour, setJour] = useState(6);

  React.useEffect(() => {
    if (poules.length > 0 && (!pouleId || !poules.some(p => p.id === pouleId))) {
      setPouleId(poules[0].id);
    }
  }, [poules, pouleId]);

  const jours = [
    { value: 6, label: 'Samedi' },
    { value: 0, label: 'Dimanche' },
    { value: 5, label: 'Vendredi' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Générer le calendrier"
      subtitle="L'algorithme de Berger génère les matchs aller-retour automatiquement"
      size="md"
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose} disabled={isLoading}>Annuler</button>
          <button
            className="btn btn-primary"
            onClick={() => onConfirm(pouleId, { date_debut: dateDebut || undefined, heure_defaut: heure, jour_semaine: jour })}
            disabled={isLoading || !pouleId}
          >
            {isLoading ? '⏳ Génération...' : '🗓️ Générer'}
          </button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label className="form-label">Poule</label>
          <select className="form-select" value={pouleId} onChange={e => setPouleId(Number(e.target.value))}>
            {poules.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
          </select>
        </div>
        <div>
          <label className="form-label">Date de début (1ère journée)</label>
          <input type="date" className="form-input" value={dateDebut} onChange={e => setDateDebut(e.target.value)} />
          <span className="form-hint">Laissez vide pour utiliser la date de début de la saison</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label className="form-label">Heure par défaut</label>
            <input type="time" className="form-input" value={heure} onChange={e => setHeure(e.target.value)} />
          </div>
          <div>
            <label className="form-label">Jour de la semaine</label>
            <select className="form-select" value={jour} onChange={e => setJour(Number(e.target.value))}>
              {jours.map(j => <option key={j.value} value={j.value}>{j.label}</option>)}
            </select>
          </div>
        </div>
        <div style={{ padding: '12px', background: '#D8F3DC', borderRadius: '10px', fontSize: '13px', color: '#1B4332' }}>
          ℹ️ Les dates seront générées automatiquement. Vous pourrez modifier chaque match individuellement.
        </div>
      </div>
    </Modal>
  );
};

// ── Modal : Modifier un match ─────────────────────────────────
const ModifierMatchModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  match: Match | null;
  onSave: (data: { date_heure: string; stade: string; terrain_neutre: boolean }) => void;
  isLoading: boolean;
}> = ({ isOpen, onClose, match, onSave, isLoading }) => {
  const [dateHeure, setDateHeure] = useState('');
  const [stade, setStade] = useState('');
  const [neutre, setNeutre] = useState(false);

  React.useEffect(() => {
    if (match) {
      setDateHeure(toLocalDatetimeLocal(match.date_heure));
      setStade(match.stade ?? '');
      setNeutre(match.terrain_neutre);
    }
  }, [match]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Modifier le match"
      subtitle={match ? `${match.club_domicile?.nom} vs ${match.club_exterieur?.nom}` : ''}
      size="md"
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose} disabled={isLoading}>Annuler</button>
          <button
            className="btn btn-primary"
            onClick={() => onSave({ date_heure: toUTCISOString(dateHeure), stade, terrain_neutre: neutre })}
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
          <input type="datetime-local" className="form-input" value={dateHeure} onChange={e => setDateHeure(e.target.value)} />
        </div>
        <div>
          <label className="form-label">Stade</label>
          <input
            type="text" className="form-input" value={stade}
            onChange={e => setStade(e.target.value)}
            placeholder={match?.club_domicile?.stade ?? 'Nom du stade'}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input type="checkbox" id="neutre" checked={neutre} onChange={e => setNeutre(e.target.checked)} />
          <label htmlFor="neutre" style={{ fontSize: '14px', cursor: 'pointer' }}>Terrain neutre</label>
        </div>
      </div>
    </Modal>
  );
};

// ── Modal : Reporter un match ─────────────────────────────────
const ReporterMatchModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  match: Match | null;
  onSave: (motif: string, dateReport: string) => void;
  isLoading: boolean;
}> = ({ isOpen, onClose, match, onSave, isLoading }) => {
  const [motif, setMotif] = useState('');
  const [dateReport, setDateReport] = useState('');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Reporter le match"
      subtitle={match ? `${match.club_domicile?.nom} vs ${match.club_exterieur?.nom}` : ''}
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
            {isLoading ? 'Report...' : 'Confirmer le report'}
          </button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label className="form-label">Motif du report <span style={{ color: '#991B1B' }}>*</span></label>
          <textarea
            className="form-input"
            value={motif}
            onChange={e => setMotif(e.target.value)}
            rows={3}
            placeholder="Expliquez la raison du report (minimum 10 caractères)..."
            style={{ resize: 'vertical' }}
          />
          <span className="form-hint">{motif.length}/500 caractères (min. 10)</span>
        </div>
        <div>
          <label className="form-label">Nouvelle date <span style={{ color: '#991B1B' }}>*</span></label>
          <input type="datetime-local" className="form-input" value={dateReport} onChange={e => setDateReport(e.target.value)} />
        </div>
      </div>
    </Modal>
  );
};

// ── Page principale ────────────────────────────────────────────
const CalendrierPage: React.FC = () => {
  const queryClient = useQueryClient();

  const [selectedCompId, setSelectedCompId] = useState<number | null>(null);
  const [showGenerer, setShowGenerer] = useState(false);
  const [matchModifier, setMatchModifier] = useState<Match | null>(null);
  const [matchReporter, setMatchReporter] = useState<Match | null>(null);
  const [matchAnnuler, setMatchAnnuler] = useState<Match | null>(null);
  const [filtre, setFiltre] = useState<'tous' | 'sans_officiel' | 'reportes'>('tous');
  const [filterJournee, setFilterJournee] = useState<number | null>(null);

  // ── Chargement des compétitions (saison en cours) ──
  const { data: saisonsData } = useQuery({
    queryKey: ['admin-saisons-actives'],
    queryFn: () => api.get('/admin/saisons', { params: { statut: 'en_cours' } }).then(r => r.data),
  });

  const saisonActive = saisonsData?.data?.find((s: any) => s.statut === 'en_cours') || saisonsData?.data?.[0];

  const { data: compsData } = useQuery({
    queryKey: ['admin-competitions-actives', saisonActive?.id],
    queryFn: () => saisonActive ? api.get(`/admin/saisons/${saisonActive.id}/competitions`).then(r => r.data) : null,
    enabled: !!saisonActive,
  });

  const competitions: Competition[] = compsData?.data ?? [];

  // Sélectionner la première compétition par défaut
  React.useEffect(() => {
    if (competitions.length > 0 && !selectedCompId) {
      setSelectedCompId(competitions[0].id);
    }
  }, [competitions]);

  // ── Chargement du calendrier ──
  const { data: calData, isLoading: loadingCal } = useQuery({
    queryKey: ['admin-calendrier', selectedCompId],
    queryFn: () => selectedCompId ? getCalendrier(selectedCompId) : null,
    enabled: !!selectedCompId,
  });

  const journees: Journee[] = calData?.data ?? [];
  const meta = calData?.meta;

  // Chargement des poules pour la compétition sélectionnée
  const [poules, setPoules] = useState<Array<{ id: number; nom: string }>>([]);

  const generatedPouleIds = React.useMemo(() => {
    const ids = new Set<number>();
    journees.forEach(j => {
      j.matchs.forEach(m => {
        if (m.poule_id) {
          ids.add(m.poule_id);
        }
      });
    });
    return ids;
  }, [journees]);

  const poulesSansCalendrier = React.useMemo(() => {
    return poules.filter(p => !generatedPouleIds.has(p.id));
  }, [poules, generatedPouleIds]);

  const canGenerate = poules.length > 0 ? poulesSansCalendrier.length > 0 : journees.length === 0;

  React.useEffect(() => {
    if (!selectedCompId || !competitions.length) return;
    const comp = competitions.find(c => c.id === selectedCompId);
    if (!comp) return;

    api.get(`/admin/competitions/${selectedCompId}/phases`)
      .then(r => {
        const phases = r.data?.data ?? [];
        const phaseReg = phases.find((p: any) => p.type === 'reguliere');
        if (phaseReg) {
          return api.get(`/admin/phases/${phaseReg.id}/poules`);
        }
        return null;
      })
      .then(r => {
        if (r) setPoules(r.data?.data ?? []);
      })
      .catch(() => setPoules([]));
  }, [selectedCompId, competitions]);

  // ── Mutations ──
  const genererMutation = useMutation({
    mutationFn: ({ pouleId, params }: { pouleId: number; params: object }) =>
      genererCalendrier(pouleId, params),
    onSuccess: (res) => {
      toast.success(res.message ?? 'Calendrier généré !');
      setShowGenerer(false);
      queryClient.invalidateQueries({ queryKey: ['admin-calendrier', selectedCompId] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Erreur lors de la génération.'),
  });

  const modifierMutation = useMutation({
    mutationFn: (data: any) => api.put(`/admin/matchs/${matchModifier?.id}`, data).then(r => r.data),
    onSuccess: () => {
      toast.success('Match modifié.');
      setMatchModifier(null);
      queryClient.invalidateQueries({ queryKey: ['admin-calendrier', selectedCompId] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Erreur.'),
  });

  const reporterMutation = useMutation({
    mutationFn: ({ motif, dateReport }: { motif: string; dateReport: string }) =>
      reporterMatch(matchReporter!.id, { motif, date_heure_report: toUTCISOString(dateReport) }),
    onSuccess: () => {
      toast.success('Match reporté.');
      setMatchReporter(null);
      queryClient.invalidateQueries({ queryKey: ['admin-calendrier', selectedCompId] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Erreur.'),
  });

  const annulerMutation = useMutation({
    mutationFn: () => annulerMatch(matchAnnuler!.id, 'Annulé par l\'administration'),
    onSuccess: () => {
      toast.success('Match annulé.');
      setMatchAnnuler(null);
      queryClient.invalidateQueries({ queryKey: ['admin-calendrier', selectedCompId] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Erreur.'),
  });

  // ── Filtrage ──
  let journeesFiltrees = journees;
  if (filtre === 'sans_officiel') {
    journeesFiltrees = journees
      .map(j => ({ ...j, matchs: j.matchs.filter(m => !m.a_commissaire || !m.a_arbitre) }))
      .filter(j => j.matchs.length > 0);
  }
  if (filtre === 'reportes') {
    journeesFiltrees = journees
      .map(j => ({ ...j, matchs: j.matchs.filter(m => m.statut === 'reporte') }))
      .filter(j => j.matchs.length > 0);
  }
  if (filterJournee !== null) {
    journeesFiltrees = journeesFiltrees.filter(j => j.journee === filterJournee);
  }

  return (
    <div className="animate-fade-in-up">
      {/* Header page */}
      <div style={{
        background: 'linear-gradient(135deg, #2D6A4F 0%, #40916C 100%)',
        borderRadius: '20px', padding: '24px 28px',
        color: '#fff', marginBottom: '24px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
              Module 3
            </div>
            <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Calendar size={24} /> Calendrier des matchs
            </h1>
            <p style={{ margin: '6px 0 0', fontSize: '14px', opacity: 0.8 }}>
              {saisonActive ? saisonActive.intitule : 'Aucune saison active'}
            </p>
            {poules.length > 0 && (
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap', fontSize: '12px' }}>
                {poules.map(p => {
                  const generated = generatedPouleIds.has(p.id);
                  return (
                    <span
                      key={p.id}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        background: generated ? 'rgba(255, 255, 255, 0.15)' : 'rgba(233, 196, 106, 0.15)',
                        color: generated ? '#fff' : '#E9C46A',
                        fontWeight: 600,
                        border: `1px solid ${generated ? 'rgba(255,255,255,0.2)' : 'rgba(233, 196, 106, 0.3)'}`,
                      }}
                    >
                      {generated ? '✓' : '⏳'} {p.nom} : {generated ? 'Généré' : 'En attente'}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
          <button
            className="btn"
            onClick={() => setShowGenerer(true)}
            disabled={!canGenerate}
            style={{
              background: '#E9C46A', color: '#2C3E2F', border: 'none', fontWeight: 700,
              opacity: !canGenerate ? 0.5 : 1,
            }}
          >
            <Plus size={16} /> Générer le calendrier
          </button>
        </div>

        {/* Stats */}
        {meta && (
          <div style={{
            marginTop: '16px', display: 'flex', gap: '24px', flexWrap: 'wrap',
            background: 'rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px 20px',
          }}>
            {[
              { label: 'Journées', value: meta.total_journees },
              { label: 'Matchs', value: meta.total_matchs },
              { label: 'Sans officiel', value: meta.total_sans_officiel, warn: meta.total_sans_officiel > 0 },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '22px', fontWeight: 800, color: s.warn ? '#E9C46A' : '#fff' }}>{s.value}</div>
                <div style={{ fontSize: '11px', opacity: 0.7 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sélecteur de compétition */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {competitions.map(comp => (
          <button
            key={comp.id}
            onClick={() => setSelectedCompId(comp.id)}
            style={{
              padding: '10px 20px', borderRadius: '12px', border: 'none', cursor: 'pointer',
              fontWeight: 700, fontSize: '14px', transition: 'all 0.2s',
              background: selectedCompId === comp.id
                ? (comp.niveau === 'elite_one' ? '#2D6A4F' : '#846D42')
                : '#fff',
              color: selectedCompId === comp.id ? '#fff' : '#2C3E2F',
              boxShadow: selectedCompId === comp.id ? '0 4px 12px rgba(0,0,0,0.15)' : '0 1px 4px rgba(0,0,0,0.06)',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}
          >
            {comp.niveau === 'elite_one'
              ? <Trophy size={15} style={{ color: selectedCompId === comp.id ? '#E9C46A' : '#2D6A4F' }} />
              : <Zap size={15} />}
            {comp.nom}
          </button>
        ))}
      </div>

      {/* Filtres */}
      {journees.length > 0 && (
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="tabs">
            {([
              { id: 'tous', label: 'Toutes les journées' },
              { id: 'sans_officiel', label: `Sans officiel (${meta?.total_sans_officiel ?? 0})` },
              { id: 'reportes', label: 'Reportés' },
            ] as const).map(f => (
              <button
                key={f.id}
                className={`tab-btn ${filtre === f.id ? 'active' : ''}`}
                onClick={() => setFiltre(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div>
            <select
              className="form-select"
              style={{ width: '160px', padding: '8px 12px', fontSize: '13px' }}
              value={filterJournee ?? ''}
              onChange={e => setFilterJournee(e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">Toutes journées</option>
              {journees.map(j => (
                <option key={j.journee} value={j.journee}>Journée {j.journee}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Contenu */}
      {!selectedCompId ? (
        <div className="card" style={{ padding: '48px', textAlign: 'center', color: '#6B8E6E' }}>
          Sélectionnez une compétition pour voir le calendrier.
        </div>
      ) : loadingCal ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: '64px' }} />)}
        </div>
      ) : journees.length === 0 ? (
        <div className="card" style={{ padding: '64px', textAlign: 'center' }}>
          <Calendar size={48} style={{ color: '#A3C4A6', margin: '0 auto 16px', display: 'block' }} />
          <h3 style={{ color: '#2C3E2F', fontWeight: 700, marginBottom: '8px' }}>Calendrier non généré</h3>
          <p style={{ color: '#6B8E6E', marginBottom: '20px', fontSize: '14px' }}>
            Le calendrier de cette compétition n'a pas encore été généré. <br />
            Assurez-vous que des clubs sont affectés aux poules avant de générer.
          </p>
          <button className="btn btn-primary" onClick={() => setShowGenerer(true)}>
            <Plus size={15} /> Générer le calendrier
          </button>
        </div>
      ) : journeesFiltrees.length === 0 ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center', color: '#6B8E6E' }}>
          Aucune journée ne correspond aux filtres sélectionnés.
        </div>
      ) : (
        <div>
          {journeesFiltrees.map((journee, idx) => (
            <JourneeAccordion
              key={journee.journee}
              journee={journee}
              defaultOpen={idx === 0}
              onReporter={setMatchReporter}
              onAnnuler={setMatchAnnuler}
              onModifier={setMatchModifier}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {showGenerer && (
        <GenererCalendrierModal
          isOpen={showGenerer}
          onClose={() => setShowGenerer(false)}
          poules={poulesSansCalendrier}
          onConfirm={(pouleId, params) => genererMutation.mutate({ pouleId, params })}
          isLoading={genererMutation.isPending}
        />
      )}

      <ModifierMatchModal
        isOpen={!!matchModifier}
        onClose={() => setMatchModifier(null)}
        match={matchModifier}
        onSave={(data) => modifierMutation.mutate(data)}
        isLoading={modifierMutation.isPending}
      />

      <ReporterMatchModal
        isOpen={!!matchReporter}
        onClose={() => setMatchReporter(null)}
        match={matchReporter}
        onSave={(motif, dateReport) => reporterMutation.mutate({ motif, dateReport })}
        isLoading={reporterMutation.isPending}
      />

      <ConfirmDialog
        isOpen={!!matchAnnuler}
        onClose={() => setMatchAnnuler(null)}
        onConfirm={() => annulerMutation.mutate()}
        title="Annuler le match"
        message={`Êtes-vous sûr de vouloir annuler le match ${matchAnnuler?.club_domicile?.nom ?? ''} vs ${matchAnnuler?.club_exterieur?.nom ?? ''} ? Cette action peut être irréversible.`}
        confirmLabel="Annuler le match"
        confirmVariant="danger"
        isLoading={annulerMutation.isPending}
      />
    </div>
  );
};

export default CalendrierPage;
