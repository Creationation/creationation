import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ error: 'Missing configuration' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { accessToken } = await req.json();

    if (!accessToken || typeof accessToken !== 'string' || accessToken.length < 10) {
      return new Response(JSON.stringify({ error: 'Invalid access token' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get demo by token
    const { data: demo, error } = await supabase.from('demos').select('*').eq('access_token', accessToken).single();
    if (error || !demo) {
      return new Response(JSON.stringify({ error: 'Demo not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check expiry
    if (!demo.is_active || new Date(demo.expires_at) < new Date()) {
      return new Response(JSON.stringify({ expired: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const isFirstView = demo.status === 'draft' || demo.status === 'sent';

    // Update demo: increment view count, update last viewed, set status
    await supabase.from('demos').update({
      viewed_count: (demo.viewed_count || 0) + 1,
      last_viewed_at: new Date().toISOString(),
      status: isFirstView ? 'viewed' : demo.status,
    }).eq('id', demo.id);

    // Log activity
    await supabase.from('activity_log').insert({
      action: `Le prospect ${demo.business_name} a consulté sa démo`,
      performed_by: 'system',
      details: {
        demo_id: demo.id,
        business_name: demo.business_name,
        viewed_count: (demo.viewed_count || 0) + 1,
        first_view: isFirstView,
      },
    });

    // Send notification to admin (portal_notifications doesn't apply here, 
    // but we can use it if there's a client linked, otherwise activity_log is the notification)

    return new Response(JSON.stringify({ success: true, demo }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
