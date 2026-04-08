import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, X, Eye, Send, FileDown, Search, Filter } from 'lucide-react';
import { pdf } from '@react-pdf/renderer';
import ContractFormModal from '@/components/admin/ContractFormModal';
import ContractPDFDocument from '@/components/admin/ContractPDFDocument';

const TEXT_PRIMARY = '#1A2332';
const TEXT_SECONDARY = 'rgba(26,35,50,0.55)';
const TEXT_MUTED = 'rgba(26,35,50,0.30)';
const TEAL = '#2A9D8F';

const STATUS_COLORS: Record<string, { color: string; label: string }> = {
  pending: { color: '#D4A843', label: 'En attente' },
  sent: { color: '#3b82f6', label: 'Envoyé' },
  signed: { color: '#8b5cf6', label: 'Signé' },
  active: { color: '#2A9D8F', label: 'Actif' },
  expired: { color: 'rgba(26,35,50,0.35)', label: 'Expiré' },
  cancelled: { color: '#E76F51', label: 'Annulé' },
};

const AdminContracts = () => {
  const [contracts, setContracts] = useState<any[]>([]);
  const [clients, setClients] = useState<{ id: string; business_name: string; email: string | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [detail, setDetail] = useState<any>(null);
  const [editContract, setEditContract] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [generatingPdf, setGeneratingPdf] = useState<string | null>(null);
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);
  const [showSendModal, setShowSendModal] = useState<any>(null);
  const [customMessage, setCustomMessage] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [{ data: co }, { data: cl }] = await Promise.all([
      supabase.from('contracts').select('*').order('created_at', { ascending: false }),
      supabase.from('clients').select('id, business_name, email'),
    ]);
    setContracts(co || []);
    setClients(cl || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const clientMap = Object.fromEntries(clients.map(c => [c.id, c]));
  const fmt = (n: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);

  const filteredContracts = contracts.filter(c => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (searchQuery) {
      const clientName = clientMap[c.client_id]?.business_name?.toLowerCase() || '';
      if (!clientName.includes(searchQuery.toLowerCase())) return false;
    }
    return true;
  });

  const generatePDF = async (contract: any) => {
    setGeneratingPdf(contract.id);
    try {
      const clientName = clientMap[contract.client_id]?.business_name || 'Client';
      const content = contract.content || `Contrat pour ${clientName}`;
      
      const blob = await pdf(<ContractPDFDocument content={content} clientName={clientName} />).toBlob();
      const fileName = `contrat-${clientName.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.pdf`;
      
      const { error: uploadError } = await supabase.storage
        .from('contract-documents')
        .upload(fileName, blob, { contentType: 'application/pdf' });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('contract-documents')
        .getPublicUrl(fileName);

      await supabase.from('contracts').update({ document_url: urlData.publicUrl }).eq('id', contract.id);
      
      toast.success('PDF généré et stocké');
      fetchData();
    } catch (e: any) {
      console.error(e);
      toast.error('Erreur lors de la génération du PDF');
    } finally {
      setGeneratingPdf(null);
    }
  };

  const sendContractEmail = async (contract: any) => {
    const client = clientMap[contract.client_id];
    if (!client?.email) { toast.error('Pas d\'email pour ce client'); return; }
    if (!contract.document_url) { toast.error('Générez d\'abord le PDF'); return; }

    setSendingEmail(contract.id);
    try {
      const { error } = await supabase.functions.invoke('send-contract-email', {
        body: {
          contractId: contract.id,
          recipientEmail: client.email,
          businessName: client.business_name,
          customMessage: customMessage || undefined,
        },
      });
      if (error) throw error;
      toast.success(`Contrat envoyé à ${client.email}`);
      setShowSendModal(null);
      setCustomMessage('');
      fetchData();
    } catch (e: any) {
      console.error(e);
      toast.error('Erreur lors de l\'envoi');
    } finally {
      setSendingEmail(null);
    }
  };

  const updateStatus = async (contractId: string, status: string) => {
    await supabase.from('contracts').update({ status: status as any }).eq('id', contractId);
    toast.success(`Statut mis à jour : ${STATUS_COLORS[status]?.label || status}`);
    fetchData();
    if (detail?.id === contractId) setDetail({ ...detail, status });
  };

  if (loading) return <div className="p-8 text-center" style={{ fontFamily: "'Outfit', sans-serif", color: TEXT_MUTED }}>Chargement...</div>;

  return (
    <div className="p-4 md:p-6 max-w-[1200px] mx-auto space-y-6" style={{ fontFamily: "'Outfit', sans-serif" }}>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="admin-page-title">Contrats</h1>
        <button onClick={() => { setEditContract(null); setShowForm(true); }} className="admin-glass-btn" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Plus size={14} /> Nouveau contrat
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: contracts.length, color: TEXT_PRIMARY },
          { label: 'Actifs', value: contracts.filter(c => c.status === 'active').length, color: TEAL },
          { label: 'En attente', value: contracts.filter(c => c.status === 'pending' || c.status === 'sent').length, color: '#D4A843' },
          { label: 'MRR', value: fmt(contracts.filter(c => c.status === 'active').reduce((s, c) => s + (c.monthly_price || 0), 0)), color: TEAL },
        ].map((stat, i) => (
          <div key={i} className="admin-glass-card p-4 text-center">
            <div style={{ fontSize: 10, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>{stat.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: stat.color, marginTop: 4 }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: TEXT_MUTED }} />
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Rechercher un client..." className="admin-glass-input w-full" style={{ paddingLeft: 32 }} />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="admin-glass-input">
          <option value="all">Tous les statuts</option>
          {Object.entries(STATUS_COLORS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="admin-glass-table">
        <table className="w-full" style={{ fontSize: 13 }}>
          <thead>
            <tr>
              {['Client', 'Setup', 'Mensuel', 'Début', 'Statut', 'PDF', 'Actions'].map(h => (
                <th key={h} className="text-left px-5 py-3" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.2, color: TEXT_MUTED, fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredContracts.map(c => (
              <tr key={c.id} className="cursor-pointer" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(42,157,143,0.04)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <td className="px-5 py-3 font-medium" style={{ color: TEXT_PRIMARY }} onClick={() => setDetail(c)}>
                  {clientMap[c.client_id]?.business_name || '—'}
                </td>
                <td className="px-5 py-3" style={{ color: TEXT_SECONDARY }}>{fmt(c.setup_price || 0)}</td>
                <td className="px-5 py-3" style={{ color: TEAL, fontWeight: 600 }}>{fmt(c.monthly_price || 0)}</td>
                <td className="px-5 py-3" style={{ color: TEXT_MUTED, fontSize: 12 }}>{c.start_date || '—'}</td>
                <td className="px-5 py-3">
                  <span className="admin-status-badge" style={{ background: `${STATUS_COLORS[c.status]?.color || '#999'}20`, color: STATUS_COLORS[c.status]?.color || '#999' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: STATUS_COLORS[c.status]?.color, boxShadow: `0 0 6px ${STATUS_COLORS[c.status]?.color}55`, display: 'inline-block' }} />
                    {STATUS_COLORS[c.status]?.label || c.status}
                  </span>
                </td>
                <td className="px-5 py-3">
                  {c.document_url ? (
                    <a href={c.document_url} target="_blank" rel="noopener noreferrer" style={{ color: TEAL, fontSize: 11, textDecoration: 'underline' }}>Voir</a>
                  ) : (
                    <span style={{ color: TEXT_MUTED, fontSize: 11 }}>—</span>
                  )}
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-1">
                    <button onClick={(e) => { e.stopPropagation(); generatePDF(c); }} disabled={generatingPdf === c.id || !c.content}
                      className="p-1.5 rounded-lg hover:bg-white/10 transition" title="Générer PDF">
                      <FileDown size={14} color={generatingPdf === c.id ? TEXT_MUTED : TEXT_SECONDARY} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setShowSendModal(c); }}
                      disabled={!c.document_url || sendingEmail === c.id}
                      className="p-1.5 rounded-lg hover:bg-white/10 transition" title="Envoyer par email">
                      <Send size={14} color={!c.document_url ? TEXT_MUTED : TEAL} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setDetail(c); }}
                      className="p-1.5 rounded-lg hover:bg-white/10 transition" title="Détails">
                      <Eye size={14} color={TEXT_SECONDARY} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredContracts.length === 0 && (
              <tr><td colSpan={7} className="px-5 py-8 text-center" style={{ color: TEXT_MUTED }}>Aucun contrat trouvé</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Contract Form Modal */}
      {showForm && (
        <ContractFormModal
          onClose={() => setShowForm(false)}
          onCreated={() => { setShowForm(false); fetchData(); }}
          editContract={editContract}
        />
      )}

      {/* Detail Modal */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto admin-glass-modal p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: TEXT_PRIMARY }}>Détails du contrat</h2>
              <button onClick={() => setDetail(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: TEXT_SECONDARY }}><X size={20} /></button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              {[
                { label: 'Client', value: clientMap[detail.client_id]?.business_name || '—' },
                { label: 'Statut', value: STATUS_COLORS[detail.status]?.label || detail.status },
                { label: 'Prix setup', value: fmt(detail.setup_price || 0) },
                { label: 'Prix mensuel', value: fmt(detail.monthly_price || 0) },
                { label: 'Date début', value: detail.start_date || '—' },
                { label: 'Date fin', value: detail.end_date || 'Ongoing' },
                { label: 'Envoyé le', value: detail.sent_at ? new Date(detail.sent_at).toLocaleDateString('fr-FR') : '—' },
              ].map((f, i) => (
                <div key={i}>
                  <p style={{ fontSize: 10, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: 1 }}>{f.label}</p>
                  <p style={{ fontSize: 14, color: TEXT_PRIMARY, fontWeight: 500 }}>{f.value}</p>
                </div>
              ))}
            </div>

            {detail.special_conditions && (
              <div className="mb-4">
                <p style={{ fontSize: 10, color: TEXT_MUTED, textTransform: 'uppercase' }}>Conditions spéciales</p>
                <p style={{ fontSize: 13, color: TEXT_PRIMARY, marginTop: 4 }}>{detail.special_conditions}</p>
              </div>
            )}

            {/* Status change buttons */}
            <div className="mb-4">
              <p style={{ fontSize: 10, color: TEXT_MUTED, textTransform: 'uppercase', marginBottom: 8 }}>Changer le statut</p>
              <div className="flex gap-2 flex-wrap">
                {Object.entries(STATUS_COLORS).filter(([k]) => k !== detail.status).map(([k, v]) => (
                  <button key={k} onClick={() => updateStatus(detail.id, k)} className="admin-glass-btn-secondary" style={{ fontSize: 11, padding: '4px 12px', color: v.color }}>
                    {v.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 flex-wrap mt-4">
              <button onClick={() => { setEditContract(detail); setDetail(null); setShowForm(true); }} className="admin-glass-btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                Modifier
              </button>
              <button onClick={() => generatePDF(detail)} disabled={generatingPdf === detail.id || !detail.content} className="admin-glass-btn" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                <FileDown size={14} /> {generatingPdf === detail.id ? 'Génération...' : 'Générer PDF'}
              </button>
              {detail.document_url && (
                <>
                  <a href={detail.document_url} target="_blank" rel="noopener noreferrer" className="admin-glass-btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, textDecoration: 'none' }}>
                    Voir PDF
                  </a>
                  <button onClick={() => { setShowSendModal(detail); setDetail(null); }} className="admin-glass-btn" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, background: 'linear-gradient(135deg, #2A9D8F, #264653)', color: 'white' }}>
                    <Send size={14} /> Envoyer au client
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Send Email Modal */}
      {showSendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-lg admin-glass-modal p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: TEXT_PRIMARY }}>Envoyer le contrat</h2>
              <button onClick={() => { setShowSendModal(null); setCustomMessage(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: TEXT_SECONDARY }}><X size={20} /></button>
            </div>
            
            <div className="mb-4">
              <p style={{ fontSize: 12, color: TEXT_SECONDARY, marginBottom: 4 }}>
                <strong>Destinataire :</strong> {clientMap[showSendModal.client_id]?.email || 'Pas d\'email'}
              </p>
              <p style={{ fontSize: 12, color: TEXT_SECONDARY }}>
                <strong>Business :</strong> {clientMap[showSendModal.client_id]?.business_name}
              </p>
            </div>

            <div className="mb-4">
              <label style={{ fontSize: 11, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 6, fontWeight: 600 }}>
                Message d'accompagnement (optionnel)
              </label>
              <textarea
                value={customMessage}
                onChange={e => setCustomMessage(e.target.value)}
                placeholder="Bonjour, veuillez trouver ci-joint votre contrat..."
                className="admin-glass-input w-full"
                rows={4}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => sendContractEmail(showSendModal)}
                disabled={sendingEmail === showSendModal.id || !clientMap[showSendModal.client_id]?.email}
                className="admin-glass-btn"
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'linear-gradient(135deg, #2A9D8F, #264653)', color: 'white' }}
              >
                <Send size={14} /> {sendingEmail === showSendModal.id ? 'Envoi...' : 'Envoyer'}
              </button>
              <button onClick={() => { setShowSendModal(null); setCustomMessage(''); }} className="admin-glass-btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <X size={14} /> Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminContracts;
