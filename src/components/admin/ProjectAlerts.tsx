import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, Clock, FolderKanban } from 'lucide-react';

type ProjectAlert = { id: string; title: string; client_name: string; deadline: string | null; status: string; type: 'overdue' | 'soon' | 'stalled' };

const ProjectAlerts = ({ onClickProject }: { onClickProject?: (id: string) => void }) => {
  const [alerts, setAlerts] = useState<ProjectAlert[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('projects' as any).select('*').not('status', 'in', '("delivered","maintenance")');
      if (!data) return;
      const { data: cData } = await supabase.from('clients' as any).select('id, business_name');
      const clientMap = new Map(((cData || []) as unknown as any[]).map((c: any) => [c.id, c.business_name]));
      const now = Date.now();
      const result: ProjectAlert[] = [];

      (data as unknown as any[]).forEach(p => {
        const name = clientMap.get(p.client_id) || '';
        if (p.deadline) {
          const diff = (new Date(p.deadline).getTime() - now) / 86400000;
          if (diff < 0) result.push({ id: p.id, title: p.title, client_name: name, deadline: p.deadline, status: p.status, type: 'overdue' });
          else if (diff < 3) result.push({ id: p.id, title: p.title, client_name: name, deadline: p.deadline, status: p.status, type: 'soon' });
        }
        // Stalled: same status for 7+ days
        if (p.updated_at) {
          const daysSince = (now - new Date(p.updated_at).getTime()) / 86400000;
          if (daysSince > 7) result.push({ id: p.id, title: p.title, client_name: name, deadline: p.deadline, status: p.status, type: 'stalled' });
        }
      });
      setAlerts(result);
    })();
  }, []);

  if (!alerts.length) return null;

  return (
    <div className="space-y-2 mb-6">
      {alerts.map(a => (
        <div
          key={`${a.id}-${a.type}`}
          onClick={() => onClickProject?.(a.id)}
          className="cursor-pointer flex items-center gap-3 px-4 py-3"
          style={{
            background: a.type === 'overdue' ? 'rgba(239,68,68,0.06)' : a.type === 'soon' ? 'rgba(249,115,22,0.06)' : 'rgba(107,114,128,0.06)',
            border: `1px solid ${a.type === 'overdue' ? 'rgba(239,68,68,0.15)' : a.type === 'soon' ? 'rgba(249,115,22,0.15)' : 'rgba(107,114,128,0.15)'}`,
            borderRadius: 14, backdropFilter: 'blur(12px)',
          }}
        >
          {a.type === 'overdue' ? <AlertTriangle size={16} color="#ef4444" /> : a.type === 'soon' ? <Clock size={16} color="#f97316" /> : <FolderKanban size={16} color="#6b7280" />}
          <div style={{ flex: 1 }}>
            <span style={{ fontFamily: 'var(--font-b)', fontSize: 13, fontWeight: 600, color: 'var(--charcoal)' }}>{a.title}</span>
            <span style={{ fontFamily: 'var(--font-b)', fontSize: 12, color: 'var(--text-light)', marginLeft: 8 }}>{a.client_name}</span>
          </div>
          <span style={{
            fontFamily: 'var(--font-b)', fontSize: 11, fontWeight: 600,
            color: a.type === 'overdue' ? '#ef4444' : a.type === 'soon' ? '#f97316' : '#6b7280',
          }}>
            {a.type === 'overdue' ? '⚠️ En retard' : a.type === 'soon' ? '⏰ Bientôt' : '💤 Bloqué'}
          </span>
        </div>
      ))}
    </div>
  );
};

export default ProjectAlerts;
