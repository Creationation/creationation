import { useLang } from '@/hooks/useLang';
import { Link } from 'react-router-dom';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { Heart, Zap, Shield, Users, ArrowRight } from 'lucide-react';
import Footer from '@/components/Footer';
import WhatsAppFloat from '@/components/WhatsAppFloat';
import Nav from '@/components/Nav';
import Blobs from '@/components/Blobs';

const content = {
  en: {
    back: '← Back to home',
    storyTag: 'Our Story',
    storyTitle: 'Why Creationation Exists',
    storyP1: 'We started Creationation because we saw a gap in the market. Too many local businesses were stuck with outdated websites or paying premium prices for cookie-cutter solutions that didn\'t reflect who they really are.',
    storyP2: 'Based in Vienna, we set out to build a studio that combines world-class design with practical, results-driven development. Every project we take on is treated as a partnership. We don\'t just build apps, we help businesses grow.',
    storyP3: 'Today, we work with ambitious businesses across Europe, delivering custom web and mobile applications that look stunning and actually perform.',
    founderTag: 'The Team',
    founderName: 'Creationation Team',
    founderRole: 'Vienna, Austria',
    founderBio: 'A small, focused team of designers and developers passionate about crafting digital experiences that make a real difference for local businesses. We believe that great design and smart technology should be accessible to everyone, not just big corporations.',
    valuesTag: 'Our Values',
    valuesTitle: 'What drives us every day',
    values: [
      { icon: 'heart', title: 'Craft Over Speed', desc: 'We take the time to get every detail right. No templates, no shortcuts. Each project is handcrafted to match your vision.' },
      { icon: 'zap', title: 'Results First', desc: 'Beautiful design means nothing without performance. We measure success by the impact our work has on your business.' },
      { icon: 'shield', title: 'Radical Transparency', desc: 'No hidden fees, no surprise invoices. You know exactly what you\'re getting, what it costs, and when it\'ll be ready.' },
      { icon: 'users', title: 'Long-Term Partnership', desc: 'We don\'t disappear after launch. Ongoing support, monthly insights, and continuous improvements are part of the deal.' },
    ],
    timelineTag: 'Milestones',
    timelineTitle: 'The journey so far',
    timeline: [
      { year: '2024', title: 'The Spark', desc: 'First projects launched for local businesses in Vienna. The idea of Creationation takes shape.' },
      { year: '2025', title: 'Going International', desc: 'Expanding across Austria, France, and Switzerland. Building our CRM, portal, and prospecting engine.' },
      { year: '2026', title: 'Scaling Up', desc: 'Full product studio with web apps, mobile apps, and SaaS platforms. Serving clients across Europe.' },
    ],
  },
  fr: {
    back: '← Retour à l\'accueil',
    storyTag: 'Notre Histoire',
    storyTitle: 'Pourquoi Creationation existe',
    storyP1: 'Nous avons créé Creationation parce que nous avons vu un vide sur le marché. Trop d\'entreprises locales étaient coincées avec des sites obsolètes ou payaient des prix excessifs pour des solutions génériques qui ne reflétaient pas leur identité.',
    storyP2: 'Basés à Vienne, nous avons fondé un studio qui combine un design de classe mondiale avec un développement pratique et orienté résultats. Chaque projet que nous prenons est traité comme un partenariat. Nous ne construisons pas juste des apps, nous aidons les entreprises à grandir.',
    storyP3: 'Aujourd\'hui, nous travaillons avec des entreprises ambitieuses à travers l\'Europe, livrant des applications web et mobiles sur-mesure qui sont aussi belles que performantes.',
    founderTag: 'L\'Équipe',
    founderName: 'Équipe Creationation',
    founderRole: 'Vienne, Autriche',
    founderBio: 'Une équipe réduite et concentrée de designers et développeurs passionnés par la création d\'expériences digitales qui font une vraie différence pour les entreprises locales. Nous croyons que le grand design et la technologie intelligente devraient être accessibles à tous, pas seulement aux grandes entreprises.',
    valuesTag: 'Nos Valeurs',
    valuesTitle: 'Ce qui nous anime chaque jour',
    values: [
      { icon: 'heart', title: 'L\'Art avant la Vitesse', desc: 'On prend le temps de soigner chaque détail. Pas de templates, pas de raccourcis. Chaque projet est façonné à la main pour correspondre à votre vision.' },
      { icon: 'zap', title: 'Les Résultats d\'abord', desc: 'Un beau design ne vaut rien sans performance. On mesure notre succès par l\'impact de notre travail sur votre business.' },
      { icon: 'shield', title: 'Transparence Totale', desc: 'Pas de frais cachés, pas de factures surprises. Vous savez exactement ce que vous obtenez, combien ça coûte et quand ce sera prêt.' },
      { icon: 'users', title: 'Partenariat Long Terme', desc: 'On ne disparaît pas après le lancement. Support continu, insights mensuels et améliorations constantes font partie du deal.' },
    ],
    timelineTag: 'Jalons',
    timelineTitle: 'Le chemin parcouru',
    timeline: [
      { year: '2024', title: 'L\'Étincelle', desc: 'Premiers projets lancés pour des entreprises locales à Vienne. L\'idée de Creationation prend forme.' },
      { year: '2025', title: 'L\'International', desc: 'Expansion en Autriche, France et Suisse. Construction de notre CRM, portail client et moteur de prospection.' },
      { year: '2026', title: 'La Croissance', desc: 'Studio produit complet avec web apps, apps mobiles et plateformes SaaS. Des clients à travers toute l\'Europe.' },
    ],
  },
  de: {
    back: '← Zurück zur Startseite',
    storyTag: 'Unsere Geschichte',
    storyTitle: 'Warum es Creationation gibt',
    storyP1: 'Wir haben Creationation gegründet, weil wir eine Lücke im Markt gesehen haben. Zu viele lokale Unternehmen steckten mit veralteten Websites fest oder zahlten Premiumpreise für Standardlösungen, die nicht widerspiegelten, wer sie wirklich sind.',
    storyP2: 'Von Wien aus haben wir ein Studio aufgebaut, das erstklassiges Design mit praxisorientierter, ergebnisorientierter Entwicklung verbindet. Jedes Projekt, das wir übernehmen, wird als Partnerschaft behandelt. Wir bauen nicht nur Apps, wir helfen Unternehmen zu wachsen.',
    storyP3: 'Heute arbeiten wir mit ambitionierten Unternehmen in ganz Europa und liefern maßgeschneiderte Web- und Mobile-Anwendungen, die großartig aussehen und tatsächlich performen.',
    founderTag: 'Das Team',
    founderName: 'Creationation Team',
    founderRole: 'Wien, Österreich',
    founderBio: 'Ein kleines, fokussiertes Team aus Designern und Entwicklern mit Leidenschaft für die Gestaltung digitaler Erlebnisse, die für lokale Unternehmen einen echten Unterschied machen. Wir glauben, dass großartiges Design und intelligente Technologie für alle zugänglich sein sollten, nicht nur für große Konzerne.',
    valuesTag: 'Unsere Werte',
    valuesTitle: 'Was uns jeden Tag antreibt',
    values: [
      { icon: 'heart', title: 'Handwerk vor Geschwindigkeit', desc: 'Wir nehmen uns die Zeit, jedes Detail richtig zu machen. Keine Templates, keine Abkürzungen. Jedes Projekt wird handgefertigt, um Ihrer Vision zu entsprechen.' },
      { icon: 'zap', title: 'Ergebnisse zuerst', desc: 'Schönes Design bedeutet nichts ohne Performance. Wir messen unseren Erfolg am Einfluss unserer Arbeit auf Ihr Geschäft.' },
      { icon: 'shield', title: 'Radikale Transparenz', desc: 'Keine versteckten Gebühren, keine Überraschungsrechnungen. Sie wissen genau, was Sie bekommen, was es kostet und wann es fertig ist.' },
      { icon: 'users', title: 'Langfristige Partnerschaft', desc: 'Wir verschwinden nicht nach dem Launch. Fortlaufender Support, monatliche Einblicke und kontinuierliche Verbesserungen gehören zum Paket.' },
    ],
    timelineTag: 'Meilensteine',
    timelineTitle: 'Der bisherige Weg',
    timeline: [
      { year: '2024', title: 'Der Funke', desc: 'Erste Projekte für lokale Unternehmen in Wien gestartet. Die Idee von Creationation nimmt Gestalt an.' },
      { year: '2025', title: 'International', desc: 'Expansion nach Österreich, Frankreich und die Schweiz. Aufbau unseres CRM, Kundenportals und Prospecting-Systems.' },
      { year: '2026', title: 'Das Wachstum', desc: 'Komplettes Produktstudio mit Web-Apps, Mobile-Apps und SaaS-Plattformen. Kunden in ganz Europa.' },
    ],
  },
};

const iconMap: Record<string, typeof Heart> = { heart: Heart, zap: Zap, shield: Shield, users: Users };

const About = () => {
  const { lang } = useLang();
  const c = content[lang];
  const ref1 = useScrollReveal();
  const ref2 = useScrollReveal();
  const ref3 = useScrollReveal();
  const ref4 = useScrollReveal();

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--cream)', color: 'var(--text-main)' }}>
      <Blobs />
      <Nav />

      <div className="flex-1 relative z-[1]">
        {/* Hero / Brand Story */}
        <section className="max-w-[800px] mx-auto px-7 md:px-16 pt-28 pb-16">
          <Link
            to="/"
            className="inline-block mb-10 text-sm hover:opacity-70 transition-opacity"
            style={{ color: 'var(--text-light)', fontFamily: 'var(--font-b)' }}
          >
            {c.back}
          </Link>
          <div ref={ref1}>
            <span
              className="rv inline-block text-xs uppercase tracking-widest mb-4"
              style={{ fontFamily: 'var(--font-b)', color: 'var(--teal)', fontWeight: 600, letterSpacing: 3 }}
            >
              {c.storyTag}
            </span>
            <h1 className="rv text-3xl md:text-5xl mb-8" style={{ fontFamily: 'var(--font-h)', letterSpacing: -1, color: 'var(--charcoal)' }}>
              {c.storyTitle}
            </h1>
            <div className="rv space-y-5" style={{ fontFamily: 'var(--font-b)', color: 'var(--text-light)', lineHeight: 1.8, fontSize: 16 }}>
              <p>{c.storyP1}</p>
              <p>{c.storyP2}</p>
              <p>{c.storyP3}</p>
            </div>
          </div>
        </section>

        {/* Founder / Team */}
        <section className="max-w-[800px] mx-auto px-7 md:px-16 py-16">
          <div ref={ref2}>
            <span
              className="rv inline-block text-xs uppercase tracking-widest mb-6"
              style={{ fontFamily: 'var(--font-b)', color: 'var(--teal)', fontWeight: 600, letterSpacing: 3 }}
            >
              {c.founderTag}
            </span>
            <div
              className="rv flex flex-col sm:flex-row items-center sm:items-start gap-8 p-8 rounded-2xl"
              style={{
                background: 'rgba(255,255,255,0.4)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.5)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.04)',
              }}
            >
              {/* Avatar placeholder */}
              <div
                className="w-24 h-24 rounded-2xl shrink-0 flex items-center justify-center text-3xl font-bold"
                style={{
                  background: 'linear-gradient(135deg, var(--teal), var(--teal-deep))',
                  color: '#fff',
                  fontFamily: 'var(--font-a)',
                }}
              >
                CN
              </div>
              <div>
                <h3 className="text-xl font-bold mb-1" style={{ fontFamily: 'var(--font-a)', color: 'var(--charcoal)' }}>
                  {c.founderName}
                </h3>
                <p className="text-sm mb-3" style={{ color: 'var(--teal)', fontFamily: 'var(--font-b)', fontWeight: 600 }}>
                  {c.founderRole}
                </p>
                <p className="leading-relaxed" style={{ fontFamily: 'var(--font-b)', color: 'var(--text-light)', fontSize: 15 }}>
                  {c.founderBio}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="max-w-[1000px] mx-auto px-7 md:px-16 py-16">
          <div ref={ref3} className="text-center mb-12">
            <span
              className="rv inline-block text-xs uppercase tracking-widest mb-4"
              style={{ fontFamily: 'var(--font-b)', color: 'var(--teal)', fontWeight: 600, letterSpacing: 3 }}
            >
              {c.valuesTag}
            </span>
            <h2 className="rv" style={{ fontFamily: 'var(--font-h)', fontSize: 'clamp(28px, 4vw, 40px)', color: 'var(--charcoal)', letterSpacing: -0.5 }}>
              {c.valuesTitle}
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {c.values.map((v, i) => {
              const Icon = iconMap[v.icon] || Heart;
              return (
                <div
                  key={i}
                  className="rv p-7 rounded-2xl transition-all duration-300 hover:translate-y-[-2px]"
                  style={{
                    background: 'rgba(255,255,255,0.4)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255,255,255,0.5)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.04)',
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: 'rgba(13,138,111,0.1)' }}
                  >
                    <Icon size={20} style={{ color: 'var(--teal)' }} />
                  </div>
                  <h3 className="text-base font-bold mb-2" style={{ fontFamily: 'var(--font-a)', color: 'var(--charcoal)' }}>
                    {v.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ fontFamily: 'var(--font-b)', color: 'var(--text-light)' }}>
                    {v.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Timeline */}
        <section className="max-w-[800px] mx-auto px-7 md:px-16 py-16 pb-24">
          <div ref={ref4} className="text-center mb-12">
            <span
              className="rv inline-block text-xs uppercase tracking-widest mb-4"
              style={{ fontFamily: 'var(--font-b)', color: 'var(--teal)', fontWeight: 600, letterSpacing: 3 }}
            >
              {c.timelineTag}
            </span>
            <h2 className="rv" style={{ fontFamily: 'var(--font-h)', fontSize: 'clamp(28px, 4vw, 40px)', color: 'var(--charcoal)', letterSpacing: -0.5 }}>
              {c.timelineTitle}
            </h2>
          </div>
          <div className="relative">
            {/* Vertical line */}
            <div
              className="absolute left-[23px] top-2 bottom-2 w-px hidden sm:block"
              style={{ background: 'linear-gradient(to bottom, var(--teal), transparent)' }}
            />
            <div className="space-y-8">
              {c.timeline.map((item, i) => (
                <div key={i} className="rv flex gap-6 items-start">
                  <div
                    className="w-12 h-12 rounded-xl shrink-0 flex items-center justify-center text-sm font-bold"
                    style={{
                      background: i === c.timeline.length - 1 ? 'var(--teal)' : 'rgba(255,255,255,0.6)',
                      color: i === c.timeline.length - 1 ? '#fff' : 'var(--teal)',
                      border: i === c.timeline.length - 1 ? 'none' : '1px solid rgba(13,138,111,0.2)',
                      fontFamily: 'var(--font-m)',
                    }}
                  >
                    {item.year.slice(2)}
                  </div>
                  <div className="pt-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold" style={{ color: 'var(--teal)', fontFamily: 'var(--font-m)' }}>{item.year}</span>
                      <ArrowRight size={12} style={{ color: 'var(--text-ghost)' }} />
                      <span className="font-bold text-sm" style={{ fontFamily: 'var(--font-a)', color: 'var(--charcoal)' }}>{item.title}</span>
                    </div>
                    <p className="text-sm leading-relaxed" style={{ fontFamily: 'var(--font-b)', color: 'var(--text-light)' }}>
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      <Footer />
      <WhatsAppFloat />
    </div>
  );
};

export default About;
