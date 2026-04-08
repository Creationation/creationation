import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Search, Pencil, Check, X, ArrowRightLeft, Trash2, UserPlus, Shield, RefreshCw, FileText, ChevronDown, ChevronUp, FolderKanban, Download } from 'lucide-react';
import { exportToCSV } from '@/lib/csvExport';
import ProjectDetailModal from '@/components/admin/ProjectDetailModal';

type Client = {
  id: string;
  prospect_id: string | null;
  business_name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  website_url: string | null;
  plan: string;
  status: string;
  monthly_amount: number;
  total_paid: number;
  started_at: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  portal_enabled: boolean | null;
  portal_user_id: string | null;
  portal_invited_at: string | null;
  portal_last_login: string | null;
};

type Prospect = {
  id: string;
  business_name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  website_url: string | null;
  status: string;
};

const STATUS_COLORS: Record<string, string> = {
  active: '#0d8a6f',
  trial: '#4da6d9',
  paused: '#d4a55a',
  churned: '#e8735a',
};
const STATUS_LABELS: Record<string, string> = {
  active: 'Actif',
  trial: 'Essai',
  paused: 'En pause',
  churned: 'Perdu',
};
const PLAN_OPTIONS = ['basic', 'standard', 'premium', 'custom'];

const AdminClients = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [selectedProspects, setSelectedProspects] = useState<string[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Client>>({});
  const [clientInvoices, setClientInvoices] = useState<Record<string, { total: number; paid: number; count: number }>>({});
  const [expandedClient, setExpandedClient] = useState<string | null>(null);
  const [clientProjects, setClientProjects] = useState<Record<string, any[]>>({});
  const [projectDetailId, setProjectDetailId] = useState<string | null>(null);
  const [prospectSources, setProspectSources] = useState<Record<string, { score: number; source: string }>>({});

  const fetchClients = useCallback(async () => {
    setLoading(true);
    const [{ data }, { data: inv }, { data: projData }] = await Promise.all([
      supabase.from('clients' as any).select('*').order('created_at', { ascending: false }),
      supabase.from('invoices').select('client_id,status,total,amount_paid'),
      supabase.from('projects' as any).select('id,client_id,title,status,priority,deadline'),
    ]);
    setClients((data as any[] || []) as Client[]);

    // Aggregate invoices per client
    const invMap: Record<string, { total: number; paid: number; count: number }> = {};
    ((inv as any[]) || []).forEach((i: any) => {
      if (['cancelled', 'draft'].includes(i.status)) return;
      if (!invMap[i.client_id]) invMap[i.client_id] = { total: 0, paid: 0, count: 0 };
      invMap[i.client_id].total += i.total;
      invMap[i.client_id].paid += i.amount_paid;
      invMap[i.client_id].count++;
    });
    setClientInvoices(invMap);

    // Group projects per client
    const projMap: Record<string, any[]> = {};
    ((projData as any[]) || []).forEach((p: any) => {
      if (!projMap[p.client_id]) projMap[p.client_id] = [];
      projMap[p.client_id].push(p);
    });
    setClientProjects(projMap);

    // Fetch prospect source info for clients with prospect_id
    const clientsWithProspect = ((data as any[]) || []).filter((c: any) => c.prospect_id);
    if (clientsWithProspect.length > 0) {
      const prospectIds = clientsWithProspect.map((c: any) => c.prospect_id);
      const { data: prospData } = await supabase.from('prospects').select('id,score,source').in('id', prospectIds);
      const srcMap: Record<string, { score: number; source: string }> = {};
      ((prospData as any[]) || []).forEach((p: any) => {
        const client = clientsWithProspect.find((c: any) => c.prospect_id === p.id);
        if (client) srcMap[client.id] = { score: p.score || 0, source: p.source || 'prospection' };
      });
      setProspectSources(srcMap);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/admin/login'); return; }
      const { data: roles } = await supabase.from('user_roles').select('role').eq('user_id', user.id);
      if (!roles?.some(r => r.role === 'admin')) { navigate('/admin/login'); return; }
      fetchClients();
    })();
  }, [navigate, fetchClients]);

  const fetchConvertedProspects = async () => {
    const { data } = await supabase.from('prospects').select('id,business_name,contact_name,email,phone,website_url,status').eq('status', 'converted');
    const existingIds = new Set(clients.filter(c => c.prospect_id).map(c => c.prospect_id));
    setProspects((data || []).filter(p => !existingIds.has(p.id)) as Prospect[]);
  };

  const importProspects = async () => {
    const toImport = prospects.filter(p => selectedProspects.includes(p.id));
    if (!toImport.length) return;

    for (const p of toImport) {
      await supabase.from('clients' as any).insert({
        prospect_id: p.id, business_name: p.business_name, contact_name: p.contact_name,
        email: p.email, phone: p.phone, website_url: p.website_url, plan: 'basic', status: 'active',
        monthly_amount: 0, total_paid: 0,
      } as any);
    }
    toast.success(`${toImport.length} client(s) importé(s)`);
    setShowImport(false);
    setSelectedProspects([]);
    fetchClients();
  };

  const updateClient = async (id: string, updates: Partial<Client>) => {
    await supabase.from('clients' as any).update(updates as any).eq('id', id);
    setEditId(null);
    fetchClients();
    toast.success('Client mis à jour');
  };

  const deleteClient = async (id: string) => {
    if (!confirm('Supprimer ce client ?')) return;
    await supabase.from('clients' as any).delete().eq('id', id);
    fetchClients();
    toast.success('Client supprimé');
  };

  const filtered = clients.filter(c =>
    c.business_name.toLowerCase().includes(search.toLowerCase()) ||
    (c.contact_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.email || '').toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: clients.length,
    active: clients.filter(c => c.status === 'active').length,
    mrr: clients.filter(c => c.status === 'active').reduce((s, c) => s + (c.monthly_amount || 0), 0),
    totalRevenue: clients.reduce((s, c) => s + (c.total_paid || 0), 0),
  };

  const f = (n: number) => n.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

  return (
    <div>

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total clients', value: stats.total, color: '#A78BDB' },
            { label: 'Actifs', value: stats.active, color: '#2DD4B8' },
            { label: 'MRR', value: `${f(stats.mrr)} €`, color: '#4da6d9' },
            { label: 'Revenu total', value: `${f(stats.totalRevenue)} €`, color: '#d4a55a' },
          ].map((s, i) => (
            <div key={i} className="rounded-2xl p-4" style={{ background: 'white', border: '1px solid rgba(255,255,255,0.12)' }}>
              <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 12, color: 'var(--muted-foreground)' }}>{s.label}</div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]" style={{ background: 'white', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '100px', padding: '8px 16px' }}>
            <Search size={16} style={{ color: 'var(--muted-foreground)' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un client..." style={{ border: 'none', outline: 'none', fontFamily: "'Outfit', sans-serif", fontSize: 14, flex: 1, background: 'transparent' }} />
          </div>
          <button onClick={() => { setShowImport(true); fetchConvertedProspects(); }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', background: '#2DD4B8', color: 'white', border: 'none', borderRadius: '100px', fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            <ArrowRightLeft size={14} /> Importer prospects
          </button>
          <button onClick={() => setShowAdd(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', background: '#A78BDB', color: 'white', border: 'none', borderRadius: '100px', fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            <Plus size={14} /> Ajouter manuellement
          </button>
          <button onClick={() => exportToCSV(clients, 'clients', [
            { key: 'business_name', label: 'Entreprise' }, { key: 'contact_name', label: 'Contact' }, { key: 'email', label: 'Email' },
            { key: 'phone', label: 'Téléphone' }, { key: 'plan', label: 'Plan' }, { key: 'status', label: 'Statut' },
            { key: 'monthly_amount', label: 'Montant mensuel' }, { key: 'total_paid', label: 'Total payé' },
          ])} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '100px', fontFamily: "'Outfit', sans-serif", fontSize: 13, cursor: 'pointer', color: 'rgba(242,237,228,0.55)' }}>
            <Download size={14} /> CSV
          </button>
        </div>

        {/* Client list */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, fontFamily: "'Outfit', sans-serif", color: 'var(--muted-foreground)' }}>Chargement...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, fontFamily: "'Outfit', sans-serif", color: 'var(--muted-foreground)' }}>Aucun client trouvé.</div>
        ) : (
          <div className="space-y-3">
            {filtered.map(c => (
              <div key={c.id} className="rounded-2xl p-4" style={{ background: 'white', border: '1px solid rgba(255,255,255,0.12)' }}>
                {editId === c.id ? (
                  <EditRow client={c} editData={editData} setEditData={setEditData} onSave={() => updateClient(c.id, editData)} onCancel={() => setEditId(null)} />
                ) : (
                  <div className="flex flex-col md:flex-row md:items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, color: '#F2EDE4' }}>{c.business_name}</span>
                        <span style={{ padding: '2px 10px', borderRadius: '100px', fontSize: 11, fontWeight: 700, fontFamily: "'Outfit', sans-serif", color: 'white', background: STATUS_COLORS[c.status] || '#999' }}>{STATUS_LABELS[c.status] || c.status}</span>
                        <span style={{ padding: '2px 10px', borderRadius: '100px', fontSize: 11, fontWeight: 600, fontFamily: "'Outfit', sans-serif", color: '#A78BDB', background: 'rgba(124,92,191,0.12)' }}>{c.plan}</span>
                        {c.portal_enabled && <span style={{ padding: '2px 8px', borderRadius: '100px', fontSize: 10, fontWeight: 600, fontFamily: "'Outfit', sans-serif", color: '#2DD4B8', background: 'rgba(13,138,111,0.1)' }}>🌐 Portail</span>}
                        {prospectSources[c.id] && (
                          <span style={{ padding: '2px 8px', borderRadius: '100px', fontSize: 10, fontWeight: 600, fontFamily: "'Outfit', sans-serif", color: '#d4a55a', background: 'rgba(212,165,90,0.12)' }}>
                            🎯 Prospection · Score {prospectSources[c.id].score}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1" style={{ fontFamily: "'Outfit', sans-serif", fontSize: 12, color: 'var(--muted-foreground)' }}>
                        {c.contact_name && <span>{c.contact_name}</span>}
                        {c.email && <span>{c.email}</span>}
                        {c.phone && <span>{c.phone}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-4" style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13 }}>
                      <div className="text-center">
                        <div style={{ color: 'var(--muted-foreground)', fontSize: 11 }}>Mensuel</div>
                        <div style={{ color: '#2DD4B8', fontWeight: 700 }}>{f(c.monthly_amount)} €</div>
                      </div>
                      <div className="text-center">
                        <div style={{ color: 'var(--muted-foreground)', fontSize: 11 }}>Total payé</div>
                        <div style={{ color: '#d4a55a', fontWeight: 700 }}>{f(c.total_paid)} €</div>
                      </div>
                      <button onClick={() => { setEditId(c.id); setEditData({ plan: c.plan, status: c.status, monthly_amount: c.monthly_amount, total_paid: c.total_paid, notes: c.notes }); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2DD4B8' }}><Pencil size={15} /></button>
                      <PortalInviteButton client={c} onRefresh={fetchClients} />
                      <button onClick={() => deleteClient(c.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#F07067' }}><Trash2 size={15} /></button>
                    </div>
                  </div>
                )}
                {/* Invoice summary row */}
                {clientInvoices[c.id] && editId !== c.id && (
                  <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.12)' }}>
                    <button onClick={() => setExpandedClient(expandedClient === c.id ? null : c.id)} className="flex items-center gap-2 w-full" style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Outfit', sans-serif", fontSize: 12, color: 'rgba(242,237,228,0.55)' }}>
                      <FileText size={13} />
                      <span>{clientInvoices[c.id].count} facture{clientInvoices[c.id].count > 1 ? 's' : ''}</span>
                      <span style={{ color: '#2DD4B8', fontWeight: 600 }}>Facturé : {f(clientInvoices[c.id].total)} €</span>
                      <span style={{ color: '#d4a55a', fontWeight: 600 }}>Encaissé : {f(clientInvoices[c.id].paid)} €</span>
                      {clientInvoices[c.id].total - clientInvoices[c.id].paid > 0 && (
                        <span style={{ color: '#F07067', fontWeight: 600 }}>Solde : {f(clientInvoices[c.id].total - clientInvoices[c.id].paid)} €</span>
                      )}
                      <span className="ml-auto">{expandedClient === c.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</span>
                    </button>
                    {expandedClient === c.id && (
                      <div className="mt-2 flex gap-2">
                        <button onClick={() => navigate('/admin/invoices')} style={{ padding: '6px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '100px', fontFamily: "'Outfit', sans-serif", fontSize: 12, fontWeight: 600, cursor: 'pointer', color: '#F2EDE4' }}>
                          Voir les factures →
                        </button>
                        <button onClick={() => navigate(`/admin/invoices?clientId=${c.id}`)} style={{ padding: '6px 14px', background: '#2DD4B8', color: '#fff', border: 'none', borderRadius: '100px', fontFamily: "'Outfit', sans-serif", fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                          + Nouvelle facture
                        </button>
                      </div>
                    )}
                  </div>
                )}
                {/* Projects section */}
                {editId !== c.id && (
                  <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.12)' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <FolderKanban size={13} style={{ color: 'rgba(242,237,228,0.55)' }} />
                      <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 12, color: 'rgba(242,237,228,0.55)' }}>
                        {(clientProjects[c.id] || []).length} projet{(clientProjects[c.id] || []).length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    {(clientProjects[c.id] || []).length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {(clientProjects[c.id] || []).map((p: any) => {
                          const statusCol = { brief: '#8B5CF6', maquette: '#F59E0B', development: '#3B82F6', review: '#F97316', delivered: '#10B981', maintenance: '#6B7280' }[p.status as string] || '#999';
                          return (
                            <button key={p.id} onClick={() => setProjectDetailId(p.id)} style={{
                              display: 'flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 99,
                              border: `1px solid ${statusCol}30`, background: `${statusCol}08`,
                              fontFamily: "'Outfit', sans-serif", fontSize: 12, cursor: 'pointer', color: '#F2EDE4',
                            }}>
                              <span style={{ width: 8, height: 8, borderRadius: '50%', background: statusCol }} />
                              {p.title}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, color: 'rgba(242,237,228,0.28)' }}>Aucun projet</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Import modal */}
      {showImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="rounded-3xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto" style={{ background: 'white' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20 }}>Importer des prospects convertis</h2>
              <button onClick={() => setShowImport(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            {prospects.length === 0 ? (
              <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 14, color: 'var(--muted-foreground)' }}>Aucun prospect converti disponible.</p>
            ) : (
              <>
                <div className="space-y-2 mb-4">
                  {prospects.map(p => (
                    <label key={p.id} className="flex items-center gap-3 p-3 rounded-xl cursor-pointer" style={{ background: selectedProspects.includes(p.id) ? 'rgba(13,138,111,0.08)' : 'var(--warm)', border: `1px solid ${selectedProspects.includes(p.id) ? '#2DD4B8' : 'rgba(255,255,255,0.12)'}` }}>
                      <input type="checkbox" checked={selectedProspects.includes(p.id)} onChange={() => setSelectedProspects(s => s.includes(p.id) ? s.filter(x => x !== p.id) : [...s, p.id])} />
                      <div>
                        <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 14, fontWeight: 600 }}>{p.business_name}</div>
                        <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 12, color: 'var(--muted-foreground)' }}>{p.email || 'Pas d\'email'}</div>
                      </div>
                    </label>
                  ))}
                </div>
                <button onClick={importProspects} disabled={!selectedProspects.length} style={{ width: '100%', padding: '10px 0', background: selectedProspects.length ? '#2DD4B8' : '#ccc', color: 'white', border: 'none', borderRadius: '100px', fontFamily: "'Outfit', sans-serif", fontSize: 14, fontWeight: 600, cursor: selectedProspects.length ? 'pointer' : 'default' }}>
                  Importer {selectedProspects.length} prospect(s)
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {showAdd && <AddClientModal onClose={() => setShowAdd(false)} onAdded={fetchClients} />}
      {projectDetailId && <ProjectDetailModal projectId={projectDetailId} onClose={() => { setProjectDetailId(null); fetchClients(); }} />}
    </div>
  );
};

const EditRow = ({ client, editData, setEditData, onSave, onCancel }: { client: Client; editData: Partial<Client>; setEditData: (d: Partial<Client>) => void; onSave: () => void; onCancel: () => void }) => (
  <div className="space-y-3">
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div>
        <label style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, color: 'var(--muted-foreground)' }}>Plan</label>
        <select value={editData.plan || ''} onChange={e => setEditData({ ...editData, plan: e.target.value })} style={{ width: '100%', padding: '6px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)', fontFamily: "'Outfit', sans-serif", fontSize: 13 }}>
          {PLAN_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>
      <div>
        <label style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, color: 'var(--muted-foreground)' }}>Statut</label>
        <select value={editData.status || ''} onChange={e => setEditData({ ...editData, status: e.target.value })} style={{ width: '100%', padding: '6px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)', fontFamily: "'Outfit', sans-serif", fontSize: 13 }}>
          {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      <div>
        <label style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, color: 'var(--muted-foreground)' }}>€/mois</label>
        <input type="number" value={editData.monthly_amount || 0} onChange={e => setEditData({ ...editData, monthly_amount: +e.target.value })} style={{ width: '100%', padding: '6px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)', fontFamily: "'Outfit', sans-serif", fontSize: 13 }} />
      </div>
      <div>
        <label style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, color: 'var(--muted-foreground)' }}>Total payé</label>
        <input type="number" value={editData.total_paid || 0} onChange={e => setEditData({ ...editData, total_paid: +e.target.value })} style={{ width: '100%', padding: '6px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)', fontFamily: "'Outfit', sans-serif", fontSize: 13 }} />
      </div>
    </div>
    <div>
      <label style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, color: 'var(--muted-foreground)' }}>Notes</label>
      <textarea value={editData.notes || ''} onChange={e => setEditData({ ...editData, notes: e.target.value })} rows={2} style={{ width: '100%', padding: '6px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)', fontFamily: "'Outfit', sans-serif", fontSize: 13, resize: 'vertical' }} />
    </div>
    <div className="flex gap-2">
      <button onClick={onSave} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 16px', background: '#2DD4B8', color: 'white', border: 'none', borderRadius: '100px', fontFamily: "'Outfit', sans-serif", fontSize: 13, cursor: 'pointer' }}><Check size={14} /> Sauvegarder</button>
      <button onClick={onCancel} style={{ padding: '6px 16px', background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '100px', fontFamily: "'Outfit', sans-serif", fontSize: 13, cursor: 'pointer' }}><X size={14} /></button>
    </div>
  </div>
);

const AddClientModal = ({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) => {
  const [form, setForm] = useState({ business_name: '', contact_name: '', email: '', phone: '', website_url: '', plan: 'basic', monthly_amount: 0 });

  const handleAdd = async () => {
    if (!form.business_name.trim()) { toast.error('Nom requis'); return; }
    await supabase.from('clients' as any).insert({ ...form, status: 'active', total_paid: 0 } as any);
    toast.success('Client ajouté');
    onAdded();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="rounded-3xl p-6 w-full max-w-md" style={{ background: 'white' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20 }}>Nouveau client</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
        </div>
        <div className="space-y-3">
          {[
            { key: 'business_name', label: 'Nom entreprise *', type: 'text' },
            { key: 'contact_name', label: 'Contact', type: 'text' },
            { key: 'email', label: 'Email', type: 'email' },
            { key: 'phone', label: 'Téléphone', type: 'text' },
            { key: 'website_url', label: 'Site web', type: 'url' },
          ].map(f => (
            <div key={f.key}>
              <label style={{ fontFamily: "'Outfit', sans-serif", fontSize: 12, color: 'var(--muted-foreground)' }}>{f.label}</label>
              <input type={f.type} value={(form as any)[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)', fontFamily: "'Outfit', sans-serif", fontSize: 14 }} />
            </div>
          ))}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={{ fontFamily: "'Outfit', sans-serif", fontSize: 12, color: 'var(--muted-foreground)' }}>Plan</label>
              <select value={form.plan} onChange={e => setForm({ ...form, plan: e.target.value })} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)', fontFamily: "'Outfit', sans-serif", fontSize: 14 }}>
                {PLAN_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontFamily: "'Outfit', sans-serif", fontSize: 12, color: 'var(--muted-foreground)' }}>€/mois</label>
              <input type="number" value={form.monthly_amount} onChange={e => setForm({ ...form, monthly_amount: +e.target.value })} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)', fontFamily: "'Outfit', sans-serif", fontSize: 14 }} />
            </div>
          </div>
          <button onClick={handleAdd} style={{ width: '100%', padding: '10px 0', background: '#2DD4B8', color: 'white', border: 'none', borderRadius: '100px', fontFamily: "'Outfit', sans-serif", fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Ajouter le client</button>
        </div>
      </div>
    </div>
  );
};

const PortalInviteButton = ({ client, onRefresh }: { client: Client; onRefresh: () => void }) => {
  const [loading, setLoading] = useState(false);

  const inviteToPortal = async () => {
    if (!client.email) { toast.error('Ce client n\'a pas d\'email'); return; }
    if (!confirm(`Envoyer une invitation au portail client à ${client.email} ?`)) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({ email: client.email, options: { shouldCreateUser: true } });
      if (error) throw error;
      await supabase.from('clients' as any).update({
        portal_enabled: true,
        portal_invited_at: new Date().toISOString(),
      } as any).eq('id', client.id);
      // Pre-assign 'client' role if user already exists
      const { data: existingUsers } = await supabase.from('profiles').select('user_id').eq('email', client.email).maybeSingle();
      if (existingUsers?.user_id) {
        const { data: existingRole } = await supabase.from('user_roles').select('id').eq('user_id', existingUsers.user_id).eq('role', 'client').maybeSingle();
        if (!existingRole) {
          await supabase.from('user_roles').insert({ user_id: existingUsers.user_id, role: 'client' } as any);
        }
      }
      toast.success(`Invitation envoyée à ${client.email}`);
      onRefresh();
    } catch (e: any) {
      toast.error(e.message || 'Erreur lors de l\'invitation');
    } finally {
      setLoading(false);
    }
  };

  const resendInvite = async () => {
    if (!client.email) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({ email: client.email });
      if (error) throw error;
      toast.success('Lien renvoyé');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const disablePortal = async () => {
    if (!confirm('Désactiver l\'accès portail pour ce client ?')) return;
    await supabase.from('clients' as any).update({ portal_enabled: false } as any).eq('id', client.id);
    toast.success('Accès portail désactivé');
    onRefresh();
  };

  if (client.portal_enabled) {
    return (
      <div className="flex items-center gap-1">
        <span title={`Portail actif${client.portal_invited_at ? ' — Invité le ' + new Date(client.portal_invited_at).toLocaleDateString('fr-FR') : ''}${client.portal_last_login ? '\nDernière connexion : ' + new Date(client.portal_last_login).toLocaleDateString('fr-FR') : ''}`} style={{ color: '#2DD4B8', cursor: 'help' }}><Shield size={15} /></span>
        <button onClick={resendInvite} disabled={loading} title="Renvoyer l'invitation" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4da6d9', opacity: loading ? 0.5 : 1 }}><RefreshCw size={13} /></button>
        <button onClick={disablePortal} title="Désactiver l'accès" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#F07067', fontSize: 11, fontFamily: "'Outfit', sans-serif" }}>✕</button>
      </div>
    );
  }

  return (
    <button onClick={inviteToPortal} disabled={loading || !client.email} title={client.email ? 'Inviter au portail client' : 'Email requis'} style={{ background: 'none', border: 'none', cursor: client.email ? 'pointer' : 'default', color: client.email ? '#A78BDB' : 'var(--muted-foreground)', opacity: loading ? 0.5 : 1 }}>
      <UserPlus size={15} />
    </button>
  );
};

export default AdminClients;
