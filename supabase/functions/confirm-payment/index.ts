// Edge Function: confirm-payment
//
// Called by the client immediately after a successful Razorpay payment.
// Uses the Supabase service-role key (auto-injected, bypasses RLS) to update
// campaigns.status = 'paid', so no client-side RLS UPDATE policy is needed.
//
// It also verifies that the requesting user actually owns the campaign before
// making any changes, preventing one advertiser from marking another's campaign.
//
// Deploy:
//   supabase functions deploy confirm-payment
//
// Environment variables (auto-injected by Supabase, no manual setup needed):
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // ── 1. Parse request body ──────────────────────────────────────────────────
    const { campaignId, razorpay_payment_id } = await req.json()
    if (!campaignId) {
      return new Response(JSON.stringify({ error: 'campaignId is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ── 2. Verify the caller is an authenticated user ──────────────────────────
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Use anon client to verify the JWT and get the user id
    const anonClient = createClient(
      Deno.env.get('SUPABASE_URL'),
      Deno.env.get('SUPABASE_ANON_KEY'),
    )
    const { data: { user }, error: authError } = await anonClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ── 3. Service-role client (bypasses RLS) ─────────────────────────────────
    const admin = createClient(
      Deno.env.get('SUPABASE_URL'),
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
    )

    // ── 4. Confirm the campaign belongs to this user and is still pending ──────
    const { data: campaign, error: fetchError } = await admin
      .from('campaigns')
      .select('id, advertiser_id, status')
      .eq('id', campaignId)
      .single()

    if (fetchError || !campaign) {
      return new Response(JSON.stringify({ error: 'Campaign not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    if (campaign.advertiser_id !== user.id) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    if (campaign.status !== 'pending') {
      // Already paid — treat as success so the UI refreshes correctly
      return new Response(JSON.stringify({ success: true, alreadyPaid: true }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ── 5. Mark as paid (service role bypasses RLS) ────────────────────────────
    const updatePayload = { status: 'paid' }
    if (razorpay_payment_id) updatePayload.razorpay_payment_id = razorpay_payment_id

    const { error: updateError } = await admin
      .from('campaigns')
      .update(updatePayload)
      .eq('id', campaignId)

    if (updateError) {
      console.error('DB update failed:', updateError.message)
      return new Response(JSON.stringify({ error: updateError.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('Unexpected error:', err)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
