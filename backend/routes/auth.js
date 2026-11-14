import { Router } from 'express'
import supabase from '../lib/supabase.js'

const router = Router()

// POST /api/auth/link-profile
// When a Google OAuth user has no profile, this finds their existing profile
// by matching email in auth.users and re-links it to the new auth user ID.
router.post('/link-profile', async (req, res) => {
  console.log('🔗 link-profile API called')
  
  const authHeader = req.headers.authorization
  if (!authHeader) return res.status(401).json({ error: 'No token' })

  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  
  if (authError || !user) {
    console.log('🔗 Auth error:', authError?.message)
    return res.status(401).json({ error: 'Invalid token' })
  }

  const currentUserId = user.id
  const email = user.email
  console.log(`🔗 Current user: ${currentUserId}, email: ${email}`)
  
  if (!email) return res.json({ linked: false, reason: 'no email' })

  // Check if this user already has a profile (using service role = bypasses RLS)
  const { data: existingProfile } = await supabase
    .from('users')
    .select('*')
    .eq('id', currentUserId)
    .single()

  if (existingProfile) {
    console.log('🔗 Profile already exists for this user, returning it')
    return res.json({ linked: false, reason: 'profile already exists', profile: existingProfile })
  }

  // Find another auth user with the same email that HAS a profile
  const { data: authUsers, error: listError } = await supabase.auth.admin.listUsers({
    perPage: 1000
  })
  
  if (listError || !authUsers?.users) {
    console.log('🔗 Cannot list users:', listError?.message)
    return res.json({ linked: false, reason: 'cannot list users' })
  }

  console.log(`🔗 Found ${authUsers.users.length} auth users total`)
  
  const sameEmailUsers = authUsers.users.filter(u => u.email === email && u.id !== currentUserId)
  console.log(`🔗 Found ${sameEmailUsers.length} other auth users with same email`)
  
  if (sameEmailUsers.length === 0) {
    return res.json({ linked: false, reason: 'no other account with same email' })
  }

  for (const otherUser of sameEmailUsers) {
    const { data: oldProfile } = await supabase
      .from('users')
      .select('*')
      .eq('id', otherUser.id)
      .single()

    if (oldProfile) {
      console.log(`🔗 Found profile under old ID: ${otherUser.id}, re-linking to ${currentUserId}`)
      
      const { error: updateError } = await supabase
        .from('users')
        .update({ id: currentUserId })
        .eq('id', otherUser.id)

      if (updateError) {
        console.error('🔗 Link error:', updateError)
        return res.status(500).json({ linked: false, error: updateError.message })
      }

      console.log('🔗 ✅ Profile linked successfully!')
      return res.json({ linked: true, profile: { ...oldProfile, id: currentUserId } })
    }
  }

  console.log('🔗 No profile found on any matching auth user')
  return res.json({ linked: false, reason: 'no profile on matching accounts' })
})

// GET /api/auth/profile
// Fetches the user's profile using service role key (bypasses RLS)
router.get('/profile', async (req, res) => {
  const authHeader = req.headers.authorization
  if (!authHeader) return res.status(401).json({ error: 'No token' })

  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  
  if (authError || !user) return res.status(401).json({ error: 'Invalid token' })

  // Fetch profile using service role (bypasses all RLS)
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profile) {
    return res.json({ profile })
  }

  return res.json({ profile: null })
})

export default router
