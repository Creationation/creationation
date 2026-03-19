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

    const results: Array<{ id: string; website_url: string | null; phone: string | null; has_website: boolean }> = [];

    for (const prospect of prospects) {
      try {
        const prompt = `You are an expert at finding business contact information online.
Given the following business, find their website URL and phone number.

Business: ${prospect.business_name}
Type: ${prospect.business_type || 'local business'}
City: ${prospect.city || 'unknown'}
Country: ${prospect.country || 'unknown'}
Address: ${prospect.address || 'unknown'}

RULES:
1. For website: look for the most likely official website. Common patterns: businessname.com, businessname.fr, etc.
2. For phone: find the most likely phone number for this business.
3. Be realistic - only suggest info that is highly probable for a real local business.
4. If you truly cannot determine either, return null for that field.

Return ONLY valid JSON: {"website_url": "https://..." or null, "phone": "+33..." or null, "confidence": "high" | "medium" | "low"}`;

        const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-3-flash-preview',
            messages: [
              { role: 'system', content: 'You find business websites and phone numbers. Return only JSON.' },
              { role: 'user', content: prompt },
            ],
          }),
        });

        if (response.status === 429) {
          await new Promise(r => setTimeout(r, 3000));
          results.push({ id: prospect.id, website_url: null, phone: null, has_website: false });
          continue;
        }

        if (response.status === 402) {
          return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add funds in Settings > Workspace > Usage.' }), {
            status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        if (!response.ok) {
          console.error('AI error for', prospect.business_name, response.status);
          results.push({ id: prospect.id, website_url: null, phone: null, has_website: false });
          continue;
        }

        const aiData = await response.json();
        const rawText = aiData.choices?.[0]?.message?.content || '';
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          results.push({
            id: prospect.id,
            website_url: parsed.website_url || null,
            phone: parsed.phone || null,
            has_website: !!parsed.website_url,
          });
        } else {
          results.push({ id: prospect.id, website_url: null, phone: null, has_website: false });
        }

        // Small delay between requests to avoid rate limits
        await new Promise(r => setTimeout(r, 500));
      } catch (e) {
        console.error('Error for prospect', prospect.id, e);
        results.push({ id: prospect.id, website_url: null, phone: null, has_website: false });
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
