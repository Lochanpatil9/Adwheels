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

  const rawId = req.query.id
  const id = Array.isArray(rawId) ? rawId[0] : rawId

  if (!id) {
    return res.status(400).json({ error: 'Campaign id is required' })
  }

  try {
    const { data: campaign, error: campErr } = await supabase
      .from('campaigns')
      .select('id, status, created_at, activated_at')
      .eq('id', id)
      .single()

    if (campErr || !campaign) {
      return res.status(404).json({ error: 'Campaign not found' })
    }

    const { data: jobs, error: jobErr } = await supabase
      .from('driver_jobs')
      .select('id, status, driver_id')
      .eq('campaign_id', id)
      .neq('status', 'rejected')

    if (jobErr) throw jobErr

    const jobIds = (jobs || []).map(j => j.id)
    let totalProofs = 0
    let approvedProofs = 0
    let pendingProofs = 0

    if (jobIds.length > 0) {
      const { data: proofs, error: proofErr } = await supabase
        .from('daily_proofs')
        .select('status')
        .in('driver_job_id', jobIds)

      if (!proofErr && proofs) {
        totalProofs = proofs.length
        approvedProofs = proofs.filter(p => p.status === 'approved').length
        pendingProofs = proofs.filter(p => p.status === 'pending').length
      }
    }

    const activatedAt = campaign.activated_at ? new Date(campaign.activated_at) : null
    const now = new Date()
    const daysActive = activatedAt ? Math.floor((now - activatedAt) / 86400000) : 0
    const daysRemaining = activatedAt ? Math.max(0, 30 - daysActive) : 30
    const activeDrivers = (jobs || []).filter(j => j.status === 'active').length
    const totalDrivers = (jobs || []).length

    res.json({
      campaignId: id,
      status: campaign.status,
      activatedAt: campaign.activated_at,
      daysActive,
      daysRemaining,
      totalDrivers,
      activeDrivers,
      totalProofs,
      approvedProofs,
      pendingProofs,
    })
  } catch (err) {
    console.error('Campaign stats error:', err)
    res.status(500).json({ error: 'Failed to fetch stats' })
  }
}
