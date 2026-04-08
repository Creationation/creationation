import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Briefcase, Plus, Pencil, Check, X, Power } from 'lucide-react';

const TEXT_PRIMARY = '#1A2332';
const TEXT_SECONDARY = 'rgba(26,35,50,0.55)';
const TEXT_MUTED = 'rgba(26,35,50,0.30)';
const TEAL = '#2A9D8F';

const AdminServices = () => {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', description: '', default_price: 0 });

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('services').select('*').order('created_at', { ascending: false });
    setServices(data || []); setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const save = async () => {
    if (!form.name.trim()) { toast.error('Nom requis'); return; }
    if (editId) { await supabase.from('services').update({ name: form.name, description: form.description || null, default_price: form.default_price }).eq('id', editId); toast.success('Service mis à jour'); }
    else { await supabase.from('services').insert({ name: form.name, description: form.description || null, default_price: form.default_price }); toast.success('Service créé'); }
    setShowForm(false); setEditId(null); setForm({ name: '', description: '', default_price: 0 }); fetchData();
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from('services').update({ is_active: !current }).eq('id', id); fetchData();
  };

  const fmt = (n: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);

  if (loading) return <div className="p-8 text-center" style={{ fontFamily: "'Outfit', sans-serif", color: TEXT_MUTED }}>Chargement...</div>;

  return (
    <div className="p-4 md:p-6 max-w-[1000px] mx-auto space-y-6" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <div className="flex items-center justify-between">
        <h1 className="admin-page-title">Services</h1>
        <button onClick={() => { setShowForm(true); setEditId(null); setForm({ name: '', description: '', default_price: 0 }); }} className="admin-glass-btn" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Plus size={14} /> Ajouter
        </button>
      </div>

      {showForm && (
        <div className="admin-glass-card">
          <div className="relative z-[1]">
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, color: TEXT_PRIMARY, marginBottom: 16 }}>{editId ? 'Modifier' : 'Nouveau'} service</h3>
            <div className="grid md:grid-cols-3 gap-3">
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Nom *" className="admin-glass-input" />
              <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Description" className="admin-glass-input" />
              <input type="number" value={form.default_price} onChange={e => setForm({ ...form, default_price: Number(e.target.value) })} placeholder="Prix par défaut" className="admin-glass-input" />
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={save} className="admin-glass-btn" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Check size={14} /> Sauvegarder</button>
              <button onClick={() => { setShowForm(false); setEditId(null); }} className="admin-glass-btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><X size={14} /> Annuler</button>
            </div>
          </div>
        </div>
      )}

      <div className="admin-glass-table">
        <table className="w-full" style={{ fontSize: 13 }}>
          <thead><tr>
            {['Nom', 'Description', 'Prix', 'Actif', 'Actions'].map(h => (
              <th key={h} className="text-left px-5 py-3" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.2, color: TEXT_MUTED, fontWeight: 600 }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {services.map(s => (
              <tr key={s.id}>
                <td className="px-5 py-3 font-medium" style={{ color: TEXT_PRIMARY }}>{s.name}</td>
                <td className="px-5 py-3" style={{ color: TEXT_SECONDARY }}>{s.description || '—'}</td>
                <td className="px-5 py-3" style={{ color: TEAL, fontWeight: 600 }}>{fmt(s.default_price || 0)}</td>
                <td className="px-5 py-3">
                  <span className="admin-status-badge" style={{ background: s.is_active ? 'rgba(42,157,143,0.12)' : 'rgba(26,35,50,0.06)', color: s.is_active ? TEAL : TEXT_MUTED }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.is_active ? TEAL : TEXT_MUTED }} />
                    {s.is_active ? 'Actif' : 'Inactif'}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => { setEditId(s.id); setForm({ name: s.name, description: s.description || '', default_price: s.default_price || 0 }); setShowForm(true); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: TEAL }}><Pencil size={14} /></button>
                    <button onClick={() => toggleActive(s.id, s.is_active)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: s.is_active ? TEXT_MUTED : TEAL }}><Power size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminServices;
