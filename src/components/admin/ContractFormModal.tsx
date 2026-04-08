import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { X, Check, Eye, Plus, Trash2, Link as LinkIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TEXT_PRIMARY = '#1A2332';
const TEXT_SECONDARY = 'rgba(26,35,50,0.55)';
const TEXT_MUTED = 'rgba(26,35,50,0.30)';
const TEAL = '#2A9D8F';

type Client = { id: string; business_name: string; contact_name: string | null; company_address: string | null; email: string | null; company_vat: string | null };
type Project = { id: string; title: string; client_id: string };
type CompanySettings = {
  company_name: string; legal_name: string; address: string; zip_code: string; city: string; country: string;
  email: string; phone: string | null; website: string; logo_url: string | null;
  has_tax_number: boolean; tax_number: string | null; has_vat_number: boolean; vat_number: string | null;
  has_company_registration: boolean; company_registration: string | null; tax_note: string;
  bank_name: string | null; iban: string | null; bic: string | null; account_holder: string;
};

type LineItem = { leistung: string; zeitraum: string; betrag: number };

const currentMonth = () => {
  const d = new Date();
  return d.toLocaleDateString('de-AT', { month: 'long', year: 'numeric' });
};

const generateInvoiceNumber = () => {
  const year = new Date().getFullYear();
  return `${year}-001`;
};

interface ContractFormModalProps {
  onClose: () => void;
  onCreated: () => void;
  editContract?: any;
}

const ContractFormModal = ({ onClose, onCreated, editContract }: ContractFormModalProps) => {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [clientId, setClientId] = useState(editContract?.client_id || '');
  const [projectId, setProjectId] = useState(editContract?.project_id || '');
  const [datum, setDatum] = useState(editContract?.start_date || new Date().toISOString().slice(0, 10));
  const [rechnungsnummer, setRechnungsnummer] = useState('');
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { leistung: 'Web- und App-Development (inkl. Setup & Implementierung)', zeitraum: datum, betrag: 290 },
    { leistung: 'Maintenance / Betreuung (monatlich)', zeitraum: currentMonth(), betrag: 34 },
  ]);
  const [bemerkungen, setBemerkungen] = useState(editContract?.special_conditions || '');
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);

  // Templates
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [saveTemplateName, setSaveTemplateName] = useState('');
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [{ data: cl }, { data: pr }, { data: cs }, { data: ct }] = await Promise.all([
        supabase.from('clients').select('id, business_name, contact_name, company_address, email, company_vat'),
        supabase.from('projects').select('id, title, client_id'),
        supabase.from('company_settings').select('*').limit(1).single(),
        supabase.from('contracts').select('*').order('created_at', { ascending: false }).limit(1),
      ]);
      setClients(cl || []);
      setProjects(pr || []);
      if (cs) setSettings(cs as any);

      // Auto-generate next invoice number
      if (!editContract && ct && ct.length > 0) {
        const lastNum = ct[0].special_conditions?.match(/Rechnungsnummer: (\d{4}-\d{3})/)?.[1];
        if (lastNum) {
          const [y, n] = lastNum.split('-');
          const year = new Date().getFullYear().toString();
          if (y === year) {
            setRechnungsnummer(`${year}-${String(parseInt(n) + 1).padStart(3, '0')}`);
          } else {
            setRechnungsnummer(`${year}-001`);
          }
        } else {
          setRechnungsnummer(generateInvoiceNumber());
        }
      } else if (!editContract) {
        setRechnungsnummer(generateInvoiceNumber());
      }
    };
    load();
  }, [editContract]);

  // Load edit data
  useEffect(() => {
    if (editContract?.content) {
      try {
        const parsed = JSON.parse(editContract.content);
        if (parsed.lineItems) setLineItems(parsed.lineItems);
        if (parsed.rechnungsnummer) setRechnungsnummer(parsed.rechnungsnummer);
        if (parsed.bemerkungen) setBemerkungen(parsed.bemerkungen);
      } catch { /* old format, ignore */ }
    }
  }, [editContract]);

  const selectedClient = useMemo(() => clients.find(c => c.id === clientId) || null, [clients, clientId]);
  const filteredProjects = useMemo(() => projects.filter(p => p.client_id === clientId), [projects, clientId]);
  const gesamtbetrag = useMemo(() => lineItems.reduce((s, l) => s + (l.betrag || 0), 0), [lineItems]);

  const updateLine = (index: number, key: keyof LineItem, value: any) => {
    const updated = [...lineItems];
    (updated[index] as any)[key] = value;
    setLineItems(updated);
  };

  const addLine = () => setLineItems([...lineItems, { leistung: '', zeitraum: '', betrag: 0 }]);
  const removeLine = (i: number) => setLineItems(lineItems.filter((_, idx) => idx !== i));

  const hasBankInfo = settings?.bank_name && settings?.iban;
  const isHonorarnote = !settings?.has_tax_number;

  const handleSave = async () => {
    if (!clientId) { toast.error('Client requis'); return; }
    if (lineItems.length === 0) { toast.error('Mindestens eine Leistung erforderlich'); return; }
    setSaving(true);
    try {
      const contentData = JSON.stringify({ lineItems, rechnungsnummer, bemerkungen, datum });
      const data: any = {
        client_id: clientId,
        project_id: projectId || null,
        setup_price: lineItems.find(l => l.leistung.toLowerCase().includes('setup'))?.betrag || lineItems[0]?.betrag || 0,
        monthly_price: lineItems.find(l => l.leistung.toLowerCase().includes('monatlich') || l.leistung.toLowerCase().includes('maintenance'))?.betrag || 0,
        start_date: datum || null,
        end_date: editContract?.end_date || null,
        special_conditions: bemerkungen || null,
        content: contentData,
        status: 'pending' as any,
      };
      if (editContract) {
        await supabase.from('contracts').update(data).eq('id', editContract.id);
        toast.success('Honorarnote aktualisiert');
      } else {
        await supabase.from('contracts').insert(data);
        toast.success('Honorarnote erstellt');
      }
      onCreated();
    } catch (e) {
      toast.error('Fehler beim Speichern');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTemplate = async () => {
    if (!saveTemplateName.trim()) return;
    // Save as a contract with special status
    const contentData = JSON.stringify({ lineItems, rechnungsnummer: '', bemerkungen, datum: '' });
    await supabase.from('contracts').insert({
      client_id: clientId || clients[0]?.id,
      content: contentData,
      special_conditions: `TEMPLATE:${saveTemplateName}`,
      status: 'cancelled' as any, // use cancelled as template marker
    } as any);
    toast.success(`Template "${saveTemplateName}" gespeichert`);
    setShowSaveTemplate(false);
    setSaveTemplateName('');
  };

  const fmt = (n: number) => n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Editable cell style
  const editableStyle = {
    background: `${TEAL}08`,
    border: `1px solid ${TEAL}20`,
    borderRadius: 6,
    padding: '6px 10px',
    fontSize: 13,
    color: TEXT_PRIMARY,
    outline: 'none',
    width: '100%',
    fontFamily: "'Outfit', sans-serif",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="w-full max-w-4xl max-h-[92vh] overflow-y-auto admin-glass-modal p-6" style={{ fontFamily: "'Outfit', sans-serif" }}>
        <div className="flex items-center justify-between mb-6">
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: TEXT_PRIMARY }}>
            {editContract ? 'Honorarnote bearbeiten' : 'Neue Honorarnote'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: TEXT_SECONDARY }}>
            <X size={22} />
          </button>
        </div>

        {/* Client & Project selection */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div>
            <label style={{ fontSize: 11, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 6, fontWeight: 600 }}>Empfänger (Client) *</label>
            <select value={clientId} onChange={e => { setClientId(e.target.value); setProjectId(''); }} className="admin-glass-input w-full">
              <option value="">Client auswählen</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.business_name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 6, fontWeight: 600 }}>Projekt (optional)</label>
            <select value={projectId} onChange={e => setProjectId(e.target.value)} className="admin-glass-input w-full" disabled={!clientId}>
              <option value="">Kein Projekt</option>
              {filteredProjects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={{ fontSize: 11, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 6, fontWeight: 600 }}>Datum</label>
              <input type="date" value={datum} onChange={e => setDatum(e.target.value)} className="admin-glass-input w-full" />
            </div>
            <div>
              <label style={{ fontSize: 11, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 6, fontWeight: 600 }}>Nr.</label>
              <input value={rechnungsnummer} onChange={e => setRechnungsnummer(e.target.value)} className="admin-glass-input w-full" placeholder="2026-001" />
            </div>
          </div>
        </div>

        {/* WYSIWYG Document */}
        <div className="admin-glass-card p-6 mb-6" style={{ background: 'rgba(255,255,255,0.35)', backdropFilter: 'blur(12px)' }}>
          {/* Header */}
          <div className="flex items-start justify-between mb-6 pb-4" style={{ borderBottom: `2px solid ${TEAL}` }}>
            <div>
              {settings?.logo_url ? (
                <img src={settings.logo_url} alt="Logo" style={{ height: 40, marginBottom: 8 }} />
              ) : (
                <div style={{ fontSize: 20, fontWeight: 700, color: TEXT_PRIMARY, fontFamily: "'Playfair Display', serif" }}>
                  {settings?.company_name || 'Creationation'}
                </div>
              )}
              <div style={{ fontSize: 11, color: TEXT_SECONDARY, lineHeight: 1.6 }}>
                {settings?.legal_name}<br />
                {settings?.address}<br />
                {settings?.zip_code} {settings?.city}, {settings?.country}<br />
                {settings?.email}
                {settings?.phone && <><br />{settings.phone}</>}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: TEXT_PRIMARY, fontFamily: "'Playfair Display', serif", marginBottom: 8 }}>
                {isHonorarnote ? 'Privat-Honorarnote' : 'Rechnung'}
              </div>
              <div style={{ fontSize: 12, color: TEXT_SECONDARY }}>
                Nr. {rechnungsnummer}<br />
                Datum: {datum ? new Date(datum).toLocaleDateString('de-AT') : '—'}
              </div>
            </div>
          </div>

          {/* Recipient */}
          <div className="mb-6" style={{ padding: 12, borderRadius: 8, background: `${TEAL}06`, border: `1px dashed ${TEAL}30` }}>
            <div style={{ fontSize: 10, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4, fontWeight: 600 }}>Empfänger</div>
            {selectedClient ? (
              <div style={{ fontSize: 13, color: TEXT_PRIMARY, lineHeight: 1.6 }}>
                <strong>{selectedClient.business_name}</strong><br />
                {selectedClient.contact_name && <>{selectedClient.contact_name}<br /></>}
                {selectedClient.company_address && <>{selectedClient.company_address}<br /></>}
                {selectedClient.email}
              </div>
            ) : (
              <div style={{ fontSize: 12, color: TEXT_MUTED, fontStyle: 'italic' }}>Client auswählen...</div>
            )}
          </div>

          {/* Leistungsbeschreibung */}
          <div className="mb-6">
            <div style={{ fontSize: 13, fontWeight: 700, color: TEXT_PRIMARY, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Leistungsbeschreibung
            </div>
            <table className="w-full" style={{ fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${TEAL}` }}>
                  <th className="text-left py-2" style={{ color: TEXT_SECONDARY, fontWeight: 600, width: '55%' }}>Leistung</th>
                  <th className="text-left py-2" style={{ color: TEXT_SECONDARY, fontWeight: 600, width: '25%' }}>Zeitraum</th>
                  <th className="text-right py-2" style={{ color: TEXT_SECONDARY, fontWeight: 600, width: '15%' }}>Betrag</th>
                  <th style={{ width: 30 }} />
                </tr>
              </thead>
              <tbody>
                {lineItems.map((item, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
                    <td className="py-2 pr-2">
                      <input value={item.leistung} onChange={e => updateLine(i, 'leistung', e.target.value)} style={editableStyle} />
                    </td>
                    <td className="py-2 pr-2">
                      <input value={item.zeitraum} onChange={e => updateLine(i, 'zeitraum', e.target.value)} style={editableStyle} />
                    </td>
                    <td className="py-2 pr-2">
                      <input type="number" value={item.betrag} onChange={e => updateLine(i, 'betrag', parseFloat(e.target.value) || 0)}
                        style={{ ...editableStyle, textAlign: 'right' }} />
                    </td>
                    <td className="py-2">
                      {lineItems.length > 1 && (
                        <button onClick={() => removeLine(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#E76F51', padding: 4 }}>
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex items-center justify-between mt-3">
              <button onClick={addLine} className="admin-glass-btn-secondary" style={{ fontSize: 11, padding: '4px 12px', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Plus size={12} /> Leistung hinzufügen
              </button>
              <div style={{ fontSize: 16, fontWeight: 700, color: TEXT_PRIMARY }}>
                Gesamtbetrag: <span style={{ color: TEAL }}>{fmt(gesamtbetrag)} €</span>
              </div>
            </div>
          </div>

          {/* Hinweis (tax note) */}
          <div className="mb-6" style={{ padding: 12, borderRadius: 8, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)' }}>
            <div style={{ fontSize: 10, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, fontWeight: 600 }}>Hinweis</div>
            {settings?.has_tax_number ? (
              <div style={{ fontSize: 12, color: TEXT_PRIMARY, lineHeight: 1.6 }}>
                Steuernummer: {settings.tax_number}
                {settings.has_vat_number && <><br />UID-Nr: {settings.vat_number}</>}
                {settings.has_company_registration && <><br />Firmenbuchnummer: {settings.company_registration}</>}
              </div>
            ) : (
              <div style={{ fontSize: 12, color: TEXT_SECONDARY, lineHeight: 1.6, fontStyle: 'italic' }}>
                {settings?.tax_note || 'Steuerhinweis wird aus den Einstellungen geladen...'}
              </div>
            )}
          </div>

          {/* Zahlungsbedingungen */}
          <div className="mb-6" style={{ padding: 12, borderRadius: 8, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)' }}>
            <div style={{ fontSize: 10, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, fontWeight: 600 }}>Zahlungsbedingungen</div>
            {hasBankInfo ? (
              <div style={{ fontSize: 12, color: TEXT_PRIMARY, lineHeight: 1.8 }}>
                Bitte überweisen Sie den Betrag innerhalb von 14 Tagen auf folgendes Konto:<br />
                <strong>{settings!.bank_name}</strong><br />
                IBAN: {settings!.iban}<br />
                BIC: {settings!.bic}<br />
                Kontoinhaber: {settings!.account_holder}
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, color: '#D4A843', fontStyle: 'italic' }}>Bankdaten in den Einstellungen hinterlegen</span>
                <button onClick={() => { onClose(); navigate('/admin/settings'); }} className="admin-glass-btn-secondary" style={{ fontSize: 11, padding: '3px 10px', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <LinkIcon size={12} /> Einstellungen
                </button>
              </div>
            )}
          </div>

          {/* Unterschrift */}
          <div className="mb-4">
            <div style={{ fontSize: 12, color: TEXT_PRIMARY, marginTop: 16 }}>
              Mit freundlichen Grüßen,<br /><br />
              <strong>{settings?.legal_name || 'Diego Renard'}</strong><br />
              {settings?.company_name || 'Creationation'}
            </div>
          </div>
        </div>

        {/* Zusätzliche Bemerkungen */}
        <div className="mb-6">
          <label style={{ fontSize: 11, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 6, fontWeight: 600 }}>
            Zusätzliche Bemerkungen (optional)
          </label>
          <textarea
            value={bemerkungen}
            onChange={e => setBemerkungen(e.target.value)}
            placeholder="Zusätzliche Hinweise für diese Honorarnote..."
            className="admin-glass-input w-full"
            rows={2}
          />
        </div>

        {/* Preview */}
        {showPreview && (
          <div className="mb-6 admin-glass-card p-6" style={{ maxHeight: 500, overflowY: 'auto', background: 'white', color: '#1a1a1a', borderRadius: 12 }}>
            {/* PDF-like preview */}
            <div style={{ fontFamily: "'Outfit', sans-serif" }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: `2px solid ${TEAL}`, paddingBottom: 16, marginBottom: 24 }}>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a' }}>{settings?.company_name || 'Creationation'}</div>
                  <div style={{ fontSize: 11, color: '#666', lineHeight: 1.6 }}>
                    {settings?.legal_name}<br />{settings?.address}<br />{settings?.zip_code} {settings?.city}, {settings?.country}<br />{settings?.email}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a' }}>{isHonorarnote ? 'Privat-Honorarnote' : 'Rechnung'}</div>
                  <div style={{ fontSize: 12, color: '#666' }}>Nr. {rechnungsnummer}<br />Datum: {datum ? new Date(datum).toLocaleDateString('de-AT') : '—'}</div>
                </div>
              </div>
              {selectedClient && (
                <div style={{ marginBottom: 20 }}>
                  <strong>{selectedClient.business_name}</strong><br />
                  {selectedClient.contact_name && <>{selectedClient.contact_name}<br /></>}
                  {selectedClient.company_address && <>{selectedClient.company_address}<br /></>}
                  {selectedClient.email}
                </div>
              )}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20 }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${TEAL}` }}>
                    <th style={{ textAlign: 'left', padding: '8px 0', fontSize: 12, fontWeight: 600 }}>Leistung</th>
                    <th style={{ textAlign: 'left', padding: '8px 0', fontSize: 12, fontWeight: 600 }}>Zeitraum</th>
                    <th style={{ textAlign: 'right', padding: '8px 0', fontSize: 12, fontWeight: 600 }}>Betrag</th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((l, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '8px 0', fontSize: 13 }}>{l.leistung}</td>
                      <td style={{ padding: '8px 0', fontSize: 13, color: '#666' }}>{l.zeitraum}</td>
                      <td style={{ padding: '8px 0', fontSize: 13, textAlign: 'right' }}>{fmt(l.betrag)} €</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: `2px solid ${TEAL}` }}>
                    <td colSpan={2} style={{ padding: '10px 0', fontSize: 14, fontWeight: 700 }}>Gesamtbetrag</td>
                    <td style={{ padding: '10px 0', fontSize: 14, fontWeight: 700, textAlign: 'right', color: TEAL }}>{fmt(gesamtbetrag)} €</td>
                  </tr>
                </tfoot>
              </table>
              {/* Tax note preview */}
              <div style={{ fontSize: 11, color: '#666', marginBottom: 16, padding: '8px 12px', background: '#f9f9f9', borderRadius: 6 }}>
                {settings?.has_tax_number ? (
                  <>Steuernummer: {settings.tax_number}{settings.has_vat_number && <> · UID-Nr: {settings.vat_number}</>}{settings.has_company_registration && <> · FN: {settings.company_registration}</>}</>
                ) : (
                  settings?.tax_note
                )}
              </div>
              {hasBankInfo && (
                <div style={{ fontSize: 12, color: '#333', marginBottom: 20 }}>
                  <strong>Zahlungsbedingungen:</strong><br />
                  Bitte überweisen Sie den Betrag innerhalb von 14 Tagen auf folgendes Konto:<br />
                  {settings!.bank_name}, IBAN: {settings!.iban}, BIC: {settings!.bic}<br />
                  Kontoinhaber: {settings!.account_holder}
                </div>
              )}
              <div style={{ marginTop: 32, fontSize: 13 }}>
                Mit freundlichen Grüßen,<br /><br />
                <strong>{settings?.legal_name}</strong><br />{settings?.company_name}
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={handleSave} disabled={saving} className="admin-glass-btn" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Check size={14} /> {saving ? 'Speichern...' : (editContract ? 'Aktualisieren' : 'Erstellen')}
          </button>
          <button onClick={() => setShowPreview(!showPreview)} className="admin-glass-btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Eye size={14} /> {showPreview ? 'Vorschau ausblenden' : 'Vorschau'}
          </button>
          <button onClick={onClose} className="admin-glass-btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <X size={14} /> Abbrechen
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContractFormModal;
