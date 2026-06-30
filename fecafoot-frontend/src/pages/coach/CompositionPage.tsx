// src/pages/coach/CompositionPage.tsx
// Interface de saisie de composition tactique avec pitch SVG et effectif filtre

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Save, CheckCircle, AlertTriangle, Users,
  Clock, UserPlus, Trash2, Search, Star, Shield
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import {
  getComposition,
  sauvegarderComposition,
  confirmerComposition,
  getCompositionPrecedente,
  type Formation,
  type JoueurCompositionInput,
  FORMATION_POSTES,
  FORMATIONS
} from '../../api/compositions.api';
import { PitchView } from '../../components/matchs/PitchView';
import { useTranslation } from '../../hooks/useTranslation';

// Interface pour un joueur
interface JoueurComposition {
  id: number;
  nom: string;
  prenom: string;
  numero_maillot: number | null;
  poste: string | null;
  photo_url?: string | null;
}

// Helpers de catégorie de poste
const getPosteCategory = (poste: string | null): 'gardien' | 'defenseur' | 'milieu' | 'attaquant' | 'inconnu' => {
  if (!poste) return 'inconnu';
  const p = poste.toLowerCase();
  if (p.includes('gardien')) return 'gardien';
  if (p.includes('defenseur') || p.includes('lateral') || p.includes('def')) return 'defenseur';
  if (p.includes('milieu')) return 'milieu';
  if (p.includes('attaquant') || p.includes('avant') || p.includes('ailier')) return 'attaquant';
  return 'inconnu';
};

const isPosteMatching = (slotLigne: string, playerPoste: string | null): boolean => {
  const cat = getPosteCategory(playerPoste);
  if (slotLigne === 'gardien') return cat === 'gardien';
  if (slotLigne === 'defense') return cat === 'defenseur';
  if (slotLigne === 'milieu') return cat === 'milieu';
  if (slotLigne === 'attaque') return cat === 'attaquant';
  return false;
};

const getPosteLabel = (poste: string | null, isEn: boolean): string => {
  if (!poste) return isEn ? 'Undefined Position' : 'Poste non défini';
  
  const mapFr: Record<string, string> = {
    gardien: 'Gardien de but',
    defenseur_central: 'Défenseur central',
    lateral_droit: 'Latéral droit',
    lateral_gauche: 'Latéral gauche',
    milieu_defensif: 'Milieu défensif',
    milieu_central: 'Milieu central',
    milieu_offensif: 'Milieu offensif',
    ailier_droit: 'Ailier droit',
    ailier_gauche: 'Ailier gauche',
    attaquant_centre: 'Attaquant de pointe',
    avant_centre: 'Avant-centre',
  };

  const mapEn: Record<string, string> = {
    gardien: 'Goalkeeper',
    defenseur_central: 'Centre-back',
    lateral_droit: 'Right-back',
    lateral_gauche: 'Left-back',
    milieu_defensif: 'Defensive midfielder',
    milieu_central: 'Central midfielder',
    milieu_offensif: 'Attacking midfielder',
    ailier_droit: 'Right winger',
    ailier_gauche: 'Left winger',
    attaquant_centre: 'Striker',
    avant_centre: 'Centre-forward',
  };

  return isEn ? (mapEn[poste] ?? poste) : (mapFr[poste] ?? poste);
};

export const CompositionPage: React.FC = () => {
  const { id: matchId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { lang } = useTranslation();
  const isEn = lang === 'en';

  const [formation, setFormation] = useState<Formation>('4-3-3');
  const [joueursParPoste, setJoueursParPoste] = useState<Record<string, any>>({});
  const [joueursDisponibles, setJoueursDisponibles] = useState<JoueurComposition[]>([]);
  const [remplacants, setRemplacants] = useState<JoueurComposition[]>([]);
  const [selectedPoste, setSelectedPoste] = useState<string | null>(null);
  const [showJoueursList, setShowJoueursList] = useState(false);
  const [showAllPlayersInModal, setShowAllPlayersInModal] = useState(false);
  const [match, setMatch] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Filtres de recherche et de poste
  const [activeTab, setActiveTab] = useState<'titulaires' | 'disponibles' | 'remplacants'>('disponibles');
  const [searchTerm, setSearchTerm] = useState('');
  const [positionFilter, setPositionFilter] = useState<'all' | 'gardien' | 'defenseur' | 'milieu' | 'attaquant'>('all');

  // Charger la composition existante
  const { data: compoData, isLoading: loadingCompo } = useQuery({
    queryKey: ['coach-composition', matchId],
    queryFn: () => getComposition(Number(matchId)),
    enabled: !!matchId,
  });

  // Charger le match actuel
  useEffect(() => {
    const fetchMatch = async () => {
      try {
        const res = await api.get('/coach/matchs-a-venir');
        const matchs = res.data?.data || [];
        const found = matchs.find((m: any) => m.id === Number(matchId));
        setMatch(found);
      } catch (error) {
        console.error('Erreur chargement match:', error);
      } finally {
        setIsLoading(false);
      }
    };
    if (matchId) {
      fetchMatch();
    }
  }, [matchId]);

  // Charger les joueurs disponibles (uniquement validés par la FECAFOOT)
  useEffect(() => {
    if (match) {
      api.get('/coach/joueurs?statut_validation=valide')
        .then(res => {
          const joueurs = (res.data?.data || []).map((j: any) => ({
            id: j.id,
            nom: j.nom,
            prenom: j.prenom,
            numero_maillot: j.num_maillot,
            poste: j.poste,
            photo_url: j.photo_url,
          }));
          setJoueursDisponibles(joueurs);
        })
        .catch(err => console.error('❌ Erreur chargement joueurs:', err));
    }
  }, [match]);

  const composition = compoData?.data;
  const estConfirmee = composition?.est_confirmee || false;
  const isVerrouille = match ? !['programme', 'reporte'].includes(match.statut) : false;

  // Initialiser depuis la composition existante
  useEffect(() => {
    if (composition) {
      setFormation(composition.formation as Formation);

      const postesMap: Record<string, any> = {};
      composition.titulaires?.forEach((t: any, index: number) => {
        const posteId = t.poste_id || `poste_${index}`;
        postesMap[posteId] = {
          joueurId: t.joueur_id,
          nom: t.joueur?.nom,
          prenom: t.joueur?.prenom,
          numero: t.joueur?.num_maillot,
          estCapitaine: t.est_capitaine,
          photo_url: t.joueur?.photo_url,
        };
      });
      setJoueursParPoste(postesMap);

      // Charger les remplaçants
      if (composition.remplacants) {
        setRemplacants(composition.remplacants.map((r: any) => ({
          id: r.joueur_id,
          nom: r.joueur?.nom,
          prenom: r.joueur?.prenom,
          numero_maillot: r.joueur?.num_maillot,
          poste: r.joueur?.poste,
          photo_url: r.joueur?.photo_url,
        })));
      }
    }
  }, [composition]);

  const handlePosteClick = (posteId: string) => {
    if (isVerrouille) {
      toast.error(isEn ? 'Lineup locked, modification impossible' : 'Composition verrouillée, modification impossible');
      return;
    }
    setSelectedPoste(posteId);
    setShowAllPlayersInModal(false);
    setShowJoueursList(true);
  };

  const handleSelectJoueur = (joueur: JoueurComposition, targetPosteId?: string) => {
    const posteId = targetPosteId || selectedPoste;
    if (!posteId) return;

    // Vérifier la correspondance de poste
    const posteDef = (FORMATION_POSTES[formation] || FORMATION_POSTES['4-3-3']).find((p: any) => p.id === posteId);
    if (posteDef) {
      const isMatching = isPosteMatching(posteDef.ligne, joueur.poste);
      if (!isMatching) {
        const confirmChange = window.confirm(
          isEn 
            ? `Warning: ${joueur.prenom} ${joueur.nom} is registered as "${getPosteLabel(joueur.poste, true)}".\nAre you sure you want to place them as "${posteDef.label}"?`
            : `Attention : ${joueur.prenom} ${joueur.nom} est enregistré comme "${getPosteLabel(joueur.poste, false)}".\nÊtes-vous sûr de vouloir le placer au poste de "${posteDef.label}" ?`
        );
        if (!confirmChange) return;
      }
    }

    // Vérifier si le joueur est déjà titulaire ailleurs
    const existingPoste = Object.entries(joueursParPoste).find(
      ([_, data]: [string, any]) => data?.joueurId === joueur.id
    );
    if (existingPoste) {
      const [oldPosteId] = existingPoste;
      setJoueursParPoste(prev => ({ ...prev, [oldPosteId]: null }));
    }

    // Retirer des remplaçants si présent
    setRemplacants(prev => prev.filter(r => r.id !== joueur.id));

    setJoueursParPoste(prev => ({
      ...prev,
      [posteId]: {
        joueurId: joueur.id,
        nom: joueur.nom,
        prenom: joueur.prenom,
        numero: joueur.numero_maillot,
        estCapitaine: false,
        photo_url: joueur.photo_url,
      },
    }));
    setShowJoueursList(false);
    setSelectedPoste(null);
  };

  const handlePlayerDrop = (joueur: JoueurComposition, posteId: string) => {
    if (isVerrouille) return;
    handleSelectJoueur(joueur, posteId);
  };

  const handleSelectRemplacant = (joueur: JoueurComposition) => {
    if (isVerrouille) return;

    // Vérifier si déjà dans les remplaçants
    const dejaPresent = remplacants.some(r => r.id === joueur.id);
    if (dejaPresent) {
      setRemplacants(prev => prev.filter(r => r.id !== joueur.id));
    } else {
      // Retirer des titulaires si présent
      const posteToRemove = Object.entries(joueursParPoste).find(
        ([_, data]: [string, any]) => data?.joueurId === joueur.id
      );
      if (posteToRemove) {
        const [posteId] = posteToRemove;
        setJoueursParPoste(prev => ({ ...prev, [posteId]: null }));
      }
      setRemplacants(prev => [...prev, joueur]);
    }
  };

  // Retirer un titulaire du terrain
  const handleRemoveTitulaire = (posteId: string) => {
    if (isVerrouille) return;
    setJoueursParPoste(prev => ({ ...prev, [posteId]: null }));
  };

  // Désigner comme capitaine
  const handleSetCapitaine = (posteId: string) => {
    if (isVerrouille) return;
    setJoueursParPoste(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(key => {
        if (next[key]) {
          next[key] = { ...next[key], estCapitaine: key === posteId };
        }
      });
      return next;
    });
  };

  const handleSauvegarder = async () => {
    const titulaires: JoueurCompositionInput[] = Object.entries(joueursParPoste)
      .filter(([_, j]) => j !== null)
      .map(([posteId, j]: [string, any], index: number) => ({
        joueur_id: j.joueurId,
        role: 'titulaire' as const,
        est_capitaine: j.estCapitaine || false,
        poste_id: posteId,
        poste_index: index,
      }));

    if (titulaires.length !== 11) {
      toast.error(
        isEn 
          ? `You must place exactly 11 players on the pitch (currently: ${titulaires.length})`
          : `Vous devez placer exactement 11 joueurs sur le terrain (actuellement: ${titulaires.length})`
      );
      return;
    }

    const capitaineCount = titulaires.filter(t => t.est_capitaine).length;
    if (capitaineCount === 0) {
      toast.error(isEn ? 'You must designate a captain (⭐)' : 'Vous devez désigner un capitaine (⭐)');
      return;
    }

    // Ajouter les remplaçants
    remplacants.forEach(remplacant => {
      titulaires.push({
        joueur_id: remplacant.id,
        role: 'remplacant' as const,
        est_capitaine: false,
      });
    });

    try {
      await sauvegarderComposition(Number(matchId), {
        formation,
        joueurs: titulaires,
      });
      toast.success(isEn ? 'Lineup saved (draft)' : 'Composition sauvegardée (brouillon)');
      queryClient.invalidateQueries({ queryKey: ['coach-composition', matchId] });
    } catch (error: any) {
      toast.error(error.response?.data?.message || (isEn ? 'Error saving lineup' : 'Erreur lors de la sauvegarde'));
    }
  };

  const handleConfirmer = async () => {
    const titulaires: JoueurCompositionInput[] = Object.entries(joueursParPoste)
      .filter(([_, j]) => j !== null)
      .map(([posteId, j]: [string, any], index: number) => ({
        joueur_id: j.joueurId,
        role: 'titulaire' as const,
        est_capitaine: j.estCapitaine || false,
        poste_id: posteId,
        poste_index: index,
      }));

    if (titulaires.length !== 11) {
      toast.error(isEn ? 'Please place 11 players on the pitch before confirming' : 'Veuillez placer 11 joueurs sur le terrain avant de confirmer');
      return;
    }

    const capitaineCount = titulaires.filter(t => t.est_capitaine).length;
    if (capitaineCount === 0) {
      toast.error(isEn ? 'You must designate a captain (⭐)' : 'Vous devez désigner un capitaine (⭐)');
      return;
    }

    // Ajouter les remplaçants
    remplacants.forEach(remplacant => {
      titulaires.push({
        joueur_id: remplacant.id,
        role: 'remplacant' as const,
        est_capitaine: false,
      });
    });

    const confirmMsg = isEn 
      ? 'Do you confirm this lineup? It will be sent to the officials.' 
      : 'Confirmez-vous cette composition ? Elle sera transmise aux officiels.';

    if (window.confirm(confirmMsg)) {
      try {
        await sauvegarderComposition(Number(matchId), {
          formation,
          joueurs: titulaires,
          confirmer: true,
        });
        toast.success(isEn ? 'Lineup confirmed and locked! 🔒' : 'Composition confirmée et verrouillée ! 🔒');
        queryClient.invalidateQueries({ queryKey: ['coach-composition', matchId] });
      } catch (error: any) {
        toast.error(error.response?.data?.message || (isEn ? 'Error confirming lineup' : 'Erreur lors de la confirmation'));
      }
    }
  };

  const handleImporterPrecedente = async () => {
    try {
      const res = await getCompositionPrecedente(Number(matchId));
      if (res.success && res.data) {
        const prevCompo = res.data;
        setFormation(prevCompo.formation as Formation);

        const postesMap: Record<string, any> = {};
        prevCompo.titulaires?.forEach((t: any, index: number) => {
          const exists = joueursDisponibles.some(j => j.id === t.joueur_id);
          if (exists && t.joueur) {
            const posteId = t.poste_id || `poste_${index}`;
            postesMap[posteId] = {
              joueurId: t.joueur_id,
              nom: t.joueur.nom,
              prenom: t.joueur.prenom,
              numero: t.joueur.num_maillot ?? t.joueur.numero_maillot,
              estCapitaine: t.est_capitaine,
              photo_url: t.joueur.photo_url,
            };
          }
        });
        setJoueursParPoste(postesMap);

        if (prevCompo.remplacants) {
          const availableRemp = prevCompo.remplacants
            .filter((r: any) => joueursDisponibles.some(j => j.id === r.joueur_id))
            .map((r: any) => ({
              id: r.joueur_id,
              nom: r.joueur?.nom,
              prenom: r.joueur?.prenom,
              numero_maillot: r.joueur?.num_maillot ?? r.joueur?.numero_maillot,
              poste: r.joueur?.poste,
              photo_url: r.joueur?.photo_url,
            }));
          setRemplacants(availableRemp);
        }
        toast.success(isEn ? 'Last lineup imported successfully!' : 'Dernière composition importée avec succès !');
      } else {
        toast.error(isEn ? 'No previous lineup found for your club.' : 'Aucune composition précédente trouvée pour votre club.');
      }
    } catch (error) {
      console.error(error);
      toast.error(isEn ? 'Error importing previous lineup.' : 'Erreur lors de l\'importation de la composition précédente.');
    }
  };

  const titulairesCount = Object.values(joueursParPoste).filter(j => j !== null).length;

  // Joueurs placés
  const placedTitulaires = Object.entries(joueursParPoste)
    .filter(([_, val]) => val !== null)
    .map(([key, val]: [string, any]) => ({
      posteId: key,
      ...val
    }));

  // Joueurs restants (non utilisés sur le terrain ni sur le banc des remplaçants)
  const joueursNonUtilises = joueursDisponibles.filter(j =>
    !Object.values(joueursParPoste).some(p => p?.joueurId === j.id) &&
    !remplacants.some(r => r.id === j.id)
  );

  const activePosteDef = selectedPoste
    ? (FORMATION_POSTES[formation] || FORMATION_POSTES['4-3-3']).find((p: any) => p.id === selectedPoste)
    : null;

  const playersForModal = selectedPoste
    ? (showAllPlayersInModal || !activePosteDef
      ? joueursNonUtilises
      : joueursNonUtilises.filter(j => isPosteMatching(activePosteDef.ligne, j.poste)))
    : [];

  // Filtrer les joueurs disponibles
  const filteredJoueursDisponibles = joueursNonUtilises.filter(j => {
    if (positionFilter !== 'all' && getPosteCategory(j.poste) !== positionFilter) {
      return false;
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        j.nom?.toLowerCase().includes(term) ||
        j.prenom?.toLowerCase().includes(term) ||
        (j.numero_maillot && String(j.numero_maillot).includes(term))
      );
    }
    return true;
  });

  if (loadingCompo || isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div style={{ width: 48, height: 48, border: '3px solid #2D6A4F', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  const hasCapitaine = Object.values(joueursParPoste).some(j => j?.estCapitaine);

  return (
    <div className="animate-fade-in-up" style={{ padding: '0px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => navigate('/coach/matchs')}
          style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <ArrowLeft size={15} /> {isEn ? 'Back to matches' : 'Retour aux matchs'}
        </button>

        <div style={{
          background: 'linear-gradient(135deg, #1B4332 0%, #2D6A4F 100%)',
          borderRadius: '20px',
          padding: '24px 28px',
          color: '#fff',
          boxShadow: 'var(--shadow-md)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.8, marginBottom: '6px' }}>
                {isEn ? 'FECAFOOT · Tactical Lineup' : 'FECAFOOT · Composition Tactique'}
              </div>
              <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 900 }}>
                {match?.club_domicile?.nom} vs {match?.club_exterieur?.nom}
              </h1>
              {match?.date_heure && (
                <p style={{ margin: '6px 0 0', fontSize: '13px', opacity: 0.8, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={14} style={{ color: 'var(--accent)' }} />
                  {new Date(match.date_heure).toLocaleDateString(isEn ? 'en-US' : 'fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  {isEn ? ' at ' : ' à '}
                  {new Date(match.date_heure).toLocaleTimeString(isEn ? 'en-US' : 'fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
              <div style={{
                background: estConfirmee ? '#D8F3DC' : isVerrouille ? '#FEE2E2' : '#FEF3C7',
                padding: '6px 14px',
                borderRadius: '24px',
                fontSize: '12px',
                fontWeight: 800,
                color: estConfirmee ? '#1B4332' : isVerrouille ? '#991B1B' : '#92400E',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: estConfirmee ? '#1B4332' : isVerrouille ? '#991B1B' : '#92400E' }} />
                {estConfirmee ? (isEn ? '✓ Lineup confirmed' : '✓ Composition confirmée') : isVerrouille ? (isEn ? '🔒 Locked' : '🔒 Verrouillée') : (isEn ? '📝 Draft' : '📝 Brouillon')}
              </div>
              <div style={{ fontSize: '12px', marginTop: '4px', opacity: 0.8, fontWeight: 600 }}>
                {titulairesCount}/11 {isEn ? 'placed players' : 'joueurs placés'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Alertes */}
      {isVerrouille && !estConfirmee && (
        <div style={{
          background: '#FEE2E2',
          border: '1px solid #FECACA',
          borderRadius: '16px',
          padding: '14px 20px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          color: '#991B1B',
          fontSize: '13px',
        }}>
          <AlertTriangle size={18} style={{ color: '#E53946', flexShrink: 0 }} />
          <div>
            <strong>{isEn ? 'Submission deadline passed:' : 'Délai de saisie dépassé :'}</strong> {isEn ? 'Less than 2 hours before the match. The team lineup is now locked and cannot be modified.' : "Moins de 2h avant le match. La composition d'équipe est maintenant verrouillée et ne peut plus être modifiée."}
          </div>
        </div>
      )}

      {/* Roster alerts */}
      {!isVerrouille && titulairesCount === 11 && !hasCapitaine && (
        <div style={{
          background: '#FEF3C7',
          border: '1px solid #FDE68A',
          borderRadius: '16px',
          padding: '12px 20px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          color: '#92400E',
          fontSize: '13px',
        }}>
          <AlertTriangle size={18} style={{ color: '#D97706', flexShrink: 0 }} />
          <div>
            <strong>{isEn ? 'Missing Captain:' : 'Capitaine manquant :'}</strong> {isEn ? 'Do not forget to designate the team captain (⭐) in the starters tab below.' : "N'oubliez pas d'indiquer le capitaine de l'équipe (⭐) dans l'onglet des titulaires ci-dessous."}
          </div>
        </div>
      )}

      {/* Formations horizontal list (Toute la largeur) */}
      <div className="card" style={{ padding: '20px', background: '#fff', display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px', boxShadow: 'var(--shadow-card)', borderRadius: '24px', border: '1px solid #E2E8F0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--primary)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {isEn ? 'Tactical Formation' : 'Schéma Tactique'}
          </h3>
          {!isVerrouille && (
            <button
              onClick={handleImporterPrecedente}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(27,67,50,0.08)',
                border: 'none',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 700,
                color: 'var(--primary)',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(27,67,50,0.15)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(27,67,50,0.08)' }}
            >
              <Users size={13} /> {isEn ? 'Import last lineup' : 'Importer la dernière composition'}
            </button>
          )}
        </div>
        
        <div style={{
          display: 'flex',
          gap: '10px',
          overflowX: 'auto',
          padding: '6px 2px',
          whiteSpace: 'nowrap',
          scrollbarWidth: 'thin',
        }}>
          {FORMATIONS.map(f => {
            const isSelected = formation === f.value;
            return (
              <button
                key={f.value}
                onClick={() => !isVerrouille && setFormation(f.value)}
                disabled={isVerrouille}
                style={{
                  flex: '0 0 auto',
                  padding: '8px 16px',
                  borderRadius: '12px',
                  border: isSelected ? '2px solid var(--primary)' : '1px solid #E2E8F0',
                  background: isSelected ? 'var(--primary-50)' : '#fff',
                  color: isSelected ? 'var(--primary-dark)' : 'var(--text-muted)',
                  fontWeight: 800,
                  fontSize: '12px',
                  cursor: isVerrouille ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main content flexbox layout: Controls on the Left, Pitch on the Right */}
      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap-reverse', alignItems: 'start' }}>
 
        {/* Left Side: Sidebar Controls */}
        <div style={{ flex: '1 1 360px', maxWidth: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }} className="composition-sidebar">
          
          {/* Squad Tabs Card */}
          <div className="card" style={{ background: '#fff', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '480px' }}>
            {/* Tab Headers */}
            <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC', flexWrap: 'wrap' }}>
              {/* Disponibles */}
              <button
                onClick={() => setActiveTab('disponibles')}
                style={{
                  flex: 1,
                  padding: '14px 12px',
                  border: 'none',
                  background: activeTab === 'disponibles' ? '#fff' : 'transparent',
                  borderBottom: activeTab === 'disponibles' ? '2.5px solid var(--primary)' : 'none',
                  fontWeight: 700,
                  fontSize: '13px',
                  color: activeTab === 'disponibles' ? 'var(--primary)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  minWidth: '100px',
                }}
              >
                <Users size={14} />
                {isEn ? 'Available' : 'Disponibles'} ({joueursNonUtilises.length})
              </button>

              {/* Titulaires */}
              <button
                onClick={() => setActiveTab('titulaires')}
                style={{
                  flex: 1,
                  padding: '14px 12px',
                  border: 'none',
                  background: activeTab === 'titulaires' ? '#fff' : 'transparent',
                  borderBottom: activeTab === 'titulaires' ? '2.5px solid var(--primary)' : 'none',
                  fontWeight: 700,
                  fontSize: '13px',
                  color: activeTab === 'titulaires' ? 'var(--primary)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  minWidth: '100px',
                }}
              >
                <Shield size={14} />
                {isEn ? 'Starters' : 'Titulaires'} ({titulairesCount}/11)
              </button>

              {/* Remplaçants */}
              <button
                onClick={() => setActiveTab('remplacants')}
                style={{
                  flex: 1,
                  padding: '14px 12px',
                  border: 'none',
                  background: activeTab === 'remplacants' ? '#fff' : 'transparent',
                  borderBottom: activeTab === 'remplacants' ? '2.5px solid var(--primary)' : 'none',
                  fontWeight: 700,
                  fontSize: '13px',
                  color: activeTab === 'remplacants' ? 'var(--primary)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  minWidth: '100px',
                }}
              >
                <UserPlus size={14} />
                {isEn ? 'Bench' : 'Banc'} ({remplacants.length})
              </button>
            </div>

            {/* Tab Body */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {activeTab === 'disponibles' && (
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                  {/* Search and filters */}
                  <div style={{ padding: '12px', borderBottom: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ position: 'relative' }}>
                      <Search size={12} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                      <input
                        type="text"
                        className="form-input"
                        placeholder={isEn ? 'Search player...' : 'Rechercher un joueur...'}
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        style={{ paddingLeft: '28px', fontSize: '12px', padding: '6px 10px 6px 28px' }}
                      />
                    </div>
                    {/* Position filters */}
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {([
                        { id: 'all', label: isEn ? 'All' : 'Tous' },
                        { id: 'gardien', label: 'GB' },
                        { id: 'defenseur', label: 'DEF' },
                        { id: 'milieu', label: 'MIL' },
                        { id: 'attaquant', label: 'ATT' },
                      ] as const).map(f => (
                        <button
                          key={f.id}
                          onClick={() => setPositionFilter(f.id)}
                          style={{
                            padding: '4px 8px',
                            fontSize: '10px',
                            fontWeight: 700,
                            borderRadius: '6px',
                            border: '1px solid #E2E8F0',
                            background: positionFilter === f.id ? 'var(--primary)' : '#fff',
                            color: positionFilter === f.id ? '#fff' : 'var(--text-muted)',
                            cursor: 'pointer',
                          }}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Available list */}
                  <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
                    {filteredJoueursDisponibles.map(joueur => (
                      <div
                        key={joueur.id}
                        onClick={() => !isVerrouille && handleSelectRemplacant(joueur)}
                        draggable={!isVerrouille}
                        onDragStart={(e) => {
                          if (!isVerrouille) {
                            e.dataTransfer.setData('application/json', JSON.stringify(joueur));
                          }
                        }}
                        style={{
                          padding: '10px 12px',
                          marginBottom: '8px',
                          borderRadius: '10px',
                          background: '#fff',
                          border: '1px solid #E2E8F0',
                          cursor: isVerrouille ? 'not-allowed' : 'grab',
                          transition: 'all 0.15s',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                        onMouseEnter={e => { if (!isVerrouille) { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.background = 'var(--primary-50)'; } }}
                        onMouseLeave={e => { if (!isVerrouille) { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.background = '#fff'; } }}
                      >
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text)' }}>
                            {joueur.prenom} {joueur.nom}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                            #{joueur.numero_maillot || '?'} · {getPosteLabel(joueur.poste, isEn)}
                          </div>
                        </div>
                        <span style={{ fontSize: '10px', color: 'var(--primary)', background: 'var(--primary-50)', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>
                          {isEn ? '+ Bench' : '+ Remplaçant'}
                        </span>
                      </div>
                    ))}
                    {filteredJoueursDisponibles.length === 0 && (
                      <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '30px 10px', fontSize: '13px' }}>
                        {isEn ? 'No players available' : 'Aucun joueur disponible'}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'titulaires' && (
                <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
                  {placedTitulaires.map(j => (
                    <div
                      key={j.joueurId}
                      style={{
                        padding: '10px 12px',
                        marginBottom: '8px',
                        borderRadius: '10px',
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{
                            background: '#1B4332',
                            color: '#fff',
                            fontSize: '9px',
                            fontWeight: 800,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            textTransform: 'uppercase',
                          }}>
                            {j.posteId.toUpperCase()}
                          </span>
                          <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {j.prenom} {j.nom}
                          </span>
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          #{j.numero || '?'} · {isEn ? 'Starter' : 'Titulaire'}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {/* Capitaine Button */}
                        <button
                          onClick={() => handleSetCapitaine(j.posteId)}
                          disabled={isVerrouille}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: isVerrouille ? 'not-allowed' : 'pointer',
                            color: j.estCapitaine ? '#FFB800' : '#CBD5E0',
                            padding: '6px',
                            borderRadius: '6px',
                            display: 'flex',
                            transition: 'all 0.15s',
                          }}
                          title={j.estCapitaine ? (isEn ? 'Team captain' : 'Capitaine d\'équipe') : (isEn ? 'Designate captain' : 'Désigner capitaine')}
                        >
                          <Star size={16} fill={j.estCapitaine ? '#FFB800' : 'none'} />
                        </button>

                        {/* Remove Button */}
                        {!isVerrouille && (
                          <button
                            onClick={() => handleRemoveTitulaire(j.posteId)}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: 'var(--secondary)',
                              padding: '6px',
                              borderRadius: '6px',
                              display: 'flex',
                            }}
                            title={isEn ? 'Remove from pitch' : 'Retirer du terrain'}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {placedTitulaires.length === 0 && (
                    <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '30px 10px', fontSize: '13px' }}>
                      {isEn ? 'No players placed on the pitch.' : 'Aucun joueur placé sur le terrain.'}
                    </p>
                  )}
                </div>
              )}

              {activeTab === 'remplacants' && (
                <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
                  {remplacants.map(joueur => (
                    <div
                      key={joueur.id}
                      draggable={!isVerrouille}
                      onDragStart={(e) => {
                        if (!isVerrouille) {
                          e.dataTransfer.setData('application/json', JSON.stringify(joueur));
                        }
                      }}
                      style={{
                        padding: '10px 12px',
                        marginBottom: '8px',
                        borderRadius: '10px',
                        background: 'var(--accent-50)',
                        border: '1px solid var(--accent-light)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: isVerrouille ? 'not-allowed' : 'grab',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--primary-dark)' }}>
                          {joueur.prenom} {joueur.nom}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          #{joueur.numero_maillot || '?'} · {getPosteLabel(joueur.poste, isEn)}
                        </div>
                      </div>
                      {!isVerrouille && (
                        <button
                          onClick={() => handleSelectRemplacant(joueur)}
                          style={{
                            background: 'rgba(200, 16, 46, 0.08)',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--secondary)',
                            padding: '6px',
                            borderRadius: '6px',
                            display: 'flex',
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  ))}
                  {remplacants.length === 0 && (
                    <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '30px 10px', fontSize: '13px' }}>
                      {isEn ? 'No substitutes selected (Empty bench)' : 'Aucun remplaçant sélectionné (Banc vide)'}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Actions Panel Sticky bottom */}
          {!isVerrouille && (
            <div style={{
              background: '#fff',
              border: '1px solid #E2E8F0',
              borderRadius: '24px',
              padding: '20px',
              boxShadow: 'var(--shadow-card)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}>
              <button
                className="btn btn-primary"
                onClick={handleSauvegarder}
                style={{ width: '100%', justifyContent: 'center', height: '42px', fontSize: '14px' }}
              >
                <Save size={16} /> {isEn ? 'Save Draft' : 'Enregistrer le brouillon'}
              </button>
              <button
                className="btn"
                onClick={handleConfirmer}
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  background: 'linear-gradient(135deg, var(--accent) 0%, #E6A500 100%)',
                  color: '#1B4332',
                  border: 'none',
                  fontWeight: 800,
                  height: '42px',
                  fontSize: '14px',
                  boxShadow: '0 4px 12px rgba(255, 184, 0, 0.2)',
                }}
              >
                <CheckCircle size={16} /> {isEn ? 'Confirm Lineup' : 'Confirmer la composition'}
              </button>
            </div>
          )}

          {estConfirmee && isVerrouille && (
            <div style={{
              padding: '16px',
              background: 'var(--primary-50)',
              border: '1px solid var(--primary-100)',
              borderRadius: '24px',
              textAlign: 'center',
            }}>
              <CheckCircle size={24} style={{ color: 'var(--primary-light)', margin: '0 auto 8px' }} />
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--primary-dark)', fontWeight: 700 }}>
                {isEn ? 'Lineup Locked & Submitted' : 'Composition verrouillée & transmise'}
              </p>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', display: 'block' }}>
                {isEn ? 'Match officials have access to the match sheet.' : 'Les officiels de la rencontre ont accès à la feuille de match.'}
              </span>
            </div>
          )}

          {estConfirmee && !isVerrouille && (
            <div style={{
              padding: '16px',
              background: 'rgba(27,67,50,0.06)',
              border: '1px dashed var(--primary-100)',
              borderRadius: '24px',
              textAlign: 'center',
              marginBottom: '12px'
            }}>
              <CheckCircle size={20} style={{ color: 'var(--primary-light)', margin: '0 auto 6px' }} />
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--primary-dark)', fontWeight: 700 }}>
                {isEn ? 'Lineup Submitted (Modifiable)' : 'Composition transmise (Modifiable)'}
              </p>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', display: 'block' }}>
                {isEn ? 'You can modify the lineup until kick-off.' : 'Vous pouvez modifier la composition jusqu\'au coup d\'envoi.'}
              </span>
            </div>
          )}
        </div>

        {/* Right Side: Pitch and warnings */}
        <div style={{ flex: '1 1 450px', minWidth: '280px', display: 'flex', flexDirection: 'column', gap: '20px' }} className="composition-pitch">

          <div style={{
            background: '#fff',
            border: '1px solid #E2E8F0',
            borderRadius: '24px',
            padding: '16px',
            boxShadow: 'var(--shadow-card)',
            width: '100%',
            overflow: 'hidden',
          }}>
            <PitchView
              formation={formation}
              joueursParPoste={joueursParPoste}
              onPosteClick={isVerrouille ? undefined : handlePosteClick}
              readonly={isVerrouille}
              onPlayerDrop={isVerrouille ? undefined : handlePlayerDrop}
            />
          </div>

          {/* Warnings and instructions */}
          <div className="card" style={{ padding: '20px', background: '#fff' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--primary)', margin: '0 0 12px 0', borderBottom: '1px solid #F1F5F9', paddingBottom: '8px' }}>
              {isEn ? 'Tactical Instructions' : 'Instructions tactiques'}
            </h3>
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li>{isEn ? 'Drag a player from the left list and drop them on their position on the pitch (Drag & Drop).' : 'Glissez un joueur depuis la liste de gauche et déposez-le sur son poste sur le terrain (Glisser-Déposer).'}</li>
              <li>{isEn ? 'You can also click on an empty position on the pitch (e.g. GK, CB) to assign a player.' : 'Vous pouvez également cliquer sur un poste libre sur le terrain (ex: GB, DC) pour affecter un joueur.'}</li>
              <li>{isEn ? 'You can configure your formation at the top of the pitch with the horizontal selector.' : 'Vous pouvez configurer votre schéma de jeu en haut du terrain avec le sélecteur horizontal de schéma.'}</li>
              <li>{isEn ? "Captain: Activate the star (⭐) next to a starter's name in the left list to designate them as captain." : "Capitaine : Activez l'étoile (⭐) à côté du nom d'un titulaire dans la liste de gauche pour le désigner comme capitaine."}</li>
            </ul>
          </div>
        </div>

      </div>

      {/* Modal de sélection des joueurs pour les postes */}
      {showJoueursList && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '24px',
            width: '90%',
            maxWidth: '420px',
            maxHeight: '80vh',
            overflow: 'hidden',
            animation: 'fadeInUp 0.2s ease',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
          }}>
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #E2E8E0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#f8fafc',
            }}>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800 }}>{isEn ? 'Choose for' : 'Choisir pour'} {selectedPoste?.toUpperCase()}</h3>
              <button
                onClick={() => setShowJoueursList(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  color: '#94A3B8',
                  padding: '4px 8px',
                  fontWeight: 700,
                }}
              >
                ✕
              </button>
            </div>
            
            {/* Filter Toggle */}
            <div style={{
              padding: '12px 24px',
              background: '#f8fafc',
              borderBottom: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <input
                type="checkbox"
                id="show-all-players"
                checked={showAllPlayersInModal}
                onChange={e => setShowAllPlayersInModal(e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              <label 
                htmlFor="show-all-players" 
                style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', cursor: 'pointer', userSelect: 'none' }}
              >
                {isEn ? 'Show all squad players' : "Afficher tous les joueurs de l'effectif"}
              </label>
            </div>

            <div style={{ padding: '16px', maxHeight: '350px', overflowY: 'auto' }}>
              {playersForModal.map(joueur => (
                <div
                  key={joueur.id}
                  onClick={() => handleSelectJoueur(joueur)}
                  style={{
                    padding: '14px',
                    marginBottom: '10px',
                    borderRadius: '12px',
                    background: '#fff',
                    border: '1px solid #E2E8E0',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--primary)';
                    e.currentTarget.style.background = 'var(--primary-50)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#E2E8E0';
                    e.currentTarget.style.background = '#fff';
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text)' }}>
                    {joueur.prenom} {joueur.nom}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    #{joueur.numero_maillot || '?'} · {getPosteLabel(joueur.poste, isEn)}
                  </div>
                </div>
              ))}
              {playersForModal.length === 0 && (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px 10px' }}>
                  <p style={{ margin: '0 0 8px 0', fontSize: '13px' }}>{isEn ? 'No player matching this position.' : 'Aucun joueur correspondant à ce poste.'}</p>
                  <button 
                    onClick={() => setShowAllPlayersInModal(true)}
                    style={{ fontSize: '12px', color: 'var(--primary)', background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer', fontWeight: 700 }}
                  >
                    {isEn ? 'View all available players' : 'Voir tous les joueurs disponibles'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @media (max-width: 992px) {
          .composition-sidebar {
            flex: 1 1 100% !important;
            max-width: 100% !important;
          }
          .composition-pitch {
            flex: 1 1 100% !important;
            min-width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
};

export default CompositionPage;