const techs = ['React', 'TypeScript', 'Tailwind CSS', 'Supabase', 'Next.js', 'Figma', 'Vercel', 'PWA', 'Lovable', 'Mobile-First'];

const TechStrip = () => (
  <div className="relative z-[1] overflow-hidden py-7" style={{ borderTop: '1px solid rgba(255,255,255,0.3)', borderBottom: '1px solid rgba(255,255,255,0.3)' }}>
    <div className="flex gap-6 w-max" style={{ animation: 'slide 26s linear infinite' }}>
      {[...techs, ...techs].map((tech, i) => (
        <span key={i} className="flex items-center gap-2 whitespace-nowrap" style={{
          padding: '8px 20px', borderRadius: 'var(--pill)',
          background: 'rgba(255,255,255,0.35)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.45)',
          fontSize: 12, fontWeight: 600, color: 'var(--text-mid)',
        }}>
          <span className="w-[5px] h-[5px] rounded-full" style={{ background: 'var(--teal)' }} />
          {tech}
        </span>
      ))}
    </div>
  </div>
);

export default TechStrip;
