import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Extract emails from HTML/text content using regex
function extractEmails(text: string): string[] {
  const emailRegex = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
  const matches = text.match(emailRegex) || [];
  // Deduplicate and filter out common fake/placeholder emails
  const excluded = ['example.com', 'domain.com', 'email.com', 'test.com', 'sentry.io', 'wixpress.com', 'w3.org'];
  const unique = [...new Set(matches.map(e => e.toLowerCase()))];
  return unique.filter(email => {
    const domain = email.split('@')[1];
    if (excluded.some(ex => domain?.includes(ex))) return false;
    // Filter out image/file extensions mistakenly caught
    if (/\.(png|jpg|jpeg|gif|svg|webp|css|js)$/i.test(email)) return false;
    return true;
  });
}

// Pick the best email from a list (prefer info@, contact@, hello@, then others)
function pickBestEmail(emails: string[]): { email: string; confidence: string } | null {
  if (emails.length === 0) return null;
  
  const priority = ['info@', 'contact@', 'hello@', 'bonjour@', 'mail@', 'office@', 'reception@', 'booking@', 'reserv'];
  for (const prefix of priority) {
    const match = emails.find(e => e.startsWith(prefix) || e.includes(prefix));
    if (match) return { email: match, confidence: 'high' };
  }
  
  // Avoid noreply, support, webmaster etc.
  const avoid = ['noreply', 'no-reply', 'webmaster', 'postmaster', 'admin@', 'root@', 'mailer-daemon'];
  const filtered = emails.filter(e => !avoid.some(a => e.includes(a)));
  
  if (filtered.length > 0) return { email: filtered[0], confidence: 'medium' };
  if (emails.length > 0) return { email: emails[0], confidence: 'low' };
  return null;
}

async function fetchWebsiteEmails(url: string): Promise<string[]> {
  try {
    // Normalize URL
    let fetchUrl = url;
    if (!fetchUrl.startsWith('http')) fetchUrl = 'https://' + fetchUrl;
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    
    const response = await fetch(fetchUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; EmailFinder/1.0)',
        'Accept': 'text/html,application/xhtml+xml',
      },
      redirect: 'follow',
    });
    clearTimeout(timeout);
    
    if (!response.ok) return [];
    
    const html = await response.text();
    const emails = extractEmails(html);
    
    // Also try /contact page if no emails found on homepage
    if (emails.length === 0) {
      try {
        const base = new URL(fetchUrl);
        const contactUrls = ['/contact', '/kontakt', '/contacto', '/contatti', '/επικοινωνία', '/nous-contacter'];
        
        for (const path of contactUrls) {
          try {
            const ctrl2 = new AbortController();
            const t2 = setTimeout(() => ctrl2.abort(), 5000);
            const resp2 = await fetch(base.origin + path, {
              signal: ctrl2.signal,
              headers: { 'User-Agent': 'Mozilla/5.0 (compatible; EmailFinder/1.0)', 'Accept': 'text/html' },
              redirect: 'follow',
            });
            clearTimeout(t2);
            if (resp2.ok) {
              const html2 = await resp2.text();
              const moreEmails = extractEmails(html2);
              if (moreEmails.length > 0) return moreEmails;
            }
          } catch { /* skip this path */ }
        }
      } catch { /* skip contact page search */ }
    }
    
    return emails;
  } catch (e) {
    console.error('Fetch error for', url, e);
    return [];
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { prospects } = await req.json();
    if (!prospects || !Array.isArray(prospects) || prospects.length === 0) {
      return new Response(JSON.stringify({ error: 'prospects array is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const results: Array<{ id: string; email: string | null; confidence: string }> = [];

    for (const prospect of prospects) {
      try {
        // Only search if prospect has a website
        if (!prospect.website_url) {
          results.push({ id: prospect.id, email: null, confidence: 'none' });
          continue;
        }

        const emails = await fetchWebsiteEmails(prospect.website_url);
        const best = pickBestEmail(emails);

        if (best) {
          results.push({ id: prospect.id, email: best.email, confidence: best.confidence });
        } else {
          results.push({ id: prospect.id, email: null, confidence: 'none' });
        }

        // Small delay between requests to be polite
        await new Promise(r => setTimeout(r, 300));
      } catch (e) {
        console.error('Error for prospect', prospect.id, e);
        results.push({ id: prospect.id, email: null, confidence: 'none' });
      }
    }

    return new Response(JSON.stringify({ results }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
