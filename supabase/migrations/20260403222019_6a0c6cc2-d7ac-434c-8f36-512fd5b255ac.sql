ALTER TABLE public.portfolio_projects
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS challenge_fr text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS challenge_en text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS challenge_de text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS solution_fr text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS solution_en text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS solution_de text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS results_fr text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS results_en text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS results_de text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS client_brief_fr text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS client_brief_en text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS client_brief_de text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS tech_stack text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS gallery_urls text[] NOT NULL DEFAULT '{}';

CREATE UNIQUE INDEX IF NOT EXISTS idx_portfolio_projects_slug ON public.portfolio_projects(slug) WHERE slug IS NOT NULL;