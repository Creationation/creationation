import { useLang } from '@/hooks/useLang';
import t from '@/lib/translations';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';

const FAQ = () => {
  const { lang } = useLang();
  const f = t.faq;
  const ref = useScrollReveal();

  const items = [
    { q: f.q1[lang], a: f.a1[lang] },
    { q: f.q2[lang], a: f.a2[lang] },
    { q: f.q3[lang], a: f.a3[lang] },
    { q: f.q4[lang], a: f.a4[lang] },
    { q: f.q5[lang], a: f.a5[lang] },
    { q: f.q6[lang], a: f.a6[lang] },
  ];

  return (
    <section className="relative z-[1] max-w-[800px] mx-auto px-7 md:px-16 py-24">
      <div ref={ref}>
        <div
          className="rv inline-flex items-center gap-2 w-fit mb-5"
          style={{
            padding: '6px 16px',
            borderRadius: 'var(--pill)',
            background: 'rgba(13,138,111,0.08)',
            border: '1px solid rgba(13,138,111,0.12)',
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--teal)',
            textTransform: 'uppercase',
            letterSpacing: 1.5,
          }}
        >
          {f.tag[lang]}
        </div>
        <h2
          className="rv"
          style={{
            fontFamily: 'var(--font-h)',
            fontSize: 'clamp(32px, 4vw, 48px)',
            color: 'var(--charcoal)',
            letterSpacing: -1,
            marginBottom: 40,
          }}
        >
          {f.title[lang]}
        </h2>

        <Accordion type="single" collapsible className="rv">
          {items.map((item, i) => (
            <AccordionItem
              key={i}
              value={`faq-${i}`}
              style={{
                borderColor: 'rgba(0,0,0,0.06)',
              }}
            >
              <AccordionTrigger
                className="text-left text-[15px] hover:no-underline"
                style={{
                  fontFamily: 'var(--font-b)',
                  fontWeight: 600,
                  color: 'var(--charcoal)',
                  padding: '20px 0',
                }}
              >
                {item.q}
              </AccordionTrigger>
              <AccordionContent
                style={{
                  color: 'var(--text-mid)',
                  lineHeight: 1.7,
                  fontSize: 14,
                }}
              >
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export default FAQ;
