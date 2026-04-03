import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminHeader from '@/components/admin/AdminHeader';
import { Plus, Pencil, Trash2, Star, Eye, EyeOff, GripVertical } from 'lucide-react';
import { toast } from 'sonner';

type Testimonial = {
  id: string;
  name: string;
  role: string | null;
  business: string | null;
  photo_url: string | null;
  logo_url: string | null;
  rating: number;
  quote_fr: string;
  quote_en: string;
  quote_de: string;
  is_visible: boolean;
  position: number;
};

const empty: Omit<Testimonial, 'id'> = {
  name: '', role: '', business: '', photo_url: '', logo_url: '',
  rating: 5, quote_fr: '', quote_en: '', quote_de: '',
  is_visible: true, position: 0,
};

const AdminTestimonials = () => {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Partial<Testimonial> | null>(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['admin-testimonials'],
    queryFn: async () => {
      const { data, error } = await supabase.from('testimonials').select('*').order('position');
      if (error) throw error;
      return data as Testimonial[];
    },
  });

  const save = useMutation({
    mutationFn: async (item: Partial<Testimonial>) => {
      if (item.id) {
        const { error } = await supabase.from('testimonials').update(item).eq('id', item.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('testimonials').insert({ ...empty, ...item, position: items.length });
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-testimonials'] }); setEditing(null); toast.success('Sauvegardé'); },
    onError: (e) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('testimonials').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-testimonials'] }); toast.success('Supprimé'); },
  });

  const toggleVisibility = useMutation({
    mutationFn: async ({ id, is_visible }: { id: string; is_visible: boolean }) => {
      const { error } = await supabase.from('testimonials').update({ is_visible }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-testimonials'] }),
  });

  return (
    <div className="min-h-screen" style={{ background: 'var(--cream)' }}>
      <AdminHeader />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-a)', color: 'var(--charcoal)' }}>
            Témoignages
          </h1>
          <button
            onClick={() => setEditing({ ...empty })}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors"
            style={{ background: 'var(--teal)', fontFamily: 'var(--font-b)' }}
          >
            <Plus size={16} /> Ajouter
          </button>
        </div>

        {isLoading ? (
          <p style={{ color: 'var(--text-light)' }}>Chargement...</p>
        ) : items.length === 0 ? (
          <p style={{ color: 'var(--text-light)' }}>Aucun témoignage pour le moment.</p>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 p-4 rounded-xl transition-all"
                style={{
                  background: 'rgba(255,255,255,0.5)',
                  border: '1px solid rgba(0,0,0,0.06)',
                  opacity: item.is_visible ? 1 : 0.5,
                }}
              >
                <GripVertical size={16} style={{ color: 'var(--text-ghost)' }} />

                {item.photo_url ? (
                  <img src={item.photo_url} alt={item.name} className="w-10 h-10 rounded-full object-cover shrink-0" />
                ) : (
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                    style={{ background: 'var(--teal)', color: '#fff' }}
                  >
                    {item.name.charAt(0)}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate" style={{ color: 'var(--charcoal)' }}>{item.name}</div>
                  <div className="text-xs truncate" style={{ color: 'var(--text-light)' }}>
                    {[item.role, item.business].filter(Boolean).join(', ')}
                  </div>
                </div>

                <div className="hidden md:flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star key={s} size={12} fill={s < item.rating ? '#f59e0b' : 'transparent'} stroke={s < item.rating ? '#f59e0b' : '#d1d5db'} />
                  ))}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => toggleVisibility.mutate({ id: item.id, is_visible: !item.is_visible })}
                    className="p-2 rounded-lg hover:bg-black/5 transition-colors"
                    title={item.is_visible ? 'Masquer' : 'Afficher'}
                  >
                    {item.is_visible ? <Eye size={16} style={{ color: 'var(--teal)' }} /> : <EyeOff size={16} style={{ color: 'var(--text-ghost)' }} />}
                  </button>
                  <button
                    onClick={() => setEditing(item)}
                    className="p-2 rounded-lg hover:bg-black/5 transition-colors"
                  >
                    <Pencil size={16} style={{ color: 'var(--text-mid)' }} />
                  </button>
                  <button
                    onClick={() => { if (confirm('Supprimer ce témoignage ?')) remove.mutate(item.id); }}
                    className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={16} style={{ color: '#ef4444' }} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        {editing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }}>
            <div
              className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl p-6"
              style={{ background: 'var(--cream)', border: '1px solid rgba(0,0,0,0.08)' }}
            >
              <h2 className="text-lg font-bold mb-4" style={{ fontFamily: 'var(--font-a)' }}>
                {editing.id ? 'Modifier' : 'Nouveau'} témoignage
              </h2>

              <div className="space-y-3">
                <Field label="Nom *" value={editing.name || ''} onChange={(v) => setEditing({ ...editing, name: v })} />
                <Field label="Rôle" value={editing.role || ''} onChange={(v) => setEditing({ ...editing, role: v })} />
                <Field label="Entreprise" value={editing.business || ''} onChange={(v) => setEditing({ ...editing, business: v })} />
                <Field label="Photo URL" value={editing.photo_url || ''} onChange={(v) => setEditing({ ...editing, photo_url: v })} />
                <Field label="Logo URL" value={editing.logo_url || ''} onChange={(v) => setEditing({ ...editing, logo_url: v })} />

                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-light)' }}>Note</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button key={s} onClick={() => setEditing({ ...editing, rating: s })}>
                        <Star size={20} fill={s <= (editing.rating || 0) ? '#f59e0b' : 'transparent'} stroke={s <= (editing.rating || 0) ? '#f59e0b' : '#d1d5db'} />
                      </button>
                    ))}
                  </div>
                </div>

                <FieldArea label="Citation FR" value={editing.quote_fr || ''} onChange={(v) => setEditing({ ...editing, quote_fr: v })} />
                <FieldArea label="Citation EN" value={editing.quote_en || ''} onChange={(v) => setEditing({ ...editing, quote_en: v })} />
                <FieldArea label="Citation DE" value={editing.quote_de || ''} onChange={(v) => setEditing({ ...editing, quote_de: v })} />
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={() => setEditing(null)}
                  className="px-4 py-2 rounded-lg text-sm"
                  style={{ color: 'var(--text-mid)', fontFamily: 'var(--font-b)' }}
                >
                  Annuler
                </button>
                <button
                  onClick={() => save.mutate(editing)}
                  disabled={!editing.name?.trim()}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50"
                  style={{ background: 'var(--teal)', fontFamily: 'var(--font-b)' }}
                >
                  Sauvegarder
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const Field = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
  <div>
    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-light)' }}>{label}</label>
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 rounded-lg text-sm"
      style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(0,0,0,0.08)', fontFamily: 'var(--font-b)' }}
    />
  </div>
);

const FieldArea = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
  <div>
    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-light)' }}>{label}</label>
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={3}
      className="w-full px-3 py-2 rounded-lg text-sm resize-none"
      style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(0,0,0,0.08)', fontFamily: 'var(--font-b)' }}
    />
  </div>
);

export default AdminTestimonials;
