import { useState, useEffect } from 'react';
import { useOutletContext, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Plus, X, Upload, Search, Filter } from 'lucide-react';
import { toast } from 'sonner';

const statusColors: Record<string, string> = {
  open: '#0d8a6f', in_progress: '#4da6d9', waiting_client: '#d4a55a', resolved: '#7c5cbf', closed: '#9b9590',
};
const statusLabels: Record<string, string> = {
  open: 'Ouvert', in_progress: 'En cours', waiting_client: 'En attente', resolved: 'Résolu', closed: 'Fermé',
};
const priorityColors: Record<string, string> = {
  low: '#9b9590', medium: '#4da6d9', high: '#d4a55a', urgent: '#e8735a',
};
const priorityLabels: Record<string, string> = {
  low: 'Basse', medium: 'Moyenne', high: 'Haute', urgent: 'Urgente',
};
const categoryLabels: Record<string, string> = {
  bug: 'Bug', feature_request: 'Nouvelle fonctionnalité', modification: 'Modification', question: 'Question', other: 'Autre',
};

const PortalTickets = () => {
  const { client, simulationMode } = useOutletContext<{ client: any; simulationMode?: boolean }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(searchParams.get('new') === '1');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');

  // New ticket form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('other');
  const [priority, setPriority] = useState('medium');
  const [submitting, setSubmitting] = useState(false);

  const fetchTickets = async () => {
    if (!client?.id) return;
    const { data } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('client_id', client.id)
      .order('created_at', { ascending: false });
    setTickets(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchTickets(); }, [client?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) { toast.error('Titre et description requis'); return; }
    setSubmitting(true);
    const { error } = await supabase.from('support_tickets').insert({
      client_id: client.id,
      title: title.trim(),
      description: description.trim(),
      category: category as any,
      priority: priority as any,
      created_by: 'client' as any,
    } as any);
    if (error) { toast.error('Erreur lors de la création'); setSubmitting(false); return; }
    toast.success('Ticket créé !');
    setTitle(''); setDescription(''); setCategory('other'); setPriority('medium');
    setShowNew(false); setSubmitting(false);
    fetchTickets();
  };

  const filtered = tickets.filter(t => {
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
    if (filterCategory !== 'all' && t.category !== filterCategory) return false;
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.6)',
    border: '1px solid var(--glass-border)', borderRadius: 12, fontFamily: 'var(--font-b)',
    fontSize: 14, color: 'var(--charcoal)', outline: 'none',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 style={{ fontFamily: 'var(--font-h)', fontSize: 24, color: 'var(--charcoal)', margin: 0 }}>Mes tickets</h1>
        {!simulationMode && <button onClick={() => setShowNew(true)} style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px',
          background: 'var(--teal)', color: '#fff', border: 'none', borderRadius: 'var(--pill)',
          fontFamily: 'var(--font-b)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
        }}>
          <Plus size={16} /> Nouveau ticket
        </button>}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="flex items-center gap-2 flex-1" style={{ padding: '8px 12px', background: 'var(--glass-bg)', borderRadius: 12, border: '1px solid var(--glass-border)' }}>
          <Search size={14} style={{ color: 'var(--text-light)' }} />
          <input placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontFamily: 'var(--font-b)', fontSize: 13, color: 'var(--text)' }} />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: '8px 12px', background: 'var(--glass-bg)', borderRadius: 12, border: '1px solid var(--glass-border)', fontFamily: 'var(--font-b)', fontSize: 13, color: 'var(--text)', cursor: 'pointer' }}>
          <option value="all">Tous statuts</option>
          {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} style={{ padding: '8px 12px', background: 'var(--glass-bg)', borderRadius: 12, border: '1px solid var(--glass-border)', fontFamily: 'var(--font-b)', fontSize: 13, color: 'var(--text)', cursor: 'pointer' }}>
          <option value="all">Toutes priorités</option>
          {Object.entries(priorityLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} style={{ padding: '8px 12px', background: 'var(--glass-bg)', borderRadius: 12, border: '1px solid var(--glass-border)', fontFamily: 'var(--font-b)', fontSize: 13, color: 'var(--text)', cursor: 'pointer' }}>
          <option value="all">Toutes catégories</option>
          {Object.entries(categoryLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {/* Tickets list */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, fontFamily: 'var(--font-b)', color: 'var(--text-light)' }}>Chargement...</div>
      ) : filtered.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: 60, background: 'var(--glass-bg)', borderRadius: 'var(--r)',
          border: '1px solid var(--glass-border)', fontFamily: 'var(--font-b)', color: 'var(--text-light)',
        }}>
          {tickets.length === 0 ? 'Aucun ticket pour le moment' : 'Aucun ticket ne correspond à vos filtres'}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map(t => (
            <div key={t.id} onClick={() => navigate(`/portal/tickets/${t.id}`)}
              className="cursor-pointer transition-all"
              style={{
                padding: '16px 20px', background: 'var(--glass-bg-strong)', backdropFilter: 'blur(20px)',
                borderRadius: 'var(--r)', border: '1px solid var(--glass-border)',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.06)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div style={{ fontFamily: 'var(--font-b)', fontSize: 15, fontWeight: 600, color: 'var(--charcoal)', marginBottom: 6 }}>
                    {t.title}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span style={{ padding: '2px 10px', borderRadius: 'var(--pill)', background: `${statusColors[t.status]}18`, color: statusColors[t.status], fontFamily: 'var(--font-m)', fontSize: 11, fontWeight: 600 }}>
                      {statusLabels[t.status]}
                    </span>
                    <span style={{ padding: '2px 10px', borderRadius: 'var(--pill)', background: `${priorityColors[t.priority]}18`, color: priorityColors[t.priority], fontFamily: 'var(--font-m)', fontSize: 11, fontWeight: 600 }}>
                      {priorityLabels[t.priority]}
                    </span>
                    <span style={{ padding: '2px 10px', borderRadius: 'var(--pill)', background: 'rgba(0,0,0,0.04)', color: 'var(--text-mid)', fontFamily: 'var(--font-b)', fontSize: 11 }}>
                      {categoryLabels[t.category] || t.category}
                    </span>
                  </div>
                </div>
                <div style={{ fontFamily: 'var(--font-b)', fontSize: 11, color: 'var(--text-light)', whiteSpace: 'nowrap' }}>
                  {new Date(t.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New ticket modal */}
      {showNew && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={e => { if (e.target === e.currentTarget) setShowNew(false); }}>
          <div style={{
            width: '100%', maxWidth: 520, background: 'var(--warm)', borderRadius: 'var(--r-lg)',
            border: '1px solid var(--glass-border)', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', padding: 28,
            maxHeight: '90vh', overflowY: 'auto',
          }}>
            <div className="flex items-center justify-between mb-5">
              <h2 style={{ fontFamily: 'var(--font-h)', fontSize: 20, color: 'var(--charcoal)', margin: 0 }}>Nouveau ticket</h2>
              <button onClick={() => setShowNew(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label style={{ fontFamily: 'var(--font-b)', fontSize: 12, fontWeight: 600, color: 'var(--text-mid)', marginBottom: 4, display: 'block' }}>Titre *</label>
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Décrivez votre problème en quelques mots" style={inputStyle} required />
              </div>
              <div>
                <label style={{ fontFamily: 'var(--font-b)', fontSize: 12, fontWeight: 600, color: 'var(--text-mid)', marginBottom: 4, display: 'block' }}>Description *</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Détaillez votre demande..." rows={5} style={{ ...inputStyle, minHeight: 120, resize: 'vertical' }} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label style={{ fontFamily: 'var(--font-b)', fontSize: 12, fontWeight: 600, color: 'var(--text-mid)', marginBottom: 4, display: 'block' }}>Catégorie</label>
                  <select value={category} onChange={e => setCategory(e.target.value)} style={inputStyle}>
                    {Object.entries(categoryLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontFamily: 'var(--font-b)', fontSize: 12, fontWeight: 600, color: 'var(--text-mid)', marginBottom: 4, display: 'block' }}>Priorité</label>
                  <select value={priority} onChange={e => setPriority(e.target.value)} style={inputStyle}>
                    {Object.entries(priorityLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              </div>
              <button type="submit" disabled={submitting} style={{
                padding: '14px 0', background: submitting ? 'var(--text-light)' : 'var(--teal)', color: '#fff',
                border: 'none', borderRadius: 'var(--pill)', fontFamily: 'var(--font-b)', fontSize: 15,
                fontWeight: 600, cursor: submitting ? 'default' : 'pointer', marginTop: 8,
              }}>
                {submitting ? 'Envoi...' : 'Créer le ticket'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PortalTickets;
