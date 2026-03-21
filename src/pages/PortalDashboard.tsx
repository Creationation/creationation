import { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { MessageSquare, FileText, CheckCircle, Clock, ArrowRight } from 'lucide-react';

const PortalDashboard = () => {
  const { client } = useOutletContext<{ client: { id: string; contact_name: string | null; business_name: string } }>();
  const [project, setProject] = useState<any>(null);
  const [taskStats, setTaskStats] = useState({ done: 0, total: 0 });
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [pendingInvoices, setPendingInvoices] = useState({ count: 0, total: 0 });
  const [pendingReviews, setPendingReviews] = useState(0);
  const [nextMilestone, setNextMilestone] = useState<any>(null);

  useEffect(() => {
    if (!client?.id) return;
    (async () => {
      // Get main project
      const { data: projects } = await supabase.from('projects').select('*').eq('client_id', client.id).order('created_at', { ascending: false }).limit(1);
      const p = projects?.[0];
      setProject(p);

      if (p) {
        // Tasks
        const { data: tasks } = await supabase.from('project_tasks').select('status').eq('project_id', p.id);
        const t = tasks || [];
        setTaskStats({ done: t.filter(x => x.status === 'done').length, total: t.length });

        // Unread messages
        const { count } = await supabase.from('portal_messages').select('*', { count: 'exact', head: true })
          .eq('project_id', p.id).eq('sender_type', 'team').eq('is_read', false);
        setUnreadMessages(count || 0);

        // Pending reviews
        const { count: rc } = await supabase.from('deliverable_reviews').select('*', { count: 'exact', head: true })
          .eq('project_id', p.id).eq('status', 'pending');
        setPendingReviews(rc || 0);

        // Next milestone
        const { data: ms } = await supabase.from('project_milestones').select('*').eq('project_id', p.id)
          .is('completed_at', null).order('position', { ascending: true }).limit(1);
        setNextMilestone(ms?.[0] || null);
      }

      // Pending invoices
      const { data: invs } = await supabase.from('invoices').select('total,amount_paid,status')
        .eq('client_id', client.id).in('status', ['sent', 'viewed', 'overdue']);
      const inv = invs || [];
      setPendingInvoices({ count: inv.length, total: inv.reduce((s, i) => s + (Number(i.total) - Number(i.amount_paid)), 0) });
    })();
  }, [client]);

  const STATUS_LABELS: Record<string, string> = {
    brief: 'Brief', maquette: 'Maquette', development: 'Développement',
    review: 'Review', delivered: 'Livré', maintenance: 'Maintenance',
  };
  const STATUS_COLORS: Record<string, string> = {
    brief: '#8B5CF6', maquette: '#F59E0B', development: '#3B82F6',
    review: '#F97316', delivered: '#10B981', maintenance: '#6B7280',
  };

  const firstName = client?.contact_name?.split(' ')[0] || client?.business_name || 'Client';
  const progress = taskStats.total ? Math.round(taskStats.done / taskStats.total * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 style={{ fontFamily: 'var(--font-h)', fontSize: 28, color: 'var(--charcoal)', margin: 0 }}>
          Bonjour {firstName} 👋
        </h1>
        <p style={{ fontFamily: 'var(--font-b)', fontSize: 15, color: 'var(--text-mid)', marginTop: 4 }}>
          Voici l'avancement de votre projet
        </p>
      </div>

      {/* Project card */}
      {project && (
        <Link to="/portal/project" style={{ textDecoration: 'none', display: 'block' }}>
          <div style={{
            background: 'var(--glass-bg-strong)', backdropFilter: 'blur(20px)',
            borderRadius: 'var(--r-lg)', border: '1px solid var(--glass-border)',
            padding: 24, transition: 'all 0.2s', boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
          }}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <h2 style={{ fontFamily: 'var(--font-h)', fontSize: 20, color: 'var(--charcoal)', margin: 0 }}>{project.title}</h2>
                {project.project_type && <span style={{ fontFamily: 'var(--font-b)', fontSize: 12, color: 'var(--text-light)' }}>{project.project_type}</span>}
              </div>
              <span style={{
                padding: '4px 12px', borderRadius: 'var(--pill)',
                background: `${STATUS_COLORS[project.status]}18`, color: STATUS_COLORS[project.status],
                fontFamily: 'var(--font-b)', fontSize: 12, fontWeight: 600,
              }}>{STATUS_LABELS[project.status]}</span>
            </div>

            {/* Progress */}
            <div className="mb-3">
              <div className="flex justify-between mb-1" style={{ fontFamily: 'var(--font-b)', fontSize: 12, color: 'var(--text-light)' }}>
                <span>{taskStats.done}/{taskStats.total} tâches terminées</span>
                <span>{progress}%</span>
              </div>
              <div style={{ height: 8, borderRadius: 4, background: 'rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                <div style={{ width: `${progress}%`, height: '100%', background: 'var(--teal)', borderRadius: 4, transition: 'width 0.5s ease' }} />
              </div>
            </div>

            {nextMilestone && (
              <div style={{ fontFamily: 'var(--font-b)', fontSize: 13, color: 'var(--text-mid)' }}>
                Prochaine étape : <strong>{nextMilestone.title}</strong>
                {nextMilestone.due_date && <span style={{ color: 'var(--text-light)' }}> — {new Date(nextMilestone.due_date).toLocaleDateString('fr-FR')}</span>}
              </div>
            )}

            {project.deadline && (
              <div style={{ fontFamily: 'var(--font-b)', fontSize: 12, color: 'var(--text-light)', marginTop: 8 }}>
                🏁 Livraison estimée : {new Date(project.deadline).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
            )}

            <div className="flex items-center justify-end mt-3" style={{ color: 'var(--teal)', fontFamily: 'var(--font-b)', fontSize: 13, fontWeight: 600 }}>
              Voir le détail <ArrowRight size={14} style={{ marginLeft: 4 }} />
            </div>
          </div>
        </Link>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <Link to="/portal/messages" style={{ textDecoration: 'none' }}>
          <SummaryCard icon={MessageSquare} label="Messages non lus" value={unreadMessages} color="var(--teal)" />
        </Link>
        <Link to="/portal/invoices" style={{ textDecoration: 'none' }}>
          <SummaryCard icon={FileText} label="À payer" value={`${pendingInvoices.total.toLocaleString('fr-FR')} €`} sub={`${pendingInvoices.count} facture(s)`} color="#f59e0b" />
        </Link>
        <SummaryCard icon={CheckCircle} label="À valider" value={pendingReviews} color="var(--violet)" />
        <SummaryCard icon={Clock} label="Progression" value={`${progress}%`} color="var(--sky)" />
      </div>
    </div>
  );
};

const SummaryCard = ({ icon: Icon, label, value, sub, color }: { icon: any; label: string; value: any; sub?: string; color: string }) => (
  <div style={{
    background: 'var(--glass-bg-strong)', backdropFilter: 'blur(16px)',
    borderRadius: 'var(--r)', border: '1px solid var(--glass-border)', padding: 16,
  }}>
    <Icon size={20} color={color} style={{ marginBottom: 8 }} />
    <div style={{ fontFamily: 'var(--font-h)', fontSize: 24, color }}>{value}</div>
    <div style={{ fontFamily: 'var(--font-b)', fontSize: 12, color: 'var(--text-light)', marginTop: 2 }}>{label}</div>
    {sub && <div style={{ fontFamily: 'var(--font-b)', fontSize: 11, color: 'var(--text-ghost)', marginTop: 2 }}>{sub}</div>}
  </div>
);

export default PortalDashboard;
