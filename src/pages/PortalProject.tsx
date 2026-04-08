import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ExternalLink, CheckCircle, Clock, Loader } from 'lucide-react';

const statusConfig: Record<string, { label: string; color: string }> = {
  draft: { label: 'Brouillon', color: '#9b9590' },
  brief: { label: 'Brief', color: '#9b9590' },
  maquette: { label: 'Maquette', color: '#d4a55a' },
  in_progress: { label: 'En développement', color: '#4da6d9' },
  development: { label: 'En développement', color: '#4da6d9' },
  review: { label: 'En révision', color: '#7c5cbf' },
  delivered: { label: 'Livré', color: '#0d8a6f' },
  maintenance: { label: 'Maintenance', color: '#0d8a6f' },
};

const statusOrder = ['draft', 'brief', 'maquette', 'development', 'in_progress', 'review', 'delivered', 'maintenance'];

const PortalProject = () => {
  const { client } = useOutletContext<{ client: any }>();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!client?.id) return;
    supabase.from('projects').select('*').eq('client_id', client.id).order('created_at', { ascending: false }).limit(1).maybeSingle()
      .then(({ data }) => { setProject(data); setLoading(false); });
  }, [client?.id]);

  if (loading) return <div style={{ textAlign: 'center', padding: 40, fontFamily: 'var(--font-b)', color: 'var(--text-light)' }}>Chargement...</div>;

  if (!project) return (
    <div style={{ textAlign: 'center', padding: 80 }}>
      <div style={{ fontFamily: 'var(--font-h)', fontSize: 24, color: 'var(--charcoal)', marginBottom: 8 }}>Aucun projet</div>
      <p style={{ fontFamily: 'var(--font-b)', fontSize: 14, color: 'var(--text-mid)' }}>Votre projet apparaîtra ici une fois créé.</p>
    </div>
  );

  const cfg = statusConfig[project.status] || statusConfig.draft;
  const currentIdx = statusOrder.indexOf(project.status);

  const timelineSteps = [
    { key: 'brief', label: 'Brief' },
    { key: 'development', label: 'Développement' },
    { key: 'review', label: 'Révision' },
    { key: 'delivered', label: 'Livraison' },
    { key: 'maintenance', label: 'Maintenance' },
  ];

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-h)', fontSize: 24, color: 'var(--charcoal)', margin: '0 0 24px' }}>Mon projet</h1>

      <div style={{
        background: 'var(--glass-bg-strong)', backdropFilter: 'blur(20px)', borderRadius: 'var(--r-lg)',
        border: '1px solid var(--glass-border)', padding: 28, marginBottom: 24,
      }}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 style={{ fontFamily: 'var(--font-h)', fontSize: 22, color: 'var(--charcoal)', margin: '0 0 6px' }}>{project.title}</h2>
            {project.description && (
              <p style={{ fontFamily: 'var(--font-b)', fontSize: 14, color: 'var(--text-mid)', lineHeight: 1.6, margin: 0, maxWidth: 500 }}>
                {project.description}
              </p>
            )}
          </div>
          <span style={{ padding: '6px 16px', borderRadius: 'var(--pill)', background: `${cfg.color}18`, color: cfg.color, fontFamily: 'var(--font-m)', fontSize: 12, fontWeight: 600 }}>
            {cfg.label}
          </span>
        </div>

        {(project.status === 'delivered' || project.status === 'maintenance') && project.app_url && (
          <a href={project.app_url} target="_blank" rel="noopener noreferrer" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 20, padding: '12px 24px',
            background: 'var(--teal)', color: '#fff', borderRadius: 'var(--pill)', textDecoration: 'none',
            fontFamily: 'var(--font-b)', fontSize: 14, fontWeight: 600,
          }}>
            <ExternalLink size={16} /> Ouvrir mon app
          </a>
        )}

        <div style={{ marginTop: 16, fontFamily: 'var(--font-b)', fontSize: 12, color: 'var(--text-light)' }}>
          {project.start_date && <>Démarré le {new Date(project.start_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</>}
          {project.deadline && <> • Deadline : {new Date(project.deadline).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</>}
        </div>
      </div>

      {/* Timeline */}
      <div style={{
        background: 'var(--glass-bg)', backdropFilter: 'blur(10px)', borderRadius: 'var(--r)',
        border: '1px solid var(--glass-border)', padding: 28,
      }}>
        <h3 style={{ fontFamily: 'var(--font-b)', fontSize: 14, fontWeight: 600, color: 'var(--charcoal)', margin: '0 0 20px' }}>
          Progression du projet
        </h3>
        <div className="flex flex-col gap-0">
          {timelineSteps.map((step, i) => {
            const stepIdx = statusOrder.indexOf(step.key);
            const isDone = currentIdx >= stepIdx;
            const isCurrent = project.status === step.key ||
              (step.key === 'development' && (project.status === 'in_progress' || project.status === 'maquette'));
            return (
              <div key={step.key} className="flex items-start gap-4" style={{ paddingBottom: i < timelineSteps.length - 1 ? 24 : 0 }}>
                <div className="flex flex-col items-center">
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: isCurrent ? 'var(--teal)' : isDone ? 'var(--teal-glow)' : 'rgba(0,0,0,0.05)',
                    color: isCurrent ? '#fff' : isDone ? 'var(--teal)' : 'var(--text-light)',
                    border: isCurrent ? '2px solid var(--teal)' : isDone ? '2px solid var(--teal)' : '2px solid rgba(0,0,0,0.1)',
                  }}>
                    {isDone ? <CheckCircle size={14} /> : <span style={{ fontSize: 11, fontWeight: 700 }}>{i + 1}</span>}
                  </div>
                  {i < timelineSteps.length - 1 && (
                    <div style={{ width: 2, height: 20, marginTop: 4, background: isDone ? 'var(--teal)' : 'rgba(0,0,0,0.08)' }} />
                  )}
                </div>
                <div style={{ paddingTop: 4 }}>
                  <div style={{
                    fontFamily: 'var(--font-b)', fontSize: 14, fontWeight: isCurrent ? 700 : 500,
                    color: isCurrent ? 'var(--teal)' : isDone ? 'var(--charcoal)' : 'var(--text-light)',
                  }}>
                    {step.label}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PortalProject;
