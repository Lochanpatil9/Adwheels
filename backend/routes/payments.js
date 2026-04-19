import { Router } from 'express'
import Razorpay from 'razorpay'
import crypto from 'crypto'
import supabase from '../lib/supabase.js'
import { sendNotification } from '../lib/notify.js'

const router = Router()

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
})

// POST /api/payments/create-order
router.post('/create-order', async (req, res) => {
  const { campaignId, amount, currency = 'INR' } = req.body

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
      amount: Math.round(amount), // amount in paise, already multiplied by 100 from frontend
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
})

// POST /api/payments/verify
router.post('/verify', async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, campaignId } = req.body

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !campaignId) {
    return res.status(400).json({ error: 'Missing required payment fields' })
  }

  try {
    // Step 1 — Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex')

    const isValid = expectedSignature === razorpay_signature

    if (!isValid) {
      return res.status(400).json({ success: false, error: 'Payment verification failed' })
    }

    // Step 2 — Update campaign status to paid
    const { error: updateError } = await supabase
      .from('campaigns')
      .update({ status: 'paid' })
      .eq('id', campaignId)

    if (updateError) throw updateError

    // Step 3 — Auto assign drivers
    const { error: rpcError } = await supabase
      .rpc('auto_assign_drivers', { campaign_id: campaignId })

    if (rpcError) console.error('auto_assign_drivers error:', rpcError)
    // Don't throw — payment is verified, assignment failure is non-critical

    // Step 4 — Set activated_at timestamp for duration tracking
    const { error: activateErr } = await supabase
      .from('campaigns')
      .update({ status: 'active', activated_at: new Date().toISOString() })
      .eq('id', campaignId)

    if (activateErr) console.error('Failed to set activated_at:', activateErr)

    // Step 5 — Notify drivers about their new job offer
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
})

export default router
