import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import AdminMeshBackground from './AdminMeshBackground';
import {
  LayoutDashboard, Users, Ticket, FileText, Clock, StickyNote, Briefcase, ScrollText,
  Target, Mail, FolderKanban, Wallet, DollarSign, Image, LogOut, ExternalLink, Menu, X, ChevronLeft
} from 'lucide-react';

const mainNav = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/clients-crm', label: 'Clients', icon: Users },
  { to: '/admin/tickets', label: 'Tickets', icon: Ticket, badge: 'tickets' as const },
  { to: '/admin/invoices', label: 'Facturation', icon: FileText, badge: 'overdue' as const },
  { to: '/admin/time-tracking', label: 'Time Tracking', icon: Clock },
  { to: '/admin/notes', label: 'Notes', icon: StickyNote },
  { to: '/admin/services', label: 'Services', icon: Briefcase },
  { to: '/admin/contracts', label: 'Contrats', icon: ScrollText },
];

const secondaryNav = [
  { to: '/admin/prospects', label: 'Prospection', icon: Target },
  { to: '/admin/sequences', label: 'Séquences', icon: Mail },
  { to: '/admin/projects', label: 'Projets', icon: FolderKanban },
  { to: '/admin/revenues', label: 'Revenus', icon: Wallet },
  { to: '/admin/costs', label: 'Coûts', icon: DollarSign },
  { to: '/admin/portfolio', label: 'Portfolio', icon: Image },
];

const TEAL = '#2A9D8F';
const TEXT_PRIMARY = '#1A2332';
const TEXT_SECONDARY = 'rgba(26,35,50,0.55)';
const TEXT_MUTED = 'rgba(26,35,50,0.30)';
const CORAL = '#E76F51';

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
        className="flex items-center gap-3 transition-all duration-200"
        style={{
          padding: collapsed ? '11px' : '11px 16px',
          borderRadius: 12,
          background: active ? 'rgba(42,157,143,0.10)' : 'transparent',
          borderLeft: active ? `3px solid ${TEAL}` : '3px solid transparent',
          color: active ? TEAL : TEXT_SECONDARY,
          fontFamily: "'Outfit', sans-serif",
          fontSize: 14,
          fontWeight: active ? 600 : 400,
          textDecoration: 'none',
          justifyContent: collapsed ? 'center' : 'flex-start',
          position: 'relative',
          backdropFilter: active ? 'blur(8px)' : 'none',
        }}
      >
        <item.icon size={17} style={{ opacity: active ? 1 : 0.5 }} />
        {!collapsed && <span className="flex-1">{item.label}</span>}
        {!collapsed && badgeCount > 0 && (
          <span style={{
            background: CORAL, color: '#fff', fontSize: 11, fontWeight: 700,
            padding: '0 6px', borderRadius: 10, minWidth: 20, height: 20,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'Outfit', sans-serif",
          }}>{badgeCount}</span>
        )}
        {collapsed && badgeCount > 0 && (
          <span style={{
            position: 'absolute', top: 4, right: 4,
            width: 8, height: 8, borderRadius: 99, background: CORAL,
          }} />
        )}
      </Link>
    );
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 p-4 pb-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.20)' }}>
        {!collapsed && (
          <>
            <div style={{
              width: 38, height: 38, borderRadius: 12,
              background: `linear-gradient(135deg, ${TEAL}, #3EDDC7)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, fontWeight: 700, color: '#fff',
              boxShadow: '0 4px 20px rgba(42,157,143,0.35)',
            }}>C</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: TEXT_PRIMARY, fontFamily: "'Outfit', sans-serif" }}>Creationation</div>
              <div style={{ fontSize: 11, color: TEAL, letterSpacing: 1.5, textTransform: 'uppercase' as const, fontWeight: 500, fontFamily: "'Outfit', sans-serif" }}>Studio</div>
            </div>
          </>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex items-center justify-center"
          style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: 'rgba(255,255,255,0.15)', cursor: 'pointer', color: TEXT_SECONDARY }}
        >
          <ChevronLeft size={16} style={{ transform: collapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
        </button>
      </div>

      {/* Main nav */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {!collapsed && (
          <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 10, fontWeight: 600, color: TEXT_MUTED, textTransform: 'uppercase' as const, letterSpacing: 2, padding: '8px 16px 4px' }}>
            Support
          </p>
        )}
        {mainNav.map(renderNavItem)}

        <div style={{ height: 1, background: 'rgba(255,255,255,0.20)', margin: '12px 8px' }} />

        {!collapsed && (
          <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 10, fontWeight: 600, color: TEXT_MUTED, textTransform: 'uppercase' as const, letterSpacing: 2, padding: '8px 16px 4px' }}>
            Business
          </p>
        )}
        {secondaryNav.map(renderNavItem)}
      </div>

      {/* Footer */}
      <div className="p-3 space-y-1" style={{ borderTop: '1px solid rgba(255,255,255,0.20)' }}>
        <Link
          to="/"
          className="flex items-center gap-3"
          style={{
            padding: collapsed ? '10px' : '10px 14px', borderRadius: 12,
            color: TEAL, fontFamily: "'Outfit', sans-serif", fontSize: 13,
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
            background: 'transparent', border: 'none', color: CORAL,
            fontFamily: "'Outfit', sans-serif", fontSize: 13, cursor: 'pointer',
            justifyContent: collapsed ? 'center' : 'flex-start',
          }}
        >
          <LogOut size={16} />
          {!collapsed && <span>Déconnexion</span>}
        </button>

        {/* Admin avatar */}
        {!collapsed && (
          <div className="flex items-center gap-2 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.15)', marginTop: 8 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: 'rgba(42,157,143,0.12)', border: '1px solid rgba(42,157,143,0.20)',
              backdropFilter: 'blur(8px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 600, color: TEAL, fontFamily: "'Outfit', sans-serif",
            }}>D</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY, fontFamily: "'Outfit', sans-serif" }}>Diego</div>
              <div style={{ fontSize: 11, color: TEAL, fontWeight: 500, fontFamily: "'Outfit', sans-serif" }}>Admin</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex" style={{ position: 'relative', fontFamily: "'Outfit', sans-serif" }}>
      <AdminMeshBackground />

      <div className="relative z-[1] flex w-full min-h-screen">
        {/* Desktop sidebar */}
        <aside
          className="hidden md:flex flex-col flex-shrink-0 sticky top-0 h-screen transition-all duration-200"
          style={{
            width: collapsed ? 72 : 256,
            background: 'rgba(255,255,255,0.15)',
            backdropFilter: 'blur(24px) saturate(1.3)',
            WebkitBackdropFilter: 'blur(24px) saturate(1.3)',
            borderRight: '1px solid rgba(255,255,255,0.25)',
          }}
        >
          {sidebarContent}
        </aside>

        {/* Mobile header + overlay */}
        <div className="flex-1 flex flex-col min-w-0">
          <header
            className="md:hidden flex items-center justify-between px-4 py-3 sticky top-0 z-40"
            style={{
              background: 'rgba(255,255,255,0.20)',
              backdropFilter: 'blur(20px) saturate(1.4)',
              borderBottom: '1px solid rgba(255,255,255,0.25)',
            }}
          >
            <button onClick={() => setMobileOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: TEXT_PRIMARY }}>
              <Menu size={22} />
            </button>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: TEXT_PRIMARY }}>Creationation</h1>
            <div style={{ width: 22 }} />
          </header>

          {/* Mobile sidebar overlay */}
          {mobileOpen && (
            <div className="fixed inset-0 z-50 md:hidden flex">
              <div className="absolute inset-0 bg-black/30" onClick={() => setMobileOpen(false)} />
              <div className="relative w-[260px] h-full flex flex-col" style={{
                background: 'rgba(255,255,255,0.20)',
                backdropFilter: 'blur(24px) saturate(1.4)',
              }}>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="absolute top-3 right-3"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: TEXT_SECONDARY }}
                >
                  <X size={20} />
                </button>
                {sidebarContent}
              </div>
            </div>
          )}

          {/* Page content */}
          <main className="flex-1 relative">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
