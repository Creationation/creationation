import { useState, useEffect, useRef, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Send } from 'lucide-react';

const PortalMessages = () => {
  const { client } = useOutletContext<{ client: { id: string; contact_name: string | null; business_name: string } }>();
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [userId, setUserId] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => { if (user) setUserId(user.id); });
  }, []);

  useEffect(() => {
    if (!client?.id) return;
    (async () => {
      const { data } = await supabase.from('projects').select('id,title').eq('client_id', client.id);
      const p = data || [];
      setProjects(p);
      if (p.length === 1) setSelectedProject(p[0]);
    })();
  }, [client]);

  const fetchMessages = useCallback(async () => {
    if (!selectedProject) return;
    const { data } = await supabase.from('portal_messages').select('*').eq('project_id', selectedProject.id).order('created_at', { ascending: true });
    setMessages(data || []);
    // Mark team messages as read
    const unread = (data || []).filter(m => m.sender_type === 'team' && !m.is_read);
    for (const m of unread) {
      await supabase.from('portal_messages').update({ is_read: true, read_at: new Date().toISOString() } as any).eq('id', m.id);
    }
  }, [selectedProject]);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  // Realtime
  useEffect(() => {
    if (!selectedProject) return;
    const channel = supabase.channel(`portal-msgs-${selectedProject.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'portal_messages', filter: `project_id=eq.${selectedProject.id}` },
        () => fetchMessages()
      ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedProject, fetchMessages]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMessage = async () => {
    if (!newMsg.trim() || !selectedProject || !userId) return;
    await supabase.from('portal_messages').insert({
      project_id: selectedProject.id, sender_id: userId, sender_type: 'client', content: newMsg.trim(),
    } as any);
    setNewMsg('');
  };

  if (projects.length > 1 && !selectedProject) {
    return (
      <div className="space-y-4">
        <h1 style={{ fontFamily: 'var(--font-h)', fontSize: 24, color: 'var(--charcoal)' }}>Messages</h1>
        {projects.map(p => (
          <button key={p.id} onClick={() => setSelectedProject(p)} style={{
            display: 'block', width: '100%', textAlign: 'left', padding: 16, borderRadius: 'var(--r)',
            background: 'var(--glass-bg-strong)', border: '1px solid var(--glass-border)', cursor: 'pointer', backdropFilter: 'blur(16px)',
          }}>
            <div style={{ fontFamily: 'var(--font-b)', fontSize: 15, fontWeight: 600, color: 'var(--charcoal)' }}>{p.title}</div>
          </button>
        ))}
      </div>
    );
  }

  if (!selectedProject) return <div style={{ fontFamily: 'var(--font-b)', color: 'var(--text-light)', textAlign: 'center', padding: 40 }}>Aucun projet trouvé.</div>;

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 160px)' }}>
      {projects.length > 1 && (
        <button onClick={() => setSelectedProject(null)} style={{ fontFamily: 'var(--font-b)', fontSize: 13, color: 'var(--teal)', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 8 }}>
          ← Projets
        </button>
      )}
      <h2 style={{ fontFamily: 'var(--font-h)', fontSize: 20, color: 'var(--charcoal)', margin: '0 0 12px' }}>
        💬 {selectedProject.title}
      </h2>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1" style={{ minHeight: 0 }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, fontFamily: 'var(--font-b)', fontSize: 14, color: 'var(--text-light)' }}>
            Démarrez la conversation avec l'équipe CreationNation
          </div>
        )}
        {messages.map(m => {
          const isClient = m.sender_type === 'client';
          return (
            <div key={m.id} style={{ display: 'flex', justifyContent: isClient ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '75%', padding: '10px 14px', borderRadius: 16,
                background: isClient ? 'var(--teal)' : 'rgba(255,255,255,0.7)',
                color: isClient ? '#fff' : 'var(--charcoal)',
                borderBottomRightRadius: isClient ? 4 : 16,
                borderBottomLeftRadius: isClient ? 16 : 4,
                backdropFilter: isClient ? 'none' : 'blur(10px)',
                border: isClient ? 'none' : '1px solid var(--glass-border)',
              }}>
                <p style={{ fontFamily: 'var(--font-b)', fontSize: 14, margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{m.content}</p>
                <div className="flex items-center gap-2 mt-1" style={{ justifyContent: isClient ? 'flex-end' : 'flex-start' }}>
                  <span style={{ fontFamily: 'var(--font-b)', fontSize: 10, opacity: 0.7 }}>
                    {new Date(m.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {isClient && m.is_read && <span style={{ fontSize: 10, opacity: 0.7 }}>✓✓</span>}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2" style={{
        padding: 12, borderRadius: 'var(--r)', background: 'var(--glass-bg-strong)',
        border: '1px solid var(--glass-border)', backdropFilter: 'blur(16px)',
      }}>
        <input value={newMsg} onChange={e => setNewMsg(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
          placeholder="Écrire un message..."
          style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontFamily: 'var(--font-b)', fontSize: 14, color: 'var(--charcoal)' }}
        />
        <button onClick={sendMessage} disabled={!newMsg.trim()} style={{
          width: 40, height: 40, borderRadius: '50%', background: newMsg.trim() ? 'var(--teal)' : 'rgba(0,0,0,0.06)',
          border: 'none', cursor: newMsg.trim() ? 'pointer' : 'default',
          display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
        }}>
          <Send size={16} color={newMsg.trim() ? '#fff' : 'var(--text-light)'} />
        </button>
      </div>
    </div>
  );
};

export default PortalMessages;
