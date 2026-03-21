import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const AdminLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      // Check admin role
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user');

      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin');

      if (!roles || roles.length === 0) {
        await supabase.auth.signOut();
        toast.error('Accès non autorisé');
        return;
      }

      navigate('/admin');
    } catch (err: any) {
      toast.error(err.message || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'var(--cream)' }}
    >
      <div
        className="w-full max-w-sm"
        style={{
          background: 'var(--glass-bg-strong)',
          backdropFilter: 'blur(20px)',
          borderRadius: 'var(--r-lg)',
          border: '1px solid var(--glass-border)',
          padding: '40px 32px',
          boxShadow: 'var(--glass-shadow)',
        }}
      >
        <h1
          style={{
            fontFamily: 'var(--font-h)',
            fontSize: 28,
            color: 'var(--charcoal)',
            marginBottom: 8,
            textAlign: 'center',
          }}
        >
          CreationNation
        </h1>
        <p
          style={{
            fontFamily: 'var(--font-b)',
            fontSize: 14,
            color: 'var(--text-mid)',
            textAlign: 'center',
            marginBottom: 32,
          }}
        >
          Admin Dashboard
        </p>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: 'var(--r)',
              border: '1px solid var(--glass-border)',
              background: 'rgba(255,255,255,0.5)',
              fontFamily: 'var(--font-b)',
              fontSize: 14,
              color: 'var(--text)',
              outline: 'none',
            }}
          />
          <input
            type="password"
            required
            placeholder="Mot de passe"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: 'var(--r)',
              border: '1px solid var(--glass-border)',
              background: 'rgba(255,255,255,0.5)',
              fontFamily: 'var(--font-b)',
              fontSize: 14,
              color: 'var(--text)',
              outline: 'none',
            }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '14px',
              background: 'var(--teal)',
              color: '#fff',
              fontFamily: 'var(--font-b)',
              fontWeight: 600,
              fontSize: 14,
              border: 'none',
              borderRadius: 'var(--pill)',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s',
            }}
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
