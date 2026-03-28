import { Router } from 'express'
import supabase from '../lib/supabase.js'
import { sendNotification } from '../lib/notify.js'

const router = Router()

// ─── POST /api/drivers/on-verified ───────────────────────────────
// Called when admin verifies a driver — auto-assign to under-staffed campaigns
router.post('/on-verified', async (req, res) => {
  const { driverId } = req.body

  if (!driverId) {
    return res.status(400).json({ error: 'driverId is required' })
  }

  try {
    // Step 1: Get the driver's city and verification status
    const { data: driver, error: driverErr } = await supabase
      .from('users')
      .select('id, full_name, city, is_verified, role')
      .eq('id', driverId)
      .single()

    if (driverErr || !driver) {
      return res.status(404).json({ error: 'Driver not found' })
    }

    if (driver.role !== 'driver') {
      return res.status(400).json({ error: 'User is not a driver' })
    }

    // Step 2: Check driver isn't already in an active/offered/accepted job
    const { data: existingJobs } = await supabase
      .from('driver_jobs')
      .select('id')
      .eq('driver_id', driverId)
      .in('status', ['offered', 'accepted', 'active'])

    if (existingJobs && existingJobs.length > 0) {
      return res.json({ success: true, message: 'Driver already has an active job', assigned: false })
    }

    // Step 3: Find active campaigns in driver's city that need more drivers
    const { data: activeCampaigns } = await supabase
      .from('campaigns')
      .select('id, city, company_name, plan_id, plans(name, rickshaw_count, driver_payout)')
      .eq('status', 'active')
      .or(`city.eq.${driver.city},city.eq.both`)

    if (!activeCampaigns || activeCampaigns.length === 0) {
      return res.json({ success: true, message: 'No active campaigns in driver city', assigned: false })
    }

    // Step 4: For each campaign, check if it needs more drivers
    let assigned = false
    for (const campaign of activeCampaigns) {
      const neededDrivers = campaign.plans?.rickshaw_count || 1

      const { data: currentJobs } = await supabase
        .from('driver_jobs')
        .select('id')
        .eq('campaign_id', campaign.id)
        .neq('status', 'rejected')

      const currentCount = (currentJobs || []).length

      if (currentCount < neededDrivers) {
        // Assign driver to this campaign
        const { error: assignErr } = await supabase
          .from('driver_jobs')
          .insert({
            driver_id: driverId,
            campaign_id: campaign.id,
            status: 'offered'
          })

        if (assignErr) {
          console.error('Auto-assign insert error:', assignErr.message)
          continue
        }

        // Notify driver
        await sendNotification(
          driverId,
          'job_offer',
          '🛺 New Job Offer!',
          `You've been auto-assigned to campaign "${campaign.company_name}" in ${campaign.city}. Open your Jobs tab to accept and start earning ₹${campaign.plans?.driver_payout || 600}/month!`
        )

        console.log(`✅ Auto-assigned driver ${driver.full_name} → campaign ${campaign.company_name}`)
        assigned = true
        break // Only assign to one campaign
      }
    }

    res.json({
      success: true,
      assigned,
      message: assigned ? 'Driver auto-assigned to campaign' : 'No under-staffed campaigns found'
    })

  } catch (err) {
    console.error('Auto-assign on verified error:', err)
    res.status(500).json({ error: 'Failed to auto-assign driver' })
  }
})

// ─── POST /api/drivers/auto-assign-all ───────────────────────────
// Bulk auto-assign: for all active under-staffed campaigns, assign free verified drivers
router.post('/auto-assign-all', async (req, res) => {
  try {
    // Get all free verified drivers (not in any active/offered/accepted job)
    const { data: allDrivers } = await supabase
      .from('users')
      .select('id, full_name, city')
      .eq('role', 'driver')
      .eq('is_verified', true)

    const { data: busyJobs } = await supabase
      .from('driver_jobs')
      .select('driver_id')
      .in('status', ['offered', 'accepted', 'active'])

    const busyIds = new Set((busyJobs || []).map(j => j.driver_id))
    const freeDrivers = (allDrivers || []).filter(d => !busyIds.has(d.id))

    if (freeDrivers.length === 0) {
      return res.json({ success: true, message: 'No free verified drivers available', assignments: 0 })
    }

    // Get all active campaigns
    const { data: activeCampaigns } = await supabase
      .from('campaigns')
      .select('id, city, company_name, plans(name, rickshaw_count, driver_payout)')
      .eq('status', 'active')

    let totalAssignments = 0

    for (const campaign of (activeCampaigns || [])) {
      const neededDrivers = campaign.plans?.rickshaw_count || 1

      const { data: currentJobs } = await supabase
        .from('driver_jobs')
        .select('id')
        .eq('campaign_id', campaign.id)
        .neq('status', 'rejected')

      const currentCount = (currentJobs || []).length
      const slotsOpen = neededDrivers - currentCount

      if (slotsOpen <= 0) continue

      // Find free drivers in this campaign's city
      const cityDrivers = freeDrivers.filter(d =>
        d.city === campaign.city || campaign.city === 'both'
      )

      for (let i = 0; i < Math.min(slotsOpen, cityDrivers.length); i++) {
        const driver = cityDrivers[i]
        if (busyIds.has(driver.id)) continue // double-check

        const { error: assignErr } = await supabase
          .from('driver_jobs')
          .insert({
            driver_id: driver.id,
            campaign_id: campaign.id,
            status: 'offered'
          })

        if (assignErr) {
          console.error('Bulk assign error:', assignErr.message)
          continue
        }

        await sendNotification(
          driver.id,
          'job_offer',
          '🛺 New Job Offer!',
          `You've been assigned to campaign "${campaign.company_name}" in ${campaign.city}. Open your Jobs tab to accept!`
        )

        busyIds.add(driver.id) // mark as busy
        totalAssignments++
      }
    }

    res.json({
      success: true,
      message: `Auto-assigned ${totalAssignments} driver(s)`,
      assignments: totalAssignments
    })

  } catch (err) {
    console.error('Bulk auto-assign error:', err)
    res.status(500).json({ error: 'Failed to bulk auto-assign' })
  }
})

export default router
