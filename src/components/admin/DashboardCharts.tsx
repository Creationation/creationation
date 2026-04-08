import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { Users, Ticket, Receipt, CalendarDays } from 'lucide-react';

const TEAL = '#2A9D8F';
const TEAL_BRIGHT = '#3EDDC7';
const GOLD = '#D4A843';
const CORAL = '#E76F51';
const PURPLE = '#8B6DB0';
const TEXT_PRIMARY = '#1A2332';
const TEXT_SECONDARY = 'rgba(26,35,50,0.55)';
const TEXT_MUTED = 'rgba(26,35,50,0.30)';

const statusLabels: Record<string, string> = {
  new: 'Nouveaux', contacted: 'Contactés', qualified: 'Qualifiés', converted: 'Convertis', lost: 'Perdus',
};
const statusColors: Record<string, string> = {
  new: '#0d8a6f', contacted: '#4da6d9', qualified: '#d4a55a', converted: '#7c5cbf', lost: '#e8735a',
};

const projectStatusLabels: Record<string, string> = {
  brief: 'Brief', maquette: 'Maquette', development: 'Dev', review: 'Review', delivered: 'Livré', maintenance: 'Maintenance',
};
const projectStatusColors: Record<string, string> = {
  brief: '#d4a55a', maquette: '#4da6d9', development: '#0d8a6f', review: '#7c5cbf', delivered: '#3B82F6', maintenance: '#6B7280',
};

const ticketStatusLabels: Record<string, string> = {
  open: 'Ouvert', in_progress: 'En cours', waiting_client: 'Attente client', resolved: 'Résolu', closed: 'Fermé',
};
const ticketStatusColors: Record<string, string> = {
  open: '#ef4444', in_progress: '#f59e0b', waiting_client: '#8b5cf6', resolved: '#10b981', closed: '#6b7280',
};

const PRIORITY_COLORS: Record<string, string> = { urgent: '#ef4444', high: '#f97316', medium: '#f59e0b', low: '#10b981' };

type MonthlyRevenue = { month: string; revenue: number; invoiced: number };
type LeadByStatus = { name: string; value: number; color: string };
type RecentTicket = { id: string; title: string; status: string; priority: string; client_name: string; created_at: string };

const DashboardCharts = () => {
  const navigate = useNavigate();
  const [monthlyData, setMonthlyData] = useState<MonthlyRevenue[]>([]);
  const [leadsByStatus, setLeadsByStatus] = useState<LeadByStatus[]>([]);
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
    { label: 'Clients actifs', value: kpis.totalClients, icon: '👥', color: 'teal' },
    { label: 'Tickets ouverts', value: kpis.openTickets, icon: '🎫', color: 'coral' },
    { label: 'MRR', value: `${f(kpis.mrr)} €`, icon: '📈', color: 'gold' },
    { label: 'Revenus ce mois', value: `${f(kpis.monthRevenue)} €`, icon: '💰', color: 'purple' },
  ];

  const colorMap: Record<string, { bg: string; border: string }> = {
    teal: { bg: 'rgba(42,157,143,0.12)', border: 'rgba(42,157,143,0.20)' },
    gold: { bg: 'rgba(212,168,67,0.10)', border: 'rgba(212,168,67,0.18)' },
    coral: { bg: 'rgba(231,111,81,0.10)', border: 'rgba(231,111,81,0.16)' },
    purple: { bg: 'rgba(139,109,176,0.10)', border: 'rgba(139,109,176,0.16)' },
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="admin-glass-card" style={{ padding: '10px 14px', borderRadius: 12 }}>
        <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 12, fontWeight: 600, color: TEXT_PRIMARY, marginBottom: 4 }}>{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ fontFamily: "'Outfit', sans-serif", fontSize: 12, color: p.color }}>{p.name}: {f(p.value)} €</p>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpiCards.map((k, i) => {
          const c = colorMap[k.color];
          return (
            <div key={i} className="admin-glass-card">
              <div className="flex items-start gap-4 relative z-[1]">
                <div style={{
                  width: 50, height: 50, borderRadius: 14,
                  background: c.bg, border: `1px solid ${c.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22, flexShrink: 0, backdropFilter: 'blur(8px)',
                }}>{k.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase' as const, color: TEXT_MUTED, marginBottom: 8 }}>{k.label}</div>
                  <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 30, fontWeight: 700, color: TEXT_PRIMARY, lineHeight: 1, letterSpacing: -0.5 }}>{k.value}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 admin-glass-card">
          <h3 className="relative z-[1]" style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, color: TEXT_PRIMARY, margin: '0 0 16px' }}>Revenus & Facturation</h3>
          <div className="relative z-[1]">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="gradRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={TEAL} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={TEAL} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradInv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={PURPLE} stopOpacity={0.2} />
                    <stop offset="100%" stopColor={PURPLE} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.15)" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: TEXT_MUTED, fontFamily: "'Outfit', sans-serif" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: TEXT_MUTED, fontFamily: "'Outfit', sans-serif" }} tickFormatter={(v) => `${v}€`} width={50} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="revenue" name="Encaissé" stroke={TEAL} strokeWidth={2.5} fill="url(#gradRev)" dot={{ r: 3, fill: TEAL, strokeWidth: 0 }} />
                <Area type="monotone" dataKey="invoiced" name="Facturé" stroke={PURPLE} strokeWidth={2} strokeDasharray="5 5" fill="url(#gradInv)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
            <div className="flex items-center justify-center gap-6 mt-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ background: TEAL }} />
                <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, color: TEXT_SECONDARY }}>Encaissé</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-1 rounded" style={{ background: PURPLE }} />
                <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, color: TEXT_SECONDARY }}>Facturé</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tickets by status */}
        <div className="admin-glass-card">
          <h3 className="relative z-[1]" style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, color: TEXT_PRIMARY, margin: '0 0 24px' }}>Tickets par statut</h3>
          <div className="relative z-[1] flex flex-col gap-4">
            {ticketsByStatus.length > 0 ? ticketsByStatus.map((item, i) => {
              const total = ticketsByStatus.reduce((s, t) => s + t.value, 0);
              const pct = total > 0 ? (item.value / total) * 100 : 0;
              return (
                <div key={i}>
                  <div className="flex justify-between mb-2">
                    <span style={{ fontSize: 13, color: TEXT_SECONDARY, fontFamily: "'Outfit', sans-serif" }}>{item.name}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: item.color, fontFamily: "'Outfit', sans-serif" }}>{item.value}</span>
                  </div>
                  <div style={{ height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.20)', overflow: 'hidden' }}>
                    <div style={{
                      width: `${pct}%`, height: '100%', borderRadius: 3,
                      background: `linear-gradient(90deg, ${item.color}, ${item.color}BB)`,
                      boxShadow: `0 0 8px ${item.color}44`,
                    }} />
                  </div>
                </div>
              );
            }) : (
              <div className="flex items-center justify-center h-40" style={{ color: TEXT_MUTED, fontFamily: "'Outfit', sans-serif", fontSize: 13 }}>Aucun ticket</div>
            )}
          </div>
        </div>
      </div>

      {/* Second row: Leads + Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="admin-glass-card">
          <h3 className="relative z-[1]" style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, color: TEXT_PRIMARY, margin: '0 0 8px' }}>Leads par statut</h3>
          <div className="relative z-[1]">
            {leadsByStatus.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={leadsByStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} strokeWidth={0}>
                      {leadsByStatus.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                    </Pie>
                    <Tooltip formatter={(value: number) => value} contentStyle={{ borderRadius: 12, background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.3)', fontFamily: "'Outfit', sans-serif", fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-x-4 gap-y-1 justify-center">
                  {leadsByStatus.map((s, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                      <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, color: TEXT_SECONDARY }}>{s.name} ({s.value})</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-40" style={{ color: TEXT_MUTED, fontFamily: "'Outfit', sans-serif", fontSize: 13 }}>Aucun lead</div>
            )}
          </div>
        </div>

        <div className="admin-glass-card">
          <h3 className="relative z-[1]" style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, color: TEXT_PRIMARY, margin: '0 0 16px' }}>Projets par étape</h3>
          <div className="relative z-[1]">
            {projectsByStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={projectsByStatus} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.15)" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: TEXT_MUTED, fontFamily: "'Outfit', sans-serif" }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: TEXT_MUTED, fontFamily: "'Outfit', sans-serif" }} allowDecimals={false} width={30} />
                  <Tooltip contentStyle={{ borderRadius: 12, background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.3)', fontFamily: "'Outfit', sans-serif", fontSize: 12 }} />
                  <Bar dataKey="value" name="Projets" radius={[8, 8, 0, 0]}>
                    {projectsByStatus.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-40" style={{ color: TEXT_MUTED, fontFamily: "'Outfit', sans-serif", fontSize: 13 }}>Aucun projet</div>
            )}
          </div>
        </div>
      </div>

      {/* 5 derniers tickets */}
      <div className="admin-glass-card">
        <div className="flex items-center justify-between mb-5 relative z-[1]">
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, color: TEXT_PRIMARY, margin: 0 }}>Derniers tickets</h3>
          <button onClick={() => navigate('/admin/tickets')} className="admin-glass-btn-secondary" style={{ padding: '8px 18px', fontSize: 12 }}>Voir tout</button>
        </div>
        <div className="relative z-[1]">
          {/* Table header */}
          <div className="hidden md:grid gap-0 px-5 pb-3" style={{ gridTemplateColumns: '2fr 1.2fr 1fr 0.8fr 0.8fr', borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
            {['Titre', 'Client', 'Statut', 'Priorité', 'Date'].map((h, i) => (
              <span key={i} style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1.2, textTransform: 'uppercase' as const, color: TEXT_MUTED, fontFamily: "'Outfit', sans-serif" }}>{h}</span>
            ))}
          </div>
          {recentTickets.length > 0 ? recentTickets.map(t => (
            <div
              key={t.id}
              onClick={() => navigate('/admin/tickets')}
              className="grid items-center gap-0 px-5 py-3 cursor-pointer transition-colors"
              style={{ gridTemplateColumns: '2fr 1.2fr 1fr 0.8fr 0.8fr', borderBottom: '1px solid rgba(255,255,255,0.15)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(42,157,143,0.04)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 500, color: TEXT_PRIMARY }}>{t.title}</span>
              <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, color: TEXT_SECONDARY }}>{t.client_name}</span>
              <span className="admin-status-badge" style={{
                background: `${ticketStatusColors[t.status] || '#999'}20`,
                color: ticketStatusColors[t.status] || '#999', width: 'fit-content',
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: ticketStatusColors[t.status], boxShadow: `0 0 6px ${ticketStatusColors[t.status]}55` }} />
                {ticketStatusLabels[t.status] || t.status}
              </span>
              <span style={{ fontSize: 12, fontWeight: 600, fontFamily: "'Outfit', sans-serif", color: PRIORITY_COLORS[t.priority] || TEXT_MUTED }}>{t.priority}</span>
              <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, color: TEXT_MUTED }}>{new Date(t.created_at).toLocaleDateString('fr-FR')}</span>
            </div>
          )) : (
            <div className="text-center py-8" style={{ color: TEXT_MUTED, fontFamily: "'Outfit', sans-serif", fontSize: 13 }}>Aucun ticket</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardCharts;
