import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ArrowLeft, Plus, RotateCcw } from 'lucide-react';

type Client = { id: string; business_name: string };
type Recurring = {
  id: string; client_id: string; project_id: string | null; template_id: string | null;
  frequency: string; amount: number; description: string; tax_rate: number;
  is_active: boolean; next_invoice_date: string; last_invoiced_at: string | null;
  created_at: string; client_name?: string;
};

const FREQ_LABELS: Record<string, string> = { weekly: 'Hebdo', monthly: 'Mensuel', quarterly: 'Trimestriel', yearly: 'Annuel' };

const RecurringInvoices = ({ clients, onBack, onInvoiceCreated }: { clients: Client[]; onBack: () => void; onInvoiceCreated: () => void }) => {
  const [items, setItems] = useState<Recurring[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const clientMap = Object.fromEntries(clients.map(c => [c.id, c.business_name]));

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('recurring_invoices').select('*').order('next_invoice_date');
    setItems((data || []).map(d => ({ ...d, client_name: clientMap[d.client_id] || 'Inconnu' })));
    setLoading(false);
  }, [clientMap]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const toggleActive = async (id: string, active: boolean) => {
    await supabase.from('recurring_invoices').update({ is_active: !active }).eq('id', id);
    toast.success(active ? 'Désactivé' : 'Activé');
    fetchData();
  };

  const generateInvoice = async (rec: Recurring) => {
    const dueDate = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];
    const taxAmount = Math.round(Number(rec.amount) * Number(rec.tax_rate)) / 100;
    const total = Number(rec.amount) + taxAmount;

    const { data: inv, error } = await supabase.from('invoices').insert({
      invoice_number: '',
      client_id: rec.client_id,
      project_id: rec.project_id,
      status: 'sent' as any,
      due_date: dueDate,
      subtotal: rec.amount,
      tax_rate: rec.tax_rate,
      tax_amount: taxAmount,
      total,
    }).select().single();

    if (error) { toast.error('Erreur création facture'); return; }

    await supabase.from('invoice_items').insert({
      invoice_id: inv.id,
      description: rec.description,
      quantity: 1,
      unit_price: rec.amount,
      total: rec.amount,
      position: 0,
    });

    // Calculate next date
    const next = new Date(rec.next_invoice_date);
    switch (rec.frequency) {
      case 'weekly': next.setDate(next.getDate() + 7); break;
      case 'monthly': next.setMonth(next.getMonth() + 1); break;
      case 'quarterly': next.setMonth(next.getMonth() + 3); break;
      case 'yearly': next.setFullYear(next.getFullYear() + 1); break;
    }

    await supabase.from('recurring_invoices').update({
      next_invoice_date: next.toISOString().split('T')[0],
      last_invoiced_at: new Date().toISOString(),
    }).eq('id', rec.id);

    toast.success('Facture générée');
    onInvoiceCreated();
    fetchData();
  };

  const fmt = (n: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);
  const isDue = (d: string) => new Date(d) <= new Date();

  return (
    <div className="p-4 md:p-6 max-w-[1200px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={onBack} style={{
            padding: '8px 12px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
            borderRadius: 10, cursor: 'pointer',
          }}><ArrowLeft size={16} /></button>
          <h2 style={{ fontFamily: 'var(--font-h)', fontSize: 22, color: 'var(--charcoal)' }}>Factures récurrentes</h2>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2" style={{
          padding: '10px 18px', background: 'var(--teal)', color: '#fff', border: 'none',
          borderRadius: 'var(--r)', fontFamily: 'var(--font-b)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
        }}>
          <Plus size={14} /> Nouveau récurrent
        </button>
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-light)', fontFamily: 'var(--font-b)' }}>Chargement...</p>
      ) : items.length === 0 ? (
        <p style={{ color: 'var(--text-light)', fontFamily: 'var(--font-b)', textAlign: 'center', padding: 40 }}>Aucune facture récurrente</p>
      ) : (
        <div style={{
          background: 'var(--glass-bg-strong)', backdropFilter: 'blur(20px)',
          borderRadius: 'var(--r)', border: '1px solid var(--glass-border)', overflow: 'hidden',
        }}>
          <div className="overflow-x-auto">
            <table className="w-full" style={{ fontFamily: 'var(--font-b)', fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                  {['Client', 'Description', 'Montant', 'Fréquence', 'Prochaine', 'Statut', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3" style={{
                      fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-light)', fontWeight: 600,
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map(rec => (
                  <tr key={rec.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                    <td className="px-4 py-3" style={{ color: 'var(--charcoal)' }}>{rec.client_name}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-mid)' }}>{rec.description}</td>
                    <td className="px-4 py-3 font-medium">{fmt(Number(rec.amount))}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-mid)' }}>{FREQ_LABELS[rec.frequency] || rec.frequency}</td>
                    <td className="px-4 py-3" style={{ color: isDue(rec.next_invoice_date) ? '#ef4444' : 'var(--text-mid)', fontWeight: isDue(rec.next_invoice_date) ? 600 : 400 }}>
                      {new Date(rec.next_invoice_date).toLocaleDateString('fr-FR')}
                      {isDue(rec.next_invoice_date) && <span style={{ marginLeft: 6, fontSize: 11, color: '#ef4444' }}>⚠️ À facturer</span>}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleActive(rec.id, rec.is_active)} style={{
                        padding: '4px 10px', borderRadius: 'var(--pill)', border: 'none', fontSize: 11, fontWeight: 600,
                        background: rec.is_active ? 'rgba(16,185,129,0.15)' : 'rgba(0,0,0,0.06)',
                        color: rec.is_active ? '#10b981' : '#999', cursor: 'pointer', fontFamily: 'var(--font-m)',
                      }}>
                        {rec.is_active ? 'Actif' : 'Inactif'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      {isDue(rec.next_invoice_date) && rec.is_active && (
                        <button onClick={() => generateInvoice(rec)} className="flex items-center gap-1" style={{
                          padding: '6px 12px', background: 'var(--teal)', color: '#fff', border: 'none',
                          borderRadius: 'var(--pill)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-b)',
                        }}>
                          <RotateCcw size={12} /> Générer
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showForm && <RecurringForm clients={clients} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); fetchData(); }} />}
    </div>
  );
};

const RecurringForm = ({ clients, onClose, onSaved }: { clients: Client[]; onClose: () => void; onSaved: () => void }) => {
  const [clientId, setClientId] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState(0);
  const [taxRate, setTaxRate] = useState(0);
  const [frequency, setFrequency] = useState('monthly');
  const [nextDate, setNextDate] = useState(new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!clientId || !description || amount <= 0) { toast.error('Remplissez tous les champs'); return; }
    setSaving(true);
    const { error } = await supabase.from('recurring_invoices').insert({
      client_id: clientId,
      frequency: frequency as any,
      amount,
      description,
      tax_rate: taxRate,
      next_invoice_date: nextDate,
    });
    if (error) { toast.error('Erreur création'); setSaving(false); return; }
    toast.success('Récurrent créé');
    setSaving(false);
    onSaved();
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
    borderRadius: 12, fontFamily: 'var(--font-b)', fontSize: 14, color: 'var(--text)', outline: 'none',
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 130, background: 'rgba(0,0,0,0.5)',
      display: 'flex', justifyContent: 'center', alignItems: 'center',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: 500, background: 'var(--warm)', borderRadius: 'var(--r-lg)',
        padding: 28, border: '1px solid var(--glass-border)',
      }}>
        <h3 style={{ fontFamily: 'var(--font-h)', fontSize: 20, marginBottom: 20 }}>Nouveau récurrent</h3>
        <div className="flex flex-col gap-4">
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-mid)', fontFamily: 'var(--font-b)' }}>Client *</label>
            <select value={clientId} onChange={e => setClientId(e.target.value)} style={inputStyle}>
              <option value="">Sélectionner...</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.business_name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-mid)', fontFamily: 'var(--font-b)' }}>Description *</label>
            <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Ex: Maintenance mensuelle" style={inputStyle} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-mid)', fontFamily: 'var(--font-b)' }}>Montant *</label>
              <input type="number" value={amount} onChange={e => setAmount(Number(e.target.value))} style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-mid)', fontFamily: 'var(--font-b)' }}>TVA %</label>
              <input type="number" value={taxRate} onChange={e => setTaxRate(Number(e.target.value))} style={inputStyle} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-mid)', fontFamily: 'var(--font-b)' }}>Fréquence</label>
              <select value={frequency} onChange={e => setFrequency(e.target.value)} style={inputStyle}>
                <option value="weekly">Hebdomadaire</option>
                <option value="monthly">Mensuel</option>
                <option value="quarterly">Trimestriel</option>
                <option value="yearly">Annuel</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-mid)', fontFamily: 'var(--font-b)' }}>Première facture</label>
              <input type="date" value={nextDate} onChange={e => setNextDate(e.target.value)} style={inputStyle} />
            </div>
          </div>
          <div className="flex gap-3 justify-end mt-2">
            <button onClick={onClose} style={{
              padding: '10px 20px', background: 'transparent', border: '1px solid var(--glass-border)',
              borderRadius: 'var(--r)', fontFamily: 'var(--font-b)', fontSize: 13, cursor: 'pointer',
            }}>Annuler</button>
            <button onClick={handleSave} disabled={saving} style={{
              padding: '10px 20px', background: 'var(--teal)', color: '#fff', border: 'none',
              borderRadius: 'var(--r)', fontFamily: 'var(--font-b)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}>{saving ? '...' : 'Créer'}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecurringInvoices;
