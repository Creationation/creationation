import { useLang } from '@/hooks/useLang';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';

const translations = {
  tag: { fr: 'Témoignages', en: 'Testimonials', de: 'Kundenstimmen' },
  title: { fr: 'Ce que nos clients disent', en: 'What our clients say', de: 'Was unsere Kunden sagen' },
};

const Testimonial = () => {
  const { lang } = useLang();
  const ref = useScrollReveal();
  const [current, setCurrent] = useState(0);

  const { data: testimonials = [] } = useQuery({
    queryKey: ['testimonials-public'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .eq('is_visible', true)
        .order('position');
      if (error) throw error;
      return data;
    },
  });

  const filtered = testimonials.filter((t) => {
    const quoteKey = `quote_${lang}` as 'quote_fr' | 'quote_en' | 'quote_de';
    return t[quoteKey] && t[quoteKey].trim() !== '';
  });

  useEffect(() => {
    setCurrent(0);
  }, [lang]);

  if (filtered.length === 0) return null;

  const prev = () => setCurrent((c) => (c - 1 + filtered.length) % filtered.length);
  const next = () => setCurrent((c) => (c + 1) % filtered.length);

  const quoteKey = `quote_${lang}` as 'quote_fr' | 'quote_en' | 'quote_de';

  return (
    <section className="relative z-[1] max-w-[1400px] mx-auto px-7 md:px-16" style={{ padding: '80px 0 120px' }}>
      <div ref={ref} className="text-center mb-12">
        <span
          className="rv inline-block text-xs uppercase tracking-widest mb-4"
          style={{ fontFamily: 'var(--font-b)', color: 'var(--teal)', fontWeight: 600, letterSpacing: 3 }}
        >
          {translations.tag[lang]}
        </span>
        <h2 className="rv" style={{ fontFamily: 'var(--font-h)', fontSize: 'clamp(28px, 4vw, 44px)', color: 'var(--charcoal)', letterSpacing: -0.5 }}>
          {translations.title[lang]}
        </h2>
      </div>

      <div className="relative flex items-center justify-center gap-4">
        {filtered.length > 1 && (
          <button
            onClick={prev}
            className="hidden md:flex shrink-0 w-10 h-10 items-center justify-center rounded-full transition-all hover:scale-110"
            style={{ background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(0,0,0,0.06)' }}
          >
            <ChevronLeft size={18} style={{ color: 'var(--text-mid)' }} />
          </button>
        )}

        <div className="max-w-[640px] w-full">
          {filtered.map((t, i) => (
            <div
              key={t.id}
              className="rv text-center transition-all duration-500"
              style={{
                display: i === current ? 'block' : 'none',
                padding: 'clamp(32px, 5vw, 56px)',
                borderRadius: 'var(--r-xl)',
                background: 'rgba(255,255,255,0.32)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                border: '1px solid rgba(255,255,255,0.5)',
                boxShadow: '0 12px 48px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.6)',
              }}
            >
              {/* Avatar */}
              <div className="flex justify-center mb-5">
                {t.photo_url ? (
                  <img
                    src={t.photo_url}
                    alt={t.name}
                    className="w-16 h-16 rounded-full object-cover"
                    style={{ border: '3px solid rgba(255,255,255,0.8)' }}
                  />
                ) : (
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold"
                    style={{
                      background: 'linear-gradient(135deg, var(--teal), var(--teal-deep))',
                      color: '#fff',
                      fontFamily: 'var(--font-a)',
                    }}
                  >
                    {t.name.charAt(0)}
                  </div>
                )}
              </div>

              {/* Stars */}
              <div className="flex justify-center gap-0.5 mb-5">
                {Array.from({ length: 5 }).map((_, s) => (
                  <Star
                    key={s}
                    size={16}
                    fill={s < t.rating ? '#f59e0b' : 'transparent'}
                    stroke={s < t.rating ? '#f59e0b' : '#d1d5db'}
                    strokeWidth={1.5}
                  />
                ))}
              </div>

              {/* Quote */}
              <p
                style={{
                  fontFamily: 'var(--font-h)',
                  fontSize: 'clamp(17px, 2.5vw, 21px)',
                  fontStyle: 'italic',
                  lineHeight: 1.6,
                  color: 'var(--charcoal)',
                  margin: '0 0 24px',
                }}
              >
                "{t[quoteKey]}"
              </p>

              {/* Author */}
              <div className="font-bold text-sm" style={{ color: 'var(--text)', fontFamily: 'var(--font-b)' }}>
                {t.name}
              </div>
              <div className="text-[13px] mt-0.5" style={{ color: 'var(--text-light)', fontFamily: 'var(--font-b)' }}>
                {[t.role, t.business].filter(Boolean).join(', ')}
              </div>

              {/* Logo */}
              {t.logo_url && (
                <img src={t.logo_url} alt={t.business || ''} className="h-6 mx-auto mt-4 opacity-40" />
              )}
            </div>
          ))}
        </div>

        {filtered.length > 1 && (
          <button
            onClick={next}
            className="hidden md:flex shrink-0 w-10 h-10 items-center justify-center rounded-full transition-all hover:scale-110"
            style={{ background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(0,0,0,0.06)' }}
          >
            <ChevronRight size={18} style={{ color: 'var(--text-mid)' }} />
          </button>
        )}
      </div>

      {/* Dots */}
      {filtered.length > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {filtered.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className="w-2 h-2 rounded-full transition-all duration-300"
              style={{
                background: i === current ? 'var(--teal)' : 'rgba(0,0,0,0.12)',
                transform: i === current ? 'scale(1.3)' : 'scale(1)',
              }}
            />
          ))}
        </div>
      )}

      {/* Mobile swipe arrows */}
      {filtered.length > 1 && (
        <div className="flex md:hidden justify-center gap-3 mt-4">
          <button onClick={prev} className="p-2 rounded-full" style={{ background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(0,0,0,0.06)' }}>
            <ChevronLeft size={18} style={{ color: 'var(--text-mid)' }} />
          </button>
          <button onClick={next} className="p-2 rounded-full" style={{ background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(0,0,0,0.06)' }}>
            <ChevronRight size={18} style={{ color: 'var(--text-mid)' }} />
          </button>
        </div>
      )}
    </section>
  );
};

export default Testimonial;
