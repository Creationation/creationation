import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    const { url, prospect_id, sector } = await req.json();
    if (!url) throw new Error('url is required');

    const prompt = `Tu es un expert en audit de sites web pour une agence web premium (CreationNation).

Analyse ce site web concurrent : ${url}
${sector ? `Secteur d'activité : ${sector}` : ''}

Évalue les critères suivants et donne un score sur 100 :
1. Design (moderne ou daté ?) - /20
2. Mobile-friendly (responsive ?) - /20
3. Performance (estimation basée sur la complexité probable) - /20
4. SEO basique (URL propres, structure probable) - /20
5. Contenu et fonctionnalités - /20

Retourne un JSON strict :
{
  "score": <number 0-100>,
  "design_score": <0-20>,
  "mobile_score": <0-20>,
  "performance_score": <0-20>,
  "seo_score": <0-20>,
  "content_score": <0-20>,
  "weaknesses": ["point faible 1", "point faible 2", "point faible 3"],
  "missing_features": ["fonctionnalité manquante 1", "fonctionnalité manquante 2"],
  "pitch_arguments": ["argument de vente 1 pour proposer un meilleur site", "argument 2", "argument 3"],
  "summary": "Résumé en 2 phrases de l'audit"
}`;

    const aiRes = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!aiRes.ok) {
      const t = await aiRes.text();
      throw new Error(`AI error: ${aiRes.status} ${t}`);
    }

    const aiData = await aiRes.json();
    const raw = aiData.choices?.[0]?.message?.content || '';
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```/g, '').trim();
    const audit = JSON.parse(cleaned);

    return new Response(JSON.stringify({ audit, prospect_id }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
