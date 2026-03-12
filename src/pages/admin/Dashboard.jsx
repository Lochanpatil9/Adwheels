import React, { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import AppLayout from '../../components/AppLayout'

const NAV = [
  { path: '/admin', icon: '👑', label: 'Admin Dashboard' },
]

export default function AdminDashboard() {
  const { profile } = useAuth()
  const [stats, setStats] = useState({ advertisers: 0, drivers: 0, campaigns: 0, revenue: 0 })
  const [pendingProofs, setPendingProofs] = useState([])
  const [pendingPayouts, setPendingPayouts] = useState([])
  const [campaigns, setCampaigns] = useState([])
  const [tab, setTab] = useState('overview')
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    const [users, campaignData, proofs, payouts] = await Promise.all([
      supabase.from('users').select('role'),
      supabase.from('campaigns').select('*, plans(name,price), users(full_name)').order('created_at', { ascending: false }),
      supabase.from('daily_proofs').select('*, users(full_name), driver_jobs(campaigns(plans(name)))').eq('status', 'pending'),
      supabase.from('payouts').select('*, users(full_name, upi_id)').eq('status', 'requested'),
    ])

    const u = users.data || []
    setStats({
      advertisers: u.filter(x => x.role === 'advertiser').length,
      drivers: u.filter(x => x.role === 'driver').length,
      campaigns: campaignData.data?.length || 0,
      revenue: campaignData.data?.reduce((s, c) => s + (c.plans?.price || 0), 0) || 0,
    })
    setCampaigns(campaignData.data || [])
    setPendingProofs(proofs.data || [])
    setPendingPayouts(payouts.data || [])
    setLoading(false)
  }

  async function approveProof(proofId, driverJobId) {
    await supabase.from('daily_proofs').update({ status: 'approved', reviewed_by: profile.id }).eq('id', proofId)
    fetchAll()
  }

  async function rejectProof(proofId) {
    await supabase.from('daily_proofs').update({ status: 'rejected', reviewed_by: profile.id }).eq('id', proofId)
    fetchAll()
  }

  async function processPayout(payoutId) {
    await supabase.from('payouts').update({ status: 'processing' }).eq('id', payoutId)
    fetchAll()
  }

  async function markPaid(payoutId) {
    await supabase.from('payouts').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('id', payoutId)
    fetchAll()
  }

  async function activateCampaign(campaignId) {
    await supabase.from('campaigns').update({ status: 'active', starts_at: new Date().toISOString() }).eq('id', campaignId)
    fetchAll()
  }

  return (
    <AppLayout navItems={NAV}>
      <div style={{ marginBottom: 28 }}>
        <h1 className="syne" style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 4 }}>Admin Panel 👑</h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>You see everything from here</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px,1fr))', gap: 16, marginBottom: 28 }}>
        {[
          { num: stats.advertisers, label: 'Advertisers', color: 'var(--yellow)' },
          { num: stats.drivers, label: 'Drivers', color: 'var(--green)' },
          { num: stats.campaigns, label: 'Campaigns', color: 'var(--blue)' },
          { num: `₹${stats.revenue.toLocaleString()}`, label: 'Monthly Revenue', color: 'var(--orange)' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-num" style={{ color: s.color }}>{s.num}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Alert badges */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
        {pendingProofs.length > 0 && <span className="badge badge-yellow">📸 {pendingProofs.length} proofs to review</span>}
        {pendingPayouts.length > 0 && <span className="badge badge-red">💸 {pendingPayouts.length} payout requests</span>}
        {pendingProofs.length === 0 && pendingPayouts.length === 0 && <span className="badge badge-green">✅ All clear!</span>}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {[['overview','📊 Overview'], ['proofs','📸 Proofs'], ['payouts','💸 Payouts'], ['campaigns','📋 Campaigns']].map(([v, label]) => (
          <button key={v} onClick={() => setTab(v)} className="btn btn-sm"
            style={{ background: tab === v ? 'var(--yellow)' : 'rgba(255,255,255,0.05)', color: tab === v ? 'var(--black)' : 'var(--muted)', border: 'none' }}>
            {label}
          </button>
        ))}
      </div>

      {/* PROOFS */}
      {tab === 'proofs' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {pendingProofs.length === 0 && <div style={{ color: 'var(--muted)', textAlign: 'center', padding: 40 }}>No pending proofs 🎉</div>}
          {pendingProofs.map(proof => (
            <div key={proof.id} className="card" style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
              <img src={proof.photo_url} style={{ width: 100, height: 72, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>{proof.users?.full_name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{proof.driver_jobs?.campaigns?.plans?.name} Plan · {proof.proof_date}</div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-green btn-sm" onClick={() => approveProof(proof.id, proof.driver_job_id)}>✅ Approve</button>
                <button className="btn btn-danger btn-sm" onClick={() => rejectProof(proof.id)}>✕ Reject</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PAYOUTS */}
      {tab === 'payouts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {pendingPayouts.length === 0 && <div style={{ color: 'var(--muted)', textAlign: 'center', padding: 40 }}>No pending payouts 🎉</div>}
          {pendingPayouts.map(p => (
            <div key={p.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>{p.users?.full_name}</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>UPI: {p.upi_id} · Requested {new Date(p.requested_at).toLocaleDateString('en-IN')}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span className="bebas" style={{ fontSize: '1.4rem', color: 'var(--green)' }}>₹{p.amount}</span>
                <button className="btn btn-yellow btn-sm" onClick={() => markPaid(p.id)}>Mark Paid</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CAMPAIGNS */}
      {tab === 'campaigns' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {campaigns.map(c => (
            <div key={c.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>{c.users?.full_name} · {c.plans?.name}</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>📍 {c.city} · ₹{c.plans?.price?.toLocaleString()}/mo</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className={`badge ${c.status === 'active' ? 'badge-green' : c.status === 'paid' ? 'badge-yellow' : 'badge-muted'}`}>{c.status}</span>
                {c.status === 'paid' && (
                  <button className="btn btn-green btn-sm" onClick={() => activateCampaign(c.id)}>Activate</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* OVERVIEW */}
      {tab === 'overview' && (
        <div style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
          <p>Use the tabs above to manage proofs, payouts, and campaigns.</p>
        </div>
      )}
    </AppLayout>
  )
}
