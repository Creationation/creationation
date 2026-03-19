import { useLang } from '@/hooks/useLang';
import t from '@/lib/translations';
import { useCountUp } from '@/hooks/useCountUp';

const Hero = ({ onContact }: { onContact?: () => void }) => {
  const { lang } = useLang();
  const h = t.hero;

  const c1 = useCountUp(8);
  const c2 = useCountUp(500);
  const c3 = useCountUp(5);

  const stats = [
    { ref: c1.ref, display: `${c1.count}+`, label: h.stat1[lang] },
    { ref: c2.ref, display: `${c2.count}+`, label: h.stat2[lang] },
    { ref: c3.ref, display: `${c3.count}`, label: h.stat3[lang] },
    { ref: null, display: h.stat4Num[lang], label: h.stat4[lang] },
  ];

  return (
    <section className="relative z-[1] min-h-screen flex flex-col justify-center px-7 md:px-16 max-w-[1400px] mx-auto" style={{ paddingTop: 160, paddingBottom: 100 }}>
      {/* Badge */}
      <div
        className="inline-flex items-center gap-2 w-fit mb-9"
        style={{
          padding: '8px 20px', borderRadius: 'var(--pill)',
          background: 'rgba(13,138,111,0.08)',
          backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(13,138,111,0.12)',
          fontSize: 13, fontWeight: 600, color: 'var(--teal)',
          opacity: 0, animation: 'fadeUp 0.7s ease 0.2s forwards',
        }}
      >
        <span className="w-[7px] h-[7px] rounded-full" style={{ background: 'var(--teal)', animation: 'pls 2.5s ease infinite' }} />
        {h.badge[lang]}
      </div>

      {/* H1 */}
      <h1
        style={{
          fontFamily: 'var(--font-h)', fontSize: 'clamp(46px, 7vw, 88px)', fontWeight: 400,
          lineHeight: 1.08, letterSpacing: -2, color: 'var(--charcoal)',
          marginBottom: 28, maxWidth: 880, opacity: 0, animation: 'fadeUp 0.8s ease 0.35s forwards',
        }}
      >
        {h.title1[lang]}<span style={{ color: 'var(--teal)', fontStyle: 'italic' }}>{h.titleHighlight[lang]}</span>
      </h1>

      {/* Sub */}
      <p
        style={{
          fontSize: 19, fontWeight: 400, color: 'var(--text-mid)', maxWidth: 520,
          lineHeight: 1.7, marginBottom: 44, opacity: 0, animation: 'fadeUp 0.8s ease 0.5s forwards',
        }}
      >
        {h.sub[lang]}
      </p>

      {/* Buttons */}
      <div className="flex gap-3.5 flex-wrap mb-[72px]" style={{ opacity: 0, animation: 'fadeUp 0.8s ease 0.65s forwards' }}>
        <a
          href="#portfolio"
          className="btn-main group"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            padding: '16px 36px', background: 'var(--teal)', color: '#fff',
            fontFamily: 'var(--font-b)', fontSize: 15, fontWeight: 600,
            border: 'none', borderRadius: 'var(--pill)', textDecoration: 'none',
            transition: 'all 0.4s cubic-bezier(.23,1,.32,1)', boxShadow: '0 4px 24px var(--teal-glow)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.06) translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 32px var(--teal-glow)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1) translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 24px var(--teal-glow)';
          }}
        >
          {h.btn1[lang]}
        </a>
        <a
          href="#contact"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            padding: '16px 36px',
            background: 'rgba(255,255,255,0.35)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.5)',
            color: 'var(--text)', fontFamily: 'var(--font-b)', fontSize: 15, fontWeight: 600,
            borderRadius: 'var(--pill)', textDecoration: 'none',
            transition: 'all 0.4s cubic-bezier(.23,1,.32,1)', boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.06) translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,0,0,0.08)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1) translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.03)';
          }}
        >
          {h.btn2[lang]}
        </a>
      </div>

      {/* Stats */}
      <div className="flex gap-3 flex-wrap" style={{ opacity: 0, animation: 'fadeUp 0.8s ease 0.8s forwards' }}>
        {stats.map((s, i) => (
          <div key={i} className="flex items-center gap-3.5" style={{
            padding: '18px 26px', borderRadius: 'var(--r-lg)',
            background: 'rgba(255,255,255,0.35)',
            backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
            border: '1px solid rgba(255,255,255,0.55)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.03), inset 0 1px 0 rgba(255,255,255,0.5)',
          }}>
            <span ref={s.ref} style={{ fontFamily: 'var(--font-h)', fontSize: 30, color: 'var(--teal)', lineHeight: 1 }}>{s.display}</span>
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-light)' }}>{s.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Hero;
