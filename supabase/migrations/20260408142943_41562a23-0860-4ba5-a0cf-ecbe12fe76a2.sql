
CREATE TABLE public.company_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name text NOT NULL DEFAULT 'Creationation',
  legal_name text NOT NULL DEFAULT 'Diego Renard',
  address text NOT NULL DEFAULT 'Langobardenstraße 189/4/1',
  zip_code text NOT NULL DEFAULT '1220',
  city text NOT NULL DEFAULT 'Wien',
  country text NOT NULL DEFAULT 'Österreich',
  email text NOT NULL DEFAULT 'hello@creationation.app',
  phone text,
  website text NOT NULL DEFAULT 'creationation.app',
  logo_url text,
  has_tax_number boolean NOT NULL DEFAULT false,
  tax_number text,
  has_vat_number boolean NOT NULL DEFAULT false,
  vat_number text,
  has_company_registration boolean NOT NULL DEFAULT false,
  company_registration text,
  tax_note text NOT NULL DEFAULT 'Diese Leistung wurde als Privatleistung ohne Umsatzsteuerausweis erbracht. Eine Steuernummer ist derzeit nicht vorhanden. Die Einnahmen werden im Rahmen der persönlichen Steuererklärung angegeben, sobald die gesetzlichen Voraussetzungen erfüllt sind.',
  bank_name text,
  iban text,
  bic text,
  account_holder text NOT NULL DEFAULT 'Diego Renard',
  invoice_country text NOT NULL DEFAULT 'austria',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage company_settings"
  ON public.company_settings FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Insert default row
INSERT INTO public.company_settings (id) VALUES (gen_random_uuid());

-- Trigger for updated_at
CREATE TRIGGER update_company_settings_updated_at
  BEFORE UPDATE ON public.company_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
