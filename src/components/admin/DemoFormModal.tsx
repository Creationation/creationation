import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { X, ChevronRight, ChevronLeft, Copy, Send, Upload, Plus, Trash2 } from 'lucide-react';
import SendDemoEmailModal from './SendDemoEmailModal';
import { TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED, TEAL, CORAL, GOLD, PURPLE } from '@/lib/adminTheme';


const COLOR_PRESETS = [
  { label: 'Teal', value: '#2A9D8F' },
  { label: 'Gold', value: '#E9C46A' },
  { label: 'Coral', value: '#E76F51' },
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
  const [primaryColor, setPrimaryColor] = useState(demo?.primary_color || '#2A9D8F');
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

  // Step 3
  const [expiryDays, setExpiryDays] = useState(7);
  const [generatedToken, setGeneratedToken] = useState(demo?.access_token || '');
  const [savedDemoId, setSavedDemoId] = useState(demo?.id || '');

  // Pre-fill services when business type changes (only for new demos)
  useEffect(() => {
    if (!demo) {
      const defaultServices = BUSINESS_SERVICES[businessType] || BUSINESS_SERVICES.generic;
      setServices(defaultServices);
      // Sync template type with business type
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
    navigator.clipboard.writeText(`https://creationation.lovable.app/demo/${generatedToken}`);
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
                    <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} style={{ width: 28, height: 28, border: 'none', cursor: 'pointer' }} />
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
                    <input type="color" value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)} style={{ width: 28, height: 28, border: 'none', cursor: 'pointer' }} />
                  </div>
                </div>
              </div>

              {/* Tagline */}
              <div>
                <label style={labelStyle}>Tagline</label>
                <input value={tagline} onChange={e => setTagline(e.target.value)} style={inputStyle} placeholder={`Ihr ${businessType === 'coiffeur' ? 'Friseur' : 'Beauty Studio'} in ${city}`} />
              </div>

              {/* Services */}
              <div>
                <label style={labelStyle}>Services</label>
                <div className="space-y-2">
                  {services.map((s, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input value={s} onChange={e => { const n = [...services]; n[i] = e.target.value; setServices(n); }} style={{ ...inputStyle, flex: 1 }} />
                      <button onClick={() => setServices(services.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#E76F51' }}><Trash2 size={16} /></button>
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
              </div>

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
                      creationation.lovable.app/demo/{generatedToken}
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
