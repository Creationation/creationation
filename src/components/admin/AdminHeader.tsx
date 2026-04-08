import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Menu, X, Target, Users, Wallet, DollarSign, LayoutDashboard, LogOut, ExternalLink, FolderKanban, FileText, Mail, Image } from 'lucide-react';

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, color: '#2a2722' },
  { to: '/admin/prospects', label: 'Prospection', icon: Target, color: '#2DD4B8' },
  { to: '/admin/sequences', label: 'Séquences', icon: Mail, color: '#8B5CF6' },
  { to: '/admin/clients', label: 'Clients', icon: Users, color: '#A78BDB' },
  { to: '/admin/projects', label: 'Projets', icon: FolderKanban, color: '#3B82F6' },
  { to: '/admin/invoices', label: 'Factures', icon: FileText, color: '#f59e0b' },
  { to: '/admin/revenues', label: 'Revenus', icon: Wallet, color: '#4da6d9' },
  { to: '/admin/costs', label: 'Coûts', icon: DollarSign, color: '#F0C95C' },
  { to: '/admin/portfolio', label: 'Portfolio', icon: Image, color: '#F07067' },
];

const AdminHeader = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Close on route change
  useEffect(() => { setOpen(false); }, [location.pathname]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/admin/login');
  };

  const currentPage = navItems.find(n => n.to === location.pathname);

  return (
    <header
      className="flex items-center justify-between px-5 py-3 sticky top-0 z-50"
      style={{
        background: 'rgba(255,255,255,0.45)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(0,0,0,0.08)',
      }}
    >
      <div className="flex items-center gap-3">
        <div ref={menuRef} className="relative">
          <button
            onClick={() => setOpen(v => !v)}
            className="flex items-center justify-center"
            style={{
              width: 38, height: 38,
              background: open ? '#2DD4B8' : 'rgba(0,0,0,0.05)',
              color: open ? '#fff' : '#2a2722',
              border: 'none',
              borderRadius: 12,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>

          {/* Dropdown */}
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              left: 0,
              minWidth: 220,
              background: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(24px)',
              borderRadius: 16,
              border: '1px solid rgba(0,0,0,0.08)',
              boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
              padding: '8px',
              opacity: open ? 1 : 0,
              transform: open ? 'translateY(0) scale(1)' : 'translateY(-8px) scale(0.96)',
              pointerEvents: open ? 'auto' : 'none',
              transition: 'opacity 0.2s ease, transform 0.25s cubic-bezier(0.4,0,0.2,1)',
              zIndex: 100,
            }}
          >
            {navItems.map(item => {
              const isActive = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 14px',
                    borderRadius: 10,
                    background: isActive ? `${item.color}12` : 'transparent',
                    color: isActive ? item.color : '#6b6560',
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: 14,
                    fontWeight: isActive ? 600 : 400,
                    textDecoration: 'none',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(0,0,0,0.04)'; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                >
                  <item.icon size={16} />
                  {item.label}
                </Link>
              );
            })}

            <div style={{ height: 1, background: 'rgba(0,0,0,0.08)', margin: '6px 8px' }} />

            <Link
              to="/"
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px',
                borderRadius: 10,
                color: '#2DD4B8',
                fontFamily: "'Outfit', sans-serif",
                fontSize: 14,
                textDecoration: 'none',
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(13,138,111,0.06)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >
              <ExternalLink size={16} />
              Voir le site
            </Link>

            <button
              onClick={handleLogout}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px',
                borderRadius: 10,
                width: '100%',
                background: 'transparent',
                border: 'none',
                color: '#F07067',
                fontFamily: "'Outfit', sans-serif",
                fontSize: 14,
                cursor: 'pointer',
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(232,115,90,0.08)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >
              <LogOut size={16} />
              Déconnexion
            </button>
          </div>
        </div>

        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: '#2a2722', margin: 0 }}>
          CRM
        </h1>
        {currentPage && currentPage.to !== '/admin' && (
          <span style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: 13,
            fontWeight: 600,
            color: currentPage.color,
            padding: '4px 12px',
            background: `${currentPage.color}12`,
            borderRadius: '100px',
          }}>
            {currentPage.label}
          </span>
        )}
      </div>
    </header>
  );
};

export default AdminHeader;
