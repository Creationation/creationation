import { useLang } from '@/hooks/useLang';
import { Mail, MapPin } from 'lucide-react';
import { useScrollReveal } from '@/hooks/useScrollReveal';

const translations = {
  tag: { fr: 'Contact', en: 'Contact', de: 'Kontakt' },
  title: { fr: 'Parlons de votre projet', en: 'Let\'s talk about your project', de: 'Lassen Sie uns über Ihr Projekt sprechen' },
  sub: { fr: 'Écrivez-nous par email ou envoyez un message sur WhatsApp. On vous répond dans les 24h.', en: 'Reach out by email or send a WhatsApp message. We reply within 24 hours.', de: 'Schreiben Sie uns per E-Mail oder senden Sie eine WhatsApp-Nachricht. Wir antworten innerhalb von 24 Stunden.' },
  whatsapp: { fr: 'Écrire sur WhatsApp', en: 'Message on WhatsApp', de: 'Nachricht auf WhatsApp' },
};

const ContactInfo = () => {
  const { lang } = useLang();
  const ref = useScrollReveal();

  return (
    <section className="relative z-[1] max-w-[1400px] mx-auto px-7 md:px-16 pb-20">
      <div ref={ref} className="glass rv" style={{ borderRadius: 20, padding: 'clamp(32px, 5vw, 56px)', textAlign: 'center' }}>
        <span
          className="inline-block text-xs uppercase tracking-widest mb-4"
          style={{ fontFamily: 'var(--font-b)', color: 'var(--teal)', fontWeight: 600, letterSpacing: 3 }}
        >
          {translations.tag[lang]}
        </span>
        <h2
          className="rv mb-3"
          style={{ fontFamily: 'var(--font-h)', fontSize: 'clamp(28px, 4vw, 44px)', color: 'var(--charcoal)', letterSpacing: -0.5 }}
        >
          {translations.title[lang]}
        </h2>
        <p className="rv mb-10 text-[15px] max-w-[500px] mx-auto" style={{ color: 'var(--text-mid)', fontFamily: 'var(--font-b)' }}>
          {translations.sub[lang]}
        </p>

        <div className="rv flex flex-col sm:flex-row items-center justify-center gap-5">
          <a
            href="mailto:hello@creationation.app"
            className="inline-flex items-center gap-3 px-7 py-4 transition-all duration-300 hover:scale-[1.03]"
            style={{
              fontFamily: 'var(--font-b)', fontSize: 15, fontWeight: 500,
              color: 'var(--charcoal)', background: 'rgba(255,255,255,0.6)',
              border: '1px solid rgba(0,0,0,0.08)', borderRadius: 'var(--pill)',
            }}
          >
            <Mail size={18} style={{ color: 'var(--teal)' }} />
            hello@creationation.app
          </a>

          <a
            href="https://wa.me/+436702022360"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-7 py-4 transition-all duration-300 hover:scale-[1.03]"
            style={{
              fontFamily: 'var(--font-b)', fontSize: 15, fontWeight: 600,
              color: '#fff', background: '#25D366', borderRadius: 'var(--pill)',
              boxShadow: '0 4px 20px rgba(37,211,102,0.25)',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            {translations.whatsapp[lang]}
          </a>
        </div>

        <div className="rv mt-8 flex items-center justify-center gap-2 text-xs" style={{ color: 'var(--text-ghost)', fontFamily: 'var(--font-b)' }}>
          <MapPin size={13} />
          Vienna, Austria
        </div>
      </div>
    </section>
  );
};

export default ContactInfo;
