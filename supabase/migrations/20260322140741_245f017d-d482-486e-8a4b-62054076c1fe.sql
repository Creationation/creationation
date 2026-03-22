
CREATE TABLE public.portfolio_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  url text NOT NULL DEFAULT '',
  url_display text NOT NULL DEFAULT '',
  badge text NOT NULL DEFAULT 'demo',
  category text NOT NULL DEFAULT '',
  color text NOT NULL DEFAULT 'teal',
  description_fr text NOT NULL DEFAULT '',
  description_en text NOT NULL DEFAULT '',
  description_de text NOT NULL DEFAULT '',
  tags text[] NOT NULL DEFAULT '{}',
  screenshot_url text,
  video_url text,
  featured boolean NOT NULL DEFAULT false,
  visible boolean NOT NULL DEFAULT true,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.portfolio_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage portfolio_projects" ON public.portfolio_projects
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Public can read visible portfolio_projects" ON public.portfolio_projects
  FOR SELECT TO anon, authenticated
  USING (visible = true);
