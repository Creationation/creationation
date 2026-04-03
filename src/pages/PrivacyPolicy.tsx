import { useLang } from '@/hooks/useLang';
import { Link } from 'react-router-dom';
import t from '@/lib/translations';
import Footer from '@/components/Footer';

const content = {
  en: {
    intro: 'Creationation ("we", "us", "our") operates the website creationation.app. This page informs you of our policies regarding the collection, use and disclosure of personal data when you use our website and the choices you have associated with that data.',
    sections: [
      {
        title: '1. Information We Collect',
        body: 'We collect information you provide directly to us when you fill out our contact form, including your name, email address, phone number, project description, budget range, timeline preferences, style preferences and color choices. We also automatically collect certain technical information when you visit our website, such as your IP address, browser type, operating system and pages visited.',
      },
      {
        title: '2. How We Use Your Information',
        body: 'We use the information we collect to respond to your inquiries and project requests, to provide and improve our web and mobile app development services, to send you project proposals and follow-up communications, to analyze website usage and improve user experience, and to comply with legal obligations.',
      },
      {
        title: '3. Legal Basis for Processing (GDPR)',
        body: 'Under the General Data Protection Regulation (GDPR), we process your personal data based on your consent when you submit the contact form, our legitimate interest in responding to business inquiries, and the necessity of processing for the performance of a contract or to take steps prior to entering into a contract.',
      },
      {
        title: '4. Data Sharing',
        body: 'We do not sell your personal information. We may share your data with trusted service providers who assist us in operating our website and delivering our services, such as our hosting provider and email service. All third-party providers are contractually obligated to protect your data.',
      },
      {
        title: '5. Data Retention',
        body: 'We retain your personal data only for as long as necessary to fulfill the purposes for which it was collected, including satisfying any legal, accounting or reporting requirements. Contact form submissions are retained for up to 24 months unless you request earlier deletion.',
      },
      {
        title: '6. Your Rights',
        body: 'Under the GDPR, you have the right to access, correct or delete your personal data, to restrict or object to processing, to data portability, and to withdraw consent at any time. To exercise any of these rights, please contact us at hello@creationation.app.',
      },
      {
        title: '7. Cookies',
        body: 'Our website uses essential cookies required for the site to function properly. We do not use tracking or advertising cookies. No third-party analytics scripts are loaded without your consent.',
      },
      {
        title: '8. Contact',
        body: 'If you have any questions about this Privacy Policy, please contact us at hello@creationation.app.',
      },
    ],
  },
  fr: {
    intro: 'Creationation ("nous", "notre") exploite le site web creationation.app. Cette page vous informe de nos politiques concernant la collecte, l\'utilisation et la divulgation des données personnelles lorsque vous utilisez notre site web, ainsi que des choix qui s\'offrent à vous.',
    sections: [
      {
        title: '1. Informations que nous collectons',
        body: 'Nous collectons les informations que vous nous fournissez directement lorsque vous remplissez notre formulaire de contact, notamment votre nom, adresse email, numéro de téléphone, description de projet, fourchette de budget, préférences de délai, préférences de style et choix de couleurs. Nous collectons également automatiquement certaines informations techniques lorsque vous visitez notre site, telles que votre adresse IP, type de navigateur, système d\'exploitation et pages visitées.',
      },
      {
        title: '2. Comment nous utilisons vos informations',
        body: 'Nous utilisons les informations collectées pour répondre à vos demandes et requêtes de projet, fournir et améliorer nos services de développement web et d\'applications mobiles, vous envoyer des propositions de projet et des communications de suivi, analyser l\'utilisation du site et améliorer l\'expérience utilisateur, et nous conformer aux obligations légales.',
      },
      {
        title: '3. Base légale du traitement (RGPD)',
        body: 'En vertu du Règlement Général sur la Protection des Données (RGPD), nous traitons vos données personnelles sur la base de votre consentement lors de la soumission du formulaire de contact, de notre intérêt légitime à répondre aux demandes commerciales, et de la nécessité du traitement pour l\'exécution d\'un contrat ou pour prendre des mesures préalables à la conclusion d\'un contrat.',
      },
      {
        title: '4. Partage des données',
        body: 'Nous ne vendons pas vos informations personnelles. Nous pouvons partager vos données avec des prestataires de confiance qui nous aident à exploiter notre site web et à fournir nos services, tels que notre hébergeur et notre service email. Tous les prestataires tiers sont contractuellement tenus de protéger vos données.',
      },
      {
        title: '5. Conservation des données',
        body: 'Nous conservons vos données personnelles uniquement aussi longtemps que nécessaire pour remplir les objectifs pour lesquels elles ont été collectées, y compris pour satisfaire toute exigence légale, comptable ou de reporting. Les soumissions de formulaire de contact sont conservées jusqu\'à 24 mois, sauf si vous demandez une suppression anticipée.',
      },
      {
        title: '6. Vos droits',
        body: 'En vertu du RGPD, vous avez le droit d\'accéder, de corriger ou de supprimer vos données personnelles, de restreindre ou de vous opposer au traitement, à la portabilité des données, et de retirer votre consentement à tout moment. Pour exercer l\'un de ces droits, veuillez nous contacter à hello@creationation.app.',
      },
      {
        title: '7. Cookies',
        body: 'Notre site utilise des cookies essentiels nécessaires au bon fonctionnement du site. Nous n\'utilisons pas de cookies de suivi ou publicitaires. Aucun script d\'analyse tiers n\'est chargé sans votre consentement.',
      },
      {
        title: '8. Contact',
        body: 'Si vous avez des questions concernant cette politique de confidentialité, veuillez nous contacter à hello@creationation.app.',
      },
    ],
  },
  de: {
    intro: 'Creationation ("wir", "uns", "unser") betreibt die Website creationation.app. Diese Seite informiert Sie über unsere Richtlinien bezüglich der Erhebung, Verwendung und Offenlegung personenbezogener Daten bei der Nutzung unserer Website sowie über die Ihnen zur Verfügung stehenden Wahlmöglichkeiten.',
    sections: [
      {
        title: '1. Welche Informationen wir erheben',
        body: 'Wir erheben Informationen, die Sie uns direkt beim Ausfüllen unseres Kontaktformulars mitteilen, darunter Ihren Namen, Ihre E-Mail-Adresse, Telefonnummer, Projektbeschreibung, Budgetrahmen, Zeitpräferenzen, Stilpräferenzen und Farbauswahl. Wir erheben außerdem automatisch bestimmte technische Informationen beim Besuch unserer Website, wie Ihre IP-Adresse, Browsertyp, Betriebssystem und besuchte Seiten.',
      },
      {
        title: '2. Wie wir Ihre Informationen verwenden',
        body: 'Wir verwenden die erhobenen Informationen, um auf Ihre Anfragen und Projektanforderungen zu antworten, unsere Web- und Mobile-App-Entwicklungsdienste bereitzustellen und zu verbessern, Ihnen Projektvorschläge und Folge-Kommunikationen zu senden, die Website-Nutzung zu analysieren und die Benutzererfahrung zu verbessern sowie gesetzliche Verpflichtungen zu erfüllen.',
      },
      {
        title: '3. Rechtsgrundlage der Verarbeitung (DSGVO)',
        body: 'Gemäß der Datenschutz-Grundverordnung (DSGVO) verarbeiten wir Ihre personenbezogenen Daten auf Grundlage Ihrer Einwilligung bei der Übermittlung des Kontaktformulars, unseres berechtigten Interesses an der Beantwortung geschäftlicher Anfragen und der Notwendigkeit der Verarbeitung zur Erfüllung eines Vertrags oder zur Durchführung vorvertraglicher Maßnahmen.',
      },
      {
        title: '4. Datenweitergabe',
        body: 'Wir verkaufen Ihre persönlichen Daten nicht. Wir können Ihre Daten mit vertrauenswürdigen Dienstleistern teilen, die uns beim Betrieb unserer Website und bei der Erbringung unserer Dienste unterstützen, wie unserem Hosting-Anbieter und E-Mail-Dienst. Alle Drittanbieter sind vertraglich zum Schutz Ihrer Daten verpflichtet.',
      },
      {
        title: '5. Datenspeicherung',
        body: 'Wir speichern Ihre personenbezogenen Daten nur so lange, wie es zur Erfüllung der Zwecke erforderlich ist, für die sie erhoben wurden, einschließlich der Erfüllung gesetzlicher, buchhalterischer oder berichtspflichtiger Anforderungen. Kontaktformular-Einsendungen werden bis zu 24 Monate aufbewahrt, sofern Sie nicht eine frühere Löschung beantragen.',
      },
      {
        title: '6. Ihre Rechte',
        body: 'Gemäß der DSGVO haben Sie das Recht auf Zugang, Berichtigung oder Löschung Ihrer personenbezogenen Daten, auf Einschränkung oder Widerspruch gegen die Verarbeitung, auf Datenübertragbarkeit und auf jederzeitigen Widerruf Ihrer Einwilligung. Zur Ausübung dieser Rechte kontaktieren Sie uns bitte unter hello@creationation.app.',
      },
      {
        title: '7. Cookies',
        body: 'Unsere Website verwendet ausschließlich essenzielle Cookies, die für die ordnungsgemäße Funktion der Website erforderlich sind. Wir verwenden keine Tracking- oder Werbe-Cookies. Keine Analyse-Scripts von Drittanbietern werden ohne Ihre Zustimmung geladen.',
      },
      {
        title: '8. Kontakt',
        body: 'Bei Fragen zu dieser Datenschutzerklärung kontaktieren Sie uns bitte unter hello@creationation.app.',
      },
    ],
  },
};

const PrivacyPolicy = () => {
  const { lang } = useLang();
  const c = content[lang];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--cream)', color: 'var(--text-main)' }}>
      <div className="flex-1 max-w-[800px] mx-auto px-7 md:px-16 py-16 md:py-24">
        <Link
          to="/"
          className="inline-block mb-10 text-sm hover:opacity-70 transition-opacity"
          style={{ color: 'var(--text-light)', fontFamily: 'var(--font-b)' }}
        >
          {t.legal.backHome[lang]}
        </Link>

        <h1 className="text-3xl md:text-4xl mb-3" style={{ fontFamily: 'var(--font-a)' }}>
          {t.legal.privacyTitle[lang]}
        </h1>
        <p className="text-xs mb-10" style={{ color: 'var(--text-ghost)' }}>
          {t.legal.lastUpdated[lang]}
        </p>

        <p className="mb-8 leading-relaxed" style={{ fontFamily: 'var(--font-b)', color: 'var(--text-light)' }}>
          {c.intro}
        </p>

        {c.sections.map((s, i) => (
          <div key={i} className="mb-8">
            <h2 className="text-lg mb-2 font-semibold" style={{ fontFamily: 'var(--font-a)' }}>
              {s.title}
            </h2>
            <p className="leading-relaxed" style={{ fontFamily: 'var(--font-b)', color: 'var(--text-light)' }}>
              {s.body}
            </p>
          </div>
        ))}
      </div>
      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
