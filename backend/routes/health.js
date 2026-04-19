import { Router } from 'express'

const router = Router()

router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: {
      RAZORPAY_KEY_ID: !!process.env.RAZORPAY_KEY_ID,
      RAZORPAY_KEY_SECRET: !!process.env.RAZORPAY_KEY_SECRET,
      SUPABASE_URL: !!process.env.SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    }
  })
})

export default router
