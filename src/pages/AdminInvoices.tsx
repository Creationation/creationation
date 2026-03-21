import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import AdminHeader from '@/components/admin/AdminHeader';
import InvoiceFormModal from '@/components/admin/InvoiceFormModal';
import InvoiceDetailModal from '@/components/admin/InvoiceDetailModal';
import RecurringInvoices from '@/components/admin/RecurringInvoices';
import { FileText, Plus, Search, Filter, RefreshCw, RotateCcw } from 'lucide-react';

type Invoice = {
  id: string; invoice_number: string; client_id: string; project_id: string | null;
  status: string; issue_date: string; due_date: string; paid_at: string | null;
  currency: string; subtotal: number; tax_rate: number; tax_amount: number;
  total: number; amount_paid: number; notes: string | null; internal_notes: string | null;
  payment_method: string | null; stripe_invoice_id: string | null;
  stripe_payment_url: string | null; stripe_hosted_url: string | null;
  reminder_sent_at: string | null; reminder_count: number;
  created_at: string; updated_at: string;
  client_name?: string; project_title?: string;
};
type Client = { id: string; business_name: string };

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  draft: { label: 'Brouillon', color: '#9ca3af' },
  sent: { label: 'Envoyée', color: '#3b82f6' },
  viewed: { label: 'Vue', color: '#8b5cf6' },
  paid: { label: 'Payée', color: '#10b981' },
  partially_paid: { label: 'Partiel', color: '#f59e0b' },
  overdue: { label: 'En retard', color: '#ef4444' },
  cancelled: { label: 'Annulée', color: '#6b7280' },
  refunded: { label: 'Remboursée', color: '#f97316' },
};

const AdminInvoices = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [clientFilter, setClientFilter] = useState('all');
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editInvoice, setEditInvoice] = useState<Invoice | null>(null);
  const [detailInvoice, setDetailInvoice] = useState<Invoice | null>(null);
  const [showRecurring, setShowRecurring] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [{ data: inv }, { data: cl }] = await Promise.all([
      supabase.from('invoices').select('*').order('issue_date', { ascending: false }),
      supabase.from('clients').select('id, business_name'),
    ]);

    // Get project titles for invoices with project_id
    const projectIds = (inv || []).filter(i => i.project_id).map(i => i.project_id!);
    let projectMap: Record<string, string> = {};
    if (projectIds.length > 0) {
      const { data: projects } = await supabase.from('projects').select('id, title').in('id', projectIds);
      projectMap = Object.fromEntries((projects || []).map(p => [p.id, p.title]));
    }

    const clientMap = Object.fromEntries((cl || []).map(c => [c.id, c.business_name]));
    setInvoices((inv || []).map(i => ({
      ...i,
      client_name: clientMap[i.client_id] || 'Inconnu',
      project_title: i.project_id ? projectMap[i.project_id] || '' : '',
    })));
    setClients(cl || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { navigate('/admin/login'); return; }
      supabase.from('user_roles').select('role').eq('user_id', user.id).eq('role', 'admin')
        .then(({ data: roles }) => {
          if (!roles || roles.length === 0) navigate('/admin/login');
          else fetchData();
        });
    });
  }, [navigate, fetchData]);

  const filtered = invoices.filter(i => {
    if (statusFilter !== 'all' && i.status !== statusFilter) return false;
    if (clientFilter !== 'all' && i.client_id !== clientFilter) return false;
    if (overdueOnly && i.status !== 'overdue') return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return i.invoice_number.toLowerCase().includes(q) || (i.client_name || '').toLowerCase().includes(q);
    }
    return true;
  });

  const activeInvoices = invoices.filter(i => !['draft', 'cancelled'].includes(i.status));
  const kpis = {
    totalBilled: activeInvoices.reduce((s, i) => s + Number(i.total), 0),
    collected: activeInvoices.reduce((s, i) => s + Number(i.amount_paid), 0),
    pending: activeInvoices.filter(i => ['sent', 'viewed', 'partially_paid'].includes(i.status)).reduce((s, i) => s + Number(i.total) - Number(i.amount_paid), 0),
    overdue: invoices.filter(i => i.status === 'overdue').reduce((s, i) => s + Number(i.total) - Number(i.amount_paid), 0),
    thisMonth: activeInvoices.filter(i => {
      const d = new Date(i.issue_date);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).reduce((s, i) => s + Number(i.total), 0),
  };

  const fmt = (n: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);

  const handleDuplicate = async (inv: Invoice) => {
    const { data: items } = await supabase.from('invoice_items').select('*').eq('invoice_id', inv.id);
    const { data: newInv, error } = await supabase.from('invoices').insert({
      invoice_number: '',
      client_id: inv.client_id,
      project_id: inv.project_id,
      status: 'draft' as any,
      due_date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      currency: inv.currency,
      subtotal: inv.subtotal,
      tax_rate: inv.tax_rate,
      tax_amount: inv.tax_amount,
      total: inv.total,
      notes: inv.notes,
      internal_notes: inv.internal_notes,
      payment_method: inv.payment_method,
    }).select().single();
    if (error) { toast.error('Erreur duplication'); return; }
    if (items && items.length > 0 && newInv) {
      await supabase.from('invoice_items').insert(
        items.map((it, idx) => ({ invoice_id: newInv.id, description: it.description, quantity: it.quantity, unit_price: it.unit_price, total: it.total, position: idx }))
      );
    }
    toast.success('Facture dupliquée');
    fetchData();
  };

  const handleStatusChange = async (id: string, status: string) => {
    const updates: any = { status };
    if (status === 'paid') updates.paid_at = new Date().toISOString();
    await supabase.from('invoices').update(updates).eq('id', id);
    toast.success('Statut mis à jour');
    fetchData();
  };

  if (showRecurring) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--cream)' }}>
        <AdminHeader />
        <RecurringInvoices clients={clients} onBack={() => setShowRecurring(false)} onInvoiceCreated={fetchData} />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--cream)' }}>
      <AdminHeader />
      <div className="p-4 md:p-6 max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <FileText size={24} style={{ color: 'var(--teal)' }} />
            <h1 style={{ fontFamily: 'var(--font-h)', fontSize: 24, color: 'var(--charcoal)' }}>Factures</h1>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowRecurring(true)} className="flex items-center gap-2" style={{
              padding: '10px 18px', background: 'var(--glass-bg-strong)', border: '1px solid var(--glass-border)',
              borderRadius: 'var(--r)', fontFamily: 'var(--font-b)', fontSize: 13, fontWeight: 600,
              color: 'var(--charcoal)', cursor: 'pointer',
            }}>
              <RotateCcw size={14} /> Récurrents
            </button>
            <button onClick={() => { setEditInvoice(null); setShowForm(true); }} className="flex items-center gap-2" style={{
              padding: '10px 18px', background: 'var(--teal)', color: '#fff', border: 'none',
              borderRadius: 'var(--r)', fontFamily: 'var(--font-b)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}>
              <Plus size={14} /> Nouvelle facture
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          {[
            { label: 'Total facturé', value: fmt(kpis.totalBilled), color: 'var(--charcoal)' },
            { label: 'Encaissé', value: fmt(kpis.collected), color: 'var(--teal)' },
            { label: 'En attente', value: fmt(kpis.pending), color: '#f59e0b' },
            { label: 'En retard', value: fmt(kpis.overdue), color: 'var(--coral)' },
            { label: 'Ce mois', value: fmt(kpis.thisMonth), color: 'var(--sky)' },
          ].map((k, i) => (
            <div key={i} style={{
              padding: '16px', background: 'var(--glass-bg-strong)', backdropFilter: 'blur(20px)',
              borderRadius: 'var(--r)', border: '1px solid var(--glass-border)',
            }}>
              <p style={{ fontFamily: 'var(--font-b)', fontSize: 11, color: 'var(--text-light)', marginBottom: 4 }}>{k.label}</p>
              <p style={{ fontFamily: 'var(--font-h)', fontSize: 22, color: k.color }}>{k.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex items-center gap-2 flex-1" style={{
            padding: '10px 16px', background: 'var(--glass-bg)', borderRadius: 'var(--r)',
            border: '1px solid var(--glass-border)',
          }}>
            <Search size={16} style={{ color: 'var(--text-light)' }} />
            <input placeholder="Rechercher (n° facture, client)..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontFamily: 'var(--font-b)', fontSize: 14, color: 'var(--text)' }} />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{
            padding: '10px 16px', background: 'var(--glass-bg)', borderRadius: 'var(--r)',
            border: '1px solid var(--glass-border)', fontFamily: 'var(--font-b)', fontSize: 14, color: 'var(--text)', cursor: 'pointer',
          }}>
            <option value="all">Tous les statuts</option>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <select value={clientFilter} onChange={e => setClientFilter(e.target.value)} style={{
            padding: '10px 16px', background: 'var(--glass-bg)', borderRadius: 'var(--r)',
            border: '1px solid var(--glass-border)', fontFamily: 'var(--font-b)', fontSize: 14, color: 'var(--text)', cursor: 'pointer',
          }}>
            <option value="all">Tous les clients</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.business_name}</option>)}
          </select>
          <label className="flex items-center gap-2 cursor-pointer" style={{
            padding: '10px 16px', background: overdueOnly ? 'rgba(239,68,68,0.1)' : 'var(--glass-bg)',
            borderRadius: 'var(--r)', border: '1px solid var(--glass-border)',
            fontFamily: 'var(--font-b)', fontSize: 13, color: overdueOnly ? '#ef4444' : 'var(--text-mid)',
          }}>
            <input type="checkbox" checked={overdueOnly} onChange={e => setOverdueOnly(e.target.checked)} style={{ display: 'none' }} />
            ⚠️ En retard
          </label>
          <button onClick={fetchData} style={{
            padding: '10px 16px', background: 'var(--teal)', color: '#fff', border: 'none',
            borderRadius: 'var(--r)', cursor: 'pointer',
          }}><RefreshCw size={14} /></button>
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-20" style={{ color: 'var(--text-light)', fontFamily: 'var(--font-b)' }}>Chargement...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20" style={{ color: 'var(--text-light)', fontFamily: 'var(--font-b)' }}>Aucune facture trouvée</div>
        ) : (
          <div style={{
            background: 'var(--glass-bg-strong)', backdropFilter: 'blur(20px)',
            borderRadius: 'var(--r)', border: '1px solid var(--glass-border)', overflow: 'hidden',
          }}>
            <div className="overflow-x-auto">
              <table className="w-full" style={{ fontFamily: 'var(--font-b)', fontSize: 14 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    {['N°', 'Client', 'Projet', 'Date', 'Échéance', 'Montant', 'Statut', 'Actions'].map(h => (
                      <th key={h} className="text-left px-4 py-3" style={{
                        fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-light)', fontWeight: 600,
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(inv => {
                    const sc = STATUS_CONFIG[inv.status] || { label: inv.status, color: '#999' };
                    const isOverdue = new Date(inv.due_date) < new Date() && !['paid', 'cancelled', 'refunded'].includes(inv.status);
                    return (
                      <tr key={inv.id} className="cursor-pointer" style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}
                        onClick={() => setDetailInvoice(inv)}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(13,138,111,0.04)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <td className="px-4 py-3 font-medium" style={{ color: 'var(--teal)', fontFamily: 'var(--font-m)', fontSize: 12 }}>
                          {inv.invoice_number}
                        </td>
                        <td className="px-4 py-3" style={{ color: 'var(--charcoal)' }}>{inv.client_name}</td>
                        <td className="px-4 py-3" style={{ color: 'var(--text-mid)', fontSize: 13 }}>{inv.project_title || '—'}</td>
                        <td className="px-4 py-3" style={{ color: 'var(--text-mid)', fontSize: 13 }}>
                          {new Date(inv.issue_date).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="px-4 py-3" style={{ color: isOverdue ? '#ef4444' : 'var(--text-mid)', fontSize: 13, fontWeight: isOverdue ? 600 : 400 }}>
                          {new Date(inv.due_date).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="px-4 py-3 font-medium" style={{ color: 'var(--charcoal)' }}>{fmt(Number(inv.total))}</td>
                        <td className="px-4 py-3">
                          <span style={{
                            padding: '4px 10px', borderRadius: 'var(--pill)',
                            background: `${sc.color}18`, color: sc.color,
                            fontWeight: 600, fontSize: 11, fontFamily: 'var(--font-m)',
                          }}>{sc.label}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                            <button onClick={() => { setEditInvoice(inv); setShowForm(true); }} title="Modifier" style={actionBtnStyle}>✏️</button>
                            <button onClick={() => handleDuplicate(inv)} title="Dupliquer" style={actionBtnStyle}>📋</button>
                            {inv.status === 'draft' && (
                              <button onClick={() => handleStatusChange(inv.id, 'sent')} title="Marquer envoyée" style={actionBtnStyle}>📤</button>
                            )}
                            {['sent', 'viewed', 'partially_paid', 'overdue'].includes(inv.status) && (
                              <button onClick={() => setDetailInvoice(inv)} title="Marquer payée" style={actionBtnStyle}>💰</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {showForm && (
        <InvoiceFormModal
          invoice={editInvoice}
          clients={clients}
          onClose={() => { setShowForm(false); setEditInvoice(null); }}
          onSaved={() => { setShowForm(false); setEditInvoice(null); fetchData(); }}
        />
      )}

      {detailInvoice && (
        <InvoiceDetailModal
          invoice={detailInvoice}
          onClose={() => setDetailInvoice(null)}
          onUpdated={() => { setDetailInvoice(null); fetchData(); }}
        />
      )}
    </div>
  );
};

const actionBtnStyle: React.CSSProperties = {
  padding: '4px 6px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 14, borderRadius: 6,
};

export default AdminInvoices;
