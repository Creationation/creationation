-- Add Stripe-related columns to clients
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS stripe_customer_id text;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS stripe_subscription_id text;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS stripe_next_payment_date date;

-- Add source column to invoices
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS source text DEFAULT 'manual';