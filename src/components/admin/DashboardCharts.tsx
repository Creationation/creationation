import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { TrendingUp, Users, FolderKanban, Receipt, Ticket, CalendarDays } from 'lucide-react';

const COLORS = ['#0d8a6f', '#7c5cbf', '#4da6d9', '#d4a55a', '#e8735a', '#3B82F6'];

type MonthlyRevenue = { month: string; revenue: number; invoiced: number };
type LeadByStatus = { name: string; value: number; color: string };

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

type RecentTicket = { id: string; title: string; status: string; priority: string; client_name: string; created_at: string };

const DashboardCharts = () => {
  const navigate = useNavigate();
  const [monthlyData, setMonthlyData] = useState<MonthlyRevenue[]>([]);
  const [leadsByStatus, setLeadsByStatus] = useState<LeadByStatus[]>([]);
  const [projectsByStatus, setProjectsByStatus] = useState<{ name: string; value: number; color: string }[]>([]);
  const [ticketsByStatus, setTicketsByStatus] = useState<{ name: string; value: number; color: string }[]>([]);
  const [recentTickets, setRecentTickets] = useState<RecentTicket[]>([]);
  const [kpis, setKpis] = useState({
    totalClients: 0, openTickets: 0, mrr: 0, monthRevenue: 0,
  });

  const fetchAll = useCallback(async () => {
    const [
      { data: payments },
      { data: invoices },
      { data: leads },
      { data: projects },
      { data: clients },
      { data: tickets },
      { data: clientsList },
      { data: contracts },
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

    // Monthly revenue (last 6 months)
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

    // Leads by status
    const leadGroups: Record<string, number> = {};
    (leads || []).forEach((l: any) => { leadGroups[l.status] = (leadGroups[l.status] || 0) + 1; });
    setLeadsByStatus(
      Object.entries(leadGroups).map(([k, v]) => ({ name: statusLabels[k] || k, value: v, color: statusColors[k] || '#6B7280' }))
        .sort((a, b) => b.value - a.value)
    );

    // Projects by status
    const projGroups: Record<string, number> = {};
    (projects || []).forEach((p: any) => { projGroups[p.status] = (projGroups[p.status] || 0) + 1; });
    setProjectsByStatus(
      Object.entries(projGroups).map(([k, v]) => ({ name: projectStatusLabels[k] || k, value: v, color: projectStatusColors[k] || '#6B7280' }))
    );

    // Tickets by status
    const ticketGroups: Record<string, number> = {};
    (tickets || []).forEach((t: any) => { ticketGroups[t.status] = (ticketGroups[t.status] || 0) + 1; });
    setTicketsByStatus(
      Object.entries(ticketGroups).map(([k, v]) => ({ name: ticketStatusLabels[k] || k, value: v, color: ticketStatusColors[k] || '#6B7280' }))
    );

    // Recent 5 tickets
    setRecentTickets(
      (tickets || []).slice(0, 5).map((t: any) => ({
        id: t.id, title: t.title, status: t.status, priority: t.priority,
        client_name: clientMap[t.client_id] || 'Inconnu', created_at: t.created_at,
      }))
    );

    // KPIs: clients actifs, tickets ouverts, MRR (from contracts), revenus du mois
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
    { label: 'Clients actifs', value: kpis.totalClients, icon: Users, color: '#4da6d9', bg: 'rgba(77,166,217,0.08)' },
    { label: 'Tickets ouverts', value: kpis.openTickets, icon: Ticket, color: '#ef4444', bg: 'rgba(239,68,68,0.08)' },
    { label: 'MRR', value: `${f(kpis.mrr)} €`, icon: Receipt, color: '#7c5cbf', bg: 'rgba(124,92,191,0.08)' },
    { label: 'Revenus du mois', value: `${f(kpis.monthRevenue)} €`, icon: CalendarDays, color: '#0d8a6f', bg: 'rgba(13,138,111,0.08)' },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: 'white', border: '1px solid var(--glass-border)', borderRadius: 12, padding: '10px 14px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
        <p style={{ fontFamily: 'var(--font-b)', fontSize: 12, fontWeight: 600, color: 'var(--charcoal)', marginBottom: 4 }}>{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ fontFamily: 'var(--font-b)', fontSize: 12, color: p.color }}>
            {p.name}: {f(p.value)} €
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards — 4 cards as specified */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {kpiCards.map((k, i) => (
          <div key={i} className="relative overflow-hidden" style={{
            padding: '16px 14px', background: 'white', borderRadius: 20,
            border: '1px solid var(--glass-border)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}>
            <div className="absolute top-0 right-0 w-16 h-16 rounded-full" style={{ background: k.bg, transform: 'translate(30%, -30%)' }} />
            <k.icon size={18} style={{ color: k.color, marginBottom: 8 }} />
            <p style={{ fontFamily: 'var(--font-h)', fontSize: 22, color: 'var(--charcoal)', margin: 0, lineHeight: 1.1 }}>{k.value}</p>
            <p style={{ fontFamily: 'var(--font-b)', fontSize: 11, color: 'var(--text-light)', marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>{k.label}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue Chart */}
        <div className="lg:col-span-2" style={{
          background: 'white', borderRadius: 20, border: '1px solid var(--glass-border)',
          padding: '20px 20px 10px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}>
          <h3 style={{ fontFamily: 'var(--font-h)', fontSize: 16, color: 'var(--charcoal)', margin: '0 0 16px' }}>
            Revenus & Facturation
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="gradRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0d8a6f" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#0d8a6f" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradInv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7c5cbf" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#7c5cbf" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#999', fontFamily: 'var(--font-b)' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#999', fontFamily: 'var(--font-b)' }} tickFormatter={(v) => `${v}€`} width={50} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="revenue" name="Encaissé" stroke="#0d8a6f" strokeWidth={2.5} fill="url(#gradRev)" dot={{ r: 3, fill: '#0d8a6f', strokeWidth: 0 }} />
              <Area type="monotone" dataKey="invoiced" name="Facturé" stroke="#7c5cbf" strokeWidth={2} strokeDasharray="5 5" fill="url(#gradInv)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex items-center justify-center gap-6 mt-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ background: '#0d8a6f' }} />
              <span style={{ fontFamily: 'var(--font-b)', fontSize: 11, color: 'var(--text-light)' }}>Encaissé</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-1 rounded" style={{ background: '#7c5cbf' }} />
              <span style={{ fontFamily: 'var(--font-b)', fontSize: 11, color: 'var(--text-light)' }}>Facturé</span>
            </div>
          </div>
        </div>

        {/* Tickets by status Pie */}
        <div style={{
          background: 'white', borderRadius: 20, border: '1px solid var(--glass-border)',
          padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}>
          <h3 style={{ fontFamily: 'var(--font-h)', fontSize: 16, color: 'var(--charcoal)', margin: '0 0 8px' }}>
            Tickets par statut
          </h3>
          {ticketsByStatus.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={ticketsByStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} strokeWidth={0}>
                    {ticketsByStatus.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => value} contentStyle={{ borderRadius: 12, border: '1px solid var(--glass-border)', fontFamily: 'var(--font-b)', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-x-4 gap-y-1 justify-center">
                {ticketsByStatus.map((s, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                    <span style={{ fontFamily: 'var(--font-b)', fontSize: 11, color: 'var(--text-light)' }}>{s.name} ({s.value})</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-40" style={{ color: 'var(--text-light)', fontFamily: 'var(--font-b)', fontSize: 13 }}>Aucun ticket</div>
          )}
        </div>
      </div>

      {/* Second row: Leads + Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Leads Pie */}
        <div style={{
          background: 'white', borderRadius: 20, border: '1px solid var(--glass-border)',
          padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}>
          <h3 style={{ fontFamily: 'var(--font-h)', fontSize: 16, color: 'var(--charcoal)', margin: '0 0 8px' }}>
            Leads par statut
          </h3>
          {leadsByStatus.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={leadsByStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} strokeWidth={0}>
                    {leadsByStatus.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => value} contentStyle={{ borderRadius: 12, border: '1px solid var(--glass-border)', fontFamily: 'var(--font-b)', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-x-4 gap-y-1 justify-center">
                {leadsByStatus.map((s, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                    <span style={{ fontFamily: 'var(--font-b)', fontSize: 11, color: 'var(--text-light)' }}>{s.name} ({s.value})</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-40" style={{ color: 'var(--text-light)', fontFamily: 'var(--font-b)', fontSize: 13 }}>Aucun lead</div>
          )}
        </div>

        {/* Projects Bar Chart */}
        <div style={{
          background: 'white', borderRadius: 20, border: '1px solid var(--glass-border)',
          padding: '20px 20px 10px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}>
          <h3 style={{ fontFamily: 'var(--font-h)', fontSize: 16, color: 'var(--charcoal)', margin: '0 0 16px' }}>
            Projets par étape
          </h3>
          {projectsByStatus.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={projectsByStatus} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#999', fontFamily: 'var(--font-b)' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#999', fontFamily: 'var(--font-b)' }} allowDecimals={false} width={30} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid var(--glass-border)', fontFamily: 'var(--font-b)', fontSize: 12 }} />
                <Bar dataKey="value" name="Projets" radius={[8, 8, 0, 0]}>
                  {projectsByStatus.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-40" style={{ color: 'var(--text-light)', fontFamily: 'var(--font-b)', fontSize: 13 }}>Aucun projet</div>
          )}
        </div>
      </div>

      {/* 5 derniers tickets */}
      <div style={{
        background: 'white', borderRadius: 20, border: '1px solid var(--glass-border)',
        padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}>
        <div className="flex items-center justify-between mb-4">
          <h3 style={{ fontFamily: 'var(--font-h)', fontSize: 16, color: 'var(--charcoal)', margin: 0 }}>
            Derniers tickets
          </h3>
          <button
            onClick={() => navigate('/admin/tickets')}
            style={{ fontFamily: 'var(--font-b)', fontSize: 12, color: 'var(--teal)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
          >
            Voir tous →
          </button>
        </div>
        {recentTickets.length > 0 ? (
          <div className="space-y-2">
            {recentTickets.map(t => (
              <div
                key={t.id}
                onClick={() => navigate('/admin/tickets')}
                className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer hover:shadow-sm transition-shadow"
                style={{ border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.01)' }}
              >
                <div style={{ flex: 1 }}>
                  <span style={{ fontFamily: 'var(--font-b)', fontSize: 13, fontWeight: 600, color: 'var(--charcoal)' }}>{t.title}</span>
                  <span style={{ fontFamily: 'var(--font-b)', fontSize: 12, color: 'var(--text-light)', marginLeft: 8 }}>{t.client_name}</span>
                </div>
                <span style={{
                  padding: '2px 10px', borderRadius: 99, fontSize: 10, fontWeight: 600,
                  fontFamily: 'var(--font-b)',
                  background: `${ticketStatusColors[t.status] || '#999'}18`,
                  color: ticketStatusColors[t.status] || '#999',
                }}>{ticketStatusLabels[t.status] || t.status}</span>
                <span style={{
                  padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 600,
                  fontFamily: 'var(--font-b)',
                  background: `${PRIORITY_COLORS[t.priority] || '#999'}18`,
                  color: PRIORITY_COLORS[t.priority] || '#999',
                }}>{t.priority}</span>
                <span style={{ fontFamily: 'var(--font-m)', fontSize: 10, color: 'var(--text-light)' }}>
                  {new Date(t.created_at).toLocaleDateString('fr-FR')}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8" style={{ color: 'var(--text-light)', fontFamily: 'var(--font-b)', fontSize: 13 }}>Aucun ticket</div>
        )}
      </div>
    </div>
  );
};

export default DashboardCharts;
