import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Send } from 'lucide-react';
import { sendPortalNotification } from '@/lib/portalNotifications';

const PortalMessagesAdmin = ({ projectId, clientId }: { projectId: string; clientId?: string }) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [userId, setUserId] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => { if (user) setUserId(user.id); });
  }, []);

  const fetchMessages = useCallback(async () => {
    const { data } = await supabase.from('portal_messages').select('*').eq('project_id', projectId).order('created_at', { ascending: true });
    setMessages(data || []);
    // Mark client messages as read
    const unread = (data || []).filter(m => m.sender_type === 'client' && !m.is_read);
    for (const m of unread) {
      await supabase.from('portal_messages').update({ is_read: true, read_at: new Date().toISOString() } as any).eq('id', m.id);
    }
  }, [projectId]);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  useEffect(() => {
    const channel = supabase.channel(`admin-msgs-${projectId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'portal_messages', filter: `project_id=eq.${projectId}` },
        () => fetchMessages()
      ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [projectId, fetchMessages]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMessage = async () => {
    if (!newMsg.trim() || !userId) return;
    await supabase.from('portal_messages').insert({
      project_id: projectId, sender_id: userId, sender_type: 'team', content: newMsg.trim(),
    } as any);
    setNewMsg('');
  };

  return (
    <div className="flex flex-col" style={{ height: 400 }}>
      <div className="flex-1 overflow-y-auto space-y-2 mb-3 pr-1" style={{ minHeight: 0 }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', padding: 20, fontFamily: 'var(--font-b)', fontSize: 13, color: 'var(--text-light)' }}>
            Aucun message. Envoyez un premier message au client.
          </div>
        )}
        {messages.map(m => {
          const isTeam = m.sender_type === 'team';
          return (
            <div key={m.id} style={{ display: 'flex', justifyContent: isTeam ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '70%', padding: '8px 12px', borderRadius: 12,
                background: isTeam ? 'var(--teal)' : 'rgba(0,0,0,0.04)',
                color: isTeam ? '#fff' : 'var(--charcoal)',
                borderBottomRightRadius: isTeam ? 2 : 12,
                borderBottomLeftRadius: isTeam ? 12 : 2,
              }}>
                <p style={{ fontFamily: 'var(--font-b)', fontSize: 13, margin: 0, whiteSpace: 'pre-wrap' }}>{m.content}</p>
                <span style={{ fontFamily: 'var(--font-b)', fontSize: 9, opacity: 0.7 }}>
                  {new Date(m.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  {isTeam && m.is_read && ' ✓✓'}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2">
        <input value={newMsg} onChange={e => setNewMsg(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
          placeholder="Répondre au client..."
          style={{ flex: 1, padding: '8px 12px', borderRadius: 10, border: '1px solid var(--glass-border)', fontFamily: 'var(--font-b)', fontSize: 13, outline: 'none' }}
        />
        <button onClick={sendMessage} disabled={!newMsg.trim()} style={{
          padding: '8px 14px', background: newMsg.trim() ? 'var(--teal)' : 'rgba(0,0,0,0.06)',
          color: newMsg.trim() ? '#fff' : 'var(--text-light)', border: 'none', borderRadius: 10, cursor: newMsg.trim() ? 'pointer' : 'default',
        }}>
          <Send size={16} />
        </button>
      </div>
    </div>
  );
};

export default PortalMessagesAdmin;
