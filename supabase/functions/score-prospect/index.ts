import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SECTOR_SCORES: Record<string, number> = {
  restaurant: 22, salon_coiffure: 23, clinique: 18, artisan: 20,
  immobilier: 15, boutique: 21, cafe: 20, boulangerie: 19,
};

function detectSector(types: string[], businessType: string | null): string {
  const t = (types || []).join(' ').toLowerCase();
  const bt = (businessType || '').toLowerCase();
  if (t.includes('restaurant') || bt.includes('restaurant')) return 'restaurant';
  if (t.includes('beauty') || t.includes('hair') || bt.includes('salon') || bt.includes('coiffure') || bt.includes('barbershop') || bt.includes('nail')) return 'salon_coiffure';
  if (t.includes('doctor') || t.includes('dentist') || t.includes('health') || bt.includes('medecin') || bt.includes('dentiste') || bt.includes('clinique') || bt.includes('kine')) return 'clinique';
  if (t.includes('store') || t.includes('shop') || bt.includes('boutique') || bt.includes('epicerie') || bt.includes('fleuriste')) return 'boutique';
  if (t.includes('real_estate') || bt.includes('immobilier')) return 'immobilier';
  if (t.includes('cafe') || bt.includes('cafe') || bt.includes('boulangerie')) return 'cafe';
  if (bt.includes('plombier') || bt.includes('electricien') || bt.includes('artisan') || bt.includes('photographe') || bt.includes('tatoueur')) return 'artisan';
  return 'autre';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { prospect_ids } = await req.json();
    if (!prospect_ids?.length) {
      return new Response(JSON.stringify({ error: 'prospect_ids required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: prospects } = await supabase
      .from('prospects')
      .select('*')
      .in('id', prospect_ids);

    if (!prospects?.length) {
      return new Response(JSON.stringify({ error: 'No prospects found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Load sector templates for conversion rates
    const { data: sectorTemplates } = await supabase.from('sector_templates').select('sector, conversion_rate');
    const sectorRates: Record<string, number> = {};
    (sectorTemplates || []).forEach((s: any) => { sectorRates[s.sector] = s.conversion_rate || 5; });

    const results = [];

    for (const p of prospects) {
      const sector = p.sector || detectSector([], p.business_type);

      // 1. Sector score (0-25)
      const sectorScore = SECTOR_SCORES[sector] || 12;

      // 2. Location score (0-20)
      let locationScore = 10;
      if (p.city) locationScore = 15;
      if (p.address && (p.address.toLowerCase().includes('centre') || p.address.toLowerCase().includes('center') || p.address.toLowerCase().includes('main'))) locationScore = 20;

      // 3. Company size (0-15) based on review_count if available
      let sizeScore = 8;
      // We don't have review_count on prospect, but we can infer from notes or other signals
      if (p.notes && p.notes.length > 50) sizeScore = 12;

      // 4. Digital presence (0-20)
      let digitalScore = 10;
      if (!p.has_website && !p.website_url) digitalScore = 20; // No website = high potential
      else if (p.has_website) digitalScore = 5; // Has website = lower priority
      if (p.phone && !p.has_website) digitalScore = Math.min(20, digitalScore + 2);

      // 5. Responsiveness (0-20)
      let responsivenessScore = 5;
      if (p.email) responsivenessScore += 10;
      if (p.phone) responsivenessScore += 5;
      if (p.status === 'replied') responsivenessScore = 20;

      const totalScore = Math.min(100, sectorScore + locationScore + sizeScore + digitalScore + responsivenessScore);
      const breakdown = {
        sector: sectorScore,
        location: locationScore,
        size: sizeScore,
        digital_presence: digitalScore,
        responsiveness: responsivenessScore,
      };

      await supabase
        .from('prospects')
        .update({
          score: totalScore,
          score_breakdown: breakdown,
          score_updated_at: new Date().toISOString(),
          sector: sector,
        })
        .eq('id', p.id);

      results.push({ id: p.id, score: totalScore, breakdown, sector });
    }

    return new Response(JSON.stringify({ results }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
