import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { X, ChevronRight, ChevronLeft, Copy, Send, Upload, Plus, Trash2, Sparkles, Video, Image, Loader2 } from 'lucide-react';
import SendDemoEmailModal from './SendDemoEmailModal';
import { TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED, TEAL, CORAL, GOLD, PURPLE } from '@/lib/adminTheme';


const COLOR_PRESETS = [
  { label: 'Teal', value: '#2DD4B8' },
  { label: 'Gold', value: '#E9C46A' },
  { label: 'Coral', value: '#F07067' },
  { label: 'Purple', value: '#7c5cbf' },
  { label: 'Bleu', value: '#4da6d9' },
  { label: 'Rose', value: '#E8739A' },
];

const BUSINESS_SERVICES: Record<string, string[]> = {
  coiffeur: ['Haarschnitt', 'Färben', 'Styling', 'Bartpflege'],
  beauty: ['Gesichtsbehandlung', 'Maniküre', 'Pediküre', 'Waxing'],
  restaurant: ['Frühstück', 'Mittagsmenü', 'Abendessen', 'Lieferung'],
  nail: ['Maniküre', 'Pediküre', 'Gel-Nägel', 'Nail Art'],
  generic: ['Service 1', 'Service 2', 'Service 3'],
};

const TEMPLATE_TYPES = [
  { value: 'coiffeur', label: 'Coiffure' },
  { value: 'beauty', label: 'Beauté' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'nail', label: 'Nail Studio' },
  { value: 'generic', label: 'Autre' },
];

const DAYS = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];

const HERO_MEDIA_OPTIONS = [
  { value: 'none', label: 'Aucun', icon: '🚫' },
  { value: 'image', label: 'Photo uploadée', icon: '📷' },
  { value: 'video_url', label: 'Vidéo YouTube', icon: '🎬' },
  { value: 'video_upload', label: 'Vidéo MP4', icon: '📹' },
  { value: 'ai_generated', label: 'Générer par IA', icon: '✨' },
];

type Props = {
  demo: any | null;
  onClose: () => void;
  onSaved: () => void;
};

const DemoFormModal = ({ demo, onClose, onSaved }: Props) => {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);

  // Step 1
  const [businessName, setBusinessName] = useState(demo?.business_name || '');
  const [businessType, setBusinessType] = useState(demo?.business_type || 'beauty');
  const [contactName, setContactName] = useState(demo?.contact_name || '');
  const [contactEmail, setContactEmail] = useState(demo?.contact_email || '');
  const [contactPhone, setContactPhone] = useState(demo?.contact_phone || '');
  const [notes, setNotes] = useState(demo?.notes || '');
  const [prospectId, setProspectId] = useState(demo?.prospect_id || null);

  // Step 2
  const [logoUrl, setLogoUrl] = useState(demo?.logo_url || '');
  const [primaryColor, setPrimaryColor] = useState(demo?.primary_color || '#2DD4B8');
  const [secondaryColor, setSecondaryColor] = useState(demo?.secondary_color || '#E9C46A');
  const [tagline, setTagline] = useState(demo?.tagline || '');
  const [services, setServices] = useState<string[]>(demo?.services || []);
  const [address, setAddress] = useState(demo?.address || '');
  const [phone, setPhone] = useState(demo?.phone || '');
  const [city, setCity] = useState(demo?.city || 'Wien');
  const [openingHours, setOpeningHours] = useState<Record<string, { open: string; close: string; closed: boolean }>>(
    demo?.opening_hours && Object.keys(demo.opening_hours).length > 0 ? demo.opening_hours : DAYS.reduce((acc, d) => ({
      ...acc, [d]: { open: '09:00', close: '18:00', closed: d === 'Sonntag' }
    }), {})
  );
  const [templateType, setTemplateType] = useState(demo?.template_type || 'beauty');

  // Media options
  const [heroMediaType, setHeroMediaType] = useState(demo?.hero_media_type || 'none');
  const [heroMediaUrl, setHeroMediaUrl] = useState(demo?.hero_media_url || '');
  const [bgVideoEnabled, setBgVideoEnabled] = useState(demo?.background_video_enabled || false);
  const [bgVideoUrl, setBgVideoUrl] = useState(demo?.background_video_url || '');
  const [galleryImages, setGalleryImages] = useState<string[]>(demo?.gallery_images || []);

  // Design prompt
  const [designPrompt, setDesignPrompt] = useState(demo?.design_prompt || '');

  // Generation
  const [generating, setGenerating] = useState<string | null>(null); // 'texts' | 'hero' | 'gallery' | null

  // Step 3
  const [expiryDays, setExpiryDays] = useState(7);
  const [generatedToken, setGeneratedToken] = useState(demo?.access_token || '');
  const [savedDemoId, setSavedDemoId] = useState(demo?.id || '');

  // Pre-fill services when business type changes (only for new demos)
  useEffect(() => {
    if (!demo) {
      const defaultServices = BUSINESS_SERVICES[businessType] || BUSINESS_SERVICES.generic;
      setServices(defaultServices);
      setTemplateType(businessType);
    }
  }, [businessType]);

  // Prospect search
  const [prospectSearch, setProspectSearch] = useState('');
  const [prospectResults, setProspectResults] = useState<any[]>([]);
  useEffect(() => {
    if (prospectSearch.length < 2) { setProspectResults([]); return; }
    const t = setTimeout(async () => {
      const { data } = await supabase.from('prospects').select('id, business_name, contact_name, email, phone, business_type, city')
        .ilike('business_name', `%${prospectSearch}%`).limit(5);
      setProspectResults(data || []);
    }, 300);
    return () => clearTimeout(t);
  }, [prospectSearch]);

  const fillFromProspect = (p: any) => {
    setBusinessName(p.business_name || '');
    setContactName(p.contact_name || '');
    setContactEmail(p.email || '');
    setContactPhone(p.phone || '');
    setBusinessType(p.business_type || 'beauty');
    setCity(p.city || 'Wien');
    setProspectId(p.id);
    setProspectSearch('');
    setProspectResults([]);
    toast.success('Infos pré-remplies depuis le prospect');
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split('.').pop();
    const path = `${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('demo-logos').upload(path, file);
    if (error) { toast.error('Erreur upload logo'); return; }
    const { data: { publicUrl } } = supabase.storage.from('demo-logos').getPublicUrl(path);
    setLogoUrl(publicUrl);
    toast.success('Logo uploadé');
  };

  const handleHeroImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split('.').pop();
    const path = `hero-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('demo-logos').upload(path, file);
    if (error) { toast.error('Erreur upload'); return; }
    const { data: { publicUrl } } = supabase.storage.from('demo-logos').getPublicUrl(path);
    setHeroMediaUrl(publicUrl);
    toast.success('Image hero uploadée');
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'hero' | 'bg') => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) { toast.error('Fichier trop volumineux (max 20MB)'); return; }
    const path = `video-${target}-${Date.now()}.mp4`;
    const { error } = await supabase.storage.from('demo-logos').upload(path, file);
    if (error) { toast.error('Erreur upload vidéo'); return; }
    const { data: { publicUrl } } = supabase.storage.from('demo-logos').getPublicUrl(path);
    if (target === 'hero') setHeroMediaUrl(publicUrl);
    else setBgVideoUrl(publicUrl);
    toast.success('Vidéo uploadée');
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (const file of Array.from(files)) {
      const ext = file.name.split('.').pop();
      const path = `gallery-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from('demo-logos').upload(path, file);
      if (error) continue;
      const { data: { publicUrl } } = supabase.storage.from('demo-logos').getPublicUrl(path);
      setGalleryImages(prev => [...prev, publicUrl]);
    }
    toast.success('Photos ajoutées à la galerie');
  };

  const generateContent = async (type: 'texts' | 'hero' | 'gallery') => {
    // Need to save demo first if new
    let demoId = savedDemoId;
    if (!demoId) {
      toast.error('Veuillez d\'abord sauvegarder la démo (étape 3)');
      return;
    }
    setGenerating(type);
    try {
      const { data, error } = await supabase.functions.invoke('generate-demo-content', {
        body: {
          demoId,
          generateTexts: type === 'texts',
          generateHeroImage: type === 'hero',
          generateGallery: type === 'gallery',
        },
      });
      if (error) throw error;
      const results = (data as any)?.results;
      if (type === 'texts' && results?.texts) {
        if (results.texts.tagline) setTagline(results.texts.tagline);
        toast.success('Textes générés !');
      }
      if (type === 'hero' && results?.heroImageUrl) {
        setHeroMediaUrl(results.heroImageUrl);
        setHeroMediaType('ai_generated');
        toast.success('Image hero générée !');
      }
      if (type === 'gallery' && results?.galleryUrls) {
        setGalleryImages(prev => [...prev, ...results.galleryUrls]);
        toast.success(`${results.galleryUrls.length} photos générées !`);
      }
    } catch (e: any) {
      toast.error(`Erreur génération: ${e.message || 'Erreur inconnue'}`);
    }
    setGenerating(null);
  };

  const saveDemo = async () => {
    if (!businessName.trim()) { toast.error('Nom du business requis'); return; }
    setSaving(true);
    const payload = {
      business_name: businessName,
      business_type: businessType,
      contact_name: contactName || null,
      contact_email: contactEmail || null,
      contact_phone: contactPhone || null,
      notes: notes || null,
      logo_url: logoUrl || null,
      primary_color: primaryColor,
      secondary_color: secondaryColor,
      tagline: tagline || null,
      services,
      address: address || null,
      city,
      phone: phone || null,
      opening_hours: openingHours,
      template_type: templateType,
      prospect_id: prospectId,
      expires_at: new Date(Date.now() + expiryDays * 86400000).toISOString(),
      hero_media_type: heroMediaType,
      hero_media_url: heroMediaUrl || null,
      background_video_enabled: bgVideoEnabled,
      background_video_url: bgVideoUrl || null,
      gallery_images: galleryImages,
      design_prompt: designPrompt || null,
    };

    if (demo?.id) {
      const { error } = await supabase.from('demos').update(payload as any).eq('id', demo.id);
      if (error) { toast.error('Erreur mise à jour'); setSaving(false); return; }
      setGeneratedToken(demo.access_token);
      setSavedDemoId(demo.id);
      toast.success('Démo mise à jour');
    } else {
      const { data, error } = await supabase.from('demos').insert(payload as any).select().single();
      if (error) { toast.error('Erreur création'); setSaving(false); return; }
      setGeneratedToken((data as any).access_token);
      setSavedDemoId((data as any).id);
      toast.success('Démo créée !');
    }
    setSaving(false);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(`https://creationation.app/demo/${generatedToken}`);
    toast.success('Lien copié !');
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: 10,
    border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.2)',
    fontSize: 14, color: TEXT_PRIMARY, outline: 'none',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 13, fontWeight: 600, color: TEXT_SECONDARY, marginBottom: 4, display: 'block',
  };

  const genBtnStyle: React.CSSProperties = {
    padding: '6px 14px', borderRadius: 99, border: 'none', cursor: 'pointer',
    background: 'linear-gradient(135deg, #7c5cbf, #E8739A)', color: '#fff',
    fontWeight: 600, fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4,
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4" style={{
        background: 'rgba(255,255,255,0.20)', backdropFilter: 'blur(24px) saturate(1.4)',
        WebkitBackdropFilter: 'blur(24px) saturate(1.4)', borderRadius: 20,
        border: '1px solid rgba(255,255,255,0.30)', padding: 0,
      }}>
        {/* Header */}
        <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: TEXT_PRIMARY, fontFamily: "'Playfair Display', serif" }}>
            {demo ? 'Modifier la démo' : 'Nouvelle démo'}
          </h2>
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              {[1, 2, 3].map(s => (
                <div key={s} style={{
                  width: 28, height: 4, borderRadius: 99,
                  background: s <= step ? TEAL : 'rgba(0,0,0,0.1)',
                  transition: 'background 0.2s',
                }} />
              ))}
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: TEXT_SECONDARY }}><X size={20} /></button>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* STEP 1 */}
          {step === 1 && (
            <>
              <p style={{ fontSize: 16, fontWeight: 600, color: TEXT_PRIMARY }}>Infos du prospect</p>

              {/* Prospect search */}
              <div>
                <label style={labelStyle}>Pré-remplir depuis un prospect existant</label>
                <input value={prospectSearch} onChange={e => setProspectSearch(e.target.value)}
                  placeholder="Rechercher un prospect..." style={inputStyle} />
                {prospectResults.length > 0 && (
                  <div style={{ marginTop: 4, background: 'rgba(255,255,255,0.5)', borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.3)' }}>
                    {prospectResults.map(p => (
                      <button key={p.id} onClick={() => fillFromProspect(p)} className="w-full text-left flex items-center gap-2"
                        style={{ padding: '8px 12px', border: 'none', background: 'none', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.2)', fontSize: 13, color: TEXT_PRIMARY }}>
                        <span style={{ fontWeight: 600 }}>{p.business_name}</span>
                        <span style={{ color: TEXT_SECONDARY }}>{p.city}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label style={labelStyle}>Nom du business *</label>
                  <input value={businessName} onChange={e => setBusinessName(e.target.value)} style={inputStyle} placeholder="Salon Anna" />
                </div>
                <div>
                  <label style={labelStyle}>Type</label>
                  <select value={businessType} onChange={e => setBusinessType(e.target.value)} style={inputStyle}>
                    {TEMPLATE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Contact</label>
                  <input value={contactName} onChange={e => setContactName(e.target.value)} style={inputStyle} placeholder="Anna Müller" />
                </div>
                <div>
                  <label style={labelStyle}>Email</label>
                  <input value={contactEmail} onChange={e => setContactEmail(e.target.value)} style={inputStyle} placeholder="anna@salon.at" type="email" />
                </div>
                <div>
                  <label style={labelStyle}>Téléphone</label>
                  <input value={contactPhone} onChange={e => setContactPhone(e.target.value)} style={inputStyle} placeholder="+43 ..." />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Notes internes</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} style={{ ...inputStyle, minHeight: 60 }} placeholder="Notes..." />
              </div>
            </>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <>
              <p style={{ fontSize: 16, fontWeight: 600, color: TEXT_PRIMARY }}>Personnalisation</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Logo */}
                <div>
                  <label style={labelStyle}>Logo (optionnel)</label>
                  <div className="flex items-center gap-3">
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo" style={{ width: 48, height: 48, borderRadius: 10, objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: 48, height: 48, borderRadius: 10, background: primaryColor, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 20, fontWeight: 700 }}>
                        {businessName.charAt(0) || '?'}
                      </div>
                    )}
                    <label style={{ ...inputStyle, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, width: 'auto', padding: '8px 14px' }}>
                      <Upload size={14} /> Upload
                      <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} />
                    </label>
                  </div>
                </div>

                {/* Template type */}
                <div>
                  <label style={labelStyle}>Template</label>
                  <select value={templateType} onChange={e => setTemplateType(e.target.value)} style={inputStyle}>
                    {TEMPLATE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>

                {/* Primary color */}
                <div>
                  <label style={labelStyle}>Couleur principale</label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {COLOR_PRESETS.map(c => (
                      <button key={c.value} onClick={() => setPrimaryColor(c.value)} style={{
                        width: 28, height: 28, borderRadius: 8, background: c.value, border: primaryColor === c.value ? '3px solid #fff' : '2px solid rgba(0,0,0,0.1)',
                        cursor: 'pointer', boxShadow: primaryColor === c.value ? `0 0 0 2px ${c.value}` : 'none',
                      }} title={c.label} />
                    ))}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)}
                      style={{ width: 32, height: 32, border: 'none', cursor: 'pointer', borderRadius: 6 }} />
                    <input value={primaryColor} onChange={e => setPrimaryColor(e.target.value)}
                      style={{ ...inputStyle, width: 100, fontFamily: 'monospace', fontSize: 12 }} placeholder="#2DD4B8" />
                  </div>
                </div>

                {/* Secondary color */}
                <div>
                  <label style={labelStyle}>Couleur secondaire</label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {COLOR_PRESETS.map(c => (
                      <button key={c.value} onClick={() => setSecondaryColor(c.value)} style={{
                        width: 28, height: 28, borderRadius: 8, background: c.value, border: secondaryColor === c.value ? '3px solid #fff' : '2px solid rgba(0,0,0,0.1)',
                        cursor: 'pointer', boxShadow: secondaryColor === c.value ? `0 0 0 2px ${c.value}` : 'none',
                      }} title={c.label} />
                    ))}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <input type="color" value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)}
                      style={{ width: 32, height: 32, border: 'none', cursor: 'pointer', borderRadius: 6 }} />
                    <input value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)}
                      style={{ ...inputStyle, width: 100, fontFamily: 'monospace', fontSize: 12 }} placeholder="#E9C46A" />
                  </div>
                </div>
              </div>

              {/* Design Prompt */}
              <div>
                <label style={labelStyle}>🎨 Prompt de design (guide l'IA pour le style)</label>
                <textarea value={designPrompt} onChange={e => setDesignPrompt(e.target.value)}
                  style={{ ...inputStyle, minHeight: 80 }}
                  placeholder="Ex: Style luxueux et épuré, ambiance spa zen avec des tons doux. Photos de salon haut de gamme avec éclairage chaleureux. Typographie moderne et minimaliste." />
                <span style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 2, display: 'block' }}>
                  Ce prompt sera utilisé par l'IA pour générer des textes, images et le design global de la démo.
                </span>
              </div>

              {/* Tagline */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label style={{ ...labelStyle, marginBottom: 0 }}>Tagline</label>
                  {savedDemoId && (
                    <button onClick={() => generateContent('texts')} disabled={!!generating} style={genBtnStyle}>
                      {generating === 'texts' ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                      Générer par IA
                    </button>
                  )}
                </div>
                <input value={tagline} onChange={e => setTagline(e.target.value)} style={inputStyle} placeholder={`Ihr ${businessType === 'coiffeur' ? 'Friseur' : 'Beauty Studio'} in ${city}`} />
              </div>

              {/* Hero Media */}
              <div>
                <label style={labelStyle}>Média Hero</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {HERO_MEDIA_OPTIONS.map(opt => (
                    <button key={opt.value} onClick={() => setHeroMediaType(opt.value)}
                      style={{
                        padding: '6px 14px', borderRadius: 10, border: heroMediaType === opt.value ? `2px solid ${TEAL}` : '1px solid rgba(255,255,255,0.3)',
                        background: heroMediaType === opt.value ? `${TEAL}15` : 'rgba(255,255,255,0.2)',
                        cursor: 'pointer', fontSize: 12, fontWeight: 600, color: TEXT_PRIMARY,
                        display: 'flex', alignItems: 'center', gap: 4,
                      }}>
                      <span>{opt.icon}</span> {opt.label}
                    </button>
                  ))}
                </div>

                {heroMediaType === 'image' && (
                  <div className="flex items-center gap-3">
                    {heroMediaUrl && <img src={heroMediaUrl} alt="Hero" style={{ width: 80, height: 45, borderRadius: 8, objectFit: 'cover' }} />}
                    <label style={{ ...inputStyle, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, width: 'auto', padding: '8px 14px' }}>
                      <Image size={14} /> Upload image
                      <input type="file" accept="image/*" onChange={handleHeroImageUpload} style={{ display: 'none' }} />
                    </label>
                  </div>
                )}

                {heroMediaType === 'video_url' && (
                  <input value={heroMediaUrl} onChange={e => setHeroMediaUrl(e.target.value)} style={inputStyle} placeholder="https://youtube.com/watch?v=..." />
                )}

                {heroMediaType === 'video_upload' && (
                  <div className="flex items-center gap-3">
                    {heroMediaUrl && <span className="text-xs" style={{ color: TEAL }}>✓ Vidéo uploadée</span>}
                    <label style={{ ...inputStyle, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, width: 'auto', padding: '8px 14px' }}>
                      <Video size={14} /> Upload MP4
                      <input type="file" accept="video/mp4" onChange={e => handleVideoUpload(e, 'hero')} style={{ display: 'none' }} />
                    </label>
                  </div>
                )}

                {heroMediaType === 'ai_generated' && (
                  <div className="flex items-center gap-3">
                    {heroMediaUrl && <img src={heroMediaUrl} alt="Hero AI" style={{ width: 80, height: 45, borderRadius: 8, objectFit: 'cover' }} />}
                    {savedDemoId ? (
                      <button onClick={() => generateContent('hero')} disabled={!!generating} style={genBtnStyle}>
                        {generating === 'hero' ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                        {heroMediaUrl ? 'Régénérer' : 'Générer image'}
                      </button>
                    ) : (
                      <span className="text-xs" style={{ color: TEXT_MUTED }}>Sauvegardez d'abord la démo</span>
                    )}
                  </div>
                )}
              </div>

              {/* Background Video */}
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <label className="flex items-center gap-2 cursor-pointer" style={{ fontSize: 13, fontWeight: 600, color: TEXT_SECONDARY }}>
                    <input type="checkbox" checked={bgVideoEnabled} onChange={e => setBgVideoEnabled(e.target.checked)} />
                    Vidéo en arrière-plan (toute la page)
                  </label>
                </div>
                {bgVideoEnabled && (
                  <div className="space-y-2">
                    <input value={bgVideoUrl} onChange={e => setBgVideoUrl(e.target.value)} style={inputStyle}
                      placeholder="URL YouTube ou lien direct MP4" />
                    <label style={{ ...inputStyle, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, width: 'auto', padding: '8px 14px' }}>
                      <Video size={14} /> Ou uploader MP4
                      <input type="file" accept="video/mp4" onChange={e => handleVideoUpload(e, 'bg')} style={{ display: 'none' }} />
                    </label>
                  </div>
                )}
              </div>

              {/* Gallery */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label style={{ ...labelStyle, marginBottom: 0 }}>Galerie photos</label>
                  <div className="flex gap-2">
                    {savedDemoId && (
                      <button onClick={() => generateContent('gallery')} disabled={!!generating} style={genBtnStyle}>
                        {generating === 'gallery' ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                        Générer par IA
                      </button>
                    )}
                    <label style={{ ...genBtnStyle, background: 'rgba(255,255,255,0.3)', color: TEXT_PRIMARY, cursor: 'pointer' }}>
                      <Upload size={12} /> Upload
                      <input type="file" accept="image/*" multiple onChange={handleGalleryUpload} style={{ display: 'none' }} />
                    </label>
                  </div>
                </div>
                {galleryImages.length > 0 && (
                  <div className="grid grid-cols-4 gap-2">
                    {galleryImages.map((url, i) => (
                      <div key={i} className="relative group">
                        <img src={url} alt="" className="w-full aspect-square object-cover rounded-lg" />
                        <button onClick={() => setGalleryImages(galleryImages.filter((_, j) => j !== i))}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ background: 'rgba(0,0,0,0.6)', border: 'none', cursor: 'pointer', color: '#fff' }}>
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {galleryImages.length === 0 && (
                  <p className="text-xs" style={{ color: TEXT_MUTED }}>Aucune photo. Uploadez ou générez par IA.</p>
                )}
              </div>

              {/* Services */}
              <div>
                <label style={labelStyle}>Services</label>
                <div className="space-y-2">
                  {services.map((s, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input value={s} onChange={e => { const n = [...services]; n[i] = e.target.value; setServices(n); }} style={{ ...inputStyle, flex: 1 }} />
                      <button onClick={() => setServices(services.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#F07067' }}><Trash2 size={16} /></button>
                    </div>
                  ))}
                  <button onClick={() => setServices([...services, ''])} style={{ background: 'none', border: 'none', cursor: 'pointer', color: TEAL, fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Plus size={14} /> Ajouter un service
                  </button>
                </div>
              </div>

              {/* Address & phone */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><label style={labelStyle}>Adresse</label><input value={address} onChange={e => setAddress(e.target.value)} style={inputStyle} /></div>
                <div><label style={labelStyle}>Ville</label><input value={city} onChange={e => setCity(e.target.value)} style={inputStyle} /></div>
                <div><label style={labelStyle}>Téléphone</label><input value={phone} onChange={e => setPhone(e.target.value)} style={inputStyle} /></div>
              </div>

              {/* Opening hours */}
              <div>
                <label style={labelStyle}>Horaires d'ouverture</label>
                <div className="space-y-2">
                  {DAYS.map(day => {
                    const h = openingHours[day] || { open: '09:00', close: '18:00', closed: false };
                    return (
                      <div key={day} className="flex items-center gap-3" style={{ fontSize: 13 }}>
                        <span style={{ width: 90, fontWeight: 500, color: TEXT_PRIMARY }}>{day}</span>
                        <label className="flex items-center gap-1" style={{ color: TEXT_SECONDARY }}>
                          <input type="checkbox" checked={h.closed} onChange={e => setOpeningHours({ ...openingHours, [day]: { ...h, closed: e.target.checked } })} /> Fermé
                        </label>
                        {!h.closed && (
                          <>
                            <input type="time" value={h.open} onChange={e => setOpeningHours({ ...openingHours, [day]: { ...h, open: e.target.value } })}
                              style={{ ...inputStyle, width: 100, padding: '4px 8px' }} />
                            <span style={{ color: TEXT_SECONDARY }}>-</span>
                            <input type="time" value={h.close} onChange={e => setOpeningHours({ ...openingHours, [day]: { ...h, close: e.target.value } })}
                              style={{ ...inputStyle, width: 100, padding: '4px 8px' }} />
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <>
              <p style={{ fontSize: 16, fontWeight: 600, color: TEXT_PRIMARY }}>Preview & Envoi</p>

              {/* Mini preview */}
              <div style={{
                background: primaryColor, borderRadius: 16, padding: 24, color: '#fff', position: 'relative', overflow: 'hidden',
              }}>
                <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: secondaryColor, opacity: 0.3 }} />
                <div className="flex items-center gap-3 mb-4">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo" style={{ width: 48, height: 48, borderRadius: 12, objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700 }}>
                      {businessName.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h3 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{businessName}</h3>
                    <p style={{ fontSize: 13, opacity: 0.8, margin: 0 }}>{tagline}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {services.slice(0, 4).map((s, i) => (
                    <span key={i} style={{ padding: '4px 12px', borderRadius: 99, background: 'rgba(255,255,255,0.2)', fontSize: 12 }}>{s}</span>
                  ))}
                </div>
                {heroMediaUrl && heroMediaType !== 'none' && (
                  <div className="mt-3 text-xs opacity-70 flex items-center gap-1">
                    {heroMediaType.includes('video') ? <Video size={12} /> : <Image size={12} />}
                    Média hero configuré ✓
                  </div>
                )}
                {galleryImages.length > 0 && (
                  <div className="mt-1 text-xs opacity-70">📷 {galleryImages.length} photos en galerie</div>
                )}
              </div>

              {/* Generation buttons for new demos */}
              {savedDemoId && (
                <div style={{ padding: 16, borderRadius: 12, background: 'rgba(124,92,191,0.08)', border: '1px solid rgba(124,92,191,0.15)' }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: PURPLE, marginBottom: 8 }}>✨ Génération IA</p>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => generateContent('texts')} disabled={!!generating} style={genBtnStyle}>
                      {generating === 'texts' ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                      Textes
                    </button>
                    <button onClick={() => generateContent('hero')} disabled={!!generating} style={genBtnStyle}>
                      {generating === 'hero' ? <Loader2 size={12} className="animate-spin" /> : <Image size={12} />}
                      Image Hero
                    </button>
                    <button onClick={() => generateContent('gallery')} disabled={!!generating} style={genBtnStyle}>
                      {generating === 'gallery' ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                      Galerie (4 photos)
                    </button>
                  </div>
                  {generating && <p className="text-xs mt-2" style={{ color: PURPLE }}>⏳ Génération en cours, patientez...</p>}
                </div>
              )}

              {/* Expiry */}
              <div>
                <label style={labelStyle}>Durée de validité</label>
                <select value={expiryDays} onChange={e => setExpiryDays(Number(e.target.value))} style={inputStyle}>
                  <option value={7}>7 jours</option>
                  <option value={14}>14 jours</option>
                  <option value={30}>30 jours</option>
                  <option value={365}>1 an (jamais)</option>
                </select>
              </div>

              {/* Save & generate */}
              {!generatedToken && (
                <button onClick={saveDemo} disabled={saving} style={{
                  width: '100%', padding: '12px', borderRadius: 12, border: 'none', cursor: 'pointer',
                  background: `linear-gradient(135deg, ${TEAL}, #3EDDC7)`, color: '#fff',
                  fontWeight: 600, fontSize: 15, opacity: saving ? 0.7 : 1,
                }}>
                  {saving ? 'Génération...' : 'Générer le lien'}
                </button>
              )}

              {generatedToken && (
                <div className="space-y-3">
                  <div style={{ ...inputStyle, display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(42,157,143,0.08)' }}>
                    <span style={{ flex: 1, fontSize: 13, color: TEAL, wordBreak: 'break-all' }}>
                      creationation.app/demo/{generatedToken}
                    </span>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={copyLink} style={{
                      flex: 1, padding: '10px', borderRadius: 12, border: 'none', cursor: 'pointer',
                      background: 'rgba(42,157,143,0.1)', color: TEAL, fontWeight: 600, fontSize: 14,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    }}><Copy size={14} /> Copier le lien</button>
                    <button onClick={() => setShowEmailModal(true)} style={{
                      flex: 1, padding: '10px', borderRadius: 12, border: 'none', cursor: 'pointer',
                      background: `linear-gradient(135deg, ${TEAL}, #3EDDC7)`, color: '#fff',
                      fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    }}><Send size={14} /> Envoyer par email</button>
                  </div>
                  <button onClick={() => { onSaved(); }} style={{
                    width: '100%', padding: '10px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.3)',
                    background: 'rgba(255,255,255,0.2)', color: TEXT_PRIMARY, fontWeight: 500, fontSize: 14, cursor: 'pointer',
                  }}>Fermer</button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer nav */}
        <div className="flex items-center justify-between p-5" style={{ borderTop: '1px solid rgba(255,255,255,0.2)' }}>
          {step > 1 ? (
            <button onClick={() => setStep(step - 1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: TEXT_SECONDARY, fontSize: 14, display: 'flex', alignItems: 'center', gap: 4 }}>
              <ChevronLeft size={16} /> Retour
            </button>
          ) : <div />}
          {step < 3 && (
            <button onClick={() => {
              if (step === 1 && !businessName.trim()) { toast.error('Nom du business requis'); return; }
              setStep(step + 1);
            }} style={{
              padding: '8px 20px', borderRadius: 99, border: 'none', cursor: 'pointer',
              background: TEAL, color: '#fff', fontWeight: 600, fontSize: 14,
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              Suivant <ChevronRight size={16} />
            </button>
          )}
        </div>
      </div>

      {showEmailModal && (
        <SendDemoEmailModal
          demoId={savedDemoId}
          contactName={contactName}
          contactEmail={contactEmail}
          businessName={businessName}
          accessToken={generatedToken}
          expiryDays={expiryDays}
          onClose={() => setShowEmailModal(false)}
          onSent={() => { setShowEmailModal(false); onSaved(); }}
        />
      )}
    </div>
  );
};

export default DemoFormModal;
