import { createClient } from '@supabase/supabase-js'

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

  const { userId, type, title, message } = req.body || {}

  if (!userId || !type || !title || !message) {
    return res.status(400).json({ error: 'userId, type, title, and message are required' })
  }

  try {
    const { error } = await supabase
      .from('notifications')
      .insert({ user_id: userId, type, title, message })

    if (error) throw error

    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: 'Failed to send notification' })
  }
}
