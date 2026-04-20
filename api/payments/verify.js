import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

async function sendNotification(userId, type, title, message) {
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

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'https://adwheels.in')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, campaignId } = req.body || {}

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !campaignId) {
    return res.status(400).json({ error: 'Missing required payment fields' })
  }

  try {
    const body = razorpay_order_id + '|' + razorpay_payment_id
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex')

    const isValid = expectedSignature === razorpay_signature

    if (!isValid) {
      return res.status(400).json({ success: false, error: 'Payment verification failed' })
    }

    const { error: updateError } = await supabase
      .from('campaigns')
      .update({ status: 'paid' })
      .eq('id', campaignId)

    if (updateError) throw updateError

    const { error: rpcError } = await supabase
      .rpc('auto_assign_drivers', { campaign_id: campaignId })

    if (rpcError) console.error('auto_assign_drivers error:', rpcError)

    const { error: activateErr } = await supabase
      .from('campaigns')
      .update({ status: 'active', activated_at: new Date().toISOString() })
      .eq('id', campaignId)

    if (activateErr) console.error('Failed to set activated_at:', activateErr)

    try {
      const { data: campaign } = await supabase
        .from('campaigns')
        .select('city, company_name')
        .eq('id', campaignId)
        .single()

      const { data: driverJobs } = await supabase
        .from('driver_jobs')
        .select('driver_id')
        .eq('campaign_id', campaignId)
        .eq('status', 'offered')

      if (driverJobs && driverJobs.length > 0) {
        for (const job of driverJobs) {
          await sendNotification(
            job.driver_id,
            'job_offer',
            '🛺 New Job Offer!',
            `You have a new ad campaign job in ${campaign?.city || 'your city'}. Open the Jobs tab to accept it and start earning!`
          )
        }
      }
    } catch (notifErr) {
      console.error('Driver notification error:', notifErr.message)
    }

    res.json({ success: true })
  } catch (err) {
    console.error('Payment verify error:', err)
    res.status(500).json({ success: false, error: 'Server error during verification' })
  }
}
