import { useLang } from '@/hooks/useLang';
import { useNavigate } from 'react-router-dom';
import { Settings } from 'lucide-react';
import t from '@/lib/translations';

const Footer = () => {
  const { lang } = useLang();
  const navigate = useNavigate();

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <footer className="relative z-[1] py-9" style={{ borderTop: '1px solid rgba(255,255,255,0.3)' }}>
      <div className="max-w-[1400px] mx-auto px-7 md:px-16">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-center md:text-left">
            <div style={{ fontFamily: 'var(--font-h)', fontSize: 16, color: 'var(--teal-deep)' }}>Creationation</div>
            <div className="text-xs mt-0.5 flex items-center gap-2" style={{ color: 'var(--text-ghost)' }}>
              {t.footer.copy[lang]}
              <button
                onClick={() => navigate('/admin/login')}
                className="bg-transparent border-none cursor-pointer p-1 opacity-30 hover:opacity-70 transition-opacity duration-300"
                title="Admin"
              >
                <Settings size={12} style={{ color: 'var(--text-ghost)' }} />
              </button>
            </div>
          </div>
          <ul className="flex gap-6 list-none">
            {[
              { label: t.nav.portfolio[lang], id: 'portfolio' },
              { label: t.nav.process[lang], id: 'process' },
              { label: t.nav.services[lang], id: 'services' },
              { label: t.nav.pricing[lang], id: 'pricing' },
              { label: t.footer.contact[lang], id: 'contact' },
            ].map((l) => (
              <li key={l.id}>
                <button
                  onClick={() => scrollTo(l.id)}
                  className="text-[13px] bg-transparent border-none cursor-pointer transition-colors duration-300"
                  style={{ color: 'var(--text-light)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--teal)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-light)')}
                >
                  {l.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
