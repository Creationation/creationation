import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, X, Trash2 } from 'lucide-react';
import AdminHeader from '@/components/admin/AdminHeader';

type Client = {
  id: string;
  business_name: string;
  monthly_amount: number;
  status: string;
};

type Payment = {
  id: string;
  client_id: string;
  amount: number;
  description: string | null;
  payment_date: string;
  payment_type: string;
  created_at: string;
  client_name?: string;
};

const TYPE_LABELS: Record<string, string> = { monthly: 'Mensuel', one_time: 'Unique', setup: 'Setup', refund: 'Remboursement' };
const TYPE_COLORS: Record<string, string> = { monthly: '#0d8a6f', one_time: '#4da6d9', setup: '#7c5cbf', refund: '#e8735a' };

const AdminRevenues = () => {
  const navigate = useNavigate();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [filterMonth, setFilterMonth] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [{ data: p }, { data: c }] = await Promise.all([
      supabase.from('client_payments' as any).select('*').order('payment_date', { ascending: false }),
      supabase.from('clients' as any).select('id,business_name,monthly_amount,status'),
    ]);
    const clientMap = new Map((c as any[] || []).map((cl: any) => [cl.id, cl.business_name]));
    setPayments(((p as any[]) || []).map((pay: any) => ({ ...pay, client_name: clientMap.get(pay.client_id) || 'Inconnu' })));
    setClients((c as any[] || []) as Client[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/admin/login'); return; }
      const { data: roles } = await supabase.from('user_roles').select('role').eq('user_id', user.id);
      if (!roles?.some(r => r.role === 'admin')) { navigate('/admin/login'); return; }
      fetchData();
    })();
  }, [navigate, fetchData]);

  const deletePayment = async (id: string) => {
    if (!confirm('Supprimer ce paiement ?')) return;
    await supabase.from('client_payments' as any).delete().eq('id', id);
    fetchData();
    toast.success('Paiement supprimé');
  };

  const filtered = payments.filter(p => {
    if (filterType !== 'all' && p.payment_type !== filterType) return false;
    if (filterMonth && !p.payment_date.startsWith(filterMonth)) return false;
    return true;
  });

  const totalReceived = filtered.filter(p => p.payment_type !== 'refund').reduce((s, p) => s + p.amount, 0);
  const totalRefunds = filtered.filter(p => p.payment_type === 'refund').reduce((s, p) => s + p.amount, 0);
  const net = totalReceived - totalRefunds;
  const mrr = clients.filter(c => c.status === 'active').reduce((s, c) => s + (c.monthly_amount || 0), 0);

  // Upcoming: active clients that haven't paid this month
  const currentMonth = new Date().toISOString().slice(0, 7);
  const paidThisMonth = new Set(payments.filter(p => p.payment_date.startsWith(currentMonth) && p.payment_type === 'monthly').map(p => p.client_id));
  const upcoming = clients.filter(c => c.status === 'active' && c.monthly_amount > 0 && !paidThisMonth.has(c.id));

  const f = (n: number) => n.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

  // Group by month for chart-like display
  const months = new Map<string, number>();
  payments.forEach(p => {
    const m = p.payment_date.slice(0, 7);
    const val = p.payment_type === 'refund' ? -p.amount : p.amount;
    months.set(m, (months.get(m) || 0) + val);
  });
  const sortedMonths = [...months.entries()].sort((a, b) => a[0].localeCompare(b[0])).slice(-12);
  const maxMonth = Math.max(...sortedMonths.map(([, v]) => Math.abs(v)), 1);

  return (
    <div className="min-h-screen" style={{ background: 'var(--cream)' }}>
      <AdminHeader />

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Revenus nets', value: `${f(net)} €`, color: 'var(--teal)' },
            { label: 'MRR actuel', value: `${f(mrr)} €`, color: 'var(--sky)' },
            { label: 'Remboursements', value: `${f(totalRefunds)} €`, color: 'var(--coral)' },
            { label: 'À venir ce mois', value: `${f(upcoming.reduce((s, c) => s + c.monthly_amount, 0))} €`, color: '#d4a55a' },
          ].map((s, i) => (
            <div key={i} className="rounded-2xl p-4" style={{ background: 'white', border: '1px solid var(--glass-border)' }}>
              <div style={{ fontFamily: 'var(--font-b)', fontSize: 12, color: 'var(--muted-foreground)' }}>{s.label}</div>
              <div style={{ fontFamily: 'var(--font-h)', fontSize: 28, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Revenue chart (bar) */}
        {sortedMonths.length > 0 && (
          <div className="rounded-2xl p-4" style={{ background: 'white', border: '1px solid var(--glass-border)' }}>
            <h3 style={{ fontFamily: 'var(--font-h)', fontSize: 16, marginBottom: 12 }}>Revenus par mois</h3>
            <div className="flex items-end gap-2" style={{ height: 120 }}>
              {sortedMonths.map(([m, v]) => (
                <div key={m} className="flex flex-col items-center flex-1 min-w-0">
                  <div style={{ width: '100%', maxWidth: 40, height: Math.max(4, (Math.abs(v) / maxMonth) * 100), background: v >= 0 ? 'var(--teal)' : 'var(--coral)', borderRadius: '4px 4px 0 0', transition: 'height 0.3s' }} />
                  <span style={{ fontFamily: 'var(--font-b)', fontSize: 9, color: 'var(--muted-foreground)', marginTop: 4 }}>{m.slice(5)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming payments */}
        {upcoming.length > 0 && (
          <div className="rounded-2xl p-4" style={{ background: 'rgba(212,165,90,0.08)', border: '1px solid rgba(212,165,90,0.3)' }}>
            <h3 style={{ fontFamily: 'var(--font-h)', fontSize: 16, marginBottom: 8, color: '#d4a55a' }}>Paiements attendus ce mois</h3>
            <div className="space-y-2">
              {upcoming.map(c => (
                <div key={c.id} className="flex justify-between items-center" style={{ fontFamily: 'var(--font-b)', fontSize: 14 }}>
                  <span>{c.business_name}</span>
                  <span style={{ fontWeight: 700, color: '#d4a55a' }}>{f(c.monthly_amount)} €</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters + add */}
        <div className="flex flex-wrap gap-3 items-center">
          <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ padding: '8px 14px', borderRadius: 'var(--pill)', border: '1px solid var(--glass-border)', fontFamily: 'var(--font-b)', fontSize: 13, background: 'white' }}>
            <option value="all">Tous types</option>
            {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <input type="month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)} style={{ padding: '8px 14px', borderRadius: 'var(--pill)', border: '1px solid var(--glass-border)', fontFamily: 'var(--font-b)', fontSize: 13, background: 'white' }} />
          {filterMonth && <button onClick={() => setFilterMonth('')} style={{ padding: '6px 12px', background: 'none', border: '1px solid var(--glass-border)', borderRadius: 'var(--pill)', fontFamily: 'var(--font-b)', fontSize: 12, cursor: 'pointer' }}>Tout</button>}
          <div className="flex-1" />
          <button onClick={() => setShowAdd(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', background: 'var(--teal)', color: 'white', border: 'none', borderRadius: 'var(--pill)', fontFamily: 'var(--font-b)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}><Plus size={14} /> Ajouter paiement</button>
        </div>

        {/* Payment list */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, fontFamily: 'var(--font-b)', color: 'var(--muted-foreground)' }}>Chargement...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, fontFamily: 'var(--font-b)', color: 'var(--muted-foreground)' }}>Aucun paiement enregistré.</div>
        ) : (
          <div className="space-y-2">
            {filtered.map(p => (
              <div key={p.id} className="flex items-center gap-4 rounded-xl p-3" style={{ background: 'white', border: '1px solid var(--glass-border)' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: TYPE_COLORS[p.payment_type] || '#999', flexShrink: 0 }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span style={{ fontFamily: 'var(--font-b)', fontSize: 14, fontWeight: 600 }}>{p.client_name}</span>
                    <span style={{ padding: '1px 8px', borderRadius: 'var(--pill)', fontSize: 10, fontWeight: 600, fontFamily: 'var(--font-b)', color: TYPE_COLORS[p.payment_type], background: `${TYPE_COLORS[p.payment_type]}18` }}>{TYPE_LABELS[p.payment_type] || p.payment_type}</span>
                  </div>
                  {p.description && <div style={{ fontFamily: 'var(--font-b)', fontSize: 12, color: 'var(--muted-foreground)' }}>{p.description}</div>}
                </div>
                <div className="text-right" style={{ flexShrink: 0 }}>
                  <div style={{ fontFamily: 'var(--font-b)', fontSize: 15, fontWeight: 700, color: p.payment_type === 'refund' ? 'var(--coral)' : 'var(--teal)' }}>{p.payment_type === 'refund' ? '-' : '+'}{f(p.amount)} €</div>
                  <div style={{ fontFamily: 'var(--font-b)', fontSize: 11, color: 'var(--muted-foreground)' }}>{new Date(p.payment_date).toLocaleDateString('fr-FR')}</div>
                </div>
                <button onClick={() => deletePayment(p.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--coral)', flexShrink: 0 }}><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAdd && <AddPaymentModal clients={clients} onClose={() => setShowAdd(false)} onAdded={fetchData} />}
    </div>
  );
};

const AddPaymentModal = ({ clients, onClose, onAdded }: { clients: Client[]; onClose: () => void; onAdded: () => void }) => {
  const [form, setForm] = useState({ client_id: '', amount: 0, description: '', payment_date: new Date().toISOString().slice(0, 10), payment_type: 'monthly' });

  const handleAdd = async () => {
    if (!form.client_id) { toast.error('Sélectionne un client'); return; }
    if (!form.amount) { toast.error('Montant requis'); return; }

    await supabase.from('client_payments' as any).insert(form as any);

    // Update total_paid on client
    if (form.payment_type !== 'refund') {
      const { data: client } = await supabase.from('clients' as any).select('total_paid').eq('id', form.client_id).single();
      if (client) {
        await supabase.from('clients' as any).update({ total_paid: ((client as any).total_paid || 0) + form.amount } as any).eq('id', form.client_id);
      }
    }

    toast.success('Paiement ajouté');
    onAdded();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="rounded-3xl p-6 w-full max-w-md" style={{ background: 'white' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 style={{ fontFamily: 'var(--font-h)', fontSize: 20 }}>Nouveau paiement</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label style={{ fontFamily: 'var(--font-b)', fontSize: 12, color: 'var(--muted-foreground)' }}>Client *</label>
            <select value={form.client_id} onChange={e => setForm({ ...form, client_id: e.target.value })} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--glass-border)', fontFamily: 'var(--font-b)', fontSize: 14 }}>
              <option value="">Sélectionner...</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.business_name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={{ fontFamily: 'var(--font-b)', fontSize: 12, color: 'var(--muted-foreground)' }}>Montant (€) *</label>
              <input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: +e.target.value })} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--glass-border)', fontFamily: 'var(--font-b)', fontSize: 14 }} />
            </div>
            <div>
              <label style={{ fontFamily: 'var(--font-b)', fontSize: 12, color: 'var(--muted-foreground)' }}>Type</label>
              <select value={form.payment_type} onChange={e => setForm({ ...form, payment_type: e.target.value })} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--glass-border)', fontFamily: 'var(--font-b)', fontSize: 14 }}>
                {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={{ fontFamily: 'var(--font-b)', fontSize: 12, color: 'var(--muted-foreground)' }}>Date</label>
            <input type="date" value={form.payment_date} onChange={e => setForm({ ...form, payment_date: e.target.value })} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--glass-border)', fontFamily: 'var(--font-b)', fontSize: 14 }} />
          </div>
          <div>
            <label style={{ fontFamily: 'var(--font-b)', fontSize: 12, color: 'var(--muted-foreground)' }}>Description</label>
            <input type="text" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Ex: Paiement mensuel mars" style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--glass-border)', fontFamily: 'var(--font-b)', fontSize: 14 }} />
          </div>
          <button onClick={handleAdd} style={{ width: '100%', padding: '10px 0', background: 'var(--teal)', color: 'white', border: 'none', borderRadius: 'var(--pill)', fontFamily: 'var(--font-b)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Enregistrer le paiement</button>
        </div>
      </div>
    </div>
  );
};

export default AdminRevenues;
