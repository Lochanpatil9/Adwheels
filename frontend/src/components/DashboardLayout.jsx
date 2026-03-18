import { LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

export default function DashboardLayout({
  children, tabs, activeTab, onTabChange,
  profile, badge, accentColor,
}) {
  const { signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const active = accentColor || 'var(--yellow)'

  return (
    <div className="dashboard">
      <nav className="dash-nav">
        <div className="dash-nav-left">
          <div className="dash-logo">AdWheels</div>
          {badge && (
            <span className={`dash-badge dash-badge--${badge.toLowerCase()}`}>{badge}</span>
          )}
        </div>
        <div className="dash-nav-right">
          <span className="dash-greeting">
            {profile?.role === 'admin' ? '👑' : '👋'} {profile?.full_name}
          </span>
          <button className="theme-toggle" onClick={toggleTheme}
            title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}>
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          <button className="dash-logout-btn" onClick={signOut}>
            <LogOut size={14} /> Logout
          </button>
        </div>
      </nav>

      <div className="dash-content">
        {tabs && (
          <div className="dash-tabs">
            {tabs.map(t => (
              <button
                key={t.key}
                className={`dash-tab${activeTab === t.key ? ' dash-tab--active' : ''}`}
                style={activeTab === t.key ? { background: active, color: 'var(--text-on-yellow)' } : undefined}
                onClick={() => onTabChange(t.key)}
              >{t.label}</button>
            ))}
          </div>
        )}
        {children}
      </div>
    </div>
  )
}