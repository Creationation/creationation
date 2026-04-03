import { useLang } from '@/hooks/useLang';
import { Link } from 'react-router-dom';
import t from '@/lib/translations';
import Footer from '@/components/Footer';
import SeoHead from '@/components/SeoHead';

const content = {
  en: {
    intro: 'These Terms of Service govern your use of the creationation.app website and the web and mobile application development services provided by Creationation. By using our website or engaging our services, you agree to these terms.',
    sections: [
      {
        title: '1. Services',
        body: 'Creationation provides custom web application development, mobile application development, brand identity design and SaaS platform development services. The specific scope, deliverables and timeline for each project are defined in an individual project proposal or contract agreed upon by both parties before work begins.',
      },
      {
        title: '2. Project Process',
        body: 'Each project follows our standard process: discovery, design, development and launch. You will have the opportunity to review and approve deliverables at each stage. Revisions are included as specified in your chosen plan. Final approval must be given before the project is considered delivered.',
      },
      {
        title: '3. Pricing and Payment',
        body: 'Prices are as listed on our website or as agreed in your project proposal. An initial payment is required before work begins. Monthly maintenance fees are billed on a recurring basis and are due at the beginning of each billing period. We offer installment payments in 2 or 3 interest-free installments for all plans.',
      },
      {
        title: '4. Intellectual Property',
        body: 'Upon full payment, you receive ownership of the custom code, designs and content created specifically for your project. We retain the right to use the project in our portfolio unless otherwise agreed. Third-party libraries and frameworks remain under their respective licenses.',
      },
      {
        title: '5. Client Responsibilities',
        body: 'You agree to provide all required content, assets and feedback in a timely manner. Delays in providing materials may affect the project timeline. You are responsible for the accuracy and legality of all content you provide to us.',
      },
      {
        title: '6. Limitation of Liability',
        body: 'Creationation is not liable for any indirect, incidental or consequential damages arising from the use of our services. Our total liability is limited to the amount paid for the specific service in question. We are not responsible for downtime caused by third-party service providers.',
      },
      {
        title: '7. Termination',
        body: 'Either party may terminate a project with 30 days written notice. In case of termination, you will be billed for all work completed up to the date of termination. Monthly maintenance subscriptions can be cancelled with 30 days notice.',
      },
      {
        title: '8. Governing Law',
        body: 'These terms are governed by the laws of Austria. Any disputes arising from these terms shall be subject to the exclusive jurisdiction of the courts of Vienna, Austria.',
      },
      {
        title: '9. Changes to These Terms',
        body: 'We reserve the right to update these terms at any time. Changes will be posted on this page with an updated date. Continued use of our services after changes constitutes acceptance of the new terms.',
      },
      {
        title: '10. Contact',
        body: 'For questions about these Terms of Service, contact us at hello@creationation.app.',
      },
    ],
  },
  fr: {
    intro: 'Les présentes Conditions Générales de Service régissent votre utilisation du site web creationation.app et des services de développement d\'applications web et mobiles fournis par Creationation. En utilisant notre site web ou en faisant appel à nos services, vous acceptez ces conditions.',
    sections: [
      {
        title: '1. Services',
        body: 'Creationation fournit des services de développement d\'applications web sur-mesure, de développement d\'applications mobiles, de design d\'identité de marque et de développement de plateformes SaaS. Le périmètre spécifique, les livrables et le calendrier de chaque projet sont définis dans une proposition de projet individuelle ou un contrat convenu par les deux parties avant le début des travaux.',
      },
      {
        title: '2. Processus de projet',
        body: 'Chaque projet suit notre processus standard : découverte, design, développement et lancement. Vous aurez la possibilité de revoir et d\'approuver les livrables à chaque étape. Les révisions sont incluses selon le plan choisi. L\'approbation finale doit être donnée avant que le projet soit considéré comme livré.',
      },
      {
        title: '3. Tarifs et paiement',
        body: 'Les prix sont ceux affichés sur notre site web ou convenus dans votre proposition de projet. Un paiement initial est requis avant le début des travaux. Les frais de maintenance mensuels sont facturés de manière récurrente et sont dus au début de chaque période de facturation. Nous proposons un paiement en 2 ou 3 fois sans frais pour tous les plans.',
      },
      {
        title: '4. Propriété intellectuelle',
        body: 'Après paiement intégral, vous recevez la propriété du code personnalisé, des designs et du contenu créés spécifiquement pour votre projet. Nous conservons le droit d\'utiliser le projet dans notre portfolio, sauf accord contraire. Les bibliothèques et frameworks tiers restent sous leurs licences respectives.',
      },
      {
        title: '5. Responsabilités du client',
        body: 'Vous vous engagez à fournir tout le contenu, les assets et les retours nécessaires dans les délais impartis. Les retards dans la fourniture des matériaux peuvent affecter le calendrier du projet. Vous êtes responsable de l\'exactitude et de la légalité de tout contenu que vous nous fournissez.',
      },
      {
        title: '6. Limitation de responsabilité',
        body: 'Creationation n\'est pas responsable des dommages indirects, accessoires ou consécutifs résultant de l\'utilisation de nos services. Notre responsabilité totale est limitée au montant payé pour le service spécifique en question. Nous ne sommes pas responsables des interruptions de service causées par des prestataires tiers.',
      },
      {
        title: '7. Résiliation',
        body: 'Chaque partie peut résilier un projet avec un préavis écrit de 30 jours. En cas de résiliation, vous serez facturé pour tous les travaux réalisés jusqu\'à la date de résiliation. Les abonnements de maintenance mensuels peuvent être annulés avec un préavis de 30 jours.',
      },
      {
        title: '8. Droit applicable',
        body: 'Ces conditions sont régies par le droit autrichien. Tout litige découlant de ces conditions sera soumis à la juridiction exclusive des tribunaux de Vienne, Autriche.',
      },
      {
        title: '9. Modifications des conditions',
        body: 'Nous nous réservons le droit de mettre à jour ces conditions à tout moment. Les modifications seront publiées sur cette page avec une date mise à jour. L\'utilisation continue de nos services après modification vaut acceptation des nouvelles conditions.',
      },
      {
        title: '10. Contact',
        body: 'Pour toute question concernant ces Conditions Générales de Service, contactez-nous à hello@creationation.app.',
      },
    ],
  },
  de: {
    intro: 'Diese Allgemeinen Geschäftsbedingungen regeln Ihre Nutzung der Website creationation.app und der von Creationation erbrachten Web- und Mobile-App-Entwicklungsdienste. Durch die Nutzung unserer Website oder die Inanspruchnahme unserer Dienste stimmen Sie diesen Bedingungen zu.',
    sections: [
      {
        title: '1. Dienstleistungen',
        body: 'Creationation bietet maßgeschneiderte Webentwicklung, Mobile-App-Entwicklung, Markenidentitäts-Design und SaaS-Plattform-Entwicklung an. Der spezifische Umfang, die Ergebnisse und der Zeitplan jedes Projekts werden in einem individuellen Projektvorschlag oder Vertrag festgelegt, der von beiden Parteien vor Arbeitsbeginn vereinbart wird.',
      },
      {
        title: '2. Projektprozess',
        body: 'Jedes Projekt folgt unserem Standardprozess: Entdeckung, Design, Entwicklung und Launch. Sie haben die Möglichkeit, Ergebnisse in jeder Phase zu überprüfen und zu genehmigen. Revisionen sind gemäß Ihrem gewählten Paket enthalten. Die endgültige Genehmigung muss erteilt werden, bevor das Projekt als geliefert gilt.',
      },
      {
        title: '3. Preise und Zahlung',
        body: 'Die Preise entsprechen den auf unserer Website aufgeführten oder in Ihrem Projektvorschlag vereinbarten Preisen. Eine Anzahlung ist vor Arbeitsbeginn erforderlich. Monatliche Wartungsgebühren werden wiederkehrend berechnet und sind zu Beginn jedes Abrechnungszeitraums fällig. Wir bieten eine Zahlung in 2 oder 3 zinsfreien Raten für alle Pakete an.',
      },
      {
        title: '4. Geistiges Eigentum',
        body: 'Nach vollständiger Bezahlung erhalten Sie das Eigentum am maßgeschneiderten Code, den Designs und Inhalten, die speziell für Ihr Projekt erstellt wurden. Wir behalten uns das Recht vor, das Projekt in unserem Portfolio zu verwenden, sofern nicht anders vereinbart. Drittanbieter-Bibliotheken und Frameworks bleiben unter ihren jeweiligen Lizenzen.',
      },
      {
        title: '5. Pflichten des Kunden',
        body: 'Sie verpflichten sich, alle erforderlichen Inhalte, Assets und Feedback zeitnah bereitzustellen. Verzögerungen bei der Bereitstellung von Materialien können den Projektzeitplan beeinflussen. Sie sind für die Richtigkeit und Rechtmäßigkeit aller von Ihnen bereitgestellten Inhalte verantwortlich.',
      },
      {
        title: '6. Haftungsbeschränkung',
        body: 'Creationation haftet nicht für indirekte, zufällige oder Folgeschäden, die aus der Nutzung unserer Dienste entstehen. Unsere Gesamthaftung ist auf den für die betreffende Dienstleistung gezahlten Betrag beschränkt. Wir sind nicht verantwortlich für Ausfallzeiten, die durch Drittanbieter verursacht werden.',
      },
      {
        title: '7. Kündigung',
        body: 'Jede Partei kann ein Projekt mit einer schriftlichen Kündigungsfrist von 30 Tagen beenden. Im Falle einer Kündigung werden Ihnen alle bis zum Kündigungsdatum abgeschlossenen Arbeiten in Rechnung gestellt. Monatliche Wartungsabonnements können mit 30 Tagen Kündigungsfrist gekündigt werden.',
      },
      {
        title: '8. Anwendbares Recht',
        body: 'Diese Bedingungen unterliegen dem österreichischen Recht. Alle Streitigkeiten, die sich aus diesen Bedingungen ergeben, unterliegen der ausschließlichen Zuständigkeit der Gerichte in Wien, Österreich.',
      },
      {
        title: '9. Änderungen dieser Bedingungen',
        body: 'Wir behalten uns das Recht vor, diese Bedingungen jederzeit zu aktualisieren. Änderungen werden auf dieser Seite mit einem aktualisierten Datum veröffentlicht. Die fortgesetzte Nutzung unserer Dienste nach Änderungen gilt als Annahme der neuen Bedingungen.',
      },
      {
        title: '10. Kontakt',
        body: 'Bei Fragen zu diesen Allgemeinen Geschäftsbedingungen kontaktieren Sie uns bitte unter hello@creationation.app.',
      },
    ],
  },
};

const TermsOfService = () => {
  const { lang } = useLang();
  const c = content[lang];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--cream)', color: 'var(--text-main)' }}>
      <SeoHead
        title="Terms of Service — Creationation"
        description="Terms and conditions for Creationation web and mobile app development services. Project process, pricing, intellectual property."
        path="/terms"
      />
      <div className="flex-1 max-w-[800px] mx-auto px-7 md:px-16 py-16 md:py-24">
        <Link
          to="/"
          className="inline-block mb-10 text-sm hover:opacity-70 transition-opacity"
          style={{ color: 'var(--text-light)', fontFamily: 'var(--font-b)' }}
        >
          {t.legal.backHome[lang]}
        </Link>

        <h1 className="text-3xl md:text-4xl mb-3" style={{ fontFamily: 'var(--font-a)' }}>
          {t.legal.termsTitle[lang]}
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

export default TermsOfService;
