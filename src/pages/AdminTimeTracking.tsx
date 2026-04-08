import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Clock, Plus } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const TEXT_PRIMARY = '#1A2332';
const TEXT_SECONDARY = 'rgba(26,35,50,0.55)';
const TEXT_MUTED = 'rgba(26,35,50,0.30)';
const TEAL = '#2A9D8F';

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
      client_id: form.client_id, ticket_id: form.ticket_id || null, project_id: form.project_id || null,
      duration_minutes: form.duration_minutes, description: form.description || null, date: form.date,
    });
    toast.success('Temps enregistré');
    setForm({ ...form, duration_minutes: 30, description: '', ticket_id: '', project_id: '' });
    fetchData();
  };

  const clientMap = Object.fromEntries(clients.map(c => [c.id, c.business_name]));
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const monthEntries = entries.filter(e => e.date.startsWith(monthKey));
  const perClient: Record<string, number> = {};
  monthEntries.forEach(e => { perClient[e.client_id] = (perClient[e.client_id] || 0) + e.duration_minutes; });
  const chartData = Object.entries(perClient).map(([cid, mins]) => ({ name: clientMap[cid] || 'Inconnu', minutes: mins })).sort((a, b) => b.minutes - a.minutes);

  const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekTotal = entries.filter(e => new Date(e.date) >= weekStart).reduce((s, e) => s + e.duration_minutes, 0);
  const monthTotal = monthEntries.reduce((s, e) => s + e.duration_minutes, 0);
  const fmtTime = (m: number) => `${Math.floor(m / 60)}h ${m % 60}min`;

  if (loading) return <div className="p-8 text-center" style={{ fontFamily: "'Outfit', sans-serif", color: TEXT_MUTED }}>Chargement...</div>;

  return (
    <div className="p-4 md:p-6 max-w-[1200px] mx-auto space-y-6" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <h1 className="admin-page-title">Time Tracking</h1>

      <div className="grid grid-cols-2 gap-4">
        <div className="admin-glass-card">
          <div className="relative z-[1]">
            <p style={{ fontSize: 11, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 600 }}>Cette semaine</p>
            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, color: '#4da6d9', marginTop: 4 }}>{fmtTime(weekTotal)}</p>
          </div>
        </div>
        <div className="admin-glass-card">
          <div className="relative z-[1]">
            <p style={{ fontSize: 11, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 600 }}>Ce mois</p>
            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, color: TEAL, marginTop: 4 }}>{fmtTime(monthTotal)}</p>
          </div>
        </div>
      </div>

      <div className="admin-glass-card">
        <div className="relative z-[1]">
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, color: TEXT_PRIMARY, marginBottom: 16 }}>Logger du temps</h3>
          <div className="grid md:grid-cols-3 gap-3">
            <select value={form.client_id} onChange={e => setForm({ ...form, client_id: e.target.value, ticket_id: '', project_id: '' })} className="admin-glass-input">
              <option value="">Sélectionner un client *</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.business_name}</option>)}
            </select>
            <select value={form.ticket_id} onChange={e => setForm({ ...form, ticket_id: e.target.value })} className="admin-glass-input">
              <option value="">Ticket (optionnel)</option>
              {tickets.filter(t => t.client_id === form.client_id).map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
            </select>
            <select value={form.project_id} onChange={e => setForm({ ...form, project_id: e.target.value })} className="admin-glass-input">
              <option value="">Projet (optionnel)</option>
              {projects.filter(p => p.client_id === form.client_id).map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
            <input type="number" value={form.duration_minutes} onChange={e => setForm({ ...form, duration_minutes: Number(e.target.value) })} placeholder="Minutes *" className="admin-glass-input" />
            <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="admin-glass-input" />
            <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Description" className="admin-glass-input" />
          </div>
          <button onClick={addEntry} className="admin-glass-btn mt-4" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Plus size={14} /> Enregistrer
          </button>
        </div>
      </div>

      {chartData.length > 0 && (
        <div className="admin-glass-card">
          <div className="relative z-[1]">
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, color: TEXT_PRIMARY, marginBottom: 16 }}>Temps par client (ce mois)</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 11, fontFamily: "'Outfit', sans-serif", fill: TEXT_MUTED }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fontFamily: "'Outfit', sans-serif", fill: TEXT_SECONDARY }} width={120} />
                <Tooltip formatter={(v: number) => `${v} min`} contentStyle={{ borderRadius: 12, background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.3)' }} />
                <Bar dataKey="minutes" fill={TEAL} radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="admin-glass-table">
        <h3 className="p-5 pb-3" style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, color: TEXT_PRIMARY }}>Entrées récentes</h3>
        <table className="w-full" style={{ fontSize: 13 }}>
          <thead><tr>
            {['Client', 'Durée', 'Description', 'Date'].map(h => (
              <th key={h} className="text-left px-5 py-2" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.2, color: TEXT_MUTED, fontWeight: 600 }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {entries.slice(0, 20).map(e => (
              <tr key={e.id}>
                <td className="px-5 py-3" style={{ color: TEXT_PRIMARY, fontWeight: 500 }}>{clientMap[e.client_id] || '—'}</td>
                <td className="px-5 py-3" style={{ color: TEAL, fontWeight: 600 }}>{e.duration_minutes}min</td>
                <td className="px-5 py-3" style={{ color: TEXT_SECONDARY }}>{e.description || '—'}</td>
                <td className="px-5 py-3" style={{ color: TEXT_MUTED, fontSize: 12 }}>{e.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminTimeTracking;
