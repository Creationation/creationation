import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
  if (!ANTHROPIC_API_KEY) {
    return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { prospect, lang = 'fr' } = await req.json();
    if (!prospect) {
      return new Response(JSON.stringify({ error: 'prospect object is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const langInstructions: Record<string, string> = {
      fr: "Redige l'email entierement en francais.",
      en: 'Write the email entirely in English.',
      de: 'Verfasse die E-Mail vollstandig auf Deutsch.',
    };

    const websiteNote = prospect.has_website
      ? `Ils ont un site web (${prospect.website_url}) mais il semble perfectible — tu peux mentionner une refonte.`
      : `Ils n'ont PAS de site web ni d'application mobile. C'est ton angle principal.`;

    const prompt = `Tu es Diego Renard, fondateur de Creationation — agence de creation d'applications web et mobiles premium.
Tu rediges un cold email personnalise pour contacter un commerce local.

PROSPECT:
- Commerce: ${prospect.business_name}
- Type: ${prospect.business_type || 'commerce local'}
- Ville: ${prospect.city || 'inconnue'}${prospect.country ? ', ' + prospect.country : ''}
- Tel: ${prospect.phone || 'non renseigne'}
- Note Google: ${prospect.rating ? `${prospect.rating}/5 (${prospect.review_count} avis)` : 'non renseignee'}
- Contact: ${prospect.contact_name || 'non renseigne'}
- Notes: ${prospect.notes || 'aucune'}
- Site web: ${websiteNote}

CREATIONATION:
- Sites vitrines a partir de 290EUR
- Apps web/mobile sur mesure a partir de 900EUR
- Delai: 7 a 14 jours
- Specialises dans commerces locaux (barbershops, restaurants, salons, etc.)

REGLES:
1. Court (150-200 mots max)
2. Personnalise vraiment selon le type de commerce et la ville
3. Mentionne quelque chose de specifique a leur secteur
4. Ton direct, humain, pas corporate
5. CTA clair (WhatsApp ou email)
6. ${langInstructions[lang] || langInstructions.fr}

Retourne UNIQUEMENT un JSON valide:
{"subject": "Objet court accrocheur (<60 chars)", "body": "Corps HTML simple avec <p> et <br> uniquement"}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-6',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const aiData = await response.json();
    if (!response.ok) {
      return new Response(JSON.stringify({ error: `Claude error: ${JSON.stringify(aiData)}` }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const rawText = aiData.content?.[0]?.text || '';
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return new Response(JSON.stringify({ error: 'Could not parse Claude response', raw: rawText }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const emailData = JSON.parse(jsonMatch[0]);
    return new Response(JSON.stringify({ subject: emailData.subject, body: emailData.body }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
