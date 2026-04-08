
-- Add hero media fields
ALTER TABLE public.demos
  ADD COLUMN IF NOT EXISTS hero_media_type text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS hero_media_url text,
  ADD COLUMN IF NOT EXISTS background_video_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS background_video_url text,
  ADD COLUMN IF NOT EXISTS gallery_images jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS generated_descriptions jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS generation_status text NOT NULL DEFAULT 'draft';
