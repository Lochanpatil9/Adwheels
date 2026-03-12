import { useState, useEffect } from 'react'
import AdminDashboard from './pages/AdminDashboard'
import { supabase } from './lib/supabase'
import AuthPage from './pages/AuthPage'
import AdvertiserDashboard from './pages/AdvertiserDashboard'
import DriverDashboard from './pages/DriverDashboard'
import LandingPage from './pages/LandingPage'
import { Toaster } from 'react-hot-toast'
import toast from 'react-hot-toast'

function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleReset() {
    if (!password || !confirm) return toast.error('Fill in both fields')
    if (password.length < 6) return toast.error('Password must be at least 6 characters')
    if (password !== confirm) return toast.error('Passwords do not match')
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) toast.error(error.message)
    else {
      toast.success('Password updated! Logging you in... done')
      await supabase.auth.signOut()
    }
    setLoading(false)
  }

  const s = {
    page: { minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:'20px', background:'var(--black)' },
    card: { width:'100%', maxWidth:'440px', background:'var(--card)', border:'1.5px solid var(--border)', borderRadius:'20px', padding:'40px' },
    logo: { fontFamily:'Bebas Neue', fontSize:'2.2rem', color:'var(--yellow)', letterSpacing:'0.05em', textAlign:'center', marginBottom:'4px' },
    title: { textAlign:'center', fontFamily:'Syne', fontWeight:800, fontSize:'1.2rem', marginBottom:'6px', marginTop:'24px' },
    sub: { textAlign:'center', fontSize:'0.85rem', color:'rgba(245,240,232,0.4)', marginBottom:'28px' },
    label: { display:'block', fontSize:'0.74rem', fontWeight:700, letterSpacing:'0.07em', textTransform:'uppercase', color:'rgba(245,240,232,0.45)', marginBottom:'7px' },
    input: { width:'100%', background:'rgba(245,240,232,0.04)', border:'1.5px solid rgba(245,240,232,0.09)', borderRadius:'8px', padding:'13px 15px', color:'var(--white)', fontSize:'0.93rem', outline:'none', marginBottom:'16px' },
    btn: { width:'100%', background:'var(--yellow)', color:'var(--black)', fontFamily:'Syne', fontSize:'1rem', fontWeight:800, padding:'15px', border:'none', borderRadius:'8px', cursor:'pointer', marginTop:'8px' },
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.logo}>AdWheels</div>
        <div style={s.title}>Set New Password</div>
        <div style={s.sub}>Choose a strong new password for your account</div>
        <label style={s.label}>New Password</label>
        <input style={s.input} type="password" placeholder="Min. 6 characters" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleReset()} />
        <label style={s.label}>Confirm Password</label>
        <input style={s.input} type="password" placeholder="Repeat your password" value={confirm} onChange={e => setConfirm(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleReset()} />
        <button style={s.btn} onClick={handleReset} disabled={loading}>
          {loading ? 'Updating...' : 'Update Password'}
        </button>
      </div>
    </div>
  )
}

export default function App() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isPasswordReset, setIsPasswordReset] = useState(false)
  const [showAuth, setShowAuth] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) fetchProfile(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordReset(true)
        setSession(session)
        setLoading(false)
        return
      }
      setIsPasswordReset(false)
      setSession(session)
      if (session) fetchProfile(session.user.id)
      else { setProfile(null); setLoading(false) }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId) {
    const { data } = await supabase.from('users').select('*').eq('id', userId).single()
    setProfile(data)
    setLoading(false)
  }

  const toaster = <Toaster position="top-center" toastOptions={{style:{background:'#1a1a1a',color:'#f5f0e8',border:'1px solid rgba(245,240,232,0.1)'}}}/>

  if (loading) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',flexDirection:'column',gap:'16px'}}>
      <div style={{fontFamily:'Bebas Neue',fontSize:'2.5rem',color:'var(--yellow)',letterSpacing:'0.05em'}}>AdWheels</div>
      <div style={{width:'36px',height:'36px',border:'3px solid var(--border)',borderTop:'3px solid var(--yellow)',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}></div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if (isPasswordReset) return <>{toaster}<ResetPasswordPage /></>
  if (!session && showAuth) return <><AuthPage />{toaster}</>
  if (!session) return <><LandingPage onGetStarted={() => setShowAuth(true)} />{toaster}</>
  if (profile?.role === 'driver') return <><DriverDashboard profile={profile} />{toaster}</>
  if (profile?.role === 'admin') return <><AdminDashboard profile={profile} />{toaster}</>
  if (profile?.role === 'advertiser') return <><AdvertiserDashboard profile={profile} />{toaster}</>

  return <><AuthPage setupMode={true} userId={session.user.id} />{toaster}</>
}