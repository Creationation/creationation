import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { StickyNote, Plus, Pin, PinOff, Trash2, Search } from 'lucide-react';
import { TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED, TEAL, CORAL, GOLD, PURPLE } from '@/lib/adminTheme';


const AdminNotes = () => {
  const [notes, setNotes] = useState<any[]>([]);
  const [clients, setClients] = useState<{ id: string; business_name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [newNote, setNewNote] = useState('');
  const [newClientId, setNewClientId] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [{ data: n }, { data: c }] = await Promise.all([
      supabase.from('internal_notes').select('*').order('is_pinned', { ascending: false }).order('created_at', { ascending: false }),
      supabase.from('clients').select('id, business_name'),
    ]);
    setNotes(n || []); setClients(c || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  const clientMap = Object.fromEntries(clients.map(c => [c.id, c.business_name]));

  const addNote = async () => {
    if (!newNote.trim() || !newClientId) { toast.error('Client et contenu requis'); return; }
    await supabase.from('internal_notes').insert({ client_id: newClientId, content: newNote.trim() });
    setNewNote(''); toast.success('Note ajoutée'); fetchData();
  };

  const togglePin = async (id: string, current: boolean) => {
    await supabase.from('internal_notes').update({ is_pinned: !current }).eq('id', id); fetchData();
  };

  const deleteNote = async (id: string) => {
    await supabase.from('internal_notes').delete().eq('id', id);
    setNotes(notes.filter(n => n.id !== id)); toast.success('Note supprimée');
  };

  const filtered = notes.filter(n => {
    if (!search) return true;
    const q = search.toLowerCase();
    return n.content.toLowerCase().includes(q) || (clientMap[n.client_id] || '').toLowerCase().includes(q);
  });

  const grouped: Record<string, any[]> = {};
  filtered.forEach(n => {
    const name = clientMap[n.client_id] || 'Inconnu';
    if (!grouped[name]) grouped[name] = [];
    grouped[name].push(n);
  });

  if (loading) return <div className="p-8 text-center" style={{ fontFamily: "'Outfit', sans-serif", color: TEXT_MUTED }}>Chargement...</div>;

  return (
    <div className="p-4 md:p-6 max-w-[1200px] mx-auto space-y-6" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <h1 className="admin-page-title">Notes internes</h1>

      <div className="admin-glass-card">
        <div className="relative z-[1] flex flex-col sm:flex-row gap-3">
          <select value={newClientId} onChange={e => setNewClientId(e.target.value)} className="admin-glass-input" style={{ minWidth: 180 }}>
            <option value="">Client *</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.business_name}</option>)}
          </select>
          <input value={newNote} onChange={e => setNewNote(e.target.value)} onKeyDown={e => e.key === 'Enter' && addNote()} placeholder="Nouvelle note..." className="admin-glass-input" style={{ flex: 1 }} />
          <button onClick={addNote} className="admin-glass-btn" style={{ padding: '10px 16px' }}><Plus size={16} /></button>
        </div>
      </div>

      <div className="flex items-center gap-2 admin-glass-input" style={{ padding: '8px 14px' }}>
        <Search size={14} style={{ color: TEXT_MUTED }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher dans les notes..." style={{ flex: 1, border: 'none', outline: 'none', fontFamily: "'Outfit', sans-serif", fontSize: 13, background: 'transparent', color: TEXT_PRIMARY }} />
      </div>

      {Object.entries(grouped).map(([clientName, clientNotes]) => (
        <div key={clientName} className="admin-glass-table">
          <div className="px-5 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.55)', background: 'rgba(255,255,255,0.05)' }}>
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, color: TEXT_PRIMARY }}>{clientName}</span>
            <span style={{ fontSize: 11, color: TEXT_MUTED, marginLeft: 8 }}>{clientNotes.length} note{clientNotes.length > 1 ? 's' : ''}</span>
          </div>
          <div className="p-3 space-y-2">
            {clientNotes.map(n => (
              <div key={n.id} className="flex items-start gap-3 p-3 rounded-xl transition-colors" style={{ background: n.is_pinned ? 'rgba(212,168,67,0.06)' : 'transparent' }}>
                <div className="flex-1">
                  <p style={{ fontSize: 13, color: TEXT_PRIMARY }}>{n.content}</p>
                  <p style={{ fontSize: 9, color: TEXT_MUTED, marginTop: 4 }}>{new Date(n.created_at).toLocaleString('fr-FR')}</p>
                </div>
                <button onClick={() => togglePin(n.id, n.is_pinned)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: n.is_pinned ? GOLD : TEXT_MUTED }}>
                  {n.is_pinned ? <PinOff size={14} /> : <Pin size={14} />}
                </button>
                <button onClick={() => deleteNote(n.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: CORAL }}><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default AdminNotes;
