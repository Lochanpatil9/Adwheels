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

  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

    const { data: expired, error: fetchErr } = await supabase
      .from('campaigns')
      .select('id')
      .eq('status', 'active')
      .not('activated_at', 'is', null)
      .lt('activated_at', thirtyDaysAgo)

    if (fetchErr) throw fetchErr

    if (!expired || expired.length === 0) {
      return res.json({ message: 'No expired campaigns', expired: 0 })
    }

    const expiredIds = expired.map(c => c.id)

    const { error: campErr } = await supabase
      .from('campaigns')
      .update({ status: 'completed' })
      .in('id', expiredIds)

    if (campErr) throw campErr

    const { error: jobErr } = await supabase
      .from('driver_jobs')
      .update({ status: 'completed' })
      .in('campaign_id', expiredIds)
      .in('status', ['offered', 'accepted', 'active'])

    if (jobErr) console.error('Failed to update driver_jobs:', jobErr)

    console.log(`✅ Expired ${expiredIds.length} campaign(s)`)
    res.json({ message: `Expired ${expiredIds.length} campaign(s)`, expired: expiredIds.length, ids: expiredIds })
  } catch (err) {
    console.error('Expiry check error:', err)
    res.status(500).json({ error: 'Failed to check expiry' })
  }
}
