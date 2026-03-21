import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Save, Mail } from 'lucide-react';

const PortalProfile = () => {
  const { client } = useOutletContext<{ client: { id: string; email: string | null } }>();
  const [form, setForm] = useState({ contact_name: '', business_name: '', company_address: '', phone: '', company_vat: '', preferred_language: 'fr' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!client?.id) return;
    supabase.from('clients').select('contact_name,business_name,company_address,phone,company_vat,preferred_language')
      .eq('id', client.id).single().then(({ data }) => {
        if (data) setForm({
          contact_name: (data as any).contact_name || '',
          business_name: (data as any).business_name || '',
          company_address: (data as any).company_address || '',
          phone: (data as any).phone || '',
          company_vat: (data as any).company_vat || '',
          preferred_language: (data as any).preferred_language || 'fr',
        });
        setLoading(false);
      });
  }, [client]);

  const save = async () => {
    await supabase.from('clients').update(form as any).eq('id', client.id);
    toast.success('Profil mis à jour');
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
