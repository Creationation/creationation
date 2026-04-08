import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import {
  LayoutDashboard, Users, Ticket, FileText, Clock, StickyNote, Briefcase, ScrollText,
  Target, Mail, FolderKanban, Wallet, DollarSign, Image, LogOut, ExternalLink, Menu, X, ChevronLeft
} from 'lucide-react';

const mainNav = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, color: 'var(--charcoal)' },
  { to: '/admin/clients-crm', label: 'Clients', icon: Users, color: 'var(--violet)' },
  { to: '/admin/tickets', label: 'Tickets', icon: Ticket, color: '#ef4444', badge: 'tickets' },
  { to: '/admin/invoices', label: 'Facturation', icon: FileText, color: '#f59e0b', badge: 'overdue' },
  { to: '/admin/time-tracking', label: 'Time Tracking', icon: Clock, color: 'var(--sky)' },
  { to: '/admin/notes', label: 'Notes', icon: StickyNote, color: '#d4a55a' },
  { to: '/admin/services', label: 'Services', icon: Briefcase, color: 'var(--teal)' },
  { to: '/admin/contracts', label: 'Contrats', icon: ScrollText, color: '#8B5CF6' },
];

const secondaryNav = [
  { to: '/admin/prospects', label: 'Prospection', icon: Target, color: 'var(--teal)' },
  { to: '/admin/sequences', label: 'Séquences', icon: Mail, color: '#8B5CF6' },
  { to: '/admin/projects', label: 'Projets', icon: FolderKanban, color: '#3B82F6' },
  { to: '/admin/revenues', label: 'Revenus', icon: Wallet, color: 'var(--sky)' },
  { to: '/admin/costs', label: 'Coûts', icon: DollarSign, color: '#d4a55a' },
  { to: '/admin/portfolio', label: 'Portfolio', icon: Image, color: 'var(--coral)' },
];

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [badges, setBadges] = useState<{ tickets: number; overdue: number }>({ tickets: 0, overdue: 0 });

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  useEffect(() => {
    const fetchBadges = async () => {
      const [{ count: ticketCount }, { count: overdueCount }] = await Promise.all([
        supabase.from('support_tickets').select('*', { count: 'exact', head: true }).eq('status', 'open'),
        supabase.from('invoices').select('*', { count: 'exact', head: true }).eq('status', 'overdue' as any),
      ]);
      setBadges({ tickets: ticketCount || 0, overdue: overdueCount || 0 });
    };
    fetchBadges();
    const interval = setInterval(fetchBadges, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/admin/login');
  };

  const isActive = (path: string) => {
    if (path === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(path);
  };

  const renderNavItem = (item: typeof mainNav[0]) => {
    const active = isActive(item.to);
    const badgeKey = (item as any).badge as string | undefined;
    const badgeCount = badgeKey ? badges[badgeKey as keyof typeof badges] : 0;
    return (
      <Link
        key={item.to}
        to={item.to}
        className="flex items-center gap-3 transition-all duration-150"
        style={{
          padding: collapsed ? '10px' : '10px 14px',
          borderRadius: 12,
          background: active ? `${item.color}12` : 'transparent',
          color: active ? item.color : 'var(--text-mid)',
          fontFamily: 'var(--font-b)',
          fontSize: 13,
          fontWeight: active ? 600 : 400,
          textDecoration: 'none',
          justifyContent: collapsed ? 'center' : 'flex-start',
          position: 'relative',
        }}
      >
        <item.icon size={18} />
        {!collapsed && <span className="flex-1">{item.label}</span>}
        {!collapsed && badgeCount > 0 && (
          <span style={{
            background: item.color, color: '#fff', fontSize: 10, fontWeight: 700,
            padding: '2px 7px', borderRadius: 99, minWidth: 20, textAlign: 'center',
          }}>{badgeCount}</span>
        )}
        {collapsed && badgeCount > 0 && (
          <span style={{
            position: 'absolute', top: 4, right: 4,
            width: 8, height: 8, borderRadius: 99, background: item.color,
          }} />
        )}
      </Link>
    );
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 pb-2" style={{ borderBottom: '1px solid var(--glass-border)' }}>
        {!collapsed && (
          <h1 style={{ fontFamily: 'var(--font-h)', fontSize: 20, color: 'var(--charcoal)', flex: 1 }}>
            CRM
          </h1>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex items-center justify-center"
          style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: 'rgba(0,0,0,0.04)', cursor: 'pointer', color: 'var(--text-mid)' }}
        >
          <ChevronLeft size={16} style={{ transform: collapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
        </button>
      </div>

      {/* Main nav */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {!collapsed && (
          <p style={{ fontFamily: 'var(--font-b)', fontSize: 10, fontWeight: 600, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: 1, padding: '8px 14px 4px' }}>
            Support
          </p>
        )}
        {mainNav.map(renderNavItem)}

        <div style={{ height: 1, background: 'var(--glass-border)', margin: '12px 8px' }} />

        {!collapsed && (
          <p style={{ fontFamily: 'var(--font-b)', fontSize: 10, fontWeight: 600, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: 1, padding: '8px 14px 4px' }}>
            Business
          </p>
        )}
        {secondaryNav.map(renderNavItem)}
      </div>

      {/* Footer */}
      <div className="p-3 space-y-1" style={{ borderTop: '1px solid var(--glass-border)' }}>
        <Link
          to="/"
          className="flex items-center gap-3"
          style={{
            padding: collapsed ? '10px' : '10px 14px', borderRadius: 12,
            color: 'var(--teal)', fontFamily: 'var(--font-b)', fontSize: 13,
            textDecoration: 'none', justifyContent: collapsed ? 'center' : 'flex-start',
          }}
        >
          <ExternalLink size={16} />
          {!collapsed && <span>Voir le site</span>}
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full"
          style={{
            padding: collapsed ? '10px' : '10px 14px', borderRadius: 12,
            background: 'transparent', border: 'none', color: 'var(--coral)',
            fontFamily: 'var(--font-b)', fontSize: 13, cursor: 'pointer',
            justifyContent: collapsed ? 'center' : 'flex-start',
          }}
        >
          <LogOut size={16} />
          {!collapsed && <span>Déconnexion</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--cream)' }}>
      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex flex-col flex-shrink-0 sticky top-0 h-screen transition-all duration-200"
        style={{
          width: collapsed ? 72 : 240,
          background: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(20px)',
          borderRight: '1px solid var(--glass-border)',
        }}
      >
        {sidebarContent}
      </aside>

      {/* Mobile header + overlay */}
      <div className="flex-1 flex flex-col min-w-0">
        <header
          className="md:hidden flex items-center justify-between px-4 py-3 sticky top-0 z-40"
          style={{
            background: 'rgba(255,255,255,0.9)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid var(--glass-border)',
          }}
        >
          <button onClick={() => setMobileOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--charcoal)' }}>
            <Menu size={22} />
          </button>
          <h1 style={{ fontFamily: 'var(--font-h)', fontSize: 18, color: 'var(--charcoal)' }}>CRM</h1>
          <div style={{ width: 22 }} />
        </header>

        {/* Mobile sidebar overlay */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            <div className="absolute inset-0 bg-black/30" onClick={() => setMobileOpen(false)} />
            <div className="relative w-[260px] h-full flex flex-col" style={{
              background: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(24px)',
            }}>
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-3 right-3"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-mid)' }}
              >
                <X size={20} />
              </button>
              {sidebarContent}
            </div>
          </div>
        )}

        {/* Page content */}
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
