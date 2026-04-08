import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CreditCard, Send, X, ToggleLeft, ToggleRight } from 'lucide-react';

const TEAL = '#2A9D8F';

type Props = {
  client: { id: string; business_name: string; email: string | null; contact_name: string | null };
  onClose: () => void;
};

const SendPaymentLinkModal = ({ client, onClose }: Props) => {
  const [setupPrice, setSetupPrice] = useState(290);
  const [monthlyPrice, setMonthlyPrice] = useState(34);
  const [includeSetup, setIncludeSetup] = useState(true);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!client.email) { toast.error("Ce client n'a pas d'email"); return; }
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          clientId: client.id,
          clientEmail: client.email,
          clientName: client.contact_name || client.business_name,
          setupPrice,
          monthlyPrice,
          includeSetup,
          message,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success('Lien de paiement envoyé par email !');
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la création du lien');
    } finally {
      setSending(false);
    }
  };

  const total = (includeSetup ? setupPrice : 0) + monthlyPrice;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} onClick={onClose} />
      <div style={{
        position: 'relative', zIndex: 1, width: '100%', maxWidth: 520,
        background: 'rgba(255,255,255,0.10)', backdropFilter: 'blur(24px)',
        border: '1px solid rgba(255,255,255,0.18)', borderRadius: 20, padding: 32,
      }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(26,35,50,0.5)' }}>
          <X size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          <CreditCard size={22} color={TEAL} />
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1A2332', margin: 0 }}>Envoyer lien de paiement</h2>
        </div>

        {/* Client info */}
        <div style={{ background: 'rgba(42,157,143,0.08)', borderRadius: 12, padding: 14, marginBottom: 20 }}>
          <div style={{ fontWeight: 600, color: '#1A2332' }}>{client.business_name}</div>
          <div style={{ fontSize: 13, color: 'rgba(26,35,50,0.55)' }}>{client.email || 'Pas d\'email'}</div>
        </div>

        {/* Include setup toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <span style={{ fontSize: 14, fontWeight: 500, color: '#1A2332' }}>Inclure le setup</span>
          <button onClick={() => setIncludeSetup(!includeSetup)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            {includeSetup ? <ToggleRight size={28} color={TEAL} /> : <ToggleLeft size={28} color="rgba(26,35,50,0.3)" />}
          </button>
        </div>

        {/* Setup price */}
        {includeSetup && (
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 13, color: 'rgba(26,35,50,0.55)', display: 'block', marginBottom: 4 }}>Prix setup (€)</label>
            <input type="number" value={setupPrice} onChange={e => setSetupPrice(Number(e.target.value))}
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.18)', background: 'rgba(255,255,255,0.08)',
                color: '#1A2332', fontSize: 14, outline: 'none',
              }}
            />
          </div>
        )}

        {/* Monthly price */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 13, color: 'rgba(26,35,50,0.55)', display: 'block', marginBottom: 4 }}>Prix mensuel (€)</label>
          <input type="number" value={monthlyPrice} onChange={e => setMonthlyPrice(Number(e.target.value))}
            style={{
              width: '100%', padding: '10px 14px', borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.18)', background: 'rgba(255,255,255,0.08)',
              color: '#1A2332', fontSize: 14, outline: 'none',
            }}
          />
        </div>

        {/* Custom message */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 13, color: 'rgba(26,35,50,0.55)', display: 'block', marginBottom: 4 }}>Message personnalisé (optionnel)</label>
          <textarea value={message} onChange={e => setMessage(e.target.value)} rows={3} placeholder="Un message pour votre client..."
            style={{
              width: '100%', padding: '10px 14px', borderRadius: 10, resize: 'vertical',
              border: '1px solid rgba(255,255,255,0.18)', background: 'rgba(255,255,255,0.08)',
              color: '#1A2332', fontSize: 14, outline: 'none', fontFamily: 'inherit',
            }}
          />
        </div>

        {/* Total */}
        <div style={{
          background: 'rgba(42,157,143,0.12)', borderRadius: 12, padding: 14, marginBottom: 20,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ fontWeight: 600, color: '#1A2332' }}>Premier paiement</span>
          <span style={{ fontWeight: 700, fontSize: 20, color: TEAL }}>{total}€</span>
        </div>
        <div style={{ fontSize: 12, color: 'rgba(26,35,50,0.4)', marginBottom: 20, textAlign: 'center' }}>
          {includeSetup ? `${setupPrice}€ setup + ${monthlyPrice}€/mois` : `${monthlyPrice}€/mois`}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: '12px 0', borderRadius: 50, border: '1px solid rgba(255,255,255,0.18)',
            background: 'rgba(255,255,255,0.08)', color: 'rgba(26,35,50,0.6)', fontWeight: 600,
            cursor: 'pointer', fontSize: 14,
          }}>
            Annuler
          </button>
          <button onClick={handleSend} disabled={sending || !client.email} style={{
            flex: 1, padding: '12px 0', borderRadius: 50, border: 'none',
            background: TEAL, color: '#fff', fontWeight: 600, cursor: sending ? 'wait' : 'pointer',
            fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            opacity: sending || !client.email ? 0.5 : 1,
          }}>
            <Send size={15} /> {sending ? 'Envoi...' : 'Envoyer'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SendPaymentLinkModal;
