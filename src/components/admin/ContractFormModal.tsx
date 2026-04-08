import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { X, Check, Eye, FileText, Bold, List, Heading1 } from 'lucide-react';

const TEXT_PRIMARY = '#1A2332';
const TEXT_SECONDARY = 'rgba(26,35,50,0.55)';
const TEXT_MUTED = 'rgba(26,35,50,0.30)';
const TEAL = '#2A9D8F';

type Client = { id: string; business_name: string; contact_name: string | null; company_address: string | null; email: string | null };
type Project = { id: string; title: string; client_id: string };

const DEFAULT_TEMPLATE = (client: Client | null, setupPrice: number, monthlyPrice: number, startDate: string, specialConditions: string) => `CONTRAT DE PRESTATION DE SERVICES WEB

Entre les soussignés :

PRESTATAIRE :
Creationation
Vienne, Autriche
hello@creationation.app

ET

CLIENT :
${client?.business_name || '[Nom du business]'}
${client?.contact_name || '[Nom du contact]'}
${client?.company_address || '[Adresse]'}

ARTICLE 1 — OBJET DU CONTRAT

Le prestataire s'engage à fournir au client les services de création et maintenance de site web, incluant la conception, le développement, l'hébergement et le support technique selon les termes définis dans le présent contrat.

ARTICLE 2 — PRIX ET MODALITÉS DE PAIEMENT

2.1 Prix de mise en place : ${setupPrice} € HT
Ce montant couvre la conception, le développement et la mise en ligne du site web.

2.2 Abonnement mensuel : ${monthlyPrice} € HT / mois
Ce montant couvre l'hébergement, la maintenance, le support technique et les mises à jour mineures.

2.3 Le paiement du prix de mise en place est dû à la signature du contrat. L'abonnement mensuel est prélevé le 1er de chaque mois.

ARTICLE 3 — DURÉE

3.1 Le présent contrat prend effet à compter du ${startDate || '[Date de début]'}.
3.2 Il est conclu pour une durée indéterminée, sauf mention contraire.

ARTICLE 4 — OBLIGATIONS DU PRESTATAIRE

Le prestataire s'engage à :
- Livrer le site web dans les délais convenus
- Assurer l'hébergement et la maintenance du site
- Fournir un support technique réactif
- Effectuer les mises à jour de sécurité nécessaires

ARTICLE 5 — OBLIGATIONS DU CLIENT

Le client s'engage à :
- Fournir tous les contenus nécessaires dans les délais convenus
- Valider les livrables dans un délai raisonnable
- Régler les factures aux échéances prévues

ARTICLE 6 — RÉSILIATION

6.1 Chaque partie peut résilier le contrat avec un préavis de 30 jours par écrit.
6.2 En cas de non-paiement, le prestataire se réserve le droit de suspendre les services après mise en demeure restée sans effet pendant 15 jours.

ARTICLE 7 — PROPRIÉTÉ INTELLECTUELLE

Le client devient propriétaire du site web après paiement intégral. Le prestataire conserve le droit de mentionner la réalisation dans son portfolio.

ARTICLE 8 — CONFIDENTIALITÉ

Les parties s'engagent à maintenir confidentielles toutes les informations échangées dans le cadre du présent contrat.
${specialConditions ? `\nCONDITIONS SPÉCIALES\n\n${specialConditions}\n` : ''}
Fait en deux exemplaires originaux.

Pour Creationation :                              Pour ${client?.business_name || '[Business]'} :
Date : _______________                           Date : _______________

Signature :                                       Signature :

_______________________                          _______________________`;

interface ContractFormModalProps {
  onClose: () => void;
  onCreated: () => void;
  editContract?: any;
}

const ContractFormModal = ({ onClose, onCreated, editContract }: ContractFormModalProps) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [clientId, setClientId] = useState(editContract?.client_id || '');
  const [projectId, setProjectId] = useState(editContract?.project_id || '');
  const [setupPrice, setSetupPrice] = useState(editContract?.setup_price ?? 290);
  const [monthlyPrice, setMonthlyPrice] = useState(editContract?.monthly_price ?? 34);
  const [startDate, setStartDate] = useState(editContract?.start_date || '');
  const [endDate, setEndDate] = useState(editContract?.end_date || '');
  const [specialConditions, setSpecialConditions] = useState(editContract?.special_conditions || '');
  const [content, setContent] = useState(editContract?.content || '');
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [{ data: cl }, { data: pr }] = await Promise.all([
        supabase.from('clients').select('id, business_name, contact_name, company_address, email'),
        supabase.from('projects').select('id, title, client_id'),
      ]);
      setClients(cl || []);
      setProjects(pr || []);
    };
    load();
  }, []);

  const selectedClient = useMemo(() => clients.find(c => c.id === clientId) || null, [clients, clientId]);
  const filteredProjects = useMemo(() => projects.filter(p => p.client_id === clientId), [projects, clientId]);

  // Auto-generate template when client changes and content is empty or was auto-generated
  useEffect(() => {
    if (clientId && !editContract) {
      setContent(DEFAULT_TEMPLATE(selectedClient, setupPrice, monthlyPrice, startDate, specialConditions));
    }
  }, [clientId, selectedClient, setupPrice, monthlyPrice, startDate, specialConditions, editContract]);

  const handleLoadTemplate = () => {
    setContent(DEFAULT_TEMPLATE(selectedClient, setupPrice, monthlyPrice, startDate, specialConditions));
    toast.success('Template chargé');
  };

  const insertFormatting = (type: 'bold' | 'heading' | 'list') => {
    const textarea = document.getElementById('contract-content') as HTMLTextAreaElement;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.substring(start, end);
    let replacement = '';
    switch (type) {
      case 'bold': replacement = `**${selected || 'texte'}**`; break;
      case 'heading': replacement = `\n## ${selected || 'Titre'}\n`; break;
      case 'list': replacement = `\n- ${selected || 'Élément'}`; break;
    }
    const newContent = content.substring(0, start) + replacement + content.substring(end);
    setContent(newContent);
  };

  const handleSave = async () => {
    if (!clientId) { toast.error('Client requis'); return; }
    if (!content.trim()) { toast.error('Contenu du contrat requis'); return; }
    setSaving(true);
    try {
      const data: any = {
        client_id: clientId,
        project_id: projectId || null,
        setup_price: setupPrice,
        monthly_price: monthlyPrice,
        start_date: startDate || null,
        end_date: endDate || null,
        special_conditions: specialConditions || null,
        content,
        status: 'pending' as any,
      };
      if (editContract) {
        await supabase.from('contracts').update(data).eq('id', editContract.id);
        toast.success('Contrat mis à jour');
      } else {
        await supabase.from('contracts').insert(data);
        toast.success('Contrat créé');
      }
      onCreated();
    } catch (e) {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const renderPreviewContent = (text: string) => {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('## ')) {
        return <h2 key={i} style={{ fontSize: 16, fontWeight: 700, color: TEXT_PRIMARY, margin: '16px 0 8px', fontFamily: "'Playfair Display', serif" }}>{line.replace('## ', '')}</h2>;
      }
      if (line.startsWith('- ')) {
        return <li key={i} style={{ fontSize: 13, color: TEXT_PRIMARY, marginLeft: 20, lineHeight: 1.6 }}>{line.replace('- ', '')}</li>;
      }
      if (line.match(/^[A-Z]{2,}/)) {
        return <h3 key={i} style={{ fontSize: 14, fontWeight: 700, color: TEXT_PRIMARY, margin: '14px 0 6px', textTransform: 'uppercase' as const, letterSpacing: 0.5 }}>{line}</h3>;
      }
      if (line.trim() === '') return <br key={i} />;
      // Handle **bold**
      const parts = line.split(/(\*\*.*?\*\*)/g);
      return (
        <p key={i} style={{ fontSize: 13, color: TEXT_PRIMARY, lineHeight: 1.6, margin: '2px 0' }}>
          {parts.map((part, j) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={j}>{part.slice(2, -2)}</strong>;
            }
            return part;
          })}
        </p>
      );
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto admin-glass-modal p-6" style={{ fontFamily: "'Outfit', sans-serif" }}>
        <div className="flex items-center justify-between mb-6">
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: TEXT_PRIMARY }}>
            {editContract ? 'Modifier le contrat' : 'Nouveau contrat'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: TEXT_SECONDARY }}>
            <X size={22} />
          </button>
        </div>

        {/* Form fields */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div>
            <label style={{ fontSize: 11, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 6, fontWeight: 600 }}>Client *</label>
            <select value={clientId} onChange={e => { setClientId(e.target.value); setProjectId(''); }} className="admin-glass-input w-full">
              <option value="">Sélectionner un client</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.business_name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 6, fontWeight: 600 }}>Projet lié (optionnel)</label>
            <select value={projectId} onChange={e => setProjectId(e.target.value)} className="admin-glass-input w-full" disabled={!clientId}>
              <option value="">Aucun</option>
              {filteredProjects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 6, fontWeight: 600 }}>Prix setup (€)</label>
            <input type="number" value={setupPrice} onChange={e => setSetupPrice(Number(e.target.value))} className="admin-glass-input w-full" />
          </div>
          <div>
            <label style={{ fontSize: 11, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 6, fontWeight: 600 }}>Prix mensuel (€)</label>
            <input type="number" value={monthlyPrice} onChange={e => setMonthlyPrice(Number(e.target.value))} className="admin-glass-input w-full" />
          </div>
          <div>
            <label style={{ fontSize: 11, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 6, fontWeight: 600 }}>Date de début</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="admin-glass-input w-full" />
          </div>
          <div>
            <label style={{ fontSize: 11, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 6, fontWeight: 600 }}>Date de fin (optionnel)</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="admin-glass-input w-full" />
          </div>
        </div>

        <div className="mb-4">
          <label style={{ fontSize: 11, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 6, fontWeight: 600 }}>Conditions spéciales</label>
          <textarea
            value={specialConditions}
            onChange={e => setSpecialConditions(e.target.value)}
            placeholder="Conditions particulières pour ce contrat..."
            className="admin-glass-input w-full"
            rows={2}
          />
        </div>

        {/* Content editor */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label style={{ fontSize: 11, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>Contenu du contrat</label>
            <button onClick={handleLoadTemplate} className="admin-glass-btn-secondary" style={{ fontSize: 11, padding: '4px 12px', display: 'flex', alignItems: 'center', gap: 4 }}>
              <FileText size={12} /> Charger template
            </button>
          </div>
          {/* Toolbar */}
          <div className="flex gap-1 mb-2 p-2 rounded-t-xl" style={{ background: 'rgba(255,255,255,0.15)', borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
            <button onClick={() => insertFormatting('heading')} className="p-1.5 rounded-lg hover:bg-white/10 transition" title="Titre">
              <Heading1 size={14} color={TEXT_SECONDARY} />
            </button>
            <button onClick={() => insertFormatting('bold')} className="p-1.5 rounded-lg hover:bg-white/10 transition" title="Gras">
              <Bold size={14} color={TEXT_SECONDARY} />
            </button>
            <button onClick={() => insertFormatting('list')} className="p-1.5 rounded-lg hover:bg-white/10 transition" title="Liste">
              <List size={14} color={TEXT_SECONDARY} />
            </button>
          </div>
          <textarea
            id="contract-content"
            value={content}
            onChange={e => setContent(e.target.value)}
            className="admin-glass-input w-full"
            rows={20}
            style={{ fontFamily: 'monospace', fontSize: 12, lineHeight: 1.5, resize: 'vertical' }}
            placeholder="Rédigez le contrat ici..."
          />
        </div>

        {/* Preview */}
        {showPreview && (
          <div className="mb-6 admin-glass-card p-6" style={{ maxHeight: 400, overflowY: 'auto' }}>
            <div style={{ borderBottom: `2px solid ${TEAL}`, paddingBottom: 12, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: `linear-gradient(135deg, ${TEAL}, #264653)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 14 }}>C</div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: TEXT_PRIMARY, fontFamily: "'Playfair Display', serif" }}>Creationation</div>
                <div style={{ fontSize: 11, color: TEXT_MUTED }}>hello@creationation.app</div>
              </div>
            </div>
            {renderPreviewContent(content)}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={handleSave} disabled={saving} className="admin-glass-btn" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Check size={14} /> {saving ? 'Sauvegarde...' : (editContract ? 'Mettre à jour' : 'Créer le contrat')}
          </button>
          <button onClick={() => setShowPreview(!showPreview)} className="admin-glass-btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Eye size={14} /> {showPreview ? 'Masquer preview' : 'Preview'}
          </button>
          <button onClick={onClose} className="admin-glass-btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <X size={14} /> Annuler
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContractFormModal;
