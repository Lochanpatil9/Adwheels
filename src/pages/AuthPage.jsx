import { useState } from 'react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

const styles = {
  page: { minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:'20px', background:'var(--black)', position:'relative', overflow:'hidden' },
  glow: { position:'absolute', width:'600px', height:'600px', background:'radial-gradient(circle, rgba(255,208,0,0.06) 0%, transparent 65%)', top:'50%', left:'50%', transform:'translate(-50%,-50%)', pointerEvents:'none' },
  card: { width:'100%', maxWidth:'440px', background:'var(--card)', border:'1.5px solid var(--border)', borderRadius:'20px', padding:'40px', position:'relative', zIndex:1 },
  logo: { fontFamily:'Bebas Neue', fontSize:'2.2rem', color:'var(--yellow)', letterSpacing:'0.05em', textAlign:'center', marginBottom:'4px' },
  tagline: { textAlign:'center', fontSize:'0.82rem', color:'rgba(245,240,232,0.4)', marginBottom:'32px' },
  tabs: { display:'grid', gridTemplateColumns:'1fr 1fr', background:'rgba(245,240,232,0.04)', borderRadius:'8px', padding:'4px', marginBottom:'28px', gap:'4px' },
  tabBtn: (active) => ({ padding:'10px', border:'none', borderRadius:'6px', fontFamily:'Syne', fontSize:'0.88rem', fontWeight:700, cursor:'pointer', transition:'all 0.2s', background: active ? 'var(--yellow)' : 'transparent', color: active ? 'var(--black)' : 'rgba(245,240,232,0.4)' }),
  label: { display:'block', fontSize:'0.74rem', fontWeight:700, letterSpacing:'0.07em', textTransform:'uppercase', color:'rgba(245,240,232,0.45)', marginBottom:'7px' },
  input: { width:'100%', background:'rgba(245,240,232,0.04)', border:'1.5px solid rgba(245,240,232,0.09)', borderRadius:'8px', padding:'13px 15px', color:'var(--white)', fontSize:'0.93rem', outline:'none', marginBottom:'16px', transition:'border-color 0.2s' },
  roleGrid: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'20px' },
  roleCard: (active) => ({ padding:'20px 16px', borderRadius:'12px', border: active ? '2px solid var(--yellow)' : '1.5px solid rgba(245,240,232,0.08)', background: active ? 'rgba(255,208,0,0.08)' : 'rgba(245,240,232,0.02)', cursor:'pointer', textAlign:'center', transition:'all 0.2s' }),
  roleEmoji: { fontSize:'2rem', display:'block', marginBottom:'8px' },
  roleTitle: (active) => ({ fontFamily:'Syne', fontSize:'0.95rem', fontWeight:700, color: active ? 'var(--yellow)' : 'var(--white)' }),
  roleDesc: { fontSize:'0.75rem', color:'rgba(245,240,232,0.4)', marginTop:'4px' },
  btn: { width:'100%', background:'var(--yellow)', color:'var(--black)', fontFamily:'Syne', fontSize:'1rem', fontWeight:800, letterSpacing:'0.05em', padding:'15px', border:'none', borderRadius:'8px', cursor:'pointer', marginTop:'8px', transition:'all 0.2s' },
  forgotBtn: { width:'100%', background:'none', border:'none', textAlign:'center', marginTop:'12px', fontSize:'0.85rem', color:'rgba(245,240,232,0.4)', cursor:'pointer', textDecoration:'underline' },
  switchText: { textAlign:'center', fontSize:'0.85rem', color:'rgba(245,240,232,0.4)', marginTop:'16px' },
  switchBtn: { color:'var(--yellow)', cursor:'pointer', fontWeight:600, background:'none', border:'none', fontSize:'0.85rem' },
  select: { width:'100%', background:'rgba(245,240,232,0.04)', border:'1.5px solid rgba(245,240,232,0.09)', borderRadius:'8px', padding:'13px 15px', color:'var(--white)', fontSize:'0.93rem', outline:'none', marginBottom:'16px', WebkitAppearance:'none' },
}

export default function AuthPage() {
  const [mode, setMode] = useState('login')
  const [role, setRole] = useState('advertiser')
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ email:'', password:'', full_name:'', phone:'', city:'', vehicle_number:'', upi_id:'' })

  function updateForm(key, val) { setForm(f => ({...f, [key]: val})) }

  async function handleLogin() {
    if (!form.email || !form.password) return toast.error('Fill in all fields')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password })
    if (error) toast.error(error.message)
    setLoading(false)
  }

  async function handleForgotPassword() {
    if (!form.email) return toast.error('Enter your email address first')
    const { error } = await supabase.auth.resetPasswordForEmail(form.email, {
      redirectTo: 'http://localhost:5173'
    })
    if (error) toast.error(error.message)
    else toast.success('Password reset email sent! Check your inbox 📧')
  }

  async function handleSignup() {
    if (!form.email || !form.password || !form.full_name || !form.phone || !form.city)
      return toast.error('Please fill all required fields')
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters')
    setLoading(true)
    const { data, error } = await supabase.auth.signUp({ email: form.email, password: form.password })
    if (error) { toast.error(error.message); setLoading(false); return }
    const { error: profileError } = await supabase.from('users').insert({
      id: data.user.id,
      full_name: form.full_name,
      phone: form.phone,
      city: form.city,
      role: role,
      upi_id: form.upi_id || null,
      vehicle_number: form.vehicle_number || null,
    })
    if (profileError) toast.error(profileError.message)
    else toast.success('Account created! Welcome to AdWheels 🎉')
    setLoading(false)
  }

  return (
    <div style={styles.page}>
      <div style={styles.glow} />
      <div style={styles.card}>
        <div style={styles.logo}>AdWheels</div>
        <div style={styles.tagline}>Your ad on roads in 90 minutes</div>

        <div style={styles.tabs}>
          <button style={styles.tabBtn(mode==='login')} onClick={() => setMode('login')}>Login</button>
          <button style={styles.tabBtn(mode==='signup')} onClick={() => setMode('signup')}>Sign Up</button>
        </div>

        {/* LOGIN FORM */}
        {mode === 'login' && <>
          <label style={styles.label}>Email</label>
          <input style={styles.input} type="email" placeholder="your@email.com" value={form.email} onChange={e => updateForm('email', e.target.value)} />

          <label style={styles.label}>Password</label>
          <input style={styles.input} type="password" placeholder="Your password" value={form.password} onChange={e => updateForm('password', e.target.value)} />

          <button style={styles.btn} onClick={handleLogin} disabled={loading}>
            {loading ? 'Logging in...' : 'Login to AdWheels →'}
          </button>

          <button style={styles.forgotBtn} onClick={handleForgotPassword}>
            Forgot password? Reset via email
          </button>
        </>}

        {/* SIGNUP FORM */}
        {mode === 'signup' && <>
          <div style={{fontSize:'0.74rem',fontWeight:700,letterSpacing:'0.07em',textTransform:'uppercase',color:'rgba(245,240,232,0.45)',marginBottom:'10px'}}>I am a...</div>
          <div style={styles.roleGrid}>
            <div style={styles.roleCard(role==='advertiser')} onClick={() => setRole('advertiser')}>
              <span style={styles.roleEmoji}>🏢</span>
              <div style={styles.roleTitle(role==='advertiser')}>Advertiser</div>
              <div style={styles.roleDesc}>I want to run ads</div>
            </div>
            <div style={styles.roleCard(role==='driver')} onClick={() => setRole('driver')}>
              <span style={styles.roleEmoji}>🛺</span>
              <div style={styles.roleTitle(role==='driver')}>Driver</div>
              <div style={styles.roleDesc}>I want to earn</div>
            </div>
          </div>

          <label style={styles.label}>Full Name *</label>
          <input style={styles.input} placeholder="Your full name" value={form.full_name} onChange={e => updateForm('full_name', e.target.value)} />

          <label style={styles.label}>Phone Number *</label>
          <input style={styles.input} placeholder="+91 XXXXX XXXXX" value={form.phone} onChange={e => updateForm('phone', e.target.value)} />

          <label style={styles.label}>City *</label>
          <select style={styles.select} value={form.city} onChange={e => updateForm('city', e.target.value)}>
            <option value="">Select your city</option>
            <option value="indore">Indore</option>
            <option value="bhopal">Bhopal</option>
          </select>

          {role === 'driver' && <>
            <label style={styles.label}>Vehicle Number</label>
            <input style={styles.input} placeholder="e.g. MP09 AB 1234" value={form.vehicle_number} onChange={e => updateForm('vehicle_number', e.target.value)} />
            <label style={styles.label}>UPI ID (for payouts)</label>
            <input style={styles.input} placeholder="yourname@upi" value={form.upi_id} onChange={e => updateForm('upi_id', e.target.value)} />
          </>}

          <label style={styles.label}>Email *</label>
          <input style={styles.input} type="email" placeholder="your@email.com" value={form.email} onChange={e => updateForm('email', e.target.value)} />

          <label style={styles.label}>Password *</label>
          <input style={styles.input} type="password" placeholder="Min. 6 characters" value={form.password} onChange={e => updateForm('password', e.target.value)} />

          <button style={styles.btn} onClick={handleSignup} disabled={loading}>
            {loading ? 'Creating Account...' : 'Create My Account →'}
          </button>
        </>}

        <div style={styles.switchText}>
          {mode === 'login'
            ? <>No account? <button style={styles.switchBtn} onClick={() => setMode('signup')}>Sign up free</button></>
            : <>Already have account? <button style={styles.switchBtn} onClick={() => setMode('login')}>Login</button></>
          }
        </div>
      </div>
    </div>
  )
}
