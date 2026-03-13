import { supabase } from './supabase'

/**
 * Send a WhatsApp notification via the send-whatsapp Edge Function.
 * Never blocks the main action — failures are silently logged.
 *
 * @param {string} to   Phone number (Indian — +91 prefix added if missing)
 * @param {string} message  Message text to send
 */
export async function sendWhatsApp(to, message) {
  try {
    const { error } = await supabase.functions.invoke('send-whatsapp', {
      body: { to, message },
    })
    if (error) console.error('WhatsApp notification failed:', error.message)
  } catch (err) {
    console.error('WhatsApp notification error:', err)
  }
}
