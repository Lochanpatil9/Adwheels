import supabase from './supabase.js'

/**
 * Send a notification to a user
 * @param {string} userId - UUID of the target user
 * @param {string} type - Notification type (job_offer, proof_uploaded, campaign_expiring, proof_approved, payout_sent)
 * @param {string} title - Short title
 * @param {string} message - Detailed message
 */
export async function sendNotification(userId, type, title, message) {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert({ user_id: userId, type, title, message })

    if (error) {
      console.error('❌ Notification insert error:', error.message)
    } else {
      console.log(`🔔 Notification sent → ${type} → ${userId.substring(0, 8)}…`)
    }
  } catch (err) {
    console.error('❌ Notification failed:', err.message)
  }
}

export default sendNotification
