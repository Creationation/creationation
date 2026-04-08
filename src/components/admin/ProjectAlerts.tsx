import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, Clock, FolderKanban } from 'lucide-react';

const C = {
  textPrimary: '#2a2722',
  textSecondary: '#6b6560',
  coral: '#e8735a',
  coralGlow: 'rgba(232,115,90,0.10)',
  gold: '#d4a55a',
  goldGlow: 'rgba(212,165,90,0.12)',
  teal: '#0d8a6f',
  tealGlow: 'rgba(13,138,111,0.12)',
  muted: '#9b9590',
};

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
    overdue: { bg: C.coralGlow, border: `rgba(240,112,103,0.15)`, color: C.coral, emoji: '⚠️', label: 'En retard' },
    soon: { bg: C.goldGlow, border: `rgba(240,201,92,0.15)`, color: C.gold, emoji: '⏰', label: 'Bientôt' },
    stalled: { bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.08)', color: C.muted, emoji: '💤', label: 'Bloqué' },
  };

  return (
    <div className="space-y-2 mb-6">
      {alerts.map(a => {
        const s = alertStyles[a.type];
        return (
          <div key={`${a.id}-${a.type}`} onClick={() => onClickProject?.(a.id)}
            className="cursor-pointer flex items-center gap-3 px-4 py-3"
            style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 14, backdropFilter: 'blur(12px)' }}>
            <span style={{ fontSize: 16 }}>{s.emoji}</span>
            <div style={{ flex: 1 }}>
              <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 600, color: s.color }}>{a.title}</span>
              <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 12, color: C.textSecondary, marginLeft: 8 }}>{a.client_name}</span>
            </div>
            <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, fontWeight: 600, color: s.color }}>
              {s.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default ProjectAlerts;
