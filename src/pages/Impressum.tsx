import { useLang } from '@/hooks/useLang';
import { Link } from 'react-router-dom';
import t from '@/lib/translations';
import Footer from '@/components/Footer';
import SeoHead from '@/components/SeoHead';

const content = {
  en: {
    intro: 'Information pursuant to § 5 E-Commerce Act (ECG), § 14 Austrian Business Code (UGB) and § 25 Media Act (MedienG).',
    sections: [
      {
        title: 'Company Information',
        body: 'Company name: Creationation\nLocation: Vienna, Austria\nEmail: hello@creationation.app\nWebsite: https://creationation.app',
      },
      {
        title: 'Nature of Business',
        body: 'Web and mobile application development services, including custom web application design and development, mobile application development, brand identity design, and SaaS platform development.',
      },
      {
        title: 'Applicable Law',
        body: 'Austrian law applies. Place of jurisdiction is Vienna, Austria.',
      },
      {
        title: 'Disclaimer',
        body: 'Despite careful content control, we assume no liability for the content of external links. The operators of the linked pages are solely responsible for their content. All content on this website is subject to Austrian copyright law. Reproduction, processing, distribution or any form of use beyond the limits of copyright law requires the written consent of Creationation.',
      },
      {
        title: 'Dispute Resolution',
        body: 'The European Commission provides a platform for online dispute resolution (OS): https://ec.europa.eu/consumers/odr. We are not obligated or willing to participate in dispute resolution proceedings before a consumer arbitration board.',
      },
    ],
  },
  fr: {
    intro: 'Informations conformément au § 5 de la loi sur le commerce électronique (ECG), § 14 du code commercial autrichien (UGB) et § 25 de la loi sur les médias (MedienG).',
    sections: [
      {
        title: 'Informations sur l\'entreprise',
        body: 'Nom de l\'entreprise : Creationation\nSiège : Vienne, Autriche\nEmail : hello@creationation.app\nSite web : https://creationation.app',
      },
      {
        title: 'Nature de l\'activité',
        body: 'Services de développement d\'applications web et mobiles, incluant la conception et le développement d\'applications web sur-mesure, le développement d\'applications mobiles, le design d\'identité de marque et le développement de plateformes SaaS.',
      },
      {
        title: 'Droit applicable',
        body: 'Le droit autrichien s\'applique. Le lieu de juridiction est Vienne, Autriche.',
      },
      {
        title: 'Clause de non-responsabilité',
        body: 'Malgré un contrôle minutieux du contenu, nous déclinons toute responsabilité quant au contenu des liens externes. Les exploitants des pages liées sont seuls responsables de leur contenu. Tout le contenu de ce site est soumis au droit d\'auteur autrichien. La reproduction, le traitement, la distribution ou toute forme d\'utilisation au-delà des limites du droit d\'auteur nécessite le consentement écrit de Creationation.',
      },
      {
        title: 'Résolution des litiges',
        body: 'La Commission européenne fournit une plateforme de résolution des litiges en ligne (RL) : https://ec.europa.eu/consumers/odr. Nous ne sommes ni obligés ni disposés à participer à des procédures de résolution des litiges devant un organisme d\'arbitrage des consommateurs.',
      },
    ],
  },
  de: {
    intro: 'Angaben gemäß § 5 E-Commerce-Gesetz (ECG), § 14 Unternehmensgesetzbuch (UGB) und § 25 Mediengesetz (MedienG).',
    sections: [
      {
        title: 'Unternehmensangaben',
        body: 'Firmenname: Creationation\nStandort: Wien, Österreich\nE-Mail: hello@creationation.app\nWebsite: https://creationation.app',
      },
      {
        title: 'Art der Tätigkeit',
        body: 'Web- und Mobile-App-Entwicklungsdienstleistungen, einschließlich maßgeschneidertem Webdesign und -entwicklung, Mobile-App-Entwicklung, Markenidentitäts-Design und SaaS-Plattform-Entwicklung.',
      },
      {
        title: 'Anwendbares Recht',
        body: 'Es gilt österreichisches Recht. Gerichtsstand ist Wien, Österreich.',
      },
      {
        title: 'Haftungsausschluss',
        body: 'Trotz sorgfältiger inhaltlicher Kontrolle übernehmen wir keine Haftung für die Inhalte externer Links. Für den Inhalt der verlinkten Seiten sind ausschließlich deren Betreiber verantwortlich. Alle Inhalte dieser Website unterliegen dem österreichischen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung oder jede Art der Verwertung außerhalb der Grenzen des Urheberrechts bedarf der schriftlichen Zustimmung von Creationation.',
      },
      {
        title: 'Streitbeilegung',
        body: 'Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit: https://ec.europa.eu/consumers/odr. Wir sind nicht verpflichtet und nicht bereit, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.',
      },
    ],
  },
};

const Impressum = () => {
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
          {t.legal.impressumTitle[lang]}
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
            <p className="leading-relaxed whitespace-pre-line" style={{ fontFamily: 'var(--font-b)', color: 'var(--text-light)' }}>
              {s.body}
            </p>
          </div>
        ))}
      </div>
      <Footer />
    </div>
  );
};

export default Impressum;
