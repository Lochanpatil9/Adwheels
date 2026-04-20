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

  const { company, name, phone, email, city, message } = req.body || {}

  if (!company || !name || !phone) {
    return res.status(400).json({ error: 'company, name, and phone are required' })
  }

  const { error } = await supabase.from('enterprise_leads').insert({
    full_name: name,
    phone,
    email: email || null,
    company_name: company,
    city: city || null,
    message: message || null,
  })

  if (error) {
    return res.status(500).json({ error: 'Failed to submit lead' })
  }

  res.status(201).json({ success: true })
}
