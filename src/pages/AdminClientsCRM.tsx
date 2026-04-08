import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Search, Plus, Users, Eye, Pencil, Trash2, X, Save, Pin, PinOff, MessageSquare, Send } from 'lucide-react';

type Client = {
  id: string; business_name: string; business_type: string | null; contact_name: string | null;
  email: string | null; phone: string | null; status: string; subscription_status: string | null;
  city: string | null; country: string | null; monthly_amount: number; created_at: string;
  portal_user_id: string | null; portal_enabled: boolean | null; avatar_url: string | null;
  company_address: string | null;
};

const SUB_COLORS: Record<string, string> = { trial: '#f59e0b', active: '#10b981', past_due: '#ef4444', cancelled: '#6b7280' };
const STATUS_COLORS: Record<string, string> = { active: '#10b981', inactive: '#6b7280', onboarding: '#f59e0b' };

const AdminClientsCRM = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [subFilter, setSubFilter] = useState('all');
  const [selected, setSelected] = useState<Client | null>(null);
  const [tab, setTab] = useState('overview');
  const [ticketCounts, setTicketCounts] = useState<Record<string, number>>({});

  // Detail tab data
  const [projects, setProjects] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [timeEntries, setTimeEntries] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [feedback, setFeedback] = useState<any[]>([]);
  const [newNote, setNewNote] = useState('');

  const fetchClients = useCallback(async () => {
    setLoading(true);
    const [{ data: cl }, { data: tix }] = await Promise.all([
      supabase.from('clients').select('*').order('created_at', { ascending: false }),
      supabase.from('support_tickets').select('client_id, status'),
    ]);
    setClients((cl || []) as Client[]);
    const counts: Record<string, number> = {};
    (tix || []).filter(t => t.status === 'open').forEach(t => { counts[t.client_id] = (counts[t.client_id] || 0) + 1; });
    setTicketCounts(counts);
    setLoading(false);
  }, []);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  const openClient = async (client: Client) => {
    setSelected(client);
    setTab('overview');
    const [
      { data: p }, { data: t }, { data: i }, { data: c }, { data: tt }, { data: n }, { data: f },
    ] = await Promise.all([
      supabase.from('projects').select('*').eq('client_id', client.id),
      supabase.from('support_tickets').select('*').eq('client_id', client.id).order('created_at', { ascending: false }),
      supabase.from('invoices').select('*').eq('client_id', client.id).order('issue_date', { ascending: false }),
      supabase.from('contracts').select('*').eq('client_id', client.id),
      supabase.from('time_tracking').select('*').eq('client_id', client.id).order('date', { ascending: false }),
      supabase.from('internal_notes').select('*').eq('client_id', client.id).order('is_pinned', { ascending: false }).order('created_at', { ascending: false }),
      supabase.from('client_feedback').select('*').eq('client_id', client.id),
    ]);
    setProjects(p || []); setTickets(t || []); setInvoices(i || []);
    setContracts(c || []); setTimeEntries(tt || []); setNotes(n || []); setFeedback(f || []);
  };

  const addNote = async () => {
    if (!newNote.trim() || !selected) return;
    await supabase.from('internal_notes').insert({ client_id: selected.id, content: newNote.trim() });
    setNewNote('');
    const { data } = await supabase.from('internal_notes').select('*').eq('client_id', selected.id).order('is_pinned', { ascending: false }).order('created_at', { ascending: false });
    setNotes(data || []);
    toast.success('Note ajoutée');
  };

  const togglePin = async (noteId: string, current: boolean) => {
    await supabase.from('internal_notes').update({ is_pinned: !current }).eq('id', noteId);
    const { data } = await supabase.from('internal_notes').select('*').eq('client_id', selected!.id).order('is_pinned', { ascending: false }).order('created_at', { ascending: false });
    setNotes(data || []);
  };

  const deleteNote = async (noteId: string) => {
    await supabase.from('internal_notes').delete().eq('id', noteId);
    setNotes(notes.filter(n => n.id !== noteId));
  };

  const filtered = clients.filter(c => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (subFilter !== 'all' && c.subscription_status !== subFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return c.business_name.toLowerCase().includes(q) || (c.contact_name || '').toLowerCase().includes(q) || (c.email || '').toLowerCase().includes(q);
    }
    return true;
  });

  const fmt = (n: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);

  if (loading) return <div className="p-8 text-center" style={{ fontFamily: 'var(--font-b)', color: 'var(--text-light)' }}>Chargement...</div>;

  const tabs = ['overview', 'projets', 'tickets', 'factures', 'contrat', 'time', 'notes', 'feedback'];
  const tabLabels: Record<string, string> = { overview: 'Overview', projets: 'Projets', tickets: 'Tickets', factures: 'Factures', contrat: 'Contrat', time: 'Time Tracking', notes: 'Notes', feedback: 'Feedback' };

  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Users size={24} style={{ color: 'var(--violet)' }} />
        <h1 style={{ fontFamily: 'var(--font-h)', fontSize: 24, color: 'var(--charcoal)' }}>Gestion Clients</h1>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex items-center gap-2 flex-1 min-w-[180px]" style={{ padding: '8px 14px', background: 'white', borderRadius: 12, border: '1px solid var(--glass-border)' }}>
          <Search size={14} style={{ color: 'var(--text-light)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." style={{ flex: 1, border: 'none', outline: 'none', fontFamily: 'var(--font-b)', fontSize: 13, background: 'transparent' }} />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: '8px 14px', borderRadius: 12, border: '1px solid var(--glass-border)', fontFamily: 'var(--font-b)', fontSize: 13, background: 'white', cursor: 'pointer' }}>
          <option value="all">Tous statuts</option>
          <option value="active">Actif</option>
          <option value="inactive">Inactif</option>
          <option value="onboarding">Onboarding</option>
        </select>
        <select value={subFilter} onChange={e => setSubFilter(e.target.value)} style={{ padding: '8px 14px', borderRadius: 12, border: '1px solid var(--glass-border)', fontFamily: 'var(--font-b)', fontSize: 13, background: 'white', cursor: 'pointer' }}>
          <option value="all">Abonnement</option>
          <option value="trial">Essai</option>
          <option value="active">Actif</option>
          <option value="past_due">Retard</option>
          <option value="cancelled">Annulé</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden mb-6" style={{ background: 'white', border: '1px solid var(--glass-border)' }}>
        <div className="overflow-x-auto">
          <table className="w-full" style={{ fontFamily: 'var(--font-b)', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                {['Entreprise', 'Type', 'Contact', 'Statut', 'Abonnement', 'Tickets', 'MRR', 'Inscription'].map(h => (
                  <th key={h} className="text-left px-4 py-3" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-light)', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} className="cursor-pointer hover:bg-gray-50 transition-colors" style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }} onClick={() => openClient(c)}>
                  <td className="px-4 py-3 font-medium" style={{ color: 'var(--charcoal)' }}>{c.business_name}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-mid)' }}>{c.business_type || '—'}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-mid)' }}>{c.contact_name || '—'}</td>
                  <td className="px-4 py-3">
                    <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: `${STATUS_COLORS[c.status] || '#999'}18`, color: STATUS_COLORS[c.status] || '#999' }}>{c.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: `${SUB_COLORS[c.subscription_status || ''] || '#999'}18`, color: SUB_COLORS[c.subscription_status || ''] || '#999' }}>{c.subscription_status || '—'}</span>
                  </td>
                  <td className="px-4 py-3">
                    {ticketCounts[c.id] ? (
                      <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>{ticketCounts[c.id]}</span>
                    ) : <span style={{ color: 'var(--text-light)' }}>0</span>}
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--teal)', fontWeight: 600 }}>{fmt(c.monthly_amount || 0)}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-light)', fontSize: 12 }}>{new Date(c.created_at).toLocaleDateString('fr-FR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Client Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl overflow-hidden" style={{ background: 'white' }}>
            <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid var(--glass-border)' }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-h)', fontSize: 20, color: 'var(--charcoal)' }}>{selected.business_name}</h2>
                <p style={{ fontFamily: 'var(--font-b)', fontSize: 12, color: 'var(--text-light)' }}>{selected.contact_name} · {selected.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => navigate(`/admin/view-as/${selected.id}`)} style={{ padding: '8px 14px', borderRadius: 10, background: 'var(--teal)', color: '#fff', border: 'none', fontFamily: 'var(--font-b)', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Eye size={14} /> Voir comme client
                </button>
                <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-mid)' }}><X size={20} /></button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 px-5 pt-3 overflow-x-auto" style={{ borderBottom: '1px solid var(--glass-border)' }}>
              {tabs.map(t => (
                <button key={t} onClick={() => setTab(t)} style={{
                  padding: '8px 14px', borderRadius: '10px 10px 0 0', border: 'none',
                  background: tab === t ? 'var(--teal)' : 'transparent', color: tab === t ? '#fff' : 'var(--text-mid)',
                  fontFamily: 'var(--font-b)', fontSize: 12, fontWeight: tab === t ? 600 : 400, cursor: 'pointer',
                }}>{tabLabels[t]}</button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-5">
              {tab === 'overview' && (
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    { label: 'Type', value: selected.business_type || '—' },
                    { label: 'Ville', value: `${selected.city || '—'}, ${selected.country || '—'}` },
                    { label: 'Téléphone', value: selected.phone || '—' },
                    { label: 'Statut', value: selected.status },
                    { label: 'Abonnement', value: selected.subscription_status || '—' },
                    { label: 'MRR', value: fmt(selected.monthly_amount || 0) },
                    { label: 'Portail', value: selected.portal_enabled ? 'Activé' : 'Non' },
                    { label: 'Inscrit le', value: new Date(selected.created_at).toLocaleDateString('fr-FR') },
                  ].map((f, i) => (
                    <div key={i}>
                      <p style={{ fontFamily: 'var(--font-b)', fontSize: 10, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{f.label}</p>
                      <p style={{ fontFamily: 'var(--font-b)', fontSize: 14, color: 'var(--charcoal)', fontWeight: 500 }}>{f.value}</p>
                    </div>
                  ))}
                </div>
              )}

              {tab === 'projets' && (
                <div className="space-y-3">
                  {projects.length === 0 ? <p style={{ fontFamily: 'var(--font-b)', fontSize: 13, color: 'var(--text-light)' }}>Aucun projet</p> : projects.map(p => (
                    <div key={p.id} className="p-4 rounded-xl" style={{ background: 'rgba(0,0,0,0.02)', border: '1px solid var(--glass-border)' }}>
                      <div className="flex items-center justify-between">
                        <span style={{ fontFamily: 'var(--font-b)', fontSize: 14, fontWeight: 600, color: 'var(--charcoal)' }}>{p.title}</span>
                        <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-b)', background: 'rgba(13,138,111,0.1)', color: 'var(--teal)' }}>{p.status}</span>
                      </div>
                      {p.description && <p style={{ fontFamily: 'var(--font-b)', fontSize: 12, color: 'var(--text-mid)', marginTop: 4 }}>{p.description}</p>}
                    </div>
                  ))}
                </div>
              )}

              {tab === 'tickets' && (
                <div className="space-y-3">
                  {tickets.length === 0 ? <p style={{ fontFamily: 'var(--font-b)', fontSize: 13, color: 'var(--text-light)' }}>Aucun ticket</p> : tickets.map(t => (
                    <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(0,0,0,0.02)', border: '1px solid var(--glass-border)' }}>
                      <div style={{ width: 8, height: 8, borderRadius: 99, background: STATUS_COLORS[t.status] || '#999' }} />
                      <div className="flex-1">
                        <span style={{ fontFamily: 'var(--font-b)', fontSize: 13, fontWeight: 600, color: 'var(--charcoal)' }}>{t.title}</span>
                        <div className="flex gap-2 mt-1">
                          <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 99, background: `${STATUS_COLORS[t.status] || '#999'}18`, color: STATUS_COLORS[t.status] || '#999', fontFamily: 'var(--font-b)', fontWeight: 600 }}>{t.status}</span>
                          <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 99, background: 'rgba(0,0,0,0.04)', color: 'var(--text-mid)', fontFamily: 'var(--font-b)' }}>{t.priority}</span>
                        </div>
                      </div>
                      <span style={{ fontFamily: 'var(--font-m)', fontSize: 10, color: 'var(--text-light)' }}>{new Date(t.created_at).toLocaleDateString('fr-FR')}</span>
                    </div>
                  ))}
                </div>
              )}

              {tab === 'factures' && (
                <div className="space-y-3">
                  {invoices.length === 0 ? <p style={{ fontFamily: 'var(--font-b)', fontSize: 13, color: 'var(--text-light)' }}>Aucune facture</p> : invoices.map(inv => (
                    <div key={inv.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: inv.status === 'overdue' ? 'rgba(239,68,68,0.04)' : 'rgba(0,0,0,0.02)', border: '1px solid var(--glass-border)' }}>
                      <div className="flex-1">
                        <span style={{ fontFamily: 'var(--font-b)', fontSize: 13, fontWeight: 600, color: 'var(--charcoal)' }}>{inv.invoice_number}</span>
                        <span style={{ marginLeft: 8, fontSize: 11, padding: '2px 8px', borderRadius: 99, background: inv.status === 'paid' ? 'rgba(16,185,129,0.1)' : inv.status === 'overdue' ? 'rgba(239,68,68,0.1)' : 'rgba(59,130,246,0.1)', color: inv.status === 'paid' ? '#10b981' : inv.status === 'overdue' ? '#ef4444' : '#3b82f6', fontFamily: 'var(--font-b)', fontWeight: 600 }}>{inv.status}</span>
                      </div>
                      <span style={{ fontFamily: 'var(--font-b)', fontSize: 14, fontWeight: 600, color: 'var(--charcoal)' }}>{fmt(inv.total)}</span>
                    </div>
                  ))}
                </div>
              )}

              {tab === 'contrat' && (
                <div className="space-y-3">
                  {contracts.length === 0 ? <p style={{ fontFamily: 'var(--font-b)', fontSize: 13, color: 'var(--text-light)' }}>Aucun contrat</p> : contracts.map(c => (
                    <div key={c.id} className="p-4 rounded-xl" style={{ background: 'rgba(0,0,0,0.02)', border: '1px solid var(--glass-border)' }}>
                      <div className="grid grid-cols-2 gap-3">
                        <div><p style={{ fontSize: 10, color: 'var(--text-light)', fontFamily: 'var(--font-b)' }}>Setup</p><p style={{ fontFamily: 'var(--font-b)', fontWeight: 600 }}>{fmt(c.setup_price || 0)}</p></div>
                        <div><p style={{ fontSize: 10, color: 'var(--text-light)', fontFamily: 'var(--font-b)' }}>Mensuel</p><p style={{ fontFamily: 'var(--font-b)', fontWeight: 600 }}>{fmt(c.monthly_price || 0)}</p></div>
                        <div><p style={{ fontSize: 10, color: 'var(--text-light)', fontFamily: 'var(--font-b)' }}>Début</p><p style={{ fontFamily: 'var(--font-b)' }}>{c.start_date || '—'}</p></div>
                        <div><p style={{ fontSize: 10, color: 'var(--text-light)', fontFamily: 'var(--font-b)' }}>Statut</p><p style={{ fontFamily: 'var(--font-b)', fontWeight: 600 }}>{c.status}</p></div>
                      </div>
                      {c.special_conditions && <p style={{ fontFamily: 'var(--font-b)', fontSize: 12, color: 'var(--text-mid)', marginTop: 8 }}>{c.special_conditions}</p>}
                    </div>
                  ))}
                </div>
              )}

              {tab === 'time' && (
                <div className="space-y-3">
                  {timeEntries.length === 0 ? <p style={{ fontFamily: 'var(--font-b)', fontSize: 13, color: 'var(--text-light)' }}>Aucune entrée</p> : (
                    <>
                      <div className="p-3 rounded-xl" style={{ background: 'rgba(13,138,111,0.06)' }}>
                        <span style={{ fontFamily: 'var(--font-b)', fontSize: 12, color: 'var(--teal)', fontWeight: 600 }}>
                          Total : {Math.floor(timeEntries.reduce((s, e) => s + e.duration_minutes, 0) / 60)}h {timeEntries.reduce((s, e) => s + e.duration_minutes, 0) % 60}min
                        </span>
                      </div>
                      {timeEntries.map(e => (
                        <div key={e.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(0,0,0,0.02)', border: '1px solid var(--glass-border)' }}>
                          <span style={{ fontFamily: 'var(--font-b)', fontSize: 13, fontWeight: 600, color: 'var(--teal)' }}>{e.duration_minutes}min</span>
                          <span style={{ fontFamily: 'var(--font-b)', fontSize: 13, color: 'var(--charcoal)', flex: 1 }}>{e.description || '—'}</span>
                          <span style={{ fontFamily: 'var(--font-m)', fontSize: 10, color: 'var(--text-light)' }}>{e.date}</span>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}

              {tab === 'notes' && (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input value={newNote} onChange={e => setNewNote(e.target.value)} onKeyDown={e => e.key === 'Enter' && addNote()} placeholder="Ajouter une note..." style={{ flex: 1, padding: '10px 14px', borderRadius: 12, border: '1px solid var(--glass-border)', fontFamily: 'var(--font-b)', fontSize: 13, outline: 'none' }} />
                    <button onClick={addNote} style={{ padding: '10px 16px', background: 'var(--teal)', color: '#fff', border: 'none', borderRadius: 12, cursor: 'pointer' }}><Plus size={16} /></button>
                  </div>
                  {notes.map(n => (
                    <div key={n.id} className="p-3 rounded-xl flex items-start gap-3" style={{ background: n.is_pinned ? 'rgba(212,165,90,0.08)' : 'rgba(0,0,0,0.02)', border: '1px solid var(--glass-border)' }}>
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
              )}

              {tab === 'feedback' && (
                <div className="space-y-3">
                  {feedback.length === 0 ? <p style={{ fontFamily: 'var(--font-b)', fontSize: 13, color: 'var(--text-light)' }}>Aucun avis</p> : feedback.map(f => (
                    <div key={f.id} className="p-4 rounded-xl" style={{ background: 'rgba(0,0,0,0.02)', border: '1px solid var(--glass-border)' }}>
                      <div className="flex items-center gap-2 mb-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span key={i} style={{ color: i < f.rating ? '#f59e0b' : 'var(--text-ghost)', fontSize: 16 }}>★</span>
                        ))}
                      </div>
                      {f.comment && <p style={{ fontFamily: 'var(--font-b)', fontSize: 13, color: 'var(--charcoal)' }}>{f.comment}</p>}
                      <p style={{ fontFamily: 'var(--font-m)', fontSize: 10, color: 'var(--text-light)', marginTop: 4 }}>{new Date(f.submitted_at).toLocaleDateString('fr-FR')}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminClientsCRM;
