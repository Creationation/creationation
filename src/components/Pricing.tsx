import { useLang } from '@/hooks/useLang';
import t from '@/lib/translations';
import { useScrollReveal } from '@/hooks/useScrollReveal';

const plans = [
  {
    tKey: 'starter',
    colorVar: '--teal',
    glowBg: 'rgba(13,138,111,0.08)',
    popular: true,
  },
  {
    tKey: 'business',
    colorVar: '--coral',
    glowBg: 'rgba(232,115,90,0.08)',
    popular: false,
  },
  {
    tKey: 'enterprise',
    colorVar: '--violet',
    glowBg: 'rgba(124,92,191,0.08)',
    popular: false,
  },
] as const;

const Pricing = () => {
  const { lang } = useLang();
  const p = t.pricing;
  const ref = useScrollReveal();

  return (
    <section id="pricing" className="relative z-[1] max-w-[1400px] mx-auto" style={{ padding: '120px 0 100px' }}>
      <div className="px-7 md:px-16">
        <div
          style={{
            fontFamily: 'var(--font-m)',
            fontSize: 11,
            letterSpacing: 2,
            textTransform: 'uppercase',
            color: 'var(--teal)',
            marginBottom: 16,
          }}
          className="flex items-center gap-2.5"
        >
          <span className="w-7 h-0.5 rounded" style={{ background: 'var(--teal)' }} />
          {p.tag[lang]}
        </div>
        <h2
          style={{
            fontFamily: 'var(--font-h)',
            fontSize: 'clamp(34px, 4.5vw, 54px)',
            fontWeight: 400,
            lineHeight: 1.15,
            letterSpacing: -1,
            marginBottom: 14,
            color: 'var(--charcoal)',
          }}
        >
          {p.title[lang]}
        </h2>
        <p className="text-base leading-relaxed max-w-xl" style={{ color: 'var(--text-mid)', marginBottom: 48 }}>
          {p.sub[lang]}
        </p>

        <div ref={ref} className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {plans.map((plan, i) => {
            const nameKey = `${plan.tKey}Name` as keyof typeof p;
            const priceKey = `${plan.tKey}Price` as keyof typeof p;
            const monthlyKey = `${plan.tKey}Monthly` as keyof typeof p;
            const f1Key = `${plan.tKey}F1` as keyof typeof p;
            const f2Key = `${plan.tKey}F2` as keyof typeof p;
            const f3Key = `${plan.tKey}F3` as keyof typeof p;
            const f4Key = `${plan.tKey}F4` as keyof typeof p;
            const f5Key = `${plan.tKey}F5` as keyof typeof p;

            const features = [f1Key, f2Key, f3Key, f4Key, f5Key]
              .map((k) => (p[k] as Record<string, string> | undefined)?.[lang])
              .filter(Boolean);

            return (
              <div
                key={i}
                className="rv group relative overflow-hidden flex flex-col transition-all duration-500"
                style={{
                  padding: '40px 32px',
                  borderRadius: 'var(--r-lg)',
                  background: plan.popular ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.3)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: plan.popular
                    ? '2px solid var(--teal)'
                    : '1px solid rgba(255,255,255,0.45)',
                  boxShadow: plan.popular
                    ? '0 8px 40px rgba(13,138,111,0.12), inset 0 1px 0 rgba(255,255,255,0.5)'
                    : '0 4px 20px rgba(0,0,0,0.03), inset 0 1px 0 rgba(255,255,255,0.5)',
                  transitionDelay: `${i * 0.08}s`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {plan.popular && (
                  <div
                    className="absolute top-4 right-4 text-xs font-semibold px-3 py-1"
                    style={{
                      background: 'var(--teal)',
                      color: '#fff',
                      borderRadius: 'var(--pill)',
                      fontFamily: 'var(--font-m)',
                      fontSize: 10,
                      letterSpacing: 1,
                      textTransform: 'uppercase',
                    }}
                  >
                    {p.popularBadge[lang]}
                  </div>
                )}

                <h3
                  style={{
                    fontFamily: 'var(--font-h)',
                    fontSize: 24,
                    color: 'var(--charcoal)',
                    marginBottom: 8,
                  }}
                >
                  {(p[nameKey] as Record<string, string>)[lang]}
                </h3>

                <div className="flex items-baseline gap-1 mb-1">
                  <span
                    style={{
                      fontFamily: 'var(--font-h)',
                      fontSize: 48,
                      color: `var(${plan.colorVar})`,
                      lineHeight: 1,
                    }}
                  >
                    {(p[priceKey] as Record<string, string>)[lang]}
                  </span>
                </div>
                <p
                  className="text-sm mb-6"
                  style={{ color: 'var(--text-mid)', fontFamily: 'var(--font-b)' }}
                >
                  {(p[monthlyKey] as Record<string, string>)[lang]}
                </p>

                <div
                  className="w-full h-px mb-6"
                  style={{ background: 'rgba(0,0,0,0.06)' }}
                />

                <ul className="flex flex-col gap-3 mb-8 flex-1">
                  {features.map((f, fi) => (
                    <li key={fi} className="flex items-start gap-2.5 text-sm" style={{ color: 'var(--text-mid)' }}>
                      <span
                        className="mt-0.5 flex-shrink-0"
                        style={{ color: `var(${plan.colorVar})`, fontSize: 14 }}
                      >
                        ✓
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
                  className="w-full cursor-pointer border-none text-sm font-semibold transition-all duration-300"
                  style={{
                    padding: '14px 0',
                    borderRadius: 'var(--pill)',
                    fontFamily: 'var(--font-b)',
                    background: plan.popular ? 'var(--teal)' : 'transparent',
                    color: plan.popular ? '#fff' : `var(${plan.colorVar})`,
                    border: plan.popular ? 'none' : `1.5px solid var(${plan.colorVar})`,
                    boxShadow: plan.popular ? '0 2px 16px var(--teal-glow)' : 'none',
                  }}
                  onMouseEnter={(e) => {
                    if (plan.popular) {
                      e.currentTarget.style.background = 'var(--teal-deep)';
                    } else {
                      e.currentTarget.style.background = plan.glowBg;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (plan.popular) {
                      e.currentTarget.style.background = 'var(--teal)';
                    } else {
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  {p.cta[lang]}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
