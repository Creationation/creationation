import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ChevronLeft, LogOut, DollarSign, Search, Mail, Sparkles, MapPin, TrendingUp } from 'lucide-react';

const GOOGLE_COST_TEXT_SEARCH = 0.032;
const GOOGLE_COST_PLACE_DETAIL = 0.020;
const AI_COST_PER_EMAIL_FIND = 0.0005;
const AI_COST_PER_EMAIL_GEN = 0.001;

const AdminCosts = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ totalProspects: 0, totalEmails: 0, prospectsBySource: { google_maps: 0, manual: 0 }, emailsSent: 0 });
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    const [{ count: totalProspects }, { count: totalEmails }, { data: prospects }, { count: emailsSent }] = await Promise.all([
      supabase.from('prospects').select('*', { count: 'exact', head: true }),
      supabase.from('prospects').select('*', { count: 'exact', head: true }).not('email', 'is', null),
      supabase.from('prospects').select('source'),
      supabase.from('prospect_emails').select('*', { count: 'exact', head: true }),
    ]);
    const google = (prospects || []).filter(p => p.source === 'google_maps').length;
    const manual = (prospects || []).filter(p => p.source === 'manual').length;
    setStats({
      totalProspects: totalProspects || 0,
      totalEmails: totalEmails || 0,
      prospectsBySource: { google_maps: google, manual },
      emailsSent: emailsSent || 0,
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { navigate('/admin/login'); return; }
      supabase.from('user_roles').select('role').eq('user_id', user.id).eq('role', 'admin').then(({ data: roles }) => {
        if (!roles || roles.length === 0) navigate('/admin/login');
        else fetchStats();
      });
    });
  }, [navigate, fetchStats]);

  // Cost estimates
  const textSearchCalls = Math.ceil(stats.prospectsBySource.google_maps / 20);
  const googleSearchCost = textSearchCalls * GOOGLE_COST_TEXT_SEARCH;
  const googleDetailCost = stats.prospectsBySource.google_maps * GOOGLE_COST_PLACE_DETAIL;
  const googleTotal = googleSearchCost + googleDetailCost;
  const aiEmailFindCost = stats.totalEmails * AI_COST_PER_EMAIL_FIND;
  const aiEmailGenCost = stats.emailsSent * AI_COST_PER_EMAIL_GEN;
  const aiTotal = aiEmailFindCost + aiEmailGenCost;
  const grandTotal = googleTotal + aiTotal;

  const fmt = (n: number) => n < 0.01 ? '< $0.01' : `$${n.toFixed(2)}`;

  const costRows = [
    { icon: Search, label: 'Google Text Search', detail: `${textSearchCalls} requêtes × $${GOOGLE_COST_TEXT_SEARCH}`, cost: googleSearchCost, color: '#4285F4' },
    { icon: MapPin, label: 'Google Place Details', detail: `${stats.prospectsBySource.google_maps} appels × $${GOOGLE_COST_PLACE_DETAIL}`, cost: googleDetailCost, color: '#34A853' },
    { icon: Sparkles, label: 'IA — Recherche emails', detail: `${stats.totalEmails} recherches × $${AI_COST_PER_EMAIL_FIND}`, cost: aiEmailFindCost, color: '#d4a55a' },
    { icon: Mail, label: 'IA — Génération emails', detail: `${stats.emailsSent} générations × $${AI_COST_PER_EMAIL_GEN}`, cost: aiEmailGenCost, color: '#0d8a6f' },
  ];

  // Projections
  const projections = [100, 500, 1000, 5000].map(n => {
    const searches = Math.ceil(n / 20);
    const gCost = searches * GOOGLE_COST_TEXT_SEARCH + n * GOOGLE_COST_PLACE_DETAIL;
    const aCost = n * AI_COST_PER_EMAIL_FIND + n * AI_COST_PER_EMAIL_GEN;
    return { n, google: gCost, ai: aCost, total: gCost + aCost };
  });

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)', padding: '24px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div className='flex items-center justify-between mb-6'>
          <div className='flex items-center gap-4'>
            <Link to='/admin' style={{ color: 'var(--text-light)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-b)', fontSize: 13 }}>
              <ChevronLeft size={16} /> Dashboard
            </Link>
            <h1 style={{ fontFamily: 'var(--font-h)', fontSize: 24, color: 'var(--charcoal)', margin: 0 }}>
              <DollarSign size={22} style={{ verticalAlign: 'middle', marginRight: 8, color: 'var(--teal)' }} />
              Suivi des Coûts
            </h1>
          </div>
          <button onClick={async () => { await supabase.auth.signOut(); navigate('/admin/login'); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)' }}><LogOut size={18} /></button>
        </div>

        {loading ? (
          <div className='text-center py-20' style={{ color: 'var(--text-light)', fontFamily: 'var(--font-b)' }}>Chargement...</div>
        ) : (
          <div className='flex flex-col gap-6'>
            {/* Summary cards */}
            <div className='flex flex-wrap gap-4'>
              {[
                { label: 'Coût total estimé', value: fmt(grandTotal), icon: DollarSign, accent: 'var(--teal)' },
                { label: 'Google API', value: fmt(googleTotal), icon: Search, accent: '#4285F4' },
                { label: 'Lovable AI', value: fmt(aiTotal), icon: Sparkles, accent: '#d4a55a' },
                { label: 'Coût / prospect', value: stats.totalProspects > 0 ? fmt(grandTotal / stats.totalProspects) : '—', icon: TrendingUp, accent: 'var(--charcoal)' },
              ].map(c => (
                <div key={c.label} style={{ flex: '1 1 180px', padding: '20px', background: 'var(--glass-bg-strong)', border: '1px solid var(--glass-border)', borderRadius: 'var(--r-xl)' }}>
                  <c.icon size={18} style={{ color: c.accent, marginBottom: 8 }} />
                  <div style={{ fontFamily: 'var(--font-h)', fontSize: 24, color: 'var(--charcoal)' }}>{c.value}</div>
                  <div style={{ fontFamily: 'var(--font-b)', fontSize: 11, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: 1 }}>{c.label}</div>
                </div>
              ))}
            </div>

            {/* Detailed breakdown */}
            <div style={{ background: 'var(--glass-bg-strong)', border: '1px solid var(--glass-border)', borderRadius: 'var(--r-xl)', overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--glass-border)' }}>
                <h2 style={{ fontFamily: 'var(--font-h)', fontSize: 16, color: 'var(--charcoal)', margin: 0 }}>Détail des coûts (usage actuel)</h2>
                <p style={{ fontFamily: 'var(--font-b)', fontSize: 12, color: 'var(--text-light)', margin: '4px 0 0' }}>
                  Basé sur {stats.totalProspects} prospects ({stats.prospectsBySource.google_maps} Google Maps, {stats.prospectsBySource.manual} manuels)
                </p>
              </div>
              <table className='w-full' style={{ fontFamily: 'var(--font-b)', fontSize: 14, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    {['Service', 'Détail', 'Coût'].map(h => (
                      <th key={h} className='text-left px-6 py-3' style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-light)', fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {costRows.map(r => (
                    <tr key={r.label} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                      <td className='px-6 py-4'>
                        <div className='flex items-center gap-3'>
                          <r.icon size={16} style={{ color: r.color }} />
                          <span style={{ fontWeight: 600, color: 'var(--charcoal)' }}>{r.label}</span>
                        </div>
                      </td>
                      <td className='px-6 py-4' style={{ color: 'var(--text-mid)', fontSize: 13 }}>{r.detail}</td>
                      <td className='px-6 py-4' style={{ fontWeight: 600, color: 'var(--charcoal)' }}>{fmt(r.cost)}</td>
                    </tr>
                  ))}
                  <tr style={{ background: 'rgba(13,138,111,0.04)' }}>
                    <td className='px-6 py-4' style={{ fontWeight: 700, color: 'var(--charcoal)' }}>Total</td>
                    <td className='px-6 py-4'></td>
                    <td className='px-6 py-4' style={{ fontWeight: 700, color: 'var(--teal)', fontSize: 16 }}>{fmt(grandTotal)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Projections */}
            <div style={{ background: 'var(--glass-bg-strong)', border: '1px solid var(--glass-border)', borderRadius: 'var(--r-xl)', overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--glass-border)' }}>
                <h2 style={{ fontFamily: 'var(--font-h)', fontSize: 16, color: 'var(--charcoal)', margin: 0 }}>Projections de coûts</h2>
                <p style={{ fontFamily: 'var(--font-b)', fontSize: 12, color: 'var(--text-light)', margin: '4px 0 0' }}>
                  Estimation si recherche + emails IA pour chaque prospect
                </p>
              </div>
              <table className='w-full' style={{ fontFamily: 'var(--font-b)', fontSize: 14, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    {['Prospects', 'Google API', 'Lovable AI', 'Total', '/ prospect'].map(h => (
                      <th key={h} className='text-left px-6 py-3' style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-light)', fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {projections.map(p => (
                    <tr key={p.n} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                      <td className='px-6 py-4' style={{ fontWeight: 600, color: 'var(--charcoal)' }}>{p.n.toLocaleString()}</td>
                      <td className='px-6 py-4' style={{ color: '#4285F4' }}>{fmt(p.google)}</td>
                      <td className='px-6 py-4' style={{ color: '#d4a55a' }}>{fmt(p.ai)}</td>
                      <td className='px-6 py-4' style={{ fontWeight: 700, color: 'var(--teal)' }}>{fmt(p.total)}</td>
                      <td className='px-6 py-4' style={{ color: 'var(--text-mid)' }}>{fmt(p.total / p.n)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Notes */}
            <div style={{ padding: '20px 24px', background: 'rgba(13,138,111,0.04)', border: '1px solid rgba(13,138,111,0.15)', borderRadius: 'var(--r-xl)' }}>
              <h3 style={{ fontFamily: 'var(--font-h)', fontSize: 14, color: 'var(--charcoal)', margin: '0 0 8px' }}>📝 Notes</h3>
              <ul style={{ fontFamily: 'var(--font-b)', fontSize: 13, color: 'var(--text-mid)', margin: 0, paddingLeft: 20, lineHeight: 2 }}>
                <li>Les coûts Google sont basés sur le <strong>Places API (New)</strong> — Text Search + Place Details</li>
                <li>Les coûts IA sont estimatifs (Lovable AI facture à l'usage)</li>
                <li>L'envoi d'emails via Resend est gratuit jusqu'à 100/jour, puis $0.001/email</li>
                <li>Les prospects manuels ne génèrent aucun coût Google</li>
                <li>Google offre $200/mois de crédit gratuit sur l'API</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCosts;
