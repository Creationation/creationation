import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const COUNTRY_LANG: Record<string, string> = {
  'France': 'fr', 'Belgique': 'fr', 'Suisse': 'fr', 'Luxembourg': 'fr',
  'Canada': 'fr', 'Maroc': 'fr', 'Tunisie': 'fr', 'Algerie': 'fr',
  'Allemagne': 'de', 'Autriche': 'de',
  'Espagne': 'es', 'Mexique': 'es', 'Argentine': 'es',
  'Italie': 'it', 'Portugal': 'pt', 'Bresil': 'pt',
  'Pays-Bas': 'nl', 'Turquie': 'tr', 'Pologne': 'pl',
  'Japon': 'ja', 'Coree du Sud': 'ko', 'Chine': 'zh',
  'Etats-Unis': 'en', 'Royaume-Uni': 'en', 'Australie': 'en',
};

const LANG_INSTRUCTIONS: Record<string, string> = {
  fr: 'Écris en français', en: 'Write in English', de: 'Schreibe auf Deutsch',
  es: 'Escribe en español', it: 'Scrivi in italiano', pt: 'Escreva em português',
  nl: 'Schrijf in het Nederlands', ar: 'اكتب بالعربية', tr: 'Türkçe yaz',
  ja: '日本語で書いてください', ko: '한국어로 작성하세요', zh: '请用中文写',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { prospect_id, sequence_id, step_number } = await req.json();

    // Fetch prospect
    const { data: prospect } = await supabase.from('prospects').select('*').eq('id', prospect_id).single();
    if (!prospect) throw new Error('Prospect not found');

    // Fetch sequence
    const { data: sequence } = await supabase.from('email_sequences').select('*').eq('id', sequence_id).single();
    if (!sequence) throw new Error('Sequence not found');

    const steps = sequence.steps as any[];
    const step = steps.find((s: any) => s.step_number === step_number);
    if (!step) throw new Error(`Step ${step_number} not found`);

    // Determine language
    let lang = sequence.language === 'auto'
      ? (prospect.language || COUNTRY_LANG[prospect.country || ''] || 'en')
      : sequence.language;

    // Replace template variables
    const vars: Record<string, string> = {
      '{{business_name}}': prospect.business_name || '',
      '{{city}}': prospect.city || '',
      '{{sector}}': prospect.sector || prospect.business_type || '',
      '{{owner_name}}': prospect.contact_name || '',
      '{{country}}': prospect.country || '',
    };

    let subject = step.subject_template || '';
    let body = step.body_template || '';
    for (const [k, v] of Object.entries(vars)) {
      subject = subject.replaceAll(k, v);
      body = body.replaceAll(k, v);
    }

    // Use AI to personalize
    const langInstruction = LANG_INSTRUCTIONS[lang] || LANG_INSTRUCTIONS.en;
    const prompt = `${langInstruction}.

Tu es un copywriter pour CreationNation, une agence web premium. Personnalise cet email de prospection en gardant la même structure et le même ton, mais en le rendant plus naturel et spécifique au prospect.

Prospect : ${prospect.business_name} (${prospect.business_type || 'entreprise'}) à ${prospect.city || 'ville inconnue'}, ${prospect.country || ''}.
${prospect.contact_name ? `Contact : ${prospect.contact_name}` : ''}
${!prospect.has_website ? 'N\'a PAS de site web.' : `Site : ${prospect.website_url}`}

Email de base :
Sujet : ${subject}
Corps : ${body}

Retourne un JSON : {"subject": "...", "body": "..."}
Ne change PAS radicalement le message, juste des ajustements naturels.`;

    const aiRes = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!aiRes.ok) {
      // Fallback to template without AI personalization
      return new Response(JSON.stringify({ subject, body, language: lang, personalized: false }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiData = await aiRes.json();
    const raw = aiData.choices?.[0]?.message?.content || '';

    try {
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      return new Response(JSON.stringify({
        subject: parsed.subject || subject,
        body: parsed.body || body,
        language: lang,
        personalized: true,
      }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch {
      return new Response(JSON.stringify({ subject, body, language: lang, personalized: false }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
