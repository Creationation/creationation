import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not set");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Verify admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Not authenticated");

    // Check admin role
    const { data: roleData } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleData) throw new Error("Not authorized");

    const { clientId, clientEmail, clientName, setupPrice, monthlyPrice, includeSetup, message } = await req.json();

    if (!clientId || !clientEmail) throw new Error("Missing clientId or clientEmail");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Find or create Stripe customer
    const customers = await stripe.customers.list({ email: clientEmail, limit: 1 });
    let customerId: string;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        email: clientEmail,
        name: clientName || clientEmail,
        metadata: { creationation_client_id: clientId },
      });
      customerId = customer.id;
    }

    // Update client with stripe_customer_id
    await supabaseClient
      .from("clients")
      .update({ stripe_customer_id: customerId } as any)
      .eq("id", clientId);

    // Build line items
    const lineItems: any[] = [];

    if (includeSetup && setupPrice > 0) {
      // Create a one-time price for setup
      const setupPriceObj = await stripe.prices.create({
        currency: "eur",
        unit_amount: Math.round(setupPrice * 100),
        product: "prod_UIZyobWHVYPmof", // Creationation Setup
      });
      lineItems.push({ price: setupPriceObj.id, quantity: 1 });
    }

    // Create a recurring price for monthly
    const monthlyPriceObj = await stripe.prices.create({
      currency: "eur",
      unit_amount: Math.round(monthlyPrice * 100),
      recurring: { interval: "month" },
      product: "prod_UCwyEwB8stKJVH", // Creationation Basic Membership
    });
    lineItems.push({ price: monthlyPriceObj.id, quantity: 1 });

    const origin = req.headers.get("origin") || "https://creationation.lovable.app";

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: lineItems,
      mode: "subscription",
      success_url: `${origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/payment/cancelled`,
      metadata: {
        creationation_client_id: clientId,
        include_setup: includeSetup ? "true" : "false",
        setup_price: String(setupPrice),
        monthly_price: String(monthlyPrice),
      },
      subscription_data: {
        metadata: {
          creationation_client_id: clientId,
        },
      },
    });

    // Log activity
    await supabaseClient.from("activity_log").insert({
      action: "payment_link_sent",
      client_id: clientId,
      performed_by: "admin",
      details: {
        checkout_url: session.url,
        setup_price: includeSetup ? setupPrice : 0,
        monthly_price: monthlyPrice,
        message: message || null,
      },
    });

    // Send email via Resend
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (resendKey && clientEmail) {
      const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

      if (LOVABLE_API_KEY) {
        const setupLine = includeSetup ? `<li>Setup: <strong>${setupPrice}€</strong> (paiement unique)</li>` : '';
        const customMessage = message ? `<p style="margin:20px 0;padding:15px;background:#f0fdf4;border-radius:12px;color:#1a2332;">${message}</p>` : '';

        const html = `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:30px;">
          <div style="text-align:center;margin-bottom:30px;">
            <h1 style="color:#2A9D8F;font-size:28px;margin:0;">Creationation</h1>
          </div>
          <h2 style="color:#1a2332;">Bonjour ${clientName || ''},</h2>
          <p style="color:#555;line-height:1.6;">Votre lien de paiement est prêt ! Voici le récapitulatif :</p>
          <ul style="color:#555;line-height:2;">
            ${setupLine}
            <li>Abonnement mensuel: <strong>${monthlyPrice}€/mois</strong></li>
          </ul>
          ${customMessage}
          <div style="text-align:center;margin:30px 0;">
            <a href="${session.url}" style="background:#2A9D8F;color:white;padding:14px 40px;border-radius:50px;text-decoration:none;font-weight:bold;font-size:16px;">
              Procéder au paiement
            </a>
          </div>
          <p style="color:#999;font-size:12px;text-align:center;margin-top:40px;">
            Ce lien est sécurisé et expire dans 24h. © Creationation
          </p>
        </div>`;

        await fetch(`${GATEWAY_URL}/emails`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "X-Connection-Api-Key": resendKey,
          },
          body: JSON.stringify({
            from: "Creationation <hello@creationation.app>",
            to: [clientEmail],
            subject: "Votre lien de paiement Creationation",
            html,
          }),
        });
      }
    }

    return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Error in create-checkout:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
