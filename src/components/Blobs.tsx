const Blobs = () => (
  <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
    <div
      className="absolute rounded-full"
      style={{
        width: '55vw', height: '55vw', maxWidth: 700, maxHeight: 700,
        background: 'radial-gradient(circle, rgba(13,200,160,0.35), rgba(13,138,111,0.15) 60%, transparent 80%)',
        top: '-10%', right: '-12%', filter: 'blur(90px)',
        animation: 'drift1 22s ease-in-out infinite',
      }}
    />
    <div
      className="absolute rounded-full"
      style={{
        width: '45vw', height: '45vw', maxWidth: 550, maxHeight: 550,
        background: 'radial-gradient(circle, rgba(232,115,90,0.3), rgba(232,150,100,0.1) 60%, transparent 80%)',
        bottom: '5%', left: '-8%', filter: 'blur(90px)',
        animation: 'drift2 26s ease-in-out infinite',
      }}
    />
    <div
      className="absolute rounded-full"
      style={{
        width: '35vw', height: '35vw', maxWidth: 450, maxHeight: 450,
        background: 'radial-gradient(circle, rgba(124,92,191,0.22), rgba(100,80,180,0.08) 60%, transparent 80%)',
        top: '35%', left: '15%', filter: 'blur(90px)',
        animation: 'drift3 20s ease-in-out infinite',
      }}
    />
    <div
      className="absolute rounded-full"
      style={{
        width: '30vw', height: '30vw', maxWidth: 400, maxHeight: 400,
        background: 'radial-gradient(circle, rgba(212,165,90,0.2), rgba(212,165,90,0.05) 60%, transparent 80%)',
        top: '60%', right: '10%', filter: 'blur(90px)',
        animation: 'drift1 18s ease-in-out infinite reverse',
      }}
    />
    <div
      className="absolute rounded-full"
      style={{
        width: '25vw', height: '25vw', maxWidth: 350, maxHeight: 350,
        background: 'radial-gradient(circle, rgba(77,166,217,0.2), transparent 70%)',
        top: '10%', left: '40%', filter: 'blur(90px)',
        animation: 'drift2 24s ease-in-out infinite reverse',
      }}
    />
  </div>
);

export default Blobs;
