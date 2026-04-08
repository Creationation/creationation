import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, Phone, Clock, Calendar, Camera, Star, Gift, Play, MessageCircle, ChevronRight, Sparkles } from 'lucide-react';
import { useCountUp } from '@/hooks/useCountUp';

type Demo = {
  id: string; business_name: string; business_type: string | null;
  logo_url: string | null; primary_color: string; secondary_color: string;
  tagline: string | null; services: string[]; address: string | null;
  city: string | null; phone: string | null;
  opening_hours: Record<string, { open: string; close: string; closed: boolean }>;
  contact_email: string | null; viewed_count: number; status: string;
};

/* ─── Animated mesh background ─── */
const MeshBg = ({ pc, sc }: { pc: string; sc: string }) => (
  <div className="fixed inset-0 -z-10 overflow-hidden" style={{ background: '#f6f1e9' }}>
    {[
      { color: pc, w: 500, h: 500, top: '-10%', left: '-10%', dur: '18s' },
      { color: sc, w: 400, h: 400, top: '50%', right: '-8%', dur: '22s' },
      { color: pc, w: 350, h: 350, bottom: '5%', left: '20%', dur: '25s' },
      { color: sc, w: 300, h: 300, top: '20%', left: '60%', dur: '20s' },
    ].map((o, i) => (
      <div key={i} className="absolute rounded-full" style={{
        width: o.w, height: o.h, background: o.color, opacity: 0.12,
        filter: 'blur(100px)', top: o.top, left: o.left, right: (o as any).right, bottom: (o as any).bottom,
        animation: `float${i} ${o.dur} ease-in-out infinite alternate`,
      }} />
    ))}
    <style>{`
      @keyframes float0 { from{transform:translate(0,0) scale(1)} to{transform:translate(40px,30px) scale(1.1)} }
      @keyframes float1 { from{transform:translate(0,0) scale(1)} to{transform:translate(-30px,40px) scale(1.05)} }
      @keyframes float2 { from{transform:translate(0,0) scale(1)} to{transform:translate(30px,-20px) scale(1.08)} }
      @keyframes float3 { from{transform:translate(0,0) scale(1)} to{transform:translate(-20px,-30px) scale(1.12)} }
    `}</style>
  </div>
);

/* ─── Glass Card ─── */
const Glass = ({ children, className = '', style = {} }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) => (
  <div className={`backdrop-blur-2xl border border-white/40 ${className}`}
    style={{ background: 'rgba(255,255,255,0.45)', borderRadius: 24, ...style }}>
    {children}
  </div>
);

/* ─── Scroll reveal hook ─── */
const useReveal = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.15 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
};

const RevealSection = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => {
  const { ref, visible } = useReveal();
  return (
    <div ref={ref} className={className} style={{
      opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(30px)',
      transition: 'opacity 0.7s cubic-bezier(.22,1,.36,1), transform 0.7s cubic-bezier(.22,1,.36,1)',
    }}>{children}</div>
  );
};

/* ─── Stat counter ─── */
const StatCard = ({ label, value, suffix = '', pc }: { label: string; value: number; suffix?: string; pc: string }) => {
  const { count, ref } = useCountUp(value);
  return (
    <Glass className="flex-1 min-w-[100px] p-4 text-center">
      <span ref={ref} className="block text-2xl font-bold" style={{ color: pc }}>{count}{suffix}</span>
      <span className="text-xs mt-1 block" style={{ color: '#6b6560' }}>{label}</span>
    </Glass>
  );
};

/* ─── Day name map ─── */
const dayOrder = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
const todayIndex = (new Date().getDay() + 6) % 7; // Mon=0
const todayName = dayOrder[todayIndex];

const PublicDemo = () => {
  const { token } = useParams<{ token: string }>();
  const [demo, setDemo] = useState<Demo | null>(null);
  const [expired, setExpired] = useState(false);
  const [loading, setLoading] = useState(true);
  const [bookingSlot, setBookingSlot] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!token) return;
      try {
        const { data, error } = await supabase.functions.invoke('track-demo-view', { body: { accessToken: token } });
        if (error || !(data as any)?.demo) { setExpired(true); setLoading(false); return; }
        const r = data as any;
        if (r.expired) { setExpired(true); setLoading(false); return; }
        setDemo(r.demo); setLoading(false);
      } catch { setExpired(true); setLoading(false); }
    };
    load();
  }, [token]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#f6f1e9' }}>
      <div className="w-10 h-10 rounded-full border-3 border-t-transparent animate-spin" style={{ borderColor: '#2A9D8F', borderTopColor: 'transparent' }} />
    </div>
  );

  if (expired || !demo) return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#f6f1e9' }}>
      <Glass className="p-10 text-center max-w-md">
        <h1 className="text-2xl font-bold mb-3" style={{ fontFamily: "'Playfair Display',serif", color: '#1A2332' }}>Diese Demo ist nicht verfügbar</h1>
        <p className="text-sm mb-6" style={{ color: '#6b6560' }}>Kontaktieren Sie uns für eine neue Demo.</p>
        <a href="https://creationation.app" className="inline-block px-7 py-3 rounded-full text-white font-semibold text-sm" style={{ background: '#2A9D8F' }}>creationation.app besuchen</a>
      </Glass>
    </div>
  );

  const pc = demo.primary_color || '#2A9D8F';
  const sc = demo.secondary_color || '#E9C46A';
  const services = Array.isArray(demo.services) ? demo.services : [];
  const hours = demo.opening_hours || {};
  const initials = demo.business_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  const sortedHours = dayOrder
    .filter(d => hours[d])
    .map(d => ({ day: d, ...hours[d] }));

  // Mini calendar slots
  const slots = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
  const slotAvail = [true, true, false, true, false, true, true, false];

  const serviceEmojis = ['✂️', '💆', '💅', '🧖', '💇', '🪮', '🧴', '💄', '🌿', '⭐'];

  return (
    <div className="min-h-screen relative" style={{ fontFamily: "'Outfit',sans-serif" }}>
      <MeshBg pc={pc} sc={sc} />

      {/* ─── Top banner ─── */}
      <div className="sticky top-0 z-50 backdrop-blur-xl border-b border-white/30" style={{ background: 'rgba(255,255,255,0.35)' }}>
        <div className="flex items-center justify-center gap-3 px-4 py-2.5 flex-wrap text-center">
          <span className="text-xs font-medium" style={{ color: '#2a2722' }}>Dies ist eine Demo-Version Ihrer App. Interessiert?</span>
          <a href="mailto:hello@creationation.app" className="px-4 py-1.5 rounded-full text-xs font-bold text-white transition-all hover:scale-105"
            style={{ background: pc, boxShadow: `0 4px 20px ${pc}40` }}>Kontakt</a>
        </div>
      </div>

      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden pt-16 pb-12 px-6 text-center" style={{
        background: `linear-gradient(135deg, ${pc}, ${pc}cc, ${sc}88)`,
        borderRadius: '0 0 40px 40px',
      }}>
        {/* Floating shapes */}
        <div className="absolute top-10 right-10 w-24 h-24 rounded-full opacity-20" style={{ background: sc, animation: 'float0 12s ease-in-out infinite alternate' }} />
        <div className="absolute bottom-10 left-10 w-32 h-32 rounded-3xl rotate-45 opacity-10" style={{ background: '#fff', animation: 'float1 15s ease-in-out infinite alternate' }} />

        {/* Logo */}
        {demo.logo_url ? (
          <img src={demo.logo_url} alt={demo.business_name} className="w-24 h-24 rounded-3xl mx-auto mb-5 object-cover shadow-xl" style={{ border: '3px solid rgba(255,255,255,0.4)' }} />
        ) : (
          <div className="w-24 h-24 rounded-3xl mx-auto mb-5 flex items-center justify-center text-3xl font-bold text-white shadow-xl"
            style={{ background: `linear-gradient(135deg, rgba(255,255,255,0.3), rgba(255,255,255,0.1))`, backdropFilter: 'blur(20px)', border: '2px solid rgba(255,255,255,0.4)' }}>
            {initials}
          </div>
        )}

        <h1 className="text-4xl md:text-5xl font-bold text-white mb-2" style={{ fontFamily: "'Playfair Display',serif" }}>{demo.business_name}</h1>
        {demo.tagline && <p className="text-base text-white/80 mb-8 max-w-md mx-auto">{demo.tagline}</p>}

        {/* CTA */}
        <button onClick={() => setBookingSlot('open')} className="relative px-10 py-4 rounded-full text-white font-bold text-lg transition-all hover:scale-105"
          style={{ background: sc, boxShadow: `0 8px 30px ${sc}50` }}>
          <span className="absolute inset-0 rounded-full animate-pulse opacity-30" style={{ background: sc, filter: 'blur(15px)' }} />
          <span className="relative z-10 flex items-center gap-2"><Calendar size={20} /> Termin buchen</span>
        </button>

        {/* Stats */}
        <div className="flex gap-3 mt-10 max-w-sm mx-auto">
          <StatCard label="Kunden" value={500} suffix="+" pc="#fff" />
          <StatCard label="Bewertung" value={49} suffix="" pc="#fff" />
          <StatCard label="24/7" value={24} suffix="h" pc="#fff" />
        </div>
      </section>

      {/* ─── Content ─── */}
      <div className="max-w-lg mx-auto px-4 py-8 space-y-6">

        {/* Services */}
        {services.length > 0 && (
          <RevealSection>
            <h2 className="text-xl font-bold mb-4" style={{ fontFamily: "'Playfair Display',serif", color: '#2a2722' }}>
              <Sparkles size={18} className="inline mr-2" style={{ color: pc }} />Unsere Leistungen
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {services.map((s, i) => (
                <Glass key={i} className="p-4 transition-all hover:scale-[1.03] cursor-default" style={{ boxShadow: 'none' }}>
                  <span className="text-2xl block mb-2">{serviceEmojis[i % serviceEmojis.length]}</span>
                  <span className="text-sm font-semibold block" style={{ color: '#2a2722' }}>{s}</span>
                </Glass>
              ))}
            </div>
          </RevealSection>
        )}

        {/* Gallery placeholder */}
        <RevealSection>
          <h2 className="text-xl font-bold mb-4" style={{ fontFamily: "'Playfair Display',serif", color: '#2a2722' }}>
            <Camera size={18} className="inline mr-2" style={{ color: pc }} />Unsere Arbeit
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Glass key={i} className="aspect-square flex flex-col items-center justify-center gap-1 opacity-60">
                <Camera size={20} style={{ color: pc }} />
                <span className="text-[10px]" style={{ color: '#9a9490' }}>Foto</span>
              </Glass>
            ))}
          </div>
        </RevealSection>

        {/* Reviews */}
        <RevealSection>
          <h2 className="text-xl font-bold mb-4" style={{ fontFamily: "'Playfair Display',serif", color: '#2a2722' }}>
            <Star size={18} className="inline mr-2" style={{ color: sc }} />Das sagen unsere Kunden
          </h2>
          <div className="space-y-3">
            {[
              { name: 'Anna M.', text: 'Absolut begeistert! Die Buchung war so einfach und der Service erstklassig.', stars: 5 },
              { name: 'Thomas K.', text: 'Endlich eine App die wirklich funktioniert. Termine buchen war noch nie so einfach.', stars: 5 },
              { name: 'Sarah L.', text: 'Tolles Erlebnis, sehr professionell. Ich komme definitiv wieder!', stars: 4 },
            ].map((r, i) => (
              <Glass key={i} className="p-5">
                <div className="flex gap-0.5 mb-2">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} size={14} fill={j < r.stars ? sc : 'transparent'} style={{ color: j < r.stars ? sc : '#ccc' }} />
                  ))}
                </div>
                <p className="text-sm mb-2 italic" style={{ color: '#4a4540' }}>"{r.text}"</p>
                <span className="text-xs font-semibold" style={{ color: pc }}>{r.name}</span>
              </Glass>
            ))}
          </div>
        </RevealSection>

        {/* Opening Hours */}
        {sortedHours.length > 0 && (
          <RevealSection>
            <h2 className="text-xl font-bold mb-4" style={{ fontFamily: "'Playfair Display',serif", color: '#2a2722' }}>
              <Clock size={18} className="inline mr-2" style={{ color: pc }} />Öffnungszeiten
            </h2>
            <Glass className="p-5">
              <div className="space-y-2.5">
                {sortedHours.map(({ day, open, close, closed }) => {
                  const isToday = day === todayName;
                  return (
                    <div key={day} className="flex justify-between items-center text-sm" style={{
                      color: '#2a2722', padding: isToday ? '6px 10px' : '2px 0',
                      borderRadius: isToday ? 12 : 0,
                      background: isToday ? `${pc}12` : 'transparent',
                    }}>
                      <span className="font-medium flex items-center gap-2">
                        {day}
                        {isToday && <span className="text-[10px] px-2 py-0.5 rounded-full text-white font-bold" style={{ background: pc }}>Heute</span>}
                      </span>
                      <span style={{ color: closed ? '#E76F51' : '#6b6560' }}>
                        {closed ? 'Geschlossen' : `${open} – ${close}`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Glass>
          </RevealSection>
        )}

        {/* Loyalty Program */}
        <RevealSection>
          <h2 className="text-xl font-bold mb-4" style={{ fontFamily: "'Playfair Display',serif", color: '#2a2722' }}>
            <Gift size={18} className="inline mr-2" style={{ color: sc }} />Treueprogramm
          </h2>
          <Glass className="p-6 text-center">
            <Gift size={36} className="mx-auto mb-3" style={{ color: sc }} />
            <div className="w-full h-3 rounded-full mb-3 overflow-hidden" style={{ background: `${pc}15` }}>
              <div className="h-full rounded-full transition-all" style={{ width: '60%', background: `linear-gradient(90deg, ${pc}, ${sc})` }} />
            </div>
            <p className="text-sm font-semibold" style={{ color: '#2a2722' }}>Noch 4 Besuche bis zur Belohnung! 🎁</p>
            <p className="text-xs mt-1" style={{ color: '#9a9490' }}>Sammeln Sie Punkte bei jedem Besuch</p>
          </Glass>
        </RevealSection>

        {/* Online Booking */}
        <RevealSection>
          <h2 className="text-xl font-bold mb-4" style={{ fontFamily: "'Playfair Display',serif", color: '#2a2722' }}>
            <Calendar size={18} className="inline mr-2" style={{ color: pc }} />Online Buchung
          </h2>
          <Glass className="p-5">
            <p className="text-xs font-medium mb-3" style={{ color: '#6b6560' }}>Verfügbare Termine heute</p>
            <div className="grid grid-cols-4 gap-2">
              {slots.map((s, i) => (
                <button key={s} onClick={() => setBookingSlot(s)}
                  className="py-2.5 rounded-xl text-xs font-semibold transition-all hover:scale-105"
                  style={{
                    background: slotAvail[i] ? `${pc}15` : 'rgba(0,0,0,0.04)',
                    color: slotAvail[i] ? pc : '#ccc',
                    border: slotAvail[i] ? `1px solid ${pc}30` : '1px solid transparent',
                    cursor: slotAvail[i] ? 'pointer' : 'default',
                  }}
                  disabled={!slotAvail[i]}>
                  {s}
                </button>
              ))}
            </div>
          </Glass>
        </RevealSection>

        {/* Contact */}
        {(demo.address || demo.phone) && (
          <RevealSection>
            <h2 className="text-xl font-bold mb-4" style={{ fontFamily: "'Playfair Display',serif", color: '#2a2722' }}>
              <MapPin size={18} className="inline mr-2" style={{ color: pc }} />Kontakt
            </h2>
            <Glass className="p-5 space-y-4">
              {demo.address && (
                <>
                  <div className="w-full h-32 rounded-2xl flex items-center justify-center" style={{ background: `${pc}08`, border: `1px solid ${pc}15` }}>
                    <MapPin size={28} style={{ color: pc, opacity: 0.5 }} />
                  </div>
                  <div className="flex items-start gap-3 text-sm" style={{ color: '#2a2722' }}>
                    <MapPin size={16} style={{ color: pc, marginTop: 2, flexShrink: 0 }} />
                    <span>{demo.address}{demo.city ? `, ${demo.city}` : ''}</span>
                  </div>
                  <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((demo.address || '') + ' ' + (demo.city || ''))}`}
                    target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold text-white transition-all hover:scale-105"
                    style={{ background: pc }}>
                    Route planen <ChevronRight size={14} />
                  </a>
                </>
              )}
              {demo.phone && (
                <div className="flex items-center gap-3 text-sm" style={{ color: '#2a2722' }}>
                  <Phone size={16} style={{ color: pc, flexShrink: 0 }} />
                  <a href={`tel:${demo.phone}`} className="font-semibold" style={{ color: pc }}>{demo.phone}</a>
                </div>
              )}
            </Glass>
          </RevealSection>
        )}

        {/* Telegram Bot */}
        <RevealSection>
          <h2 className="text-xl font-bold mb-4" style={{ fontFamily: "'Playfair Display',serif", color: '#2a2722' }}>
            <MessageCircle size={18} className="inline mr-2" style={{ color: pc }} />Telegram Management
          </h2>
          <Glass className="p-5">
            <div className="space-y-2.5">
              {[
                { from: 'bot', text: '📅 Neue Buchung: Anna M., 14:00' },
                { from: 'bot', text: '📊 3 Termine heute, 2 morgen' },
                { from: 'user', text: '✅ Bestätigt' },
              ].map((m, i) => (
                <div key={i} className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className="px-4 py-2.5 rounded-2xl text-xs max-w-[80%]" style={{
                    background: m.from === 'user' ? pc : 'rgba(255,255,255,0.7)',
                    color: m.from === 'user' ? '#fff' : '#2a2722',
                  }}>{m.text}</div>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-center mt-3" style={{ color: '#9a9490' }}>Verwalten Sie alles direkt von Ihrem Handy</p>
          </Glass>
        </RevealSection>

        {/* Promo video placeholder */}
        <RevealSection>
          <Glass className="p-8 text-center">
            <div className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ background: `${pc}15` }}>
              <Play size={28} style={{ color: pc }} />
            </div>
            <p className="text-sm font-semibold" style={{ color: '#2a2722' }}>Ihr Promo-Video hier</p>
            <p className="text-xs mt-1" style={{ color: '#9a9490' }}>Präsentieren Sie Ihr Geschäft in 30 Sekunden</p>
          </Glass>
        </RevealSection>
      </div>

      {/* ─── Footer ─── */}
      <div className="text-center py-10 px-6">
        <div className="w-10 h-10 rounded-xl mx-auto mb-3 flex items-center justify-center text-white font-bold text-lg" style={{ background: `linear-gradient(135deg, ${pc}, ${sc})` }}>C</div>
        <p className="text-xs" style={{ color: '#9a9490' }}>
          Erstellt mit <a href="https://creationation.app" className="font-semibold" style={{ color: pc }}>Creationation</a>
        </p>
        <p className="text-[10px] mt-1" style={{ color: '#bbb' }}>Ihre eigene App ab 290€ + 34€/Monat</p>
      </div>

      {/* ─── Booking modal ─── */}
      {bookingSlot && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)' }}
          onClick={() => setBookingSlot(null)}>
          <div onClick={e => e.stopPropagation()} className="w-full max-w-md backdrop-blur-2xl border border-white/40 p-8 text-center animate-scale-in"
            style={{ background: 'rgba(255,255,255,0.75)', borderRadius: 28 }}>
            <Calendar size={44} className="mx-auto mb-4" style={{ color: pc }} />
            <h3 className="text-xl font-bold mb-2" style={{ fontFamily: "'Playfair Display',serif", color: '#2a2722' }}>Online Buchung</h3>
            {bookingSlot !== 'open' && <p className="text-sm font-medium mb-2" style={{ color: pc }}>Ausgewählter Termin: {bookingSlot}</p>}
            <p className="text-sm mb-6" style={{ color: '#6b6560' }}>
              In der vollständigen App können Ihre Kunden hier direkt buchen. Möchten Sie mehr erfahren?
            </p>
            <a href="mailto:hello@creationation.app"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-white font-bold text-sm transition-all hover:scale-105"
              style={{ background: `linear-gradient(135deg, ${pc}, ${sc})`, boxShadow: `0 8px 25px ${pc}40` }}>
              Kontakt aufnehmen <ChevronRight size={16} />
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicDemo;
