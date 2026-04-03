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
      {/* Top bar */}
      <nav
        className="fixed top-4 left-4 z-[100]"
      >

        <button
          onClick={() => setMenuOpen(true)}
          className="flex items-center justify-center border-none cursor-pointer"
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: 'rgba(255,255,255,0.5)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.6)',
            color: 'var(--charcoal)',
            transition: 'all 0.2s ease',
          }}
        >
          <Menu size={20} />
        </button>
      </nav>

      {/* Full-screen overlay menu */}
      <div
        className="fixed inset-0 z-[200] flex flex-col"
        style={{
          background: 'rgba(255,255,255,0.96)',
          backdropFilter: 'blur(32px)',
          WebkitBackdropFilter: 'blur(32px)',
          opacity: menuOpen ? 1 : 0,
          pointerEvents: menuOpen ? 'auto' : 'none',
          transition: 'opacity 0.3s ease',
        }}
      >
        {/* Overlay header */}
        <div className="flex items-center justify-between" style={{ padding: '16px 24px' }}>
          <img src={logo} alt="CreationNation" className="h-8" />
          <button
            onClick={() => setMenuOpen(false)}
            className="flex items-center justify-center border-none cursor-pointer"
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'var(--teal)',
              color: '#fff',
              border: 'none',
              transition: 'all 0.2s ease',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Menu links */}
        <div className="flex-1 flex flex-col items-center justify-center gap-6">
          {links.map((l, i) => (
            <button
              key={l.id}
              onClick={() => scrollTo(l.id)}
              className="bg-transparent border-none cursor-pointer"
              style={{
                fontFamily: 'var(--font-h)',
                fontSize: 28,
                color: 'var(--charcoal)',
                opacity: menuOpen ? 1 : 0,
                transform: menuOpen ? 'translateY(0)' : 'translateY(16px)',
                transition: `opacity 0.3s ease ${i * 0.06 + 0.1}s, transform 0.4s cubic-bezier(.23,1,.32,1) ${i * 0.06 + 0.1}s`,
              }}
            >
              {l.label}
            </button>
          ))}

          <button
            onClick={() => {
              setMenuOpen(false);
              onContact ? onContact() : scrollTo('contact');
            }}
            style={{
              marginTop: 16,
              padding: '14px 40px',
              background: 'var(--teal)',
              color: '#fff',
              border: 'none',
              borderRadius: 'var(--pill)',
              fontFamily: 'var(--font-b)',
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 2px 16px var(--teal-glow)',
              opacity: menuOpen ? 1 : 0,
              transform: menuOpen ? 'translateY(0)' : 'translateY(16px)',
              transition: `opacity 0.3s ease 0.35s, transform 0.4s cubic-bezier(.23,1,.32,1) 0.35s`,
            }}
          >
            {n.cta[lang]}
          </button>
        </div>

        {/* Lang switcher at bottom */}
        <div className="flex justify-center gap-2 pb-10">
          {langs.map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className="text-xs font-semibold border-none cursor-pointer transition-all duration-200"
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--pill)',
                background: lang === l ? 'var(--teal)' : 'rgba(0,0,0,0.05)',
                color: lang === l ? '#fff' : 'var(--text-light)',
                fontFamily: 'var(--font-m)',
              }}
            >
              {labels[l]}
            </button>
          ))}
        </div>
      </div>
    </>
  );
};

export default Nav;
