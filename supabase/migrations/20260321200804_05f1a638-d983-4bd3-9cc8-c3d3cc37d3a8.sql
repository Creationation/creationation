
-- 1. RLS: Clients can UPDATE portal_messages (mark as read)
CREATE POLICY "Clients update own portal_messages"
  ON public.portal_messages
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      JOIN clients c ON c.id = p.client_id
      WHERE p.id = portal_messages.project_id
        AND c.portal_user_id = auth.uid()
        AND c.portal_enabled = true
    )
  );

-- 2. RLS: Clients can INSERT portal_notifications (admin alerts on file upload, review actions)
CREATE POLICY "Clients insert own portal_notifications"
  ON public.portal_notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients c
      WHERE c.id = portal_notifications.client_id
        AND c.portal_user_id = auth.uid()
        AND c.portal_enabled = true
    )
  );

-- 3. update_updated_at on deliverable_reviews
CREATE TRIGGER trg_updated_at_deliverable_reviews
  BEFORE UPDATE ON public.deliverable_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Enable realtime on deliverable_reviews
ALTER PUBLICATION supabase_realtime ADD TABLE public.deliverable_reviews;
