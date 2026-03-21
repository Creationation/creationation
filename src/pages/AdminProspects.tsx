import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Search, Plus, Trash2, MapPin, Phone, Globe, GlobeLock, Star, RefreshCw, CheckSquare, Square, Loader2, UserPlus, Send, Pencil, X, Check, Target, Mail, Languages, Sparkles, History, SkipForward, LogOut, ArrowRightLeft, Eye } from 'lucide-react';
import AdminHeader from '@/components/admin/AdminHeader';
import SectorsDashboard from '@/components/admin/SectorsDashboard';
import ProspectDetailEnriched from '@/components/admin/ProspectDetailEnriched';

type ProspectStatus = 'new' | 'emailed' | 'replied' | 'converted' | 'rejected';
type Prospect = { id: string; business_name: string; contact_name: string | null; email: string | null; phone: string | null; business_type: string | null; city: string | null; country: string | null; address: string | null; google_place_id: string | null; has_website: boolean; website_url: string | null; notes: string | null; source: string | null; status: ProspectStatus; email_count: number; last_emailed_at: string | null; created_at: string; language: string | null; score?: number; score_breakdown?: any; sector?: string | null; sequence_id?: string | null; sequence_step?: number; sequence_paused?: boolean; tags?: string[]; competitor_site_url?: string | null; competitor_audit?: any; };
type SearchResult = { google_place_id: string; business_name: string; address: string; phone: string | null; has_website: boolean; website_url: string | null; rating: number | null; review_count: number; types: string[]; city: string; country: string; business_type: string; };
type GeneratedEmail = { prospectId: string; subject: string; body: string; loading?: boolean; error?: string; };
type SearchChunk = { id: string; continent: string | null; country: string | null; city: string | null; business_type: string; results_count: number; mode: string; cost_eur: number; created_at: string; };

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

// EUR cost constants
const COST_EUR = {
  GOOGLE_TEXT_SEARCH: 0.029,
  GOOGLE_WEBSITE_CHECK: 0.016,
  GOOGLE_PHONE_DETAIL: 0.018,
  AI_EMAIL_FIND: 0.00046,
  AI_EMAIL_GEN: 0.00092,
  AI_INFO_FIND: 0.00046,
};

const logOperation = async (userId: string, type: string, description: string, costEur: number, prospectCount: number, details: Record<string, any> = {}) => {
  try {
    await supabase.from('operation_logs' as any).insert({
      user_id: userId, operation_type: type, description, cost_eur: costEur,
      prospect_count: prospectCount, details,
    } as any);
  } catch (e) { console.warn('Failed to log operation', e); }
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
  const [findingInfo, setFindingInfo] = useState(false);
  const [tab, setTab] = useState<'search' | 'prospects'>('prospects');
  const [searchChunks, setSearchChunks] = useState<SearchChunk[]>([]);
  const [showChunkHistory, setShowChunkHistory] = useState(false);
  const [detailProspect, setDetailProspect] = useState<Prospect | null>(null);
  const [transferring, setTransferring] = useState(false);
  const [scoring, setScoring] = useState(false);
  const [showSectors, setShowSectors] = useState(false);
  const [scoreMin, setScoreMin] = useState(0);
  const [sectorFilter, setSectorFilter] = useState<string[]>([]);
  const [tagFilter, setTagFilter] = useState<string[]>([]);
  const [sequenceFilter, setSequenceFilter] = useState<'all' | 'in_sequence' | 'not_in_sequence'>('all');
  const [lastInteractionDays, setLastInteractionDays] = useState<number | null>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [savedSearches, setSavedSearches] = useState<{ id: string; name: string; filters: any }[]>([]);
  const [savingSearch, setSavingSearch] = useState(false);
  const [allSectors, setAllSectors] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);

  const scoreProspects = async () => {
    const targets = selectedIds.size > 0
      ? prospects.filter(p => selectedIds.has(p.id))
      : prospects;
    if (!targets.length) { toast.error('Aucun prospect à scorer'); return; }
    setScoring(true);
    try {
      const batchSize = 20;
      let scored = 0;
      for (let i = 0; i < targets.length; i += batchSize) {
        const batch = targets.slice(i, i + batchSize);
        const { data, error } = await supabase.functions.invoke('score-prospect', {
          body: { prospect_ids: batch.map(p => p.id) }
        });
        if (error) console.warn('Score batch error:', error);
        else scored += (data?.results?.length || 0);
      }
      toast.success(`${scored} prospect(s) scoré(s)`);
      fetchProspects();
    } catch (e: any) { toast.error(e.message || 'Erreur scoring'); }
    finally { setScoring(false); }
  };

  const fetchChunks = useCallback(async () => {
    const { data } = await supabase.from('search_chunks' as any).select('*').order('created_at', { ascending: false });
    setSearchChunks((data as any as SearchChunk[]) || []);
  }, []);

  const fetchSavedSearches = useCallback(async () => {
    const { data } = await supabase.from('saved_searches').select('id, name, filters');
    setSavedSearches((data as any[]) || []);
  }, []);

  const fetchProspects = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('prospects').select('*').order('created_at', { ascending: false });
    if (statusFilter !== 'all') query = query.eq('status', statusFilter as ProspectStatus);
    const { data, error } = await query;
    if (error) toast.error('Erreur chargement');
    else {
      const p = (data as Prospect[]) || [];
      setProspects(p);
      setAllSectors([...new Set(p.map(x => x.sector).filter(Boolean))] as string[]);
      setAllTags([...new Set(p.flatMap(x => x.tags || []).filter(Boolean))] as string[]);
    }
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { navigate('/admin/login'); return; }
      setUserId(user.id);
      supabase.from('user_roles').select('role').eq('user_id', user.id).eq('role', 'admin').then(({ data: roles }) => {
        if (!roles || roles.length === 0) navigate('/admin/login');
        else { fetchProspects(); fetchChunks(); fetchSavedSearches(); }
      });
    });
  }, [navigate, fetchProspects]);

  const saveSearch = async () => {
    const name = prompt('Nom de la recherche :');
    if (!name) return;
    setSavingSearch(true);
    const filters = { statusFilter, websiteFilter, scoreMin, sectorFilter, tagFilter, sequenceFilter, lastInteractionDays, searchQuery };
    await supabase.from('saved_searches').insert({ name, filters, result_count: filteredProspects.length } as any);
    toast.success('Recherche sauvegardée');
    fetchSavedSearches();
    setSavingSearch(false);
  };

  const loadSearch = (search: { filters: any }) => {
    const f = search.filters;
    if (f.statusFilter) setStatusFilter(f.statusFilter);
    if (f.websiteFilter) setWebsiteFilter(f.websiteFilter);
    if (typeof f.scoreMin === 'number') setScoreMin(f.scoreMin);
    if (f.sectorFilter) setSectorFilter(f.sectorFilter);
    if (f.tagFilter) setTagFilter(f.tagFilter);
    if (f.sequenceFilter) setSequenceFilter(f.sequenceFilter);
    if (f.lastInteractionDays !== undefined) setLastInteractionDays(f.lastInteractionDays);
    if (f.searchQuery !== undefined) setSearchQuery(f.searchQuery);
    setShowAdvancedFilters(true);
    toast.success('Filtres chargés');
  };

  const toggleSearchType = (t: string) => setSearchTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);

  const isChunkDone = (country: string, city: string, type: string) => {
    return searchChunks.some(c =>
      (c.country || '') === country && (c.city || '') === city && c.business_type === type
    );
  };

  const handleSearch = async (skipDetails = false) => {
    const types = searchTypes.includes('Autre') ? [...searchTypes.filter(t => t !== 'Autre'), ...(customType ? [customType] : [])] : searchTypes;
    const location = searchCity || searchCountry || searchContinent;
    if (!location || !types.length) { toast.error('Remplis au moins une localisation et un type'); return; }
    setSearching(true); setSearchResults(null);
    try {
      const { data: existing } = await supabase.from('prospects').select('google_place_id');
      const existingIds = new Set((existing || []).map(p => p.google_place_id).filter(Boolean));

      const countries: string[] = (!searchCountry && !searchCity && searchContinent && CONTINENTS[searchContinent])
        ? CONTINENTS[searchContinent]
        : [searchCountry || ''];

      const allResults: SearchResult[] = [];
      let skippedChunks = 0;
      let totalSearches = types.length * countries.length;
      let completedSearches = 0;

      for (const country of countries) {
        for (const type of types) {
          completedSearches++;
          // Skip already-searched chunks
          if (isChunkDone(country, searchCity, type)) {
            skippedChunks++;
            if (countries.length > 1) {
              toast.info(`⏭️ Déjà cherché: ${type} en ${country}${searchCity ? ' / ' + searchCity : ''} — ignoré (${completedSearches}/${totalSearches})`, { id: 'search-progress', duration: 1500 });
            } else {
              toast.info(`⏭️ Cette recherche a déjà été effectuée (${type} en ${country || 'tous'}${searchCity ? ' / ' + searchCity : ''}). Résultats déjà dans ta base.`, { duration: 3000 });
            }
            continue;
          }

          if (countries.length > 1) {
            toast.info(`Recherche ${completedSearches}/${totalSearches}: ${type} en ${country}...`, { id: 'search-progress' });
          }
          try {
            const { data, error } = await supabase.functions.invoke('prospect-search', {
              body: { city: searchCity || '', businessType: type, country: country, maxResults: Math.min(maxResults, countries.length > 1 ? 60 : maxResults), fetchPhone, skipDetails }
            });
            if (error) { console.warn(`Error for ${type} in ${country}:`, error.message); continue; }
            const results = (data.results || []) as SearchResult[];
            let chunkCount = 0;
            results.forEach(r => {
              r.country = country || searchContinent || '';
              r.city = searchCity || r.city || '';
              if (!allResults.find(e => e.google_place_id === r.google_place_id) && !existingIds.has(r.google_place_id)) {
                allResults.push(r);
                chunkCount++;
              }
            });

            // Save this chunk
            const chunkCost = skipDetails
              ? COST_EUR.GOOGLE_TEXT_SEARCH
              : COST_EUR.GOOGLE_TEXT_SEARCH + chunkCount * COST_EUR.GOOGLE_WEBSITE_CHECK;
            if (userId) {
              await supabase.from('search_chunks' as any).insert({
                user_id: userId,
                continent: searchContinent || null,
                country: country || null,
                city: searchCity || null,
                business_type: type,
                results_count: chunkCount,
                mode: skipDetails ? 'eco' : 'standard',
                cost_eur: chunkCost,
              } as any);
            }
          } catch (e: any) {
            console.warn(`Search failed for ${type} in ${country}:`, e.message);
          }
        }
      }

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
      const mode = skipDetails ? ' (mode éco)' : '';
      const countriesInfo = countries.length > 1 ? ` dans ${countries.length} pays` : '';
      const skippedInfo = skippedChunks > 0 ? ` (${skippedChunks} chunks déjà faits, ignorés)` : '';
      if (skippedChunks === totalSearches) {
        toast.warning('Toutes ces recherches ont déjà été effectuées ! Change de localisation ou de type pour trouver de nouveaux prospects.', { id: 'search-progress', duration: 5000 });
      } else {
        toast.success(allResults.length + ' nouveaux résultats' + mode + countriesInfo + skippedInfo, { id: 'search-progress' });
      }
      const actualSearches = totalSearches - skippedChunks;
      const gCost = skipDetails
        ? actualSearches * COST_EUR.GOOGLE_TEXT_SEARCH
        : actualSearches * COST_EUR.GOOGLE_TEXT_SEARCH + allResults.length * COST_EUR.GOOGLE_WEBSITE_CHECK + (fetchPhone ? Math.round(allResults.length * 0.4) * COST_EUR.GOOGLE_PHONE_DETAIL : 0);
      if (userId && actualSearches > 0) logOperation(userId, 'google_search', `Recherche ${skipDetails ? 'éco' : 'standard'}: ${types.join(', ')}${countriesInfo}${skippedInfo}`, gCost, allResults.length, { mode: skipDetails ? 'eco' : 'standard', types, countries, fetchPhone, resultCount: allResults.length, skippedChunks });
      fetchChunks();
    } catch (e: any) { toast.error(e.message || 'Erreur'); }
    finally { setSearching(false); }
  };

  const findProspectInfo = async () => {
    const targets = selectedIds.size > 0
      ? prospects.filter(p => selectedIds.has(p.id) && (!p.website_url || !p.phone))
      : prospects.filter(p => !p.website_url || !p.phone);
    if (!targets.length) { toast.info('Tous les prospects selectionnés ont déjà site + téléphone'); return; }
    setFindingInfo(true);
    toast.info(`Recherche IA site web + téléphone pour ${targets.length} prospect(s)...`);
    try {
      const { data, error } = await supabase.functions.invoke('find-prospect-info', {
        body: { prospects: targets.map(p => ({ id: p.id, business_name: p.business_name, business_type: p.business_type, city: p.city, country: p.country, address: p.address })) }
      });
      if (error) throw new Error(error.message);
      const results = data.results || [];
      let foundWeb = 0, foundPhone = 0;
      for (const r of results) {
        const updates: any = {};
        if (r.website_url) { updates.website_url = r.website_url; updates.has_website = true; foundWeb++; }
        if (r.phone) { updates.phone = r.phone; foundPhone++; }
        if (Object.keys(updates).length) {
          await supabase.from('prospects').update(updates).eq('id', r.id);
        }
      }
      toast.success(`${foundWeb} site(s) et ${foundPhone} téléphone(s) trouvés sur ${targets.length} prospects`);
      if (userId) logOperation(userId, 'ai_info_find', `Recherche IA site+tel: ${targets.length} prospects`, targets.length * COST_EUR.AI_INFO_FIND, targets.length, { foundWeb, foundPhone });
      fetchProspects();
    } catch (e: any) { toast.error(e.message || 'Erreur recherche info'); }
    finally { setFindingInfo(false); }
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

  const transferToClients = async () => {
    const selected = prospects.filter(p => selectedIds.has(p.id));
    if (!selected.length) { toast.error('Sélectionne au moins un prospect'); return; }
    setTransferring(true);
    let transferred = 0;
    const newClientIds: string[] = [];
    for (const p of selected) {
      const { data: newClient, error } = await supabase.from('clients').insert({
        prospect_id: p.id,
        business_name: p.business_name,
        contact_name: p.contact_name,
        email: p.email,
        phone: p.phone,
        website_url: p.website_url,
      }).select('id').single();
      if (!error && newClient) {
        await supabase.from('prospects').update({ status: 'converted' as ProspectStatus }).eq('id', p.id);
        transferred++;
        newClientIds.push(newClient.id);
      }
    }
    setTransferring(false);
    if (transferred > 0) {
      toast.success(`${transferred} prospect(s) transféré(s) vers Clients`);
      setSelectedIds(new Set());
      fetchProspects();
      // Offer to create a project for the first converted client
      if (newClientIds.length === 1) {
        const name = selected[0].business_name;
        if (confirm(`Créer un projet pour "${name}" ?`)) {
          navigate(`/admin/projects?newForClient=${newClientIds[0]}`);
        }
      }
    } else {
      toast.error('Erreur lors du transfert');
    }
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
      if (userId) logOperation(userId, 'ai_email_find', `Recherche IA emails: ${targets.length} prospects`, targets.length * COST_EUR.AI_EMAIL_FIND, targets.length, { found });
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
      if (userId) logOperation(userId, 'email_send', `Envoi ${data.sent} email(s)`, (data.sent || 0) * COST_EUR.AI_EMAIL_GEN, data.sent || 0, { sent: data.sent, failed: data.failed });
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
    const matchesScore = (p.score || 0) >= scoreMin;
    const matchesSector = sectorFilter.length === 0 || (p.sector && sectorFilter.includes(p.sector));
    const matchesTags = tagFilter.length === 0 || (p.tags && p.tags.some(t => tagFilter.includes(t)));
    const matchesSequence = sequenceFilter === 'all' || (sequenceFilter === 'in_sequence' ? !!p.sequence_id : !p.sequence_id);
    const matchesInteraction = !lastInteractionDays || (p.last_emailed_at && ((Date.now() - new Date(p.last_emailed_at).getTime()) / 86400000) <= lastInteractionDays);
    return matchesQuery && matchesWebsite && matchesScore && matchesSector && matchesTags && matchesSequence && matchesInteraction;
  });

  const prospectsNoSite = filteredProspects.filter(p => !p.has_website);
  const prospectsWithSite = filteredProspects.filter(p => p.has_website);

  const scoredProspects = prospects.filter(p => (p.score || 0) > 0);
  const avgScore = scoredProspects.length > 0 ? Math.round(scoredProspects.reduce((s, p) => s + (p.score || 0), 0) / scoredProspects.length) : 0;
  const inSequence = prospects.filter(p => p.sequence_id).length;
  const replied = prospects.filter(p => p.status === 'replied').length;
  const emailedTotal = prospects.filter(p => p.email_count > 0).length;
  const responseRate = emailedTotal > 0 ? Math.round((replied / emailedTotal) * 100) : 0;
  const now = new Date();
  const convertedThisMonth = prospects.filter(p => p.status === 'converted' && p.last_emailed_at && new Date(p.last_emailed_at).getMonth() === now.getMonth() && new Date(p.last_emailed_at).getFullYear() === now.getFullYear()).length;
  const stats = { total: prospects.length, noWebsite: prospects.filter(p => !p.has_website).length, withWebsite: prospects.filter(p => p.has_website).length, emailed: emailedTotal, converted: prospects.filter(p => p.status === 'converted').length, withEmail: prospects.filter(p => !!p.email).length, avgScore, inSequence, responseRate, convertedThisMonth };

  return (
    <div style={{ minHeight:'100vh', background:'var(--cream)' }}>
      <AdminHeader />
      <div style={{ maxWidth:1200, margin:'0 auto', padding:'16px' }}>

        {/* Stats — compact grid on mobile */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(110px, 1fr))', gap:8, marginBottom:16 }}>
          {[
            { label:'Total', value:stats.total, icon:Target },
            { label:'Score moyen', value:stats.avgScore, icon:Star },
            { label:'Taux réponse', value:`${stats.responseRate}%`, icon:Reply },
            { label:'Convertis (mois)', value:stats.convertedThisMonth, icon:ArrowRightLeft },
            { label:'En séquence', value:stats.inSequence, icon:Send },
            { label:'Sans site', value:stats.noWebsite, icon:GlobeLock },
          ].map(s => (
            <div key={s.label} style={{ padding:'10px 12px', background:'var(--glass-bg-strong)', border:'1px solid var(--glass-border)', borderRadius:16, display:'flex', alignItems:'center', gap:8 }}>
              <s.icon size={14} style={{ color:'var(--teal)', flexShrink:0 }}/>
              <div style={{ minWidth:0 }}>
                <div style={{ fontFamily:'var(--font-h)', fontSize:16, color:'var(--charcoal)', lineHeight:1.1 }}>{s.value}</div>
                <div style={{ fontFamily:'var(--font-b)', fontSize:9, color:'var(--text-light)', textTransform:'uppercase', letterSpacing:0.5, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        <div className='flex gap-2 mb-4'>
          <button onClick={() => setTab('prospects')} style={{ padding:'8px 16px', borderRadius:100, border:'none', fontFamily:'var(--font-b)', fontSize:12, fontWeight:600, cursor:'pointer', background:tab==='prospects'?'var(--teal)':'var(--glass-bg)', color:tab==='prospects'?'#fff':'var(--text-mid)' }}>
            Prospects
          </button>
          <button onClick={() => setTab('search')} style={{ padding:'8px 16px', borderRadius:100, border:'none', fontFamily:'var(--font-b)', fontSize:12, fontWeight:600, cursor:'pointer', background:tab==='search'?'var(--teal)':'var(--glass-bg)', color:tab==='search'?'#fff':'var(--text-mid)', display:'flex', alignItems:'center', gap:4 }}>
            <Search size={12}/> Chercher
          </button>
          <button onClick={() => setShowSectors(true)} style={{ padding:'8px 16px', borderRadius:100, border:'none', fontFamily:'var(--font-b)', fontSize:12, fontWeight:600, cursor:'pointer', background:'var(--glass-bg)', color:'var(--text-mid)', display:'flex', alignItems:'center', gap:4 }}>
            📊 Secteurs
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
                  <div className='flex items-center gap-3 flex-wrap'>
                    <div className='flex items-center gap-2' style={{ padding:'10px 14px', background:'var(--glass-bg)', border:'1px solid var(--glass-border)', borderRadius:'var(--r)', flex:'0 0 auto' }}>
                      <label style={{ fontFamily:'var(--font-b)', fontSize:12, color:'var(--text-light)', whiteSpace:'nowrap' }}>Max resultats:</label>
                      <input type='number' min={5} max={60} value={maxResults} onChange={e => setMaxResults(Number(e.target.value))} style={{ width:60, background:'transparent', border:'none', outline:'none', fontFamily:'var(--font-b)', fontSize:14, color:'var(--text)', textAlign:'center' }} />
                    </div>
                    <button onClick={() => setFetchPhone(!fetchPhone)} style={{ padding:'10px 14px', background: fetchPhone ? 'rgba(13,138,111,0.12)' : 'var(--glass-bg)', border:'1px solid', borderColor: fetchPhone ? 'var(--teal)' : 'var(--glass-border)', borderRadius:'var(--r)', fontFamily:'var(--font-b)', fontSize:12, fontWeight: fetchPhone ? 600 : 400, cursor:'pointer', display:'flex', alignItems:'center', gap:6, color: fetchPhone ? 'var(--teal)' : 'var(--text-mid)', flex:'0 0 auto' }}>
                      <Phone size={13}/> {fetchPhone ? '✓ Avec téléphone' : 'Sans téléphone'}
                      <span style={{ fontSize:10, opacity:0.7 }}>{fetchPhone ? '(+$0.02/prospect)' : '(économique)'}</span>
                    </button>
                    <button onClick={() => handleSearch(false)} disabled={searching} style={{ padding:'10px 24px', background:'var(--teal)', color:'#fff', border:'none', borderRadius:'var(--r)', fontFamily:'var(--font-b)', fontSize:14, fontWeight:600, cursor:searching?'not-allowed':'pointer', display:'flex', alignItems:'center', gap:6, opacity:searching?0.7:1, whiteSpace:'nowrap', flex:'0 0 auto' }}>
                      {searching ? <Loader2 size={14} className='animate-spin'/> : <Search size={14}/>}
                      {searching ? 'Recherche...' : 'Chercher (standard)'}
                    </button>
                    <button onClick={() => handleSearch(true)} disabled={searching} style={{ padding:'10px 24px', background:'#d4a55a', color:'#fff', border:'none', borderRadius:'var(--r)', fontFamily:'var(--font-b)', fontSize:14, fontWeight:600, cursor:searching?'not-allowed':'pointer', display:'flex', alignItems:'center', gap:6, opacity:searching?0.7:1, whiteSpace:'nowrap', flex:'0 0 auto' }}>
                      {searching ? <Loader2 size={14} className='animate-spin'/> : <Sparkles size={14}/>}
                      {searching ? 'Recherche...' : 'Chercher éco (IA)'}
                      <span style={{ fontSize:10, opacity:0.8 }}>~$1.60/1000</span>
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

            {/* Coverage Summary */}
            {searchChunks.length > 0 && (
              <div style={{ background:'var(--glass-bg-strong)', border:'1px solid var(--glass-border)', borderRadius:'var(--r-xl)', padding:20 }}>
                <div className='flex items-center gap-2 mb-4'>
                  <MapPin size={16} style={{ color:'var(--teal)' }}/>
                  <h4 style={{ fontFamily:'var(--font-h)', fontSize:15, color:'var(--charcoal)', margin:0 }}>Couverture par continent</h4>
                </div>
                <div className='flex flex-col gap-3'>
                  {Object.entries(CONTINENTS).map(([continent, countries]) => {
                    const coveredCountries = new Set(searchChunks.filter(c => countries.includes(c.country || '')).map(c => c.country));
                    const covered = coveredCountries.size;
                    const total = countries.length;
                    const pct = total > 0 ? Math.round((covered / total) * 100) : 0;
                    const totalResults = searchChunks.filter(c => countries.includes(c.country || '')).reduce((s, c) => s + c.results_count, 0);
                    if (covered === 0) return null;
                    return (
                      <div key={continent}>
                        <div className='flex items-center justify-between mb-1'>
                          <span style={{ fontFamily:'var(--font-b)', fontSize:13, color:'var(--charcoal)', fontWeight:600 }}>{continent}</span>
                          <span style={{ fontFamily:'var(--font-b)', fontSize:12, color:'var(--text-mid)' }}>{covered}/{total} pays · {totalResults} prospects</span>
                        </div>
                        <div style={{ height:8, background:'var(--glass-bg)', borderRadius:99, overflow:'hidden' }}>
                          <div style={{ height:'100%', width:`${pct}%`, background: pct === 100 ? 'var(--teal)' : 'linear-gradient(90deg, var(--teal), #4da6d9)', borderRadius:99, transition:'width 0.5s ease' }}/>
                        </div>
                        <div className='flex flex-wrap gap-1 mt-1'>
                          {countries.map(c => {
                            const done = coveredCountries.has(c);
                            return <span key={c} style={{ padding:'1px 6px', borderRadius:'var(--pill)', fontSize:10, fontFamily:'var(--font-b)', background: done ? 'rgba(13,138,111,0.12)' : 'transparent', color: done ? 'var(--teal)' : 'var(--text-ghost)', fontWeight: done ? 600 : 400 }}>{done ? '✓ ' : ''}{c}</span>;
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Chunk History */}
            <div style={{ background:'var(--glass-bg-strong)', border:'1px solid var(--glass-border)', borderRadius:'var(--r-xl)', padding:20 }}>
              <button onClick={() => setShowChunkHistory(!showChunkHistory)} className='flex items-center justify-between w-full' style={{ background:'none', border:'none', cursor:'pointer', padding:0 }}>
                <div className='flex items-center gap-2'>
                  <History size={16} style={{ color:'var(--teal)' }}/>
                  <h4 style={{ fontFamily:'var(--font-h)', fontSize:15, color:'var(--charcoal)', margin:0 }}>Historique des recherches</h4>
                  <span style={{ padding:'2px 10px', borderRadius:'var(--pill)', background:'rgba(13,138,111,0.1)', color:'var(--teal)', fontFamily:'var(--font-b)', fontSize:12, fontWeight:600 }}>{searchChunks.length} chunks</span>
                </div>
                <span style={{ fontFamily:'var(--font-b)', fontSize:12, color:'var(--text-light)' }}>{showChunkHistory ? '▲ Masquer' : '▼ Voir'}</span>
              </button>
              {showChunkHistory && searchChunks.length > 0 && (
                <div style={{ marginTop:16, display:'flex', flexDirection:'column', gap:6 }}>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr auto auto auto auto', gap:8, padding:'8px 12px', fontFamily:'var(--font-b)', fontSize:11, color:'var(--text-light)', textTransform:'uppercase', letterSpacing:1, fontWeight:600 }}>
                    <span>Type</span><span>Pays</span><span>Ville</span><span>Résultats</span><span>Mode</span><span>Date</span><span></span>
                  </div>
                  {searchChunks.map(c => (
                    <div key={c.id} style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr auto auto auto auto', gap:8, padding:'8px 12px', background:'var(--glass-bg)', borderRadius:'var(--r)', border:'1px solid var(--glass-border)', alignItems:'center' }}>
                      <span style={{ fontFamily:'var(--font-b)', fontSize:13, color:'var(--charcoal)', fontWeight:600 }}>{c.business_type}</span>
                      <span style={{ fontFamily:'var(--font-b)', fontSize:13, color:'var(--text-mid)' }}>{c.country || '—'}</span>
                      <span style={{ fontFamily:'var(--font-b)', fontSize:13, color:'var(--text-mid)' }}>{c.city || '—'}</span>
                      <span style={{ fontFamily:'var(--font-b)', fontSize:12, color:'var(--teal)', fontWeight:600, textAlign:'center', minWidth:40 }}>{c.results_count}</span>
                      <span style={{ padding:'2px 8px', borderRadius:'var(--pill)', background: c.mode === 'eco' ? 'rgba(212,165,90,0.15)' : 'rgba(13,138,111,0.1)', color: c.mode === 'eco' ? '#d4a55a' : 'var(--teal)', fontFamily:'var(--font-b)', fontSize:11, fontWeight:600, textAlign:'center' }}>{c.mode === 'eco' ? '⚡ Éco' : '🔍 Std'}</span>
                      <span style={{ fontFamily:'var(--font-b)', fontSize:11, color:'var(--text-light)', whiteSpace:'nowrap' }}>{new Date(c.created_at).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}</span>
                      <button onClick={async () => { await supabase.from('search_chunks' as any).delete().eq('id', c.id); fetchChunks(); toast.success('Chunk réinitialisé — tu peux relancer cette recherche'); }} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-ghost)', padding:4 }} title='Supprimer ce chunk pour relancer la recherche'><RefreshCw size={13}/></button>
                    </div>
                  ))}
                  <div style={{ padding:'10px 12px', background:'rgba(13,138,111,0.04)', borderRadius:'var(--r)', fontFamily:'var(--font-b)', fontSize:12, color:'var(--text-mid)', display:'flex', justifyContent:'space-between' }}>
                    <span>Total: {searchChunks.reduce((s, c) => s + c.results_count, 0)} prospects trouvés en {searchChunks.length} recherches</span>
                    <span style={{ color:'var(--teal)', fontWeight:600 }}>{searchChunks.reduce((s, c) => s + Number(c.cost_eur), 0).toFixed(3)}€</span>
                  </div>
                </div>
              )}
              {showChunkHistory && searchChunks.length === 0 && (
                <p style={{ marginTop:12, fontFamily:'var(--font-b)', fontSize:13, color:'var(--text-light)' }}>Aucune recherche effectuée pour le moment.</p>
              )}
            </div>
          </div>
        )}

        {tab === 'prospects' && (
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div className='flex flex-col gap-2'>
              <div className='flex items-center gap-2' style={{ padding:'8px 12px', background:'var(--glass-bg)', borderRadius:16, border:'1px solid var(--glass-border)' }}>
                <Search size={14} style={{ color:'var(--text-light)', flexShrink:0 }} />
                <input placeholder='Rechercher...' value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ flex:1, background:'transparent', border:'none', outline:'none', fontFamily:'var(--font-b)', fontSize:13, color:'var(--text)' }} />
              </div>
              <div className='flex gap-2'>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ flex:1, padding:'8px 10px', background:'var(--glass-bg)', border:'1px solid var(--glass-border)', borderRadius:16, fontFamily:'var(--font-b)', fontSize:12, color:'var(--text)', cursor:'pointer', outline:'none' }}>
                  <option value='all'>Tous statuts</option>
                  {Object.entries(SL).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <select value={websiteFilter} onChange={e => setWebsiteFilter(e.target.value as any)} style={{ flex:1, padding:'8px 10px', background:'var(--glass-bg)', border:'1px solid var(--glass-border)', borderRadius:16, fontFamily:'var(--font-b)', fontSize:12, color:'var(--text)', cursor:'pointer', outline:'none' }}>
                  <option value='all'>Tous (site)</option>
                  <option value='no_website'>🔒 Sans site</option>
                  <option value='has_website'>🌐 Avec site</option>
                </select>
                <button onClick={() => setShowManualAdd(true)} style={{ padding:'8px 12px', background:'var(--glass-bg-strong)', color:'var(--text-mid)', border:'1px solid var(--glass-border)', borderRadius:16, cursor:'pointer', flexShrink:0 }}>
                  <Plus size={14}/>
                </button>
                <button onClick={fetchProspects} style={{ padding:'8px 12px', background:'var(--glass-bg-strong)', color:'var(--text-mid)', border:'1px solid var(--glass-border)', borderRadius:16, cursor:'pointer', flexShrink:0 }}>
                  <RefreshCw size={14}/>
                </button>
              </div>
              {/* Advanced filters toggle + saved searches */}
              <div className='flex gap-2 items-center'>
                <button onClick={() => setShowAdvancedFilters(!showAdvancedFilters)} style={{ padding:'6px 12px', borderRadius:100, border:'1px solid var(--glass-border)', background: showAdvancedFilters ? 'rgba(13,138,111,0.1)' : 'var(--glass-bg)', color: showAdvancedFilters ? 'var(--teal)' : 'var(--text-mid)', fontFamily:'var(--font-b)', fontSize:11, cursor:'pointer', display:'flex', alignItems:'center', gap:4 }}>
                  <Target size={11}/> Filtres avancés {showAdvancedFilters ? '▲' : '▼'}
                </button>
                <button onClick={saveSearch} disabled={savingSearch} style={{ padding:'6px 12px', borderRadius:100, border:'1px solid var(--glass-border)', background:'var(--glass-bg)', color:'var(--text-mid)', fontFamily:'var(--font-b)', fontSize:11, cursor:'pointer' }}>
                  💾 Sauvegarder
                </button>
                {savedSearches.length > 0 && (
                  <select onChange={e => { const s = savedSearches.find(x => x.id === e.target.value); if (s) loadSearch(s); }} defaultValue='' style={{ padding:'6px 10px', borderRadius:100, border:'1px solid var(--glass-border)', background:'var(--glass-bg)', fontFamily:'var(--font-b)', fontSize:11, color:'var(--text-mid)', cursor:'pointer', outline:'none' }}>
                    <option value='' disabled>📂 Recherches sauvées</option>
                    {savedSearches.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                )}
              </div>
              {showAdvancedFilters && (
                <div style={{ padding:12, background:'var(--glass-bg)', border:'1px solid var(--glass-border)', borderRadius:16, display:'flex', flexDirection:'column', gap:10 }}>
                  <div className='flex items-center gap-3 flex-wrap'>
                    <div style={{ flex:'1 1 200px' }}>
                      <label style={{ fontFamily:'var(--font-b)', fontSize:10, color:'var(--text-light)', textTransform:'uppercase', letterSpacing:0.5, display:'block', marginBottom:4 }}>Score minimum: {scoreMin}</label>
                      <input type='range' min={0} max={100} value={scoreMin} onChange={e => setScoreMin(Number(e.target.value))} style={{ width:'100%', accentColor:'var(--teal)' }} />
                    </div>
                    <div style={{ flex:'1 1 150px' }}>
                      <label style={{ fontFamily:'var(--font-b)', fontSize:10, color:'var(--text-light)', textTransform:'uppercase', letterSpacing:0.5, display:'block', marginBottom:4 }}>Séquence</label>
                      <select value={sequenceFilter} onChange={e => setSequenceFilter(e.target.value as any)} style={{ width:'100%', padding:'6px 8px', background:'white', border:'1px solid var(--glass-border)', borderRadius:8, fontFamily:'var(--font-b)', fontSize:12, outline:'none' }}>
                        <option value='all'>Toutes</option>
                        <option value='in_sequence'>En séquence</option>
                        <option value='not_in_sequence'>Hors séquence</option>
                      </select>
                    </div>
                    <div style={{ flex:'1 1 150px' }}>
                      <label style={{ fontFamily:'var(--font-b)', fontSize:10, color:'var(--text-light)', textTransform:'uppercase', letterSpacing:0.5, display:'block', marginBottom:4 }}>Dernière interaction (jours)</label>
                      <select value={lastInteractionDays ?? ''} onChange={e => setLastInteractionDays(e.target.value ? Number(e.target.value) : null)} style={{ width:'100%', padding:'6px 8px', background:'white', border:'1px solid var(--glass-border)', borderRadius:8, fontFamily:'var(--font-b)', fontSize:12, outline:'none' }}>
                        <option value=''>Toutes</option>
                        <option value='7'>7 jours</option>
                        <option value='30'>30 jours</option>
                        <option value='90'>90 jours</option>
                      </select>
                    </div>
                  </div>
                  {allSectors.length > 0 && (
                    <div>
                      <label style={{ fontFamily:'var(--font-b)', fontSize:10, color:'var(--text-light)', textTransform:'uppercase', letterSpacing:0.5, display:'block', marginBottom:4 }}>Secteurs</label>
                      <div className='flex flex-wrap gap-1'>
                        {allSectors.map(s => (
                          <button key={s} onClick={() => setSectorFilter(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])} style={{ padding:'3px 10px', borderRadius:100, border:'1px solid', borderColor: sectorFilter.includes(s) ? 'var(--teal)' : 'var(--glass-border)', background: sectorFilter.includes(s) ? 'rgba(13,138,111,0.1)' : 'transparent', color: sectorFilter.includes(s) ? 'var(--teal)' : 'var(--text-mid)', fontFamily:'var(--font-b)', fontSize:11, cursor:'pointer' }}>{s}</button>
                        ))}
                      </div>
                    </div>
                  )}
                  {allTags.length > 0 && (
                    <div>
                      <label style={{ fontFamily:'var(--font-b)', fontSize:10, color:'var(--text-light)', textTransform:'uppercase', letterSpacing:0.5, display:'block', marginBottom:4 }}>Tags</label>
                      <div className='flex flex-wrap gap-1'>
                        {allTags.map(t => (
                          <button key={t} onClick={() => setTagFilter(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])} style={{ padding:'3px 10px', borderRadius:100, border:'1px solid', borderColor: tagFilter.includes(t) ? 'var(--violet)' : 'var(--glass-border)', background: tagFilter.includes(t) ? 'rgba(124,92,191,0.1)' : 'transparent', color: tagFilter.includes(t) ? 'var(--violet)' : 'var(--text-mid)', fontFamily:'var(--font-b)', fontSize:11, cursor:'pointer' }}>{t}</button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            {/* AI Email Finder bar */}
            <div style={{ padding:'10px 14px', background:'rgba(212,165,90,0.08)', border:'1px solid rgba(212,165,90,0.3)', borderRadius:16, display:'flex', flexWrap:'wrap', alignItems:'center', justifyContent:'space-between', gap:8 }}>
              <span style={{ fontFamily:'var(--font-b)', fontSize:12, color:'var(--text-mid)', display:'flex', alignItems:'center', gap:4 }}>
                <Sparkles size={13} style={{ color:'#d4a55a' }}/>
                {stats.withEmail} / {stats.total} ont un email
              </span>
              <button onClick={findEmails} disabled={findingEmails} style={{ padding:'6px 14px', background:'#d4a55a', color:'#fff', border:'none', borderRadius:100, fontFamily:'var(--font-b)', fontSize:11, fontWeight:600, cursor:findingEmails?'not-allowed':'pointer', display:'flex', alignItems:'center', gap:4, opacity:findingEmails?0.7:1, whiteSpace:'nowrap' }}>
                {findingEmails ? <Loader2 size={12} className='animate-spin'/> : <Sparkles size={12}/>}
                {findingEmails ? 'Recherche...' : selectedIds.size > 0 ? `Trouver emails (${selectedIds.size} sel.)` : 'Trouver emails IA'}
              </button>
            </div>
            {/* AI Info Finder bar */}
            <div style={{ padding:'10px 14px', background:'rgba(124,92,191,0.08)', border:'1px solid rgba(124,92,191,0.3)', borderRadius:16, display:'flex', flexWrap:'wrap', alignItems:'center', justifyContent:'space-between', gap:8 }}>
              <span style={{ fontFamily:'var(--font-b)', fontSize:12, color:'var(--text-mid)', display:'flex', alignItems:'center', gap:4 }}>
                <Globe size={13} style={{ color:'#7c5cbf' }}/>
                {prospects.filter(p => p.website_url).length} / {prospects.length} ont un site — {prospects.filter(p => p.phone).length} / {prospects.length} ont un tel
              </span>
              <button onClick={findProspectInfo} disabled={findingInfo} style={{ padding:'6px 14px', background:'#7c5cbf', color:'#fff', border:'none', borderRadius:100, fontFamily:'var(--font-b)', fontSize:11, fontWeight:600, cursor:findingInfo?'not-allowed':'pointer', display:'flex', alignItems:'center', gap:4, opacity:findingInfo?0.7:1, whiteSpace:'nowrap' }}>
                {findingInfo ? <Loader2 size={12} className='animate-spin'/> : <Sparkles size={12}/>}
                {findingInfo ? 'Recherche...' : selectedIds.size > 0 ? `Trouver site+tel IA (${selectedIds.size} sel.)` : 'Trouver site+tel IA'}
              </button>
            </div>
            {/* AI Scoring bar */}
            <div style={{ padding:'10px 14px', background:'rgba(59,130,246,0.08)', border:'1px solid rgba(59,130,246,0.3)', borderRadius:16, display:'flex', flexWrap:'wrap', alignItems:'center', justifyContent:'space-between', gap:8 }}>
              <span style={{ fontFamily:'var(--font-b)', fontSize:12, color:'var(--text-mid)', display:'flex', alignItems:'center', gap:4 }}>
                <Target size={13} style={{ color:'#3B82F6' }}/>
                {prospects.filter(p => (p.score || 0) > 0).length} / {prospects.length} scorés — Moy. {prospects.length > 0 ? Math.round(prospects.reduce((s, p) => s + (p.score || 0), 0) / Math.max(1, prospects.filter(p => (p.score || 0) > 0).length)) : 0}
              </span>
              <button onClick={scoreProspects} disabled={scoring} style={{ padding:'6px 14px', background:'#3B82F6', color:'#fff', border:'none', borderRadius:100, fontFamily:'var(--font-b)', fontSize:11, fontWeight:600, cursor:scoring?'not-allowed':'pointer', display:'flex', alignItems:'center', gap:4, opacity:scoring?0.7:1, whiteSpace:'nowrap' }}>
                {scoring ? <Loader2 size={12} className='animate-spin'/> : <Target size={12}/>}
                {scoring ? 'Scoring...' : selectedIds.size > 0 ? `Scorer IA (${selectedIds.size} sel.)` : 'Scorer tous IA'}
              </button>
            </div>
            {selectedIds.size > 0 && (
              <div style={{ padding:'10px 14px', background:'rgba(13,138,111,0.08)', border:'1px solid rgba(13,138,111,0.3)', borderRadius:16, display:'flex', flexWrap:'wrap', alignItems:'center', gap:8 }}>
                <span style={{ fontFamily:'var(--font-b)', fontSize:13, color:'var(--teal)', fontWeight:600, marginRight:'auto' }}>{selectedIds.size} prospect(s) sélectionné(s)</span>
                <button onClick={() => setSelectedIds(new Set())} style={{ padding:'6px 12px', background:'transparent', border:'1px solid var(--glass-border)', borderRadius:100, fontFamily:'var(--font-b)', fontSize:11, color:'var(--text-mid)', cursor:'pointer' }}>Désélectionner</button>
                <button onClick={deleteSelected} style={{ padding:'6px 12px', background:'#e8735a', color:'#fff', border:'none', borderRadius:100, fontFamily:'var(--font-b)', fontSize:11, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:4 }}>
                  <Trash2 size={12}/> Supprimer ({selectedIds.size})
                </button>
                <button onClick={openEmailModal} style={{ padding:'6px 12px', background:'var(--teal)', color:'#fff', border:'none', borderRadius:100, fontFamily:'var(--font-b)', fontSize:11, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:4 }}>
                  <Mail size={12}/> Emails IA
                </button>
                <button onClick={transferToClients} disabled={transferring} style={{ padding:'6px 12px', background:'var(--violet)', color:'#fff', border:'none', borderRadius:100, fontFamily:'var(--font-b)', fontSize:11, fontWeight:600, cursor:transferring?'not-allowed':'pointer', display:'flex', alignItems:'center', gap:4, opacity:transferring?0.7:1 }}>
                  {transferring ? <Loader2 size={12} className='animate-spin'/> : <ArrowRightLeft size={12}/>} Vers Clients
                </button>
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
                    <ProspectTable prospects={prospectsNoSite} selectedIds={selectedIds} onToggleSelect={toggleSelect} onToggleSelectAll={() => { const ids = prospectsNoSite.map(p=>p.id); const all = ids.every(id=>selectedIds.has(id)); setSelectedIds(prev => { const n = new Set(prev); ids.forEach(id => all ? n.delete(id) : n.add(id)); return n; }); }} onDelete={deleteProspect} onUpdateEmail={updateEmail} onUpdateStatus={updateStatus} onViewDetail={setDetailProspect} />
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
                    <ProspectTable prospects={prospectsWithSite} selectedIds={selectedIds} onToggleSelect={toggleSelect} onToggleSelectAll={() => { const ids = prospectsWithSite.map(p=>p.id); const all = ids.every(id=>selectedIds.has(id)); setSelectedIds(prev => { const n = new Set(prev); ids.forEach(id => all ? n.delete(id) : n.add(id)); return n; }); }} onDelete={deleteProspect} onUpdateEmail={updateEmail} onUpdateStatus={updateStatus} onViewDetail={setDetailProspect} />
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

      {/* Prospect Detail Modal - Enriched */}
      {detailProspect && (
        <ProspectDetailEnriched
          prospect={detailProspect}
          onClose={() => setDetailProspect(null)}
          onTransfer={() => {
            setSelectedIds(new Set([detailProspect.id]));
            setDetailProspect(null);
            transferToClients();
          }}
          onRefresh={() => { fetchProspects(); }}
        />
      )}

      {/* Sectors Dashboard */}
      {showSectors && <SectorsDashboard onClose={() => setShowSectors(false)} />}
    </div>
  );
};

const ProspectTable = ({ prospects, selectedIds, onToggleSelect, onToggleSelectAll, onDelete, onUpdateEmail, onUpdateStatus, onViewDetail }: {
  prospects: Prospect[]; selectedIds: Set<string>;
  onToggleSelect: (id: string) => void; onToggleSelectAll: () => void;
  onDelete: (id: string) => void; onUpdateEmail: (id: string, email: string) => void;
  onUpdateStatus: (id: string, status: ProspectStatus) => void;
  onViewDetail: (p: Prospect) => void;
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
        <tbody>{prospects.map(p => <ProspectRow key={p.id} prospect={p} selected={selectedIds.has(p.id)} onToggle={() => onToggleSelect(p.id)} onDelete={() => onDelete(p.id)} onUpdateEmail={email => onUpdateEmail(p.id, email)} onUpdateStatus={status => onUpdateStatus(p.id, status)} onViewDetail={() => onViewDetail(p)} />)}</tbody>
      </table>
    </div>
    <div className='md:hidden flex flex-col'>
      {prospects.map(p => (
        <div key={p.id} className='flex items-start gap-3 p-4' style={{ borderBottom:'1px solid rgba(0,0,0,0.04)', cursor:'pointer' }} onClick={() => onViewDetail(p)}>
          <button onClick={(e) => { e.stopPropagation(); onToggleSelect(p.id); }} style={{ background:'none', border:'none', cursor:'pointer', marginTop:2 }}>
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

const ProspectRow = ({ prospect: p, selected, onToggle, onDelete, onUpdateEmail, onUpdateStatus, onViewDetail }: {
  prospect: Prospect; selected: boolean;
  onToggle: () => void; onDelete: () => void;
  onUpdateEmail: (email: string) => void;
  onUpdateStatus: (status: ProspectStatus) => void;
  onViewDetail: () => void;
}) => {
  const [editingEmail, setEditingEmail] = useState(false);
  const [emailVal, setEmailVal] = useState(p.email || '');
  return (
    <tr style={{ borderBottom:'1px solid rgba(0,0,0,0.04)', background:selected?'rgba(13,138,111,0.04)':'transparent', cursor:'pointer' }} onClick={onViewDetail}>
      <td className='px-4 py-3'>
        <button onClick={(e) => { e.stopPropagation(); onToggle(); }} style={{ background:'none', border:'none', cursor:'pointer' }}>
          {selected ? <CheckSquare size={16} style={{ color:'var(--teal)' }}/> : <Square size={16} style={{ color:'var(--text-ghost)' }}/>}
        </button>
      </td>
      <td className='px-4 py-3'>
        <div className='flex items-center gap-2'>
          <div style={{ fontWeight:600, color:'var(--charcoal)', fontSize:14 }}>{p.business_name}</div>
          {(p.score || 0) > 0 && <span style={{ padding:'1px 6px', borderRadius:'var(--pill)', fontSize:10, fontWeight:700, fontFamily:'var(--font-b)', background: (p.score || 0) > 60 ? 'rgba(16,185,129,0.15)' : (p.score || 0) > 30 ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)', color: (p.score || 0) > 60 ? '#10B981' : (p.score || 0) > 30 ? '#F59E0B' : '#EF4444' }}>{p.score}</span>}
        </div>
        <div className='flex items-center gap-1'>
          {p.business_type && <span style={{ fontSize:11, color:'var(--text-light)' }}>{p.business_type}</span>}
          {p.sector && p.sector !== p.business_type && <span style={{ fontSize:10, color:'var(--teal)', fontWeight:600 }}>• {p.sector}</span>}
        </div>
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
            <button onClick={(e) => { e.stopPropagation(); setEditingEmail(true); }} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-ghost)', opacity:0.6 }}><Pencil size={11}/></button>
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
        <select value={p.status} onClick={e => e.stopPropagation()} onChange={e => { e.stopPropagation(); onUpdateStatus(e.target.value as ProspectStatus); }} style={{ padding:'4px 8px', borderRadius:'var(--pill)', border:'none', background:SC[p.status]+'18', color:SC[p.status], fontWeight:600, fontSize:12, fontFamily:'var(--font-m)', cursor:'pointer' }}>
          {Object.entries(SL).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </td>
      <td className='px-4 py-3' style={{ fontSize:12, color:'var(--text-light)' }}>{p.email_count}x</td>
      <td className='px-4 py-3'>
        <button onClick={(e) => { e.stopPropagation(); onDelete(); }} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-ghost)' }}><Trash2 size={14}/></button>
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
