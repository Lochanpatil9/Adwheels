import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import AppLayout from '../../components/AppLayout'

const NAV = [
  { path: '/advertiser', icon: '📊', label: 'Dashboard' },
  { path: '/advertiser/create', icon: '🚀', label: 'New Campaign' },
  { path: '/advertiser/campaigns', icon: '📋', label: 'My Campaigns' },
]

const STATUS_BADGE = {
  pending:   { label: 'Pending Payment', cls: 'badge-muted' },
  paid:      { label: 'Finding Drivers', cls: 'badge-yellow' },
  active:    { label: 'Live 🟢', cls: 'badge-green' },
  completed: { label: 'Completed', cls: 'badge-blue' },
  cancelled: { label: 'Cancelled', cls: 'badge-red' },
}

export default function AdvertiserDashboard() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profile) fetchData()
  }, [profile])

  async function fetchData() {
    // 🎓 LESSON: We fetch campaigns and join with plans table to get plan name
    const { data } = await supabase
      .from('campaigns')
      .select('*, plans(name, rickshaw_count, price)')
      .eq('advertiser_id', profile.id)
      .order('created_at', { ascending: false })
    setCampaigns(data || [])
    setLoading(false)
  }

  const active = campaigns.filter(c => c.status === 'active')
  const pending = campaigns.filter(c => c.status === 'pending' || c.status === 'paid')
  const totalRickshaws = active.reduce((sum, c) => sum + (c.plans?.rickshaw_count || 0), 0)

  return (
    <AppLayout navItems={NAV}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 className="syne" style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 4 }}>
          Welcome back 👋
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
          {profile?.full_name} · {profile?.city}
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px,1fr))', gap: 16, marginBottom: 32 }}>
        <div className="stat-card">
          <div className="stat-num">{active.length}</div>
          <div className="stat-label">Active Campaigns</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{totalRickshaws}</div>
          <div className="stat-label">Rickshaws Running</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{pending.length}</div>
          <div className="stat-label">Pending</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{campaigns.length}</div>
          <div className="stat-label">Total Campaigns</div>
        </div>
      </div>

      {/* CTA if no campaigns */}
      {!loading && campaigns.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '56px 24px', marginBottom: 32 }}>
          <div style={{ fontSize: '3.5rem', marginBottom: 16 }}>🚀</div>
          <h2 className="syne" style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 8 }}>Launch Your First Campaign</h2>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: 24, maxWidth: 360, margin: '0 auto 24px' }}>
            Get your ad moving through Indore or Bhopal's streets in 90 minutes
          </p>
          <button className="btn btn-yellow btn-lg" onClick={() => navigate('/advertiser/create')}>
            Create Campaign →
          </button>
        </div>
      )}

      {/* Recent campaigns */}
      {campaigns.length > 0 && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 className="syne" style={{ fontSize: '1.2rem', fontWeight: 800 }}>Recent Campaigns</h2>
            <button className="btn btn-outline btn-sm" onClick={() => navigate('/advertiser/campaigns')}>View All</button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {campaigns.slice(0, 5).map(c => {
              const badge = STATUS_BADGE[c.status] || STATUS_BADGE.pending
              return (
                <div key={c.id} className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    {c.banner_url
                      ? <img src={c.banner_url} style={{ width: 56, height: 40, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--border)' }} />
                      : <div style={{ width: 56, height: 40, background: 'rgba(255,208,0,0.08)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>🖼️</div>
                    }
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{c.plans?.name || '—'} Plan</div>
                      <div style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>
                        📍 {c.city} · {c.plans?.rickshaw_count} rickshaw{c.plans?.rickshaw_count > 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span className={`badge ${badge.cls}`}>{badge.label}</span>
                    <span style={{ color: 'var(--yellow)', fontFamily: 'Bebas Neue', fontSize: '1.1rem' }}>
                      ₹{c.plans?.price?.toLocaleString()}/mo
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* New campaign button */}
      {campaigns.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <button className="btn btn-yellow" onClick={() => navigate('/advertiser/create')}>
            + New Campaign
          </button>
        </div>
      )}
    </AppLayout>
  )
}
