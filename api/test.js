// Simple test endpoint to verify Vercel serverless functions work
export default function handler(req, res) {
  res.status(200).json({
    status: 'ok',
    message: 'Vercel serverless function is working',
    timestamp: new Date().toISOString(),
    env: {
      RAZORPAY_KEY_ID: !!process.env.RAZORPAY_KEY_ID,
      RAZORPAY_KEY_SECRET: !!process.env.RAZORPAY_KEY_SECRET,
      SUPABASE_URL: !!process.env.SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      SUPABASE_SERVICE_KEY: !!process.env.SUPABASE_SERVICE_KEY,
    }
  })
}
