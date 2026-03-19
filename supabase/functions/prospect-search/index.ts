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
    const { city, businessType, country = 'France', maxResults = 20 } = await req.json();
    if (!city || !businessType) {
      return new Response(JSON.stringify({ error: 'city and businessType are required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const query = encodeURIComponent(`${businessType} ${city} ${country}`);
    const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query}&key=${GOOGLE_MAPS_API_KEY}`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();

    if (searchData.status !== 'OK' && searchData.status !== 'ZERO_RESULTS') {
      return new Response(JSON.stringify({ error: `Google Places error: ${searchData.status}` }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const places = (searchData.results || []).slice(0, maxResults);

    const detailsPromises = places.map(async (place: any) => {
      const detailUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,formatted_address,formatted_phone_number,website,rating,user_ratings_total,types&key=${GOOGLE_MAPS_API_KEY}`;
      const detailRes = await fetch(detailUrl);
      const detailData = await detailRes.json();
      const d = detailData.result || {};
      return {
        google_place_id: place.place_id,
        business_name: d.name || place.name,
        address: d.formatted_address || place.formatted_address,
        phone: d.formatted_phone_number || null,
        has_website: !!d.website,
        website_url: d.website || null,
        rating: d.rating || null,
        review_count: d.user_ratings_total || 0,
        types: d.types || [],
        city, country, business_type: businessType, source: 'google_maps',
      };
    });

    const results = await Promise.all(detailsPromises);
    results.sort((a, b) => (a.has_website ? 1 : 0) - (b.has_website ? 1 : 0));

    return new Response(JSON.stringify({ results, total: results.length }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
