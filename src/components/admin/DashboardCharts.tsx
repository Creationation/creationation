import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { TrendingUp, Users, FolderKanban, Receipt, Flame, Zap } from 'lucide-react';

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

const DashboardCharts = () => {
  const [monthlyData, setMonthlyData] = useState<MonthlyRevenue[]>([]);
  const [leadsByStatus, setLeadsByStatus] = useState<LeadByStatus[]>([]);
  const [projectsByStatus, setProjectsByStatus] = useState<{ name: string; value: number; color: string }[]>([]);
  const [kpis, setKpis] = useState({
    totalRevenue: 0, mrr: 0, activeProjects: 0, totalClients: 0,
    hotProspects: 0, responseRate: 0,
  });

  const fetchAll = useCallback(async () => {
    const [
      { data: payments },
      { data: invoices },
      { data: leads },
      { data: projects },
      { data: clients },
      { data: prospects },
    ] = await Promise.all([
      supabase.from('client_payments').select('amount,payment_date,payment_type'),
      supabase.from('invoices').select('total,issue_date,status,amount_paid,due_date'),
      supabase.from('leads').select('status,created_at'),
      supabase.from('projects').select('status'),
      supabase.from('clients').select('id,status,monthly_amount'),
      supabase.from('prospects').select('score,status,email_count'),
    ]);

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

    // KPIs
    const totalRev = (payments || []).reduce((s: number, p: any) => s + Number(p.amount || 0), 0);
    const activeClients = (clients || []).filter((c: any) => c.status === 'active');
    const mrr = activeClients.reduce((s: number, c: any) => s + Number(c.monthly_amount || 0), 0);
    const activeProjects = (projects || []).filter((p: any) => !['delivered', 'maintenance'].includes(p.status)).length;
    const hot = (prospects || []).filter((p: any) => (p.score || 0) > 70).length;
    const emailed = (prospects || []).filter((p: any) => (p.email_count || 0) > 0);
    const replied = (prospects || []).filter((p: any) => p.status === 'replied').length;
    const rate = emailed.length > 0 ? Math.round((replied / emailed.length) * 100) : 0;

    setKpis({
      totalRevenue: Math.round(totalRev),
      mrr: Math.round(mrr),
      activeProjects,
      totalClients: (clients || []).length,
      hotProspects: hot,
      responseRate: rate,
    });
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const f = (n: number) => n.toLocaleString('fr-FR');

  const kpiCards = [
    { label: 'Revenu total', value: `${f(kpis.totalRevenue)} €`, icon: TrendingUp, color: '#0d8a6f', bg: 'rgba(13,138,111,0.08)' },
    { label: 'MRR', value: `${f(kpis.mrr)} €`, icon: Receipt, color: '#7c5cbf', bg: 'rgba(124,92,191,0.08)' },
    { label: 'Projets actifs', value: kpis.activeProjects, icon: FolderKanban, color: '#3B82F6', bg: 'rgba(59,130,246,0.08)' },
    { label: 'Clients', value: kpis.totalClients, icon: Users, color: '#4da6d9', bg: 'rgba(77,166,217,0.08)' },
    { label: 'Prospects chauds', value: kpis.hotProspects, icon: Flame, color: '#e8735a', bg: 'rgba(232,115,90,0.08)' },
    { label: 'Taux réponse', value: `${kpis.responseRate}%`, icon: Zap, color: '#d4a55a', bg: 'rgba(212,165,90,0.08)' },
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
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
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
      </div>

      {/* Projects Bar Chart */}
      {projectsByStatus.length > 0 && (
        <div style={{
          background: 'white', borderRadius: 20, border: '1px solid var(--glass-border)',
          padding: '20px 20px 10px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}>
          <h3 style={{ fontFamily: 'var(--font-h)', fontSize: 16, color: 'var(--charcoal)', margin: '0 0 16px' }}>
            Projets par étape
          </h3>
          <ResponsiveContainer width="100%" height={160}>
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
        </div>
      )}
    </div>
  );
};

export default DashboardCharts;
