
-- New enums
CREATE TYPE public.message_sender_type AS ENUM ('client', 'team');
CREATE TYPE public.review_status AS ENUM ('pending', 'approved', 'revision_requested');
CREATE TYPE public.notification_type AS ENUM ('project_update', 'message', 'invoice', 'deliverable_review', 'milestone_completed', 'general');

-- Add 'client' to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'client';

-- Add columns to clients
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS portal_user_id uuid,
  ADD COLUMN IF NOT EXISTS portal_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS portal_last_login timestamptz,
  ADD COLUMN IF NOT EXISTS portal_invited_at timestamptz,
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS company_address text,
  ADD COLUMN IF NOT EXISTS company_vat text,
  ADD COLUMN IF NOT EXISTS preferred_language text DEFAULT 'fr';

-- portal_messages
CREATE TABLE public.portal_messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid NOT NULL,
  sender_type message_sender_type NOT NULL,
  content text NOT NULL,
  is_read boolean DEFAULT false,
  read_at timestamptz,
  attachments jsonb,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.portal_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage portal_messages" ON public.portal_messages
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Clients read own portal_messages" ON public.portal_messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.clients c ON c.id = p.client_id
      WHERE p.id = portal_messages.project_id
        AND c.portal_user_id = auth.uid()
        AND c.portal_enabled = true
    )
  );

CREATE POLICY "Clients insert own portal_messages" ON public.portal_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_type = 'client'
    AND sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.clients c ON c.id = p.client_id
      WHERE p.id = portal_messages.project_id
        AND c.portal_user_id = auth.uid()
        AND c.portal_enabled = true
    )
  );

ALTER PUBLICATION supabase_realtime ADD TABLE public.portal_messages;

-- deliverable_reviews
CREATE TABLE public.deliverable_reviews (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  milestone_id uuid REFERENCES public.project_milestones(id),
  title text NOT NULL,
  description text,
  status review_status NOT NULL DEFAULT 'pending',
  file_urls jsonb,
  client_comment text,
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.deliverable_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage deliverable_reviews" ON public.deliverable_reviews
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Clients read own deliverable_reviews" ON public.deliverable_reviews
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.clients c ON c.id = p.client_id
      WHERE p.id = deliverable_reviews.project_id
        AND c.portal_user_id = auth.uid()
    )
  );

CREATE POLICY "Clients update own deliverable_reviews" ON public.deliverable_reviews
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.clients c ON c.id = p.client_id
      WHERE p.id = deliverable_reviews.project_id
        AND c.portal_user_id = auth.uid()
    )
  );

-- portal_notifications
CREATE TABLE public.portal_notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  type notification_type NOT NULL,
  title text NOT NULL,
  message text,
  link text,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.portal_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage portal_notifications" ON public.portal_notifications
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Clients read own notifications" ON public.portal_notifications
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = portal_notifications.client_id
        AND c.portal_user_id = auth.uid()
    )
  );

CREATE POLICY "Clients update own notifications" ON public.portal_notifications
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = portal_notifications.client_id
        AND c.portal_user_id = auth.uid()
    )
  );

-- client_feedback
CREATE TABLE public.client_feedback (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  rating integer NOT NULL,
  comment text,
  submitted_at timestamptz DEFAULT now()
);
ALTER TABLE public.client_feedback ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.validate_feedback_rating()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.rating < 1 OR NEW.rating > 5 THEN
    RAISE EXCEPTION 'Rating must be between 1 and 5';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_feedback_rating
  BEFORE INSERT OR UPDATE ON public.client_feedback
  FOR EACH ROW EXECUTE FUNCTION public.validate_feedback_rating();

CREATE POLICY "Admins manage client_feedback" ON public.client_feedback
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Clients insert own feedback" ON public.client_feedback
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = client_feedback.client_id
        AND c.portal_user_id = auth.uid()
    )
  );

CREATE POLICY "Clients read own feedback" ON public.client_feedback
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = client_feedback.client_id
        AND c.portal_user_id = auth.uid()
    )
  );

-- Client can read own record
CREATE POLICY "Clients read own client" ON public.clients
  FOR SELECT TO authenticated
  USING (portal_user_id = auth.uid() AND portal_enabled = true);

-- Client can update own record
CREATE POLICY "Clients update own client" ON public.clients
  FOR UPDATE TO authenticated
  USING (portal_user_id = auth.uid() AND portal_enabled = true);

-- Client can read own projects
CREATE POLICY "Clients read own projects" ON public.projects
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = projects.client_id
        AND c.portal_user_id = auth.uid()
        AND c.portal_enabled = true
    )
  );

-- Client can read own project_tasks
CREATE POLICY "Clients read own project_tasks" ON public.project_tasks
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.clients c ON c.id = p.client_id
      WHERE p.id = project_tasks.project_id
        AND c.portal_user_id = auth.uid()
    )
  );

-- Client can read own project_milestones
CREATE POLICY "Clients read own project_milestones" ON public.project_milestones
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.clients c ON c.id = p.client_id
      WHERE p.id = project_milestones.project_id
        AND c.portal_user_id = auth.uid()
    )
  );

-- Client can read own project_files
CREATE POLICY "Clients read own project_files" ON public.project_files
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.clients c ON c.id = p.client_id
      WHERE p.id = project_files.project_id
        AND c.portal_user_id = auth.uid()
    )
  );

-- Client can read own invoices
CREATE POLICY "Clients read own invoices" ON public.invoices
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = invoices.client_id
        AND c.portal_user_id = auth.uid()
    )
  );

-- Client can read own invoice_items
CREATE POLICY "Clients read own invoice_items" ON public.invoice_items
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.invoices i
      JOIN public.clients c ON c.id = i.client_id
      WHERE i.id = invoice_items.invoice_id
        AND c.portal_user_id = auth.uid()
    )
  );

-- Storage bucket for client uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('client-uploads', 'client-uploads', false);

CREATE POLICY "Clients upload own files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'client-uploads'
    AND EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.portal_user_id = auth.uid()
        AND c.portal_enabled = true
        AND (storage.foldername(name))[1] = c.id::text
    )
  );

CREATE POLICY "Clients read own uploads" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'client-uploads'
    AND EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.portal_user_id = auth.uid()
        AND (storage.foldername(name))[1] = c.id::text
    )
  );

CREATE POLICY "Admins manage client-uploads" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'client-uploads' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'client-uploads' AND public.has_role(auth.uid(), 'admin'));
