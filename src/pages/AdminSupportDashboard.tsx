import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Users, Ticket, TrendingUp, DollarSign, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const TICKET_STATUS_COLORS: Record<string, string> = {
  open: '#ef4444',
  in_progress: '#f59e0b',
  waiting_client: '#8b5cf6',
  resolved: '#10b981',
  closed: '#6b7280',
};
const TICKET_STATUS_LABELS: Record<string, string> = {
  open: 'Ouvert',
  in_progress: 'En cours',
  waiting_client: 'Attente client',
  resolved: 'Résolu',
  closed: 'Fermé',
};

const AdminSupportDashboard = () => {
  const navigate = useNavigate();
  const [kpis, setKpis] = useState({ activeClients: 0, openTickets: 0, mrr: 0, monthRevenue: 0 });
  const [revenueChart, setRevenueChart] = useState<any[]>([]);
  const [ticketDonut, setTicketDonut] = useState<any[]>([]);
  const [recentTickets, setRecentTickets] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<{ overdue: any[]; urgent: any[] }>({ overdue: [], urgent: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const [
      { data: clients },
      { data: contracts },
      { data: invoices },
      { data: tickets },
      { data: ticketClients },
    ] = await Promise.all([
      supabase.from('clients').select('id, status, subscription_status'),
      supabase.from('contracts').select('monthly_price, status'),
      supabase.from('invoices').select('id, client_id, status, total, amount_paid, issue_date, paid_at'),
      supabase.from('support_tickets').select('id, title, status, priority, category, created_at, client_id'),
      supabase.from('clients').select('id, business_name'),
    ]);

    const clientMap = Object.fromEntries((ticketClients || []).map(c => [c.id, c.business_name]));

    // KPIs
    const activeClients = (clients || []).filter(c => c.status === 'active').length;
    const openTickets = (tickets || []).filter(t => t.status === 'open').length;
    const mrr = (contracts || []).filter(c => c.status === 'active').reduce((s, c) => s + Number(c.monthly_price || 0), 0);
    const monthRevenue = (invoices || []).filter(i => i.status === 'paid' && i.paid_at && i.paid_at >= monthStart).reduce((s, i) => s + Number(i.amount_paid || 0), 0);
    setKpis({ activeClients, openTickets, mrr, monthRevenue });

    // Revenue chart (6 months)
    const months: any[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
      const monthInvoices = (invoices || []).filter(inv => inv.status === 'paid' && inv.paid_at && inv.paid_at.startsWith(key));
      months.push({ name: label, setup: 0, recurring: 0 });
      // Simple split: we can't distinguish type easily, so we show total
      months[months.length - 1].total = monthInvoices.reduce((s, inv) => s + Number(inv.amount_paid || 0), 0);
    }
    setRevenueChart(months);

    // Ticket donut
    const statusCounts: Record<string, number> = {};
    (tickets || []).forEach(t => { statusCounts[t.status] = (statusCounts[t.status] || 0) + 1; });
    setTicketDonut(Object.entries(statusCounts).map(([status, count]) => ({
      name: TICKET_STATUS_LABELS[status] || status,
      value: count,
      color: TICKET_STATUS_COLORS[status] || '#999',
    })));

    // Recent tickets
    const recent = (tickets || [])
      .filter(t => t.status === 'open')
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)
      .map(t => ({ ...t, client_name: clientMap[t.client_id] || 'Inconnu' }));
    setRecentTickets(recent);

    // Alerts
    const overdueInv = (invoices || []).filter(i => i.status === 'overdue' as any).map(i => ({
      ...i, client_name: clientMap[i.client_id] || 'Inconnu',
    }));
    const urgentTickets = (tickets || []).filter(t => t.priority === 'urgent' && !['resolved', 'closed'].includes(t.status)).map(t => ({
      ...t, client_name: clientMap[t.client_id] || 'Inconnu',
    }));
    setAlerts({ overdue: overdueInv, urgent: urgentTickets });

    setLoading(false);
  };

  const fmt = (n: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);
  const priorityColor = (p: string) => ({ urgent: '#ef4444', high: '#f97316', medium: '#f59e0b', low: '#10b981' }[p] || '#999');

  if (loading) return <div className="p-8 text-center" style={{ fontFamily: "'Outfit', sans-serif", color: 'rgba(242,237,228,0.28)' }}>Chargement...</div>;

  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto space-y-6">
      <h1 className="admin-page-title">Dashboard Support</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Clients actifs', value: kpis.activeClients, icon: Users, color: '#2DD4B8' },
          { label: 'Tickets ouverts', value: kpis.openTickets, icon: Ticket, color: '#ef4444' },
          { label: 'MRR', value: fmt(kpis.mrr), icon: TrendingUp, color: '#A78BDB' },
          { label: 'Revenus ce mois', value: fmt(kpis.monthRevenue), icon: DollarSign, color: '#d4a55a' },
        ].map((k, i) => (
          <div key={i} className="admin-glass-card" style={{ padding: 20 }}>
            <div className="flex items-center gap-2 mb-2">
              <k.icon size={16} style={{ color: k.color }} />
              <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, color: 'rgba(242,237,228,0.28)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{k.label}</span>
            </div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="admin-glass-card" style={{ padding: 20 }}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, color: '#F2EDE4', marginBottom: 16 }}>Revenus mensuels</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={revenueChart}>
              <XAxis dataKey="name" tick={{ fontSize: 11, fontFamily: "'Outfit', sans-serif" }} />
              <YAxis tick={{ fontSize: 11, fontFamily: "'Outfit', sans-serif" }} />
              <Tooltip formatter={(v: number) => fmt(v)} />
              <Bar dataKey="total" fill="#2DD4B8" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Ticket Donut */}
        <div className="admin-glass-card" style={{ padding: 20 }}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, color: '#F2EDE4', marginBottom: 16 }}>Tickets par statut</h3>
          {ticketDonut.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={ticketDonut} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
                  {ticketDonut.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
                </Pie>
                <Legend wrapperStyle={{ fontSize: 11, fontFamily: "'Outfit', sans-serif" }} />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, color: 'rgba(242,237,228,0.28)', textAlign: 'center', paddingTop: 60 }}>Aucun ticket</p>
          )}
        </div>
      </div>

      {/* Recent tickets + Alerts */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent tickets */}
        <div className="admin-glass-card" style={{ padding: 20 }}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, color: '#F2EDE4', marginBottom: 16 }}>Derniers tickets ouverts</h3>
          {recentTickets.length === 0 ? (
            <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, color: 'rgba(242,237,228,0.28)' }}>Aucun ticket ouvert</p>
          ) : (
            <div className="space-y-3">
              {recentTickets.map(t => (
                <div key={t.id} className="flex items-center gap-3 cursor-pointer p-3 rounded-xl transition-colors" style={{}} onMouseEnter={e => e.currentTarget.style.background = 'rgba(42,157,143,0.04)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'} onClick={() => navigate('/admin/tickets')}>
                  <div style={{ width: 8, height: 8, borderRadius: 99, background: priorityColor(t.priority), flexShrink: 0 }} />
                  <div className="flex-1 min-w-0">
                    <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 600, color: '#F2EDE4' }} className="truncate">{t.title}</div>
                    <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, color: 'rgba(242,237,228,0.28)' }}>{t.client_name}</div>
                  </div>
                  <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: 'rgba(242,237,228,0.28)' }}>
                    {new Date(t.created_at).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Alerts */}
        <div className="admin-glass-card" style={{ padding: 20 }}>
          <h3 className="flex items-center gap-2" style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, color: '#F2EDE4', marginBottom: 16 }}>
            <AlertTriangle size={16} style={{ color: '#F07067' }} /> Alertes
          </h3>
          {alerts.overdue.length === 0 && alerts.urgent.length === 0 ? (
            <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, color: 'rgba(242,237,228,0.28)' }}>Aucune alerte 🎉</p>
          ) : (
            <div className="space-y-2">
              {alerts.overdue.map(inv => (
                <div key={inv.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(239,68,68,0.06)' }}>
                  <DollarSign size={14} style={{ color: '#ef4444' }} />
                  <div className="flex-1">
                    <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 12, color: '#ef4444', fontWeight: 600 }}>Facture en retard</span>
                    <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 12, color: 'rgba(242,237,228,0.55)', marginLeft: 8 }}>{inv.client_name} · {fmt(inv.total)}</span>
                  </div>
                </div>
              ))}
              {alerts.urgent.map(t => (
                <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(239,68,68,0.06)' }}>
                  <Ticket size={14} style={{ color: '#ef4444' }} />
                  <div className="flex-1">
                    <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 12, color: '#ef4444', fontWeight: 600 }}>Ticket urgent</span>
                    <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 12, color: 'rgba(242,237,228,0.55)', marginLeft: 8 }}>{t.client_name} · {t.title}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSupportDashboard;
