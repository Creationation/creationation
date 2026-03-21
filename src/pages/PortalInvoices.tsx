import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { FileText, Download, ExternalLink } from 'lucide-react';
import { pdf } from '@react-pdf/renderer';
import InvoicePDF from '@/components/admin/InvoicePDF';

const STATUS_LABELS: Record<string, string> = {
  draft: 'Brouillon', sent: 'Envoyée', viewed: 'Vue', paid: 'Payée',
  partially_paid: 'Partiel', overdue: 'En retard', cancelled: 'Annulée', refunded: 'Remboursée',
};
const STATUS_COLORS: Record<string, string> = {
  draft: '#9ca3af', sent: '#3b82f6', viewed: '#8b5cf6', paid: '#10b981',
  partially_paid: '#f59e0b', overdue: '#ef4444', cancelled: '#6b7280', refunded: '#f97316',
};

const PortalInvoices = () => {
  const { client } = useOutletContext<{ client: { id: string } }>();
  const [invoices, setInvoices] = useState<any[]>([]);

  useEffect(() => {
    if (!client?.id) return;
    supabase.from('invoices').select('*').eq('client_id', client.id)
      .not('status', 'eq', 'draft')
      .order('issue_date', { ascending: false })
      .then(({ data }) => setInvoices(data || []));
  }, [client]);

  const totalBilled = invoices.reduce((s, i) => s + Number(i.total), 0);
  const totalPaid = invoices.reduce((s, i) => s + Number(i.amount_paid), 0);
  const balance = totalBilled - totalPaid;

  const downloadPDF = async (inv: any) => {
    const { data: items } = await supabase.from('invoice_items').select('*').eq('invoice_id', inv.id).order('position');
    const blob = await pdf(<InvoicePDF invoice={inv} items={items || []} />).toBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${inv.invoice_number}.pdf`; a.click();
    URL.revokeObjectURL(url);
  };

  const f = (n: number) => n.toLocaleString('fr-FR', { minimumFractionDigits: 2 });

  return (
    <div className="space-y-6">
      <h1 style={{ fontFamily: 'var(--font-h)', fontSize: 24, color: 'var(--charcoal)' }}>Mes factures</h1>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div style={{ background: 'var(--glass-bg-strong)', borderRadius: 'var(--r)', border: '1px solid var(--glass-border)', padding: 16, backdropFilter: 'blur(16px)' }}>
          <div style={{ fontFamily: 'var(--font-b)', fontSize: 11, color: 'var(--text-light)' }}>Total facturé</div>
          <div style={{ fontFamily: 'var(--font-h)', fontSize: 22, color: 'var(--charcoal)' }}>{f(totalBilled)} €</div>
        </div>
        <div style={{ background: 'var(--glass-bg-strong)', borderRadius: 'var(--r)', border: '1px solid var(--glass-border)', padding: 16, backdropFilter: 'blur(16px)' }}>
          <div style={{ fontFamily: 'var(--font-b)', fontSize: 11, color: 'var(--text-light)' }}>Payé</div>
          <div style={{ fontFamily: 'var(--font-h)', fontSize: 22, color: 'var(--teal)' }}>{f(totalPaid)} €</div>
        </div>
        <div style={{ background: 'var(--glass-bg-strong)', borderRadius: 'var(--r)', border: '1px solid var(--glass-border)', padding: 16, backdropFilter: 'blur(16px)' }}>
          <div style={{ fontFamily: 'var(--font-b)', fontSize: 11, color: 'var(--text-light)' }}>Solde</div>
          <div style={{ fontFamily: 'var(--font-h)', fontSize: 22, color: balance > 0 ? '#f59e0b' : 'var(--teal)' }}>{f(balance)} €</div>
        </div>
      </div>

      {/* Invoices list */}
      {invoices.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, fontFamily: 'var(--font-b)', color: 'var(--text-light)' }}>
          Aucune facture pour le moment.
        </div>
      ) : (
        <div className="space-y-3">
          {invoices.map(inv => (
            <div key={inv.id} style={{
              background: 'var(--glass-bg-strong)', borderRadius: 'var(--r)', border: '1px solid var(--glass-border)',
              padding: 16, backdropFilter: 'blur(16px)',
            }}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span style={{ fontFamily: 'var(--font-m)', fontSize: 13, color: 'var(--charcoal)', fontWeight: 600 }}>{inv.invoice_number}</span>
                  <span style={{
                    marginLeft: 8, padding: '2px 8px', borderRadius: 'var(--pill)',
                    fontSize: 10, fontWeight: 600, fontFamily: 'var(--font-b)',
                    background: `${STATUS_COLORS[inv.status]}18`, color: STATUS_COLORS[inv.status],
                  }}>{STATUS_LABELS[inv.status]}</span>
                </div>
                <div style={{ fontFamily: 'var(--font-h)', fontSize: 18, color: 'var(--charcoal)' }}>{f(Number(inv.total))} €</div>
              </div>

              <div className="flex items-center gap-4 mb-3" style={{ fontFamily: 'var(--font-b)', fontSize: 12, color: 'var(--text-light)' }}>
                <span>Émise le {new Date(inv.issue_date).toLocaleDateString('fr-FR')}</span>
                <span style={{ color: inv.status === 'overdue' ? 'var(--coral)' : 'var(--text-light)' }}>
                  Échéance : {new Date(inv.due_date).toLocaleDateString('fr-FR')}
                </span>
              </div>

              <div className="flex gap-2">
                <button onClick={() => downloadPDF(inv)} style={{
                  display: 'flex', alignItems: 'center', gap: 4, padding: '6px 14px',
                  background: 'transparent', border: '1px solid var(--glass-border)', borderRadius: 'var(--pill)',
                  fontFamily: 'var(--font-b)', fontSize: 12, color: 'var(--text-mid)', cursor: 'pointer',
                }}>
                  <Download size={13} /> PDF
                </button>

                {inv.stripe_payment_url ? (
                  <a href={inv.stripe_payment_url} target="_blank" rel="noreferrer" style={{
                    display: 'flex', alignItems: 'center', gap: 4, padding: '6px 14px',
                    background: 'var(--teal)', color: '#fff', borderRadius: 'var(--pill)',
                    fontFamily: 'var(--font-b)', fontSize: 12, fontWeight: 600, textDecoration: 'none',
                  }}>
                    <ExternalLink size={13} /> Payer en ligne
                  </a>
                ) : ['sent', 'viewed', 'overdue', 'partially_paid'].includes(inv.status) && (
                  <div style={{ fontFamily: 'var(--font-b)', fontSize: 11, color: 'var(--text-light)', padding: '6px 14px' }}>
                    💳 Virement — Réf : {inv.invoice_number}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PortalInvoices;
