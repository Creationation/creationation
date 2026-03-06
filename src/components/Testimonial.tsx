import { useLang } from '@/hooks/useLang';
import t from '@/lib/translations';
import { useScrollReveal } from '@/hooks/useScrollReveal';

const Testimonial = () => {
  const { lang } = useLang();
  const tm = t.testimonial;
  const ref = useScrollReveal();

  return (
    <section className="relative z-[1] flex justify-center max-w-[1400px] mx-auto px-7 md:px-16" style={{ padding: '120px 0' }}>
      <div ref={ref}>
        <div className="rv max-w-[640px] text-center" style={{
          padding: 56, borderRadius: 'var(--r-xl)',
          background: 'rgba(255,255,255,0.32)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.5)',
          boxShadow: '0 12px 48px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.6)',
        }}>
          <div style={{ fontFamily: 'var(--font-h)', fontSize: 80, lineHeight: 1, color: 'var(--teal)', opacity: 0.2 }}>"</div>
          <p style={{ fontFamily: 'var(--font-h)', fontSize: 21, fontStyle: 'italic', lineHeight: 1.6, color: 'var(--charcoal)', margin: '16px 0 28px' }}>
            {tm.quote[lang]}
          </p>
          <div className="font-bold text-sm" style={{ color: 'var(--text)' }}>{tm.author[lang]}</div>
          <div className="text-[13px] mt-0.5" style={{ color: 'var(--text-light)' }}>{tm.role[lang]}</div>
        </div>
      </div>
    </section>
  );
};

export default Testimonial;
