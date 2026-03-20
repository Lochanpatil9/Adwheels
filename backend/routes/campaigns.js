import { Router } from 'express'
import supabase from '../lib/supabase.js'
import { sendNotification } from '../lib/notify.js'

const router = Router()

// ─── GET /api/campaigns/expiry-check ─────────────────────────────
// Finds all active campaigns past 30 days and marks them completed
router.get('/expiry-check', async (req, res) => {
  try {
    // Find active campaigns that have been active for more than 30 days
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

    // Update campaigns to completed
    const { error: campErr } = await supabase
      .from('campaigns')
      .update({ status: 'completed' })
      .in('id', expiredIds)

    if (campErr) throw campErr

    // Update all driver_jobs for these campaigns to completed
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
})

// ─── GET /api/campaigns/expiry-warning ───────────────────────────
// Notify advertisers about campaigns expiring within 5 days (called alongside expiry-check)
router.get('/expiry-warning', async (req, res) => {
  try {
    const fiveDaysFromNow = new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString()
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

    // Find active campaigns activated 25-30 days ago (expiring within 5 days)
    const { data: expiring } = await supabase
      .from('campaigns')
      .select('id, advertiser_id, company_name, city')
      .eq('status', 'active')
      .not('activated_at', 'is', null)
      .lt('activated_at', fiveDaysFromNow)
      .gt('activated_at', thirtyDaysAgo)

    if (!expiring || expiring.length === 0) {
      return res.json({ message: 'No campaigns expiring soon', warned: 0 })
    }

    let warned = 0
    for (const campaign of expiring) {
      // Check if we already sent a campaign_expiring notification for this campaign
      const { data: existing } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', campaign.advertiser_id)
        .eq('type', 'campaign_expiring')
        .ilike('message', `%${campaign.id.substring(0, 8)}%`)
        .limit(1)

      if (existing && existing.length > 0) continue // already notified

      await sendNotification(
        campaign.advertiser_id,
        'campaign_expiring',
        '⏰ Campaign Expiring Soon!',
        `Your campaign "${campaign.company_name}" in ${campaign.city} is expiring in less than 5 days. Consider renewing to keep your ad running! [${campaign.id.substring(0, 8)}]`
      )
      warned++
    }

    res.json({ message: `Warned ${warned} advertiser(s)`, warned })
  } catch (err) {
    console.error('Expiry warning error:', err)
    res.status(500).json({ error: 'Failed to send expiry warnings' })
  }
})

// ─── POST /api/campaigns/:id/cancel ──────────────────────────────
// Cancel a pending campaign (only pending, not paid/active)
router.post('/:id/cancel', async (req, res) => {
  const { id } = req.params

  try {
    // First check current status
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
})

// ─── GET /api/campaigns/:id/stats ────────────────────────────────
// Get proof counts, days active, days remaining etc.
router.get('/:id/stats', async (req, res) => {
  const { id } = req.params

  try {
    // Fetch campaign
    const { data: campaign, error: campErr } = await supabase
      .from('campaigns')
      .select('id, status, created_at, activated_at')
      .eq('id', id)
      .single()

    if (campErr || !campaign) {
      return res.status(404).json({ error: 'Campaign not found' })
    }

    // Fetch driver_jobs for this campaign
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

    // Calculate days
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
})

export default router
