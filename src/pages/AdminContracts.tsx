import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ScrollText, Plus, X, Check } from 'lucide-react';

const TEXT_PRIMARY = '#1A2332';
const TEXT_SECONDARY = 'rgba(26,35,50,0.55)';
const TEXT_MUTED = 'rgba(26,35,50,0.30)';
const TEAL = '#2A9D8F';
const CORAL = '#E76F51';
const GOLD = '#D4A843';
const PURPLE = '#8B6DB0';

const STATUS_COLORS: Record<string, string> = { pending: GOLD, signed: '#3b82f6', active: TEAL, expired: 'rgba(26,35,50,0.35)', cancelled: CORAL };

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
    setContracts(co || []); setClients(cl || []); setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  const clientMap = Object.fromEntries(clients.map(c => [c.id, c.business_name]));
  const fmt = (n: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);

  const createContract = async () => {
    if (!form.client_id) { toast.error('Client requis'); return; }
    await supabase.from('contracts').insert({
      client_id: form.client_id, setup_price: form.setup_price, monthly_price: form.monthly_price,
      start_date: form.start_date || null, special_conditions: form.special_conditions || null, status: form.status as any,
    });
    toast.success('Contrat créé'); setShowForm(false);
    setForm({ client_id: '', setup_price: 290, monthly_price: 34, start_date: '', special_conditions: '', status: 'pending' });
    fetchData();
  };

  if (loading) return <div className="p-8 text-center" style={{ fontFamily: "'Outfit', sans-serif", color: TEXT_MUTED }}>Chargement...</div>;

  return (
    <div className="p-4 md:p-6 max-w-[1200px] mx-auto space-y-6" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <div className="flex items-center justify-between">
        <h1 className="admin-page-title">Contrats</h1>
        <button onClick={() => setShowForm(true)} className="admin-glass-btn" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Plus size={14} /> Nouveau contrat
        </button>
      </div>

      {showForm && (
        <div className="admin-glass-card">
          <div className="relative z-[1]">
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, color: TEXT_PRIMARY, marginBottom: 16 }}>Nouveau contrat</h3>
            <div className="grid md:grid-cols-3 gap-3">
              <select value={form.client_id} onChange={e => setForm({ ...form, client_id: e.target.value })} className="admin-glass-input">
                <option value="">Client *</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.business_name}</option>)}
              </select>
              <input type="number" value={form.setup_price} onChange={e => setForm({ ...form, setup_price: Number(e.target.value) })} placeholder="Prix setup" className="admin-glass-input" />
              <input type="number" value={form.monthly_price} onChange={e => setForm({ ...form, monthly_price: Number(e.target.value) })} placeholder="Prix mensuel" className="admin-glass-input" />
              <input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} className="admin-glass-input" />
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="admin-glass-input">
                {Object.keys(STATUS_COLORS).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <input value={form.special_conditions} onChange={e => setForm({ ...form, special_conditions: e.target.value })} placeholder="Conditions spéciales" className="admin-glass-input" />
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={createContract} className="admin-glass-btn" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Check size={14} /> Créer</button>
              <button onClick={() => setShowForm(false)} className="admin-glass-btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><X size={14} /> Annuler</button>
            </div>
          </div>
        </div>
      )}

      <div className="admin-glass-table">
        <table className="w-full" style={{ fontSize: 13 }}>
          <thead><tr>
            {['Client', 'Setup', 'Mensuel', 'Début', 'Statut'].map(h => (
              <th key={h} className="text-left px-5 py-3" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.2, color: TEXT_MUTED, fontWeight: 600 }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {contracts.map(c => (
              <tr key={c.id} className="cursor-pointer" onClick={() => setDetail(c)}>
                <td className="px-5 py-3 font-medium" style={{ color: TEXT_PRIMARY }}>{clientMap[c.client_id] || '—'}</td>
                <td className="px-5 py-3" style={{ color: TEXT_SECONDARY }}>{fmt(c.setup_price || 0)}</td>
                <td className="px-5 py-3" style={{ color: TEAL, fontWeight: 600 }}>{fmt(c.monthly_price || 0)}</td>
                <td className="px-5 py-3" style={{ color: TEXT_MUTED, fontSize: 12 }}>{c.start_date || '—'}</td>
                <td className="px-5 py-3">
                  <span className="admin-status-badge" style={{ background: `${STATUS_COLORS[c.status] || '#999'}20`, color: STATUS_COLORS[c.status] || '#999' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: STATUS_COLORS[c.status], boxShadow: `0 0 6px ${STATUS_COLORS[c.status]}55` }} />
                    {c.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="w-full max-w-lg admin-glass-modal p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: TEXT_PRIMARY }}>Détails du contrat</h2>
              <button onClick={() => setDetail(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: TEXT_SECONDARY }}><X size={20} /></button>
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
                  <p style={{ fontSize: 10, color: TEXT_MUTED, textTransform: 'uppercase' }}>{f.label}</p>
                  <p style={{ fontSize: 14, color: TEXT_PRIMARY, fontWeight: 500 }}>{f.value}</p>
                </div>
              ))}
            </div>
            {detail.special_conditions && (
              <div className="mt-4">
                <p style={{ fontSize: 10, color: TEXT_MUTED, textTransform: 'uppercase' }}>Conditions spéciales</p>
                <p style={{ fontSize: 13, color: TEXT_PRIMARY, marginTop: 4 }}>{detail.special_conditions}</p>
              </div>
            )}
            {detail.document_url && (
              <a href={detail.document_url} target="_blank" rel="noopener noreferrer" className="admin-glass-btn block mt-4 text-center" style={{ textDecoration: 'none' }}>Voir le document PDF</a>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminContracts;
