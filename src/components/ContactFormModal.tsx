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
    fr: ['Qui êtes-vous ?', 'Comment vous joindre ?', 'Votre projet', 'Nom du projet', 'Votre budget', 'Décrivez votre vision', 'Votre secteur', 'Votre style', 'Fonctionnalités clés', 'Votre inspiration', 'Votre calendrier'],
    en: ['Who are you?', 'How to reach you?', 'Your project', 'Project name', 'Your budget', 'Describe your vision', 'Your industry', 'Your style', 'Key features', 'Your inspiration', 'Your timeline'],
    de: ['Wer sind Sie?', 'Wie erreichen wir Sie?', 'Ihr Projekt', 'Projektname', 'Ihr Budget', 'Beschreiben Sie Ihre Vision', 'Ihre Branche', 'Ihr Stil', 'Schlüsselfunktionen', 'Ihre Inspiration', 'Ihr Zeitrahmen'],
  },
  projectNameLabel: { fr: 'COMMENT S\'APPELLE VOTRE PROJET ?', en: 'WHAT IS YOUR PROJECT CALLED?', de: 'WIE HEISST IHR PROJEKT?' },
  projectNamePh: { fr: 'Ex : MonSuperSite', en: 'E.g.: MySuperSite', de: 'Z.B.: MeineSuperSeite' },
  projectNameUnknown: { fr: 'Je ne sais pas encore', en: "I don't know yet", de: 'Ich weiß es noch nicht' },
  name: { fr: 'Votre nom complet', en: 'Your full name', de: 'Ihr vollständiger Name' },
  namePh: { fr: 'Jean Dupont', en: 'John Doe', de: 'Max Mustermann' },
  email: { fr: 'Adresse email', en: 'Email address', de: 'E-Mail-Adresse' },
  emailPh: { fr: 'jean@exemple.fr', en: 'john@example.com', de: 'max@beispiel.de' },
  phone: { fr: 'Téléphone (optionnel)', en: 'Phone (optional)', de: 'Telefon (optional)' },
  phonePh: { fr: '+33 6 12 34 56 78', en: '+1 555 123 4567', de: '+49 170 1234567' },
  projectType: { fr: 'Quel type de projet ?', en: 'What type of project?', de: 'Welche Art von Projekt?' },
  budget: { fr: 'Budget estimé', en: 'Estimated budget', de: 'Geschätztes Budget' },
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
  industryLabel: { fr: 'QUEL EST VOTRE DOMAINE D\'ACTIVITÉ ?', en: 'WHAT IS YOUR FIELD OF ACTIVITY?', de: 'WAS IST IHR TÄTIGKEITSBEREICH?' },
  industries: {
    fr: ['Beauté & Bien-être', 'Restaurant & Alimentation', 'Santé & Médical', 'Immobilier', 'Tech & SaaS', 'Coaching & Consulting', 'E-commerce & Retail', 'Autre'],
    en: ['Beauty & Wellness', 'Restaurant & Food', 'Health & Medical', 'Real Estate', 'Tech & SaaS', 'Coaching & Consulting', 'E-commerce & Retail', 'Other'],
    de: ['Beauty & Wellness', 'Restaurant & Essen', 'Gesundheit & Medizin', 'Immobilien', 'Tech & SaaS', 'Coaching & Beratung', 'E-Commerce & Einzelhandel', 'Andere'],
  },
  industryOtherPh: { fr: 'Précisez votre secteur...', en: 'Specify your industry...', de: 'Geben Sie Ihre Branche an...' },
  styleLabel: { fr: 'QUELLE DIRECTION VISUELLE VOUS PARLE ?', en: 'WHICH VISUAL DIRECTION SPEAKS TO YOU?', de: 'WELCHE VISUELLE RICHTUNG SPRICHT SIE AN?' },
  styleOtherPh: { fr: 'Décrivez les couleurs souhaitées...', en: 'Describe your desired colors...', de: 'Beschreiben Sie Ihre gewünschten Farben...' },
  featuresLabel: { fr: 'QUELLES FONCTIONNALITÉS AVEZ-VOUS BESOIN ?', en: 'WHAT FEATURES DO YOU NEED?', de: 'WELCHE FUNKTIONEN BENÖTIGEN SIE?' },
  features: {
    fr: ['Réservation en ligne', 'Paiements en ligne', 'Portfolio / Galerie', 'Blog', 'Chat en direct', 'Portail client', 'Formulaire de contact', 'Réseaux sociaux', 'Newsletter', 'Multi-langue'],
    en: ['Online booking', 'Online payments', 'Portfolio / Gallery', 'Blog', 'Live chat', 'Client portal', 'Contact form', 'Social media integration', 'Newsletter', 'Multi-language'],
    de: ['Online-Buchung', 'Online-Zahlungen', 'Portfolio / Galerie', 'Blog', 'Live-Chat', 'Kundenportal', 'Kontaktformular', 'Social Media', 'Newsletter', 'Mehrsprachig'],
  },
  inspirationLabel: { fr: 'PARTAGEZ 1 À 3 SITES QUE VOUS AIMEZ (OPTIONNEL)', en: 'SHARE 1-3 WEBSITES YOU LIKE (OPTIONAL)', de: 'TEILEN SIE 1-3 WEBSITES, DIE IHNEN GEFALLEN (OPTIONAL)' },
  inspirationHelper: { fr: 'Cela nous aide à comprendre vos goûts', en: 'This helps us understand your taste', de: 'Das hilft uns, Ihren Geschmack zu verstehen' },
  timelineLabel: { fr: 'QUAND EN AVEZ-VOUS BESOIN ?', en: 'WHEN DO YOU NEED THIS?', de: 'WANN BRAUCHEN SIE DAS?' },
  timelines: {
    fr: ['Dès que possible', '1 – 2 mois', '3+ mois', 'Pas de deadline'],
    en: ['As soon as possible', '1 – 2 months', '3+ months', 'No deadline'],
    de: ['So schnell wie möglich', '1 – 2 Monate', '3+ Monate', 'Keine Deadline'],
  },
};

const styleOptions = [
  { label: { fr: 'Élégant & Sombre', en: 'Elegant & Dark', de: 'Elegant & Dunkel' }, colors: ['#1a1a2e', '#16213e', '#c4a35a', '#f5f5f5'] },
  { label: { fr: 'Frais & Moderne', en: 'Fresh & Modern', de: 'Frisch & Modern' }, colors: ['#0d9488', '#06b6d4', '#f0fdfa', '#ffffff'] },
  { label: { fr: 'Chaleureux & Naturel', en: 'Warm & Natural', de: 'Warm & Natürlich' }, colors: ['#d4a373', '#faedcd', '#2d6a4f', '#fefae0'] },
  { label: { fr: 'Audacieux & Coloré', en: 'Bold & Colorful', de: 'Mutig & Farbenfroh' }, colors: ['#e63946', '#457b9d', '#f4a261', '#1d3557'] },
  { label: { fr: 'Minimal & Épuré', en: 'Minimal & Clean', de: 'Minimal & Klar' }, colors: ['#000000', '#ffffff', '#737373', '#e5e5e5'] },
];

const TOTAL_STEPS = 11;
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
    name: '', email: '', phone: '', project_types: [] as string[], projectName: '', projectNameUnknown: false, budget: '2000', budgetCustom: '', message: '',
    industry: '', industryCustom: '',
    style: '', styleCustom: '',
    features: [] as string[],
    inspiration1: '', inspiration2: '', inspiration3: '',
    timeline: '',
  });

  const inputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (open) {
      setStep(0);
      setDirection('next');
      setAnimating(false);
    }
  }, [open]);

  useEffect(() => {
    if (!animating) {
      setTimeout(() => {
        if (step === 5) textareaRef.current?.focus();
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

  const isOtherIndustry = (val: string) => {
    const others = ['Autre', 'Other', 'Andere'];
    return others.includes(val);
  };

  const canProceed = () => {
    switch (step) {
      case 0: return form.name.trim().length > 0;
      case 1: return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());
      case 2: return form.project_types.length > 0;
      case 3: return form.projectName.trim().length > 0 || form.projectNameUnknown;
      case 4: return true;
      case 5: return form.message.trim().length > 0;
      case 6: return form.industry.length > 0 && (!isOtherIndustry(form.industry) || form.industryCustom.trim().length > 0);
      case 7: return form.style.length > 0 && (form.style !== 'Other' || form.styleCustom.trim().length > 0);
      case 8: return form.features.length > 0;
      case 9: return true; // optional
      case 10: return form.timeline.length > 0;
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
    const projectTypeStr = form.project_types.join(', ');
    const parsed = contactSchema.safeParse({ ...form, project_type: projectTypeStr, budget: budgetStr });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message || 'Validation error');
      return;
    }
    setLoading(true);

    const industryFinal = isOtherIndustry(form.industry) ? form.industryCustom.trim() : form.industry;
    const inspirations = [form.inspiration1, form.inspiration2, form.inspiration3].filter(Boolean).join(', ');
    const featuresStr = form.features.join(', ');

    const fullMessage = [
      form.message.trim(),
      `\n\n--- Additional details ---`,
      `Industry: ${industryFinal}`,
      `Style: ${form.style === 'Other' ? form.styleCustom.trim() : form.style}`,
      `Features: ${featuresStr}`,
      inspirations ? `Inspiration: ${inspirations}` : null,
      `Timeline: ${form.timeline}`,
    ].filter(Boolean).join('\n');

    try {
      const { error } = await supabase.from('leads').insert({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        project_type: projectTypeStr || null,
        budget: budgetStr,
        message: fullMessage,
      });
      if (error) throw error;

      supabase.functions.invoke('send-prospect-email', {
        body: {
          to: form.email.trim(),
          toName: form.name.trim(),
          lang,
          recap: {
            name: form.name.trim(),
            email: form.email.trim(),
            phone: form.phone.trim() || null,
            projectTypes: projectTypeStr,
            budget: budgetStr,
            message: form.message.trim(),
            industry: industryFinal,
            style: form.style,
            features: featuresStr,
            inspiration: inspirations,
            timeline: form.timeline,
          },
        },
      }).catch(console.error);

      toast.success(tr.success[lang]);
      setForm({ name: '', email: '', phone: '', project_types: [], projectName: '', projectNameUnknown: false, budget: '2000', budgetCustom: '', message: '', industry: '', industryCustom: '', style: '', styleCustom: '', features: [], inspiration1: '', inspiration2: '', inspiration3: '', timeline: '' });
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

  const labelStyle: React.CSSProperties = {
    fontFamily: 'var(--font-m)',
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: 'var(--text-light)',
    marginBottom: 10,
    display: 'block',
  };

  const chipStyle = (isSelected: boolean): React.CSSProperties => ({
    padding: '14px 16px',
    borderRadius: 'var(--r)',
    border: isSelected ? '2px solid var(--teal)' : '1.5px solid var(--glass-border)',
    background: isSelected ? 'rgba(13,138,111,0.08)' : 'rgba(255,255,255,0.4)',
    color: isSelected ? 'var(--teal)' : 'var(--text-mid)',
    fontFamily: 'var(--font-b)',
    fontSize: 13,
    fontWeight: isSelected ? 600 : 400,
    cursor: 'pointer',
    transition: 'all 0.25s ease',
    textAlign: 'left',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  });

  const budgetNum = parseInt(form.budget) || MIN_BUDGET;
  const budgetPercent = ((budgetNum - MIN_BUDGET) / (MAX_BUDGET - MIN_BUDGET)) * 100;

  const slideClass = animating
    ? direction === 'next'
      ? 'translate-x-[-110%] opacity-0'
      : 'translate-x-[110%] opacity-0'
    : 'translate-x-0 opacity-100';

  const stepMinHeight = () => {
    if ([2, 6, 8].includes(step)) return 320;
    if ([4, 7].includes(step)) return 280;
    if (step === 9) return 240;
    if (step === 3) return 200;
    return 160;
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="flex flex-col gap-6">
            <div>
              <label style={labelStyle}>{tr.name[lang]}</label>
              <input ref={inputRef} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder={tr.namePh[lang]} onKeyDown={handleKeyDown} onFocus={focusStyle} onBlur={blurStyle} style={inputStyle} />
            </div>
          </div>
        );
      case 1:
        return (
          <div className="flex flex-col gap-5">
            <div>
              <label style={labelStyle}>{tr.email[lang]}</label>
              <input ref={inputRef} type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder={tr.emailPh[lang]} onKeyDown={handleKeyDown} onFocus={focusStyle} onBlur={blurStyle} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>{tr.phone[lang]}</label>
              <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder={tr.phonePh[lang]} onKeyDown={handleKeyDown} onFocus={focusStyle} onBlur={blurStyle} style={inputStyle} />
            </div>
          </div>
        );
      case 2:
        return (
          <div className="flex flex-col gap-3">
            <label style={{ ...labelStyle, marginBottom: 4 }}>{tr.projectType[lang]}</label>
            <div className="grid grid-cols-2 gap-2.5">
              {tr.projectTypes[lang].map(pt => {
                const isSelected = form.project_types.includes(pt);
                return (
                  <button key={pt} type="button" onClick={() => setForm(f => ({ ...f, project_types: isSelected ? f.project_types.filter(p => p !== pt) : [...f.project_types, pt] }))} style={chipStyle(isSelected)}>
                    {isSelected && <Check size={14} style={{ color: 'var(--teal)' }} />}{pt}
                  </button>
                );
              })}
            </div>
          </div>
        );
      case 3: // Project name
        return (
          <div className="flex flex-col gap-5">
            <label style={labelStyle}>{tr.projectNameLabel[lang]}</label>
            <input
              ref={inputRef}
              value={form.projectName}
              onChange={e => setForm(f => ({ ...f, projectName: e.target.value, projectNameUnknown: false }))}
              placeholder={tr.projectNamePh[lang]}
              onKeyDown={handleKeyDown}
              onFocus={focusStyle}
              onBlur={blurStyle}
              style={{ ...inputStyle, opacity: form.projectNameUnknown ? 0.4 : 1 }}
              disabled={form.projectNameUnknown}
            />
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, projectNameUnknown: !f.projectNameUnknown, projectName: !f.projectNameUnknown ? '' : f.projectName }))}
              style={chipStyle(form.projectNameUnknown)}
            >
              {form.projectNameUnknown && <Check size={14} style={{ color: 'var(--teal)' }} />}
              {tr.projectNameUnknown[lang]}
            </button>
          </div>
        );
      case 4:
        return (
          <div className="flex flex-col gap-6">
            <label style={labelStyle}>{tr.budget[lang]}</label>
            <div className="text-center">
              <span style={{ fontFamily: 'var(--font-h)', fontSize: 'clamp(42px, 8vw, 56px)', color: 'var(--teal)', lineHeight: 1 }}>
                {budgetNum.toLocaleString('fr-FR')}€
              </span>
            </div>
            <div className="relative px-1">
              <div style={{ width: '100%', height: 6, borderRadius: 'var(--pill)', background: 'var(--glass-border)', position: 'relative' }}>
                <div style={{ width: `${budgetPercent}%`, height: '100%', borderRadius: 'var(--pill)', background: 'var(--teal)', transition: 'width 0.1s ease' }} />
              </div>
              <input type="range" min={MIN_BUDGET} max={MAX_BUDGET} step={100} value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value, budgetCustom: '' }))} style={{ position: 'absolute', top: -8, left: 0, width: '100%', height: 24, opacity: 0, cursor: 'pointer' }} />
              <div className="flex justify-between mt-2">
                <span style={{ fontFamily: 'var(--font-m)', fontSize: 11, color: 'var(--text-light)' }}>{MIN_BUDGET}€</span>
                <span style={{ fontFamily: 'var(--font-m)', fontSize: 11, color: 'var(--text-light)' }}>{MAX_BUDGET.toLocaleString('fr-FR')}€</span>
              </div>
            </div>
            <div>
              <label style={{ ...labelStyle, marginBottom: 8 }}>
                {lang === 'fr' ? 'Ou saisissez un montant' : lang === 'de' ? 'Oder geben Sie einen Betrag ein' : 'Or enter an amount'}
              </label>
              <div className="relative">
                <input type="number" min={MIN_BUDGET} placeholder={`${MIN_BUDGET} - ${MAX_BUDGET.toLocaleString('fr-FR')}+`} value={form.budgetCustom} onChange={e => { const val = e.target.value; setForm(f => ({ ...f, budgetCustom: val, budget: val && parseInt(val) >= MIN_BUDGET ? Math.min(parseInt(val), MAX_BUDGET).toString() : f.budget })); }} onKeyDown={handleKeyDown} onFocus={focusStyle} onBlur={blurStyle} style={{ ...inputStyle, paddingRight: 40 }} />
                <span style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', fontFamily: 'var(--font-h)', fontSize: 20, color: 'var(--text-light)' }}>€</span>
              </div>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="flex flex-col gap-4">
            <label style={{ ...labelStyle, marginBottom: 4 }}>{tr.message[lang]}</label>
            <textarea ref={textareaRef} value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder={tr.message[lang]} rows={5} onFocus={focusStyle as any} onBlur={blurStyle as any} style={{ ...inputStyle, resize: 'vertical', minHeight: 120, lineHeight: 1.7 }} />
          </div>
        );

      case 6: // Industry
        return (
          <div className="flex flex-col gap-3">
            <label style={{ ...labelStyle, marginBottom: 4 }}>{tr.industryLabel[lang]}</label>
            <div className="grid grid-cols-2 gap-2.5">
              {tr.industries[lang].map(ind => {
                const isSelected = form.industry === ind;
                return (
                  <button key={ind} type="button" onClick={() => setForm(f => ({ ...f, industry: ind, industryCustom: isOtherIndustry(ind) ? f.industryCustom : '' }))} style={chipStyle(isSelected)}>
                    {isSelected && <Check size={14} style={{ color: 'var(--teal)' }} />}{ind}
                  </button>
                );
              })}
            </div>
            {isOtherIndustry(form.industry) && (
              <input value={form.industryCustom} onChange={e => setForm(f => ({ ...f, industryCustom: e.target.value }))} placeholder={tr.industryOtherPh[lang]} onKeyDown={handleKeyDown} onFocus={focusStyle} onBlur={blurStyle} style={{ ...inputStyle, marginTop: 4 }} />
            )}
          </div>
        );

      case 7: // Style
        const isOtherStyle = form.style === 'Other';
        const otherStyleLabel = { fr: 'Autre', en: 'Other', de: 'Andere' };
        return (
          <div className="flex flex-col gap-3">
            <label style={{ ...labelStyle, marginBottom: 4 }}>{tr.styleLabel[lang]}</label>
            <div className="flex flex-col gap-2.5">
              {styleOptions.map(opt => {
                const isSelected = form.style === opt.label.en;
                return (
                  <button key={opt.label.en} type="button" onClick={() => setForm(f => ({ ...f, style: opt.label.en, styleCustom: '' }))} style={{ ...chipStyle(isSelected), justifyContent: 'space-between' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {isSelected && <Check size={14} style={{ color: 'var(--teal)' }} />}
                      {opt.label[lang]}
                    </span>
                    <span style={{ display: 'flex', gap: 4 }}>
                      {opt.colors.map(c => (
                        <span key={c} style={{ width: 18, height: 18, borderRadius: '50%', background: c, border: '1px solid var(--glass-border)', flexShrink: 0 }} />
                      ))}
                    </span>
                  </button>
                );
              })}
              <button type="button" onClick={() => setForm(f => ({ ...f, style: 'Other' }))} style={{ ...chipStyle(isOtherStyle), justifyContent: 'flex-start' }}>
                {isOtherStyle && <Check size={14} style={{ color: 'var(--teal)' }} />}
                {otherStyleLabel[lang]}
              </button>
              {isOtherStyle && (
                <input
                  ref={inputRef}
                  type="text"
                  value={form.styleCustom}
                  onChange={e => setForm(f => ({ ...f, styleCustom: e.target.value }))}
                  onKeyDown={handleKeyDown}
                  placeholder={tr.styleOtherPh[lang]}
                  style={inputStyle}
                  onFocus={focusStyle}
                  onBlur={blurStyle}
                  autoFocus
                />
              )}
            </div>
          </div>
        );

      case 8: // Features
        return (
          <div className="flex flex-col gap-3">
            <label style={{ ...labelStyle, marginBottom: 4 }}>{tr.featuresLabel[lang]}</label>
            <div className="grid grid-cols-2 gap-2.5">
              {tr.features[lang].map(feat => {
                const isSelected = form.features.includes(feat);
                return (
                  <button key={feat} type="button" onClick={() => setForm(f => ({ ...f, features: isSelected ? f.features.filter(x => x !== feat) : [...f.features, feat] }))} style={chipStyle(isSelected)}>
                    {isSelected && <Check size={14} style={{ color: 'var(--teal)' }} />}{feat}
                  </button>
                );
              })}
            </div>
          </div>
        );

      case 9: // Inspiration
        return (
          <div className="flex flex-col gap-4">
            <label style={{ ...labelStyle, marginBottom: 4 }}>{tr.inspirationLabel[lang]}</label>
            <input ref={inputRef} value={form.inspiration1} onChange={e => setForm(f => ({ ...f, inspiration1: e.target.value }))} placeholder="https://example.com" onKeyDown={handleKeyDown} onFocus={focusStyle} onBlur={blurStyle} style={inputStyle} />
            <input value={form.inspiration2} onChange={e => setForm(f => ({ ...f, inspiration2: e.target.value }))} placeholder="https://example.com" onKeyDown={handleKeyDown} onFocus={focusStyle} onBlur={blurStyle} style={inputStyle} />
            <input value={form.inspiration3} onChange={e => setForm(f => ({ ...f, inspiration3: e.target.value }))} placeholder="https://example.com" onKeyDown={handleKeyDown} onFocus={focusStyle} onBlur={blurStyle} style={inputStyle} />
            <span style={{ fontFamily: 'var(--font-b)', fontSize: 12, color: 'var(--text-light)', fontStyle: 'italic' }}>{tr.inspirationHelper[lang]}</span>
          </div>
        );

      case 10: // Timeline
        return (
          <div className="flex flex-col gap-3">
            <label style={{ ...labelStyle, marginBottom: 4 }}>{tr.timelineLabel[lang]}</label>
            <div className="grid grid-cols-2 gap-2.5">
              {tr.timelines[lang].map(tl => {
                const isSelected = form.timeline === tl;
                return (
                  <button key={tl} type="button" onClick={() => setForm(f => ({ ...f, timeline: tl }))} style={chipStyle(isSelected)}>
                    {isSelected && <Check size={14} style={{ color: 'var(--teal)' }} />}{tl}
                  </button>
                );
              })}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[calc(100vw-48px)] sm:max-w-md mx-auto overflow-hidden"
        style={{
          background: 'var(--cream)',
          border: '1px solid var(--glass-border)',
          borderRadius: 'var(--r-xl)',
          padding: 0,
          boxShadow: '0 24px 80px rgba(0,0,0,0.12)',
        }}
      >
        <div style={{ padding: '28px 24px 24px' }}>
          <h2 style={{ fontFamily: 'var(--font-h)', fontSize: 'clamp(22px, 5vw, 28px)', color: 'var(--charcoal)', letterSpacing: -0.5, marginBottom: 24, lineHeight: 1.2 }}>
            {tr.steps[lang][step]}
          </h2>

          <div className="relative overflow-hidden" style={{ minHeight: stepMinHeight() }}>
            <div className={`transition-all duration-[280ms] ease-[cubic-bezier(.23,1,.32,1)] ${slideClass}`} style={{ width: '100%' }}>
              {renderStep()}
            </div>
          </div>

          <div className="flex items-center justify-center mt-8 gap-3">
            {step > 0 && (
              <button
                type="button"
                onClick={() => goTo(step - 1)}
                style={{ padding: '12px 20px', background: 'transparent', border: '1.5px solid var(--glass-border)', borderRadius: 'var(--pill)', color: 'var(--text-mid)', fontFamily: 'var(--font-b)', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--text-mid)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--glass-border)'}
              >
                <ArrowLeft size={14} /> {tr.prev[lang]}
              </button>
            )}

            {step < TOTAL_STEPS - 1 ? (
              <button
                type="button"
                onClick={() => goTo(step + 1)}
                disabled={!canProceed()}
                style={{ padding: '12px 28px', background: canProceed() ? 'var(--teal)' : 'var(--text-ghost)', color: '#fff', border: 'none', borderRadius: 'var(--pill)', fontFamily: 'var(--font-b)', fontSize: 13, fontWeight: 600, cursor: canProceed() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.3s', boxShadow: canProceed() ? '0 4px 20px var(--teal-glow)' : 'none' }}
                onMouseEnter={e => { if (canProceed()) { e.currentTarget.style.transform = 'scale(1.04) translateY(-1px)'; e.currentTarget.style.background = 'var(--teal-deep)'; } }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1) translateY(0)'; if (canProceed()) e.currentTarget.style.background = 'var(--teal)'; }}
              >
                {tr.next[lang]} <ArrowRight size={14} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading || !canProceed()}
                style={{ padding: '12px 28px', background: loading ? 'var(--text-light)' : 'var(--teal)', color: '#fff', border: 'none', borderRadius: 'var(--pill)', fontFamily: 'var(--font-b)', fontSize: 13, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.3s', boxShadow: '0 4px 20px var(--teal-glow)' }}
                onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform = 'scale(1.04) translateY(-1px)'; e.currentTarget.style.background = 'var(--teal-deep)'; } }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1) translateY(0)'; if (!loading) e.currentTarget.style.background = 'var(--teal)'; }}
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
