const AdminMeshBackground = () => (
  <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none" style={{
    background: '#f6f1e9',
  }}>
    {/* Teal orb — top right */}
    <div style={{
      position: 'absolute', top: '-10%', right: '-5%',
      width: 800, height: 800, borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(13,138,111,0.12) 0%, rgba(13,138,111,0.04) 40%, transparent 65%)',
      filter: 'blur(80px)', animation: 'd1 20s ease-in-out infinite',
    }} />
    {/* Coral/pink orb — left */}
    <div style={{
      position: 'absolute', top: '30%', left: '-8%',
      width: 600, height: 600, borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(232,115,90,0.10) 0%, rgba(232,115,90,0.03) 50%, transparent 65%)',
      filter: 'blur(70px)', animation: 'd2 24s ease-in-out infinite',
    }} />
    {/* Violet orb — bottom right */}
    <div style={{
      position: 'absolute', bottom: '-12%', right: '20%',
      width: 600, height: 500, borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(124,92,191,0.08) 0%, transparent 55%)',
      filter: 'blur(70px)', animation: 'd3 18s ease-in-out infinite',
    }} />
    {/* Gold orb — center */}
    <div style={{
      position: 'absolute', top: '55%', left: '35%',
      width: 400, height: 400, borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(212,165,90,0.08) 0%, transparent 55%)',
      filter: 'blur(50px)', animation: 'd4 16s ease-in-out infinite',
    }} />
  </div>
);

export default AdminMeshBackground;
