import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Search, Filter, Layout, Eye, Copy, Trash2, Edit, Download, ExternalLink, Smartphone, X, ChevronRight, ChevronLeft, Upload, Sparkles } from 'lucide-react';
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

const STYLE_TAG_OPTIONS = ['zen', 'luxe', 'moderne', 'chaleureux', 'minimaliste', 'résultats', 'frais', 'élégant', 'dramatique', 'naturel', 'premium', 'cosy'];

const DEFAULT_SERVICES: Record<string, string[]> = {
  beauty: ['Gesichtsbehandlung', 'Maniküre', 'Pediküre', 'Waxing', 'Massage'],
  coiffeur: ['Haarschnitt', 'Färben', 'Styling', 'Bartpflege', 'Waschen & Föhnen'],
  restaurant: ['Frühstück', 'Mittagsmenü', 'Abendessen', 'Lieferung'],
  nail: ['Maniküre', 'Pediküre', 'Gel-Nägel', 'Nail Art', 'Acryl'],
  spa: ['Massage', 'Sauna', 'Gesichtsbehandlung', 'Körperpeeling', 'Aromatherapie'],
  barber: ['Haarschnitt', 'Bartpflege', 'Rasur', 'Styling', 'Haarkur'],
  fitness: ['Personal Training', 'Gruppenkurse', 'Ernährungsberatung', 'Yoga'],
  other: ['Service 1', 'Service 2', 'Service 3'],
};

const DAYS = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];

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

const HERO_TYPES = [
  { value: 'none', label: 'Aucun' },
  { value: 'photo', label: 'Photo' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'mp4', label: 'Vidéo MP4' },
  { value: 'ai_generated', label: 'Générer par IA' },
];

const GlassCard = ({ children, style, className = '' }: any) => (
  <div className={className} style={{
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
    // Fetch demo counts per template
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
  const labelStyle: React.CSSProperties = {
    fontSize: 13, fontWeight: 600, color: TEXT_SECONDARY, marginBottom: 4, display: 'block',
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
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

      {/* Category stats */}
      <div className="flex flex-wrap gap-2">
        {catCounts.filter(c => c.count > 0).map(c => (
          <GlassCard key={c.value} style={{ padding: '8px 16px', cursor: 'pointer', borderColor: categoryFilter === c.value ? c.color : undefined }}
            className={categoryFilter === c.value ? '' : ''}
            onClick={() => setCategoryFilter(categoryFilter === c.value ? 'all' : c.value)}>
            <div className="flex items-center gap-2">
              <div style={{ width: 8, height: 8, borderRadius: 99, background: c.color }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY }}>{c.label}</span>
              <span style={{ fontSize: 12, color: TEXT_MUTED, fontWeight: 700 }}>{c.count}</span>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Search + filter */}
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

      {/* Grid */}
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
            return (
              <GlassCard key={t.id} className="group cursor-pointer transition-all duration-300 hover:scale-[1.02]"
                style={{ overflow: 'hidden', position: 'relative' }}
                onClick={() => setDetailTemplate(t)}>
                {/* Glow on hover */}
                <div style={{
                  position: 'absolute', inset: -1, borderRadius: 16, opacity: 0, transition: 'opacity 0.3s',
                  boxShadow: `0 0 30px ${t.primary_color}40`, pointerEvents: 'none',
                }} className="group-hover:!opacity-100" />

                {/* Screenshot */}
                <div style={{ height: 160, background: `linear-gradient(135deg, ${t.primary_color}20, ${t.secondary_color}20)`, position: 'relative' }}>
                  {t.screenshots[0] ? (
                    <img src={t.screenshots[0]} alt={t.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Layout size={40} style={{ color: t.primary_color, opacity: 0.4 }} />
                    </div>
                  )}
                  {!t.is_active && (
                    <div style={{ position: 'absolute', top: 8, right: 8, padding: '2px 8px', borderRadius: 6, background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: 10, fontWeight: 600 }}>
                      Inactif
                    </div>
                  )}
                </div>

                {/* Info */}
                <div style={{ padding: 16 }}>
                  <div className="flex items-center gap-2 mb-2">
                    {cat && (
                      <span style={{ padding: '2px 8px', borderRadius: 6, background: `${cat.color}20`, color: cat.color, fontSize: 11, fontWeight: 600 }}>
                        {cat.label}
                      </span>
                    )}
                    <span style={{ fontSize: 11, color: TEXT_MUTED, marginLeft: 'auto' }}>
                      {demoCounts[t.id] || 0} démos
                    </span>
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: TEXT_PRIMARY, marginBottom: 4 }}>{t.name}</h3>
                  {t.description && (
                    <p style={{ fontSize: 12, color: TEXT_SECONDARY, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {t.description}
                    </p>
                  )}
                  {t.style_tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {t.style_tags.slice(0, 4).map((tag, i) => (
                        <span key={i} style={{ padding: '1px 6px', borderRadius: 4, background: 'rgba(0,0,0,0.06)', fontSize: 10, color: TEXT_MUTED }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-3">
                    <div style={{ width: 16, height: 16, borderRadius: 4, background: t.primary_color, border: '1px solid rgba(0,0,0,0.1)' }} />
                    <div style={{ width: 16, height: 16, borderRadius: 4, background: t.secondary_color, border: '1px solid rgba(0,0,0,0.1)' }} />
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      {/* Detail modal */}
      {detailTemplate && (
        <TemplateDetailModal template={detailTemplate} demoCount={demoCounts[detailTemplate.id] || 0}
          onClose={() => setDetailTemplate(null)}
          onEdit={() => { setEditingTemplate(detailTemplate); setShowForm(true); setDetailTemplate(null); }}
          onDuplicate={() => { duplicateTemplate(detailTemplate); setDetailTemplate(null); }}
          onDelete={() => { deleteTemplate(detailTemplate.id); setDetailTemplate(null); }}
          onCreateDemo={() => { /* Will be handled via DemoFormModal */ setDetailTemplate(null); }}
        />
      )}

      {/* Form modal */}
      {showForm && (
        <TemplateFormModal template={editingTemplate} onClose={() => { setShowForm(false); setEditingTemplate(null); }}
          onSaved={() => { setShowForm(false); setEditingTemplate(null); fetchTemplates(); }} />
      )}
    </div>
  );
};

// ====== DETAIL MODAL ======
const TemplateDetailModal = ({ template: t, demoCount, onClose, onEdit, onDuplicate, onDelete, onCreateDemo }: {
  template: Template; demoCount: number; onClose: () => void; onEdit: () => void;
  onDuplicate: () => void; onDelete: () => void; onCreateDemo: () => void;
}) => {
  const [demos, setDemos] = useState<any[]>([]);
  const cat = CATEGORIES.find(c => c.value === t.category);

  useEffect(() => {
    supabase.from('demos').select('id, business_name, status, viewed_count, created_at')
      .eq('template_id', t.id).order('created_at', { ascending: false }).limit(20)
      .then(({ data }) => setDemos(data || []));
  }, [t.id]);

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto mx-4" style={{
        background: 'rgba(255,255,255,0.20)', backdropFilter: 'blur(24px) saturate(1.4)',
        WebkitBackdropFilter: 'blur(24px) saturate(1.4)', borderRadius: 20,
        border: '1px solid rgba(255,255,255,0.30)',
      }}>
        {/* Header */}
        <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
          <div>
            <div className="flex items-center gap-2">
              {cat && <span style={{ padding: '2px 8px', borderRadius: 6, background: `${cat.color}20`, color: cat.color, fontSize: 11, fontWeight: 600 }}>{cat.label}</span>}
              <h2 style={{ fontSize: 22, fontWeight: 700, color: TEXT_PRIMARY, fontFamily: "'Playfair Display', serif" }}>{t.name}</h2>
            </div>
            {t.description && <p style={{ fontSize: 13, color: TEXT_SECONDARY, marginTop: 4 }}>{t.description}</p>}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: TEXT_SECONDARY }}><X size={20} /></button>
        </div>

        <div className="p-5 space-y-5">
          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            <button onClick={onEdit} style={{ padding: '8px 16px', borderRadius: 10, border: 'none', background: `${TEAL}20`, color: TEAL, fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Edit size={14} /> Modifier
            </button>
            <button onClick={onDuplicate} style={{ padding: '8px 16px', borderRadius: 10, border: 'none', background: `${PURPLE}20`, color: PURPLE, fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Copy size={14} /> Dupliquer
            </button>
            <button onClick={onCreateDemo} style={{ padding: '8px 16px', borderRadius: 10, border: 'none', background: `${GOLD}20`, color: '#B8941E', fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Smartphone size={14} /> Créer une démo
            </button>
            {t.jsx_file_url && (
              <a href={t.jsx_file_url} download style={{ padding: '8px 16px', borderRadius: 10, border: 'none', background: 'rgba(0,0,0,0.06)', color: TEXT_SECONDARY, fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}>
                <Download size={14} /> Télécharger JSX
              </a>
            )}
            <button onClick={onDelete} style={{ padding: '8px 16px', borderRadius: 10, border: 'none', background: `${CORAL}15`, color: CORAL, fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto' }}>
              <Trash2 size={14} /> Supprimer
            </button>
          </div>

          {/* Screenshots gallery */}
          {t.screenshots.length > 0 && (
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: TEXT_PRIMARY, marginBottom: 8 }}>Screenshots</p>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {t.screenshots.map((url, i) => (
                  <img key={i} src={url} alt={`Screenshot ${i + 1}`} style={{
                    height: 180, borderRadius: 12, objectFit: 'cover', border: '1px solid rgba(255,255,255,0.3)',
                    flexShrink: 0,
                  }} />
                ))}
              </div>
            </div>
          )}

          {/* Colors & style */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: TEXT_SECONDARY, marginBottom: 6 }}>Couleurs</p>
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
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: TEXT_SECONDARY, marginBottom: 6 }}>Tags</p>
              <div className="flex flex-wrap gap-1">
                {t.style_tags.map((tag, i) => (
                  <span key={i} style={{ padding: '2px 8px', borderRadius: 6, background: 'rgba(0,0,0,0.06)', fontSize: 11, color: TEXT_SECONDARY }}>{tag}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Tagline */}
          {t.tagline && (
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: TEXT_SECONDARY, marginBottom: 4 }}>Tagline</p>
              <p style={{ fontSize: 15, color: TEXT_PRIMARY, fontStyle: 'italic' }}>"{t.tagline}"</p>
            </div>
          )}

          {/* Creative prompt */}
          {t.style_prompt && (
            <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: 14, border: '1px solid rgba(255,255,255,0.2)' }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: TEXT_SECONDARY, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Sparkles size={14} style={{ color: GOLD }} /> Prompt créatif
              </p>
              <p style={{ fontSize: 13, color: TEXT_PRIMARY, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{t.style_prompt}</p>
            </div>
          )}

          {/* Services */}
          {t.default_services.length > 0 && (
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: TEXT_SECONDARY, marginBottom: 6 }}>Services par défaut</p>
              <div className="flex flex-wrap gap-1.5">
                {t.default_services.map((s, i) => (
                  <span key={i} style={{ padding: '4px 10px', borderRadius: 8, background: `${t.primary_color}15`, color: TEXT_PRIMARY, fontSize: 12 }}>{s}</span>
                ))}
              </div>
            </div>
          )}

          {/* Demos using this template */}
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

// ====== FORM MODAL (Multi-step) ======
const TemplateFormModal = ({ template, onClose, onSaved }: { template: Template | null; onClose: () => void; onSaved: () => void }) => {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Step 1
  const [name, setName] = useState(template?.name || '');
  const [category, setCategory] = useState(template?.category || 'beauty');
  const [description, setDescription] = useState(template?.description || '');
  const [styleTags, setStyleTags] = useState<string[]>(template?.style_tags || []);
  const [sortOrder, setSortOrder] = useState(template?.sort_order || 0);
  const [isActive, setIsActive] = useState(template?.is_active ?? true);

  // Step 2
  const [jsxFileUrl, setJsxFileUrl] = useState(template?.jsx_file_url || '');
  const [screenshots, setScreenshots] = useState<string[]>(template?.screenshots || []);
  const [previewUrl, setPreviewUrl] = useState(template?.preview_url || '');
  const [primaryColor, setPrimaryColor] = useState(template?.primary_color || '#2DD4B8');
  const [secondaryColor, setSecondaryColor] = useState(template?.secondary_color || '#E9C46A');
  const [heroMediaType, setHeroMediaType] = useState(template?.hero_media_type || 'none');
  const [heroMediaUrl, setHeroMediaUrl] = useState(template?.hero_media_url || '');
  const [galleryImages, setGalleryImages] = useState<string[]>(template?.gallery_images || []);

  // Step 3
  const [tagline, setTagline] = useState(template?.tagline || '');
  const [defaultServices, setDefaultServices] = useState<string[]>(template?.default_services || []);
  const [newService, setNewService] = useState('');
  const [openingHours, setOpeningHours] = useState<Record<string, { open: string; close: string; closed: boolean }>>(
    template?.default_opening_hours && Object.keys(template.default_opening_hours).length > 0
      ? template.default_opening_hours
      : DAYS.reduce((acc, d) => ({ ...acc, [d]: { open: '09:00', close: '18:00', closed: d === 'Sonntag' } }), {})
  );

  // Step 4
  const [stylePrompt, setStylePrompt] = useState(template?.style_prompt || '');

  // Pre-fill services on category change (only for new templates)
  useEffect(() => {
    if (!template) {
      setDefaultServices(DEFAULT_SERVICES[category] || DEFAULT_SERVICES.other);
    }
  }, [category, template]);

  const uploadFile = async (file: File, prefix: string) => {
    const ext = file.name.split('.').pop();
    const path = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from('demo-templates').upload(path, file);
    if (error) { toast.error('Erreur upload'); return null; }
    const { data: { publicUrl } } = supabase.storage.from('demo-templates').getPublicUrl(path);
    return publicUrl;
  };

  const handleJsxUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadFile(file, 'jsx');
    if (url) { setJsxFileUrl(url); toast.success('Fichier JSX uploadé'); }
  };

  const handleScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (const file of Array.from(files)) {
      const url = await uploadFile(file, 'screenshot');
      if (url) setScreenshots(prev => [...prev, url]);
    }
    toast.success('Screenshots uploadés');
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (const file of Array.from(files)) {
      const url = await uploadFile(file, 'gallery');
      if (url) setGalleryImages(prev => [...prev, url]);
    }
    toast.success('Images ajoutées');
  };

  const handleHeroUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadFile(file, 'hero');
    if (url) { setHeroMediaUrl(url); toast.success('Média hero uploadé'); }
  };

  const save = async () => {
    if (!name.trim()) { toast.error('Nom requis'); return; }
    setSaving(true);
    const payload = {
      name, category, description: description || null, style_prompt: stylePrompt || null,
      jsx_file_url: jsxFileUrl || null, screenshots, preview_url: previewUrl || null,
      default_services: defaultServices, default_opening_hours: openingHours,
      primary_color: primaryColor, secondary_color: secondaryColor,
      hero_media_type: heroMediaType, hero_media_url: heroMediaUrl || null,
      gallery_images: galleryImages, tagline: tagline || null, style_tags: styleTags,
      is_active: isActive, sort_order: sortOrder,
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

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4" style={{
        background: 'rgba(255,255,255,0.20)', backdropFilter: 'blur(24px) saturate(1.4)',
        WebkitBackdropFilter: 'blur(24px) saturate(1.4)', borderRadius: 20,
        border: '1px solid rgba(255,255,255,0.30)',
      }}>
        {/* Header */}
        <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: TEXT_PRIMARY, fontFamily: "'Playfair Display', serif" }}>
            {template ? 'Modifier le template' : 'Nouveau template'}
          </h2>
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              {[1, 2, 3, 4].map(s => (
                <button key={s} onClick={() => setStep(s)} style={{
                  width: 28, height: 4, borderRadius: 99, border: 'none', cursor: 'pointer',
                  background: s <= step ? TEAL : 'rgba(0,0,0,0.1)', transition: 'background 0.2s',
                }} />
              ))}
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: TEXT_SECONDARY }}><X size={20} /></button>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* STEP 1: Infos */}
          {step === 1 && (
            <>
              <p style={{ fontSize: 16, fontWeight: 600, color: TEXT_PRIMARY }}>Infos du template</p>
              <div>
                <label style={labelStyle}>Nom *</label>
                <input value={name} onChange={e => setName(e.target.value)} style={inputStyle} placeholder="Luxus Beauty Salon" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label style={labelStyle}>Catégorie</label>
                  <select value={category} onChange={e => setCategory(e.target.value)} style={inputStyle}>
                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Ordre d'affichage</label>
                  <input type="number" value={sortOrder} onChange={e => setSortOrder(Number(e.target.value))} style={inputStyle} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Description</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} style={{ ...inputStyle, minHeight: 60 }} placeholder="Description courte du template..." />
              </div>
              <div>
                <label style={labelStyle}>Tags de style</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {STYLE_TAG_OPTIONS.map(tag => (
                    <button key={tag} onClick={() => setStyleTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])}
                      style={{
                        padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: 'none',
                        background: styleTags.includes(tag) ? `${TEAL}25` : 'rgba(0,0,0,0.06)',
                        color: styleTags.includes(tag) ? TEAL : TEXT_SECONDARY,
                      }}>{tag}</button>
                  ))}
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} />
                <span style={{ fontSize: 13, color: TEXT_SECONDARY }}>Template actif</span>
              </label>
            </>
          )}

          {/* STEP 2: Design & Assets */}
          {step === 2 && (
            <>
              <p style={{ fontSize: 16, fontWeight: 600, color: TEXT_PRIMARY }}>Design & Assets</p>

              {/* JSX upload */}
              <div>
                <label style={labelStyle}>Fichier JSX du template</label>
                <div className="flex items-center gap-3">
                  {jsxFileUrl && <span style={{ fontSize: 12, color: TEAL }}>✓ Fichier uploadé</span>}
                  <label style={{ ...inputStyle, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, width: 'auto', padding: '8px 14px' }}>
                    <Upload size={14} /> {jsxFileUrl ? 'Remplacer' : 'Upload JSX'}
                    <input type="file" accept=".jsx,.tsx,.js,.ts" onChange={handleJsxUpload} style={{ display: 'none' }} />
                  </label>
                </div>
              </div>

              {/* Screenshots */}
              <div>
                <label style={labelStyle}>Screenshots</label>
                <div className="flex gap-2 flex-wrap mb-2">
                  {screenshots.map((url, i) => (
                    <div key={i} className="relative group/img">
                      <img src={url} alt="" style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 8 }} />
                      <button onClick={() => setScreenshots(prev => prev.filter((_, j) => j !== i))}
                        className="absolute -top-1 -right-1 opacity-0 group-hover/img:opacity-100" style={{
                          width: 18, height: 18, borderRadius: 99, background: CORAL, border: 'none', cursor: 'pointer',
                          color: '#fff', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}><X size={10} /></button>
                    </div>
                  ))}
                </div>
                <label style={{ ...inputStyle, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, width: 'auto', padding: '8px 14px' }}>
                  <Upload size={14} /> Ajouter screenshots
                  <input type="file" accept="image/*" multiple onChange={handleScreenshotUpload} style={{ display: 'none' }} />
                </label>
              </div>

              {/* Preview URL */}
              <div>
                <label style={labelStyle}>URL de preview (optionnel)</label>
                <input value={previewUrl} onChange={e => setPreviewUrl(e.target.value)} style={inputStyle} placeholder="https://..." />
              </div>

              {/* Colors */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label style={labelStyle}>Couleur principale</label>
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    {COLOR_PRESETS.map(c => (
                      <button key={c.value} onClick={() => setPrimaryColor(c.value)} style={{
                        width: 28, height: 28, borderRadius: 8, background: c.value, cursor: 'pointer',
                        border: primaryColor === c.value ? '3px solid #fff' : '2px solid rgba(0,0,0,0.1)',
                        boxShadow: primaryColor === c.value ? `0 0 0 2px ${c.value}` : 'none',
                      }} />
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} style={{ width: 32, height: 32, border: 'none', cursor: 'pointer', borderRadius: 6 }} />
                    <input value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} style={{ ...inputStyle, width: 100, fontFamily: 'monospace', fontSize: 12 }} />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Couleur secondaire</label>
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    {COLOR_PRESETS.map(c => (
                      <button key={c.value} onClick={() => setSecondaryColor(c.value)} style={{
                        width: 28, height: 28, borderRadius: 8, background: c.value, cursor: 'pointer',
                        border: secondaryColor === c.value ? '3px solid #fff' : '2px solid rgba(0,0,0,0.1)',
                        boxShadow: secondaryColor === c.value ? `0 0 0 2px ${c.value}` : 'none',
                      }} />
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="color" value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)} style={{ width: 32, height: 32, border: 'none', cursor: 'pointer', borderRadius: 6 }} />
                    <input value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)} style={{ ...inputStyle, width: 100, fontFamily: 'monospace', fontSize: 12 }} />
                  </div>
                </div>
              </div>

              {/* Hero media */}
              <div>
                <label style={labelStyle}>Média Hero par défaut</label>
                <select value={heroMediaType} onChange={e => setHeroMediaType(e.target.value)} style={inputStyle}>
                  {HERO_TYPES.map(h => <option key={h.value} value={h.value}>{h.label}</option>)}
                </select>
                {(heroMediaType === 'photo' || heroMediaType === 'mp4') && (
                  <div className="mt-2">
                    <label style={{ ...inputStyle, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, width: 'auto', padding: '8px 14px' }}>
                      <Upload size={14} /> Upload {heroMediaType === 'photo' ? 'photo' : 'vidéo'}
                      <input type="file" accept={heroMediaType === 'photo' ? 'image/*' : 'video/mp4'} onChange={handleHeroUpload} style={{ display: 'none' }} />
                    </label>
                    {heroMediaUrl && <span style={{ fontSize: 12, color: TEAL, marginLeft: 8 }}>✓ Uploadé</span>}
                  </div>
                )}
                {heroMediaType === 'youtube' && (
                  <input value={heroMediaUrl} onChange={e => setHeroMediaUrl(e.target.value)} style={{ ...inputStyle, marginTop: 8 }} placeholder="https://youtube.com/watch?v=..." />
                )}
              </div>

              {/* Gallery */}
              <div>
                <label style={labelStyle}>Images galerie par défaut</label>
                <div className="flex gap-2 flex-wrap mb-2">
                  {galleryImages.map((url, i) => (
                    <div key={i} className="relative group/img">
                      <img src={url} alt="" style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8 }} />
                      <button onClick={() => setGalleryImages(prev => prev.filter((_, j) => j !== i))}
                        className="absolute -top-1 -right-1 opacity-0 group-hover/img:opacity-100" style={{
                          width: 16, height: 16, borderRadius: 99, background: CORAL, border: 'none', cursor: 'pointer',
                          color: '#fff', fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}><X size={8} /></button>
                    </div>
                  ))}
                </div>
                <label style={{ ...inputStyle, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, width: 'auto', padding: '8px 14px' }}>
                  <Upload size={14} /> Ajouter images
                  <input type="file" accept="image/*" multiple onChange={handleGalleryUpload} style={{ display: 'none' }} />
                </label>
              </div>
            </>
          )}

          {/* STEP 3: Content */}
          {step === 3 && (
            <>
              <p style={{ fontSize: 16, fontWeight: 600, color: TEXT_PRIMARY }}>Contenu par défaut</p>

              <div>
                <label style={labelStyle}>Tagline</label>
                <input value={tagline} onChange={e => setTagline(e.target.value)} style={inputStyle} placeholder="Ihr Moment der Entspannung" />
              </div>

              {/* Services */}
              <div>
                <label style={labelStyle}>Services par défaut</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {defaultServices.map((s, i) => (
                    <span key={i} className="flex items-center gap-1" style={{
                      padding: '4px 10px', borderRadius: 8, background: `${primaryColor}15`, color: TEXT_PRIMARY, fontSize: 12,
                    }}>
                      {s}
                      <button onClick={() => setDefaultServices(prev => prev.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: CORAL, fontSize: 14, lineHeight: 1 }}>×</button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input value={newService} onChange={e => setNewService(e.target.value)} style={{ ...inputStyle, flex: 1 }} placeholder="Nouveau service..."
                    onKeyDown={e => { if (e.key === 'Enter' && newService.trim()) { setDefaultServices(prev => [...prev, newService.trim()]); setNewService(''); } }} />
                  <button onClick={() => { if (newService.trim()) { setDefaultServices(prev => [...prev, newService.trim()]); setNewService(''); } }}
                    style={{ padding: '8px 14px', borderRadius: 10, border: 'none', background: `${TEAL}20`, color: TEAL, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              {/* Opening hours */}
              <div>
                <label style={labelStyle}>Horaires d'ouverture par défaut</label>
                <div className="space-y-2">
                  {DAYS.map(day => {
                    const h = openingHours[day] || { open: '09:00', close: '18:00', closed: false };
                    return (
                      <div key={day} className="flex items-center gap-3" style={{ opacity: h.closed ? 0.5 : 1 }}>
                        <span style={{ width: 90, fontSize: 13, color: TEXT_PRIMARY, fontWeight: 500 }}>{day}</span>
                        <label className="flex items-center gap-1 cursor-pointer" style={{ fontSize: 12, color: TEXT_MUTED }}>
                          <input type="checkbox" checked={h.closed}
                            onChange={e => setOpeningHours(prev => ({ ...prev, [day]: { ...prev[day], closed: e.target.checked } }))} />
                          Fermé
                        </label>
                        {!h.closed && (
                          <>
                            <input type="time" value={h.open} onChange={e => setOpeningHours(prev => ({ ...prev, [day]: { ...prev[day], open: e.target.value } }))}
                              style={{ ...inputStyle, width: 100, padding: '6px 8px', fontSize: 12 }} />
                            <span style={{ color: TEXT_MUTED }}>–</span>
                            <input type="time" value={h.close} onChange={e => setOpeningHours(prev => ({ ...prev, [day]: { ...prev[day], close: e.target.value } }))}
                              style={{ ...inputStyle, width: 100, padding: '6px 8px', fontSize: 12 }} />
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* STEP 4: Creative prompt */}
          {step === 4 && (
            <>
              <p style={{ fontSize: 16, fontWeight: 600, color: TEXT_PRIMARY }}>Prompt créatif</p>
              <p style={{ fontSize: 12, color: TEXT_SECONDARY, lineHeight: 1.5 }}>
                Ce prompt sera copié dans les démos créées avec ce template. Il guide l'IA pour la génération des textes et images.
              </p>

              {/* Presets */}
              <div className="flex flex-wrap gap-1.5">
                {PROMPT_PRESETS.map(p => (
                  <button key={p.label} onClick={() => setStylePrompt(p.text)}
                    style={{
                      padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none',
                      background: 'rgba(255,255,255,0.25)', color: TEXT_PRIMARY, transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => { (e.target as HTMLElement).style.background = `${GOLD}30`; }}
                    onMouseLeave={e => { (e.target as HTMLElement).style.background = 'rgba(255,255,255,0.25)'; }}
                  >{p.label}</button>
                ))}
              </div>

              <textarea value={stylePrompt} onChange={e => setStylePrompt(e.target.value)}
                style={{ ...inputStyle, minHeight: 200, lineHeight: 1.6 }}
                placeholder={`STYLE : Décrivez l'ambiance générale...
PHOTOS : Éclairage, décor, sujets...
TEXTES : Ton de voix, messages clés...
USP : Points forts du business type...
CIBLE : Public visé...`} />
            </>
          )}
        </div>

        {/* Footer nav */}
        <div className="flex items-center justify-between p-5" style={{ borderTop: '1px solid rgba(255,255,255,0.2)' }}>
          {step > 1 ? (
            <button onClick={() => setStep(s => s - 1)} style={{
              padding: '10px 20px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.3)',
              background: 'rgba(255,255,255,0.1)', color: TEXT_SECONDARY, fontWeight: 600, fontSize: 14, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 4,
            }}><ChevronLeft size={16} /> Retour</button>
          ) : <div />}

          {step < 4 ? (
            <button onClick={() => setStep(s => s + 1)} style={{
              padding: '10px 20px', borderRadius: 12, border: 'none', cursor: 'pointer',
              background: `linear-gradient(135deg, ${TEAL}, #2A9D8F)`, color: '#fff',
              fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 4,
            }}>Suivant <ChevronRight size={16} /></button>
          ) : (
            <button onClick={save} disabled={saving} style={{
              padding: '10px 24px', borderRadius: 12, border: 'none', cursor: 'pointer',
              background: `linear-gradient(135deg, ${TEAL}, #2A9D8F)`, color: '#fff',
              fontWeight: 700, fontSize: 14, opacity: saving ? 0.7 : 1,
            }}>{saving ? 'Enregistrement...' : template ? 'Mettre à jour' : 'Créer le template'}</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminTemplates;
