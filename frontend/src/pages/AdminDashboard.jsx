import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { LogOut, CheckCircle, XCircle, Users, Wallet, Plus, ChevronDown, Clock, RefreshCw, Search, Eye, Zap, Activity, BarChart3, TrendingUp, Home, Camera, CreditCard, UserCircle, Megaphone, Building2, Truck, Bike, MapPin, Fuel } from 'lucide-react'
import { sendNotification, autoAssignNewDriver, autoAssignAll } from '../lib/api'
import NotificationBell from '../components/NotificationBell'
import AccountSection from '../components/AccountSection'

const card = { background: '#fff', border: '1px solid #E8E8E8', borderRadius: '16px', padding: '20px', marginBottom: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }
const btn = (bg = '#FFBF00', col = '#111') => ({ background: bg, color: col, border: 'none', borderRadius: '8px', padding: '9px 16px', fontWeight: 700, fontSize: '0.84rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', transition: 'all .18s' })
const badge = (s) => {
  const m = { pending: ['#FFF8E6', '#7A5900'], paid: ['#EFF6FF', '#1565C0'], active: ['#E6F9EE', '#0A6B30'], completed: ['#F5F5F5', '#666'], cancelled: ['#FDECEA', '#C62828'], offered: ['#FFF8E6', '#7A5900'], rejected: ['#FDECEA', '#C62828'], requested: ['#FFF8E6', '#7A5900'], approved: ['#E6F9EE', '#0A6B30'], advertiser: ['#FFF0EB', '#8B2500'], driver: ['#E6F9EE', '#0A6B30'], admin: ['#FDECEA', '#C62828'] }
  const [bg, c] = m[s] || ['#F5F5F5', '#666']
  return { display: 'inline-block', background: bg, color: c, fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '4px 10px', borderRadius: '100px' }
}

// ═══════════════════════════════════════════
// Image Lightbox
// ═══════════════════════════════════════════
function Lightbox({ src, onClose }) {
  if (!src) return null
  return (
    <div className="lightbox-overlay" onClick={onClose}>
      <button className="lightbox-close" onClick={onClose}>✕</button>
      <img src={src} alt="Full view" onClick={e => e.stopPropagation()} />
    </div>
  )
}

// ═══════════════════════════════════════════
// Campaign Detail Expanded View
// ═══════════════════════════════════════════
function CampaignExpandedView({ campaign, allDrivers, onAssignDriver, assigningJob, setAssigningJob, selectedDriver, setSelectedDriver, busyDriverIds, onMarkPaid, onActivate }) {
  const [assigned, setAssigned] = useState([])
  const [proofStats, setProofStats] = useState({ total: 0, approved: 0, pending: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchDetails() }, [campaign.id])

  async function fetchDetails() {
    const { data: jobs } = await supabase
      .from('driver_jobs')
      .select('driver_id, status')
      .eq('campaign_id', campaign.id)
      .neq('status', 'rejected')
    setAssigned(jobs || [])

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
          <button className="action-btn" style={btn('#FFBF00', '#111')} onClick={() => onMarkPaid(campaign.id)}>💳 Mark as Paid</button>
        )}
        {campaign.status === 'paid' && (
          <button className="action-btn" style={btn('#1DB954', '#fff')} onClick={() => onActivate(campaign.id)}>
            <Zap size={13} /> Activate Campaign
          </button>
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
                <button className="action-btn" style={btn('#1DB954', '#fff')} onClick={() => onAssignDriver(campaign.id)}>Assign →</button>
                <button className="action-btn" style={btn('#FDECEA', '#C62828')} onClick={() => { setAssigningJob(null); setSelectedDriver('') }}>Cancel</button>
              </div>
              : <button className="action-btn" style={btn('#F5F5F5', '#555')} onClick={() => setAssigningJob(campaign.id)}><Plus size={13} /> Assign Driver</button>
            }
          </>
        )}
      </div>
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
  const [busyDriverIds, setBusyDriverIds] = useState(new Set())

  // Campaign tab state
  const [campaignFilter, setCampaignFilter] = useState('all')
  const [expandedCampaign, setExpandedCampaign] = useState(null)

  // Driver search
  const [driverSearch, setDriverSearch] = useState('')

  // Proof filter
  const [proofFilter, setProofFilter] = useState('all')

  // Loading states for actions
  const [actionLoading, setActionLoading] = useState({})

  // Lightbox
  const [lightboxSrc, setLightboxSrc] = useState(null)

  // Refresh
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => { fetchAll() }, [])
  async function fetchAll() { await Promise.all([fetchCampaigns(), fetchDrivers(), fetchProofs(), fetchPayouts(), fetchUsers()]) }

  async function handleRefresh() {
    setRefreshing(true)
    await fetchAll()
    setTimeout(() => setRefreshing(false), 600)
    toast.success('Data refreshed')
  }

  async function fetchCampaigns() {
    const { data } = await supabase.from('campaigns').select('*, plans(name,price,rickshaw_count,driver_payout), users(full_name,phone,city)').order('created_at', { ascending: false })
    setCampaigns(data || [])
  }

  async function fetchDrivers() {
    const { data } = await supabase.from('users').select('*').eq('role', 'driver')
    setDrivers(data || [])

    const { data: activeJobs } = await supabase
      .from('driver_jobs')
      .select('driver_id')
      .in('status', ['offered', 'accepted', 'active'])

    const busySet = new Set((activeJobs || []).map(j => j.driver_id))
    setBusyDriverIds(busySet)
  }

  async function fetchProofs() {
    try {
      const { data, error } = await supabase
        .from('daily_proofs')
        .select('*, users!daily_proofs_driver_id_fkey(full_name), driver_jobs(campaigns(city,area,plans(name,driver_payout)))')
        .order('proof_date', { ascending: false })
      if (error) {
        // Fallback query without explicit FK name
        const { data: fallbackData } = await supabase
          .from('daily_proofs')
          .select('*, driver_jobs(campaigns(city,area,plans(name,driver_payout)))')
          .order('proof_date', { ascending: false })
        setProofs(fallbackData || [])
      } else {
        setProofs(data || [])
      }
    } catch (err) {
      toast.error('Failed to load proofs')
      setProofs([])
    }
  }
  async function fetchPayouts() {
    const { data } = await supabase.from('payouts').select('*, users(full_name,phone)').order('requested_at', { ascending: false })
    setPayouts(data || [])
  }
  async function fetchUsers() {
    const { data } = await supabase.from('users').select('*').order('created_at', { ascending: false })
    setUsers(data || [])
  }

  async function handleMarkPaid(id) {
    setActionLoading(prev => ({ ...prev, [`paid_${id}`]: true }))
    const { error } = await supabase.from('campaigns').update({ status: 'paid' }).eq('id', id)
    if (error) { toast.error(error.message); setActionLoading(prev => ({ ...prev, [`paid_${id}`]: false })); return }
    toast.success('Campaign marked as paid ✅'); fetchCampaigns()
    setActionLoading(prev => ({ ...prev, [`paid_${id}`]: false }))
  }

  async function handleAdminActivateCampaign(id) {
    if (!window.confirm('Activate this campaign? It will start the 30-day countdown.')) return
    setActionLoading(prev => ({ ...prev, [`activate_${id}`]: true }))
    const { error } = await supabase.from('campaigns').update({
      status: 'active',
      activated_at: new Date().toISOString()
    }).eq('id', id)
    if (error) { toast.error(error.message); setActionLoading(prev => ({ ...prev, [`activate_${id}`]: false })); return }
    toast.success('Campaign activated ✅'); fetchCampaigns()
    setActionLoading(prev => ({ ...prev, [`activate_${id}`]: false }))
  }

  async function handleAssignDriver(campaignId) {
    if (!selectedDriver) return toast.error('Select a driver first')

    if (busyDriverIds.has(selectedDriver)) {
      return toast.error('This driver is already engaged in another campaign!')
    }

    setActionLoading(prev => ({ ...prev, [`assign_${campaignId}`]: true }))

    const { data: ex } = await supabase.from('driver_jobs').select('id').eq('driver_id', selectedDriver).eq('campaign_id', campaignId)
    if (ex?.length) { toast.error('Driver already assigned to this campaign!'); setActionLoading(prev => ({ ...prev, [`assign_${campaignId}`]: false })); return }

    const { error } = await supabase.from('driver_jobs').insert({ driver_id: selectedDriver, campaign_id: campaignId, status: 'offered' })
    if (error) { toast.error(error.message); setActionLoading(prev => ({ ...prev, [`assign_${campaignId}`]: false })); return }

    const campaign = campaigns.find(c => c.id === campaignId)
    const updateData = { status: 'active' }
    if (!campaign?.activated_at) {
      updateData.activated_at = new Date().toISOString()
    }
    await supabase.from('campaigns').update(updateData).eq('id', campaignId)

    toast.success('Driver assigned! 🎉')

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
    setActionLoading(prev => ({ ...prev, [`assign_${campaignId}`]: false }))
  }

  async function handleApproveProof(proofId, driverJobId, driverId, driverPayout) {
    setActionLoading(prev => ({ ...prev, [`approve_${proofId}`]: true }))
    const { error } = await supabase.from('daily_proofs').update({ status: 'approved', reviewed_by: profile.id }).eq('id', proofId)
    if (error) { toast.error(error.message); setActionLoading(prev => ({ ...prev, [`approve_${proofId}`]: false })); return }
    
    // Add daily amount
    const amount = Math.round((driverPayout || 600) / 30)
    await supabase.from('earnings').insert({ driver_id: driverId, driver_job_id: driverJobId, amount, earning_date: new Date().toISOString().split('T')[0], type: 'daily' })
    
    // Check if this is the first proof for this job (i.e. no print reimbursement yet)
    let bonusText = ''
    const { data: existingBonus } = await supabase.from('earnings').select('id').eq('driver_job_id', driverJobId).eq('type', 'print_reimbursement')
    if (!existingBonus || existingBonus.length === 0) {
      await supabase.from('earnings').insert({ driver_id: driverId, driver_job_id: driverJobId, amount: 175, earning_date: new Date().toISOString().split('T')[0], type: 'print_reimbursement' })
      bonusText = ' + ₹175 print bonus'
    }

    toast.success(`✅ Approved: +₹${amount}${bonusText}`)

    try {
      await sendNotification({
        userId: driverId,
        type: 'proof_approved',
        title: '✅ Proof Approved!',
        message: `Your daily proof was approved and ₹${amount}${bonusText} has been added to your earnings.`
      })
    } catch (notifErr) {
      console.error('Proof approval notification error:', notifErr)
    }

    fetchProofs()
    setActionLoading(prev => ({ ...prev, [`approve_${proofId}`]: false }))
  }

  async function handleRejectProof(proofId) {
    if (!window.confirm('Reject this proof? The driver will not earn for this day.')) return
    setActionLoading(prev => ({ ...prev, [`reject_${proofId}`]: true }))
    const { error } = await supabase.from('daily_proofs').update({ status: 'rejected', reviewed_by: profile.id }).eq('id', proofId)
    if (error) { toast.error(error.message); setActionLoading(prev => ({ ...prev, [`reject_${proofId}`]: false })); return }
    toast.success('Proof rejected'); fetchProofs()
    setActionLoading(prev => ({ ...prev, [`reject_${proofId}`]: false }))
  }

  async function handleProcessPayout(payoutId) {
    if (!window.confirm('Mark this payout as paid? Make sure you have transferred the money.')) return
    setActionLoading(prev => ({ ...prev, [`payout_${payoutId}`]: true }))
    const { error } = await supabase.from('payouts').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('id', payoutId)
    if (error) { toast.error(error.message); setActionLoading(prev => ({ ...prev, [`payout_${payoutId}`]: false })); return }
    toast.success('Payout marked as paid 💸')

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
    setActionLoading(prev => ({ ...prev, [`payout_${payoutId}`]: false }))
  }

  async function handleVerifyDriver(driverId) {
    if (!window.confirm('Verify this driver? This confirms their identity and allows them to receive jobs.')) return
    setActionLoading(prev => ({ ...prev, [`verify_${driverId}`]: true }))
    const { error } = await supabase.from('users').update({ is_verified: true }).eq('id', driverId)
    if (error) { toast.error(error.message); setActionLoading(prev => ({ ...prev, [`verify_${driverId}`]: false })); return }
    toast.success('Driver verified ✅')
    // Auto-assign to under-staffed campaigns
    try {
      const result = await autoAssignNewDriver(driverId)
      if (result.assigned) toast.success('🛺 Auto-assigned to a campaign!')
    } catch (e) { console.error('Auto-assign after verify failed:', e) }
    fetchDrivers(); fetchCampaigns()
    setActionLoading(prev => ({ ...prev, [`verify_${driverId}`]: false }))
  }

  async function handleAutoAssignAll() {
    if (!window.confirm('Auto-assign all free verified drivers to under-staffed campaigns?')) return
    setActionLoading(prev => ({ ...prev, autoAssignAll: true }))
    try {
      const result = await autoAssignAll()
      toast.success(result.message || `Assigned ${result.assignments} driver(s)`)
      fetchDrivers(); fetchCampaigns()
    } catch (e) { toast.error('Auto-assign failed: ' + e.message) }
    setActionLoading(prev => ({ ...prev, autoAssignAll: false }))
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

  // Filtered drivers
  const filteredDrivers = driverSearch
    ? drivers.filter(d =>
      (d.full_name || '').toLowerCase().includes(driverSearch.toLowerCase()) ||
      (d.phone || '').includes(driverSearch) ||
      (d.city || '').toLowerCase().includes(driverSearch.toLowerCase()) ||
      (d.vehicle_number || '').toLowerCase().includes(driverSearch.toLowerCase())
    )
    : drivers

  const VEHICLE_TYPE_LABELS = { auto_rickshaw: 'Auto Rickshaw', e_rickshaw: 'E-Rickshaw', cycle_rickshaw: 'Cycle Rickshaw' }
  const VEHICLE_ICONS_MAP = { auto_rickshaw: Truck, e_rickshaw: Zap, cycle_rickshaw: Bike }
  const VEHICLE_COLORS = { auto_rickshaw: '#FFBF00', e_rickshaw: '#10B981', cycle_rickshaw: '#8B5CF6' }
  const FUEL_LABELS = { petrol: 'Petrol', cng: 'CNG', electric: 'Electric', manual: 'Manual' }
  const SIZE_LABELS = { small: 'Small', medium: 'Medium', large: 'Large' }

  const TABS = [
    { key: 'home', Icon: Home, label: 'Home' },
    { key: 'campaigns', Icon: Megaphone, label: `Ads (${campaigns.length})` },
    { key: 'drivers', Icon: Truck, label: `Drivers (${drivers.length})` },
    { key: 'proofs', Icon: Camera, label: 'Photos', alert: pendingProofs > 0, alertCount: pendingProofs },
    { key: 'payouts', Icon: CreditCard, label: 'Payouts', alert: pendingPayouts > 0, alertCount: pendingPayouts },
    { key: 'users', Icon: Users, label: `Users (${users.length})` },
    { key: 'leads', Icon: Building2, label: 'Leads' },
    { key: 'account', Icon: UserCircle, label: 'Account' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#F5F5F5', color: '#111', fontFamily: "'DM Sans',sans-serif" }}>

      {/* Lightbox */}
      <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />

      {/* NAV */}
      <div style={{ background: '#fff', borderBottom: '1px solid #EBEBEB', padding: '0 18px', height: '58px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ fontFamily: 'Bebas Neue,sans-serif', fontSize: '1.7rem', color: '#FFBF00', letterSpacing: '0.05em' }}>AdWheels</div>
          <span style={{ background: '#FDECEA', color: '#C62828', border: '1px solid #FFAAAA', fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '3px 9px', borderRadius: '100px' }}>Admin</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Refresh button */}
          <button onClick={handleRefresh} style={{ background: 'none', border: '1.5px solid #E8E8E8', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#888' }} title="Refresh data">
            <RefreshCw size={14} className={refreshing ? 'refresh-spin' : ''} />
          </button>
          {/* Notification Bell */}
          <NotificationBell userId={profile.id} />
          <span style={{ fontSize: '0.84rem', color: '#666' }}>{profile.full_name}</span>
          <button onClick={signOut} style={{ background: 'none', border: '1.5px solid #E8E8E8', borderRadius: '8px', padding: '6px 12px', fontSize: '0.82rem', color: '#888', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <LogOut size={13} /> Logout
          </button>
        </div>
      </div>

      {/* TABS */}
      <div style={{ background: '#fff', borderBottom: '1px solid #EBEBEB', display: 'flex', overflowX: 'auto', scrollbarWidth: 'none', padding: '0 6px' }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{ padding: '13px 13px', border: 'none', background: 'none', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', color: tab === t.key ? '#C62828' : '#999', borderBottom: tab === t.key ? '2.5px solid #E53935' : '2.5px solid transparent', flexShrink: 0, transition: 'all .18s', display: 'flex', alignItems: 'center', gap: '5px', position: 'relative' }}>
            <t.Icon size={15} /> {t.label}
            {t.alert && <span style={{background:'#E53935',color:'#fff',fontSize:'.6rem',fontWeight:800,padding:'1px 5px',borderRadius:'100px',minWidth:'16px',textAlign:'center'}}>{t.alertCount}</span>}
          </button>
        ))}
      </div>

      <div style={{ padding: '16px', maxWidth: '900px', margin: '0 auto' }}>

        {/* HOME — Command Center */}
        {tab === 'home' && <div className="tab-content">
          {/* KPI Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: '12px', marginBottom: '16px' }}>
            {[
              { n: `₹${totalRevenue.toLocaleString()}`, l: 'Total Revenue', c: '#D49800', icon: '💰', sub: `${campaigns.filter(c=>c.status==='active').length} active` },
              { n: activeCampaigns, l: 'Active Campaigns', c: '#1DB954', icon: '📢', sub: `${campaigns.length} total` },
              { n: drivers.length, l: 'Total Drivers', c: '#1565C0', icon: '🛺', sub: `${drivers.filter(d=>!busyDriverIds.has(d.id)).length} free` },
              { n: pendingProofs, l: 'Photos to Review', c: '#E53935', icon: '📸', sub: pendingProofs > 0 ? 'Needs attention' : 'All clear' },
              { n: pendingPayouts, l: 'Payout Requests', c: '#FF8C00', icon: '💳', sub: pendingPayouts > 0 ? 'Pending' : 'All clear' },
            ].map(x => (
              <div key={x.l} style={{ ...card, padding: '18px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: '12px', right: '14px', fontSize: '1.4rem', opacity: 0.15 }}>{x.icon}</div>
                <div style={{ fontFamily: 'Bebas Neue,sans-serif', fontSize: '2rem', color: x.c, lineHeight: 1 }}>{x.n}</div>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '4px' }}>{x.l}</div>
                <div style={{ fontSize: '0.72rem', color: '#aaa', marginTop: '6px' }}>{x.sub}</div>
              </div>
            ))}
          </div>

          {/* Campaign Status Distribution */}
          <div style={{ ...card, padding: '20px' }}>
            <div style={{ fontWeight: 800, fontSize: '0.92rem', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}><BarChart3 size={15} color="#D49800" /> Campaign Status Distribution</div>
            <div style={{ display: 'flex', height: '12px', borderRadius: '8px', overflow: 'hidden', marginBottom: '12px', background: '#F0F0F0' }}>
              {[
                { key: 'active', color: '#1DB954' }, { key: 'paid', color: '#1565C0' },
                { key: 'pending', color: '#FFBF00' }, { key: 'completed', color: '#888' },
                { key: 'cancelled', color: '#E53935' },
              ].map(s => {
                const count = campaigns.filter(c => c.status === s.key).length
                const pct = campaigns.length ? (count / campaigns.length * 100) : 0
                return pct > 0 ? <div key={s.key} style={{ width: `${pct}%`, background: s.color, transition: 'width .4s' }} title={`${s.key}: ${count}`} /> : null
              })}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              {[['active','#1DB954'],['paid','#1565C0'],['pending','#FFBF00'],['completed','#888'],['cancelled','#E53935']].map(([k,c]) => {
                const count = campaigns.filter(ca => ca.status === k).length
                return <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: c, display: 'inline-block' }} />
                  <span style={{ fontWeight: 600, color: '#555', textTransform: 'capitalize' }}>{k}</span>
                  <span style={{ fontWeight: 800, color: c }}>{count}</span>
                </div>
              })}
            </div>
          </div>

          {/* Driver Utilization */}
          <div style={{ ...card, padding: '20px' }}>
            <div style={{ fontWeight: 800, fontSize: '0.92rem', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}><Users size={15} color="#1565C0" /> Driver Utilization</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              {/* Donut chart via SVG */}
              {(() => {
                const busy = busyDriverIds.size, free = drivers.length - busy, total = drivers.length || 1
                const busyPct = busy / total * 100, r = 40, c = 2 * Math.PI * r
                return <svg width="100" height="100" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r={r} fill="none" stroke="#E8E8E8" strokeWidth="10" />
                  <circle cx="50" cy="50" r={r} fill="none" stroke="#1DB954" strokeWidth="10" strokeDasharray={`${busyPct / 100 * c} ${c}`} strokeLinecap="round" transform="rotate(-90 50 50)" style={{ transition: 'stroke-dasharray .5s' }} />
                  <text x="50" y="48" textAnchor="middle" fontSize="18" fontWeight="800" fontFamily="Bebas Neue" fill="#111">{busy}/{total}</text>
                  <text x="50" y="62" textAnchor="middle" fontSize="8" fontWeight="700" fill="#888">ENGAGED</text>
                </svg>
              })()}
              <div style={{ display: 'grid', gap: '8px', flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#E6F9EE', borderRadius: '8px', padding: '10px 14px' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#0A6B30' }}>🟢 Free Drivers</span>
                  <span style={{ fontFamily: 'Bebas Neue,sans-serif', fontSize: '1.3rem', color: '#1DB954' }}>{drivers.length - busyDriverIds.size}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FFF8E6', borderRadius: '8px', padding: '10px 14px' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#7A5900' }}>🔴 Engaged</span>
                  <span style={{ fontFamily: 'Bebas Neue,sans-serif', fontSize: '1.3rem', color: '#D49800' }}>{busyDriverIds.size}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FDECEA', borderRadius: '8px', padding: '10px 14px' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#C62828' }}>⚪ Unverified</span>
                  <span style={{ fontFamily: 'Bebas Neue,sans-serif', fontSize: '1.3rem', color: '#E53935' }}>{drivers.filter(d => !d.is_verified).length}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Alert Banners */}
          {pendingProofs > 0 && <div onClick={() => setTab('proofs')} style={{ background: '#FDECEA', border: '1px solid #FFAAAA', borderRadius: '12px', padding: '14px 16px', fontSize: '0.88rem', color: '#C62828', fontWeight: 700, cursor: 'pointer', marginBottom: '10px', transition: 'transform .15s', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.01)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}><span>🔴 {pendingProofs} photo{pendingProofs > 1 ? 's' : ''} waiting for review</span><span style={{ fontSize: '1.1rem' }}>→</span></div>}
          {pendingPayouts > 0 && <div onClick={() => setTab('payouts')} style={{ background: '#FFF8E6', border: '1px solid #FFE08A', borderRadius: '12px', padding: '14px 16px', fontSize: '0.88rem', color: '#7A5900', fontWeight: 700, cursor: 'pointer', marginBottom: '10px', transition: 'transform .15s', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.01)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}><span>💸 {pendingPayouts} payout request{pendingPayouts > 1 ? 's' : ''} pending</span><span style={{ fontSize: '1.1rem' }}>→</span></div>}

          {/* Recent Campaigns — Enhanced */}
          <div style={{ fontWeight: 800, fontSize: '1rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}><Activity size={15} color="#888" /> Recent Campaigns</div>
          {campaigns.slice(0, 6).map(c => {
            const daysActive = c.activated_at ? Math.floor((Date.now() - new Date(c.activated_at).getTime()) / 86400000) : 0
            const daysLeft = c.activated_at && c.status === 'active' ? Math.max(0, 30 - daysActive) : null
            const progress = c.activated_at && c.status === 'active' ? Math.min(100, Math.round(daysActive / 30 * 100)) : 0
            return (
              <div key={c.id} style={{ ...card, padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, marginBottom: '3px' }}>{c.users?.full_name} — {c.plans?.name}</div>
                    <div style={{ fontSize: '0.82rem', color: '#888', marginBottom: '6px' }}>📍 {c.city} · {c.area} · ₹{c.plans?.price?.toLocaleString()}/mo</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={badge(c.status)}>{c.status}</span>
                      {daysLeft !== null && <span style={{ fontSize: '0.72rem', color: daysLeft <= 5 ? '#E53935' : '#D49800', fontWeight: 700 }}>⏰ {daysLeft}d left</span>}
                    </div>
                  </div>
                  {c.banner_url && <img src={c.banner_url} alt="banner" style={{ width: '60px', height: '40px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #E8E8E8' }} />}
                </div>
                {c.status === 'active' && progress > 0 && (
                  <div style={{ marginTop: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#aaa', marginBottom: '4px' }}><span>Day {daysActive}/30</span><span>{progress}%</span></div>
                    <div style={{ height: '4px', borderRadius: '4px', background: '#F0F0F0', overflow: 'hidden' }}><div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(90deg,#FFBF00,#FF8C00)', borderRadius: '4px', transition: 'width .4s' }} /></div>
                  </div>
                )}
              </div>
            )
          })}
        </div>}

        {/* CAMPAIGNS — with filters + expandable cards */}
        {tab === 'campaigns' && <div className="tab-content">
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
                      onMarkPaid={handleMarkPaid}
                      onActivate={handleAdminActivateCampaign}
                    />
                  )}
                </div>
              )
            })
          }
        </div>}

        {/* DRIVERS — Enhanced */}
        {tab === 'drivers' && <div className="tab-content">
          {/* Summary bar + Auto-assign */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {[
                { l: 'Total', n: drivers.length, c: '#1565C0' },
                { l: 'Free', n: drivers.length - busyDriverIds.size, c: '#1DB954' },
                { l: 'Engaged', n: busyDriverIds.size, c: '#D49800' },
                { l: 'Unverified', n: drivers.filter(d => !d.is_verified).length, c: '#E53935' },
              ].map(x => (
                <div key={x.l} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem' }}>
                  <span style={{ fontFamily: 'Bebas Neue,sans-serif', fontSize: '1.1rem', color: x.c }}>{x.n}</span>
                  <span style={{ fontWeight: 600, color: '#888' }}>{x.l}</span>
                </div>
              ))}
            </div>
            <button className="action-btn" onClick={handleAutoAssignAll} disabled={actionLoading.autoAssignAll} style={{ ...btn('#1DB954', '#fff'), fontSize: '0.78rem', padding: '7px 14px', opacity: actionLoading.autoAssignAll ? .6 : 1 }}>
              <Zap size={13} /> {actionLoading.autoAssignAll ? 'Assigning…' : 'Auto-Assign All'}
            </button>
          </div>

          {/* Search */}
          <div style={{ position: 'relative', marginBottom: '16px' }}>
            <Search size={16} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: '#bbb', pointerEvents: 'none' }} />
            <input className="search-input" type="text" placeholder="Search by name, phone, city, or vehicle…" value={driverSearch} onChange={e => setDriverSearch(e.target.value)} />
          </div>

          {driverSearch && <div style={{ fontSize: '0.82rem', color: '#888', marginBottom: '10px' }}>{filteredDrivers.length} result{filteredDrivers.length !== 1 ? 's' : ''} found</div>}

          {filteredDrivers.length === 0
            ? <div style={{ textAlign: 'center', padding: '48px', color: '#bbb' }}><div style={{ fontSize: '3rem', marginBottom: '10px' }}>🛺</div><div>{driverSearch ? 'No drivers match your search' : 'No drivers yet'}</div></div>
            : filteredDrivers.map(d => {
              const assignedCampaign = busyDriverIds.has(d.id) ? campaigns.find(c => c.status === 'active' || c.status === 'paid') : null
              const VIcon = d.vehicle_type ? (VEHICLE_ICONS_MAP[d.vehicle_type] || Truck) : Truck
              const vColor = d.vehicle_type ? (VEHICLE_COLORS[d.vehicle_type] || '#888') : '#888'
              return (
                <div key={d.id} style={{ ...card, border: busyDriverIds.has(d.id) ? '1.5px solid #FFE08A' : !d.is_verified ? '1.5px solid #FFAAAA' : '1px solid #E8E8E8' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                        <div style={{ fontWeight: 700 }}>{d.full_name}</div>
                        {d.is_verified && <span style={{ color: '#1DB954', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '2px' }}><CheckCircle size={13}/> Verified</span>}
                        <span style={{
                          background: busyDriverIds.has(d.id) ? '#FFF8E6' : !d.is_verified ? '#FDECEA' : '#E6F9EE',
                          color: busyDriverIds.has(d.id) ? '#7A5900' : !d.is_verified ? '#C62828' : '#0A6B30',
                          fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase',
                          padding: '3px 8px', borderRadius: '100px'
                        }}>
                          {busyDriverIds.has(d.id) ? 'Engaged' : !d.is_verified ? 'Unverified' : 'Free'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.82rem', color: '#888', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={13}/> {d.city} · <span style={{display:'flex',alignItems:'center',gap:'2px'}}>{d.phone}</span></div>
                      <div style={{ fontSize: '0.82rem', color: '#888', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}><VIcon size={13} style={{color:vColor}}/> {d.vehicle_number || 'No vehicle number'}</div>
                      {/* Vehicle type badge */}
                      {d.vehicle_type && (
                        <div style={{display:'inline-flex',alignItems:'center',gap:'6px',background:vColor+'12',border:`1px solid ${vColor}30`,borderRadius:'8px',padding:'4px 10px',marginTop:'4px',marginBottom:'2px'}}>
                          <VIcon size={12} style={{color:vColor}}/>
                          <span style={{fontSize:'.72rem',fontWeight:700,color:vColor}}>{VEHICLE_TYPE_LABELS[d.vehicle_type]}</span>
                          {d.fuel_type && <span style={{fontSize:'.68rem',color:'#888'}}>· {FUEL_LABELS[d.fuel_type]}</span>}
                          {d.vehicle_size && <span style={{fontSize:'.68rem',color:'#888'}}>· {SIZE_LABELS[d.vehicle_size]}</span>}
                        </div>
                      )}
                      <div style={{ fontSize: '0.82rem', color: '#888', display: 'flex', alignItems: 'center', gap: '4px' }}><CreditCard size={13}/> UPI: {d.upi_id || 'Not set'}</div>
                      <div style={{ fontSize: '0.72rem', color: '#aaa', marginTop: '4px' }}>Joined: {new Date(d.created_at).toLocaleDateString('en-IN')}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
                      {!d.is_verified && (
                        <button className="action-btn" style={{ ...btn('#1DB954', '#fff'), opacity: actionLoading[`verify_${d.id}`] ? .6 : 1 }} onClick={() => handleVerifyDriver(d.id)} disabled={actionLoading[`verify_${d.id}`]}>
                          <CheckCircle size={14} /> {actionLoading[`verify_${d.id}`] ? 'Verifying...' : 'Verify + Auto-Assign'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          }
        </div>}

        {/* PROOFS — Date-wise with Status Filters */}
        {tab === 'proofs' && <div className="tab-content">
          {/* Status filter tabs */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
            {[
              { key: 'all', label: 'All', count: proofs.length },
              { key: 'pending', label: 'Pending', count: proofs.filter(p => p.status === 'pending').length, color: '#FF8C00' },
              { key: 'approved', label: 'Approved', count: proofs.filter(p => p.status === 'approved').length, color: '#1DB954' },
              { key: 'rejected', label: 'Rejected', count: proofs.filter(p => p.status === 'rejected').length, color: '#E53935' },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setProofFilter(f.key)}
                style={{
                  background: proofFilter === f.key ? (f.color || '#FFBF00') : '#fff',
                  color: proofFilter === f.key ? '#fff' : '#666',
                  border: proofFilter === f.key ? `1.5px solid ${f.color || '#D49800'}` : '1.5px solid #E8E8E8',
                  borderRadius: '100px', padding: '8px 16px', fontSize: '0.82rem',
                  fontWeight: 700, cursor: 'pointer', display: 'inline-flex',
                  alignItems: 'center', gap: '5px', transition: 'all .18s'
                }}
              >
                {f.label}
                <span style={{
                  background: proofFilter === f.key ? 'rgba(255,255,255,0.3)' : '#F0F0F0',
                  color: proofFilter === f.key ? '#fff' : '#888',
                  fontSize: '0.7rem', fontWeight: 800, padding: '2px 7px',
                  borderRadius: '100px', minWidth: '20px', textAlign: 'center'
                }}>{f.count}</span>
              </button>
            ))}
          </div>

          {(() => {
            const filtered = proofFilter === 'all' ? proofs : proofs.filter(p => p.status === proofFilter)
            if (filtered.length === 0) {
              return (
                <div style={{ textAlign: 'center', padding: '48px', color: '#bbb' }}>
                  <Camera size={48} style={{ color: '#ddd', marginBottom: '10px' }} />
                  <div style={{ fontWeight: 700, color: '#999', marginBottom: '4px' }}>
                    {proofFilter === 'all' ? 'No photos yet' : `No ${proofFilter} photos`}
                  </div>
                  <div style={{ fontSize: '0.84rem' }}>Photos will appear here when drivers upload them.</div>
                </div>
              )
            }

            // Group by date
            const grouped = {}
            filtered.forEach(p => {
              const date = p.proof_date || 'Unknown'
              if (!grouped[date]) grouped[date] = []
              grouped[date].push(p)
            })
            const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a))
            const today = new Date().toISOString().split('T')[0]
            const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
            const formatDateLabel = (d) => {
              if (d === today) return 'Today'
              if (d === yesterday) return 'Yesterday'
              if (d === 'Unknown') return 'Unknown Date'
              return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
            }

            return sortedDates.map(date => (
              <div key={date} style={{ marginBottom: '22px' }}>
                {/* Date header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.92rem', color: date === today ? '#D49800' : '#374151', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={14} style={{ color: date === today ? '#D49800' : '#888' }} />
                    {formatDateLabel(date)}
                  </div>
                  <div style={{ height: '1px', flex: 1, background: '#E8E8E8' }} />
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#888', background: '#F5F5F5', padding: '3px 10px', borderRadius: '100px' }}>
                    {grouped[date].length} photo{grouped[date].length > 1 ? 's' : ''}
                    {grouped[date].filter(p => p.status === 'pending').length > 0 && (
                      <span style={{ color: '#E53935', marginLeft: '4px' }}>
                        · {grouped[date].filter(p => p.status === 'pending').length} pending
                      </span>
                    )}
                  </span>
                </div>

                {/* Proof cards for this date */}
                {grouped[date].map(p => (
                  <div key={p.id} style={{ ...card, border: p.status === 'pending' ? '1.5px solid #FFE08A' : '1px solid #E8E8E8' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, marginBottom: '4px' }}>{p.users?.full_name || 'Driver'}</div>
                        <div style={{ fontSize: '0.82rem', color: '#888', marginBottom: '8px' }}>
                          {p.driver_jobs?.campaigns?.plans?.name || 'Campaign'} · {p.driver_jobs?.campaigns?.city || ''} · {p.proof_date}
                        </div>
                        <span style={badge(p.status)}>{p.status}</span>
                        {p.status === 'pending' && (
                          <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                            <button
                              className="action-btn"
                              style={{ ...btn('#1DB954', '#fff'), opacity: actionLoading[`approve_${p.id}`] ? .6 : 1 }}
                              onClick={() => handleApproveProof(p.id, p.driver_job_id, p.driver_id, p.driver_jobs?.campaigns?.plans?.driver_payout)}
                              disabled={actionLoading[`approve_${p.id}`]}
                            >
                              <CheckCircle size={14} /> {actionLoading[`approve_${p.id}`] ? 'Approving…' : `Approve + ₹${Math.round((p.driver_jobs?.campaigns?.plans?.driver_payout || 600) / 30)}`}
                            </button>
                            <button
                              className="action-btn"
                              style={{ ...btn('#FDECEA', '#C62828'), opacity: actionLoading[`reject_${p.id}`] ? .6 : 1 }}
                              onClick={() => handleRejectProof(p.id)}
                              disabled={actionLoading[`reject_${p.id}`]}
                            >
                              <XCircle size={14} /> {actionLoading[`reject_${p.id}`] ? 'Rejecting…' : 'Reject'}
                            </button>
                          </div>
                        )}
                      </div>
                      {/* Clickable proof image — opens lightbox */}
                      {p.photo_url && (
                        <div
                          onClick={() => setLightboxSrc(p.photo_url)}
                          style={{ position: 'relative', cursor: 'zoom-in', flexShrink: 0 }}
                          title="Click to enlarge"
                        >
                          <img src={p.photo_url} alt="proof" style={{ width: '160px', height: '110px', objectFit: 'cover', borderRadius: '10px', border: '1px solid #E8E8E8' }} />
                          <div style={{ position: 'absolute', bottom: '6px', right: '6px', background: 'rgba(0,0,0,0.55)', borderRadius: '6px', padding: '3px 6px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <Eye size={11} color="#fff" />
                            <span style={{ fontSize: '0.6rem', color: '#fff', fontWeight: 700 }}>View</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ))
          })()}
        </div>}

        {/* PAYOUTS */}
        {tab === 'payouts' && <div className="tab-content">
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
                    <button
                      className="action-btn"
                      style={{ ...btn('#1DB954', '#fff'), opacity: actionLoading[`payout_${p.id}`] ? .6 : 1 }}
                      onClick={() => handleProcessPayout(p.id)}
                      disabled={actionLoading[`payout_${p.id}`]}
                    >
                      <Wallet size={14} /> {actionLoading[`payout_${p.id}`] ? 'Processing…' : 'Mark Paid'}
                    </button>
                  )}
                </div>
              </div>
            ))
          }
        </div>}

        {/* USERS */}
        {tab === 'users' && <div className="tab-content">
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
        </div>}

        {tab === 'leads' && <div className="tab-content"><EnterpriseLeads /></div>}

        {/* ACCOUNT */}
        {tab === 'account' && <div className="tab-content">
          <AccountSection profile={profile} role="admin" />
        </div>}

      </div>
    </div>
  )
}
