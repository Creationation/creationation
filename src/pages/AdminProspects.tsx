import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { LogOut, Search, Plus, Trash2, MapPin, Phone, Globe, GlobeLock, Star, RefreshCw, CheckSquare, Square, Loader2, ChevronLeft, UserPlus, Send, Pencil, X, Check, Target, Mail, Languages, Sparkles } from 'lucide-react';

type ProspectStatus = 'new' | 'emailed' | 'replied' | 'converted' | 'rejected';
type Prospect = { id: string; business_name: string; contact_name: string | null; email: string | null; phone: string | null; business_type: string | null; city: string | null; country: string | null; address: string | null; google_place_id: string | null; has_website: boolean; website_url: string | null; notes: string | null; source: string | null; status: ProspectStatus; email_count: number; last_emailed_at: string | null; created_at: string; language: string | null; };
type SearchResult = { google_place_id: string; business_name: string; address: string; phone: string | null; has_website: boolean; website_url: string | null; rating: number | null; review_count: number; types: string[]; city: string; country: string; business_type: string; };
type GeneratedEmail = { prospectId: string; subject: string; body: string; loading?: boolean; error?: string; };

const COUNTRY_LANG: Record<string, string> = {
  'France': 'fr', 'Belgique': 'fr', 'Suisse': 'fr', 'Luxembourg': 'fr',
  'Canada': 'fr', 'Maroc': 'fr', 'Tunisie': 'fr', 'Algerie': 'fr',
  'Senegal': 'fr', "Cote d'Ivoire": 'fr', 'Cameroun': 'fr', 'RD Congo': 'fr',
  'Allemagne': 'de', 'Autriche': 'de',
  'Espagne': 'es', 'Mexique': 'es', 'Argentine': 'es', 'Colombie': 'es', 'Chili': 'es', 'Perou': 'es',
  'Italie': 'it', 'Portugal': 'pt', 'Bresil': 'pt',
  'Pays-Bas': 'nl', 'Turquie': 'tr', 'Pologne': 'pl',
  'Republique tcheque': 'cs', 'Suede': 'sv', 'Norvege': 'no',
  'Danemark': 'da', 'Finlande': 'fi', 'Grece': 'el', 'Roumanie': 'ro', 'Croatie': 'hr',
  'Japon': 'ja', 'Coree du Sud': 'ko', 'Chine': 'zh',
  'Thailande': 'th', 'Vietnam': 'vi', 'Indonesie': 'id',
  'Philippines': 'en', 'Malaisie': 'en', 'Emirats arabes unis': 'ar',
  'Israel': 'he', 'Egypte': 'ar', 'Nigeria': 'en', 'Inde': 'en',
  'Afrique du Sud': 'en', 'Etats-Unis': 'en', 'Royaume-Uni': 'en',
  'Irlande': 'en', 'Australie': 'en', 'Nouvelle-Zelande': 'en',
};
const LANG_LABELS: Record<string, string> = {
  fr: '🇫🇷 FR', en: '🇬🇧 EN', de: '🇩🇪 DE', es: '🇪🇸 ES', it: '🇮🇹 IT', pt: '🇵🇹 PT',
  nl: '🇳🇱 NL', ar: '🇸🇦 AR', tr: '🇹🇷 TR', pl: '🇵🇱 PL', cs: '🇨🇿 CS', sv: '🇸🇪 SV',
  no: '🇳🇴 NO', da: '🇩🇰 DA', fi: '🇫🇮 FI', el: '🇬🇷 EL', ro: '🇷🇴 RO', hr: '🇭🇷 HR',
  ja: '🇯🇵 JA', ko: '🇰🇷 KO', zh: '🇨🇳 ZH', th: '🇹🇭 TH', vi: '🇻🇳 VI', id: '🇮🇩 ID', he: '🇮🇱 HE',
};

const SC: Record<ProspectStatus, string> = { new: '#0d8a6f', emailed: '#4da6d9', replied: '#d4a55a', converted: '#7c5cbf', rejected: '#e8735a' };
const SL: Record<ProspectStatus, string> = { new: 'Nouveau', emailed: 'Emaile', replied: 'A repondu', converted: 'Converti', rejected: 'Rejete' };
const BT = ['Barbershop','Salon de coiffure','Nail studio','Restaurant','Cafe','Boulangerie','Boucherie','Epicerie','Fleuriste','Pharmacie','Medecin','Dentiste','Kinesitherapeute','Photographe','Coach sportif','Tatoueur','Pressing','Plombier','Electricien','Autre'];

const CONTINENTS: Record<string, string[]> = {
  'Europe': ['France','Belgique','Suisse','Allemagne','Espagne','Italie','Portugal','Pays-Bas','Autriche','Royaume-Uni','Irlande','Luxembourg','Pologne','Republique tcheque','Suede','Norvege','Danemark','Finlande','Grece','Roumanie','Croatie'],
  'Amerique du Nord': ['Etats-Unis','Canada','Mexique'],
  'Amerique du Sud': ['Bresil','Argentine','Colombie','Chili','Perou'],
  'Afrique': ['Maroc','Tunisie','Algerie','Senegal','Cote d\'Ivoire','Cameroun','Afrique du Sud','Nigeria','Egypte','RD Congo'],
  'Asie': ['Japon','Coree du Sud','Chine','Inde','Thailande','Vietnam','Indonesie','Philippines','Malaisie','Emirats arabes unis','Turquie','Israel'],
  'Oceanie': ['Australie','Nouvelle-Zelande'],
};

const AdminProspects = () => {
  const navigate = useNavigate();
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [searchContinent, setSearchContinent] = useState('');
  const [searchCountry, setSearchCountry] = useState('');
  const [searchCity, setSearchCity] = useState('');
  const [searchTypes, setSearchTypes] = useState<string[]>([]);
  const [customType, setCustomType] = useState('');
  const [maxResults, setMaxResults] = useState(50);
  const [fetchPhone, setFetchPhone] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[] | null>(null);
  const [showManualAdd, setShowManualAdd] = useState(false);
  const [manualForm, setManualForm] = useState({ business_name: '', contact_name: '', email: '', phone: '', business_type: '', city: '', country: 'France', notes: '', has_website: false, website_url: '' });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [generatedEmails, setGeneratedEmails] = useState<GeneratedEmail[]>([]);
  const [generatingAll, setGeneratingAll] = useState(false);
  const [sending, setSending] = useState(false);
  const [findingEmails, setFindingEmails] = useState(false);
  const [tab, setTab] = useState<'search' | 'prospects'>('prospects');

  const fetchProspects = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('prospects').select('*').order('created_at', { ascending: false });
    if (statusFilter !== 'all') query = query.eq('status', statusFilter as ProspectStatus);
    const { data, error } = await query;
    if (error) toast.error('Erreur chargement');
    else setProspects((data as Prospect[]) || []);
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { navigate('/admin/login'); return; }
      setUserId(user.id);
      supabase.from('user_roles').select('role').eq('user_id', user.id).eq('role', 'admin').then(({ data: roles }) => {
        if (!roles || roles.length === 0) navigate('/admin/login');
        else fetchProspects();
      });
    });
  }, [navigate, fetchProspects]);

  const toggleSearchType = (t: string) => setSearchTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);

  const handleSearch = async () => {
    const types = searchTypes.includes('Autre') ? [...searchTypes.filter(t => t !== 'Autre'), ...(customType ? [customType] : [])] : searchTypes;
    const location = searchCity || searchCountry || searchContinent;
    if (!location || !types.length) { toast.error('Remplis au moins une localisation et un type'); return; }
    setSearching(true); setSearchResults(null);
    try {
      // Fetch existing google_place_ids to filter duplicates
      const { data: existing } = await supabase.from('prospects').select('google_place_id');
      const existingIds = new Set((existing || []).map(p => p.google_place_id).filter(Boolean));

      const allResults: SearchResult[] = [];
      for (const type of types) {
        const { data, error } = await supabase.functions.invoke('prospect-search', {
          body: { city: searchCity || '', businessType: type, country: searchCountry || searchContinent || '', maxResults }
        });
        if (error) throw new Error(error.message);
        const results = (data.results || []) as SearchResult[];
        results.forEach(r => {
          if (!allResults.find(e => e.google_place_id === r.google_place_id) && !existingIds.has(r.google_place_id)) {
            allResults.push(r);
          }
        });
      }

      // Auto-save ALL results to DB to prevent future duplicates
      if (allResults.length > 0) {
        const rows = allResults.map(r => ({
          business_name: r.business_name, address: r.address, phone: r.phone,
          has_website: r.has_website, website_url: r.website_url, city: r.city,
          country: r.country, business_type: r.business_type,
          google_place_id: r.google_place_id, source: 'google_maps',
          language: COUNTRY_LANG[r.country] || 'en',
        }));
        const { error: insertError } = await supabase.from('prospects').insert(rows);
        if (insertError && insertError.code !== '23505') {
          console.warn('Bulk insert error, trying one by one', insertError);
          for (const row of rows) {
            await supabase.from('prospects').insert(row);
          }
        }
        fetchProspects();
      }

      allResults.sort((a, b) => (a.has_website ? 1 : 0) - (b.has_website ? 1 : 0));
      setSearchResults(allResults);
      const skipped = existingIds.size > 0 ? ' (doublons deja en base exclus)' : '';
      toast.success(allResults.length + ' resultats trouves et sauvegardes' + skipped);
    } catch (e: any) { toast.error(e.message || 'Erreur'); }
    finally { setSearching(false); }
  };

  const addAllNoWebsite = async () => {
    toast.info('Tous les resultats sont deja sauvegardes automatiquement !');
    setTab('prospects');
  };

  const handleManualAdd = async () => {
    if (!manualForm.business_name) { toast.error('Nom requis'); return; }
    const { error } = await supabase.from('prospects').insert({ ...manualForm, source: 'manual' });
    if (error) toast.error('Erreur');
    else { toast.success('Prospect ajoute'); setShowManualAdd(false); setManualForm({ business_name: '', contact_name: '', email: '', phone: '', business_type: '', city: '', country: 'France', notes: '', has_website: false, website_url: '' }); fetchProspects(); }
  };

  const deleteProspect = async (id: string) => {
    await supabase.from('prospects').delete().eq('id', id);
    setSelectedIds(prev => { const n = new Set(prev); n.delete(id); return n; });
    fetchProspects(); toast.success('Supprime');
  };

  const deleteSelected = async () => {
    if (!selectedIds.size) return;
    const count = selectedIds.size;
    if (!confirm(`Supprimer ${count} prospect(s) ? Cette action est irreversible.`)) return;
    for (const id of selectedIds) {
      await supabase.from('prospects').delete().eq('id', id);
    }
    setSelectedIds(new Set());
    fetchProspects();
    toast.success(`${count} prospect(s) supprime(s)`);
  };

  const updateEmail = async (id: string, email: string) => {
    await supabase.from('prospects').update({ email }).eq('id', id);
    toast.success('Email mis a jour'); fetchProspects();
  };

  const updateStatus = async (id: string, status: ProspectStatus) => {
    await supabase.from('prospects').update({ status }).eq('id', id);
    fetchProspects();
  };

  const toggleSelect = (id: string) => setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const toggleSelectAll = () => {
    const visible = filteredProspects.map(p => p.id);
    const allSelected = visible.every(id => selectedIds.has(id));
    if (allSelected) setSelectedIds(prev => { const n = new Set(prev); visible.forEach(id => n.delete(id)); return n; });
    else setSelectedIds(prev => { const n = new Set(prev); visible.forEach(id => n.add(id)); return n; });
  };

  const openEmailModal = async () => {
    if (!selectedIds.size) { toast.error('Selectionne au moins un prospect'); return; }
    const selected = prospects.filter(p => selectedIds.has(p.id));
    const noEmail = selected.filter(p => !p.email);
    if (noEmail.length) { toast.error(noEmail.map(p => p.business_name).join(', ') + ' - pas d\'email'); return; }
    setGeneratedEmails(selected.map(p => ({ prospectId: p.id, subject: '', body: '', loading: true })));
    setShowEmailModal(true); setGeneratingAll(true);
    const results: GeneratedEmail[] = [];
    for (const prospect of selected) {
      try {
        const lang = prospect.language || COUNTRY_LANG[prospect.country || ''] || 'fr';
        const { data, error } = await supabase.functions.invoke('generate-prospect-email', { body: { prospect, lang } });
        if (error || !data?.subject) throw new Error(error?.message || 'Erreur generation');
        results.push({ prospectId: prospect.id, subject: data.subject, body: data.body });
      } catch (e: any) { results.push({ prospectId: prospect.id, subject: '', body: '', error: e.message }); }
      setGeneratedEmails([...results, ...selected.slice(results.length).map(p => ({ prospectId: p.id, subject: '', body: '', loading: true }))]);
    }
    setGeneratedEmails(results); setGeneratingAll(false);
  };

  const findEmails = async () => {
    const targets = selectedIds.size > 0
      ? prospects.filter(p => selectedIds.has(p.id) && !p.email)
      : prospects.filter(p => !p.email);
    if (!targets.length) { toast.info('Tous les prospects selectionnes ont deja un email'); return; }
    setFindingEmails(true);
    toast.info(`Recherche IA d'emails pour ${targets.length} prospect(s)...`);
    try {
      const { data, error } = await supabase.functions.invoke('find-prospect-email', {
        body: { prospects: targets.map(p => ({ id: p.id, business_name: p.business_name, business_type: p.business_type, city: p.city, country: p.country, address: p.address, phone: p.phone, website_url: p.website_url })) }
      });
      if (error) throw new Error(error.message);
      const results = data.results || [];
      let found = 0;
      for (const r of results) {
        if (r.email) {
          await supabase.from('prospects').update({ email: r.email }).eq('id', r.id);
          found++;
        }
      }
      toast.success(`${found} email(s) trouves sur ${targets.length} prospects`);
      fetchProspects();
    } catch (e: any) { toast.error(e.message || 'Erreur recherche emails'); }
    finally { setFindingEmails(false); }
  };

  const handleSendBulk = async () => {
    const selected = prospects.filter(p => selectedIds.has(p.id));
    const emailsToSend = generatedEmails.filter(e => e.subject && e.body && !e.error && !e.loading).map(e => {
      const p = selected.find(pr => pr.id === e.prospectId)!;
      return { prospectId: e.prospectId, to: p.email!, toName: p.contact_name || p.business_name, subject: e.subject, body: e.body };
    });
    if (!emailsToSend.length) { toast.error('Aucun email pret'); return; }
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-bulk-prospect-emails', { body: { emails: emailsToSend, userId } });
      if (error) throw new Error(error.message);
      toast.success(data.sent + ' email(s) envoye(s)');
      setShowEmailModal(false); setSelectedIds(new Set()); fetchProspects();
    } catch (e: any) { toast.error(e.message || 'Erreur'); }
    finally { setSending(false); }
  };

  const [websiteFilter, setWebsiteFilter] = useState<'all' | 'no_website' | 'has_website'>('all');

  const filteredProspects = prospects.filter(p => {
    const matchesQuery = p.business_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.city && p.city.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.email && p.email.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesWebsite = websiteFilter === 'all' || (websiteFilter === 'no_website' ? !p.has_website : p.has_website);
    return matchesQuery && matchesWebsite;
  });

  const prospectsNoSite = filteredProspects.filter(p => !p.has_website);
  const prospectsWithSite = filteredProspects.filter(p => p.has_website);

  const stats = { total: prospects.length, noWebsite: prospects.filter(p => !p.has_website).length, withWebsite: prospects.filter(p => p.has_website).length, emailed: prospects.filter(p => p.email_count > 0).length, converted: prospects.filter(p => p.status === 'converted').length, withEmail: prospects.filter(p => !!p.email).length };

  return (
    <div style={{ minHeight:'100vh', background:'var(--cream)', padding:'24px' }}>
      <div style={{ maxWidth:1200, margin:'0 auto' }}>
        <div className='flex items-center justify-between mb-6'>
          <div className='flex items-center gap-4'>
            <Link to='/admin' style={{ color:'var(--text-light)', textDecoration:'none', display:'flex', alignItems:'center', gap:4, fontFamily:'var(--font-b)', fontSize:13 }}>
              <ChevronLeft size={16}/> Dashboard
            </Link>
            <h1 style={{ fontFamily:'var(--font-h)', fontSize:24, color:'var(--charcoal)', margin:0 }}>Agent Prospection</h1>
          </div>
          <button onClick={async () => { await supabase.auth.signOut(); navigate('/admin/login'); }} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-light)' }}><LogOut size={18}/></button>
        </div>

        <div className='flex flex-wrap gap-3 mb-6'>
          {[
            { label:'Total', value:stats.total, icon:Target },
            { label:'Sans site', value:stats.noWebsite, icon:GlobeLock },
            { label:'Avec site', value:stats.withWebsite, icon:Globe },
            { label:'Ont un email', value:stats.withEmail, icon:Mail },
            { label:'Emailes', value:stats.emailed, icon:Send },
            { label:'Convertis', value:stats.converted, icon:Star },
          ].map(s => (
            <div key={s.label} style={{ flex:'1 1 140px', padding:'14px 16px', background:'var(--glass-bg-strong)', border:'1px solid var(--glass-border)', borderRadius:'var(--r)', display:'flex', alignItems:'center', gap:10 }}>
              <s.icon size={16} style={{ color:'var(--teal)' }}/>
              <div>
                <div style={{ fontFamily:'var(--font-h)', fontSize:18, color:'var(--charcoal)' }}>{s.value}</div>
                <div style={{ fontFamily:'var(--font-b)', fontSize:10, color:'var(--text-light)', textTransform:'uppercase', letterSpacing:1 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        <div className='flex gap-2 mb-6'>
          <button onClick={() => setTab('prospects')} style={{ padding:'10px 20px', borderRadius:'var(--pill)', border:'none', fontFamily:'var(--font-b)', fontSize:13, fontWeight:600, cursor:'pointer', background:tab==='prospects'?'var(--teal)':'var(--glass-bg)', color:tab==='prospects'?'#fff':'var(--text-mid)' }}>
            Mes prospects
          </button>
          <button onClick={() => setTab('search')} style={{ padding:'10px 20px', borderRadius:'var(--pill)', border:'none', fontFamily:'var(--font-b)', fontSize:13, fontWeight:600, cursor:'pointer', background:tab==='search'?'var(--teal)':'var(--glass-bg)', color:tab==='search'?'#fff':'var(--text-mid)' }}>
            <Search size={13} style={{ marginRight:6, verticalAlign:'middle' }}/> Chercher des prospects
          </button>
        </div>

        {tab === 'search' && (
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div style={{ padding:24, background:'var(--glass-bg-strong)', border:'1px solid var(--glass-border)', borderRadius:'var(--r-xl)' }}>
              <h3 style={{ fontFamily:'var(--font-h)', fontSize:16, color:'var(--charcoal)', margin:'0 0 8px' }}>Recherche Google Maps — Mondiale</h3>
              <p style={{ fontFamily:'var(--font-b)', fontSize:12, color:'var(--text-light)', margin:'0 0 16px' }}>Choisis un continent, un pays, une ville — ou combine-les. Seul le type est obligatoire.</p>
              <div className='flex flex-col gap-3'>
                <div className='flex flex-col sm:flex-row gap-3'>
                  <select value={searchContinent} onChange={e => { setSearchContinent(e.target.value); setSearchCountry(''); }} style={{ flex:1, padding:'10px 14px', background:'var(--glass-bg)', border:'1px solid var(--glass-border)', borderRadius:'var(--r)', fontFamily:'var(--font-b)', fontSize:14, color:'var(--text)', cursor:'pointer', outline:'none' }}>
                    <option value=''>🌍 Continent (optionnel)</option>
                    {Object.keys(CONTINENTS).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <select value={searchCountry} onChange={e => setSearchCountry(e.target.value)} style={{ flex:1, padding:'10px 14px', background:'var(--glass-bg)', border:'1px solid var(--glass-border)', borderRadius:'var(--r)', fontFamily:'var(--font-b)', fontSize:14, color:'var(--text)', cursor:'pointer', outline:'none' }}>
                    <option value=''>🏳️ Pays (optionnel)</option>
                    {(searchContinent ? CONTINENTS[searchContinent] || [] : Object.values(CONTINENTS).flat().sort()).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <input placeholder='📍 Ville (optionnel, ex: Lyon)' value={searchCity} onChange={e => setSearchCity(e.target.value)} style={{ flex:1, padding:'10px 14px', background:'var(--glass-bg)', border:'1px solid var(--glass-border)', borderRadius:'var(--r)', fontFamily:'var(--font-b)', fontSize:14, color:'var(--text)', outline:'none' }} />
                </div>
                <div className='flex flex-col gap-3'>
                  <div>
                    <label style={{ fontFamily:'var(--font-b)', fontSize:12, color:'var(--text-light)', display:'block', marginBottom:8, textTransform:'uppercase', letterSpacing:1 }}>Types de commerce * (multi-selection)</label>
                    <div className='flex flex-wrap gap-2'>
                      {BT.map(t => (
                        <button key={t} onClick={() => toggleSearchType(t)} style={{ padding:'6px 14px', borderRadius:'var(--pill)', border:'1px solid', borderColor:searchTypes.includes(t)?'var(--teal)':'var(--glass-border)', background:searchTypes.includes(t)?'rgba(13,138,111,0.12)':'var(--glass-bg)', color:searchTypes.includes(t)?'var(--teal)':'var(--text-mid)', fontFamily:'var(--font-b)', fontSize:12, fontWeight:searchTypes.includes(t)?600:400, cursor:'pointer', transition:'all 0.2s' }}>
                          {searchTypes.includes(t) ? '✓ ' : ''}{t}
                        </button>
                      ))}
                    </div>
                  </div>
                  {searchTypes.includes('Autre') && <input placeholder='Type personnalise...' value={customType} onChange={e => setCustomType(e.target.value)} style={{ padding:'10px 14px', background:'var(--glass-bg)', border:'1px solid var(--glass-border)', borderRadius:'var(--r)', fontFamily:'var(--font-b)', fontSize:14, color:'var(--text)', outline:'none' }} />}
                  <div className='flex items-center gap-3'>
                    <div className='flex items-center gap-2' style={{ padding:'10px 14px', background:'var(--glass-bg)', border:'1px solid var(--glass-border)', borderRadius:'var(--r)', flex:'0 0 auto' }}>
                      <label style={{ fontFamily:'var(--font-b)', fontSize:12, color:'var(--text-light)', whiteSpace:'nowrap' }}>Max resultats:</label>
                      <input type='number' min={5} max={60} value={maxResults} onChange={e => setMaxResults(Number(e.target.value))} style={{ width:60, background:'transparent', border:'none', outline:'none', fontFamily:'var(--font-b)', fontSize:14, color:'var(--text)', textAlign:'center' }} />
                    </div>
                    <button onClick={handleSearch} disabled={searching} style={{ padding:'10px 24px', background:'var(--teal)', color:'#fff', border:'none', borderRadius:'var(--r)', fontFamily:'var(--font-b)', fontSize:14, fontWeight:600, cursor:searching?'not-allowed':'pointer', display:'flex', alignItems:'center', gap:6, opacity:searching?0.7:1, whiteSpace:'nowrap', flex:'0 0 auto' }}>
                      {searching ? <Loader2 size={14} className='animate-spin'/> : <Search size={14}/>}
                      {searching ? 'Recherche...' : 'Chercher'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {searchResults && (
              <div style={{ background:'var(--glass-bg-strong)', border:'1px solid var(--glass-border)', borderRadius:'var(--r-xl)', padding:20 }}>
                <div className='flex items-center justify-between mb-4'>
                  <h4 style={{ fontFamily:'var(--font-h)', fontSize:15, color:'var(--charcoal)', margin:0 }}>{searchResults.length} resultats</h4>
                  <button onClick={addAllNoWebsite} style={{ padding:'8px 16px', background:'var(--teal)', color:'#fff', border:'none', borderRadius:'var(--pill)', fontFamily:'var(--font-b)', fontSize:12, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
                    <UserPlus size={13}/> Importer sans site ({searchResults.filter(r => !r.has_website).length})
                  </button>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {searchResults.map(r => (
                    <div key={r.google_place_id} className='flex items-center gap-4' style={{ padding:'12px 16px', background:r.has_website?'transparent':'rgba(13,138,111,0.04)', borderRadius:'var(--r)', border:'1px solid var(--glass-border)' }}>
                      <div style={{ flex:1 }}>
                        <div className='flex items-center gap-2'>
                          <span style={{ fontWeight:600, fontFamily:'var(--font-b)', color:'var(--charcoal)' }}>{r.business_name}</span>
                          {r.rating && <span style={{ fontSize:11, color:'var(--text-light)', display:'flex', alignItems:'center', gap:2 }}><Star size={10}/> {r.rating} ({r.review_count})</span>}
                          {r.has_website ? <Globe size={12} style={{ color:'var(--text-light)' }}/> : <GlobeLock size={12} style={{ color:'var(--teal)' }}/>}
                        </div>
                        <div style={{ fontSize:12, color:'var(--text-light)', fontFamily:'var(--font-b)' }}>{r.address}</div>
                        {r.phone && <div style={{ fontSize:12, color:'var(--text-mid)', fontFamily:'var(--font-b)' }}>{r.phone}</div>}
                      </div>
                      <span style={{ padding:'6px 14px', background:'var(--glass-bg)', border:'1px solid var(--glass-border)', borderRadius:'var(--pill)', fontFamily:'var(--font-b)', fontSize:12, color:'var(--teal)', fontWeight:600 }}>
                        <Check size={12} style={{ marginRight:4, verticalAlign:'middle' }}/> Sauvegarde
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'prospects' && (
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div className='flex flex-col sm:flex-row gap-3'>
              <div className='flex items-center gap-2 flex-1' style={{ padding:'10px 16px', background:'var(--glass-bg)', borderRadius:'var(--r)', border:'1px solid var(--glass-border)' }}>
                <Search size={16} style={{ color:'var(--text-light)' }} />
                <input placeholder='Rechercher...' value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ flex:1, background:'transparent', border:'none', outline:'none', fontFamily:'var(--font-b)', fontSize:14, color:'var(--text)' }} />
              </div>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding:'10px 16px', background:'var(--glass-bg)', border:'1px solid var(--glass-border)', borderRadius:'var(--r)', fontFamily:'var(--font-b)', fontSize:14, color:'var(--text)', cursor:'pointer', outline:'none' }}>
                <option value='all'>Tous statuts</option>
                {Object.entries(SL).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <select value={websiteFilter} onChange={e => setWebsiteFilter(e.target.value as any)} style={{ padding:'10px 16px', background:'var(--glass-bg)', border:'1px solid var(--glass-border)', borderRadius:'var(--r)', fontFamily:'var(--font-b)', fontSize:14, color:'var(--text)', cursor:'pointer', outline:'none' }}>
                <option value='all'>Tous (site)</option>
                <option value='no_website'>🔒 Sans site</option>
                <option value='has_website'>🌐 Avec site</option>
              </select>
              <button onClick={() => setShowManualAdd(true)} style={{ padding:'10px 16px', background:'var(--glass-bg-strong)', color:'var(--text-mid)', border:'1px solid var(--glass-border)', borderRadius:'var(--r)', fontFamily:'var(--font-b)', fontSize:13, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
                <Plus size={14}/> Ajouter manuellement
              </button>
              <button onClick={fetchProspects} style={{ padding:'10px 14px', background:'var(--glass-bg-strong)', color:'var(--text-mid)', border:'1px solid var(--glass-border)', borderRadius:'var(--r)', cursor:'pointer' }}>
                <RefreshCw size={14}/>
              </button>
            </div>
            {/* AI Email Finder bar */}
            <div style={{ padding:'12px 20px', background:'rgba(212,165,90,0.08)', border:'1px solid rgba(212,165,90,0.3)', borderRadius:'var(--r)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <span style={{ fontFamily:'var(--font-b)', fontSize:13, color:'var(--text-mid)' }}>
                <Sparkles size={14} style={{ color:'#d4a55a', verticalAlign:'middle', marginRight:6 }}/>
                {stats.withEmail} / {stats.total} prospects ont un email
              </span>
              <button onClick={findEmails} disabled={findingEmails} style={{ padding:'8px 16px', background:'#d4a55a', color:'#fff', border:'none', borderRadius:'var(--pill)', fontFamily:'var(--font-b)', fontSize:12, fontWeight:600, cursor:findingEmails?'not-allowed':'pointer', display:'flex', alignItems:'center', gap:6, opacity:findingEmails?0.7:1 }}>
                {findingEmails ? <Loader2 size={13} className='animate-spin'/> : <Sparkles size={13}/>}
                {findingEmails ? 'Recherche...' : selectedIds.size > 0 ? `Trouver emails (${selectedIds.size} sel.)` : 'Trouver emails IA (tous)'}
              </button>
            </div>
            {selectedIds.size > 0 && (
              <div style={{ padding:'12px 20px', background:'rgba(13,138,111,0.08)', border:'1px solid rgba(13,138,111,0.3)', borderRadius:'var(--r)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <span style={{ fontFamily:'var(--font-b)', fontSize:14, color:'var(--teal)', fontWeight:600 }}>{selectedIds.size} prospect(s) selectionne(s)</span>
                <div className='flex gap-2'>
                  <button onClick={() => setSelectedIds(new Set())} style={{ padding:'8px 14px', background:'transparent', border:'1px solid var(--glass-border)', borderRadius:'var(--pill)', fontFamily:'var(--font-b)', fontSize:12, color:'var(--text-mid)', cursor:'pointer' }}>Deselectionner</button>
                  <button onClick={deleteSelected} style={{ padding:'8px 16px', background:'#e8735a', color:'#fff', border:'none', borderRadius:'var(--pill)', fontFamily:'var(--font-b)', fontSize:12, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
                    <Trash2 size={13}/> Supprimer ({selectedIds.size})
                  </button>
                  <button onClick={openEmailModal} style={{ padding:'8px 16px', background:'var(--teal)', color:'#fff', border:'none', borderRadius:'var(--pill)', fontFamily:'var(--font-b)', fontSize:12, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
                    <Mail size={13}/> Envoyer emails IA
                  </button>
                </div>
              </div>
            )}
            {loading ? <div className='text-center py-20' style={{ color:'var(--text-light)', fontFamily:'var(--font-b)' }}>Chargement...</div>
            : filteredProspects.length === 0 ? <div className='text-center py-20' style={{ color:'var(--text-light)', fontFamily:'var(--font-b)' }}>Aucun prospect — utilise Chercher des prospects.</div>
            : (
              <div className='flex flex-col gap-6'>
                {/* Section: Sans site internet */}
                {prospectsNoSite.length > 0 && (
                  <div>
                    <div className='flex items-center gap-2 mb-3'>
                      <GlobeLock size={16} style={{ color:'var(--teal)' }}/>
                      <h3 style={{ fontFamily:'var(--font-h)', fontSize:16, color:'var(--charcoal)', margin:0 }}>Sans site internet</h3>
                      <span style={{ padding:'2px 10px', borderRadius:'var(--pill)', background:'rgba(13,138,111,0.1)', color:'var(--teal)', fontFamily:'var(--font-b)', fontSize:12, fontWeight:600 }}>{prospectsNoSite.length}</span>
                    </div>
                    <ProspectTable prospects={prospectsNoSite} selectedIds={selectedIds} onToggleSelect={toggleSelect} onToggleSelectAll={() => { const ids = prospectsNoSite.map(p=>p.id); const all = ids.every(id=>selectedIds.has(id)); setSelectedIds(prev => { const n = new Set(prev); ids.forEach(id => all ? n.delete(id) : n.add(id)); return n; }); }} onDelete={deleteProspect} onUpdateEmail={updateEmail} onUpdateStatus={updateStatus} />
                  </div>
                )}

                {/* Section: Avec site internet */}
                {prospectsWithSite.length > 0 && (
                  <div>
                    <div className='flex items-center gap-2 mb-3'>
                      <Globe size={16} style={{ color:'var(--text-light)' }}/>
                      <h3 style={{ fontFamily:'var(--font-h)', fontSize:16, color:'var(--charcoal)', margin:0 }}>Avec site internet</h3>
                      <span style={{ padding:'2px 10px', borderRadius:'var(--pill)', background:'var(--glass-bg)', color:'var(--text-mid)', fontFamily:'var(--font-b)', fontSize:12, fontWeight:600 }}>{prospectsWithSite.length}</span>
                    </div>
                    <ProspectTable prospects={prospectsWithSite} selectedIds={selectedIds} onToggleSelect={toggleSelect} onToggleSelectAll={() => { const ids = prospectsWithSite.map(p=>p.id); const all = ids.every(id=>selectedIds.has(id)); setSelectedIds(prev => { const n = new Set(prev); ids.forEach(id => all ? n.delete(id) : n.add(id)); return n; }); }} onDelete={deleteProspect} onUpdateEmail={updateEmail} onUpdateStatus={updateStatus} />
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {showManualAdd && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', backdropFilter:'blur(6px)', zIndex:100, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div style={{ width:'100%', maxWidth:560, background:'white', borderRadius:'var(--r-xl)', padding:32, maxHeight:'90vh', overflowY:'auto' }}>
            <div className='flex items-center justify-between mb-6'>
              <h2 style={{ fontFamily:'var(--font-h)', fontSize:20, color:'var(--charcoal)', margin:0 }}>Ajouter un prospect</h2>
              <button onClick={() => setShowManualAdd(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-light)' }}><X size={20}/></button>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              {[
                { label:'Nom du commerce *', key:'business_name', full:true },
                { label:'Nom du contact', key:'contact_name' },
                { label:'Email', key:'email' },
                { label:'Telephone', key:'phone' },
                { label:"Type d'activite", key:'business_type' },
                { label:'Ville', key:'city' },
                { label:'Notes', key:'notes', full:true },
              ].map(field => (
                <div key={field.key} style={{ gridColumn:field.full ? '1 / -1' : undefined }}>
                  <label style={{ fontFamily:'var(--font-b)', fontSize:12, color:'var(--text-light)', display:'block', marginBottom:4 }}>{field.label}</label>
                  <input value={(manualForm as any)[field.key]} onChange={e => setManualForm(prev => ({ ...prev, [field.key]: e.target.value }))} style={{ width:'100%', padding:'10px 14px', background:'var(--glass-bg)', border:'1px solid var(--glass-border)', borderRadius:'var(--r)', fontFamily:'var(--font-b)', fontSize:14, color:'var(--text)', outline:'none', boxSizing:'border-box' }} />
                </div>
              ))}
            </div>
            <div className='flex gap-3 mt-6'>
              <button onClick={() => setShowManualAdd(false)} style={{ flex:1, padding:12, background:'var(--glass-bg)', border:'1px solid var(--glass-border)', borderRadius:'var(--r)', fontFamily:'var(--font-b)', fontSize:14, cursor:'pointer', color:'var(--text-mid)' }}>Annuler</button>
              <button onClick={handleManualAdd} style={{ flex:1, padding:12, background:'var(--teal)', color:'#fff', border:'none', borderRadius:'var(--r)', fontFamily:'var(--font-b)', fontSize:14, fontWeight:600, cursor:'pointer' }}>Ajouter</button>
            </div>
          </div>
        </div>
      )}

      {showEmailModal && (
        <BulkEmailModal
          prospects={prospects.filter(p => selectedIds.has(p.id))}
          generatedEmails={generatedEmails}
          generatingAll={generatingAll}
          sending={sending}
          onUpdateEmail={(idx, field, val) => setGeneratedEmails(prev => prev.map((e,i) => i===idx ? { ...e, [field]: val } : e))}
          onSend={handleSendBulk}
          onClose={() => setShowEmailModal(false)}
        />
      )}
    </div>
  );
};

const ProspectTable = ({ prospects, selectedIds, onToggleSelect, onToggleSelectAll, onDelete, onUpdateEmail, onUpdateStatus }: {
  prospects: Prospect[]; selectedIds: Set<string>;
  onToggleSelect: (id: string) => void; onToggleSelectAll: () => void;
  onDelete: (id: string) => void; onUpdateEmail: (id: string, email: string) => void;
  onUpdateStatus: (id: string, status: ProspectStatus) => void;
}) => (
  <div style={{ background:'var(--glass-bg-strong)', backdropFilter:'blur(20px)', borderRadius:'var(--r)', border:'1px solid var(--glass-border)', overflow:'hidden' }}>
    <div className='hidden md:block overflow-x-auto'>
      <table className='w-full' style={{ fontFamily:'var(--font-b)', fontSize:14, borderCollapse:'collapse' }}>
        <thead>
          <tr style={{ borderBottom:'1px solid var(--glass-border)' }}>
            <th className='px-4 py-3' style={{ width:40 }}>
              <button onClick={onToggleSelectAll} style={{ background:'none', border:'none', cursor:'pointer' }}>
                {prospects.every(p => selectedIds.has(p.id)) ? <CheckSquare size={16} style={{ color:'var(--teal)' }}/> : <Square size={16} style={{ color:'var(--text-ghost)' }}/>}
              </button>
            </th>
            {['Commerce','Contact','Email','Ville / Langue','Site','Statut','Envois',''].map(h => (
              <th key={h} className='text-left px-4 py-3' style={{ fontSize:11, textTransform:'uppercase', letterSpacing:1, color:'var(--text-light)', fontWeight:600 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{prospects.map(p => <ProspectRow key={p.id} prospect={p} selected={selectedIds.has(p.id)} onToggle={() => onToggleSelect(p.id)} onDelete={() => onDelete(p.id)} onUpdateEmail={email => onUpdateEmail(p.id, email)} onUpdateStatus={status => onUpdateStatus(p.id, status)} />)}</tbody>
      </table>
    </div>
    <div className='md:hidden flex flex-col'>
      {prospects.map(p => (
        <div key={p.id} className='flex items-start gap-3 p-4' style={{ borderBottom:'1px solid rgba(0,0,0,0.04)' }}>
          <button onClick={() => onToggleSelect(p.id)} style={{ background:'none', border:'none', cursor:'pointer', marginTop:2 }}>
            {selectedIds.has(p.id) ? <CheckSquare size={16} style={{ color:'var(--teal)' }}/> : <Square size={16} style={{ color:'var(--text-ghost)' }}/>}
          </button>
          <div style={{ flex:1 }}>
            <div className='flex items-center gap-2 mb-1'>
              <span style={{ fontWeight:600, color:'var(--charcoal)', fontFamily:'var(--font-b)' }}>{p.business_name}</span>
              <span style={{ padding:'2px 8px', borderRadius:'var(--pill)', background:SC[p.status]+'18', color:SC[p.status], fontSize:11, fontWeight:600 }}>{SL[p.status]}</span>
            </div>
            <p style={{ fontSize:12, color:'var(--text-mid)', margin:'2px 0', fontFamily:'var(--font-b)' }}>{p.email || 'Pas d\'email'}</p>
            <p style={{ fontSize:12, color:'var(--text-light)', margin:0, fontFamily:'var(--font-b)' }}>{p.city} - {p.has_website ? 'Site OK' : 'Sans site'} - {p.email_count}x</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const ProspectRow = ({ prospect: p, selected, onToggle, onDelete, onUpdateEmail, onUpdateStatus }: {
  prospect: Prospect; selected: boolean;
  onToggle: () => void; onDelete: () => void;
  onUpdateEmail: (email: string) => void;
  onUpdateStatus: (status: ProspectStatus) => void;
}) => {
  const [editingEmail, setEditingEmail] = useState(false);
  const [emailVal, setEmailVal] = useState(p.email || '');
  return (
    <tr style={{ borderBottom:'1px solid rgba(0,0,0,0.04)', background:selected?'rgba(13,138,111,0.04)':'transparent' }}>
      <td className='px-4 py-3'>
        <button onClick={onToggle} style={{ background:'none', border:'none', cursor:'pointer' }}>
          {selected ? <CheckSquare size={16} style={{ color:'var(--teal)' }}/> : <Square size={16} style={{ color:'var(--text-ghost)' }}/>}
        </button>
      </td>
      <td className='px-4 py-3'>
        <div style={{ fontWeight:600, color:'var(--charcoal)', fontSize:14 }}>{p.business_name}</div>
        {p.business_type && <div style={{ fontSize:11, color:'var(--text-light)' }}>{p.business_type}</div>}
      </td>
      <td className='px-4 py-3' style={{ color:'var(--text-mid)', fontSize:13 }}>
        {p.contact_name || '—'}
        {p.phone && <div style={{ fontSize:11, color:'var(--text-light)' }}>{p.phone}</div>}
      </td>
      <td className='px-4 py-3'>
        {editingEmail ? (
          <div className='flex items-center gap-1'>
            <input value={emailVal} onChange={e => setEmailVal(e.target.value)} autoFocus onKeyDown={e => { if(e.key==='Enter'){onUpdateEmail(emailVal);setEditingEmail(false);} if(e.key==='Escape')setEditingEmail(false); }} style={{ padding:'4px 8px', border:'1px solid var(--teal)', borderRadius:6, fontSize:13, outline:'none', width:160 }} />
            <button onClick={() => { onUpdateEmail(emailVal); setEditingEmail(false); }} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--teal)' }}><Check size={14}/></button>
            <button onClick={() => setEditingEmail(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-light)' }}><X size={14}/></button>
          </div>
        ) : (
          <div className='flex items-center gap-2'>
            <span style={{ fontSize:13, color:p.email?'var(--text-mid)':'var(--text-ghost)', fontStyle:p.email?'normal':'italic' }}>{p.email || 'Pas d\'email'}</span>
            <button onClick={() => setEditingEmail(true)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-ghost)', opacity:0.6 }}><Pencil size={11}/></button>
          </div>
        )}
      </td>
      <td className='px-4 py-3' style={{ color:'var(--text-mid)', fontSize:13 }}>
        <div>{p.city || '—'}</div>
        <span style={{ fontSize:10, color:'var(--text-light)', fontWeight:600 }}>{LANG_LABELS[p.language || COUNTRY_LANG[p.country || ''] || 'en'] || p.language}</span>
      </td>
      <td className='px-4 py-3'>
        {p.has_website
          ? <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:12, color:'var(--text-light)' }}><Globe size={12}/> A un site</span>
          : <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:12, color:'var(--teal)', fontWeight:600 }}><GlobeLock size={12}/> Aucun site</span>}
      </td>
      <td className='px-4 py-3'>
        <select value={p.status} onChange={e => onUpdateStatus(e.target.value as ProspectStatus)} style={{ padding:'4px 8px', borderRadius:'var(--pill)', border:'none', background:SC[p.status]+'18', color:SC[p.status], fontWeight:600, fontSize:12, fontFamily:'var(--font-m)', cursor:'pointer' }}>
          {Object.entries(SL).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </td>
      <td className='px-4 py-3' style={{ fontSize:12, color:'var(--text-light)' }}>{p.email_count}x</td>
      <td className='px-4 py-3'>
        <button onClick={onDelete} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-ghost)' }}><Trash2 size={14}/></button>
      </td>
    </tr>
  );
};

const BulkEmailModal = ({ prospects, generatedEmails, generatingAll, sending, onUpdateEmail, onSend, onClose }: {
  prospects: Prospect[]; generatedEmails: GeneratedEmail[]; generatingAll: boolean; sending: boolean;
  onUpdateEmail: (idx: number, field: 'subject' | 'body', val: string) => void;
  onSend: () => void; onClose: () => void;
}) => {
  const [activeIdx, setActiveIdx] = useState(0);
  const ready = generatedEmails.filter(e => e.subject && e.body && !e.error && !e.loading);
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', backdropFilter:'blur(8px)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ width:'100%', maxWidth:800, background:'white', borderRadius:'var(--r-xl)', overflow:'hidden', maxHeight:'92vh', display:'flex', flexDirection:'column' }}>
        <div style={{ padding:'20px 28px', borderBottom:'1px solid var(--glass-border)', display:'flex', alignItems:'center', justifyContent:'space-between', background:'var(--glass-bg-strong)' }}>
          <div>
            <h2 style={{ fontFamily:'var(--font-h)', fontSize:18, color:'var(--charcoal)', margin:0 }}>Emails generes par Claude AI</h2>
            <p style={{ fontFamily:'var(--font-b)', fontSize:13, color:'var(--text-mid)', margin:'4px 0 0' }}>
              {generatingAll ? 'Generation en cours...' : ready.length + '/' + prospects.length + ' prets'}
            </p>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-mid)' }}><X size={20}/></button>
        </div>
        <div style={{ display:'flex', flex:1, overflow:'hidden' }}>
          <div style={{ width:200, borderRight:'1px solid var(--glass-border)', overflowY:'auto', background:'var(--glass-bg)', flexShrink:0 }}>
            {prospects.map((p,i) => {
              const email = generatedEmails[i];
              return (
                <button key={p.id} onClick={() => setActiveIdx(i)} style={{ width:'100%', padding:'12px 16px', textAlign:'left', background:activeIdx===i?'rgba(13,138,111,0.1)':'transparent', border:'none', borderBottom:'1px solid var(--glass-border)', cursor:'pointer', borderLeft:activeIdx===i?'3px solid var(--teal)':'3px solid transparent' }}>
                  <div style={{ fontFamily:'var(--font-b)', fontSize:13, fontWeight:600, color:'var(--charcoal)', marginBottom:2 }}>{p.business_name}</div>
                  <div style={{ fontSize:11, color:email?.loading?'#4da6d9':email?.error?'#e8735a':email?.subject?'var(--teal)':'var(--text-ghost)' }}>
                    {email?.loading ? 'Generation...' : email?.error ? 'Erreur' : email?.subject ? 'Pret' : 'En attente'}
                  </div>
                </button>
              );
            })}
          </div>

          <div style={{ flex:1, overflowY:'auto', padding:28 }}>
            {generatedEmails[activeIdx] && (() => {
              const e = generatedEmails[activeIdx];
              const p = prospects[activeIdx];
              if (e.loading) return (
                <div style={{ display:'flex', alignItems:'center', gap:12, color:'var(--text-mid)', fontFamily:'var(--font-b)', paddingTop:40 }}>
                  <Loader2 size={20} className='animate-spin' style={{ color:'var(--teal)' }}/>
                  Generation pour {p.business_name}...
                </div>
              );
              if (e.error) return (
                <div style={{ padding:20, background:'rgba(232,115,90,0.1)', border:'1px solid rgba(232,115,90,0.3)', borderRadius:'var(--r)', color:'#e8735a', fontFamily:'var(--font-b)', fontSize:14 }}>
                  Erreur: {e.error}
                </div>
              );
              return (
                <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                  <div style={{ padding:'8px 12px', background:'rgba(13,138,111,0.06)', borderRadius:'var(--r)', fontFamily:'var(--font-b)', fontSize:12, color:'var(--text-mid)' }}>
                    <strong>A:</strong> {p.email} &nbsp; <strong>Commerce:</strong> {p.business_name} &nbsp; {p.city}
                  </div>
                  <div>
                    <label style={{ fontFamily:'var(--font-b)', fontSize:12, color:'var(--text-light)', display:'block', marginBottom:6 }}>OBJET</label>
                    <input value={e.subject} onChange={ev => onUpdateEmail(activeIdx,'subject',ev.target.value)} style={{ width:'100%', padding:'10px 14px', border:'1px solid var(--glass-border)', borderRadius:'var(--r)', fontFamily:'var(--font-b)', fontSize:14, color:'var(--charcoal)', outline:'none', boxSizing:'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontFamily:'var(--font-b)', fontSize:12, color:'var(--text-light)', display:'block', marginBottom:6 }}>CORPS EMAIL (HTML editable)</label>
                    <textarea value={e.body} onChange={ev => onUpdateEmail(activeIdx,'body',ev.target.value)} rows={14} style={{ width:'100%', padding:'12px 14px', border:'1px solid var(--glass-border)', borderRadius:'var(--r)', fontFamily:'var(--font-b)', fontSize:13, color:'var(--charcoal)', outline:'none', resize:'vertical', lineHeight:1.7, boxSizing:'border-box' }} />
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
        <div style={{ padding:'16px 28px', borderTop:'1px solid var(--glass-border)', display:'flex', alignItems:'center', justifyContent:'space-between', background:'var(--glass-bg)' }}>
          <p style={{ fontFamily:'var(--font-b)', fontSize:13, color:'var(--text-mid)', margin:0 }}>{ready.length} email(s) prets</p>
          <div className='flex gap-3'>
            <button onClick={onClose} style={{ padding:'10px 20px', background:'transparent', border:'1px solid var(--glass-border)', borderRadius:'var(--pill)', fontFamily:'var(--font-b)', fontSize:13, cursor:'pointer', color:'var(--text-mid)' }}>Annuler</button>
            <button onClick={onSend} disabled={sending||generatingAll||!ready.length} style={{ padding:'10px 24px', background:'var(--teal)', color:'#fff', border:'none', borderRadius:'var(--pill)', fontFamily:'var(--font-b)', fontSize:13, fontWeight:600, cursor:(sending||generatingAll||!ready.length)?'not-allowed':'pointer', opacity:(sending||generatingAll||!ready.length)?0.6:1, display:'flex', alignItems:'center', gap:8 }}>
              {sending ? <Loader2 size={14} className='animate-spin'/> : <Send size={14}/>}
              {sending ? 'Envoi...' : 'Envoyer ' + ready.length + ' email(s)'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProspects;
