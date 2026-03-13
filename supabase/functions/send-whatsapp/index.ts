// Edge Function: send-whatsapp
//
// Sends a WhatsApp message via Twilio.
// Accepts: { to, message } in request body.
//
// Deploy:
//   supabase functions deploy send-whatsapp
//
// Required secrets (set via `supabase secrets set`):
//   TWILIO_ACCOUNT_SID   — Twilio Account SID
//   TWILIO_AUTH_TOKEN     — Twilio Auth Token
//   TWILIO_WHATSAPP_FROM  — Twilio WhatsApp sender number (e.g. whatsapp:+14155238886)

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
    const { to, message } = await req.json()

    if (!to || !message) {
      return new Response(
        JSON.stringify({ error: 'Both "to" and "message" fields are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN')
    const from = Deno.env.get('TWILIO_WHATSAPP_FROM') || 'whatsapp:+14155238886'

    if (!accountSid || !authToken) {
      console.error('Twilio credentials not configured')
      return new Response(
        JSON.stringify({ error: 'Twilio credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Ensure phone number has +91 prefix for Indian numbers
    let phone = String(to).replace(/\s+/g, '')
    if (!phone.startsWith('+')) {
      phone = phone.startsWith('91') ? `+${phone}` : `+91${phone}`
    }

    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`

    const body = new URLSearchParams({
      From: from.startsWith('whatsapp:') ? from : `whatsapp:${from}`,
      To: `whatsapp:${phone}`,
      Body: message,
    })

    const res = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + btoa(`${accountSid}:${authToken}`),
      },
      body: body.toString(),
    })

    const result = await res.json()

    if (!res.ok) {
      console.error('Twilio API error:', result)
      return new Response(
        JSON.stringify({ error: result.message || 'Twilio API error' }),
        { status: res.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    return new Response(
      JSON.stringify({ success: true, sid: result.sid }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )

  } catch (err) {
    console.error('send-whatsapp error:', err)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
