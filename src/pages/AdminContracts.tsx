import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ScrollText, Plus, X, Check } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = { pending: '#f59e0b', signed: '#3b82f6', active: '#10b981', expired: '#6b7280', cancelled: '#ef4444' };

const AdminContracts = () => {
  const [contracts, setContracts] = useState<any[]>([]);
  const [clients, setClients] = useState<{ id: string; business_name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [detail, setDetail] = useState<any>(null);
  const [form, setForm] = useState({ client_id: '', setup_price: 290, monthly_price: 34, start_date: '', special_conditions: '', status: 'pending' });

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [{ data: co }, { data: cl }] = await Promise.all([
      supabase.from('contracts').select('*').order('created_at', { ascending: false }),
      supabase.from('clients').select('id, business_name'),
    ]);
    setContracts(co || []); setClients(cl || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const clientMap = Object.fromEntries(clients.map(c => [c.id, c.business_name]));
  const fmt = (n: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);

  const createContract = async () => {
    if (!form.client_id) { toast.error('Client requis'); return; }
    await supabase.from('contracts').insert({
      client_id: form.client_id, setup_price: form.setup_price, monthly_price: form.monthly_price,
      start_date: form.start_date || null, special_conditions: form.special_conditions || null,
      status: form.status as any,
    });
    toast.success('Contrat créé'); setShowForm(false);
    setForm({ client_id: '', setup_price: 290, monthly_price: 34, start_date: '', special_conditions: '', status: 'pending' });
    fetchData();
  };

  if (loading) return <div className="p-8 text-center" style={{ fontFamily: 'var(--font-b)', color: 'var(--text-light)' }}>Chargement...</div>;

  return (
    <div className="p-4 md:p-6 max-w-[1200px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ScrollText size={24} style={{ color: '#8B5CF6' }} />
          <h1 style={{ fontFamily: 'var(--font-h)', fontSize: 24, color: 'var(--charcoal)' }}>Contrats</h1>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2" style={{ padding: '10px 18px', background: 'var(--teal)', color: '#fff', border: 'none', borderRadius: 12, fontFamily: 'var(--font-b)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          <Plus size={14} /> Nouveau contrat
        </button>
      </div>

      {showForm && (
        <div className="rounded-2xl p-5" style={{ background: 'white', border: '1px solid var(--glass-border)' }}>
          <h3 style={{ fontFamily: 'var(--font-h)', fontSize: 16, color: 'var(--charcoal)', marginBottom: 16 }}>Nouveau contrat</h3>
          <div className="grid md:grid-cols-3 gap-3">
            <select value={form.client_id} onChange={e => setForm({ ...form, client_id: e.target.value })} style={{ padding: '10px 14px', borderRadius: 12, border: '1px solid var(--glass-border)', fontFamily: 'var(--font-b)', fontSize: 13 }}>
              <option value="">Client *</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.business_name}</option>)}
            </select>
            <input type="number" value={form.setup_price} onChange={e => setForm({ ...form, setup_price: Number(e.target.value) })} placeholder="Prix setup" style={{ padding: '10px 14px', borderRadius: 12, border: '1px solid var(--glass-border)', fontFamily: 'var(--font-b)', fontSize: 13 }} />
            <input type="number" value={form.monthly_price} onChange={e => setForm({ ...form, monthly_price: Number(e.target.value) })} placeholder="Prix mensuel" style={{ padding: '10px 14px', borderRadius: 12, border: '1px solid var(--glass-border)', fontFamily: 'var(--font-b)', fontSize: 13 }} />
            <input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} style={{ padding: '10px 14px', borderRadius: 12, border: '1px solid var(--glass-border)', fontFamily: 'var(--font-b)', fontSize: 13 }} />
            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} style={{ padding: '10px 14px', borderRadius: 12, border: '1px solid var(--glass-border)', fontFamily: 'var(--font-b)', fontSize: 13 }}>
              {Object.keys(STATUS_COLORS).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <input value={form.special_conditions} onChange={e => setForm({ ...form, special_conditions: e.target.value })} placeholder="Conditions spéciales" style={{ padding: '10px 14px', borderRadius: 12, border: '1px solid var(--glass-border)', fontFamily: 'var(--font-b)', fontSize: 13 }} />
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={createContract} className="flex items-center gap-2" style={{ padding: '10px 18px', background: 'var(--teal)', color: '#fff', border: 'none', borderRadius: 12, fontFamily: 'var(--font-b)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}><Check size={14} /> Créer</button>
            <button onClick={() => setShowForm(false)} className="flex items-center gap-2" style={{ padding: '10px 18px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 12, fontFamily: 'var(--font-b)', fontSize: 13, cursor: 'pointer', color: 'var(--text-mid)' }}><X size={14} /> Annuler</button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: 'white', border: '1px solid var(--glass-border)' }}>
        <table className="w-full" style={{ fontFamily: 'var(--font-b)', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
              {['Client', 'Setup', 'Mensuel', 'Début', 'Statut'].map(h => (
                <th key={h} className="text-left px-5 py-3" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-light)', fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {contracts.map(c => (
              <tr key={c.id} className="cursor-pointer hover:bg-gray-50 transition-colors" style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }} onClick={() => setDetail(c)}>
                <td className="px-5 py-3 font-medium" style={{ color: 'var(--charcoal)' }}>{clientMap[c.client_id] || '—'}</td>
                <td className="px-5 py-3" style={{ color: 'var(--text-mid)' }}>{fmt(c.setup_price || 0)}</td>
                <td className="px-5 py-3" style={{ color: 'var(--teal)', fontWeight: 600 }}>{fmt(c.monthly_price || 0)}</td>
                <td className="px-5 py-3" style={{ color: 'var(--text-light)', fontSize: 12 }}>{c.start_date || '—'}</td>
                <td className="px-5 py-3">
                  <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: `${STATUS_COLORS[c.status] || '#999'}18`, color: STATUS_COLORS[c.status] || '#999' }}>{c.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detail modal */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="w-full max-w-lg rounded-2xl p-6" style={{ background: 'white' }}>
            <div className="flex items-center justify-between mb-6">
              <h2 style={{ fontFamily: 'var(--font-h)', fontSize: 20, color: 'var(--charcoal)' }}>Détails du contrat</h2>
              <button onClick={() => setDetail(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-mid)' }}><X size={20} /></button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Client', value: clientMap[detail.client_id] || '—' },
                { label: 'Statut', value: detail.status },
                { label: 'Prix setup', value: fmt(detail.setup_price || 0) },
                { label: 'Prix mensuel', value: fmt(detail.monthly_price || 0) },
                { label: 'Date début', value: detail.start_date || '—' },
                { label: 'Date fin', value: detail.end_date || 'Ongoing' },
              ].map((f, i) => (
                <div key={i}>
                  <p style={{ fontFamily: 'var(--font-b)', fontSize: 10, color: 'var(--text-light)', textTransform: 'uppercase' }}>{f.label}</p>
                  <p style={{ fontFamily: 'var(--font-b)', fontSize: 14, color: 'var(--charcoal)', fontWeight: 500 }}>{f.value}</p>
                </div>
              ))}
            </div>
            {detail.special_conditions && (
              <div className="mt-4">
                <p style={{ fontFamily: 'var(--font-b)', fontSize: 10, color: 'var(--text-light)', textTransform: 'uppercase' }}>Conditions spéciales</p>
                <p style={{ fontFamily: 'var(--font-b)', fontSize: 13, color: 'var(--charcoal)', marginTop: 4 }}>{detail.special_conditions}</p>
              </div>
            )}
            {detail.document_url && (
              <a href={detail.document_url} target="_blank" rel="noopener noreferrer" className="block mt-4" style={{ padding: '10px 16px', background: 'var(--teal)', color: '#fff', borderRadius: 12, fontFamily: 'var(--font-b)', fontSize: 13, fontWeight: 600, textAlign: 'center', textDecoration: 'none' }}>Voir le document PDF</a>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminContracts;
