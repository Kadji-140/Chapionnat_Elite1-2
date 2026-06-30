// src/pages/admin/saisons/PoulesAffectationPage.tsx
// Affectation des clubs aux poules par drag & drop ou tirage au sort

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Shuffle, Save, Users2, X, GripVertical, Trophy, Zap
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getPhases, getPoules, affecterClubs, tirageAleatoire,
  type Phase, type Poule, type PouleClub,
} from '../../../api/saisons.api';
import { getCompetition, type Competition } from '../../../api/saisons.api';
// ── Utilitaire : chargement des clubs libres depuis l'API Admin ──
import api from '../../../api/axios';

// ── Composant Carte Club draggable ────────────────────────────
const ClubCard: React.FC<{
  club: { id: number; nom: string; ville?: string; logo_url?: string | null };
  draggable?: boolean;
  onRemove?: () => void;
  compact?: boolean;
  themeColor?: string;
}> = ({ club, draggable, onRemove, compact, themeColor = '#1B4332' }) => (
  <div
    draggable={draggable}
    style={{
      display: 'flex', alignItems: 'center', gap: '8px',
      padding: compact ? '8px 10px' : '10px 12px',
      background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px',
      cursor: draggable ? 'grab' : 'default',
      transition: 'all 0.15s',
      userSelect: 'none',
    }}
    onMouseEnter={(e) => draggable && (e.currentTarget.style.borderColor = themeColor)}
    onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#e2e8f0')}
  >
    {draggable && <GripVertical size={14} style={{ color: '#94a3b8', flexShrink: 0 }} />}
    {club.logo_url ? (
      <img src={club.logo_url} alt="" style={{ width: 28, height: 28, borderRadius: '6px', objectFit: 'cover', flexShrink: 0 }} />
    ) : (
      <div style={{
        width: 28, height: 28, borderRadius: '6px',
        background: themeColor === '#1B4332'
          ? 'linear-gradient(135deg, #1B4332, #2D6A4F)'
          : 'linear-gradient(135deg, #846D42, #A89368)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontSize: '11px', fontWeight: 700, flexShrink: 0,
      }}>
        {club.nom.substring(0, 2).toUpperCase()}
      </div>
    )}
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {club.nom}
      </div>
      {!compact && club.ville && <div style={{ fontSize: '11px', color: '#94a3b8' }}>{club.ville}</div>}
    </div>
    {onRemove && (
      <button
        onClick={onRemove}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', flexShrink: 0, padding: '2px' }}
        title="Retirer"
      >
        <X size={14} />
      </button>
    )}
  </div>
);

// ── Slot de Poule ─────────────────────────────────────────────
const PouleDropZone: React.FC<{
  poule: Poule;
  affectation: number[];
  allClubs: Array<{ id: number; nom: string; ville?: string; logo_url?: string | null }>;
  onDrop: (pouleId: number, clubId: number) => void;
  onRemove: (pouleId: number, clubId: number) => void;
  themeColor?: string;
  isEliteOne?: boolean;
}> = ({ poule, affectation, allClubs, onDrop, onRemove, themeColor = '#1B4332', isEliteOne = true }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const clubs = affectation.map(id => allClubs.find(c => c.id === id)).filter(Boolean) as any[];
  const isFull = clubs.length >= poule.nb_equipes;

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragOver(false);
        const clubId = Number(e.dataTransfer.getData('clubId'));
        if (!isFull && clubId) onDrop(poule.id, clubId);
      }}
      style={{
        background: isDragOver && !isFull ? (isEliteOne ? 'rgba(27,67,50,0.05)' : 'rgba(132,109,66,0.05)') : '#fafafa',
        border: `2px dashed ${isDragOver && !isFull ? themeColor : isFull ? '#e2e8f0' : '#cbd5e1'}`,
        borderRadius: '14px',
        padding: '16px',
        transition: 'all 0.2s',
        minHeight: '120px',
      }}
    >
      {/* Header poule */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <span style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>{poule.nom}</span>
        <span style={{
          fontSize: '12px', fontWeight: 600, padding: '3px 10px',
          borderRadius: '20px',
          background: isFull ? '#dcfce7' : '#f1f5f9',
          color: isFull ? '#15803d' : '#64748b',
        }}>
          {clubs.length}/{poule.nb_equipes}
        </span>
      </div>

      {/* Clubs affectés */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {clubs.map(club => (
          <ClubCard
            key={club.id}
            club={club}
            compact
            onRemove={() => onRemove(poule.id, club.id)}
            themeColor={themeColor}
          />
        ))}
        {!isFull && (
          <div style={{
            height: '36px', borderRadius: '8px', border: '1px dashed #cbd5e1',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '12px', color: '#94a3b8',
          }}>
            {isDragOver ? 'Déposer ici' : `+ ${poule.nb_equipes - clubs.length} place(s) libre(s)`}
          </div>
        )}
      </div>
    </div>
  );
};

// ── Page principale ────────────────────────────────────────────
const PoulesAffectationPage: React.FC = () => {
  const { id, competitionId } = useParams<{ id: string; competitionId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const saisonId = Number(id);
  const compId = Number(competitionId);

  // Affectation locale : { pouleId: clubId[] }
  const [affectation, setAffectation] = useState<Record<number, number[]>>({});
  const [isDirty, setIsDirty] = useState(false);

  // Chargement
  const { data: compData } = useQuery({
    queryKey: ['admin-competition', compId],
    queryFn: () => getCompetition(compId),
  });
  const competition: Competition | undefined = compData?.data;

  const { data: phasesData } = useQuery({
    queryKey: ['admin-phases', compId],
    queryFn: () => getPhases(compId),
  });
  const phases: Phase[] = phasesData?.data ?? [];
  const phaseReg = phases.find(p => p.type === 'reguliere');

  const { data: poulesData } = useQuery({
    queryKey: ['admin-poules', phaseReg?.id],
    queryFn: () => phaseReg ? getPoules(phaseReg.id) : Promise.resolve({ data: [] }),
    enabled: !!phaseReg,
  });
  const poules: Poule[] = poulesData?.data ?? [];

  // Clubs disponibles (de la bonne division)
  const [allClubs, setAllClubs] = useState<Array<{ id: number; nom: string; ville?: string; logo_url?: string | null }>>([]);
  useEffect(() => {
    if (!competition) return;
    api.get('/admin/clubs', { params: { per_page: 100, est_actif: true } }).then(res => {
      const clubs = (res.data?.data ?? []).filter((c: any) => c.division === competition.niveau);
      setAllClubs(clubs);
    }).catch(() => setAllClubs([]));
  }, [competition]);

  // Pré-remplir depuis la BD
  useEffect(() => {
    if (poules.length === 0) return;
    const init: Record<number, number[]> = {};
    poules.forEach(p => {
      init[p.id] = (p.clubs ?? []).map((c: PouleClub) => c.id);
    });
    setAffectation(init);
    setIsDirty(false);
  }, [poules]);

  // Clubs déjà affectés
  const affectesIds = new Set(Object.values(affectation).flat());
  const libres = allClubs.filter(c => !affectesIds.has(c.id));

  const handleDrop = (pouleId: number, clubId: number) => {
    setAffectation(prev => ({
      ...prev,
      [pouleId]: [...(prev[pouleId] ?? []), clubId],
    }));
    setIsDirty(true);
  };

  const handleRemove = (pouleId: number, clubId: number) => {
    setAffectation(prev => ({
      ...prev,
      [pouleId]: (prev[pouleId] ?? []).filter(id => id !== clubId),
    }));
    setIsDirty(true);
  };

  // Sauvegarde
  const saveMutation = useMutation({
    mutationFn: async () => {
      for (const [pouleIdStr, clubIds] of Object.entries(affectation)) {
        await affecterClubs(Number(pouleIdStr), clubIds);
      }
    },
    onSuccess: () => {
      toast.success('Affectation sauvegardée !');
      setIsDirty(false);
      queryClient.invalidateQueries({ queryKey: ['admin-poules', phaseReg?.id] });
    },
    onError: () => toast.error('Erreur lors de la sauvegarde.'),
  });

  // Tirage au sort
  const tirageMutation = useMutation({
    mutationFn: async () => {
      if (!poules[0]) throw new Error('Aucune poule');
      return tirageAleatoire(poules[0].id, competition!.niveau);
    },
    onSuccess: (res) => {
      toast.success(res.message ?? 'Tirage effectué !');
      // Re-remplir l'affectation depuis la réponse
      const newAff: Record<number, number[]> = {};
      (res.data ?? []).forEach((p: Poule) => {
        newAff[p.id] = (p.clubs ?? []).map((c: PouleClub) => c.id);
      });
      setAffectation(newAff);
      setIsDirty(false);
      queryClient.invalidateQueries({ queryKey: ['admin-poules', phaseReg?.id] });
    },
    onError: () => toast.error('Erreur lors du tirage.'),
  });

  const isEliteOne = competition?.niveau === 'elite_one';
  const themeColor = isEliteOne ? '#1B4332' : '#92400E';

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => navigate(`/admin/saisons/${saisonId}`)}
          style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <ArrowLeft size={15} /> Retour à la saison
        </button>

        <div style={{
          background: isEliteOne ? 'linear-gradient(135deg, #1B4332, #2D6A4F)' : 'linear-gradient(135deg, #78350F, #92400E)',
          borderRadius: '20px', padding: '20px 24px', color: '#fff',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {isEliteOne ? <Trophy size={22} style={{ color: '#FFB800' }} /> : <Zap size={22} style={{ color: '#FDE68A' }} />}
            <div>
              <div style={{ fontSize: '12px', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                Affectation des clubs
              </div>
              <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>
                {competition?.nom ?? 'Chargement...'}
              </h1>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="btn btn-sm"
              onClick={() => tirageMutation.mutate()}
              disabled={tirageMutation.isPending || allClubs.length === 0}
              style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.25)' }}
            >
              <Shuffle size={14} />
              {tirageMutation.isPending ? 'Tirage...' : 'Tirage au sort'}
            </button>
            <button
              className="btn btn-sm"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || !isDirty}
              style={{ background: '#FFB800', color: '#1e293b', border: 'none', fontWeight: 700, opacity: isDirty ? 1 : 0.6 }}
            >
              <Save size={14} />
              {saveMutation.isPending ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
          </div>
        </div>
      </div>

      {/* Corps */}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '20px', alignItems: 'start' }}>

        {/* Colonne : Clubs libres */}
        <div className="card" style={{ padding: '16px', position: 'sticky', top: '80px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Users2 size={16} style={{ color: themeColor }} />
            <span style={{ fontWeight: 700, fontSize: '14px' }}>
              Clubs non affectés ({libres.length})
            </span>
          </div>
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '6px', minHeight: '100px', maxHeight: '60vh', overflowY: 'auto' }}
          >
            {libres.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '13px', padding: '20px 0' }}>
                Tous les clubs sont affectés ✓
              </div>
            ) : libres.map(club => (
              <div
                key={club.id}
                draggable
                onDragStart={(e) => e.dataTransfer.setData('clubId', String(club.id))}
              >
                <ClubCard club={club} draggable themeColor={themeColor} />
              </div>
            ))}
          </div>
          <div style={{ marginTop: '12px', padding: '10px', background: '#f8fafc', borderRadius: '8px', fontSize: '12px', color: '#64748b' }}>
            💡 Glissez-déposez les clubs dans les poules, ou utilisez le tirage au sort automatique.
          </div>
        </div>

        {/* Colonne : Poules */}
        <div>
          {poules.length === 0 ? (
            <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
              <p style={{ color: '#64748b' }}>
                Aucune poule générée. Allez dans l'onglet "Phases" de la saison pour générer les phases d'abord.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {poules.map(poule => (
                <div key={poule.id}>
                  <PouleDropZone
                    poule={poule}
                    affectation={affectation[poule.id] ?? []}
                    allClubs={allClubs}
                    onDrop={handleDrop}
                    onRemove={handleRemove}
                    themeColor={themeColor}
                    isEliteOne={isEliteOne}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Indicateur changements non sauvegardés */}
      {isDirty && (
        <div style={{
          position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
          background: '#1e293b', color: '#fff', padding: '12px 20px', borderRadius: '12px',
          display: 'flex', alignItems: 'center', gap: '12px', zIndex: 200,
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)', fontSize: '13px',
          animation: 'slideInUp 0.3s ease',
        }}>
          <span>⚠️ Modifications non sauvegardées</span>
          <button
            className="btn btn-sm"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            style={{ background: themeColor, color: '#fff', border: 'none' }}
          >
            <Save size={13} /> Sauvegarder
          </button>
        </div>
      )}
    </div>
  );
};

export default PoulesAffectationPage;
