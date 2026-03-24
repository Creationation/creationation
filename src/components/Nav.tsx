import { useState } from 'react';
import { useLang } from '@/hooks/useLang';
import t from '@/lib/translations';
import type { Lang } from '@/lib/translations';
import { Menu, X } from 'lucide-react';
import logo from '@/assets/logo.png';

const langs: Lang[] = ['fr', 'en', 'de'];
const labels: Record<Lang, string> = { fr: 'FR', en: 'EN', de: 'DE' };

const Nav = ({ onContact }: { onContact?: () => void }) => {
  const { lang, setLang } = useLang();
  const n = t.nav;
  const [menuOpen, setMenuOpen] = useState(false);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMenuOpen(false);
  };

  const links = [
    { label: n.portfolio[lang], id: 'portfolio' },
    { label: n.process[lang], id: 'process' },
    { label: n.services[lang], id: 'services' },
    { label: n.pricing[lang], id: 'pricing' },
  ];

  return (
    <>
      <nav
        className="fixed top-5 left-1/2 z-[100] flex items-center gap-3 md:gap-6"
        style={{
          transform: 'translateX(-50%)',
          padding: '8px 10px 8px 14px',
          background: 'rgba(255,255,255,0.4)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.6)',
          borderRadius: 'var(--pill)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.6)',
          animation: 'navIn 0.8s cubic-bezier(.23,1,.32,1) forwards',
          opacity: 0,
          maxWidth: 'calc(100vw - 32px)',
        }}
      >
        <img src={logo} alt="CreationNation" className="h-7 md:h-8 w-auto shrink-0" />
        <ul className="hidden md:flex gap-6 list-none">
          {links.map((l) => (
            <li key={l.id}>
              <button
                onClick={() => scrollTo(l.id)}
                className="text-sm font-medium transition-colors duration-300 bg-transparent border-none cursor-pointer"
                style={{ color: 'var(--text-mid)', fontFamily: 'var(--font-b)' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--teal)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-mid)')}
              >
                {l.label}
              </button>
            </li>
          ))}
        </ul>

        {/* Lang switcher */}
        <div className="flex gap-1">
          {langs.map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className="text-xs font-semibold border-none cursor-pointer transition-all duration-200"
              style={{
                padding: '5px 10px',
                borderRadius: 'var(--pill)',
                background: lang === l ? 'var(--teal)' : 'transparent',
                color: lang === l ? '#fff' : 'var(--text-light)',
                fontFamily: 'var(--font-m)',
              }}
            >
              {labels[l]}
            </button>
          ))}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden bg-transparent border-none cursor-pointer p-1"
          onClick={() => setMenuOpen(!menuOpen)}
          style={{ color: 'var(--charcoal)' }}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        <button
          onClick={() => onContact ? onContact() : scrollTo('contact')}
          className="hidden md:inline-flex"
          style={{
            padding: '10px 24px',
            background: 'var(--teal)',
            color: '#fff',
            border: 'none',
            borderRadius: 'var(--pill)',
            fontFamily: 'var(--font-b)',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(.23,1,.32,1)',
            boxShadow: '0 2px 16px var(--teal-glow)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--teal-deep)';
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--teal)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          {n.cta[lang]}
        </button>
      </nav>

      {/* Mobile menu overlay */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-[99] flex flex-col items-center justify-center gap-6 md:hidden"
          style={{
            background: 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(32px)',
            WebkitBackdropFilter: 'blur(32px)',
            animation: 'fadeUp 0.3s ease forwards',
          }}
        >
          {links.map((l) => (
            <button
              key={l.id}
              onClick={() => scrollTo(l.id)}
              className="text-xl font-medium bg-transparent border-none cursor-pointer"
              style={{ color: 'var(--charcoal)', fontFamily: 'var(--font-h)' }}
            >
              {l.label}
            </button>
          ))}
          <button
            onClick={() => { setMenuOpen(false); onContact ? onContact() : scrollTo('contact'); }}
            style={{
              marginTop: 12,
              padding: '14px 36px',
              background: 'var(--teal)',
              color: '#fff',
              border: 'none',
              borderRadius: 'var(--pill)',
              fontFamily: 'var(--font-b)',
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 2px 16px var(--teal-glow)',
            }}
          >
            {n.cta[lang]}
          </button>
        </div>
      )}
    </>
  );
};

export default Nav;
