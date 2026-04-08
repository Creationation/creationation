import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Eye, Copy, Trash2, ExternalLink, UserPlus, Search, Filter } from 'lucide-react';
import DemoFormModal from '@/components/admin/DemoFormModal';
import { useNavigate } from 'react-router-dom';

const TEAL = '#2A9D8F';
const GOLD = '#E9C46A';
const CORAL = '#E76F51';
const TEXT_PRIMARY = '#1A2332';
const TEXT_SECONDARY = 'rgba(26,35,50,0.55)';

type Demo = {
  id: string; business_name: string; business_type: string | null;
  contact_name: string | null; contact_email: string | null;
  template_type: string; access_token: string; is_active: boolean;
  expires_at: string; viewed_count: number; last_viewed_at: string | null;
  status: string; created_at: string; notes: string | null;
  converted_to_client_id: string | null; primary_color: string;
  secondary_color: string; tagline: string | null; services: any;
  address: string | null; city: string | null; phone: string | null;
  opening_hours: any; logo_url: string | null; contact_phone: string | null;
  prospect_id: string | null;
};

const STATUS_COLORS: Record<string, string> = {
  draft: '#8896A6', sent: '#4da6d9', viewed: GOLD, converted: TEAL, expired: CORAL,
};
const STATUS_LABELS: Record<string, string> = {
  draft: 'Brouillon', sent: 'Envoyé', viewed: 'Consulté', converted: 'Converti', expired: 'Expiré',
};

const GlassCard = ({ children, style, className = '' }: any) => (
  <div className={className} style={{
    background: 'rgba(255,255,255,0.20)', backdropFilter: 'blur(20px) saturate(1.4)',
    WebkitBackdropFilter: 'blur(20px) saturate(1.4)', borderRadius: 16,
    border: '1px solid rgba(255,255,255,0.30)', ...style,
  }}>{children}</div>
);

const AdminDemos = () => {
  const [demos, setDemos] = useState<Demo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingDemo, setEditingDemo] = useState<Demo | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const navigate = useNavigate();

  const fetchDemos = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('demos').select('*').order('created_at', { ascending: false });
    if (error) { toast.error('Erreur chargement démos'); console.error(error); }
    else setDemos((data as any) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchDemos(); }, [fetchDemos]);

  const activeDemos = demos.filter(d => d.is_active && new Date(d.expires_at) > new Date());
  const viewedDemos = demos.filter(d => d.viewed_count > 0);
  const convertedDemos = demos.filter(d => d.status === 'converted');
  const expiredThisMonth = demos.filter(d => {
    const exp = new Date(d.expires_at);
    const now = new Date();
    return d.status === 'expired' || (!d.is_active && exp < now) &&
      exp.getMonth() === now.getMonth() && exp.getFullYear() === now.getFullYear();
  });
  const conversionRate = demos.length > 0 ? Math.round((convertedDemos.length / demos.length) * 100) : 0;

  const filteredDemos = demos.filter(d => {
    if (statusFilter !== 'all' && d.status !== statusFilter) return false;
    if (typeFilter !== 'all' && d.template_type !== typeFilter) return false;
    if (search && !d.business_name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const copyLink = (token: string) => {
    navigator.clipboard.writeText(`https://creationation.lovable.app/demo/${token}`);
    toast.success('Lien copié !');
  };

  const deleteDemo = async (id: string) => {
    if (!confirm('Supprimer cette démo ?')) return;
    await supabase.from('demos').delete().eq('id', id);
    toast.success('Démo supprimée');
    fetchDemos();
  };

  const convertToClient = async (demo: Demo) => {
    const { data, error } = await supabase.from('clients').insert({
      business_name: demo.business_name,
      business_type: demo.business_type,
      contact_name: demo.contact_name,
      email: demo.contact_email,
      phone: demo.contact_phone || demo.phone,
      city: demo.city,
      website_url: null,
      status: 'active',
    } as any).select().single();
    if (error) { toast.error('Erreur conversion'); return; }
    await supabase.from('demos').update({ status: 'converted', converted_to_client_id: (data as any).id } as any).eq('id', demo.id);
    toast.success('Prospect converti en client !');
    navigate(`/admin/clients-crm`);
  };

  const kpis = [
    { label: 'Démos actives', value: activeDemos.length, color: TEAL },
    { label: 'Démos consultées', value: viewedDemos.length, color: GOLD },
    { label: 'Taux conversion', value: `${conversionRate}%`, color: '#7c5cbf' },
    { label: 'Expirées ce mois', value: expiredThisMonth.length, color: CORAL },
  ];

  return (
    <div className="p-4 md:p-8 space-y-6" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 style={{ fontSize: 28, fontWeight: 700, color: TEXT_PRIMARY, fontFamily: "'Playfair Display', serif" }}>
          Démos Live
        </h1>
        <button onClick={() => { setEditingDemo(null); setShowForm(true); }} style={{
          padding: '10px 22px', borderRadius: 99, border: 'none', cursor: 'pointer',
          background: `linear-gradient(135deg, ${TEAL}, #3EDDC7)`, color: '#fff',
          fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8,
          boxShadow: '0 4px 20px rgba(42,157,143,0.35)',
        }}>
          <Plus size={16} /> Nouvelle démo
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map(k => (
          <GlassCard key={k.label} style={{ padding: '20px 24px' }}>
            <p style={{ fontSize: 12, color: TEXT_SECONDARY, fontWeight: 500, marginBottom: 4 }}>{k.label}</p>
            <p style={{ fontSize: 28, fontWeight: 700, color: k.color }}>{k.value}</p>
          </GlassCard>
        ))}
      </div>

      {/* Filters */}
      <GlassCard style={{ padding: 16 }}>
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]" style={{
            background: 'rgba(255,255,255,0.3)', borderRadius: 10, padding: '8px 12px',
            border: '1px solid rgba(255,255,255,0.3)',
          }}>
            <Search size={16} style={{ color: TEXT_SECONDARY }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..."
              style={{ background: 'none', border: 'none', outline: 'none', flex: 1, fontSize: 14, color: TEXT_PRIMARY }} />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{
            padding: '8px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.3)',
            background: 'rgba(255,255,255,0.3)', fontSize: 13, color: TEXT_PRIMARY,
          }}>
            <option value="all">Tous statuts</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{
            padding: '8px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.3)',
            background: 'rgba(255,255,255,0.3)', fontSize: 13, color: TEXT_PRIMARY,
          }}>
            <option value="all">Tous types</option>
            <option value="beauty">Beauté</option>
            <option value="coiffeur">Coiffeur</option>
            <option value="restaurant">Restaurant</option>
            <option value="nail">Nail Studio</option>
            <option value="generic">Générique</option>
          </select>
        </div>
      </GlassCard>

      {/* Table */}
      <GlassCard style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.25)' }}>
                {['Business', 'Type', 'Statut', 'Vues', 'Créée le', 'Expire le', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 600, color: TEXT_SECONDARY, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: TEXT_SECONDARY }}>Chargement...</td></tr>
              ) : filteredDemos.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: TEXT_SECONDARY }}>Aucune démo</td></tr>
              ) : filteredDemos.map(d => (
                <tr key={d.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: TEXT_PRIMARY }}>
                    <div className="flex items-center gap-2">
                      <div style={{
                        width: 32, height: 32, borderRadius: 8,
                        background: d.primary_color || TEAL,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontSize: 13, fontWeight: 700,
                      }}>{d.business_name.charAt(0)}</div>
                      {d.business_name}
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', color: TEXT_SECONDARY }}>{d.template_type}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      padding: '4px 12px', borderRadius: 99, fontSize: 12, fontWeight: 600,
                      background: `${STATUS_COLORS[d.status] || '#888'}20`,
                      color: STATUS_COLORS[d.status] || '#888',
                    }}>{STATUS_LABELS[d.status] || d.status}</span>
                  </td>
                  <td style={{ padding: '12px 16px', color: TEXT_PRIMARY, fontWeight: 600 }}>
                    <div className="flex items-center gap-1"><Eye size={14} style={{ color: TEAL }} />{d.viewed_count}</div>
                  </td>
                  <td style={{ padding: '12px 16px', color: TEXT_SECONDARY, fontSize: 13 }}>
                    {new Date(d.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td style={{ padding: '12px 16px', color: TEXT_SECONDARY, fontSize: 13 }}>
                    {new Date(d.expires_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div className="flex items-center gap-1">
                      <button onClick={() => copyLink(d.access_token)} title="Copier le lien" style={btnStyle}><Copy size={14} /></button>
                      <a href={`/demo/${d.access_token}`} target="_blank" title="Voir la démo" style={btnStyle}><ExternalLink size={14} /></a>
                      <button onClick={() => { setEditingDemo(d); setShowForm(true); }} title="Modifier" style={btnStyle}><Eye size={14} /></button>
                      {d.status !== 'converted' && (
                        <button onClick={() => convertToClient(d)} title="Convertir en client" style={{ ...btnStyle, color: TEAL }}><UserPlus size={14} /></button>
                      )}
                      <button onClick={() => deleteDemo(d.id)} title="Supprimer" style={{ ...btnStyle, color: CORAL }}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {showForm && (
        <DemoFormModal
          demo={editingDemo}
          onClose={() => { setShowForm(false); setEditingDemo(null); }}
          onSaved={() => { setShowForm(false); setEditingDemo(null); fetchDemos(); }}
        />
      )}
    </div>
  );
};

const btnStyle: React.CSSProperties = {
  width: 32, height: 32, borderRadius: 8, border: 'none', cursor: 'pointer',
  background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center',
  color: TEXT_PRIMARY,
};
const TEXT_PRIMARY_STATIC = '#1A2332';

export default AdminDemos;
