import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Briefcase, Plus, Pencil, Check, X, Power } from 'lucide-react';

const AdminServices = () => {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', description: '', default_price: 0 });

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('services').select('*').order('created_at', { ascending: false });
    setServices(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const save = async () => {
    if (!form.name.trim()) { toast.error('Nom requis'); return; }
    if (editId) {
      await supabase.from('services').update({ name: form.name, description: form.description || null, default_price: form.default_price }).eq('id', editId);
      toast.success('Service mis à jour');
    } else {
      await supabase.from('services').insert({ name: form.name, description: form.description || null, default_price: form.default_price });
      toast.success('Service créé');
    }
    setShowForm(false); setEditId(null); setForm({ name: '', description: '', default_price: 0 }); fetchData();
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from('services').update({ is_active: !current }).eq('id', id);
    fetchData();
  };

  const fmt = (n: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);

  if (loading) return <div className="p-8 text-center" style={{ fontFamily: 'var(--font-b)', color: 'var(--text-light)' }}>Chargement...</div>;

  return (
    <div className="p-4 md:p-6 max-w-[1000px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Briefcase size={24} style={{ color: 'var(--teal)' }} />
          <h1 style={{ fontFamily: 'var(--font-h)', fontSize: 24, color: 'var(--charcoal)' }}>Services</h1>
        </div>
        <button onClick={() => { setShowForm(true); setEditId(null); setForm({ name: '', description: '', default_price: 0 }); }} className="flex items-center gap-2" style={{ padding: '10px 18px', background: 'var(--teal)', color: '#fff', border: 'none', borderRadius: 12, fontFamily: 'var(--font-b)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          <Plus size={14} /> Ajouter
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="rounded-2xl p-5" style={{ background: 'white', border: '1px solid var(--glass-border)' }}>
          <h3 style={{ fontFamily: 'var(--font-h)', fontSize: 16, color: 'var(--charcoal)', marginBottom: 16 }}>{editId ? 'Modifier' : 'Nouveau'} service</h3>
          <div className="grid md:grid-cols-3 gap-3">
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Nom *" style={{ padding: '10px 14px', borderRadius: 12, border: '1px solid var(--glass-border)', fontFamily: 'var(--font-b)', fontSize: 13 }} />
            <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Description" style={{ padding: '10px 14px', borderRadius: 12, border: '1px solid var(--glass-border)', fontFamily: 'var(--font-b)', fontSize: 13 }} />
            <input type="number" value={form.default_price} onChange={e => setForm({ ...form, default_price: Number(e.target.value) })} placeholder="Prix par défaut" style={{ padding: '10px 14px', borderRadius: 12, border: '1px solid var(--glass-border)', fontFamily: 'var(--font-b)', fontSize: 13 }} />
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={save} className="flex items-center gap-2" style={{ padding: '10px 18px', background: 'var(--teal)', color: '#fff', border: 'none', borderRadius: 12, fontFamily: 'var(--font-b)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}><Check size={14} /> Sauvegarder</button>
            <button onClick={() => { setShowForm(false); setEditId(null); }} className="flex items-center gap-2" style={{ padding: '10px 18px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 12, fontFamily: 'var(--font-b)', fontSize: 13, cursor: 'pointer', color: 'var(--text-mid)' }}><X size={14} /> Annuler</button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: 'white', border: '1px solid var(--glass-border)' }}>
        <table className="w-full" style={{ fontFamily: 'var(--font-b)', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
              {['Nom', 'Description', 'Prix', 'Actif', 'Actions'].map(h => (
                <th key={h} className="text-left px-5 py-3" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-light)', fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {services.map(s => (
              <tr key={s.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                <td className="px-5 py-3 font-medium" style={{ color: 'var(--charcoal)' }}>{s.name}</td>
                <td className="px-5 py-3" style={{ color: 'var(--text-mid)' }}>{s.description || '—'}</td>
                <td className="px-5 py-3" style={{ color: 'var(--teal)', fontWeight: 600 }}>{fmt(s.default_price || 0)}</td>
                <td className="px-5 py-3">
                  <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: s.is_active ? 'rgba(16,185,129,0.1)' : 'rgba(107,114,128,0.1)', color: s.is_active ? '#10b981' : '#6b7280' }}>{s.is_active ? 'Actif' : 'Inactif'}</span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => { setEditId(s.id); setForm({ name: s.name, description: s.description || '', default_price: s.default_price || 0 }); setShowForm(true); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--teal)' }}><Pencil size={14} /></button>
                    <button onClick={() => toggleActive(s.id, s.is_active)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: s.is_active ? '#6b7280' : '#10b981' }}><Power size={14} /></button>
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
