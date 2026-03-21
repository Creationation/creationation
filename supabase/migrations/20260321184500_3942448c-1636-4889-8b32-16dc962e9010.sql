-- Create storage bucket for project files
INSERT INTO storage.buckets (id, name, public) VALUES ('project-files', 'project-files', false) ON CONFLICT DO NOTHING;

-- Allow authenticated admins to upload
CREATE POLICY "Admins upload project files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'project-files' AND public.has_role(auth.uid(), 'admin'));

-- Allow authenticated admins to read
CREATE POLICY "Admins read project files"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'project-files' AND public.has_role(auth.uid(), 'admin'));

-- Allow admins to delete
CREATE POLICY "Admins delete project files"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'project-files' AND public.has_role(auth.uid(), 'admin'));