import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AdminHeader from '@/components/admin/AdminHeader';
import { Eye, EyeOff, GripVertical, Pencil, Plus, Save, Trash2, X, Image, Video } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PortfolioProject {
  id: string;
  name: string;
  url: string;
  url_display: string;
  badge: string;
  category: string;
  color: string;
  description_fr: string;
  description_en: string;
  description_de: string;
  tags: string[];
  tags_en: string[];
  tags_de: string[];
  screenshot_url: string | null;
  video_url: string | null;
  featured: boolean;
  visible: boolean;
  position: number;
  slug: string | null;
  challenge_fr: string;
  challenge_en: string;
  challenge_de: string;
  solution_fr: string;
  solution_en: string;
  solution_de: string;
  results_fr: string;
  results_en: string;
  results_de: string;
  client_brief_fr: string;
  client_brief_en: string;
  client_brief_de: string;
  tech_stack: string[];
  gallery_urls: string[];
}

const COLORS = ['teal', 'coral', 'gold', 'sky', 'violet'];
const COLOR_MAP: Record<string, string> = {
  teal: '#0d8a6f', coral: '#e8614d', gold: '#d4a55a', sky: '#4a9eca', violet: '#8B5CF6',
};

const emptyProject: Omit<PortfolioProject, 'id'> = {
  name: '', url: '', url_display: '', badge: 'demo', category: '', color: 'teal',
  description_fr: '', description_en: '', description_de: '',
  tags: [], tags_en: [], tags_de: [], screenshot_url: null, video_url: null, featured: false, visible: true, position: 0,
};

const AdminPortfolio = () => {
  const [projects, setProjects] = useState<PortfolioProject[]>([]);
  const [editing, setEditing] = useState<PortfolioProject | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [tagEnInput, setTagEnInput] = useState('');
  const [tagDeInput, setTagDeInput] = useState('');
  const { toast } = useToast();

  const fetchProjects = async () => {
    const { data } = await supabase
      .from('portfolio_projects')
      .select('*')
      .order('position', { ascending: true });
    if (data) setProjects(data as unknown as PortfolioProject[]);
  };

  useEffect(() => { fetchProjects(); }, []);

  const toggleVisibility = async (proj: PortfolioProject) => {
    await supabase.from('portfolio_projects').update({ visible: !proj.visible } as any).eq('id', proj.id);
    fetchProjects();
    toast({ title: proj.visible ? 'Projet masqué' : 'Projet visible' });
  };

  const toggleFeatured = async (proj: PortfolioProject) => {
    // Only one can be featured
    if (!proj.featured) {
      await supabase.from('portfolio_projects').update({ featured: false } as any).neq('id', proj.id);
    }
    await supabase.from('portfolio_projects').update({ featured: !proj.featured } as any).eq('id', proj.id);
    fetchProjects();
  };

  const deleteProject = async (id: string) => {
    if (!confirm('Supprimer ce projet du portfolio ?')) return;
    await supabase.from('portfolio_projects').delete().eq('id', id);
    fetchProjects();
    toast({ title: 'Projet supprimé' });
  };

  const save = async () => {
    if (!editing) return;
    const payload: any = { ...editing };
    delete payload.id;

    if (isNew) {
      payload.position = projects.length;
      await supabase.from('portfolio_projects').insert(payload);
    } else {
      await supabase.from('portfolio_projects').update(payload).eq('id', editing.id);
    }
    setEditing(null);
    setIsNew(false);
    fetchProjects();
    toast({ title: isNew ? 'Projet ajouté' : 'Projet mis à jour' });
  };

  const addTag = () => {
    if (!tagInput.trim() || !editing) return;
    setEditing({ ...editing, tags: [...editing.tags, tagInput.trim()] });
    setTagInput('');
  };

  const addTagEn = () => {
    if (!tagEnInput.trim() || !editing) return;
    setEditing({ ...editing, tags_en: [...editing.tags_en, tagEnInput.trim()] });
    setTagEnInput('');
  };

  const addTagDe = () => {
    if (!tagDeInput.trim() || !editing) return;
    setEditing({ ...editing, tags_de: [...editing.tags_de, tagDeInput.trim()] });
    setTagDeInput('');
  };

  const removeTag = (field: 'tags' | 'tags_en' | 'tags_de', idx: number) => {
    if (!editing) return;
    setEditing({ ...editing, [field]: editing[field].filter((_, i) => i !== idx) });
  };

  const moveProject = async (id: string, dir: -1 | 1) => {
    const idx = projects.findIndex(p => p.id === id);
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= projects.length) return;
    const a = projects[idx];
    const b = projects[swapIdx];
    await supabase.from('portfolio_projects').update({ position: b.position } as any).eq('id', a.id);
    await supabase.from('portfolio_projects').update({ position: a.position } as any).eq('id', b.id);
    fetchProjects();
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: 12,
    background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(0,0,0,0.08)',
    fontFamily: 'var(--font-b)', fontSize: 14, color: 'var(--charcoal)',
    outline: 'none',
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--cream)', fontFamily: 'var(--font-b)' }}>
      <AdminHeader />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 style={{ fontFamily: 'var(--font-h)', fontSize: 28, color: 'var(--charcoal)' }}>Portfolio</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-mid)' }}>
              Gérez les projets affichés sur le site
            </p>
          </div>
          <button
            onClick={() => { setEditing({ ...emptyProject, id: '' } as PortfolioProject); setIsNew(true); }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white transition-all hover:scale-[1.03]"
            style={{ background: 'var(--teal)' }}
          >
            <Plus size={16} /> Ajouter
          </button>
        </div>

        {/* Project list */}
        <div className="space-y-3">
          {projects.map((proj) => (
            <div
              key={proj.id}
              className="flex items-center gap-4 p-4 rounded-2xl transition-all"
              style={{
                background: proj.visible ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.03)',
                border: '1px solid rgba(255,255,255,0.5)',
                backdropFilter: 'blur(12px)',
                opacity: proj.visible ? 1 : 0.5,
              }}
            >
              {/* Drag handle / reorder */}
              <div className="flex flex-col gap-0.5">
                <button onClick={() => moveProject(proj.id, -1)} className="text-xs opacity-40 hover:opacity-100">▲</button>
                <GripVertical size={16} className="opacity-30" />
                <button onClick={() => moveProject(proj.id, 1)} className="text-xs opacity-40 hover:opacity-100">▼</button>
              </div>

              {/* Thumbnail */}
              <div className="w-16 h-12 rounded-lg overflow-hidden shrink-0" style={{ background: 'rgba(0,0,0,0.04)' }}>
                {proj.screenshot_url ? (
                  <img src={proj.screenshot_url} alt="" className="w-full h-full object-cover" />
                ) : proj.video_url ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <Video size={16} style={{ color: 'var(--text-light)' }} />
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Image size={16} style={{ color: 'var(--text-light)' }} />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm truncate" style={{ color: 'var(--charcoal)' }}>
                    {proj.name}
                  </span>
                  {proj.featured && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: 'rgba(13,138,111,0.1)', color: 'var(--teal)' }}>
                      FEATURED
                    </span>
                  )}
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase" style={{
                    background: proj.badge === 'live' ? 'rgba(13,138,111,0.1)' : 'rgba(232,97,77,0.1)',
                    color: proj.badge === 'live' ? 'var(--teal)' : 'var(--coral)',
                  }}>
                    {proj.badge}
                  </span>
                  <span className="w-3 h-3 rounded-full" style={{ background: COLOR_MAP[proj.color] || '#999' }} />
                </div>
                <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-light)' }}>{proj.category} · {proj.url_display}</p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button onClick={() => toggleVisibility(proj)} className="p-2 rounded-xl hover:bg-black/5 transition-colors" title={proj.visible ? 'Masquer' : 'Afficher'}>
                  {proj.visible ? <Eye size={16} style={{ color: 'var(--teal)' }} /> : <EyeOff size={16} style={{ color: 'var(--text-light)' }} />}
                </button>
                <button onClick={() => { setEditing(proj); setIsNew(false); }} className="p-2 rounded-xl hover:bg-black/5 transition-colors">
                  <Pencil size={16} style={{ color: 'var(--text-mid)' }} />
                </button>
                <button onClick={() => deleteProject(proj.id)} className="p-2 rounded-xl hover:bg-red-50 transition-colors">
                  <Trash2 size={16} style={{ color: 'var(--coral)' }} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Edit modal */}
        {editing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }}>
            <div
              className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-8"
              style={{
                background: 'var(--cream)',
                border: '1px solid rgba(255,255,255,0.5)',
                boxShadow: '0 32px 80px rgba(0,0,0,0.15)',
              }}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 style={{ fontFamily: 'var(--font-h)', fontSize: 22, color: 'var(--charcoal)' }}>
                  {isNew ? 'Nouveau projet' : `Modifier — ${editing.name}`}
                </h2>
                <button onClick={() => { setEditing(null); setIsNew(false); }} className="p-2 rounded-xl hover:bg-black/5">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-mid)' }}>Nom</label>
                    <input style={inputStyle} value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-mid)' }}>Catégorie</label>
                    <input style={inputStyle} value={editing.category} onChange={e => setEditing({ ...editing, category: e.target.value })} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-mid)' }}>URL</label>
                    <input style={inputStyle} value={editing.url} onChange={e => setEditing({ ...editing, url: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-mid)' }}>URL Display</label>
                    <input style={inputStyle} value={editing.url_display} onChange={e => setEditing({ ...editing, url_display: e.target.value })} />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-mid)' }}>Badge</label>
                    <select style={inputStyle} value={editing.badge} onChange={e => setEditing({ ...editing, badge: e.target.value })}>
                      <option value="live">Live</option>
                      <option value="demo">Démo</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-mid)' }}>Couleur</label>
                    <div className="flex gap-2 mt-2">
                      {COLORS.map(c => (
                        <button
                          key={c}
                          onClick={() => setEditing({ ...editing, color: c })}
                          className="w-7 h-7 rounded-full transition-all"
                          style={{
                            background: COLOR_MAP[c],
                            outline: editing.color === c ? `3px solid ${COLOR_MAP[c]}` : 'none',
                            outlineOffset: 2,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 pt-5">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold" style={{ color: 'var(--text-mid)' }}>
                      <input type="checkbox" checked={editing.featured} onChange={e => setEditing({ ...editing, featured: e.target.checked })} />
                      Featured
                    </label>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-mid)' }}>Screenshot URL</label>
                  <input style={inputStyle} value={editing.screenshot_url || ''} onChange={e => setEditing({ ...editing, screenshot_url: e.target.value || null })} placeholder="/projects/mon-projet.png" />
                </div>

                <div>
                  <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-mid)' }}>Vidéo URL (optionnel — remplace le screenshot)</label>
                  <input style={inputStyle} value={editing.video_url || ''} onChange={e => setEditing({ ...editing, video_url: e.target.value || null })} placeholder="https://..." />
                </div>

                <div>
                  <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-mid)' }}>Description FR</label>
                  <textarea style={{ ...inputStyle, minHeight: 60 }} value={editing.description_fr} onChange={e => setEditing({ ...editing, description_fr: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-mid)' }}>Description EN</label>
                  <textarea style={{ ...inputStyle, minHeight: 60 }} value={editing.description_en} onChange={e => setEditing({ ...editing, description_en: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-mid)' }}>Description DE</label>
                  <textarea style={{ ...inputStyle, minHeight: 60 }} value={editing.description_de} onChange={e => setEditing({ ...editing, description_de: e.target.value })} />
                </div>

                {/* Tags FR */}
                <div>
                  <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-mid)' }}>Tags FR</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {editing.tags.map((tag, i) => (
                      <span key={i} className="inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full" style={{ background: 'rgba(0,0,0,0.05)', color: 'var(--text-mid)' }}>
                        {tag}
                        <button onClick={() => removeTag('tags', i)} className="hover:text-red-500"><X size={12} /></button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input style={{ ...inputStyle, flex: 1 }} value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())} placeholder="Ajouter un tag FR..." />
                    <button onClick={addTag} className="px-4 py-2 rounded-xl text-sm font-semibold" style={{ background: 'rgba(0,0,0,0.05)' }}>+</button>
                  </div>
                </div>

                {/* Tags EN */}
                <div>
                  <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-mid)' }}>Tags EN</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {editing.tags_en.map((tag, i) => (
                      <span key={i} className="inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full" style={{ background: 'rgba(0,0,0,0.05)', color: 'var(--text-mid)' }}>
                        {tag}
                        <button onClick={() => removeTag('tags_en', i)} className="hover:text-red-500"><X size={12} /></button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input style={{ ...inputStyle, flex: 1 }} value={tagEnInput} onChange={e => setTagEnInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTagEn())} placeholder="Add EN tag..." />
                    <button onClick={addTagEn} className="px-4 py-2 rounded-xl text-sm font-semibold" style={{ background: 'rgba(0,0,0,0.05)' }}>+</button>
                  </div>
                </div>

                {/* Tags DE */}
                <div>
                  <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-mid)' }}>Tags DE</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {editing.tags_de.map((tag, i) => (
                      <span key={i} className="inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full" style={{ background: 'rgba(0,0,0,0.05)', color: 'var(--text-mid)' }}>
                        {tag}
                        <button onClick={() => removeTag('tags_de', i)} className="hover:text-red-500"><X size={12} /></button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input style={{ ...inputStyle, flex: 1 }} value={tagDeInput} onChange={e => setTagDeInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTagDe())} placeholder="DE-Tag hinzufügen..." />
                    <button onClick={addTagDe} className="px-4 py-2 rounded-xl text-sm font-semibold" style={{ background: 'rgba(0,0,0,0.05)' }}>+</button>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-4" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                  <button
                    onClick={() => { setEditing(null); setIsNew(false); }}
                    className="px-6 py-2.5 rounded-full text-sm font-semibold transition-all hover:bg-black/5"
                    style={{ color: 'var(--text-mid)' }}
                  >
                    Annuler
                  </button>
                  <button
                    onClick={save}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold text-white transition-all hover:scale-[1.03]"
                    style={{ background: 'var(--teal)' }}
                  >
                    <Save size={16} /> Enregistrer
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPortfolio;
