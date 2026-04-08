
-- Create enum for template categories
CREATE TYPE public.demo_template_category AS ENUM ('beauty', 'coiffeur', 'restaurant', 'nail', 'spa', 'barber', 'fitness', 'other');

-- Create enum for hero media types
CREATE TYPE public.hero_media_type AS ENUM ('none', 'photo', 'youtube', 'mp4', 'ai_generated');

-- Create demo_templates table
CREATE TABLE public.demo_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category public.demo_template_category NOT NULL DEFAULT 'other',
  description TEXT,
  style_prompt TEXT,
  jsx_file_url TEXT,
  screenshots JSONB NOT NULL DEFAULT '[]'::jsonb,
  preview_url TEXT,
  default_services JSONB NOT NULL DEFAULT '[]'::jsonb,
  default_opening_hours JSONB NOT NULL DEFAULT '{}'::jsonb,
  primary_color TEXT NOT NULL DEFAULT '#2A9D8F',
  secondary_color TEXT NOT NULL DEFAULT '#E9C46A',
  hero_media_type public.hero_media_type NOT NULL DEFAULT 'none',
  hero_media_url TEXT,
  gallery_images JSONB NOT NULL DEFAULT '[]'::jsonb,
  tagline TEXT,
  style_tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.demo_templates ENABLE ROW LEVEL SECURITY;

-- Admin-only access
CREATE POLICY "Admins manage demo_templates"
ON public.demo_templates
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Updated_at trigger
CREATE TRIGGER update_demo_templates_updated_at
BEFORE UPDATE ON public.demo_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add template_id to demos table
ALTER TABLE public.demos
ADD COLUMN template_id UUID REFERENCES public.demo_templates(id) ON DELETE SET NULL;

-- Create storage bucket for template assets
INSERT INTO storage.buckets (id, name, public) VALUES ('demo-templates', 'demo-templates', true);

-- Storage policies for demo-templates bucket
CREATE POLICY "Admins can upload demo-template assets"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'demo-templates' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update demo-template assets"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'demo-templates' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete demo-template assets"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'demo-templates' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Public can view demo-template assets"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'demo-templates');
