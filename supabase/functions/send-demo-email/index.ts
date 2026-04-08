import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/resend';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!LOVABLE_API_KEY || !RESEND_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ error: 'Missing configuration' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { demoId, to, subject, body } = await req.json();

    if (!demoId || !to || !subject || !body) {
      return new Response(JSON.stringify({ error: 'Missing required fields: demoId, to, subject, body' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get demo data
    const { data: demo, error: demoError } = await supabase.from('demos').select('*').eq('id', demoId).single();
    if (demoError || !demo) {
      return new Response(JSON.stringify({ error: 'Demo not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get company settings
    const { data: settings } = await supabase.from('company_settings').select('*').limit(1).single();
    const companyName = settings?.company_name || 'Creationation';
    const companyEmail = settings?.email || 'hello@creationation.app';
    const companyCity = settings?.city || 'Wien';
    const companyCountry = settings?.country || 'Österreich';
    const companyWebsite = settings?.website || 'creationation.app';

    const htmlBody = body.replace(/\n/g, '<br/>').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/&lt;br\/&gt;/g, '<br/>');

    const emailHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f6f1e9;">
  <div style="background: white; border-radius: 20px; padding: 36px; box-shadow: 0 4px 24px rgba(0,0,0,0.06);">
    <div style="text-align: center; margin-bottom: 28px; border-bottom: 2px solid ${demo.primary_color || '#2A9D8F'}; padding-bottom: 20px;">
      <div style="display: inline-block; width: 52px; height: 52px; border-radius: 14px; background: linear-gradient(135deg, ${demo.primary_color || '#2A9D8F'}, ${demo.secondary_color || '#E9C46A'}); color: white; font-size: 24px; font-weight: bold; line-height: 52px; text-align: center;">${(demo.business_name || 'C').charAt(0)}</div>
      <h1 style="margin: 10px 0 4px; font-size: 22px; color: #1A2332; font-family: Georgia, serif;">${companyName}</h1>
      <p style="margin: 0; font-size: 12px; color: #2A9D8F; letter-spacing: 2px; text-transform: uppercase;">App Demo</p>
    </div>
    <div style="font-size: 15px; line-height: 1.7; color: #333; margin-bottom: 28px;">${htmlBody}</div>
    <div style="text-align: center; margin: 28px 0;">
      <a href="https://creationation.lovable.app/demo/${demo.access_token}" style="display: inline-block; padding: 14px 36px; background: linear-gradient(135deg, ${demo.primary_color || '#2A9D8F'}, ${demo.secondary_color || '#E9C46A'}); color: white; text-decoration: none; border-radius: 999px; font-weight: 700; font-size: 15px;">🚀 Demo ansehen</a>
    </div>
    <div style="margin-top: 36px; padding-top: 16px; border-top: 1px solid #eee; text-align: center; font-size: 12px; color: #999;">
      <p>${companyName} — ${companyCity}, ${companyCountry}</p>
      <p>${companyEmail} — <a href="https://${companyWebsite}" style="color: ${demo.primary_color || '#2A9D8F'};">${companyWebsite}</a></p>
    </div>
  </div>
</body>
</html>`;

    // Send email via Resend
    const emailResponse = await fetch(`${GATEWAY_URL}/emails`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'X-Connection-Api-Key': RESEND_API_KEY,
      },
      body: JSON.stringify({
        from: `${companyName} <${companyEmail}>`,
        to: [to],
        subject,
        html: emailHtml,
      }),
    });

    const emailResult = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error('Resend error:', emailResult);
      return new Response(JSON.stringify({ error: 'Failed to send email', details: emailResult }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update demo status to 'sent'
    await supabase.from('demos').update({ status: 'sent' }).eq('id', demoId);

    // Log activity
    await supabase.from('activity_log').insert({
      action: `Demo email envoyé à ${demo.business_name} (${to})`,
      performed_by: 'admin',
      details: { demo_id: demoId, email: to, business_name: demo.business_name },
    });

    return new Response(JSON.stringify({ success: true, emailId: emailResult.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
