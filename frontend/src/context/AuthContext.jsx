import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isPasswordReset, setIsPasswordReset] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordReset(true)
        setUser(session?.user ?? null)
        setLoading(false)
        return
      }
      setIsPasswordReset(false)
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user)
      else { setProfile(null); setLoading(false) }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(authUser) {
    // Always fetch via backend API (bypasses RLS, handles linking)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        setProfile(null)
        setLoading(false)
        return
      }

      // Step 1: Try fetching profile from backend (bypasses RLS)
      const profileRes = await fetch('/api/auth/profile', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      })
      const profileData = await profileRes.json()

      if (profileData.profile) {
        setProfile(profileData.profile)
        setLoading(false)
        return
      }

      // Step 2: No profile — try auto-linking by email (Google OAuth)
      const linkRes = await fetch('/api/auth/link-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        }
      })
      const linkData = await linkRes.json()

      if (linkData.profile) {
        setProfile(linkData.profile)
        setLoading(false)
        return
      }
    } catch (e) {
      console.error('Profile fetch error:', e)
    }

    // No profile found anywhere — new user needs setup
    setProfile(null)
    setLoading(false)
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, isPasswordReset, signOut, fetchProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
