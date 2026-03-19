import { useLang } from '@/hooks/useLang';
import t from '@/lib/translations';
import { useScrollReveal } from '@/hooks/useScrollReveal';

const CtaSection = ({ onContact }: { onContact?: () => void }) => {
  const { lang } = useLang();
  const c = t.cta;
  const ref = useScrollReveal();

  return (
    <section id="contact" className="relative z-[1] text-center max-w-[1400px] mx-auto px-7 md:px-16" style={{ padding: '100px 0 120px' }}>
      {/* Radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(13,138,111,0.08), transparent 60%)', filter: 'blur(40px)' }} />
      <div ref={ref}>
        <h2 className="rv relative" style={{ fontFamily: 'var(--font-h)', fontSize: 'clamp(36px, 5vw, 58px)', marginBottom: 16, color: 'var(--charcoal)', letterSpacing: -1 }}>
          {c.title[lang]}
        </h2>
        <p className="rv relative text-[17px] mb-10" style={{ color: 'var(--text-mid)' }}>
          {c.sub[lang]}
        </p>
        <div className="rv relative">
          <button
            onClick={() => onContact?.()}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              padding: '20px 48px', background: 'var(--teal)', color: '#fff',
              fontFamily: 'var(--font-b)', fontSize: 16, fontWeight: 600,
              border: 'none', borderRadius: 'var(--pill)', cursor: 'pointer',
              transition: 'all 0.4s cubic-bezier(.23,1,.32,1)', boxShadow: '0 4px 24px var(--teal-glow)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.06) translateY(-3px)';
              e.currentTarget.style.boxShadow = '0 10px 40px var(--teal-glow)';
              e.currentTarget.style.background = 'var(--teal-deep)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1) translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 24px var(--teal-glow)';
              e.currentTarget.style.background = 'var(--teal)';
            }}
          >
            {c.btn[lang]}
          </button>
        </div>
      </div>
    </section>
  );
};

export default CtaSection;
