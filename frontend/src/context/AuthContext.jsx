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
      if (session?.user) fetchProfile(session.user.id)
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
      if (session?.user) fetchProfile(session.user.id)
      else { setProfile(null); setLoading(false) }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId) {
    // First, try to find profile by auth user ID
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (data) {
      setProfile(data)
      setLoading(false)
      return
    }

    // If not found by ID (e.g. Google OAuth new auth user), try by email
    if (error && (error.code === 'PGRST116' || error.message?.includes('recursion'))) {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      const email = authUser?.email
      
      if (email) {
        // Look up existing profile by email
        const { data: emailProfile } = await supabase
          .from('users')
          .select('*')
          .eq('email', email)
          .single()

        if (emailProfile) {
          // Found existing profile — update its ID to the new Google auth user ID
          const { error: updateError } = await supabase
            .from('users')
            .update({ id: userId })
            .eq('email', email)
          
          if (!updateError) {
            setProfile({ ...emailProfile, id: userId })
            setLoading(false)
            return
          }
        }
      }
    }

    if (error && error.code !== 'PGRST116' && !error.message?.includes('recursion')) {
      console.error('Failed to fetch profile:', error)
      toast.error('Failed to load profile. Please try again.')
    }
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
