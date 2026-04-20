import { createClient } from '@supabase/supabase-js'
import Razorpay from 'razorpay'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
})

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'https://adwheels.in')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { campaignId, amount, currency = 'INR' } = req.body || {}

  if (!campaignId || !amount) {
    return res.status(400).json({ error: 'campaignId and amount are required' })
  }

  if (amount <= 0) {
    return res.status(400).json({ error: 'Amount must be greater than 0' })
  }

  try {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error('Missing Razorpay credentials — RAZORPAY_KEY_ID:', !!process.env.RAZORPAY_KEY_ID, 'RAZORPAY_KEY_SECRET:', !!process.env.RAZORPAY_KEY_SECRET)
      return res.status(500).json({ error: 'Payment gateway not configured. Contact support.' })
    }

    const order = await razorpay.orders.create({
      amount: Math.round(amount),
      currency,
      receipt: campaignId.replace(/-/g, '').substring(0, 40),
    })

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID,
    })
  } catch (err) {
    console.error('Razorpay order creation error:', err.message || err)
    console.error('ENV check — RAZORPAY_KEY_ID present:', !!process.env.RAZORPAY_KEY_ID, 'RAZORPAY_KEY_SECRET present:', !!process.env.RAZORPAY_KEY_SECRET)
    res.status(500).json({ error: 'Failed to create payment order' })
  }
}
