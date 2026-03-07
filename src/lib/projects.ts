import type { Lang } from './translations';

export type ProjectColor = 'teal' | 'coral' | 'gold' | 'sky' | 'violet';

export interface Project {
  url: string;
  urlDisplay: string;
  badge: 'live' | 'demo';
  category: string;
  color: ProjectColor;
  name: string;
  desc: Record<Lang, string>;
  tags: string[];
  screenshot: string;
  featured?: boolean;
}

export const projects: Project[] = [
  {
    url: 'https://ugcpanel.app',
    urlDisplay: 'ugcpanel.app',
    badge: 'live',
    category: 'SaaS Platform',
    color: 'teal',
    name: 'UGC Panel',
    desc: {
      fr: 'Plateforme SaaS complète pour créateurs UGC — pitchs, scripts, contrats, CRM, intégration Instagram. 500+ créateurs actifs.',
      en: 'Complete SaaS platform for UGC creators — pitches, scripts, contracts, CRM, Instagram integration. 500+ active creators.',
      de: 'Komplette SaaS-Plattform für UGC-Creator — Pitches, Scripts, Verträge, CRM, Instagram-Integration. 500+ aktive Creator.',
    },
    tags: ['SaaS', 'CRM', 'Instagram API', '500+ users', 'React / Supabase'],
    featured: true,
  },
  {
    url: 'https://hairappcreationation.lovable.app',
    urlDisplay: 'hairstudio.app',
    badge: 'demo',
    category: 'Salon de Coiffure',
    color: 'coral',
    name: 'Hair Studio Creation',
    desc: {
      fr: 'App élégante pour salon femme — réservation, galerie de réalisations, système de fidélité.',
      en: 'Elegant app for women\'s salon — booking, gallery, loyalty system.',
      de: 'Elegante App für Friseursalon — Buchung, Galerie, Treueprogramm.',
    },
    tags: ['Coiffure Femme', 'Réservation', 'Mobile-First'],
  },
  {
    url: 'https://saveurs-web-atelier.lovable.app',
    urlDisplay: 'saveurs-atelier.app',
    badge: 'demo',
    category: 'Restauration',
    color: 'gold',
    name: 'Saveurs — Web Atelier',
    desc: {
      fr: 'Restaurant digital complet — menu interactif, commande en ligne, système de livraison intégré.',
      en: 'Complete digital restaurant — interactive menu, online ordering, integrated delivery.',
      de: 'Komplettes digitales Restaurant — interaktives Menü, Online-Bestellung, integrierte Lieferung.',
    },
    tags: ['Restaurant', 'Commande en ligne', 'Livraison'],
  },
  {
    url: 'https://prestige-clean-app.lovable.app',
    urlDisplay: 'prestige-clean.app',
    badge: 'demo',
    category: 'Pressing Premium',
    color: 'sky',
    name: 'Prestige Clean',
    desc: {
      fr: 'App premium pour pressing — prise de RDV, suivi commande temps réel, notifications automatisées.',
      en: 'Premium dry cleaning app — booking, real-time order tracking, automated notifications.',
      de: 'Premium-Reinigungs-App — Buchung, Echtzeit-Tracking, automatische Benachrichtigungen.',
    },
    tags: ['Dry Cleaning', 'Suivi temps réel', 'Notifications'],
  },
  {
    url: 'https://the-sharp-way.lovable.app',
    urlDisplay: 'the-sharp-way.app',
    badge: 'demo',
    category: 'Barbershop',
    color: 'gold',
    name: 'The Sharp Way',
    desc: {
      fr: 'Identité digitale masculine et raffinée — réservation instantanée, galerie de coupes, ambiance premium.',
      en: 'Refined masculine digital identity — instant booking, haircut gallery, premium ambiance.',
      de: 'Raffinierte maskuline digitale Identität — sofortige Buchung, Galerie, Premium-Ambiente.',
    },
    tags: ['Barbershop', 'Réservation', 'Design Masculin'],
  },
  {
    url: 'https://luxe-nail-sparkle.lovable.app',
    urlDisplay: 'luxe-nail.app',
    badge: 'demo',
    category: 'Nail Studio',
    color: 'coral',
    name: 'Luxe Nail Sparkle',
    desc: {
      fr: 'Expérience luxe pour nail studio — catalogue de designs, réservation en ligne, programme de fidélité.',
      en: 'Luxury nail studio experience — design catalog, online booking, loyalty program.',
      de: 'Luxus-Nagelstudio-Erlebnis — Designkatalog, Online-Buchung, Treueprogramm.',
    },
    tags: ['Nail Art', 'Catalogue', 'Fidélisation'],
  },
  {
    url: 'https://newdonstudio.lovable.app',
    urlDisplay: 'newdonstudio.app',
    badge: 'demo',
    category: 'Barbershop — Wien',
    color: 'violet',
    name: 'NewDon Studio',
    desc: {
      fr: 'Barbershop digital ancré à Vienne — identité locale forte, réservation fluide, esthétique moderne.',
      en: 'Digital barbershop rooted in Vienna — strong local identity, smooth booking, modern aesthetic.',
      de: 'Digitaler Barbershop in Wien — starke lokale Identität, reibungslose Buchung, moderne Ästhetik.',
    },
    tags: ['Vienne, AT', 'Barbershop', 'Identité Locale'],
  },
  {
    url: 'https://davizgi.app',
    urlDisplay: 'davizgi.app',
    badge: 'live',
    category: 'Barbershop — Belgique',
    color: 'teal',
    name: 'Davizgi',
    desc: {
      fr: 'Barbershop premium à Opwijk, Flandre — app bilingue, réservation en ligne, fidélisation client.',
      en: 'Premium barbershop in Opwijk, Flanders — bilingual app, online booking, client loyalty.',
      de: 'Premium-Barbershop in Opwijk, Flandern — zweisprachige App, Online-Buchung, Kundenbindung.',
    },
    tags: ['Opwijk, BE', 'Bilingue NL/FR', 'Barbershop'],
  },
];
