import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { X, Check, Plus, Trash2, CheckCircle2, Circle, MessageSquare, FileUp, Milestone, MessagesSquare, Package, Calendar, Upload, GripVertical, Clock, FileText } from 'lucide-react';
import PortalMessagesAdmin from '@/components/admin/PortalMessagesAdmin';
import { sendPortalNotification } from '@/lib/portalNotifications';
import { useNavigate } from 'react-router-dom';

type Task = { id: string; project_id: string; title: string; description: string | null; status: string; position: number; due_date: string | null; completed_at: string | null; assigned_to: string | null };
type MilestoneT = { id: string; project_id: string; title: string; description: string | null; due_date: string | null; completed_at: string | null; position: number };
type Note = { id: string; content: string; created_at: string; author_id: string | null };
type FileT = { id: string; file_name: string; file_url: string; file_type: string | null; created_at: string };
type Deliverable = { id: string; project_id: string; milestone_id: string | null; title: string; description: string | null; status: string; file_urls: any; client_comment: string | null; reviewed_at: string | null; created_at: string };
type InvoiceRow = { id: string; invoice_number: string; status: string; total: number; amount_paid: number; issue_date: string; due_date: string };

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
  const navigate = useNavigate();
  const [project, setProject] = useState<any>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [milestones, setMilestones] = useState<MilestoneT[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [files, setFiles] = useState<FileT[]>([]);
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [projectInvoices, setProjectInvoices] = useState<InvoiceRow[]>([]);
  const [clientName, setClientName] = useState('');
  const [newTask, setNewTask] = useState('');
  const [newTaskDue, setNewTaskDue] = useState('');
  const [newNote, setNewNote] = useState('');
  const [tab, setTab] = useState<'tasks' | 'milestones' | 'notes' | 'files' | 'clientmsgs' | 'deliverables' | 'activity' | 'invoices'>('tasks');
  const [activityLog, setActivityLog] = useState<any[]>([]);
  const [showNewDeliverable, setShowNewDeliverable] = useState(false);
  const [newDeliverable, setNewDeliverable] = useState({ title: '', description: '' });
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

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
    const { data: invData } = await supabase.from('invoices').select('id,invoice_number,status,total,amount_paid,issue_date,due_date').eq('project_id', projectId).order('issue_date', { ascending: false });
    setProjectInvoices((invData || []) as InvoiceRow[]);

    // Build activity log from all data
    const log: any[] = [];
    ((t || []) as any[]).forEach(task => {
      log.push({ type: 'task_created', title: `Tâche créée : ${task.title}`, date: task.created_at });
      if (task.completed_at) log.push({ type: 'task_done', title: `Tâche terminée : ${task.title}`, date: task.completed_at });
    });
    ((m || []) as any[]).forEach(ms => {
      if (ms.completed_at) log.push({ type: 'milestone_done', title: `Jalon complété : ${ms.title}`, date: ms.completed_at });
    });
    ((n || []) as any[]).forEach(note => {
      log.push({ type: 'note', title: `Note ajoutée`, date: note.created_at });
    });
    ((f || []) as any[]).forEach(file => {
      log.push({ type: 'file', title: `Fichier uploadé : ${file.file_name}`, date: file.created_at });
    });
    ((d || []) as any[]).forEach(del => {
      log.push({ type: 'deliverable', title: `Livrable soumis : ${(del as any).title}`, date: (del as any).created_at });
      if ((del as any).reviewed_at) log.push({ type: 'review', title: `Livrable reviewé : ${(del as any).title}`, date: (del as any).reviewed_at });
    });
    log.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setActivityLog(log);
  }, [projectId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const updateStatus = async (status: string) => {
    await supabase.from('projects' as any).update({ status } as any).eq('id', projectId);
    fetchData();
    toast.success('Statut mis à jour');
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
    await supabase.from('project_tasks' as any).insert({
      project_id: projectId, title: newTask, position: tasks.length,
      due_date: newTaskDue || null,
    } as any);
    setNewTask('');
    setNewTaskDue('');
    fetchData();
  };

  const deleteTask = async (id: string) => {
    await supabase.from('project_tasks' as any).delete().eq('id', id);
    fetchData();
  };

  const updateTaskDueDate = async (taskId: string, dueDate: string) => {
    await supabase.from('project_tasks' as any).update({ due_date: dueDate || null } as any).eq('id', taskId);
    fetchData();
  };

  const handleTaskDragStart = (taskId: string) => setDraggedTaskId(taskId);
  const handleTaskDragOver = (e: React.DragEvent, targetTaskId: string) => {
    e.preventDefault();
    if (!draggedTaskId || draggedTaskId === targetTaskId) return;
  };
  const handleTaskDrop = async (targetTaskId: string) => {
    if (!draggedTaskId || draggedTaskId === targetTaskId) return;
    const oldIdx = tasks.findIndex(t => t.id === draggedTaskId);
    const newIdx = tasks.findIndex(t => t.id === targetTaskId);
    if (oldIdx === -1 || newIdx === -1) return;
    const reordered = [...tasks];
    const [moved] = reordered.splice(oldIdx, 1);
    reordered.splice(newIdx, 0, moved);
    setTasks(reordered);
    setDraggedTaskId(null);
    // Persist new positions
    await Promise.all(reordered.map((t, i) =>
      supabase.from('project_tasks' as any).update({ position: i } as any).eq('id', t.id)
    ));
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

  // File upload
  const uploadFiles = async (fileList: FileList | File[]) => {
    setUploading(true);
    const { data: { user } } = await supabase.auth.getUser();
    for (const file of Array.from(fileList)) {
      const filePath = `${projectId}/${Date.now()}_${file.name}`;
      const { error: uploadErr } = await supabase.storage.from('project-files').upload(filePath, file);
      if (uploadErr) { toast.error(`Erreur upload: ${file.name}`); continue; }
      const { data: urlData } = supabase.storage.from('project-files').getPublicUrl(filePath);
      await supabase.from('project_files' as any).insert({
        project_id: projectId,
        file_name: file.name,
        file_url: urlData.publicUrl,
        file_type: file.type || null,
        uploaded_by: user?.id || null,
      } as any);
    }
    setUploading(false);
    setDragOver(false);
    fetchData();
    toast.success('Fichier(s) uploadé(s)');
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files);
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
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: '#2a2722', margin: 0 }}>{project.title}</h2>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, color: '#6b6560' }}>{clientName}</span>
                <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 700, color: '#fff', background: PRIORITY_COLORS[project.priority] }}>{PRIORITY_LABELS[project.priority]}</span>
                {project.budget && <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 12, color: '#9a9490' }}>{project.budget} {project.currency}</span>}
              </div>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
          </div>

          {/* Status selector */}
          <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
            {STATUS_COLS.map(s => (
              <button key={s.key} onClick={() => updateStatus(s.key)} style={{
                padding: '5px 12px', borderRadius: 99, border: project.status === s.key ? `2px solid ${s.color}` : '1px solid rgba(0,0,0,0.08)',
                background: project.status === s.key ? `${s.color}15` : 'transparent',
                color: project.status === s.key ? s.color : '#9a9490',
                fontFamily: "'Outfit', sans-serif", fontSize: 11, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
              }}>{s.label}</button>
            ))}
          </div>

          {/* Progress */}
          <div className="mb-4">
            <div className="flex justify-between mb-1" style={{ fontFamily: "'Outfit', sans-serif", fontSize: 12, color: '#9a9490' }}>
              <span>{doneTasks}/{tasks.length} tâches terminées</span>
              <span>{progress}%</span>
            </div>
            <div style={{ height: 6, borderRadius: 3, background: 'rgba(0,0,0,0.06)', overflow: 'hidden' }}>
              <div style={{ width: `${progress}%`, height: '100%', background: '#2DD4B8', borderRadius: 3, transition: 'width 0.3s' }} />
            </div>
          </div>

          {/* Dates */}
          {(project.start_date || project.deadline) && (
            <div className="flex gap-4 mb-4" style={{ fontFamily: "'Outfit', sans-serif", fontSize: 12, color: '#9a9490' }}>
              {project.start_date && <span>📅 Début : {new Date(project.start_date).toLocaleDateString('fr-FR')}</span>}
              {project.deadline && <span>🏁 Deadline : {new Date(project.deadline).toLocaleDateString('fr-FR')}</span>}
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-1 mb-4 border-b overflow-x-auto" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
            {([
              { key: 'tasks' as const, label: 'Tâches', icon: Check, count: tasks.length },
              { key: 'milestones' as const, label: 'Jalons', icon: Milestone, count: milestones.length },
              { key: 'deliverables' as const, label: 'Livrables', icon: Package, count: deliverables.length },
              { key: 'notes' as const, label: 'Notes', icon: MessageSquare, count: notes.length },
              { key: 'files' as const, label: 'Fichiers', icon: FileUp, count: files.length },
              { key: 'clientmsgs' as const, label: 'Client', icon: MessagesSquare, count: 0 },
              { key: 'invoices' as const, label: 'Facturation', icon: FileText, count: projectInvoices.length },
              { key: 'activity' as const, label: 'Activité', icon: Clock, count: activityLog.length },
            ]).map(t => (
              <button key={t.key} onClick={() => setTab(t.key)} style={{
                display: 'flex', alignItems: 'center', gap: 4, padding: '8px 14px', border: 'none',
                borderBottom: tab === t.key ? '2px solid #2DD4B8' : '2px solid transparent',
                background: 'none', color: tab === t.key ? '#2DD4B8' : '#9a9490',
                fontFamily: "'Outfit', sans-serif", fontSize: 12, fontWeight: tab === t.key ? 600 : 400, cursor: 'pointer', whiteSpace: 'nowrap',
              }}>
                <t.icon size={14} /> {t.label} ({t.count})
              </button>
            ))}
          </div>

          {/* Tab content */}
          {tab === 'tasks' && (
            <div>
              {tasks.map(t => (
                <div key={t.id}
                  draggable
                  onDragStart={() => handleTaskDragStart(t.id)}
                  onDragOver={(e) => handleTaskDragOver(e, t.id)}
                  onDrop={() => handleTaskDrop(t.id)}
                  className="flex items-center gap-2 py-2"
                  style={{
                    borderBottom: '1px solid rgba(0,0,0,0.04)',
                    opacity: draggedTaskId === t.id ? 0.4 : 1,
                    cursor: 'grab',
                  }}
                >
                  <GripVertical size={12} style={{ color: '#9a9490', opacity: 0.4, flexShrink: 0 }} />
                  <button onClick={() => toggleTask(t)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.status === 'done' ? '#2DD4B8' : '#9a9490', flexShrink: 0 }}>
                    {t.status === 'done' ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                  </button>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{
                      fontFamily: "'Outfit', sans-serif", fontSize: 13,
                      color: t.status === 'done' ? '#9a9490' : '#2a2722',
                      textDecoration: t.status === 'done' ? 'line-through' : 'none',
                    }}>{t.title}</span>
                    {t.due_date && (
                      <span style={{
                        fontFamily: "'Outfit', sans-serif", fontSize: 10, marginLeft: 8,
                        color: new Date(t.due_date) < new Date() && t.status !== 'done' ? '#ef4444' : '#9a9490',
                      }}>
                        📅 {new Date(t.due_date).toLocaleDateString('fr-FR')}
                      </span>
                    )}
                  </div>
                  <input
                    type="date"
                    value={t.due_date || ''}
                    onChange={e => updateTaskDueDate(t.id, e.target.value)}
                    onClick={e => e.stopPropagation()}
                    title="Date d'échéance"
                    style={{ width: 28, height: 28, padding: 0, border: 'none', background: 'none', cursor: 'pointer', opacity: 0.4, flexShrink: 0 }}
                  />
                  <button onClick={() => deleteTask(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9a9490', opacity: 0.5, flexShrink: 0 }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              <div className="flex gap-2 mt-3">
                <input value={newTask} onChange={e => setNewTask(e.target.value)} placeholder="Ajouter une tâche..." onKeyDown={e => e.key === 'Enter' && addTask()}
                  style={{ flex: 1, padding: '8px 12px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.08)', fontFamily: "'Outfit', sans-serif", fontSize: 13, outline: 'none' }} />
                <input type="date" value={newTaskDue} onChange={e => setNewTaskDue(e.target.value)} title="Date d'échéance"
                  style={{ padding: '8px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.08)', fontFamily: "'Outfit', sans-serif", fontSize: 12, outline: 'none', width: 120 }} />
                <button onClick={addTask} style={{ padding: '8px 14px', background: '#2DD4B8', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer' }}>
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
                      background: m.completed_at ? '#2DD4B8' : 'transparent',
                      border: `2px solid ${m.completed_at ? '#2DD4B8' : 'rgba(0,0,0,0.08)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                    }}>
                      {m.completed_at && <Check size={12} color="#fff" />}
                    </button>
                    {i < milestones.length - 1 && <div style={{ width: 2, height: 30, background: 'rgba(0,0,0,0.08)' }} />}
                  </div>
                  <div>
                    <div style={{
                      fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 600,
                      color: m.completed_at ? '#2DD4B8' : '#2a2722',
                    }}>{m.title}</div>
                    {m.due_date && <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, color: '#9a9490' }}>{new Date(m.due_date).toLocaleDateString('fr-FR')}</div>}
                  </div>
                </div>
              ))}
              {!milestones.length && <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, color: '#9a9490', textAlign: 'center', padding: 20 }}>Aucun jalon défini.</div>}
            </div>
          )}

          {tab === 'notes' && (
            <div>
              <div className="space-y-3 mb-4" style={{ maxHeight: 300, overflowY: 'auto' }}>
                {notes.map(n => (
                  <div key={n.id} style={{ padding: 12, borderRadius: 12, background: 'rgba(0,0,0,0.02)' }}>
                    <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, color: '#2a2722', margin: 0, whiteSpace: 'pre-wrap' }}>{n.content}</p>
                    <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 10, color: '#9a9490', marginTop: 4, display: 'block' }}>{new Date(n.created_at).toLocaleString('fr-FR')}</span>
                  </div>
                ))}
                {!notes.length && <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, color: '#9a9490', textAlign: 'center', padding: 20 }}>Aucune note.</div>}
              </div>
              <div className="flex gap-2">
                <input value={newNote} onChange={e => setNewNote(e.target.value)} placeholder="Écrire une note..." onKeyDown={e => e.key === 'Enter' && addNote()}
                  style={{ flex: 1, padding: '8px 12px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.08)', fontFamily: "'Outfit', sans-serif", fontSize: 13, outline: 'none' }} />
                <button onClick={addNote} style={{ padding: '8px 14px', background: '#2DD4B8', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer' }}>
                  <MessageSquare size={16} />
                </button>
              </div>
            </div>
          )}

          {tab === 'files' && (
            <div>
              {/* Drag & drop upload zone */}
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${dragOver ? '#2DD4B8' : 'rgba(0,0,0,0.08)'}`,
                  borderRadius: 14, padding: 24, textAlign: 'center', cursor: 'pointer',
                  background: dragOver ? 'rgba(16,185,129,0.05)' : 'rgba(0,0,0,0.02)',
                  marginBottom: 16, transition: 'all 0.2s',
                }}
              >
                <Upload size={24} style={{ color: dragOver ? '#2DD4B8' : '#9a9490', margin: '0 auto 8px' }} />
                <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, color: dragOver ? '#2DD4B8' : '#9a9490' }}>
                  {uploading ? 'Upload en cours...' : 'Glissez des fichiers ici ou cliquez pour sélectionner'}
                </div>
                <input ref={fileInputRef} type="file" multiple className="hidden" onChange={e => e.target.files && uploadFiles(e.target.files)} />
              </div>

              {files.length ? (
                <div className="grid grid-cols-2 gap-3">
                  {files.map(f => {
                    const isImage = f.file_type?.startsWith('image/');
                    return (
                      <a key={f.id} href={f.file_url} target="_blank" rel="noreferrer" style={{
                        padding: 12, borderRadius: 12, border: '1px solid rgba(0,0,0,0.08)', display: 'block', textDecoration: 'none',
                        overflow: 'hidden',
                      }}>
                        {isImage && <img src={f.file_url} alt={f.file_name} style={{ width: '100%', height: 80, objectFit: 'cover', borderRadius: 8, marginBottom: 8 }} />}
                        <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 12, fontWeight: 600, color: '#2a2722', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.file_name}</div>
                        <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 10, color: '#9a9490', marginTop: 2 }}>{f.file_type || 'fichier'}</div>
                      </a>
                    );
                  })}
                </div>
              ) : (
                !uploading && <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, color: '#9a9490', textAlign: 'center', padding: 20 }}>Aucun fichier.</div>
              )}
            </div>
          )}

          {tab === 'clientmsgs' && (
            <PortalMessagesAdmin projectId={projectId} clientId={project?.client_id} />
          )}

          {tab === 'deliverables' && (
            <div>
              <button onClick={() => setShowNewDeliverable(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#2DD4B8', color: '#fff', border: 'none', borderRadius: 10, fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 600, cursor: 'pointer', marginBottom: 12 }}>
                <Plus size={14} /> Soumettre un livrable
              </button>

              {showNewDeliverable && (
                <div style={{ padding: 16, borderRadius: 12, border: '1px solid rgba(0,0,0,0.08)', background: 'rgba(0,0,0,0.02)', marginBottom: 12 }}>
                  <div className="space-y-3">
                    <div>
                      <label style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, color: '#9a9490' }}>Titre *</label>
                      <input value={newDeliverable.title} onChange={e => setNewDeliverable(d => ({ ...d, title: e.target.value }))} placeholder="Ex: Maquette page d'accueil" style={{ width: '100%', padding: '8px 12px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.08)', fontFamily: "'Outfit', sans-serif", fontSize: 13, outline: 'none' }} />
                    </div>
                    <div>
                      <label style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, color: '#9a9490' }}>Description</label>
                      <textarea value={newDeliverable.description} onChange={e => setNewDeliverable(d => ({ ...d, description: e.target.value }))} rows={2} placeholder="Détails pour le client..." style={{ width: '100%', padding: '8px 12px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.08)', fontFamily: "'Outfit', sans-serif", fontSize: 13, outline: 'none', resize: 'vertical' }} />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={submitDeliverable} style={{ padding: '8px 16px', background: '#2DD4B8', color: '#fff', border: 'none', borderRadius: 10, fontFamily: "'Outfit', sans-serif", fontSize: 13, cursor: 'pointer' }}>Soumettre</button>
                      <button onClick={() => setShowNewDeliverable(false)} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 10, fontFamily: "'Outfit', sans-serif", fontSize: 13, cursor: 'pointer' }}>Annuler</button>
                    </div>
                  </div>
                </div>
              )}

              {deliverables.length === 0 && !showNewDeliverable && (
                <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, color: '#9a9490', textAlign: 'center', padding: 20 }}>Aucun livrable soumis.</div>
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
                          <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 14, fontWeight: 600, color: '#2a2722' }}>{d.title}</div>
                          {d.description && <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 12, color: '#6b6560', marginTop: 2 }}>{d.description}</div>}
                        </div>
                        <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600, fontFamily: "'Outfit', sans-serif", color: s.color, background: `${s.color}15`, whiteSpace: 'nowrap' }}>{s.label}</span>
                      </div>
                      {d.client_comment && (
                        <div style={{ marginTop: 8, padding: 8, borderRadius: 8, background: 'rgba(0,0,0,0.04)' }}>
                          <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, color: '#9a9490', marginBottom: 2 }}>💬 Commentaire client :</div>
                          <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 12, color: '#2a2722' }}>{d.client_comment}</div>
                        </div>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 10, color: '#9a9490' }}>{new Date(d.created_at).toLocaleDateString('fr-FR')}</span>
                        <button onClick={async () => { await supabase.from('deliverable_reviews' as any).delete().eq('id', d.id); fetchData(); toast.success('Livrable supprimé'); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9a9490', opacity: 0.5 }}><Trash2 size={13} /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}


          {tab === 'invoices' && (
            <div>
              {/* Summary */}
              {projectInvoices.length > 0 && (() => {
                const totalInvoiced = projectInvoices.reduce((s, i) => s + Number(i.total), 0);
                const totalPaid = projectInvoices.reduce((s, i) => s + Number(i.amount_paid), 0);
                const fmtE = (n: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);
                const budgetPct = project?.budget ? Math.round((totalInvoiced / Number(project.budget)) * 100) : null;
                return (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                    <div style={{ padding: 12, background: 'rgba(255,255,255,0.5)', borderRadius: 12, border: '1px solid rgba(0,0,0,0.08)' }}>
                      <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 10, color: '#9a9490' }}>Facturé</p>
                      <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 16, fontWeight: 700, color: '#2a2722' }}>{fmtE(totalInvoiced)}</p>
                    </div>
                    <div style={{ padding: 12, background: 'rgba(255,255,255,0.5)', borderRadius: 12, border: '1px solid rgba(0,0,0,0.08)' }}>
                      <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 10, color: '#9a9490' }}>Encaissé</p>
                      <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 16, fontWeight: 700, color: '#2DD4B8' }}>{fmtE(totalPaid)}</p>
                    </div>
                    <div style={{ padding: 12, background: 'rgba(255,255,255,0.5)', borderRadius: 12, border: '1px solid rgba(0,0,0,0.08)' }}>
                      <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 10, color: '#9a9490' }}>Solde</p>
                      <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 16, fontWeight: 700, color: totalInvoiced - totalPaid > 0 ? '#F07067' : '#2DD4B8' }}>{fmtE(totalInvoiced - totalPaid)}</p>
                    </div>
                    {budgetPct !== null && (
                      <div style={{ padding: 12, background: 'rgba(255,255,255,0.5)', borderRadius: 12, border: '1px solid rgba(0,0,0,0.08)' }}>
                        <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 10, color: '#9a9490' }}>vs Budget</p>
                        <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 16, fontWeight: 700, color: budgetPct > 100 ? '#F07067' : '#2DD4B8' }}>{budgetPct}%</p>
                      </div>
                    )}
                  </div>
                );
              })()}
              {/* Invoice list */}
              {projectInvoices.length === 0 ? (
                <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, color: '#9a9490', textAlign: 'center', padding: 20 }}>Aucune facture liée à ce projet</p>
              ) : (
                <div className="space-y-2 mb-4">
                  {projectInvoices.map(inv => {
                    const statusCfg: Record<string, { label: string; color: string }> = {
                      draft: { label: 'Brouillon', color: '#9ca3af' }, sent: { label: 'Envoyée', color: '#3b82f6' },
                      viewed: { label: 'Vue', color: '#8b5cf6' }, paid: { label: 'Payée', color: '#10b981' },
                      partially_paid: { label: 'Partiel', color: '#f59e0b' }, overdue: { label: 'En retard', color: '#ef4444' },
                      cancelled: { label: 'Annulée', color: '#6b7280' }, refunded: { label: 'Remboursée', color: '#f97316' },
                    };
                    const s = statusCfg[inv.status] || { label: inv.status, color: '#999' };
                    const fmtE = (n: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);
                    return (
                      <div key={inv.id} className="flex items-center justify-between" style={{
                        padding: '10px 14px', background: 'rgba(255,255,255,0.5)', borderRadius: 10,
                        border: '1px solid rgba(0,0,0,0.08)', fontFamily: "'Outfit', sans-serif", fontSize: 13,
                      }}>
                        <span style={{ color: '#2DD4B8', fontFamily: "'Space Mono', monospace", fontSize: 12 }}>{inv.invoice_number}</span>
                        <span style={{ color: '#6b6560' }}>{new Date(inv.issue_date).toLocaleDateString('fr-FR')}</span>
                        <span style={{ fontWeight: 600, color: '#2a2722' }}>{fmtE(Number(inv.total))}</span>
                        <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 600, background: `${s.color}18`, color: s.color }}>{s.label}</span>
                      </div>
                    );
                  })}
                </div>
              )}
              <button onClick={() => navigate(`/admin/invoices?clientId=${project?.client_id}&projectId=${projectId}`)} className="flex items-center gap-2" style={{
                padding: '8px 16px', background: '#2DD4B8', color: '#fff', border: 'none',
                borderRadius: '100px', fontFamily: "'Outfit', sans-serif", fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}>
                <Plus size={12} /> Créer une facture
              </button>
            </div>
          )}

          {tab === 'activity' && (
            <div className="space-y-2" style={{ maxHeight: 400, overflowY: 'auto' }}>
              {activityLog.length === 0 && (
                <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, color: '#9a9490', textAlign: 'center', padding: 20 }}>Aucune activité.</div>
              )}
              {activityLog.map((a, i) => {
                const icons: Record<string, string> = { task_created: '📋', task_done: '✅', milestone_done: '🏁', note: '💬', file: '📎', deliverable: '📦', review: '👁️' };
                return (
                  <div key={i} className="flex items-start gap-3 py-2" style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                    <span style={{ fontSize: 14, flexShrink: 0, marginTop: 2 }}>{icons[a.type] || '•'}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, color: '#2a2722' }}>{a.title}</div>
                      <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 10, color: '#9a9490' }}>{new Date(a.date).toLocaleString('fr-FR')}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {/* Feedback client */}
          <FeedbackSection projectId={projectId} clientId={project?.client_id} />
        </div>
      </div>
    </div>
  );
};

const FeedbackSection = ({ projectId, clientId }: { projectId: string; clientId?: string }) => {
  const [fb, setFb] = useState<any>(null);
  useEffect(() => {
    if (!projectId || !clientId) return;
    supabase.from('client_feedback').select('*').eq('project_id', projectId).eq('client_id', clientId).limit(1).then(({ data }) => setFb(data?.[0] || null));
  }, [projectId, clientId]);
  if (!fb) return null;
  return (
    <div style={{ marginTop: 16, padding: 16, borderRadius: 14, background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)' }}>
      <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 12, fontWeight: 600, color: '#f59e0b', marginBottom: 6 }}>⭐ Feedback client</div>
      <div className="flex gap-1 mb-2">
        {[1,2,3,4,5].map(n => <span key={n} style={{ fontSize: 16, opacity: n <= fb.rating ? 1 : 0.2 }}>⭐</span>)}
      </div>
      {fb.comment && <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, color: '#2a2722', margin: 0 }}>"{fb.comment}"</p>}
      <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 10, color: '#9a9490', marginTop: 4 }}>{new Date(fb.submitted_at).toLocaleDateString('fr-FR')}</div>
    </div>
  );
};

export default ProjectDetailModal;