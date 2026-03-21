import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Check, Clock, Star } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

const STATUSES = [
  { key: 'brief', label: 'Brief', color: '#8B5CF6', emoji: '📋' },
  { key: 'maquette', label: 'Maquette', color: '#F59E0B', emoji: '🎨' },
  { key: 'development', label: 'Dev', color: '#3B82F6', emoji: '💻' },
  { key: 'review', label: 'Review', color: '#F97316', emoji: '👁️' },
  { key: 'delivered', label: 'Livré', color: '#10B981', emoji: '✅' },
  { key: 'maintenance', label: 'Maint.', color: '#6B7280', emoji: '🔧' },
];

const PortalProject = () => {
  const { client } = useOutletContext<{ client: { id: string } }>();
  const isMobile = useIsMobile();
  const [projects, setProjects] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewComment, setReviewComment] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<{ rating: number; comment: string } | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [existingFeedback, setExistingFeedback] = useState<any>(null);

  useEffect(() => {
    if (!client?.id) return;
    (async () => {
      const { data } = await supabase.from('projects').select('*').eq('client_id', client.id).order('created_at', { ascending: false });
      const p = data || [];
      setProjects(p);
      if (p.length === 1) setSelected(p[0]);
    })();
  }, [client]);

  useEffect(() => {
    if (!selected) return;
    (async () => {
      const { data: t } = await supabase.from('project_tasks').select('*').eq('project_id', selected.id).order('position');
      setTasks(t || []);
      const { data: m } = await supabase.from('project_milestones').select('*').eq('project_id', selected.id).order('position');
      setMilestones(m || []);
      const { data: r } = await supabase.from('deliverable_reviews').select('*').eq('project_id', selected.id).order('created_at', { ascending: false });
      setReviews(r || []);
      const { data: fb } = await supabase.from('client_feedback').select('*').eq('project_id', selected.id).eq('client_id', client.id).limit(1);
      setExistingFeedback(fb?.[0] || null);
      if (selected.status === 'delivered' && !fb?.length) setShowFeedback(true);
    })();
  }, [selected, client]);

  const approveReview = async (id: string) => {
    const review = reviews.find(r => r.id === id);
    await supabase.from('deliverable_reviews').update({ status: 'approved', reviewed_at: new Date().toISOString() } as any).eq('id', id);
    setReviews(r => r.map(x => x.id === id ? { ...x, status: 'approved' } : x));
    // Notify admin
    await supabase.from('portal_notifications').insert({
      client_id: client.id, type: 'deliverable_review',
      title: `Livrable approuvé : ${review?.title || ''}`,
      message: 'Le client a approuvé ce livrable.',
    } as any);
    toast.success('Livrable approuvé !');
  };

  const requestRevision = async (id: string) => {
    const comment = reviewComment[id];
    if (!comment?.trim()) { toast.error('Veuillez ajouter un commentaire'); return; }
    const review = reviews.find(r => r.id === id);
    await supabase.from('deliverable_reviews').update({ status: 'revision_requested', client_comment: comment, reviewed_at: new Date().toISOString() } as any).eq('id', id);
    setReviews(r => r.map(x => x.id === id ? { ...x, status: 'revision_requested', client_comment: comment } : x));
    // Notify admin
    await supabase.from('portal_notifications').insert({
      client_id: client.id, type: 'deliverable_review',
      title: `Révision demandée : ${review?.title || ''}`,
      message: comment,
    } as any);
    toast.success('Révision demandée');
  };

  const submitFeedback = async () => {
    if (!feedback || !feedback.rating) { toast.error('Veuillez donner une note'); return; }
    await supabase.from('client_feedback').insert({ client_id: client.id, project_id: selected.id, rating: feedback.rating, comment: feedback.comment || '' } as any);
    setShowFeedback(false);
    setExistingFeedback(feedback);
    toast.success('Merci pour votre avis !');
  };

  const doneTasks = tasks.filter(t => t.status === 'done').length;
  const progress = tasks.length ? Math.round(doneTasks / tasks.length * 100) : 0;

  if (projects.length > 1 && !selected) {
    return (
      <div className="space-y-4">
        <h1 style={{ fontFamily: 'var(--font-h)', fontSize: 24, color: 'var(--charcoal)' }}>Mes projets</h1>
        {projects.map(p => (
          <button key={p.id} onClick={() => setSelected(p)} style={{
            display: 'block', width: '100%', textAlign: 'left', padding: 20, borderRadius: 'var(--r)',
            background: 'var(--glass-bg-strong)', border: '1px solid var(--glass-border)', cursor: 'pointer',
            backdropFilter: 'blur(16px)',
          }}>
            <div style={{ fontFamily: 'var(--font-h)', fontSize: 18, color: 'var(--charcoal)' }}>{p.title}</div>
            <span style={{ fontFamily: 'var(--font-b)', fontSize: 12, color: STATUSES.find(s => s.key === p.status)?.color }}>
              {STATUSES.find(s => s.key === p.status)?.label}
            </span>
          </button>
        ))}
      </div>
    );
  }

  if (!selected) return <div style={{ fontFamily: 'var(--font-b)', color: 'var(--text-light)', textAlign: 'center', padding: 40 }}>Aucun projet en cours.</div>;

  const currentIdx = STATUSES.findIndex(s => s.key === selected.status);
  const pendingReviews = reviews.filter(r => r.status === 'pending');
  const processedReviews = reviews.filter(r => r.status !== 'pending');

  return (
    <div className="space-y-6">
      {projects.length > 1 && (
        <button onClick={() => setSelected(null)} style={{ fontFamily: 'var(--font-b)', fontSize: 13, color: 'var(--teal)', background: 'none', border: 'none', cursor: 'pointer' }}>
          ← Mes projets
        </button>
      )}

      <div>
        <h1 style={{ fontFamily: 'var(--font-h)', fontSize: 24, color: 'var(--charcoal)', margin: 0 }}>{selected.title}</h1>
        {selected.project_type && <span style={{ fontFamily: 'var(--font-b)', fontSize: 13, color: 'var(--text-light)' }}>{selected.project_type}</span>}
      </div>

      {/* Stepper - horizontal on desktop, vertical on mobile */}
      {isMobile ? (
        <div className="space-y-0" style={{ paddingLeft: 4 }}>
          {STATUSES.map((s, i) => {
            const isPast = i < currentIdx;
            const isCurrent = i === currentIdx;
            return (
              <div key={s.key} className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: isPast ? 'var(--teal)' : isCurrent ? s.color : 'rgba(0,0,0,0.06)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: isCurrent ? `0 0 0 4px ${s.color}30` : 'none',
                    transition: 'all 0.3s', flexShrink: 0,
                  }}>
                    {isPast ? <Check size={16} color="#fff" /> : <span style={{ fontSize: 14 }}>{s.emoji}</span>}
                  </div>
                  {i < STATUSES.length - 1 && (
                    <div style={{ width: 2, height: 24, background: i < currentIdx ? 'var(--teal)' : 'rgba(0,0,0,0.08)' }} />
                  )}
                </div>
                <div style={{ paddingTop: 6, paddingBottom: i < STATUSES.length - 1 ? 0 : 0 }}>
                  <span style={{
                    fontFamily: 'var(--font-b)', fontSize: 13, fontWeight: isCurrent ? 700 : 400,
                    color: isCurrent ? s.color : isPast ? 'var(--teal)' : 'var(--text-light)',
                  }}>{s.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="flex items-center gap-0 min-w-[500px] md:min-w-0">
            {STATUSES.map((s, i) => {
              const isPast = i < currentIdx;
              const isCurrent = i === currentIdx;
              return (
                <div key={s.key} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div style={{
                      width: 40, height: 40, borderRadius: '50%',
                      background: isPast ? 'var(--teal)' : isCurrent ? s.color : 'rgba(0,0,0,0.06)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: isCurrent ? `0 0 0 4px ${s.color}30` : 'none',
                      transition: 'all 0.3s',
                    }}>
                      {isPast ? <Check size={18} color="#fff" /> : <span style={{ fontSize: 16 }}>{s.emoji}</span>}
                    </div>
                    <span style={{
                      fontFamily: 'var(--font-b)', fontSize: 10, marginTop: 4, fontWeight: isCurrent ? 700 : 400,
                      color: isCurrent ? s.color : isPast ? 'var(--teal)' : 'var(--text-light)',
                    }}>{s.label}</span>
                  </div>
                  {i < STATUSES.length - 1 && (
                    <div style={{ height: 2, flex: 1, background: i < currentIdx ? 'var(--teal)' : 'rgba(0,0,0,0.08)', minWidth: 20 }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Progress */}
      <div style={{ background: 'var(--glass-bg-strong)', backdropFilter: 'blur(16px)', borderRadius: 'var(--r)', border: '1px solid var(--glass-border)', padding: 20 }}>
        <div className="flex justify-between mb-2" style={{ fontFamily: 'var(--font-b)', fontSize: 13, color: 'var(--text-mid)' }}>
          <span>Progression globale</span>
          <span style={{ fontWeight: 600, color: 'var(--teal)' }}>{progress}%</span>
        </div>
        <div style={{ height: 10, borderRadius: 5, background: 'rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          <div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(90deg, var(--teal), var(--sky))', borderRadius: 5, transition: 'width 0.5s' }} />
        </div>
        <div style={{ fontFamily: 'var(--font-b)', fontSize: 12, color: 'var(--text-light)', marginTop: 6 }}>
          {doneTasks}/{tasks.length} tâches terminées
        </div>
      </div>

      {/* Deliverables to review */}
      {pendingReviews.length > 0 && (
        <div>
          <h3 style={{ fontFamily: 'var(--font-h)', fontSize: 18, color: 'var(--charcoal)', margin: '0 0 12px' }}>Livrables à valider</h3>
          {pendingReviews.map(r => (
            <div key={r.id} style={{ background: 'var(--glass-bg-strong)', borderRadius: 'var(--r)', border: '1px solid var(--glass-border)', padding: 16, marginBottom: 12, backdropFilter: 'blur(16px)' }}>
              <div style={{ fontFamily: 'var(--font-b)', fontSize: 15, fontWeight: 600, color: 'var(--charcoal)' }}>{r.title}</div>
              {r.description && <p style={{ fontFamily: 'var(--font-b)', fontSize: 13, color: 'var(--text-mid)', marginTop: 4 }}>{r.description}</p>}
              {r.file_urls && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {(r.file_urls as any[]).map((f: any, i: number) => (
                    <a key={i} href={f.file_url} target="_blank" rel="noreferrer" style={{
                      padding: '4px 10px', borderRadius: 8, background: 'rgba(0,0,0,0.04)',
                      fontFamily: 'var(--font-b)', fontSize: 12, color: 'var(--teal)', textDecoration: 'none',
                    }}>📎 {f.file_name}</a>
                  ))}
                </div>
              )}
              <div className="flex flex-col gap-2 mt-3">
                <textarea value={reviewComment[r.id] || ''} onChange={e => setReviewComment({ ...reviewComment, [r.id]: e.target.value })}
                  placeholder="Commentaire (obligatoire pour une révision)..."
                  style={{ padding: 10, borderRadius: 10, border: '1px solid var(--glass-border)', fontFamily: 'var(--font-b)', fontSize: 13, resize: 'vertical', minHeight: 60 }}
                />
                <div className="flex gap-2">
                  <button onClick={() => approveReview(r.id)} style={{ flex: 1, padding: '10px 0', background: 'var(--teal)', color: '#fff', border: 'none', borderRadius: 'var(--pill)', fontFamily: 'var(--font-b)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    ✅ Approuver
                  </button>
                  <button onClick={() => requestRevision(r.id)} style={{ flex: 1, padding: '10px 0', background: 'transparent', color: 'var(--coral)', border: '1px solid var(--coral)', borderRadius: 'var(--pill)', fontFamily: 'var(--font-b)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    ✏️ Révision
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Milestones */}
      <div>
        <h3 style={{ fontFamily: 'var(--font-h)', fontSize: 18, color: 'var(--charcoal)', margin: '0 0 12px' }}>Jalons</h3>
        <div className="space-y-0">
          {milestones.map((m, i) => (
            <div key={m.id} className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <div style={{
                  width: 24, height: 24, borderRadius: '50%',
                  background: m.completed_at ? 'var(--teal)' : 'transparent',
                  border: `2px solid ${m.completed_at ? 'var(--teal)' : 'var(--glass-border)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {m.completed_at ? <Check size={12} color="#fff" /> : <Clock size={10} color="var(--text-light)" />}
                </div>
                {i < milestones.length - 1 && <div style={{ width: 2, height: 30, background: m.completed_at ? 'var(--teal)' : 'var(--glass-border)' }} />}
              </div>
              <div style={{ paddingBottom: 16 }}>
                <div style={{ fontFamily: 'var(--font-b)', fontSize: 14, fontWeight: 600, color: m.completed_at ? 'var(--teal)' : 'var(--charcoal)' }}>{m.title}</div>
                {m.due_date && <div style={{ fontFamily: 'var(--font-b)', fontSize: 11, color: 'var(--text-light)' }}>{new Date(m.due_date).toLocaleDateString('fr-FR')}</div>}
              </div>
            </div>
          ))}
          {!milestones.length && <div style={{ fontFamily: 'var(--font-b)', fontSize: 13, color: 'var(--text-light)', padding: 20, textAlign: 'center' }}>Aucun jalon défini.</div>}
        </div>
      </div>

      {/* Tasks (read-only) */}
      <div>
        <h3 style={{ fontFamily: 'var(--font-h)', fontSize: 18, color: 'var(--charcoal)', margin: '0 0 12px' }}>Tâches</h3>
        <div style={{ background: 'var(--glass-bg-strong)', borderRadius: 'var(--r)', border: '1px solid var(--glass-border)', backdropFilter: 'blur(16px)' }}>
          {tasks.map(t => (
            <div key={t.id} className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
              {t.status === 'done' ? <Check size={16} color="var(--teal)" /> : t.status === 'in_progress' ? <Clock size={16} color="var(--sky)" /> : <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid var(--glass-border)' }} />}
              <span style={{ fontFamily: 'var(--font-b)', fontSize: 13, color: t.status === 'done' ? 'var(--text-light)' : 'var(--charcoal)', textDecoration: t.status === 'done' ? 'line-through' : 'none', flex: 1 }}>{t.title}</span>
              <span style={{
                padding: '2px 8px', borderRadius: 'var(--pill)', fontSize: 10, fontWeight: 600, fontFamily: 'var(--font-b)',
                background: t.status === 'done' ? 'rgba(13,138,111,0.1)' : t.status === 'in_progress' ? 'rgba(77,166,217,0.1)' : 'rgba(0,0,0,0.05)',
                color: t.status === 'done' ? 'var(--teal)' : t.status === 'in_progress' ? 'var(--sky)' : 'var(--text-light)',
              }}>
                {t.status === 'done' ? 'Terminé' : t.status === 'in_progress' ? 'En cours' : 'À faire'}
              </span>
            </div>
          ))}
          {!tasks.length && <div style={{ padding: 20, textAlign: 'center', fontFamily: 'var(--font-b)', fontSize: 13, color: 'var(--text-light)' }}>Aucune tâche.</div>}
        </div>
      </div>

      {/* Feedback modal */}
      {showFeedback && !existingFeedback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div style={{ background: 'white', borderRadius: 'var(--r-lg)', padding: 32, maxWidth: 420, width: '90%', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🎉</div>
            <h2 style={{ fontFamily: 'var(--font-h)', fontSize: 22, color: 'var(--charcoal)', margin: '0 0 8px' }}>Projet livré !</h2>
            <p style={{ fontFamily: 'var(--font-b)', fontSize: 14, color: 'var(--text-mid)', margin: '0 0 20px' }}>
              Comment évaluez-vous notre collaboration ?
            </p>
            <div className="flex justify-center gap-2 mb-4">
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} onClick={() => setFeedback({ rating: n, comment: feedback?.comment || '' })} style={{
                  background: 'none', border: 'none', cursor: 'pointer', fontSize: 28,
                  opacity: (feedback?.rating || 0) >= n ? 1 : 0.3, transition: 'opacity 0.15s',
                }}>
                  <Star size={28} fill={(feedback?.rating || 0) >= n ? '#f59e0b' : 'none'} color="#f59e0b" />
                </button>
              ))}
            </div>
            <textarea value={feedback?.comment || ''} onChange={e => setFeedback({ rating: feedback?.rating || 0, comment: e.target.value })}
              placeholder="Un commentaire ? (optionnel)"
              style={{ width: '100%', padding: 12, borderRadius: 12, border: '1px solid var(--glass-border)', fontFamily: 'var(--font-b)', fontSize: 13, resize: 'vertical', minHeight: 80 }}
            />
            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowFeedback(false)} style={{ flex: 1, padding: '12px 0', background: 'transparent', border: '1px solid var(--glass-border)', borderRadius: 'var(--pill)', fontFamily: 'var(--font-b)', fontSize: 13, cursor: 'pointer', color: 'var(--text-mid)' }}>
                Plus tard
              </button>
              <button onClick={submitFeedback} style={{ flex: 1, padding: '12px 0', background: 'var(--teal)', color: '#fff', border: 'none', borderRadius: 'var(--pill)', fontFamily: 'var(--font-b)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Envoyer mon avis
              </button>
            </div>
            <a href="https://search.google.com/local/writereview?placeid=PLACEHOLDER" target="_blank" rel="noreferrer" style={{
              display: 'none',
              fontFamily: 'var(--font-b)', fontSize: 12, color: 'var(--text-light)', textDecoration: 'underline',
            }}>
              ⭐ Laisser un avis Google
            </a>
          </div>
        </div>
      )}

      {/* Previous reviews */}
      {processedReviews.length > 0 && (
        <div>
          <h3 style={{ fontFamily: 'var(--font-h)', fontSize: 18, color: 'var(--charcoal)', margin: '0 0 12px' }}>Livrables traités</h3>
          {processedReviews.map(r => (
            <div key={r.id} style={{ padding: 12, borderRadius: 12, background: 'rgba(0,0,0,0.02)', marginBottom: 8 }}>
              <div className="flex items-center gap-2">
                <span style={{ fontFamily: 'var(--font-b)', fontSize: 13, fontWeight: 600 }}>{r.title}</span>
                <span style={{
                  padding: '2px 8px', borderRadius: 'var(--pill)', fontSize: 10, fontWeight: 600,
                  background: r.status === 'approved' ? 'rgba(16,185,129,0.1)' : 'rgba(232,115,90,0.1)',
                  color: r.status === 'approved' ? '#10B981' : 'var(--coral)',
                }}>{r.status === 'approved' ? 'Approuvé' : 'Révision demandée'}</span>
              </div>
              {r.client_comment && <p style={{ fontFamily: 'var(--font-b)', fontSize: 12, color: 'var(--text-mid)', marginTop: 4 }}>"{r.client_comment}"</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PortalProject;
