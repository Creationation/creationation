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
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { contractId, recipientEmail, businessName, customMessage, subject } = await req.json();

    if (!contractId || !recipientEmail || !businessName) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const [{ data: contract }, { data: settings }] = await Promise.all([
      supabase.from('contracts').select('*').eq('id', contractId).single(),
      supabase.from('company_settings').select('*').limit(1).single(),
    ]);

    if (!contract) {
      return new Response(JSON.stringify({ error: 'Contract not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const pdfUrl = contract.document_url;
    const companyName = settings?.company_name || 'Creationation';
    const legalName = settings?.legal_name || 'Diego Renard';
    const companyEmail = settings?.email || 'hello@creationation.app';
    const companyCity = settings?.city || 'Wien';
    const companyCountry = settings?.country || 'Österreich';
    const companyWebsite = settings?.website || 'creationation.app';

    const defaultMessage = customMessage || `Sehr geehrte Damen und Herren,\n\nanbei finden Sie Ihre Honorarnote.\n\nBei Fragen stehen wir Ihnen gerne zur Verfügung.\n\nMit freundlichen Grüßen,\n${legalName}\n${companyName}`;
    const emailSubject = subject || `Ihre Honorarnote von ${companyName} - ${businessName}`;

    const emailHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb;">
  <div style="background: white; border-radius: 16px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
    <div style="text-align: center; margin-bottom: 24px; border-bottom: 2px solid #2A9D8F; padding-bottom: 16px;">
      <div style="display: inline-block; width: 48px; height: 48px; border-radius: 50%; background: linear-gradient(135deg, #2A9D8F, #264653); color: white; font-size: 22px; font-weight: bold; line-height: 48px; text-align: center;">C</div>
      <h1 style="margin: 8px 0 0; font-size: 20px; color: #1A2332;">${companyName}</h1>
    </div>
    <h2 style="font-size: 18px; color: #1A2332; margin-bottom: 16px;">Ihre Honorarnote</h2>
    <div style="white-space: pre-line; font-size: 14px; line-height: 1.6; color: #333; margin-bottom: 24px;">${defaultMessage.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
    ${pdfUrl ? `
    <div style="text-align: center; margin: 24px 0;">
      <a href="${pdfUrl}" style="display: inline-block; padding: 12px 32px; background: linear-gradient(135deg, #2A9D8F, #264653); color: white; text-decoration: none; border-radius: 999px; font-weight: 600; font-size: 14px;">📄 Honorarnote ansehen</a>
    </div>
    ` : ''}
    <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #eee; text-align: center; font-size: 12px; color: #999;">
      <p>${companyName} — ${companyCity}, ${companyCountry}</p>
      <p>${companyEmail} — <a href="https://${companyWebsite}" style="color: #2A9D8F;">${companyWebsite}</a></p>
    </div>
  </div>
</body>
</html>`;

    const emailResponse = await fetch(`${GATEWAY_URL}/emails`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'X-Connection-Api-Key': RESEND_API_KEY,
      },
      body: JSON.stringify({
        from: `${companyName} <${companyEmail}>`,
        to: [recipientEmail],
        subject: emailSubject,
        html: emailHtml,
      }),
    });

    const emailResult = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error('Resend error:', emailResult);
      return new Response(JSON.stringify({ error: 'Failed to send email', details: emailResult }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    await supabase
      .from('contracts')
      .update({ status: 'sent', sent_at: new Date().toISOString() })
      .eq('id', contractId);

    const { data: clientData } = await supabase
      .from('contracts')
      .select('client_id')
      .eq('id', contractId)
      .single();

    if (clientData) {
      await supabase.from('activity_log').insert({
        action: 'contract_sent',
        client_id: clientData.client_id,
        details: { contract_id: contractId, recipient: recipientEmail, business_name: businessName },
        performed_by: 'admin',
      });
    }

    return new Response(JSON.stringify({ success: true, emailId: emailResult.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
