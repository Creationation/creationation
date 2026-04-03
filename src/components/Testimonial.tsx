import { useEffect, useState, useCallback } from 'react';
import { useLang } from '@/hooks/useLang';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { supabase } from '@/integrations/supabase/client';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import type { Lang } from '@/lib/translations';

interface Testimonial {
  id: string;
  name: string;
  role: string | null;
  business: string | null;
  photo_url: string | null;
  logo_url: string | null;
  rating: number;
  quote_fr: string;
  quote_en: string;
  quote_de: string;
}

const sectionTitle: Record<Lang, string> = {
  fr: 'Ce que disent nos clients',
  en: 'What our clients say',
  de: 'Was unsere Kunden sagen',
};

const Testimonial = () => {
  const { lang } = useLang();
  const ref = useScrollReveal();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('testimonials')
        .select('*')
        .eq('is_visible', true)
        .order('position');
      if (data && data.length > 0) setTestimonials(data);
      setLoading(false);
    };
    fetch();
  }, []);

  const next = useCallback(() => {
    setCurrent(c => (c + 1) % testimonials.length);
  }, [testimonials.length]);

  const prev = useCallback(() => {
    setCurrent(c => (c - 1 + testimonials.length) % testimonials.length);
  }, [testimonials.length]);

  // Auto-advance every 6s
  useEffect(() => {
    if (testimonials.length <= 1) return;
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [next, testimonials.length]);

  if (loading || testimonials.length === 0) return null;

  const t = testimonials[current];
  const quote = lang === 'fr' ? t.quote_fr : lang === 'de' ? t.quote_de : t.quote_en;

  return (
    <section className="relative z-[1] py-20 md:py-28">
      <div ref={ref} className="max-w-[1400px] mx-auto px-7 md:px-16">
        <h2 className="rv text-center mb-12" style={{
          fontFamily: 'var(--font-h)',
          fontSize: 'clamp(28px, 4vw, 42px)',
          color: 'var(--charcoal)',
        }}>
          {sectionTitle[lang]}
        </h2>

        <div className="rv relative max-w-[720px] mx-auto">
          {/* Card */}
          <div className="glass text-center" style={{
            padding: 'clamp(32px, 5vw, 56px)',
            borderRadius: 'var(--r-xl)',
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* Decorative quote */}
            <Quote
              className="mx-auto mb-4"
              size={40}
              style={{ color: 'var(--teal)', opacity: 0.2 }}
            />

            {/* Stars */}
            <div className="flex justify-center gap-1 mb-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={18}
                  fill={i < t.rating ? 'var(--teal)' : 'transparent'}
                  stroke={i < t.rating ? 'var(--teal)' : 'var(--text-ghost)'}
                  strokeWidth={1.5}
                />
              ))}
            </div>

            {/* Quote text */}
            <p
              key={t.id}
              className="animate-fade-in"
              style={{
                fontFamily: 'var(--font-h)',
                fontSize: 'clamp(17px, 2.5vw, 21px)',
                fontStyle: 'italic',
                lineHeight: 1.65,
                color: 'var(--charcoal)',
                margin: '0 0 28px',
              }}
            >
              "{quote}"
            </p>

            {/* Author */}
            <div className="flex items-center justify-center gap-3">
              {t.photo_url ? (
                <img
                  src={t.photo_url}
                  alt={t.name}
                  className="w-11 h-11 rounded-full object-cover"
                  style={{ border: '2px solid rgba(255,255,255,0.6)' }}
                />
              ) : (
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{
                    background: 'var(--teal)',
                    color: '#fff',
                    fontSize: 16,
                  }}
                >
                  {t.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="text-left">
                <div className="font-bold text-sm" style={{ color: 'var(--text)' }}>
                  {t.name}
                </div>
                {(t.role || t.business) && (
                  <div className="text-[13px] mt-0.5" style={{ color: 'var(--text-light)' }}>
                    {[t.role, t.business].filter(Boolean).join(' · ')}
                  </div>
                )}
              </div>
              {t.logo_url && (
                <img
                  src={t.logo_url}
                  alt={t.business || ''}
                  className="h-7 ml-3 opacity-60"
                />
              )}
            </div>
          </div>

          {/* Navigation arrows */}
          {testimonials.length > 1 && (
            <>
              <button
                onClick={prev}
                className="absolute top-1/2 -translate-y-1/2 -left-4 md:-left-14 w-9 h-9 rounded-full glass flex items-center justify-center hover:scale-110 transition-transform"
                aria-label="Previous"
              >
                <ChevronLeft size={18} style={{ color: 'var(--charcoal)' }} />
              </button>
              <button
                onClick={next}
                className="absolute top-1/2 -translate-y-1/2 -right-4 md:-right-14 w-9 h-9 rounded-full glass flex items-center justify-center hover:scale-110 transition-transform"
                aria-label="Next"
              >
                <ChevronRight size={18} style={{ color: 'var(--charcoal)' }} />
              </button>
            </>
          )}

          {/* Dots */}
          {testimonials.length > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className="w-2.5 h-2.5 rounded-full transition-all duration-300"
                  style={{
                    background: i === current ? 'var(--teal)' : 'rgba(0,0,0,0.12)',
                    transform: i === current ? 'scale(1.3)' : 'scale(1)',
                  }}
                  aria-label={`Testimonial ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Testimonial;
