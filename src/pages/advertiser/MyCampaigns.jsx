import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { openRazorpayCheckout } from '../../lib/razorpay'
import toast from 'react-hot-toast'
import AppLayout from '../../components/AppLayout'

const NAV = [
  { path: '/advertiser', icon: '📊', label: 'Dashboard' },
  { path: '/advertiser/create', icon: '🚀', label: 'New Campaign' },
  { path: '/advertiser/campaigns', icon: '📋', label: 'My Campaigns' },
]

const STATUS_BADGE = {
  pending:   { label: 'Pending Payment', cls: 'badge-muted', icon: '⏳' },
  paid:      { label: 'Finding Drivers', cls: 'badge-yellow', icon: '🔍' },
  active:    { label: 'Live', cls: 'badge-green', icon: '🟢' },
  completed: { label: 'Completed', cls: 'badge-blue', icon: '✅' },
  cancelled: { label: 'Cancelled', cls: 'badge-red', icon: '❌' },
}

export default function MyCampaigns() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => { if (profile) fetchCampaigns() }, [profile])

  async function fetchCampaigns() {
    const { data } = await supabase
      .from('campaigns')
      .select('*, plans(name, rickshaw_count, price, has_live_tracking)')
      .eq('advertiser_id', profile.id)
      .order('created_at', { ascending: false })
    setCampaigns(data || [])
    setLoading(false)
  }

  function handlePayment(campaign) {
    openRazorpayCheckout({
      amount: campaign.plans?.price,
      campaignId: campaign.id,
      planName: campaign.plans?.name,
      profile,
      onSuccess: () => { toast.success('Payment successful! 🎉 Campaign activated.'); fetchCampaigns() },
      onFailure: (msg) => { if (msg !== 'Payment cancelled.') toast.error(msg || 'Payment failed.') },
    })
  }

  const filtered = filter === 'all' ? campaigns : campaigns.filter(c => c.status === filter)

  return (
    <AppLayout navItems={NAV}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="syne" style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 4 }}>My Campaigns</h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>{campaigns.length} total campaigns</p>
        </div>
        <button className="btn btn-yellow" onClick={() => navigate('/advertiser/create')}>+ New Campaign</button>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {['all', 'active', 'pending', 'paid', 'completed'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="btn btn-sm"
            style={{
              background: filter === f ? 'var(--yellow)' : 'rgba(255,255,255,0.05)',
              color: filter === f ? 'var(--black)' : 'var(--muted)',
              border: 'none', textTransform: 'capitalize'
            }}>
            {f === 'all' ? `All (${campaigns.length})` : `${f} (${campaigns.filter(c => c.status === f).length})`}
          </button>
        ))}
      </div>

      {loading && <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" style={{ width: 36, height: 36 }}/></div>}

      {!loading && filtered.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📭</div>
          <p style={{ color: 'var(--muted)' }}>No campaigns found</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {filtered.map(c => {
          const badge = STATUS_BADGE[c.status] || STATUS_BADGE.pending
          return (
            <div key={c.id} className="card" style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {/* Banner preview */}
              {c.banner_url
                ? <img src={c.banner_url} style={{ width: 80, height: 56, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)', flexShrink: 0 }} />
                : <div style={{ width: 80, height: 56, background: 'rgba(255,208,0,0.06)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', flexShrink: 0 }}>🖼️</div>
              }

              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                  <span className="syne" style={{ fontWeight: 800, fontSize: '1rem' }}>{c.plans?.name} Plan</span>
                  <span className={`badge ${badge.cls}`}>{badge.icon} {badge.label}</span>
                </div>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>📍 {c.city}</span>
                  <span style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>🛺 {c.plans?.rickshaw_count} rickshaw{c.plans?.rickshaw_count > 1 ? 's' : ''}</span>
                  {c.area && <span style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>🏘️ {c.area}</span>}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
                <span className="bebas" style={{ fontSize: '1.4rem', color: 'var(--yellow)' }}>
                  ₹{c.plans?.price?.toLocaleString()}<span style={{ fontSize: '0.7rem', color: 'var(--muted)', fontFamily: 'DM Sans' }}>/mo</span>
                </span>
                {c.status === 'pending' && (
                  <button className="btn btn-yellow btn-sm" onClick={() => handlePayment(c)}>Pay Now →</button>
                )}
                {c.status === 'active' && c.plans?.has_live_tracking && (
                  <button className="btn btn-green btn-sm">📍 Live Track</button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </AppLayout>
  )
}
