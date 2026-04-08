import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  if (!stripeKey) {
    return new Response("STRIPE_SECRET_KEY not set", { status: 500 });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

  let event: Stripe.Event;

  try {
    if (webhookSecret && sig) {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } else {
      // Fallback: parse body directly (dev mode)
      event = JSON.parse(body) as Stripe.Event;
    }
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return new Response(`Webhook Error: ${err}`, { status: 400 });
  }

  console.log(`[STRIPE WEBHOOK] Event: ${event.type}, ID: ${event.id}`);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const clientId = session.metadata?.creationation_client_id;
        const includeSetup = session.metadata?.include_setup === "true";
        const setupPrice = parseFloat(session.metadata?.setup_price || "0");
        const monthlyPrice = parseFloat(session.metadata?.monthly_price || "0");

        if (!clientId) {
          console.log("No client ID in metadata, skipping");
          break;
        }

        // Update client status
        const updateData: any = {
          subscription_status: "active",
          status: "active",
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: session.subscription as string,
        };

        await supabase.from("clients").update(updateData).eq("id", clientId);

        // Get client info
        const { data: clientData } = await supabase
          .from("clients")
          .select("business_name, monthly_amount")
          .eq("id", clientId)
          .single();

        // Update monthly_amount
        if (monthlyPrice > 0) {
          await supabase.from("clients").update({ monthly_amount: monthlyPrice } as any).eq("id", clientId);
        }

        // Create setup invoice if applicable
        if (includeSetup && setupPrice > 0) {
          await supabase.from("invoices").insert({
            client_id: clientId,
            invoice_number: "",
            due_date: new Date().toISOString().split("T")[0],
            issue_date: new Date().toISOString().split("T")[0],
            subtotal: setupPrice,
            total: setupPrice,
            amount_paid: setupPrice,
            status: "paid" as any,
            paid_at: new Date().toISOString(),
            notes: "Setup fee - Creationation",
            source: "stripe" as any,
            payment_method: "stripe",
          });
        }

        // Log activity
        await supabase.from("activity_log").insert({
          action: "payment_received",
          client_id: clientId,
          performed_by: "system",
          details: {
            event: "checkout.session.completed",
            setup_amount: includeSetup ? setupPrice : 0,
            monthly_amount: monthlyPrice,
            stripe_session_id: session.id,
          },
        });

        // Create notification
        await supabase.from("portal_notifications").insert({
          client_id: clientId,
          type: "project_update",
          title: `Paiement reçu de ${clientData?.business_name || "Client"}`,
          message: `Paiement de ${includeSetup ? setupPrice + monthlyPrice : monthlyPrice}€ confirmé via Stripe.`,
        });

        console.log(`[STRIPE] Checkout completed for client ${clientId}`);
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        // Find client by stripe_customer_id
        const { data: client } = await supabase
          .from("clients")
          .select("id, business_name")
          .eq("stripe_customer_id" as any, customerId)
          .maybeSingle();

        if (!client) {
          console.log("No client found for customer:", customerId);
          break;
        }

        // Get subscription to find next payment date
        if (invoice.subscription) {
          const sub = await stripe.subscriptions.retrieve(invoice.subscription as string);
          await supabase.from("clients").update({
            stripe_next_payment_date: new Date(sub.current_period_end * 1000).toISOString().split("T")[0],
          } as any).eq("id", client.id);
        }

        // Only create invoice for recurring payments (not the first checkout)
        if (invoice.billing_reason === "subscription_cycle") {
          const amount = (invoice.amount_paid || 0) / 100;
          await supabase.from("invoices").insert({
            client_id: client.id,
            invoice_number: "",
            due_date: new Date().toISOString().split("T")[0],
            issue_date: new Date().toISOString().split("T")[0],
            subtotal: amount,
            total: amount,
            amount_paid: amount,
            status: "paid" as any,
            paid_at: new Date().toISOString(),
            notes: "Monthly membership - Creationation",
            source: "stripe" as any,
            payment_method: "stripe",
            stripe_invoice_id: invoice.id,
          });

          await supabase.from("activity_log").insert({
            action: "recurring_payment_received",
            client_id: client.id,
            performed_by: "system",
            details: { amount, stripe_invoice_id: invoice.id },
          });
        }

        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        const { data: client } = await supabase
          .from("clients")
          .select("id, business_name")
          .eq("stripe_customer_id" as any, customerId)
          .maybeSingle();

        if (client) {
          await supabase.from("clients").update({
            subscription_status: "past_due",
          } as any).eq("id", client.id);

          await supabase.from("portal_notifications").insert({
            client_id: client.id,
            type: "project_update",
            title: `Paiement échoué pour ${client.business_name}`,
            message: "Le paiement mensuel a échoué. Veuillez mettre à jour vos informations de paiement.",
          });

          await supabase.from("activity_log").insert({
            action: "payment_failed",
            client_id: client.id,
            performed_by: "system",
            details: { stripe_invoice_id: invoice.id },
          });

          console.log(`[STRIPE] Payment failed for client ${client.id}`);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const { data: client } = await supabase
          .from("clients")
          .select("id, business_name")
          .eq("stripe_customer_id" as any, customerId)
          .maybeSingle();

        if (client) {
          await supabase.from("clients").update({
            subscription_status: "cancelled",
            stripe_subscription_id: null,
          } as any).eq("id", client.id);

          await supabase.from("portal_notifications").insert({
            client_id: client.id,
            type: "project_update",
            title: `Abonnement annulé pour ${client.business_name}`,
            message: "L'abonnement mensuel a été annulé.",
          });

          await supabase.from("activity_log").insert({
            action: "subscription_cancelled",
            client_id: client.id,
            performed_by: "system",
            details: { stripe_subscription_id: subscription.id },
          });

          console.log(`[STRIPE] Subscription cancelled for client ${client.id}`);
        }
        break;
      }
    }
  } catch (err) {
    console.error(`[STRIPE WEBHOOK] Error processing ${event.type}:`, err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
});
