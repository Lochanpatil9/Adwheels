// Supabase Edge Function: send-whatsapp
// Deploy: supabase functions deploy send-whatsapp
//
// Required secrets (set via Supabase Dashboard → Edge Functions → Secrets):
//   WHATSAPP_PROVIDER  → msg91 | twilio
//
//   For MSG91:
//     MSG91_API_KEY      — your MSG91 auth key
//     MSG91_TEMPLATE_ID  — approved WhatsApp template ID (var1 = message text)
//
//   For Twilio:
//     TWILIO_ACCOUNT_SID    — account SID
//     TWILIO_AUTH_TOKEN     — auth token
//     TWILIO_WHATSAPP_FROM  — e.g. whatsapp:+14155238886

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { phone, message } = await req.json()
    if (!phone || !message) {
      return new Response(JSON.stringify({ error: 'phone and message are required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const provider = Deno.env.get('WHATSAPP_PROVIDER') || 'msg91'

    // ── MSG91 ──────────────────────────────────────────────────────────────
    if (provider === 'msg91') {
      const apiKey = Deno.env.get('MSG91_API_KEY')
      const templateId = Deno.env.get('MSG91_TEMPLATE_ID')
      if (!apiKey || !templateId) {
        return new Response(JSON.stringify({ error: 'MSG91 secrets not configured' }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      const cleanPhone = phone.replace(/\D/g, '')
      const indiaPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`

      const res = await fetch('https://api.msg91.com/api/v5/flow/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'authkey': apiKey },
        body: JSON.stringify({ template_id: templateId, mobiles: indiaPhone, var1: message }),
      })
      const data = await res.json()
      return new Response(JSON.stringify(data), {
        status: res.ok ? 200 : 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ── Twilio ─────────────────────────────────────────────────────────────
    if (provider === 'twilio') {
      const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
      const authToken = Deno.env.get('TWILIO_AUTH_TOKEN')
      const from = Deno.env.get('TWILIO_WHATSAPP_FROM')
      if (!accountSid || !authToken || !from) {
        return new Response(JSON.stringify({ error: 'Twilio secrets not configured' }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      const cleanPhone = phone.replace(/\D/g, '').replace(/^91/, '')
      const to = `whatsapp:+91${cleanPhone}`
      const creds = btoa(`${accountSid}:${authToken}`)
      const res = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
        {
          method: 'POST',
          headers: { 'Authorization': `Basic ${creds}`, 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ From: from, To: to, Body: message }),
        }
      )
      const data = await res.json()
      return new Response(JSON.stringify(data), {
        status: res.ok ? 200 : 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ error: `Unknown provider: ${provider}` }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
