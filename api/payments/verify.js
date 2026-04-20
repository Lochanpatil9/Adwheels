import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') return res.status(200).end()

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, campaignId } = req.body || {}

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !campaignId) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  const signature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex')

  if (signature !== razorpay_signature) {
    return res.status(400).json({ success: false, error: 'Payment verification failed' })
  }

  try {
    const { error: updateError } = await supabase
      .from('campaigns')
      .update({ status: 'paid', activated_at: new Date().toISOString() })
      .eq('id', campaignId)

    if (updateError) throw updateError

    const { error: rpcError } = await supabase
      .rpc('auto_assign_drivers', { campaign_id: campaignId })

    if (rpcError) throw rpcError

    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error during verification' })
  }
}
