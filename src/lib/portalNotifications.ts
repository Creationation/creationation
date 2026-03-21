import { supabase } from '@/integrations/supabase/client';

type NotificationType = 'project_update' | 'message' | 'invoice' | 'deliverable_review' | 'milestone_completed' | 'general';

/**
 * Send a portal notification to a client.
 * Call from admin pages when performing actions relevant to a client.
 */
export const sendPortalNotification = async ({
  clientId,
  type,
  title,
  message,
  link,
}: {
  clientId: string;
  type: NotificationType;
  title: string;
  message?: string;
  link?: string;
}) => {
  const { error } = await supabase.from('portal_notifications').insert({
    client_id: clientId,
    type,
    title,
    message: message || null,
    link: link || null,
  } as any);
  if (error) console.warn('Failed to send portal notification:', error.message);
};
