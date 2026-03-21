import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Save, Mail, Camera } from 'lucide-react';

const PortalProfile = () => {
  const { client } = useOutletContext<{ client: { id: string; email: string | null; avatar_url?: string | null } }>();
  const [form, setForm] = useState({ contact_name: '', business_name: '', company_address: '', phone: '', company_vat: '', preferred_language: 'fr' });
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    if (!client?.id) return;
    supabase.from('clients').select('contact_name,business_name,company_address,phone,company_vat,preferred_language,avatar_url')
      .eq('id', client.id).single().then(({ data }) => {
        if (data) {
          setForm({
            contact_name: (data as any).contact_name || '',
            business_name: (data as any).business_name || '',
            company_address: (data as any).company_address || '',
            phone: (data as any).phone || '',
            company_vat: (data as any).company_vat || '',
            preferred_language: (data as any).preferred_language || 'fr',
          });
          setAvatarUrl((data as any).avatar_url || null);
        }
        setLoading(false);
      });
  }, [client]);

  const save = async () => {
    await supabase.from('clients').update(form as any).eq('id', client.id);
    toast.success('Profil mis à jour');
  };

  const uploadAvatar = async (file: File) => {
    if (file.size > 2 * 1024 * 1024) { toast.error('Image trop grande (max 2MB)'); return; }
    setUploadingAvatar(true);
    const path = `${client.id}/avatar_${Date.now()}.${file.name.split('.').pop()}`;
    const { error } = await supabase.storage.from('client-uploads').upload(path, file);
    if (error) { toast.error('Erreur upload'); setUploadingAvatar(false); return; }
    const { data } = supabase.storage.from('client-uploads').getPublicUrl(path);
    await supabase.from('clients').update({ avatar_url: data.publicUrl } as any).eq('id', client.id);
    setAvatarUrl(data.publicUrl);
    setUploadingAvatar(false);
    toast.success('Avatar mis à jour');
  };

  const sendMagicLink = async () => {
    if (!client?.email) return;
    await supabase.auth.signInWithOtp({ email: client.email, options: { emailRedirectTo: `${window.location.origin}/portal` } });
    toast.success('Lien de connexion envoyé');
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center', fontFamily: 'var(--font-b)', color: 'var(--text-light)' }}>Chargement...</div>;

  const inputStyle = {
    width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid var(--glass-border)',
    fontFamily: 'var(--font-b)', fontSize: 14, outline: 'none', background: 'rgba(255,255,255,0.6)',
  };
  const labelStyle = { fontFamily: 'var(--font-b)', fontSize: 12, color: 'var(--text-light)', marginBottom: 4, display: 'block' as const };

  return (
    <div className="space-y-6 max-w-lg">
      <h1 style={{ fontFamily: 'var(--font-h)', fontSize: 24, color: 'var(--charcoal)' }}>Mon profil</h1>

      <div style={{ background: 'var(--glass-bg-strong)', borderRadius: 'var(--r-lg)', border: '1px solid var(--glass-border)', padding: 24, backdropFilter: 'blur(16px)' }}>
        <div className="space-y-4">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div style={{ position: 'relative', width: 64, height: 64 }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%', overflow: 'hidden',
                background: 'var(--teal-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '2px solid var(--glass-border)',
              }}>
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontFamily: 'var(--font-h)', fontSize: 24, color: 'var(--teal)' }}>
                    {form.contact_name?.[0]?.toUpperCase() || form.business_name?.[0]?.toUpperCase() || '?'}
                  </span>
                )}
              </div>
              <button
                onClick={() => { const i = document.createElement('input'); i.type = 'file'; i.accept = 'image/*'; i.onchange = () => { if (i.files?.[0]) uploadAvatar(i.files[0]); }; i.click(); }}
                disabled={uploadingAvatar}
                style={{
                  position: 'absolute', bottom: -2, right: -2, width: 24, height: 24, borderRadius: '50%',
                  background: 'var(--teal)', border: '2px solid white', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Camera size={12} color="#fff" />
              </button>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-b)', fontSize: 14, fontWeight: 600, color: 'var(--charcoal)' }}>{form.contact_name || form.business_name}</div>
              <div style={{ fontFamily: 'var(--font-b)', fontSize: 12, color: 'var(--text-light)' }}>{client?.email}</div>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Nom complet</label>
            <input value={form.contact_name} onChange={e => setForm({ ...form, contact_name: e.target.value })} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Entreprise</label>
            <input value={form.business_name} onChange={e => setForm({ ...form, business_name: e.target.value })} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Adresse</label>
            <input value={form.company_address} onChange={e => setForm({ ...form, company_address: e.target.value })} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Téléphone</label>
            <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Email (connexion)</label>
            <input value={client?.email || ''} disabled style={{ ...inputStyle, background: 'rgba(0,0,0,0.04)', color: 'var(--text-light)' }} />
          </div>
          <div>
            <label style={labelStyle}>N° TVA</label>
            <input value={form.company_vat} onChange={e => setForm({ ...form, company_vat: e.target.value })} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Langue</label>
            <select value={form.preferred_language} onChange={e => setForm({ ...form, preferred_language: e.target.value })} style={inputStyle}>
              <option value="fr">Français</option>
              <option value="en">English</option>
              <option value="de">Deutsch</option>
            </select>
          </div>

          <button onClick={save} style={{
            width: '100%', padding: '12px 0', background: 'var(--teal)', color: '#fff', border: 'none',
            borderRadius: 'var(--pill)', fontFamily: 'var(--font-b)', fontSize: 14, fontWeight: 600,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            <Save size={16} /> Enregistrer
          </button>
        </div>
      </div>

      {/* Security */}
      <div style={{ background: 'var(--glass-bg-strong)', borderRadius: 'var(--r-lg)', border: '1px solid var(--glass-border)', padding: 24, backdropFilter: 'blur(16px)' }}>
        <h3 style={{ fontFamily: 'var(--font-h)', fontSize: 16, color: 'var(--charcoal)', margin: '0 0 12px' }}>Sécurité</h3>
        <button onClick={sendMagicLink} style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px',
          background: 'transparent', border: '1px solid var(--glass-border)', borderRadius: 'var(--pill)',
          fontFamily: 'var(--font-b)', fontSize: 13, color: 'var(--text-mid)', cursor: 'pointer',
        }}>
          <Mail size={14} /> Recevoir un nouveau lien de connexion
        </button>
      </div>
    </div>
  );
};

export default PortalProfile;
