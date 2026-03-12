import { supabase } from './supabase'

/**
 * Send a WhatsApp message via Supabase Edge Function.
 * Silently logs a warning if the Edge Function isn't deployed yet.
 *
 * Deploy the function with:
 *   supabase functions deploy send-whatsapp
 *
 * Then set secrets in Supabase Dashboard → Project Settings → Edge Functions:
 *   WHATSAPP_PROVIDER  → msg91 | twilio
 *   MSG91_API_KEY      → (MSG91 auth key)
 *   MSG91_TEMPLATE_ID  → (approved WhatsApp template ID)
 *   TWILIO_ACCOUNT_SID → (Twilio account SID)
 *   TWILIO_AUTH_TOKEN  → (Twilio auth token)
 *   TWILIO_WHATSAPP_FROM → whatsapp:+14155238886
 */
export async function sendWhatsApp(phone, message) {
  if (!phone) return
  try {
    const { error } = await supabase.functions.invoke('send-whatsapp', {
      body: { phone, message },
    })
    if (error) console.warn('[notify] WhatsApp send failed:', error.message)
  } catch (err) {
    console.warn('[notify] WhatsApp send failed:', err)
  }
}
