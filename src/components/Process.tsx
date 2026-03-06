import { useLang } from '@/hooks/useLang';
import t from '@/lib/translations';
import { useScrollReveal } from '@/hooks/useScrollReveal';

const Process = () => {
  const { lang } = useLang();
  const p = t.process;
  const ref = useScrollReveal();

  const steps = [
    { num: '01', t: p.p1t[lang], d: p.p1d[lang] },
    { num: '02', t: p.p2t[lang], d: p.p2d[lang] },
    { num: '03', t: p.p3t[lang], d: p.p3d[lang] },
    { num: '04', t: p.p4t[lang], d: p.p4d[lang] },
  ];

  return (
    <section id="process" className="relative z-[1] max-w-[1400px] mx-auto px-7 md:px-16" style={{ padding: '100px 0 140px' }}>
      <div className="px-7 md:px-16">
        <div style={{ fontFamily: 'var(--font-m)', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--teal)', marginBottom: 16 }} className="flex items-center gap-2.5">
          <span className="w-7 h-0.5 rounded" style={{ background: 'var(--teal)' }} />
          {p.tag[lang]}
        </div>
        <h2 style={{ fontFamily: 'var(--font-h)', fontSize: 'clamp(34px, 4.5vw, 54px)', fontWeight: 400, lineHeight: 1.15, letterSpacing: -1, marginBottom: 14, color: 'var(--charcoal)' }}>
          {p.title[lang]}
        </h2>
        <div ref={ref} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-14">
          {steps.map((s, i) => (
            <div key={s.num} className="rv text-center transition-all duration-500" style={{
              padding: '36px 24px', borderRadius: 'var(--r-lg)',
              background: 'rgba(255,255,255,0.28)', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
              border: '1px solid rgba(255,255,255,0.45)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.03), inset 0 1px 0 rgba(255,255,255,0.5)',
              transitionDelay: `${i * 0.08}s`,
            }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.background = 'rgba(255,255,255,0.45)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.background = 'rgba(255,255,255,0.28)'; }}
            >
              <div style={{ fontFamily: 'var(--font-h)', fontSize: 48, color: 'var(--teal)', opacity: 0.2, lineHeight: 1, marginBottom: 16 }}>{s.num}</div>
              <h3 style={{ fontFamily: 'var(--font-h)', fontSize: 20, marginBottom: 10, color: 'var(--charcoal)' }}>{s.t}</h3>
              <p className="text-[13px] leading-relaxed" style={{ color: 'var(--text-mid)' }}>{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Process;
