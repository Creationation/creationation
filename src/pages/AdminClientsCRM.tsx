import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Search, Plus, Users, Eye, Pencil, Trash2, X, Pin, PinOff, Wallet } from 'lucide-react';

const TEXT_PRIMARY = '#1A2332';
const TEXT_SECONDARY = 'rgba(26,35,50,0.55)';
const TEXT_MUTED = 'rgba(26,35,50,0.30)';
const TEAL = '#2A9D8F';
const CORAL = '#E76F51';

type Client = {
  id: string; business_name: string; business_type: string | null; contact_name: string | null;
  email: string | null; phone: string | null; status: string; subscription_status: string | null;
  city: string | null; country: string | null; monthly_amount: number; created_at: string;
  portal_user_id: string | null; portal_enabled: boolean | null; avatar_url: string | null;
  company_address: string | null;
};

const SUB_COLORS: Record<string, string> = { trial: '#D4A843', active: TEAL, past_due: CORAL, cancelled: 'rgba(26,35,50,0.35)' };
const STATUS_COLORS: Record<string, string> = { active: TEAL, inactive: 'rgba(26,35,50,0.35)', onboarding: '#D4A843' };

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
  const [projects, setProjects] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [timeEntries, setTimeEntries] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [feedback, setFeedback] = useState<any[]>([]);
  const [clientExpenses, setClientExpenses] = useState<any[]>([]);
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
    setSelected(client); setTab('overview');
    const [{ data: p }, { data: t }, { data: i }, { data: c }, { data: tt }, { data: n }, { data: f }, { data: ex }] = await Promise.all([
      supabase.from('projects').select('*').eq('client_id', client.id),
      supabase.from('support_tickets').select('*').eq('client_id', client.id).order('created_at', { ascending: false }),
      supabase.from('invoices').select('*').eq('client_id', client.id).order('issue_date', { ascending: false }),
      supabase.from('contracts').select('*').eq('client_id', client.id),
      supabase.from('time_tracking').select('*').eq('client_id', client.id).order('date', { ascending: false }),
      supabase.from('internal_notes').select('*').eq('client_id', client.id).order('is_pinned', { ascending: false }).order('created_at', { ascending: false }),
      supabase.from('client_feedback').select('*').eq('client_id', client.id),
      supabase.from('expenses').select('*').eq('client_id', client.id).order('created_at', { ascending: false }),
    ]);
    setProjects(p || []); setTickets(t || []); setInvoices(i || []);
    setContracts(c || []); setTimeEntries(tt || []); setNotes(n || []); setFeedback(f || []);
    setClientExpenses((ex || []) as any[]);
  };

  const addNote = async () => {
    if (!newNote.trim() || !selected) return;
    await supabase.from('internal_notes').insert({ client_id: selected.id, content: newNote.trim() });
    setNewNote('');
    const { data } = await supabase.from('internal_notes').select('*').eq('client_id', selected.id).order('is_pinned', { ascending: false }).order('created_at', { ascending: false });
    setNotes(data || []); toast.success('Note ajoutée');
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
    if (search) { const q = search.toLowerCase(); return c.business_name.toLowerCase().includes(q) || (c.contact_name || '').toLowerCase().includes(q) || (c.email || '').toLowerCase().includes(q); }
    return true;
  });

  const fmt = (n: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);

  if (loading) return <div className="p-8 text-center" style={{ fontFamily: "'Outfit', sans-serif", color: TEXT_MUTED }}>Chargement...</div>;

  const tabs = ['overview', 'projets', 'tickets', 'factures', 'contrat', 'depenses', 'time', 'notes', 'feedback'];
  const tabLabels: Record<string, string> = { overview: 'Overview', projets: 'Projets', tickets: 'Tickets', factures: 'Factures', contrat: 'Contrat', depenses: 'Dépenses', time: 'Time Tracking', notes: 'Notes', feedback: 'Feedback' };

  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <div className="flex items-center gap-3 mb-6">
        <h1 className="admin-page-title">Gestion Clients</h1>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex items-center gap-2 flex-1 min-w-[180px] admin-glass-input" style={{ padding: '8px 14px' }}>
          <Search size={14} style={{ color: TEXT_MUTED }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." style={{ flex: 1, border: 'none', outline: 'none', fontFamily: "'Outfit', sans-serif", fontSize: 13, background: 'transparent', color: TEXT_PRIMARY }} />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="admin-glass-input" style={{ cursor: 'pointer' }}>
          <option value="all">Tous statuts</option>
          <option value="active">Actif</option><option value="inactive">Inactif</option><option value="onboarding">Onboarding</option>
        </select>
        <select value={subFilter} onChange={e => setSubFilter(e.target.value)} className="admin-glass-input" style={{ cursor: 'pointer' }}>
          <option value="all">Abonnement</option>
          <option value="trial">Essai</option><option value="active">Actif</option><option value="past_due">Retard</option><option value="cancelled">Annulé</option>
        </select>
      </div>

      <div className="admin-glass-table mb-6">
        <div className="overflow-x-auto">
          <table className="w-full" style={{ fontSize: 13 }}>
            <thead><tr>
              {['Entreprise', 'Type', 'Contact', 'Statut', 'Abonnement', 'Tickets', 'MRR', 'Inscription'].map(h => (
                <th key={h} className="text-left px-4 py-3" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.2, color: TEXT_MUTED, fontWeight: 600 }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} className="cursor-pointer" onClick={() => openClient(c)}>
                  <td className="px-4 py-3 font-medium" style={{ color: TEXT_PRIMARY }}>{c.business_name}</td>
                  <td className="px-4 py-3" style={{ color: TEXT_SECONDARY }}>{c.business_type || '—'}</td>
                  <td className="px-4 py-3" style={{ color: TEXT_SECONDARY }}>{c.contact_name || '—'}</td>
                  <td className="px-4 py-3"><span className="admin-status-badge" style={{ background: `${STATUS_COLORS[c.status] || '#999'}20`, color: STATUS_COLORS[c.status] || '#999' }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: STATUS_COLORS[c.status] }} />{c.status}</span></td>
                  <td className="px-4 py-3"><span className="admin-status-badge" style={{ background: `${SUB_COLORS[c.subscription_status || ''] || '#999'}20`, color: SUB_COLORS[c.subscription_status || ''] || '#999' }}>{c.subscription_status || '—'}</span></td>
                  <td className="px-4 py-3">{ticketCounts[c.id] ? <span className="admin-status-badge" style={{ background: 'rgba(231,111,81,0.12)', color: CORAL }}>{ticketCounts[c.id]}</span> : <span style={{ color: TEXT_MUTED }}>0</span>}</td>
                  <td className="px-4 py-3" style={{ color: TEAL, fontWeight: 600 }}>{fmt(c.monthly_amount || 0)}</td>
                  <td className="px-4 py-3" style={{ color: TEXT_MUTED, fontSize: 12 }}>{new Date(c.created_at).toLocaleDateString('fr-FR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Client Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="w-full max-w-4xl max-h-[90vh] flex flex-col admin-glass-modal">
            <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
              <div>
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: TEXT_PRIMARY }}>{selected.business_name}</h2>
                <p style={{ fontSize: 12, color: TEXT_MUTED }}>{selected.contact_name} · {selected.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => navigate(`/admin/view-as/${selected.id}`)} className="admin-glass-btn" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', fontSize: 12 }}>
                  <Eye size={14} /> Voir comme client
                </button>
                <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: TEXT_SECONDARY }}><X size={20} /></button>
              </div>
            </div>

            <div className="flex gap-1 px-5 pt-3 overflow-x-auto" style={{ borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
              {tabs.map(t => (
                <button key={t} onClick={() => setTab(t)} style={{
                  padding: '8px 14px', borderRadius: '12px 12px 0 0', border: 'none',
                  background: tab === t ? `linear-gradient(135deg, ${TEAL}, #3EDDC7)` : 'transparent',
                  color: tab === t ? '#fff' : TEXT_SECONDARY,
                  fontFamily: "'Outfit', sans-serif", fontSize: 12, fontWeight: tab === t ? 600 : 400, cursor: 'pointer',
                }}>{tabLabels[t]}</button>
              ))}
            </div>

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
                      <p style={{ fontSize: 10, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: 0.5 }}>{f.label}</p>
                      <p style={{ fontSize: 14, color: TEXT_PRIMARY, fontWeight: 500 }}>{f.value}</p>
                    </div>
                  ))}
                </div>
              )}

              {tab === 'projets' && (
                <div className="space-y-3">
                  {projects.length === 0 ? <p style={{ fontSize: 13, color: TEXT_MUTED }}>Aucun projet</p> : projects.map(p => (
                    <div key={p.id} className="admin-glass-card" style={{ padding: 16 }}>
                      <div className="relative z-[1] flex items-center justify-between">
                        <span style={{ fontSize: 14, fontWeight: 600, color: TEXT_PRIMARY }}>{p.title}</span>
                        <span className="admin-status-badge" style={{ background: 'rgba(42,157,143,0.12)', color: TEAL }}>{p.status}</span>
                      </div>
                      {p.description && <p className="relative z-[1]" style={{ fontSize: 12, color: TEXT_SECONDARY, marginTop: 4 }}>{p.description}</p>}
                    </div>
                  ))}
                </div>
              )}

              {tab === 'tickets' && (
                <div className="space-y-3">
                  {tickets.length === 0 ? <p style={{ fontSize: 13, color: TEXT_MUTED }}>Aucun ticket</p> : tickets.map(t => (
                    <div key={t.id} className="admin-glass-card flex items-center gap-3" style={{ padding: 12 }}>
                      <div className="relative z-[1] flex items-center gap-3 flex-1">
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: STATUS_COLORS[t.status] || '#999', boxShadow: `0 0 6px ${STATUS_COLORS[t.status] || '#999'}55` }} />
                        <div className="flex-1">
                          <span style={{ fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY }}>{t.title}</span>
                          <div className="flex gap-2 mt-1">
                            <span className="admin-status-badge" style={{ padding: '2px 8px', fontSize: 10, background: `${STATUS_COLORS[t.status] || '#999'}20`, color: STATUS_COLORS[t.status] || '#999' }}>{t.status}</span>
                            <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 10, background: 'rgba(255,255,255,0.20)', color: TEXT_SECONDARY }}>{t.priority}</span>
                          </div>
                        </div>
                        <span style={{ fontSize: 10, color: TEXT_MUTED }}>{new Date(t.created_at).toLocaleDateString('fr-FR')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {tab === 'factures' && (
                <div className="space-y-3">
                  {invoices.length === 0 ? <p style={{ fontSize: 13, color: TEXT_MUTED }}>Aucune facture</p> : invoices.map(inv => (
                    <div key={inv.id} className="admin-glass-card flex items-center gap-3" style={{ padding: 12, background: inv.status === 'overdue' ? 'rgba(231,111,81,0.08)' : undefined }}>
                      <div className="relative z-[1] flex items-center gap-3 flex-1">
                        <div className="flex-1">
                          <span style={{ fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY }}>{inv.invoice_number}</span>
                          <span className="admin-status-badge ml-2" style={{ background: inv.status === 'paid' ? 'rgba(42,157,143,0.12)' : inv.status === 'overdue' ? 'rgba(231,111,81,0.12)' : 'rgba(139,109,176,0.12)', color: inv.status === 'paid' ? TEAL : inv.status === 'overdue' ? CORAL : '#8B6DB0' }}>{inv.status}</span>
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 600, color: TEXT_PRIMARY }}>{fmt(inv.total)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {tab === 'contrat' && (
                <div className="space-y-3">
                  {contracts.length === 0 ? <p style={{ fontSize: 13, color: TEXT_MUTED }}>Aucun contrat</p> : contracts.map(c => (
                    <div key={c.id} className="admin-glass-card" style={{ padding: 16 }}>
                      <div className="relative z-[1] grid grid-cols-2 gap-3">
                        <div><p style={{ fontSize: 10, color: TEXT_MUTED }}>Setup</p><p style={{ fontWeight: 600, color: TEXT_PRIMARY }}>{fmt(c.setup_price || 0)}</p></div>
                        <div><p style={{ fontSize: 10, color: TEXT_MUTED }}>Mensuel</p><p style={{ fontWeight: 600, color: TEXT_PRIMARY }}>{fmt(c.monthly_price || 0)}</p></div>
                        <div><p style={{ fontSize: 10, color: TEXT_MUTED }}>Début</p><p>{c.start_date || '—'}</p></div>
                        <div><p style={{ fontSize: 10, color: TEXT_MUTED }}>Statut</p><p style={{ fontWeight: 600 }}>{c.status}</p></div>
                      </div>
                      {c.special_conditions && <p className="relative z-[1]" style={{ fontSize: 12, color: TEXT_SECONDARY, marginTop: 8 }}>{c.special_conditions}</p>}
                    </div>
                  ))}
                </div>
              )}

              {tab === 'time' && (
                <div className="space-y-3">
                  {timeEntries.length === 0 ? <p style={{ fontSize: 13, color: TEXT_MUTED }}>Aucune entrée</p> : (
                    <>
                      <div className="admin-glass-card" style={{ padding: 12, background: 'rgba(42,157,143,0.08)' }}>
                        <span className="relative z-[1]" style={{ fontSize: 12, color: TEAL, fontWeight: 600 }}>
                          Total : {Math.floor(timeEntries.reduce((s: number, e: any) => s + e.duration_minutes, 0) / 60)}h {timeEntries.reduce((s: number, e: any) => s + e.duration_minutes, 0) % 60}min
                        </span>
                      </div>
                      {timeEntries.map((e: any) => (
                        <div key={e.id} className="admin-glass-card flex items-center gap-3" style={{ padding: 12 }}>
                          <div className="relative z-[1] flex items-center gap-3 flex-1">
                            <span style={{ fontSize: 13, fontWeight: 600, color: TEAL }}>{e.duration_minutes}min</span>
                            <span style={{ fontSize: 13, color: TEXT_PRIMARY, flex: 1 }}>{e.description || '—'}</span>
                            <span style={{ fontSize: 10, color: TEXT_MUTED }}>{e.date}</span>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}

              {tab === 'notes' && (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input value={newNote} onChange={e => setNewNote(e.target.value)} onKeyDown={e => e.key === 'Enter' && addNote()} placeholder="Ajouter une note..." className="admin-glass-input" style={{ flex: 1 }} />
                    <button onClick={addNote} className="admin-glass-btn" style={{ padding: '10px 16px' }}><Plus size={16} /></button>
                  </div>
                  {notes.map((n: any) => (
                    <div key={n.id} className="admin-glass-card flex items-start gap-3" style={{ padding: 12, background: n.is_pinned ? 'rgba(212,168,67,0.08)' : undefined }}>
                      <div className="relative z-[1] flex items-start gap-3 flex-1">
                        <div className="flex-1">
                          <p style={{ fontSize: 13, color: TEXT_PRIMARY }}>{n.content}</p>
                          <p style={{ fontSize: 9, color: TEXT_MUTED, marginTop: 4 }}>{new Date(n.created_at).toLocaleString('fr-FR')}</p>
                        </div>
                        <button onClick={() => togglePin(n.id, n.is_pinned)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: n.is_pinned ? '#D4A843' : TEXT_MUTED }}>
                          {n.is_pinned ? <PinOff size={14} /> : <Pin size={14} />}
                        </button>
                        <button onClick={() => deleteNote(n.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: CORAL }}><Trash2 size={14} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {tab === 'feedback' && (
                <div className="space-y-3">
                  {feedback.length === 0 ? <p style={{ fontSize: 13, color: TEXT_MUTED }}>Aucun avis</p> : feedback.map((f: any) => (
                    <div key={f.id} className="admin-glass-card" style={{ padding: 16 }}>
                      <div className="relative z-[1]">
                        <div className="flex items-center gap-2 mb-2">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <span key={i} style={{ color: i < f.rating ? '#D4A843' : TEXT_MUTED, fontSize: 16 }}>★</span>
                          ))}
                        </div>
                        {f.comment && <p style={{ fontSize: 13, color: TEXT_PRIMARY }}>{f.comment}</p>}
                        <p style={{ fontSize: 10, color: TEXT_MUTED, marginTop: 4 }}>{new Date(f.submitted_at).toLocaleDateString('fr-FR')}</p>
                      </div>
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
