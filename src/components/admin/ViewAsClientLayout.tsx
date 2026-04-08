import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate, useParams, Outlet } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Home, TicketCheck, FolderOpen, User, ArrowLeft, Eye } from 'lucide-react';

const navItems = [
  { to: '', label: 'Dashboard', icon: Home },
  { to: 'tickets', label: 'Tickets', icon: TicketCheck },
  { to: 'project', label: 'Mon Projet', icon: FolderOpen },
  { to: 'profile', label: 'Profil', icon: User },
];

const ViewAsClientLayout = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchClient = useCallback(async () => {
    if (!clientId) return;
    const { data } = await supabase
      .from('clients')
      .select('id,business_name,business_type,contact_name,email,phone,address,city,country,avatar_url,subscription_status,portal_user_id,company_address')
      .eq('id', clientId)
      .single();
    if (!data) { navigate('/admin/clients-crm'); return; }
    setClient(data);
    setLoading(false);
  }, [clientId, navigate]);

  useEffect(() => { fetchClient(); }, [fetchClient]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--cream)' }}>
      <div style={{ fontFamily: 'var(--font-b)', color: 'var(--text-light)' }}>Chargement...</div>
    </div>
  );

  const basePath = `/admin/view-as/${clientId}`;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--cream)' }}>
      {/* Simulation banner */}
      <div className="flex items-center justify-between px-4 md:px-6 py-2.5 sticky top-0 z-[60]" style={{
        background: 'var(--teal)', color: '#fff',
      }}>
        <div className="flex items-center gap-2" style={{ fontFamily: 'var(--font-b)', fontSize: 13, fontWeight: 600 }}>
          <Eye size={16} />
          <span>Mode simulation : tu visualises le portail de <strong>{client?.business_name}</strong></span>
        </div>
        <button onClick={() => navigate('/admin/clients-crm')} style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '6px 16px', borderRadius: 99,
          background: 'rgba(255,255,255,0.2)', color: '#fff', border: 'none', fontFamily: 'var(--font-b)',
          fontSize: 12, fontWeight: 600, cursor: 'pointer', backdropFilter: 'blur(4px)',
        }}>
          <ArrowLeft size={14} /> Retour à l'admin
        </button>
      </div>

      {/* Portal header */}
      <header className="flex items-center justify-between px-4 md:px-6 py-3 sticky top-[41px] z-50" style={{
        background: 'var(--glass-bg-strong)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--glass-border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: 'var(--font-h)', fontSize: 18, color: 'var(--teal)' }}>Creationation</span>
          <span style={{ fontFamily: 'var(--font-b)', fontSize: 11, color: 'var(--text-light)', padding: '2px 8px', background: 'var(--teal-glow)', borderRadius: 'var(--pill)' }}>Espace Client</span>
        </div>
        <div className="flex items-center gap-2">
          <div style={{
            width: 28, height: 28, borderRadius: '50%', background: 'var(--teal-glow)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--teal)', fontWeight: 700, fontSize: 12,
          }}>
            {(client?.contact_name?.[0] || client?.business_name?.[0] || 'C').toUpperCase()}
          </div>
          <span style={{ fontFamily: 'var(--font-b)', fontSize: 13, color: 'var(--text-mid)' }}>
            {client?.contact_name?.split(' ')[0] || client?.business_name}
          </span>
        </div>
      </header>

      {/* Desktop sidebar + content */}
      <div className="flex flex-1">
        <nav className="hidden md:flex flex-col w-56 p-3 gap-1 shrink-0" style={{ borderRight: '1px solid var(--glass-border)' }}>
          {navItems.map(item => {
            const fullPath = item.to ? `${basePath}/${item.to}` : basePath;
            const isActive = item.to === ''
              ? location.pathname === basePath || location.pathname === basePath + '/'
              : location.pathname.startsWith(fullPath);
            return (
              <Link key={item.to} to={fullPath} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 12, textDecoration: 'none',
                background: isActive ? 'var(--teal-glow)' : 'transparent',
                color: isActive ? 'var(--teal)' : 'var(--text-mid)',
                fontFamily: 'var(--font-b)', fontSize: 14, fontWeight: isActive ? 600 : 400,
              }}>
                <item.icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <main className="flex-1 p-4 md:p-6 pb-24 md:pb-6 max-w-5xl mx-auto w-full">
          <Outlet context={{ client, refreshNotifs: () => {}, simulationMode: true }} />
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around py-2" style={{
        background: 'var(--glass-bg-strong)', backdropFilter: 'blur(20px)', borderTop: '1px solid var(--glass-border)',
      }}>
        {navItems.map(item => {
          const fullPath = item.to ? `${basePath}/${item.to}` : basePath;
          const isActive = item.to === ''
            ? location.pathname === basePath || location.pathname === basePath + '/'
            : location.pathname.startsWith(fullPath);
          return (
            <Link key={item.to} to={fullPath} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, textDecoration: 'none',
              color: isActive ? 'var(--teal)' : 'var(--text-light)',
              fontFamily: 'var(--font-b)', fontSize: 10, fontWeight: isActive ? 600 : 400, padding: '4px 12px',
            }}>
              <item.icon size={20} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default ViewAsClientLayout;
