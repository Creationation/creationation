import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { DollarSign, Search, Mail, Sparkles, MapPin, TrendingUp, Clock, Globe, Phone, Info } from 'lucide-react';

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
  ai_info_find: { label: 'IA — Site + Tél', icon: Globe, color: '#F0C95C' },
  ai_email_find: { label: 'IA — Emails', icon: Mail, color: '#2DD4B8' },
  email_send: { label: 'Envoi emails', icon: Mail, color: '#A78BDB' },
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
    <div style={{ minHeight: '100vh' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px' }}>

        {loading ? (
          <div className='text-center py-20' style={{ color: 'rgba(242,237,228,0.28)', fontFamily: ''Outfit', sans-serif' }}>Chargement...</div>
        ) : (
          <div className='flex flex-col gap-6'>
            {/* Summary cards */}
            <div className='flex flex-wrap gap-4'>
              {[
                { label: 'Coût total réel', value: fmt(totalFromLogs), icon: DollarSign, accent: '#2DD4B8' },
                { label: 'Google API', value: fmt(googleLogsTotal), icon: Search, accent: '#4285F4' },
                { label: 'IA (enrichissement + emails)', value: fmt(aiLogsTotal), icon: Sparkles, accent: '#F0C95C' },
                { label: 'Coût / prospect', value: stats.totalProspects > 0 ? fmt(totalFromLogs / stats.totalProspects) : '—', icon: TrendingUp, accent: '#F2EDE4' },
              ].map(c => (
                <div key={c.label} className="admin-glass-card" style={{ flex: '1 1 180px', padding: 20 }}>
                  <c.icon size={18} style={{ color: c.accent, marginBottom: 8 }} />
                  <div style={{ fontFamily: ''Playfair Display', serif', fontSize: 24, color: '#F2EDE4' }}>{c.value}</div>
                  <div style={{ fontFamily: ''Outfit', sans-serif', fontSize: 11, color: 'rgba(242,237,228,0.28)', textTransform: 'uppercase', letterSpacing: 1 }}>{c.label}</div>
                </div>
              ))}
            </div>

            {/* Operation History */}
            <div className="admin-glass-table">
              <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.12)' }}>
                <h2 style={{ fontFamily: ''Playfair Display', serif', fontSize: 16, color: '#F2EDE4', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Clock size={16} /> Historique des opérations
                </h2>
                <p style={{ fontFamily: ''Outfit', sans-serif', fontSize: 12, color: 'rgba(242,237,228,0.28)', margin: '4px 0 0' }}>
                  {logs.length} opération(s) enregistrée(s)
                </p>
              </div>
              {logs.length === 0 ? (
                <div style={{ padding: '40px 24px', textAlign: 'center', fontFamily: ''Outfit', sans-serif', fontSize: 14, color: 'rgba(242,237,228,0.28)' }}>
                  <Info size={24} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                  Aucune opération enregistrée. L'historique commencera à se remplir après vos prochaines recherches.
                </div>
              ) : (
                <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                  <table className='w-full' style={{ fontFamily: ''Outfit', sans-serif', fontSize: 13, borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.12)', position: 'sticky', top: 0, background: 'rgba(255,255,255,0.10)' }}>
                        {['Date', 'Opération', 'Description', 'Prospects', 'Coût'].map(h => (
                          <th key={h} className='text-left px-4 py-3' style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: 'rgba(242,237,228,0.28)', fontWeight: 600 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map(log => {
                        const op = OP_LABELS[log.operation_type] || { label: log.operation_type, icon: Info, color: 'rgba(242,237,228,0.55)' };
                        const Icon = op.icon;
                        return (
                          <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
                            <td className='px-4 py-3' style={{ color: 'rgba(242,237,228,0.28)', fontSize: 12, whiteSpace: 'nowrap' }}>{formatDate(log.created_at)}</td>
                            <td className='px-4 py-3'>
                              <div className='flex items-center gap-2'>
                                <Icon size={14} style={{ color: op.color }} />
                                <span style={{ fontWeight: 600, color: '#F2EDE4', fontSize: 12 }}>{op.label}</span>
                              </div>
                            </td>
                            <td className='px-4 py-3' style={{ color: 'rgba(242,237,228,0.55)', fontSize: 12, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.description}</td>
                            <td className='px-4 py-3' style={{ color: '#F2EDE4', fontWeight: 600, textAlign: 'center' }}>{log.prospect_count}</td>
                            <td className='px-4 py-3' style={{ fontWeight: 600, color: '#2DD4B8', whiteSpace: 'nowrap' }}>{fmtSmall(Number(log.cost_eur))}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Tarifs de référence */}
            <div className="admin-glass-table">
              <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.12)' }}>
                <h2 style={{ fontFamily: ''Playfair Display', serif', fontSize: 16, color: '#F2EDE4', margin: 0 }}>Grille tarifaire (€)</h2>
              </div>
              <table className='w-full' style={{ fontFamily: ''Outfit', sans-serif', fontSize: 14, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.12)' }}>
                    {['Service', 'Coût unitaire', 'Note'].map(h => (
                      <th key={h} className='text-left px-6 py-3' style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color: 'rgba(242,237,228,0.28)', fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { icon: Search, label: 'Google Text Search', cost: `${COST_EUR.GOOGLE_TEXT_SEARCH} € / requête (20 résultats)`, note: 'Utilisé en standard + éco', color: '#4285F4' },
                    { icon: MapPin, label: 'Google Place Details (site web)', cost: `${COST_EUR.GOOGLE_WEBSITE_CHECK} € / appel`, note: 'Standard uniquement', color: '#34A853' },
                    { icon: Phone, label: 'Google Place Details (téléphone)', cost: `${COST_EUR.GOOGLE_PHONE_DETAIL} € / appel`, note: 'Option "avec téléphone"', color: '#FBBC04' },
                    { icon: Globe, label: 'IA — Recherche site + tél', cost: `${COST_EUR.AI_INFO_FIND} € / prospect`, note: 'Mode éco uniquement', color: '#F0C95C' },
                    { icon: Mail, label: 'IA — Recherche emails', cost: `${COST_EUR.AI_EMAIL_FIND} € / prospect`, note: 'Enrichissement', color: '#2DD4B8' },
                    { icon: Sparkles, label: 'IA — Génération emails', cost: `${COST_EUR.AI_EMAIL_GEN} € / email`, note: 'Envoi personnalisé', color: '#A78BDB' },
                  ].map(r => (
                    <tr key={r.label} style={{ borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
                      <td className='px-6 py-3'>
                        <div className='flex items-center gap-3'>
                          <r.icon size={16} style={{ color: r.color }} />
                          <span style={{ fontWeight: 600, color: '#F2EDE4' }}>{r.label}</span>
                        </div>
                      </td>
                      <td className='px-6 py-3' style={{ color: 'rgba(242,237,228,0.55)', fontFamily: 'monospace', fontSize: 13 }}>{r.cost}</td>
                      <td className='px-6 py-3' style={{ color: 'rgba(242,237,228,0.28)', fontSize: 12 }}>{r.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Projections */}
            <div className="admin-glass-table">
              <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.12)' }}>
                <h2 style={{ fontFamily: ''Playfair Display', serif', fontSize: 16, color: '#F2EDE4', margin: 0 }}>Projections de coûts (€)</h2>
                <p style={{ fontFamily: ''Outfit', sans-serif', fontSize: 12, color: 'rgba(242,237,228,0.28)', margin: '4px 0 0' }}>
                  Comparaison standard vs éco — recherche + enrichissement + envoi emails
                </p>
              </div>
              <table className='w-full' style={{ fontFamily: ''Outfit', sans-serif', fontSize: 13, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.12)' }}>
                    {['Prospects', 'Standard', 'Mode Éco', 'Économie', '€/prospect (éco)'].map(h => (
                      <th key={h} className='text-left px-5 py-3' style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: 'rgba(242,237,228,0.28)', fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {projections.map(p => {
                    const saving = p.standard.total - p.eco.total;
                    const savingPct = p.standard.total > 0 ? Math.round((saving / p.standard.total) * 100) : 0;
                    return (
                      <tr key={p.n} style={{ borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
                        <td className='px-5 py-3' style={{ fontWeight: 600, color: '#F2EDE4' }}>{p.n.toLocaleString('fr-FR')}</td>
                        <td className='px-5 py-3' style={{ color: 'rgba(242,237,228,0.55)' }}>{fmt(p.standard.total)}</td>
                        <td className='px-5 py-3' style={{ fontWeight: 700, color: '#2DD4B8' }}>{fmt(p.eco.total)}</td>
                        <td className='px-5 py-3' style={{ color: '#34A853', fontWeight: 600 }}>-{fmt(saving)} ({savingPct}%)</td>
                        <td className='px-5 py-3' style={{ color: 'rgba(242,237,228,0.55)' }}>{fmt(p.eco.total / p.n)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Notes */}
            <div style={{ padding: '20px 24px', background: 'rgba(13,138,111,0.04)', border: '1px solid rgba(13,138,111,0.15)', borderRadius: '28px' }}>
              <h3 style={{ fontFamily: ''Playfair Display', serif', fontSize: 14, color: '#F2EDE4', margin: '0 0 8px' }}>📝 Notes</h3>
              <ul style={{ fontFamily: ''Outfit', sans-serif', fontSize: 13, color: 'rgba(242,237,228,0.55)', margin: 0, paddingLeft: 20, lineHeight: 2 }}>
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
