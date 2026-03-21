import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { X, Check, Plus, Trash2, CheckCircle2, Circle, MessageSquare, FileUp, Milestone, MessagesSquare, Package } from 'lucide-react';
import PortalMessagesAdmin from '@/components/admin/PortalMessagesAdmin';
import { sendPortalNotification } from '@/lib/portalNotifications';

type Task = { id: string; project_id: string; title: string; description: string | null; status: string; position: number; due_date: string | null; completed_at: string | null };
type MilestoneT = { id: string; project_id: string; title: string; description: string | null; due_date: string | null; completed_at: string | null; position: number };
type Note = { id: string; content: string; created_at: string; author_id: string | null };
type FileT = { id: string; file_name: string; file_url: string; file_type: string | null; created_at: string };
type Deliverable = { id: string; project_id: string; milestone_id: string | null; title: string; description: string | null; status: string; file_urls: any; client_comment: string | null; reviewed_at: string | null; created_at: string };

const STATUS_COLS = [
  { key: 'brief', label: 'Brief', color: '#8B5CF6' },
  { key: 'maquette', label: 'Maquette', color: '#F59E0B' },
  { key: 'development', label: 'Développement', color: '#3B82F6' },
  { key: 'review', label: 'Review', color: '#F97316' },
  { key: 'delivered', label: 'Livré', color: '#10B981' },
  { key: 'maintenance', label: 'Maintenance', color: '#6B7280' },
];
const PRIORITY_COLORS: Record<string, string> = { urgent: '#ef4444', high: '#f97316', medium: '#3b82f6', low: '#9ca3af' };
const PRIORITY_LABELS: Record<string, string> = { urgent: 'Urgent', high: 'Haute', medium: 'Moyenne', low: 'Basse' };

const ProjectDetailModal = ({ projectId, onClose }: { projectId: string; onClose: () => void }) => {
  const [project, setProject] = useState<any>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [milestones, setMilestones] = useState<MilestoneT[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [files, setFiles] = useState<FileT[]>([]);
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [clientName, setClientName] = useState('');
  const [newTask, setNewTask] = useState('');
  const [newNote, setNewNote] = useState('');
  const [tab, setTab] = useState<'tasks' | 'milestones' | 'notes' | 'files' | 'clientmsgs' | 'deliverables'>('tasks');
  const [showNewDeliverable, setShowNewDeliverable] = useState(false);
  const [newDeliverable, setNewDeliverable] = useState({ title: '', description: '' });

  const fetchData = useCallback(async () => {
    const { data: p } = await supabase.from('projects' as any).select('*').eq('id', projectId).single();
    setProject(p);
    if (p) {
      const { data: c } = await supabase.from('clients' as any).select('business_name').eq('id', (p as any).client_id).single();
      setClientName((c as any)?.business_name || '');
    }
    const { data: t } = await supabase.from('project_tasks' as any).select('*').eq('project_id', projectId).order('position', { ascending: true });
    setTasks((t || []) as unknown as Task[]);
    const { data: m } = await supabase.from('project_milestones' as any).select('*').eq('project_id', projectId).order('position', { ascending: true });
    setMilestones((m || []) as unknown as MilestoneT[]);
    const { data: n } = await supabase.from('project_notes' as any).select('*').eq('project_id', projectId).order('created_at', { ascending: true });
    setNotes((n || []) as unknown as Note[]);
    const { data: f } = await supabase.from('project_files' as any).select('*').eq('project_id', projectId).order('created_at', { ascending: false });
    setFiles((f || []) as unknown as FileT[]);
    const { data: d } = await supabase.from('deliverable_reviews' as any).select('*').eq('project_id', projectId).order('created_at', { ascending: false });
    setDeliverables((d || []) as unknown as Deliverable[]);
  }, [projectId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const updateStatus = async (status: string) => {
    await supabase.from('projects' as any).update({ status } as any).eq('id', projectId);
    fetchData();
    toast.success('Statut mis à jour');

    // Send portal notification to client
    if (project?.client_id) {
      const statusLabel = STATUS_COLS.find(s => s.key === status)?.label || status;
      sendPortalNotification({
        clientId: project.client_id,
        type: 'project_update',
        title: `Projet mis à jour`,
        message: `Le statut de "${project.title}" est passé à "${statusLabel}"`,
        link: '/portal/project',
      });
    }
  };

  const toggleTask = async (task: Task) => {
    const newStatus = task.status === 'done' ? 'todo' : 'done';
    await supabase.from('project_tasks' as any).update({
      status: newStatus, completed_at: newStatus === 'done' ? new Date().toISOString() : null,
    } as any).eq('id', task.id);
    fetchData();
  };

  const addTask = async () => {
    if (!newTask.trim()) return;
    await supabase.from('project_tasks' as any).insert({ project_id: projectId, title: newTask, position: tasks.length } as any);
    setNewTask('');
    fetchData();
  };

  const deleteTask = async (id: string) => {
    await supabase.from('project_tasks' as any).delete().eq('id', id);
    fetchData();
  };

  const toggleMilestone = async (m: MilestoneT) => {
    await supabase.from('project_milestones' as any).update({
      completed_at: m.completed_at ? null : new Date().toISOString(),
    } as any).eq('id', m.id);
    fetchData();
  };

  const addNote = async () => {
    if (!newNote.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('project_notes' as any).insert({
      project_id: projectId, content: newNote, author_id: user?.id || null,
    } as any);
    setNewNote('');
    fetchData();
  };

  const submitDeliverable = async () => {
    if (!newDeliverable.title.trim()) { toast.error('Titre requis'); return; }
    await supabase.from('deliverable_reviews' as any).insert({
      project_id: projectId, title: newDeliverable.title, description: newDeliverable.description || null, status: 'pending',
    } as any);
    setNewDeliverable({ title: '', description: '' });
    setShowNewDeliverable(false);
    fetchData();
    toast.success('Livrable soumis au client');
  };

  if (!project) return null;

  const doneTasks = tasks.filter(t => t.status === 'done').length;
  const progress = tasks.length ? Math.round(doneTasks / tasks.length * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-t-3xl md:rounded-3xl" style={{ background: 'white' }} onClick={e => e.stopPropagation()}>
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h2 style={{ fontFamily: 'var(--font-h)', fontSize: 22, color: 'var(--charcoal)', margin: 0 }}>{project.title}</h2>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span style={{ fontFamily: 'var(--font-b)', fontSize: 13, color: 'var(--text-mid)' }}>{clientName}</span>
                <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 700, color: '#fff', background: PRIORITY_COLORS[project.priority] }}>{PRIORITY_LABELS[project.priority]}</span>
                {project.budget && <span style={{ fontFamily: 'var(--font-b)', fontSize: 12, color: 'var(--text-light)' }}>{project.budget} {project.currency}</span>}
              </div>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
          </div>

          {/* Status selector */}
          <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
            {STATUS_COLS.map(s => (
              <button key={s.key} onClick={() => updateStatus(s.key)} style={{
                padding: '5px 12px', borderRadius: 99, border: project.status === s.key ? `2px solid ${s.color}` : '1px solid var(--glass-border)',
                background: project.status === s.key ? `${s.color}15` : 'transparent',
                color: project.status === s.key ? s.color : 'var(--text-light)',
                fontFamily: 'var(--font-b)', fontSize: 11, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
              }}>{s.label}</button>
            ))}
          </div>

          {/* Progress */}
          <div className="mb-4">
            <div className="flex justify-between mb-1" style={{ fontFamily: 'var(--font-b)', fontSize: 12, color: 'var(--text-light)' }}>
              <span>{doneTasks}/{tasks.length} tâches terminées</span>
              <span>{progress}%</span>
            </div>
            <div style={{ height: 6, borderRadius: 3, background: 'rgba(0,0,0,0.06)', overflow: 'hidden' }}>
              <div style={{ width: `${progress}%`, height: '100%', background: 'var(--teal)', borderRadius: 3, transition: 'width 0.3s' }} />
            </div>
          </div>

          {/* Dates */}
          {(project.start_date || project.deadline) && (
            <div className="flex gap-4 mb-4" style={{ fontFamily: 'var(--font-b)', fontSize: 12, color: 'var(--text-light)' }}>
              {project.start_date && <span>📅 Début : {new Date(project.start_date).toLocaleDateString('fr-FR')}</span>}
              {project.deadline && <span>🏁 Deadline : {new Date(project.deadline).toLocaleDateString('fr-FR')}</span>}
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-1 mb-4 border-b overflow-x-auto" style={{ borderColor: 'var(--glass-border)' }}>
            {([
              { key: 'tasks' as const, label: 'Tâches', icon: Check, count: tasks.length },
              { key: 'milestones' as const, label: 'Jalons', icon: Milestone, count: milestones.length },
              { key: 'deliverables' as const, label: 'Livrables', icon: Package, count: deliverables.length },
              { key: 'notes' as const, label: 'Notes', icon: MessageSquare, count: notes.length },
              { key: 'files' as const, label: 'Fichiers', icon: FileUp, count: files.length },
              { key: 'clientmsgs' as const, label: 'Client', icon: MessagesSquare, count: 0 },
            ]).map(t => (
              <button key={t.key} onClick={() => setTab(t.key)} style={{
                display: 'flex', alignItems: 'center', gap: 4, padding: '8px 14px', border: 'none',
                borderBottom: tab === t.key ? '2px solid var(--teal)' : '2px solid transparent',
                background: 'none', color: tab === t.key ? 'var(--teal)' : 'var(--text-light)',
                fontFamily: 'var(--font-b)', fontSize: 12, fontWeight: tab === t.key ? 600 : 400, cursor: 'pointer', whiteSpace: 'nowrap',
              }}>
                <t.icon size={14} /> {t.label} ({t.count})
              </button>
            ))}
          </div>

          {/* Tab content */}
          {tab === 'tasks' && (
            <div>
              {tasks.map(t => (
                <div key={t.id} className="flex items-center gap-2 py-2" style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                  <button onClick={() => toggleTask(t)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.status === 'done' ? 'var(--teal)' : 'var(--text-light)' }}>
                    {t.status === 'done' ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                  </button>
                  <span style={{
                    flex: 1, fontFamily: 'var(--font-b)', fontSize: 13,
                    color: t.status === 'done' ? 'var(--text-light)' : 'var(--charcoal)',
                    textDecoration: t.status === 'done' ? 'line-through' : 'none',
                  }}>{t.title}</span>
                  <button onClick={() => deleteTask(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)', opacity: 0.5 }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              <div className="flex gap-2 mt-3">
                <input value={newTask} onChange={e => setNewTask(e.target.value)} placeholder="Ajouter une tâche..." onKeyDown={e => e.key === 'Enter' && addTask()}
                  style={{ flex: 1, padding: '8px 12px', borderRadius: 10, border: '1px solid var(--glass-border)', fontFamily: 'var(--font-b)', fontSize: 13, outline: 'none' }} />
                <button onClick={addTask} style={{ padding: '8px 14px', background: 'var(--teal)', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer' }}>
                  <Plus size={16} />
                </button>
              </div>
            </div>
          )}

          {tab === 'milestones' && (
            <div className="space-y-3">
              {milestones.map((m, i) => (
                <div key={m.id} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <button onClick={() => toggleMilestone(m)} style={{
                      width: 24, height: 24, borderRadius: '50%',
                      background: m.completed_at ? 'var(--teal)' : 'transparent',
                      border: `2px solid ${m.completed_at ? 'var(--teal)' : 'var(--glass-border)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                    }}>
                      {m.completed_at && <Check size={12} color="#fff" />}
                    </button>
                    {i < milestones.length - 1 && <div style={{ width: 2, height: 30, background: 'var(--glass-border)' }} />}
                  </div>
                  <div>
                    <div style={{
                      fontFamily: 'var(--font-b)', fontSize: 13, fontWeight: 600,
                      color: m.completed_at ? 'var(--teal)' : 'var(--charcoal)',
                    }}>{m.title}</div>
                    {m.due_date && <div style={{ fontFamily: 'var(--font-b)', fontSize: 11, color: 'var(--text-light)' }}>{new Date(m.due_date).toLocaleDateString('fr-FR')}</div>}
                  </div>
                </div>
              ))}
              {!milestones.length && <div style={{ fontFamily: 'var(--font-b)', fontSize: 13, color: 'var(--text-light)', textAlign: 'center', padding: 20 }}>Aucun jalon défini.</div>}
            </div>
          )}

          {tab === 'notes' && (
            <div>
              <div className="space-y-3 mb-4" style={{ maxHeight: 300, overflowY: 'auto' }}>
                {notes.map(n => (
                  <div key={n.id} style={{ padding: 12, borderRadius: 12, background: 'rgba(0,0,0,0.02)' }}>
                    <p style={{ fontFamily: 'var(--font-b)', fontSize: 13, color: 'var(--charcoal)', margin: 0, whiteSpace: 'pre-wrap' }}>{n.content}</p>
                    <span style={{ fontFamily: 'var(--font-b)', fontSize: 10, color: 'var(--text-light)', marginTop: 4, display: 'block' }}>{new Date(n.created_at).toLocaleString('fr-FR')}</span>
                  </div>
                ))}
                {!notes.length && <div style={{ fontFamily: 'var(--font-b)', fontSize: 13, color: 'var(--text-light)', textAlign: 'center', padding: 20 }}>Aucune note.</div>}
              </div>
              <div className="flex gap-2">
                <input value={newNote} onChange={e => setNewNote(e.target.value)} placeholder="Écrire une note..." onKeyDown={e => e.key === 'Enter' && addNote()}
                  style={{ flex: 1, padding: '8px 12px', borderRadius: 10, border: '1px solid var(--glass-border)', fontFamily: 'var(--font-b)', fontSize: 13, outline: 'none' }} />
                <button onClick={addNote} style={{ padding: '8px 14px', background: 'var(--teal)', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer' }}>
                  <MessageSquare size={16} />
                </button>
              </div>
            </div>
          )}

          {tab === 'files' && (
            <div>
              {files.length ? (
                <div className="grid grid-cols-2 gap-3">
                  {files.map(f => (
                    <a key={f.id} href={f.file_url} target="_blank" rel="noreferrer" style={{
                      padding: 12, borderRadius: 12, border: '1px solid var(--glass-border)', display: 'block', textDecoration: 'none',
                    }}>
                      <div style={{ fontFamily: 'var(--font-b)', fontSize: 12, fontWeight: 600, color: 'var(--charcoal)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.file_name}</div>
                      <div style={{ fontFamily: 'var(--font-b)', fontSize: 10, color: 'var(--text-light)', marginTop: 2 }}>{f.file_type || 'fichier'}</div>
                    </a>
                  ))}
                </div>
              ) : (
                <div style={{ fontFamily: 'var(--font-b)', fontSize: 13, color: 'var(--text-light)', textAlign: 'center', padding: 20 }}>Aucun fichier.</div>
              )}
            </div>
          )}

          {tab === 'clientmsgs' && (
            <PortalMessagesAdmin projectId={projectId} clientId={project?.client_id} />
          )}

          {tab === 'deliverables' && (
            <div>
              <button onClick={() => setShowNewDeliverable(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'var(--teal)', color: '#fff', border: 'none', borderRadius: 10, fontFamily: 'var(--font-b)', fontSize: 13, fontWeight: 600, cursor: 'pointer', marginBottom: 12 }}>
                <Plus size={14} /> Soumettre un livrable
              </button>

              {showNewDeliverable && (
                <div style={{ padding: 16, borderRadius: 12, border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.02)', marginBottom: 12 }}>
                  <div className="space-y-3">
                    <div>
                      <label style={{ fontFamily: 'var(--font-b)', fontSize: 11, color: 'var(--text-light)' }}>Titre *</label>
                      <input value={newDeliverable.title} onChange={e => setNewDeliverable(d => ({ ...d, title: e.target.value }))} placeholder="Ex: Maquette page d'accueil" style={{ width: '100%', padding: '8px 12px', borderRadius: 10, border: '1px solid var(--glass-border)', fontFamily: 'var(--font-b)', fontSize: 13, outline: 'none' }} />
                    </div>
                    <div>
                      <label style={{ fontFamily: 'var(--font-b)', fontSize: 11, color: 'var(--text-light)' }}>Description</label>
                      <textarea value={newDeliverable.description} onChange={e => setNewDeliverable(d => ({ ...d, description: e.target.value }))} rows={2} placeholder="Détails pour le client..." style={{ width: '100%', padding: '8px 12px', borderRadius: 10, border: '1px solid var(--glass-border)', fontFamily: 'var(--font-b)', fontSize: 13, outline: 'none', resize: 'vertical' }} />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={submitDeliverable} style={{ padding: '8px 16px', background: 'var(--teal)', color: '#fff', border: 'none', borderRadius: 10, fontFamily: 'var(--font-b)', fontSize: 13, cursor: 'pointer' }}>Soumettre</button>
                      <button onClick={() => setShowNewDeliverable(false)} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--glass-border)', borderRadius: 10, fontFamily: 'var(--font-b)', fontSize: 13, cursor: 'pointer' }}>Annuler</button>
                    </div>
                  </div>
                </div>
              )}

              {deliverables.length === 0 && !showNewDeliverable && (
                <div style={{ fontFamily: 'var(--font-b)', fontSize: 13, color: 'var(--text-light)', textAlign: 'center', padding: 20 }}>Aucun livrable soumis.</div>
              )}

              <div className="space-y-3">
                {deliverables.map(d => {
                  const statusConfig: Record<string, { color: string; label: string }> = {
                    pending: { color: '#F59E0B', label: '⏳ En attente' },
                    approved: { color: '#10B981', label: '✅ Approuvé' },
                    revision_requested: { color: '#EF4444', label: '✏️ Révision demandée' },
                  };
                  const s = statusConfig[d.status] || statusConfig.pending;
                  return (
                    <div key={d.id} style={{ padding: 12, borderRadius: 12, border: `1px solid ${s.color}30`, background: `${s.color}08` }}>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div style={{ fontFamily: 'var(--font-b)', fontSize: 14, fontWeight: 600, color: 'var(--charcoal)' }}>{d.title}</div>
                          {d.description && <div style={{ fontFamily: 'var(--font-b)', fontSize: 12, color: 'var(--text-mid)', marginTop: 2 }}>{d.description}</div>}
                        </div>
                        <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-b)', color: s.color, background: `${s.color}15`, whiteSpace: 'nowrap' }}>{s.label}</span>
                      </div>
                      {d.client_comment && (
                        <div style={{ marginTop: 8, padding: 8, borderRadius: 8, background: 'rgba(0,0,0,0.04)' }}>
                          <div style={{ fontFamily: 'var(--font-b)', fontSize: 11, color: 'var(--text-light)', marginBottom: 2 }}>💬 Commentaire client :</div>
                          <div style={{ fontFamily: 'var(--font-b)', fontSize: 12, color: 'var(--charcoal)' }}>{d.client_comment}</div>
                        </div>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <span style={{ fontFamily: 'var(--font-b)', fontSize: 10, color: 'var(--text-light)' }}>{new Date(d.created_at).toLocaleDateString('fr-FR')}</span>
                        <button onClick={async () => { await supabase.from('deliverable_reviews' as any).delete().eq('id', d.id); fetchData(); toast.success('Livrable supprimé'); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)', opacity: 0.5 }}><Trash2 size={13} /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectDetailModal;