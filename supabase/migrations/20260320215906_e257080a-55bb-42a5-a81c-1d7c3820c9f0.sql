
CREATE TABLE public.operation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  operation_type text NOT NULL,
  description text NOT NULL,
  details jsonb DEFAULT '{}'::jsonb,
  cost_eur numeric(10,4) NOT NULL DEFAULT 0,
  prospect_count integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.operation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage operation_logs"
ON public.operation_logs
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_operation_logs_created_at ON public.operation_logs(created_at DESC);
