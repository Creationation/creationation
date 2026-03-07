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
      fr: 'Plateforme SaaS complète pour créateurs UGC. Pitchs, scripts, contrats, CRM et intégration Instagram. Plus de 500 créateurs actifs.',
      en: 'Complete SaaS platform for UGC creators. Pitches, scripts, contracts, CRM and Instagram integration. Over 500 active creators.',
      de: 'Komplette SaaS-Plattform für UGC-Creator. Pitches, Scripts, Verträge, CRM und Instagram-Integration. Über 500 aktive Creator.',
    },
    tags: ['SaaS', 'CRM', 'Instagram API', '500+ users', 'React / Supabase'],
    screenshot: '/projects/ugcpanel.png',
    featured: true,
  },
  {
    url: 'https://hairappcreationation.lovable.app',
    urlDisplay: 'Hair Studio Creation',
    badge: 'demo',
    category: 'Salon de Coiffure',
    color: 'coral',
    name: 'Hair Studio Creation',
    desc: {
      fr: 'App élégante pour salon femme avec réservation en ligne, galerie de réalisations et système de fidélité intégré.',
      en: 'Elegant app for women\'s salon featuring online booking, achievement gallery and built-in loyalty system.',
      de: 'Elegante App für Friseursalon mit Online-Buchung, Galerie und integriertem Treueprogramm.',
    },
    tags: ['Coiffure Femme', 'Réservation', 'Mobile-First'],
    screenshot: '/projects/hairstudio.png',
  },
  {
    url: 'https://saveurs-web-atelier.lovable.app',
    urlDisplay: 'Saveurs Web Atelier',
    badge: 'demo',
    category: 'Restauration',
    color: 'gold',
    name: 'Saveurs — Web Atelier',
    desc: {
      fr: 'Restaurant digital complet avec menu interactif, commande en ligne et système de livraison intégré.',
      en: 'Complete digital restaurant with interactive menu, online ordering and integrated delivery system.',
      de: 'Komplettes digitales Restaurant mit interaktivem Menü, Online-Bestellung und integrierter Lieferung.',
    },
    tags: ['Restaurant', 'Commande en ligne', 'Livraison'],
    screenshot: '/projects/saveurs.png',
  },
  {
    url: 'https://prestige-clean-app.lovable.app',
    urlDisplay: 'Prestige Clean',
    badge: 'demo',
    category: 'Pressing Premium',
    color: 'sky',
    name: 'Prestige Clean',
    desc: {
      fr: 'App premium pour pressing avec prise de rendez-vous, suivi de commande en temps réel et notifications automatisées.',
      en: 'Premium dry cleaning app with appointment booking, real-time order tracking and automated notifications.',
      de: 'Premium-Reinigungs-App mit Terminbuchung, Echtzeit-Tracking und automatischen Benachrichtigungen.',
    },
    tags: ['Dry Cleaning', 'Suivi temps réel', 'Notifications'],
    screenshot: '/projects/prestige-clean.png',
  },
  {
    url: 'https://the-sharp-way.lovable.app',
    urlDisplay: 'The Sharp Way',
    badge: 'demo',
    category: 'Barbershop',
    color: 'gold',
    name: 'The Sharp Way',
    desc: {
      fr: 'Identité digitale masculine et raffinée avec réservation instantanée, galerie de coupes et ambiance premium.',
      en: 'Refined masculine digital identity with instant booking, haircut gallery and premium ambiance.',
      de: 'Raffinierte maskuline digitale Identität mit sofortiger Buchung, Galerie und Premium-Ambiente.',
    },
    tags: ['Barbershop', 'Réservation', 'Design Masculin'],
    screenshot: '/projects/the-sharp-way.png',
  },
  {
    url: 'https://luxe-nail-sparkle.lovable.app',
    urlDisplay: 'Luxe Nail Sparkle',
    badge: 'demo',
    category: 'Nail Studio',
    color: 'coral',
    name: 'Luxe Nail Sparkle',
    desc: {
      fr: 'Expérience luxe pour nail studio avec catalogue de designs, réservation en ligne et programme de fidélité.',
      en: 'Luxury nail studio experience with design catalog, online booking and loyalty program.',
      de: 'Luxus-Nagelstudio-Erlebnis mit Designkatalog, Online-Buchung und Treueprogramm.',
    },
    tags: ['Nail Art', 'Catalogue', 'Fidélisation'],
    screenshot: '/projects/luxe-nail.png',
  },
  {
    url: 'https://newdonstudio.lovable.app',
    urlDisplay: 'NewDon Studio',
    badge: 'demo',
    category: 'Barbershop — Wien',
    color: 'violet',
    name: 'NewDon Studio',
    desc: {
      fr: 'Barbershop digital ancré à Vienne avec une identité locale forte, réservation fluide et esthétique moderne.',
      en: 'Digital barbershop rooted in Vienna with strong local identity, smooth booking and modern aesthetic.',
      de: 'Digitaler Barbershop in Wien mit starker lokaler Identität, reibungsloser Buchung und moderner Ästhetik.',
    },
    tags: ['Vienne, AT', 'Barbershop', 'Identité Locale'],
    screenshot: '/projects/newdonstudio.png',
  },
  {
    url: 'https://davizgi.app',
    urlDisplay: 'davizgi.app',
    badge: 'live',
    category: 'Barbershop — Belgique',
    color: 'teal',
    name: 'Davizgi',
    desc: {
      fr: 'Barbershop premium à Opwijk en Flandre. App bilingue avec réservation en ligne et fidélisation client.',
      en: 'Premium barbershop in Opwijk, Flanders. Bilingual app with online booking and client loyalty features.',
      de: 'Premium-Barbershop in Opwijk, Flandern. Zweisprachige App mit Online-Buchung und Kundenbindung.',
    },
    tags: ['Opwijk, BE', 'Bilingue NL/FR', 'Barbershop'],
    screenshot: '/projects/davizgi.png',
  },
];
