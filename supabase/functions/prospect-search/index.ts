import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// ── Email extraction helpers ──────────────────────────────
function extractEmails(text: string): string[] {
  const emailRegex = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
  const matches = text.match(emailRegex) || [];
  const excluded = ['example.com','domain.com','email.com','test.com','sentry.io','wixpress.com','w3.org','yourcompany.com','yourdomain.com','placeholder.com','wordpress.com','change.me'];
  const unique = [...new Set(matches.map(e => e.toLowerCase()))];
  return unique.filter(email => {
    const domain = email.split('@')[1];
    if (!domain) return false;
    if (excluded.some(ex => domain.includes(ex))) return false;
    if (/\.(png|jpg|jpeg|gif|svg|webp|css|js|woff|ttf|eot)$/i.test(email)) return false;
    if (email.length > 80) return false;
    return true;
  });
}

function pickBestEmail(emails: string[]): { email: string; confidence: string } | null {
  if (emails.length === 0) return null;
  const priority = ['info@','contact@','hello@','bonjour@','mail@','office@','reception@','booking@','reserv'];
  for (const prefix of priority) {
    const match = emails.find(e => e.startsWith(prefix) || e.includes(prefix));
    if (match) return { email: match, confidence: 'high' };
  }
  const avoid = ['noreply','no-reply','webmaster','postmaster','admin@','root@','mailer-daemon','unsubscribe','privacy','gdpr','abuse'];
  const filtered = emails.filter(e => !avoid.some(a => e.includes(a)));
  if (filtered.length > 0) return { email: filtered[0], confidence: 'medium' };
  return { email: emails[0], confidence: 'low' };
}

async function fetchWebsiteEmails(url: string): Promise<string[]> {
  try {
    let fetchUrl = url;
    if (!fetchUrl.startsWith('http')) fetchUrl = 'https://' + fetchUrl;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const response = await fetch(fetchUrl, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ProspectBot/1.0)', 'Accept': 'text/html' },
      redirect: 'follow',
    });
    clearTimeout(timeout);
    if (!response.ok) return [];
    const html = await response.text();
    const emails = extractEmails(html);
    if (emails.length === 0) {
      // Try /contact, /kontakt, /impressum pages
      const base = new URL(fetchUrl);
      for (const path of ['/contact','/kontakt','/impressum','/nous-contacter','/contatti']) {
        try {
          const c2 = new AbortController();
          const t2 = setTimeout(() => c2.abort(), 4000);
          const r2 = await fetch(base.origin + path, {
            signal: c2.signal,
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ProspectBot/1.0)', 'Accept': 'text/html' },
            redirect: 'follow',
          });
          clearTimeout(t2);
          if (r2.ok) {
            const h2 = await r2.text();
            const more = extractEmails(h2);
            if (more.length > 0) return more;
          }
        } catch { /* skip */ }
      }
    }
    return emails;
  } catch { return []; }
}

// ── Website validation ──────────────────────────────
async function validateWebsite(url: string): Promise<boolean> {
  try {
    let fetchUrl = url;
    if (!fetchUrl.startsWith('http')) fetchUrl = 'https://' + fetchUrl;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(fetchUrl, {
      method: 'HEAD',
      signal: controller.signal,
      redirect: 'follow',
    });
    clearTimeout(timeout);
    return response.ok || response.status === 405 || response.status === 403;
  } catch {
    return false;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const GOOGLE_MAPS_API_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY');
  if (!GOOGLE_MAPS_API_KEY) {
    return new Response(JSON.stringify({ error: 'GOOGLE_MAPS_API_KEY not configured' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { city, businessType, country = '', maxResults = 20, fetchPhone = false, skipDetails = false, fetchEmails = true } = await req.json();
    if (!businessType) {
      return new Response(JSON.stringify({ error: 'businessType is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const locationParts = [city, country].filter(Boolean);
    if (!locationParts.length) {
      return new Response(JSON.stringify({ error: 'At least city or country is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const query = encodeURIComponent(`${businessType} ${locationParts.join(' ')}`);
    const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query}&key=${GOOGLE_MAPS_API_KEY}`;
    let allPlaces: any[] = [];
    let nextPageToken: string | null = null;
    let pageCount = 0;
    const maxPages = Math.ceil(maxResults / 20);

    do {
      const pageUrl = nextPageToken
        ? `https://maps.googleapis.com/maps/api/place/textsearch/json?pagetoken=${nextPageToken}&key=${GOOGLE_MAPS_API_KEY}`
        : searchUrl;
      
      if (nextPageToken) {
        await new Promise(r => setTimeout(r, 2000));
      }

      const searchRes = await fetch(pageUrl);
      const searchData = await searchRes.json();

      if (searchData.status !== 'OK' && searchData.status !== 'ZERO_RESULTS') {
        if (allPlaces.length === 0) {
          return new Response(JSON.stringify({ error: `Google Places error: ${searchData.status}` }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        break;
      }

      allPlaces = allPlaces.concat(searchData.results || []);
      nextPageToken = searchData.next_page_token || null;
      pageCount++;
    } while (nextPageToken && allPlaces.length < maxResults && pageCount < maxPages);

    const places = allPlaces.slice(0, maxResults);

    const basicResults = places.map((place: any) => ({
      google_place_id: place.place_id,
      business_name: place.name,
      address: place.formatted_address,
      phone: null as string | null,
      has_website: false,
      website_url: null as string | null,
      rating: place.rating || null,
      review_count: place.user_ratings_total || 0,
      types: place.types || [],
      city: city || country, country, business_type: businessType, source: 'google_maps',
    }));

    // skipDetails mode: only Text Search, no Place Details calls at all
    if (skipDetails) {
      basicResults.sort((a, b) => (a.has_website ? 1 : 0) - (b.has_website ? 1 : 0));
      return new Response(JSON.stringify({ 
        results: basicResults, total: basicResults.length,
        costs: { textSearchCalls: pageCount, detailCalls: 0, phoneCalls: 0 }
      }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Standard mode: Place Details for website check + optional phone
    const detailsPromises = basicResults.map(async (result) => {
      try {
        // Fetch website + phone in a single call to save API costs
        const fields = fetchPhone ? 'website,formatted_phone_number' : 'website';
        const detailUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${result.google_place_id}&fields=${fields}&key=${GOOGLE_MAPS_API_KEY}`;
        const detailRes = await fetch(detailUrl);
        const detailData = await detailRes.json();
        const d = detailData.result || {};

        if (d.website) {
          // Validate website is actually reachable
          const isValid = await validateWebsite(d.website);
          if (isValid) {
            result.has_website = true;
            result.website_url = d.website;
            // Fetch email from website
            if (fetchEmails) {
              try {
                const emails = await fetchWebsiteEmails(d.website);
                const best = pickBestEmail(emails);
                if (best) {
                  result.email = best.email;
                  result.email_confidence = best.confidence;
                }
              } catch { /* email extraction failed, continue */ }
            }
          } else {
            console.warn('Website unreachable, marking as no website:', d.website);
            result.has_website = false;
            result.website_url = null;
          }
        }

        if (fetchPhone) {
          result.phone = d.formatted_phone_number || null;
        }
        return result;
      } catch {
        return result;
      }
    });

    const results = await Promise.all(detailsPromises);
    results.sort((a, b) => (a.has_website ? 1 : 0) - (b.has_website ? 1 : 0));

    const detailCalls = results.length;
    const phoneCalls = 0; // phone now included in single detail call
    const emailsFound = results.filter(r => r.email).length;

    return new Response(JSON.stringify({ 
      results, total: results.length,
      costs: { textSearchCalls: pageCount, detailCalls, phoneCalls, emailsFound }
    }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
