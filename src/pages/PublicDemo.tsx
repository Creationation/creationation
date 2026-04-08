import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, Phone, Clock, Calendar, ExternalLink } from 'lucide-react';

type Demo = {
  id: string; business_name: string; business_type: string | null;
  logo_url: string | null; primary_color: string; secondary_color: string;
  tagline: string | null; services: string[]; address: string | null;
  city: string | null; phone: string | null; opening_hours: Record<string, { open: string; close: string; closed: boolean }>;
  contact_email: string | null; viewed_count: number; status: string;
};

const PublicDemo = () => {
  const { token } = useParams<{ token: string }>();
  const [demo, setDemo] = useState<Demo | null>(null);
  const [expired, setExpired] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showBooking, setShowBooking] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!token) return;
      const { data, error } = await supabase.from('demos').select('*').eq('access_token', token).maybeSingle();
      if (error || !data) { setExpired(true); setLoading(false); return; }

      const d = data as any;
      if (!d.is_active || new Date(d.expires_at) < new Date()) {
        setExpired(true); setLoading(false); return;
      }

      setDemo(d);
      setLoading(false);

      // Track view (only increment, don't need auth)
      try {
        await supabase.from('demos').update({
          viewed_count: (d.viewed_count || 0) + 1,
          last_viewed_at: new Date().toISOString(),
          status: d.status === 'sent' || d.status === 'draft' ? 'viewed' : d.status,
        } as any).eq('id', d.id);
      } catch (e) {
        console.warn('Could not track view', e);
      }
    };
    load();
  }, [token]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f6f1e9' }}>
        <p style={{ fontFamily: "'Outfit', sans-serif", color: '#888' }}>Laden...</p>
      </div>
    );
  }

  if (expired) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f6f1e9', padding: 24 }}>
        <div style={{ background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(20px)', borderRadius: 20, padding: 48, textAlign: 'center', maxWidth: 480 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, fontFamily: "'Playfair Display', serif", color: '#1A2332', marginBottom: 12 }}>
            Diese Demo ist abgelaufen
          </h1>
          <p style={{ fontSize: 15, color: 'rgba(26,35,50,0.6)', fontFamily: "'Outfit', sans-serif", marginBottom: 24 }}>
            Kontaktieren Sie uns für eine neue Demo.
          </p>
          <a href="https://creationation.lovable.app" style={{
            padding: '12px 28px', borderRadius: 99, background: '#2A9D8F', color: '#fff',
            textDecoration: 'none', fontWeight: 600, fontFamily: "'Outfit', sans-serif", fontSize: 14,
          }}>creationation.app besuchen</a>
        </div>
      </div>
    );
  }

  if (!demo) return null;

  const pc = demo.primary_color || '#2A9D8F';
  const sc = demo.secondary_color || '#E9C46A';
  const services = Array.isArray(demo.services) ? demo.services : [];
  const hours = demo.opening_hours || {};
  const initials = demo.business_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div style={{ minHeight: '100vh', background: '#f6f1e9', fontFamily: "'Outfit', sans-serif" }}>
      {/* Top banner */}
      <div style={{
        background: `linear-gradient(135deg, ${pc}, ${sc})`, color: '#fff',
        padding: '10px 16px', textAlign: 'center', fontSize: 13, fontWeight: 500,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, flexWrap: 'wrap',
      }}>
        <span>Dies ist eine Demo-Version Ihrer App. Interessiert?</span>
        <a href="mailto:hello@creationation.app" style={{
          padding: '5px 14px', borderRadius: 99, background: 'rgba(255,255,255,0.25)',
          color: '#fff', textDecoration: 'none', fontWeight: 600, fontSize: 12,
        }}>Kontakt</a>
      </div>

      {/* Hero */}
      <div style={{
        background: `linear-gradient(135deg, ${pc}, ${pc}dd)`,
        padding: '48px 24px 40px', textAlign: 'center', position: 'relative', overflow: 'hidden',
      }}>
        {/* Decorative blobs */}
        <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: '50%', background: sc, opacity: 0.15 }} />
        <div style={{ position: 'absolute', bottom: -40, left: -40, width: 150, height: 150, borderRadius: '50%', background: '#fff', opacity: 0.08 }} />

        {demo.logo_url ? (
          <img src={demo.logo_url} alt={demo.business_name} style={{ width: 80, height: 80, borderRadius: 20, objectFit: 'cover', margin: '0 auto 16px', border: '3px solid rgba(255,255,255,0.3)' }} />
        ) : (
          <div style={{
            width: 80, height: 80, borderRadius: 20, margin: '0 auto 16px',
            background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, fontWeight: 700, color: '#fff', border: '2px solid rgba(255,255,255,0.3)',
          }}>{initials}</div>
        )}
        <h1 style={{ fontSize: 32, fontWeight: 700, color: '#fff', margin: 0, fontFamily: "'Playfair Display', serif" }}>
          {demo.business_name}
        </h1>
        {demo.tagline && <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.85)', marginTop: 8 }}>{demo.tagline}</p>}

        <button onClick={() => setShowBooking(true)} style={{
          marginTop: 24, padding: '14px 36px', borderRadius: 99, border: 'none', cursor: 'pointer',
          background: sc, color: '#fff', fontWeight: 700, fontSize: 16, fontFamily: "'Outfit', sans-serif",
          boxShadow: `0 8px 30px ${sc}50`,
        }}>
          Termin buchen
        </button>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '24px 16px' }}>
        {/* Services */}
        {services.length > 0 && (
          <div style={{
            background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(16px)',
            borderRadius: 16, padding: 24, marginBottom: 16, border: '1px solid rgba(255,255,255,0.4)',
          }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1A2332', marginBottom: 16, fontFamily: "'Playfair Display', serif" }}>
              Unsere Leistungen
            </h2>
            <div className="space-y-3">
              {services.map((s, i) => (
                <div key={i} className="flex items-center gap-3" style={{ padding: '10px 14px', borderRadius: 12, background: `${pc}08`, border: `1px solid ${pc}15` }}>
                  <div style={{ width: 8, height: 8, borderRadius: 99, background: pc }} />
                  <span style={{ fontSize: 15, color: '#1A2332', fontWeight: 500 }}>{s}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Opening Hours */}
        {Object.keys(hours).length > 0 && (
          <div style={{
            background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(16px)',
            borderRadius: 16, padding: 24, marginBottom: 16, border: '1px solid rgba(255,255,255,0.4)',
          }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1A2332', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, fontFamily: "'Playfair Display', serif" }}>
              <Clock size={18} style={{ color: pc }} /> Öffnungszeiten
            </h2>
            <div className="space-y-2">
              {Object.entries(hours).map(([day, h]: [string, any]) => (
                <div key={day} className="flex justify-between" style={{ fontSize: 14, color: '#1A2332', padding: '4px 0' }}>
                  <span style={{ fontWeight: 500 }}>{day}</span>
                  <span style={{ color: h.closed ? '#E76F51' : 'rgba(26,35,50,0.6)' }}>
                    {h.closed ? 'Geschlossen' : `${h.open} – ${h.close}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contact */}
        {(demo.address || demo.phone) && (
          <div style={{
            background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(16px)',
            borderRadius: 16, padding: 24, marginBottom: 16, border: '1px solid rgba(255,255,255,0.4)',
          }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1A2332', marginBottom: 16, fontFamily: "'Playfair Display', serif" }}>
              Kontakt
            </h2>
            {demo.address && (
              <div className="flex items-start gap-3 mb-3" style={{ fontSize: 14, color: '#1A2332' }}>
                <MapPin size={16} style={{ color: pc, marginTop: 2 }} />
                <span>{demo.address}{demo.city ? `, ${demo.city}` : ''}</span>
              </div>
            )}
            {demo.phone && (
              <div className="flex items-center gap-3" style={{ fontSize: 14, color: '#1A2332' }}>
                <Phone size={16} style={{ color: pc }} />
                <a href={`tel:${demo.phone}`} style={{ color: pc, textDecoration: 'none', fontWeight: 500 }}>{demo.phone}</a>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', padding: '32px 16px', fontSize: 12, color: 'rgba(26,35,50,0.4)' }}>
        <p>Diese Demo wurde erstellt von{' '}
          <a href="https://creationation.lovable.app" style={{ color: pc, textDecoration: 'none', fontWeight: 600 }}>Creationation</a>
        </p>
      </div>

      {/* Booking modal */}
      {showBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(6px)' }} onClick={() => setShowBooking(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)',
            borderRadius: 20, padding: 32, maxWidth: 400, margin: 16, textAlign: 'center',
          }}>
            <Calendar size={40} style={{ color: pc, margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: 20, fontWeight: 700, color: '#1A2332', fontFamily: "'Playfair Display', serif", marginBottom: 8 }}>
              Termin buchen
            </h3>
            <p style={{ fontSize: 14, color: 'rgba(26,35,50,0.6)', marginBottom: 24 }}>
              Diese Funktion wird in der vollständigen App verfügbar sein.
            </p>
            <a href="mailto:hello@creationation.app" style={{
              display: 'inline-block', padding: '12px 28px', borderRadius: 99,
              background: pc, color: '#fff', textDecoration: 'none', fontWeight: 600, fontSize: 14,
            }}>Kontaktieren Sie uns</a>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicDemo;
