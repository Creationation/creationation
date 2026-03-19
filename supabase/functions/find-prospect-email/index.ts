import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
    const { prospects } = await req.json();
    if (!prospects || !Array.isArray(prospects) || prospects.length === 0) {
      return new Response(JSON.stringify({ error: 'prospects array is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const results: Array<{ id: string; email: string | null; confidence: string }> = [];

    for (const prospect of prospects) {
      try {
        const searchContext = [
          prospect.business_name,
          prospect.city,
          prospect.country,
          prospect.address,
          prospect.phone,
          prospect.website_url,
        ].filter(Boolean).join(', ');

        const prompt = `You are an expert at finding business contact email addresses. 
Given the following business information, determine the most likely contact email address.

Business: ${prospect.business_name}
Type: ${prospect.business_type || 'local business'}
City: ${prospect.city || 'unknown'}
Country: ${prospect.country || 'unknown'}
Address: ${prospect.address || 'unknown'}
Phone: ${prospect.phone || 'unknown'}
Website: ${prospect.website_url || 'none'}

RULES:
1. If they have a website, derive the most likely email format (info@domain, contact@domain, hello@domain, etc.)
2. If no website, try common email patterns with the business name on popular providers (gmail, outlook, etc.)
3. Be realistic - only suggest emails that are highly probable
4. If you truly cannot determine an email, return null

Return ONLY valid JSON: {"email": "found@email.com" or null, "confidence": "high" | "medium" | "low", "reasoning": "brief explanation"}`;

        const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-3-flash-preview',
            messages: [
              { role: 'system', content: 'You find business email addresses. Return only JSON.' },
              { role: 'user', content: prompt },
            ],
          }),
        });

        if (response.status === 429) {
          // Rate limited - wait and continue
          await new Promise(r => setTimeout(r, 3000));
          results.push({ id: prospect.id, email: null, confidence: 'none' });
          continue;
        }

        if (!response.ok) {
          console.error('AI error for', prospect.business_name, response.status);
          results.push({ id: prospect.id, email: null, confidence: 'none' });
          continue;
        }

        const aiData = await response.json();
        const rawText = aiData.choices?.[0]?.message?.content || '';
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          results.push({
            id: prospect.id,
            email: parsed.email || null,
            confidence: parsed.confidence || 'low',
          });
        } else {
          results.push({ id: prospect.id, email: null, confidence: 'none' });
        }

        // Small delay between requests
        await new Promise(r => setTimeout(r, 500));
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
