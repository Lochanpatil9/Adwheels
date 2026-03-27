import { useState } from 'react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

const INP = { width: '100%', padding: '13px 15px', fontSize: '.95rem', border: '1.5px solid #E2E8F0', borderRadius: '10px', background: '#fff', color: '#0F172A', outline: 'none', fontFamily: 'inherit', marginBottom: '14px', transition: 'border-color .2s, box-shadow .2s' }
const LBL = { display: 'block', fontSize: '.74rem', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: '#64748B', marginBottom: '6px' }
const BTN = { width: '100%', padding: '14px', background: 'linear-gradient(135deg,#FFBF00,#FF8C00)', color: '#111', fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800, fontSize: '1rem', border: 'none', borderRadius: '12px', cursor: 'pointer', boxShadow: '0 4px 14px rgba(255,191,0,.4)', transition: 'all .2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleReset() {
    if (!password || !confirm) return toast.error('Fill in both fields')
    if (password.length < 6) return toast.error('Password must be at least 6 characters')
    if (password !== confirm) return toast.error('Passwords do not match')
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) toast.error(error.message)
    else {
      toast.success('Password updated! Redirecting to login…')
      setDone(true)
      setTimeout(async () => {
        await supabase.auth.signOut()
      }, 1500)
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', background: '#F8FAFC', fontFamily: "'DM Sans',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=Bebas+Neue&family=DM+Sans:wght@400;500;600&display=swap');
        .reset-inp:focus{border-color:#FFBF00!important;box-shadow:0 0 0 3px rgba(255,191,0,.12)!important}
        .reset-btn:hover{transform:translateY(-1px);box-shadow:0 8px 20px rgba(255,140,0,.45)!important}
      `}</style>

      <div style={{ width: '100%', maxWidth: '420px', background: '#fff', borderRadius: '24px', padding: '40px 36px', boxShadow: '0 8px 40px rgba(0,0,0,.08)', border: '1px solid #F1F5F9' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
          <div style={{ fontFamily: 'Bebas Neue', fontSize: '2.2rem', color: '#FFBF00', letterSpacing: '.06em' }}>AdWheels</div>
        </div>

        {done ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>✅</div>
            <h2 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800, fontSize: '1.4rem', color: '#0F172A', marginBottom: '8px' }}>Password Updated!</h2>
            <p style={{ color: '#64748B', fontSize: '.92rem' }}>Redirecting you to login…</p>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: '28px', textAlign: 'center' }}>
              <h1 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800, fontSize: '1.5rem', color: '#0F172A', marginBottom: '6px' }}>Set New Password 🔒</h1>
              <p style={{ color: '#64748B', fontSize: '.92rem' }}>Choose a strong new password for your account</p>
            </div>

            <label style={LBL}>New Password</label>
            <input
              style={INP}
              className="reset-inp"
              type="password"
              placeholder="Min. 6 characters"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleReset()}
            />

            <label style={LBL}>Confirm Password</label>
            <input
              style={INP}
              className="reset-inp"
              type="password"
              placeholder="Repeat your password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleReset()}
            />

            {/* Password strength hint */}
            <div style={{ background: '#F0FDF4', border: '1px solid #A7F3D0', borderRadius: '10px', padding: '12px 14px', marginBottom: '18px', fontSize: '.84rem', color: '#065F46', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <span style={{ flexShrink: 0 }}>🔒</span> Use a mix of letters, numbers, and symbols for a strong password.
            </div>

            <button style={{ ...BTN, opacity: loading ? .6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }} className="reset-btn" onClick={handleReset} disabled={loading}>
              {loading ? 'Updating…' : '✅ Update Password'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}