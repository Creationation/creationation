import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { X, Check, Plus, Trash2, CheckCircle2, Circle, GripVertical, MessageSquare, FileUp, Milestone } from 'lucide-react';

type Task = { id: string; project_id: string; title: string; description: string | null; status: string; position: number; due_date: string | null; completed_at: string | null };
type MilestoneT = { id: string; project_id: string; title: string; description: string | null; due_date: string | null; completed_at: string | null; position: number };
type Note = { id: string; content: string; created_at: string; author_id: string | null };
type FileT = { id: string; file_name: string; file_url: string; file_type: string | null; created_at: string };

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
  const [clientName, setClientName] = useState('');
  const [newTask, setNewTask] = useState('');
  const [newNote, setNewNote] = useState('');
  const [tab, setTab] = useState<'tasks' | 'milestones' | 'notes' | 'files'>('tasks');

  const fetch = useCallback(async () => {
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
    setFiles((f || []) as FileT[]);
  }, [projectId]);

  useEffect(() => { fetch(); }, [fetch]);

  const updateStatus = async (status: string) => {
    await supabase.from('projects' as any).update({ status } as any).eq('id', projectId);
    fetch();
    toast.success('Statut mis à jour');
  };

  const toggleTask = async (task: Task) => {
    const newStatus = task.status === 'done' ? 'todo' : 'done';
    await supabase.from('project_tasks' as any).update({
      status: newStatus,
      completed_at: newStatus === 'done' ? new Date().toISOString() : null,
    } as any).eq('id', task.id);
    fetch();
  };

  const addTask = async () => {
    if (!newTask.trim()) return;
    await supabase.from('project_tasks' as any).insert({ project_id: projectId, title: newTask, position: tasks.length } as any);
    setNewTask('');
    fetch();
  };

  const deleteTask = async (id: string) => {
    await supabase.from('project_tasks' as any).delete().eq('id', id);
    fetch();
  };

  const toggleMilestone = async (m: MilestoneT) => {
    await supabase.from('project_milestones' as any).update({
      completed_at: m.completed_at ? null : new Date().toISOString(),
    } as any).eq('id', m.id);
    fetch();
  };

  const addNote = async () => {
    if (!newNote.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('project_notes' as any).insert({
      project_id: projectId, content: newNote, author_id: user?.id || null,
    } as any);
    setNewNote('');
    fetch();
  };

  if (!project) return null;

  const doneTasks = tasks.filter(t => t.status === 'done').length;
  const progress = tasks.length ? Math.round(doneTasks / tasks.length * 100) : 0;
  const col = STATUS_COLS.find(c => c.key === project.status);

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-t-3xl md:rounded-3xl"
        style={{ background: 'white' }}
        onClick={e => e.stopPropagation()}
      >
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
          <div className="flex gap-1 mb-4 border-b" style={{ borderColor: 'var(--glass-border)' }}>
            {([
              { key: 'tasks', label: 'Tâches', icon: Check, count: tasks.length },
              { key: 'milestones', label: 'Jalons', icon: Milestone, count: milestones.length },
              { key: 'notes', label: 'Notes', icon: MessageSquare, count: notes.length },
              { key: 'files', label: 'Fichiers', icon: FileUp, count: files.length },
            ] as const).map(t => (
              <button key={t.key} onClick={() => setTab(t.key)} style={{
                display: 'flex', alignItems: 'center', gap: 4, padding: '8px 14px', border: 'none',
                borderBottom: tab === t.key ? '2px solid var(--teal)' : '2px solid transparent',
                background: 'none', color: tab === t.key ? 'var(--teal)' : 'var(--text-light)',
                fontFamily: 'var(--font-b)', fontSize: 12, fontWeight: tab === t.key ? 600 : 400, cursor: 'pointer',
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
        </div>
      </div>
    </div>
  );
};

export default ProjectDetailModal;
