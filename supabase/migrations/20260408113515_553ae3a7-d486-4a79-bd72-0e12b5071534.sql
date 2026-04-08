
-- =============================================
-- PHASE 1: SUPPORT SYSTEM DATABASE SCHEMA
-- =============================================

-- 1. NEW ENUM TYPES
CREATE TYPE public.ticket_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE public.ticket_status AS ENUM ('open', 'in_progress', 'waiting_client', 'resolved', 'closed');
CREATE TYPE public.ticket_category AS ENUM ('bug', 'feature_request', 'modification', 'question', 'other');
CREATE TYPE public.author_type AS ENUM ('client', 'admin', 'system');
CREATE TYPE public.contract_status AS ENUM ('pending', 'signed', 'active', 'expired', 'cancelled');
CREATE TYPE public.subscription_status AS ENUM ('trial', 'active', 'past_due', 'cancelled');
CREATE TYPE public.support_notification_type AS ENUM ('new_ticket', 'ticket_reply', 'status_change', 'payment_reminder', 'payment_received', 'general');
CREATE TYPE public.notification_channel AS ENUM ('portal', 'telegram', 'email');

-- 2. EXTEND EXISTING TABLES
ALTER TABLE public.clients 
  ADD COLUMN IF NOT EXISTS business_type text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS country text DEFAULT 'Austria',
  ADD COLUMN IF NOT EXISTS subscription_status subscription_status DEFAULT 'trial',
  ADD COLUMN IF NOT EXISTS onboarded_at timestamp with time zone;

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS app_url text;

-- 3. CREATE NEW TABLES

-- SUPPORT TICKETS
CREATE TABLE public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  priority ticket_priority NOT NULL DEFAULT 'medium',
  status ticket_status NOT NULL DEFAULT 'open',
  category ticket_category DEFAULT 'other',
  created_by author_type NOT NULL DEFAULT 'client',
  assigned_to text,
  resolved_at timestamp with time zone,
  closed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- TICKET MESSAGES
CREATE TABLE public.ticket_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  author_type author_type NOT NULL,
  author_name text,
  content text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- ACTIVITY LOG
CREATE TABLE public.activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  ticket_id uuid REFERENCES public.support_tickets(id) ON DELETE SET NULL,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  action text NOT NULL,
  details jsonb DEFAULT '{}'::jsonb,
  performed_by author_type NOT NULL DEFAULT 'system',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- CONTRACTS
CREATE TABLE public.contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  setup_price numeric DEFAULT 290,
  monthly_price numeric DEFAULT 34,
  start_date date,
  end_date date,
  special_conditions text,
  status contract_status NOT NULL DEFAULT 'pending',
  document_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- TIME TRACKING
CREATE TABLE public.time_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  ticket_id uuid REFERENCES public.support_tickets(id) ON DELETE SET NULL,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  duration_minutes integer NOT NULL,
  description text,
  date date NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- INTERNAL NOTES
CREATE TABLE public.internal_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  content text NOT NULL,
  is_pinned boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- SUPPORT NOTIFICATIONS
CREATE TABLE public.support_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  type support_notification_type NOT NULL,
  title text NOT NULL,
  content text,
  is_read boolean DEFAULT false,
  channel notification_channel DEFAULT 'portal',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- SUPPORT FILES
CREATE TABLE public.support_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid REFERENCES public.support_tickets(id) ON DELETE SET NULL,
  message_id uuid REFERENCES public.ticket_messages(id) ON DELETE SET NULL,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_type text,
  file_size integer,
  uploaded_by author_type NOT NULL DEFAULT 'client',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- SERVICES CATALOG
CREATE TABLE public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  default_price numeric,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 4. TRIGGERS FOR updated_at
CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_internal_notes_updated_at BEFORE UPDATE ON public.internal_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. ENABLE RLS ON ALL NEW TABLES
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internal_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- 6. RLS POLICIES

-- SUPPORT TICKETS
CREATE POLICY "Admins manage support_tickets" ON public.support_tickets FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Clients read own tickets" ON public.support_tickets FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.clients c WHERE c.id = support_tickets.client_id AND c.portal_user_id = auth.uid()));
CREATE POLICY "Clients create own tickets" ON public.support_tickets FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.clients c WHERE c.id = support_tickets.client_id AND c.portal_user_id = auth.uid()));

-- TICKET MESSAGES
CREATE POLICY "Admins manage ticket_messages" ON public.ticket_messages FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Clients read own ticket messages" ON public.ticket_messages FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.support_tickets t JOIN public.clients c ON c.id = t.client_id WHERE t.id = ticket_messages.ticket_id AND c.portal_user_id = auth.uid()));
CREATE POLICY "Clients insert own ticket messages" ON public.ticket_messages FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.support_tickets t JOIN public.clients c ON c.id = t.client_id WHERE t.id = ticket_messages.ticket_id AND c.portal_user_id = auth.uid()));

-- ACTIVITY LOG
CREATE POLICY "Admins manage activity_log" ON public.activity_log FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Clients read own activity" ON public.activity_log FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.clients c WHERE c.id = activity_log.client_id AND c.portal_user_id = auth.uid()));

-- CONTRACTS
CREATE POLICY "Admins manage contracts" ON public.contracts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Clients read own contracts" ON public.contracts FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.clients c WHERE c.id = contracts.client_id AND c.portal_user_id = auth.uid()));

-- TIME TRACKING (admin only)
CREATE POLICY "Admins manage time_tracking" ON public.time_tracking FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- INTERNAL NOTES (admin only)
CREATE POLICY "Admins manage internal_notes" ON public.internal_notes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- SUPPORT NOTIFICATIONS
CREATE POLICY "Admins manage support_notifications" ON public.support_notifications FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Clients read own notifications" ON public.support_notifications FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.clients c WHERE c.id = support_notifications.recipient_client_id AND c.portal_user_id = auth.uid()));
CREATE POLICY "Clients update own notifications" ON public.support_notifications FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.clients c WHERE c.id = support_notifications.recipient_client_id AND c.portal_user_id = auth.uid()));

-- SUPPORT FILES
CREATE POLICY "Admins manage support_files" ON public.support_files FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Clients read own files" ON public.support_files FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.clients c WHERE c.id = support_files.client_id AND c.portal_user_id = auth.uid()));
CREATE POLICY "Clients upload own files" ON public.support_files FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.clients c WHERE c.id = support_files.client_id AND c.portal_user_id = auth.uid()));

-- SERVICES (public read, admin manage)
CREATE POLICY "Admins manage services" ON public.services FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone can read active services" ON public.services FOR SELECT TO authenticated
  USING (is_active = true);

-- 7. INDEXES
CREATE INDEX idx_support_tickets_client_id ON public.support_tickets(client_id);
CREATE INDEX idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX idx_ticket_messages_ticket_id ON public.ticket_messages(ticket_id);
CREATE INDEX idx_activity_log_client_id ON public.activity_log(client_id);
CREATE INDEX idx_contracts_client_id ON public.contracts(client_id);
CREATE INDEX idx_time_tracking_client_id ON public.time_tracking(client_id);
CREATE INDEX idx_internal_notes_client_id ON public.internal_notes(client_id);
CREATE INDEX idx_support_notifications_recipient ON public.support_notifications(recipient_client_id);
CREATE INDEX idx_support_files_ticket_id ON public.support_files(ticket_id);
