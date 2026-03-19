import { useState, useRef, useEffect } from 'react';
import { useLang } from '@/hooks/useLang';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { z } from 'zod';
import { ArrowRight, ArrowLeft, Send, Check } from 'lucide-react';

const contactSchema = z.object({
  name: z.string().trim().min(1, 'Required').max(100),
  email: z.string().trim().email('Invalid email').max(255),
  phone: z.string().trim().max(30).optional(),
  project_type: z.string().max(100).optional(),
  budget: z.string().max(100).optional(),
  message: z.string().trim().min(1, 'Required').max(2000),
});

const tr = {
  steps: {
    fr: ['Qui êtes-vous ?', 'Comment vous joindre ?', 'Votre projet', 'Votre budget', 'Décrivez votre vision'],
    en: ['Who are you?', 'How to reach you?', 'Your project', 'Your budget', 'Describe your vision'],
    de: ['Wer sind Sie?', 'Wie erreichen wir Sie?', 'Ihr Projekt', 'Ihr Budget', 'Beschreiben Sie Ihre Vision'],
  },
  name: { fr: 'Votre nom complet', en: 'Your full name', de: 'Ihr vollständiger Name' },
  namePh: { fr: 'Jean Dupont', en: 'John Doe', de: 'Max Mustermann' },
  email: { fr: 'Adresse email', en: 'Email address', de: 'E-Mail-Adresse' },
  emailPh: { fr: 'jean@exemple.fr', en: 'john@example.com', de: 'max@beispiel.de' },
  phone: { fr: 'Téléphone (optionnel)', en: 'Phone (optional)', de: 'Telefon (optional)' },
  phonePh: { fr: '+33 6 12 34 56 78', en: '+1 555 123 4567', de: '+49 170 1234567' },
  projectType: { fr: 'Quel type de projet ?', en: 'What type of project?', de: 'Welche Art von Projekt?' },
  budget: { fr: 'Budget estimé', en: 'Estimated budget', de: 'Geschätztes Budget' },
  budgetValue: { fr: '€', en: '€', de: '€' },
  message: { fr: 'Décrivez votre projet en quelques mots...', en: 'Describe your project in a few words...', de: 'Beschreiben Sie Ihr Projekt in wenigen Worten...' },
  next: { fr: 'Continuer', en: 'Continue', de: 'Weiter' },
  prev: { fr: 'Retour', en: 'Back', de: 'Zurück' },
  submit: { fr: 'Envoyer ma demande', en: 'Send my request', de: 'Anfrage senden' },
  sending: { fr: 'Envoi en cours...', en: 'Sending...', de: 'Wird gesendet...' },
  success: { fr: 'Demande envoyée ! Nous revenons vers vous sous 24h.', en: 'Request sent! We\'ll get back to you within 24h.', de: 'Anfrage gesendet! Wir melden uns innerhalb von 24h.' },
  error: { fr: 'Erreur, veuillez réessayer.', en: 'Error, please try again.', de: 'Fehler, bitte versuchen Sie es erneut.' },
  projectTypes: {
    fr: ['Site vitrine', 'Application Web/Mobile', 'Application iOS', 'Application Android', 'Application iOS / Android', 'E-commerce', 'Refonte', 'Autre'],
    en: ['Showcase site', 'Web/Mobile Application', 'iOS Application', 'Android Application', 'iOS / Android Application', 'E-commerce', 'Redesign', 'Other'],
    de: ['Webseite', 'Web-/Mobile-App', 'iOS-App', 'Android-App', 'iOS / Android-App', 'E-Commerce', 'Redesign', 'Andere'],
  },
};

const TOTAL_STEPS = 5;
const MIN_BUDGET = 200;
const MAX_BUDGET = 10000;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ContactFormModal = ({ open, onOpenChange }: Props) => {
  const { lang } = useLang();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const [animating, setAnimating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', phone: '', project_type: '', budget: '2000', budgetCustom: '', message: '',
  });

  const inputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Reset on open
  useEffect(() => {
    if (open) {
      setStep(0);
      setDirection('next');
      setAnimating(false);
    }
  }, [open]);

  // Auto-focus input on step change
  useEffect(() => {
    if (!animating) {
      setTimeout(() => {
        if (step === 4) textareaRef.current?.focus();
        else inputRef.current?.focus();
      }, 100);
    }
  }, [step, animating]);

  const goTo = (nextStep: number) => {
    if (animating || nextStep < 0 || nextStep >= TOTAL_STEPS) return;
    setDirection(nextStep > step ? 'next' : 'prev');
    setAnimating(true);
    setTimeout(() => {
      setStep(nextStep);
      setAnimating(false);
    }, 280);
  };

  const canProceed = () => {
    switch (step) {
      case 0: return form.name.trim().length > 0;
      case 1: return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());
      case 2: return form.project_type.length > 0;
      case 3: return true;
      case 4: return form.message.trim().length > 0;
      default: return false;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && step < TOTAL_STEPS - 1 && canProceed()) {
      e.preventDefault();
      goTo(step + 1);
    }
  };

  const handleSubmit = async () => {
    const budgetStr = form.budgetCustom || `${form.budget}€`;
    const parsed = contactSchema.safeParse({ ...form, budget: budgetStr });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message || 'Validation error');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.from('leads').insert({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        project_type: form.project_type || null,
        budget: budgetStr,
        message: form.message.trim(),
      });
      if (error) throw error;

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
      }).catch(console.error);

      toast.success(tr.success[lang]);
      setForm({ name: '', email: '', phone: '', project_type: '', budget: '2000', budgetCustom: '', message: '' });
      onOpenChange(false);
    } catch {
      toast.error(tr.error[lang]);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '16px 20px',
    borderRadius: 'var(--r)',
    border: '1.5px solid var(--glass-border)',
    background: 'rgba(255,255,255,0.5)',
    fontFamily: 'var(--font-b)',
    fontSize: 16,
    color: 'var(--text)',
    outline: 'none',
    transition: 'border-color 0.3s, box-shadow 0.3s',
  };

  const focusStyle = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.currentTarget.style.borderColor = 'var(--teal)';
    e.currentTarget.style.boxShadow = '0 0 0 3px var(--teal-glow)';
  };
  const blurStyle = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.currentTarget.style.borderColor = 'var(--glass-border)';
    e.currentTarget.style.boxShadow = 'none';
  };

  const budgetNum = parseInt(form.budget) || MIN_BUDGET;
  const budgetPercent = ((budgetNum - MIN_BUDGET) / (MAX_BUDGET - MIN_BUDGET)) * 100;

  const slideClass = animating
    ? direction === 'next'
      ? 'translate-x-[-110%] opacity-0'
      : 'translate-x-[110%] opacity-0'
    : 'translate-x-0 opacity-100';

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="flex flex-col gap-6">
            <div>
              <label style={{ fontFamily: 'var(--font-m)', fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--text-light)', marginBottom: 10, display: 'block' }}>
                {tr.name[lang]}
              </label>
              <input
                ref={inputRef}
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder={tr.namePh[lang]}
                onKeyDown={handleKeyDown}
                onFocus={focusStyle}
                onBlur={blurStyle}
                style={inputStyle}
              />
            </div>
          </div>
        );
      case 1:
        return (
          <div className="flex flex-col gap-5">
            <div>
              <label style={{ fontFamily: 'var(--font-m)', fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--text-light)', marginBottom: 10, display: 'block' }}>
                {tr.email[lang]}
              </label>
              <input
                ref={inputRef}
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder={tr.emailPh[lang]}
                onKeyDown={handleKeyDown}
                onFocus={focusStyle}
                onBlur={blurStyle}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ fontFamily: 'var(--font-m)', fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--text-light)', marginBottom: 10, display: 'block' }}>
                {tr.phone[lang]}
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder={tr.phonePh[lang]}
                onKeyDown={handleKeyDown}
                onFocus={focusStyle}
                onBlur={blurStyle}
                style={inputStyle}
              />
            </div>
          </div>
        );
      case 2:
        return (
          <div className="flex flex-col gap-3">
            <label style={{ fontFamily: 'var(--font-m)', fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--text-light)', marginBottom: 4, display: 'block' }}>
              {tr.projectType[lang]}
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {tr.projectTypes[lang].map(pt => (
                <button
                  key={pt}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, project_type: pt }))}
                  style={{
                    padding: '14px 16px',
                    borderRadius: 'var(--r)',
                    border: form.project_type === pt ? '2px solid var(--teal)' : '1.5px solid var(--glass-border)',
                    background: form.project_type === pt ? 'rgba(13,138,111,0.08)' : 'rgba(255,255,255,0.4)',
                    color: form.project_type === pt ? 'var(--teal)' : 'var(--text-mid)',
                    fontFamily: 'var(--font-b)',
                    fontSize: 13,
                    fontWeight: form.project_type === pt ? 600 : 400,
                    cursor: 'pointer',
                    transition: 'all 0.25s ease',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  {form.project_type === pt && <Check size={14} style={{ color: 'var(--teal)' }} />}
                  {pt}
                </button>
              ))}
            </div>
          </div>
        );
      case 3:
        return (
          <div className="flex flex-col gap-6">
            <label style={{ fontFamily: 'var(--font-m)', fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--text-light)', display: 'block' }}>
              {tr.budget[lang]}
            </label>

            {/* Budget display */}
            <div className="text-center">
              <span style={{
                fontFamily: 'var(--font-h)',
                fontSize: 'clamp(42px, 8vw, 56px)',
                color: 'var(--teal)',
                lineHeight: 1,
              }}>
                {budgetNum.toLocaleString('fr-FR')}€
              </span>
            </div>

            {/* Slider */}
            <div className="relative px-1">
              <div style={{
                width: '100%',
                height: 6,
                borderRadius: 'var(--pill)',
                background: 'var(--glass-border)',
                position: 'relative',
              }}>
                <div style={{
                  width: `${budgetPercent}%`,
                  height: '100%',
                  borderRadius: 'var(--pill)',
                  background: 'var(--teal)',
                  transition: 'width 0.1s ease',
                }} />
              </div>
              <input
                type="range"
                min={MIN_BUDGET}
                max={MAX_BUDGET}
                step={100}
                value={form.budget}
                onChange={e => setForm(f => ({ ...f, budget: e.target.value, budgetCustom: '' }))}
                style={{
                  position: 'absolute',
                  top: -8,
                  left: 0,
                  width: '100%',
                  height: 24,
                  opacity: 0,
                  cursor: 'pointer',
                }}
              />
              <div className="flex justify-between mt-2">
                <span style={{ fontFamily: 'var(--font-m)', fontSize: 11, color: 'var(--text-light)' }}>{MIN_BUDGET}€</span>
                <span style={{ fontFamily: 'var(--font-m)', fontSize: 11, color: 'var(--text-light)' }}>{MAX_BUDGET.toLocaleString('fr-FR')}€</span>
              </div>
            </div>

            {/* Custom input */}
            <div>
              <label style={{ fontFamily: 'var(--font-m)', fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--text-light)', marginBottom: 8, display: 'block' }}>
                {lang === 'fr' ? 'Ou saisissez un montant' : lang === 'de' ? 'Oder geben Sie einen Betrag ein' : 'Or enter an amount'}
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={MIN_BUDGET}
                  placeholder={`${MIN_BUDGET} - ${MAX_BUDGET.toLocaleString('fr-FR')}+`}
                  value={form.budgetCustom}
                  onChange={e => {
                    const val = e.target.value;
                    setForm(f => ({
                      ...f,
                      budgetCustom: val,
                      budget: val && parseInt(val) >= MIN_BUDGET ? Math.min(parseInt(val), MAX_BUDGET).toString() : f.budget,
                    }));
                  }}
                  onKeyDown={handleKeyDown}
                  onFocus={focusStyle}
                  onBlur={blurStyle}
                  style={{ ...inputStyle, paddingRight: 40 }}
                />
                <span style={{
                  position: 'absolute',
                  right: 16,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontFamily: 'var(--font-h)',
                  fontSize: 20,
                  color: 'var(--text-light)',
                }}>€</span>
              </div>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="flex flex-col gap-4">
            <label style={{ fontFamily: 'var(--font-m)', fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--text-light)', marginBottom: 4, display: 'block' }}>
              {tr.message[lang]}
            </label>
            <textarea
              ref={textareaRef}
              value={form.message}
              onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
              placeholder={tr.message[lang]}
              rows={5}
              onFocus={focusStyle as any}
              onBlur={blurStyle as any}
              style={{ ...inputStyle, resize: 'vertical', minHeight: 120, lineHeight: 1.7 }}
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-md mx-4 overflow-hidden"
        style={{
          background: 'var(--cream)',
          border: '1px solid var(--glass-border)',
          borderRadius: 'var(--r-xl)',
          padding: 0,
          boxShadow: '0 24px 80px rgba(0,0,0,0.12)',
        }}
      >
        <div style={{ padding: '32px 28px 28px' }}>
          {/* Step indicator */}
          <span style={{
            fontFamily: 'var(--font-m)',
            fontSize: 11,
            color: 'var(--text-light)',
            letterSpacing: 1,
          }}>
            {step + 1} / {TOTAL_STEPS}
          </span>

          {/* Step title */}
          <h2
            style={{
              fontFamily: 'var(--font-h)',
              fontSize: 'clamp(22px, 5vw, 28px)',
              color: 'var(--charcoal)',
              letterSpacing: -0.5,
              marginBottom: 24,
              lineHeight: 1.2,
            }}
          >
            {tr.steps[lang][step]}
          </h2>

          {/* Slide content */}
          <div className="relative overflow-hidden" style={{ minHeight: step === 2 ? 320 : step === 3 ? 280 : 160 }}>
            <div
              className={`transition-all duration-[280ms] ease-[cubic-bezier(.23,1,.32,1)] ${slideClass}`}
              style={{ width: '100%' }}
            >
              {renderStep()}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 gap-3">
            {step > 0 ? (
              <button
                type="button"
                onClick={() => goTo(step - 1)}
                style={{
                  padding: '12px 20px',
                  background: 'transparent',
                  border: '1.5px solid var(--glass-border)',
                  borderRadius: 'var(--pill)',
                  color: 'var(--text-mid)',
                  fontFamily: 'var(--font-b)',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--text-mid)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--glass-border)'}
              >
                <ArrowLeft size={14} /> {tr.prev[lang]}
              </button>
            ) : <div />}

            {step < TOTAL_STEPS - 1 ? (
              <button
                type="button"
                onClick={() => goTo(step + 1)}
                disabled={!canProceed()}
                style={{
                  padding: '12px 28px',
                  background: canProceed() ? 'var(--teal)' : 'var(--text-ghost)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 'var(--pill)',
                  fontFamily: 'var(--font-b)',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: canProceed() ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.3s',
                  boxShadow: canProceed() ? '0 4px 20px var(--teal-glow)' : 'none',
                }}
                onMouseEnter={e => {
                  if (canProceed()) {
                    e.currentTarget.style.transform = 'scale(1.04) translateY(-1px)';
                    e.currentTarget.style.background = 'var(--teal-deep)';
                  }
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'scale(1) translateY(0)';
                  if (canProceed()) e.currentTarget.style.background = 'var(--teal)';
                }}
              >
                {tr.next[lang]} <ArrowRight size={14} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading || !canProceed()}
                style={{
                  padding: '12px 28px',
                  background: loading ? 'var(--text-light)' : 'var(--teal)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 'var(--pill)',
                  fontFamily: 'var(--font-b)',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.3s',
                  boxShadow: '0 4px 20px var(--teal-glow)',
                }}
                onMouseEnter={e => {
                  if (!loading) {
                    e.currentTarget.style.transform = 'scale(1.04) translateY(-1px)';
                    e.currentTarget.style.background = 'var(--teal-deep)';
                  }
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'scale(1) translateY(0)';
                  if (!loading) e.currentTarget.style.background = 'var(--teal)';
                }}
              >
                <Send size={14} /> {loading ? tr.sending[lang] : tr.submit[lang]}
              </button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ContactFormModal;
