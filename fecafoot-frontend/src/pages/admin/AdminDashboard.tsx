// src/pages/admin/AdminDashboard.tsx
// Dashboard FECAFOOT — palette vert/rouge/or, cartes gradient, graphiques, thème cohérent

import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Building2, Users, Gavel, ClipboardCheck, Trophy,
  TrendingUp, ShieldCheck, AlertTriangle, ArrowRightCircle,
  RefreshCw, Calendar, Clock, Star, Zap, FileText,
  ChevronRight, Activity,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuthStore } from '../../store/authStore';

// ─── Palette FECAFOOT ────────────────────────────────────────────
const C = {
  green:   '#1B4332',
  greenL:  '#2D6A4F',
  greenD:  '#0D2E24',
  red:     '#C8102E',
  redL:    '#E53946',
  gold:    '#FFB800',
  goldD:   '#E6A500',
};

// ─── Helpers ────────────────────────────────────────────────────
const formatDate = (d: Date) =>
  d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

const dayLabel = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' });
};

const ROLE_LABELS: Record<string, string> = {
  commissaire:      'Commissaires',
  journaliste:      'Journalistes',
  responsable_club: 'Responsables',
  coach:            'Coachs',
};

// ─── Cartes gradient style modèle (pleine couleur) ──────────────
interface GradCardProps {
  label: string;
  value: number | string;
  sub?: string;
  icon: React.FC<{ size?: number; style?: React.CSSProperties }>;
  gradient: string;
  shadowColor: string;
  onClick?: () => void;
  badge?: number | null;
  delay?: number;
}

const GradCard: React.FC<GradCardProps> = ({
  label, value, sub, icon: Icon, gradient, shadowColor, onClick, badge, delay = 0,
}) => (
  <div
    className="stagger-item"
    onClick={onClick}
    role={onClick ? 'button' : undefined}
    tabIndex={onClick ? 0 : undefined}
    onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick?.() : undefined}
    style={{
      animationDelay: `${delay}ms`,
      background: gradient,
      borderRadius: '18px',
      padding: '22px 20px',
      cursor: onClick ? 'pointer' : 'default',
      transition: 'all 0.22s cubic-bezier(0.4,0,0.2,1)',
      position: 'relative', overflow: 'hidden',
      boxShadow: `0 8px 28px ${shadowColor}`,
      color: 'white', minHeight: '130px',
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
    }}
    onMouseEnter={e => {
      if (onClick) {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px) scale(1.01)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = `0 16px 40px ${shadowColor.replace('0.25', '0.4')}`;
      }
    }}
    onMouseLeave={e => {
      if (onClick) {
        (e.currentTarget as HTMLDivElement).style.transform = 'none';
        (e.currentTarget as HTMLDivElement).style.boxShadow = `0 8px 28px ${shadowColor}`;
      }
    }}
  >
    <div style={{
      position: 'absolute', top: -25, right: -25, width: '110px', height: '110px',
      borderRadius: '50%', background: 'rgba(255,255,255,0.1)', pointerEvents: 'none',
    }} />
    <div style={{
      position: 'absolute', bottom: -35, right: 10, width: '80px', height: '80px',
      borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none',
    }} />

    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
      <div style={{
        width: '46px', height: '46px', borderRadius: '13px',
        background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={22} style={{ color: 'white' }} />
      </div>
      {badge != null && badge > 0 && (
        <span style={{
          background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(4px)',
          border: '1px solid rgba(255,255,255,0.35)',
          color: 'white', fontSize: '11px', fontWeight: 800,
          padding: '3px 10px', borderRadius: '999px',
        }}>
          {badge} ⚠
        </span>
      )}
    </div>

    <div>
      <div style={{ fontSize: '34px', fontWeight: 900, lineHeight: 1, letterSpacing: '-1px' }}>
        {value}<span style={{ fontSize: '20px', opacity: 0.7 }}>+</span>
      </div>
      <div style={{ fontSize: '13px', fontWeight: 600, opacity: 0.88, marginTop: '5px' }}>{label}</div>
      {sub && <div style={{ fontSize: '11px', opacity: 0.6, marginTop: '2px' }}>{sub}</div>}
    </div>
  </div>
);

// ─── Tooltip custom ──────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div style={{
        background: C.green, borderRadius: '10px', padding: '10px 14px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.2)', fontSize: '12px', color: 'white',
      }}>
        <div style={{ opacity: 0.7, marginBottom: '3px' }}>{label}</div>
        <div style={{ color: C.gold, fontWeight: 700 }}>
          {payload[0].value} match{payload[0].value > 1 ? 's' : ''}
        </div>
      </div>
    );
  }
  return null;
};

// ─── Composant principal ─────────────────────────────────────────
const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const { data: stats, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const res = await api.get('/admin/stats');
      return res.data.data;
    },
    staleTime: 1000 * 60,
  });

  // Données graphique 7 jours
  const areaData = useMemo(() => {
    const map: Record<string, number> = {};
    (stats?.activite_7_jours ?? []).forEach((r: { jour: string; nb_matchs: number }) => {
      map[r.jour] = r.nb_matchs;
    });
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const isoDay = d.toISOString().slice(0, 10);
      return { jour: dayLabel(d.toISOString()), matchs: map[isoDay] ?? 0 };
    });
  }, [stats]);

  // Données donut utilisateurs
  const pieData = useMemo(() => {
    if (!stats?.repartition_users) return [];
    return Object.entries(stats.repartition_users as Record<string, number>)
      .filter(([, v]) => v > 0)
      .map(([role, count]) => ({ name: ROLE_LABELS[role] ?? role, value: count as number }));
  }, [stats]);

  const PIE_COLORS = [C.green, C.red, C.gold, '#2D6A4F', '#A00D25'];

  // 4 grandes cartes gradient
  const gradCards = [
    {
      label: 'Clubs actifs',
      value: stats?.nb_clubs ?? 0,
      sub: `sur ${stats?.nb_clubs_total ?? 0} clubs`,
      icon: Building2,
      gradient: `linear-gradient(135deg, ${C.green} 0%, ${C.greenL} 100%)`,
      shadowColor: 'rgba(27,67,50,0.35)',
      href: '/admin/clubs',
      delay: 0,
    },
    {
      label: 'Joueurs licenciés',
      value: stats?.nb_joueurs_valides ?? 0,
      sub: 'Licences validées',
      icon: ShieldCheck,
      gradient: `linear-gradient(135deg, ${C.red} 0%, ${C.redL} 100%)`,
      shadowColor: 'rgba(200,16,46,0.30)',
      href: '/admin/joueurs/validation',
      delay: 80,
      badge: stats?.nb_joueurs_attente,
    },
    {
      label: 'Matchs joués',
      value: stats?.nb_matchs_joues ?? 0,
      sub: `${stats?.nb_matchs_a_venir ?? 0} programmés`,
      icon: Trophy,
      gradient: `linear-gradient(135deg, ${C.gold} 0%, ${C.goldD} 100%)`,
      shadowColor: 'rgba(255,184,0,0.35)',
      href: '/admin/calendrier',
      delay: 160,
    },
    {
      label: 'Utilisateurs',
      value: stats?.nb_users ?? 0,
      sub: 'Comptes actifs',
      icon: Users,
      gradient: `linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)`,
      shadowColor: 'rgba(26,26,46,0.35)',
      href: '/admin/users',
      delay: 240,
    },
  ];

  return (
    <div className="animate-fade-in-up">

      {/* ── En-tête ─────────────────────────────────────────────── */}
      <div style={{
        background: `linear-gradient(135deg, ${C.greenD} 0%, ${C.green} 50%, #16213e 100%)`,
        borderRadius: '20px', padding: '24px 28px', marginBottom: '24px',
        boxShadow: `0 8px 32px rgba(13,46,36,0.3)`,
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Barre tricolore en bas */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px',
          background: `linear-gradient(90deg, ${C.green} 33%, ${C.red} 33% 66%, ${C.gold} 66%)`,
        }} />
        {/* Cercles déco */}
        <div style={{
          position: 'absolute', top: -50, right: -50, width: '200px', height: '200px',
          borderRadius: '50%', background: 'rgba(255,184,0,0.07)', pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: -30, right: 120, width: '120px', height: '120px',
          borderRadius: '50%', background: 'rgba(200,16,46,0.08)', pointerEvents: 'none',
        }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <Star size={13} style={{ color: C.gold }} />
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Administration FECAFOOT
              </span>
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 900, color: 'white', lineHeight: 1.2 }}>
              Bonjour, {user?.prenom} 👋
            </h1>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginTop: '4px', textTransform: 'capitalize' }}>
              {formatDate(new Date())}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {stats?.saison_en_cours && (
              <div style={{
                background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(8px)',
                borderRadius: '12px', padding: '10px 16px',
                border: '1px solid rgba(255,184,0,0.2)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 0 3px rgba(74,222,128,0.25)' }} />
                  <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Saison active</span>
                </div>
                <div style={{ fontSize: '14px', fontWeight: 900, color: C.gold, marginTop: '3px' }}>{stats.saison_en_cours}</div>
              </div>
            )}
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              style={{
                background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '10px', padding: '9px 14px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '6px',
                color: 'rgba(255,255,255,0.75)', fontSize: '12px', fontWeight: 600,
                transition: 'all 0.2s',
              }}
            >
              <RefreshCw size={13} style={{ animation: isFetching ? 'spin 1s linear infinite' : 'none' }} />
              Actualiser
            </button>
          </div>
        </div>
      </div>

      {/* ── Alerte licences ─────────────────────────────────────── */}
      {!isLoading && (stats?.nb_joueurs_attente ?? 0) > 0 && (
        <div
          onClick={() => navigate('/admin/joueurs/validation')}
          style={{
            background: '#fffbeb',
            border: '1px solid #fde68a',
            borderRadius: '12px', padding: '13px 18px', marginBottom: '22px',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = '#fbbf24')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = '#fde68a')}
        >
          <AlertTriangle size={16} style={{ color: '#d97706', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <strong style={{ fontSize: '13px', fontWeight: 700, color: '#92400e' }}>
              {stats.nb_joueurs_attente} joueur{stats.nb_joueurs_attente > 1 ? 's' : ''} en attente de validation de licence
            </strong>
            <p style={{ fontSize: '12px', color: '#a16207', marginTop: '1px', fontWeight: 400 }}>
              Des clubs ont soumis leurs effectifs — traitement requis avant le prochain match.
            </p>
          </div>
          <ChevronRight size={15} style={{ color: '#d97706', flexShrink: 0 }} />
        </div>
      )}

      {/* ── 4 Cartes gradient ───────────────────────────────────── */}
      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '22px' }}>
          {[1,2,3,4].map(i => <div key={i} style={{ height: '130px', borderRadius: '18px' }} className="skeleton" />)}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '22px' }}>
          {gradCards.map(c => (
            <GradCard key={c.href} {...c} onClick={() => navigate(c.href)} />
          ))}
        </div>
      )}

      {/* ── Graphique activité + Donut ───────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '18px', marginBottom: '18px' }}>

        {/* Graphique en aires */}
        <div style={{
          background: 'white', borderRadius: '18px', padding: '22px',
          border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(27,67,50,0.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>Activité des matchs</h3>
              <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>7 derniers jours</p>
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: `rgba(27,67,50,0.07)`, borderRadius: '8px', padding: '6px 12px',
            }}>
              <Activity size={13} style={{ color: C.green }} />
              <span style={{ fontSize: '12px', fontWeight: 700, color: C.green }}>
                {areaData.reduce((s, d) => s + d.matchs, 0)} matchs
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={195}>
            <AreaChart data={areaData} margin={{ top: 5, right: 0, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={C.green} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={C.green} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" vertical={false} />
              <XAxis dataKey="jour" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="matchs" stroke={C.green} strokeWidth={2.5}
                fill="url(#grad1)"
                dot={{ fill: C.green, r: 4, strokeWidth: 2, stroke: 'white' }}
                activeDot={{ r: 6, fill: C.gold, stroke: C.green, strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Donut utilisateurs */}
        <div style={{
          background: 'white', borderRadius: '18px', padding: '22px',
          border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(27,67,50,0.06)',
          display: 'flex', flexDirection: 'column',
        }}>
          <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>Utilisateurs</h3>
          <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '14px' }}>Répartition par rôle</p>

          {pieData.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <Users size={30} style={{ color: '#e2e8f0' }} />
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>Aucun utilisateur</span>
            </div>
          ) : (
            <>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ResponsiveContainer width="100%" height={148}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={46} outerRadius={68} paddingAngle={4} dataKey="value" stroke="none">
                      {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip
                      formatter={(v: any, name: any) => [`${v}`, name]}
                      contentStyle={{ borderRadius: '10px', border: '1px solid #f1f5f9', fontSize: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ position: 'absolute', textAlign: 'center', pointerEvents: 'none' }}>
                  <div style={{ fontSize: '22px', fontWeight: 900, color: '#0f172a' }}>{stats?.nb_users ?? 0}</div>
                  <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600 }}>Total</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px' }}>
                {pieData.map((entry, i) => (
                  <div key={entry.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                      <div style={{ width: '9px', height: '9px', borderRadius: '3px', background: PIE_COLORS[i % PIE_COLORS.length], flexShrink: 0 }} />
                      <span style={{ fontSize: '11px', color: '#64748b' }}>{entry.name}</span>
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#1e293b' }}>{entry.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Derniers matchs + Mini-stats + Actions ─────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>

        {/* Derniers matchs */}
        <div style={{
          background: 'white', borderRadius: '18px', overflow: 'hidden',
          border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(27,67,50,0.06)',
        }}>
          <div style={{
            padding: '18px 22px 14px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            borderBottom: '1px solid #f8fafc',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '34px', height: '34px', borderRadius: '10px',
                background: `linear-gradient(135deg, ${C.green}, ${C.greenL})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Trophy size={16} style={{ color: 'white' }} />
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>Derniers matchs</div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>Résultats récents</div>
              </div>
            </div>
            <button
              onClick={() => navigate('/admin/calendrier')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: C.green, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}
            >
              Voir tout <ArrowRightCircle size={13} />
            </button>
          </div>

          {isLoading ? (
            <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: '50px', borderRadius: '10px' }} />)}
            </div>
          ) : !stats?.matchs_recents?.length ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <Trophy size={28} style={{ opacity: 0.25 }} />
              <span style={{ fontSize: '13px' }}>Aucun match terminé</span>
            </div>
          ) : (
            <div style={{ padding: '8px 12px' }}>
              {(stats.matchs_recents as any[]).map((m, i) => (
                <div
                  key={m.id ?? i}
                  onClick={() => navigate(`/admin/matchs/${m.id}`)}
                  style={{
                    padding: '10px 10px', borderRadius: '12px', cursor: 'pointer',
                    transition: 'background 0.15s', display: 'flex', alignItems: 'center', gap: '10px',
                    marginBottom: '3px',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{
                    width: '34px', height: '34px', borderRadius: '9px', flexShrink: 0,
                    background: `rgba(27,67,50,0.07)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Calendar size={14} style={{ color: C.green }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {m.club_domicile} <span style={{ color: '#94a3b8', fontWeight: 400 }}>vs</span> {m.club_exterieur}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                      <Clock size={9} style={{ color: '#94a3b8' }} />
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                        {m.date ? new Date(m.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                      </span>
                    </div>
                  </div>
                  <div style={{
                    background: `linear-gradient(135deg, ${C.green}, ${C.greenL})`,
                    color: 'white', fontWeight: 900, fontSize: '13px',
                    padding: '4px 11px', borderRadius: '9px', whiteSpace: 'nowrap', flexShrink: 0,
                  }}>
                    {m.score_dom} – {m.score_ext}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Colonne droite : mini-stats + actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* Mini-stats 2×2 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {[
              { label: 'Arbitres actifs',   value: stats?.nb_arbitres ?? 0,                icon: Gavel,         color: '#78716c', border: '#e7e5e4' },
              { label: 'Contestations',      value: stats?.nb_contestations_ouvertes ?? 0, icon: AlertTriangle,  color: '#92400e', border: '#fde68a' },
              { label: 'Transferts att.',    value: stats?.nb_transferts_en_attente ?? 0,  icon: TrendingUp,     color: '#1e3a5f', border: '#bfdbfe' },
              { label: 'Saisons totales',    value: stats?.nb_saisons ?? 0,                icon: FileText,       color: '#374151', border: '#e5e7eb' },
            ].map(item => (
              <div key={item.label} style={{
                background: 'white', borderRadius: '14px', padding: '16px',
                border: `1px solid ${item.border}`,
                boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'none'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)'; }}
              >
                <div style={{
                  width: '30px', height: '30px', borderRadius: '8px', marginBottom: '10px',
                  background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '1px solid #f1f5f9',
                }}>
                  <item.icon size={14} style={{ color: item.color }} />
                </div>
                <div style={{ fontSize: '22px', fontWeight: 900, color: '#1e293b', lineHeight: 1 }}>{item.value}</div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '3px', fontWeight: 500 }}>{item.label}</div>
              </div>
            ))}
          </div>

          {/* Actions rapides */}
          <div style={{
            background: 'white', borderRadius: '18px', flex: 1, overflow: 'hidden',
            border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(27,67,50,0.06)',
          }}>
            <div style={{ padding: '16px 18px 12px', borderBottom: '1px solid #f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={14} style={{ color: C.gold }} />
              <span style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>Actions rapides</span>
            </div>
            <div style={{ padding: '8px 10px' }}>
              {[
                { label: 'Ajouter un club', desc: 'Créer un nouveau club', icon: Building2, color: C.green, href: '/admin/clubs' },
                { label: 'Créer un utilisateur', desc: 'Commissaire, journaliste…', icon: Users, color: '#7c3aed', href: '/admin/users/new' },
                { label: 'Gérer les arbitres', desc: 'Panel d\'arbitres actifs', icon: Gavel, color: C.gold, href: '/admin/arbitres' },
                { label: 'Valider licences', desc: `${stats?.nb_joueurs_attente ?? 0} dossier(s) en attente`, icon: ClipboardCheck, color: C.red, href: '/admin/joueurs/validation' },
              ].map((action, i) => (
                <div
                  key={action.href}
                  onClick={() => navigate(action.href)}
                  role="button" tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && navigate(action.href)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '9px 10px', borderRadius: '11px', cursor: 'pointer',
                    transition: 'background 0.15s', marginBottom: i < 3 ? '2px' : '0',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '9px', flexShrink: 0,
                    background: `#f1f5f9`,
                    border: `1px solid #e2e8f0`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <action.icon size={14} style={{ color: action.color }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#1e293b' }}>{action.label}</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>{action.desc}</div>
                  </div>
                  <ChevronRight size={13} style={{ color: '#cbd5e1' }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default AdminDashboard;
