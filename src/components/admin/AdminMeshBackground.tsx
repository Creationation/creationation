const AdminMeshBackground = () => (
  <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none" style={{
    background: 'linear-gradient(145deg, #353849 0%, #2F3344 50%, #3B3F52 100%)',
  }}>
    {/* Warm amber orb — top right */}
    <div style={{
      position: 'absolute', top: '-10%', right: '0%',
      width: 800, height: 800, borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(240,180,80,0.18) 0%, rgba(240,160,60,0.06) 40%, transparent 65%)',
      filter: 'blur(80px)', animation: 'd1 20s ease-in-out infinite',
    }} />
    {/* Warm gold glow — left */}
    <div style={{
      position: 'absolute', top: '25%', left: '-8%',
      width: 600, height: 600, borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(220,170,90,0.14) 0%, rgba(200,150,80,0.04) 50%, transparent 65%)',
      filter: 'blur(70px)', animation: 'd2 24s ease-in-out infinite',
    }} />
    {/* Soft purple orb — bottom right */}
    <div style={{
      position: 'absolute', bottom: '-12%', right: '20%',
      width: 600, height: 500, borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(167,139,219,0.10) 0%, transparent 55%)',
      filter: 'blur(70px)', animation: 'd3 18s ease-in-out infinite',
    }} />
    {/* Subtle teal — center bottom */}
    <div style={{
      position: 'absolute', top: '60%', left: '35%',
      width: 400, height: 400, borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(45,212,184,0.07) 0%, transparent 55%)',
      filter: 'blur(50px)', animation: 'd4 16s ease-in-out infinite',
    }} />
    {/* Grid overlay */}
    <div style={{
      position: 'absolute', inset: 0,
      backgroundImage: `
        linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
      `,
      backgroundSize: '80px 80px',
    }} />
  </div>
);

export default AdminMeshBackground;
