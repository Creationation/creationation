import { useState } from 'react';
import Blobs from '@/components/Blobs';
import Nav from '@/components/Nav';
import Hero from '@/components/Hero';
import Services from '@/components/Services';
import Portfolio from '@/components/Portfolio';
import Process from '@/components/Process';
import TechStrip from '@/components/TechStrip';
import Testimonial from '@/components/Testimonial';
import Pricing from '@/components/Pricing';
import FAQ from '@/components/FAQ';
import Guarantees from '@/components/Guarantees';
import CtaSection from '@/components/CtaSection';
import ContactInfo from '@/components/ContactInfo';
import Footer from '@/components/Footer';
import WhatsAppFloat from '@/components/WhatsAppFloat';
import ContactFormModal from '@/components/ContactFormModal';
import SeoHead from '@/components/SeoHead';

const Index = () => {
  const [contactOpen, setContactOpen] = useState(false);

  return (
    <>
      <Blobs />
      <Nav onContact={() => setContactOpen(true)} />
      <Hero onContact={() => setContactOpen(true)} />
      <Services />
      <Portfolio />
      <Process />
      <TechStrip />
      <Testimonial />
      <Pricing onContact={() => setContactOpen(true)} />
      <FAQ />
      <Guarantees />
      <CtaSection onContact={() => setContactOpen(true)} />
      <ContactInfo />
      <Footer />
      <WhatsAppFloat />
      <ContactFormModal open={contactOpen} onOpenChange={setContactOpen} />
    </>
  );
};

export default Index;
