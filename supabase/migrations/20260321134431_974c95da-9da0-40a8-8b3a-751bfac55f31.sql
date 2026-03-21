
-- Enum: invoice_status
CREATE TYPE public.invoice_status AS ENUM ('draft', 'sent', 'viewed', 'paid', 'partially_paid', 'overdue', 'cancelled', 'refunded');

-- Enum: recurring_frequency
CREATE TYPE public.recurring_frequency AS ENUM ('weekly', 'monthly', 'quarterly', 'yearly');

-- Table: invoices
CREATE TABLE public.invoices (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number text NOT NULL UNIQUE,
  client_id uuid REFERENCES public.clients(id) ON DELETE RESTRICT NOT NULL,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  status public.invoice_status NOT NULL DEFAULT 'draft',
  issue_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date NOT NULL,
  paid_at timestamptz,
  currency text NOT NULL DEFAULT 'EUR',
  subtotal numeric(10,2) NOT NULL DEFAULT 0,
  tax_rate numeric(5,2) NOT NULL DEFAULT 0,
  tax_amount numeric(10,2) NOT NULL DEFAULT 0,
  total numeric(10,2) NOT NULL DEFAULT 0,
  amount_paid numeric(10,2) NOT NULL DEFAULT 0,
  notes text,
  internal_notes text,
  payment_method text,
  stripe_invoice_id text,
  stripe_payment_url text,
  stripe_hosted_url text,
  reminder_sent_at timestamptz,
  reminder_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table: invoice_items
CREATE TABLE public.invoice_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id uuid REFERENCES public.invoices(id) ON DELETE CASCADE NOT NULL,
  description text NOT NULL,
  quantity numeric(10,2) NOT NULL DEFAULT 1,
  unit_price numeric(10,2) NOT NULL,
  total numeric(10,2) NOT NULL,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Table: invoice_templates
CREATE TABLE public.invoice_templates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  default_items jsonb,
  default_notes text,
  default_tax_rate numeric(5,2) DEFAULT 0,
  payment_terms_days integer DEFAULT 14,
  created_at timestamptz DEFAULT now()
);

-- Table: recurring_invoices
CREATE TABLE public.recurring_invoices (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  template_id uuid REFERENCES public.invoice_templates(id),
  frequency public.recurring_frequency NOT NULL DEFAULT 'monthly',
  amount numeric(10,2) NOT NULL,
  description text NOT NULL,
  tax_rate numeric(5,2) DEFAULT 0,
  is_active boolean DEFAULT true,
  next_invoice_date date NOT NULL,
  last_invoiced_at timestamptz,
  stripe_subscription_id text,
  stripe_price_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table: payment_history
CREATE TABLE public.payment_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id uuid REFERENCES public.invoices(id) ON DELETE CASCADE NOT NULL,
  amount numeric(10,2) NOT NULL,
  payment_method text,
  payment_date timestamptz NOT NULL DEFAULT now(),
  stripe_payment_intent_id text,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Function: generate_invoice_number
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  current_year text := EXTRACT(YEAR FROM CURRENT_DATE)::text;
  next_number integer;
BEGIN
  SELECT COALESCE(MAX(
    CAST(SPLIT_PART(invoice_number, '-', 3) AS integer)
  ), 0) + 1
  INTO next_number
  FROM public.invoices
  WHERE invoice_number LIKE 'CN-' || current_year || '-%';
  RETURN 'CN-' || current_year || '-' || LPAD(next_number::text, 4, '0');
END;
$$;

-- Trigger: auto invoice number
CREATE OR REPLACE FUNCTION public.auto_invoice_number()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
    NEW.invoice_number := public.generate_invoice_number();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_invoice_number
BEFORE INSERT ON public.invoices
FOR EACH ROW EXECUTE FUNCTION public.auto_invoice_number();

-- Trigger: recalculate invoice totals
CREATE OR REPLACE FUNCTION public.recalculate_invoice_totals()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  inv_id uuid;
  new_subtotal numeric(10,2);
  inv_tax_rate numeric(5,2);
BEGIN
  IF TG_OP = 'DELETE' THEN
    inv_id := OLD.invoice_id;
  ELSE
    inv_id := NEW.invoice_id;
  END IF;

  SELECT COALESCE(SUM(total), 0) INTO new_subtotal FROM public.invoice_items WHERE invoice_id = inv_id;
  SELECT tax_rate INTO inv_tax_rate FROM public.invoices WHERE id = inv_id;

  UPDATE public.invoices
  SET subtotal = new_subtotal,
      tax_amount = ROUND(new_subtotal * (COALESCE(inv_tax_rate, 0) / 100), 2),
      total = new_subtotal + ROUND(new_subtotal * (COALESCE(inv_tax_rate, 0) / 100), 2)
  WHERE id = inv_id;

  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$;

CREATE TRIGGER trg_recalculate_invoice_totals
AFTER INSERT OR UPDATE OR DELETE ON public.invoice_items
FOR EACH ROW EXECUTE FUNCTION public.recalculate_invoice_totals();

-- Trigger: updated_at on invoices
CREATE TRIGGER trg_invoices_updated_at
BEFORE UPDATE ON public.invoices
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: updated_at on recurring_invoices
CREATE TRIGGER trg_recurring_invoices_updated_at
BEFORE UPDATE ON public.recurring_invoices
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage invoices" ON public.invoices FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage invoice_items" ON public.invoice_items FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage invoice_templates" ON public.invoice_templates FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage recurring_invoices" ON public.recurring_invoices FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage payment_history" ON public.payment_history FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Seed invoice templates
INSERT INTO public.invoice_templates (name, default_items, default_notes, default_tax_rate, payment_terms_days) VALUES
('Standard', '[{"description":"Développement web — forfait projet","quantity":1,"unit_price":0}]', 'Paiement attendu sous 14 jours. Merci pour votre confiance.', 0, 14),
('Acompte 50%', '[{"description":"Acompte 50% — projet en cours","quantity":1,"unit_price":0}]', 'Acompte de 50% requis avant le début des travaux. Le solde sera facturé à la livraison.', 0, 7),
('Maintenance mensuelle', '[{"description":"Maintenance et hébergement — forfait mensuel","quantity":1,"unit_price":0},{"description":"Support technique inclus","quantity":1,"unit_price":0}]', 'Facturation mensuelle automatique. Résiliation possible avec préavis de 30 jours.', 0, 7),
('Solde final', '[{"description":"Solde restant — livraison finale du projet","quantity":1,"unit_price":0}]', 'Merci pour votre collaboration. N''hésitez pas à nous contacter pour tout besoin futur.', 0, 14);
