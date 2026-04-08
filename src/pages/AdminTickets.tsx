import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { LayoutGrid, List, Search, Filter, X, MessageSquare, Send } from 'lucide-react';

type TicketRow = {
  id: string; title: string; description: string | null; status: string; priority: string;
  category: string | null; client_id: string; project_id: string | null;
  created_at: string; updated_at: string; assigned_to: string | null;
  client_name?: string;
};

const STATUS_COLS: { key: string; label: string; color: string }[] = [
  { key: 'open', label: 'Ouvert', color: '#ef4444' },
  { key: 'in_progress', label: 'En cours', color: '#f59e0b' },
  { key: 'waiting_client', label: 'Attente client', color: '#8b5cf6' },
  { key: 'resolved', label: 'Résolu', color: '#10b981' },
  { key: 'closed', label: 'Fermé', color: '#6b7280' },
];

const PRIORITY_COLORS: Record<string, string> = { urgent: '#ef4444', high: '#f97316', medium: '#f59e0b', low: '#10b981' };
const CATEGORY_LABELS: Record<string, string> = { bug: 'Bug', feature_request: 'Feature', modification: 'Modification', question: 'Question', other: 'Autre' };

const AdminTickets = () => {
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [clients, setClients] = useState<{ id: string; business_name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'kanban' | 'list'>('kanban');
  const [clientFilter, setClientFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [detail, setDetail] = useState<TicketRow | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMsg, setNewMsg] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [{ data: t }, { data: c }] = await Promise.all([
      supabase.from('support_tickets').select('*').order('created_at', { ascending: false }),
      supabase.from('clients').select('id, business_name'),
    ]);
    const cMap = Object.fromEntries((c || []).map(cl => [cl.id, cl.business_name]));
    setTickets((t || []).map(tk => ({ ...tk, client_name: cMap[tk.client_id] || 'Inconnu' })));
    setClients(c || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = tickets.filter(t => {
    if (clientFilter !== 'all' && t.client_id !== clientFilter) return false;
    if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
    if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return t.title.toLowerCase().includes(q) || (t.client_name || '').toLowerCase().includes(q);
    }
    return true;
  });

  const updateStatus = async (id: string, status: string) => {
    const updates: any = { status };
    if (status === 'resolved') updates.resolved_at = new Date().toISOString();
    if (status === 'closed') updates.closed_at = new Date().toISOString();
    await supabase.from('support_tickets').update(updates).eq('id', id);
    toast.success('Statut mis à jour');
    fetchData();
    if (detail?.id === id) setDetail(prev => prev ? { ...prev, status } : null);
  };

  const openDetail = async (ticket: TicketRow) => {
    setDetail(ticket);
    const { data } = await supabase.from('ticket_messages').select('*').eq('ticket_id', ticket.id).order('created_at', { ascending: true });
    setMessages(data || []);
  };

  const sendMessage = async () => {
    if (!newMsg.trim() || !detail) return;
    await supabase.from('ticket_messages').insert({
      ticket_id: detail.id, author_type: 'admin' as any, author_name: 'Admin', content: newMsg.trim(),
    });
    setNewMsg('');
    const { data } = await supabase.from('ticket_messages').select('*').eq('ticket_id', detail.id).order('created_at', { ascending: true });
    setMessages(data || []);
  };

  const handleDragStart = (e: React.DragEvent, ticketId: string) => {
    e.dataTransfer.setData('ticketId', ticketId);
  };
  const handleDrop = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    const ticketId = e.dataTransfer.getData('ticketId');
    if (ticketId) updateStatus(ticketId, status);
  };

  if (loading) return <div className="p-8 text-center" style={{ fontFamily: 'var(--font-b)', color: 'var(--text-light)' }}>Chargement...</div>;

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 style={{ fontFamily: 'var(--font-h)', fontSize: 24, color: 'var(--charcoal)' }}>Tickets Support</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => setView('kanban')} style={{
            padding: '8px 14px', borderRadius: 10, border: '1px solid var(--glass-border)',
            background: view === 'kanban' ? 'var(--teal)' : 'white', color: view === 'kanban' ? '#fff' : 'var(--text-mid)',
            fontFamily: 'var(--font-b)', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
          }}><LayoutGrid size={14} /> Kanban</button>
          <button onClick={() => setView('list')} style={{
            padding: '8px 14px', borderRadius: 10, border: '1px solid var(--glass-border)',
            background: view === 'list' ? 'var(--teal)' : 'white', color: view === 'list' ? '#fff' : 'var(--text-mid)',
            fontFamily: 'var(--font-b)', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
          }}><List size={14} /> Liste</button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex items-center gap-2 flex-1 min-w-[180px]" style={{ padding: '8px 14px', background: 'white', borderRadius: 12, border: '1px solid var(--glass-border)' }}>
          <Search size={14} style={{ color: 'var(--text-light)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." style={{ flex: 1, border: 'none', outline: 'none', fontFamily: 'var(--font-b)', fontSize: 13, background: 'transparent' }} />
        </div>
        <select value={clientFilter} onChange={e => setClientFilter(e.target.value)} style={{ padding: '8px 14px', borderRadius: 12, border: '1px solid var(--glass-border)', fontFamily: 'var(--font-b)', fontSize: 13, background: 'white', cursor: 'pointer' }}>
          <option value="all">Tous les clients</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.business_name}</option>)}
        </select>
        <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} style={{ padding: '8px 14px', borderRadius: 12, border: '1px solid var(--glass-border)', fontFamily: 'var(--font-b)', fontSize: 13, background: 'white', cursor: 'pointer' }}>
          <option value="all">Priorité</option>
          <option value="urgent">Urgent</option>
          <option value="high">Haute</option>
          <option value="medium">Moyenne</option>
          <option value="low">Basse</option>
        </select>
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} style={{ padding: '8px 14px', borderRadius: 12, border: '1px solid var(--glass-border)', fontFamily: 'var(--font-b)', fontSize: 13, background: 'white', cursor: 'pointer' }}>
          <option value="all">Catégorie</option>
          {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {/* Kanban View */}
      {view === 'kanban' && (
        <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: 400 }}>
          {STATUS_COLS.map(col => {
            const colTickets = filtered.filter(t => t.status === col.key);
            return (
              <div
                key={col.key}
                className="flex-shrink-0 flex flex-col"
                style={{ width: 280, minHeight: 300 }}
                onDragOver={e => e.preventDefault()}
                onDrop={e => handleDrop(e, col.key)}
              >
                <div className="flex items-center gap-2 mb-3 px-1">
                  <div style={{ width: 10, height: 10, borderRadius: 99, background: col.color }} />
                  <span style={{ fontFamily: 'var(--font-b)', fontSize: 13, fontWeight: 600, color: 'var(--charcoal)' }}>{col.label}</span>
                  <span style={{ fontFamily: 'var(--font-m)', fontSize: 11, color: 'var(--text-light)', marginLeft: 'auto' }}>{colTickets.length}</span>
                </div>
                <div className="flex-1 space-y-2 p-2 rounded-2xl" style={{ background: `${col.color}08`, minHeight: 200 }}>
                  {colTickets.map(t => (
                    <div
                      key={t.id}
                      draggable
                      onDragStart={e => handleDragStart(e, t.id)}
                      onClick={() => openDetail(t)}
                      className="rounded-xl p-3 cursor-pointer hover:shadow-md transition-shadow"
                      style={{ background: 'white', border: '1px solid var(--glass-border)' }}
                    >
                      <div style={{ fontFamily: 'var(--font-b)', fontSize: 13, fontWeight: 600, color: 'var(--charcoal)', marginBottom: 6 }}>{t.title}</div>
                      <div style={{ fontFamily: 'var(--font-b)', fontSize: 11, color: 'var(--text-light)', marginBottom: 6 }}>{t.client_name}</div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 600, fontFamily: 'var(--font-b)', background: `${PRIORITY_COLORS[t.priority]}18`, color: PRIORITY_COLORS[t.priority] }}>{t.priority}</span>
                        {t.category && <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 10, fontFamily: 'var(--font-b)', background: 'rgba(0,0,0,0.04)', color: 'var(--text-mid)' }}>{CATEGORY_LABELS[t.category] || t.category}</span>}
                        <span style={{ fontFamily: 'var(--font-m)', fontSize: 9, color: 'var(--text-light)', marginLeft: 'auto' }}>{new Date(t.created_at).toLocaleDateString('fr-FR')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List View */}
      {view === 'list' && (
        <div className="rounded-2xl overflow-hidden" style={{ background: 'white', border: '1px solid var(--glass-border)' }}>
          <table className="w-full" style={{ fontFamily: 'var(--font-b)', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                {['Titre', 'Client', 'Statut', 'Priorité', 'Catégorie', 'Date'].map(h => (
                  <th key={h} className="text-left px-4 py-3" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-light)', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => (
                <tr key={t.id} className="cursor-pointer hover:bg-gray-50 transition-colors" style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }} onClick={() => openDetail(t)}>
                  <td className="px-4 py-3 font-medium" style={{ color: 'var(--charcoal)' }}>{t.title}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-mid)' }}>{t.client_name}</td>
                  <td className="px-4 py-3">
                    <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: `${STATUS_COLS.find(s => s.key === t.status)?.color || '#999'}18`, color: STATUS_COLS.find(s => s.key === t.status)?.color || '#999' }}>
                      {STATUS_COLS.find(s => s.key === t.status)?.label || t.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: `${PRIORITY_COLORS[t.priority]}18`, color: PRIORITY_COLORS[t.priority] }}>{t.priority}</span>
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-mid)' }}>{CATEGORY_LABELS[t.category || ''] || '—'}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-light)', fontSize: 12 }}>{new Date(t.created_at).toLocaleDateString('fr-FR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Ticket Detail Modal */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl overflow-hidden" style={{ background: 'white' }}>
            {/* Header */}
            <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid var(--glass-border)' }}>
              <h2 style={{ fontFamily: 'var(--font-h)', fontSize: 18, color: 'var(--charcoal)' }}>{detail.title}</h2>
              <button onClick={() => setDetail(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-mid)' }}><X size={20} /></button>
            </div>

            {/* Controls */}
            <div className="flex flex-wrap gap-3 p-5 pb-3">
              <div>
                <label style={{ fontFamily: 'var(--font-b)', fontSize: 10, color: 'var(--text-light)', textTransform: 'uppercase' }}>Statut</label>
                <select value={detail.status} onChange={e => updateStatus(detail.id, e.target.value)} style={{ display: 'block', padding: '6px 12px', borderRadius: 8, border: '1px solid var(--glass-border)', fontFamily: 'var(--font-b)', fontSize: 12, cursor: 'pointer', marginTop: 4 }}>
                  {STATUS_COLS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontFamily: 'var(--font-b)', fontSize: 10, color: 'var(--text-light)', textTransform: 'uppercase' }}>Priorité</label>
                <select value={detail.priority} onChange={async e => {
                  await supabase.from('support_tickets').update({ priority: e.target.value as any }).eq('id', detail.id);
                  setDetail(prev => prev ? { ...prev, priority: e.target.value } : null);
                  fetchData();
                }} style={{ display: 'block', padding: '6px 12px', borderRadius: 8, border: '1px solid var(--glass-border)', fontFamily: 'var(--font-b)', fontSize: 12, cursor: 'pointer', marginTop: 4 }}>
                  <option value="low">Basse</option>
                  <option value="medium">Moyenne</option>
                  <option value="high">Haute</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div className="flex-1">
                <label style={{ fontFamily: 'var(--font-b)', fontSize: 10, color: 'var(--text-light)', textTransform: 'uppercase' }}>Client</label>
                <p style={{ fontFamily: 'var(--font-b)', fontSize: 13, color: 'var(--charcoal)', marginTop: 4 }}>{detail.client_name}</p>
              </div>
            </div>

            {detail.description && (
              <div className="px-5 pb-3">
                <p style={{ fontFamily: 'var(--font-b)', fontSize: 13, color: 'var(--text-mid)', background: 'rgba(0,0,0,0.02)', padding: 12, borderRadius: 12 }}>{detail.description}</p>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3" style={{ minHeight: 150, maxHeight: 300 }}>
              {messages.map(m => (
                <div key={m.id} className={`flex ${m.author_type === 'admin' ? 'justify-start' : 'justify-end'}`}>
                  <div style={{
                    maxWidth: '75%', padding: '10px 14px', borderRadius: 16,
                    background: m.author_type === 'admin' ? 'rgba(13,138,111,0.08)' : 'rgba(124,92,191,0.08)',
                    borderBottomLeftRadius: m.author_type === 'admin' ? 4 : 16,
                    borderBottomRightRadius: m.author_type === 'admin' ? 16 : 4,
                  }}>
                    <p style={{ fontFamily: 'var(--font-b)', fontSize: 10, fontWeight: 600, color: m.author_type === 'admin' ? 'var(--teal)' : 'var(--violet)', marginBottom: 2 }}>{m.author_name || m.author_type}</p>
                    <p style={{ fontFamily: 'var(--font-b)', fontSize: 13, color: 'var(--charcoal)' }}>{m.content}</p>
                    <p style={{ fontFamily: 'var(--font-m)', fontSize: 9, color: 'var(--text-light)', marginTop: 4 }}>{new Date(m.created_at).toLocaleString('fr-FR')}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Send message */}
            <div className="flex items-center gap-2 p-4" style={{ borderTop: '1px solid var(--glass-border)' }}>
              <input value={newMsg} onChange={e => setNewMsg(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} placeholder="Répondre..." style={{ flex: 1, padding: '10px 14px', borderRadius: 12, border: '1px solid var(--glass-border)', fontFamily: 'var(--font-b)', fontSize: 13, outline: 'none' }} />
              <button onClick={sendMessage} style={{ padding: '10px 16px', background: 'var(--teal)', color: '#fff', border: 'none', borderRadius: 12, cursor: 'pointer' }}><Send size={16} /></button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTickets;
