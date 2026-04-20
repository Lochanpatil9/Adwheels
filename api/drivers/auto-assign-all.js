import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

async function sendNotification(userId, type, title, message) {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert({ user_id: userId, type, title, message })

    if (error) {
      console.error('❌ Notification insert error:', error.message)
    } else {
      console.log(`🔔 Notification sent → ${type} → ${userId.substring(0, 8)}…`)
    }
  } catch (err) {
    console.error('❌ Notification failed:', err.message)
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'https://adwheels.in')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
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

      const cityDrivers = freeDrivers.filter(d =>
        d.city === campaign.city || campaign.city === 'both'
      )

      for (let i = 0; i < Math.min(slotsOpen, cityDrivers.length); i++) {
        const driver = cityDrivers[i]
        if (busyIds.has(driver.id)) continue

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

        busyIds.add(driver.id)
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
}
