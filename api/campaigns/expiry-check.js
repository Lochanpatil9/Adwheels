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

  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  try {
    const { data: expiredCampaigns, error: fetchError } = await supabase
      .from('campaigns')
      .select('id')
      .eq('status', 'active')
      .lt('activated_at', cutoff)

    if (fetchError) throw fetchError

    const expiredIds = (expiredCampaigns || []).map(campaign => campaign.id)

    if (expiredIds.length === 0) {
      return res.json({ expired: 0 })
    }

    const { error: updateCampaignsError } = await supabase
      .from('campaigns')
      .update({ status: 'completed' })
      .in('id', expiredIds)

    if (updateCampaignsError) throw updateCampaignsError

    const { error: updateJobsError } = await supabase
      .from('driver_jobs')
      .update({ status: 'completed' })
      .in('campaign_id', expiredIds)

    if (updateJobsError) throw updateJobsError

    res.json({ expired: expiredIds.length })
  } catch (error) {
    res.status(500).json({ error: 'Failed to check expiry' })
  }
}
