import { useLang } from '@/hooks/useLang';
import t from '@/lib/translations';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { useRef, useState, useEffect } from 'react';

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
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handleScroll = () => {
      const scrollLeft = el.scrollLeft;
      const cardWidth = el.scrollWidth / plans.length;
      setActiveIndex(Math.round(scrollLeft / cardWidth));
    };
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToCard = (index: number) => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = el.scrollWidth / plans.length;
    el.scrollTo({ left: cardWidth * index, behavior: 'smooth' });
  };

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
      </div>

      {/* Swipeable container */}
      <div ref={ref}>
      <div
        ref={scrollRef}
        className="flex gap-5 overflow-x-auto snap-x snap-mandatory scrollbar-hide px-7 md:px-16 pb-4"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <style>{`.scrollbar-hide::-webkit-scrollbar { display: none; }`}</style>
        {plans.map((plan, i) => {
          const nameKey = `${plan.tKey}Name` as keyof typeof p;
          const priceKey = `${plan.tKey}Price` as keyof typeof p;
          const monthlyKey = `${plan.tKey}Monthly` as keyof typeof p;

          const featureKeys = Array.from({ length: 7 }, (_, fi) => `${plan.tKey}F${fi + 1}` as keyof typeof p);
          const features = featureKeys
            .map((k) => (p[k] as Record<string, string> | undefined)?.[lang])
            .filter(Boolean);

          return (
            <div
              key={i}
              className="rv group relative overflow-hidden flex flex-col snap-center shrink-0 transition-all duration-500"
              className="rv group relative overflow-hidden flex flex-col snap-center shrink-0 transition-all duration-500"
              style={{
                width: 'min(340px, 82vw)',
                minWidth: 'min(340px, 82vw)',
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

      {/* Dots indicator (mobile) */}
      <div className="flex md:hidden justify-center gap-2 mt-6">
        {plans.map((_, i) => (
          <button
            key={i}
            onClick={() => scrollToCard(i)}
            className="border-none cursor-pointer transition-all duration-300"
            style={{
              width: activeIndex === i ? 24 : 8,
              height: 8,
              borderRadius: 'var(--pill)',
              background: activeIndex === i ? 'var(--teal)' : 'rgba(0,0,0,0.12)',
            }}
          />
        ))}
      </div>
    </section>
  );
};

export default Pricing;
