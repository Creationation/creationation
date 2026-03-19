import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const labels = {
  fr: {
    subject: 'Creationation — Nous avons bien reçu votre demande',
    confirmed: 'Votre demande est confirmée ✓',
    greeting: 'Bonjour',
    intro: 'nous avons bien reçu votre demande et reviendrons vers vous sous 24h.',
    recapTitle: 'Récapitulatif de votre demande',
    name: 'NOM',
    email: 'EMAIL',
    phone: 'TÉLÉPHONE',
    projectType: 'PROJET',
    budget: 'BUDGET',
    message: 'MESSAGE',
    notProvided: '—',
    note: 'Nous reviendrons vers vous très rapidement. En attendant, n\'hésitez pas à nous contacter.',
    whatsapp: 'WhatsApp',
    emailBtn: 'E-Mail',
    contact: 'Une question ? Contactez-nous à tout moment',
    footer: 'Creationation · Digital Product Studio · Avec passion ♡',
  },
  en: {
    subject: 'Creationation — We received your request',
    confirmed: 'Your request is confirmed ✓',
    greeting: 'Hello',
    intro: 'we received your request and will get back to you within 24 hours.',
    recapTitle: 'Your request summary',
    name: 'NAME',
    email: 'EMAIL',
    phone: 'PHONE',
    projectType: 'PROJECT',
    budget: 'BUDGET',
    message: 'MESSAGE',
    notProvided: '—',
    note: 'We\'ll get back to you very soon. In the meantime, feel free to reach out.',
    whatsapp: 'WhatsApp',
    emailBtn: 'E-Mail',
    contact: 'Any questions? Contact us anytime',
    footer: 'Creationation · Digital Product Studio · With passion ♡',
  },
  de: {
    subject: 'Creationation — Wir haben Ihre Anfrage erhalten',
    confirmed: 'Ihre Anfrage ist bestätigt ✓',
    greeting: 'Hallo',
    intro: 'wir haben Ihre Anfrage erhalten und melden uns innerhalb von 24 Stunden bei Ihnen.',
    recapTitle: 'Zusammenfassung Ihrer Anfrage',
    name: 'NAME',
    email: 'E-MAIL',
    phone: 'TELEFON',
    projectType: 'PROJEKT',
    budget: 'BUDGET',
    message: 'NACHRICHT',
    notProvided: '—',
    note: 'Wir melden uns sehr bald bei Ihnen. In der Zwischenzeit können Sie uns jederzeit kontaktieren.',
    whatsapp: 'WhatsApp',
    emailBtn: 'E-Mail',
    contact: 'Fragen? Kontaktieren Sie uns jederzeit',
    footer: 'Creationation · Digital Product Studio · Mit Leidenschaft ♡',
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

    const recapRow = (label: string, value: string | null, isLast = false) => `
      <tr>
        <td style="padding: 14px 20px; font-size: 11px; letter-spacing: 1.5px; color: #0d8a6f; font-family: 'Courier New', monospace; vertical-align: top; border-bottom: ${isLast ? 'none' : '1px solid #f0ece6'};">${label}</td>
        <td style="padding: 14px 20px; font-size: 15px; color: #2a2722; font-weight: 600; text-align: right; vertical-align: top; font-family: Georgia, serif; border-bottom: ${isLast ? 'none' : '1px solid #f0ece6'};">${value || l.notProvided}</td>
      </tr>
    `;

    const rows = recap ? [
      recapRow(l.projectType, recap.projectTypes),
      recapRow(l.name, recap.name),
      recapRow(l.email, recap.email),
      recapRow(l.phone, recap.phone),
      recapRow(l.budget, `<span style="color: #0d8a6f;">${recap.budget || l.notProvided}</span>`),
      recapRow(l.message, recap.message?.replace(/\n/g, '<br/>'), true),
    ].join('') : '';

    const html = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="margin: 0; padding: 0; background: #f5f2ec; font-family: Georgia, serif;">
        <div style="max-width: 600px; margin: 0 auto; padding: 24px;">
          <div style="border-radius: 28px; overflow: hidden; box-shadow: 0 8px 40px rgba(0,0,0,0.08);">
          
          <!-- Header -->
          <div style="background: #0d8a6f; padding: 36px 24px; text-align: center;">
            <p style="margin: 0 0 4px; font-size: 11px; letter-spacing: 3px; color: rgba(255,255,255,0.7); font-family: 'Courier New', monospace; text-transform: uppercase;">DIGITAL PRODUCT STUDIO</p>
            <h1 style="margin: 0; font-size: 28px; color: #fff; font-family: Georgia, serif; letter-spacing: 1px;">CREATIONATION</h1>
          </div>

          <!-- Body -->
          <div style="background: #fff; padding: 40px 32px;">
            
            <!-- Confirmed badge -->
            <h2 style="margin: 0 0 8px; font-size: 22px; color: #2a2722; font-family: Georgia, serif; font-style: italic;">${l.confirmed}</h2>
            <p style="margin: 0 0 28px; font-size: 15px; color: #9b9590; line-height: 1.6;">
              ${firstName ? `${l.greeting} ${firstName}, ` : ''}${l.intro}
            </p>

            ${recap ? `
            <!-- Recap card -->
            <div style="background: #faf7f2; border-radius: 20px; border: 1px solid #f0ece6; overflow: hidden; margin-bottom: 28px;">
              <table style="width: 100%; border-collapse: collapse;">
                ${rows}
              </table>
            </div>
            ` : ''}

            <!-- Note -->
            <p style="margin: 0 0 24px; font-size: 14px; color: #9b9590; text-align: center; line-height: 1.6;">${l.note}</p>

            <!-- CTA Buttons -->
            <div style="text-align: center; margin-bottom: 8px;">
              <a href="https://wa.me/33612345678" style="display: inline-block; padding: 14px 32px; background: #25D366; color: #fff; text-decoration: none; border-radius: 50px; font-family: Arial, sans-serif; font-size: 14px; font-weight: 600; margin: 0 6px 8px;">💬 ${l.whatsapp}</a>
              <a href="mailto:info@ugcpanel.app" style="display: inline-block; padding: 14px 32px; background: #0d8a6f; color: #fff; text-decoration: none; border-radius: 50px; font-family: Arial, sans-serif; font-size: 14px; font-weight: 600; margin: 0 6px 8px;">✉️ ${l.emailBtn}</a>
            </div>
            <p style="margin: 0; font-size: 12px; color: #bbb; text-align: center;">${l.contact}</p>
          </div>

          <!-- Footer -->
          <div style="padding: 24px; text-align: center;">
            <p style="margin: 0; font-size: 12px; color: #9b9590;">${l.footer}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Creationation <info@ugcpanel.app>',
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
