import { corsHeaders } from '@supabase/supabase-js/cors';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

    const { contractId, recipientEmail, businessName, customMessage } = await req.json();

    if (!contractId || !recipientEmail || !businessName) {
      return new Response(JSON.stringify({ error: 'Missing required fields: contractId, recipientEmail, businessName' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch the contract to get document_url
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select('*')
      .eq('id', contractId)
      .single();

    if (contractError || !contract) {
      return new Response(JSON.stringify({ error: 'Contract not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const pdfUrl = contract.document_url;
    const defaultMessage = customMessage || `Bonjour,\n\nVeuillez trouver ci-joint votre contrat de prestation de services web avec Creationation.\n\nN'hésitez pas à nous contacter pour toute question.\n\nCordialement,\nL'équipe Creationation`;

    const emailHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb;">
  <div style="background: white; border-radius: 16px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
    <div style="text-align: center; margin-bottom: 24px; border-bottom: 2px solid #2A9D8F; padding-bottom: 16px;">
      <div style="display: inline-block; width: 48px; height: 48px; border-radius: 50%; background: linear-gradient(135deg, #2A9D8F, #264653); color: white; font-size: 22px; font-weight: bold; line-height: 48px; text-align: center;">C</div>
      <h1 style="margin: 8px 0 0; font-size: 20px; color: #1A2332;">Creationation</h1>
    </div>
    <h2 style="font-size: 18px; color: #1A2332; margin-bottom: 16px;">Votre contrat</h2>
    <div style="white-space: pre-line; font-size: 14px; line-height: 1.6; color: #333; margin-bottom: 24px;">${defaultMessage.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
    ${pdfUrl ? `
    <div style="text-align: center; margin: 24px 0;">
      <a href="${pdfUrl}" style="display: inline-block; padding: 12px 32px; background: linear-gradient(135deg, #2A9D8F, #264653); color: white; text-decoration: none; border-radius: 999px; font-weight: 600; font-size: 14px;">📄 Voir le contrat PDF</a>
    </div>
    ` : ''}
    <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #eee; text-align: center; font-size: 12px; color: #999;">
      <p>Creationation — Vienne, Autriche</p>
      <p>hello@creationation.app — <a href="https://creationation.app" style="color: #2A9D8F;">creationation.app</a></p>
    </div>
  </div>
</body>
</html>`;

    // Send via Resend
    const emailResponse = await fetch(`${GATEWAY_URL}/emails`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'X-Connection-Api-Key': RESEND_API_KEY,
      },
      body: JSON.stringify({
        from: 'Creationation <hello@creationation.app>',
        to: [recipientEmail],
        subject: `Votre contrat Creationation - ${businessName}`,
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

    // Update contract status to 'sent' and set sent_at
    await supabase
      .from('contracts')
      .update({ status: 'sent', sent_at: new Date().toISOString() })
      .eq('id', contractId);

    // Log the activity
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
