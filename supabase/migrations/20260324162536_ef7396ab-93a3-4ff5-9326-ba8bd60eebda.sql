ALTER TABLE public.portfolio_projects 
ADD COLUMN IF NOT EXISTS tags_en text[] NOT NULL DEFAULT '{}',
ADD COLUMN IF NOT EXISTS tags_de text[] NOT NULL DEFAULT '{}';