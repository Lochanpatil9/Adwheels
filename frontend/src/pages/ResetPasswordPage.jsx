import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useTheme } from '../context/ThemeContext'
import toast from 'react-hot-toast'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [loading, setLoading]   = useState(false)
  const { theme, toggleTheme }  = useTheme()

  async function handleReset() {
    if (!password || !confirm) return toast.error('Fill in both fields')
    if (password.length < 6)   return toast.error('Password must be at least 6 characters')
    if (password !== confirm)   return toast.error('Passwords do not match')
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) toast.error(error.message)
    else {
      toast.success('Password updated! Please log in with your new password.')
      await supabase.auth.signOut()
    }
    setLoading(false)
  }

  return (
    <div className="auth-page">
      {/* theme toggle */}
      <button
        onClick={toggleTheme}
        style={{
          position: 'fixed', top: '16px', right: '16px',
          background: 'var(--tab-bg)', border: '1px solid var(--border)',
          borderRadius: '8px', padding: '8px 11px', cursor: 'pointer',
          fontSize: '1rem', color: 'var(--text)', zIndex: 10,
        }}
        title="Toggle theme"
      >
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>

      <div className="auth-card">
        <div className="auth-logo">AdWheels</div>
        <h2 className="auth-title">Set New Password</h2>
        <p className="auth-subtitle">Choose a strong new password for your account</p>

        <label className="form-label">New Password</label>
        <input
          className="form-input"
          type="password"
          placeholder="Min. 6 characters"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleReset()}
        />

        <label className="form-label">Confirm Password</label>
        <input
          className="form-input"
          type="password"
          placeholder="Repeat your password"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleReset()}
        />

        <button className="btn-primary btn-full" onClick={handleReset} disabled={loading}>
          {loading ? 'Updating…' : 'Update Password'}
        </button>
      </div>
    </div>
  )
}