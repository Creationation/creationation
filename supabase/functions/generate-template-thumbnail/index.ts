import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { templateId, prompt, category, primaryColor, secondaryColor, screenshots, jsxContent } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not set");

    // Build multimodal content array
    const contentParts: any[] = [];

    // Main text instruction
    let textPrompt = `You are a premium UI designer. Generate a single polished mobile app screenshot/thumbnail that represents this app template.

CATEGORY: ${category}
PRIMARY COLOR: ${primaryColor}
SECONDARY COLOR: ${secondaryColor}

CREATIVE BRIEF / STYLE PROMPT:
${prompt || "Premium glassmorphism mobile app, dark elegant background, modern UI"}

INSTRUCTIONS:
- Create a SINGLE clean mobile phone screen mockup showing the app's main interface
- Use the exact colors specified (${primaryColor} and ${secondaryColor}) as accent colors throughout
- Style: glassmorphism cards, dark elegant background, rounded corners, beautiful typography
- Show realistic app content: navigation, cards, buttons, stats, service listings
- Make it look like a real premium app, Dribbble/Behance quality
- NO text overlays outside the phone screen, NO watermarks
- The result should look like a polished app store screenshot`;

    // Add JSX context if available
    if (jsxContent) {
      textPrompt += `\n\nREFERENCE JSX COMPONENT (use this as layout/structure guide):\n\`\`\`jsx\n${jsxContent.substring(0, 3000)}\n\`\`\``;
    }

    contentParts.push({ type: "text", text: textPrompt });

    // Add reference screenshots as image inputs (max 3 to stay within limits)
    if (screenshots && screenshots.length > 0) {
      const screenshotsToUse = screenshots.slice(0, 3);
      for (const url of screenshotsToUse) {
        if (url && url.startsWith("http")) {
          contentParts.push({
            type: "image_url",
            image_url: { url }
          });
        }
      }
      // Add instruction about screenshots
      contentParts.push({
        type: "text",
        text: "The images above are reference screenshots. Use them as visual inspiration for layout, style, and content structure. Recreate a similar quality and feel in the generated thumbnail."
      });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-pro-image-preview",
        messages: [{ role: "user", content: contentParts }],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`AI API error: ${response.status} ${errText}`);
    }

    const data = await response.json();
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl) throw new Error("No image generated");

    // Extract base64 data and upload to storage
    const base64Data = imageUrl.replace(/^data:image\/\w+;base64,/, "");
    const imageBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, supabaseKey);

    const filePath = `thumb-${templateId}-${Date.now()}.png`;
    const { error: uploadError } = await sb.storage
      .from("demo-templates")
      .upload(filePath, imageBytes, { contentType: "image/png", upsert: true });

    if (uploadError) throw new Error(`Upload error: ${uploadError.message}`);

    const { data: urlData } = sb.storage.from("demo-templates").getPublicUrl(filePath);

    // Save to template
    await sb.from("demo_templates").update({ preview_url: urlData.publicUrl }).eq("id", templateId);

    return new Response(JSON.stringify({ url: urlData.publicUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
