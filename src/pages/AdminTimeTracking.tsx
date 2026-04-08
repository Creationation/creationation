import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Clock, Plus } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const AdminTimeTracking = () => {
  const [entries, setEntries] = useState<any[]>([]);
  const [clients, setClients] = useState<{ id: string; business_name: string }[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ client_id: '', ticket_id: '', project_id: '', duration_minutes: 30, description: '', date: new Date().toISOString().split('T')[0] });

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [{ data: e }, { data: c }, { data: t }, { data: p }] = await Promise.all([
      supabase.from('time_tracking').select('*').order('date', { ascending: false }).limit(50),
      supabase.from('clients').select('id, business_name'),
      supabase.from('support_tickets').select('id, title, client_id'),
      supabase.from('projects').select('id, title, client_id'),
    ]);
    setEntries(e || []); setClients(c || []); setTickets(t || []); setProjects(p || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const addEntry = async () => {
    if (!form.client_id || !form.duration_minutes) { toast.error('Client et durée requis'); return; }
    await supabase.from('time_tracking').insert({
      client_id: form.client_id,
      ticket_id: form.ticket_id || null,
      project_id: form.project_id || null,
      duration_minutes: form.duration_minutes,
      description: form.description || null,
      date: form.date,
    });
    toast.success('Temps enregistré');
    setForm({ ...form, duration_minutes: 30, description: '', ticket_id: '', project_id: '' });
    fetchData();
  };

  const clientMap = Object.fromEntries(clients.map(c => [c.id, c.business_name]));

  // Chart data: time per client this month
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const monthEntries = entries.filter(e => e.date.startsWith(monthKey));
  const perClient: Record<string, number> = {};
  monthEntries.forEach(e => { perClient[e.client_id] = (perClient[e.client_id] || 0) + e.duration_minutes; });
  const chartData = Object.entries(perClient).map(([cid, mins]) => ({ name: clientMap[cid] || 'Inconnu', minutes: mins })).sort((a, b) => b.minutes - a.minutes);

  // Week/month summaries
  const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekTotal = entries.filter(e => new Date(e.date) >= weekStart).reduce((s, e) => s + e.duration_minutes, 0);
  const monthTotal = monthEntries.reduce((s, e) => s + e.duration_minutes, 0);
  const fmtTime = (m: number) => `${Math.floor(m / 60)}h ${m % 60}min`;

  if (loading) return <div className="p-8 text-center" style={{ fontFamily: 'var(--font-b)', color: 'var(--text-light)' }}>Chargement...</div>;

  return (
    <div className="p-4 md:p-6 max-w-[1200px] mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Clock size={24} style={{ color: 'var(--sky)' }} />
        <h1 style={{ fontFamily: 'var(--font-h)', fontSize: 24, color: 'var(--charcoal)' }}>Time Tracking</h1>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl p-4" style={{ background: 'white', border: '1px solid var(--glass-border)' }}>
          <p style={{ fontFamily: 'var(--font-b)', fontSize: 11, color: 'var(--text-light)' }}>Cette semaine</p>
          <p style={{ fontFamily: 'var(--font-h)', fontSize: 24, color: 'var(--sky)' }}>{fmtTime(weekTotal)}</p>
        </div>
        <div className="rounded-2xl p-4" style={{ background: 'white', border: '1px solid var(--glass-border)' }}>
          <p style={{ fontFamily: 'var(--font-b)', fontSize: 11, color: 'var(--text-light)' }}>Ce mois</p>
          <p style={{ fontFamily: 'var(--font-h)', fontSize: 24, color: 'var(--teal)' }}>{fmtTime(monthTotal)}</p>
        </div>
      </div>

      {/* Form */}
      <div className="rounded-2xl p-5" style={{ background: 'white', border: '1px solid var(--glass-border)' }}>
        <h3 style={{ fontFamily: 'var(--font-h)', fontSize: 16, color: 'var(--charcoal)', marginBottom: 16 }}>Logger du temps</h3>
        <div className="grid md:grid-cols-3 gap-3">
          <select value={form.client_id} onChange={e => setForm({ ...form, client_id: e.target.value, ticket_id: '', project_id: '' })} style={{ padding: '10px 14px', borderRadius: 12, border: '1px solid var(--glass-border)', fontFamily: 'var(--font-b)', fontSize: 13 }}>
            <option value="">Sélectionner un client *</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.business_name}</option>)}
          </select>
          <select value={form.ticket_id} onChange={e => setForm({ ...form, ticket_id: e.target.value })} style={{ padding: '10px 14px', borderRadius: 12, border: '1px solid var(--glass-border)', fontFamily: 'var(--font-b)', fontSize: 13 }}>
            <option value="">Ticket (optionnel)</option>
            {tickets.filter(t => t.client_id === form.client_id).map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
          </select>
          <select value={form.project_id} onChange={e => setForm({ ...form, project_id: e.target.value })} style={{ padding: '10px 14px', borderRadius: 12, border: '1px solid var(--glass-border)', fontFamily: 'var(--font-b)', fontSize: 13 }}>
            <option value="">Projet (optionnel)</option>
            {projects.filter(p => p.client_id === form.client_id).map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
          <input type="number" value={form.duration_minutes} onChange={e => setForm({ ...form, duration_minutes: Number(e.target.value) })} placeholder="Minutes *" style={{ padding: '10px 14px', borderRadius: 12, border: '1px solid var(--glass-border)', fontFamily: 'var(--font-b)', fontSize: 13 }} />
          <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} style={{ padding: '10px 14px', borderRadius: 12, border: '1px solid var(--glass-border)', fontFamily: 'var(--font-b)', fontSize: 13 }} />
          <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Description" style={{ padding: '10px 14px', borderRadius: 12, border: '1px solid var(--glass-border)', fontFamily: 'var(--font-b)', fontSize: 13 }} />
        </div>
        <button onClick={addEntry} className="flex items-center gap-2 mt-4" style={{ padding: '10px 20px', background: 'var(--teal)', color: '#fff', border: 'none', borderRadius: 12, fontFamily: 'var(--font-b)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          <Plus size={14} /> Enregistrer
        </button>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="rounded-2xl p-5" style={{ background: 'white', border: '1px solid var(--glass-border)' }}>
          <h3 style={{ fontFamily: 'var(--font-h)', fontSize: 16, color: 'var(--charcoal)', marginBottom: 16 }}>Temps par client (ce mois)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 11, fontFamily: 'var(--font-b)' }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fontFamily: 'var(--font-b)' }} width={120} />
              <Tooltip formatter={(v: number) => `${v} min`} />
              <Bar dataKey="minutes" fill="var(--sky)" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent entries */}
      <div className="rounded-2xl overflow-hidden" style={{ background: 'white', border: '1px solid var(--glass-border)' }}>
        <h3 className="p-5 pb-3" style={{ fontFamily: 'var(--font-h)', fontSize: 16, color: 'var(--charcoal)' }}>Entrées récentes</h3>
        <table className="w-full" style={{ fontFamily: 'var(--font-b)', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
              {['Client', 'Durée', 'Description', 'Date'].map(h => (
                <th key={h} className="text-left px-5 py-2" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-light)', fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {entries.slice(0, 20).map(e => (
              <tr key={e.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                <td className="px-5 py-3" style={{ color: 'var(--charcoal)', fontWeight: 500 }}>{clientMap[e.client_id] || '—'}</td>
                <td className="px-5 py-3" style={{ color: 'var(--teal)', fontWeight: 600 }}>{e.duration_minutes}min</td>
                <td className="px-5 py-3" style={{ color: 'var(--text-mid)' }}>{e.description || '—'}</td>
                <td className="px-5 py-3" style={{ color: 'var(--text-light)', fontSize: 12 }}>{e.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminTimeTracking;
