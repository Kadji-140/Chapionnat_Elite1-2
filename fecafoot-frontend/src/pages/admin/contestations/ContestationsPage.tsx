// src/pages/admin/contestations/ContestationsPage.tsx
import React, { useState, useEffect } from 'react';
import {
  getAdminContestations,
  accepterContestation,
  rejeterContestation,
  getAdminMatchsAHomologuer,
  leverLitigeMatch
} from '../../../api/contestations.api';
import type { Contestation } from '../../../api/contestations.api';
import type { Match } from '../../../api/matchs.api';
import { Modal } from '../../../components/ui/Modal';
import {
  Scale,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  MessageSquare,
  ShieldAlert,
  FileText
} from 'lucide-react';

export const ContestationsPage: React.FC = () => {
  const [contestations, setContestations] = useState<Contestation[]>([]);
  const [matchsInLitige, setMatchsInLitige] = useState<Match[]>([]);
  const [activeTab, setActiveTab] = useState<'contestations' | 'litiges'>('contestations');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Processing state
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [decisionText, setDecisionText] = useState<string>('');
  const [leveringId, setLeveringId] = useState<number | null>(null);
  const [viewingReportMatch, setViewingReportMatch] = useState<Match | null>(null);
  const [leveringMatch, setLeveringMatch] = useState<Match | null>(null);

  const loadData = () => {
    setLoading(true);
    setError('');
    Promise.all([
      getAdminContestations(),
      getAdminMatchsAHomologuer()
    ])
      .then(([contestationsRes, matchsRes]) => {
        if (contestationsRes.success) {
          setContestations(contestationsRes.data);
        } else {
          setError('Erreur lors du chargement des contestations.');
        }

        if (matchsRes && (matchsRes.success || matchsRes.data)) {
          const filtered = (matchsRes.data || []).filter((m: Match) => m.statut === 'litige');
          setMatchsInLitige(filtered);
        } else {
          setError('Erreur lors du chargement des matchs en litige.');
        }
      })
      .catch((err) => {
        console.error(err);
        setError('Impossible d\'accéder à l\'API des litiges et contestations.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleArbitrage = async (id: number, type: 'accepter' | 'rejeter') => {
    if (!decisionText.trim()) {
      setError('Veuillez justifier votre décision par un commentaire écrit.');
      return;
    }

    setProcessingId(id);
    setError('');
    setSuccess('');

    try {
      let res;
      if (type === 'accepter') {
        res = await accepterContestation(id, decisionText);
      } else {
        res = await rejeterContestation(id, decisionText);
      }

      if (res.success) {
        setSuccess(`La contestation a été ${type === 'accepter' ? 'acceptée' : 'rejetée'} avec succès.`);
        setDecisionText('');
        loadData();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du traitement.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleLeverLitige = (matchId: number) => {
    setLeveringId(matchId);
    setError('');
    setSuccess('');
    leverLitigeMatch(matchId)
      .then((res) => {
        if (res.success) {
          setSuccess('Litige levé avec succès. Le match est de nouveau en attente d\'homologation.');
          loadData();
        }
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Erreur lors de la levée du litige.');
      })
      .finally(() => setLeveringId(null));
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '80px', gap: '12px' }}>
        <Loader2 className="animate-spin" size={32} style={{ color: '#1B4332' }} />
        <span style={{ fontSize: '14px', fontWeight: 600, color: '#64748B' }}>Chargement des litiges...</span>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Scale size={24} style={{ color: '#1B4332' }} />
            Litiges & Plaintes
          </h1>
          <p className="page-subtitle">Arbitrez les litiges déclarés par les clubs et gérez les rencontres sous procédure fédérale.</p>
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

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
        <button
          onClick={() => setActiveTab('contestations')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'contestations' ? '3px solid #1B4332' : '3px solid transparent',
            color: activeTab === 'contestations' ? '#1B4332' : '#64748B',
            padding: '8px 16px',
            fontWeight: 750,
            cursor: 'pointer',
            fontSize: '14px',
            transition: 'all 0.2s'
          }}
        >
          Plaintes & Contestations ({contestations.length})
        </button>
        <button
          onClick={() => setActiveTab('litiges')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'litiges' ? '3px solid #1B4332' : '3px solid transparent',
            color: activeTab === 'litiges' ? '#1B4332' : '#64748B',
            padding: '8px 16px',
            fontWeight: 750,
            cursor: 'pointer',
            fontSize: '14px',
            transition: 'all 0.2s'
          }}
        >
          Matchs en Litige ({matchsInLitige.length})
        </button>
      </div>

      {activeTab === 'contestations' ? (
        contestations.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
            <Scale size={48} style={{ color: '#2D6A4F', opacity: 0.4, margin: '0 auto 12px' }} />
            <h3 style={{ margin: '0 0 8px', color: '#1e293b', fontWeight: 700 }}>Aucune contestation en attente</h3>
            <p style={{ color: '#64748b', fontSize: '14px' }}>Aucune plainte n'a été déposée par les coachs de clubs.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {contestations.map((cont, idx) => {
              const isPending = cont.statut === 'soumise';
              const match = cont.match_event?.match;
              const clubAuteur = cont.coach?.club?.nom || 'Club inconnu';

              return (
                <div 
                  key={cont.id} 
                  className="card stagger-item"
                  style={{
                    animationDelay: `${idx * 60}ms`,
                    padding: '24px',
                    borderLeft: `4px solid ${
                      cont.statut === 'soumise' ? '#FFB800' :
                      cont.statut === 'acceptee' ? '#1B4332' : '#C8102E'
                    }`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px'
                  }}
                >
                  {/* Header info */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                    <div>
                      <span style={{ fontSize: '10px', fontFamily: 'monospace', fontWeight: 700, color: '#94A3B8' }}>
                        CONTESTATION #{cont.id} • DÉPOSÉ LE {new Date(cont.date_contestation).toLocaleString('fr-FR')}
                      </span>
                      <h3 style={{ fontWeight: 800, fontSize: '16px', color: '#1e293b', marginTop: '2px', margin: 0 }}>
                        {match ? `${match.club_domicile?.nom || ''} vs ${match.club_exterieur?.nom || ''}` : 'Match Inconnu'}
                      </h3>
                      <span style={{ fontSize: '12px', color: '#64748B', display: 'block', marginTop: '2px' }}>
                        Auteur : Coach de <strong style={{ color: '#1B4332' }}>{clubAuteur}</strong> ({cont.coach?.prenom} {cont.coach?.nom})
                      </span>
                    </div>

                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '20px',
                      fontSize: '11px',
                      fontWeight: 700,
                      background: cont.statut === 'soumise' ? '#FFFBEB' : cont.statut === 'acceptee' ? '#D8F3DC' : '#FEE2E2',
                      color: cont.statut === 'soumise' ? '#B45309' : cont.statut === 'acceptee' ? '#15803d' : '#991B1B',
                      border: `1px solid ${cont.statut === 'soumise' ? '#FDE68A' : cont.statut === 'acceptee' ? '#C2E0C6' : '#FECACA'}`
                    }}>
                      {cont.statut === 'soumise' ? 'En Attente' : cont.statut === 'acceptee' ? 'Acceptée' : 'Rejetée'}
                    </span>
                  </div>

                  {/* Details grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    {/* Left Column: Complaint */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div>
                        <span style={{ fontWeight: 700, color: '#1B4332', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Événement Contesté :</span>
                        <div style={{ background: '#F8FAFC', border: '1px solid var(--border)', padding: '12px 16px', borderRadius: '8px' }}>
                          <div style={{ fontWeight: 700, fontSize: '13px', color: '#1e293b' }}>
                            Minute {cont.match_event?.minute}' • {cont.match_event?.type?.toUpperCase() || ''}
                          </div>
                          <p style={{ fontSize: '12px', color: '#64748B', margin: '4px 0 0' }}>
                            {cont.match_event?.description || 'Aucun détail textuel fourni par le commissaire.'}
                          </p>
                        </div>
                      </div>

                      <div>
                        <span style={{ fontWeight: 700, color: '#1B4332', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Motif formulé par le Coach :</span>
                        <div style={{ background: 'rgba(27,67,50,0.03)', border: '1px solid rgba(27,67,50,0.1)', padding: '12px 16px', borderRadius: '8px' }}>
                          <p style={{ fontSize: '13px', color: '#1e293b', fontStyle: 'italic', margin: 0 }}>
                            "{cont.motif}"
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Admin resolution panel */}
                    <div className="card" style={{ padding: '20px', background: '#F8FAFC', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {isPending ? (
                        <>
                          <h4 style={{ fontWeight: 700, fontSize: '12px', color: '#1B4332', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                            <MessageSquare size={14} style={{ color: '#2D6A4F' }} />
                            <span>Décision réglementaire FECAFOOT</span>
                          </h4>

                          <div className="form-group">
                            <textarea
                              rows={3}
                              value={decisionText}
                              onChange={(e) => setDecisionText(e.target.value)}
                              placeholder="Justifiez la décision fédérale (e.g. 'Après visionnage des images vidéo, l'erreur d'identification du buteur est confirmée. Le but est réaffecté' ou 'Les preuves sont insuffisantes, décision terrain maintenue')."
                              className="form-textarea"
                              style={{ fontSize: '13px', padding: '10px' }}
                            />
                          </div>

                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
                            <button
                              type="button"
                              disabled={processingId !== null}
                              onClick={() => handleArbitrage(cont.id, 'rejeter')}
                              className="btn btn-danger btn-sm"
                            >
                              <XCircle size={14} />
                              <span>Rejeter Plainte</span>
                            </button>

                            <button
                              type="button"
                              disabled={processingId !== null}
                              onClick={() => handleArbitrage(cont.id, 'accepter')}
                              className="btn btn-primary btn-sm"
                            >
                              <CheckCircle size={14} />
                              <span>Accepter & Corriger</span>
                            </button>
                          </div>
                        </>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#1B4332', fontSize: '13px' }}>
                            <ShieldAlert size={15} style={{ color: '#2D6A4F' }} />
                            <span>Arbitrage rendu :</span>
                          </div>
                          <p style={{ fontSize: '13px', color: '#1e293b', background: 'rgba(27,67,50,0.03)', border: '1px solid rgba(27,67,50,0.1)', padding: '12px 16px', borderRadius: '8px', margin: 0 }}>
                            {cont.decision || 'Aucune justification réglementaire consignée.'}
                          </p>
                          <div style={{ fontSize: '11px', color: '#94A3B8', fontFamily: 'monospace', display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                            <span>Par ID : {cont.traitee_par_id}</span>
                            <span>Le {cont.date_decision ? new Date(cont.date_decision).toLocaleString('fr-FR') : '-'}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        matchsInLitige.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
            <Scale size={48} style={{ color: '#2D6A4F', opacity: 0.4, margin: '0 auto 12px' }} />
            <h3 style={{ margin: '0 0 8px', color: '#1e293b', fontWeight: 700 }}>Aucun match en litige</h3>
            <p style={{ color: '#64748b', fontSize: '14px' }}>Aucune rencontre n'est actuellement suspendue pour litige.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {matchsInLitige.map((match, idx) => (
              <div 
                key={match.id} 
                className="card stagger-item"
                style={{
                  animationDelay: `${idx * 60}ms`,
                  padding: '24px',
                  borderLeft: '4px solid #C8102E',
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
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '20px',
                      fontSize: '11px',
                      fontWeight: 700,
                      background: '#FEE2E2',
                      color: '#991B1B',
                      border: '1px solid #FECACA'
                    }}>
                      En Litige
                    </span>
                  </div>
                </div>

                <div style={{
                  padding: '12px 16px',
                  background: '#FFFBEB',
                  border: '1px solid #FDE68A',
                  borderRadius: '8px',
                  color: '#B45309',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '13px'
                }}>
                  <ShieldAlert size={16} />
                  <span>Ce match est bloqué. Aucun résultat n'est validé et le classement n'est pas mis à jour tant que le litige est actif.</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <button
                    onClick={() => match.rapport_soumis && setViewingReportMatch(match)}
                    disabled={!match.rapport_soumis}
                    className="btn btn-ghost btn-sm"
                    style={{
                      opacity: match.rapport_soumis ? 1 : 0.55,
                      cursor: match.rapport_soumis ? 'pointer' : 'not-allowed',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    title={match.rapport_soumis ? "Consulter le rapport" : "Le rapport du commissaire n'est pas disponible"}
                  >
                    <FileText size={14} />
                    <span>Consulter le Rapport</span>
                  </button>

                  <button
                    onClick={() => setLeveringMatch(match)}
                    disabled={leveringId === match.id}
                    className="btn btn-primary btn-sm"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    {leveringId === match.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : <CheckCircle size={14} />}
                    <span>Lever le Litige</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

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
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Confirmation Levée de Litige */}
      <Modal
        isOpen={!!leveringMatch}
        onClose={() => setLeveringMatch(null)}
        title="Levée de Litige Fédéral"
        size="md"
      >
        {leveringMatch && (
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
                <strong>{leveringMatch.club_domicile.nom}</strong> vs <strong>{leveringMatch.club_exterieur.nom}</strong>
              </div>
              <div style={{ fontSize: '13px', color: '#64748B' }}>
                Score terrain final : <strong style={{ color: '#1B4332' }}>{leveringMatch.score_domicile} - {leveringMatch.score_exterieur}</strong>
              </div>
              <div style={{ fontSize: '12px', color: '#64748B' }}>
                Stade : {leveringMatch.stade} • {leveringMatch.date_heure_fr}
              </div>
            </div>

            <div style={{
              padding: '14px',
              background: 'rgba(45, 106, 79, 0.05)',
              border: '1px solid rgba(45, 106, 79, 0.15)',
              borderRadius: '10px',
              display: 'flex',
              gap: '10px',
              color: '#2D6A4F'
            }}>
              <CheckCircle size={20} style={{ flexShrink: 0 }} />
              <div style={{ fontSize: '13px', lineHeight: '1.5' }}>
                <strong>Action autorisée :</strong> Lever le litige réactivra le match pour l'homologation officielle. Les administrateurs pourront de nouveau valider le score terrain ou appliquer un forfait (tapis vert).
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid var(--border)', paddingTop: '14px' }}>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setLeveringMatch(null)}
              >
                Annuler
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => {
                  const mId = leveringMatch.id;
                  setLeveringMatch(null);
                  handleLeverLitige(mId);
                }}
              >
                <CheckCircle size={14} />
                <span>Confirmer la Levée</span>
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
export default ContestationsPage;
