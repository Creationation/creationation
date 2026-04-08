
-- Add 'sent' to contract_status enum
ALTER TYPE public.contract_status ADD VALUE IF NOT EXISTS 'sent' AFTER 'pending';

-- Add content, project_id, sent_at columns to contracts
ALTER TABLE public.contracts
  ADD COLUMN IF NOT EXISTS content text,
  ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS sent_at timestamptz;

-- Create storage bucket for contract PDFs
INSERT INTO storage.buckets (id, name, public) VALUES ('contract-documents', 'contract-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: admins can upload contract documents
CREATE POLICY "Admins upload contract docs"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'contract-documents' AND public.has_role(auth.uid(), 'admin'));

-- Storage policy: anyone can read contract documents (for client access via link)
CREATE POLICY "Public read contract docs"
ON storage.objects FOR SELECT
USING (bucket_id = 'contract-documents');
