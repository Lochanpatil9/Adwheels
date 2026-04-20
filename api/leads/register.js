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

  const { name, phone, city, role, business, budget, area } = req.body || {}

  if (!name || !phone || !city) {
    return res.status(400).json({ error: 'Name, phone, and city are required' })
  }

  const { error } = await supabase.from('enterprise_leads').insert({
    full_name: name,
    phone,
    company_name: business || `${role || 'general'} registration`,
    city,
    message: [
      role && `Role: ${role}`,
      budget && `Budget: ${budget}`,
      area && `Area: ${area}`,
    ].filter(Boolean).join(' | '),
    status: 'new',
  })

  if (error) {
    console.error('Registration insert error:', error)
    return res.status(500).json({ error: 'Failed to register' })
  }

  res.status(201).json({ success: true })
}
