import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, X, Loader2, Play, Pause, Trash2, Users, TrendingUp, GripVertical, ChevronDown, ChevronUp, ArrowUp, ArrowDown } from 'lucide-react';

type Sequence = {
  id: string;
  name: string;
  description: string | null;
  sector: string | null;
  language: string;
  steps: any[];
  is_active: boolean;
  total_enrolled: number;
  total_converted: number;
  created_at: string;
};

type Prospect = {
  id: string;
  business_name: string;
  email: string | null;
  sector: string | null;
  score: number;
  sequence_id: string | null;
  sequence_step: number;
  sequence_paused: boolean;
  city: string | null;
  status: string;
  has_website: boolean;
};

const STEP_TYPES: Record<string, { label: string; color: string }> = {
  initial: { label: 'Premier contact', color: '#3B82F6' },
  followup: { label: 'Relance', color: '#F59E0B' },
  value: { label: 'Valeur ajoutée', color: '#10B981' },
  final: { label: 'Dernier message', color: '#EF4444' },
};

const AdminSequences = () => {
  const navigate = useNavigate();
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSequence, setSelectedSequence] = useState<Sequence | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [enrolledProspects, setEnrolledProspects] = useState<Prospect[]>([]);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [availableProspects, setAvailableProspects] = useState<Prospect[]>([]);
  const [enrollSelection, setEnrollSelection] = useState<Set<string>>(new Set());
  const [form, setForm] = useState({
    name: '', description: '', sector: '', language: 'auto',
    steps: [{ step_number: 1, delay_days: 0, type: 'initial', subject_template: '', body_template: '' }],
  });

  const fetchSequences = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('email_sequences').select('*').order('created_at', { ascending: false });
    setSequences((data as any as Sequence[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { navigate('/admin/login'); return; }
      supabase.from('user_roles').select('role').eq('user_id', user.id).eq('role', 'admin').then(({ data: roles }) => {
        if (!roles?.length) navigate('/admin/login');
        else fetchSequences();
      });
    });
  }, [navigate, fetchSequences]);

  const fetchEnrolled = async (seqId: string) => {
    const { data } = await supabase.from('prospects').select('id, business_name, email, sector, score, sequence_id, sequence_step, sequence_paused, city, status, has_website').eq('sequence_id', seqId);
    setEnrolledProspects((data as any as Prospect[]) || []);
  };

  const selectSequence = (seq: Sequence) => {
    setSelectedSequence(seq);
    setForm({
      name: seq.name, description: seq.description || '', sector: seq.sector || '', language: seq.language,
      steps: seq.steps,
    });
    fetchEnrolled(seq.id);
  };

  const saveSequence = async () => {
    if (!form.name || !form.steps.length) { toast.error('Nom et au moins une étape requis'); return; }
    const payload = { name: form.name, description: form.description || null, sector: form.sector || null, language: form.language, steps: form.steps };

    if (selectedSequence) {
      const { error } = await supabase.from('email_sequences').update(payload as any).eq('id', selectedSequence.id);
      if (error) toast.error('Erreur sauvegarde');
      else { toast.success('Séquence mise à jour'); fetchSequences(); }
    } else {
      const { error } = await supabase.from('email_sequences').insert(payload as any);
      if (error) toast.error('Erreur création');
      else { toast.success('Séquence créée'); fetchSequences(); setShowForm(false); }
    }
  };

  const toggleActive = async (seq: Sequence) => {
    await supabase.from('email_sequences').update({ is_active: !seq.is_active } as any).eq('id', seq.id);
    fetchSequences();
  };

  const deleteSequence = async (id: string) => {
    if (!confirm('Supprimer cette séquence ?')) return;
    // Remove prospects from this sequence first
    await supabase.from('prospects').update({ sequence_id: null, sequence_step: 0, sequence_paused: false } as any).eq('sequence_id', id);
    await supabase.from('email_sequences').delete().eq('id', id);
    if (selectedSequence?.id === id) setSelectedSequence(null);
    fetchSequences();
    toast.success('Séquence supprimée');
  };

  const addStep = () => {
    setForm(prev => ({
      ...prev,
      steps: [...prev.steps, { step_number: prev.steps.length + 1, delay_days: 3, type: 'followup', subject_template: '', body_template: '' }],
    }));
  };

  const removeStep = (idx: number) => {
    setForm(prev => ({
      ...prev,
      steps: prev.steps.filter((_, i) => i !== idx).map((s, i) => ({ ...s, step_number: i + 1 })),
    }));
  };

  const moveStep = (idx: number, direction: 'up' | 'down') => {
    setForm(prev => {
      const steps = [...prev.steps];
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= steps.length) return prev;
      [steps[idx], steps[targetIdx]] = [steps[targetIdx], steps[idx]];
      return { ...prev, steps: steps.map((s, i) => ({ ...s, step_number: i + 1 })) };
    });
  };

  const updateStep = (idx: number, field: string, value: any) => {
    setForm(prev => ({
      ...prev,
      steps: prev.steps.map((s, i) => i === idx ? { ...s, [field]: value } : s),
    }));
  };

  const openEnrollModal = async () => {
    const { data } = await supabase.from('prospects').select('id, business_name, email, sector, score, sequence_id, sequence_step, sequence_paused, city, status, has_website').is('sequence_id', null).not('email', 'is', null);
    setAvailableProspects((data as any as Prospect[]) || []);
    setEnrollSelection(new Set());
    setShowEnrollModal(true);
  };

  const enrollProspects = async () => {
    if (!selectedSequence || !enrollSelection.size) return;
    const ids = Array.from(enrollSelection);
    const { error } = await supabase.from('prospects').update({ sequence_id: selectedSequence.id, sequence_step: 0, sequence_paused: false } as any).in('id', ids);
    if (error) toast.error('Erreur inscription');
    else {
      await supabase.from('email_sequences').update({ total_enrolled: (selectedSequence.total_enrolled || 0) + ids.length } as any).eq('id', selectedSequence.id);
      toast.success(`${ids.length} prospect(s) inscrit(s)`);
      setShowEnrollModal(false);
      fetchEnrolled(selectedSequence.id);
      fetchSequences();
    }
  };

  const removeFromSequence = async (prospectId: string) => {
    await supabase.from('prospects').update({ sequence_id: null, sequence_step: 0, sequence_paused: false } as any).eq('id', prospectId);
    if (selectedSequence) fetchEnrolled(selectedSequence.id);
    toast.success('Prospect retiré de la séquence');
  };

  const togglePause = async (prospect: Prospect) => {
    await supabase.from('prospects').update({ sequence_paused: !prospect.sequence_paused } as any).eq('id', prospect.id);
    if (selectedSequence) fetchEnrolled(selectedSequence.id);
  };

  const gs = { card: { padding: 20, borderRadius: 20 } as React.CSSProperties };

  return (
    <div>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: 16 }}>
        <div className="flex items-center justify-between mb-6">
          <h1 className="admin-page-title">Séquences d'emails</h1>
          <button onClick={() => { setSelectedSequence(null); setShowForm(true); setForm({ name: '', description: '', sector: '', language: 'auto', steps: [{ step_number: 1, delay_days: 0, type: 'initial', subject_template: '', body_template: '' }] }); }} style={{ padding: '10px 20px', background: 'var(--teal)', color: '#fff', border: 'none', borderRadius: 'var(--pill)', fontFamily: 'var(--font-b)', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={14} /> Nouvelle séquence
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sequences list */}
          <div style={{ flex: '0 0 360px' }} className="flex flex-col gap-3">
            {loading ? <p style={{ fontFamily: 'var(--font-b)', color: 'var(--text-light)' }}>Chargement...</p> :
              sequences.length === 0 ? <p style={{ fontFamily: 'var(--font-b)', color: 'var(--text-light)' }}>Aucune séquence créée.</p> :
              sequences.map(seq => (
                <div key={seq.id} onClick={() => selectSequence(seq)} className="admin-glass-card" style={{ ...gs.card, cursor: 'pointer', borderColor: selectedSequence?.id === seq.id ? '#2A9D8F' : 'rgba(255,255,255,0.30)', transition: 'border-color 0.2s' }}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 style={{ fontFamily: 'var(--font-h)', fontSize: 15, color: 'var(--charcoal)', margin: 0 }}>{seq.name}</h3>
                    <div className="flex items-center gap-2">
                      <button onClick={(e) => { e.stopPropagation(); toggleActive(seq); }} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                        {seq.is_active ? <Play size={14} style={{ color: 'var(--teal)' }} /> : <Pause size={14} style={{ color: 'var(--text-ghost)' }} />}
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); deleteSequence(seq.id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-ghost)' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-3" style={{ fontFamily: 'var(--font-b)', fontSize: 12, color: 'var(--text-light)' }}>
                    {seq.sector && <span style={{ padding: '2px 8px', borderRadius: 'var(--pill)', background: 'rgba(13,138,111,0.1)', color: 'var(--teal)', fontWeight: 600 }}>{seq.sector}</span>}
                    <span>{(seq.steps as any[])?.length || 0} étapes</span>
                    <span className="flex items-center gap-1"><Users size={11} /> {seq.total_enrolled}</span>
                    <span className="flex items-center gap-1"><TrendingUp size={11} /> {seq.total_converted}</span>
                  </div>
                </div>
              ))
            }
          </div>

          {/* Detail / Form */}
          <div style={{ flex: 1 }}>
            {(selectedSequence || showForm) ? (
              <div className="admin-glass-card" style={gs.card}>
                <div className="flex items-center justify-between mb-4">
                  <h2 style={{ fontFamily: 'var(--font-h)', fontSize: 18, color: 'var(--charcoal)', margin: 0 }}>
                    {selectedSequence ? 'Modifier la séquence' : 'Nouvelle séquence'}
                  </h2>
                  <button onClick={() => { setSelectedSequence(null); setShowForm(false); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)' }}><X size={18} /></button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                  <div>
                    <label style={{ fontFamily: 'var(--font-b)', fontSize: 11, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 4 }}>Nom *</label>
                    <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} style={{ width: '100%', padding: '10px 14px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 'var(--r)', fontFamily: 'var(--font-b)', fontSize: 14, color: 'var(--text)', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontFamily: 'var(--font-b)', fontSize: 11, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 4 }}>Secteur</label>
                    <input value={form.sector} onChange={e => setForm(p => ({ ...p, sector: e.target.value }))} placeholder="ex: restaurant" style={{ width: '100%', padding: '10px 14px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 'var(--r)', fontFamily: 'var(--font-b)', fontSize: 14, color: 'var(--text)', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ fontFamily: 'var(--font-b)', fontSize: 11, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 4 }}>Description</label>
                    <input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} style={{ width: '100%', padding: '10px 14px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 'var(--r)', fontFamily: 'var(--font-b)', fontSize: 14, color: 'var(--text)', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                </div>

                {/* Steps editor */}
                <h3 style={{ fontFamily: 'var(--font-h)', fontSize: 15, color: 'var(--charcoal)', margin: '0 0 12px' }}>Étapes de la séquence</h3>
                <p style={{ fontFamily: 'var(--font-b)', fontSize: 11, color: 'var(--text-light)', margin: '0 0 12px' }}>
                  Variables : {'{{business_name}}'}, {'{{city}}'}, {'{{sector}}'}, {'{{owner_name}}'}, {'{{country}}'}
                </p>

                <div className="flex flex-col gap-4">
                  {form.steps.map((step, idx) => (
                      <div key={idx} style={{ padding: 16, background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 'var(--r)', position: 'relative', borderLeft: `3px solid ${STEP_TYPES[step.type]?.color || '#6B7280'}` }}>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="flex flex-col gap-1">
                            <button onClick={() => moveStep(idx, 'up')} disabled={idx === 0} style={{ background: 'none', border: 'none', cursor: idx === 0 ? 'default' : 'pointer', color: idx === 0 ? 'var(--glass-border)' : 'var(--text-mid)', padding: 0 }}><ArrowUp size={12} /></button>
                            <button onClick={() => moveStep(idx, 'down')} disabled={idx === form.steps.length - 1} style={{ background: 'none', border: 'none', cursor: idx === form.steps.length - 1 ? 'default' : 'pointer', color: idx === form.steps.length - 1 ? 'var(--glass-border)' : 'var(--text-mid)', padding: 0 }}><ArrowDown size={12} /></button>
                          </div>
                        <span style={{ fontFamily: 'var(--font-h)', fontSize: 14, color: 'var(--charcoal)' }}>Étape {step.step_number}</span>
                        <select value={step.type} onChange={e => updateStep(idx, 'type', e.target.value)} style={{ padding: '4px 10px', borderRadius: 'var(--pill)', border: '1px solid var(--glass-border)', background: (STEP_TYPES[step.type]?.color || '#6B7280') + '18', color: STEP_TYPES[step.type]?.color || '#6B7280', fontFamily: 'var(--font-b)', fontSize: 11, fontWeight: 600, cursor: 'pointer', outline: 'none' }}>
                          {Object.entries(STEP_TYPES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                        </select>
                        <div className="flex items-center gap-1 ml-auto">
                          <label style={{ fontFamily: 'var(--font-b)', fontSize: 11, color: 'var(--text-light)' }}>Délai:</label>
                          <input type="number" min={0} value={step.delay_days} onChange={e => updateStep(idx, 'delay_days', Number(e.target.value))} style={{ width: 50, padding: '4px 8px', background: 'white', border: '1px solid var(--glass-border)', borderRadius: 6, fontSize: 13, fontFamily: 'var(--font-b)', textAlign: 'center', outline: 'none' }} />
                          <span style={{ fontFamily: 'var(--font-b)', fontSize: 11, color: 'var(--text-light)' }}>jours</span>
                        </div>
                        {form.steps.length > 1 && (
                          <button onClick={() => removeStep(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e8735a' }}><Trash2 size={14} /></button>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        <input value={step.subject_template} onChange={e => updateStep(idx, 'subject_template', e.target.value)} placeholder="Sujet de l'email..." style={{ width: '100%', padding: '8px 12px', background: 'white', border: '1px solid var(--glass-border)', borderRadius: 'var(--r)', fontFamily: 'var(--font-b)', fontSize: 13, color: 'var(--text)', outline: 'none', boxSizing: 'border-box' }} />
                        <textarea value={step.body_template} onChange={e => updateStep(idx, 'body_template', e.target.value)} placeholder="Corps de l'email..." rows={5} style={{ width: '100%', padding: '8px 12px', background: 'white', border: '1px solid var(--glass-border)', borderRadius: 'var(--r)', fontFamily: 'var(--font-b)', fontSize: 13, color: 'var(--text)', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
                      </div>
                    </div>
                  ))}
                </div>

                <button onClick={addStep} style={{ marginTop: 12, padding: '10px 20px', background: 'var(--glass-bg)', border: '1px dashed var(--glass-border)', borderRadius: 'var(--r)', fontFamily: 'var(--font-b)', fontSize: 13, color: 'var(--text-mid)', cursor: 'pointer', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <Plus size={14} /> Ajouter une étape
                </button>

                <div className="flex gap-3 mt-6">
                  <button onClick={() => { setSelectedSequence(null); setShowForm(false); }} style={{ flex: 1, padding: 12, background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 'var(--r)', fontFamily: 'var(--font-b)', fontSize: 14, cursor: 'pointer', color: 'var(--text-mid)' }}>Annuler</button>
                  <button onClick={saveSequence} style={{ flex: 1, padding: 12, background: 'var(--teal)', color: '#fff', border: 'none', borderRadius: 'var(--r)', fontFamily: 'var(--font-b)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Sauvegarder</button>
                </div>

                {/* Enrolled prospects */}
                {selectedSequence && (
                  <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--glass-border)' }}>
                    <div className="flex items-center justify-between mb-3">
                      <h3 style={{ fontFamily: 'var(--font-h)', fontSize: 15, color: 'var(--charcoal)', margin: 0 }}>Prospects inscrits ({enrolledProspects.length})</h3>
                      <button onClick={openEnrollModal} style={{ padding: '8px 16px', background: 'var(--teal)', color: '#fff', border: 'none', borderRadius: 'var(--pill)', fontFamily: 'var(--font-b)', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Plus size={12} /> Inscrire
                      </button>
                    </div>
                    {enrolledProspects.length === 0 ? (
                      <p style={{ fontFamily: 'var(--font-b)', fontSize: 13, color: 'var(--text-light)' }}>Aucun prospect inscrit dans cette séquence.</p>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {enrolledProspects.map(p => (
                          <div key={p.id} className="flex items-center justify-between" style={{ padding: '10px 14px', background: 'var(--glass-bg)', borderRadius: 'var(--r)', border: '1px solid var(--glass-border)' }}>
                            <div>
                              <span style={{ fontFamily: 'var(--font-b)', fontSize: 13, color: 'var(--charcoal)', fontWeight: 600 }}>{p.business_name}</span>
                              <span style={{ fontFamily: 'var(--font-b)', fontSize: 12, color: 'var(--text-light)', marginLeft: 8 }}>Étape {p.sequence_step}/{(selectedSequence.steps as any[]).length}</span>
                              {p.sequence_paused && <span style={{ marginLeft: 8, padding: '2px 8px', borderRadius: 'var(--pill)', background: '#F59E0B18', color: '#F59E0B', fontSize: 11, fontWeight: 600 }}>Pausé</span>}
                            </div>
                            <div className="flex items-center gap-2">
                              <button onClick={() => togglePause(p)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: p.sequence_paused ? 'var(--teal)' : '#F59E0B' }}>
                                {p.sequence_paused ? <Play size={14} /> : <Pause size={14} />}
                              </button>
                              <button onClick={() => removeFromSequence(p.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-ghost)' }}>
                                <X size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ ...gs.card, textAlign: 'center', padding: 60 }}>
                <p style={{ fontFamily: 'var(--font-b)', fontSize: 15, color: 'var(--text-light)' }}>Sélectionnez une séquence ou créez-en une nouvelle.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enroll modal */}
      {showEnrollModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ width: '100%', maxWidth: 600, background: 'white', borderRadius: 'var(--r-xl)', padding: 24, maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 style={{ fontFamily: 'var(--font-h)', fontSize: 18, color: 'var(--charcoal)', margin: 0 }}>Inscrire des prospects</h2>
              <button onClick={() => setShowEnrollModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)' }}><X size={20} /></button>
            </div>
            <p style={{ fontFamily: 'var(--font-b)', fontSize: 12, color: 'var(--text-light)', margin: '0 0 12px' }}>
              {availableProspects.length} prospects disponibles (avec email, pas déjà dans une séquence)
            </p>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {availableProspects.map(p => (
                <label key={p.id} className="flex items-center gap-3" style={{ padding: '10px 12px', borderBottom: '1px solid rgba(0,0,0,0.04)', cursor: 'pointer' }}>
                  <input type="checkbox" checked={enrollSelection.has(p.id)} onChange={() => setEnrollSelection(prev => { const n = new Set(prev); n.has(p.id) ? n.delete(p.id) : n.add(p.id); return n; })} />
                  <div style={{ flex: 1 }}>
                    <span style={{ fontFamily: 'var(--font-b)', fontSize: 13, color: 'var(--charcoal)', fontWeight: 600 }}>{p.business_name}</span>
                    <span style={{ fontFamily: 'var(--font-b)', fontSize: 12, color: 'var(--text-light)', marginLeft: 8 }}>{p.email}</span>
                  </div>
                  {p.score > 0 && <span style={{ padding: '2px 8px', borderRadius: 'var(--pill)', background: p.score > 60 ? 'rgba(16,185,129,0.1)' : p.score > 30 ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)', color: p.score > 60 ? '#10B981' : p.score > 30 ? '#F59E0B' : '#EF4444', fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-b)' }}>{p.score}</span>}
                </label>
              ))}
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowEnrollModal(false)} style={{ flex: 1, padding: 12, background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 'var(--r)', fontFamily: 'var(--font-b)', fontSize: 14, cursor: 'pointer', color: 'var(--text-mid)' }}>Annuler</button>
              <button onClick={enrollProspects} disabled={!enrollSelection.size} style={{ flex: 1, padding: 12, background: 'var(--teal)', color: '#fff', border: 'none', borderRadius: 'var(--r)', fontFamily: 'var(--font-b)', fontSize: 14, fontWeight: 600, cursor: enrollSelection.size ? 'pointer' : 'not-allowed', opacity: enrollSelection.size ? 1 : 0.5 }}>
                Inscrire {enrollSelection.size} prospect(s)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSequences;
