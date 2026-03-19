import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import LeadDetail from '@/components/admin/LeadDetail';
import SendEmailModal from '@/components/admin/SendEmailModal';
import { LogOut, RefreshCw, Search, Filter } from 'lucide-react';

type Lead = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  project_type: string | null;
  budget: string | null;
  message: string | null;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  created_at: string;
  updated_at: string;
};

const statusColors: Record<string, string> = {
  new: '#0d8a6f',
  contacted: '#4da6d9',
  qualified: '#d4a55a',
  converted: '#7c5cbf',
  lost: '#e8735a',
};

const statusLabels: Record<string, string> = {
  new: 'Nouveau',
  contacted: 'Contacté',
  qualified: 'Qualifié',
  converted: 'Converti',
  lost: 'Perdu',
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [emailLead, setEmailLead] = useState<Lead | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter as Lead['status']);
    }

    const { data, error } = await query;
    if (error) {
      toast.error('Erreur chargement des leads');
    } else {
      setLeads((data as Lead[]) || []);
    }
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => {
    // Check auth
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        navigate('/admin/login');
        return;
      }
      supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .then(({ data: roles }) => {
          if (!roles || roles.length === 0) {
            navigate('/admin/login');
          } else {
            fetchLeads();
          }
        });
    });
  }, [navigate, fetchLeads]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/admin/login');
  };

  const updateLeadStatus = async (leadId: string, status: string) => {
    const { error } = await supabase
      .from('leads')
      .update({ status })
      .eq('id', leadId);
    if (error) {
      toast.error('Erreur mise à jour');
    } else {
      toast.success('Statut mis à jour');
      fetchLeads();
      if (selectedLead?.id === leadId) {
        setSelectedLead(prev => prev ? { ...prev, status: status as Lead['status'] } : null);
      }
    }
  };

  const filteredLeads = leads.filter(l =>
    l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (l.phone && l.phone.includes(searchQuery))
  );

  const stats = {
    total: leads.length,
    new: leads.filter(l => l.status === 'new').length,
    contacted: leads.filter(l => l.status === 'contacted').length,
    converted: leads.filter(l => l.status === 'converted').length,
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--cream)' }}>
      {/* Header */}
      <header
        className="flex items-center justify-between px-6 py-4"
        style={{
          background: 'var(--glass-bg-strong)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--glass-border)',
        }}
      >
        <h1 style={{ fontFamily: 'var(--font-h)', fontSize: 22, color: 'var(--charcoal)' }}>
          Creationation CRM
        </h1>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 cursor-pointer"
          style={{
            padding: '8px 16px',
            background: 'transparent',
            border: '1px solid var(--glass-border)',
            borderRadius: 'var(--pill)',
            fontFamily: 'var(--font-b)',
            fontSize: 13,
            color: 'var(--text-mid)',
            cursor: 'pointer',
          }}
        >
          <LogOut size={14} /> Déconnexion
        </button>
      </header>

      <div className="p-6 max-w-[1400px] mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total prospects', value: stats.total, color: 'var(--charcoal)' },
            { label: 'Nouveaux', value: stats.new, color: statusColors.new },
            { label: 'Contactés', value: stats.contacted, color: statusColors.contacted },
            { label: 'Convertis', value: stats.converted, color: statusColors.converted },
          ].map((s, i) => (
            <div
              key={i}
              style={{
                padding: '20px',
                background: 'var(--glass-bg-strong)',
                backdropFilter: 'blur(20px)',
                borderRadius: 'var(--r)',
                border: '1px solid var(--glass-border)',
              }}
            >
              <p style={{ fontFamily: 'var(--font-b)', fontSize: 12, color: 'var(--text-light)', marginBottom: 4 }}>
                {s.label}
              </p>
              <p style={{ fontFamily: 'var(--font-h)', fontSize: 32, color: s.color }}>
                {s.value}
              </p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex items-center gap-2 flex-1" style={{
            padding: '10px 16px',
            background: 'var(--glass-bg)',
            borderRadius: 'var(--r)',
            border: '1px solid var(--glass-border)',
          }}>
            <Search size={16} style={{ color: 'var(--text-light)' }} />
            <input
              placeholder="Rechercher un prospect..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                fontFamily: 'var(--font-b)',
                fontSize: 14,
                color: 'var(--text)',
              }}
            />
          </div>
          <div className="flex items-center gap-2" style={{
            padding: '10px 16px',
            background: 'var(--glass-bg)',
            borderRadius: 'var(--r)',
            border: '1px solid var(--glass-border)',
          }}>
            <Filter size={16} style={{ color: 'var(--text-light)' }} />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                fontFamily: 'var(--font-b)',
                fontSize: 14,
                color: 'var(--text)',
                cursor: 'pointer',
              }}
            >
              <option value="all">Tous les statuts</option>
              {Object.entries(statusLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          <button
            onClick={fetchLeads}
            className="flex items-center gap-2 cursor-pointer"
            style={{
              padding: '10px 20px',
              background: 'var(--teal)',
              color: '#fff',
              border: 'none',
              borderRadius: 'var(--r)',
              fontFamily: 'var(--font-b)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={14} /> Actualiser
          </button>
        </div>

        {/* Leads table */}
        {loading ? (
          <div className="text-center py-20" style={{ color: 'var(--text-light)', fontFamily: 'var(--font-b)' }}>
            Chargement...
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="text-center py-20" style={{ color: 'var(--text-light)', fontFamily: 'var(--font-b)' }}>
            Aucun prospect trouvé
          </div>
        ) : (
          <div style={{
            background: 'var(--glass-bg-strong)',
            backdropFilter: 'blur(20px)',
            borderRadius: 'var(--r)',
            border: '1px solid var(--glass-border)',
            overflow: 'hidden',
          }}>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full" style={{ fontFamily: 'var(--font-b)', fontSize: 14 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    {['Nom', 'Email', 'Type', 'Budget', 'Statut', 'Date', 'Actions'].map(h => (
                      <th key={h} className="text-left px-4 py-3" style={{
                        fontSize: 11,
                        textTransform: 'uppercase',
                        letterSpacing: 1,
                        color: 'var(--text-light)',
                        fontWeight: 600,
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.map(lead => (
                    <tr
                      key={lead.id}
                      className="cursor-pointer transition-colors"
                      style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}
                      onClick={() => setSelectedLead(lead)}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(13,138,111,0.04)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td className="px-4 py-3 font-medium" style={{ color: 'var(--charcoal)' }}>
                        {lead.name}
                      </td>
                      <td className="px-4 py-3" style={{ color: 'var(--text-mid)' }}>
                        {lead.email}
                      </td>
                      <td className="px-4 py-3" style={{ color: 'var(--text-mid)' }}>
                        {lead.project_type || '—'}
                      </td>
                      <td className="px-4 py-3" style={{ color: 'var(--text-mid)' }}>
                        {lead.budget || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={lead.status}
                          onClick={e => e.stopPropagation()}
                          onChange={e => {
                            e.stopPropagation();
                            updateLeadStatus(lead.id, e.target.value);
                          }}
                          style={{
                            padding: '4px 8px',
                            borderRadius: 'var(--pill)',
                            border: 'none',
                            background: `${statusColors[lead.status]}18`,
                            color: statusColors[lead.status],
                            fontWeight: 600,
                            fontSize: 12,
                            fontFamily: 'var(--font-m)',
                            cursor: 'pointer',
                          }}
                        >
                          {Object.entries(statusLabels).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3" style={{ color: 'var(--text-light)', fontSize: 12 }}>
                        {new Date(lead.created_at).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            setEmailLead(lead);
                          }}
                          style={{
                            padding: '6px 12px',
                            background: 'var(--teal)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 'var(--pill)',
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: 'pointer',
                            fontFamily: 'var(--font-b)',
                          }}
                        >
                          Email
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden flex flex-col">
              {filteredLeads.map(lead => (
                <div
                  key={lead.id}
                  className="p-4 cursor-pointer"
                  style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}
                  onClick={() => setSelectedLead(lead)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span style={{ fontWeight: 600, color: 'var(--charcoal)', fontFamily: 'var(--font-b)' }}>
                      {lead.name}
                    </span>
                    <span
                      style={{
                        padding: '3px 10px',
                        borderRadius: 'var(--pill)',
                        background: `${statusColors[lead.status]}18`,
                        color: statusColors[lead.status],
                        fontWeight: 600,
                        fontSize: 11,
                        fontFamily: 'var(--font-m)',
                      }}
                    >
                      {statusLabels[lead.status]}
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-mid)', fontFamily: 'var(--font-b)' }}>
                    {lead.email}
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--text-light)', fontFamily: 'var(--font-b)', marginTop: 4 }}>
                    {lead.project_type || '—'} • {lead.budget || '—'} • {new Date(lead.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Lead Detail Sidebar */}
      {selectedLead && (
        <LeadDetail
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onStatusChange={(status) => updateLeadStatus(selectedLead.id, status)}
          onSendEmail={() => {
            setEmailLead(selectedLead);
          }}
        />
      )}

      {/* Send Email Modal */}
      {emailLead && (
        <SendEmailModal
          lead={emailLead}
          onClose={() => setEmailLead(null)}
          onSent={() => {
            setEmailLead(null);
            fetchLeads();
          }}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
