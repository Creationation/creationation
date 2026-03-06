import { useLang } from '@/hooks/useLang';
import t from '@/lib/translations';
import type { Lang } from '@/lib/translations';

const langs: Lang[] = ['fr', 'en', 'de'];
const labels: Record<Lang, string> = { fr: 'FR', en: 'EN', de: 'DE' };

const Nav = () => {
  const { lang, setLang } = useLang();
  const n = t.nav;

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <nav
      className="fixed top-5 left-1/2 z-[100] flex items-center gap-4 md:gap-8"
      style={{
        transform: 'translateX(-50%)',
        padding: '10px 10px 10px 28px',
        background: 'rgba(255,255,255,0.4)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(255,255,255,0.6)',
        borderRadius: 'var(--pill)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.6)',
        animation: 'navIn 0.8s cubic-bezier(.23,1,.32,1) forwards',
        opacity: 0,
      }}
    >
      <span style={{ fontFamily: 'var(--font-h)', fontSize: 18, color: 'var(--teal-deep)', letterSpacing: -0.3 }}>
        Creationation
      </span>
      <ul className="hidden md:flex gap-6 list-none">
        {[
          { label: n.portfolio[lang], id: 'portfolio' },
          { label: n.process[lang], id: 'process' },
          { label: n.services[lang], id: 'services' },
        ].map((l) => (
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

      <button
        onClick={() => scrollTo('contact')}
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
  );
};

export default Nav;
