import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'https://adwheels.in')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { userId, type, title, message } = req.body || {}

  if (!userId || !type || !title || !message) {
    return res.status(400).json({ error: 'userId, type, title, and message are required' })
  }

  try {
    const { error } = await supabase
      .from('notifications')
      .insert({ user_id: userId, type, title, message })

    if (error) {
      console.error('❌ Notification insert error:', error.message)
      return res.status(500).json({ error: 'Failed to send notification' })
    }

    res.json({ success: true })
  } catch (err) {
    console.error('Notification route error:', err)
    res.status(500).json({ error: 'Failed to send notification' })
  }
}
