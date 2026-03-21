import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { BarChart3, TrendingUp, Users, Target, ChevronDown, ChevronUp } from 'lucide-react';

type SectorStat = {
  sector: string;
  label: string;
  total: number;
  withEmail: number;
  emailed: number;
  converted: number;
  avgScore: number;
  icon?: string;
};

const SectorsDashboard = ({ onClose, onFilterBySector }: { onClose: () => void; onFilterBySector?: (sector: string) => void }) => {
  const [stats, setStats] = useState<SectorStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    const [{ data: prospects }, { data: templates }] = await Promise.all([
      supabase.from('prospects').select('sector, email, status, score, email_count, business_type'),
      supabase.from('sector_templates').select('sector, sector_label, icon, avg_deal_value, conversion_rate'),
    ]);

    if (!prospects) { setLoading(false); return; }

    const templateMap = new Map((templates || []).map(t => [t.sector, t]));

    // Group by sector (fallback to business_type)
    const groups: Record<string, typeof prospects> = {};
    for (const p of prospects) {
      const key = p.sector || p.business_type || 'Autre';
      if (!groups[key]) groups[key] = [];
      groups[key].push(p);
    }

    const result: SectorStat[] = Object.entries(groups)
      .map(([sector, items]) => {
        const tpl = templateMap.get(sector);
        const scored = items.filter(i => (i.score || 0) > 0);
        return {
          sector,
          label: tpl?.sector_label || sector,
          total: items.length,
          withEmail: items.filter(i => !!i.email).length,
          emailed: items.filter(i => (i.email_count || 0) > 0).length,
          converted: items.filter(i => i.status === 'converted').length,
          avgScore: scored.length > 0 ? Math.round(scored.reduce((s, i) => s + (i.score || 0), 0) / scored.length) : 0,
          icon: tpl?.icon || undefined,
        };
      })
      .sort((a, b) => b.total - a.total);

    setStats(result);
    setLoading(false);
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const totalProspects = stats.reduce((s, r) => s + r.total, 0);
  const totalConverted = stats.reduce((s, r) => s + r.converted, 0);
  const globalRate = totalProspects > 0 ? ((totalConverted / totalProspects) * 100).toFixed(1) : '0';

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 640, background: 'white', borderRadius: 28, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        {/* Header */}
        <div style={{ padding: '24px 24px 16px', borderBottom: '1px solid var(--glass-border)' }}>
          <div className="flex items-center justify-between">
            <h2 style={{ fontFamily: 'var(--font-h)', fontSize: 20, color: 'var(--charcoal)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <BarChart3 size={20} style={{ color: 'var(--teal)' }} /> Dashboard Secteurs
            </h2>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)', fontSize: 20 }}>✕</button>
          </div>
        </div>

        {/* Global KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, padding: '16px 24px' }}>
          {[
            { label: 'Total prospects', value: totalProspects, icon: Users, color: 'var(--charcoal)' },
            { label: 'Convertis', value: totalConverted, icon: Target, color: 'var(--violet)' },
            { label: 'Taux global', value: `${globalRate}%`, icon: TrendingUp, color: 'var(--teal)' },
          ].map(k => (
            <div key={k.label} style={{ padding: '12px', background: 'var(--glass-bg)', borderRadius: 16, border: '1px solid var(--glass-border)', textAlign: 'center' }}>
              <k.icon size={16} style={{ color: k.color, margin: '0 auto 4px' }} />
              <div style={{ fontFamily: 'var(--font-h)', fontSize: 22, color: k.color }}>{k.value}</div>
              <div style={{ fontFamily: 'var(--font-b)', fontSize: 10, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{k.label}</div>
            </div>
          ))}
        </div>

        {/* Sector list */}
        <div style={{ padding: '0 24px 24px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-light)', fontFamily: 'var(--font-b)' }}>Chargement...</div>
          ) : stats.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-light)', fontFamily: 'var(--font-b)' }}>Aucun prospect trouvé</div>
          ) : (
            <div className="flex flex-col gap-2">
              {stats.map(s => {
                const rate = s.total > 0 ? ((s.converted / s.total) * 100).toFixed(1) : '0';
                const isExpanded = expanded === s.sector;
                return (
                  <div key={s.sector} style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 16, overflow: 'hidden' }}>
                    <button
                      onClick={() => setExpanded(isExpanded ? null : s.sector)}
                      className="w-full flex items-center gap-3 cursor-pointer"
                      style={{ padding: '12px 16px', background: 'transparent', border: 'none', textAlign: 'left', cursor: 'pointer' }}
                    >
                      <span style={{ fontSize: 18, width: 28, textAlign: 'center' }}>{s.icon || '📊'}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: 'var(--font-b)', fontSize: 14, fontWeight: 600, color: 'var(--charcoal)' }}>{s.label}</div>
                        <div style={{ fontFamily: 'var(--font-b)', fontSize: 12, color: 'var(--text-light)' }}>
                          {s.total} prospects · {s.converted} convertis · {rate}%
                        </div>
                      </div>
                      {/* Mini bar */}
                      <div style={{ width: 60, height: 6, background: 'var(--glass-border)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ width: `${Math.min(100, parseFloat(rate))}%`, height: '100%', background: 'var(--teal)', borderRadius: 3 }} />
                      </div>
                      {isExpanded ? <ChevronUp size={16} style={{ color: 'var(--text-light)' }} /> : <ChevronDown size={16} style={{ color: 'var(--text-light)' }} />}
                    </button>
                    {isExpanded && (
                      <div style={{ padding: '0 16px 16px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                        {[
                          { label: 'Avec email', value: s.withEmail },
                          { label: 'Emailés', value: s.emailed },
                          { label: 'Score moyen', value: s.avgScore || '—' },
                          { label: 'Taux conversion', value: `${rate}%` },
                        ].map(m => (
                          <div key={m.label} style={{ padding: '8px 12px', background: 'rgba(13,138,111,0.04)', borderRadius: 12 }}>
                            <div style={{ fontFamily: 'var(--font-h)', fontSize: 18, color: 'var(--charcoal)' }}>{m.value}</div>
                            <div style={{ fontFamily: 'var(--font-b)', fontSize: 10, color: 'var(--text-light)', textTransform: 'uppercase' }}>{m.label}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SectorsDashboard;
