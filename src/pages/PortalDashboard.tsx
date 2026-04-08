import { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { TicketCheck, FolderOpen, Plus, ArrowRight, AlertCircle } from 'lucide-react';

const statusColors: Record<string, string> = {
  open: '#0d8a6f', in_progress: '#4da6d9', waiting_client: '#d4a55a', resolved: '#7c5cbf', closed: '#9b9590',
};
const statusLabels: Record<string, string> = {
  open: 'Ouvert', in_progress: 'En cours', waiting_client: 'En attente', resolved: 'Résolu', closed: 'Fermé',
};
const projectStatusLabels: Record<string, string> = {
  draft: 'Brouillon', brief: 'Brief', maquette: 'Maquette', in_progress: 'En développement',
  development: 'En développement', review: 'En révision', delivered: 'Livré', maintenance: 'Maintenance',
};

const PortalDashboard = () => {
  const { client, simulationMode } = useOutletContext<{ client: any; simulationMode?: boolean }>();
  const navigate = useNavigate();
  const [openTickets, setOpenTickets] = useState(0);
  const [lastTicket, setLastTicket] = useState<any>(null);
  const [project, setProject] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!client?.id) return;
    const load = async () => {
      const [ticketsRes, lastTicketRes, projectRes, notifsRes] = await Promise.all([
        supabase.from('support_tickets').select('id', { count: 'exact' }).eq('client_id', client.id).in('status', ['open', 'in_progress', 'waiting_client']),
        supabase.from('support_tickets').select('*').eq('client_id', client.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('projects').select('*').eq('client_id', client.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('support_notifications').select('*').eq('recipient_client_id', client.id).eq('is_read', false).order('created_at', { ascending: false }).limit(5),
      ]);
      setOpenTickets(ticketsRes.count || 0);
      setLastTicket(lastTicketRes.data);
      setProject(projectRes.data);
      setNotifications(notifsRes.data || []);
      setLoading(false);
    };
    load();
  }, [client?.id]);

  if (loading) return <div style={{ fontFamily: 'var(--font-b)', color: 'var(--text-light)', textAlign: 'center', padding: 40 }}>Chargement...</div>;

  const Card = ({ children, onClick, style }: any) => (
    <div onClick={onClick} style={{
      background: 'var(--glass-bg-strong)', backdropFilter: 'blur(20px)',
      borderRadius: 'var(--r)', border: '1px solid var(--glass-border)',
      padding: 20, cursor: onClick ? 'pointer' : 'default',
      transition: 'transform 0.15s, box-shadow 0.15s', ...style,
    }}
      onMouseEnter={e => { if (onClick) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)'; } }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      {children}
    </div>
  );

  const base = simulationMode ? `/admin/view-as/${client?.id}` : '/portal';

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-h)', fontSize: 26, color: 'var(--charcoal)', margin: 0 }}>
          Bonjour, {client?.contact_name?.split(' ')[0] || client?.business_name} 👋
        </h1>
        <p style={{ fontFamily: 'var(--font-b)', fontSize: 14, color: 'var(--text-mid)', marginTop: 4 }}>
          Bienvenue sur votre espace {client?.business_name}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card onClick={() => navigate(`${base}/tickets`)}>
          <div className="flex items-center gap-3 mb-2">
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--teal-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TicketCheck size={18} color="var(--teal)" />
            </div>
            <span style={{ fontFamily: 'var(--font-b)', fontSize: 13, color: 'var(--text-mid)' }}>Tickets ouverts</span>
          </div>
          <div style={{ fontFamily: 'var(--font-h)', fontSize: 32, color: 'var(--charcoal)' }}>{openTickets}</div>
        </Card>

        <Card onClick={() => lastTicket && navigate(`${base}/tickets/${lastTicket.id}`)}>
          <div className="flex items-center gap-3 mb-2">
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--violet-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertCircle size={18} color="var(--violet)" />
            </div>
            <span style={{ fontFamily: 'var(--font-b)', fontSize: 13, color: 'var(--text-mid)' }}>Dernier ticket</span>
          </div>
          {lastTicket ? (
            <>
              <div style={{ fontFamily: 'var(--font-b)', fontSize: 14, color: 'var(--charcoal)', fontWeight: 600, marginBottom: 4 }}>
                {lastTicket.title?.substring(0, 30)}{lastTicket.title?.length > 30 ? '...' : ''}
              </div>
              <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 'var(--pill)', background: `${statusColors[lastTicket.status]}18`, color: statusColors[lastTicket.status], fontFamily: 'var(--font-m)', fontSize: 11, fontWeight: 600 }}>
                {statusLabels[lastTicket.status]}
              </span>
            </>
          ) : (
            <div style={{ fontFamily: 'var(--font-b)', fontSize: 13, color: 'var(--text-light)' }}>Aucun ticket</div>
          )}
        </Card>

        <Card onClick={() => navigate(`${base}/project`)}>
          <div className="flex items-center gap-3 mb-2">
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(77,166,217,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FolderOpen size={18} color="var(--sky)" />
            </div>
            <span style={{ fontFamily: 'var(--font-b)', fontSize: 13, color: 'var(--text-mid)' }}>Mon projet</span>
          </div>
          {project ? (
            <>
              <div style={{ fontFamily: 'var(--font-b)', fontSize: 14, color: 'var(--charcoal)', fontWeight: 600, marginBottom: 4 }}>{project.title}</div>
              <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 'var(--pill)', background: 'rgba(77,166,217,0.15)', color: '#4da6d9', fontFamily: 'var(--font-m)', fontSize: 11, fontWeight: 600 }}>
                {projectStatusLabels[project.status] || project.status}
              </span>
            </>
          ) : (
            <div style={{ fontFamily: 'var(--font-b)', fontSize: 13, color: 'var(--text-light)' }}>Aucun projet</div>
          )}
        </Card>
      </div>

      {notifications.length > 0 && (
        <div style={{ background: 'var(--glass-bg)', backdropFilter: 'blur(20px)', borderRadius: 'var(--r)', border: '1px solid var(--glass-border)', padding: 20, marginBottom: 24 }}>
          <h3 style={{ fontFamily: 'var(--font-b)', fontSize: 14, fontWeight: 600, color: 'var(--charcoal)', margin: '0 0 12px' }}>Notifications non lues</h3>
          {notifications.map(n => (
            <div key={n.id} style={{ padding: '10px 0', borderBottom: '1px solid rgba(0,0,0,0.04)', fontFamily: 'var(--font-b)', fontSize: 13 }}>
              <span style={{ fontWeight: 600, color: 'var(--charcoal)' }}>{n.title}</span>
              {n.content && <span style={{ color: 'var(--text-mid)', marginLeft: 8 }}>{n.content}</span>}
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        {!simulationMode && (
          <button onClick={() => navigate(`${base}/tickets?new=1`)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', background: 'var(--teal)', color: '#fff', border: 'none', borderRadius: 'var(--pill)', fontFamily: 'var(--font-b)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            <Plus size={16} /> Créer un ticket
          </button>
        )}
        <button onClick={() => navigate(`${base}/tickets`)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', background: 'var(--glass-bg-strong)', color: 'var(--charcoal)', border: '1px solid var(--glass-border)', borderRadius: 'var(--pill)', fontFamily: 'var(--font-b)', fontSize: 14, fontWeight: 600, cursor: 'pointer', backdropFilter: 'blur(10px)' }}>
          Voir mes tickets <ArrowRight size={14} />
        </button>
        <button onClick={() => navigate(`${base}/project`)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', background: 'var(--glass-bg-strong)', color: 'var(--charcoal)', border: '1px solid var(--glass-border)', borderRadius: 'var(--pill)', fontFamily: 'var(--font-b)', fontSize: 14, fontWeight: 600, cursor: 'pointer', backdropFilter: 'blur(10px)' }}>
          Mon projet <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
};

export default PortalDashboard;
