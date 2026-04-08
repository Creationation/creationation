import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Save, Upload, Building2 } from 'lucide-react';
import { TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED, TEAL, CORAL, GOLD, PURPLE } from '@/lib/adminTheme';


const EU_COUNTRIES = [
  'Österreich', 'Deutschland', 'France', 'Italia', 'España', 'Portugal',
  'Nederland', 'Belgique/België', 'Luxembourg', 'Ireland', 'Danmark',
  'Sverige', 'Suomi/Finland', 'Polska', 'Česká republika', 'Slovensko',
  'Magyarország', 'România', 'Bulgaria', 'Hrvatska', 'Slovenija',
  'Eesti', 'Latvija', 'Lietuva', 'Κύπρος', 'Μάλτα', 'Ελλάδα',
];

const DEFAULT_TAX_NOTE = 'Diese Leistung wurde als Privatleistung ohne Umsatzsteuerausweis erbracht. Eine Steuernummer ist derzeit nicht vorhanden. Die Einnahmen werden im Rahmen der persönlichen Steuererklärung angegeben, sobald die gesetzlichen Voraussetzungen erfüllt sind.';

type CompanySettings = {
  id: string;
  company_name: string;
  legal_name: string;
  address: string;
  zip_code: string;
  city: string;
  country: string;
  email: string;
  phone: string | null;
  website: string;
  logo_url: string | null;
  has_tax_number: boolean;
  tax_number: string | null;
  has_vat_number: boolean;
  vat_number: string | null;
  has_company_registration: boolean;
  company_registration: string | null;
  tax_note: string;
  bank_name: string | null;
  iban: string | null;
  bic: string | null;
  account_holder: string;
  invoice_country: string;
};

const Label = ({ children }: { children: React.ReactNode }) => (
  <label style={{ fontSize: 11, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 6, fontWeight: 600 }}>
    {children}
  </label>
);

const Toggle = ({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) => (
  <div className="flex items-center justify-between py-2">
    <span style={{ fontSize: 13, color: TEXT_PRIMARY, fontWeight: 500 }}>{label}</span>
    <button
      type="button"
      onClick={() => onChange(!checked)}
      style={{
        width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
        background: checked ? TEAL : 'rgba(255,255,255,0.12)',
        position: 'relative', transition: 'background 0.2s',
      }}
    >
      <span style={{
        position: 'absolute', top: 2, left: checked ? 22 : 2,
        width: 20, height: 20, borderRadius: 10,
        background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        transition: 'left 0.2s',
      }} />
    </button>
  </div>
);

const AdminSettings = () => {
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('company_settings').select('*').limit(1).single();
      if (data) setSettings(data as any);
      setLoading(false);
    };
    load();
  }, []);

  const update = (key: keyof CompanySettings, value: any) => {
    if (!settings) return;
    setSettings({ ...settings, [key]: value });
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    const { id, ...rest } = settings;
    const { error } = await supabase.from('company_settings').update(rest as any).eq('id', id);
    if (error) {
      toast.error('Erreur lors de la sauvegarde');
      console.error(error);
    } else {
      toast.success('Paramètres sauvegardés');
    }
    setSaving(false);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !settings) return;
    setUploading(true);
    const ext = file.name.split('.').pop();
    const fileName = `company-logo-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from('contract-documents').upload(fileName, file, { contentType: file.type });
    if (uploadError) { toast.error('Erreur upload'); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from('contract-documents').getPublicUrl(fileName);
    update('logo_url', urlData.publicUrl);
    setUploading(false);
    toast.success('Logo uploadé');
  };

  if (loading) return <div className="p-8 text-center" style={{ color: TEXT_MUTED }}>Chargement...</div>;
  if (!settings) return <div className="p-8 text-center" style={{ color: TEXT_MUTED }}>Erreur: aucune configuration trouvée</div>;

  return (
    <div className="p-4 md:p-6 max-w-[900px] mx-auto space-y-6" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="admin-page-title">Paramètres</h1>
        <button onClick={handleSave} disabled={saving} className="admin-glass-btn" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Save size={14} /> {saving ? 'Sauvegarde...' : 'Sauvegarder'}
        </button>
      </div>

      {/* Informations de base */}
      <div className="admin-glass-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div style={{ width: 36, height: 36, borderRadius: 10, background: `${TEAL}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Building2 size={18} color={TEAL} />
          </div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: TEXT_PRIMARY }}>Informations de la société</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label>Nom de la société</Label>
            <input value={settings.company_name} onChange={e => update('company_name', e.target.value)} className="admin-glass-input w-full" />
          </div>
          <div>
            <Label>Nom légal / Titulaire</Label>
            <input value={settings.legal_name} onChange={e => update('legal_name', e.target.value)} className="admin-glass-input w-full" />
          </div>
          <div>
            <Label>Adresse</Label>
            <input value={settings.address} onChange={e => update('address', e.target.value)} className="admin-glass-input w-full" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Code postal</Label>
              <input value={settings.zip_code} onChange={e => update('zip_code', e.target.value)} className="admin-glass-input w-full" />
            </div>
            <div>
              <Label>Ville</Label>
              <input value={settings.city} onChange={e => update('city', e.target.value)} className="admin-glass-input w-full" />
            </div>
          </div>
          <div>
            <Label>Pays</Label>
            <select value={settings.country} onChange={e => update('country', e.target.value)} className="admin-glass-input w-full">
              {EU_COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <Label>Email</Label>
            <input type="email" value={settings.email} onChange={e => update('email', e.target.value)} className="admin-glass-input w-full" />
          </div>
          <div>
            <Label>Téléphone (optionnel)</Label>
            <input value={settings.phone || ''} onChange={e => update('phone', e.target.value || null)} className="admin-glass-input w-full" placeholder="+43..." />
          </div>
          <div>
            <Label>Site web</Label>
            <input value={settings.website} onChange={e => update('website', e.target.value)} className="admin-glass-input w-full" />
          </div>
        </div>

        {/* Logo */}
        <div className="mt-4">
          <Label>Logo</Label>
          <div className="flex items-center gap-4">
            {settings.logo_url && (
              <img src={settings.logo_url} alt="Logo" style={{ height: 48, borderRadius: 8, background: 'white', padding: 4 }} />
            )}
            <label className="admin-glass-btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12 }}>
              <Upload size={14} /> {uploading ? 'Upload...' : 'Changer le logo'}
              <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} />
            </label>
          </div>
        </div>
      </div>

      {/* Informations fiscales */}
      <div className="admin-glass-card p-6">
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: TEXT_PRIMARY, marginBottom: 16 }}>Informations fiscales</h2>

        <div className="space-y-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.15)', paddingBottom: 16, marginBottom: 16 }}>
          <Toggle checked={settings.has_tax_number} onChange={v => update('has_tax_number', v)} label="Steuernummer vorhanden" />
          {settings.has_tax_number && (
            <div>
              <Label>Steuernummer</Label>
              <input value={settings.tax_number || ''} onChange={e => update('tax_number', e.target.value)} className="admin-glass-input w-full" placeholder="z.B. 12 345/6789" />
            </div>
          )}
        </div>

        <div className="space-y-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.15)', paddingBottom: 16, marginBottom: 16 }}>
          <Toggle checked={settings.has_vat_number} onChange={v => update('has_vat_number', v)} label="UID-Nummer vorhanden" />
          {settings.has_vat_number && (
            <div>
              <Label>UID-Nummer</Label>
              <input value={settings.vat_number || ''} onChange={e => update('vat_number', e.target.value)} className="admin-glass-input w-full" placeholder="ATU12345678" />
            </div>
          )}
        </div>

        <div className="space-y-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.15)', paddingBottom: 16, marginBottom: 16 }}>
          <Toggle checked={settings.has_company_registration} onChange={v => update('has_company_registration', v)} label="Firmenbuchnummer vorhanden" />
          {settings.has_company_registration && (
            <div>
              <Label>Firmenbuchnummer</Label>
              <input value={settings.company_registration || ''} onChange={e => update('company_registration', e.target.value)} className="admin-glass-input w-full" placeholder="FN 123456a" />
            </div>
          )}
        </div>

        <div>
          <Label>Steuerhinweis (auf dem Dokument angezeigt)</Label>
          <textarea
            value={settings.tax_note}
            onChange={e => update('tax_note', e.target.value)}
            className="admin-glass-input w-full"
            rows={4}
            style={{ fontSize: 12 }}
          />
          <p style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 4 }}>
            {settings.has_tax_number
              ? 'Hinweis: Da eine Steuernummer vorhanden ist, wird stattdessen die Steuernummer angezeigt.'
              : 'Dieser Text wird auf dem Dokument angezeigt, wenn keine Steuernummer vorhanden ist.'}
          </p>
        </div>
      </div>

      {/* Informations bancaires */}
      <div className="admin-glass-card p-6">
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: TEXT_PRIMARY, marginBottom: 16 }}>Bankverbindung</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label>Bank</Label>
            <input value={settings.bank_name || ''} onChange={e => update('bank_name', e.target.value)} className="admin-glass-input w-full" placeholder="z.B. Erste Bank" />
          </div>
          <div>
            <Label>Kontoinhaber</Label>
            <input value={settings.account_holder} onChange={e => update('account_holder', e.target.value)} className="admin-glass-input w-full" />
          </div>
          <div>
            <Label>IBAN</Label>
            <input value={settings.iban || ''} onChange={e => update('iban', e.target.value)} className="admin-glass-input w-full" placeholder="AT12 3456 7890 1234 5678" />
          </div>
          <div>
            <Label>BIC / SWIFT</Label>
            <input value={settings.bic || ''} onChange={e => update('bic', e.target.value)} className="admin-glass-input w-full" placeholder="GIBAATWWXXX" />
          </div>
        </div>
      </div>

      {/* Configuration pays */}
      <div className="admin-glass-card p-6">
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: TEXT_PRIMARY, marginBottom: 16 }}>Länderkonfiguration</h2>
        <div>
          <Label>Land für Rechnungsstellung</Label>
          <select value={settings.invoice_country} onChange={e => update('invoice_country', e.target.value)} className="admin-glass-input w-full">
            <option value="austria">Österreich</option>
            <option value="germany" disabled>Deutschland (bald verfügbar)</option>
            <option value="france" disabled>France (bientôt disponible)</option>
          </select>
          <p style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 6 }}>
            Bestimmt die Sprache, die gesetzlichen Texte und das Format der Dokumente.
          </p>
        </div>
      </div>

      {/* Bottom save */}
      <div className="flex justify-end">
        <button onClick={handleSave} disabled={saving} className="admin-glass-btn" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Save size={14} /> {saving ? 'Sauvegarde...' : 'Sauvegarder'}
        </button>
      </div>
    </div>
  );
};

export default AdminSettings;
