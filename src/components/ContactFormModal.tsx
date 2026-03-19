import { useState } from 'react';
import { useLang } from '@/hooks/useLang';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { z } from 'zod';

const contactSchema = z.object({
  name: z.string().trim().min(1, 'Required').max(100),
  email: z.string().trim().email('Invalid email').max(255),
  phone: z.string().trim().max(30).optional(),
  project_type: z.string().max(100).optional(),
  budget: z.string().max(100).optional(),
  message: z.string().trim().min(1, 'Required').max(2000),
});

const translations = {
  title: { fr: 'Discutons de votre projet', en: "Let's discuss your project", de: 'Lassen Sie uns Ihr Projekt besprechen' },
  name: { fr: 'Nom complet', en: 'Full name', de: 'Vollständiger Name' },
  email: { fr: 'Email', en: 'Email', de: 'E-Mail' },
  phone: { fr: 'Téléphone (optionnel)', en: 'Phone (optional)', de: 'Telefon (optional)' },
  projectType: { fr: 'Type de projet', en: 'Project type', de: 'Projekttyp' },
  budget: { fr: 'Budget estimé', en: 'Estimated budget', de: 'Geschätztes Budget' },
  message: { fr: 'Décrivez votre projet...', en: 'Describe your project...', de: 'Beschreiben Sie Ihr Projekt...' },
  submit: { fr: 'Envoyer ma demande', en: 'Send my request', de: 'Anfrage senden' },
  sending: { fr: 'Envoi...', en: 'Sending...', de: 'Wird gesendet...' },
  success: { fr: 'Demande envoyée avec succès ! Nous reviendrons vers vous rapidement.', en: 'Request sent successfully! We\'ll get back to you soon.', de: 'Anfrage erfolgreich gesendet! Wir melden uns bald bei Ihnen.' },
  error: { fr: 'Erreur lors de l\'envoi. Veuillez réessayer.', en: 'Error sending. Please try again.', de: 'Fehler beim Senden. Bitte versuchen Sie es erneut.' },
  projectTypes: {
    fr: ['Site vitrine', 'Application web', 'E-commerce', 'Refonte', 'Autre'],
    en: ['Showcase site', 'Web application', 'E-commerce', 'Redesign', 'Other'],
    de: ['Webseite', 'Webanwendung', 'E-Commerce', 'Redesign', 'Andere'],
  },
  budgets: {
    fr: ['< 1 000€', '1 000€ - 3 000€', '3 000€ - 5 000€', '5 000€ - 10 000€', '> 10 000€'],
    en: ['< €1,000', '€1,000 - €3,000', '€3,000 - €5,000', '€5,000 - €10,000', '> €10,000'],
    de: ['< 1.000€', '1.000€ - 3.000€', '3.000€ - 5.000€', '5.000€ - 10.000€', '> 10.000€'],
  },
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ContactFormModal = ({ open, onOpenChange }: Props) => {
  const { lang } = useLang();
  const t = translations;
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', phone: '', project_type: '', budget: '', message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = contactSchema.safeParse(form);
    if (!result.success) {
      toast.error(result.error.issues[0]?.message || 'Validation error');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.from('leads').insert({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        project_type: form.project_type || null,
        budget: form.budget || null,
        message: form.message.trim(),
      });
      if (error) throw error;

      // Send confirmation email to prospect via Resend
      supabase.functions.invoke('send-prospect-email', {
        body: {
          to: form.email.trim(),
          toName: form.name.trim(),
          subject: lang === 'de' ? 'Creationation — Wir haben Ihre Anfrage erhalten'
            : lang === 'en' ? 'Creationation — We received your request'
            : 'Creationation — Nous avons bien reçu votre demande',
          body: lang === 'de'
            ? 'Vielen Dank für Ihr Interesse! Wir haben Ihre Anfrage erhalten und melden uns innerhalb von 24 Stunden bei Ihnen.\n\nMit freundlichen Grüßen,\nDas Creationation-Team'
            : lang === 'en'
            ? 'Thank you for your interest! We received your request and will get back to you within 24 hours.\n\nBest regards,\nThe Creationation Team'
            : 'Merci pour votre intérêt ! Nous avons bien reçu votre demande et reviendrons vers vous sous 24h.\n\nÀ très vite,\nL\'équipe Creationation',
        },
      }).catch(console.error); // fire-and-forget

      toast.success(t.success[lang]);
      setForm({ name: '', email: '', phone: '', project_type: '', budget: '', message: '' });
      onOpenChange(false);
    } catch {
      toast.error(t.error[lang]);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 16px',
    borderRadius: 'var(--r)',
    border: '1px solid var(--glass-border)',
    background: 'var(--glass-bg)',
    backdropFilter: 'blur(10px)',
    fontFamily: 'var(--font-b)',
    fontSize: 14,
    color: 'var(--text)',
    outline: 'none',
    transition: 'border-color 0.2s',
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: 'var(--font-b)',
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--text-mid)',
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
    marginBottom: 6,
    display: 'block',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-lg mx-4 max-h-[90vh] overflow-y-auto"
        style={{
          background: 'var(--cream)',
          border: '1px solid var(--glass-border)',
          borderRadius: 'var(--r-lg)',
          padding: '32px',
        }}
      >
        <DialogHeader>
          <DialogTitle
            style={{
              fontFamily: 'var(--font-h)',
              fontSize: 'clamp(22px, 4vw, 28px)',
              color: 'var(--charcoal)',
              letterSpacing: -0.5,
            }}
          >
            {t.title[lang]}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4">
          <div>
            <label style={labelStyle}>{t.name[lang]}</label>
            <input
              required
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              style={inputStyle}
              onFocus={e => e.currentTarget.style.borderColor = 'var(--teal)'}
              onBlur={e => e.currentTarget.style.borderColor = 'var(--glass-border)'}
            />
          </div>

          <div>
            <label style={labelStyle}>{t.email[lang]}</label>
            <input
              required
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              style={inputStyle}
              onFocus={e => e.currentTarget.style.borderColor = 'var(--teal)'}
              onBlur={e => e.currentTarget.style.borderColor = 'var(--glass-border)'}
            />
          </div>

          <div>
            <label style={labelStyle}>{t.phone[lang]}</label>
            <input
              type="tel"
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              style={inputStyle}
              onFocus={e => e.currentTarget.style.borderColor = 'var(--teal)'}
              onBlur={e => e.currentTarget.style.borderColor = 'var(--glass-border)'}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={labelStyle}>{t.projectType[lang]}</label>
              <select
                value={form.project_type}
                onChange={e => setForm(f => ({ ...f, project_type: e.target.value }))}
                style={{ ...inputStyle, cursor: 'pointer' }}
              >
                <option value="">—</option>
                {t.projectTypes[lang].map(pt => (
                  <option key={pt} value={pt}>{pt}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>{t.budget[lang]}</label>
              <select
                value={form.budget}
                onChange={e => setForm(f => ({ ...f, budget: e.target.value }))}
                style={{ ...inputStyle, cursor: 'pointer' }}
              >
                <option value="">—</option>
                {t.budgets[lang].map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label style={labelStyle}>{t.message[lang]}</label>
            <textarea
              required
              rows={4}
              value={form.message}
              onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
              placeholder={t.message[lang]}
              style={{ ...inputStyle, resize: 'vertical', minHeight: 100 }}
              onFocus={e => e.currentTarget.style.borderColor = 'var(--teal)'}
              onBlur={e => e.currentTarget.style.borderColor = 'var(--glass-border)'}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '16px 32px',
              background: loading ? 'var(--text-light)' : 'var(--teal)',
              color: '#fff',
              fontFamily: 'var(--font-b)',
              fontSize: 15,
              fontWeight: 600,
              border: 'none',
              borderRadius: 'var(--pill)',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s',
              boxShadow: '0 4px 24px var(--teal-glow)',
              marginTop: 8,
            }}
            onMouseEnter={e => {
              if (!loading) {
                e.currentTarget.style.transform = 'scale(1.03) translateY(-2px)';
                e.currentTarget.style.background = 'var(--teal-deep)';
              }
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'scale(1) translateY(0)';
              if (!loading) e.currentTarget.style.background = 'var(--teal)';
            }}
          >
            {loading ? t.sending[lang] : t.submit[lang]}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ContactFormModal;
