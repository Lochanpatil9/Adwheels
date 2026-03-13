import { Router } from 'express'
import supabase from '../lib/supabase.js'

const router = Router()

router.post('/enterprise', async (req, res) => {
  const { company, name, phone, email, city, message } = req.body

  if (!company || !name || !phone) {
    return res.status(400).json({ error: 'Company name, your name, and phone are required' })
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
    console.error('Enterprise lead insert error:', error)
    return res.status(500).json({ error: 'Failed to submit lead' })
  }

  res.status(201).json({ success: true })
})

router.post('/register', async (req, res) => {
  const { name, phone, city, role, business, budget, area } = req.body

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
})

export default router
