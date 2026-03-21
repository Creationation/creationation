import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { X, Send } from 'lucide-react';

type Lead = {
  id: string;
  name: string;
  email: string;
};

interface Props {
  lead: Lead;
  onClose: () => void;
  onSent: () => void;
}

const templates = [
  {
    label: 'Premier contact',
    subject: 'CreationNation — Suite à votre demande',
    body: `Bonjour {name},

Merci pour votre intérêt pour nos services ! Nous avons bien reçu votre demande et nous serions ravis d'en discuter avec vous.

Seriez-vous disponible cette semaine pour un appel de 15 minutes ? Nous pourrons discuter de votre projet en détail et voir comment nous pouvons vous aider.

À très vite,
L'équipe CreationNation`,
  },
  {
    label: 'Suivi',
    subject: 'CreationNation — Où en êtes-vous ?',
    body: `Bonjour {name},

Je me permets de revenir vers vous suite à notre précédent échange. Avez-vous eu le temps de réfléchir à votre projet ?

N'hésitez pas si vous avez des questions, nous sommes là pour vous accompagner.

Cordialement,
L'équipe CreationNation`,
  },
  {
    label: 'Proposition commerciale',
    subject: 'Creationation — Votre proposition personnalisée',
    body: `Bonjour {name},

Suite à notre discussion, veuillez trouver ci-dessous notre proposition adaptée à vos besoins.

[Détails de la proposition]

N'hésitez pas à revenir vers nous pour toute question.

Cordialement,
L'équipe Creationation`,
  },
];

const SendEmailModal = ({ lead, onClose, onSent }: Props) => {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);

  const applyTemplate = (tpl: typeof templates[0]) => {
    setSubject(tpl.subject);
    setBody(tpl.body.replace(/\{name\}/g, lead.name.split(' ')[0]));
  };

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) {
      toast.error('Sujet et contenu requis');
      return;
    }
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // Save email record
      const { error } = await supabase.from('lead_emails').insert({
        lead_id: lead.id,
        user_id: user.id,
        subject: subject.trim(),
        body: body.trim(),
      });
      if (error) throw error;

      // Call edge function to send email
      const { error: fnError } = await supabase.functions.invoke('send-prospect-email', {
        body: {
          to: lead.email,
          toName: lead.name,
          subject: subject.trim(),
          body: body.trim(),
        },
      });

      if (fnError) {
        console.error('Edge function error:', fnError);
        toast.warning('Email enregistré mais l\'envoi automatique n\'est pas encore configuré. Envoyez-le manuellement.');
      } else {
        toast.success(`Email envoyé à ${lead.name}`);
      }

      onSent();
    } catch (err: any) {
      toast.error(err.message || 'Erreur envoi email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto"
        style={{
          background: 'var(--cream)',
          borderRadius: 'var(--r-lg)',
          border: '1px solid var(--glass-border)',
          padding: '32px',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 style={{ fontFamily: 'var(--font-h)', fontSize: 22, color: 'var(--charcoal)' }}>
            Email à {lead.name}
          </h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-light)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Templates */}
        <div className="flex flex-wrap gap-2 mb-4">
          {templates.map((tpl, i) => (
            <button
              key={i}
              onClick={() => applyTemplate(tpl)}
              style={{
                padding: '6px 14px',
                background: 'var(--glass-bg)',
                border: '1px solid var(--glass-border)',
                borderRadius: 'var(--pill)',
                fontFamily: 'var(--font-b)',
                fontSize: 12,
                color: 'var(--text-mid)',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'var(--teal)';
                e.currentTarget.style.color = '#fff';
                e.currentTarget.style.borderColor = 'var(--teal)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'var(--glass-bg)';
                e.currentTarget.style.color = 'var(--text-mid)';
                e.currentTarget.style.borderColor = 'var(--glass-border)';
              }}
            >
              {tpl.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label style={{
              fontFamily: 'var(--font-b)',
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--text-light)',
              letterSpacing: 1,
              textTransform: 'uppercase',
              marginBottom: 6,
              display: 'block',
            }}>
              Destinataire
            </label>
            <div style={{
              padding: '10px 14px',
              background: 'var(--glass-bg)',
              borderRadius: 'var(--r)',
              border: '1px solid var(--glass-border)',
              fontFamily: 'var(--font-b)',
              fontSize: 14,
              color: 'var(--text-mid)',
            }}>
              {lead.email}
            </div>
          </div>

          <div>
            <label style={{
              fontFamily: 'var(--font-b)',
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--text-light)',
              letterSpacing: 1,
              textTransform: 'uppercase',
              marginBottom: 6,
              display: 'block',
            }}>
              Sujet
            </label>
            <input
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="Objet de l'email..."
              style={{
                width: '100%',
                padding: '10px 14px',
                background: 'var(--glass-bg)',
                borderRadius: 'var(--r)',
                border: '1px solid var(--glass-border)',
                fontFamily: 'var(--font-b)',
                fontSize: 14,
                color: 'var(--text)',
                outline: 'none',
              }}
            />
          </div>

          <div>
            <label style={{
              fontFamily: 'var(--font-b)',
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--text-light)',
              letterSpacing: 1,
              textTransform: 'uppercase',
              marginBottom: 6,
              display: 'block',
            }}>
              Contenu
            </label>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              rows={10}
              placeholder="Contenu de l'email..."
              style={{
                width: '100%',
                padding: '12px 14px',
                background: 'var(--glass-bg)',
                borderRadius: 'var(--r)',
                border: '1px solid var(--glass-border)',
                fontFamily: 'var(--font-b)',
                fontSize: 14,
                color: 'var(--text)',
                outline: 'none',
                resize: 'vertical',
                lineHeight: 1.6,
              }}
            />
          </div>

          <button
            onClick={handleSend}
            disabled={loading}
            className="flex items-center justify-center gap-2"
            style={{
              padding: '14px 24px',
              background: loading ? 'var(--text-light)' : 'var(--teal)',
              color: '#fff',
              border: 'none',
              borderRadius: 'var(--pill)',
              fontFamily: 'var(--font-b)',
              fontSize: 14,
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 24px var(--teal-glow)',
              transition: 'all 0.3s',
            }}
          >
            <Send size={14} />
            {loading ? 'Envoi en cours...' : 'Envoyer l\'email'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SendEmailModal;
