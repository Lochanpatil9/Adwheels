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

  const { driverId } = req.body || {}

  if (!driverId) {
    return res.status(400).json({ error: 'driverId is required' })
  }

  try {
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

    const { data: existingJobs } = await supabase
      .from('driver_jobs')
      .select('id')
      .eq('driver_id', driverId)
      .in('status', ['offered', 'accepted', 'active'])

    if (existingJobs && existingJobs.length > 0) {
      return res.json({ success: true, message: 'Driver already has an active job', assigned: false })
    }

    const { data: activeCampaigns } = await supabase
      .from('campaigns')
      .select('id, city, company_name, plan_id, plans(name, rickshaw_count, driver_payout)')
      .eq('status', 'active')
      .or(`city.eq.${driver.city},city.eq.both`)

    if (!activeCampaigns || activeCampaigns.length === 0) {
      return res.json({ success: true, message: 'No active campaigns in driver city', assigned: false })
    }

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

        await sendNotification(
          driverId,
          'job_offer',
          '🛺 New Job Offer!',
          `You've been auto-assigned to campaign "${campaign.company_name}" in ${campaign.city}. Open your Jobs tab to accept and start earning ₹${campaign.plans?.driver_payout || 600}/month!`
        )

        console.log(`✅ Auto-assigned driver ${driver.full_name} → campaign ${campaign.company_name}`)
        assigned = true
        break
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
}
