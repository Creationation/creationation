
CREATE TABLE public.search_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  continent text,
  country text,
  city text,
  business_type text NOT NULL,
  results_count integer NOT NULL DEFAULT 0,
  mode text NOT NULL DEFAULT 'standard',
  cost_eur numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.search_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage search_chunks" ON public.search_chunks
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_search_chunks_lookup ON public.search_chunks (country, city, business_type);
