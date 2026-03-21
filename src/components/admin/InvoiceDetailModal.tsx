import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { X, Download, Copy, CreditCard, FileText } from 'lucide-react';
import InvoicePDF from '@/components/admin/InvoicePDF';
import { pdf } from '@react-pdf/renderer';

type Props = {
  invoice: any;
  onClose: () => void;
  onUpdated: () => void;
};

type InvoiceItem = { id: string; description: string; quantity: number; unit_price: number; total: number; position: number };
type Payment = { id: string; amount: number; payment_method: string | null; payment_date: string; notes: string | null };

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  draft: { label: 'Brouillon', color: '#9ca3af' },
  sent: { label: 'Envoyée', color: '#3b82f6' },
  viewed: { label: 'Vue', color: '#8b5cf6' },
  paid: { label: 'Payée', color: '#10b981' },
  partially_paid: { label: 'Partiel', color: '#f59e0b' },
  overdue: { label: 'En retard', color: '#ef4444' },
  cancelled: { label: 'Annulée', color: '#6b7280' },
  refunded: { label: 'Remboursée', color: '#f97316' },
};

const InvoiceDetailModal = ({ invoice, onClose, onUpdated }: Props) => {
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [showPayment, setShowPayment] = useState(false);
  const [payAmount, setPayAmount] = useState(Number(invoice.total) - Number(invoice.amount_paid));
  const [payMethod, setPayMethod] = useState('bank_transfer');
  const [payNotes, setPayNotes] = useState('');

  useEffect(() => {
    supabase.from('invoice_items').select('*').eq('invoice_id', invoice.id).order('position').then(({ data }) => setItems(data || []));
    supabase.from('payment_history').select('*').eq('invoice_id', invoice.id).order('payment_date', { ascending: false }).then(({ data }) => setPayments(data || []));
  }, [invoice.id]);

  const fmt = (n: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);
  const sc = STATUS_CONFIG[invoice.status] || { label: invoice.status, color: '#999' };

  const handleRecordPayment = async () => {
    if (payAmount <= 0) return;
    const { error } = await supabase.from('payment_history').insert({
      invoice_id: invoice.id,
      amount: payAmount,
      payment_method: payMethod,
      notes: payNotes || null,
    });
    if (error) { toast.error('Erreur enregistrement paiement'); return; }

    const newAmountPaid = Number(invoice.amount_paid) + payAmount;
    const newStatus = newAmountPaid >= Number(invoice.total) ? 'paid' : 'partially_paid';
    await supabase.from('invoices').update({
      amount_paid: newAmountPaid,
      status: newStatus as any,
      paid_at: newStatus === 'paid' ? new Date().toISOString() : null,
    }).eq('id', invoice.id);

    toast.success('Paiement enregistré');
    onUpdated();
  };

  const handleDownloadPDF = async () => {
    try {
      const blob = await pdf(
        <InvoicePDF invoice={invoice} items={items} />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${invoice.invoice_number}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('PDF téléchargé');
    } catch (err) {
      toast.error('Erreur génération PDF');
      console.error(err);
    }
  };

  const handleStatusChange = async (status: string) => {
    const updates: any = { status };
    if (status === 'paid') updates.paid_at = new Date().toISOString();
    await supabase.from('invoices').update(updates).eq('id', invoice.id);
    toast.success('Statut mis à jour');
    onUpdated();
  };

  const remaining = Number(invoice.total) - Number(invoice.amount_paid);
  const progressPct = Number(invoice.total) > 0 ? Math.min(100, (Number(invoice.amount_paid) / Number(invoice.total)) * 100) : 0;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 120, background: 'rgba(0,0,0,0.5)',
      display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '20px', overflowY: 'auto',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: 800, background: 'var(--warm)', borderRadius: 'var(--r-lg)',
        border: '1px solid var(--glass-border)', boxShadow: '0 24px 80px rgba(0,0,0,0.15)',
        padding: 28, marginTop: 20, marginBottom: 20,
      }}>
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 style={{ fontFamily: 'var(--font-m)', fontSize: 20, color: 'var(--charcoal)', marginBottom: 4 }}>
              {invoice.invoice_number}
            </h2>
            <div className="flex items-center gap-3 flex-wrap">
              <select value={invoice.status} onChange={e => handleStatusChange(e.target.value)} style={{
                padding: '4px 12px', borderRadius: 'var(--pill)', border: 'none',
                background: `${sc.color}18`, color: sc.color, fontWeight: 600, fontSize: 12,
                fontFamily: 'var(--font-m)', cursor: 'pointer',
              }}>
                {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
              <span style={{ fontSize: 13, color: 'var(--text-mid)', fontFamily: 'var(--font-b)' }}>
                {invoice.client_name}
              </span>
              {invoice.project_title && (
                <span style={{ fontSize: 13, color: 'var(--text-light)', fontFamily: 'var(--font-b)' }}>
                  • {invoice.project_title}
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button onClick={handleDownloadPDF} className="flex items-center gap-2" style={btnOutline}>
            <Download size={14} /> Télécharger PDF
          </button>
          <button disabled className="flex items-center gap-2" style={{ ...btnOutline, opacity: 0.5, cursor: 'not-allowed' }} title="Bientôt disponible — en attente de configuration email">
            📧 Envoyer par email
          </button>
          {['sent', 'viewed', 'partially_paid', 'overdue'].includes(invoice.status) && (
            <button onClick={() => setShowPayment(true)} className="flex items-center gap-2" style={{
              ...btnOutline, background: 'var(--teal)', color: '#fff', borderColor: 'var(--teal)',
            }}>
              <CreditCard size={14} /> Marquer comme payée
            </button>
          )}
          <button disabled className="flex items-center gap-2" style={{ ...btnOutline, opacity: 0.5, cursor: 'not-allowed' }} title="Bientôt disponible">
            🔔 Envoyer un rappel
          </button>
        </div>

        {/* Invoice preview */}
        <div style={{
          background: '#fff', borderRadius: 16, padding: 32, boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
          border: '1px solid #e5e5e5', marginBottom: 24,
        }}>
          <div className="flex justify-between items-start mb-8">
            <div>
              <h3 style={{ fontFamily: 'var(--font-h)', fontSize: 22, color: 'var(--teal)' }}>CreationNation</h3>
              <p style={{ fontSize: 12, color: '#888', fontFamily: 'var(--font-b)' }}>Agence web créative</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontFamily: 'var(--font-m)', fontSize: 16, color: '#333' }}>FACTURE</p>
              <p style={{ fontFamily: 'var(--font-m)', fontSize: 13, color: '#666' }}>{invoice.invoice_number}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-8" style={{ fontSize: 13, fontFamily: 'var(--font-b)', color: '#555' }}>
            <div>
              <p style={{ fontWeight: 600, color: '#333', marginBottom: 4 }}>Facturé à :</p>
              <p>{invoice.client_name}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p>Émise le : {new Date(invoice.issue_date).toLocaleDateString('fr-FR')}</p>
              <p>Échéance : {new Date(invoice.due_date).toLocaleDateString('fr-FR')}</p>
              {invoice.payment_method && <p>Paiement : {invoice.payment_method}</p>}
            </div>
          </div>

          {/* Items table */}
          <table className="w-full mb-6" style={{ fontSize: 13, fontFamily: 'var(--font-b)' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e5e5e5' }}>
                <th className="text-left py-2" style={{ color: '#888', fontWeight: 600 }}>Description</th>
                <th className="text-right py-2" style={{ color: '#888', fontWeight: 600, width: 60 }}>Qté</th>
                <th className="text-right py-2" style={{ color: '#888', fontWeight: 600, width: 100 }}>Prix unit.</th>
                <th className="text-right py-2" style={{ color: '#888', fontWeight: 600, width: 100 }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map(it => (
                <tr key={it.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td className="py-2" style={{ color: '#333' }}>{it.description}</td>
                  <td className="py-2 text-right" style={{ color: '#666' }}>{it.quantity}</td>
                  <td className="py-2 text-right" style={{ color: '#666' }}>{fmt(Number(it.unit_price))}</td>
                  <td className="py-2 text-right" style={{ color: '#333', fontWeight: 600 }}>{fmt(Number(it.total))}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex flex-col items-end gap-1" style={{ fontSize: 14, fontFamily: 'var(--font-b)' }}>
            <div className="flex gap-8"><span style={{ color: '#888' }}>Sous-total</span><span>{fmt(Number(invoice.subtotal))}</span></div>
            {Number(invoice.tax_rate) > 0 && (
              <div className="flex gap-8"><span style={{ color: '#888' }}>TVA ({invoice.tax_rate}%)</span><span>{fmt(Number(invoice.tax_amount))}</span></div>
            )}
            <div className="flex gap-8 mt-2" style={{ fontSize: 18, fontWeight: 700, color: '#333' }}>
              <span>Total TTC</span><span>{fmt(Number(invoice.total))}</span>
            </div>
          </div>

          {invoice.notes && (
            <div style={{ marginTop: 24, padding: 16, background: '#f9f9f9', borderRadius: 8, fontSize: 13, color: '#666', fontFamily: 'var(--font-b)' }}>
              {invoice.notes}
            </div>
          )}

          <div style={{ marginTop: 24, textAlign: 'center', fontSize: 11, color: '#bbb', fontFamily: 'var(--font-b)' }}>
            Merci pour votre confiance — CreationNation
          </div>
        </div>

        {/* Stripe placeholder */}
        {!invoice.stripe_payment_url ? (
          <div style={{
            padding: 16, background: 'rgba(0,0,0,0.03)', borderRadius: 12, marginBottom: 24,
            fontSize: 13, color: 'var(--text-light)', fontFamily: 'var(--font-b)', textAlign: 'center',
          }}>
            💳 Stripe non configuré — le paiement en ligne sera disponible après configuration
          </div>
        ) : (
          <div className="flex items-center gap-3 mb-6" style={{ padding: 16, background: 'rgba(16,185,129,0.06)', borderRadius: 12 }}>
            <span style={{ fontSize: 13, fontFamily: 'var(--font-b)', color: 'var(--teal)' }}>Lien de paiement disponible</span>
            <button onClick={() => { navigator.clipboard.writeText(invoice.stripe_payment_url!); toast.success('Lien copié'); }}
              className="flex items-center gap-1" style={{ ...btnOutline, padding: '4px 12px', fontSize: 12 }}>
              <Copy size={12} /> Copier
            </button>
          </div>
        )}

        {/* Payment history */}
        <h3 style={{ fontFamily: 'var(--font-b)', fontSize: 15, fontWeight: 600, color: 'var(--charcoal)', marginBottom: 12 }}>
          Historique des paiements
        </h3>
        <div style={{ marginBottom: 12 }}>
          <div style={{ height: 8, background: 'rgba(0,0,0,0.06)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progressPct}%`, background: 'var(--teal)', borderRadius: 4, transition: 'width 0.3s' }} />
          </div>
          <div className="flex justify-between mt-1" style={{ fontSize: 12, fontFamily: 'var(--font-b)', color: 'var(--text-mid)' }}>
            <span>Payé : {fmt(Number(invoice.amount_paid))}</span>
            <span>Reste : {fmt(remaining)}</span>
          </div>
        </div>
        {payments.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--text-light)', fontFamily: 'var(--font-b)' }}>Aucun paiement enregistré</p>
        ) : (
          <div className="flex flex-col gap-2 mb-6">
            {payments.map(p => (
              <div key={p.id} className="flex items-center justify-between" style={{
                padding: '10px 14px', background: 'var(--glass-bg)', borderRadius: 10,
                border: '1px solid var(--glass-border)', fontSize: 13, fontFamily: 'var(--font-b)',
              }}>
                <span style={{ color: 'var(--text-mid)' }}>{new Date(p.payment_date).toLocaleDateString('fr-FR')}</span>
                <span style={{ fontWeight: 600, color: 'var(--teal)' }}>{fmt(Number(p.amount))}</span>
                <span style={{ color: 'var(--text-light)', fontSize: 12 }}>{p.payment_method || '—'}</span>
              </div>
            ))}
          </div>
        )}

        {/* Payment modal */}
        {showPayment && (
          <div style={{
            padding: 20, background: 'var(--glass-bg-strong)', borderRadius: 16,
            border: '1px solid var(--glass-border)', marginBottom: 16,
          }}>
            <h4 style={{ fontFamily: 'var(--font-b)', fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Enregistrer un paiement</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-light)', fontFamily: 'var(--font-b)' }}>Montant</label>
                <input type="number" value={payAmount} onChange={e => setPayAmount(Number(e.target.value))} style={inputSm} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-light)', fontFamily: 'var(--font-b)' }}>Méthode</label>
                <select value={payMethod} onChange={e => setPayMethod(e.target.value)} style={inputSm}>
                  <option value="bank_transfer">Virement</option>
                  <option value="stripe">Stripe</option>
                  <option value="cash">Espèces</option>
                  <option value="other">Autre</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-light)', fontFamily: 'var(--font-b)' }}>Notes</label>
                <input value={payNotes} onChange={e => setPayNotes(e.target.value)} placeholder="Optionnel" style={inputSm} />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowPayment(false)} style={{ ...btnOutline, padding: '8px 16px', fontSize: 12 }}>Annuler</button>
              <button onClick={handleRecordPayment} style={{
                padding: '8px 16px', background: 'var(--teal)', color: '#fff', border: 'none',
                borderRadius: 10, fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-b)', cursor: 'pointer',
              }}>Enregistrer</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const btnOutline: React.CSSProperties = {
  padding: '8px 16px', background: 'transparent', border: '1px solid var(--glass-border)',
  borderRadius: 10, fontFamily: 'var(--font-b)', fontSize: 13, fontWeight: 600,
  color: 'var(--charcoal)', cursor: 'pointer',
};
const inputSm: React.CSSProperties = {
  width: '100%', padding: '8px 10px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
  borderRadius: 8, fontFamily: 'var(--font-b)', fontSize: 13, color: 'var(--text)', outline: 'none',
};

export default InvoiceDetailModal;
