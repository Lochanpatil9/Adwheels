const { createClient } = require('@supabase/supabase-js')
const Razorpay = require('razorpay')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const { campaignId, amount, currency } = req.body || {}
  if (!campaignId || !amount) {
    return res.status(400).json({ error: 'campaignId and amount are required' })
  }
  try {
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    })
    const order = await razorpay.orders.create({
      amount,
      currency: currency || 'INR',
      receipt: campaignId.replace(/-/g, '').substring(0, 40),
    })
    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to create payment order' })
  }
}
