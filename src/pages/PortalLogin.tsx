import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Mail, ArrowRight, Check } from 'lucide-react';

const PortalLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;

      // First check if already linked
      const { data: linked } = await supabase.from('clients')
        .select('id')
        .eq('portal_user_id', user.id)
        .eq('portal_enabled', true)
        .single();
      if (linked) { navigate('/portal'); return; }

      // Auto-link: match by email if portal_user_id is not set yet
      const { data: byEmail } = await supabase.from('clients')
        .select('id')
        .eq('email', user.email || '')
        .eq('portal_enabled', true)
        .is('portal_user_id', null)
        .single();

      if (byEmail) {
        await supabase.from('clients')
          .update({ portal_user_id: user.id, portal_last_login: new Date().toISOString() } as any)
          .eq('id', byEmail.id);
        // Assign 'client' role if not already assigned
        const { data: existingRole } = await supabase.from('user_roles')
          .select('id').eq('user_id', user.id).eq('role', 'client').maybeSingle();
        if (!existingRole) {
          await supabase.from('user_roles').insert({ user_id: user.id, role: 'client' } as any);
        }
        navigate('/portal');
        return;
      }

      // Check if client exists but portal is disabled
      const { data: disabledClient } = await supabase.from('clients')
        .select('id')
        .eq('email', user.email || '')
        .eq('portal_enabled', false)
        .maybeSingle();

      if (disabledClient) {
        setError('Votre accès au portail a été désactivé. Contactez CreationNation pour plus d\'informations.');
        await supabase.auth.signOut();
      }
    });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) { setError('Veuillez entrer votre email'); return; }

    setLoading(true);
    const { error: authError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/portal` },
    });

    if (authError) {
      setError('Erreur lors de l\'envoi du lien. Vérifiez votre email.');
      setLoading(false);
    } else {
      setSent(true);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: 'var(--cream)' }}>
      {/* Decorative blobs */}
      <div style={{
        position: 'absolute', width: 400, height: 400, borderRadius: '50%',
        background: 'var(--teal-glow)', filter: 'blur(80px)', top: -100, right: -100, opacity: 0.5,
      }} />
      <div style={{
        position: 'absolute', width: 300, height: 300, borderRadius: '50%',
        background: 'var(--violet-glow)', filter: 'blur(80px)', bottom: -80, left: -80, opacity: 0.4,
      }} />

      <div className="w-full max-w-md mx-4 relative z-10">
        <div className="text-center mb-8">
          <h1 style={{ fontFamily: 'var(--font-h)', fontSize: 32, color: 'var(--teal)', margin: 0 }}>CreationNation</h1>
          <div style={{
            display: 'inline-block', marginTop: 8, padding: '4px 16px',
            background: 'var(--glass-bg)', backdropFilter: 'blur(10px)',
            borderRadius: 'var(--pill)', border: '1px solid var(--glass-border)',
            fontFamily: 'var(--font-b)', fontSize: 13, color: 'var(--text-mid)',
          }}>Espace Client</div>
        </div>

        <div style={{
          background: 'var(--glass-bg-strong)', backdropFilter: 'blur(24px)',
          borderRadius: 'var(--r-lg)', border: '1px solid var(--glass-border)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.08)', padding: 32,
        }}>
          {sent ? (
            <div className="text-center">
              <div style={{
                width: 56, height: 56, borderRadius: '50%', background: 'var(--teal-glow)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
              }}>
                <Check size={28} color="var(--teal)" />
              </div>
              <h2 style={{ fontFamily: 'var(--font-h)', fontSize: 20, color: 'var(--charcoal)', margin: '0 0 8px' }}>
                Lien envoyé !
              </h2>
              <p style={{ fontFamily: 'var(--font-b)', fontSize: 14, color: 'var(--text-mid)', lineHeight: 1.6 }}>
                Un lien de connexion a été envoyé à <strong>{email}</strong>. Vérifiez votre boîte de réception.
              </p>
              <button onClick={() => setSent(false)} style={{
                marginTop: 20, padding: '10px 24px', background: 'transparent',
                border: '1px solid var(--glass-border)', borderRadius: 'var(--pill)',
                fontFamily: 'var(--font-b)', fontSize: 13, color: 'var(--text-mid)', cursor: 'pointer',
              }}>
                Utiliser un autre email
              </button>
            </div>
          ) : (
            <>
              <h2 style={{ fontFamily: 'var(--font-h)', fontSize: 22, color: 'var(--charcoal)', margin: '0 0 4px', textAlign: 'center' }}>
                Connexion
              </h2>
              <p style={{ fontFamily: 'var(--font-b)', fontSize: 14, color: 'var(--text-mid)', textAlign: 'center', margin: '0 0 24px' }}>
                Suivez votre projet en temps réel
              </p>

              <form onSubmit={handleSubmit}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
                  background: 'rgba(255,255,255,0.6)', borderRadius: 14,
                  border: '1px solid var(--glass-border)',
                }}>
                  <Mail size={18} color="var(--text-light)" />
                  <input
                    type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="votre@email.com"
                    style={{
                      flex: 1, background: 'transparent', border: 'none', outline: 'none',
                      fontFamily: 'var(--font-b)', fontSize: 15, color: 'var(--charcoal)',
                    }}
                  />
                </div>

                {error && (
                  <p style={{ fontFamily: 'var(--font-b)', fontSize: 12, color: 'var(--coral)', marginTop: 8 }}>{error}</p>
                )}

                <button type="submit" disabled={loading} style={{
                  width: '100%', marginTop: 16, padding: '14px 0',
                  background: loading ? 'var(--text-light)' : 'var(--teal)', color: '#fff',
                  border: 'none', borderRadius: 'var(--pill)', cursor: loading ? 'default' : 'pointer',
                  fontFamily: 'var(--font-b)', fontSize: 15, fontWeight: 600,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  transition: 'all 0.2s',
                }}>
                  {loading ? 'Envoi en cours...' : <>Recevoir mon lien de connexion <ArrowRight size={16} /></>}
                </button>
              </form>
            </>
          )}
        </div>

        <p style={{ textAlign: 'center', marginTop: 24, fontFamily: 'var(--font-b)', fontSize: 12, color: 'var(--text-ghost)' }}>
          Accès réservé aux clients CreationNation
        </p>
      </div>
    </div>
  );
};

export default PortalLogin;
