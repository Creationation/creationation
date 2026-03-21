import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { FolderKanban, CalendarCheck, AlertTriangle, TrendingUp } from 'lucide-react';

const ProjectKPIs = () => {
  const [stats, setStats] = useState({ active: 0, dueThisMonth: 0, overdue: 0, avgCompletion: 0 });

  useEffect(() => {
    (async () => {
      const { data: projects } = await supabase.from('projects' as any).select('*');
      if (!projects) return;
      const all = projects as unknown as any[];
      const now = new Date();
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const active = all.filter(p => !['delivered', 'maintenance'].includes(p.status));
      const dueThisMonth = all.filter(p => p.deadline && new Date(p.deadline) <= monthEnd && new Date(p.deadline) >= now && p.status !== 'delivered');
      const overdue = all.filter(p => p.deadline && new Date(p.deadline) < now && p.status !== 'delivered');

      // Avg completion
      const { data: taskData } = await supabase.from('project_tasks' as any).select('project_id, status') as unknown as { data: any[] };
      const tasks = taskData || [];
      const activeIds = new Set(active.map(p => p.id));
      const byProject: Record<string, { total: number; done: number }> = {};
      tasks.forEach(t => {
        if (!activeIds.has(t.project_id)) return;
        if (!byProject[t.project_id]) byProject[t.project_id] = { total: 0, done: 0 };
        byProject[t.project_id].total++;
        if (t.status === 'done') byProject[t.project_id].done++;
      });
      const completions = Object.values(byProject).map(v => v.total ? v.done / v.total * 100 : 0);
      const avg = completions.length ? Math.round(completions.reduce((a, b) => a + b, 0) / completions.length) : 0;

      setStats({ active: active.length, dueThisMonth: dueThisMonth.length, overdue: overdue.length, avgCompletion: avg });
    })();
  }, []);

  const items = [
    { label: 'Projets en cours', value: stats.active, color: '#3B82F6', icon: FolderKanban },
    { label: 'À livrer ce mois', value: stats.dueThisMonth, color: '#F59E0B', icon: CalendarCheck },
    { label: 'En retard', value: stats.overdue, color: '#ef4444', icon: AlertTriangle },
    { label: 'Complétion moy.', value: `${stats.avgCompletion}%`, color: 'var(--teal)', icon: TrendingUp },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {items.map((s, i) => (
        <div key={i} style={{
          padding: 20, background: 'var(--glass-bg-strong)', backdropFilter: 'blur(20px)',
          borderRadius: 'var(--r)', border: '1px solid var(--glass-border)',
        }}>
          <div className="flex items-center gap-2 mb-1">
            <s.icon size={14} style={{ color: s.color }} />
            <span style={{ fontFamily: 'var(--font-b)', fontSize: 11, color: 'var(--text-light)' }}>{s.label}</span>
          </div>
          <p style={{ fontFamily: 'var(--font-h)', fontSize: 28, color: s.color, margin: 0 }}>{s.value}</p>
        </div>
      ))}
    </div>
  );
};

export default ProjectKPIs;
