const AdminMeshBackground = () => (
  <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none" style={{
    background: 'linear-gradient(145deg, #2C2F3E 0%, #282B3A 50%, #343849 100%)',
  }}>
    {/* Warm amber orb — top right */}
    <div style={{
      position: 'absolute', top: '-8%', right: '5%',
      width: 700, height: 700, borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(240,180,80,0.14) 0%, rgba(240,180,80,0.04) 40%, transparent 65%)',
      filter: 'blur(70px)', animation: 'd1 20s ease-in-out infinite',
    }} />
    {/* Warm glow — left middle */}
    <div style={{
      position: 'absolute', top: '30%', left: '-5%',
      width: 500, height: 500, borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(200,160,100,0.12) 0%, rgba(200,160,100,0.03) 50%, transparent 65%)',
      filter: 'blur(60px)', animation: 'd2 24s ease-in-out infinite',
    }} />
    {/* Purple orb — bottom right */}
    <div style={{
      position: 'absolute', bottom: '-10%', right: '25%',
      width: 600, height: 400, borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(167,139,219,0.10) 0%, transparent 60%)',
      filter: 'blur(65px)', animation: 'd3 18s ease-in-out infinite',
    }} />
    {/* Subtle teal orb — center */}
    <div style={{
      position: 'absolute', top: '55%', left: '40%',
      width: 350, height: 350, borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(45,212,184,0.08) 0%, transparent 60%)',
      filter: 'blur(50px)', animation: 'd4 16s ease-in-out infinite',
    }} />
    {/* Grid overlay */}
    <div style={{
      position: 'absolute', inset: 0,
      backgroundImage: `
        linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)
      `,
      backgroundSize: '80px 80px',
    }} />
  </div>
);

export default AdminMeshBackground;
