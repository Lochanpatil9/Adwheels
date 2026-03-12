import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

// 🎓 LESSON: Context = a global variable the whole app can read
// Instead of passing user data to every component, we store it here once
const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)       // Supabase auth user
  const [profile, setProfile] = useState(null) // Our users table row
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is already logged in when app loads
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else setLoading(false)
    })

    // Listen for login/logout events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else { setProfile(null); setLoading(false) }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId) {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
    setProfile(data)
    setLoading(false)
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut, fetchProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook - any component can call useAuth() to get user info
export const useAuth = () => useContext(AuthContext)
