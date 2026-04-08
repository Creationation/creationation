import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowRight, Sparkles } from 'lucide-react';

const TEAL = '#2A9D8F';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    setTimeout(() => setShow(true), 100);
  }, []);

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#0a1628', position: 'relative', overflow: 'hidden',
    }}>
      {/* Mesh background orbs */}
      <div style={{
        position: 'absolute', width: 500, height: 500, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(42,157,143,0.3) 0%, transparent 70%)',
        top: '-15%', left: '-10%', filter: 'blur(80px)', animation: 'float 8s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute', width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(74,222,128,0.2) 0%, transparent 70%)',
        bottom: '-10%', right: '-5%', filter: 'blur(80px)', animation: 'float 10s ease-in-out infinite reverse',
      }} />

      <div style={{
        position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 520, padding: 40,
        background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(24px)',
        border: '1px solid rgba(255,255,255,0.12)', borderRadius: 24,
        transform: show ? 'scale(1)' : 'scale(0.9)', opacity: show ? 1 : 0,
        transition: 'all 0.6s cubic-bezier(0.16,1,0.3,1)',
      }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%', margin: '0 auto 24px',
          background: `linear-gradient(135deg, ${TEAL}, #4ade80)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 0 40px rgba(42,157,143,0.4)`,
        }}>
          <CheckCircle size={40} color="#fff" />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12 }}>
          <Sparkles size={18} color={TEAL} />
          <span style={{ fontSize: 13, color: TEAL, fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase' }}>
            Paiement confirmé
          </span>
        </div>

        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#fff', margin: '0 0 16px', lineHeight: 1.3 }}>
          Bienvenue chez Creationation !
        </h1>

        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, margin: '0 0 32px' }}>
          Votre paiement a été traité avec succès. Votre application premium est en cours de 
          préparation. Vous recevrez un email avec les prochaines étapes.
        </p>

        <div style={{
          background: 'rgba(42,157,143,0.12)', borderRadius: 14, padding: 20, marginBottom: 32,
          border: '1px solid rgba(42,157,143,0.2)',
        }}>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>Ce qui vous attend</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {['Accès à votre portail client', 'Suivi en temps réel de votre projet', 'Support prioritaire dédié'].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'rgba(255,255,255,0.8)' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: TEAL, flexShrink: 0 }} />
                {item}
              </div>
            ))}
          </div>
        </div>

        <button onClick={() => navigate('/portal/login')} style={{
          width: '100%', padding: '14px 0', borderRadius: 50, border: 'none',
          background: `linear-gradient(135deg, ${TEAL}, #4ade80)`, color: '#fff',
          fontWeight: 700, fontSize: 15, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          boxShadow: `0 4px 20px rgba(42,157,143,0.4)`,
          transition: 'transform 0.2s',
        }}
          onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.02)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
        >
          Accéder à mon portail <ArrowRight size={16} />
        </button>

        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 20 }}>
          Référence : {sessionId ? sessionId.slice(0, 20) + '...' : 'N/A'}
        </p>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-20px) scale(1.05); }
        }
      `}</style>
    </div>
  );
};

export default PaymentSuccess;
