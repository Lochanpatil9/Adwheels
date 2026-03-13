import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { LogOut, CheckCircle, XCircle, Users, Wallet, Plus } from 'lucide-react'

const s = {
  app: { minHeight:'100vh', background:'var(--black)', color:'var(--white)' },
  nav: { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 32px', borderBottom:'1px solid var(--border)', background:'rgba(8,8,8,0.95)', position:'sticky', top:0, zIndex:100 },
  logo: { fontFamily:'Bebas Neue', fontSize:'1.8rem', color:'var(--yellow)', letterSpacing:'0.05em' },
  adminBadge: { background:'rgba(255,45,45,0.15)', border:'1px solid rgba(255,45,45,0.3)', color:'var(--red)', fontSize:'0.7rem', fontWeight:800, letterSpacing:'0.1em', textTransform:'uppercase', padding:'3px 10px', borderRadius:'4px' },
  navRight: { display:'flex', alignItems:'center', gap:'12px' },
  logoutBtn: { background:'transparent', border:'1px solid var(--border)', color:'rgba(245,240,232,0.5)', padding:'8px 14px', borderRadius:'6px', cursor:'pointer', display:'flex', alignItems:'center', gap:'6px', fontSize:'0.82rem' },
  content: { padding:'32px', maxWidth:'1200px', margin:'0 auto' },
  pageTitle: { fontFamily:'Syne', fontSize:'1.6rem', fontWeight:800, marginBottom:'6px' },
  pageSub: { fontSize:'0.88rem', color:'rgba(245,240,232,0.4)', marginBottom:'32px' },
  tabs: { display:'flex', gap:'4px', background:'rgba(245,240,232,0.04)', borderRadius:'10px', padding:'4px', marginBottom:'32px', flexWrap:'wrap' },
  tab: (active) => ({ padding:'10px 20px', border:'none', borderRadius:'7px', fontFamily:'Syne', fontSize:'0.85rem', fontWeight:700, cursor:'pointer', transition:'all 0.2s', background: active ? 'var(--red)' : 'transparent', color: active ? 'white' : 'rgba(245,240,232,0.45)' }),
  statsRow: { display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:'16px', marginBottom:'32px' },
  statCard: { background:'var(--card)', border:'1px solid var(--border)', borderRadius:'12px', padding:'24px' },
  statNum: { fontFamily:'Bebas Neue', fontSize:'2.5rem', color:'var(--yellow)', lineHeight:1 },
  statLabel: { fontSize:'0.76rem', color:'rgba(245,240,232,0.4)', letterSpacing:'0.06em', textTransform:'uppercase', marginTop:'4px' },
  card: { background:'var(--card)', border:'1px solid var(--border)', borderRadius:'12px', padding:'24px', marginBottom:'16px' },
  badge: (status) => {
    const map = {
      pending:['rgba(255,208,0,0.12)','var(--yellow)'],
      paid:['rgba(0,100,255,0.12)','#6af'],
      active:['rgba(0,230,118,0.12)','var(--green)'],
      completed:['rgba(128,128,128,0.12)','#888'],
      cancelled:['rgba(255,45,45,0.12)','var(--red)'],
      offered:['rgba(255,208,0,0.12)','var(--yellow)'],
      rejected:['rgba(255,45,45,0.12)','var(--red)'],
      requested:['rgba(255,208,0,0.12)','var(--yellow)'],
      approved:['rgba(0,230,118,0.12)','var(--green)'],
      advertiser:['rgba(255,208,0,0.12)','var(--yellow)'],
      driver:['rgba(0,230,118,0.12)','var(--green)'],
      admin:['rgba(255,45,45,0.12)','var(--red)'],
    }
    const [bg,col] = map[status]||['rgba(128,128,128,0.1)','#888']
    return { display:'inline-block', background:bg, color:col, fontSize:'0.7rem', fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', padding:'3px 10px', borderRadius:'100px' }
  },
  btn: (color) => ({
    background: color==='green'?'var(--green)':color==='red'?'rgba(255,45,45,0.15)':color==='yellow'?'var(--yellow)':'rgba(245,240,232,0.08)',
    color: color==='green'?'var(--black)':color==='red'?'var(--red)':color==='yellow'?'var(--black)':'var(--white)',
    fontFamily:'Syne', fontWeight:700, fontSize:'0.82rem', padding:'8px 16px',
    border: color==='red'?'1px solid rgba(255,45,45,0.3)':'none',
    borderRadius:'6px', cursor:'pointer', display:'inline-flex', alignItems:'center', gap:'6px', transition:'all 0.2s'
  }),
  select: { background:'rgba(245,240,232,0.04)', border:'1.5px solid rgba(245,240,232,0.09)', borderRadius:'8px', padding:'10px 14px', color:'var(--white)', fontSize:'0.88rem', outline:'none', WebkitAppearance:'none', cursor:'pointer' },
  emptyState: { textAlign:'center', padding:'48px 20px', color:'rgba(245,240,232,0.3)' },
  sectionTitle: { fontFamily:'Syne', fontWeight:800, fontSize:'1.1rem', marginBottom:'16px', marginTop:'8px' },
}

// ── Small component: shows assigned drivers for a campaign ──
function AssignedDrivers({ campaignId, allDrivers }) {
  const [assigned, setAssigned] = useState([])

  useEffect(() => {
    supabase
      .from('driver_jobs')
      .select('driver_id, status')
      .eq('campaign_id', campaignId)
      .neq('status', 'rejected')
      .then(({ data }) => setAssigned(data || []))
  }, [campaignId])

  if (assigned.length === 0) return (
    <div style={{fontSize:'0.8rem', color:'rgba(245,240,232,0.3)', marginTop:'10px', fontStyle:'italic'}}>No drivers assigned yet</div>
  )

  return (
    <div style={{marginTop:'12px'}}>
      <div style={{fontSize:'0.72rem', fontWeight:800, letterSpacing:'0.1em', textTransform:'uppercase', color:'rgba(0,230,118,0.5)', marginBottom:'8px'}}>
        Assigned Drivers ({assigned.length})
      </div>
      <div style={{display:'flex', flexDirection:'column', gap:'6px'}}>
        {assigned.map(a => {
          const driver = allDrivers.find(d => d.id === a.driver_id)
          return (
            <div key={a.driver_id} style={{display:'flex', justifyContent:'space-between', alignItems:'center', background:'rgba(0,230,118,0.04)', border:'1px solid rgba(0,230,118,0.1)', borderRadius:'8px', padding:'10px 14px'}}>
              <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                <span style={{fontSize:'1rem'}}>🛺</span>
                <div>
                  <div style={{fontSize:'0.88rem', fontWeight:600}}>{driver?.full_name || 'Unknown Driver'}</div>
                  <div style={{fontSize:'0.75rem', color:'rgba(245,240,232,0.4)'}}>{driver?.city} · {driver?.phone}</div>
                </div>
              </div>
              <span style={s.badge(a.status)}>{a.status}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Main Admin Dashboard ──
export default function AdminDashboard({ profile }) {
  const [tab, setTab] = useState('dashboard')
  const [campaigns, setCampaigns] = useState([])
  const [drivers, setDrivers] = useState([])
  const [proofs, setProofs] = useState([])
  const [payouts, setPayouts] = useState([])
  const [users, setUsers] = useState([])
  const [assigningJob, setAssigningJob] = useState(null)
  const [selectedDriver, setSelectedDriver] = useState('')

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    await Promise.all([fetchCampaigns(), fetchDrivers(), fetchProofs(), fetchPayouts(), fetchUsers()])
  }

  async function fetchCampaigns() {
    const { data } = await supabase.from('campaigns')
      .select('*, plans(name, price, rickshaw_count, driver_payout), users(full_name, phone, city)')
      .order('created_at', { ascending: false })
    setCampaigns(data || [])
  }

  async function fetchDrivers() {
    const { data } = await supabase.from('users').select('*').eq('role', 'driver')
    setDrivers(data || [])
  }

  async function fetchProofs() {
    const { data } = await supabase.from('daily_proofs')
      .select('*, users(full_name), driver_jobs(campaigns(city, area, plans(name, driver_payout)))')
      .order('created_at', { ascending: false })
    setProofs(data || [])
  }

  async function fetchPayouts() {
    const { data } = await supabase.from('payouts')
      .select('*, users(full_name, phone)')
      .order('requested_at', { ascending: false })
    setPayouts(data || [])
  }

  async function fetchUsers() {
    const { data } = await supabase.from('users').select('*').order('created_at', { ascending: false })
    setUsers(data || [])
  }

  async function handleActivateCampaign(campaignId) {
    const { error } = await supabase.from('campaigns').update({ status: 'paid' }).eq('id', campaignId)
    if (error) toast.error(error.message)
    else { toast.success('Campaign marked as paid ✅'); fetchCampaigns() }
  }

  async function handleAssignDriver(campaignId) {
    if (!selectedDriver) return toast.error('Select a driver first')
    const { data: existing } = await supabase.from('driver_jobs')
      .select('id').eq('driver_id', selectedDriver).eq('campaign_id', campaignId)
    if (existing && existing.length > 0) { toast.error('Driver already assigned to this campaign!'); return }
    const { error } = await supabase.from('driver_jobs').insert({
      driver_id: selectedDriver, campaign_id: campaignId, status: 'offered'
    })
    if (error) { toast.error(error.message); return }
    await supabase.from('campaigns').update({ status: 'active' }).eq('id', campaignId)
    toast.success('Driver assigned! They will see the job offer 🎉')
    setAssigningJob(null)
    setSelectedDriver('')
    fetchCampaigns()
  }

  async function handleApproveProof(proofId, driverJobId, driverId, driverPayout) {
    const { error } = await supabase.from('daily_proofs')
      .update({ status: 'approved', reviewed_by: profile.id }).eq('id', proofId)
    if (error) { toast.error(error.message); return }
    const today = new Date().toISOString().split('T')[0]
    const dailyAmount = Math.round((driverPayout || 600) / 30)
    await supabase.from('earnings').insert({
      driver_id: driverId, driver_job_id: driverJobId,
      amount: dailyAmount, earning_date: today, type: 'daily'
    })
    toast.success(`✅ Proof approved + ₹${dailyAmount} earning added`)
    fetchProofs()
  }

  async function handleRejectProof(proofId) {
    const { error } = await supabase.from('daily_proofs')
      .update({ status: 'rejected', reviewed_by: profile.id }).eq('id', proofId)
    if (error) toast.error(error.message)
    else { toast.success('Proof rejected'); fetchProofs() }
  }

  async function handleProcessPayout(payoutId) {
    const { error } = await supabase.from('payouts')
      .update({ status: 'paid', paid_at: new Date().toISOString() }).eq('id', payoutId)
    if (error) toast.error(error.message)
    else { toast.success('Payout marked as paid 💸'); fetchPayouts() }
  }

  async function handleVerifyDriver(driverId) {
    const { error } = await supabase.from('users').update({ is_verified: true }).eq('id', driverId)
    if (error) toast.error(error.message)
    else { toast.success('Driver verified ✅'); fetchDrivers() }
  }

  const totalRevenue = campaigns.filter(c => !['pending','cancelled'].includes(c.status)).reduce((sum, c) => sum + (c.plans?.price || 0), 0)
  const pendingProofs = proofs.filter(p => p.status === 'pending').length
  const pendingPayouts = payouts.filter(p => p.status === 'requested').length
  const activeCampaigns = campaigns.filter(c => c.status === 'active').length

  return (
    <div style={s.app}>
      <nav style={s.nav}>
        <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
          <div style={s.logo}>AdWheels</div>
          <span style={s.adminBadge}>Admin</span>
        </div>
        <div style={s.navRight}>
          <span style={{fontSize:'0.85rem', color:'rgba(245,240,232,0.45)'}}>👑 {profile.full_name}</span>
          <button style={s.logoutBtn} onClick={() => supabase.auth.signOut()}><LogOut size={14}/> Logout</button>
        </div>
      </nav>

      <div style={s.content}>
        <div style={s.pageTitle}>Admin Control Panel</div>
        <div style={s.pageSub}>Full control — campaigns, drivers, proofs, payouts 👑</div>

        <div style={s.tabs}>
          {[
            { key:'dashboard', label:'Dashboard' },
            { key:'campaigns', label:`Campaigns (${campaigns.length})` },
            { key:'drivers', label:`Drivers (${drivers.length})` },
            { key:'proofs', label: pendingProofs > 0 ? `Proofs 🔴 ${pendingProofs}` : 'Proofs' },
            { key:'payouts', label: pendingPayouts > 0 ? `Payouts 🔴 ${pendingPayouts}` : 'Payouts' },
            { key:'users', label:`Users (${users.length})` },
            { key:'leads', label:'🏢 Leads' },
          ].map(t => <button key={t.key} style={s.tab(tab===t.key)} onClick={() => setTab(t.key)}>{t.label}</button>)}
        </div>

        {/* ── DASHBOARD ── */}
        {tab === 'dashboard' && <>
          <div style={s.statsRow}>
            <div style={s.statCard}><div style={s.statNum}>₹{totalRevenue.toLocaleString()}</div><div style={s.statLabel}>Total Revenue</div></div>
            <div style={s.statCard}><div style={{...s.statNum, color:'var(--green)'}}>{activeCampaigns}</div><div style={s.statLabel}>Active Campaigns</div></div>
            <div style={s.statCard}><div style={{...s.statNum, color:'#6af'}}>{drivers.length}</div><div style={s.statLabel}>Total Drivers</div></div>
            <div style={s.statCard}><div style={{...s.statNum, color:'var(--red)'}}>{pendingProofs}</div><div style={s.statLabel}>Proofs to Review</div></div>
            <div style={s.statCard}><div style={{...s.statNum, color:'var(--orange)'}}>{pendingPayouts}</div><div style={s.statLabel}>Payout Requests</div></div>
          </div>
          {pendingProofs > 0 && <div style={{padding:'14px 18px', background:'rgba(255,45,45,0.06)', border:'1px solid rgba(255,45,45,0.2)', borderRadius:'10px', fontSize:'0.88rem', color:'var(--red)', fontWeight:600, cursor:'pointer', marginBottom:'12px'}} onClick={() => setTab('proofs')}>🔴 {pendingProofs} proof{pendingProofs>1?'s':''} waiting for review</div>}
          {pendingPayouts > 0 && <div style={{padding:'14px 18px', background:'rgba(255,208,0,0.06)', border:'1px solid rgba(255,208,0,0.2)', borderRadius:'10px', fontSize:'0.88rem', color:'var(--yellow)', fontWeight:600, cursor:'pointer', marginBottom:'12px'}} onClick={() => setTab('payouts')}>💸 {pendingPayouts} payout request{pendingPayouts>1?'s':''} pending</div>}
          <div style={s.sectionTitle}>Recent Campaigns</div>
          {campaigns.slice(0,5).map(c => (
            <div key={c.id} style={s.card}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'8px'}}>
                <div>
                  <div style={{fontFamily:'Syne', fontWeight:700, marginBottom:'4px'}}>{c.users?.full_name} — {c.plans?.name} Plan</div>
                  <div style={{fontSize:'0.82rem', color:'rgba(245,240,232,0.45)'}}>📍 {c.city} · {c.area} · ₹{c.plans?.price?.toLocaleString()}/mo</div>
                </div>
                <span style={s.badge(c.status)}>{c.status}</span>
              </div>
            </div>
          ))}
        </>}

        {/* ── CAMPAIGNS ── */}
        {tab === 'campaigns' && <>
          <div style={s.sectionTitle}>All Campaigns</div>
          {campaigns.length === 0
            ? <div style={s.emptyState}><div style={{fontSize:'3rem', marginBottom:'12px'}}>📢</div><div>No campaigns yet</div></div>
            : campaigns.map(c => (
              <div key={c.id} style={s.card}>
                {/* Top row — info + banner */}
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'12px', marginBottom:'16px'}}>
                  <div style={{flex:1}}>
                    <div style={{fontFamily:'Syne', fontWeight:700, fontSize:'1rem', marginBottom:'4px'}}>{c.plans?.name} Plan — {c.users?.full_name}</div>
                    <div style={{fontSize:'0.82rem', color:'rgba(245,240,232,0.45)', marginBottom:'2px'}}>📍 {c.city} — {c.area}</div>
                    <div style={{fontSize:'0.82rem', color:'rgba(245,240,232,0.45)', marginBottom:'10px'}}>📞 {c.users?.phone} · ₹{c.plans?.price?.toLocaleString()}/mo · {c.plans?.rickshaw_count} rickshaw{c.plans?.rickshaw_count>1?'s':''}</div>
                    <span style={s.badge(c.status)}>{c.status}</span>
                  </div>
                  {c.banner_url && <img src={c.banner_url} alt="banner" style={{width:'100px', height:'64px', objectFit:'cover', borderRadius:'8px', border:'1px solid var(--border)', flexShrink:0}}/>}
                </div>

                {/* Divider */}
                <div style={{borderTop:'1px solid var(--border)', paddingTop:'16px'}}>

                  {/* Step 1 — Mark as paid */}
                  {c.status === 'pending' && (
                    <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
                      <div style={{fontSize:'0.8rem', color:'rgba(245,240,232,0.4)'}}>⏳ Waiting for payment confirmation</div>
                      <button style={s.btn('yellow')} onClick={() => handleActivateCampaign(c.id)}>✅ Mark as Paid</button>
                    </div>
                  )}

                  {/* Step 2 — Assign drivers (paid or active) */}
                  {(c.status === 'paid' || c.status === 'active') && <>

                    {/* Assigned drivers list */}
                    <AssignedDrivers campaignId={c.id} allDrivers={drivers} />

                    {/* Assign new driver */}
                    <div style={{marginTop:'14px'}}>
                      {assigningJob === c.id
                        ? <div style={{display:'flex', gap:'8px', alignItems:'center', flexWrap:'wrap', background:'rgba(255,208,0,0.04)', border:'1px solid rgba(255,208,0,0.15)', borderRadius:'10px', padding:'12px'}}>
                            <div style={{fontSize:'0.78rem', fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:'rgba(255,208,0,0.6)', width:'100%', marginBottom:'6px'}}>Assign New Driver</div>
                            <select style={s.select} value={selectedDriver} onChange={e => setSelectedDriver(e.target.value)}>
                              <option value="">Select driver...</option>
                              {drivers.map(d => <option key={d.id} value={d.id}>{d.full_name} — {d.city} {d.is_verified?'✅':''}</option>)}
                            </select>
                            <button style={s.btn('green')} onClick={() => handleAssignDriver(c.id)}>Assign →</button>
                            <button style={s.btn('red')} onClick={() => { setAssigningJob(null); setSelectedDriver('') }}>Cancel</button>
                          </div>
                        : <button style={s.btn('default')} onClick={() => setAssigningJob(c.id)}>
                            <Plus size={14}/> Assign Another Driver
                          </button>
                      }
                    </div>
                  </>}
                </div>
              </div>
            ))
          }
        </>}

        {/* ── DRIVERS ── */}
        {tab === 'drivers' && <>
          <div style={s.sectionTitle}>All Drivers</div>
          {drivers.length === 0
            ? <div style={s.emptyState}><div style={{fontSize:'3rem', marginBottom:'12px'}}>🛺</div><div>No drivers yet</div></div>
            : drivers.map(d => (
              <div key={d.id} style={s.card}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'12px'}}>
                  <div>
                    <div style={{fontFamily:'Syne', fontWeight:700, marginBottom:'4px'}}>
                      {d.full_name} {d.is_verified && <span style={{color:'var(--green)', fontSize:'0.8rem'}}>✅ Verified</span>}
                    </div>
                    <div style={{fontSize:'0.82rem', color:'rgba(245,240,232,0.45)', marginBottom:'2px'}}>📞 {d.phone} · 📍 {d.city}</div>
                    <div style={{fontSize:'0.82rem', color:'rgba(245,240,232,0.45)', marginBottom:'2px'}}>🛺 {d.vehicle_number || 'No vehicle number'}</div>
                    <div style={{fontSize:'0.82rem', color:'rgba(245,240,232,0.45)'}}>💳 UPI: {d.upi_id || 'Not set'}</div>
                  </div>
                  {!d.is_verified && <button style={s.btn('green')} onClick={() => handleVerifyDriver(d.id)}><CheckCircle size={14}/> Verify Driver</button>}
                </div>
              </div>
            ))
          }
        </>}

        {/* ── PROOFS ── */}
        {tab === 'proofs' && <>
          <div style={s.sectionTitle}>Daily Proof Reviews</div>
          {proofs.length === 0
            ? <div style={s.emptyState}><div style={{fontSize:'3rem', marginBottom:'12px'}}>📷</div><div>No proofs yet</div></div>
            : proofs.map(p => (
              <div key={p.id} style={{...s.card, borderColor: p.status==='pending' ? 'rgba(255,208,0,0.25)' : 'var(--border)'}}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:'12px'}}>
                  <div style={{flex:1}}>
                    <div style={{fontFamily:'Syne', fontWeight:700, marginBottom:'4px'}}>{p.users?.full_name}</div>
                    <div style={{fontSize:'0.82rem', color:'rgba(245,240,232,0.45)', marginBottom:'8px'}}>
                      {p.driver_jobs?.campaigns?.plans?.name} · {p.driver_jobs?.campaigns?.city} · {p.proof_date}
                    </div>
                    <span style={s.badge(p.status)}>{p.status}</span>
                    {p.status === 'pending' && (
                      <div style={{display:'flex', gap:'8px', marginTop:'12px', flexWrap:'wrap'}}>
                        <button style={s.btn('green')} onClick={() => handleApproveProof(p.id, p.driver_job_id, p.driver_id, p.driver_jobs?.campaigns?.plans?.driver_payout)}>
                          <CheckCircle size={14}/> Approve + Add ₹{Math.round((p.driver_jobs?.campaigns?.plans?.driver_payout||600)/30)}
                        </button>
                        <button style={s.btn('red')} onClick={() => handleRejectProof(p.id)}>
                          <XCircle size={14}/> Reject
                        </button>
                      </div>
                    )}
                  </div>
                  {p.photo_url && (
                    <img src={p.photo_url} alt="proof" style={{width:'140px', height:'90px', objectFit:'cover', borderRadius:'8px', border:'1px solid var(--border)', flexShrink:0}}/>
                  )}
                </div>
              </div>
            ))
          }
        </>}

        {/* ── PAYOUTS ── */}
        {tab === 'payouts' && <>
          <div style={s.sectionTitle}>Payout Requests</div>
          {payouts.length === 0
            ? <div style={s.emptyState}><div style={{fontSize:'3rem', marginBottom:'12px'}}>💸</div><div>No payout requests yet</div></div>
            : payouts.map(p => (
              <div key={p.id} style={{...s.card, borderColor: p.status==='requested' ? 'rgba(255,208,0,0.25)' : 'var(--border)'}}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'12px'}}>
                  <div>
                    <div style={{fontFamily:'Syne', fontWeight:700, marginBottom:'4px'}}>{p.users?.full_name}</div>
                    <div style={{fontSize:'0.82rem', color:'rgba(245,240,232,0.45)', marginBottom:'4px'}}>📞 {p.users?.phone}</div>
                    <div style={{fontSize:'0.82rem', marginBottom:'8px'}}>💳 Send to UPI: <strong style={{color:'var(--white)'}}>{p.upi_id}</strong></div>
                    <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                      <span style={{fontFamily:'Bebas Neue', fontSize:'1.6rem', color:'var(--green)'}}>₹{p.amount}</span>
                      <span style={s.badge(p.status)}>{p.status}</span>
                    </div>
                    <div style={{fontSize:'0.78rem', color:'rgba(245,240,232,0.35)', marginTop:'4px'}}>
                      Requested: {new Date(p.requested_at).toLocaleDateString()}
                    </div>
                  </div>
                  {p.status === 'requested' && (
                    <button style={s.btn('green')} onClick={() => handleProcessPayout(p.id)}>
                      <Wallet size={14}/> Mark as Paid
                    </button>
                  )}
                </div>
              </div>
            ))
          }
        </>}

        {/* ── USERS ── */}
        {tab === 'users' && <>
          <div style={s.sectionTitle}>All Users</div>
          {users.map(u => (
            <div key={u.id} style={s.card}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'8px'}}>
                <div>
                  <div style={{fontFamily:'Syne', fontWeight:700, marginBottom:'4px'}}>{u.full_name}</div>
                  <div style={{fontSize:'0.82rem', color:'rgba(245,240,232,0.45)'}}>{u.phone} · {u.city}</div>
                </div>
                <span style={s.badge(u.role)}>{u.role}</span>
              </div>
            </div>
          ))}
        </>}

        {tab === 'leads' && <>
          <div style={s.sectionTitle}>Enterprise Leads</div>
          <EnterpriseLeads />
        </>}

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

  const statusColor = { new:'#a855f7', contacted:'#6af', converted:'var(--green)', closed:'#888' }

  if (loading) return <div style={{textAlign:'center', padding:'48px', color:'rgba(245,240,232,0.3)'}}>Loading...</div>

  if (leads.length === 0) return (
    <div style={{textAlign:'center', padding:'60px 20px', color:'rgba(245,240,232,0.3)'}}>
      <div style={{fontSize:'3rem', marginBottom:'12px'}}>🏢</div>
      <div style={{fontFamily:'Syne', fontWeight:700, marginBottom:'6px'}}>No enterprise leads yet</div>
      <div style={{fontSize:'0.85rem'}}>They'll appear here when advertisers fill the Enterprise form</div>
    </div>
  )

  return leads.map(l => (
    <div key={l.id} style={{background:'var(--card)', border:'1.5px solid rgba(168,85,247,0.2)', borderRadius:'12px', padding:'24px', marginBottom:'16px'}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:'12px'}}>
        <div style={{flex:1}}>
          <div style={{fontFamily:'Syne', fontWeight:800, fontSize:'1.05rem', marginBottom:'6px'}}>{l.company_name}</div>
          <div style={{fontSize:'0.82rem', color:'rgba(245,240,232,0.5)', marginBottom:'3px'}}>👤 {l.full_name}</div>
          <div style={{fontSize:'0.82rem', color:'rgba(245,240,232,0.5)', marginBottom:'3px'}}>📞 <a href={`tel:${l.phone}`} style={{color:'var(--yellow)', textDecoration:'none'}}>{l.phone}</a></div>
          {l.email && <div style={{fontSize:'0.82rem', color:'rgba(245,240,232,0.5)', marginBottom:'3px'}}>✉️ {l.email}</div>}
          {l.city && <div style={{fontSize:'0.82rem', color:'rgba(245,240,232,0.5)', marginBottom:'3px'}}>📍 {l.city}</div>}
          {l.message && <div style={{fontSize:'0.82rem', color:'rgba(245,240,232,0.6)', marginTop:'10px', padding:'10px', background:'rgba(245,240,232,0.04)', borderRadius:'8px', fontStyle:'italic'}}>"{l.message}"</div>}
          <div style={{fontSize:'0.72rem', color:'rgba(245,240,232,0.3)', marginTop:'10px'}}>{new Date(l.created_at).toLocaleString('en-IN')}</div>
        </div>
        <div style={{display:'flex', flexDirection:'column', gap:'8px', alignItems:'flex-end'}}>
          <span style={{display:'inline-block', background:`${statusColor[l.status] || '#888'}20`, color: statusColor[l.status] || '#888', fontSize:'0.7rem', fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', padding:'4px 12px', borderRadius:'100px'}}>{l.status}</span>
          <select
            value={l.status}
            onChange={e => updateStatus(l.id, e.target.value)}
            style={{background:'rgba(245,240,232,0.06)', border:'1px solid rgba(245,240,232,0.1)', borderRadius:'6px', color:'var(--white)', fontSize:'0.78rem', padding:'6px 10px', cursor:'pointer'}}
          >
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="converted">Converted</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>
    </div>
  ))
}