import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Home, FolderOpen, MessageSquare, FileText, MoreHorizontal, Bell, LogOut, User, FolderUp, Settings } from 'lucide-react';

type ClientData = {
  id: string;
  business_name: string;
  contact_name: string | null;
  email: string | null;
  portal_user_id: string;
};

const navItems = [
  { to: '/portal', label: 'Accueil', icon: Home },
  { to: '/portal/project', label: 'Projet', icon: FolderOpen },
  { to: '/portal/messages', label: 'Messages', icon: MessageSquare },
  { to: '/portal/invoices', label: 'Factures', icon: FileText },
];

const moreItems = [
  { to: '/portal/files', label: 'Fichiers', icon: FolderUp },
  { to: '/portal/profile', label: 'Mon profil', icon: Settings },
];

const PortalLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [client, setClient] = useState<ClientData | null>(null);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifs, setNotifs] = useState<any[]>([]);
  const [showMore, setShowMore] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchClient = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate('/portal/login'); return; }

    const { data: clientData } = await supabase
      .from('clients')
      .select('id,business_name,contact_name,email,portal_user_id')
      .eq('portal_user_id', user.id)
      .eq('portal_enabled', true)
      .single();

    if (!clientData) { navigate('/portal/login'); return; }
    setClient(clientData as any);

    const { data: notifsData, count } = await supabase
      .from('portal_notifications')
      .select('*', { count: 'exact' })
      .eq('client_id', (clientData as any).id)
      .eq('is_read', false)
      .order('created_at', { ascending: false })
      .limit(10);

    setNotifs(notifsData || []);
    setUnreadNotifs(count || 0);
    setLoading(false);
  }, [navigate]);

  useEffect(() => { fetchClient(); }, [fetchClient]);

  // Realtime notifications
  useEffect(() => {
    if (!client?.id) return;
    const channel = supabase.channel(`portal-notifs-${client.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'portal_notifications',
        filter: `client_id=eq.${client.id}`,
      }, (payload: any) => {
        const n = payload.new;
        setNotifs(prev => [n, ...prev]);
        setUnreadNotifs(c => c + 1);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [client?.id]);

  const markRead = async (id: string) => {
    await supabase.from('portal_notifications').update({ is_read: true } as any).eq('id', id);
    setNotifs(n => n.filter(x => x.id !== id));
    setUnreadNotifs(c => Math.max(0, c - 1));
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/portal/login');
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--cream)' }}>
      <div style={{ fontFamily: 'var(--font-b)', color: 'var(--text-light)' }}>Chargement...</div>
    </div>
  );

  const firstName = client?.contact_name?.split(' ')[0] || client?.business_name || 'Client';

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--cream)' }}>
      {/* Top navbar */}
      <header className="flex items-center justify-between px-4 md:px-6 py-3 sticky top-0 z-50" style={{
        background: 'var(--glass-bg-strong)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--glass-border)',
      }}>
        <Link to="/portal" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: 'var(--font-h)', fontSize: 18, color: 'var(--teal)' }}>CreationNation</span>
          <span style={{ fontFamily: 'var(--font-b)', fontSize: 11, color: 'var(--text-light)', padding: '2px 8px', background: 'var(--teal-glow)', borderRadius: 'var(--pill)' }}>Espace Client</span>
        </Link>

        <div className="flex items-center gap-2">
          {/* Notifications */}
          <div className="relative">
            <button onClick={() => { setShowNotifs(!showNotifs); setShowMore(false); }} style={{
              position: 'relative', width: 36, height: 36, borderRadius: 10,
              background: showNotifs ? 'var(--teal-glow)' : 'transparent', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--charcoal)',
            }}>
              <Bell size={18} />
              {unreadNotifs > 0 && (
                <span style={{
                  position: 'absolute', top: 4, right: 4, width: 16, height: 16, borderRadius: '50%',
                  background: 'var(--coral)', color: '#fff', fontSize: 9, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{unreadNotifs > 9 ? '9+' : unreadNotifs}</span>
              )}
            </button>

            {showNotifs && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 320, maxHeight: 400, overflowY: 'auto',
                background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)', borderRadius: 16,
                border: '1px solid var(--glass-border)', boxShadow: '0 12px 40px rgba(0,0,0,0.12)', padding: 8,
              }}>
                <div style={{ padding: '8px 12px', fontFamily: 'var(--font-b)', fontSize: 13, fontWeight: 600, color: 'var(--charcoal)' }}>
                  Notifications
                </div>
                {notifs.length === 0 ? (
                  <div style={{ padding: 20, textAlign: 'center', fontFamily: 'var(--font-b)', fontSize: 13, color: 'var(--text-light)' }}>
                    Aucune notification
                  </div>
                ) : notifs.map(n => (
                  <div key={n.id} onClick={() => { markRead(n.id); if (n.link) navigate(n.link); setShowNotifs(false); }}
                    style={{
                      padding: '10px 12px', borderRadius: 10, cursor: 'pointer', marginBottom: 2,
                      background: 'transparent', transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.03)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ fontFamily: 'var(--font-b)', fontSize: 13, fontWeight: 600, color: 'var(--charcoal)' }}>{n.title}</div>
                    {n.message && <div style={{ fontFamily: 'var(--font-b)', fontSize: 12, color: 'var(--text-mid)', marginTop: 2 }}>{n.message}</div>}
                    <div style={{ fontFamily: 'var(--font-b)', fontSize: 10, color: 'var(--text-light)', marginTop: 4 }}>
                      {new Date(n.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* User menu */}
          <button onClick={handleLogout} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 10,
            background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-mid)',
            fontFamily: 'var(--font-b)', fontSize: 13,
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%', background: 'var(--teal-glow)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--teal)', fontWeight: 700, fontSize: 12,
            }}>
              {firstName[0]?.toUpperCase()}
            </div>
            <span className="hidden md:inline">{firstName}</span>
          </button>
        </div>
      </header>

      {/* Desktop sidebar + content */}
      <div className="flex flex-1">
        {/* Desktop sidebar */}
        <nav className="hidden md:flex flex-col w-56 p-3 gap-1 shrink-0" style={{
          borderRight: '1px solid var(--glass-border)',
        }}>
          {[...navItems, ...moreItems].map(item => {
            const isActive = location.pathname === item.to;
            return (
              <Link key={item.to} to={item.to} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 12, textDecoration: 'none',
                background: isActive ? 'var(--teal-glow)' : 'transparent',
                color: isActive ? 'var(--teal)' : 'var(--text-mid)',
                fontFamily: 'var(--font-b)', fontSize: 14, fontWeight: isActive ? 600 : 400,
                transition: 'all 0.15s ease',
              }}>
                <item.icon size={18} />
                {item.label}
              </Link>
            );
          })}

          <div style={{ flex: 1 }} />
          <button onClick={handleLogout} style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 12,
            background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--coral)',
            fontFamily: 'var(--font-b)', fontSize: 14, width: '100%', textAlign: 'left',
          }}>
            <LogOut size={18} /> Déconnexion
          </button>
        </nav>

        {/* Main content */}
        <main className="flex-1 p-4 md:p-6 pb-24 md:pb-6 max-w-5xl mx-auto w-full">
          <Outlet context={{ client }} />
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around py-2" style={{
        background: 'var(--glass-bg-strong)', backdropFilter: 'blur(20px)', borderTop: '1px solid var(--glass-border)',
      }}>
        {navItems.map(item => {
          const isActive = location.pathname === item.to;
          return (
            <Link key={item.to} to={item.to} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, textDecoration: 'none',
              color: isActive ? 'var(--teal)' : 'var(--text-light)',
              fontFamily: 'var(--font-b)', fontSize: 10, fontWeight: isActive ? 600 : 400,
              padding: '4px 12px',
            }}>
              <item.icon size={20} />
              {item.label}
            </Link>
          );
        })}
        <div className="relative">
          <button onClick={() => { setShowMore(!showMore); setShowNotifs(false); }} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
            color: showMore ? 'var(--teal)' : 'var(--text-light)',
            fontFamily: 'var(--font-b)', fontSize: 10, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 12px',
          }}>
            <MoreHorizontal size={20} />
            Plus
          </button>
          {showMore && (
            <div style={{
              position: 'absolute', bottom: 'calc(100% + 8px)', right: -20, width: 180,
              background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)', borderRadius: 14,
              border: '1px solid var(--glass-border)', boxShadow: '0 8px 30px rgba(0,0,0,0.12)', padding: 6,
            }}>
              {moreItems.map(item => (
                <Link key={item.to} to={item.to} onClick={() => setShowMore(false)} style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 8, textDecoration: 'none',
                  color: location.pathname === item.to ? 'var(--teal)' : 'var(--text-mid)',
                  fontFamily: 'var(--font-b)', fontSize: 13,
                }}>
                  <item.icon size={16} /> {item.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </nav>
    </div>
  );
};

export default PortalLayout;
