import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const COUNTRY_LANG: Record<string, string> = {
  'France': 'fr', 'Belgique': 'fr', 'Suisse': 'fr', 'Luxembourg': 'fr',
  'Canada': 'fr', 'Maroc': 'fr', 'Tunisie': 'fr', 'Algerie': 'fr',
  'Senegal': 'fr', "Cote d'Ivoire": 'fr', 'Cameroun': 'fr', 'RD Congo': 'fr',
  'Allemagne': 'de', 'Autriche': 'de',
  'Espagne': 'es', 'Mexique': 'es', 'Argentine': 'es', 'Colombie': 'es',
  'Chili': 'es', 'Perou': 'es',
  'Italie': 'it', 'Portugal': 'pt', 'Bresil': 'pt',
  'Pays-Bas': 'nl', 'Turquie': 'tr', 'Pologne': 'pl',
  'Republique tcheque': 'cs', 'Suede': 'sv', 'Norvege': 'no',
  'Danemark': 'da', 'Finlande': 'fi', 'Grece': 'el',
  'Roumanie': 'ro', 'Croatie': 'hr',
  'Japon': 'ja', 'Coree du Sud': 'ko', 'Chine': 'zh',
  'Thailande': 'th', 'Vietnam': 'vi', 'Indonesie': 'id',
  'Philippines': 'en', 'Malaisie': 'en',
  'Emirats arabes unis': 'ar', 'Israel': 'he', 'Egypte': 'ar', 'Nigeria': 'en',
  'Inde': 'en', 'Afrique du Sud': 'en',
  'Etats-Unis': 'en', 'Royaume-Uni': 'en', 'Irlande': 'en',
  'Australie': 'en', 'Nouvelle-Zelande': 'en',
};

const LANG_INSTRUCTIONS: Record<string, string> = {
  fr: "Redige l'email entierement en francais.",
  en: 'Write the email entirely in English.',
  de: 'Verfasse die E-Mail vollständig auf Deutsch.',
  es: 'Escribe el email enteramente en español.',
  it: "Scrivi l'email interamente in italiano.",
  pt: 'Escreva o email inteiramente em português.',
  nl: 'Schrijf de e-mail volledig in het Nederlands.',
  ar: 'اكتب البريد الإلكتروني بالكامل باللغة العربية.',
  tr: "E-postayı tamamen Türkçe olarak yazın.",
  pl: 'Napisz maila w całości po polsku.',
  cs: 'Napište email celý v češtině.',
  sv: 'Skriv hela e-postmeddelandet på svenska.',
  no: 'Skriv hele e-posten på norsk.',
  da: 'Skriv hele e-mailen på dansk.',
  fi: 'Kirjoita sähköposti kokonaan suomeksi.',
  el: 'Γράψτε ολόκληρο το email στα ελληνικά.',
  ro: 'Scrieți e-mailul în întregime în limba română.',
  hr: 'Napišite cijeli email na hrvatskom jeziku.',
  ja: 'メールを全て日本語で書いてください。',
  ko: '이메일을 전부 한국어로 작성하세요.',
  zh: '请用中文撰写整封邮件。',
  th: 'เขียนอีเมลทั้งหมดเป็นภาษาไทย',
  vi: 'Viết toàn bộ email bằng tiếng Việt.',
  id: 'Tulis email sepenuhnya dalam Bahasa Indonesia.',
  he: 'כתוב את האימייל כולו בעברית.',
};

const LANG_NAMES: Record<string, string> = {
  fr: 'français', en: 'English', de: 'Deutsch', es: 'español',
  it: 'italiano', pt: 'português', nl: 'Nederlands', ar: 'العربية',
  tr: 'Türkçe', pl: 'polski', cs: 'čeština', sv: 'svenska',
  no: 'norsk', da: 'dansk', fi: 'suomi', el: 'ελληνικά',
  ro: 'română', hr: 'hrvatski', ja: '日本語', ko: '한국어',
  zh: '中文', th: 'ภาษาไทย', vi: 'tiếng Việt', id: 'Bahasa Indonesia',
  he: 'עברית',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { prospect, lang: overrideLang } = await req.json();
    if (!prospect) {
      return new Response(JSON.stringify({ error: 'prospect object is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Determine language: explicit override > prospect.language > country mapping > 'en'
    const lang = overrideLang || prospect.language || COUNTRY_LANG[prospect.country] || 'en';
    const langName = LANG_NAMES[lang] || 'English';
    const langInstruction = LANG_INSTRUCTIONS[lang] || LANG_INSTRUCTIONS.en;

    const websiteNote = prospect.has_website
      ? `They have a website (${prospect.website_url}) that could be improved — you can mention a redesign.`
      : `They do NOT have a website or mobile app. This is your main angle.`;

    const prompt = `You are Diego Renard, founder of CreationNation — a premium web & mobile app creation agency.
You are writing a personalized cold email to contact a local business.

PROSPECT:
- Business: ${prospect.business_name}
- Type: ${prospect.business_type || 'local business'}
- City: ${prospect.city || 'unknown'}${prospect.country ? ', ' + prospect.country : ''}
- Phone: ${prospect.phone || 'not provided'}
- Google rating: ${prospect.rating ? `${prospect.rating}/5 (${prospect.review_count} reviews)` : 'not available'}
- Contact: ${prospect.contact_name || 'not provided'}
- Notes: ${prospect.notes || 'none'}
- Website: ${websiteNote}

CREATIONNATION:
- Showcase websites from 290€
- Custom web/mobile apps from 900€
- Delivery: 7 to 14 days
- Specialized in local businesses (barbershops, restaurants, salons, etc.)

RULES:
1. Short (150-200 words max)
2. Truly personalize based on their business type, city, and local culture
3. Mention something specific to their industry
4. Direct, human tone — not corporate
5. Clear CTA (WhatsApp or email)
6. CRITICAL: ${langInstruction}
7. The entire email MUST be in ${langName} — subject line AND body
8. Adapt cultural references and greetings to ${langName}-speaking culture

Return ONLY valid JSON:
{"subject": "Short catchy subject (<60 chars) in ${langName}", "body": "Simple HTML body with <p> and <br> only, in ${langName}"}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: `You write personalized cold emails for a web agency. Always write in ${langName}. Return only JSON.` },
          { role: 'user', content: prompt },
        ],
      }),
    });

    if (response.status === 429) {
      return new Response(JSON.stringify({ error: 'Rate limited, please try again later' }), {
        status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (response.status === 402) {
      return new Response(JSON.stringify({ error: 'Credits exhausted, please add funds' }), {
        status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiData = await response.json();
    if (!response.ok) {
      return new Response(JSON.stringify({ error: `AI error: ${JSON.stringify(aiData)}` }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const rawText = aiData.choices?.[0]?.message?.content || '';
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return new Response(JSON.stringify({ error: 'Could not parse AI response', raw: rawText }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const emailData = JSON.parse(jsonMatch[0]);
    return new Response(JSON.stringify({ subject: emailData.subject, body: emailData.body, language: lang }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
