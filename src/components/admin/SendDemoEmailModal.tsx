import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { X, Send } from 'lucide-react';

const TEAL = '#2A9D8F';
const TEXT_PRIMARY = '#1A2332';
const TEXT_SECONDARY = 'rgba(26,35,50,0.55)';

type Props = {
  demoId: string;
  contactName: string;
  contactEmail: string;
  businessName: string;
  accessToken: string;
  expiryDays: number;
  onClose: () => void;
  onSent: () => void;
};

const SendDemoEmailModal = ({ demoId, contactName, contactEmail, businessName, accessToken, expiryDays, onClose, onSent }: Props) => {
  const link = `https://creationation.lovable.app/demo/${accessToken}`;
  const [to, setTo] = useState(contactEmail);
  const [subject, setSubject] = useState(`Ihre App-Demo – ${businessName}`);
  const [body, setBody] = useState(
    `Sehr geehrte/r ${contactName || 'Interessent/in'},\n\nwir haben eine App-Demo speziell für ${businessName} erstellt. Schauen Sie sich an, wie Ihre eigene App aussehen könnte:\n\n${link}\n\nDiese Demo ist ${expiryDays} Tage verfügbar.\n\nBei Interesse kontaktieren Sie uns gerne.\n\nMit freundlichen Grüßen,\nDiego Renard\nCreationation`
  );
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!to) { toast.error('Email requis'); return; }
    setSending(true);
    try {
      const { error } = await supabase.functions.invoke('send-demo-email', {
        body: { demoId, to, subject, body },
      });
      if (error) throw error;

      toast.success('Email envoyé !');
      onSent();
    } catch (err: any) {
      toast.error('Erreur envoi: ' + (err.message || 'Erreur'));
    }
    setSending(false);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: 10,
    border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.2)',
    fontSize: 14, color: TEXT_PRIMARY, outline: 'none',
  };

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-lg mx-4" style={{
        background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(24px) saturate(1.4)',
        borderRadius: 20, border: '1px solid rgba(255,255,255,0.30)', padding: 24,
      }}>
        <div className="flex items-center justify-between mb-4">
          <h3 style={{ fontSize: 18, fontWeight: 700, color: TEXT_PRIMARY }}>Envoyer la démo</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: TEXT_SECONDARY }}><X size={20} /></button>
        </div>

        <div className="space-y-3">
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: TEXT_SECONDARY, marginBottom: 4, display: 'block' }}>Destinataire</label>
            <input value={to} onChange={e => setTo(e.target.value)} style={inputStyle} type="email" />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: TEXT_SECONDARY, marginBottom: 4, display: 'block' }}>Objet</label>
            <input value={subject} onChange={e => setSubject(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: TEXT_SECONDARY, marginBottom: 4, display: 'block' }}>Message</label>
            <textarea value={body} onChange={e => setBody(e.target.value)} style={{ ...inputStyle, minHeight: 180 }} />
          </div>
          <button onClick={handleSend} disabled={sending} style={{
            width: '100%', padding: '12px', borderRadius: 12, border: 'none', cursor: 'pointer',
            background: `linear-gradient(135deg, ${TEAL}, #3EDDC7)`, color: '#fff',
            fontWeight: 600, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            opacity: sending ? 0.7 : 1,
          }}>
            <Send size={16} /> {sending ? 'Envoi...' : 'Envoyer'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SendDemoEmailModal;
