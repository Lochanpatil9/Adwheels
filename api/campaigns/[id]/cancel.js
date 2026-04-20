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

  const rawId = req.query.id
  const id = Array.isArray(rawId) ? rawId[0] : rawId

  if (!id) {
    return res.status(400).json({ error: 'Campaign id is required' })
  }

  try {
    const { data: campaign, error: fetchErr } = await supabase
      .from('campaigns')
      .select('id, status')
      .eq('id', id)
      .single()

    if (fetchErr || !campaign) {
      return res.status(404).json({ error: 'Campaign not found' })
    }

    if (campaign.status !== 'pending') {
      return res.status(400).json({ error: `Cannot cancel a campaign with status "${campaign.status}". Only pending campaigns can be cancelled.` })
    }

    const { error: updateErr } = await supabase
      .from('campaigns')
      .update({ status: 'cancelled' })
      .eq('id', id)

    if (updateErr) throw updateErr

    res.json({ success: true, message: 'Campaign cancelled' })
  } catch (err) {
    console.error('Cancel campaign error:', err)
    res.status(500).json({ error: 'Failed to cancel campaign' })
  }
}
