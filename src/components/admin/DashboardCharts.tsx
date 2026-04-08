import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const C = {
  bg: '#f6f1e9',
  teal: '#0d8a6f',
  tealDim: '#07694f',
  tealGlow: 'rgba(13,138,111,0.18)',
  tealSoft: 'rgba(13,138,111,0.08)',
  gold: '#d4a55a',
  goldGlow: 'rgba(212,165,90,0.18)',
  goldSoft: 'rgba(212,165,90,0.10)',
  coral: '#e8735a',
  coralGlow: 'rgba(232,115,90,0.15)',
  purple: '#7c5cbf',
  purpleGlow: 'rgba(124,92,191,0.15)',
  textPrimary: '#2a2722',
  textSecondary: '#6b6560',
  textMuted: '#9b9590',
  border: 'rgba(0,0,0,0.08)',
};

const ticketStatusLabels: Record<string, string> = {
  open: 'Ouvert', in_progress: 'En cours', waiting_client: 'Attente', resolved: 'Résolu', closed: 'Fermé',
};
const ticketStatusColors: Record<string, string> = {
  open: '#F07067', in_progress: '#F0C95C', waiting_client: '#A78BDB', resolved: '#2DD4B8', closed: '#6b7280',
};
const PRIORITY_COLORS: Record<string, string> = { urgent: '#F07067', high: '#f97316', medium: '#F0C95C', low: '#2DD4B8' };

const statusLabels: Record<string, string> = { new: 'Nouveaux', contacted: 'Contactés', qualified: 'Qualifiés', converted: 'Convertis', lost: 'Perdus' };
const statusColors: Record<string, string> = { new: '#2DD4B8', contacted: '#4da6d9', qualified: '#F0C95C', converted: '#A78BDB', lost: '#F07067' };

const projectStatusLabels: Record<string, string> = { brief: 'Brief', maquette: 'Maquette', development: 'Dev', review: 'Review', delivered: 'Livré', maintenance: 'Maintenance' };
const projectStatusColors: Record<string, string> = { brief: '#F0C95C', maquette: '#4da6d9', development: '#2DD4B8', review: '#A78BDB', delivered: '#3B82F6', maintenance: '#6B7280' };

type MonthlyRevenue = { month: string; revenue: number; invoiced: number };
type RecentTicket = { id: string; title: string; status: string; priority: string; client_name: string; created_at: string };

/* === SVG SparkLine === */
const SparkLine = ({ data, color = C.teal, height = 200 }: { data: { l: string; v: number }[]; color?: string; height?: number }) => {
  const w = 500, h = height, pad = 20;
  const max = Math.max(...data.map(d => d.v), 1);
  const pts = data.map((d, i) => ({
    x: pad + (i / (data.length - 1)) * (w - pad * 2),
    y: pad + (1 - d.v / (max * 1.1)) * (h - pad * 2),
  }));
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const area = `${line} L${pts[pts.length - 1].x},${h} L${pts[0].x},${h} Z`;
  const gradId = `gr_${color.replace('#', '')}`;
  const glowId = `gl_${color.replace('#', '')}`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: `${h}px` }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
        <filter id={glowId}><feGaussianBlur stdDeviation="3" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      {[0.25, 0.5, 0.75].map((r, i) => (
        <line key={i} x1={pad} y1={pad + r * (h - pad * 2)} x2={w - pad} y2={pad + r * (h - pad * 2)} stroke="rgba(0,0,0,0.06)" strokeDasharray="4 4" />
      ))}
      <path d={area} fill={`url(#${gradId})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" filter={`url(#${glowId})`} />
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="4" fill={C.bg} stroke={color} strokeWidth="2" />
          {i === pts.length - 1 && (
            <circle cx={p.x} cy={p.y} r="8" fill={color} fillOpacity="0.2">
              <animate attributeName="r" values="8;14;8" dur="2s" repeatCount="indefinite" />
              <animate attributeName="fill-opacity" values="0.2;0;0.2" dur="2s" repeatCount="indefinite" />
            </circle>
          )}
        </g>
      ))}
      {data.map((d, i) => (
        <text key={i} x={pts[i].x} y={h - 4} textAnchor="middle" style={{ fontSize: '11px', fontFamily: "'Outfit'", fill: C.textMuted }}>{d.l}</text>
      ))}
    </svg>
  );
};

/* === SVG Donut === */
const Donut = ({ segments, size = 160 }: { segments: { pct: number; color: string; label: string }[]; size?: number }) => {
  const r = 55, cx = size / 2, cy = size / 2, circ = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        {segments.map((_, i) => (
          <filter key={i} id={`dg${i}`}><feGaussianBlur stdDeviation="2" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        ))}
      </defs>
      {segments.map((s, i) => {
        const dash = (s.pct / 100) * circ;
        const gap = circ - dash;
        const o = offset;
        offset += dash;
        return <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={s.color} strokeWidth="14" strokeDasharray={`${dash} ${gap}`} strokeDashoffset={-o} strokeLinecap="round" filter={`url(#dg${i})`} style={{ transition: 'all 0.8s ease' }} />;
      })}
      <circle cx={cx} cy={cy} r={42} fill={C.bg} fillOpacity="0.5" />
    </svg>
  );
};

const DashboardCharts = () => {
  const navigate = useNavigate();
  const [monthlyData, setMonthlyData] = useState<MonthlyRevenue[]>([]);
  const [leadsByStatus, setLeadsByStatus] = useState<{ name: string; value: number; color: string }[]>([]);
  const [projectsByStatus, setProjectsByStatus] = useState<{ name: string; value: number; color: string }[]>([]);
  const [ticketsByStatus, setTicketsByStatus] = useState<{ name: string; value: number; color: string }[]>([]);
  const [recentTickets, setRecentTickets] = useState<RecentTicket[]>([]);
  const [kpis, setKpis] = useState({ totalClients: 0, openTickets: 0, mrr: 0, monthRevenue: 0 });

  const fetchAll = useCallback(async () => {
    const [
      { data: payments }, { data: invoices }, { data: leads }, { data: projects },
      { data: clients }, { data: tickets }, { data: clientsList }, { data: contracts },
    ] = await Promise.all([
      supabase.from('client_payments').select('amount,payment_date,payment_type'),
      supabase.from('invoices').select('total,issue_date,status,amount_paid,due_date'),
      supabase.from('leads').select('status,created_at'),
      supabase.from('projects').select('status'),
      supabase.from('clients').select('id,status,monthly_amount'),
      supabase.from('support_tickets').select('id,title,status,priority,client_id,created_at').order('created_at', { ascending: false }),
      supabase.from('clients').select('id,business_name'),
      supabase.from('contracts').select('monthly_price,status'),
    ]);

    const clientMap = Object.fromEntries((clientsList || []).map((c: any) => [c.id, c.business_name]));
    const now = new Date();
    const months: MonthlyRevenue[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toISOString().slice(0, 7);
      const label = d.toLocaleDateString('fr-FR', { month: 'short' });
      const rev = (payments || []).filter((p: any) => p.payment_date?.startsWith(key)).reduce((s: number, p: any) => s + Number(p.amount || 0), 0);
      const inv = (invoices || []).filter((p: any) => p.issue_date?.startsWith(key)).reduce((s: number, p: any) => s + Number(p.total || 0), 0);
      months.push({ month: label, revenue: Math.round(rev), invoiced: Math.round(inv) });
    }
    setMonthlyData(months);

    const leadGroups: Record<string, number> = {};
    (leads || []).forEach((l: any) => { leadGroups[l.status] = (leadGroups[l.status] || 0) + 1; });
    setLeadsByStatus(Object.entries(leadGroups).map(([k, v]) => ({ name: statusLabels[k] || k, value: v, color: statusColors[k] || '#6B7280' })).sort((a, b) => b.value - a.value));

    const projGroups: Record<string, number> = {};
    (projects || []).forEach((p: any) => { projGroups[p.status] = (projGroups[p.status] || 0) + 1; });
    setProjectsByStatus(Object.entries(projGroups).map(([k, v]) => ({ name: projectStatusLabels[k] || k, value: v, color: projectStatusColors[k] || '#6B7280' })));

    const ticketGroups: Record<string, number> = {};
    (tickets || []).forEach((t: any) => { ticketGroups[t.status] = (ticketGroups[t.status] || 0) + 1; });
    setTicketsByStatus(Object.entries(ticketGroups).map(([k, v]) => ({ name: ticketStatusLabels[k] || k, value: v, color: ticketStatusColors[k] || '#6B7280' })));

    setRecentTickets((tickets || []).slice(0, 5).map((t: any) => ({
      id: t.id, title: t.title, status: t.status, priority: t.priority,
      client_name: clientMap[t.client_id] || 'Inconnu', created_at: t.created_at,
    })));

    const activeClients = (clients || []).filter((c: any) => c.status === 'active').length;
    const openTickets = (tickets || []).filter((t: any) => t.status === 'open').length;
    const mrr = (contracts || []).filter((c: any) => c.status === 'active').reduce((s: number, c: any) => s + Number(c.monthly_price || 0), 0);
    const currentMonth = now.toISOString().slice(0, 7);
    const monthRevenue = (invoices || []).filter((i: any) => i.status === 'paid' && i.issue_date?.startsWith(currentMonth)).reduce((s: number, i: any) => s + Number(i.total || 0), 0);
    setKpis({ totalClients: activeClients, openTickets, mrr: Math.round(mrr), monthRevenue: Math.round(monthRevenue) });
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  const f = (n: number) => n.toLocaleString('fr-FR');

  const kpiCards = [
    { label: 'Clients actifs', value: kpis.totalClients, icon: '👥', color: 'teal' as const },
    { label: 'Tickets ouverts', value: kpis.openTickets, icon: '🎫', color: 'coral' as const },
    { label: 'MRR', value: `${f(kpis.mrr)} €`, icon: '📈', color: 'gold' as const },
    { label: 'Revenus ce mois', value: `${f(kpis.monthRevenue)} €`, icon: '💰', color: 'purple' as const },
  ];

  const colorMap: Record<string, { c: string; bg: string; brd: string; glow: string }> = {
    teal: { c: C.teal, bg: C.tealSoft, brd: C.tealGlow, glow: `0 0 60px ${C.tealGlow}` },
    gold: { c: C.gold, bg: C.goldSoft, brd: C.goldGlow, glow: `0 0 60px ${C.goldGlow}` },
    coral: { c: C.coral, bg: 'rgba(240,112,103,0.08)', brd: C.coralGlow, glow: `0 0 60px ${C.coralGlow}` },
    purple: { c: C.purple, bg: 'rgba(167,139,219,0.08)', brd: C.purpleGlow, glow: `0 0 60px ${C.purpleGlow}` },
  };

  // Prepare chart data
  const sparkData = monthlyData.map(m => ({ l: m.month, v: m.revenue }));

  // Prepare donut data
  const totalTickets = ticketsByStatus.reduce((s, t) => s + t.value, 0);
  const donutSegments = ticketsByStatus.map(t => ({
    pct: totalTickets > 0 ? (t.value / totalTickets) * 100 : 0,
    color: t.color,
    label: t.name,
  }));

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpiCards.map((k, i) => {
          const cc = colorMap[k.color];
          return (
            <div key={i} className="admin-glass-card group" style={{ cursor: 'default' }}>
              <div className="flex items-center gap-4 relative z-[1]">
                <div style={{
                  width: 52, height: 52, borderRadius: 16,
                  background: cc.bg, border: `1px solid ${cc.c}22`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22, flexShrink: 0,
                  boxShadow: `0 0 20px ${cc.brd}`,
                }}>{k.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase' as const, color: C.textMuted, marginBottom: 6 }}>{k.label}</div>
                  <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 28, fontWeight: 700, color: C.textPrimary, lineHeight: 1 }}>{k.value}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue SparkLine */}
        <div className="lg:col-span-2 admin-glass-card">
          <div className="relative z-[1] flex items-center justify-between mb-4">
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, color: C.textPrimary, margin: 0 }}>Revenus mensuels</h3>
            <div className="flex items-center gap-2">
              <span style={{ width: 8, height: 8, borderRadius: 2, background: C.teal, boxShadow: `0 0 6px ${C.tealGlow}` }} />
              <span style={{ fontSize: 11, color: C.textSecondary, fontFamily: "'Outfit', sans-serif" }}>Setup + Récurrent</span>
            </div>
          </div>
          <div className="relative z-[1]">
            <SparkLine data={sparkData} color={C.teal} height={180} />
          </div>
        </div>

        {/* Tickets Donut */}
        <div className="admin-glass-card">
          <h3 className="relative z-[1]" style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, color: C.textPrimary, margin: '0 0 20px' }}>Tickets par statut</h3>
          <div className="relative z-[1] flex flex-col items-center gap-4">
            {donutSegments.length > 0 ? (
              <>
                <Donut segments={donutSegments} size={140} />
                <div className="flex flex-wrap gap-3 justify-center">
                  {ticketsByStatus.map((t, i) => (
                    <span key={i} className="flex items-center gap-1.5" style={{ fontSize: 11, color: C.textSecondary, fontFamily: "'Outfit', sans-serif" }}>
                      <span style={{ width: 8, height: 8, borderRadius: 2, background: t.color, boxShadow: `0 0 6px ${t.color}55` }} />
                      {t.name}
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-40" style={{ color: C.textMuted, fontFamily: "'Outfit', sans-serif", fontSize: 13 }}>Aucun ticket</div>
            )}
          </div>
        </div>
      </div>

      {/* Leads + Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Leads donut */}
        <div className="admin-glass-card">
          <h3 className="relative z-[1]" style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, color: C.textPrimary, margin: '0 0 8px' }}>Leads par statut</h3>
          <div className="relative z-[1]">
            {leadsByStatus.length > 0 ? (
              <>
                <div className="flex justify-center my-4">
                  <Donut segments={leadsByStatus.map(l => {
                    const total = leadsByStatus.reduce((s, x) => s + x.value, 0);
                    return { pct: (l.value / total) * 100, color: l.color, label: l.name };
                  })} size={140} />
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 justify-center">
                  {leadsByStatus.map((s, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: s.color, boxShadow: `0 0 6px ${s.color}55` }} />
                      <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, color: C.textSecondary }}>{s.name} ({s.value})</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-40" style={{ color: C.textMuted, fontFamily: "'Outfit', sans-serif", fontSize: 13 }}>Aucun lead</div>
            )}
          </div>
        </div>

        {/* Projects bar-like using horizontal bars */}
        <div className="admin-glass-card">
          <h3 className="relative z-[1]" style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, color: C.textPrimary, margin: '0 0 16px' }}>Projets par étape</h3>
          <div className="relative z-[1] flex flex-col gap-4">
            {projectsByStatus.length > 0 ? projectsByStatus.map((item, i) => {
              const total = projectsByStatus.reduce((s, t) => s + t.value, 0);
              const pct = total > 0 ? (item.value / total) * 100 : 0;
              return (
                <div key={i}>
                  <div className="flex justify-between mb-2">
                    <span style={{ fontSize: 13, color: C.textSecondary, fontFamily: "'Outfit', sans-serif" }}>{item.name}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: item.color, fontFamily: "'Outfit', sans-serif" }}>{item.value}</span>
                  </div>
                  <div style={{ height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.04)', overflow: 'hidden' }}>
                    <div style={{
                      width: `${pct}%`, height: '100%', borderRadius: 3,
                      background: `linear-gradient(90deg, ${item.color}, ${item.color}BB)`,
                      boxShadow: `0 0 8px ${item.color}44`,
                    }} />
                  </div>
                </div>
              );
            }) : (
              <div className="flex items-center justify-center h-40" style={{ color: C.textMuted, fontFamily: "'Outfit', sans-serif", fontSize: 13 }}>Aucun projet</div>
            )}
          </div>
        </div>
      </div>

      {/* Recent tickets */}
      <div className="admin-glass-card">
        <div className="flex items-center justify-between mb-5 relative z-[1]">
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, color: C.textPrimary, margin: 0 }}>Derniers tickets</h3>
          <button onClick={() => navigate('/admin/tickets')} className="admin-glass-btn-secondary" style={{ padding: '8px 18px', fontSize: 12 }}>Voir tout</button>
        </div>
        <div className="relative z-[1]">
          <div className="hidden md:grid gap-0 px-5 pb-3" style={{ gridTemplateColumns: '2fr 1.2fr 1fr 0.8fr 0.8fr', borderBottom: `1px solid ${C.border}` }}>
            {['Titre', 'Client', 'Statut', 'Priorité', 'Date'].map((h, i) => (
              <span key={i} style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1.2, textTransform: 'uppercase' as const, color: C.textMuted, fontFamily: "'Outfit', sans-serif" }}>{h}</span>
            ))}
          </div>
          {recentTickets.length > 0 ? recentTickets.map(t => (
            <div
              key={t.id}
              onClick={() => navigate('/admin/tickets')}
              className="grid items-center gap-0 px-5 py-3 cursor-pointer transition-colors"
              style={{ gridTemplateColumns: '2fr 1.2fr 1fr 0.8fr 0.8fr', borderBottom: `1px solid ${C.border}` }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 500, color: C.textPrimary }}>{t.title}</span>
              <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, color: C.textSecondary }}>{t.client_name}</span>
              <span className="admin-status-badge" style={{
                background: `${ticketStatusColors[t.status] || '#999'}20`,
                color: ticketStatusColors[t.status] || '#999', width: 'fit-content',
              }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: ticketStatusColors[t.status], boxShadow: `0 0 8px ${ticketStatusColors[t.status]}` }} />
                {ticketStatusLabels[t.status] || t.status}
              </span>
              <span style={{ fontSize: 12, fontWeight: 600, fontFamily: "'Outfit', sans-serif", color: PRIORITY_COLORS[t.priority] || C.textMuted }}>{t.priority}</span>
              <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, color: C.textMuted }}>{new Date(t.created_at).toLocaleDateString('fr-FR')}</span>
            </div>
          )) : (
            <div className="text-center py-8" style={{ color: C.textMuted, fontFamily: "'Outfit', sans-serif", fontSize: 13 }}>Aucun ticket</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardCharts;
