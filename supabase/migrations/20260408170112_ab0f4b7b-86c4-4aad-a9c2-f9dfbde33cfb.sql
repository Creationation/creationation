
-- Create enums
CREATE TYPE public.demo_template_type AS ENUM ('beauty', 'coiffeur', 'restaurant', 'nail', 'generic');
CREATE TYPE public.demo_status AS ENUM ('draft', 'sent', 'viewed', 'converted', 'expired');

-- Create demos table
CREATE TABLE public.demos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_name text NOT NULL,
  business_type text,
  contact_name text,
  contact_email text,
  contact_phone text,
  logo_url text,
  primary_color text NOT NULL DEFAULT '#2A9D8F',
  secondary_color text NOT NULL DEFAULT '#E9C46A',
  tagline text,
  services jsonb DEFAULT '[]'::jsonb,
  address text,
  city text DEFAULT 'Wien',
  phone text,
  opening_hours jsonb DEFAULT '{}'::jsonb,
  template_type public.demo_template_type NOT NULL DEFAULT 'generic',
  access_token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  is_active boolean NOT NULL DEFAULT true,
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '7 days'),
  viewed_count integer NOT NULL DEFAULT 0,
  last_viewed_at timestamp with time zone,
  notes text,
  status public.demo_status NOT NULL DEFAULT 'draft',
  converted_to_client_id uuid REFERENCES public.clients(id),
  prospect_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.demos ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "Admins manage demos"
  ON public.demos FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Public read access for active demos via token (for the public demo page)
CREATE POLICY "Public can read active demos by token"
  ON public.demos FOR SELECT
  TO anon
  USING (is_active = true AND expires_at > now());

-- Allow anon to update view count
CREATE POLICY "Anon can update demo view stats"
  ON public.demos FOR UPDATE
  TO anon
  USING (is_active = true AND expires_at > now())
  WITH CHECK (is_active = true AND expires_at > now());

-- Updated_at trigger
CREATE TRIGGER update_demos_updated_at
  BEFORE UPDATE ON public.demos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for demo logos
INSERT INTO storage.buckets (id, name, public) VALUES ('demo-logos', 'demo-logos', true);

CREATE POLICY "Anyone can view demo logos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'demo-logos');

CREATE POLICY "Admins can upload demo logos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'demo-logos' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete demo logos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'demo-logos' AND public.has_role(auth.uid(), 'admin'));
