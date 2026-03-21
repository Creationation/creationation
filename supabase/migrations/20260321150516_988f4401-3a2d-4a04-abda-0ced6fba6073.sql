
-- Enum tracking_event
CREATE TYPE public.tracking_event AS ENUM ('sent', 'opened', 'clicked', 'replied', 'bounced', 'unsubscribed');

-- Table email_sequences
CREATE TABLE public.email_sequences (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  sector text,
  language text DEFAULT 'fr',
  steps jsonb NOT NULL,
  is_active boolean DEFAULT true,
  total_enrolled integer DEFAULT 0,
  total_converted integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.email_sequences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage email_sequences" ON public.email_sequences FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Table email_tracking
CREATE TABLE public.email_tracking (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  prospect_id uuid REFERENCES public.prospects(id) ON DELETE CASCADE,
  email_id uuid REFERENCES public.prospect_emails(id) ON DELETE CASCADE,
  event_type tracking_event NOT NULL,
  event_data jsonb,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.email_tracking ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage email_tracking" ON public.email_tracking FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Table prospect_tags
CREATE TABLE public.prospect_tags (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  color text DEFAULT '#6B7280',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.prospect_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage prospect_tags" ON public.prospect_tags FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Table sector_templates
CREATE TABLE public.sector_templates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  sector text NOT NULL,
  sector_label text NOT NULL,
  icon text,
  pitch_points jsonb,
  email_templates jsonb,
  audit_criteria jsonb,
  avg_deal_value numeric(10,2),
  conversion_rate numeric(5,2),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.sector_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage sector_templates" ON public.sector_templates FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Table saved_searches
CREATE TABLE public.saved_searches (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  filters jsonb NOT NULL,
  result_count integer DEFAULT 0,
  last_run_at timestamptz,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage saved_searches" ON public.saved_searches FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Add new columns to prospects
ALTER TABLE public.prospects
  ADD COLUMN IF NOT EXISTS score integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS score_breakdown jsonb,
  ADD COLUMN IF NOT EXISTS score_updated_at timestamptz,
  ADD COLUMN IF NOT EXISTS sector text,
  ADD COLUMN IF NOT EXISTS company_size text,
  ADD COLUMN IF NOT EXISTS last_contacted_at timestamptz,
  ADD COLUMN IF NOT EXISTS contact_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sequence_id uuid REFERENCES public.email_sequences(id),
  ADD COLUMN IF NOT EXISTS sequence_step integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sequence_paused boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS competitor_site_url text,
  ADD COLUMN IF NOT EXISTS competitor_audit jsonb,
  ADD COLUMN IF NOT EXISTS tags text[];

-- Triggers
CREATE TRIGGER set_email_sequences_updated_at BEFORE UPDATE ON public.email_sequences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER set_sector_templates_updated_at BEFORE UPDATE ON public.sector_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.email_sequences;
ALTER PUBLICATION supabase_realtime ADD TABLE public.email_tracking;
