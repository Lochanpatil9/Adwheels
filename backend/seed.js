import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// ── Test accounts to create ──
const TEST_USERS = [
  { email: 'admin@adwheels.com',     password: 'Admin@123', full_name: 'Rajat Admin',        phone: '+91 98765 00001', city: 'indore', role: 'admin' },
  { email: 'advertiser@test.com',    password: 'Test@123',  full_name: 'Priya Sharma',       phone: '+91 98765 00002', city: 'indore', role: 'advertiser' },
  { email: 'driver@test.com',        password: 'Test@123',  full_name: 'Amit Patel',         phone: '+91 98765 00003', city: 'indore', role: 'driver', vehicle_number: 'MP09 AB 1234', upi_id: 'amit@upi' },
  { email: 'driver2@test.com',       password: 'Test@123',  full_name: 'Suresh Kumar',       phone: '+91 98765 00004', city: 'bhopal', role: 'driver', vehicle_number: 'MP04 CD 5678', upi_id: 'suresh@upi' },
  { email: 'advertiser2@test.com',   password: 'Test@123',  full_name: 'Neha Technologies',  phone: '+91 98765 00005', city: 'bhopal', role: 'advertiser' },
]

async function seed() {
  console.log('🌱 Starting AdWheels seed...\n')

  // ─────────────────────────────────
  // 1. Create auth users + profiles
  // ─────────────────────────────────
  console.log('👤 Creating users...')
  const userIds = {}

  for (const u of TEST_USERS) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
    })

    if (error) {
      if (error.message.includes('already been registered')) {
        const { data: list } = await supabase.auth.admin.listUsers()
        const existing = list.users.find(x => x.email === u.email)
        if (existing) {
          userIds[u.email] = existing.id
          console.log(`   ⏭  ${u.email} already exists (${existing.id})`)

          // Ensure profile exists too
          const { error: upsertErr } = await supabase.from('users').upsert({
            id: existing.id,
            full_name: u.full_name,
            phone: u.phone,
            city: u.city,
            role: u.role,
            vehicle_number: u.vehicle_number || null,
            upi_id: u.upi_id || null,
          })
          if (upsertErr) console.error(`   ❌ Profile upsert for ${u.email}:`, upsertErr.message)
        }
        continue
      }
      console.error(`   ❌ Failed to create ${u.email}:`, error.message)
      continue
    }

    userIds[u.email] = data.user.id
    console.log(`   ✅ ${u.email} → ${data.user.id}`)

    const { error: profileErr } = await supabase.from('users').upsert({
      id: data.user.id,
      full_name: u.full_name,
      phone: u.phone,
      city: u.city,
      role: u.role,
      vehicle_number: u.vehicle_number || null,
      upi_id: u.upi_id || null,
    })
    if (profileErr) console.error(`   ❌ Profile for ${u.email}:`, profileErr.message)
  }

  const adminId       = userIds['admin@adwheels.com']
  const advertiserId  = userIds['advertiser@test.com']
  const driverId      = userIds['driver@test.com']
  const driver2Id     = userIds['driver2@test.com']
  const advertiser2Id = userIds['advertiser2@test.com']

  if (!advertiserId || !driverId) {
    console.error('\n❌ Could not get user IDs. Fix errors above and retry.')
    process.exit(1)
  }

  // ─────────────────────────────────
  // 2. Plans (matches actual DB columns)
  // ─────────────────────────────────
  console.log('\n📋 Inserting plans...')
  const { data: plans, error: planErr } = await supabase.from('plans').upsert([
    { name: 'Starter', price: 4999,  rickshaw_count: 5,  driver_payout: 175, is_urgent: false, has_live_tracking: false, has_account_manager: false, print_reimbursement: false },
    { name: 'Growth',  price: 9999,  rickshaw_count: 15, driver_payout: 175, is_urgent: false, has_live_tracking: true,  has_account_manager: false, print_reimbursement: true },
    { name: 'Pro',     price: 19999, rickshaw_count: 30, driver_payout: 200, is_urgent: true,  has_live_tracking: true,  has_account_manager: true,  print_reimbursement: true },
  ], { onConflict: 'name' }).select()

  if (planErr) console.error('   ❌ Plans:', planErr.message)
  else console.log(`   ✅ ${plans.length} plans`)

  const starterPlan = plans?.find(p => p.name === 'Starter')
  const growthPlan  = plans?.find(p => p.name === 'Growth')
  const proPlan     = plans?.find(p => p.name === 'Pro')

  // ─────────────────────────────────
  // 3. Campaigns (matches actual DB columns)
  // ─────────────────────────────────
  console.log('\n📢 Inserting campaigns...')
  const daysAgo   = (n) => new Date(Date.now() - n * 86400000).toISOString()
  const daysLater = (n) => new Date(Date.now() + n * 86400000).toISOString()

  const { data: campaigns, error: campErr } = await supabase.from('campaigns').insert([
    { advertiser_id: advertiserId,  plan_id: growthPlan?.id,   company_name: 'Priya Fashion Store', city: 'indore', area: 'Vijay Nagar',    status: 'active',    starts_at: daysAgo(3) },
    { advertiser_id: advertiserId,  plan_id: starterPlan?.id,  company_name: 'Priya Summer Sale',   city: 'indore', area: 'Palasia',        status: 'pending',   starts_at: null },
    { advertiser_id: advertiser2Id, plan_id: proPlan?.id,      company_name: 'Neha Tech Solutions', city: 'bhopal', area: 'MP Nagar',       status: 'active',    starts_at: daysAgo(10) },
    { advertiser_id: advertiser2Id, plan_id: starterPlan?.id,  company_name: 'Neha App Launch',     city: 'bhopal', area: 'Arera Colony',   status: 'completed', starts_at: daysAgo(30) },
  ]).select()

  if (campErr) console.error('   ❌ Campaigns:', campErr.message)
  else console.log(`   ✅ ${campaigns.length} campaigns`)

  const camp1 = campaigns?.[0]  // Priya active
  const camp3 = campaigns?.[2]  // Neha active
  const camp4 = campaigns?.[3]  // Neha completed

  // ─────────────────────────────────
  // 4. Jobs
  // ─────────────────────────────────
  console.log('\n🚗 Inserting jobs...')
  const { data: jobs, error: jobErr } = await supabase.from('jobs').insert([
    { campaign_id: camp1?.id, driver_id: driverId,  city: 'indore', status: 'completed',      earning: 350, assigned_at: daysAgo(3),  completed_at: daysAgo(1) },
    { campaign_id: camp1?.id, driver_id: driverId,  city: 'indore', status: 'in_progress',    earning: 350, assigned_at: daysAgo(1) },
    { campaign_id: camp1?.id, driver_id: null,       city: 'indore', status: 'open',           earning: 300 },
    { campaign_id: camp3?.id, driver_id: driver2Id,  city: 'bhopal', status: 'completed',      earning: 500, assigned_at: daysAgo(8),  completed_at: daysAgo(5) },
    { campaign_id: camp3?.id, driver_id: driver2Id,  city: 'bhopal', status: 'proof_uploaded', earning: 500, assigned_at: daysAgo(4) },
    { campaign_id: camp3?.id, driver_id: null,       city: 'bhopal', status: 'open',           earning: 400 },
    { campaign_id: camp4?.id, driver_id: driverId,   city: 'bhopal', status: 'completed',      earning: 250, assigned_at: daysAgo(28), completed_at: daysAgo(25) },
  ]).select()

  if (jobErr) console.error('   ❌ Jobs:', jobErr.message)
  else console.log(`   ✅ ${jobs.length} jobs`)

  // ─────────────────────────────────
  // 5. Payouts (matches actual DB statuses: requested, processing, paid)
  // ─────────────────────────────────
  console.log('\n💰 Inserting payouts...')
  const { data: payouts, error: payErr } = await supabase.from('payouts').insert([
    { driver_id: driverId,  amount: 350, upi_id: 'amit@upi',   status: 'paid' },
    { driver_id: driverId,  amount: 250, upi_id: 'amit@upi',   status: 'requested' },
    { driver_id: driver2Id, amount: 500, upi_id: 'suresh@upi', status: 'paid' },
  ]).select()

  if (payErr) console.error('   ❌ Payouts:', payErr.message)
  else console.log(`   ✅ ${payouts.length} payouts`)

  // ─────────────────────────────────
  // 6. Enterprise Leads (matches actual DB columns)
  // ─────────────────────────────────
  console.log('\n🏢 Inserting enterprise leads...')
  const { data: leads, error: leadErr } = await supabase.from('enterprise_leads').insert([
    { full_name: 'Rahul Mehta',  phone: '+91 98001 11111', email: 'rahul@zomato.example',  company_name: 'Zomato Indore', city: 'indore', message: 'We want to run auto ads across Indore for our new delivery service launch.' },
    { full_name: 'Anita Desai',  phone: '+91 98002 22222', email: 'anita@bms.example',      company_name: 'BookMyShow',    city: 'bhopal', message: 'Looking for multi-city campaign for upcoming movie promotions.' },
  ]).select()

  if (leadErr) console.error('   ❌ Leads:', leadErr.message)
  else console.log(`   ✅ ${leads.length} leads`)

  // ─────────────────────────────────
  // 7. Registrations
  // ─────────────────────────────────
  console.log('\n📝 Inserting registrations...')
  const { data: regs, error: regErr } = await supabase.from('registrations').insert([
    { name: 'Vikram Singh',   phone: '+91 99887 76655', city: 'indore', role: 'driver' },
    { name: 'Meena Textiles', phone: '+91 88776 65544', city: 'indore', role: 'advertiser' },
    { name: 'Raju Auto',      phone: '+91 77665 54433', city: 'bhopal', role: 'driver' },
    { name: 'Cafe Delight',   phone: '+91 66554 43322', city: 'bhopal', role: 'advertiser' },
  ]).select()

  if (regErr) console.error('   ❌ Registrations:', regErr.message)
  else console.log(`   ✅ ${regs.length} registrations`)

  // ─────────────────────────────────
  // Done!
  // ─────────────────────────────────
  console.log('\n═══════════════════════════════════════')
  console.log('🎉 Seed complete! Test accounts:')
  console.log('═══════════════════════════════════════')
  console.log('  admin@adwheels.com    / Admin@123  (Admin)')
  console.log('  advertiser@test.com   / Test@123   (Advertiser)')
  console.log('  driver@test.com       / Test@123   (Driver)')
  console.log('  advertiser2@test.com  / Test@123   (Advertiser)')
  console.log('  driver2@test.com      / Test@123   (Driver)')
  console.log('═══════════════════════════════════════\n')
}

seed().catch(console.error)
