import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function AppLayout({ children, navItems }) {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [signingOut, setSigningOut] = useState(false)

  async function handleSignOut() {
    setSigningOut(true)
    await signOut()
    navigate('/auth')
  }

  const roleColor = profile?.role === 'advertiser' ? 'var(--yellow)' :
                    profile?.role === 'driver' ? 'var(--green)' : 'var(--blue)'

  return (
    <div className="app-layout">
      {/* SIDEBAR */}
      <aside className="sidebar">
        {/* Logo */}
        <div style={{ padding: '24px 20px 16px', borderBottom: '1px solid var(--border)' }}>
          <div className="bebas" style={{ fontSize: '1.8rem', color: 'var(--yellow)', letterSpacing: '0.05em' }}>
            Ad<span style={{ color: 'var(--white)' }}>Wheels</span>
          </div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 6,
            background: `rgba(${profile?.role === 'advertiser' ? '255,208,0' : profile?.role === 'driver' ? '0,230,118' : '74,158,255'},0.1)`,
            border: `1px solid rgba(${profile?.role === 'advertiser' ? '255,208,0' : profile?.role === 'driver' ? '0,230,118' : '74,158,255'},0.25)`,
            borderRadius: 6, padding: '3px 10px'
          }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: roleColor }}>
              {profile?.role}
            </span>
          </div>
        </div>

        {/* User info */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--white)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {profile?.full_name || 'Loading...'}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
            📍 {profile?.city ? profile.city.charAt(0).toUpperCase() + profile.city.slice(1) : '—'}
          </div>
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, padding: '12px 0' }}>
          {navItems.map(item => (
            <button key={item.path} className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => navigate(item.path)}>
              <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Sign out */}
        <div style={{ padding: '16px', borderTop: '1px solid var(--border)' }}>
          <button className="nav-item" onClick={handleSignOut} disabled={signingOut}
            style={{ color: 'var(--red)', width: '100%' }}>
            <span>🚪</span>
            <span>{signingOut ? 'Signing out...' : 'Sign Out'}</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="main-content page-enter">
        {children}
      </main>
    </div>
  )
}
