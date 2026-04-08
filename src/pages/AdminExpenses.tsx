import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Search, X, TrendingUp, TrendingDown, Wallet, Activity } from 'lucide-react';

const TEXT_PRIMARY = '#1A2332';
const TEXT_SECONDARY = 'rgba(26,35,50,0.55)';
const TEXT_MUTED = 'rgba(26,35,50,0.30)';
const TEAL = '#2A9D8F';
const CORAL = '#E76F51';

const CATEGORIES = ['hosting', 'domain', 'api_service', 'software', 'design', 'marketing', 'legal', 'other'] as const;
const FREQUENCIES = ['one_time', 'monthly', 'yearly'] as const;
const STATUSES = ['active', 'paused', 'cancelled'] as const;

const CAT_LABELS: Record<string, { label: string; color: string }> = {
  hosting: { label: 'Hosting', color: '#3b82f6' },
  domain: { label: 'Domaine', color: '#8b5cf6' },
  api_service: { label: 'API / Service', color: '#f59e0b' },
  software: { label: 'Software', color: TEAL },
  design: { label: 'Design', color: '#ec4899' },
  marketing: { label: 'Marketing', color: '#ef4444' },
  legal: { label: 'Juridique', color: '#6366f1' },
  other: { label: 'Autre', color: TEXT_SECONDARY },
};
const FREQ_LABELS: Record<string, string> = { one_time: 'Ponctuel', monthly: 'Mensuel', yearly: 'Annuel' };
const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  active: { label: 'Actif', color: TEAL },
  paused: { label: 'En pause', color: '#D4A843' },
  cancelled: { label: 'Annulé', color: CORAL },
};

type Expense = {
  id: string; client_id: string | null; project_id: string | null;
  category: string; name: string; amount: number; frequency: string;
  is_billable: boolean; status: string; start_date: string;
  end_date: string | null; notes: string | null; created_at: string;
};
type Client = { id: string; business_name: string };
type Project = { id: string; title: string; client_id: string };

const fmt = (n: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);

const AdminExpenses = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [clientFilter, setClientFilter] = useState('all');
  const [freqFilter, setFreqFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);

  // Form state
  const [form, setForm] = useState({
    name: '', category: 'other' as string, client_id: '' as string,
    project_id: '' as string, amount: 0, frequency: 'monthly' as string,
    is_billable: false, status: 'active' as string, start_date: new Date().toISOString().split('T')[0],
    end_date: '', notes: '',
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [{ data: exp }, { data: cl }, { data: pr }] = await Promise.all([
      supabase.from('expenses').select('*').order('created_at', { ascending: false }),
      supabase.from('clients').select('id, business_name').order('business_name'),
      supabase.from('projects').select('id, title, client_id'),
    ]);
    setExpenses((exp || []) as Expense[]);
    setClients((cl || []) as Client[]);
    setProjects((pr || []) as Project[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // KPIs
  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const monthlyExpenses = useMemo(() => {
    return expenses.filter(e => e.status === 'active').reduce((sum, e) => {
      if (e.frequency === 'monthly') return sum + e.amount;
      if (e.frequency === 'yearly') return sum + e.amount / 12;
      if (e.frequency === 'one_time' && e.start_date.startsWith(thisMonth)) return sum + e.amount;
      return sum;
    }, 0);
  }, [expenses, thisMonth]);

  const clientsWithExpenses = useMemo(() => {
    const ids = new Set(expenses.filter(e => e.client_id && e.status === 'active').map(e => e.client_id));
    return ids.size;
  }, [expenses]);

  const avgPerClient = clientsWithExpenses > 0 ? monthlyExpenses / clientsWithExpenses : 0;
  const activeServices = expenses.filter(e => e.status === 'active' && e.frequency !== 'one_time').length;

  // Revenue for margin
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  useEffect(() => {
    const fetchRevenue = async () => {
      const startOfMonth = `${thisMonth}-01`;
      const { data } = await supabase.from('invoices').select('total').eq('status', 'paid').gte('paid_at', startOfMonth);
      setMonthlyRevenue((data || []).reduce((s: number, i: any) => s + (i.total || 0), 0));
    };
    fetchRevenue();
  }, [thisMonth]);

  const margin = monthlyRevenue - monthlyExpenses;

  // Filter
  const filtered = expenses.filter(e => {
    if (catFilter !== 'all' && e.category !== catFilter) return false;
    if (clientFilter === 'general' && e.client_id) return false;
    if (clientFilter !== 'all' && clientFilter !== 'general' && e.client_id !== clientFilter) return false;
    if (freqFilter !== 'all' && e.frequency !== freqFilter) return false;
    if (statusFilter !== 'all' && e.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return e.name.toLowerCase().includes(q) || (e.notes || '').toLowerCase().includes(q);
    }
    return true;
  });

  const clientName = (id: string | null) => {
    if (!id) return 'Général';
    return clients.find(c => c.id === id)?.business_name || '—';
  };

  const openForm = (expense?: Expense) => {
    if (expense) {
      setEditing(expense);
      setForm({
        name: expense.name, category: expense.category, client_id: expense.client_id || '',
        project_id: expense.project_id || '', amount: expense.amount, frequency: expense.frequency,
        is_billable: expense.is_billable, status: expense.status, start_date: expense.start_date,
        end_date: expense.end_date || '', notes: expense.notes || '',
      });
    } else {
      setEditing(null);
      setForm({
        name: '', category: 'other', client_id: '', project_id: '', amount: 0,
        frequency: 'monthly', is_billable: false, status: 'active',
        start_date: new Date().toISOString().split('T')[0], end_date: '', notes: '',
      });
    }
    setShowForm(true);
  };

  const saveExpense = async () => {
    if (!form.name.trim()) { toast.error('Nom requis'); return; }
    const payload = {
      name: form.name, category: form.category as any, amount: form.amount,
      frequency: form.frequency as any, is_billable: form.is_billable,
      status: form.status as any, start_date: form.start_date,
      end_date: form.end_date || null, notes: form.notes || null,
      client_id: form.client_id || null, project_id: form.project_id || null,
    };
    if (editing) {
      const { error } = await supabase.from('expenses').update(payload as any).eq('id', editing.id);
      if (error) { toast.error('Erreur'); console.error(error); return; }
      toast.success('Dépense mise à jour');
    } else {
      const { error } = await supabase.from('expenses').insert(payload as any);
      if (error) { toast.error('Erreur'); console.error(error); return; }
      toast.success('Dépense ajoutée');
    }
    setShowForm(false);
    fetchData();
  };

  const deleteExpense = async (id: string) => {
    await supabase.from('expenses').delete().eq('id', id);
    toast.success('Dépense supprimée');
    fetchData();
  };

  // Rentabilité data
  const profitability = useMemo(() => {
    const clientMap: Record<string, { name: string; revenue: number; expenses: number }> = {};
    clients.forEach(c => { clientMap[c.id] = { name: c.business_name, revenue: 0, expenses: 0 }; });
    // Client expenses
    expenses.filter(e => e.status === 'active' && e.client_id).forEach(e => {
      if (!clientMap[e.client_id!]) return;
      if (e.frequency === 'monthly') clientMap[e.client_id!].expenses += e.amount;
      else if (e.frequency === 'yearly') clientMap[e.client_id!].expenses += e.amount / 12;
    });
    // General expenses
    const generalExpenses = expenses.filter(e => e.status === 'active' && !e.client_id).reduce((s, e) => {
      if (e.frequency === 'monthly') return s + e.amount;
      if (e.frequency === 'yearly') return s + e.amount / 12;
      return s;
    }, 0);
    return { clientMap, generalExpenses };
  }, [expenses, clients]);

  // Fetch contracts for revenue per client
  const [contractRevenues, setContractRevenues] = useState<Record<string, number>>({});
  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from('contracts').select('client_id, monthly_price').eq('status', 'active');
      const map: Record<string, number> = {};
      (data || []).forEach((c: any) => { map[c.client_id] = (map[c.client_id] || 0) + (c.monthly_price || 0); });
      setContractRevenues(map);
    };
    fetch();
  }, []);

  const filteredProjects = projects.filter(p => !form.client_id || p.client_id === form.client_id);

  if (loading) return <div className="p-8 text-center" style={{ color: TEXT_MUTED }}>Chargement...</div>;

  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto space-y-6" style={{ fontFamily: "'Outfit', sans-serif" }}>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="admin-page-title">Dépenses</h1>
        <button onClick={() => openForm()} className="admin-glass-btn" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Plus size={14} /> Nouvelle dépense
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Dépenses ce mois', value: fmt(monthlyExpenses), icon: TrendingDown, color: CORAL },
          { label: 'Moyenne / client', value: fmt(avgPerClient), icon: Wallet, color: '#8b5cf6' },
          { label: 'Marge brute ce mois', value: fmt(margin), icon: TrendingUp, color: margin >= 0 ? TEAL : CORAL },
          { label: 'Services actifs', value: String(activeServices), icon: Activity, color: '#3b82f6' },
        ].map((kpi, i) => (
          <div key={i} className="admin-glass-card p-5">
            <div className="relative z-[1] flex items-center gap-3">
              <div style={{ width: 40, height: 40, borderRadius: 12, background: `${kpi.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <kpi.icon size={18} color={kpi.color} />
              </div>
              <div>
                <p style={{ fontSize: 10, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>{kpi.label}</p>
                <p style={{ fontSize: 22, fontWeight: 700, color: TEXT_PRIMARY, fontFamily: "'Playfair Display', serif" }}>{kpi.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[180px] admin-glass-input" style={{ padding: '8px 14px' }}>
          <Search size={14} style={{ color: TEXT_MUTED }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13, background: 'transparent', color: TEXT_PRIMARY }} />
        </div>
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="admin-glass-input" style={{ cursor: 'pointer' }}>
          <option value="all">Toutes catégories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{CAT_LABELS[c].label}</option>)}
        </select>
        <select value={clientFilter} onChange={e => setClientFilter(e.target.value)} className="admin-glass-input" style={{ cursor: 'pointer' }}>
          <option value="all">Tous clients</option>
          <option value="general">Frais généraux</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.business_name}</option>)}
        </select>
        <select value={freqFilter} onChange={e => setFreqFilter(e.target.value)} className="admin-glass-input" style={{ cursor: 'pointer' }}>
          <option value="all">Fréquence</option>
          {FREQUENCIES.map(f => <option key={f} value={f}>{FREQ_LABELS[f]}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="admin-glass-input" style={{ cursor: 'pointer' }}>
          <option value="all">Statut</option>
          {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s].label}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="admin-glass-table">
        <div className="overflow-x-auto">
          <table className="w-full" style={{ fontSize: 13 }}>
            <thead><tr style={{ borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
              {['Nom', 'Catégorie', 'Client', 'Montant', 'Fréquence', 'Facturable', 'Statut', ''].map(h => (
                <th key={h} className="text-left px-4 py-3" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.2, color: TEXT_MUTED, fontWeight: 600 }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {filtered.map(e => (
                <tr key={e.id} className="cursor-pointer" onClick={() => openForm(e)}
                    onMouseEnter={ev => ev.currentTarget.style.background = 'rgba(42,157,143,0.04)'}
                    onMouseLeave={ev => ev.currentTarget.style.background = 'transparent'}
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <td className="px-4 py-3 font-medium" style={{ color: TEXT_PRIMARY }}>{e.name}</td>
                  <td className="px-4 py-3">
                    <span className="admin-status-badge" style={{ background: `${CAT_LABELS[e.category]?.color || '#999'}20`, color: CAT_LABELS[e.category]?.color || '#999' }}>
                      {CAT_LABELS[e.category]?.label || e.category}
                    </span>
                  </td>
                  <td className="px-4 py-3" style={{ color: e.client_id ? TEXT_PRIMARY : TEXT_MUTED }}>{clientName(e.client_id)}</td>
                  <td className="px-4 py-3" style={{ fontWeight: 600, color: TEXT_PRIMARY }}>{fmt(e.amount)}</td>
                  <td className="px-4 py-3" style={{ color: TEXT_SECONDARY }}>{FREQ_LABELS[e.frequency] || e.frequency}</td>
                  <td className="px-4 py-3">{e.is_billable
                    ? <span className="admin-status-badge" style={{ background: 'rgba(42,157,143,0.12)', color: TEAL }}>Oui</span>
                    : <span style={{ color: TEXT_MUTED }}>Non</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className="admin-status-badge" style={{ background: `${STATUS_LABELS[e.status]?.color || '#999'}20`, color: STATUS_LABELS[e.status]?.color || '#999' }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: STATUS_LABELS[e.status]?.color, boxShadow: `0 0 6px ${STATUS_LABELS[e.status]?.color}55` }} />
                      {STATUS_LABELS[e.status]?.label || e.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={ev => { ev.stopPropagation(); deleteExpense(e.id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: CORAL, opacity: 0.5 }}>
                      <X size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="text-center py-8" style={{ color: TEXT_MUTED }}>Aucune dépense</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rentabilité */}
      <div className="admin-glass-card p-6">
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: TEXT_PRIMARY, marginBottom: 16 }}>Rentabilité par client</h2>
        <div className="admin-glass-table">
          <div className="overflow-x-auto">
            <table className="w-full" style={{ fontSize: 13 }}>
              <thead><tr style={{ borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
                {['Client', 'Revenus mensuels', 'Dépenses mensuelles', 'Marge'].map(h => (
                  <th key={h} className="text-left px-4 py-3" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.2, color: TEXT_MUTED, fontWeight: 600 }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {Object.entries(profitability.clientMap)
                  .filter(([id]) => contractRevenues[id] || profitability.clientMap[id].expenses > 0)
                  .map(([id, data]) => {
                    const rev = contractRevenues[id] || 0;
                    const m = rev - data.expenses;
                    return (
                      <tr key={id} style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                        <td className="px-4 py-3 font-medium" style={{ color: TEXT_PRIMARY }}>{data.name}</td>
                        <td className="px-4 py-3" style={{ color: TEAL, fontWeight: 600 }}>{fmt(rev)}</td>
                        <td className="px-4 py-3" style={{ color: CORAL, fontWeight: 600 }}>{fmt(data.expenses)}</td>
                        <td className="px-4 py-3" style={{ fontWeight: 700, color: m >= 0 ? TEAL : CORAL }}>{fmt(m)}</td>
                      </tr>
                    );
                  })}
                {/* General */}
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
                  <td className="px-4 py-3 font-medium" style={{ color: TEXT_MUTED, fontStyle: 'italic' }}>Frais généraux</td>
                  <td className="px-4 py-3" style={{ color: TEXT_MUTED }}>—</td>
                  <td className="px-4 py-3" style={{ color: CORAL, fontWeight: 600 }}>{fmt(profitability.generalExpenses)}</td>
                  <td className="px-4 py-3" style={{ fontWeight: 700, color: CORAL }}>{fmt(-profitability.generalExpenses)}</td>
                </tr>
                {/* Total */}
                <tr style={{ background: 'rgba(42,157,143,0.04)' }}>
                  <td className="px-4 py-3" style={{ fontWeight: 700, color: TEXT_PRIMARY }}>TOTAL</td>
                  <td className="px-4 py-3" style={{ color: TEAL, fontWeight: 700 }}>
                    {fmt(Object.keys(contractRevenues).reduce((s, id) => s + (contractRevenues[id] || 0), 0))}
                  </td>
                  <td className="px-4 py-3" style={{ color: CORAL, fontWeight: 700 }}>{fmt(monthlyExpenses)}</td>
                  <td className="px-4 py-3" style={{ fontWeight: 700, color: margin >= 0 ? TEAL : CORAL }}>{fmt(margin)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto admin-glass-modal p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: TEXT_PRIMARY }}>
                {editing ? 'Modifier la dépense' : 'Nouvelle dépense'}
              </h2>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: TEXT_SECONDARY }}><X size={20} /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label style={{ fontSize: 11, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600, display: 'block', marginBottom: 6 }}>Nom *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="admin-glass-input w-full" placeholder="Ex: Hébergement Lovable" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label style={{ fontSize: 11, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600, display: 'block', marginBottom: 6 }}>Catégorie</label>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="admin-glass-input w-full">
                    {CATEGORIES.map(c => <option key={c} value={c}>{CAT_LABELS[c].label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600, display: 'block', marginBottom: 6 }}>Montant (€)</label>
                  <input type="number" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })} className="admin-glass-input w-full" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label style={{ fontSize: 11, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600, display: 'block', marginBottom: 6 }}>Client</label>
                  <select value={form.client_id} onChange={e => setForm({ ...form, client_id: e.target.value, project_id: '' })} className="admin-glass-input w-full">
                    <option value="">Frais généraux Creationation</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.business_name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600, display: 'block', marginBottom: 6 }}>Projet</label>
                  <select value={form.project_id} onChange={e => setForm({ ...form, project_id: e.target.value })} className="admin-glass-input w-full" disabled={!form.client_id}>
                    <option value="">— Aucun —</option>
                    {filteredProjects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label style={{ fontSize: 11, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600, display: 'block', marginBottom: 6 }}>Fréquence</label>
                  <select value={form.frequency} onChange={e => setForm({ ...form, frequency: e.target.value })} className="admin-glass-input w-full">
                    {FREQUENCIES.map(f => <option key={f} value={f}>{FREQ_LABELS[f]}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600, display: 'block', marginBottom: 6 }}>Statut</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="admin-glass-input w-full">
                    {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s].label}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label style={{ fontSize: 11, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600, display: 'block', marginBottom: 6 }}>Date de début</label>
                  <input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} className="admin-glass-input w-full" />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600, display: 'block', marginBottom: 6 }}>Date de fin</label>
                  <input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} className="admin-glass-input w-full" />
                </div>
              </div>

              {/* Billable toggle */}
              <div className="flex items-center justify-between py-2">
                <span style={{ fontSize: 13, color: TEXT_PRIMARY, fontWeight: 500 }}>Facturable au client</span>
                <button type="button" onClick={() => setForm({ ...form, is_billable: !form.is_billable })}
                  style={{
                    width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
                    background: form.is_billable ? TEAL : 'rgba(26,35,50,0.15)',
                    position: 'relative', transition: 'background 0.2s',
                  }}>
                  <span style={{
                    position: 'absolute', top: 2, left: form.is_billable ? 22 : 2,
                    width: 20, height: 20, borderRadius: 10, background: 'white',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'left 0.2s',
                  }} />
                </button>
              </div>

              <div>
                <label style={{ fontSize: 11, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600, display: 'block', marginBottom: 6 }}>Notes</label>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="admin-glass-input w-full" rows={3} />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button onClick={() => setShowForm(false)} className="admin-glass-btn-secondary">Annuler</button>
                <button onClick={saveExpense} className="admin-glass-btn">{editing ? 'Mettre à jour' : 'Ajouter'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminExpenses;
