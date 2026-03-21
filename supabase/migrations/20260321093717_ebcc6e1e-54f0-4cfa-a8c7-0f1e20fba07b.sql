
-- Clients table: customers transferred from prospects
CREATE TABLE public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id uuid REFERENCES public.prospects(id) ON DELETE SET NULL,
  business_name text NOT NULL,
  contact_name text,
  email text,
  phone text,
  website_url text,
  plan text DEFAULT 'basic',
  status text DEFAULT 'active' CHECK (status IN ('active','paused','churned','trial')),
  monthly_amount numeric DEFAULT 0,
  total_paid numeric DEFAULT 0,
  started_at timestamp with time zone DEFAULT now(),
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage clients" ON public.clients
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Client payments table for expense/revenue tracking
CREATE TABLE public.client_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  amount numeric NOT NULL,
  description text,
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  payment_type text DEFAULT 'monthly' CHECK (payment_type IN ('monthly','one_time','setup','refund')),
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.client_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage client_payments" ON public.client_payments
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Trigger to update updated_at on clients
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
