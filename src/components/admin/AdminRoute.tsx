import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const ADMIN_CACHE_KEY = 'admin_verified_at';
const ADMIN_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24h

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute = ({ children }: AdminRouteProps) => {
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAdmin = async (userId: string) => {
      // Check local cache first
      const cachedAt = localStorage.getItem(ADMIN_CACHE_KEY);
      if (cachedAt && Date.now() - parseInt(cachedAt, 10) < ADMIN_CACHE_DURATION) {
        setAuthorized(true);
        return;
      }

      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin');

      if (!roles || roles.length === 0) {
        localStorage.removeItem(ADMIN_CACHE_KEY);
        await supabase.auth.signOut();
        navigate('/admin/login', { replace: true });
        return;
      }

      localStorage.setItem(ADMIN_CACHE_KEY, Date.now().toString());
      setAuthorized(true);
    };

    // Use getSession (reads localStorage, no network) first
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        localStorage.removeItem(ADMIN_CACHE_KEY);
        navigate('/admin/login', { replace: true });
        return;
      }
      await checkAdmin(session.user.id);
    };

    init();

    // Listen for auth changes (token refresh, logout, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        localStorage.removeItem(ADMIN_CACHE_KEY);
        setAuthorized(false);
        navigate('/admin/login', { replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (authorized === null) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--cream)' }}>
        <div style={{ fontFamily: 'var(--font-b)', color: 'var(--text-light)' }}>Vérification...</div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AdminRoute;
