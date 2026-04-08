import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { LayoutGrid, List, Search, X, Send } from 'lucide-react';
import { TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED, TEAL, CORAL, GOLD, PURPLE } from '@/lib/adminTheme';


type TicketRow = {
  id: string; title: string; description: string | null; status: string; priority: string;
  category: string | null; client_id: string; project_id: string | null;
  created_at: string; updated_at: string; assigned_to: string | null; client_name?: string;
};

const STATUS_COLS = [
  { key: 'open', label: 'Ouvert', color: CORAL },
  { key: 'in_progress', label: 'En cours', color: GOLD },
  { key: 'waiting_client', label: 'Attente client', color: PURPLE },
  { key: 'resolved', label: 'Résolu', color: TEAL },
  { key: 'closed', label: 'Fermé', color: '#9a9490' },
];

const PRIORITY_COLORS: Record<string, string> = { urgent: '#CC3333', high: CORAL, medium: GOLD, low: TEXT_MUTED };
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
    if (search) { const q = search.toLowerCase(); return t.title.toLowerCase().includes(q) || (t.client_name || '').toLowerCase().includes(q); }
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
    await supabase.from('ticket_messages').insert({ ticket_id: detail.id, author_type: 'admin' as any, author_name: 'Admin', content: newMsg.trim() });
    setNewMsg('');
    const { data } = await supabase.from('ticket_messages').select('*').eq('ticket_id', detail.id).order('created_at', { ascending: true });
    setMessages(data || []);
  };

  const handleDragStart = (e: React.DragEvent, ticketId: string) => { e.dataTransfer.setData('ticketId', ticketId); };
  const handleDrop = (e: React.DragEvent, status: string) => { e.preventDefault(); const ticketId = e.dataTransfer.getData('ticketId'); if (ticketId) updateStatus(ticketId, status); };

  if (loading) return <div className="p-8 text-center" style={{ fontFamily: "'Outfit', sans-serif", color: TEXT_MUTED }}>Chargement...</div>;

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="admin-page-title">Tickets Support</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => setView('kanban')} className={view === 'kanban' ? 'admin-glass-btn' : 'admin-glass-btn-secondary'} style={{ padding: '8px 14px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4, ...(view === 'kanban' ? { background: `linear-gradient(135deg, ${TEAL}, #3EDDC7)`, color: '#fff' } : {}) }}>
            <LayoutGrid size={14} /> Kanban
          </button>
          <button onClick={() => setView('list')} className={view === 'list' ? 'admin-glass-btn' : 'admin-glass-btn-secondary'} style={{ padding: '8px 14px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4, ...(view === 'list' ? { background: `linear-gradient(135deg, ${TEAL}, #3EDDC7)`, color: '#fff' } : {}) }}>
            <List size={14} /> Liste
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex items-center gap-2 flex-1 min-w-[180px] admin-glass-input" style={{ padding: '8px 14px' }}>
          <Search size={14} style={{ color: TEXT_MUTED }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." style={{ flex: 1, border: 'none', outline: 'none', fontFamily: "'Outfit', sans-serif", fontSize: 13, background: 'transparent', color: TEXT_PRIMARY }} />
        </div>
        <select value={clientFilter} onChange={e => setClientFilter(e.target.value)} className="admin-glass-input" style={{ cursor: 'pointer' }}>
          <option value="all">Tous les clients</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.business_name}</option>)}
        </select>
        <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} className="admin-glass-input" style={{ cursor: 'pointer' }}>
          <option value="all">Priorité</option>
          <option value="urgent">Urgent</option><option value="high">Haute</option><option value="medium">Moyenne</option><option value="low">Basse</option>
        </select>
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="admin-glass-input" style={{ cursor: 'pointer' }}>
          <option value="all">Catégorie</option>
          {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {/* Kanban */}
      {view === 'kanban' && (
        <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: 400 }}>
          {STATUS_COLS.map(col => {
            const colTickets = filtered.filter(t => t.status === col.key);
            return (
              <div key={col.key} className="flex-shrink-0 flex flex-col" style={{ width: 280 }}
                onDragOver={e => e.preventDefault()} onDrop={e => handleDrop(e, col.key)}>
                <div className="flex items-center gap-2 mb-3 px-1">
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: col.color, boxShadow: `0 0 6px ${col.color}55` }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY }}>{col.label}</span>
                  <span style={{ fontSize: 11, color: TEXT_MUTED, marginLeft: 'auto' }}>{colTickets.length}</span>
                </div>
                <div className="flex-1 space-y-2 p-2 rounded-2xl" style={{ background: `${col.color}08`, minHeight: 200 }}>
                  {colTickets.map(t => (
                    <div key={t.id} draggable onDragStart={e => handleDragStart(e, t.id)} onClick={() => openDetail(t)}
                      className="admin-glass-card cursor-pointer" style={{ padding: 14, borderRadius: 14 }}>
                      <div className="relative z-[1]">
                        <div style={{ fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY, marginBottom: 6 }}>{t.title}</div>
                        <div style={{ fontSize: 11, color: TEXT_MUTED, marginBottom: 6 }}>{t.client_name}</div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="admin-status-badge" style={{ padding: '2px 8px', fontSize: 10, background: `${PRIORITY_COLORS[t.priority]}20`, color: PRIORITY_COLORS[t.priority] }}>{t.priority}</span>
                          {t.category && <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 10, background: 'rgba(255,255,255,0.25)', color: TEXT_SECONDARY }}>{CATEGORY_LABELS[t.category] || t.category}</span>}
                          <span style={{ fontSize: 9, color: TEXT_MUTED, marginLeft: 'auto' }}>{new Date(t.created_at).toLocaleDateString('fr-FR')}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List */}
      {view === 'list' && (
        <div className="admin-glass-table">
          <table className="w-full" style={{ fontSize: 13 }}>
            <thead>
              <tr>
                {['Titre', 'Client', 'Statut', 'Priorité', 'Catégorie', 'Date'].map(h => (
                  <th key={h} className="text-left px-4 py-3" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.2, color: TEXT_MUTED, fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => (
                <tr key={t.id} className="cursor-pointer" onClick={() => openDetail(t)}>
                  <td className="px-4 py-3 font-medium" style={{ color: TEXT_PRIMARY }}>{t.title}</td>
                  <td className="px-4 py-3" style={{ color: TEXT_SECONDARY }}>{t.client_name}</td>
                  <td className="px-4 py-3">
                    <span className="admin-status-badge" style={{ background: `${STATUS_COLS.find(s => s.key === t.status)?.color || '#999'}20`, color: STATUS_COLS.find(s => s.key === t.status)?.color || '#999' }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: STATUS_COLS.find(s => s.key === t.status)?.color, boxShadow: `0 0 6px ${STATUS_COLS.find(s => s.key === t.status)?.color}55` }} />
                      {STATUS_COLS.find(s => s.key === t.status)?.label || t.status}
                    </span>
                  </td>
                  <td className="px-4 py-3"><span style={{ fontSize: 12, fontWeight: 600, color: PRIORITY_COLORS[t.priority] }}>{t.priority}</span></td>
                  <td className="px-4 py-3" style={{ color: TEXT_SECONDARY }}>{CATEGORY_LABELS[t.category || ''] || '—'}</td>
                  <td className="px-4 py-3" style={{ color: TEXT_MUTED, fontSize: 12 }}>{new Date(t.created_at).toLocaleDateString('fr-FR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Modal */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="w-full max-w-2xl max-h-[90vh] flex flex-col admin-glass-modal">
            <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.55)' }}>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: TEXT_PRIMARY }}>{detail.title}</h2>
              <button onClick={() => setDetail(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: TEXT_SECONDARY }}><X size={20} /></button>
            </div>
            <div className="flex flex-wrap gap-3 p-5 pb-3">
              <div>
                <label style={{ fontSize: 10, color: TEXT_MUTED, textTransform: 'uppercase' }}>Statut</label>
                <select value={detail.status} onChange={e => updateStatus(detail.id, e.target.value)} className="admin-glass-input" style={{ display: 'block', marginTop: 4, cursor: 'pointer', fontSize: 12, padding: '6px 12px' }}>
                  {STATUS_COLS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 10, color: TEXT_MUTED, textTransform: 'uppercase' }}>Priorité</label>
                <select value={detail.priority} onChange={async e => {
                  await supabase.from('support_tickets').update({ priority: e.target.value as any }).eq('id', detail.id);
                  setDetail(prev => prev ? { ...prev, priority: e.target.value } : null); fetchData();
                }} className="admin-glass-input" style={{ display: 'block', marginTop: 4, cursor: 'pointer', fontSize: 12, padding: '6px 12px' }}>
                  <option value="low">Basse</option><option value="medium">Moyenne</option><option value="high">Haute</option><option value="urgent">Urgent</option>
                </select>
              </div>
              <div className="flex-1">
                <label style={{ fontSize: 10, color: TEXT_MUTED, textTransform: 'uppercase' }}>Client</label>
                <p style={{ fontSize: 13, color: TEXT_PRIMARY, marginTop: 4 }}>{detail.client_name}</p>
              </div>
            </div>
            {detail.description && (
              <div className="px-5 pb-3">
                <p style={{ fontSize: 13, color: TEXT_SECONDARY, background: 'rgba(255,255,255,0.55)', padding: 12, borderRadius: 12, backdropFilter: 'blur(8px)' }}>{detail.description}</p>
              </div>
            )}
            <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3" style={{ minHeight: 150, maxHeight: 300 }}>
              {messages.map(m => (
                <div key={m.id} className={`flex ${m.author_type === 'admin' ? 'justify-start' : 'justify-end'}`}>
                  <div style={{
                    maxWidth: '75%', padding: '10px 14px', borderRadius: 16,
                    background: m.author_type === 'admin' ? 'rgba(42,157,143,0.12)' : 'rgba(139,109,176,0.12)',
                    backdropFilter: 'blur(8px)',
                    borderBottomLeftRadius: m.author_type === 'admin' ? 4 : 16,
                    borderBottomRightRadius: m.author_type === 'admin' ? 16 : 4,
                  }}>
                    <p style={{ fontSize: 10, fontWeight: 600, color: m.author_type === 'admin' ? TEAL : PURPLE, marginBottom: 2 }}>{m.author_name || m.author_type}</p>
                    <p style={{ fontSize: 13, color: TEXT_PRIMARY }}>{m.content}</p>
                    <p style={{ fontSize: 9, color: TEXT_MUTED, marginTop: 4 }}>{new Date(m.created_at).toLocaleString('fr-FR')}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 p-4" style={{ borderTop: '1px solid rgba(255,255,255,0.55)' }}>
              <input value={newMsg} onChange={e => setNewMsg(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} placeholder="Répondre..." className="admin-glass-input" style={{ flex: 1 }} />
              <button onClick={sendMessage} className="admin-glass-btn" style={{ padding: '10px 16px' }}><Send size={16} /></button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTickets;
