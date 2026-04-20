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

  const rawId = req.query.id
  const id = Array.isArray(rawId) ? rawId[0] : rawId

  if (!id) {
    return res.status(400).json({ error: 'Campaign id is required' })
  }

  try {
    const { data: campaign, error: fetchError } = await supabase
      .from('campaigns')
      .select('status')
      .eq('id', id)
      .single()

    if (fetchError || !campaign) {
      return res.status(404).json({ error: 'Campaign not found' })
    }

    if (campaign.status !== 'pending') {
      return res.status(400).json({ error: 'Only pending campaigns can be cancelled' })
    }

    const { error: updateError } = await supabase
      .from('campaigns')
      .update({ status: 'cancelled' })
      .eq('id', id)

    if (updateError) throw updateError

    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: 'Failed to cancel campaign' })
  }
}
