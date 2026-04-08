const AdminMeshBackground = () => (
  <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none" style={{ background: '#F0F5F3' }}>
    {/* Main green glow — top right */}
    <div style={{
      position: 'absolute', top: '-5%', right: '5%',
      width: 650, height: 650, borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(62,221,199,0.30) 0%, rgba(42,157,143,0.15) 30%, transparent 65%)',
      filter: 'blur(40px)', animation: 'adminGlow1 16s ease-in-out infinite',
    }} />
    {/* Secondary green pulse — left */}
    <div style={{
      position: 'absolute', top: '25%', left: '-5%',
      width: 500, height: 500, borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(42,157,143,0.22) 0%, rgba(52,184,168,0.08) 40%, transparent 65%)',
      filter: 'blur(50px)', animation: 'adminGlow2 20s ease-in-out infinite',
    }} />
    {/* Teal energy streak — diagonal */}
    <div style={{
      position: 'absolute', top: '10%', left: '20%',
      width: 800, height: 200,
      background: 'linear-gradient(135deg, transparent 0%, rgba(62,221,199,0.12) 30%, rgba(42,157,143,0.18) 50%, rgba(62,221,199,0.08) 70%, transparent 100%)',
      filter: 'blur(30px)', transform: 'rotate(-15deg)',
      animation: 'adminStreak 12s ease-in-out infinite',
    }} />
    {/* Bottom warm gold hint */}
    <div style={{
      position: 'absolute', bottom: '-8%', right: '20%',
      width: 400, height: 400, borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(212,168,67,0.10) 0%, transparent 60%)',
      filter: 'blur(50px)', animation: 'adminGlow3 22s ease-in-out infinite',
    }} />
    {/* Green light particles */}
    <div style={{
      position: 'absolute', top: '60%', left: '50%',
      width: 300, height: 300, borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(42,157,143,0.15) 0%, transparent 60%)',
      filter: 'blur(35px)', animation: 'adminGlow4 14s ease-in-out infinite',
    }} />
    {/* Subtle grid pattern overlay */}
    <div style={{
      position: 'absolute', inset: 0,
      backgroundImage: `
        linear-gradient(rgba(42,157,143,0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(42,157,143,0.03) 1px, transparent 1px)
      `,
      backgroundSize: '60px 60px',
      opacity: 0.5,
    }} />
  </div>
);

export default AdminMeshBackground;
