import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Search, Plus, Filter, LayoutGrid, List, CalendarRange, AlertTriangle, X, GripVertical } from 'lucide-react';
import ProjectDetailModal from '@/components/admin/ProjectDetailModal';
import {
  DndContext, closestCorners, PointerSensor, useSensor, useSensors, DragOverlay, DragStartEvent, DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

type Project = {
  id: string; client_id: string; title: string; description: string | null;
  status: string; priority: string; project_type: string | null;
  budget: number | null; currency: string; start_date: string | null;
  deadline: string | null; completed_at: string | null;
  created_at: string; updated_at: string;
  client_name?: string; task_total?: number; task_done?: number;
};
type Client = { id: string; business_name: string };
type Template = { id: string; name: string; default_tasks: any; default_milestones: any };

const STATUS_COLS: { key: string; label: string; color: string; icon: string }[] = [
  { key: 'brief', label: 'Brief', color: '#8B5CF6', icon: '📋' },
  { key: 'maquette', label: 'Maquette', color: '#F59E0B', icon: '🎨' },
  { key: 'development', label: 'Développement', color: '#3B82F6', icon: '💻' },
  { key: 'review', label: 'Review', color: '#F97316', icon: '👁️' },
  { key: 'delivered', label: 'Livré', color: '#10B981', icon: '✅' },
  { key: 'maintenance', label: 'Maintenance', color: '#6B7280', icon: '🔧' },
];

const PRIORITY_COLORS: Record<string, string> = { urgent: '#ef4444', high: '#f97316', medium: '#3b82f6', low: '#9ca3af' };
const PRIORITY_LABELS: Record<string, string> = { urgent: 'Urgent', high: 'Haute', medium: 'Moyenne', low: 'Basse' };
const PROJECT_TYPES = ['app_ios_android', 'site_vitrine', 'landing_page', 'webapp', 'autre'];
const TYPE_LABELS: Record<string, string> = { app_ios_android: 'App iOS/Android', site_vitrine: 'Site vitrine', landing_page: 'Landing page', webapp: 'Web app', autre: 'Autre' };

const deadlineColor = (deadline: string | null) => {
  if (!deadline) return '#9a9490';
  const diff = (new Date(deadline).getTime() - Date.now()) / 86400000;
  if (diff < 0) return '#ef4444';
  if (diff < 3) return '#f97316';
  return '#10b981';
};

// ─── Sortable card ───
const SortableCard = ({ project, onClick }: { project: Project; onClick: () => void }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: project.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };
  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <ProjectCard project={project} onClick={onClick} dragListeners={listeners} />
    </div>
  );
};

const ProjectCard = ({ project, onClick, dragListeners }: { project: Project; onClick: () => void; dragListeners?: any }) => {
  const progress = project.task_total ? Math.round((project.task_done || 0) / project.task_total * 100) : 0;
  return (
    <div
      onClick={onClick}
      className="cursor-pointer group"
      style={{
        background: 'rgba(255,255,255,0.20)', backdropFilter: 'blur(20px) saturate(1.4)',
        border: '1px solid rgba(255,255,255,0.30)', borderRadius: 14,
        padding: 14, marginBottom: 8,
        boxShadow: '0 4px 20px rgba(42,157,143,0.04), 0 1px 3px rgba(0,0,0,0.03), inset 0 1px 0 rgba(255,255,255,0.4)',
        transition: 'box-shadow 0.2s, transform 0.15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 32px rgba(42,157,143,0.08)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(42,157,143,0.04)'; e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      <div className="flex items-start gap-2">
        <button {...dragListeners} className="mt-1 cursor-grab opacity-0 group-hover:opacity-40 transition-opacity" style={{ background: 'none', border: 'none', padding: 0 }} onClick={e => e.stopPropagation()}>
          <GripVertical size={14} />
        </button>
        <div className="flex-1 min-w-0">
          <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 14, fontWeight: 600, color: '#2a2722', marginBottom: 4 }}>{project.title}</div>
          <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 12, color: '#9a9490', marginBottom: 6 }}>{project.client_name}</div>
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 700, fontFamily: "'Outfit', sans-serif", color: '#fff', background: PRIORITY_COLORS[project.priority] }}>{PRIORITY_LABELS[project.priority]}</span>
            {project.project_type && <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 600, fontFamily: "'Outfit', sans-serif", color: '#6b6560', background: 'rgba(0,0,0,0.05)' }}>{TYPE_LABELS[project.project_type] || project.project_type}</span>}
          </div>
          {project.task_total ? (
            <div className="mb-2">
              <div className="flex justify-between" style={{ fontSize: 10, fontFamily: "'Outfit', sans-serif", color: '#9a9490', marginBottom: 2 }}>
                <span>{project.task_done}/{project.task_total} tâches</span>
                <span>{progress}%</span>
              </div>
              <div style={{ height: 4, borderRadius: 2, background: 'rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                <div style={{ width: `${progress}%`, height: '100%', background: '#2DD4B8', borderRadius: 2, transition: 'width 0.3s' }} />
              </div>
            </div>
          ) : null}
          {project.deadline && (
            <div style={{ fontSize: 11, fontFamily: "'Outfit', sans-serif", color: deadlineColor(project.deadline) }}>
              📅 {new Date(project.deadline).toLocaleDateString('fr-FR')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Main ───
const AdminProjects = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'kanban' | 'list' | 'timeline'>('kanban');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [filterPriority, setFilterPriority] = useState<string[]>([]);
  const [filterClient, setFilterClient] = useState('');
  const [onlyLate, setOnlyLate] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    const { data: projData } = await supabase.from('projects' as any).select('*').order('created_at', { ascending: false });
    const projs = (projData || []) as unknown as any[];

    // fetch client names
    const { data: cData } = await supabase.from('clients' as any).select('id, business_name');
    const clientMap = new Map(((cData || []) as unknown as any[]).map((c: any) => [c.id, c.business_name]));
    setClients((cData || []) as unknown as Client[]);


    // fetch task counts per project
    const { data: taskData } = await supabase.from('project_tasks' as any).select('project_id, status') as unknown as { data: any[] };
    const taskCounts: Record<string, { total: number; done: number }> = {};
    (taskData || []).forEach((t: any) => {
      if (!taskCounts[t.project_id]) taskCounts[t.project_id] = { total: 0, done: 0 };
      taskCounts[t.project_id].total++;
      if (t.status === 'done') taskCounts[t.project_id].done++;
    });

    setProjects(projs.map(p => ({
      ...p,
      client_name: clientMap.get(p.client_id) || '—',
      task_total: taskCounts[p.id]?.total || 0,
      task_done: taskCounts[p.id]?.done || 0,
    })));
    setLoading(false);
  }, []);

  const fetchTemplates = useCallback(async () => {
    const { data } = await supabase.from('project_templates' as any).select('*');
    setTemplates((data || []) as unknown as Template[]);
  }, []);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/admin/login'); return; }
      const { data: roles } = await supabase.from('user_roles').select('role').eq('user_id', user.id);
      if (!roles?.some(r => r.role === 'admin')) { navigate('/admin/login'); return; }
      fetchProjects();
      fetchTemplates();
      // Auto-open new project modal if query param present
      const params = new URLSearchParams(window.location.search);
      const newForClient = params.get('newForClient');
      if (newForClient) {
        setShowNew(true);
        // Will be picked up by NewProjectModal via defaultClientId
        (window as any).__newProjectClientId = newForClient;
        window.history.replaceState({}, '', window.location.pathname);
      }
    })();
  }, [navigate, fetchProjects, fetchTemplates]);

  // Realtime
  useEffect(() => {
    const channel = supabase.channel('projects-rt').on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, () => fetchProjects()).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchProjects]);

  const filtered = projects.filter(p => {
    if (search && !p.title.toLowerCase().includes(search.toLowerCase()) && !p.client_name?.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterStatus.length && !filterStatus.includes(p.status)) return false;
    if (filterPriority.length && !filterPriority.includes(p.priority)) return false;
    if (filterClient && p.client_id !== filterClient) return false;
    if (onlyLate && !(p.deadline && new Date(p.deadline) < new Date() && p.status !== 'delivered')) return false;
    return true;
  });

  const handleDragStart = (e: DragStartEvent) => setActiveId(e.active.id as string);
  const handleDragEnd = async (e: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const overId = over.id as string;
    // Check if dropped on a column
    const col = STATUS_COLS.find(c => c.key === overId);
    if (col) {
      const proj = projects.find(p => p.id === active.id);
      if (proj && proj.status !== col.key) {
        await supabase.from('projects' as any).update({ status: col.key } as any).eq('id', proj.id);
        toast.success(`"${proj.title}" → ${col.label}`);
        fetchProjects();
      }
    }
  };

  const activeProject = activeId ? projects.find(p => p.id === activeId) : null;

  return (
    <div>
      <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, color: '#2a2722', margin: 0 }}>Projets</h2>
          <div className="flex-1" />
          {/* View toggle */}
          <div className="flex" style={{ background: 'rgba(255,255,255,0.20)', borderRadius: 10, padding: 2, backdropFilter: 'blur(10px)' }}>
            {([['kanban', LayoutGrid], ['list', List], ['timeline', CalendarRange]] as const).map(([v, Icon]) => (
              <button key={v} onClick={() => setView(v)} style={{
                display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 8,
                background: view === v ? 'rgba(255,255,255,0.5)' : 'transparent', border: 'none', cursor: 'pointer',
                fontFamily: "'Outfit', sans-serif", fontSize: 12, fontWeight: view === v ? 600 : 400,
                color: view === v ? '#2a2722' : '#9a9490',
                boxShadow: view === v ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s',
              }}>
                <Icon size={14} />
              </button>
            ))}
          </div>
          <button onClick={() => setShowNew(true)} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px',
            background: '#2DD4B8', color: '#fff', border: 'none', borderRadius: '100px',
            fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}>
            <Plus size={14} /> Nouveau projet
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          <div className="flex items-center gap-2 flex-1 min-w-[180px]" style={{ background: 'rgba(255,255,255,0.20)', border: '1px solid rgba(255,255,255,0.30)', borderRadius: '100px', padding: '6px 14px', backdropFilter: 'blur(10px)' }}>
            <Search size={14} style={{ color: '#9a9490' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." style={{ border: 'none', outline: 'none', fontFamily: "'Outfit', sans-serif", fontSize: 13, flex: 1, background: 'transparent' }} />
          </div>
          {/* Multi-select status */}
          <div className="flex flex-wrap gap-1" style={{ padding: '4px 8px', borderRadius: '100px', border: '1px solid rgba(255,255,255,0.30)', background: 'rgba(255,255,255,0.20)', backdropFilter: 'blur(10px)' }}>
            {STATUS_COLS.map(s => (
              <button key={s.key} onClick={() => setFilterStatus(prev => prev.includes(s.key) ? prev.filter(x => x !== s.key) : [...prev, s.key])} style={{
                padding: '3px 10px', borderRadius: 99, border: 'none', cursor: 'pointer',
                fontFamily: "'Outfit', sans-serif", fontSize: 11, fontWeight: 600,
                background: filterStatus.includes(s.key) ? `${s.color}20` : 'transparent',
                color: filterStatus.includes(s.key) ? s.color : '#9a9490',
              }}>{s.label}</button>
            ))}
          </div>
          {/* Multi-select priority */}
          <div className="flex flex-wrap gap-1" style={{ padding: '4px 8px', borderRadius: '100px', border: '1px solid rgba(255,255,255,0.30)', background: 'rgba(255,255,255,0.20)', backdropFilter: 'blur(10px)' }}>
            {(['urgent', 'high', 'medium', 'low'] as const).map(p => (
              <button key={p} onClick={() => setFilterPriority(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])} style={{
                padding: '3px 10px', borderRadius: 99, border: 'none', cursor: 'pointer',
                fontFamily: "'Outfit', sans-serif", fontSize: 11, fontWeight: 600,
                background: filterPriority.includes(p) ? `${PRIORITY_COLORS[p]}20` : 'transparent',
                color: filterPriority.includes(p) ? PRIORITY_COLORS[p] : '#9a9490',
              }}>{PRIORITY_LABELS[p]}</button>
            ))}
          </div>
          <select
            value={filterClient}
            onChange={e => setFilterClient(e.target.value)}
            style={{ padding: '6px 14px', borderRadius: '100px', border: '1px solid rgba(255,255,255,0.30)', fontFamily: "'Outfit', sans-serif", fontSize: 12, background: 'rgba(255,255,255,0.20)', cursor: 'pointer', backdropFilter: 'blur(10px)' }}
          >
            <option value="">Tous les clients</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.business_name}</option>)}
          </select>
          <label className="flex items-center gap-2 cursor-pointer" style={{ padding: '6px 14px', borderRadius: '100px', border: '1px solid rgba(255,255,255,0.30)', fontFamily: "'Outfit', sans-serif", fontSize: 12, background: onlyLate ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.20)', color: onlyLate ? '#ef4444' : '#6b6560', backdropFilter: 'blur(10px)' }}>
            <AlertTriangle size={12} />
            <input type="checkbox" checked={onlyLate} onChange={e => setOnlyLate(e.target.checked)} className="hidden" />
            En retard
          </label>
          {(filterStatus.length > 0 || filterPriority.length > 0 || filterClient || onlyLate) && (
            <button onClick={() => { setFilterStatus([]); setFilterPriority([]); setFilterClient(''); setOnlyLate(false); }} style={{
              padding: '6px 14px', borderRadius: '100px', border: '1px solid rgba(255,255,255,0.30)',
              fontFamily: "'Outfit', sans-serif", fontSize: 12, background: 'rgba(255,255,255,0.20)', cursor: 'pointer', color: '#9a9490',
              display: 'flex', alignItems: 'center', gap: 4,
            }}><X size={12} /> Réinitialiser</button>
          )}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, fontFamily: "'Outfit', sans-serif", color: '#9a9490' }}>Chargement...</div>
        ) : view === 'kanban' ? (
          <KanbanView projects={filtered} sensors={sensors} activeProject={activeProject}
            onDragStart={handleDragStart} onDragEnd={handleDragEnd} onCardClick={id => setDetailId(id)} />
        ) : view === 'list' ? (
          <ListView projects={filtered} onCardClick={id => setDetailId(id)} />
        ) : (
          <TimelineView projects={filtered} onCardClick={id => setDetailId(id)} />
        )}
      </div>

      {showNew && <NewProjectModal clients={clients} templates={templates} onClose={() => setShowNew(false)} onCreated={fetchProjects} />}
      {detailId && <ProjectDetailModal projectId={detailId} onClose={() => { setDetailId(null); fetchProjects(); }} />}
    </div>
  );
};

// ─── Kanban ───
const KanbanView = ({ projects, sensors, activeProject, onDragStart, onDragEnd, onCardClick }: any) => (
  <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={onDragStart} onDragEnd={onDragEnd}>
    <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: 400 }}>
      {STATUS_COLS.map(col => {
        const colProjects = projects.filter((p: Project) => p.status === col.key);
        return (
          <SortableContext key={col.key} items={colProjects.map((p: Project) => p.id)} strategy={verticalListSortingStrategy} id={col.key}>
            <div
              id={col.key}
              data-droppable="true"
              style={{ minWidth: 260, maxWidth: 300, flex: '1 0 260px' }}
            >
              <div className="flex items-center gap-2 mb-3 px-1">
                <span style={{ fontSize: 16 }}>{col.icon}</span>
                <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 600, color: col.color }}>{col.label}</span>
                <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, color: '#9a9490', background: 'rgba(0,0,0,0.05)', borderRadius: 99, padding: '1px 8px' }}>{colProjects.length}</span>
              </div>
              <div style={{ minHeight: 60, padding: 4, borderRadius: 12, background: `${col.color}08` }}>
                {colProjects.map((p: Project) => (
                  <SortableCard key={p.id} project={p} onClick={() => onCardClick(p.id)} />
                ))}
              </div>
            </div>
          </SortableContext>
        );
      })}
    </div>
    <DragOverlay>
      {activeProject ? <ProjectCard project={activeProject} onClick={() => {}} /> : null}
    </DragOverlay>
  </DndContext>
);

// ─── List ───
const ListView = ({ projects, onCardClick }: { projects: Project[]; onCardClick: (id: string) => void }) => (
  <div style={{ background: 'white', borderRadius: 16, border: '1px solid rgba(0,0,0,0.08)', overflow: 'hidden' }}>
    <div className="overflow-x-auto">
      <table className="w-full" style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
            {['Projet', 'Client', 'Statut', 'Priorité', 'Progression', 'Deadline', 'Budget'].map(h => (
              <th key={h} className="text-left px-4 py-3" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color: '#9a9490', fontWeight: 600 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {projects.map(p => {
            const progress = p.task_total ? Math.round((p.task_done || 0) / p.task_total * 100) : 0;
            const col = STATUS_COLS.find(c => c.key === p.status);
            return (
              <tr key={p.id} className="cursor-pointer" style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}
                onClick={() => onCardClick(p.id)}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.02)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <td className="px-4 py-3 font-medium" style={{ color: '#2a2722' }}>{p.title}</td>
                <td className="px-4 py-3" style={{ color: '#6b6560' }}>{p.client_name}</td>
                <td className="px-4 py-3"><span style={{ padding: '2px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600, color: col?.color, background: `${col?.color}15` }}>{col?.icon} {col?.label}</span></td>
                <td className="px-4 py-3"><span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 700, color: '#fff', background: PRIORITY_COLORS[p.priority] }}>{PRIORITY_LABELS[p.priority]}</span></td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div style={{ width: 60, height: 4, borderRadius: 2, background: 'rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                      <div style={{ width: `${progress}%`, height: '100%', background: '#2DD4B8', borderRadius: 2 }} />
                    </div>
                    <span style={{ fontSize: 11, color: '#9a9490' }}>{progress}%</span>
                  </div>
                </td>
                <td className="px-4 py-3" style={{ fontSize: 12, color: deadlineColor(p.deadline) }}>{p.deadline ? new Date(p.deadline).toLocaleDateString('fr-FR') : '—'}</td>
                <td className="px-4 py-3" style={{ color: '#6b6560' }}>{p.budget ? `${p.budget} ${p.currency}` : '—'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </div>
);

// ─── Timeline ───
const TimelineView = ({ projects, onCardClick }: { projects: Project[]; onCardClick: (id: string) => void }) => {
  const withDates = projects.filter(p => p.start_date || p.deadline);
  if (!withDates.length) return <div style={{ textAlign: 'center', padding: 40, fontFamily: "'Outfit', sans-serif", color: '#9a9490' }}>Aucun projet avec des dates définies.</div>;

  const allDates = withDates.flatMap(p => [p.start_date, p.deadline].filter(Boolean).map(d => new Date(d!).getTime()));
  const minDate = Math.min(...allDates);
  const maxDate = Math.max(...allDates);
  const range = Math.max(maxDate - minDate, 86400000);
  const today = Date.now();
  const todayPos = Math.max(0, Math.min(100, ((today - minDate) / range) * 100));

  return (
    <div style={{ background: 'white', borderRadius: 16, border: '1px solid rgba(0,0,0,0.08)', padding: 20, overflow: 'auto' }}>
      <div style={{ position: 'relative', minWidth: 600, minHeight: withDates.length * 44 + 30 }}>
        {/* Today line */}
        <div style={{ position: 'absolute', left: `${todayPos}%`, top: 0, bottom: 0, width: 2, background: '#ef4444', opacity: 0.3, zIndex: 1 }} />
        {withDates.map((p, i) => {
          const start = p.start_date ? new Date(p.start_date).getTime() : (p.deadline ? new Date(p.deadline).getTime() - 86400000 * 7 : minDate);
          const end = p.deadline ? new Date(p.deadline).getTime() : start + 86400000 * 7;
          const left = ((start - minDate) / range) * 100;
          const width = Math.max(2, ((end - start) / range) * 100);
          const col = STATUS_COLS.find(c => c.key === p.status);
          return (
            <div key={p.id} onClick={() => onCardClick(p.id)} className="cursor-pointer" style={{ position: 'absolute', top: i * 44, left: `${left}%`, width: `${width}%`, height: 32, background: `${col?.color}20`, borderRadius: 8, border: `1px solid ${col?.color}40`, display: 'flex', alignItems: 'center', padding: '0 10px', gap: 6, minWidth: 100 }}
              onMouseEnter={e => e.currentTarget.style.background = `${col?.color}35`}
              onMouseLeave={e => e.currentTarget.style.background = `${col?.color}20`}>
              <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, fontWeight: 600, color: col?.color, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.title}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── New project modal ───
const NewProjectModal = ({ clients, templates, onClose, onCreated }: { clients: Client[]; templates: Template[]; onClose: () => void; onCreated: () => void }) => {
  const defaultClientId = (window as any).__newProjectClientId || '';
  const [form, setForm] = useState({
    client_id: defaultClientId, title: '', description: '', project_type: '', template_id: '',
    priority: 'medium', budget: '', start_date: '', deadline: '',
  });
  const [saving, setSaving] = useState(false);

  // Cleanup
  useEffect(() => { return () => { delete (window as any).__newProjectClientId; }; }, []);

  const handleCreate = async () => {
    if (!form.client_id || !form.title.trim()) { toast.error('Client et titre requis'); return; }
    setSaving(true);
    const { data, error } = await supabase.from('projects' as any).insert({
      client_id: form.client_id,
      title: form.title,
      description: form.description || null,
      project_type: form.project_type || null,
      priority: form.priority,
      budget: form.budget ? parseFloat(form.budget) : null,
      start_date: form.start_date || null,
      deadline: form.deadline || null,
    } as any).select('id').single();

    if (error) { toast.error('Erreur création'); setSaving(false); return; }
    const projectId = (data as any)?.id;

    // Apply template
    if (form.template_id && projectId) {
      const tpl = templates.find(t => t.id === form.template_id);
      if (tpl) {
        const tasks = (tpl.default_tasks || []) as { title: string }[];
        const milestones = (tpl.default_milestones || []) as { title: string }[];
        if (tasks.length) {
          await supabase.from('project_tasks' as any).insert(
            tasks.map((t, i) => ({ project_id: projectId, title: t.title, position: i } as any))
          );
        }
        if (milestones.length) {
          await supabase.from('project_milestones' as any).insert(
            milestones.map((m, i) => ({ project_id: projectId, title: m.title, position: i } as any))
          );
        }
      }
    }

    toast.success('Projet créé !');
    onCreated();
    onClose();
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="rounded-3xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" style={{ background: 'white' }}>
        <div className="flex items-center justify-between mb-5">
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22 }}>Nouveau projet</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
        </div>
        <div className="space-y-3">
          <Field label="Client *">
            <select value={form.client_id} onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))} style={inputStyle}>
              <option value="">Sélectionner un client</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.business_name}</option>)}
            </select>
          </Field>
          <Field label="Titre *">
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Nom du projet" style={inputStyle} />
          </Field>
          <Field label="Description">
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Type de projet">
              <select value={form.project_type} onChange={e => setForm(f => ({ ...f, project_type: e.target.value }))} style={inputStyle}>
                <option value="">—</option>
                {PROJECT_TYPES.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
              </select>
            </Field>
            <Field label="Template">
              <select value={form.template_id} onChange={e => setForm(f => ({ ...f, template_id: e.target.value }))} style={inputStyle}>
                <option value="">Aucun</option>
                {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Priorité">
            <div className="flex gap-2">
              {(['low', 'medium', 'high', 'urgent'] as const).map(p => (
                <button key={p} onClick={() => setForm(f => ({ ...f, priority: p }))} style={{
                  flex: 1, padding: '6px 0', borderRadius: 8, border: form.priority === p ? `2px solid ${PRIORITY_COLORS[p]}` : '1px solid rgba(0,0,0,0.08)',
                  background: form.priority === p ? `${PRIORITY_COLORS[p]}15` : 'transparent',
                  color: form.priority === p ? PRIORITY_COLORS[p] : '#6b6560',
                  fontFamily: "'Outfit', sans-serif", fontSize: 12, fontWeight: 600, cursor: 'pointer',
                }}>{PRIORITY_LABELS[p]}</button>
              ))}
            </div>
          </Field>
          <Field label="Budget (€)">
            <input type="number" value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} placeholder="0.00" style={inputStyle} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Date de début">
              <input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} style={inputStyle} />
            </Field>
            <Field label="Deadline">
              <input type="date" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} style={inputStyle} />
            </Field>
          </div>
          <button onClick={handleCreate} disabled={saving} style={{
            width: '100%', padding: '12px 0', background: '#2DD4B8', color: '#fff', border: 'none',
            borderRadius: '100px', fontFamily: "'Outfit', sans-serif", fontSize: 14, fontWeight: 600, cursor: 'pointer', marginTop: 8, opacity: saving ? 0.6 : 1,
          }}>
            {saving ? 'Création...' : 'Créer le projet'}
          </button>
        </div>
      </div>
    </div>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <label style={{ fontFamily: "'Outfit', sans-serif", fontSize: 12, color: '#9a9490', display: 'block', marginBottom: 4 }}>{label}</label>
    {children}
  </div>
);

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 12px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.08)',
  fontFamily: "'Outfit', sans-serif", fontSize: 13, outline: 'none', background: 'white',
};

export default AdminProjects;
