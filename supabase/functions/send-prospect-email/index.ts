import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const labels = {
  fr: {
    subject: 'Creationation — Nous avons bien reçu votre demande',
    greeting: 'Bonjour',
    intro: 'Merci pour votre intérêt ! Nous avons bien reçu votre demande et reviendrons vers vous sous 24h.',
    recapTitle: 'Récapitulatif de votre demande',
    name: 'Nom',
    email: 'Email',
    phone: 'Téléphone',
    projectType: 'Type de projet',
    budget: 'Budget',
    message: 'Message',
    notProvided: 'Non renseigné',
    closing: 'À très vite,',
    team: "L'équipe Creationation",
  },
  en: {
    subject: 'Creationation — We received your request',
    greeting: 'Hello',
    intro: 'Thank you for your interest! We received your request and will get back to you within 24 hours.',
    recapTitle: 'Your request summary',
    name: 'Name',
    email: 'Email',
    phone: 'Phone',
    projectType: 'Project type',
    budget: 'Budget',
    message: 'Message',
    notProvided: 'Not provided',
    closing: 'Best regards,',
    team: 'The Creationation Team',
  },
  de: {
    subject: 'Creationation — Wir haben Ihre Anfrage erhalten',
    greeting: 'Hallo',
    intro: 'Vielen Dank für Ihr Interesse! Wir haben Ihre Anfrage erhalten und melden uns innerhalb von 24 Stunden bei Ihnen.',
    recapTitle: 'Zusammenfassung Ihrer Anfrage',
    name: 'Name',
    email: 'E-Mail',
    phone: 'Telefon',
    projectType: 'Projekttyp',
    budget: 'Budget',
    message: 'Nachricht',
    notProvided: 'Nicht angegeben',
    closing: 'Mit freundlichen Grüßen,',
    team: 'Das Creationation-Team',
  },
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
  if (!RESEND_API_KEY) {
    return new Response(JSON.stringify({ error: 'RESEND_API_KEY not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { to, toName, lang = 'fr', recap } = await req.json();

    if (!to) {
      return new Response(JSON.stringify({ error: 'Missing required field: to' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const l = labels[lang as keyof typeof labels] || labels.fr;
    const firstName = toName?.split(' ')[0] || '';

    const recapRow = (label: string, value: string | null) => `
      <tr>
        <td style="padding: 10px 14px; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #9b9590; font-family: monospace; width: 120px; vertical-align: top;">${label}</td>
        <td style="padding: 10px 14px; font-size: 15px; color: #2a2722;">${value || l.notProvided}</td>
      </tr>
    `;

    const recapHtml = recap ? `
      <div style="margin-top: 24px; background: #fff; border-radius: 12px; border: 1px solid rgba(0,0,0,0.06); overflow: hidden;">
        <div style="padding: 14px 18px; background: #0d8a6f; color: #fff;">
          <strong style="font-size: 13px; letter-spacing: 0.5px;">${l.recapTitle}</strong>
        </div>
        <table style="width: 100%; border-collapse: collapse;">
          ${recapRow(l.name, recap.name)}
          ${recapRow(l.email, recap.email)}
          ${recapRow(l.phone, recap.phone)}
          ${recapRow(l.projectType, recap.projectTypes)}
          ${recapRow(l.budget, recap.budget)}
          ${recapRow(l.message, recap.message?.replace(/\n/g, '<br/>'))}
        </table>
      </div>
    ` : '';

    const html = `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 24px; color: #2a2722;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="font-size: 24px; color: #0d8a6f; margin: 0;">Creationation</h1>
          <p style="font-size: 12px; color: #9b9590; margin-top: 4px;">Digital Product Studio</p>
        </div>
        <div style="background: #faf7f2; border-radius: 16px; padding: 32px; border: 1px solid rgba(0,0,0,0.06);">
          ${firstName ? `<p style="margin-top: 0;">${l.greeting} ${firstName},</p>` : ''}
          <p style="line-height: 1.7; font-size: 15px; color: #2a2722;">${l.intro}</p>
          ${recapHtml}
          <p style="margin-top: 24px; margin-bottom: 0; line-height: 1.7; font-size: 15px;">${l.closing}<br/>${l.team}</p>
        </div>
        <div style="text-align: center; margin-top: 32px; padding-top: 20px; border-top: 1px solid rgba(0,0,0,0.06);">
          <p style="font-size: 12px; color: #9b9590; margin: 0;">© 2026 Creationation. Digital Product Studio</p>
        </div>
      </div>
    `;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Creationation <onboarding@resend.dev>',
        to: [to],
        subject: l.subject,
        html,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('Resend API error:', data);
      return new Response(JSON.stringify({ error: `Resend error [${res.status}]: ${JSON.stringify(data)}` }), {
        status: res.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
