import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Save, ExternalLink, Camera } from 'lucide-react';

const invoiceStatusConfig: Record<string, { label: string; color: string }> = {
  draft: { label: 'Brouillon', color: '#9b9590' },
  sent: { label: 'Envoyée', color: '#4da6d9' },
  viewed: { label: 'Vue', color: '#7c5cbf' },
  paid: { label: 'Payée', color: '#0d8a6f' },
  partially_paid: { label: 'Partiel', color: '#d4a55a' },
  overdue: { label: 'En retard', color: '#e8735a' },
  cancelled: { label: 'Annulée', color: '#9b9590' },
  refunded: { label: 'Remboursée', color: '#9b9590' },
};

const subStatusConfig: Record<string, { label: string; color: string }> = {
  trial: { label: 'Essai', color: '#d4a55a' },
  active: { label: 'Actif', color: '#0d8a6f' },
  past_due: { label: 'Impayé', color: '#e8735a' },
  cancelled: { label: 'Résilié', color: '#9b9590' },
};

const PortalProfile = () => {
  const { client, simulationMode } = useOutletContext<{ client: any; simulationMode?: boolean }>();
  const [form, setForm] = useState({ business_name: '', contact_name: '', phone: '', address: '', city: '' });
  const [invoices, setInvoices] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState(client?.avatar_url || '');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || simulationMode) return;
    setUploadingAvatar(true);
    const path = `avatars/${client.id}/${Date.now()}_${file.name}`;
    const { error: upErr } = await supabase.storage.from('client-uploads').upload(path, file, { upsert: true });
    if (upErr) { toast.error('Erreur upload'); setUploadingAvatar(false); return; }
    const { data: urlData } = supabase.storage.from('client-uploads').getPublicUrl(path);
    const url = urlData.publicUrl;
    await supabase.from('clients').update({ avatar_url: url } as any).eq('id', client.id);
    setAvatarUrl(url);
    setUploadingAvatar(false);
    toast.success('Avatar mis à jour');
  };

  useEffect(() => {
    if (!client?.id) return;
    setForm({
      business_name: client.business_name || '',
      contact_name: client.contact_name || '',
      phone: client.phone || '',
      address: client.address || client.company_address || '',
      city: client.city || '',
    });
    supabase.from('invoices').select('*').eq('client_id', client.id).order('created_at', { ascending: false })
      .then(({ data }) => { setInvoices(data || []); setLoading(false); });
  }, [client]);

  const handleSave = async () => {
    if (simulationMode) { toast.info('Mode simulation : modification désactivée'); return; }
    setSaving(true);
    const { error } = await supabase.from('clients').update({
      business_name: form.business_name,
      contact_name: form.contact_name,
      phone: form.phone,
      company_address: form.address,
      city: form.city,
    } as any).eq('id', client.id);
    if (error) toast.error('Erreur de sauvegarde');
    else toast.success('Profil mis à jour');
    setSaving(false);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.6)',
    border: '1px solid var(--glass-border)', borderRadius: 12, fontFamily: 'var(--font-b)',
    fontSize: 14, color: 'var(--charcoal)', outline: 'none',
  };

  const subCfg = subStatusConfig[client?.subscription_status] || subStatusConfig.trial;

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-h)', fontSize: 24, color: 'var(--charcoal)', margin: '0 0 24px' }}>Mon profil</h1>

      {/* Avatar */}
      <div className="flex items-center gap-4 mb-6" style={{ background: 'var(--glass-bg-strong)', backdropFilter: 'blur(20px)', borderRadius: 'var(--r)', border: '1px solid var(--glass-border)', padding: 20 }}>
        <div style={{ position: 'relative' }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%', background: avatarUrl ? `url(${avatarUrl}) center/cover` : 'linear-gradient(135deg, var(--teal), #4da6d9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
            fontFamily: 'var(--font-h)', fontSize: 28, fontWeight: 700,
          }}>
            {!avatarUrl && (client?.business_name?.[0]?.toUpperCase() || '?')}
          </div>
          {!simulationMode && (
            <label style={{
              position: 'absolute', bottom: -2, right: -2, width: 28, height: 28, borderRadius: '50%',
              background: 'var(--teal)', border: '2px solid var(--warm)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#fff',
            }}>
              <Camera size={13} />
              <input type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: 'none' }} />
            </label>
          )}
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font-h)', fontSize: 18, color: 'var(--charcoal)' }}>{client?.business_name}</div>
          <div style={{ fontFamily: 'var(--font-b)', fontSize: 13, color: 'var(--text-mid)' }}>{client?.email}</div>
          {uploadingAvatar && <div style={{ fontFamily: 'var(--font-b)', fontSize: 11, color: 'var(--teal)', marginTop: 2 }}>Upload en cours...</div>}
        </div>
      </div>

      <div style={{ background: 'var(--glass-bg-strong)', backdropFilter: 'blur(20px)', borderRadius: 'var(--r)', border: '1px solid var(--glass-border)', padding: 24, marginBottom: 24 }}>
        <h3 style={{ fontFamily: 'var(--font-b)', fontSize: 15, fontWeight: 600, color: 'var(--charcoal)', margin: '0 0 16px' }}>Informations du business</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label style={{ fontFamily: 'var(--font-b)', fontSize: 12, fontWeight: 600, color: 'var(--text-mid)', marginBottom: 4, display: 'block' }}>Nom du business</label>
            <input value={form.business_name} onChange={e => setForm(f => ({ ...f, business_name: e.target.value }))} style={inputStyle} />
          </div>
          <div>
            <label style={{ fontFamily: 'var(--font-b)', fontSize: 12, fontWeight: 600, color: 'var(--text-mid)', marginBottom: 4, display: 'block' }}>Nom de contact</label>
            <input value={form.contact_name} onChange={e => setForm(f => ({ ...f, contact_name: e.target.value }))} style={inputStyle} />
          </div>
          <div>
            <label style={{ fontFamily: 'var(--font-b)', fontSize: 12, fontWeight: 600, color: 'var(--text-mid)', marginBottom: 4, display: 'block' }}>Téléphone</label>
            <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} style={inputStyle} />
          </div>
          <div>
            <label style={{ fontFamily: 'var(--font-b)', fontSize: 12, fontWeight: 600, color: 'var(--text-mid)', marginBottom: 4, display: 'block' }}>Ville</label>
            <input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} style={inputStyle} />
          </div>
          <div className="sm:col-span-2">
            <label style={{ fontFamily: 'var(--font-b)', fontSize: 12, fontWeight: 600, color: 'var(--text-mid)', marginBottom: 4, display: 'block' }}>Adresse</label>
            <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} style={inputStyle} />
          </div>
        </div>
        <button onClick={handleSave} disabled={saving} style={{
          display: 'flex', alignItems: 'center', gap: 6, marginTop: 16, padding: '10px 24px',
          background: saving ? 'var(--text-light)' : 'var(--teal)', color: '#fff', border: 'none',
          borderRadius: 'var(--pill)', fontFamily: 'var(--font-b)', fontSize: 13, fontWeight: 600, cursor: saving ? 'default' : 'pointer',
        }}>
          <Save size={14} /> {saving ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>

      {/* Subscription */}
      <div style={{ background: 'var(--glass-bg-strong)', backdropFilter: 'blur(20px)', borderRadius: 'var(--r)', border: '1px solid var(--glass-border)', padding: 24, marginBottom: 24 }}>
        <h3 style={{ fontFamily: 'var(--font-b)', fontSize: 15, fontWeight: 600, color: 'var(--charcoal)', margin: '0 0 12px' }}>Abonnement</h3>
        <div className="flex items-center gap-3">
          <span style={{ padding: '6px 16px', borderRadius: 'var(--pill)', background: `${subCfg.color}18`, color: subCfg.color, fontFamily: 'var(--font-m)', fontSize: 12, fontWeight: 600 }}>{subCfg.label}</span>
          {client?.plan && <span style={{ fontFamily: 'var(--font-b)', fontSize: 13, color: 'var(--text-mid)' }}>Plan {client.plan}</span>}
        </div>
      </div>

      {/* Invoices */}
      <div style={{ background: 'var(--glass-bg-strong)', backdropFilter: 'blur(20px)', borderRadius: 'var(--r)', border: '1px solid var(--glass-border)', padding: 24 }}>
        <h3 style={{ fontFamily: 'var(--font-b)', fontSize: 15, fontWeight: 600, color: 'var(--charcoal)', margin: '0 0 16px' }}>Mes factures</h3>
        {loading ? (
          <div style={{ fontFamily: 'var(--font-b)', fontSize: 13, color: 'var(--text-light)' }}>Chargement...</div>
        ) : invoices.length === 0 ? (
          <div style={{ fontFamily: 'var(--font-b)', fontSize: 13, color: 'var(--text-light)' }}>Aucune facture</div>
        ) : (
          <div className="flex flex-col gap-2">
            {invoices.map(inv => {
              const cfg = invoiceStatusConfig[inv.status] || invoiceStatusConfig.draft;
              return (
                <div key={inv.id} className="flex items-center justify-between gap-3 flex-wrap" style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.4)', borderRadius: 12, border: '1px solid rgba(0,0,0,0.04)' }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-b)', fontSize: 14, fontWeight: 600, color: 'var(--charcoal)' }}>
                      {inv.invoice_number} — {Number(inv.total).toFixed(2)} €
                    </div>
                    <div style={{ fontFamily: 'var(--font-b)', fontSize: 12, color: 'var(--text-light)', marginTop: 2 }}>
                      {inv.description || 'Facture'} • Échéance : {new Date(inv.due_date).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span style={{ padding: '3px 10px', borderRadius: 'var(--pill)', background: `${cfg.color}18`, color: cfg.color, fontFamily: 'var(--font-m)', fontSize: 11, fontWeight: 600 }}>{cfg.label}</span>
                    {inv.stripe_payment_url && inv.status !== 'paid' && (
                      <a href={inv.stripe_payment_url} target="_blank" rel="noopener noreferrer" style={{
                        display: 'flex', alignItems: 'center', gap: 4, padding: '4px 12px', background: 'var(--teal)',
                        color: '#fff', borderRadius: 'var(--pill)', textDecoration: 'none', fontFamily: 'var(--font-b)', fontSize: 11, fontWeight: 600,
                      }}>
                        Payer <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default PortalProfile;
