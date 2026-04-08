import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Send } from 'lucide-react';
import { toast } from 'sonner';

const statusColors: Record<string, string> = {
  open: '#0d8a6f', in_progress: '#4da6d9', waiting_client: '#d4a55a', resolved: '#7c5cbf', closed: '#9b9590',
};
const statusLabels: Record<string, string> = {
  open: 'Ouvert', in_progress: 'En cours', waiting_client: 'En attente', resolved: 'Résolu', closed: 'Fermé',
};
const priorityColors: Record<string, string> = {
  low: '#9b9590', medium: '#4da6d9', high: '#d4a55a', urgent: '#e8735a',
};
const priorityLabels: Record<string, string> = {
  low: 'Basse', medium: 'Moyenne', high: 'Haute', urgent: 'Urgente',
};
const categoryLabels: Record<string, string> = {
  bug: 'Bug', feature_request: 'Nouvelle fonctionnalité', modification: 'Modification', question: 'Question', other: 'Autre',
};

const PortalTicketDetail = () => {
  const { id } = useParams();
  const { client } = useOutletContext<{ client: any }>();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchData = async () => {
    if (!id) return;
    const [ticketRes, msgsRes] = await Promise.all([
      supabase.from('support_tickets').select('*').eq('id', id).single(),
      supabase.from('ticket_messages').select('*').eq('ticket_id', id).order('created_at', { ascending: true }),
    ]);
    setTicket(ticketRes.data);
    setMessages(msgsRes.data || []);
    setLoading(false);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  useEffect(() => { fetchData(); }, [id]);

  // Realtime messages
  useEffect(() => {
    if (!id) return;
    const channel = supabase.channel(`ticket-msgs-${id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'ticket_messages',
        filter: `ticket_id=eq.${id}`,
      }, (payload: any) => {
        setMessages(prev => [...prev, payload.new]);
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id]);

  const handleSend = async () => {
    if (!newMsg.trim() || !ticket) return;
    setSending(true);
    const { error } = await supabase.from('ticket_messages').insert({
      ticket_id: ticket.id,
      author_type: 'client' as any,
      author_name: client?.contact_name || client?.business_name || 'Client',
      content: newMsg.trim(),
    } as any);
    if (error) { toast.error('Erreur envoi'); setSending(false); return; }
    setNewMsg('');
    setSending(false);
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 40, fontFamily: 'var(--font-b)', color: 'var(--text-light)' }}>Chargement...</div>;
  if (!ticket) return <div style={{ textAlign: 'center', padding: 40, fontFamily: 'var(--font-b)', color: 'var(--text-light)' }}>Ticket introuvable</div>;

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 140px)' }}>
      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <button onClick={() => navigate('/portal/tickets')} style={{
          display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none',
          cursor: 'pointer', fontFamily: 'var(--font-b)', fontSize: 13, color: 'var(--text-mid)', marginBottom: 12,
        }}>
          <ArrowLeft size={16} /> Retour aux tickets
        </button>

        <div style={{
          background: 'var(--glass-bg-strong)', backdropFilter: 'blur(20px)', borderRadius: 'var(--r)',
          border: '1px solid var(--glass-border)', padding: 20,
        }}>
          <h2 style={{ fontFamily: 'var(--font-h)', fontSize: 20, color: 'var(--charcoal)', margin: '0 0 10px' }}>
            {ticket.title}
          </h2>
          <div className="flex flex-wrap gap-2 mb-3">
            <span style={{ padding: '3px 12px', borderRadius: 'var(--pill)', background: `${statusColors[ticket.status]}18`, color: statusColors[ticket.status], fontFamily: 'var(--font-m)', fontSize: 11, fontWeight: 600 }}>
              {statusLabels[ticket.status]}
            </span>
            <span style={{ padding: '3px 12px', borderRadius: 'var(--pill)', background: `${priorityColors[ticket.priority]}18`, color: priorityColors[ticket.priority], fontFamily: 'var(--font-m)', fontSize: 11, fontWeight: 600 }}>
              {priorityLabels[ticket.priority]}
            </span>
            <span style={{ padding: '3px 12px', borderRadius: 'var(--pill)', background: 'rgba(0,0,0,0.04)', color: 'var(--text-mid)', fontFamily: 'var(--font-b)', fontSize: 11 }}>
              {categoryLabels[ticket.category] || ticket.category}
            </span>
          </div>
          {ticket.description && (
            <p style={{ fontFamily: 'var(--font-b)', fontSize: 13, color: 'var(--text-mid)', lineHeight: 1.6, margin: 0 }}>
              {ticket.description}
            </p>
          )}
          <div style={{ fontFamily: 'var(--font-b)', fontSize: 11, color: 'var(--text-light)', marginTop: 8 }}>
            Créé le {new Date(ticket.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto" style={{
        background: 'var(--glass-bg)', backdropFilter: 'blur(10px)', borderRadius: 'var(--r)',
        border: '1px solid var(--glass-border)', padding: 16, marginBottom: 12,
      }}>
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, fontFamily: 'var(--font-b)', fontSize: 13, color: 'var(--text-light)' }}>
            Aucun message pour le moment
          </div>
        ) : messages.map(m => {
          const isClient = m.author_type === 'client';
          return (
            <div key={m.id} style={{
              display: 'flex', justifyContent: isClient ? 'flex-end' : 'flex-start', marginBottom: 12,
            }}>
              <div style={{
                maxWidth: '80%', padding: '12px 16px', borderRadius: 16,
                borderBottomRightRadius: isClient ? 4 : 16,
                borderBottomLeftRadius: isClient ? 16 : 4,
                background: isClient ? 'var(--teal)' : 'rgba(255,255,255,0.8)',
                color: isClient ? '#fff' : 'var(--charcoal)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              }}>
                <div style={{ fontFamily: 'var(--font-b)', fontSize: 11, fontWeight: 600, marginBottom: 4, opacity: 0.7 }}>
                  {m.author_name || (isClient ? 'Vous' : 'Creationation')}
                </div>
                <div style={{ fontFamily: 'var(--font-b)', fontSize: 14, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                  {m.content}
                </div>
                <div style={{ fontFamily: 'var(--font-b)', fontSize: 10, marginTop: 6, opacity: 0.5 }}>
                  {new Date(m.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {ticket.status !== 'closed' && (
        <div className="flex items-center gap-2" style={{
          background: 'var(--glass-bg-strong)', backdropFilter: 'blur(20px)', borderRadius: 16,
          border: '1px solid var(--glass-border)', padding: '8px 12px',
        }}>
          <input
            value={newMsg} onChange={e => setNewMsg(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Votre message..."
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              fontFamily: 'var(--font-b)', fontSize: 14, color: 'var(--charcoal)', padding: '8px 4px',
            }}
          />
          <button onClick={handleSend} disabled={sending || !newMsg.trim()} style={{
            width: 40, height: 40, borderRadius: 12, background: newMsg.trim() ? 'var(--teal)' : 'var(--glass-bg)',
            border: 'none', cursor: newMsg.trim() ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: newMsg.trim() ? '#fff' : 'var(--text-light)', transition: 'all 0.15s',
          }}>
            <Send size={18} />
          </button>
        </div>
      )}
    </div>
  );
};

export default PortalTicketDetail;
