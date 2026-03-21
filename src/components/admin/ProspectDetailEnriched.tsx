import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { X, ArrowRightLeft, Mail, Eye, MousePointerClick, Reply, AlertTriangle, Ban, Target, Plus, Loader2, Send, FileText } from 'lucide-react';
import { toast } from 'sonner';

type ProspectStatus = 'new' | 'emailed' | 'replied' | 'converted' | 'rejected';
type Prospect = {
  id: string; business_name: string; contact_name: string | null; email: string | null;
  phone: string | null; business_type: string | null; city: string | null; country: string | null;
  address: string | null; has_website: boolean; website_url: string | null; notes: string | null;
  source: string | null; status: ProspectStatus; email_count: number; last_emailed_at: string | null;
  created_at: string; language: string | null; score?: number; score_breakdown?: any;
  sector?: string | null; competitor_site_url?: string | null; competitor_audit?: any;
  sequence_id?: string | null; sequence_step?: number; sequence_paused?: boolean; tags?: string[];
};

const SC: Record<ProspectStatus, string> = { new: '#0d8a6f', emailed: '#4da6d9', replied: '#d4a55a', converted: '#7c5cbf', rejected: '#e8735a' };
const SL: Record<ProspectStatus, string> = { new: 'Nouveau', emailed: 'Emailé', replied: 'A répondu', converted: 'Converti', rejected: 'Rejeté' };

const TRACKING_ICONS: Record<string, { icon: typeof Mail; color: string; label: string }> = {
  sent: { icon: Mail, color: '#4da6d9', label: 'Envoyé' },
  opened: { icon: Eye, color: '#0d8a6f', label: 'Ouvert' },
  clicked: { icon: MousePointerClick, color: '#7c5cbf', label: 'Cliqué' },
  replied: { icon: Reply, color: '#d4a55a', label: 'Répondu' },
  bounced: { icon: AlertTriangle, color: '#e8735a', label: 'Rebond' },
  unsubscribed: { icon: Ban, color: '#e8735a', label: 'Désinscrit' },
};

type TrackingEvent = { id: string; event_type: string; created_at: string; event_data: any };
type ProspectEmail = { id: string; subject: string; body: string; sent_at: string };

interface Props {
  prospect: Prospect;
  onClose: () => void;
  onTransfer: () => void;
  onRefresh?: () => void;
}

const ProspectDetailEnriched = ({ prospect, onClose, onTransfer, onRefresh }: Props) => {
  const [tab, setTab] = useState<'info' | 'score' | 'audit' | 'tracking' | 'notes'>('info');
  const [tracking, setTracking] = useState<TrackingEvent[]>([]);
  const [loadingTracking, setLoadingTracking] = useState(false);
  const [emails, setEmails] = useState<ProspectEmail[]>([]);
  const [rescoring, setRescoring] = useState(false);
  // Inline editing
  const [editSector, setEditSector] = useState(prospect.sector || '');
  const [editTags, setEditTags] = useState((prospect.tags || []).join(', '));
  const [savingField, setSavingField] = useState(false);
  // Notes
  const [noteText, setNoteText] = useState('');
  const [notes, setNotes] = useState(prospect.notes || '');
  // Audit URL
  const [auditUrl, setAuditUrl] = useState(prospect.competitor_site_url || '');
  const [auditing, setAuditing] = useState(false);

  const fetchTracking = useCallback(async () => {
    setLoadingTracking(true);
    const { data } = await supabase
      .from('email_tracking')
      .select('id, event_type, created_at, event_data')
      .eq('prospect_id', prospect.id)
      .order('created_at', { ascending: false });
    setTracking((data as TrackingEvent[]) || []);
    // Also fetch emails
    const { data: emailData } = await supabase
      .from('prospect_emails')
      .select('id, subject, body, sent_at')
      .eq('prospect_id', prospect.id)
      .order('sent_at', { ascending: false });
    setEmails((emailData as ProspectEmail[]) || []);
    setLoadingTracking(false);
  }, [prospect.id]);

  useEffect(() => {
    if (tab === 'tracking') fetchTracking();
  }, [tab, fetchTracking]);

  const audit = prospect.competitor_audit as any;
  const scoreBreakdown = prospect.score_breakdown as any;
  const hasScore = (prospect.score || 0) > 0;
  const hasAudit = !!audit;

  const handleRescore = async () => {
    setRescoring(true);
    try {
      const { error } = await supabase.functions.invoke('score-prospect', {
        body: { prospect_ids: [prospect.id] }
      });
      if (error) throw error;
      toast.success('Score mis à jour');
      onRefresh?.();
    } catch { toast.error('Erreur scoring'); }
    finally { setRescoring(false); }
  };

  const handleSaveSector = async () => {
    setSavingField(true);
    const tagsArr = editTags.split(',').map(t => t.trim()).filter(Boolean);
    await supabase.from('prospects').update({ sector: editSector || null, tags: tagsArr.length ? tagsArr : null } as any).eq('id', prospect.id);
    toast.success('Secteur / tags mis à jour');
    setSavingField(false);
    onRefresh?.();
  };

  const handleSaveNotes = async () => {
    const fullNotes = notes ? `${notes}\n\n---\n${new Date().toLocaleDateString('fr-FR')} : ${noteText}` : noteText;
    await supabase.from('prospects').update({ notes: fullNotes } as any).eq('id', prospect.id);
    setNotes(fullNotes);
    setNoteText('');
    toast.success('Note ajoutée');
  };

  const handleLaunchAudit = async () => {
    if (!auditUrl) return;
    setAuditing(true);
    try {
      await supabase.from('prospects').update({ competitor_site_url: auditUrl } as any).eq('id', prospect.id);
      const { error } = await supabase.functions.invoke('audit-competitor-site', {
        body: { prospect_id: prospect.id, url: auditUrl }
      });
      if (error) throw error;
      toast.success('Audit lancé');
      onRefresh?.();
    } catch { toast.error('Erreur audit'); }
    finally { setAuditing(false); }
  };

  const tabBtn = (key: string, label: string, active: boolean) => (
    <button
      key={key}
      onClick={() => setTab(key as any)}
      style={{
        padding: '6px 14px', borderRadius: 100, border: 'none',
        fontFamily: 'var(--font-b)', fontSize: 11, fontWeight: 600, cursor: 'pointer',
        background: active ? 'var(--teal)' : 'var(--glass-bg)',
        color: active ? '#fff' : 'var(--text-mid)',
      }}
    >{label}</button>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 540, background: 'white', borderRadius: 28, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        {/* Header */}
        <div style={{ padding: '24px 24px 16px', borderBottom: '1px solid var(--glass-border)' }}>
          <div className="flex items-center justify-between mb-2">
            <h2 style={{ fontFamily: 'var(--font-h)', fontSize: 20, color: 'var(--charcoal)', margin: 0 }}>{prospect.business_name}</h2>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)', padding: 4 }}><X size={20} /></button>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span style={{ padding: '3px 10px', borderRadius: 100, background: SC[prospect.status] + '18', color: SC[prospect.status], fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-b)' }}>{SL[prospect.status]}</span>
            {prospect.business_type && <span style={{ padding: '3px 10px', borderRadius: 100, background: 'var(--glass-bg)', color: 'var(--text-mid)', fontSize: 12, fontFamily: 'var(--font-b)' }}>{prospect.business_type}</span>}
            {hasScore && <span style={{ padding: '3px 10px', borderRadius: 100, background: 'rgba(13,138,111,0.1)', color: 'var(--teal)', fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-b)' }}>Score: {prospect.score}/100</span>}
            {prospect.sequence_id && <span style={{ padding: '3px 10px', borderRadius: 100, background: 'rgba(59,130,246,0.1)', color: '#3B82F6', fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-b)' }}>Étape {(prospect.sequence_step || 0) + 1}</span>}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 flex-wrap" style={{ padding: '12px 24px 0' }}>
          {tabBtn('info', 'Profil', tab === 'info')}
          {tabBtn('score', 'Score', tab === 'score')}
          {tabBtn('audit', 'Audit', tab === 'audit')}
          {tabBtn('tracking', 'Emails', tab === 'tracking')}
          {tabBtn('notes', 'Notes', tab === 'notes')}
        </div>

        {/* Content */}
        <div style={{ padding: '16px 24px' }}>
          {tab === 'info' && (
            <div>
              {[
                { label: 'Contact', value: prospect.contact_name, icon: '👤' },
                { label: 'Email', value: prospect.email, icon: '📧' },
                { label: 'Téléphone', value: prospect.phone, icon: '📞' },
                { label: 'Ville', value: [prospect.city, prospect.country].filter(Boolean).join(', '), icon: '📍' },
                { label: 'Site web', value: prospect.website_url, icon: '🌐', isLink: true },
                { label: 'Emails envoyés', value: String(prospect.email_count || 0), icon: '📤' },
                { label: 'Dernier email', value: prospect.last_emailed_at ? new Date(prospect.last_emailed_at).toLocaleDateString('fr-FR') : null, icon: '📅' },
                { label: 'Créé le', value: prospect.created_at ? new Date(prospect.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) : null, icon: '🕐' },
              ].filter(r => r.value).map(r => (
                <div key={r.label} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                  <span style={{ fontSize: 14, width: 24, textAlign: 'center', flexShrink: 0 }}>{r.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'var(--font-b)', fontSize: 11, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>{r.label}</div>
                    <div style={{ fontFamily: 'var(--font-b)', fontSize: 14, color: 'var(--charcoal)', wordBreak: 'break-word' }}>
                      {r.isLink && r.value ? <a href={r.value} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--teal)', textDecoration: 'underline' }}>{r.value}</a> : r.value}
                    </div>
                  </div>
                </div>
              ))}
              {/* Inline sector & tags editing */}
              <div style={{ marginTop: 16, padding: 12, background: 'var(--glass-bg)', borderRadius: 16 }}>
                <div style={{ fontFamily: 'var(--font-b)', fontSize: 11, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Secteur & Tags</div>
                <div className='flex flex-col gap-2'>
                  <input value={editSector} onChange={e => setEditSector(e.target.value)} placeholder='Secteur (ex: restaurant)' style={{ padding: '8px 12px', border: '1px solid var(--glass-border)', borderRadius: 10, fontFamily: 'var(--font-b)', fontSize: 13, outline: 'none' }} />
                  <input value={editTags} onChange={e => setEditTags(e.target.value)} placeholder='Tags (séparés par virgule)' style={{ padding: '8px 12px', border: '1px solid var(--glass-border)', borderRadius: 10, fontFamily: 'var(--font-b)', fontSize: 13, outline: 'none' }} />
                  <button onClick={handleSaveSector} disabled={savingField} style={{ padding: '6px 12px', background: 'var(--teal)', color: '#fff', border: 'none', borderRadius: 100, fontFamily: 'var(--font-b)', fontSize: 12, fontWeight: 600, cursor: 'pointer', alignSelf: 'flex-start' }}>
                    {savingField ? 'Enregistrement...' : 'Enregistrer'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {tab === 'score' && (
            <div className="flex flex-col gap-3">
              <div style={{ textAlign: 'center', marginBottom: 8 }}>
                <div style={{ fontFamily: 'var(--font-h)', fontSize: 48, color: 'var(--teal)' }}>{prospect.score || 0}</div>
                <div style={{ fontFamily: 'var(--font-b)', fontSize: 12, color: 'var(--text-light)' }}>Score global / 100</div>
              </div>
              {hasScore && scoreBreakdown && Object.entries(scoreBreakdown).map(([key, value]) => {
                const numVal = typeof value === 'number' ? value : 0;
                return (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', background: 'var(--glass-bg)', borderRadius: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: 'var(--font-b)', fontSize: 13, color: 'var(--charcoal)', textTransform: 'capitalize' }}>{key.replace(/_/g, ' ')}</div>
                    </div>
                    <div style={{ width: 80, height: 6, background: 'var(--glass-border)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${Math.min(100, numVal)}%`, height: '100%', background: numVal >= 70 ? 'var(--teal)' : numVal >= 40 ? '#d4a55a' : '#e8735a', borderRadius: 3 }} />
                    </div>
                    <span style={{ fontFamily: 'var(--font-b)', fontSize: 13, fontWeight: 600, color: 'var(--charcoal)', width: 30, textAlign: 'right' }}>{numVal}</span>
                  </div>
                );
              })}
              <button onClick={handleRescore} disabled={rescoring} style={{ marginTop: 8, padding: '10px 18px', background: '#3B82F6', color: '#fff', border: 'none', borderRadius: 100, fontFamily: 'var(--font-b)', fontSize: 13, fontWeight: 600, cursor: rescoring ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6, alignSelf: 'center', opacity: rescoring ? 0.7 : 1 }}>
                {rescoring ? <Loader2 size={14} className='animate-spin' /> : <Target size={14} />} Rescorer
              </button>
            </div>
          )}

          {tab === 'audit' && (
            <div className="flex flex-col gap-4">
              {hasAudit ? (
                <>
                  <div style={{ textAlign: 'center', padding: 16, background: 'var(--glass-bg)', borderRadius: 16 }}>
                    <div style={{ fontFamily: 'var(--font-h)', fontSize: 40, color: (audit.score || 0) >= 60 ? '#d4a55a' : '#e8735a' }}>{audit.score || '?'}/100</div>
                    <div style={{ fontFamily: 'var(--font-b)', fontSize: 12, color: 'var(--text-light)' }}>Score du site concurrent</div>
                  </div>
                  {['design_score', 'mobile_score', 'performance_score', 'seo_score', 'content_score'].map(key => {
                    const val = audit[key] || 0;
                    const label = key.replace('_score', '').replace(/_/g, ' ');
                    return (
                      <div key={key} className="flex items-center gap-3" style={{ padding: '6px 0' }}>
                        <span style={{ fontFamily: 'var(--font-b)', fontSize: 13, color: 'var(--charcoal)', flex: 1, textTransform: 'capitalize' }}>{label}</span>
                        <div style={{ width: 80, height: 6, background: 'var(--glass-border)', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ width: `${(val / 20) * 100}%`, height: '100%', background: val >= 14 ? 'var(--teal)' : val >= 10 ? '#d4a55a' : '#e8735a', borderRadius: 3 }} />
                        </div>
                        <span style={{ fontFamily: 'var(--font-b)', fontSize: 13, fontWeight: 600, width: 36, textAlign: 'right' }}>{val}/20</span>
                      </div>
                    );
                  })}
                  {audit.weaknesses?.length > 0 && (
                    <div>
                      <h4 style={{ fontFamily: 'var(--font-b)', fontSize: 12, color: '#e8735a', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>⚠️ Points faibles</h4>
                      {audit.weaknesses.map((w: string, i: number) => (
                        <div key={i} style={{ padding: '6px 12px', background: 'rgba(232,115,90,0.06)', borderRadius: 10, fontFamily: 'var(--font-b)', fontSize: 13, color: 'var(--text-mid)', marginBottom: 4 }}>• {w}</div>
                      ))}
                    </div>
                  )}
                  {audit.pitch_arguments?.length > 0 && (
                    <div>
                      <h4 style={{ fontFamily: 'var(--font-b)', fontSize: 12, color: 'var(--teal)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>💡 Arguments de vente</h4>
                      {audit.pitch_arguments.map((a: string, i: number) => (
                        <div key={i} onClick={() => { navigator.clipboard.writeText(a); toast.success('Copié !'); }} style={{ padding: '6px 12px', background: 'rgba(13,138,111,0.06)', borderRadius: 10, fontFamily: 'var(--font-b)', fontSize: 13, color: 'var(--text-mid)', marginBottom: 4, cursor: 'pointer' }} title='Cliquer pour copier'>✓ {a}</div>
                      ))}
                    </div>
                  )}
                  {audit.summary && (
                    <div style={{ padding: 12, background: 'var(--glass-bg)', borderRadius: 12, fontFamily: 'var(--font-b)', fontSize: 13, color: 'var(--text-mid)', fontStyle: 'italic' }}>
                      {audit.summary}
                    </div>
                  )}
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: 24 }}>
                  <FileText size={32} style={{ color: 'var(--text-ghost)', margin: '0 auto 12px' }} />
                  <p style={{ fontFamily: 'var(--font-b)', fontSize: 13, color: 'var(--text-light)', marginBottom: 16 }}>Aucun audit. Entrez l'URL du site concurrent pour lancer l'audit.</p>
                  <input value={auditUrl} onChange={e => setAuditUrl(e.target.value)} placeholder='https://concurrent.com' style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--glass-border)', borderRadius: 12, fontFamily: 'var(--font-b)', fontSize: 13, outline: 'none', marginBottom: 10, boxSizing: 'border-box' }} />
                  <button onClick={handleLaunchAudit} disabled={auditing || !auditUrl} style={{ padding: '10px 20px', background: 'var(--teal)', color: '#fff', border: 'none', borderRadius: 100, fontFamily: 'var(--font-b)', fontSize: 13, fontWeight: 600, cursor: auditing ? 'not-allowed' : 'pointer', opacity: auditing ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: 6, margin: '0 auto' }}>
                    {auditing ? <Loader2 size={14} className='animate-spin' /> : <Target size={14} />} Lancer l'audit
                  </button>
                </div>
              )}
            </div>
          )}

          {tab === 'tracking' && (
            <div className="flex flex-col gap-3">
              {loadingTracking ? (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-light)', fontFamily: 'var(--font-b)' }}>Chargement...</div>
              ) : (
                <>
                  {/* Email history */}
                  {emails.length > 0 && (
                    <div>
                      <h4 style={{ fontFamily: 'var(--font-b)', fontSize: 12, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>📧 Emails envoyés</h4>
                      {emails.map(em => (
                        <div key={em.id} style={{ padding: '10px 12px', background: 'var(--glass-bg)', borderRadius: 12, marginBottom: 6 }}>
                          <div style={{ fontFamily: 'var(--font-b)', fontSize: 13, fontWeight: 600, color: 'var(--charcoal)' }}>{em.subject}</div>
                          <div style={{ fontFamily: 'var(--font-b)', fontSize: 11, color: 'var(--text-light)' }}>
                            {new Date(em.sent_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Tracking events */}
                  <h4 style={{ fontFamily: 'var(--font-b)', fontSize: 12, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>📊 Événements de tracking</h4>
                  {tracking.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-light)', fontFamily: 'var(--font-b)', fontSize: 13 }}>
                      <Mail size={24} style={{ opacity: 0.3, margin: '0 auto 8px' }} />
                      Aucun événement
                    </div>
                  ) : (
                    tracking.map(ev => {
                      const cfg = TRACKING_ICONS[ev.event_type] || { icon: Mail, color: 'var(--text-light)', label: ev.event_type };
                      const Icon = cfg.icon;
                      return (
                        <div key={ev.id} className="flex items-center gap-3" style={{ padding: '10px 12px', background: 'var(--glass-bg)', borderRadius: 12 }}>
                          <div style={{ width: 32, height: 32, borderRadius: '50%', background: cfg.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Icon size={14} style={{ color: cfg.color }} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontFamily: 'var(--font-b)', fontSize: 13, fontWeight: 600, color: 'var(--charcoal)' }}>{cfg.label}</div>
                            <div style={{ fontFamily: 'var(--font-b)', fontSize: 11, color: 'var(--text-light)' }}>
                              {new Date(ev.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </>
              )}
            </div>
          )}

          {tab === 'notes' && (
            <div className="flex flex-col gap-3">
              <div>
                <textarea value={noteText} onChange={e => setNoteText(e.target.value)} placeholder='Ajouter une note...' rows={3} style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--glass-border)', borderRadius: 12, fontFamily: 'var(--font-b)', fontSize: 13, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
                <button onClick={handleSaveNotes} disabled={!noteText.trim()} style={{ marginTop: 6, padding: '8px 16px', background: 'var(--teal)', color: '#fff', border: 'none', borderRadius: 100, fontFamily: 'var(--font-b)', fontSize: 12, fontWeight: 600, cursor: noteText.trim() ? 'pointer' : 'not-allowed', opacity: noteText.trim() ? 1 : 0.5, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Plus size={12} /> Ajouter
                </button>
              </div>
              {notes ? (
                <div style={{ padding: 12, background: 'var(--glass-bg)', borderRadius: 16, fontFamily: 'var(--font-b)', fontSize: 13, color: 'var(--text-mid)', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                  {notes}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-light)', fontFamily: 'var(--font-b)', fontSize: 13 }}>
                  Aucune note pour ce prospect.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ padding: '16px 24px 24px', display: 'flex', gap: 8 }}>
          <button onClick={onTransfer} style={{ padding: '10px 18px', background: 'var(--violet)', color: '#fff', border: 'none', borderRadius: 100, fontFamily: 'var(--font-b)', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <ArrowRightLeft size={14} /> Transférer vers Clients
          </button>
          <button onClick={onClose} style={{ padding: '10px 18px', background: 'var(--glass-bg)', color: 'var(--text-mid)', border: '1px solid var(--glass-border)', borderRadius: 100, fontFamily: 'var(--font-b)', fontSize: 13, cursor: 'pointer' }}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProspectDetailEnriched;
