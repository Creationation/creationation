
-- Create enums
CREATE TYPE public.expense_category AS ENUM ('hosting', 'domain', 'api_service', 'software', 'design', 'marketing', 'legal', 'other');
CREATE TYPE public.expense_frequency AS ENUM ('one_time', 'monthly', 'yearly');
CREATE TYPE public.expense_status AS ENUM ('active', 'paused', 'cancelled');

-- Create expenses table
CREATE TABLE public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  category public.expense_category NOT NULL DEFAULT 'other',
  name TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  frequency public.expense_frequency NOT NULL DEFAULT 'one_time',
  is_billable BOOLEAN NOT NULL DEFAULT false,
  status public.expense_status NOT NULL DEFAULT 'active',
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Admin only policy
CREATE POLICY "Admins manage expenses"
  ON public.expenses
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Updated_at trigger
CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
