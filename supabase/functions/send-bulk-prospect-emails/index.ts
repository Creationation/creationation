import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!RESEND_API_KEY) {
    return new Response(JSON.stringify({ error: 'RESEND_API_KEY not configured' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { emails, userId } = await req.json();
    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return new Response(JSON.stringify({ error: 'emails array is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    const results: Array<{ prospectId: string; success: boolean; error?: string }> = [];

    for (const email of emails) {
      if (!email.to || !email.subject || !email.body) {
        results.push({ prospectId: email.prospectId, success: false, error: 'Missing to/subject/body' });
        continue;
      }

      const firstName = email.toName?.split(' ')[0] || '';
      const html = buildEmailHtml(firstName, email.subject, email.body);

      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'Creationation <info@ugcpanel.app>',
          to: [email.to],
          subject: email.subject,
          html,
        }),
      });

      const resendData = await resendRes.json();

      if (!resendRes.ok) {
        results.push({ prospectId: email.prospectId, success: false, error: JSON.stringify(resendData) });
        continue;
      }

      await supabase.from('prospect_emails').insert({
        prospect_id: email.prospectId,
        user_id: userId,
        subject: email.subject,
        body: email.body,
      });

      const { data: curr } = await supabase.from('prospects').select('email_count').eq('id', email.prospectId).single();
      await supabase.from('prospects').update({
        status: 'emailed',
        last_emailed_at: new Date().toISOString(),
        email_count: (curr?.email_count || 0) + 1,
      }).eq('id', email.prospectId);

      results.push({ prospectId: email.prospectId, success: true });
    }

    const sent = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    return new Response(JSON.stringify({ results, sent, failed }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function buildEmailHtml(firstName: string, subject: string, body: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5f2ec;font-family:Georgia,serif;">
  <div style="max-width:600px;margin:0 auto;padding:24px;">
    <div style="border-radius:28px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,0.08);">
      <div style="background:#0d8a6f;padding:36px 24px;text-align:center;">
        <p style="margin:0 0 4px;font-size:11px;letter-spacing:3px;color:rgba(255,255,255,0.7);font-family:'Courier New',monospace;text-transform:uppercase;">DIGITAL PRODUCT STUDIO</p>
        <h1 style="margin:0;font-size:28px;color:#fff;font-family:Georgia,serif;letter-spacing:1px;">CREATIONATION</h1>
      </div>
      <div style="background:#fff;padding:40px 32px;">
        <div style="font-size:15px;color:#2a2722;line-height:1.8;font-family:Georgia,serif;">${body}</div>
        <hr style="border:none;border-top:1px solid #f0ece6;margin:32px 0;"/>
        <div style="text-align:center;">
          <a href="https://wa.me/33612345678" style="display:inline-block;padding:14px 32px;background:#25D366;color:#fff;text-decoration:none;border-radius:50px;font-family:Arial,sans-serif;font-size:14px;font-weight:600;margin:0 6px 8px;">💬 WhatsApp</a>
          <a href="mailto:info@ugcpanel.app" style="display:inline-block;padding:14px 32px;background:#0d8a6f;color:#fff;text-decoration:none;border-radius:50px;font-family:Arial,sans-serif;font-size:14px;font-weight:600;margin:0 6px 8px;">✉️ E-Mail</a>
        </div>
      </div>
      <div style="padding:24px;text-align:center;background:#f5f2ec;">
        <p style="margin:0;font-size:12px;color:#9b9590;">Creationation · Digital Product Studio · Avec passion</p>
        <p style="margin:8px 0 0;font-size:11px;color:#bbb;">Vous recevez cet email car nous pensons pouvoir vous aider a developper votre activite en ligne.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}
