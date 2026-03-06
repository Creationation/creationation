import { useLang } from '@/hooks/useLang';
import t from '@/lib/translations';
import { projects, type ProjectColor } from '@/lib/projects';
import { useScrollReveal } from '@/hooks/useScrollReveal';

const colorMap: Record<ProjectColor, { glow: string; visBg: string }> = {
  teal: { glow: 'var(--teal)', visBg: 'linear-gradient(135deg, #dff5ef, #c8ece2)' },
  coral: { glow: 'var(--coral)', visBg: 'linear-gradient(135deg, #fde8e3, #f8d4cb)' },
  gold: { glow: 'var(--gold)', visBg: 'linear-gradient(135deg, #f5ecd8, #ede0c2)' },
  sky: { glow: 'var(--sky)', visBg: 'linear-gradient(135deg, #e2f0f9, #cee4f3)' },
  violet: { glow: 'var(--violet)', visBg: 'linear-gradient(135deg, #ece4f7, #ddd0f0)' },
};

const BrowserMockup = ({ url, featured }: { url: string; featured?: boolean }) => (
  <div
    className="relative z-[1] overflow-hidden"
    style={{
      width: featured ? '80%' : '72%', maxWidth: featured ? 520 : 420,
      borderRadius: 14,
      background: 'rgba(255,255,255,0.55)',
      backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
      border: '1px solid rgba(255,255,255,0.6)',
      boxShadow: '0 16px 48px rgba(0,0,0,0.08)',
      transform: 'perspective(600px) rotateY(-2deg) rotateX(2deg)',
      transition: 'transform 0.6s cubic-bezier(.23,1,.32,1)',
    }}
  >
    <div className="flex items-center gap-1.5 h-[30px] px-3" style={{ background: 'rgba(255,255,255,0.5)', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
      <span className="w-2 h-2 rounded-full" style={{ background: '#ff5f57' }} />
      <span className="w-2 h-2 rounded-full" style={{ background: '#febc2e' }} />
      <span className="w-2 h-2 rounded-full" style={{ background: '#28c840' }} />
      <span className="ml-3 px-3 py-0.5 rounded-lg text-[10px]" style={{ background: 'rgba(0,0,0,0.04)', fontFamily: 'var(--font-m)', color: 'var(--text-light)' }}>
        {url}
      </span>
    </div>
    <div className="p-4 flex flex-col gap-2" style={{ minHeight: featured ? 210 : 150 }}>
      <div className="rounded h-[7px]" style={{ width: '55%', background: 'rgba(0,0,0,0.05)' }} />
      <div className="rounded h-[7px]" style={{ width: '75%', background: 'rgba(0,0,0,0.05)' }} />
      <div className="rounded h-[7px]" style={{ width: '40%', background: 'rgba(0,0,0,0.05)' }} />
      <div className="mt-2 h-11 rounded-[10px]" style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.03)' }} />
      {featured && (
        <div className="flex gap-2 mt-1.5">
          <div className="w-11 h-11 rounded-[10px] shrink-0" style={{ background: 'rgba(0,0,0,0.03)' }} />
          <div className="w-11 h-11 rounded-[10px] shrink-0" style={{ background: 'rgba(0,0,0,0.03)' }} />
          <div className="w-11 h-11 rounded-[10px] shrink-0" style={{ background: 'rgba(0,0,0,0.03)' }} />
        </div>
      )}
    </div>
  </div>
);

const Portfolio = () => {
  const { lang } = useLang();
  const p = t.portfolio;
  const ref = useScrollReveal();

  return (
    <section id="portfolio" className="relative z-[1] max-w-[1400px] mx-auto px-7 md:px-16" style={{ padding: '80px 0 140px' }}>
      <div className="px-7 md:px-16">
        <div style={{ fontFamily: 'var(--font-m)', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--teal)', marginBottom: 16 }} className="flex items-center gap-2.5">
          <span className="w-7 h-0.5 rounded" style={{ background: 'var(--teal)' }} />
          {p.tag[lang]}
        </div>
        <h2 style={{ fontFamily: 'var(--font-h)', fontSize: 'clamp(34px, 4.5vw, 54px)', fontWeight: 400, lineHeight: 1.15, letterSpacing: -1, marginBottom: 14, color: 'var(--charcoal)' }}>
          {p.title[lang]}
        </h2>
        <p className="text-[17px] leading-relaxed max-w-[500px]" style={{ color: 'var(--text-mid)' }}>
          {p.sub[lang]}
        </p>

        <div ref={ref} className="grid grid-cols-1 lg:grid-cols-2 gap-[18px] mt-14">
          {projects.map((proj, i) => {
            const colors = colorMap[proj.color];
            return (
              <a
                key={proj.name}
                href={proj.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`rv group relative flex flex-col overflow-hidden no-underline text-inherit transition-all duration-[600ms] ${proj.featured ? 'lg:col-span-2 lg:flex-row' : ''}`}
                style={{
                  borderRadius: 'var(--r-xl)',
                  background: 'rgba(255,255,255,0.25)',
                  backdropFilter: 'blur(22px)', WebkitBackdropFilter: 'blur(22px)',
                  border: '1px solid rgba(255,255,255,0.45)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.5)',
                  transitionDelay: `${i * 0.08}s`,
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget;
                  el.style.transform = 'translateY(-6px)';
                  el.style.background = 'rgba(255,255,255,0.4)';
                  el.style.boxShadow = '0 24px 64px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.7)';
                  const brow = el.querySelector('.brow-mock') as HTMLElement;
                  if (brow) brow.style.transform = 'perspective(600px) rotateY(0) rotateX(0) scale(1.02)';
                  const glow = el.querySelector('.proj-glow') as HTMLElement;
                  if (glow) glow.style.opacity = '0.4';
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget;
                  el.style.transform = 'translateY(0)';
                  el.style.background = 'rgba(255,255,255,0.25)';
                  el.style.boxShadow = '0 8px 32px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.5)';
                  const brow = el.querySelector('.brow-mock') as HTMLElement;
                  if (brow) brow.style.transform = 'perspective(600px) rotateY(-2deg) rotateX(2deg)';
                  const glow = el.querySelector('.proj-glow') as HTMLElement;
                  if (glow) glow.style.opacity = '0.25';
                }}
              >
                {/* Glow orb */}
                <div className="proj-glow absolute w-[200px] h-[200px] rounded-full z-0 -top-[30px] -right-[30px] pointer-events-none transition-opacity duration-500" style={{ background: colors.glow, filter: 'blur(70px)', opacity: 0.25 }} />

                {/* Visual */}
                <div className={`relative flex items-center justify-center overflow-hidden ${proj.featured ? 'flex-[1.2]' : ''}`} style={{ minHeight: proj.featured ? 340 : 260 }}>
                  <div className="absolute inset-0 opacity-[0.35]" style={{ background: colors.visBg }} />
                  <div className="brow-mock relative z-[1] overflow-hidden" style={{
                    width: proj.featured ? '80%' : '72%', maxWidth: proj.featured ? 520 : 420,
                    borderRadius: 14,
                    background: 'rgba(255,255,255,0.55)',
                    backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
                    border: '1px solid rgba(255,255,255,0.6)',
                    boxShadow: '0 16px 48px rgba(0,0,0,0.08)',
                    transform: 'perspective(600px) rotateY(-2deg) rotateX(2deg)',
                    transition: 'transform 0.6s cubic-bezier(.23,1,.32,1)',
                  }}>
                    <div className="flex items-center gap-1.5 h-[30px] px-3" style={{ background: 'rgba(255,255,255,0.5)', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                      <span className="w-2 h-2 rounded-full" style={{ background: '#ff5f57' }} />
                      <span className="w-2 h-2 rounded-full" style={{ background: '#febc2e' }} />
                      <span className="w-2 h-2 rounded-full" style={{ background: '#28c840' }} />
                      <span className="ml-3 px-3 py-0.5 rounded-lg text-[10px]" style={{ background: 'rgba(0,0,0,0.04)', fontFamily: 'var(--font-m)', color: 'var(--text-light)' }}>
                        {proj.urlDisplay}
                      </span>
                    </div>
                    <div className="p-4 flex flex-col gap-2" style={{ minHeight: proj.featured ? 210 : 150 }}>
                      <div className="rounded h-[7px]" style={{ width: '55%', background: 'rgba(0,0,0,0.05)' }} />
                      <div className="rounded h-[7px]" style={{ width: '75%', background: 'rgba(0,0,0,0.05)' }} />
                      <div className="rounded h-[7px]" style={{ width: '40%', background: 'rgba(0,0,0,0.05)' }} />
                      <div className="mt-2 h-11 rounded-[10px]" style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.03)' }} />
                      {proj.featured && (
                        <div className="flex gap-2 mt-1.5">
                          {[1, 2, 3].map((n) => <div key={n} className="w-11 h-11 rounded-[10px] shrink-0" style={{ background: 'rgba(0,0,0,0.03)' }} />)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Info */}
                <div className={`relative z-[1] ${proj.featured ? 'flex-1 flex flex-col justify-center p-10' : 'p-7 pb-8'}`}>
                  {/* Badge */}
                  <div className="inline-flex items-center gap-1.5 w-fit mb-3.5" style={{
                    padding: '4px 14px', borderRadius: 'var(--pill)',
                    fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase',
                    background: 'rgba(255,255,255,0.4)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.5)',
                    color: proj.badge === 'live' ? 'var(--teal)' : 'var(--coral)',
                  }}>
                    {proj.badge === 'live' && <span className="w-[5px] h-[5px] rounded-full" style={{ background: 'var(--teal)', animation: 'pls 2s ease infinite' }} />}
                    {proj.badge === 'live' ? p.badgeLive[lang] : `◆ ${p.badgeDemo[lang]}`}
                  </div>

                  <div style={{ fontFamily: 'var(--font-m)', fontSize: 10, letterSpacing: 2.5, textTransform: 'uppercase', color: 'var(--text-ghost)', marginBottom: 8 }}>
                    {proj.category}
                  </div>
                  <h3 style={{ fontFamily: 'var(--font-h)', fontSize: proj.featured ? 30 : 24, color: 'var(--charcoal)', marginBottom: 10 }}>
                    {proj.name}
                  </h3>
                  <p className="text-sm leading-relaxed mb-[18px]" style={{ color: 'var(--text-mid)' }}>
                    {proj.desc[lang]}
                  </p>
                  <div className="flex flex-wrap gap-[7px] mb-[22px]">
                    {proj.tags.map((tag) => (
                      <span key={tag} style={{
                        fontSize: 11, fontWeight: 600, padding: '5px 14px', borderRadius: 'var(--pill)',
                        background: 'rgba(255,255,255,0.4)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
                        border: '1px solid rgba(255,255,255,0.45)', color: 'var(--text-mid)',
                      }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="inline-flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--teal)' }}>
                    {proj.featured ? p.discover[lang] : p.discoverShort[lang]}
                    <span className="inline-flex items-center justify-center w-[30px] h-[30px] rounded-full text-sm transition-all duration-400" style={{
                      background: 'rgba(13,138,111,0.08)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
                      border: '1px solid rgba(13,138,111,0.12)',
                    }}>
                      →
                    </span>
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Portfolio;
