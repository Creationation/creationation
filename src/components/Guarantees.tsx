import { useLang } from '@/hooks/useLang';
import t from '@/lib/translations';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { ShieldCheck, Clock, CreditCard, HeadphonesIcon } from 'lucide-react';

const icons = [ShieldCheck, Clock, CreditCard, HeadphonesIcon];

const Guarantees = () => {
  const { lang } = useLang();
  const g = t.guarantees;
  const ref = useScrollReveal();

  const items = [
    { icon: 0, title: g.g1t[lang], sub: g.g1d[lang] },
    { icon: 1, title: g.g2t[lang], sub: g.g2d[lang] },
    { icon: 2, title: g.g3t[lang], sub: g.g3d[lang] },
    { icon: 3, title: g.g4t[lang], sub: g.g4d[lang] },
  ];

  return (
    <section className="relative z-[1] max-w-[1400px] mx-auto px-7 md:px-16 py-16">
      <div ref={ref} className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {items.map((item, i) => {
          const Icon = icons[item.icon];
          return (
            <div
              key={i}
              className="flex flex-col items-center text-center gap-3 p-6 md:p-8 transition-transform duration-300 hover:scale-[1.03]"
              style={{
                borderRadius: 'var(--r-lg)',
                background: 'rgba(255,255,255,0.4)',
                backdropFilter: 'blur(18px)',
                WebkitBackdropFilter: 'blur(18px)',
                border: '1px solid rgba(255,255,255,0.55)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.03), inset 0 1px 0 rgba(255,255,255,0.5)',
              }}
            >
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center mb-1"
                style={{ background: 'rgba(13,138,111,0.1)' }}
              >
                <Icon size={20} style={{ color: 'var(--teal)' }} />
              </div>
              <span
                className="text-sm font-semibold"
                style={{ color: 'var(--charcoal)', fontFamily: 'var(--font-b)' }}
              >
                {item.title}
              </span>
              <span className="text-xs" style={{ color: 'var(--text-light)', lineHeight: 1.5 }}>
                {item.sub}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default Guarantees;
