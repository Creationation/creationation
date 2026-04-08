import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Search, X, TrendingUp, TrendingDown, Wallet, Activity, Download, Upload, Pause, Ban, Trash2, FileText, ChevronRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED, TEAL, CORAL, GOLD, PURPLE } from '@/lib/adminTheme';


const CATEGORIES = ['hosting', 'domain', 'api_service', 'software', 'design', 'marketing', 'legal', 'accounting', 'tools', 'other'] as const;
const FREQUENCIES = ['one_time', 'monthly', 'yearly'] as const;
const STATUSES = ['active', 'paused', 'cancelled'] as const;

const CAT_LABELS: Record<string, { label: string; color: string }> = {
  hosting: { label: 'Hosting', color: '#2A9D8F' },
  domain: { label: 'Domaine', color: '#8b5cf6' },
  api_service: { label: 'API / Service', color: '#D4A843' },
  software: { label: 'Software', color: '#E76F51' },
  design: { label: 'Design', color: '#ec4899' },
  marketing: { label: 'Marketing', color: '#ef4444' },
  legal: { label: 'Juridique', color: '#6366f1' },
  accounting: { label: 'Comptabilité', color: '#14b8a6' },
  tools: { label: 'Outils', color: '#f97316' },
  other: { label: 'Autre', color: TEXT_SECONDARY },
};
const FREQ_LABELS: Record<string, string> = { one_time: 'Unique', monthly: 'Mensuel', yearly: 'Annuel' };
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
  receipt_url: string | null;
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
  const [slideOpen, setSlideOpen] = useState<Expense | null>(null);
  const [activeTab, setActiveTab] = useState<'list' | 'profit'>('list');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    name: '', category: 'other' as string, client_id: '' as string,
    project_id: '' as string, amount: 0, frequency: 'monthly' as string,
    is_billable: false, status: 'active' as string,
    start_date: new Date().toISOString().split('T')[0],
    end_date: '', notes: '', receipt_url: '' as string,
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

  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const getMonthlyAmount = (e: Expense) => {
    if (e.status !== 'active') return 0;
    if (e.frequency === 'monthly') return e.amount;
    if (e.frequency === 'yearly') return e.amount / 12;
    if (e.frequency === 'one_time' && e.start_date.startsWith(thisMonth)) return e.amount;
    return 0;
  };

  const monthlyExpenses = useMemo(() => expenses.reduce((s, e) => s + getMonthlyAmount(e), 0), [expenses, thisMonth]);

  const clientsWithExpenses = useMemo(() => {
    const ids = new Set(expenses.filter(e => e.client_id && e.status === 'active').map(e => e.client_id));
    return ids.size;
  }, [expenses]);

  const avgPerClient = clientsWithExpenses > 0 ? monthlyExpenses / clientsWithExpenses : 0;
  const activeServices = expenses.filter(e => e.status === 'active' && (e.frequency === 'monthly' || e.frequency === 'yearly')).length;

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
    if (!id) return null;
    return clients.find(c => c.id === id)?.business_name || '—';
  };

  const resetForm = () => {
    setForm({
      name: '', category: 'other', client_id: '', project_id: '', amount: 0,
      frequency: 'monthly', is_billable: false, status: 'active',
      start_date: new Date().toISOString().split('T')[0], end_date: '', notes: '', receipt_url: '',
    });
  };

  const openForm = (expense?: Expense) => {
    if (expense) {
      setEditing(expense);
      setForm({
        name: expense.name, category: expense.category, client_id: expense.client_id || '',
        project_id: expense.project_id || '', amount: expense.amount, frequency: expense.frequency,
        is_billable: expense.is_billable, status: expense.status, start_date: expense.start_date,
        end_date: expense.end_date || '', notes: expense.notes || '', receipt_url: expense.receipt_url || '',
      });
    } else {
      setEditing(null);
      resetForm();
    }
    setShowForm(true);
    setSlideOpen(null);
  };

  const handleReceiptUpload = async (file: File) => {
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `receipts/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('contract-documents').upload(path, file);
    if (error) { toast.error('Erreur upload'); setUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from('contract-documents').getPublicUrl(path);
    setForm(f => ({ ...f, receipt_url: publicUrl }));
    toast.success('Justificatif uploadé');
    setUploading(false);
  };

  const saveExpense = async () => {
    if (!form.name.trim()) { toast.error('Nom requis'); return; }
    const payload = {
      name: form.name, category: form.category as any, amount: form.amount,
      frequency: form.frequency as any, is_billable: form.is_billable,
      status: form.status as any, start_date: form.start_date,
      end_date: form.end_date || null, notes: form.notes || null,
      client_id: form.client_id || null, project_id: form.project_id || null,
      receipt_url: form.receipt_url || null,
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
    setSlideOpen(null);
    fetchData();
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('expenses').update({ status: status as any } as any).eq('id', id);
    toast.success(`Statut → ${STATUS_LABELS[status]?.label}`);
    setSlideOpen(null);
    fetchData();
  };

  const deleteExpense = async (id: string) => {
    await supabase.from('expenses').delete().eq('id', id);
    toast.success('Dépense supprimée');
    setSlideOpen(null);
    setDeleteConfirm(null);
    fetchData();
  };

  const toggleBillable = async (e: Expense) => {
    await supabase.from('expenses').update({ is_billable: !e.is_billable } as any).eq('id', e.id);
    fetchData();
  };

  const exportCSV = () => {
    const headers = ['Nom', 'Catégorie', 'Client', 'Montant', 'Fréquence', 'Facturable', 'Statut', 'Date début', 'Notes'];
    const rows = filtered.map(e => [
      e.name, CAT_LABELS[e.category]?.label || e.category, clientName(e.client_id) || 'Frais généraux',
      e.amount, FREQ_LABELS[e.frequency], e.is_billable ? 'Oui' : 'Non',
      STATUS_LABELS[e.status]?.label, e.start_date, e.notes || '',
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'depenses.csv'; a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exporté');
  };

  // Profitability
  const [contractRevenues, setContractRevenues] = useState<Record<string, number>>({});
  useEffect(() => {
    const f = async () => {
      const { data } = await supabase.from('contracts').select('client_id, monthly_price').eq('status', 'active');
      const map: Record<string, number> = {};
      (data || []).forEach((c: any) => { map[c.client_id] = (map[c.client_id] || 0) + (c.monthly_price || 0); });
      setContractRevenues(map);
    };
    f();
  }, []);

  const profitData = useMemo(() => {
    const clientMap: Record<string, { name: string; expenses: number }> = {};
    clients.forEach(c => { clientMap[c.id] = { name: c.business_name, expenses: 0 }; });
    expenses.filter(e => e.status === 'active' && e.client_id).forEach(e => {
      if (!clientMap[e.client_id!]) return;
      clientMap[e.client_id!].expenses += getMonthlyAmount(e);
    });
    const generalExpenses = expenses.filter(e => e.status === 'active' && !e.client_id).reduce((s, e) => s + getMonthlyAmount(e), 0);
    return { clientMap, generalExpenses };
  }, [expenses, clients, thisMonth]);

  // Chart data - last 6 months
  const chartData = useMemo(() => {
    const months: { month: string; revenus: number; depenses: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('fr-FR', { month: 'short' });
      const totalRev = Object.values(contractRevenues).reduce((s, v) => s + v, 0);
      const totalExp = expenses.filter(e => e.status === 'active').reduce((s, e) => {
        if (e.frequency === 'monthly') return s + e.amount;
        if (e.frequency === 'yearly') return s + e.amount / 12;
        if (e.frequency === 'one_time' && e.start_date.startsWith(key)) return s + e.amount;
        return s;
      }, 0);
      months.push({ month: label, revenus: totalRev, depenses: totalExp });
    }
    return months;
  }, [expenses, contractRevenues, now]);

  const filteredProjects = projects.filter(p => !form.client_id || p.client_id === form.client_id);

  const labelStyle = { fontSize: 11, color: TEXT_MUTED, textTransform: 'uppercase' as const, letterSpacing: 1, fontWeight: 600, display: 'block', marginBottom: 6 };

  if (loading) return <div className="p-8 text-center" style={{ color: TEXT_MUTED }}>Chargement...</div>;

  const totalMRR = Object.values(contractRevenues).reduce((s, v) => s + v, 0);
  const totalExpenses = monthlyExpenses;
  const netMargin = totalMRR - totalExpenses;
  const marginPct = totalMRR > 0 ? ((netMargin / totalMRR) * 100).toFixed(1) : '0';

  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto space-y-6" style={{ fontFamily: "'Outfit', sans-serif" }}>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="admin-page-title">Dépenses</h1>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="admin-glass-btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
            <Download size={14} /> CSV
          </button>
          <button onClick={() => openForm()} className="admin-glass-btn" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Plus size={14} /> Nouvelle dépense
          </button>
        </div>
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

      {/* Tabs */}
      <div className="flex gap-1" style={{ background: 'rgba(255,255,255,0.10)', borderRadius: 12, padding: 4, width: 'fit-content' }}>
        {[
          { key: 'list' as const, label: 'Toutes les dépenses' },
          { key: 'profit' as const, label: 'Rentabilité' },
        ].map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            style={{
              padding: '8px 18px', borderRadius: 10, border: 'none', cursor: 'pointer',
              background: activeTab === t.key ? 'rgba(255,255,255,0.25)' : 'transparent',
              color: activeTab === t.key ? TEXT_PRIMARY : TEXT_SECONDARY,
              fontWeight: activeTab === t.key ? 600 : 400, fontSize: 13,
              fontFamily: "'Outfit', sans-serif",
              backdropFilter: activeTab === t.key ? 'blur(8px)' : 'none',
              transition: 'all 0.2s',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: List */}
      {activeTab === 'list' && (
        <>
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
                  {filtered.map(e => {
                    const inactive = e.status === 'paused' || e.status === 'cancelled';
                    return (
                      <tr key={e.id} className="cursor-pointer"
                          onClick={() => setSlideOpen(e)}
                          onMouseEnter={ev => ev.currentTarget.style.background = 'rgba(42,157,143,0.04)'}
                          onMouseLeave={ev => ev.currentTarget.style.background = 'transparent'}
                          style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', opacity: inactive ? 0.45 : 1 }}>
                        <td className="px-4 py-3 font-medium" style={{ color: TEXT_PRIMARY }}>{e.name}</td>
                        <td className="px-4 py-3">
                          <span className="admin-status-badge" style={{ background: `${CAT_LABELS[e.category]?.color || '#999'}20`, color: CAT_LABELS[e.category]?.color || '#999' }}>
                            {CAT_LABELS[e.category]?.label || e.category}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {e.client_id
                            ? <span style={{ color: TEXT_PRIMARY }}>{clientName(e.client_id)}</span>
                            : <span style={{ color: TEXT_MUTED, fontStyle: 'italic' }}>Frais généraux</span>}
                        </td>
                        <td className="px-4 py-3" style={{ fontWeight: 600, color: TEXT_PRIMARY }}>{fmt(e.amount)}</td>
                        <td className="px-4 py-3">
                          <span className="admin-status-badge" style={{
                            background: e.frequency === 'monthly' ? 'rgba(42,157,143,0.12)' : e.frequency === 'yearly' ? 'rgba(139,92,246,0.12)' : 'rgba(26,35,50,0.08)',
                            color: e.frequency === 'monthly' ? TEAL : e.frequency === 'yearly' ? '#8b5cf6' : TEXT_SECONDARY,
                          }}>
                            {FREQ_LABELS[e.frequency]}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={ev => { ev.stopPropagation(); toggleBillable(e); }}
                            style={{
                              width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer',
                              background: e.is_billable ? TEAL : 'rgba(26,35,50,0.15)', position: 'relative', transition: 'background 0.2s',
                            }}>
                            <span style={{
                              position: 'absolute', top: 2, left: e.is_billable ? 18 : 2,
                              width: 16, height: 16, borderRadius: 8, background: 'white',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'left 0.2s',
                            }} />
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <span className="admin-status-badge" style={{ background: `${STATUS_LABELS[e.status]?.color || '#999'}20`, color: STATUS_LABELS[e.status]?.color || '#999', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: STATUS_LABELS[e.status]?.color, boxShadow: `0 0 6px ${STATUS_LABELS[e.status]?.color}55` }} />
                            {STATUS_LABELS[e.status]?.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <ChevronRight size={14} style={{ color: TEXT_MUTED }} />
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr><td colSpan={8} className="text-center py-8" style={{ color: TEXT_MUTED }}>Aucune dépense</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Tab: Profitability */}
      {activeTab === 'profit' && (
        <>
          <div className="admin-glass-card p-6">
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: TEXT_PRIMARY, marginBottom: 16 }}>Rentabilité par client</h2>
            <div className="admin-glass-table">
              <div className="overflow-x-auto">
                <table className="w-full" style={{ fontSize: 13 }}>
                  <thead><tr style={{ borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
                    {['Client', 'Revenus mensuels', 'Dépenses mensuelles', 'Marge', '%'].map(h => (
                      <th key={h} className="text-left px-4 py-3" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.2, color: TEXT_MUTED, fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {Object.entries(profitData.clientMap)
                      .filter(([id]) => contractRevenues[id] || profitData.clientMap[id].expenses > 0)
                      .map(([id, data]) => {
                        const rev = contractRevenues[id] || 0;
                        const m = rev - data.expenses;
                        const pct = rev > 0 ? ((m / rev) * 100).toFixed(1) : '—';
                        return (
                          <tr key={id} style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                            <td className="px-4 py-3 font-medium" style={{ color: TEXT_PRIMARY }}>{data.name}</td>
                            <td className="px-4 py-3" style={{ color: TEAL, fontWeight: 600 }}>{fmt(rev)}</td>
                            <td className="px-4 py-3" style={{ color: CORAL, fontWeight: 600 }}>{fmt(data.expenses)}</td>
                            <td className="px-4 py-3" style={{ fontWeight: 700, color: m >= 0 ? TEAL : CORAL }}>{fmt(m)}</td>
                            <td className="px-4 py-3" style={{ fontWeight: 600, color: m >= 0 ? TEAL : CORAL }}>{pct}%</td>
                          </tr>
                        );
                      })}
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
                      <td className="px-4 py-3 font-medium" style={{ color: TEXT_MUTED, fontStyle: 'italic' }}>Frais généraux Creationation</td>
                      <td className="px-4 py-3" style={{ color: TEXT_MUTED }}>—</td>
                      <td className="px-4 py-3" style={{ color: CORAL, fontWeight: 600 }}>{fmt(profitData.generalExpenses)}</td>
                      <td className="px-4 py-3" style={{ fontWeight: 700, color: CORAL }}>{fmt(-profitData.generalExpenses)}</td>
                      <td className="px-4 py-3" style={{ color: TEXT_MUTED }}>—</td>
                    </tr>
                    <tr style={{ background: 'rgba(42,157,143,0.04)' }}>
                      <td className="px-4 py-3" style={{ fontWeight: 700, color: TEXT_PRIMARY }}>TOTAL</td>
                      <td className="px-4 py-3" style={{ color: TEAL, fontWeight: 700 }}>{fmt(totalMRR)}</td>
                      <td className="px-4 py-3" style={{ color: CORAL, fontWeight: 700 }}>{fmt(totalExpenses)}</td>
                      <td className="px-4 py-3" style={{ fontWeight: 700, color: netMargin >= 0 ? TEAL : CORAL }}>{fmt(netMargin)}</td>
                      <td className="px-4 py-3" style={{ fontWeight: 700, color: netMargin >= 0 ? TEAL : CORAL }}>{marginPct}%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="admin-glass-card p-6">
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: TEXT_PRIMARY, marginBottom: 16 }}>Revenus vs Dépenses (6 mois)</h2>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="month" tick={{ fill: TEXT_SECONDARY, fontSize: 12 }} />
                <YAxis tick={{ fill: TEXT_SECONDARY, fontSize: 12 }} tickFormatter={v => `${v}€`} />
                <Tooltip
                  contentStyle={{ background: 'rgba(255,255,255,0.20)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.20)', borderRadius: 12, fontSize: 13 }}
                  formatter={(val: number) => fmt(val)}
                />
                <Legend />
                <Bar dataKey="revenus" name="Revenus" fill={TEAL} radius={[6, 6, 0, 0]} />
                <Bar dataKey="depenses" name="Dépenses" fill={CORAL} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {/* Slide-in Detail Panel */}
      {slideOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30" onClick={() => setSlideOpen(null)} />
          <div className="relative w-full max-w-md h-full overflow-y-auto" style={{
            background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(24px) saturate(1.4)',
            borderLeft: '1px solid rgba(255,255,255,0.25)',
            animation: 'slideInRight 0.2s ease-out',
          }}>
            <style>{`@keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>
            <div className="p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: TEXT_PRIMARY }}>{slideOpen.name}</h2>
                <button onClick={() => setSlideOpen(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: TEXT_SECONDARY }}><X size={20} /></button>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between"><span style={{ color: TEXT_MUTED, fontSize: 12 }}>Catégorie</span>
                  <span className="admin-status-badge" style={{ background: `${CAT_LABELS[slideOpen.category]?.color}20`, color: CAT_LABELS[slideOpen.category]?.color }}>{CAT_LABELS[slideOpen.category]?.label}</span>
                </div>
                <div className="flex justify-between"><span style={{ color: TEXT_MUTED, fontSize: 12 }}>Client</span>
                  <span style={{ color: TEXT_PRIMARY, fontSize: 13 }}>{clientName(slideOpen.client_id) || <em style={{ color: TEXT_MUTED }}>Frais généraux</em>}</span>
                </div>
                <div className="flex justify-between"><span style={{ color: TEXT_MUTED, fontSize: 12 }}>Montant</span>
                  <span style={{ color: TEXT_PRIMARY, fontWeight: 700, fontSize: 16 }}>{fmt(slideOpen.amount)}</span>
                </div>
                <div className="flex justify-between"><span style={{ color: TEXT_MUTED, fontSize: 12 }}>Fréquence</span>
                  <span style={{ color: TEXT_PRIMARY, fontSize: 13 }}>{FREQ_LABELS[slideOpen.frequency]}</span>
                </div>
                <div className="flex justify-between"><span style={{ color: TEXT_MUTED, fontSize: 12 }}>Statut</span>
                  <span className="admin-status-badge" style={{ background: `${STATUS_LABELS[slideOpen.status]?.color}20`, color: STATUS_LABELS[slideOpen.status]?.color, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: STATUS_LABELS[slideOpen.status]?.color }} />
                    {STATUS_LABELS[slideOpen.status]?.label}
                  </span>
                </div>
                <div className="flex justify-between"><span style={{ color: TEXT_MUTED, fontSize: 12 }}>Facturable</span>
                  <span style={{ color: slideOpen.is_billable ? TEAL : TEXT_MUTED, fontSize: 13, fontWeight: 500 }}>{slideOpen.is_billable ? 'Oui' : 'Non'}</span>
                </div>
                <div className="flex justify-between"><span style={{ color: TEXT_MUTED, fontSize: 12 }}>Date début</span>
                  <span style={{ color: TEXT_PRIMARY, fontSize: 13 }}>{slideOpen.start_date}</span>
                </div>
                {slideOpen.end_date && (
                  <div className="flex justify-between"><span style={{ color: TEXT_MUTED, fontSize: 12 }}>Date fin</span>
                    <span style={{ color: TEXT_PRIMARY, fontSize: 13 }}>{slideOpen.end_date}</span>
                  </div>
                )}
                {slideOpen.notes && (
                  <div><span style={{ color: TEXT_MUTED, fontSize: 12, display: 'block', marginBottom: 4 }}>Notes</span>
                    <p style={{ color: TEXT_PRIMARY, fontSize: 13, lineHeight: 1.5 }}>{slideOpen.notes}</p>
                  </div>
                )}
                {slideOpen.receipt_url && (
                  <div className="flex justify-between items-center"><span style={{ color: TEXT_MUTED, fontSize: 12 }}>Justificatif</span>
                    <a href={slideOpen.receipt_url} target="_blank" rel="noreferrer" className="admin-status-badge" style={{ background: 'rgba(42,157,143,0.12)', color: TEAL, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <FileText size={12} /> Voir
                    </a>
                  </div>
                )}
              </div>

              <div style={{ height: 1, background: 'rgba(255,255,255,0.15)', margin: '16px 0' }} />

              <div className="flex flex-col gap-2">
                <button onClick={() => openForm(slideOpen)} className="admin-glass-btn w-full" style={{ justifyContent: 'center' }}>
                  Modifier
                </button>
                {slideOpen.status === 'active' && (
                  <button onClick={() => updateStatus(slideOpen.id, 'paused')} className="admin-glass-btn-secondary w-full" style={{ justifyContent: 'center', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Pause size={14} /> Mettre en pause
                  </button>
                )}
                {slideOpen.status === 'paused' && (
                  <button onClick={() => updateStatus(slideOpen.id, 'active')} className="admin-glass-btn-secondary w-full" style={{ justifyContent: 'center', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Activity size={14} /> Réactiver
                  </button>
                )}
                {slideOpen.status !== 'cancelled' && (
                  <button onClick={() => updateStatus(slideOpen.id, 'cancelled')} style={{
                    width: '100%', padding: '10px 20px', borderRadius: 20, border: `1px solid ${CORAL}30`,
                    background: `${CORAL}10`, color: CORAL, fontWeight: 500, fontSize: 13, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    fontFamily: "'Outfit', sans-serif",
                  }}>
                    <Ban size={14} /> Annuler
                  </button>
                )}
                {deleteConfirm === slideOpen.id ? (
                  <div className="flex gap-2">
                    <button onClick={() => deleteExpense(slideOpen.id)} style={{
                      flex: 1, padding: '10px', borderRadius: 20, border: 'none',
                      background: CORAL, color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer',
                      fontFamily: "'Outfit', sans-serif",
                    }}>Confirmer</button>
                    <button onClick={() => setDeleteConfirm(null)} className="admin-glass-btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>
                      Annuler
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setDeleteConfirm(slideOpen.id)} style={{
                    width: '100%', padding: '10px 20px', borderRadius: 20, border: '1px solid rgba(231,111,81,0.20)',
                    background: 'transparent', color: CORAL, fontWeight: 500, fontSize: 13, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: 0.7,
                    fontFamily: "'Outfit', sans-serif",
                  }}>
                    <Trash2 size={14} /> Supprimer
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

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
                <label style={labelStyle}>Nom *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="admin-glass-input w-full" placeholder="Ex: Hébergement Lovable" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label style={labelStyle}>Catégorie</label>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="admin-glass-input w-full">
                    {CATEGORIES.map(c => <option key={c} value={c}>{CAT_LABELS[c].label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Montant (€)</label>
                  <input type="number" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })} className="admin-glass-input w-full" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label style={labelStyle}>Client</label>
                  <select value={form.client_id} onChange={e => setForm({ ...form, client_id: e.target.value, project_id: '' })} className="admin-glass-input w-full">
                    <option value="">Frais généraux Creationation</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.business_name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Projet</label>
                  <select value={form.project_id} onChange={e => setForm({ ...form, project_id: e.target.value })} className="admin-glass-input w-full" disabled={!form.client_id}>
                    <option value="">— Aucun —</option>
                    {filteredProjects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                  </select>
                </div>
              </div>

              {/* Frequency radio buttons */}
              <div>
                <label style={labelStyle}>Fréquence</label>
                <div className="flex gap-2">
                  {FREQUENCIES.map(f => (
                    <button key={f} type="button" onClick={() => setForm({ ...form, frequency: f })}
                      style={{
                        flex: 1, padding: '10px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
                        background: form.frequency === f ? `${TEAL}20` : 'rgba(255,255,255,0.10)',
                        color: form.frequency === f ? TEAL : TEXT_SECONDARY,
                        fontWeight: form.frequency === f ? 600 : 400, fontSize: 13,
                        fontFamily: "'Outfit', sans-serif",
                        outline: form.frequency === f ? `2px solid ${TEAL}40` : 'none',
                        transition: 'all 0.2s',
                      }}>
                      {FREQ_LABELS[f]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label style={labelStyle}>Date de début</label>
                  <input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} className="admin-glass-input w-full" />
                </div>
                <div>
                  <label style={labelStyle}>Date de fin</label>
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
                <label style={labelStyle}>Notes</label>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="admin-glass-input w-full" rows={3} />
              </div>

              {/* Receipt upload */}
              <div>
                <label style={labelStyle}>Justificatif</label>
                {form.receipt_url ? (
                  <div className="flex items-center gap-2">
                    <a href={form.receipt_url} target="_blank" rel="noreferrer" className="admin-status-badge" style={{ background: 'rgba(42,157,143,0.12)', color: TEAL, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <FileText size={12} /> Fichier uploadé
                    </a>
                    <button onClick={() => setForm({ ...form, receipt_url: '' })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: CORAL }}><X size={14} /></button>
                  </div>
                ) : (
                  <label style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px',
                    borderRadius: 12, border: '1px dashed rgba(255,255,255,0.25)',
                    background: 'rgba(255,255,255,0.05)', cursor: 'pointer', fontSize: 13, color: TEXT_SECONDARY,
                  }}>
                    <Upload size={14} />
                    {uploading ? 'Upload...' : 'Choisir un fichier'}
                    <input type="file" className="hidden" onChange={e => e.target.files?.[0] && handleReceiptUpload(e.target.files[0])} />
                  </label>
                )}
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
