import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import LeadDetail from '@/components/admin/LeadDetail';
import SendEmailModal from '@/components/admin/SendEmailModal';
import ProjectAlerts from '@/components/admin/ProjectAlerts';
import DashboardCharts from '@/components/admin/DashboardCharts';
import { RefreshCw, Search } from 'lucide-react';

const C = {
  textPrimary: '#F2EDE4',
  textSecondary: 'rgba(242,237,228,0.55)',
  textMuted: 'rgba(242,237,228,0.28)',
  teal: '#2DD4B8',
};

type Lead = {
  id: string; name: string; email: string; phone: string | null;
  project_type: string | null; budget: string | null; message: string | null;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  created_at: string; updated_at: string;
};

const statusColors: Record<string, string> = { new: '#2DD4B8', contacted: '#4da6d9', qualified: '#F0C95C', converted: '#A78BDB', lost: '#F07067' };
const statusLabels: Record<string, string> = { new: 'Nouveau', contacted: 'Contacté', qualified: 'Qualifié', converted: 'Converti', lost: 'Perdu' };

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [emailLead, setEmailLead] = useState<Lead | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('leads').select('*').order('created_at', { ascending: false });
    if (statusFilter !== 'all') query = query.eq('status', statusFilter as Lead['status']);
    const { data, error } = await query;
    if (error) toast.error('Erreur chargement des leads');
    else setLeads((data as Lead[]) || []);
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { navigate('/admin/login'); return; }
      supabase.from('user_roles').select('role').eq('user_id', user.id).eq('role', 'admin').then(({ data: roles }) => {
        if (!roles || roles.length === 0) navigate('/admin/login');
        else { fetchLeads(); }
      });
    });
  }, [navigate, fetchLeads]);

  const updateLeadStatus = async (leadId: string, status: string) => {
    const { error } = await supabase.from('leads').update({ status: status as Lead['status'] }).eq('id', leadId);
    if (error) toast.error('Erreur mise à jour');
    else { toast.success('Statut mis à jour'); fetchLeads(); if (selectedLead?.id === leadId) setSelectedLead(prev => prev ? { ...prev, status: status as Lead['status'] } : null); }
  };

  const filteredLeads = leads.filter(l => {
    const matchSearch = l.name.toLowerCase().includes(searchQuery.toLowerCase()) || l.email.toLowerCase().includes(searchQuery.toLowerCase()) || (l.phone && l.phone.includes(searchQuery));
    if (!matchSearch) return false;
    if (dateFilter !== 'all') {
      const d = new Date(l.created_at); const now = new Date();
      if (dateFilter === '7d' && now.getTime() - d.getTime() > 7 * 86400000) return false;
      if (dateFilter === '30d' && now.getTime() - d.getTime() > 30 * 86400000) return false;
      if (dateFilter === '90d' && now.getTime() - d.getTime() > 90 * 86400000) return false;
    }
    return true;
  });

  return (
    <div className="p-6 max-w-[1400px] mx-auto" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="admin-page-title">Dashboard</h1>
          <p style={{ fontSize: 13, color: C.textSecondary, marginTop: 4 }}>Vue d'ensemble de Creationation</p>
        </div>
      </div>

      <ProjectAlerts />
      <div className="mb-8"><DashboardCharts /></div>

      <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: C.textPrimary, margin: '0 0 16px' }}>Leads entrants</h3>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex items-center gap-2 flex-1 admin-glass-input" style={{ padding: '10px 16px' }}>
          <Search size={16} style={{ color: C.textMuted }} />
          <input placeholder="Rechercher un prospect..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontFamily: "'Outfit', sans-serif", fontSize: 14, color: C.textPrimary }} />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="admin-glass-input" style={{ cursor: 'pointer' }}>
          <option value="all">Tous les statuts</option>
          {Object.entries(statusLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
        </select>
        <select value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="admin-glass-input" style={{ cursor: 'pointer' }}>
          <option value="all">Toute période</option>
          <option value="7d">7 derniers jours</option>
          <option value="30d">30 derniers jours</option>
          <option value="90d">90 derniers jours</option>
        </select>
        <button onClick={fetchLeads} className="admin-glass-btn" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <RefreshCw size={14} /> Actualiser
        </button>
      </div>

      {/* Leads table */}
      {loading ? (
        <div className="text-center py-20" style={{ color: C.textMuted }}>Chargement...</div>
      ) : filteredLeads.length === 0 ? (
        <div className="text-center py-20" style={{ color: C.textMuted }}>Aucun prospect trouvé</div>
      ) : (
        <div className="admin-glass-table">
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full" style={{ fontFamily: "'Outfit', sans-serif", fontSize: 14 }}>
              <thead>
                <tr>
                  {['Nom', 'Email', 'Type', 'Budget', 'Statut', 'Date', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.2, color: C.textMuted, fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map(lead => (
                  <tr key={lead.id} className="cursor-pointer" onClick={() => setSelectedLead(lead)}>
                    <td className="px-4 py-3 font-medium" style={{ color: C.textPrimary }}>{lead.name}</td>
                    <td className="px-4 py-3" style={{ color: C.textSecondary }}>{lead.email}</td>
                    <td className="px-4 py-3" style={{ color: C.textSecondary }}>{lead.project_type || '—'}</td>
                    <td className="px-4 py-3" style={{ color: C.textSecondary }}>{lead.budget || '—'}</td>
                    <td className="px-4 py-3">
                      <select value={lead.status} onClick={e => e.stopPropagation()} onChange={e => { e.stopPropagation(); updateLeadStatus(lead.id, e.target.value); }} className="admin-status-badge" style={{ background: `${statusColors[lead.status]}20`, color: statusColors[lead.status], border: 'none', cursor: 'pointer', fontSize: 11 }}>
                        {Object.entries(statusLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3" style={{ color: C.textMuted, fontSize: 12 }}>{new Date(lead.created_at).toLocaleDateString('fr-FR')}</td>
                    <td className="px-4 py-3">
                      <button onClick={e => { e.stopPropagation(); setEmailLead(lead); }} className="admin-glass-btn" style={{ padding: '6px 14px', fontSize: 11 }}>Email</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="md:hidden flex flex-col">
            {filteredLeads.map(lead => (
              <div key={lead.id} className="p-4 cursor-pointer" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }} onClick={() => setSelectedLead(lead)}>
                <div className="flex items-center justify-between mb-2">
                  <span style={{ fontWeight: 600, color: C.textPrimary }}>{lead.name}</span>
                  <span className="admin-status-badge" style={{ background: `${statusColors[lead.status]}20`, color: statusColors[lead.status] }}>{statusLabels[lead.status]}</span>
                </div>
                <p style={{ fontSize: 13, color: C.textSecondary }}>{lead.email}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedLead && <LeadDetail lead={selectedLead} onClose={() => setSelectedLead(null)} onStatusChange={(status) => updateLeadStatus(selectedLead.id, status)} onSendEmail={() => setEmailLead(selectedLead)} />}
      {emailLead && <SendEmailModal lead={emailLead} onClose={() => setEmailLead(null)} onSent={() => { setEmailLead(null); fetchLeads(); }} />}
    </div>
  );
};

export default AdminDashboard;
