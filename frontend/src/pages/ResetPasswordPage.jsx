import { useState } from 'react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { ShieldCheck, X as XIcon, Check, Eye, EyeOff } from 'lucide-react'

const INP = { width: '100%', padding: '13px 15px', fontSize: '.95rem', border: '1.5px solid #E2E8F0', borderRadius: '10px', background: '#fff', color: '#0F172A', outline: 'none', fontFamily: 'inherit', marginBottom: '14px', transition: 'border-color .2s, box-shadow .2s' }
const LBL = { display: 'block', fontSize: '.74rem', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: '#64748B', marginBottom: '6px' }
const BTN = { width: '100%', padding: '14px', background: 'linear-gradient(135deg,#FFBF00,#FF8C00)', color: '#111', fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800, fontSize: '1rem', border: 'none', borderRadius: '12px', cursor: 'pointer', boxShadow: '0 4px 14px rgba(255,191,0,.4)', transition: 'all .2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }

// Password validation rules
const PASSWORD_RULES = [
  { id: 'length', label: 'At least 8 characters', test: p => p.length >= 8 },
  { id: 'upper', label: 'One uppercase letter (A–Z)', test: p => /[A-Z]/.test(p) },
  { id: 'lower', label: 'One lowercase letter (a–z)', test: p => /[a-z]/.test(p) },
  { id: 'number', label: 'One number (0–9)', test: p => /[0-9]/.test(p) },
  { id: 'symbol', label: 'One symbol (!@#$%...)', test: p => /[^A-Za-z0-9]/.test(p) }
]

function getPasswordStrength(password) {
  if (!password) return { score: 0, label: '', color: '#E2E8F0' }
  const passed = PASSWORD_RULES.filter(r => r.test(password)).length
  if (passed <= 1) return { score: 1, label: 'Very Weak', color: '#E53935' }
  if (passed === 2) return { score: 2, label: 'Weak', color: '#FF8C00' }
  if (passed === 3) return { score: 3, label: 'Fair', color: '#FFBF00' }
  if (passed === 4) return { score: 4, label: 'Strong', color: '#1DB954' }
  return { score: 5, label: 'Very Strong', color: '#059669' }
}

function isPasswordValid(password) {
  return PASSWORD_RULES.every(r => r.test(password))
}

function PasswordStrengthMeter({ password }) {
  if (!password) return null
  const strength = getPasswordStrength(password)
  return (
    <div style={{ marginBottom: '18px', animation: 'slideUp .3s ease-out' }}>
      <div style={{ display: 'flex', gap: '4px', marginBottom: '10px' }}>
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} style={{ flex: 1, height: '5px', borderRadius: '99px', background: i <= strength.score ? strength.color : '#E2E8F0', transition: 'background .3s ease, transform .2s', transform: i <= strength.score ? 'scaleY(1.1)' : 'scaleY(1)' }} />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <span style={{ fontSize: '.78rem', fontWeight: 700, color: strength.color, fontFamily: "'DM Sans',sans-serif", display: 'flex', alignItems: 'center', gap: '5px' }}>
          <ShieldCheck size={13} /> {strength.label}
        </span>
        <span style={{ fontSize: '.72rem', color: '#94A3B8' }}>{PASSWORD_RULES.filter(r => r.test(password)).length}/{PASSWORD_RULES.length} rules met</span>
      </div>
      <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '12px 14px' }}>
        {PASSWORD_RULES.map(rule => {
          const passed = rule.test(password)
          return (
            <div key={rule.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 0', transition: 'all .2s' }}>
              <div style={{ width: '18px', height: '18px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: passed ? '#D1FAE5' : '#FEE2E2', transition: 'background .3s' }}>
                {passed ? <Check size={11} style={{ color: '#059669' }} /> : <XIcon size={11} style={{ color: '#E53935' }} />}
              </div>
              <span style={{ fontSize: '.82rem', color: passed ? '#065F46' : '#9CA3AF', fontWeight: passed ? 600 : 400, transition: 'color .3s', fontFamily: "'DM Sans',sans-serif" }}>{rule.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [showPwd, setShowPwd] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  async function handleReset() {
    if (!password || !confirm) return toast.error('Fill in both fields')
    if (!isPasswordValid(password)) {
      const failed = PASSWORD_RULES.filter(r => !r.test(password))
      return toast.error(`Password needs: ${failed.map(r => r.label).join(', ')}`)
    }
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
        @keyframes slideUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
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
              <h1 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800, fontSize: '1.5rem', color: '#0F172A', marginBottom: '6px' }}>Set New Password</h1>
              <p style={{ color: '#64748B', fontSize: '.92rem' }}>Choose a strong new password for your account</p>
            </div>

            <label style={LBL}>New Password</label>
            <div style={{ position: 'relative' }}>
              <input
                style={{ ...INP, paddingRight: '44px', marginBottom: password ? '8px' : '14px', borderColor: password ? (isPasswordValid(password) ? '#1DB954' : '#E2E8F0') : '#E2E8F0' }}
                className="reset-inp"
                type={showPwd ? 'text' : 'password'}
                placeholder="Create a strong password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleReset()}
              />
              <button type="button" onClick={() => setShowPwd(!showPwd)} style={{ position: 'absolute', right: '12px', top: '13px', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: '4px', display: 'flex', alignItems: 'center' }} title={showPwd ? 'Hide' : 'Show'}>
                {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <PasswordStrengthMeter password={password} />

            <label style={LBL}>Confirm Password</label>
            <div style={{ position: 'relative' }}>
              <input
                style={{ ...INP, paddingRight: '44px', borderColor: confirm ? (confirm === password && isPasswordValid(password) ? '#1DB954' : confirm !== password ? '#E53935' : '#E2E8F0') : '#E2E8F0' }}
                className="reset-inp"
                type={showConfirm ? 'text' : 'password'}
                placeholder="Repeat your password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleReset()}
              />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={{ position: 'absolute', right: '12px', top: '13px', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: '4px', display: 'flex', alignItems: 'center' }} title={showConfirm ? 'Hide' : 'Show'}>
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Password match indicator */}
            {confirm && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '14px', animation: 'slideUp .2s ease-out' }}>
                <div style={{ width: '16px', height: '16px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: confirm === password ? '#D1FAE5' : '#FEE2E2' }}>
                  {confirm === password ? <Check size={10} style={{ color: '#059669' }} /> : <XIcon size={10} style={{ color: '#E53935' }} />}
                </div>
                <span style={{ fontSize: '.82rem', color: confirm === password ? '#065F46' : '#E53935', fontWeight: 600, fontFamily: "'DM Sans',sans-serif" }}>
                  {confirm === password ? 'Passwords match' : 'Passwords do not match'}
                </span>
              </div>
            )}

            {/* Security notice */}
            <div style={{ background: '#F0FDF4', border: '1px solid #A7F3D0', borderRadius: '10px', padding: '12px 14px', marginBottom: '18px', fontSize: '.84rem', color: '#065F46', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <ShieldCheck size={14} style={{ flexShrink: 0, marginTop: '1px' }} /> Your new password is encrypted. We never store or share it in plain text.
            </div>

            <button style={{ ...BTN, opacity: loading || !isPasswordValid(password) || password !== confirm ? .6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }} className="reset-btn" onClick={handleReset} disabled={loading || !isPasswordValid(password) || password !== confirm}>
              {loading ? 'Updating…' : 'Update Password'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}