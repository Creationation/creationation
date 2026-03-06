import { useLang } from '@/hooks/useLang';
import t from '@/lib/translations';
import { useScrollReveal } from '@/hooks/useScrollReveal';

const services = [
  { icon: '✦', tKey: 's1', colorVar: '--teal', glowBg: 'rgba(13,138,111,0.1)' },
  { icon: '◈', tKey: 's2', colorVar: '--coral', glowBg: 'rgba(232,115,90,0.15)' },
  { icon: '◎', tKey: 's3', colorVar: '--violet', glowBg: 'rgba(124,92,191,0.12)' },
  { icon: '▣', tKey: 's4', colorVar: '--gold', glowBg: 'rgba(212,165,90,0.12)' },
] as const;

const barColors = ['var(--teal)', 'var(--coral)', 'var(--violet)', 'var(--gold)'];

const Services = () => {
  const { lang } = useLang();
  const s = t.services;
  const ref = useScrollReveal();

  return (
    <section id="services" className="relative z-[1] max-w-[1400px] mx-auto px-7 md:px-16" style={{ padding: '140px 0 100px' }}>
      <div className="px-7 md:px-16">
        <div style={{ fontFamily: 'var(--font-m)', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--teal)', marginBottom: 16 }} className="flex items-center gap-2.5">
          <span className="w-7 h-0.5 rounded" style={{ background: 'var(--teal)' }} />
          {s.tag[lang]}
        </div>
        <h2 style={{ fontFamily: 'var(--font-h)', fontSize: 'clamp(34px, 4.5vw, 54px)', fontWeight: 400, lineHeight: 1.15, letterSpacing: -1, marginBottom: 14, color: 'var(--charcoal)' }}>
          {s.title[lang]}
        </h2>
        <div ref={ref} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-14">
          {services.map((svc, i) => {
            const titleKey = `${svc.tKey}t` as keyof typeof s;
            const descKey = `${svc.tKey}d` as keyof typeof s;
            return (
              <div
                key={i}
                className="rv group relative overflow-hidden transition-all duration-500"
                style={{
                  padding: '36px 28px', borderRadius: 'var(--r-lg)',
                  background: 'rgba(255,255,255,0.3)',
                  backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255,255,255,0.45)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.03), inset 0 1px 0 rgba(255,255,255,0.5)',
                  transitionDelay: `${i * 0.08}s`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.background = 'rgba(255,255,255,0.45)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.background = 'rgba(255,255,255,0.3)';
                }}
              >
                {/* Top bar on hover */}
                <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t opacity-0 group-hover:opacity-100 transition-opacity duration-400" style={{ background: barColors[i] }} />
                <div className="flex items-center justify-center mb-6" style={{
                  width: 50, height: 50, borderRadius: 14,
                  background: svc.glowBg, color: `var(${svc.colorVar})`, fontSize: 22,
                }}>
                  {svc.icon}
                </div>
                <h3 style={{ fontFamily: 'var(--font-h)', fontSize: 20, marginBottom: 10, color: 'var(--charcoal)' }}>
                  {(s[titleKey] as Record<string, string>)[lang]}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-mid)' }}>
                  {(s[descKey] as Record<string, string>)[lang]}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Services;
