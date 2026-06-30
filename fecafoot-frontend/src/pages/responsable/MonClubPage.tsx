// src/pages/responsable/MonClubPage.tsx
// Page de gestion du club pour le responsable
// ⚠️ Le nom, la ville et la division sont en lecture seule (modifiables uniquement par l'admin)

import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, Camera, AlertCircle, Mail, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import { getMonClub, updateMonClub, completerProfil, signalerErreurAdmin } from '../../api/clubs.api';
import { Avatar } from '../../components/ui/avatar';



// Stades prédéfinis par ville
const STADES_PAR_VILLE: Record<string, string[]> = {
  'Douala': ['Stade de la Réunification', 'Stade de Bepanda', 'Stade Japoma'],
  'Yaoundé': ['Stade Omnisports', 'Stade Ahmadou Ahidjo', 'Stade Annex'],
  'Garoua': ['Stade Roumdé Adjia'],
  'Bafoussam': ['Stade Municipal', 'Stade de Kouekong'],
  'Bamenda': ['Stade de Bamenda'],
  'Limbé': ['Stade de Limbé'],
  'Buea': ['Stade de Buea', 'Stade Molyko'],
};

const DIVISIONS = [
  { value: 'elite_one', label: 'Elite One', icon: '🏆' },
  { value: 'elite_two', label: 'Elite Two', icon: '⚡' },
];

const MonClubPage: React.FC = () => {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    stade: '',
    president: '',
    couleurs: '',
    annee_creation: '',
    site_web: '',
    telephone: '',
    presentation: '',
  });
  const [logo, setLogo] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [customStade, setCustomStade] = useState(false);
  const [showSignalModal, setShowSignalModal] = useState(false);
  const [signalMessage, setSignalMessage] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['mon-club'],
    queryFn: getMonClub,
  });

  useEffect(() => {
    const club = data?.data;
    if (club) {
      setFormData({
        stade: club.stade ?? '',
        president: club.president ?? '',
        couleurs: club.couleurs ?? '',
        annee_creation: club.annee_creation?.toString() ?? '',
        site_web: club.site_web ?? '',
        telephone: club.telephone ?? '',
        presentation: club.presentation ?? '',
      });
      const villeStades = STADES_PAR_VILLE[club.ville] || [];
      const isPredefini = villeStades.includes(club.stade ?? '');
      setCustomStade(!isPredefini && !!club.stade);
    }
  }, [data]);

  const club = data?.data;
  const isProfileComplete = club?.profile_completed ?? false;
  const villeActuelle = club?.ville || '';
  const stadesDisponibles = STADES_PAR_VILLE[villeActuelle] || [];

  const mutation = useMutation({
    mutationFn: async () => {
      const fd = new FormData();
      Object.entries(formData).forEach(([k, v]) => { if (v) fd.append(k, v); });
      if (logo) fd.append('logo', logo);

      if (!isProfileComplete) {
        return completerProfil(fd);
      }
      return updateMonClub(fd);
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['mon-club'] });
      queryClient.invalidateQueries({ queryKey: ['joueurs-club'] });
      toast.success(res.message ?? 'Informations mises à jour !');
      setDirty(false);
      setLogo(null);
      setPreview(null);
      if (!isProfileComplete && res.data?.profile_completed === true) {
        setTimeout(() => window.location.href = '/responsable/dashboard', 1500);
      }
    },
    onError: (err: any) => {
      const apiErrors = err.response?.data?.errors ?? {};
      const msgs: Record<string, string> = {};
      Object.entries(apiErrors).forEach(([k, v]: any) => msgs[k] = v[0]);
      setErrors(msgs);
      toast.error(err.response?.data?.message ?? 'Erreur lors de la mise à jour');
    },
  });

  const signalerMutation = useMutation({
    mutationFn: () => signalerErreurAdmin({ message: signalMessage, club_id: club?.id }),
    onSuccess: () => {
      toast.success('Votre signalement a été envoyé à l\'administrateur.');
      setShowSignalModal(false);
      setSignalMessage('');
    },
    onError: () => {
      toast.error('Erreur lors de l\'envoi du signalement. Veuillez réessayer.');
    },
  });

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      toast.error('Le logo ne doit pas dépasser 3 Mo');
      return;
    }
    setLogo(file);
    setPreview(URL.createObjectURL(file));
    setDirty(true);
  };

  const updateField = (key: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setDirty(true);
    if (errors[key]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });
    }
  };

  const logoDisplay = preview ?? club?.logo_url;

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#1B4332] border-t-transparent" />
      </div>
    );
  }

  if (!club) return null;

  const divisionInfo = DIVISIONS.find(d => d.value === club.division);

  return (
    <div style={{}}>

      {/* Hero Section */}
      <div style={{
        background: 'linear-gradient(135deg, #1B4332 0%, #2D6A4F 100%)',
        borderRadius: '24px',
        padding: '32px',
        marginBottom: '32px',
        color: '#fff',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute',
          top: -50,
          right: -50,
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.05)',
        }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <div onClick={() => fileRef.current?.click()} style={{ cursor: 'pointer' }}>
              <Avatar src={logoDisplay} name={club.nom} size={100} />
            </div>
            <div style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              background: '#fff',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            }}>
              <Camera size={14} color="#1B4332" />
            </div>
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '8px' }}>
              <span style={{
                background: 'rgba(255,255,255,0.2)',
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: 600,
              }}>
                {divisionInfo?.icon} {divisionInfo?.label}
              </span>
              {!isProfileComplete && (
                <span style={{
                  background: '#FFB800',
                  color: '#1B4332',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 700,
                }}>
                  Profil à compléter
                </span>
              )}
            </div>

            <h1 style={{ fontSize: '28px', fontWeight: 800, margin: 0, color: '#fff' }}>
              {club.nom}
            </h1>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '8px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={14} style={{ opacity: 0.7 }} />
                <span style={{ fontSize: '14px' }}>{club.ville}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Mail size={14} style={{ opacity: 0.7 }} />
                <span style={{ fontSize: '14px' }}>{club.responsable?.email}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowSignalModal(true)}
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: 'none',
              borderRadius: '40px',
              padding: '8px 16px',
              fontSize: '12px',
              fontWeight: 500,
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
          >
            <AlertCircle size={14} />
            Signaler une erreur
          </button>

          {dirty && (
            <button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending}
              style={{
                background: '#fff',
                border: 'none',
                borderRadius: '40px',
                padding: '10px 24px',
                fontWeight: 700,
                color: '#1B4332',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s',
              }}
            >
              {mutation.isPending ? (
                <span className="animate-spin rounded-full h-4 w-4 border-2 border-[#1B4332] border-t-transparent" />
              ) : (
                <Save size={16} />
              )}
              Enregistrer
            </button>
          )}
        </div>

        <input ref={fileRef} type="file" accept="image/*" onChange={handleLogoChange} style={{ display: 'none' }} />
      </div>

      {/* Stats Cards (uniquement si profil complet) */}
      {isProfileComplete && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '16px',
          marginBottom: '32px'
        }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#1B4332' }}>{club.nb_joueurs ?? 0}</div>
            <div style={{ fontSize: '13px', color: '#64748b' }}>Joueurs</div>
          </div>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#15803d' }}>{club.nb_joueurs_valides ?? 0}</div>
            <div style={{ fontSize: '13px', color: '#64748b' }}>Validés</div>
          </div>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#FFB800' }}>{club.nb_joueurs_soumis ?? 0}</div>
            <div style={{ fontSize: '13px', color: '#64748b' }}>En attente</div>
          </div>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#2563eb' }}>{club.nb_coachs ?? 0}</div>
            <div style={{ fontSize: '13px', color: '#64748b' }}>Coachs</div>
          </div>
        </div>
      )}

      {/* Formulaire */}
      <div style={{
        background: '#fff',
        borderRadius: '24px',
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        marginBottom: '32px',
      }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>
            Informations du club
          </h3>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>
            Ces informations sont visibles par l'administration et le public
          </p>
        </div>

        <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>

          {/* Stade */}
          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#1e293b' }}>
              Stade domicile
            </label>
            {stadesDisponibles.length > 0 && !customStade ? (
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <select
                  value={formData.stade}
                  onChange={(e) => updateField('stade', e.target.value)}
                  style={{ flex: 1, padding: '10px 12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none' }}
                >
                  <option value="">Sélectionner un stade</option>
                  {stadesDisponibles.map(stade => (
                    <option key={stade} value={stade}>{stade}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setCustomStade(true)}
                  style={{ padding: '10px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer' }}
                >
                  Autre stade
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  value={formData.stade}
                  onChange={(e) => updateField('stade', e.target.value)}
                  placeholder="Nom du stade"
                  style={{ flex: 1, padding: '10px 12px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none' }}
                />
                {customStade && stadesDisponibles.length > 0 && (
                  <button
                    type="button"
                    onClick={() => { setCustomStade(false); updateField('stade', stadesDisponibles[0]); }}
                    style={{ padding: '10px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer' }}
                  >
                    Choisir un stade
                  </button>
                )}
              </div>
            )}
            {errors.stade && <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'block' }}>{errors.stade}</span>}
          </div>

          {/* Président */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#1e293b' }}>
              Président <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              value={formData.president}
              onChange={(e) => updateField('president', e.target.value)}
              placeholder="Nom du président"
              style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none' }}
            />
            {errors.president && <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'block' }}>{errors.president}</span>}
          </div>

          {/* Couleurs */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#1e293b' }}>
              Couleurs officielles <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              value={formData.couleurs}
              onChange={(e) => updateField('couleurs', e.target.value)}
              placeholder="Ex: Vert et Blanc"
              style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none' }}
            />
            {errors.couleurs && <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'block' }}>{errors.couleurs}</span>}
          </div>

          {/* Année */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#1e293b' }}>Année de création</label>
            <input
              type="number"
              value={formData.annee_creation}
              onChange={(e) => updateField('annee_creation', e.target.value)}
              placeholder="1958"
              min="1900"
              max={new Date().getFullYear()}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none' }}
            />
          </div>

          {/* Téléphone */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#1e293b' }}>Téléphone</label>
            <input
              type="tel"
              value={formData.telephone}
              onChange={(e) => updateField('telephone', e.target.value)}
              placeholder="+237 6XX XXX XXX"
              style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none' }}
            />
          </div>

          {/* Site web */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#1e293b' }}>Site web</label>
            <input
              type="url"
              value={formData.site_web}
              onChange={(e) => updateField('site_web', e.target.value)}
              placeholder="https://www.monclub.cm"
              style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none' }}
            />
          </div>

          {/* Présentation */}
          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#1e293b' }}>Présentation</label>
            <textarea
              rows={5}
              value={formData.presentation}
              onChange={(e) => updateField('presentation', e.target.value)}
              placeholder="Décrivez votre club..."
              style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #e2e8f0', resize: 'vertical', outline: 'none' }}
            />
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px', display: 'flex', justifyContent: 'space-between' }}>
              <span>{(formData.presentation ?? '').length}/2000 caractères</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de signalement */}
      {showSignalModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '16px',
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '20px',
            maxWidth: '500px',
            width: '100%',
            overflow: 'hidden',
          }}>
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #e2e8f0',
              background: '#fef2f2',
            }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#991b1b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={20} />
                Signaler une erreur
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>
                L'administrateur sera notifié de votre demande
              </p>
            </div>

            <div style={{ padding: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: '#1e293b' }}>
                Description de l'erreur
              </label>
              <textarea
                rows={5}
                value={signalMessage}
                onChange={(e) => setSignalMessage(e.target.value)}
                placeholder="Décrivez précisément l'information erronée..."
                style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', resize: 'vertical', outline: 'none' }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                <button
                  onClick={() => setShowSignalModal(false)}
                  style={{ padding: '10px 20px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer' }}
                >
                  Annuler
                </button>
                <button
                  onClick={() => signalerMutation.mutate()}
                  disabled={!signalMessage.trim() || signalerMutation.isPending}
                  style={{
                    padding: '10px 24px',
                    borderRadius: '10px',
                    background: '#dc2626',
                    border: 'none',
                    color: '#fff',
                    fontWeight: 600,
                    cursor: signalMessage.trim() ? 'pointer' : 'not-allowed',
                    opacity: signalMessage.trim() ? 1 : 0.5,
                  }}
                >
                  {signalerMutation.isPending ? 'Envoi...' : 'Envoyer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MonClubPage;