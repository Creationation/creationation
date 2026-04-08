import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { X, Send, Plus, MessageSquare, Mail, Phone, Calendar } from 'lucide-react';

type Lead = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  project_type: string | null;
  budget: string | null;
  message: string | null;
  status: string;
  created_at: string;
};

type Note = {
  id: string;
  content: string;
  created_at: string;
};

type EmailRecord = {
  id: string;
  subject: string;
  body: string;
  sent_at: string;
};

const statusLabels: Record<string, string> = {
  new: 'Nouveau',
  contacted: 'Contacté',
  qualified: 'Qualifié',
  converted: 'Converti',
  lost: 'Perdu',
};

const statusColors: Record<string, string> = {
  new: '#2DD4B8',
  contacted: '#4da6d9',
  qualified: '#F0C95C',
  converted: '#A78BDB',
  lost: '#F07067',
};

interface Props {
  lead: Lead;
  onClose: () => void;
  onStatusChange: (status: string) => void;
  onSendEmail: () => void;
}

const LeadDetail = ({ lead, onClose, onStatusChange, onSendEmail }: Props) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [emails, setEmails] = useState<EmailRecord[]>([]);
  const [newNote, setNewNote] = useState('');
  const [activeTab, setActiveTab] = useState<'info' | 'notes' | 'emails'>('info');

  useEffect(() => {
    fetchNotes();
    fetchEmails();
  }, [lead.id]);

  const fetchNotes = async () => {
    const { data } = await supabase
      .from('lead_notes')
      .select('id, content, created_at')
      .eq('lead_id', lead.id)
      .order('created_at', { ascending: false });
    setNotes((data as Note[]) || []);
  };

  const fetchEmails = async () => {
    const { data } = await supabase
      .from('lead_emails')
      .select('id, subject, body, sent_at')
      .eq('lead_id', lead.id)
      .order('sent_at', { ascending: false });
    setEmails((data as EmailRecord[]) || []);
  };

  const addNote = async () => {
    if (!newNote.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('lead_notes').insert({
      lead_id: lead.id,
      user_id: user.id,
      content: newNote.trim(),
    });
    if (error) {
      toast.error('Erreur ajout note');
    } else {
      setNewNote('');
      fetchNotes();
      toast.success('Note ajoutée');
    }
  };

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '8px 16px',
    background: active ? '#2DD4B8' : 'transparent',
    color: active ? '#fff' : 'rgba(242,237,228,0.55)',
    border: active ? 'none' : '1px solid rgba(255,255,255,0.12)',
    borderRadius: '100px',
    fontFamily: "'Outfit', sans-serif",
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
  });

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/30" />
      <div
        className="relative w-full max-w-md h-full overflow-y-auto"
        style={{
          background: 'transparent',
          borderLeft: '1px solid rgba(255,255,255,0.12)',
          padding: '24px',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, color: '#F2EDE4', marginBottom: 4 }}>
              {lead.name}
            </h2>
            <div className="flex items-center gap-2">
              <select
                value={lead.status}
                onChange={e => onStatusChange(e.target.value)}
                style={{
                  padding: '4px 12px',
                  borderRadius: '100px',
                  border: 'none',
                  background: `${statusColors[lead.status]}18`,
                  color: statusColors[lead.status],
                  fontWeight: 600,
                  fontSize: 12,
                  fontFamily: "'Space Mono', monospace",
                  cursor: 'pointer',
                }}
              >
                {Object.entries(statusLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'rgba(242,237,228,0.28)',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Contact info */}
        <div className="flex flex-col gap-3 mb-6" style={{
          padding: '16px',
          background: 'rgba(255,255,255,0.06)',
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.12)',
        }}>
          <div className="flex items-center gap-3">
            <Mail size={14} style={{ color: '#2DD4B8' }} />
            <a href={`mailto:${lead.email}`} style={{ color: '#F2EDE4', fontFamily: "'Outfit', sans-serif", fontSize: 14 }}>
              {lead.email}
            </a>
          </div>
          {lead.phone && (
            <div className="flex items-center gap-3">
              <Phone size={14} style={{ color: '#2DD4B8' }} />
              <a href={`tel:${lead.phone}`} style={{ color: '#F2EDE4', fontFamily: "'Outfit', sans-serif", fontSize: 14 }}>
                {lead.phone}
              </a>
            </div>
          )}
          <div className="flex items-center gap-3">
            <Calendar size={14} style={{ color: '#2DD4B8' }} />
            <span style={{ color: 'rgba(242,237,228,0.55)', fontFamily: "'Outfit', sans-serif", fontSize: 14 }}>
              {new Date(lead.created_at).toLocaleDateString('fr-FR', {
                day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
              })}
            </span>
          </div>
        </div>

        {/* Send email button */}
        <button
          onClick={onSendEmail}
          className="w-full flex items-center justify-center gap-2 mb-6 cursor-pointer"
          style={{
            padding: '12px',
            background: '#2DD4B8',
            color: '#fff',
            border: 'none',
            borderRadius: '100px',
            fontFamily: "'Outfit', sans-serif",
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 4px 24px rgba(45,212,184,0.20)',
          }}
        >
          <Send size={14} /> Envoyer un email
        </button>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          {(['info', 'notes', 'emails'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={tabStyle(activeTab === tab)}>
              {tab === 'info' ? 'Détails' : tab === 'notes' ? `Notes (${notes.length})` : `Emails (${emails.length})`}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'info' && (
          <div className="flex flex-col gap-4">
            {lead.project_type && (
              <div>
                <p style={{ fontSize: 11, color: 'rgba(242,237,228,0.28)', fontFamily: "'Space Mono', monospace", textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
                  Type de projet
                </p>
                <p style={{ fontSize: 14, color: '#F2EDE4', fontFamily: "'Outfit', sans-serif" }}>{lead.project_type}</p>
              </div>
            )}
            {lead.budget && (
              <div>
                <p style={{ fontSize: 11, color: 'rgba(242,237,228,0.28)', fontFamily: "'Space Mono', monospace", textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
                  Budget
                </p>
                <p style={{ fontSize: 14, color: '#F2EDE4', fontFamily: "'Outfit', sans-serif" }}>{lead.budget}</p>
              </div>
            )}
            {lead.message && (
              <div>
                <p style={{ fontSize: 11, color: 'rgba(242,237,228,0.28)', fontFamily: "'Space Mono', monospace", textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
                  Message
                </p>
                <p style={{ fontSize: 14, color: '#F2EDE4', fontFamily: "'Outfit', sans-serif", lineHeight: 1.6 }}>{lead.message}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="flex flex-col gap-4">
            {/* Add note */}
            <div className="flex gap-2">
              <input
                placeholder="Ajouter une note..."
                value={newNote}
                onChange={e => setNewNote(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addNote()}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '12px',
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: 13,
                  color: '#F2EDE4',
                  outline: 'none',
                }}
              />
              <button
                onClick={addNote}
                style={{
                  padding: '10px',
                  background: '#2DD4B8',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                }}
              >
                <Plus size={16} />
              </button>
            </div>
            {notes.map(note => (
              <div key={note.id} style={{
                padding: '12px',
                background: 'rgba(255,255,255,0.06)',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.12)',
              }}>
                <p style={{ fontSize: 13, color: '#F2EDE4', fontFamily: "'Outfit', sans-serif", lineHeight: 1.5 }}>
                  {note.content}
                </p>
                <p style={{ fontSize: 11, color: 'rgba(242,237,228,0.28)', fontFamily: "'Space Mono', monospace", marginTop: 8 }}>
                  {new Date(note.created_at).toLocaleDateString('fr-FR', {
                    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                  })}
                </p>
              </div>
            ))}
            {notes.length === 0 && (
              <p className="text-center py-8" style={{ color: 'rgba(242,237,228,0.28)', fontFamily: "'Outfit', sans-serif", fontSize: 13 }}>
                <MessageSquare size={24} className="mx-auto mb-2" style={{ opacity: 0.3 }} />
                Aucune note pour ce prospect
              </p>
            )}
          </div>
        )}

        {activeTab === 'emails' && (
          <div className="flex flex-col gap-4">
            {emails.map(em => (
              <div key={em.id} style={{
                padding: '12px',
                background: 'rgba(255,255,255,0.06)',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.12)',
              }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#F2EDE4', fontFamily: "'Outfit', sans-serif", marginBottom: 4 }}>
                  {em.subject}
                </p>
                <p style={{ fontSize: 13, color: 'rgba(242,237,228,0.55)', fontFamily: "'Outfit', sans-serif", lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                  {em.body.substring(0, 200)}{em.body.length > 200 ? '...' : ''}
                </p>
                <p style={{ fontSize: 11, color: 'rgba(242,237,228,0.28)', fontFamily: "'Space Mono', monospace", marginTop: 8 }}>
                  {new Date(em.sent_at).toLocaleDateString('fr-FR', {
                    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                  })}
                </p>
              </div>
            ))}
            {emails.length === 0 && (
              <p className="text-center py-8" style={{ color: 'rgba(242,237,228,0.28)', fontFamily: "'Outfit', sans-serif", fontSize: 13 }}>
                <Mail size={24} className="mx-auto mb-2" style={{ opacity: 0.3 }} />
                Aucun email envoyé à ce prospect
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LeadDetail;
