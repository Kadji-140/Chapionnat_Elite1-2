// src/pages/responsable/FirstLoginPage.tsx
// Page d'onboarding plein écran — première connexion du responsable
// Pas de sidebar/header — design immersif avec étapes et animations

import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Shield, Upload, CheckCircle2, ArrowRight, } from 'lucide-react';
import toast from 'react-hot-toast';
import { completerProfil } from '../../api/clubs.api';
import { useAuthStore } from '../../store/authStore';

const STEPS = [
  { label: 'Stade', icon: '🏟️' },
  { label: 'Président', icon: '👔' },
  { label: 'Identité', icon: '🎨' },
  { label: 'Logo', icon: '🖼️' },
];

const FirstLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    stade: '',
    president: '',
    couleurs: '',
    annee_creation: '',
  });
  const [logo, setLogo] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);

  const mutation = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v); });
      if (logo) fd.append('logo', logo);
      return completerProfil(fd);
    },
    onSuccess: () => {
      // Marquer le profil complété dans le store
      if (user) setUser({ ...user, premiere_connexion: false });
      setDone(true);
      setTimeout(() => navigate('/responsable/dashboard'), 2000);
    },
    onError: (err: any) => {
      const apiErrors = err.response?.data?.errors ?? {};
      const msgs: Record<string, string> = {};
      Object.entries(apiErrors).forEach(([k, v]: any) => msgs[k] = v[0]);
      setErrors(msgs);
      toast.error(err.response?.data?.message ?? 'Veuillez corriger les erreurs.');
    },
  });

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogo(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleDropzone = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    setLogo(file);
    setPreview(URL.createObjectURL(file));
  };

  const canNext = () => {
    if (step === 0) return form.stade.trim().length > 0;
    if (step === 1) return form.president.trim().length > 0;
    if (step === 2) return form.couleurs.trim().length > 0;
    return true; // Logo optionnel
  };

  const next = () => {
    if (step < STEPS.length - 1) setStep(s => s + 1);
    else mutation.mutate();
  };

  if (done) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)',
      }}>
        <div className="animate-bounce-in" style={{ textAlign: 'center', color: 'white', padding: '40px' }}>
          <CheckCircle2 size={72} style={{ color: 'var(--accent)', marginBottom: '20px' }} />
          <h2 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '10px' }}>
            Profil complété !
          </h2>
          <p style={{ fontSize: '16px', opacity: 0.8 }}>
            Bienvenue sur la plateforme FECAFOOT. Redirection en cours…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0D2E24 0%, #1B4332 50%, #2D6A4F 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      {/* Carte principale */}
      <div
        className="animate-scale-in"
        style={{
          background: 'white',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '540px',
          overflow: 'hidden',
          boxShadow: '0 32px 80px rgba(0,0,0,0.25)',
        }}
      >
        {/* Header de la carte */}
        <div style={{
          background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)',
          padding: '28px 32px',
          color: 'white',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{
              width: '44px', height: '44px', background: 'var(--accent)',
              borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Shield size={22} style={{ color: 'var(--primary-dark)' }} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '16px' }}>FECAFOOT</div>
              <div style={{ fontSize: '12px', opacity: 0.7 }}>Première connexion</div>
            </div>
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '6px' }}>
            Complétez le profil de votre club 🎉
          </h1>
          <p style={{ fontSize: '14px', opacity: 0.8 }}>
            Bienvenue {user?.prenom} ! Quelques informations pour démarrer.
          </p>

          {/* Barre de progression */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
            {STEPS.map((s, i) => (
              <div key={i} style={{ flex: 1 }}>
                <div style={{
                  height: '4px', borderRadius: '2px',
                  background: i <= step ? 'var(--accent)' : 'rgba(255,255,255,0.25)',
                  transition: 'background 0.4s ease',
                }} />
                <div style={{ fontSize: '10px', marginTop: '4px', opacity: i <= step ? 1 : 0.5, textAlign: 'center' }}>
                  {s.icon}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Corps du formulaire */}
        <div style={{ padding: '32px' }}>
          {/* Étape 0 — Stade */}
          {step === 0 && (
            <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '40px' }}>🏟️</span>
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)', marginTop: '8px' }}>
                  Quel est votre stade ?
                </h2>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                  Le stade domicile de votre club.
                </p>
              </div>
              <div className="form-group">
                <label className="form-label">Nom du stade <span className="required">*</span></label>
                <input
                  type="text" className={`form-input${errors.stade ? ' error' : ''}`}
                  placeholder="Ex: Stade Ahmadou Ahidjo"
                  value={form.stade}
                  onChange={(e) => setForm(p => ({ ...p, stade: e.target.value }))}
                  autoFocus
                />
                {errors.stade && <span className="form-error">{errors.stade}</span>}
              </div>
            </div>
          )}

          {/* Étape 1 — Président */}
          {step === 1 && (
            <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '40px' }}>👔</span>
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)', marginTop: '8px' }}>
                  Qui est le président du club ?
                </h2>
              </div>
              <div className="form-group">
                <label className="form-label">Nom du président <span className="required">*</span></label>
                <input
                  type="text" className={`form-input${errors.president ? ' error' : ''}`}
                  placeholder="Ex: Jean-Paul Akono"
                  value={form.president}
                  onChange={(e) => setForm(p => ({ ...p, president: e.target.value }))}
                  autoFocus
                />
                {errors.president && <span className="form-error">{errors.president}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Année de création</label>
                <input
                  type="number" className="form-input"
                  placeholder="Ex: 1958"
                  value={form.annee_creation}
                  onChange={(e) => setForm(p => ({ ...p, annee_creation: e.target.value }))}
                  min={1900} max={new Date().getFullYear()}
                />
              </div>
            </div>
          )}

          {/* Étape 2 — Couleurs */}
          {step === 2 && (
            <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '40px' }}>🎨</span>
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)', marginTop: '8px' }}>
                  Quelles sont vos couleurs ?
                </h2>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Les couleurs officielles du maillot.</p>
              </div>
              <div className="form-group">
                <label className="form-label">Couleurs officielles <span className="required">*</span></label>
                <input
                  type="text" className={`form-input${errors.couleurs ? ' error' : ''}`}
                  placeholder="Ex: Vert et Blanc"
                  value={form.couleurs}
                  onChange={(e) => setForm(p => ({ ...p, couleurs: e.target.value }))}
                  autoFocus
                />
                {errors.couleurs && <span className="form-error">{errors.couleurs}</span>}
              </div>
            </div>
          )}

          {/* Étape 3 — Logo */}
          {step === 3 && (
            <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '40px' }}>🖼️</span>
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)', marginTop: '8px' }}>
                  Ajoutez le logo de votre club
                </h2>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Optionnel — vous pourrez le modifier plus tard.</p>
              </div>

              {/* Dropzone */}
              <div
                className="upload-zone"
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDropzone}
                onClick={() => fileRef.current?.click()}
                style={{ minHeight: '140px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
              >
                {preview ? (
                  <img src={preview} alt="Aperçu logo" style={{ maxHeight: '90px', objectFit: 'contain', borderRadius: '8px' }} />
                ) : (
                  <>
                    <div style={{ width: '48px', height: '48px', background: 'rgba(27,67,50,0.08)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Upload size={22} style={{ color: 'var(--primary)' }} />
                    </div>
                    <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                      Glissez votre logo ici ou <strong style={{ color: 'var(--primary)' }}>cliquez pour parcourir</strong>
                    </p>
                    <p style={{ fontSize: '12px', color: 'var(--text-light)' }}>PNG, JPG, WEBP — max 3 Mo</p>
                  </>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleLogoChange} style={{ display: 'none' }} />
              {preview && (
                <button className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => { setLogo(null); setPreview(null); }}>
                  Supprimer le logo
                </button>
              )}
            </div>
          )}

          {/* Boutons navigation */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '28px' }}>
            <button
              className="btn btn-ghost"
              onClick={() => setStep(s => s - 1)}
              style={{ visibility: step === 0 ? 'hidden' : 'visible' }}
            >
              Retour
            </button>
            <button
              className="btn btn-primary"
              onClick={next}
              disabled={!canNext() || mutation.isPending}
              style={{ minWidth: '160px' }}
            >
              {mutation.isPending ? (
                <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full inline-block" />
              ) : null}
              {step < STEPS.length - 1 ? (
                <>Continuer <ArrowRight size={16} /></>
              ) : (
                <><CheckCircle2 size={16} /> Valider le profil</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FirstLoginPage;
