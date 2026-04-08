import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function buildContextBlock(demo: any): string {
  const parts = [
    `Business: "${demo.business_name}" (${demo.business_type || 'general'})`,
    demo.city ? `Location: ${demo.city}` : '',
    demo.services?.length ? `Services: ${JSON.stringify(demo.services)}` : '',
    `Brand colors: primary ${demo.primary_color}, secondary ${demo.secondary_color}`,
    demo.tagline ? `Current tagline: "${demo.tagline}"` : '',
  ].filter(Boolean);
  return parts.join('\n');
}

function buildDesignDirective(demo: any): string {
  if (!demo.design_prompt) return '';
  return `
=== CREATIVE BRIEF FROM THE CLIENT (FOLLOW THIS CLOSELY) ===
${demo.design_prompt}
=== END OF CREATIVE BRIEF ===

This creative brief should strongly influence:
- The tone of voice and vocabulary used in all texts
- The visual atmosphere described for image generation
- The marketing angle and unique selling propositions
- The target audience assumptions
- The overall mood and energy level
`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { demoId, generateTexts, generateHeroImage, generateGallery } = await req.json();

    if (!demoId) {
      return new Response(JSON.stringify({ error: 'demoId required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: demo, error: demoError } = await supabase
      .from('demos').select('*').eq('id', demoId).single();

    if (demoError || !demo) {
      return new Response(JSON.stringify({ error: 'Demo not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    await supabase.from('demos').update({ generation_status: 'generating' }).eq('id', demoId);

    const contextBlock = buildContextBlock(demo);
    const designDirective = buildDesignDirective(demo);
    const results: any = {};

    // ── GENERATE TEXTS ──
    if (generateTexts) {
      try {
        const textResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [{
              role: 'system',
              content: `You are a premium marketing copywriter for local businesses in Austria/Germany. You write in German (Hochdeutsch). You create compelling, authentic copy that converts prospects into customers. Your output is always JSON.`
            }, {
              role: 'user',
              content: `Generate premium marketing content for this business:

${contextBlock}
${designDirective}

Return ONLY valid JSON with this structure:
{
  "tagline": "A compelling German tagline (max 60 chars) that captures the brand essence${demo.design_prompt ? ' — must reflect the creative brief mood and positioning' : ''}",
  "hero_headline": "A powerful German headline for the hero section (max 40 chars)",
  "hero_subtext": "Supporting text under the headline (max 120 chars) — should create desire and urgency",
  "service_descriptions": {
    "ServiceName": "Persuasive German description (max 100 chars) — sell the benefit, not the feature"
  },
  "cta_text": "Call-to-action button text in German (max 25 chars)",
  "welcome_message": "A warm welcome paragraph (max 200 chars) for the about section",
  "unique_selling_points": ["USP 1 (max 50 chars)", "USP 2", "USP 3"]
}

Services to describe: ${JSON.stringify(demo.services || [])}
${demo.tagline ? `Current tagline (improve if possible): "${demo.tagline}"` : 'No tagline yet — create a memorable one'}
`
            }],
            response_format: { type: 'json_object' },
          }),
        });

        const textData = await textResponse.json();
        const content = textData.choices?.[0]?.message?.content;
        if (content) {
          try { results.texts = JSON.parse(content); } catch { results.texts = { raw: content }; }
        }
      } catch (e) {
        console.error('Text generation error:', e);
      }
    }

    // ── GENERATE HERO IMAGE ──
    if (generateHeroImage) {
      try {
        const imagePromptParts = [
          `Generate a stunning professional hero banner photo for a ${demo.business_type || 'business'} called "${demo.business_name}".`,
          demo.design_prompt
            ? `\nCREATIVE DIRECTION: ${demo.design_prompt}\nFollow this direction closely for the mood, atmosphere, lighting, and style.`
            : `Style: Modern, premium, clean interior or relevant scene.`,
          `Color palette: The space should have accents matching ${demo.primary_color} and ${demo.secondary_color}.`,
          `The image must feel like a real professional photograph, not AI-generated.`,
          `Warm, inviting lighting. Absolutely no text, logos, or watermarks in the image.`,
          `Aspect ratio: 16:9, landscape orientation, high resolution look.`,
        ];

        const imageResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash-image',
            messages: [{ role: 'user', content: imagePromptParts.join('\n') }],
            modalities: ['image', 'text'],
          }),
        });

        const imageData = await imageResponse.json();
        const imageUrl = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
        
        if (imageUrl) {
          const base64Data = imageUrl.replace(/^data:image\/\w+;base64,/, '');
          const bytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
          const path = `hero-${demoId}-${Date.now()}.png`;
          
          const { error: uploadError } = await supabase.storage
            .from('demo-logos').upload(path, bytes, { contentType: 'image/png', upsert: true });

          if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage.from('demo-logos').getPublicUrl(path);
            results.heroImageUrl = publicUrl;
            await supabase.from('demos').update({ hero_media_type: 'ai_generated', hero_media_url: publicUrl }).eq('id', demoId);
          }
        }
      } catch (e) {
        console.error('Hero image generation error:', e);
      }
    }

    // ── GENERATE GALLERY IMAGES ──
    if (generateGallery) {
      try {
        const galleryUrls: string[] = [];
        
        // Build scene prompts that deeply integrate the design prompt
        const baseStyle = demo.design_prompt 
          ? `CREATIVE DIRECTION: ${demo.design_prompt}\nFollow this direction for mood, lighting, colors, and atmosphere.`
          : `Style: Professional photography, warm lighting, modern and premium.`;
        
        const scenes = [
          `Beautiful interior of "${demo.business_name}", a premium ${demo.business_type || 'business'}. Show the main space where clients are welcomed. ${baseStyle} Color accents: ${demo.primary_color}. No text, no logos. Square format. Must look like a real photograph.`,
          `Close-up professional work scene at "${demo.business_name}". Show skilled hands at work or a signature treatment/service in action. ${baseStyle} Warm, detailed, intimate perspective. No text. Square format.`,
          `A delighted customer moment at "${demo.business_name}". Show the result of the service — a happy, natural moment. ${baseStyle} Authentic, not staged. Natural light preferred. No text. Square format.`,
          `Artistic detail shot of products, tools, or decor at "${demo.business_name}". ${baseStyle} Moody, editorial style. Shallow depth of field. Color palette: ${demo.primary_color} and ${demo.secondary_color}. No text. Square format.`,
        ];

        for (const scene of scenes) {
          try {
            const galleryResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${LOVABLE_API_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: 'google/gemini-2.5-flash-image',
                messages: [{ role: 'user', content: scene }],
                modalities: ['image', 'text'],
              }),
            });

            const galleryData = await galleryResponse.json();
            const galleryImageUrl = galleryData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
            
            if (galleryImageUrl) {
              const base64Data = galleryImageUrl.replace(/^data:image\/\w+;base64,/, '');
              const bytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
              const path = `gallery-${demoId}-${Date.now()}-${galleryUrls.length}.png`;
              
              const { error: uploadError } = await supabase.storage
                .from('demo-logos').upload(path, bytes, { contentType: 'image/png', upsert: true });

              if (!uploadError) {
                const { data: { publicUrl } } = supabase.storage.from('demo-logos').getPublicUrl(path);
                galleryUrls.push(publicUrl);
              }
            }
          } catch (e) {
            console.error('Gallery image generation error:', e);
          }
        }

        if (galleryUrls.length > 0) {
          results.galleryUrls = galleryUrls;
          await supabase.from('demos').update({ gallery_images: galleryUrls }).eq('id', demoId);
        }
      } catch (e) {
        console.error('Gallery generation error:', e);
      }
    }

    // Update generated descriptions
    if (results.texts) {
      const updates: any = { generated_descriptions: results.texts };
      if (results.texts.tagline && !demo.tagline) {
        updates.tagline = results.texts.tagline;
      }
      await supabase.from('demos').update(updates).eq('id', demoId);
    }

    await supabase.from('demos').update({ generation_status: 'ready' }).eq('id', demoId);

    await supabase.from('activity_log').insert({
      action: `Contenu généré pour la démo "${demo.business_name}"`,
      performed_by: 'system',
      details: {
        demo_id: demoId,
        had_design_prompt: !!demo.design_prompt,
        design_prompt_length: demo.design_prompt?.length || 0,
        generated: {
          texts: !!generateTexts,
          hero: !!generateHeroImage,
          gallery: !!generateGallery,
          gallery_count: results.galleryUrls?.length || 0,
        },
      },
    });

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});