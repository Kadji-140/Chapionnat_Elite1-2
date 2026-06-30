// src/components/matchs/EventModal.tsx
import React, { useState, useEffect } from 'react';
import type { Match } from '../../api/matchs.api';
import type { MatchEvent, StoreEventParams } from '../../api/matchEvents.api';
import { X, Save, AlertCircle } from 'lucide-react';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (params: StoreEventParams) => void;
  match: Match;
  events?: MatchEvent[];
  editingEvent?: MatchEvent | null;
  currentMinute?: number;
  prepopulatedFields?: {
    type?: string;
    clubId?: number;
    joueurId?: number;
    joueurRemplacantId?: number;
  } | null;
}

export const EventModal: React.FC<EventModalProps> = ({
  isOpen, onClose, onSubmit, match, events = [], editingEvent = null, currentMinute = 0, prepopulatedFields = null,
}) => {
  const [type, setType] = useState<string>('but');
  const [minute, setMinute] = useState<number>(currentMinute);
  const [minuteAdditionnelle, setMinuteAdditionnelle] = useState<string>('');
  const [clubId, setClubId] = useState<number>(match.club_domicile.id);
  const [joueurId, setJoueurId] = useState<string>('');
  const [joueurRemplacantId, setJoueurRemplacantId] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [hasInitialized, setHasInitialized] = useState<boolean>(false);

  // 1. Filtrer les événements valides (hors l'événement en cours de modification pour éviter qu'il n'interfère)
  const evenementsValides = (events || []).filter(
    (e) => e.statut === 'valide' && (!editingEvent || e.id !== editingEvent.id)
  );

  // 2. Identifier les joueurs expulsés du match (carton rouge direct, carton jaune rouge ou cumul de 2 jaunes)
  const getJoueursExpulsesIds = (): number[] => {
    const expulses: number[] = [];
    const jaunesParJoueur: { [key: number]: number } = {};

    evenementsValides.forEach((e) => {
      if (!e.joueur_id) return;
      if (e.type === 'carton_rouge' || e.type === 'carton_jaune_rouge') {
        expulses.push(e.joueur_id);
      } else if (e.type === 'carton_jaune') {
        jaunesParJoueur[e.joueur_id] = (jaunesParJoueur[e.joueur_id] || 0) + 1;
        if (jaunesParJoueur[e.joueur_id] >= 2) {
          expulses.push(e.joueur_id);
        }
      }
    });
    return Array.from(new Set(expulses));
  };

  const expulsesIds = getJoueursExpulsesIds();

  // 3. Identifier les remplacements et statistiques de remplacement du club sélectionné
  const replacementsDuClub = evenementsValides.filter(
    (e) => e.type === 'remplacement' && e.club_id === clubId
  );
  
  const nbRemplacements = replacementsDuClub.length;

  const joueursSortisIds = replacementsDuClub
    .map((e) => e.joueur_id)
    .filter(Boolean) as number[];

  const joueursEntresIds = replacementsDuClub
    .map((e) => (e as any).joueur_remplacant_id)
    .filter(Boolean) as number[];

  // 4. Filtrer les listes de joueurs pour le clubId actif
  const compositionDuClub = match.compositions?.find((c: any) => c.club_id === clubId);
  const tousLesJoueurs = compositionDuClub
    ? [...(compositionDuClub.titulaires || []), ...(compositionDuClub.remplacants || [])]
    : [];

  // Exclure complètement les expulsés
  const joueursNonExpulses = tousLesJoueurs.filter(
    (jp: any) => jp.joueur && !expulsesIds.includes(jp.joueur.id)
  );

  // Joueurs actuellement sur le terrain (titulaires ou remplaçants entrés qui ne sont pas encore sortis)
  const joueursSurTerrain = joueursNonExpulses.filter((jp: any) => {
    if (!jp.joueur) return false;
    const estTitulaire = jp.role === 'titulaire';
    const estRemplacantEntre = joueursEntresIds.includes(jp.joueur.id);
    const estSorti = joueursSortisIds.includes(jp.joueur.id);
    return (estTitulaire || estRemplacantEntre) && !estSorti;
  });

  // Joueurs sur le banc (remplaçants qui ne sont pas encore entrés)
  const joueursSurBanc = joueursNonExpulses.filter((jp: any) => {
    if (!jp.joueur) return false;
    return jp.role === 'remplacant' && !joueursEntresIds.includes(jp.joueur.id);
  });

  const estRemplacementBloque = nbRemplacements >= 5 && (!editingEvent || editingEvent.type !== 'remplacement');
  const isTempsAdditionnelAllowed = (currentMinute >= 44 && currentMinute <= 50) || (currentMinute >= 89 && currentMinute <= 95) || (editingEvent?.type === 'temps_additionnel');

  // Sécurité automatique si le remplacement est bloqué pour le club sélectionné
  useEffect(() => {
    if (type === 'remplacement' && estRemplacementBloque) {
      setType('but');
      setError('Ce club a déjà effectué ses 5 remplacements réglementaires.');
    }
  }, [clubId, type, estRemplacementBloque]);

  useEffect(() => {
    if (!isOpen) {
      setHasInitialized(false);
      return;
    }

    if (hasInitialized) return;

    if (editingEvent) {
      setType(editingEvent.type);
      setMinute(editingEvent.minute);
      setMinuteAdditionnelle(editingEvent.minute_additionnelle ? String(editingEvent.minute_additionnelle) : '');
      setClubId(editingEvent.club_id || match.club_domicile.id);
      setJoueurId(editingEvent.joueur_id ? String(editingEvent.joueur_id) : '');
      setJoueurRemplacantId((editingEvent as any).joueur_remplacant_id ? String((editingEvent as any).joueur_remplacant_id) : '');
      setDescription(editingEvent.description || '');
    } else {
      setType(prepopulatedFields?.type || 'but');
      setMinute(currentMinute);
      setMinuteAdditionnelle('');
      setClubId(prepopulatedFields?.clubId || match.club_domicile.id);
      setJoueurId(prepopulatedFields?.joueurId ? String(prepopulatedFields.joueurId) : '');
      setJoueurRemplacantId(prepopulatedFields?.joueurRemplacantId ? String(prepopulatedFields.joueurRemplacantId) : '');
      setDescription('');
    }
    setError('');
    setHasInitialized(true);
  }, [editingEvent, prepopulatedFields, isOpen, currentMinute, match, hasInitialized]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (minute === undefined || minute < 0 || minute > 125) { setError('La minute doit être comprise entre 0 et 125.'); return; }
    if (type !== 'incident' && type !== 'temps_additionnel' && !clubId) { setError('Veuillez sélectionner un club.'); return; }
    
    if (type === 'temps_additionnel' && !isTempsAdditionnelAllowed) {
      setError("Le temps additionnel ne peut être saisi qu'entre la 44e et la 50e minute, ou entre la 89e et la 95e minute.");
      return;
    }

    // Si c'est un remplacement, valider les contraintes de limite
    if (type === 'remplacement' && estRemplacementBloque) {
      setError('Impossible : la limite de 5 remplacements est atteinte.');
      return;
    }

    if (['but', 'penalty_marque', 'penalty_rate', 'carton_jaune', 'carton_rouge', 'carton_jaune_rouge', 'but_csc', 'tir_cadre', 'tir_non_cadre', 'arret', 'faute', 'hors_jeu', 'corner'].includes(type) && !joueurId) {
      setError('Veuillez sélectionner le joueur concerné.');
      return;
    }

    if (type === 'remplacement') {
      if (!joueurId) { setError('Veuillez sélectionner le joueur sortant.'); return; }
      if (!joueurRemplacantId) { setError('Veuillez sélectionner le joueur entrant.'); return; }
      if (joueurId === joueurRemplacantId) { setError('Le joueur sortant et le joueur entrant ne peuvent pas être identiques.'); return; }
    }

    const params: StoreEventParams = {
      type, minute,
      minute_additionnelle: minuteAdditionnelle ? parseInt(minuteAdditionnelle, 10) : null,
      club_id: ['incident', 'temps_additionnel'].includes(type) ? null : clubId,
      joueur_id: joueurId ? parseInt(joueurId, 10) : null,
      joueur_remplacant_id: ['remplacement', 'but', 'penalty_marque'].includes(type) && joueurRemplacantId ? parseInt(joueurRemplacantId, 10) : null,
      description: description || null,
    };
    onSubmit(params);
    onClose();
  };


  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ background: 'white', borderRadius: '20px', boxShadow: '0 24px 80px rgba(0,0,0,0.2)', width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto' }} className="animate-scale-in">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', background: '#052e16', borderRadius: '20px 20px 0 0' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 900, color: 'white', letterSpacing: '-0.3px' }}>
            {editingEvent ? "Modifier l'événement" : 'Saisir un événement de match'}
          </h3>
          <button onClick={onClose} type="button" style={{ background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', color: '#86efac', borderRadius: '8px', padding: '5px', display: 'flex' }}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', color: '#991b1b', fontSize: '13px', fontWeight: 600 }}>
                <AlertCircle size={15} style={{ color: '#dc2626', flexShrink: 0 }} /><span>{error}</span>
              </div>
            )}

            {/* Type */}
            <div className="form-group">
              <label className="form-label">Type d'événement</label>
              <select value={type} onChange={(e) => { setType(e.target.value); setJoueurId(''); setJoueurRemplacantId(''); }} className="form-select">
                <option value="but">⚽ But standard</option>
                <option value="but_csc">⚽ But contre son camp (CSC)</option>
                <option value="penalty_marque">🎯 Penalty marqué</option>
                <option value="penalty_rate">❌ Penalty manqué</option>
                <option value="carton_jaune">🟨 Carton jaune</option>
                <option value="carton_rouge">🟥 Carton rouge</option>
                <option value="carton_jaune_rouge">🟨🟥 Deuxième jaune (Rouge)</option>
                <option value="remplacement" disabled={estRemplacementBloque}>
                  🔄 Remplacement {estRemplacementBloque ? ' (Limite de 5 atteinte)' : ''}
                </option>
                <option value="tir_cadre">🥅 Tir cadré</option>
                <option value="tir_non_cadre">🥅 Tir non cadré</option>
                <option value="arret">👐 Arrêt du gardien</option>
                <option value="faute">💥 Faute commise</option>
                <option value="hors_jeu">🚩 Hors-jeu</option>
                <option value="corner">📐 Corner</option>
                {isTempsAdditionnelAllowed && (
                  <option value="temps_additionnel">⏱️ Temps additionnel</option>
                )}
                <option value="incident">⚠️ Incident / Info</option>
              </select>
            </div>

            {/* Club & Player */}
            {!['incident', 'temps_additionnel'].includes(type) && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Club concerné</label>
                  <select value={clubId} onChange={(e) => { setClubId(parseInt(e.target.value, 10)); setJoueurId(''); setJoueurRemplacantId(''); }} className="form-select">
                    <option value={match.club_domicile.id}>{match.club_domicile.nom} (Dom)</option>
                    <option value={match.club_exterieur.id}>{match.club_exterieur.nom} (Ext)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">{type === 'remplacement' ? 'Joueur sortant' : 'Joueur impliqué'}</label>
                  <select value={joueurId} onChange={(e) => setJoueurId(e.target.value)} className="form-select">
                    <option value="">-- Sélectionner --</option>
                    {(type === 'remplacement' || ['but', 'penalty_marque', 'penalty_rate', 'carton_jaune', 'carton_rouge', 'carton_jaune_rouge', 'but_csc', 'tir_cadre', 'tir_non_cadre', 'arret', 'faute', 'hors_jeu', 'corner'].includes(type)
                      ? joueursSurTerrain
                      : joueursNonExpulses
                    ).map((jp: any) => {
                      const player = jp.joueur;
                      if (!player) return null;
                      return <option key={player.id} value={player.id}>#{player.num_maillot || player.numero_maillot || '-'} - {player.prenom} {player.nom}</option>;
                    })}
                  </select>
                </div>
              </div>
            )}

            {/* Replacement In */}
            {type === 'remplacement' && (
              <div className="form-group">
                <label className="form-label">Joueur entrant</label>
                <select value={joueurRemplacantId} onChange={(e) => setJoueurRemplacantId(e.target.value)} className="form-select">
                  <option value="">-- Sélectionner le remplaçant --</option>
                  {joueursSurBanc.map((jp: any) => {
                    const player = jp.joueur;
                    if (!player) return null;
                    return <option key={player.id} value={player.id}>#{player.num_maillot || player.numero_maillot || '-'} - {player.prenom} {player.nom}</option>;
                  })}
                </select>
              </div>
            )}

            {/* Assist Provider (Passeur décisif) for goal events */}
            {['but', 'penalty_marque'].includes(type) && (
              <div className="form-group">
                <label className="form-label">Passeur décisif (Optionnel)</label>
                <select value={joueurRemplacantId} onChange={(e) => setJoueurRemplacantId(e.target.value)} className="form-select">
                  <option value="">-- Sans passeur --</option>
                  {joueursSurTerrain.filter(jp => jp.joueur?.id !== parseInt(joueurId, 10)).map((jp: any) => {
                    const player = jp.joueur;
                    if (!player) return null;
                    return <option key={player.id} value={player.id}>#{player.num_maillot || player.numero_maillot || '-'} - {player.prenom} {player.nom}</option>;
                  })}
                </select>
              </div>
            )}


            {/* Time */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Minute</label>
                <input type="number" min="0" max="125" value={minute} onChange={(e) => setMinute(parseInt(e.target.value, 10))} className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">Temps additionnel</label>
                <input type="number" min="1" max="15" placeholder="Ex: 3" value={minuteAdditionnelle} onChange={(e) => setMinuteAdditionnelle(e.target.value)} className="form-input" />
              </div>
            </div>

            {/* Description */}
            <div className="form-group">
              <label className="form-label">Description (Optionnel)</label>
              <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex: Frappe puissante du pied gauche dans la lucarne." className="form-textarea" />
            </div>
          </div>

          {/* Footer */}
          <div style={{ padding: '14px 24px', borderTop: '1px solid #f0f4f8', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" onClick={onClose} className="btn btn-ghost">Annuler</button>
            <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Save size={16} /><span>{editingEvent ? 'Mettre à jour' : 'Enregistrer'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventModal;
