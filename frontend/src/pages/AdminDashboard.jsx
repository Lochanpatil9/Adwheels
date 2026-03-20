import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { LogOut, CheckCircle, XCircle, Users, Wallet, Plus, ChevronDown, ChevronUp, Clock } from 'lucide-react'
import { sendNotification } from '../lib/api'

const card = { background: '#fff', border: '1px solid #E8E8E8', borderRadius: '16px', padding: '20px', marginBottom: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }
const btn = (bg = '#FFBF00', col = '#111') => ({ background: bg, color: col, border: 'none', borderRadius: '8px', padding: '9px 16px', fontWeight: 700, fontSize: '0.84rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', transition: 'opacity .18s' })
const badge = (s) => {
  const m = { pending: ['#FFF8E6', '#7A5900'], paid: ['#EFF6FF', '#1565C0'], active: ['#E6F9EE', '#0A6B30'], completed: ['#F5F5F5', '#666'], cancelled: ['#FDECEA', '#C62828'], offered: ['#FFF8E6', '#7A5900'], rejected: ['#FDECEA', '#C62828'], requested: ['#FFF8E6', '#7A5900'], approved: ['#E6F9EE', '#0A6B30'], advertiser: ['#FFF0EB', '#8B2500'], driver: ['#E6F9EE', '#0A6B30'], admin: ['#FDECEA', '#C62828'] }
  const [bg, c] = m[s] || ['#F5F5F5', '#666']
  return { display: 'inline-block', background: bg, color: c, fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '4px 10px', borderRadius: '100px' }
}

// ═══════════════════════════════════════════
// Campaign Detail Expanded View
// ═══════════════════════════════════════════
function CampaignExpandedView({ campaign, allDrivers, onAssignDriver, assigningJob, setAssigningJob, selectedDriver, setSelectedDriver, busyDriverIds, onActivate }) {
  const [assigned, setAssigned] = useState([])
  const [proofStats, setProofStats] = useState({ total: 0, approved: 0, pending: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchDetails() }, [campaign.id])

  async function fetchDetails() {
    // Fetch assigned drivers
    const { data: jobs } = await supabase
      .from('driver_jobs')
      .select('driver_id, status')
      .eq('campaign_id', campaign.id)
      .neq('status', 'rejected')
    setAssigned(jobs || [])

    // Fetch proof stats
    const jobIds = (jobs || []).map(j => j.driver_id)
    if (jobs && jobs.length > 0) {
      const { data: jobRows } = await supabase
        .from('driver_jobs')
        .select('id')
        .eq('campaign_id', campaign.id)
        .neq('status', 'rejected')

      const ids = (jobRows || []).map(j => j.id)
      if (ids.length > 0) {
        const { data: proofs } = await supabase
          .from('daily_proofs')
          .select('status')
          .in('driver_job_id', ids)

        if (proofs) {
          setProofStats({
            total: proofs.length,
            approved: proofs.filter(p => p.status === 'approved').length,
            pending: proofs.filter(p => p.status === 'pending').length,
          })
        }
      }
    }
    setLoading(false)
  }

  const activatedAt = campaign.activated_at ? new Date(campaign.activated_at) : null
  const now = new Date()
  const daysActive = activatedAt ? Math.floor((now - activatedAt) / 86400000) : 0
  const daysRemaining = activatedAt ? Math.max(0, 30 - daysActive) : 30

  if (loading) return <div style={{ textAlign: 'center', padding: '16px', color: '#888' }}>Loading details…</div>

  return (
    <div style={{ borderTop: '1px solid #F0F0F0', paddingTop: '16px', marginTop: '14px' }}>

      {/* Banner full view */}
      {campaign.banner_url && (
        <div style={{ marginBottom: '16px' }}>
          <img src={campaign.banner_url} alt="banner" style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', borderRadius: '12px', border: '1px solid #E8E8E8' }} />
        </div>
      )}

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(100px,1fr))', gap: '8px', marginBottom: '16px' }}>
        {[
          { n: daysActive, l: 'Days Active', c: '#D49800' },
          { n: daysRemaining, l: 'Days Left', c: '#E53935' },
          { n: assigned.length, l: 'Drivers', c: '#1DB954' },
          { n: proofStats.approved, l: 'Approved', c: '#1565C0' },
          { n: proofStats.pending, l: 'Pending', c: '#888' },
          { n: proofStats.total, l: 'Total Proofs', c: '#666' },
        ].map(x => (
          <div key={x.l} style={{ background: '#F8F8F8', border: '1px solid #E8E8E8', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'Bebas Neue,sans-serif', fontSize: '1.4rem', color: x.c, lineHeight: 1 }}>{x.n}</div>
            <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '3px' }}>{x.l}</div>
          </div>
        ))}
      </div>

      {/* Advertiser contact */}
      <div style={{ background: '#FAFAFA', border: '1px solid #E8E8E8', borderRadius: '10px', padding: '12px 14px', marginBottom: '14px' }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#888', marginBottom: '6px' }}>Advertiser Details</div>
        <div style={{ fontSize: '0.88rem', fontWeight: 600, marginBottom: '2px' }}>{campaign.users?.full_name || 'N/A'}</div>
        <div style={{ fontSize: '0.82rem', color: '#888' }}>📞 {campaign.users?.phone || 'N/A'} · 📍 {campaign.users?.city || campaign.city}</div>
      </div>

      {/* Assigned drivers list */}
      <div style={{ marginBottom: '14px' }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#0A6B30', marginBottom: '8px' }}>
          Assigned Drivers ({assigned.length})
        </div>
        {assigned.length === 0
          ? <div style={{ fontSize: '0.82rem', color: '#aaa', fontStyle: 'italic' }}>No drivers assigned yet</div>
          : assigned.map(a => {
            const d = allDrivers.find(x => x.id === a.driver_id)
            return (
              <div key={a.driver_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F0FFF6', border: '1px solid #A3E4BE', borderRadius: '10px', padding: '10px 14px', marginBottom: '6px', flexWrap: 'wrap', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>🛺</span>
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>{d?.full_name || 'Unknown Driver'}</div>
                    <div style={{ fontSize: '0.75rem', color: '#888' }}>{d?.city} · {d?.phone}</div>
                  </div>
                </div>
                <span style={badge(a.status)}>{a.status}</span>
              </div>
            )
          })
        }
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {campaign.status === 'pending' && (
          <button style={btn('#FFBF00', '#111')} onClick={() => onActivate(campaign.id)}>✅ Mark as Paid</button>
        )}
        {(campaign.status === 'paid' || campaign.status === 'active') && (
          <>
            {assigningJob === campaign.id
              ? <div style={{ background: '#FFF8E6', border: '1px solid #FFE08A', borderRadius: '10px', padding: '12px', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', width: '100%' }}>
                <select value={selectedDriver} onChange={e => setSelectedDriver(e.target.value)}
                  style={{ padding: '8px 12px', border: '1.5px solid #D8D8D8', borderRadius: '8px', fontSize: '0.88rem', color: '#111', background: '#fff', outline: 'none', flex: 1, minWidth: '160px' }}>
                  <option value="">Select driver…</option>
                  {allDrivers
                    .filter(d => d.city === campaign.city || campaign.city === 'both')
                    .map(d => {
                      const isBusy = busyDriverIds.has(d.id)
                      return (
                        <option key={d.id} value={d.id} disabled={isBusy}>
                          {isBusy ? '🔴' : '🟢'} {d.full_name} — {d.city}{d.is_verified ? ' ✅' : ''}{isBusy ? ' (Engaged)' : ' (Free)'}
                        </option>
                      )
                    })
                  }
                </select>
                <button style={btn('#1DB954', '#fff')} onClick={() => onAssignDriver(campaign.id)}>Assign →</button>
                <button style={btn('#FDECEA', '#C62828')} onClick={() => { setAssigningJob(null); setSelectedDriver('') }}>Cancel</button>
              </div>
              : <button style={btn('#F5F5F5', '#555')} onClick={() => setAssigningJob(campaign.id)}><Plus size={13} /> Assign Driver</button>
            }
          </>
        )}
      </div>
    </div>
  )
}

function AssignedDrivers({ campaignId, allDrivers }) {
  const [assigned, setAssigned] = useState([])
  useEffect(() => {
    supabase.from('driver_jobs').select('driver_id,status').eq('campaign_id', campaignId).neq('status', 'rejected')
      .then(({ data }) => setAssigned(data || []))
  }, [campaignId])
  if (!assigned.length) return <div style={{ fontSize: '0.82rem', color: '#aaa', marginTop: '8px', fontStyle: 'italic' }}>No drivers assigned yet</div>
  return (
    <div style={{ marginTop: '12px' }}>
      <div style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#0A6B30', marginBottom: '8px' }}>Assigned Drivers ({assigned.length})</div>
      {assigned.map(a => {
        const d = allDrivers.find(x => x.id === a.driver_id)
        return (
          <div key={a.driver_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F0FFF6', border: '1px solid #A3E4BE', borderRadius: '10px', padding: '10px 14px', marginBottom: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🛺</span>
              <div>
                <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>{d?.full_name || 'Unknown Driver'}</div>
                <div style={{ fontSize: '0.75rem', color: '#888' }}>{d?.city} · {d?.phone}</div>
              </div>
            </div>
            <span style={badge(a.status)}>{a.status}</span>
          </div>
        )
      })}
    </div>
  )
}

function EnterpriseLeads() {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    supabase.from('enterprise_leads').select('*').order('created_at', { ascending: false })
      .then(({ data }) => { setLeads(data || []); setLoading(false) })
  }, [])
  async function updateStatus(id, status) {
    await supabase.from('enterprise_leads').update({ status }).eq('id', id)
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l))
  }
  if (loading) return <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>Loading…</div>
  if (!leads.length) return <div style={{ textAlign: 'center', padding: '48px', color: '#bbb' }}><div style={{ fontSize: '3rem', marginBottom: '10px' }}>🏢</div><div>No enterprise leads yet</div></div>
  return leads.map(l => (
    <div key={l.id} style={{ ...card, border: '1.5px solid #E9D5FF' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: '1rem', marginBottom: '5px' }}>{l.company_name}</div>
          <div style={{ fontSize: '0.84rem', color: '#555', marginBottom: '2px' }}>👤 {l.full_name}</div>
          <div style={{ fontSize: '0.84rem', marginBottom: '2px' }}>📞 <a href={`tel:${l.phone}`} style={{ color: '#D49800', textDecoration: 'none', fontWeight: 600 }}>{l.phone}</a></div>
          {l.email && <div style={{ fontSize: '0.84rem', color: '#555', marginBottom: '2px' }}>✉️ {l.email}</div>}
          {l.city && <div style={{ fontSize: '0.84rem', color: '#555', marginBottom: '2px' }}>📍 {l.city}</div>}
          {l.message && <div style={{ fontSize: '0.82rem', color: '#666', marginTop: '8px', padding: '10px', background: '#F8F8F8', borderRadius: '8px', fontStyle: 'italic' }}>"{l.message}"</div>}
          <div style={{ fontSize: '0.72rem', color: '#aaa', marginTop: '8px' }}>{new Date(l.created_at).toLocaleString('en-IN')}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
          <span style={{ ...badge(l.status), background: '#EDE9FE', color: '#5B21B6' }}>{l.status}</span>
          <select value={l.status} onChange={e => updateStatus(l.id, e.target.value)}
            style={{ background: '#fff', border: '1px solid #E8E8E8', borderRadius: '6px', color: '#111', fontSize: '0.78rem', padding: '6px 10px', cursor: 'pointer', outline: 'none' }}>
            <option value="new">New</option><option value="contacted">Contacted</option>
            <option value="converted">Converted</option><option value="closed">Closed</option>
          </select>
        </div>
      </div>
    </div>
  ))
}

export default function AdminDashboard({ profile }) {
  const { signOut } = useAuth()
  const [tab, setTab] = useState('home')
  const [campaigns, setCampaigns] = useState([])
  const [drivers, setDrivers] = useState([])
  const [proofs, setProofs] = useState([])
  const [payouts, setPayouts] = useState([])
  const [users, setUsers] = useState([])
  const [assigningJob, setAssigningJob] = useState(null)
  const [selectedDriver, setSelectedDriver] = useState('')
  const [busyDriverIds, setBusyDriverIds] = useState(new Set()) // drivers with active jobs

  // Campaign tab state
  const [campaignFilter, setCampaignFilter] = useState('all')
  const [expandedCampaign, setExpandedCampaign] = useState(null)

  useEffect(() => { fetchAll() }, [])
  async function fetchAll() { await Promise.all([fetchCampaigns(), fetchDrivers(), fetchProofs(), fetchPayouts(), fetchUsers()]) }

  async function fetchCampaigns() {
    const { data } = await supabase.from('campaigns').select('*, plans(name,price,rickshaw_count,driver_payout), users(full_name,phone,city)').order('created_at', { ascending: false })
    setCampaigns(data || [])
  }

  async function fetchDrivers() {
    const { data } = await supabase.from('users').select('*').eq('role', 'driver')
    setDrivers(data || [])

    // fetch all active/offered driver_jobs to know who is busy
    const { data: activeJobs } = await supabase
      .from('driver_jobs')
      .select('driver_id')
      .in('status', ['offered', 'accepted', 'active'])

    const busySet = new Set((activeJobs || []).map(j => j.driver_id))
    setBusyDriverIds(busySet)
  }

  async function fetchProofs() {
    const { data } = await supabase.from('daily_proofs').select('*, driver_id, users(full_name), driver_jobs(campaigns(city,area,plans(name,driver_payout)))').order('created_at', { ascending: false })
    setProofs(data || [])
  }
  async function fetchPayouts() {
    const { data } = await supabase.from('payouts').select('*, users(full_name,phone)').order('requested_at', { ascending: false })
    setPayouts(data || [])
  }
  async function fetchUsers() {
    const { data } = await supabase.from('users').select('*').order('created_at', { ascending: false })
    setUsers(data || [])
  }

  async function handleActivateCampaign(id) {
    const { error } = await supabase.from('campaigns').update({ status: 'paid' }).eq('id', id)
    if (error) return toast.error(error.message)
    toast.success('Campaign marked as paid ✅'); fetchCampaigns()
  }

  async function handleAdminActivateCampaign(id) {
    // Admin manual activation — set to active with activated_at
    const { error } = await supabase.from('campaigns').update({
      status: 'active',
      activated_at: new Date().toISOString()
    }).eq('id', id)
    if (error) return toast.error(error.message)
    toast.success('Campaign activated ✅'); fetchCampaigns()
  }

  async function handleAssignDriver(campaignId) {
    if (!selectedDriver) return toast.error('Select a driver first')

    // Block if driver is already busy
    if (busyDriverIds.has(selectedDriver)) {
      return toast.error('This driver is already engaged in another campaign!')
    }

    const { data: ex } = await supabase.from('driver_jobs').select('id').eq('driver_id', selectedDriver).eq('campaign_id', campaignId)
    if (ex?.length) return toast.error('Driver already assigned to this campaign!')

    const { error } = await supabase.from('driver_jobs').insert({ driver_id: selectedDriver, campaign_id: campaignId, status: 'offered' })
    if (error) return toast.error(error.message)

    // Also set activated_at if campaign becomes active for the first time
    const campaign = campaigns.find(c => c.id === campaignId)
    const updateData = { status: 'active' }
    if (!campaign?.activated_at) {
      updateData.activated_at = new Date().toISOString()
    }
    await supabase.from('campaigns').update(updateData).eq('id', campaignId)

    toast.success('Driver assigned! 🎉')

    // Trigger 1 — Notify the driver about new job offer
    try {
      await sendNotification({
        userId: selectedDriver,
        type: 'job_offer',
        title: '🛺 New Job Offer!',
        message: `You have a new ad campaign job in ${campaign?.city || 'your city'}. Open the Jobs tab to accept it and start earning!`
      })
    } catch (notifErr) {
      console.error('Driver notification error:', notifErr)
    }

    setAssigningJob(null); setSelectedDriver(''); fetchDrivers(); fetchCampaigns()
  }

  async function handleApproveProof(proofId, driverJobId, driverId, driverPayout) {
    const { error } = await supabase.from('daily_proofs').update({ status: 'approved', reviewed_by: profile.id }).eq('id', proofId)
    if (error) return toast.error(error.message)
    const amount = Math.round((driverPayout || 600) / 30)
    await supabase.from('earnings').insert({ driver_id: driverId, driver_job_id: driverJobId, amount, earning_date: new Date().toISOString().split('T')[0], type: 'daily' })
    toast.success(`✅ Approved + ₹${amount} added`)

    // Trigger 4 — Notify driver about proof approval
    try {
      await sendNotification({
        userId: driverId,
        type: 'proof_approved',
        title: '✅ Proof Approved!',
        message: `Your daily proof was approved and ₹${amount} has been added to your earnings.`
      })
    } catch (notifErr) {
      console.error('Proof approval notification error:', notifErr)
    }

    fetchProofs()
  }
  async function handleRejectProof(proofId) {
    const { error } = await supabase.from('daily_proofs').update({ status: 'rejected', reviewed_by: profile.id }).eq('id', proofId)
    if (error) return toast.error(error.message)
    toast.success('Proof rejected'); fetchProofs()
  }
  async function handleProcessPayout(payoutId) {
    const { error } = await supabase.from('payouts').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('id', payoutId)
    if (error) return toast.error(error.message)
    toast.success('Payout marked as paid 💸')

    // Trigger 5 — Notify driver about payout
    try {
      const payout = payouts.find(p => p.id === payoutId)
      if (payout) {
        await sendNotification({
          userId: payout.driver_id,
          type: 'payout_sent',
          title: '💸 Payout Sent!',
          message: `₹${payout.amount} has been sent to your UPI (${payout.upi_id}). It may take 1–2 hours to reflect.`
        })
      }
    } catch (notifErr) {
      console.error('Payout notification error:', notifErr)
    }

    fetchPayouts()
  }
  async function handleVerifyDriver(driverId) {
    const { error } = await supabase.from('users').update({ is_verified: true }).eq('id', driverId)
    if (error) return toast.error(error.message)
    toast.success('Driver verified ✅'); fetchDrivers()
  }

  const totalRevenue = campaigns.filter(c => !['pending', 'cancelled'].includes(c.status)).reduce((s, c) => s + (c.plans?.price || 0), 0)
  const pendingProofs = proofs.filter(p => p.status === 'pending').length
  const pendingPayouts = payouts.filter(p => p.status === 'requested').length
  const activeCampaigns = campaigns.filter(c => c.status === 'active').length

  // Filtered campaigns
  const filteredCampaigns = campaignFilter === 'all'
    ? campaigns
    : campaigns.filter(c => c.status === campaignFilter)

  // Filter counts
  const filterCounts = {
    all: campaigns.length,
    pending: campaigns.filter(c => c.status === 'pending').length,
    paid: campaigns.filter(c => c.status === 'paid').length,
    active: campaigns.filter(c => c.status === 'active').length,
    completed: campaigns.filter(c => c.status === 'completed').length,
    cancelled: campaigns.filter(c => c.status === 'cancelled').length,
  }

  const FILTERS = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'paid', label: 'Paid' },
    { key: 'active', label: 'Active' },
    { key: 'completed', label: 'Completed' },
    { key: 'cancelled', label: 'Cancelled' },
  ]

  const TABS = [
    { key: 'home', label: '🏠 Home' },
    { key: 'campaigns', label: `📢 Ads (${campaigns.length})` },
    { key: 'drivers', label: `🛺 Drivers (${drivers.length})` },
    { key: 'proofs', label: pendingProofs ? `📸 Photos 🔴${pendingProofs}` : '📸 Photos' },
    { key: 'payouts', label: pendingPayouts ? `💳 Payouts 🔴${pendingPayouts}` : '💳 Payouts' },
    { key: 'users', label: `👥 Users (${users.length})` },
    { key: 'leads', label: '🏢 Leads' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#F5F5F5', color: '#111', fontFamily: "'DM Sans',sans-serif" }}>

      {/* NAV */}
      <div style={{ background: '#fff', borderBottom: '1px solid #EBEBEB', padding: '0 18px', height: '58px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ fontFamily: 'Bebas Neue,sans-serif', fontSize: '1.7rem', color: '#FFBF00', letterSpacing: '0.05em' }}>AdWheels</div>
          <span style={{ background: '#FDECEA', color: '#C62828', border: '1px solid #FFAAAA', fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '3px 9px', borderRadius: '100px' }}>Admin</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.84rem', color: '#666' }}>👑 {profile.full_name}</span>
          <button onClick={signOut} style={{ background: 'none', border: '1.5px solid #E8E8E8', borderRadius: '8px', padding: '6px 12px', fontSize: '0.82rem', color: '#888', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <LogOut size={13} /> Logout
          </button>
        </div>
      </div>

      {/* TABS */}
      <div style={{ background: '#fff', borderBottom: '1px solid #EBEBEB', display: 'flex', overflowX: 'auto', scrollbarWidth: 'none', padding: '0 6px' }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{ padding: '13px 13px', border: 'none', background: 'none', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', color: tab === t.key ? '#C62828' : '#999', borderBottom: tab === t.key ? '2.5px solid #E53935' : '2.5px solid transparent', flexShrink: 0 }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: '16px', maxWidth: '900px', margin: '0 auto' }}>

        {/* HOME */}
        {tab === 'home' && <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: '12px', marginBottom: '14px' }}>
            {[{ n: `₹${totalRevenue.toLocaleString()}`, l: 'Revenue', c: '#D49800' }, { n: activeCampaigns, l: 'Active Ads', c: '#1DB954' }, { n: drivers.length, l: 'Drivers', c: '#1565C0' }, { n: pendingProofs, l: 'Photos to Review', c: '#E53935' }, { n: pendingPayouts, l: 'Payout Requests', c: '#FF8C00' }].map(x => (
              <div key={x.l} style={card}>
                <div style={{ fontFamily: 'Bebas Neue,sans-serif', fontSize: '1.8rem', color: x.c, lineHeight: 1 }}>{x.n}</div>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '4px' }}>{x.l}</div>
              </div>
            ))}
          </div>
          {pendingProofs > 0 && <div onClick={() => setTab('proofs')} style={{ background: '#FDECEA', border: '1px solid #FFAAAA', borderRadius: '12px', padding: '14px 16px', fontSize: '0.88rem', color: '#C62828', fontWeight: 700, cursor: 'pointer', marginBottom: '10px' }}>🔴 {pendingProofs} photo{pendingProofs > 1 ? 's' : ''} waiting for your review</div>}
          {pendingPayouts > 0 && <div onClick={() => setTab('payouts')} style={{ background: '#FFF8E6', border: '1px solid #FFE08A', borderRadius: '12px', padding: '14px 16px', fontSize: '0.88rem', color: '#7A5900', fontWeight: 700, cursor: 'pointer', marginBottom: '10px' }}>💸 {pendingPayouts} payout request{pendingPayouts > 1 ? 's' : ''} pending</div>}
          <div style={{ fontWeight: 800, fontSize: '1rem', marginBottom: '12px' }}>Recent Campaigns</div>
          {campaigns.slice(0, 5).map(c => (
            <div key={c.id} style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <div style={{ fontWeight: 700, marginBottom: '3px' }}>{c.users?.full_name} — {c.plans?.name}</div>
                  <div style={{ fontSize: '0.82rem', color: '#888' }}>📍 {c.city} · {c.area} · ₹{c.plans?.price?.toLocaleString()}/mo</div>
                </div>
                <span style={badge(c.status)}>{c.status}</span>
              </div>
            </div>
          ))}
        </>}

        {/* CAMPAIGNS — with filters + expandable cards */}
        {tab === 'campaigns' && <>
          {/* Filter buttons */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
            {FILTERS.map(f => (
              <button
                key={f.key}
                onClick={() => { setCampaignFilter(f.key); setExpandedCampaign(null) }}
                style={{
                  background: campaignFilter === f.key ? '#FFBF00' : '#fff',
                  color: campaignFilter === f.key ? '#111' : '#666',
                  border: campaignFilter === f.key ? '1.5px solid #D49800' : '1.5px solid #E8E8E8',
                  borderRadius: '100px',
                  padding: '8px 16px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  transition: 'all .18s'
                }}
              >
                {f.label}
                <span style={{
                  background: campaignFilter === f.key ? 'rgba(0,0,0,0.15)' : '#F0F0F0',
                  color: campaignFilter === f.key ? '#111' : '#888',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  padding: '2px 7px',
                  borderRadius: '100px',
                  minWidth: '20px',
                  textAlign: 'center'
                }}>
                  {filterCounts[f.key]}
                </span>
              </button>
            ))}
          </div>

          {filteredCampaigns.length === 0
            ? <div style={{ textAlign: 'center', padding: '48px', color: '#bbb' }}>
              <div style={{ fontSize: '3rem', marginBottom: '10px' }}>📢</div>
              <div>{campaignFilter === 'all' ? 'No campaigns yet' : `No ${campaignFilter} campaigns`}</div>
            </div>
            : filteredCampaigns.map(c => {
              const isExpanded = expandedCampaign === c.id
              return (
                <div key={c.id} style={{ ...card, border: isExpanded ? '1.5px solid #FFBF00' : '1px solid #E8E8E8', cursor: 'pointer', transition: 'border .2s ease' }}>
                  {/* Collapsed view — always visible */}
                  <div
                    onClick={() => setExpandedCampaign(isExpanded ? null : c.id)}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '3px' }}>{c.plans?.name} — {c.users?.full_name}</div>
                      <div style={{ fontSize: '0.82rem', color: '#888', marginBottom: '2px' }}>📍 {c.city} — {c.area}</div>
                      <div style={{ fontSize: '0.82rem', color: '#888', marginBottom: '8px' }}>₹{c.plans?.price?.toLocaleString()}/mo · {c.plans?.rickshaw_count} rickshaw{c.plans?.rickshaw_count > 1 ? 's' : ''}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={badge(c.status)}>{c.status}</span>
                        {c.activated_at && c.status === 'active' && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: '#D49800', fontWeight: 700 }}>
                            <Clock size={12} />
                            {Math.max(0, 30 - Math.floor((new Date() - new Date(c.activated_at)) / 86400000))} days left
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                      {c.banner_url && !isExpanded && <img src={c.banner_url} alt="banner" style={{ width: '70px', height: '45px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #E8E8E8' }} />}
                      <div style={{ color: '#999', transition: 'transform .2s', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                        <ChevronDown size={18} />
                      </div>
                    </div>
                  </div>

                  {/* Expanded view */}
                  {isExpanded && (
                    <CampaignExpandedView
                      campaign={c}
                      allDrivers={drivers}
                      onAssignDriver={handleAssignDriver}
                      assigningJob={assigningJob}
                      setAssigningJob={setAssigningJob}
                      selectedDriver={selectedDriver}
                      setSelectedDriver={setSelectedDriver}
                      busyDriverIds={busyDriverIds}
                      onActivate={handleActivateCampaign}
                    />
                  )}
                </div>
              )
            })
          }
        </>}

        {/* DRIVERS */}
        {tab === 'drivers' && <>
          {drivers.length === 0
            ? <div style={{ textAlign: 'center', padding: '48px', color: '#bbb' }}><div style={{ fontSize: '3rem', marginBottom: '10px' }}>🛺</div><div>No drivers yet</div></div>
            : drivers.map(d => (
              <div key={d.id} style={{ ...card, border: busyDriverIds.has(d.id) ? '1.5px solid #FFE08A' : '1px solid #E8E8E8' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <div style={{ fontWeight: 700 }}>{d.full_name}</div>
                      {d.is_verified && <span style={{ color: '#1DB954', fontSize: '0.82rem' }}>✅ Verified</span>}
                      {/* Availability badge */}
                      <span style={{
                        background: busyDriverIds.has(d.id) ? '#FFF8E6' : '#E6F9EE',
                        color: busyDriverIds.has(d.id) ? '#7A5900' : '#0A6B30',
                        fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase',
                        padding: '3px 8px', borderRadius: '100px'
                      }}>
                        {busyDriverIds.has(d.id) ? '🔴 Engaged' : '🟢 Free'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#888', marginBottom: '2px' }}>📞 {d.phone} · 📍 {d.city}</div>
                    <div style={{ fontSize: '0.82rem', color: '#888', marginBottom: '2px' }}>🛺 {d.vehicle_number || 'No vehicle number'}</div>
                    <div style={{ fontSize: '0.82rem', color: '#888' }}>💳 UPI: {d.upi_id || 'Not set'}</div>
                  </div>
                  {!d.is_verified && <button style={btn('#1DB954', '#fff')} onClick={() => handleVerifyDriver(d.id)}><CheckCircle size={14} /> Verify</button>}
                </div>
              </div>
            ))
          }
        </>}

        {/* PROOFS */}
        {tab === 'proofs' && <>
          {proofs.length === 0
            ? <div style={{ textAlign: 'center', padding: '48px', color: '#bbb' }}><div style={{ fontSize: '3rem', marginBottom: '10px' }}>📷</div><div>No photos yet</div></div>
            : proofs.map(p => (
              <div key={p.id} style={{ ...card, border: p.status === 'pending' ? '1.5px solid #FFE08A' : '1px solid #E8E8E8' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, marginBottom: '4px' }}>{p.users?.full_name}</div>
                    <div style={{ fontSize: '0.82rem', color: '#888', marginBottom: '8px' }}>{p.driver_jobs?.campaigns?.plans?.name} · {p.driver_jobs?.campaigns?.city} · {p.proof_date}</div>
                    <span style={badge(p.status)}>{p.status}</span>
                    {p.status === 'pending' && (
                      <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                        <button style={btn('#1DB954', '#fff')} onClick={() => handleApproveProof(p.id, p.driver_job_id, p.driver_id, p.driver_jobs?.campaigns?.plans?.driver_payout)}>
                          <CheckCircle size={14} /> Approve + ₹{Math.round((p.driver_jobs?.campaigns?.plans?.driver_payout || 600) / 30)}
                        </button>
                        <button style={btn('#FDECEA', '#C62828')} onClick={() => handleRejectProof(p.id)}>
                          <XCircle size={14} /> Reject
                        </button>
                      </div>
                    )}
                  </div>
                  {p.photo_url && <img src={p.photo_url} alt="proof" style={{ width: '130px', height: '84px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #E8E8E8', flexShrink: 0 }} />}
                </div>
              </div>
            ))
          }
        </>}

        {/* PAYOUTS */}
        {tab === 'payouts' && <>
          {payouts.length === 0
            ? <div style={{ textAlign: 'center', padding: '48px', color: '#bbb' }}><div style={{ fontSize: '3rem', marginBottom: '10px' }}>💸</div><div>No payout requests yet</div></div>
            : payouts.map(p => (
              <div key={p.id} style={{ ...card, border: p.status === 'requested' ? '1.5px solid #FFE08A' : '1px solid #E8E8E8' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <div style={{ fontWeight: 700, marginBottom: '3px' }}>{p.users?.full_name}</div>
                    <div style={{ fontSize: '0.82rem', color: '#888', marginBottom: '3px' }}>📞 {p.users?.phone}</div>
                    <div style={{ fontSize: '0.82rem', marginBottom: '8px' }}>💳 Send to: <b>{p.upi_id}</b></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontFamily: 'Bebas Neue,sans-serif', fontSize: '1.5rem', color: '#1DB954' }}>₹{p.amount}</span>
                      <span style={badge(p.status)}>{p.status}</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#aaa', marginTop: '4px' }}>Requested: {new Date(p.requested_at).toLocaleDateString()}</div>
                  </div>
                  {p.status === 'requested' && (
                    <button style={btn('#1DB954', '#fff')} onClick={() => handleProcessPayout(p.id)}>
                      <Wallet size={14} /> Mark Paid
                    </button>
                  )}
                </div>
              </div>
            ))
          }
        </>}

        {/* USERS */}
        {tab === 'users' && <>
          {users.map(u => (
            <div key={u.id} style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <div style={{ fontWeight: 700, marginBottom: '3px' }}>{u.full_name}</div>
                  <div style={{ fontSize: '0.82rem', color: '#888' }}>{u.phone} · {u.city}</div>
                </div>
                <span style={badge(u.role)}>{u.role}</span>
              </div>
            </div>
          ))}
        </>}

        {tab === 'leads' && <EnterpriseLeads />}

      </div>
    </div>
  )
}
