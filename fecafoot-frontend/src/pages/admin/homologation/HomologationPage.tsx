import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAdminMatchsAHomologuer,
  homologuerMatch,
  litigeMatch,
  tapisVertMatch,
  appliquerPenalite,
  getClubPenalites
} from '../../../api/contestations.api';
import type { Penalite } from '../../../api/contestations.api';
import { getAdminClubs } from '../../../api/clubs.api';
import type { Club } from '../../../api/clubs.api';
import { getSaisons } from '../../../api/saisons.api';
import type { Saison } from '../../../api/saisons.api';
import type { Match } from '../../../api/matchs.api';
import { Modal } from '../../../components/ui/Modal';
import {
  Award,
  Scale,
  ShieldAlert,
  CheckCircle,
  AlertCircle,
  PlusCircle,
  Loader2,
  FileText,
  MinusCircle
} from 'lucide-react';

export const HomologationPage: React.FC = () => {
  const queryClient = useQueryClient();

  // Queries
  const { data: matchsData, isLoading: loadingMatchs } = useQuery({
    queryKey: ['admin-matchs-a-homologuer'],
    queryFn: getAdminMatchsAHomologuer,
  });

  const { data: clubsData } = useQuery({
    queryKey: ['admin-clubs-all'],
    queryFn: () => getAdminClubs({ per_page: 100 }),
  });

  const { data: saisonsData } = useQuery({
    queryKey: ['saisons-all'],
    queryFn: () => getSaisons({ per_page: 50 }),
  });

  // Tapis Vert inline state
  const [tapisVertMatchId, setTapisVertMatchId] = useState<number | null>(null);
  const [tapisVertWinnerId, setTapisVertWinnerId] = useState<string>('');
  const [tapisVertMotif, setTapisVertMotif] = useState<string>('');
  const [viewingReportMatch, setViewingReportMatch] = useState<Match | null>(null);
  const [homologatingMatch, setHomologatingMatch] = useState<Match | null>(null);

  // Penalty Panel state
  const [selectedClubId, setSelectedClubId] = useState<string>('');
  const [selectedSaisonId, setSelectedSaisonId] = useState<string>('');
  const [pointsRetires, setPointsRetires] = useState<number>(3);
  const [penaltyType, setPenaltyType] = useState<string>('retrait_points');
  const [penaltyMotif, setPenaltyMotif] = useState<string>('');

  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const { data: clubPenalitesData, isLoading: loadingPenalites } = useQuery({
    queryKey: ['club-penalites', selectedClubId],
    queryFn: () => getClubPenalites(parseInt(selectedClubId, 10)),
    enabled: !!selectedClubId,
  });

  const matchs: Match[] = matchsData?.data ?? [];
  const clubs: Club[] = clubsData?.data ?? [];
  const saisons: Saison[] = saisonsData?.data ?? [];
  const clubPenalites: Penalite[] = clubPenalitesData ?? [];

  // Auto-select active season when seasons are loaded
  useEffect(() => {
    if (saisonsData?.success && saisonsData.data) {
      const activeSaison = saisonsData.data.find((s: any) => s.statut === 'en_cours');
      if (activeSaison && !selectedSaisonId) {
        setSelectedSaisonId(String(activeSaison.id));
      }
    }
  }, [saisonsData, selectedSaisonId]);

  // Mutations
  const homologuerMutation = useMutation({
    mutationFn: (matchId: number) => homologuerMatch(matchId),
    onSuccess: (res) => {
      if (res.success) {
        setSuccess('Match homologué avec succès ! Le classement a été mis à jour.');
        queryClient.invalidateQueries({ queryKey: ['admin-matchs-a-homologuer'] });
      }
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Erreur lors de l\'homologation.');
    }
  });

  const litigeMutation = useMutation({
    mutationFn: (matchId: number) => litigeMatch(matchId),
    onSuccess: (res) => {
      if (res.success) {
        setSuccess('Le match a été marqué en litige. Le dossier est en attente d\'arbitrage.');
        queryClient.invalidateQueries({ queryKey: ['admin-matchs-a-homologuer'] });
      }
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Erreur lors du passage en litige.');
    }
  });

  const tapisVertMutation = useMutation({
    mutationFn: ({ matchId, winnerId, motif }: { matchId: number, winnerId: number, motif: string }) =>
      tapisVertMatch(matchId, { club_vainqueur_id: winnerId, motif }),
    onSuccess: (res) => {
      if (res.success) {
        setSuccess('Tapis vert appliqué avec succès (Score officiel forcé à 3-0). Le classement de la poule a été recalculé.');
        setTapisVertMatchId(null);
        setTapisVertWinnerId('');
        setTapisVertMotif('');
        queryClient.invalidateQueries({ queryKey: ['admin-matchs-a-homologuer'] });
      }
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Erreur lors de l\'application du tapis vert.');
    }
  });

  const appliquerPenaliteMutation = useMutation({
    mutationFn: ({ clubId, params }: { clubId: number, params: { saison_id: number; points_retires: number; type: string; motif: string } }) =>
      appliquerPenalite(clubId, params),
    onSuccess: (res) => {
      if (res.success) {
        setSuccess(res.message || 'Pénalité appliquée avec succès ! Les classements ont été mis à jour.');
        setPenaltyMotif('');
        queryClient.invalidateQueries({ queryKey: ['club-penalites', selectedClubId] });
      }
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Erreur lors de l\'application de la pénalité.');
    }
  });

  const submittingTapisVert = tapisVertMutation.isPending;
  const submittingPenalty = appliquerPenaliteMutation.isPending;

  const handleHomologuer = (match: Match) => {
    setHomologatingMatch(match);
  };

  const handleLitige = async (matchId: number) => {
    setError('');
    setSuccess('');
    litigeMutation.mutate(matchId);
  };

  const handleTapisVertSubmit = async (e: React.FormEvent, matchId: number) => {
    e.preventDefault();
    if (!tapisVertWinnerId || !tapisVertMotif.trim()) {
      setError('Veuillez spécifier le vainqueur et le motif réglementaire.');
      return;
    }
    setError('');
    setSuccess('');
    tapisVertMutation.mutate({
      matchId,
      winnerId: parseInt(tapisVertWinnerId, 10),
      motif: tapisVertMotif
    });
  };

  const handleApplyPenalty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClubId || !selectedSaisonId || !penaltyMotif.trim()) {
      setError('Veuillez remplir tous les champs obligatoires.');
      return;
    }
    setError('');
    setSuccess('');
    appliquerPenaliteMutation.mutate({
      clubId: parseInt(selectedClubId, 10),
      params: {
        saison_id: parseInt(selectedSaisonId, 10),
        points_retires: pointsRetires,
        type: penaltyType,
        motif: penaltyMotif,
      }
    });
  };

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Award size={24} style={{ color: '#1B4332' }} />
            Homologation & Sanctions
          </h1>
          <p className="page-subtitle">Homologuez les résultats officiels des rencontres, traitez les forfaits (tapis vert) et gérez les pénalités de points.</p>
        </div>
      </div>

      {error && (
        <div style={{ padding: '16px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '12px', color: '#991B1B', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
          <AlertCircle size={18} />
          <span style={{ fontSize: '13px', fontWeight: 600 }}>{error}</span>
        </div>
      )}

      {success && (
        <div style={{ padding: '16px', background: '#D8F3DC', border: '1px solid #C2E0C6', borderRadius: '12px', color: '#1B4332', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
          <CheckCircle size={18} />
          <span style={{ fontSize: '13px', fontWeight: 600 }}>{success}</span>
        </div>
      )}

      {/* Grid: Matches to Homologate & Points Penalties Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Column 1 & 2: Matches to Homologate */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#1B4332', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={18} style={{ color: '#2D6A4F' }} />
            <span>Matchs en attente d'homologation ({matchs.length})</span>
          </h2>

          {loadingMatchs ? (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '48px', gap: '12px' }}>
              <Loader2 className="animate-spin" size={32} style={{ color: '#2D6A4F' }} />
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#64748B' }}>Chargement des rencontres terminées...</span>
            </div>
          ) : matchs.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
              <CheckCircle size={48} style={{ color: '#2D6A4F', opacity: 0.4, margin: '0 auto 12px' }} />
              <h3 style={{ margin: '0 0 8px', color: '#1e293b', fontWeight: 700 }}>Tout est à jour !</h3>
              <p style={{ color: '#64748b', fontSize: '14px' }}>Aucune rencontre n'est en attente d'homologation pour le moment.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {matchs.map((match, idx) => {
                const isLitige = match.statut === 'litige';
                const isTapisVertOpen = tapisVertMatchId === match.id;

                return (
                  <div 
                    key={match.id} 
                    className="card stagger-item"
                    style={{
                      animationDelay: `${idx * 60}ms`,
                      padding: '24px',
                      borderLeft: `4px solid ${isLitige ? '#C8102E' : '#1B4332'}`,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '16px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                      <div>
                        <span style={{ fontSize: '10px', fontFamily: 'monospace', fontWeight: 700, color: '#94A3B8' }}>
                          MATCH ID: {match.id} • Journée {match.journee}
                        </span>
                        <h3 style={{ fontWeight: 800, fontSize: '16px', color: '#1e293b', marginTop: '2px', margin: 0 }}>
                          {match.club_domicile.nom} vs {match.club_exterieur.nom}
                        </h3>
                        <span style={{ fontSize: '12px', color: '#64748B', display: 'block', marginTop: '2px' }}>
                          📍 {match.stade} • 📅 {match.date_heure_fr}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <span 
                          onClick={() => match.rapport_soumis && setViewingReportMatch(match)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '20px',
                            fontSize: '11px',
                            fontWeight: 700,
                            background: match.rapport_soumis ? '#E8F5E9' : '#FFEBEE',
                            color: match.rapport_soumis ? '#2E7D32' : '#C62828',
                            border: `1px solid ${match.rapport_soumis ? '#C8E6C9' : '#FFCDD2'}`,
                            cursor: match.rapport_soumis ? 'pointer' : 'default'
                          }}
                          title={match.rapport_soumis ? "Cliquez pour consulter le rapport" : "En attente du rapport"}
                        >
                          {match.rapport_soumis ? '📄 Rapport soumis' : '⏳ Rapport requis'}
                        </span>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '20px',
                          fontSize: '11px',
                          fontWeight: 700,
                          background: isLitige ? '#FEE2E2' : '#f1f5f9',
                          color: isLitige ? '#991B1B' : '#64748B',
                          border: `1px solid ${isLitige ? '#FECACA' : '#e2e8f0'}`
                        }}>
                          {isLitige ? 'En Litige' : 'Terminé'}
                        </span>
                      </div>
                    </div>

                    {/* Scores preview */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '32px',
                      background: '#F8FAFC',
                      padding: '16px',
                      borderRadius: '12px',
                      border: '1px solid var(--border)'
                    }}>
                      <div style={{ textAlign: 'center', minWidth: '80px' }}>
                        <span style={{ fontSize: '28px', fontWeight: 800, color: '#1e293b' }}>{match.score_domicile}</span>
                        <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>{match.club_domicile.nom}</div>
                      </div>
                      <span style={{ fontSize: '10px', fontFamily: 'monospace', fontWeight: 700, color: '#94A3B8' }}>SCORE TERRAIN</span>
                      <div style={{ textAlign: 'center', minWidth: '80px' }}>
                        <span style={{ fontSize: '28px', fontWeight: 800, color: '#1e293b' }}>{match.score_exterieur}</span>
                        <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>{match.club_exterieur.nom}</div>
                      </div>
                    </div>

                    {/* Actions Panel */}
                    {!isTapisVertOpen ? (
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <button
                          onClick={() => setTapisVertMatchId(match.id)}
                          className="btn btn-accent btn-sm"
                        >
                          <ShieldAlert size={14} />
                          <span>Tapis Vert</span>
                        </button>

                        {!isLitige && (
                          <button
                            onClick={() => handleLitige(match.id)}
                            className="btn btn-danger btn-sm"
                          >
                            <Scale size={14} />
                            <span>Mettre en Litige</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleHomologuer(match)}
                          disabled={!match.rapport_soumis}
                          className="btn btn-primary btn-sm"
                          style={{
                            opacity: match.rapport_soumis ? 1 : 0.55,
                            cursor: match.rapport_soumis ? 'pointer' : 'not-allowed'
                          }}
                          title={match.rapport_soumis ? "Homologuer le match" : "Le rapport du commissaire doit être soumis pour homologuer"}
                        >
                          <CheckCircle size={14} />
                          <span>Homologuer</span>
                        </button>
                      </div>
                    ) : (
                      /* Tapis Vert inline form */
                      <form onSubmit={(e) => handleTapisVertSubmit(e, match.id)} className="card" style={{ padding: '16px', background: 'var(--accent-50)', borderColor: 'rgba(255, 184, 0, 0.2)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        <h4 style={{ margin: 0, fontWeight: 700, fontSize: '13px', color: '#1B4332', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <ShieldAlert size={14} style={{ color: 'var(--accent-dark)' }} />
                          <span>Paramètres du Tapis Vert</span>
                        </h4>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                          <div className="form-group">
                            <label className="form-label" style={{ fontSize: '11px' }}>Vainqueur par décision</label>
                            <select
                              value={tapisVertWinnerId}
                              onChange={(e) => setTapisVertWinnerId(e.target.value)}
                              className="form-select"
                              style={{ padding: '8px' }}
                            >
                              <option value="">-- Sélectionner --</option>
                              <option value={match.club_domicile.id}>{match.club_domicile.nom} (Dom)</option>
                              <option value={match.club_exterieur.id}>{match.club_exterieur.nom} (Ext)</option>
                            </select>
                          </div>
                          <div className="form-group">
                            <label className="form-label" style={{ fontSize: '11px' }}>Motif réglementaire</label>
                            <input
                              type="text"
                              placeholder="Ex: Joueur non qualifié..."
                              value={tapisVertMotif}
                              onChange={(e) => setTapisVertMotif(e.target.value)}
                              className="form-input"
                              style={{ padding: '8px' }}
                            />
                          </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={() => setTapisVertMatchId(null)}
                            className="btn btn-ghost btn-sm"
                          >
                            Annuler
                          </button>
                          <button
                            type="submit"
                            disabled={submittingTapisVert}
                            className="btn btn-accent btn-sm"
                          >
                            {submittingTapisVert ? 'Application...' : 'Confirmer'}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Column 3: Points Penalties Form & History */}
        <div className="card" style={{ padding: '24px', height: 'fit-content', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#1B4332', display: 'flex', alignItems: 'center', gap: '6px', borderBottom: '1px solid var(--border)', paddingBottom: '12px', margin: 0 }}>
            <MinusCircle size={18} style={{ color: '#C8102E' }} />
            <span>Pénalités de points</span>
          </h2>

          <form onSubmit={handleApplyPenalty} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Club */}
            <div className="form-group">
              <label className="form-label">
                Club à pénaliser
              </label>
              <select
                value={selectedClubId}
                onChange={(e) => setSelectedClubId(e.target.value)}
                className="form-select"
              >
                <option value="">-- Sélectionner le club --</option>
                {clubs.map((c: Club) => (
                  <option key={c.id} value={c.id}>{c.nom} ({c.ville})</option>
                ))}
              </select>
            </div>

            {/* Saison */}
            <div className="form-group">
              <label className="form-label">
                Saison
              </label>
              <select
                value={selectedSaisonId}
                onChange={(e) => setSelectedSaisonId(e.target.value)}
                className="form-select"
              >
                <option value="">-- Sélectionner la saison --</option>
                {saisons.map((s: Saison) => (
                  <option key={s.id} value={s.id}>{s.intitule} {s.statut === 'en_cours' ? '(Active)' : ''}</option>
                ))}
              </select>
            </div>

            {/* Points deduction & Type */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">
                  Retrait (Points)
                </label>
                <input
                  type="number"
                  min="1"
                  max="15"
                  value={pointsRetires}
                  onChange={(e) => setPointsRetires(parseInt(e.target.value, 10))}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">
                  Type sanction
                </label>
                <select
                  value={penaltyType}
                  onChange={(e) => setPenaltyType(e.target.value)}
                  className="form-select"
                >
                  <option value="retrait_points">Retrait de points</option>
                  <option value="sanction_administrative">Administrative</option>
                  <option value="incidents_tribunes">Incidents tribunes</option>
                </select>
              </div>
            </div>

            {/* Motif */}
            <div className="form-group">
              <label className="form-label">
                Motif détaillé de la sanction
              </label>
              <textarea
                rows={3}
                value={penaltyMotif}
                onChange={(e) => setPenaltyMotif(e.target.value)}
                placeholder="Ex: Fraude documentaire sur licence..."
                className="form-textarea"
              />
            </div>

            <button
              type="submit"
              disabled={submittingPenalty || !selectedClubId || !selectedSaisonId || !penaltyMotif.trim()}
              className="btn btn-danger"
              style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }}
            >
              {submittingPenalty ? (
                <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%' }} />
              ) : <PlusCircle size={15} />}
              <span>Appliquer Retrait Points</span>
            </button>
          </form>

          {/* Club Penalties listing */}
          {selectedClubId && (
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
              <h4 style={{ fontWeight: 800, fontSize: '12px', color: '#1B4332', textTransform: 'uppercase', marginBottom: '12px', margin: 0 }}>
                Pénalités actives ({clubPenalites.length})
              </h4>
              {loadingPenalites ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-muted)' }}>
                  <Loader2 className="animate-spin" size={14} style={{ color: '#2D6A4F' }} />
                  <span>Chargement historique...</span>
                </div>
              ) : clubPenalites.length === 0 ? (
                <p style={{ fontSize: '12px', color: 'var(--text-light)', fontStyle: 'italic', margin: 0 }}>Aucune sanction active pour ce club.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                  {clubPenalites.map(p => (
                    <div key={p.id} className="card" style={{ padding: '12px', background: 'rgba(200,16,46,0.03)', borderColor: 'rgba(200,16,46,0.12)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 700, fontSize: '12px', color: '#C8102E' }}>-{p.points_retires} Pts ({p.type})</span>
                        <span style={{ fontSize: '10px', color: '#94A3B8' }}>{new Date(p.date_application).toLocaleDateString('fr-FR')}</span>
                      </div>
                      <p style={{ fontSize: '11px', color: '#64748B', fontStyle: 'italic', margin: 0 }}>"{p.motif}"</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

      </div>
      {/* Modal Consultation Rapport */}
      <Modal
        isOpen={!!viewingReportMatch}
        onClose={() => setViewingReportMatch(null)}
        title={`Rapport de Rencontre - Match #${viewingReportMatch?.id}`}
        size="md"
      >
        {viewingReportMatch && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <div>
                <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Match</span>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)', marginTop: '2px' }}>
                  {viewingReportMatch.club_domicile.nom} vs {viewingReportMatch.club_exterieur.nom}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Score final</span>
                <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--primary)', marginTop: '2px' }}>
                  {viewingReportMatch.score_domicile} - {viewingReportMatch.score_exterieur}
                </div>
              </div>
              <div style={{ gridColumn: 'span 2', borderTop: '1px solid #e2e8f0', paddingTop: '10px', marginTop: '4px' }}>
                <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Détails</span>
                <div style={{ fontSize: '13px', color: '#334155', marginTop: '2px' }}>
                  📍 {viewingReportMatch.stade} • 📅 {viewingReportMatch.date_heure_fr}
                </div>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Faits de jeu & incidents signalés par le commissaire :
              </label>
              <div style={{
                maxHeight: '200px',
                overflowY: 'auto',
                padding: '14px',
                background: '#f8fafc',
                borderRadius: '10px',
                border: '1px solid var(--border)',
                fontSize: '13.5px',
                lineHeight: '1.6',
                color: '#475569',
                whiteSpace: 'pre-wrap'
              }}>
                {viewingReportMatch.incidents_rapport || 'Néant (aucun incident signalé).'}
              </div>
            </div>

            {viewingReportMatch.chemin_pdf && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 18px',
                background: 'rgba(45, 106, 79, 0.06)',
                border: '1px solid rgba(45, 106, 79, 0.15)',
                borderRadius: '12px',
                marginTop: '4px'
              }}>
                <div>
                  <strong style={{ display: 'block', fontSize: '13px', color: 'var(--primary)' }}>Feuille de match officielle</strong>
                  <span style={{ fontSize: '11px', color: '#52b788' }}>Signée électroniquement</span>
                </div>
                <a
                  href={(() => {
                    const path = viewingReportMatch.chemin_pdf!;
                    const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
                    const baseUrl = apiUrl.endsWith('/api') ? apiUrl.slice(0, -4) : apiUrl;
                    return `${baseUrl}/${path.startsWith('storage/') ? path : 'storage/' + path}`;
                  })()}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-primary btn-sm"
                  style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <FileText size={14} />
                  Télécharger
                </a>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid var(--border)', paddingTop: '14px', marginTop: '6px' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setViewingReportMatch(null)}>
                Fermer
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => {
                  setViewingReportMatch(null);
                  handleHomologuer(viewingReportMatch);
                }}
                disabled={viewingReportMatch.statut === 'homologue'}
              >
                Homologuer
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Confirmation Homologation */}
      <Modal
        isOpen={!!homologatingMatch}
        onClose={() => setHomologatingMatch(null)}
        title="Validation officielle d'homologation"
        size="md"
      >
        {homologatingMatch && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{
              padding: '16px',
              background: 'rgba(27,67,50,0.04)',
              border: '1px solid rgba(27,67,50,0.1)',
              borderRadius: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <h4 style={{ margin: 0, color: '#1B4332', fontWeight: 800 }}>Détails de la rencontre :</h4>
              <div style={{ fontSize: '14px', color: '#1e293b' }}>
                <strong>{homologatingMatch.club_domicile.nom}</strong> vs <strong>{homologatingMatch.club_exterieur.nom}</strong>
              </div>
              <div style={{ fontSize: '13px', color: '#64748B' }}>
                Score terrain final : <strong style={{ color: '#1B4332' }}>{homologatingMatch.score_domicile} - {homologatingMatch.score_exterieur}</strong>
              </div>
              <div style={{ fontSize: '12px', color: '#64748B' }}>
                Stade : {homologatingMatch.stade} • {homologatingMatch.date_heure_fr}
              </div>
            </div>

            <div style={{
              padding: '14px',
              background: '#FFFBEB',
              border: '1px solid #FDE68A',
              borderRadius: '10px',
              display: 'flex',
              gap: '10px',
              color: '#B45309'
            }}>
              <AlertCircle size={20} style={{ flexShrink: 0 }} />
              <div style={{ fontSize: '13px', lineHeight: '1.5' }}>
                <strong>Action irréversible :</strong> L'homologation validera définitivement le score terrain et mettra à jour les points au classement pour chaque club, ainsi que les statistiques de tous les joueurs (buts, passes, discipline).
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid var(--border)', paddingTop: '14px' }}>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setHomologatingMatch(null)}
              >
                Annuler
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => {
                  setError('');
                  setSuccess('');
                  homologuerMutation.mutate(homologatingMatch.id);
                  setHomologatingMatch(null);
                }}
              >
                <CheckCircle size={14} />
                <span>Confirmer l'Homologation</span>
              </button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
};
export default HomologationPage;
