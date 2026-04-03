import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '@/hooks/useLang';
import t from '@/lib/translations';
import { type ProjectColor } from '@/lib/projects';

import { supabase } from '@/integrations/supabase/client';
import { ChevronDown } from 'lucide-react';

const colorMap: Record<ProjectColor, { glow: string; visBg: string }> = {
  teal: { glow: 'var(--teal)', visBg: 'linear-gradient(135deg, #dff5ef, #c8ece2)' },
  coral: { glow: 'var(--coral)', visBg: 'linear-gradient(135deg, #fde8e3, #f8d4cb)' },
  gold: { glow: 'var(--gold)', visBg: 'linear-gradient(135deg, #f5ecd8, #ede0c2)' },
  sky: { glow: 'var(--sky)', visBg: 'linear-gradient(135deg, #e2f0f9, #cee4f3)' },
  violet: { glow: 'var(--violet)', visBg: 'linear-gradient(135deg, #ece4f7, #ddd0f0)' },
};

interface PortfolioProject {
  id: string;
  name: string;
  url: string;
  url_display: string;
  badge: string;
  category: string;
  color: string;
  description_fr: string;
  description_en: string;
  description_de: string;
  tags: string[];
  tags_en: string[];
  tags_de: string[];
  screenshot_url: string | null;
  video_url: string | null;
  featured: boolean;
  visible: boolean;
  position: number;
}

const INITIAL_COUNT = 3;

const Portfolio = () => {
  const { lang } = useLang();
  const p = t.portfolio;
  const [projects, setProjects] = useState<PortfolioProject[]>([]);
  const [expanded, setExpanded] = useState(false);
  const extraRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      const { data } = await supabase
        .from('portfolio_projects')
        .select('*')
        .eq('visible', true)
        .order('position', { ascending: true });
      if (data) setProjects(data as unknown as PortfolioProject[]);
    };
    fetchProjects();
  }, []);

  // Re-run scroll reveal after projects load
  useEffect(() => {
    const container = gridRef.current;
    if (!container || projects.length === 0) return;
    const els = container.querySelectorAll('.rv');
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('vis');
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -30px 0px' }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [projects, expanded]);

  const visibleProjects = expanded ? projects : projects.slice(0, INITIAL_COUNT);
  const hasMore = projects.length > INITIAL_COUNT;

  const getDesc = (proj: PortfolioProject) => {
    if (lang === 'en') return proj.description_en;
    if (lang === 'de') return proj.description_de;
    return proj.description_fr;
  };

  const handleToggle = () => {
    if (expanded) {
      // Scroll back to portfolio section before collapsing
      const section = document.getElementById('portfolio');
      if (section) section.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => setExpanded(false), 400);
    } else {
      setExpanded(true);
      // Scroll to newly revealed content
      setTimeout(() => {
        extraRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    }
  };

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

        <div ref={gridRef} className="grid grid-cols-1 lg:grid-cols-2 gap-[18px] mt-14">
          {visibleProjects.map((proj, i) => {
            const colors = colorMap[(proj.color as ProjectColor) || 'teal'];
            return (
              <a
                key={proj.id}
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
                  {proj.video_url ? (
                    <video
                      src={proj.video_url}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="brow-mock relative z-[1] overflow-hidden object-cover"
                      style={{
                        width: proj.featured ? '80%' : '72%', maxWidth: proj.featured ? 520 : 420,
                        borderRadius: 14,
                        boxShadow: '0 16px 48px rgba(0,0,0,0.08)',
                        transform: 'perspective(600px) rotateY(-2deg) rotateX(2deg)',
                        transition: 'transform 0.6s cubic-bezier(.23,1,.32,1)',
                      }}
                    />
                  ) : (
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
                          {proj.url_display}
                        </span>
                      </div>
                      <div className="overflow-hidden" style={{ minHeight: proj.featured ? 210 : 150 }}>
                        {proj.screenshot_url ? (
                          <img
                            src={proj.screenshot_url}
                            alt={proj.name}
                            className="w-full h-full object-cover object-top"
                            loading="lazy"
                            style={{ minHeight: proj.featured ? 210 : 150 }}
                          />
                        ) : (
                          <div className="p-4 flex flex-col gap-2" style={{ minHeight: proj.featured ? 210 : 150 }}>
                            <div className="rounded h-[7px]" style={{ width: '55%', background: 'rgba(0,0,0,0.05)' }} />
                            <div className="rounded h-[7px]" style={{ width: '75%', background: 'rgba(0,0,0,0.05)' }} />
                            <div className="rounded h-[7px]" style={{ width: '40%', background: 'rgba(0,0,0,0.05)' }} />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className={`relative z-[1] ${proj.featured ? 'flex-1 flex flex-col justify-center p-10' : 'p-7 pb-8'}`}>
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
                    {getDesc(proj)}
                  </p>
                  <div className="flex flex-wrap gap-[7px] mb-[22px]">
                    {(lang === 'en' && proj.tags_en?.length ? proj.tags_en : lang === 'de' && proj.tags_de?.length ? proj.tags_de : proj.tags).map((tag) => (
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

        {/* Extra ref for scroll target */}
        <div ref={extraRef} />

        {/* See more / less button */}
        {hasMore && (
          <div className="flex justify-center mt-10">
            <button
              onClick={handleToggle}
              className="group inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full text-sm font-semibold transition-all duration-300 hover:scale-[1.03] active:scale-[0.98]"
              style={{
                background: 'rgba(255,255,255,0.35)',
                backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
                border: '1px solid rgba(255,255,255,0.5)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                color: 'var(--teal)',
                fontFamily: 'var(--font-m)',
              }}
            >
              {expanded
                ? (lang === 'fr' ? 'Voir moins' : lang === 'de' ? 'Weniger anzeigen' : 'See less')
                : (lang === 'fr' ? `Voir les ${projects.length - INITIAL_COUNT} autres projets` : lang === 'de' ? `${projects.length - INITIAL_COUNT} weitere Projekte` : `See ${projects.length - INITIAL_COUNT} more projects`)}
              <ChevronDown
                size={18}
                className="transition-transform duration-300"
                style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
              />
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default Portfolio;
