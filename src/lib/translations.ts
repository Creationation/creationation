export type Lang = 'fr' | 'en' | 'de';

const t = {
  nav: {
    portfolio: { fr: 'Portfolio', en: 'Portfolio', de: 'Portfolio' },
    process: { fr: 'Process', en: 'Process', de: 'Prozess' },
    services: { fr: 'Services', en: 'Services', de: 'Leistungen' },
    cta: { fr: 'Discutons', en: "Let's talk", de: 'Kontakt' },
  },
  hero: {
    badge: { fr: 'Disponible — Nouveaux projets 2026', en: 'Available — New projects 2026', de: 'Verfügbar — Neue Projekte 2026' },
    title1: { fr: 'On crée des apps qui donnent envie de ', en: 'We build apps that make people want to ', de: 'Wir bauen Apps, die Lust machen ' },
    titleHighlight: { fr: 'revenir', en: 'come back', de: 'wiederzukommen' },
    sub: {
      fr: 'Applications web sur-mesure pour entreprises locales ambitieuses. Design premium, développement rapide, résultats mesurables.',
      en: 'Custom web applications for ambitious local businesses. Premium design, fast development, measurable results.',
      de: 'Maßgeschneiderte Webanwendungen für ambitionierte lokale Unternehmen. Premium-Design, schnelle Entwicklung, messbare Ergebnisse.',
    },
    btn1: { fr: 'Voir nos réalisations ↓', en: 'See our work ↓', de: 'Unsere Projekte ↓' },
    btn2: { fr: 'Démarrer un projet', en: 'Start a project', de: 'Projekt starten' },
    stat1: { fr: 'Projets livrés', en: 'Projects delivered', de: 'Projekte geliefert' },
    stat2: { fr: 'Utilisateurs actifs', en: 'Active users', de: 'Aktive Nutzer' },
    stat3: { fr: 'Secteurs', en: 'Industries', de: 'Branchen' },
    stat4: { fr: 'Livraison', en: 'Delivery', de: 'Lieferung' },
  },
  services: {
    tag: { fr: "Ce qu'on fait", en: 'What we do', de: 'Was wir machen' },
    title: { fr: 'Solutions complètes, résultats concrets', en: 'Complete solutions, real results', de: 'Komplettlösungen, echte Ergebnisse' },
    s1t: { fr: 'Web Apps Premium', en: 'Premium Web Apps', de: 'Premium Web-Apps' },
    s1d: {
      fr: "Applications sur-mesure qui captent l'attention et transforment les visiteurs en clients fidèles.",
      en: 'Custom-built applications that capture attention and turn visitors into loyal customers.',
      de: 'Maßgeschneiderte Anwendungen, die Aufmerksamkeit erregen und Besucher in treue Kunden verwandeln.',
    },
    s2t: { fr: 'Commande & Réservation', en: 'Ordering & Booking', de: 'Bestellung & Buchung' },
    s2d: {
      fr: "Systèmes intégrés pensés mobile-first pour une expérience de réservation fluide et naturelle.",
      en: 'Integrated mobile-first systems for a smooth, natural booking experience.',
      de: 'Integrierte Mobile-First-Systeme für ein reibungsloses Buchungserlebnis.',
    },
    s3t: { fr: 'Identité de Marque', en: 'Brand Identity', de: 'Markenidentität' },
    s3d: {
      fr: "Direction artistique complète : chaque pixel, chaque couleur reflète l'âme de votre business.",
      en: 'Complete art direction: every pixel, every color reflects the soul of your business.',
      de: 'Komplette Art Direction: Jedes Pixel, jede Farbe spiegelt die Seele Ihres Unternehmens wider.',
    },
    s4t: { fr: 'Plateformes SaaS', en: 'SaaS Platforms', de: 'SaaS-Plattformen' },
    s4d: {
      fr: 'Logiciels complets avec dashboard, CRM et automatisations. Du concept au lancement.',
      en: 'Complete software with dashboard, CRM and automations. From concept to launch.',
      de: 'Komplette Software mit Dashboard, CRM und Automatisierungen. Vom Konzept bis zum Launch.',
    },
  },
  portfolio: {
    tag: { fr: 'Portfolio', en: 'Portfolio', de: 'Portfolio' },
    title: { fr: 'Chaque projet est une histoire unique', en: 'Every project is a unique story', de: 'Jedes Projekt ist eine einzigartige Geschichte' },
    sub: {
      fr: 'Des solutions digitales qui transforment la relation entre nos clients et leur clientèle.',
      en: 'Digital solutions that transform the relationship between our clients and their customers.',
      de: 'Digitale Lösungen, die die Beziehung zwischen unseren Kunden und deren Kundschaft transformieren.',
    },
    discover: { fr: 'Découvrir le projet', en: 'Discover the project', de: 'Projekt entdecken' },
    discoverShort: { fr: 'Découvrir', en: 'Discover', de: 'Entdecken' },
    badgeLive: { fr: 'En production', en: 'In production', de: 'In Produktion' },
    badgeDemo: { fr: 'Démo live', en: 'Live demo', de: 'Live-Demo' },
  },
  process: {
    tag: { fr: 'Notre méthode', en: 'Our method', de: 'Unsere Methode' },
    title: { fr: 'Un process éprouvé, des résultats garantis', en: 'A proven process, guaranteed results', de: 'Ein bewährter Prozess, garantierte Ergebnisse' },
    p1t: { fr: 'Découverte', en: 'Discovery', de: 'Entdeckung' },
    p1d: { fr: 'Analyse de votre activité, clientèle et objectifs. On comprend avant de créer.', en: 'Analysis of your business, clientele and goals. We understand before we create.', de: 'Analyse Ihres Geschäfts, Ihrer Kundschaft und Ziele. Wir verstehen, bevor wir gestalten.' },
    p2t: { fr: 'Design', en: 'Design', de: 'Design' },
    p2d: { fr: 'Direction artistique sur-mesure, maquettes interactives, validation à chaque étape.', en: 'Custom art direction, interactive mockups, validation at every step.', de: 'Maßgeschneiderte Art Direction, interaktive Mockups, Validierung bei jedem Schritt.' },
    p3t: { fr: 'Développement', en: 'Development', de: 'Entwicklung' },
    p3d: { fr: 'Code propre, performant, optimisé mobile. Technologies modernes.', en: 'Clean, performant, mobile-optimized code. Modern technologies.', de: 'Sauberer, performanter, mobiloptimierter Code. Moderne Technologien.' },
    p4t: { fr: 'Lancement', en: 'Launch', de: 'Launch' },
    p4d: { fr: 'Déploiement, formation et support continu. On vous accompagne.', en: 'Deployment, training and ongoing support. We walk with you.', de: 'Deployment, Schulung und fortlaufender Support. Wir begleiten Sie.' },
  },
  testimonial: {
    quote: {
      fr: "On voulait quelque chose de différent, qui nous ressemble. Le résultat a dépassé toutes nos attentes — nos clients nous disent que l'app donne encore plus envie de venir.",
      en: "We wanted something different, something that truly represents us. The result exceeded all our expectations — our clients tell us the app makes them want to visit even more.",
      de: "Wir wollten etwas Anderes, etwas das wirklich zu uns passt. Das Ergebnis hat alle unsere Erwartungen übertroffen — unsere Kunden sagen, die App macht noch mehr Lust vorbeizukommen.",
    },
    author: { fr: '— Client Barbershop', en: '— Barbershop Client', de: '— Barbershop-Kunde' },
    role: { fr: 'Gérant, Vienne', en: 'Owner, Vienna', de: 'Inhaber, Wien' },
  },
  cta: {
    title: { fr: 'Prêt à donner à votre business le digital qu\'il mérite ?', en: 'Ready to give your business the digital it deserves?', de: 'Bereit, Ihrem Business das Digitale zu geben, das es verdient?' },
    sub: { fr: 'Premier rendez-vous offert. Discutons de votre vision.', en: 'First meeting is free. Let\'s discuss your vision.', de: 'Erstes Treffen kostenlos. Lassen Sie uns Ihre Vision besprechen.' },
    btn: { fr: 'Lancer mon projet →', en: 'Launch my project →', de: 'Mein Projekt starten →' },
  },
  footer: {
    copy: { fr: '© 2026 — Digital Product Studio', en: '© 2026 — Digital Product Studio', de: '© 2026 — Digital Product Studio' },
    contact: { fr: 'Contact', en: 'Contact', de: 'Kontakt' },
  },
} as const;

export default t;
