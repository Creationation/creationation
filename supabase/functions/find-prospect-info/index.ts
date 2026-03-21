import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const GOOGLE_MAPS_API_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY');
  if (!GOOGLE_MAPS_API_KEY) {
    return new Response(JSON.stringify({ error: 'GOOGLE_MAPS_API_KEY not configured' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { prospects } = await req.json();
    if (!prospects || !Array.isArray(prospects) || prospects.length === 0) {
      return new Response(JSON.stringify({ error: 'prospects array is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const results: Array<{ id: string; website_url: string | null; phone: string | null; has_website: boolean }> = [];

    for (const prospect of prospects) {
      try {
        let websiteUrl: string | null = prospect.website_url || null;
        let phone: string | null = prospect.phone || null;

        if (prospect.google_place_id) {
          const fields = ['website', 'formatted_phone_number'].join(',');
          const detailUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(prospect.google_place_id)}&fields=${fields}&key=${GOOGLE_MAPS_API_KEY}`;
          const response = await fetch(detailUrl);
          const data = await response.json();

          if (data.status === 'OK' && data.result) {
            websiteUrl = data.result.website || websiteUrl;
            phone = data.result.formatted_phone_number || phone;
          } else {
            console.warn('Place details failed for', prospect.id, data.status);
          }
        }

        results.push({
          id: prospect.id,
          website_url: websiteUrl,
          phone,
          has_website: !!websiteUrl,
        });

        await new Promise(r => setTimeout(r, 120));
      } catch (e) {
        console.error('Error for prospect', prospect.id, e);
        results.push({
          id: prospect.id,
          website_url: prospect.website_url || null,
          phone: prospect.phone || null,
          has_website: !!prospect.website_url,
        });
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
