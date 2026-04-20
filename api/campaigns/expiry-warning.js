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

  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const fiveDaysFromNow = new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString()
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

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
      const { data: existing } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', campaign.advertiser_id)
        .eq('type', 'campaign_expiring')
        .ilike('message', `%${campaign.id.substring(0, 8)}%`)
        .limit(1)

      if (existing && existing.length > 0) continue

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
}
