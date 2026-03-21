import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { DollarSign, Search, Mail, Sparkles, MapPin, TrendingUp, Clock, Globe, Phone, Info } from 'lucide-react';
import AdminHeader from '@/components/admin/AdminHeader';

const COST_EUR = {
  GOOGLE_TEXT_SEARCH: 0.029,
  GOOGLE_WEBSITE_CHECK: 0.016,
  GOOGLE_PHONE_DETAIL: 0.018,
  AI_EMAIL_FIND: 0.00046,
  AI_EMAIL_GEN: 0.00092,
  AI_INFO_FIND: 0.00046,
};

type OperationLog = {
  id: string;
  operation_type: string;
  description: string;
  details: Record<string, any>;
  cost_eur: number;
  prospect_count: number;
  created_at: string;
};

const OP_LABELS: Record<string, { label: string; icon: typeof Search; color: string }> = {
  google_search: { label: 'Recherche Google', icon: Search, color: '#4285F4' },
  ai_info_find: { label: 'IA — Site + Tél', icon: Globe, color: '#d4a55a' },
  ai_email_find: { label: 'IA — Emails', icon: Mail, color: '#0d8a6f' },
  email_send: { label: 'Envoi emails', icon: Mail, color: '#7c5cbf' },
};

const AdminCosts = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ totalProspects: 0, totalEmails: 0, prospectsBySource: { google_maps: 0, manual: 0 }, emailsSent: 0 });
  const [logs, setLogs] = useState<OperationLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [{ count: totalProspects }, { count: totalEmails }, { data: prospects }, { count: emailsSent }, { data: operationLogs }] = await Promise.all([
      supabase.from('prospects').select('*', { count: 'exact', head: true }),
      supabase.from('prospects').select('*', { count: 'exact', head: true }).not('email', 'is', null),
      supabase.from('prospects').select('source'),
      supabase.from('prospect_emails').select('*', { count: 'exact', head: true }),
      supabase.from('operation_logs' as any).select('*').order('created_at', { ascending: false }).limit(100) as any,
    ]);
    const google = (prospects || []).filter((p: any) => p.source === 'google_maps').length;
    const manual = (prospects || []).filter((p: any) => p.source === 'manual').length;
    setStats({
      totalProspects: totalProspects || 0,
      totalEmails: totalEmails || 0,
      prospectsBySource: { google_maps: google, manual: manual },
      emailsSent: emailsSent || 0,
    });
    setLogs((operationLogs || []) as OperationLog[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { navigate('/admin/login'); return; }
      supabase.from('user_roles').select('role').eq('user_id', user.id).eq('role', 'admin').then(({ data: roles }) => {
        if (!roles || roles.length === 0) navigate('/admin/login');
        else fetchData();
      });
    });
  }, [navigate, fetchData]);

  // Totals from actual logs
  const totalFromLogs = logs.reduce((sum, l) => sum + Number(l.cost_eur), 0);
  const googleLogsTotal = logs.filter(l => l.operation_type === 'google_search').reduce((sum, l) => sum + Number(l.cost_eur), 0);
  const aiLogsTotal = logs.filter(l => l.operation_type !== 'google_search').reduce((sum, l) => sum + Number(l.cost_eur), 0);

  const fmt = (n: number) => n < 0.01 && n > 0 ? '< 0,01 €' : `${n.toFixed(2).replace('.', ',')} €`;
  const fmtSmall = (n: number) => n < 0.001 && n > 0 ? '< 0,001 €' : `${n.toFixed(4).replace('.', ',')} €`;

  // Projections in EUR
  const projections = [100, 500, 1000, 5000].map(n => {
    const searches = Math.ceil(n / 20);
    const gStandard = searches * COST_EUR.GOOGLE_TEXT_SEARCH + n * COST_EUR.GOOGLE_WEBSITE_CHECK;
    const gEco = searches * COST_EUR.GOOGLE_TEXT_SEARCH;
    const aiInfo = n * COST_EUR.AI_INFO_FIND;
    const aiEmail = n * COST_EUR.AI_EMAIL_FIND;
    const aiGen = n * COST_EUR.AI_EMAIL_GEN;
    return {
      n,
      standard: { google: gStandard, ai: aiEmail + aiGen, total: gStandard + aiEmail + aiGen },
      eco: { google: gEco, ai: aiInfo + aiEmail + aiGen, total: gEco + aiInfo + aiEmail + aiGen },
    };
  });

  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' }) + ' ' + date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
      <AdminHeader />
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px' }}>

        {loading ? (
          <div className='text-center py-20' style={{ color: 'var(--text-light)', fontFamily: 'var(--font-b)' }}>Chargement...</div>
        ) : (
          <div className='flex flex-col gap-6'>
            {/* Summary cards */}
            <div className='flex flex-wrap gap-4'>
              {[
                { label: 'Coût total réel', value: fmt(totalFromLogs), icon: DollarSign, accent: 'var(--teal)' },
                { label: 'Google API', value: fmt(googleLogsTotal), icon: Search, accent: '#4285F4' },
                { label: 'IA (enrichissement + emails)', value: fmt(aiLogsTotal), icon: Sparkles, accent: '#d4a55a' },
                { label: 'Coût / prospect', value: stats.totalProspects > 0 ? fmt(totalFromLogs / stats.totalProspects) : '—', icon: TrendingUp, accent: 'var(--charcoal)' },
              ].map(c => (
                <div key={c.label} style={{ flex: '1 1 180px', padding: '20px', background: 'var(--glass-bg-strong)', border: '1px solid var(--glass-border)', borderRadius: 'var(--r-xl)' }}>
                  <c.icon size={18} style={{ color: c.accent, marginBottom: 8 }} />
                  <div style={{ fontFamily: 'var(--font-h)', fontSize: 24, color: 'var(--charcoal)' }}>{c.value}</div>
                  <div style={{ fontFamily: 'var(--font-b)', fontSize: 11, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: 1 }}>{c.label}</div>
                </div>
              ))}
            </div>

            {/* Operation History */}
            <div style={{ background: 'var(--glass-bg-strong)', border: '1px solid var(--glass-border)', borderRadius: 'var(--r-xl)', overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--glass-border)' }}>
                <h2 style={{ fontFamily: 'var(--font-h)', fontSize: 16, color: 'var(--charcoal)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Clock size={16} /> Historique des opérations
                </h2>
                <p style={{ fontFamily: 'var(--font-b)', fontSize: 12, color: 'var(--text-light)', margin: '4px 0 0' }}>
                  {logs.length} opération(s) enregistrée(s)
                </p>
              </div>
              {logs.length === 0 ? (
                <div style={{ padding: '40px 24px', textAlign: 'center', fontFamily: 'var(--font-b)', fontSize: 14, color: 'var(--text-light)' }}>
                  <Info size={24} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                  Aucune opération enregistrée. L'historique commencera à se remplir après vos prochaines recherches.
                </div>
              ) : (
                <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                  <table className='w-full' style={{ fontFamily: 'var(--font-b)', fontSize: 13, borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--glass-border)', position: 'sticky', top: 0, background: 'var(--glass-bg-strong)' }}>
                        {['Date', 'Opération', 'Description', 'Prospects', 'Coût'].map(h => (
                          <th key={h} className='text-left px-4 py-3' style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-light)', fontWeight: 600 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map(log => {
                        const op = OP_LABELS[log.operation_type] || { label: log.operation_type, icon: Info, color: 'var(--text-mid)' };
                        const Icon = op.icon;
                        return (
                          <tr key={log.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                            <td className='px-4 py-3' style={{ color: 'var(--text-light)', fontSize: 12, whiteSpace: 'nowrap' }}>{formatDate(log.created_at)}</td>
                            <td className='px-4 py-3'>
                              <div className='flex items-center gap-2'>
                                <Icon size={14} style={{ color: op.color }} />
                                <span style={{ fontWeight: 600, color: 'var(--charcoal)', fontSize: 12 }}>{op.label}</span>
                              </div>
                            </td>
                            <td className='px-4 py-3' style={{ color: 'var(--text-mid)', fontSize: 12, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.description}</td>
                            <td className='px-4 py-3' style={{ color: 'var(--charcoal)', fontWeight: 600, textAlign: 'center' }}>{log.prospect_count}</td>
                            <td className='px-4 py-3' style={{ fontWeight: 600, color: 'var(--teal)', whiteSpace: 'nowrap' }}>{fmtSmall(Number(log.cost_eur))}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Tarifs de référence */}
            <div style={{ background: 'var(--glass-bg-strong)', border: '1px solid var(--glass-border)', borderRadius: 'var(--r-xl)', overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--glass-border)' }}>
                <h2 style={{ fontFamily: 'var(--font-h)', fontSize: 16, color: 'var(--charcoal)', margin: 0 }}>Grille tarifaire (€)</h2>
              </div>
              <table className='w-full' style={{ fontFamily: 'var(--font-b)', fontSize: 14, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    {['Service', 'Coût unitaire', 'Note'].map(h => (
                      <th key={h} className='text-left px-6 py-3' style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-light)', fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { icon: Search, label: 'Google Text Search', cost: `${COST_EUR.GOOGLE_TEXT_SEARCH} € / requête (20 résultats)`, note: 'Utilisé en standard + éco', color: '#4285F4' },
                    { icon: MapPin, label: 'Google Place Details (site web)', cost: `${COST_EUR.GOOGLE_WEBSITE_CHECK} € / appel`, note: 'Standard uniquement', color: '#34A853' },
                    { icon: Phone, label: 'Google Place Details (téléphone)', cost: `${COST_EUR.GOOGLE_PHONE_DETAIL} € / appel`, note: 'Option "avec téléphone"', color: '#FBBC04' },
                    { icon: Globe, label: 'IA — Recherche site + tél', cost: `${COST_EUR.AI_INFO_FIND} € / prospect`, note: 'Mode éco uniquement', color: '#d4a55a' },
                    { icon: Mail, label: 'IA — Recherche emails', cost: `${COST_EUR.AI_EMAIL_FIND} € / prospect`, note: 'Enrichissement', color: '#0d8a6f' },
                    { icon: Sparkles, label: 'IA — Génération emails', cost: `${COST_EUR.AI_EMAIL_GEN} € / email`, note: 'Envoi personnalisé', color: '#7c5cbf' },
                  ].map(r => (
                    <tr key={r.label} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                      <td className='px-6 py-3'>
                        <div className='flex items-center gap-3'>
                          <r.icon size={16} style={{ color: r.color }} />
                          <span style={{ fontWeight: 600, color: 'var(--charcoal)' }}>{r.label}</span>
                        </div>
                      </td>
                      <td className='px-6 py-3' style={{ color: 'var(--text-mid)', fontFamily: 'monospace', fontSize: 13 }}>{r.cost}</td>
                      <td className='px-6 py-3' style={{ color: 'var(--text-light)', fontSize: 12 }}>{r.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Projections */}
            <div style={{ background: 'var(--glass-bg-strong)', border: '1px solid var(--glass-border)', borderRadius: 'var(--r-xl)', overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--glass-border)' }}>
                <h2 style={{ fontFamily: 'var(--font-h)', fontSize: 16, color: 'var(--charcoal)', margin: 0 }}>Projections de coûts (€)</h2>
                <p style={{ fontFamily: 'var(--font-b)', fontSize: 12, color: 'var(--text-light)', margin: '4px 0 0' }}>
                  Comparaison standard vs éco — recherche + enrichissement + envoi emails
                </p>
              </div>
              <table className='w-full' style={{ fontFamily: 'var(--font-b)', fontSize: 13, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    {['Prospects', 'Standard', 'Mode Éco', 'Économie', '€/prospect (éco)'].map(h => (
                      <th key={h} className='text-left px-5 py-3' style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-light)', fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {projections.map(p => {
                    const saving = p.standard.total - p.eco.total;
                    const savingPct = p.standard.total > 0 ? Math.round((saving / p.standard.total) * 100) : 0;
                    return (
                      <tr key={p.n} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                        <td className='px-5 py-3' style={{ fontWeight: 600, color: 'var(--charcoal)' }}>{p.n.toLocaleString('fr-FR')}</td>
                        <td className='px-5 py-3' style={{ color: 'var(--text-mid)' }}>{fmt(p.standard.total)}</td>
                        <td className='px-5 py-3' style={{ fontWeight: 700, color: 'var(--teal)' }}>{fmt(p.eco.total)}</td>
                        <td className='px-5 py-3' style={{ color: '#34A853', fontWeight: 600 }}>-{fmt(saving)} ({savingPct}%)</td>
                        <td className='px-5 py-3' style={{ color: 'var(--text-mid)' }}>{fmt(p.eco.total / p.n)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Notes */}
            <div style={{ padding: '20px 24px', background: 'rgba(13,138,111,0.04)', border: '1px solid rgba(13,138,111,0.15)', borderRadius: 'var(--r-xl)' }}>
              <h3 style={{ fontFamily: 'var(--font-h)', fontSize: 14, color: 'var(--charcoal)', margin: '0 0 8px' }}>📝 Notes</h3>
              <ul style={{ fontFamily: 'var(--font-b)', fontSize: 13, color: 'var(--text-mid)', margin: 0, paddingLeft: 20, lineHeight: 2 }}>
                <li>Tous les coûts sont en <strong>euros (€)</strong></li>
                <li>Les coûts Google sont basés sur le <strong>Places API (New)</strong> — Text Search + Place Details</li>
                <li>Les coûts IA sont estimatifs (Lovable AI facture à l'usage)</li>
                <li>L'envoi d'emails via Resend est gratuit jusqu'à 100/jour, puis ~0,001 €/email</li>
                <li>Les prospects manuels ne génèrent aucun coût</li>
                <li>Google offre ~185 €/mois de crédit gratuit sur l'API</li>
                <li>L'historique enregistre chaque opération avec son coût précis</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCosts;
