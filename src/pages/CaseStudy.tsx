import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLang } from '@/hooks/useLang';
import { ArrowLeft, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import WhatsAppFloat from '@/components/WhatsAppFloat';

interface CaseStudyProject {
  id: string;
  name: string;
  slug: string;
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
  challenge_fr: string;
  challenge_en: string;
  challenge_de: string;
  solution_fr: string;
  solution_en: string;
  solution_de: string;
  results_fr: string;
  results_en: string;
  results_de: string;
  client_brief_fr: string;
  client_brief_en: string;
  client_brief_de: string;
  tech_stack: string[];
  gallery_urls: string[];
}

const t = {
  back: { fr: 'Retour au portfolio', en: 'Back to portfolio', de: 'Zurück zum Portfolio' },
  context: { fr: 'Contexte du projet', en: 'Project Context', de: 'Projektkontext' },
  challenge: { fr: 'Le défi', en: 'The Challenge', de: 'Die Herausforderung' },
  solution: { fr: 'Notre solution', en: 'Our Solution', de: 'Unsere Lösung' },
  results: { fr: 'Résultats', en: 'Results', de: 'Ergebnisse' },
  techStack: { fr: 'Stack technique', en: 'Tech Stack', de: 'Technologie-Stack' },
  gallery: { fr: 'Galerie', en: 'Gallery', de: 'Galerie' },
  visitSite: { fr: 'Visiter le site', en: 'Visit site', de: 'Website besuchen' },
  notFound: { fr: 'Projet introuvable', en: 'Project not found', de: 'Projekt nicht gefunden' },
};

const CaseStudy = () => {
  const { slug } = useParams<{ slug: string }>();
  const { lang } = useLang();
  const [project, setProject] = useState<CaseStudyProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [galleryIdx, setGalleryIdx] = useState(0);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('portfolio_projects')
        .select('*')
        .eq('slug', slug)
        .eq('visible', true)
        .maybeSingle();
      setProject(data as unknown as CaseStudyProject | null);
      setLoading(false);
    };
    fetch();
  }, [slug]);

  const l = (fr: string, en: string, de: string) => lang === 'en' ? en : lang === 'de' ? de : fr;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--cream)' }}>
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--teal)', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: 'var(--cream)' }}>
        <Nav />
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <h1 style={{ fontFamily: 'var(--font-h)', fontSize: 32, color: 'var(--charcoal)' }}>{t.notFound[lang]}</h1>
          <Link to="/#portfolio" className="text-sm font-semibold" style={{ color: 'var(--teal)' }}>
            ← {t.back[lang]}
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const desc = l(project.description_fr, project.description_en, project.description_de);
  const brief = l(project.client_brief_fr, project.client_brief_en, project.client_brief_de);
  const challenge = l(project.challenge_fr, project.challenge_en, project.challenge_de);
  const solution = l(project.solution_fr, project.solution_en, project.solution_de);
  const results = l(project.results_fr, project.results_en, project.results_de);
  const tags = lang === 'en' && project.tags_en?.length ? project.tags_en : lang === 'de' && project.tags_de?.length ? project.tags_de : project.tags;

  const hasGallery = project.gallery_urls && project.gallery_urls.length > 0;

  const Section = ({ title, content, icon }: { title: string; content: string; icon: string }) => {
    if (!content) return null;
    return (
      <div className="rounded-3xl p-8 md:p-10" style={{
        background: 'rgba(255,255,255,0.35)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.5)',
      }}>
        <div className="flex items-center gap-3 mb-5">
          <span className="text-2xl">{icon}</span>
          <h2 style={{ fontFamily: 'var(--font-h)', fontSize: 24, color: 'var(--charcoal)' }}>{title}</h2>
        </div>
        <div className="text-[15px] leading-relaxed whitespace-pre-line" style={{ color: 'var(--text-mid)' }}>
          {content}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--cream)', fontFamily: 'var(--font-b)' }}>
      <Nav />

      {/* Hero */}
      <div className="max-w-[1100px] mx-auto px-6 md:px-16 pt-32 pb-16">
        <Link to="/#portfolio" className="inline-flex items-center gap-2 text-sm font-semibold mb-8 transition-colors hover:opacity-80" style={{ color: 'var(--teal)' }}>
          <ArrowLeft size={16} /> {t.back[lang]}
        </Link>

        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-[10px] font-bold tracking-[2px] uppercase px-3 py-1 rounded-full" style={{
                background: project.badge === 'live' ? 'rgba(13,138,111,0.1)' : 'rgba(232,97,77,0.1)',
                color: project.badge === 'live' ? 'var(--teal)' : 'var(--coral)',
              }}>
                {project.badge === 'live' ? '● En production' : '◆ Démo'}
              </span>
              <span className="text-xs tracking-[2px] uppercase" style={{ color: 'var(--text-ghost)', fontFamily: 'var(--font-m)' }}>
                {project.category}
              </span>
            </div>
            <h1 style={{ fontFamily: 'var(--font-h)', fontSize: 'clamp(32px, 4vw, 52px)', color: 'var(--charcoal)', lineHeight: 1.15 }}>
              {project.name}
            </h1>
            <p className="text-[17px] leading-relaxed mt-4 max-w-[600px]" style={{ color: 'var(--text-mid)' }}>
              {desc}
            </p>
          </div>

          {project.url && (
            <a
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold text-white shrink-0 transition-all hover:scale-[1.03]"
              style={{ background: 'var(--teal)' }}
            >
              {t.visitSite[lang]} <ExternalLink size={15} />
            </a>
          )}
        </div>

        {/* Hero screenshot */}
        {project.screenshot_url && (
          <div className="rounded-3xl overflow-hidden mb-16" style={{
            background: 'rgba(255,255,255,0.3)',
            border: '1px solid rgba(255,255,255,0.5)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.06)',
          }}>
            <img src={project.screenshot_url} alt={project.name} className="w-full object-cover" />
          </div>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-12">
          {tags.map((tag) => (
            <span key={tag} className="text-xs font-semibold px-4 py-2 rounded-full" style={{
              background: 'rgba(255,255,255,0.4)',
              backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.5)',
              color: 'var(--text-mid)',
            }}>
              {tag}
            </span>
          ))}
        </div>

        {/* Content sections */}
        <div className="grid gap-6">
          <Section title={t.context[lang]} content={brief} icon="📋" />
          <Section title={t.challenge[lang]} content={challenge} icon="⚡" />
          <Section title={t.solution[lang]} content={solution} icon="🛠️" />
          <Section title={t.results[lang]} content={results} icon="📈" />
        </div>

        {/* Tech stack */}
        {project.tech_stack && project.tech_stack.length > 0 && (
          <div className="mt-10 rounded-3xl p-8 md:p-10" style={{
            background: 'rgba(255,255,255,0.35)',
            backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.5)',
          }}>
            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl">⚙️</span>
              <h2 style={{ fontFamily: 'var(--font-h)', fontSize: 24, color: 'var(--charcoal)' }}>{t.techStack[lang]}</h2>
            </div>
            <div className="flex flex-wrap gap-3">
              {project.tech_stack.map((tech) => (
                <span key={tech} className="px-5 py-2.5 rounded-full text-sm font-semibold" style={{
                  background: 'rgba(13,138,111,0.08)',
                  border: '1px solid rgba(13,138,111,0.15)',
                  color: 'var(--teal)',
                }}>
                  {tech}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Gallery */}
        {hasGallery && (
          <div className="mt-10">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl">🖼️</span>
              <h2 style={{ fontFamily: 'var(--font-h)', fontSize: 24, color: 'var(--charcoal)' }}>{t.gallery[lang]}</h2>
            </div>

            <div className="relative rounded-3xl overflow-hidden" style={{
              background: 'rgba(255,255,255,0.3)',
              border: '1px solid rgba(255,255,255,0.5)',
              boxShadow: '0 16px 48px rgba(0,0,0,0.06)',
            }}>
              <img
                src={project.gallery_urls[galleryIdx]}
                alt={`${project.name} - ${galleryIdx + 1}`}
                className="w-full object-cover"
                style={{ maxHeight: 600 }}
              />
              {project.gallery_urls.length > 1 && (
                <>
                  <button
                    onClick={() => setGalleryIdx((galleryIdx - 1 + project.gallery_urls.length) % project.gallery_urls.length)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110"
                    style={{ background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)' }}
                  >
                    <ChevronLeft size={20} style={{ color: 'var(--charcoal)' }} />
                  </button>
                  <button
                    onClick={() => setGalleryIdx((galleryIdx + 1) % project.gallery_urls.length)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110"
                    style={{ background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)' }}
                  >
                    <ChevronRight size={20} style={{ color: 'var(--charcoal)' }} />
                  </button>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {project.gallery_urls.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setGalleryIdx(i)}
                        className="w-2.5 h-2.5 rounded-full transition-all"
                        style={{
                          background: i === galleryIdx ? 'var(--teal)' : 'rgba(255,255,255,0.6)',
                          transform: i === galleryIdx ? 'scale(1.3)' : 'scale(1)',
                        }}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Thumbnails */}
            {project.gallery_urls.length > 1 && (
              <div className="flex gap-3 mt-4 overflow-x-auto pb-2">
                {project.gallery_urls.map((url, i) => (
                  <button
                    key={i}
                    onClick={() => setGalleryIdx(i)}
                    className="shrink-0 w-20 h-14 rounded-xl overflow-hidden transition-all"
                    style={{
                      border: i === galleryIdx ? '2px solid var(--teal)' : '2px solid transparent',
                      opacity: i === galleryIdx ? 1 : 0.6,
                    }}
                  >
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <Footer />
      <WhatsAppFloat />
    </div>
  );
};

export default CaseStudy;
