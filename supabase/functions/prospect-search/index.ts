import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
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
    const { city, businessType, country = '', maxResults = 20, fetchPhone = false, skipDetails = false } = await req.json();
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

    const detailsPromises = basicResults.map(async (result) => {
      try {
        const fields = fetchPhone ? 'website,formatted_phone_number' : 'website';
        const detailUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${result.google_place_id}&fields=${fields}&key=${GOOGLE_MAPS_API_KEY}`;
        const detailRes = await fetch(detailUrl);
        const detailData = await detailRes.json();
        const d = detailData.result || {};

        if (d.website) {
          result.has_website = true;
          result.website_url = d.website;
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
    const phoneCalls = 0;

    return new Response(JSON.stringify({ 
      results, total: results.length,
      costs: { textSearchCalls: pageCount, detailCalls, phoneCalls }
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
