// src/pages/commissaire/RapportPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getCommissaireMatch, soumettreRapport } from '../../api/matchEvents.api';
import type { Match } from '../../api/matchs.api';
import { ScoreBoard } from '../../components/matchs/ScoreBoard';
import {
  ArrowLeft,
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileText,
  Shield,
  Users,
  Clock,
  Calendar,
  MapPin,
  PenTool,
  Award,
  Flag,
  CheckSquare,
  XCircle
} from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';

export const RapportPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const matchId = parseInt(id || '0', 10);
  const navigate = useNavigate();
  const { lang } = useTranslation();
  const isEn = lang === 'en';

  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [incidents, setIncidents] = useState<string>('');
  const [certify, setCertify] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [pdfPath, setPdfPath] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [charCount, setCharCount] = useState<number>(0);
  const [isAlreadySubmitted, setIsAlreadySubmitted] = useState<boolean>(false);

  useEffect(() => {
    getCommissaireMatch(matchId)
      .then((res) => {
        if (res.success) {
          setMatch(res.data);
          if (res.data.rapport_soumis) {
            setIsAlreadySubmitted(true);
            setIncidents(res.data.incidents_rapport || '');
            setCertify(true);
          }
          if (res.data.statut !== 'termine' && res.data.statut !== 'homologue') {
            setError(isEn ? 'This match is not finished yet. You must close it first.' : 'Ce match n\'est pas encore terminé. Vous devez le clôturer d\'abord.');
          }
        }
      })
      .catch((err) => {
        console.error(err);
        setError(isEn ? 'Unable to load match information.' : 'Impossible de charger les informations du match.');
      })
      .finally(() => setLoading(false));
  }, [matchId, isEn]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!certify) {
      setError(isEn ? 'You must certify the accuracy of the information to sign the report.' : 'Vous devez certifier l\'exactitude des informations pour signer le rapport.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await soumettreRapport(matchId, incidents);
      if (res.success) {
        setSuccessMsg(isEn ? 'Official report submitted successfully!' : 'Rapport officiel soumis avec succès !');
        setPdfPath(res.chemin_pdf);
        setTimeout(() => {
          navigate('/commissaire/matchs');
        }, 3000);
      } else {
        setError(isEn ? 'An error occurred during submission.' : 'Une erreur est survenue lors de la soumission.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || (isEn ? 'Network error during submission.' : 'Erreur réseau lors de la soumission.'));
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (statut: string) => {
    const statusMap = {
      'programme': { label: isEn ? 'Upcoming' : 'À venir', colorClass: 'badge-programme', icon: Clock },
      'en_cours': { label: isEn ? 'In progress' : 'En cours', colorClass: 'badge-en-cours', icon: Clock },
      'mi_temps': { label: isEn ? 'Halftime' : 'Mi-temps', colorClass: 'badge-mi-temps', icon: Clock },
      'termine': { label: isEn ? 'Finished' : 'Terminé', colorClass: 'badge-termine', icon: CheckSquare },
      'homologue': { label: isEn ? 'Approved' : 'Homologué', colorClass: 'badge-homologue', icon: Award }
    };
    return statusMap[statut as keyof typeof statusMap] || statusMap['programme'];
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '16px' }}>
        <div style={{ position: 'relative', width: '64px', height: '64px' }}>
          <div className="animate-spin" style={{ width: '64px', height: '64px', border: '4px solid #dcfce7', borderTopColor: '#059669', borderRadius: '50%' }}></div>
          <Loader2 className="animate-pulse" style={{ position: 'absolute', inset: 0, margin: 'auto', width: '32px', height: '32px', color: '#059669' }} />
        </div>
        <p className="animate-pulse" style={{ fontSize: '14px', fontWeight: 500, color: '#475569' }}>
          {isEn ? 'Loading document...' : 'Chargement du dossier...'}
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

  const statusBadge = getStatusBadge(match.statut);
  const StatusIcon = statusBadge.icon;

  const getLieu = (match: Match): string => {
    const matchAny = match as any;
    return matchAny.lieu || matchAny.stade || matchAny.nom_stade || (isEn ? 'Location not specified' : 'Lieu non spécifié');
  };

  return (
    <div className="live-container">
      <div className="live-content">

        {/* Navigation */}
        <div className="live-header">
          <Link to={`/commissaire/live/${matchId}`} className="btn-back">
            <ArrowLeft size={20} />
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="header-icon-container">
              <FileText size={20} />
            </div>
            <div>
              <h1 className="header-title">{isEn ? 'Final Report' : 'Rapport Final'}</h1>
              <p className="header-subtitle">{isEn ? 'Administrative closure and electronic signature' : 'Clôture administrative et signature électronique'}</p>
            </div>
          </div>
        </div>

        {/* Messages d'état */}
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

        {successMsg && (
          <div className="success-banner">
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
              <div style={{ padding: '8px', backgroundColor: '#D1FAE5', borderRadius: '50%', display: 'flex' }}>
                <CheckCircle2 size={24} style={{ color: '#059669' }} />
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <h4 style={{ margin: 0, fontWeight: 800, color: '#064E3B', fontSize: '18px' }}>{successMsg}</h4>
                <p style={{ margin: 0, fontSize: '14px', color: '#047857' }}>{isEn ? 'The official PDF document has been generated and stored successfully.' : 'Le document PDF officiel a été généré et stocké avec succès.'}</p>
                {pdfPath && (
                  <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #A7F3D0' }}>
                    <p style={{ margin: '0 0 4px', fontSize: '12px', fontWeight: 600, color: '#475569' }}>{isEn ? 'Generated file:' : 'Fichier généré :'}</p>
                    <a
                      href={(() => {
                        const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
                        const baseUrl = apiUrl.endsWith('/api') ? apiUrl.slice(0, -4) : apiUrl;
                        return `${baseUrl}/${pdfPath.startsWith('storage/') ? pdfPath : 'storage/' + pdfPath}`;
                      })()}
                      target="_blank"
                      rel="noreferrer"
                      style={{ fontSize: '14px', fontWeight: 700, color: '#047857', textDecoration: 'underline', wordBreak: 'break-all' }}
                    >
                      {pdfPath}
                    </a>
                  </div>
                )}
                <p style={{ margin: 0, fontSize: '12px', color: '#059669', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Loader2 size={12} className="animate-spin" />
                  {isEn ? 'Redirecting to matches board in a few seconds...' : 'Redirection vers le tableau des matchs dans quelques secondes...'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Informations du match */}
        <div className="card-container" style={{ marginBottom: '24px' }}>
          <div className="card-header" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Shield size={18} style={{ color: '#A3C4A6' }} />
              <span className="card-header-title">{isEn ? 'Match Details' : 'Détails de la rencontre'}</span>
            </div>
            <span className={`badge-status ${statusBadge.colorClass}`}>
              <StatusIcon size={12} style={{ marginRight: '4px' }} />
              {statusBadge.label}
            </span>
          </div>

          <div className="card-body">
            <div className="details-grid">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="detail-row">
                  <Users size={16} style={{ color: '#94A3B8', flexShrink: 0 }} />
                  <span style={{ fontWeight: 600, color: '#1E293B' }}>{match.club_domicile.nom}</span>
                  <span style={{ color: '#94A3B8' }}>vs</span>
                  <span style={{ fontWeight: 600, color: '#1E293B' }}>{match.club_exterieur.nom}</span>
                </div>
                <div className="detail-row">
                  <Calendar size={16} style={{ color: '#94A3B8', flexShrink: 0 }} />
                  <span>
                    {match.date_heure ? new Date(match.date_heure).toLocaleDateString(isEn ? 'en-US' : 'fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    }) : 'N/A'}
                  </span>
                </div>
                <div className="detail-row">
                  <Clock size={16} style={{ color: '#94A3B8', flexShrink: 0 }} />
                  <span>
                    {match.date_heure ? new Date(match.date_heure).toLocaleTimeString(isEn ? 'en-US' : 'fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : 'N/A'}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="detail-row">
                  <MapPin size={16} style={{ color: '#94A3B8', flexShrink: 0 }} />
                  <span>{getLieu(match)}</span>
                </div>
                <div className="detail-row">
                  <Flag size={16} style={{ color: '#94A3B8', flexShrink: 0 }} />
                  <span>{isEn ? 'Score:' : 'Score :'} {match.score_domicile} - {match.score_exterieur}</span>
                </div>
                {(match as any).competition && (
                  <div className="detail-row">
                    <Award size={16} style={{ color: '#94A3B8', flexShrink: 0 }} />
                    <span>{(match as any).competition}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ScoreBoard */}
        <div style={{ marginBottom: '24px', transition: 'all 0.3s ease' }}>
          <ScoreBoard match={match} />
        </div>

        {/* Formulaire du rapport */}
        {isAlreadySubmitted ? (
          <div className="card-container" style={{ marginBottom: '24px' }}>
            <div className="card-header" style={{ borderBottom: '1px solid #E2E8F0', paddingBottom: '16px' }}>
              <CheckCircle2 size={18} style={{ color: '#059669' }} />
              <h3 className="card-header-title" style={{ color: '#064E3B' }}>{isEn ? 'Official report submitted successfully!' : 'Rapport officiel soumis avec succès !'}</h3>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <p style={{ margin: 0, fontSize: '15px', color: '#047857', fontWeight: 600 }}>
                    {isEn 
                      ? 'This report has been electronically signed by the Match Commissioner and sent to FECAFOOT.'
                      : 'Ce rapport a été signé électroniquement par le Commissaire de Match et transmis à la FECAFOOT.'}
                  </p>
                  
                  {match.chemin_pdf && (
                    <div style={{ padding: '16px', backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0', marginTop: '4px' }}>
                      <p style={{ margin: '0 0 6px', fontSize: '12px', fontWeight: 700, color: '#475569' }}>{isEn ? 'Official PDF document generated:' : '📄 Document PDF officiel généré :'}</p>
                      <a
                        href={(() => {
                          const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
                          const baseUrl = apiUrl.endsWith('/api') ? apiUrl.slice(0, -4) : apiUrl;
                          return `${baseUrl}/${match.chemin_pdf.startsWith('storage/') ? match.chemin_pdf : 'storage/' + match.chemin_pdf}`;
                        })()}
                        target="_blank"
                        rel="noreferrer"
                        style={{ fontSize: '14px', fontWeight: 800, color: '#059669', textDecoration: 'underline', wordBreak: 'break-all' }}
                      >
                        {match.chemin_pdf}
                      </a>
                    </div>
                  )}

                  {match.incidents_rapport && (
                    <div style={{ marginTop: '4px' }}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                        {isEn ? 'Reported incidents and remarks:' : 'Incidents et remarques signalés :'}
                      </label>
                      <div style={{ padding: '16px', backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '14px', color: '#334155', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                        {match.incidents_rapport}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="form-actions" style={{ marginTop: '12px', borderTop: '1px solid #F1F5F9', paddingTop: '16px' }}>
                <Link
                  to="/commissaire/matchs"
                  className="btn-back"
                  style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <ArrowLeft size={18} />
                  <span>{isEn ? 'Back to matches list' : 'Retour à la liste des matchs'}</span>
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="card-container" style={{ marginBottom: '24px' }}>
            <div className="card-header">
              <PenTool size={18} style={{ color: '#A3C4A6' }} />
              <h3 className="card-header-title">{isEn ? 'Facts and Incidents' : 'Faits et Incidents'}</h3>
            </div>

            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Zone de texte */}
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                  {isEn ? 'Incident report, complaints or special remarks' : "Rapport d'incidents, réclamations ou remarques particulières"}
                  <span style={{ marginLeft: '8px', fontSize: '12px', fontWeight: 400, color: '#94A3B8' }}>
                    {isEn ? '(max 1000 characters)' : '(max 1000 caractères)'}
                  </span>
                </label>
                <div style={{ position: 'relative' }}>
                  <textarea
                    rows={6}
                    value={incidents}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value.length <= 1000) {
                        setIncidents(value);
                        setCharCount(value.length);
                      }
                    }}
                    placeholder={isEn 
                      ? "Enter here the incidents that occurred in the stands, on the bench, unsportsmanlike behavior, complaints formulated by the captains, etc. If no incident, enter 'None'."
                      : "Saisissez ici les incidents survenus en tribune, sur le banc, les comportements antisportifs, réclamations formulées par les capitaines, etc. Si aucun incident, saisissez 'Néant'."}
                    className={`incidents-textarea ${charCount > 900 ? 'warning-border' : ''}`}
                  />
                  <div style={{ position: 'absolute', bottom: '12px', right: '12px', fontSize: '11px', fontFamily: 'monospace', color: '#94A3B8', backgroundColor: 'rgba(255,255,255,0.9)', padding: '2px 6px', borderRadius: '4px' }}>
                    {charCount}/1000
                  </div>
                </div>
                {charCount > 900 && (
                  <p style={{ marginTop: '6px', fontSize: '12px', color: '#D97706', display: 'flex', alignItems: 'center', gap: '4px', margin: '6px 0 0' }}>
                    <AlertCircle size={12} />
                    {isEn ? 'Approaching maximum limit' : 'Approche de la limite maximale'}
                  </p>
                )}
              </div>

              {/* Signature électronique */}
              <div className="certify-block">
                <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#064E3B', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 12px' }}>
                  <Award size={18} style={{ color: '#059669' }} />
                  {isEn ? 'Electronic Signature' : 'Signature Électronique'}
                </h4>

                <label className="certify-label">
                  <input
                    type="checkbox"
                    checked={certify}
                    onChange={(e) => setCertify(e.target.checked)}
                    className="certify-checkbox"
                  />
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: '14px', color: '#334155', lineHeight: '1.6' }}>
                      {isEn 
                        ? <>I certify on my honor the accuracy of the information entered in this match report. I attest that the final score and the event log correspond to the game facts observed on the pitch. This declaration serves as an <strong style={{ color: '#059669' }}>official electronic signature</strong>.</>
                        : <>Je certifie sur l'honneur l'exactitude des informations saisies dans ce rapport de rencontre. J'atteste que le score final et le journal d'événements correspondent aux faits de jeu observés sur le terrain. Cette déclaration fait office de <strong style={{ color: '#059669' }}>signature électronique officielle</strong>.</>}
                    </span>
                    <div style={{ marginTop: '8px', fontSize: '12px', fontWeight: 700, transition: 'all 0.3s', color: certify ? '#059669' : '#94A3B8' }}>
                      {certify ? (isEn ? '✅ Certified' : '✅ Certifié') : (isEn ? '☐ Pending certification' : '☐ En attente de certification')}
                    </div>
                  </div>
                </label>
              </div>

              {/* Boutons d'action */}
              <div className="form-actions">
                <Link
                  to={`/commissaire/live/${matchId}`}
                  className="btn-back"
                  style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <ArrowLeft size={18} />
                  <span>{isEn ? 'Back' : 'Retour'}</span>
                </Link>
                <button
                  type="submit"
                  disabled={submitting || !certify}
                  className="btn-submit"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>{isEn ? 'Processing...' : 'Traitement en cours...'}</span>
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      <span>{isEn ? 'Submit Report' : 'Soumettre le Rapport'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Informations de sécurité */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '12px', color: '#94A3B8', padding: '16px 0', flexWrap: 'wrap', textAlign: 'center' }}>
          <Shield size={14} />
          <span>{isEn ? 'Data certified and electronically signed' : 'Données certifiées et signées électroniquement'}</span>
          <span style={{ width: '4px', height: '4px', backgroundColor: '#CBD5E1', borderRadius: '50%' }}></span>
          <span>{isEn ? 'Compliant with official regulations' : 'Conforme aux réglementations officielles'}</span>
        </div>
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
          justify-content: center;
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
        .success-banner {
          padding: 24px;
          background: #ECFDF5;
          border: 1px solid #A7F3D0;
          border-radius: 20px;
          margin-bottom: 24px;
          animation: fadeIn 0.3s ease;
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
        .details-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
        }
        @media (min-width: 640px) {
          .details-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
        .detail-row {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: #475569;
        }
        .incidents-textarea {
          width: 100%;
          padding: 12px 16px;
          border-radius: 12px;
          border: 2px solid #E2E8F0;
          font-family: inherit;
          font-size: 14px;
          line-height: 1.6;
          transition: all 0.2s;
          resize: vertical;
          outline: none;
        }
        .incidents-textarea:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(27, 67, 50, 0.1);
        }
        .incidents-textarea.warning-border {
          border-color: #F59E0B;
        }
        .incidents-textarea.warning-border:focus {
          box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1);
        }
        .certify-block {
          padding: 20px;
          background: linear-gradient(135deg, #F0FDF4 0%, #FFFFFF 100%);
          border-radius: 16px;
          border: 2px solid #DCFCE7;
          transition: all 0.2s ease;
        }
        .certify-block:hover {
          border-color: #BBF7D0;
        }
        .certify-label {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          cursor: pointer;
        }
        .certify-checkbox {
          margin-top: 4px;
          width: 18px;
          height: 18px;
          border-radius: 4px;
          border: 2px solid #CBD5E1;
          cursor: pointer;
          accent-color: var(--primary);
        }
        .form-actions {
          display: flex;
          flex-direction: column-reverse;
          justify-content: flex-end;
          gap: 12px;
          padding-top: 16px;
          border-top: 1px solid #F1F5F9;
        }
        @media (min-width: 640px) {
          .form-actions {
            flex-direction: row;
          }
        }
        .btn-submit {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px 24px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 14px;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
          color: #ffffff;
          background: linear-gradient(135deg, #10B981 0%, #059669 100%);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
        }
        .btn-submit:hover:not(:disabled) {
          background: linear-gradient(135deg, #059669 0%, #047857 100%);
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(16, 185, 129, 0.3);
        }
        .btn-submit:disabled {
          background: #E2E8F0;
          color: #94A3B8;
          box-shadow: none;
          cursor: not-allowed;
        }
        .badge-status {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          border: 1px solid;
        }
        .badge-programme {
          background-color: #E0F2FE;
          color: #0369A1;
          border-color: #BAE6FD;
        }
        .badge-en-cours {
          background-color: #FEE2E2;
          color: #991B1B;
          border-color: #FCA5A5;
        }
        .badge-mi-temps {
          background-color: #FEF3C7;
          color: #92400E;
          border-color: #FDE68A;
        }
        .badge-termine {
          background-color: #F1F5F9;
          color: #475569;
          border-color: #E2E8F0;
        }
        .badge-homologue {
          background-color: #D8F3DC;
          color: #1B4332;
          border-color: #B7E4C7;
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default RapportPage;