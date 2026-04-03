import { useLang } from '@/hooks/useLang';
import { useNavigate, Link } from 'react-router-dom';
import { Settings } from 'lucide-react';
import t from '@/lib/translations';
import logo from '@/assets/logo.png';

const Footer = () => {
  const { lang } = useLang();
  const navigate = useNavigate();

  return (
    <footer className="relative z-[1] py-9" style={{ borderTop: '1px solid rgba(255,255,255,0.3)' }}>
      <div className="max-w-[1400px] mx-auto px-7 md:px-16">
        <div className="flex flex-col items-center gap-3">
          <img src={logo} alt="CreationNation" className="h-8" />
          <div className="flex items-center gap-4 text-xs" style={{ fontFamily: 'var(--font-b)' }}>
            <Link to="/about" className="hover:opacity-70 transition-opacity" style={{ color: 'var(--text-ghost)' }}>
              {t.nav.about[lang]}
            </Link>
            <span style={{ color: 'var(--text-ghost)', opacity: 0.4 }}>|</span>
            <Link to="/privacy" className="hover:opacity-70 transition-opacity" style={{ color: 'var(--text-ghost)' }}>
              {t.footer.privacy[lang]}
            </Link>
            <span style={{ color: 'var(--text-ghost)', opacity: 0.4 }}>|</span>
            <Link to="/terms" className="hover:opacity-70 transition-opacity" style={{ color: 'var(--text-ghost)' }}>
              {t.footer.terms[lang]}
            </Link>
            <span style={{ color: 'var(--text-ghost)', opacity: 0.4 }}>|</span>
            <Link to="/impressum" className="hover:opacity-70 transition-opacity" style={{ color: 'var(--text-ghost)' }}>
              {t.footer.impressum[lang]}
            </Link>
          </div>
          <div className="text-xs flex items-center gap-2" style={{ color: 'var(--text-ghost)' }}>
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
      </div>
    </footer>
  );
};

export default Footer;
