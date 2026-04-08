import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    // Get demo data
    const { data: demo, error: demoError } = await supabase
      .from('demos')
      .select('*')
      .eq('id', demoId)
      .single();

    if (demoError || !demo) {
      return new Response(JSON.stringify({ error: 'Demo not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Set status to generating
    await supabase.from('demos').update({ generation_status: 'generating' }).eq('id', demoId);

    const results: any = {};

    // Generate texts (tagline, service descriptions)
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
              role: 'user',
              content: `Generate marketing content for a ${demo.business_type || 'business'} called "${demo.business_name}" located in ${demo.city || 'Wien'}. 
              
Return ONLY valid JSON (no markdown, no code blocks) with this structure:
{
  "tagline": "A catchy German tagline for the business (max 60 chars)",
  "service_descriptions": {
    "ServiceName": "Short German description (max 80 chars)"
  }
}

Services to describe: ${JSON.stringify(demo.services || [])}
Current tagline: ${demo.tagline || 'none'}
`
            }],
            response_format: { type: 'json_object' },
          }),
        });

        const textData = await textResponse.json();
        const content = textData.choices?.[0]?.message?.content;
        if (content) {
          try {
            results.texts = JSON.parse(content);
          } catch {
            results.texts = { raw: content };
          }
        }
      } catch (e) {
        console.error('Text generation error:', e);
      }
    }

    // Generate hero image
    if (generateHeroImage) {
      try {
        const imageResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash-image',
            messages: [{
              role: 'user',
              content: `Generate a professional hero banner image for a ${demo.business_type || 'business'} called "${demo.business_name}". 
Style: Modern, premium, clean. Show a beautiful interior or relevant scene for a ${demo.business_type || 'business'} establishment. 
Colors: Use ${demo.primary_color} and ${demo.secondary_color} as accent colors.
The image should be warm, inviting, and professional. No text in the image.
Aspect ratio: 16:9, landscape orientation.`
            }],
            modalities: ['image', 'text'],
          }),
        });

        const imageData = await imageResponse.json();
        const imageUrl = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
        
        if (imageUrl) {
          // Upload to storage
          const base64Data = imageUrl.replace(/^data:image\/\w+;base64,/, '');
          const bytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
          const path = `hero-${demoId}-${Date.now()}.png`;
          
          const { error: uploadError } = await supabase.storage
            .from('demo-logos')
            .upload(path, bytes, { contentType: 'image/png', upsert: true });

          if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage.from('demo-logos').getPublicUrl(path);
            results.heroImageUrl = publicUrl;
            
            // Update demo with hero image
            await supabase.from('demos').update({
              hero_media_type: 'ai_generated',
              hero_media_url: publicUrl,
            }).eq('id', demoId);
          }
        }
      } catch (e) {
        console.error('Hero image generation error:', e);
      }
    }

    // Generate gallery images
    if (generateGallery) {
      try {
        const galleryUrls: string[] = [];
        const scenes = [
          `Interior of a beautiful ${demo.business_type || 'business'} establishment, modern and welcoming`,
          `Close-up professional work scene at a ${demo.business_type || 'business'}, high quality`,
          `Happy customer moment at a premium ${demo.business_type || 'business'}`,
          `Detail shot of tools/products at a ${demo.business_type || 'business'}, artistic`,
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
                messages: [{ role: 'user', content: `${scene}. Style: Professional photography, warm lighting, modern. No text. Square format.` }],
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
                .from('demo-logos')
                .upload(path, bytes, { contentType: 'image/png', upsert: true });

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

    // Update generated descriptions if texts were generated
    if (results.texts) {
      const updates: any = { generated_descriptions: results.texts };
      if (results.texts.tagline && !demo.tagline) {
        updates.tagline = results.texts.tagline;
      }
      await supabase.from('demos').update(updates).eq('id', demoId);
    }

    // Set status to ready
    await supabase.from('demos').update({ generation_status: 'ready' }).eq('id', demoId);

    // Log activity
    await supabase.from('activity_log').insert({
      action: `Contenu généré pour la démo "${demo.business_name}"`,
      performed_by: 'system',
      details: {
        demo_id: demoId,
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
