import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Search, Layout, Copy, Trash2, Edit, X, Sparkles, Smartphone, Palette, Upload, Image, FileCode, Download } from 'lucide-react';
import { TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED, TEAL, CORAL, GOLD, PURPLE } from '@/lib/adminTheme';

const CATEGORIES = [
  { value: 'beauty', label: 'Beauté', color: '#E8739A' },
  { value: 'coiffeur', label: 'Coiffeur', color: '#4da6d9' },
  { value: 'restaurant', label: 'Restaurant', color: '#F0C95C' },
  { value: 'nail', label: 'Nail Studio', color: '#F07067' },
  { value: 'spa', label: 'Spa', color: '#2DD4B8' },
  { value: 'barber', label: 'Barber', color: '#7c5cbf' },
  { value: 'fitness', label: 'Fitness', color: '#FF8C42' },
  { value: 'other', label: 'Autre', color: '#8896A6' },
];

const COLOR_PRESETS = [
  { label: 'Teal', value: '#2DD4B8' },
  { label: 'Gold', value: '#E9C46A' },
  { label: 'Coral', value: '#F07067' },
  { label: 'Purple', value: '#7c5cbf' },
  { label: 'Bleu', value: '#4da6d9' },
  { label: 'Rose', value: '#E8739A' },
];

const PROMPT_PRESETS = [
  { label: '🧘 Zen & Spa', text: 'STYLE : Zen et relaxant, tons naturels, bois et pierre. PHOTOS : Bougies, serviettes, plantes vertes, éclairage tamisé. TEXTES : Ton apaisant, professionnel, focus bien-être. AMBIANCE : Sérénité et luxe discret.' },
  { label: '💎 Luxe', text: 'STYLE : Haut de gamme et exclusif, finitions dorées et marbres. PHOTOS : Éclairage dramatique, intérieur design. TEXTES : Sophistiqué, clientèle premium. AMBIANCE : Exclusivité et prestige.' },
  { label: '🌸 Frais & Moderne', text: 'STYLE : Frais et contemporain, couleurs vives et pastels. PHOTOS : Lumineuses, jeunes, dynamiques. TEXTES : Ton fun et accessible. AMBIANCE : Énergie positive et modernité.' },
  { label: '🏠 Chaleureux', text: 'STYLE : Familial et chaleureux, décor cosy et accueillant. PHOTOS : Lumière naturelle, sourires, authenticité. TEXTES : Ton amical. AMBIANCE : Comme à la maison.' },
  { label: '🖤 Minimaliste', text: 'STYLE : Épuré et minimaliste, noir et blanc avec touches de couleur. PHOTOS : Architecturales, géométriques. TEXTES : Précis et élégant. AMBIANCE : Sophistication sobre.' },
  { label: '🎯 Résultats', text: 'STYLE : Orienté résultats et performance. PHOTOS : Avant/après, preuves visuelles. TEXTES : Chiffres, témoignages, confiance. AMBIANCE : Professionnalisme et efficacité.' },
];

const GlassCard = ({ children, style, className = '', onClick }: any) => (
  <div className={className} onClick={onClick} style={{
    background: 'rgba(255,255,255,0.20)', backdropFilter: 'blur(20px) saturate(1.4)',
    WebkitBackdropFilter: 'blur(20px) saturate(1.4)', borderRadius: 16,
    border: '1px solid rgba(255,255,255,0.30)', ...style,
  }}>{children}</div>
);

type Template = {
  id: string; name: string; category: string; description: string | null;
  style_prompt: string | null; jsx_file_url: string | null; screenshots: string[];
  preview_url: string | null; default_services: string[]; default_opening_hours: any;
  primary_color: string; secondary_color: string; hero_media_type: string;
  hero_media_url: string | null; gallery_images: string[]; tagline: string | null;
  style_tags: string[]; is_active: boolean; sort_order: number;
  created_at: string; updated_at: string;
};

const AdminTemplates = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [detailTemplate, setDetailTemplate] = useState<Template | null>(null);
  const [demoCounts, setDemoCounts] = useState<Record<string, number>>({});

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('demo_templates').select('*').order('sort_order');
    if (!error && data) {
      setTemplates(data.map((t: any) => ({
        ...t,
        screenshots: Array.isArray(t.screenshots) ? t.screenshots : [],
        default_services: Array.isArray(t.default_services) ? t.default_services : [],
        gallery_images: Array.isArray(t.gallery_images) ? t.gallery_images : [],
        style_tags: Array.isArray(t.style_tags) ? t.style_tags : [],
      })));
    }
    const { data: demos } = await supabase.from('demos').select('template_id');
    if (demos) {
      const counts: Record<string, number> = {};
      demos.forEach((d: any) => { if (d.template_id) counts[d.template_id] = (counts[d.template_id] || 0) + 1; });
      setDemoCounts(counts);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  const filtered = templates.filter(t => {
    if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
    if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const catCounts = CATEGORIES.map(c => ({
    ...c, count: templates.filter(t => t.category === c.value && t.is_active).length,
  }));

  const deleteTemplate = async (id: string) => {
    if (!confirm('Supprimer ce template ?')) return;
    await supabase.from('demo_templates').delete().eq('id', id);
    toast.success('Template supprimé');
    fetchTemplates();
  };

  const duplicateTemplate = async (t: Template) => {
    const { id, created_at, updated_at, ...rest } = t;
    await supabase.from('demo_templates').insert({ ...rest, name: `${t.name} (copie)` } as any);
    toast.success('Template dupliqué');
    fetchTemplates();
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: 10,
    border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.2)',
    fontSize: 14, color: TEXT_PRIMARY, outline: 'none',
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: TEXT_PRIMARY, fontFamily: "'Playfair Display', serif" }}>
            Templates de démo
          </h1>
          <p style={{ fontSize: 13, color: TEXT_SECONDARY }}>{templates.length} templates • {templates.filter(t => t.is_active).length} actifs</p>
        </div>
        <button onClick={() => { setEditingTemplate(null); setShowForm(true); }}
          style={{
            padding: '10px 20px', borderRadius: 12, border: 'none', cursor: 'pointer',
            background: `linear-gradient(135deg, ${TEAL}, #2A9D8F)`, color: '#fff',
            fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6,
          }}>
          <Plus size={16} /> Nouveau template
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {catCounts.filter(c => c.count > 0).map(c => (
          <GlassCard key={c.value} style={{ padding: '8px 16px', cursor: 'pointer', borderColor: categoryFilter === c.value ? c.color : undefined }}
            onClick={() => setCategoryFilter(categoryFilter === c.value ? 'all' : c.value)}>
            <div className="flex items-center gap-2">
              <div style={{ width: 8, height: 8, borderRadius: 99, background: c.color }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY }}>{c.label}</span>
              <span style={{ fontSize: 12, color: TEXT_MUTED, fontWeight: 700 }}>{c.count}</span>
            </div>
          </GlassCard>
        ))}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: TEXT_MUTED }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..."
            style={{ ...inputStyle, paddingLeft: 36 }} />
        </div>
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} style={{ ...inputStyle, width: 'auto' }}>
          <option value="all">Toutes catégories</option>
          {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: TEXT_MUTED }}>Chargement...</div>
      ) : filtered.length === 0 ? (
        <GlassCard style={{ padding: 40, textAlign: 'center' }}>
          <Layout size={40} style={{ color: TEXT_MUTED, margin: '0 auto 12px' }} />
          <p style={{ color: TEXT_SECONDARY, fontSize: 15 }}>Aucun template trouvé</p>
          <p style={{ color: TEXT_MUTED, fontSize: 13, marginTop: 4 }}>Créez votre premier template pour accélérer la création de démos</p>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(t => {
            const cat = CATEGORIES.find(c => c.value === t.category);
            const hasColors = t.primary_color !== '#2DD4B8' || t.secondary_color !== '#E9C46A';
            return (
              <GlassCard key={t.id} className="group cursor-pointer transition-all duration-300 hover:scale-[1.02]"
                style={{ overflow: 'hidden', position: 'relative' }}
                onClick={() => setDetailTemplate(t)}>
                <div style={{
                  position: 'absolute', inset: -1, borderRadius: 16, opacity: 0, transition: 'opacity 0.3s',
                  boxShadow: `0 0 30px ${t.primary_color}40`, pointerEvents: 'none',
                }} className="group-hover:!opacity-100" />

                <div style={{ height: 8, background: `linear-gradient(90deg, ${t.primary_color}, ${t.secondary_color})` }} />

                <div style={{ padding: 16 }}>
                  <div className="flex items-center gap-2 mb-2">
                    {cat && (
                      <span style={{ padding: '2px 8px', borderRadius: 6, background: `${cat.color}20`, color: cat.color, fontSize: 11, fontWeight: 600 }}>
                        {cat.label}
                      </span>
                    )}
                    {hasColors && <Palette size={12} style={{ color: t.primary_color }} />}
                    <span style={{ fontSize: 11, color: TEXT_MUTED, marginLeft: 'auto' }}>
                      {demoCounts[t.id] || 0} démos
                    </span>
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: TEXT_PRIMARY, marginBottom: 6 }}>{t.name}</h3>
                  {t.style_prompt && (
                    <p style={{ fontSize: 12, color: TEXT_SECONDARY, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {t.style_prompt}
                    </p>
                  )}
                  {!t.is_active && (
                    <span style={{ display: 'inline-block', marginTop: 6, padding: '2px 8px', borderRadius: 6, background: 'rgba(0,0,0,0.08)', color: TEXT_MUTED, fontSize: 10, fontWeight: 600 }}>
                      Inactif
                    </span>
                  )}
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      {detailTemplate && (
        <TemplateDetailModal template={detailTemplate} demoCount={demoCounts[detailTemplate.id] || 0}
          onClose={() => setDetailTemplate(null)}
          onEdit={() => { setEditingTemplate(detailTemplate); setShowForm(true); setDetailTemplate(null); }}
          onDuplicate={() => { duplicateTemplate(detailTemplate); setDetailTemplate(null); }}
          onDelete={() => { deleteTemplate(detailTemplate.id); setDetailTemplate(null); }}
        />
      )}

      {showForm && (
        <TemplateFormModal template={editingTemplate} onClose={() => { setShowForm(false); setEditingTemplate(null); }}
          onSaved={() => { setShowForm(false); setEditingTemplate(null); fetchTemplates(); }} />
      )}
    </div>
  );
};

const TemplateDetailModal = ({ template: t, demoCount, onClose, onEdit, onDuplicate, onDelete }: {
  template: Template; demoCount: number; onClose: () => void; onEdit: () => void;
  onDuplicate: () => void; onDelete: () => void;
}) => {
  const [demos, setDemos] = useState<any[]>([]);
  const cat = CATEGORIES.find(c => c.value === t.category);
  const hasColors = t.primary_color !== '#2DD4B8' || t.secondary_color !== '#E9C46A';

  useEffect(() => {
    supabase.from('demos').select('id, business_name, status, viewed_count, created_at')
      .eq('template_id', t.id).order('created_at', { ascending: false }).limit(20)
      .then(({ data }) => setDemos(data || []));
  }, [t.id]);

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4" style={{
        background: 'rgba(255,255,255,0.20)', backdropFilter: 'blur(24px) saturate(1.4)',
        WebkitBackdropFilter: 'blur(24px) saturate(1.4)', borderRadius: 20,
        border: '1px solid rgba(255,255,255,0.30)',
      }}>
        <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
          <div>
            <div className="flex items-center gap-2">
              {cat && <span style={{ padding: '2px 8px', borderRadius: 6, background: `${cat.color}20`, color: cat.color, fontSize: 11, fontWeight: 600 }}>{cat.label}</span>}
              <h2 style={{ fontSize: 22, fontWeight: 700, color: TEXT_PRIMARY, fontFamily: "'Playfair Display', serif" }}>{t.name}</h2>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: TEXT_SECONDARY }}><X size={20} /></button>
        </div>

        <div className="p-5 space-y-5">
          <div className="flex flex-wrap gap-2">
            <button onClick={onEdit} style={{ padding: '8px 16px', borderRadius: 10, border: 'none', background: `${TEAL}20`, color: TEAL, fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Edit size={14} /> Modifier
            </button>
            <button onClick={onDuplicate} style={{ padding: '8px 16px', borderRadius: 10, border: 'none', background: `${PURPLE}20`, color: PURPLE, fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Copy size={14} /> Dupliquer
            </button>
            <button onClick={onDelete} style={{ padding: '8px 16px', borderRadius: 10, border: 'none', background: `${CORAL}15`, color: CORAL, fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto' }}>
              <Trash2 size={14} /> Supprimer
            </button>
          </div>

          {hasColors && (
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: TEXT_SECONDARY, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Palette size={14} /> Couleurs suggérées
              </p>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div style={{ width: 24, height: 24, borderRadius: 6, background: t.primary_color }} />
                  <span style={{ fontSize: 12, color: TEXT_MUTED, fontFamily: 'monospace' }}>{t.primary_color}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div style={{ width: 24, height: 24, borderRadius: 6, background: t.secondary_color }} />
                  <span style={{ fontSize: 12, color: TEXT_MUTED, fontFamily: 'monospace' }}>{t.secondary_color}</span>
                </div>
              </div>
            </div>
          )}

          {t.style_prompt && (
            <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: 16, border: '1px solid rgba(255,255,255,0.2)' }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: TEXT_PRIMARY, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Sparkles size={14} style={{ color: GOLD }} /> Prompt créatif
              </p>
              <p style={{ fontSize: 13, color: TEXT_PRIMARY, whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{t.style_prompt}</p>
            </div>
          )}

          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: TEXT_PRIMARY, marginBottom: 8 }}>
              Démos créées ({demoCount})
            </p>
            {demos.length === 0 ? (
              <p style={{ fontSize: 13, color: TEXT_MUTED }}>Aucune démo créée avec ce template</p>
            ) : (
              <div className="space-y-1">
                {demos.map(d => (
                  <div key={d.id} className="flex items-center gap-3" style={{ padding: '6px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.1)' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY, flex: 1 }}>{d.business_name}</span>
                    <span style={{
                      padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                      background: d.status === 'converted' ? `${TEAL}20` : d.status === 'viewed' ? `${GOLD}20` : 'rgba(0,0,0,0.06)',
                      color: d.status === 'converted' ? TEAL : d.status === 'viewed' ? '#B8941E' : TEXT_MUTED,
                    }}>{d.status}</span>
                    <span style={{ fontSize: 11, color: TEXT_MUTED }}>{d.viewed_count} vues</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const TemplateFormModal = ({ template, onClose, onSaved }: { template: Template | null; onClose: () => void; onSaved: () => void }) => {
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(template?.name || '');
  const [category, setCategory] = useState(template?.category || 'beauty');
  const [stylePrompt, setStylePrompt] = useState(template?.style_prompt || '');
  const [isActive, setIsActive] = useState(template?.is_active ?? true);

  // Colors
  const hasExistingColors = template ? (template.primary_color !== '#2DD4B8' || template.secondary_color !== '#E9C46A') : false;
  const [colorsEnabled, setColorsEnabled] = useState(hasExistingColors);
  const [primaryColor, setPrimaryColor] = useState(template?.primary_color || '#2DD4B8');
  const [secondaryColor, setSecondaryColor] = useState(template?.secondary_color || '#E9C46A');

  // Reference photos & JSX
  const [screenshots, setScreenshots] = useState<string[]>(template?.screenshots || []);
  const [jsxFileUrl, setJsxFileUrl] = useState(template?.jsx_file_url || '');
  const [uploading, setUploading] = useState(false);

  const uploadFile = async (file: File, prefix: string) => {
    const ext = file.name.split('.').pop();
    const path = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from('demo-templates').upload(path, file);
    if (error) { toast.error('Erreur upload'); return null; }
    const { data: { publicUrl } } = supabase.storage.from('demo-templates').getPublicUrl(path);
    return publicUrl;
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      const url = await uploadFile(file, 'ref');
      if (url) setScreenshots(prev => [...prev, url]);
    }
    setUploading(false);
    toast.success('Photos de référence ajoutées');
  };

  const handleJsxUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const url = await uploadFile(file, 'jsx');
    if (url) { setJsxFileUrl(url); toast.success('Fichier JSX uploadé'); }
    setUploading(false);
  };

  const save = async () => {
    if (!name.trim()) { toast.error('Nom requis'); return; }
    if (!stylePrompt.trim()) { toast.error('Le prompt est requis — c\'est le cœur du template'); return; }
    setSaving(true);

    const payload = {
      name,
      category,
      style_prompt: stylePrompt,
      is_active: isActive,
      primary_color: colorsEnabled ? primaryColor : '#2DD4B8',
      secondary_color: colorsEnabled ? secondaryColor : '#E9C46A',
      screenshots,
      jsx_file_url: jsxFileUrl || null,
      description: null,
      preview_url: null,
      default_services: [] as string[],
      default_opening_hours: {},
      hero_media_type: 'none',
      hero_media_url: null,
      gallery_images: [] as string[],
      tagline: null,
      style_tags: [] as string[],
      sort_order: template?.sort_order || 0,
    };

    if (template?.id) {
      const { error } = await supabase.from('demo_templates').update(payload as any).eq('id', template.id);
      if (error) { toast.error('Erreur mise à jour'); setSaving(false); return; }
      toast.success('Template mis à jour');
    } else {
      const { error } = await supabase.from('demo_templates').insert(payload as any);
      if (error) { toast.error('Erreur création'); setSaving(false); return; }
      toast.success('Template créé !');
    }
    setSaving(false);
    onSaved();
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: 10,
    border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.2)',
    fontSize: 14, color: TEXT_PRIMARY, outline: 'none',
  };
  const labelStyle: React.CSSProperties = {
    fontSize: 13, fontWeight: 600, color: TEXT_SECONDARY, marginBottom: 4, display: 'block',
  };

  const promptLength = stylePrompt.trim().length;
  const promptQuality = promptLength === 0 ? null : promptLength < 50 ? 'basic' : promptLength < 150 ? 'bon' : 'excellent';
  const promptColor = promptQuality === 'excellent' ? TEAL : promptQuality === 'bon' ? GOLD : CORAL;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4" style={{
        background: 'rgba(255,255,255,0.20)', backdropFilter: 'blur(24px) saturate(1.4)',
        WebkitBackdropFilter: 'blur(24px) saturate(1.4)', borderRadius: 20,
        border: '1px solid rgba(255,255,255,0.30)',
      }}>
        <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: TEXT_PRIMARY, fontFamily: "'Playfair Display', serif" }}>
            {template ? 'Modifier le template' : 'Nouveau template'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: TEXT_SECONDARY }}><X size={20} /></button>
        </div>

        <div className="p-5 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={labelStyle}>Nom *</label>
              <input value={name} onChange={e => setName(e.target.value)} style={inputStyle} placeholder="Luxus Beauty Salon" />
            </div>
            <div>
              <label style={labelStyle}>Catégorie</label>
              <select value={category} onChange={e => setCategory(e.target.value)} style={inputStyle}>
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Sparkles size={14} style={{ color: GOLD }} />
              Prompt créatif *
              <span style={{ fontSize: 11, color: TEXT_MUTED, fontWeight: 400 }}>— Ce prompt pilote tout le design de la démo</span>
            </label>

            <div className="flex flex-wrap gap-1.5 mb-3">
              {PROMPT_PRESETS.map(p => (
                <button key={p.label} onClick={() => setStylePrompt(prev => prev ? `${prev}\n\n${p.text}` : p.text)}
                  style={{
                    padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer',
                    border: 'none', background: 'rgba(0,0,0,0.06)', color: TEXT_SECONDARY,
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = `${GOLD}20`; e.currentTarget.style.color = '#B8941E'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.06)'; e.currentTarget.style.color = TEXT_SECONDARY; }}
                >{p.label}</button>
              ))}
            </div>

            <textarea value={stylePrompt} onChange={e => setStylePrompt(e.target.value)}
              style={{ ...inputStyle, minHeight: 200, lineHeight: 1.7, fontFamily: 'inherit' }}
              placeholder="Décrivez le style, l'ambiance, les photos, les textes, le ton de voix, les couleurs d'ambiance, les types de services à mettre en avant, l'atmosphère générale...

Exemple : STYLE : Zen et relaxant, tons naturels. PHOTOS : Éclairage tamisé, bougies, plantes. TEXTES : Ton apaisant et professionnel. AMBIANCE : Luxe discret et sérénité."
            />

            {promptQuality && (
              <div className="flex items-center gap-2 mt-2">
                <div style={{ flex: 1, height: 3, borderRadius: 99, background: 'rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 99, background: promptColor, transition: 'width 0.3s',
                    width: promptQuality === 'excellent' ? '100%' : promptQuality === 'bon' ? '60%' : '25%',
                  }} />
                </div>
                <span style={{ fontSize: 11, color: promptColor, fontWeight: 600 }}>
                  {promptQuality === 'excellent' ? '✨ Excellent' : promptQuality === 'bon' ? '👍 Bon' : '⚡ Basic'}
                </span>
              </div>
            )}
          </div>

          {/* Reference photos */}
          <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 14, border: '1px solid rgba(255,255,255,0.15)' }}>
            <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <Image size={14} style={{ color: TEAL }} />
              Photos de référence
              <span style={{ fontSize: 11, color: TEXT_MUTED, fontWeight: 400 }}>— Inspirations visuelles pour guider l'IA</span>
            </label>
            {screenshots.length > 0 && (
              <div className="flex gap-2 flex-wrap mb-3">
                {screenshots.map((url, i) => (
                  <div key={i} className="relative group/img">
                    <img src={url} alt="" style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)' }} />
                    <button onClick={() => setScreenshots(prev => prev.filter((_, j) => j !== i))}
                      className="absolute -top-1 -right-1 opacity-0 group-hover/img:opacity-100" style={{
                        width: 18, height: 18, borderRadius: 99, background: CORAL, border: 'none', cursor: 'pointer',
                        color: '#fff', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}><X size={10} /></button>
                  </div>
                ))}
              </div>
            )}
            <label style={{ ...inputStyle, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, width: 'auto', padding: '8px 14px', fontSize: 13 }}>
              <Upload size={14} /> {screenshots.length > 0 ? 'Ajouter' : 'Upload photos'}
              <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} style={{ display: 'none' }} />
            </label>
            {uploading && <span style={{ fontSize: 12, color: TEXT_MUTED, marginLeft: 8 }}>Upload en cours...</span>}
          </div>

          {/* JSX file */}
          <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 14, border: '1px solid rgba(255,255,255,0.15)' }}>
            <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <FileCode size={14} style={{ color: PURPLE }} />
              Fichier JSX
              <span style={{ fontSize: 11, color: TEXT_MUTED, fontWeight: 400 }}>— Composant React de référence pour le design</span>
            </label>
            <div className="flex items-center gap-3">
              {jsxFileUrl && (
                <span style={{ fontSize: 12, color: TEAL, display: 'flex', alignItems: 'center', gap: 4 }}>
                  ✓ Fichier uploadé
                  <button onClick={() => setJsxFileUrl('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: CORAL, padding: 0 }}>
                    <X size={12} />
                  </button>
                </span>
              )}
              <label style={{ ...inputStyle, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, width: 'auto', padding: '8px 14px', fontSize: 13 }}>
                <Upload size={14} /> {jsxFileUrl ? 'Remplacer' : 'Upload JSX'}
                <input type="file" accept=".jsx,.tsx,.js,.ts" onChange={handleJsxUpload} style={{ display: 'none' }} />
              </label>
            </div>
          </div>

            <label className="flex items-center gap-3 cursor-pointer" onClick={() => setColorsEnabled(!colorsEnabled)}>
              <div style={{
                width: 40, height: 22, borderRadius: 99, position: 'relative', cursor: 'pointer', transition: 'background 0.2s',
                background: colorsEnabled ? TEAL : 'rgba(0,0,0,0.15)',
              }}>
                <div style={{
                  width: 18, height: 18, borderRadius: 99, background: '#fff', position: 'absolute', top: 2, transition: 'left 0.2s',
                  left: colorsEnabled ? 20 : 2, boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                }} />
              </div>
              <div>
                <span style={{ fontSize: 14, fontWeight: 600, color: TEXT_PRIMARY, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Palette size={14} /> Couleurs prédéfinies
                </span>
                <span style={{ fontSize: 12, color: TEXT_MUTED }}>
                  {colorsEnabled ? 'Les couleurs du template seront suggérées lors de la création de la démo' : 'Les couleurs seront choisies lors de la création de la démo'}
                </span>
              </div>
            </label>

            {colorsEnabled && (
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label style={labelStyle}>Couleur principale</label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {COLOR_PRESETS.map(c => (
                      <button key={c.value} onClick={() => setPrimaryColor(c.value)}
                        style={{
                          width: 28, height: 28, borderRadius: 8, background: c.value, border: primaryColor === c.value ? '2px solid rgba(0,0,0,0.4)' : '2px solid transparent',
                          cursor: 'pointer', transition: 'border 0.15s',
                        }} />
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)}
                      style={{ width: 32, height: 32, borderRadius: 6, border: 'none', cursor: 'pointer' }} />
                    <input value={primaryColor} onChange={e => setPrimaryColor(e.target.value)}
                      style={{ ...inputStyle, width: 100, fontFamily: 'monospace', fontSize: 13 }} />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Couleur secondaire</label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {COLOR_PRESETS.map(c => (
                      <button key={c.value} onClick={() => setSecondaryColor(c.value)}
                        style={{
                          width: 28, height: 28, borderRadius: 8, background: c.value, border: secondaryColor === c.value ? '2px solid rgba(0,0,0,0.4)' : '2px solid transparent',
                          cursor: 'pointer', transition: 'border 0.15s',
                        }} />
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="color" value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)}
                      style={{ width: 32, height: 32, borderRadius: 6, border: 'none', cursor: 'pointer' }} />
                    <input value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)}
                      style={{ ...inputStyle, width: 100, fontFamily: 'monospace', fontSize: 13 }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} />
            <span style={{ fontSize: 13, color: TEXT_SECONDARY }}>Template actif</span>
          </label>

          <div className="flex items-center justify-end gap-3 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.15)' }}>
            <button onClick={onClose} style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: 'rgba(0,0,0,0.06)', color: TEXT_SECONDARY, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
              Annuler
            </button>
            <button onClick={save} disabled={saving} style={{
              padding: '10px 24px', borderRadius: 10, border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
              background: `linear-gradient(135deg, ${TEAL}, #2A9D8F)`, color: '#fff',
              fontWeight: 600, fontSize: 14, opacity: saving ? 0.6 : 1,
            }}>
              {saving ? 'Enregistrement...' : template ? 'Mettre à jour' : 'Créer le template'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminTemplates;
