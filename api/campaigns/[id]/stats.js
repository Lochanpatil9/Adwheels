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

  const rawId = req.query.id
  const id = Array.isArray(rawId) ? rawId[0] : rawId

  if (!id) {
    return res.status(400).json({ error: 'Campaign id is required' })
  }

  try {
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('activated_at')
      .eq('id', id)
      .single()

    if (campaignError || !campaign) {
      return res.status(404).json({ error: 'Campaign not found' })
    }

    const { data: jobs, error: jobsError } = await supabase
      .from('driver_jobs')
      .select('id, status')
      .eq('campaign_id', id)

    if (jobsError) throw jobsError

    const jobIds = (jobs || []).map(job => job.id)
    let approvedProofs = 0
    let pendingProofs = 0

    if (jobIds.length > 0) {
      const { data: proofs, error: proofsError } = await supabase
        .from('daily_proofs')
        .select('status')
        .in('driver_job_id', jobIds)

      if (proofsError) throw proofsError

      approvedProofs = (proofs || []).filter(proof => proof.status === 'approved').length
      pendingProofs = (proofs || []).filter(proof => proof.status === 'pending').length
    }

    const activatedAt = campaign.activated_at ? new Date(campaign.activated_at) : null
    const daysActive = activatedAt ? Math.floor((Date.now() - activatedAt.getTime()) / 86400000) : 0
    const daysRemaining = activatedAt ? Math.max(0, 30 - daysActive) : 30
    const totalDrivers = (jobs || []).length
    const activeDrivers = (jobs || []).filter(job => job.status === 'active').length

    res.json({
      daysActive,
      daysRemaining,
      totalDrivers,
      activeDrivers,
      approvedProofs,
      pendingProofs,
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' })
  }
}
