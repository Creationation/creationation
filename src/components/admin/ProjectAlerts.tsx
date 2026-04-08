import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, Clock, FolderKanban } from 'lucide-react';

const TEXT_PRIMARY = '#1A2332';
const TEXT_SECONDARY = 'rgba(26,35,50,0.55)';
const TEAL = '#2A9D8F';

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
        if (p.updated_at) {
          const daysSince = (now - new Date(p.updated_at).getTime()) / 86400000;
          if (daysSince > 7) result.push({ id: p.id, title: p.title, client_name: name, deadline: p.deadline, status: p.status, type: 'stalled' });
        }
      });
      setAlerts(result);
    })();
  }, []);

  if (!alerts.length) return null;

  const alertStyles = {
    overdue: { bg: 'rgba(231,111,81,0.08)', border: 'rgba(231,111,81,0.12)', color: '#E76F51' },
    soon: { bg: 'rgba(212,168,67,0.08)', border: 'rgba(212,168,67,0.12)', color: '#D4A843' },
    stalled: { bg: 'rgba(26,35,50,0.04)', border: 'rgba(26,35,50,0.08)', color: 'rgba(26,35,50,0.45)' },
  };

  return (
    <div className="space-y-2 mb-6">
      {alerts.map(a => {
        const s = alertStyles[a.type];
        return (
          <div key={`${a.id}-${a.type}`} onClick={() => onClickProject?.(a.id)}
            className="cursor-pointer flex items-center gap-3 px-4 py-3"
            style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 14, backdropFilter: 'blur(12px)' }}>
            {a.type === 'overdue' ? <AlertTriangle size={16} color={s.color} /> : a.type === 'soon' ? <Clock size={16} color={s.color} /> : <FolderKanban size={16} color={s.color} />}
            <div style={{ flex: 1 }}>
              <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY }}>{a.title}</span>
              <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 12, color: TEXT_SECONDARY, marginLeft: 8 }}>{a.client_name}</span>
            </div>
            <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, fontWeight: 600, color: s.color }}>
              {a.type === 'overdue' ? '⚠️ En retard' : a.type === 'soon' ? '⏰ Bientôt' : '💤 Bloqué'}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default ProjectAlerts;
