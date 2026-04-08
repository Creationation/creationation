import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { X, Plus, Trash2 } from 'lucide-react';

type Client = { id: string; business_name: string };
type InvoiceItem = { description: string; quantity: number; unit_price: number; total: number };
type Template = { id: string; name: string; default_items: any; default_notes: string | null; default_tax_rate: number | null; payment_terms_days: number | null };

type Props = {
  invoice: any | null;
  clients: Client[];
  onClose: () => void;
  onSaved: () => void;
  prefillClientId?: string;
  prefillProjectId?: string;
};

const InvoiceFormModal = ({ invoice, clients, onClose, onSaved, prefillClientId, prefillProjectId }: Props) => {
  const [clientId, setClientId] = useState(invoice?.client_id || prefillClientId || '');
  const [projectId, setProjectId] = useState(invoice?.project_id || prefillProjectId || '');
  const [projects, setProjects] = useState<{ id: string; title: string }[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [issueDate, setIssueDate] = useState(invoice?.issue_date || new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(invoice?.due_date || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState(invoice?.payment_method || '');
  const [taxRate, setTaxRate] = useState(invoice?.tax_rate || 0);
  const [notes, setNotes] = useState(invoice?.notes || '');
  const [internalNotes, setInternalNotes] = useState(invoice?.internal_notes || '');
  const [items, setItems] = useState<InvoiceItem[]>([{ description: '', quantity: 1, unit_price: 0, total: 0 }]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from('invoice_templates').select('*').then(({ data }) => setTemplates(data || []));
  }, []);

  useEffect(() => {
    if (clientId) {
      supabase.from('projects').select('id, title').eq('client_id', clientId).then(({ data }) => setProjects(data || []));
    } else {
      setProjects([]);
    }
  }, [clientId]);

  useEffect(() => {
    if (invoice) {
      supabase.from('invoice_items').select('*').eq('invoice_id', invoice.id).order('position')
        .then(({ data }) => {
          if (data && data.length > 0) setItems(data.map(d => ({ description: d.description, quantity: Number(d.quantity), unit_price: Number(d.unit_price), total: Number(d.total) })));
        });
    }
  }, [invoice]);

  const applyTemplate = (tpl: Template) => {
    const defaultItems = tpl.default_items as InvoiceItem[] | null;
    if (defaultItems) setItems(defaultItems.map(i => ({ ...i, total: i.quantity * i.unit_price })));
    if (tpl.default_notes) setNotes(tpl.default_notes);
    if (tpl.default_tax_rate != null) setTaxRate(Number(tpl.default_tax_rate));
    if (tpl.payment_terms_days) {
      setDueDate(new Date(Date.now() + tpl.payment_terms_days * 86400000).toISOString().split('T')[0]);
    }
  };

  const updateItem = (idx: number, field: keyof InvoiceItem, value: any) => {
    setItems(prev => prev.map((it, i) => {
      if (i !== idx) return it;
      const updated = { ...it, [field]: value };
      if (field === 'quantity' || field === 'unit_price') {
        updated.total = Number(updated.quantity) * Number(updated.unit_price);
      }
      return updated;
    }));
  };

  const subtotal = items.reduce((s, i) => s + i.total, 0);
  const taxAmount = Math.round(subtotal * taxRate) / 100;
  const total = subtotal + taxAmount;
  const fmt = (n: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);

  const handleSave = async (asDraft: boolean) => {
    if (!clientId) { toast.error('Sélectionnez un client'); return; }
    if (items.length === 0 || items.every(i => !i.description)) { toast.error('Ajoutez au moins une ligne'); return; }
    setSaving(true);

    const invoiceData: any = {
      client_id: clientId,
      project_id: projectId || null,
      issue_date: issueDate,
      due_date: dueDate,
      payment_method: paymentMethod || null,
      tax_rate: taxRate,
      subtotal,
      tax_amount: taxAmount,
      total,
      notes: notes || null,
      internal_notes: internalNotes || null,
      status: asDraft ? 'draft' : 'sent',
    };

    let invoiceId: string;
    if (invoice) {
      const { error } = await supabase.from('invoices').update(invoiceData).eq('id', invoice.id);
      if (error) { toast.error('Erreur sauvegarde'); setSaving(false); return; }
      invoiceId = invoice.id;
      await supabase.from('invoice_items').delete().eq('invoice_id', invoiceId);
    } else {
      invoiceData.invoice_number = '';
      const { data, error } = await supabase.from('invoices').insert(invoiceData).select().single();
      if (error) { toast.error('Erreur création'); setSaving(false); return; }
      invoiceId = data.id;
    }

    const itemRows = items.filter(i => i.description).map((it, idx) => ({
      invoice_id: invoiceId,
      description: it.description,
      quantity: it.quantity,
      unit_price: it.unit_price,
      total: it.total,
      position: idx,
    }));
    if (itemRows.length > 0) {
      await supabase.from('invoice_items').insert(itemRows);
    }

    toast.success(invoice ? 'Facture mise à jour' : 'Facture créée');
    setSaving(false);
    onSaved();
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 12, fontFamily: "'Outfit', sans-serif", fontSize: 14, color: '#F2EDE4', outline: 'none',
  };
  const labelStyle: React.CSSProperties = {
    fontFamily: "'Outfit', sans-serif", fontSize: 12, fontWeight: 600, color: 'rgba(242,237,228,0.55)', marginBottom: 4, display: 'block',
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 120, background: 'rgba(0,0,0,0.5)',
      display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '20px', overflowY: 'auto',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: 720, background: 'var(--warm)', borderRadius: '20px',
        border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 24px 80px rgba(0,0,0,0.15)',
        padding: 28, marginTop: 20, marginBottom: 20,
      }}>
        <div className="flex items-center justify-between mb-6">
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: '#F2EDE4' }}>
            {invoice ? 'Modifier la facture' : 'Nouvelle facture'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(242,237,228,0.28)' }}><X size={20} /></button>
        </div>

        {/* Section 1 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div>
            <label style={labelStyle}>Client *</label>
            <select value={clientId} onChange={e => setClientId(e.target.value)} style={inputStyle}>
              <option value="">Sélectionner...</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.business_name}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Projet</label>
            <select value={projectId} onChange={e => setProjectId(e.target.value)} style={inputStyle}>
              <option value="">Aucun</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
          </div>
          {!invoice && (
            <div>
              <label style={labelStyle}>Template</label>
              <select onChange={e => { const t = templates.find(t => t.id === e.target.value); if (t) applyTemplate(t); }} style={inputStyle}>
                <option value="">Aucun</option>
                {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          )}
          <div>
            <label style={labelStyle}>Méthode de paiement</label>
            <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} style={inputStyle}>
              <option value="">Non spécifié</option>
              <option value="stripe">Stripe</option>
              <option value="bank_transfer">Virement bancaire</option>
              <option value="cash">Espèces</option>
              <option value="other">Autre</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Date d'émission</label>
            <input type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Date d'échéance</label>
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} style={inputStyle} />
          </div>
        </div>

        {/* Section 2 — Items */}
        <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 14, fontWeight: 600, color: '#F2EDE4', marginBottom: 12 }}>Lignes de facturation</h3>
        <div className="overflow-x-auto mb-2">
          <table className="w-full" style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.12)' }}>
                <th className="text-left py-2 px-2" style={{ color: 'rgba(242,237,228,0.28)', fontSize: 11, fontWeight: 600 }}>Description</th>
                <th className="text-left py-2 px-2" style={{ color: 'rgba(242,237,228,0.28)', fontSize: 11, fontWeight: 600, width: 80 }}>Qté</th>
                <th className="text-left py-2 px-2" style={{ color: 'rgba(242,237,228,0.28)', fontSize: 11, fontWeight: 600, width: 110 }}>Prix unit.</th>
                <th className="text-left py-2 px-2" style={{ color: 'rgba(242,237,228,0.28)', fontSize: 11, fontWeight: 600, width: 100 }}>Total</th>
                <th style={{ width: 36 }}></th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                  <td className="py-2 px-2">
                    <input value={it.description} onChange={e => updateItem(idx, 'description', e.target.value)}
                      placeholder="Description..." style={{ ...inputStyle, padding: '8px 10px' }} />
                  </td>
                  <td className="py-2 px-2">
                    <input type="number" min={0} value={it.quantity} onChange={e => updateItem(idx, 'quantity', Number(e.target.value))}
                      style={{ ...inputStyle, padding: '8px 10px' }} />
                  </td>
                  <td className="py-2 px-2">
                    <input type="number" min={0} step={0.01} value={it.unit_price} onChange={e => updateItem(idx, 'unit_price', Number(e.target.value))}
                      style={{ ...inputStyle, padding: '8px 10px' }} />
                  </td>
                  <td className="py-2 px-2" style={{ fontWeight: 600, color: '#F2EDE4' }}>{fmt(it.total)}</td>
                  <td className="py-2 px-2">
                    {items.length > 1 && (
                      <button onClick={() => setItems(prev => prev.filter((_, i) => i !== idx))}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#F07067' }}>
                        <Trash2 size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button onClick={() => setItems(prev => [...prev, { description: '', quantity: 1, unit_price: 0, total: 0 }])}
          className="flex items-center gap-1 mb-4" style={{
            padding: '6px 12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '100px', fontFamily: "'Outfit', sans-serif", fontSize: 12, color: '#2DD4B8',
            cursor: 'pointer', fontWeight: 600,
          }}>
          <Plus size={12} /> Ajouter une ligne
        </button>

        {/* Totals */}
        <div className="flex flex-col items-end gap-2 mb-6" style={{ fontFamily: "'Outfit', sans-serif", fontSize: 14 }}>
          <div className="flex gap-8">
            <span style={{ color: 'rgba(242,237,228,0.55)' }}>Sous-total</span>
            <span style={{ fontWeight: 600 }}>{fmt(subtotal)}</span>
          </div>
          <div className="flex items-center gap-4">
            <span style={{ color: 'rgba(242,237,228,0.55)' }}>TVA</span>
            <input type="number" min={0} max={100} step={0.5} value={taxRate} onChange={e => setTaxRate(Number(e.target.value))}
              style={{ width: 60, padding: '4px 8px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, textAlign: 'center', fontSize: 13, fontFamily: "'Outfit', sans-serif" }} />
            <span>%</span>
            <span style={{ fontWeight: 600 }}>{fmt(taxAmount)}</span>
          </div>
          <div className="flex gap-8" style={{ fontSize: 18, fontWeight: 700, color: '#F2EDE4' }}>
            <span>Total TTC</span>
            <span>{fmt(total)}</span>
          </div>
        </div>

        {/* Section 3 — Notes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div>
            <label style={labelStyle}>Notes (visibles sur la facture)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
          </div>
          <div>
            <label style={labelStyle}>Notes internes</label>
            <textarea value={internalNotes} onChange={e => setInternalNotes(e.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <button onClick={() => handleSave(true)} disabled={saving} style={{
            padding: '12px 24px', background: 'transparent', border: '2px solid rgba(255,255,255,0.12)',
            borderRadius: '12px', fontFamily: "'Outfit', sans-serif", fontSize: 14, fontWeight: 600,
            color: '#F2EDE4', cursor: 'pointer',
          }}>
            {saving ? '...' : 'Enregistrer comme brouillon'}
          </button>
          <button onClick={() => handleSave(false)} disabled={saving} style={{
            padding: '12px 24px', background: '#2DD4B8', color: '#fff', border: 'none',
            borderRadius: '12px', fontFamily: "'Outfit', sans-serif", fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}>
            {saving ? '...' : 'Enregistrer et envoyer'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceFormModal;
