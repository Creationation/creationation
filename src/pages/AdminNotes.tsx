import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { StickyNote, Plus, Pin, PinOff, Trash2, Search } from 'lucide-react';

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
    await supabase.from('internal_notes').update({ is_pinned: !current }).eq('id', id);
    fetchData();
  };

  const deleteNote = async (id: string) => {
    await supabase.from('internal_notes').delete().eq('id', id);
    setNotes(notes.filter(n => n.id !== id));
    toast.success('Note supprimée');
  };

  const filtered = notes.filter(n => {
    if (!search) return true;
    const q = search.toLowerCase();
    return n.content.toLowerCase().includes(q) || (clientMap[n.client_id] || '').toLowerCase().includes(q);
  });

  // Group by client
  const grouped: Record<string, any[]> = {};
  filtered.forEach(n => {
    const name = clientMap[n.client_id] || 'Inconnu';
    if (!grouped[name]) grouped[name] = [];
    grouped[name].push(n);
  });

  if (loading) return <div className="p-8 text-center" style={{ fontFamily: 'var(--font-b)', color: 'var(--text-light)' }}>Chargement...</div>;

  return (
    <div className="p-4 md:p-6 max-w-[1200px] mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <StickyNote size={24} style={{ color: '#d4a55a' }} />
        <h1 style={{ fontFamily: 'var(--font-h)', fontSize: 24, color: 'var(--charcoal)' }}>Notes internes</h1>
      </div>

      {/* Add note */}
      <div className="rounded-2xl p-5" style={{ background: 'white', border: '1px solid var(--glass-border)' }}>
        <div className="flex flex-col sm:flex-row gap-3">
          <select value={newClientId} onChange={e => setNewClientId(e.target.value)} style={{ padding: '10px 14px', borderRadius: 12, border: '1px solid var(--glass-border)', fontFamily: 'var(--font-b)', fontSize: 13, minWidth: 180 }}>
            <option value="">Client *</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.business_name}</option>)}
          </select>
          <input value={newNote} onChange={e => setNewNote(e.target.value)} onKeyDown={e => e.key === 'Enter' && addNote()} placeholder="Nouvelle note..." style={{ flex: 1, padding: '10px 14px', borderRadius: 12, border: '1px solid var(--glass-border)', fontFamily: 'var(--font-b)', fontSize: 13, outline: 'none' }} />
          <button onClick={addNote} style={{ padding: '10px 16px', background: 'var(--teal)', color: '#fff', border: 'none', borderRadius: 12, cursor: 'pointer' }}><Plus size={16} /></button>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2" style={{ padding: '8px 14px', background: 'white', borderRadius: 12, border: '1px solid var(--glass-border)' }}>
        <Search size={14} style={{ color: 'var(--text-light)' }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher dans les notes..." style={{ flex: 1, border: 'none', outline: 'none', fontFamily: 'var(--font-b)', fontSize: 13, background: 'transparent' }} />
      </div>

      {/* Grouped notes */}
      {Object.entries(grouped).map(([clientName, clientNotes]) => (
        <div key={clientName} className="rounded-2xl overflow-hidden" style={{ background: 'white', border: '1px solid var(--glass-border)' }}>
          <div className="px-5 py-3" style={{ borderBottom: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.02)' }}>
            <span style={{ fontFamily: 'var(--font-h)', fontSize: 15, color: 'var(--charcoal)' }}>{clientName}</span>
            <span style={{ fontFamily: 'var(--font-m)', fontSize: 11, color: 'var(--text-light)', marginLeft: 8 }}>{clientNotes.length} note{clientNotes.length > 1 ? 's' : ''}</span>
          </div>
          <div className="p-3 space-y-2">
            {clientNotes.map(n => (
              <div key={n.id} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: n.is_pinned ? 'rgba(212,165,90,0.06)' : 'transparent' }}>
                <div className="flex-1">
                  <p style={{ fontFamily: 'var(--font-b)', fontSize: 13, color: 'var(--charcoal)' }}>{n.content}</p>
                  <p style={{ fontFamily: 'var(--font-m)', fontSize: 9, color: 'var(--text-light)', marginTop: 4 }}>{new Date(n.created_at).toLocaleString('fr-FR')}</p>
                </div>
                <button onClick={() => togglePin(n.id, n.is_pinned)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: n.is_pinned ? '#d4a55a' : 'var(--text-light)' }}>
                  {n.is_pinned ? <PinOff size={14} /> : <Pin size={14} />}
                </button>
                <button onClick={() => deleteNote(n.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--coral)' }}><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default AdminNotes;
