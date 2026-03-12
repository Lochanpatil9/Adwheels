import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { LogOut, Plus, BarChart2 } from 'lucide-react'

const PLANS = [
  { id:1, name:'Starter', price:1500, rickshaws:1, driver_payout:600, color:'#444', features:['1 Rickshaw','1 City','Standard Priority','Basic Analytics'] },
  { id:2, name:'Basic', price:5500, rickshaws:3, driver_payout:600, color:'#2a6', features:['3 Rickshaws','1–2 Cities','Standard Priority','Weekly Reports'] },
  { id:3, name:'Growth', price:11000, rickshaws:7, driver_payout:650, color:'var(--yellow)', features:['7 Rickshaws','Both Cities','High Priority','Live Tracking','Weekly Reports'] },
  { id:4, name:'Pro', price:21000, rickshaws:15, driver_payout:700, color:'var(--orange)', features:['15 Rickshaws','Both Cities','TOP Priority','90-min Guarantee','Live Tracking','Daily Reports'] },
]

const s = {
  app: { minHeight:'100vh', background:'var(--black)', color:'var(--white)' },
  nav: { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 32px', borderBottom:'1px solid var(--border)', background:'rgba(8,8,8,0.95)', position:'sticky', top:0, zIndex:100 },
  logo: { fontFamily:'Bebas Neue', fontSize:'1.8rem', color:'var(--yellow)', letterSpacing:'0.05em' },
  navRight: { display:'flex', alignItems:'center', gap:'16px' },
  greeting: { fontSize:'0.85rem', color:'rgba(245,240,232,0.45)' },
  logoutBtn: { background:'transparent', border:'1px solid var(--border)', color:'rgba(245,240,232,0.5)', padding:'8px 14px', borderRadius:'6px', cursor:'pointer', display:'flex', alignItems:'center', gap:'6px', fontSize:'0.82rem' },
  content: { padding:'32px', maxWidth:'1100px', margin:'0 auto' },
  pageTitle: { fontFamily:'Syne', fontSize:'1.6rem', fontWeight:800, marginBottom:'6px' },
  pageSub: { fontSize:'0.88rem', color:'rgba(245,240,232,0.4)', marginBottom:'32px' },
  tabs: { display:'flex', gap:'4px', background:'rgba(245,240,232,0.04)', borderRadius:'10px', padding:'4px', marginBottom:'32px', flexWrap:'wrap' },
  tab: (active) => ({ padding:'10px 22px', border:'none', borderRadius:'7px', fontFamily:'Syne', fontSize:'0.88rem', fontWeight:700, cursor:'pointer', transition:'all 0.2s', background: active ? 'var(--yellow)' : 'transparent', color: active ? 'var(--black)' : 'rgba(245,240,232,0.45)' }),
  statsRow: { display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'16px', marginBottom:'32px' },
  statCard: { background:'var(--card)', border:'1px solid var(--border)', borderRadius:'12px', padding:'24px' },
  statNum: { fontFamily:'Bebas Neue', fontSize:'2.5rem', color:'var(--yellow)', lineHeight:1 },
  statLabel: { fontSize:'0.76rem', color:'rgba(245,240,232,0.4)', letterSpacing:'0.06em', textTransform:'uppercase', marginTop:'4px' },
  card: { background:'var(--card)', border:'1px solid var(--border)', borderRadius:'12px', padding:'24px', marginBottom:'16px' },
  badge: (status) => {
    const colors = { pending:'rgba(255,208,0,0.15)', paid:'rgba(0,100,255,0.15)', active:'rgba(0,230,118,0.15)', completed:'rgba(128,128,128,0.15)', cancelled:'rgba(255,45,45,0.15)' }
    const text = { pending:'var(--yellow)', paid:'#6af', active:'var(--green)', completed:'#888', cancelled:'var(--red)' }
    return { display:'inline-block', background:colors[status]||'rgba(128,128,128,0.1)', color:text[status]||'#888', fontSize:'0.72rem', fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', padding:'4px 12px', borderRadius:'100px' }
  },
  planGrid: { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:'16px', marginBottom:'28px' },
  planCard: (active, color) => ({ borderRadius:'12px', padding:'24px', border: active ? `2px solid ${color}` : '1.5px solid var(--border)', background: active ? `${color}12` : 'var(--card)', cursor:'pointer', transition:'all 0.2s' }),
  planName: { fontFamily:'Syne', fontSize:'1.1rem', fontWeight:800, marginBottom:'4px' },
  planPrice: { fontFamily:'Bebas Neue', fontSize:'2rem', lineHeight:1, marginBottom:'8px' },
  planFeature: { fontSize:'0.8rem', color:'rgba(245,240,232,0.55)', padding:'3px 0', display:'flex', alignItems:'center', gap:'6px' },
  label: { display:'block', fontSize:'0.74rem', fontWeight:700, letterSpacing:'0.07em', textTransform:'uppercase', color:'rgba(245,240,232,0.45)', marginBottom:'7px' },
  input: { width:'100%', background:'rgba(245,240,232,0.04)', border:'1.5px solid rgba(245,240,232,0.09)', borderRadius:'8px', padding:'13px 15px', color:'var(--white)', fontSize:'0.93rem', outline:'none' },
  select: { width:'100%', background:'rgba(245,240,232,0.04)', border:'1.5px solid rgba(245,240,232,0.09)', borderRadius:'8px', padding:'13px 15px', color:'var(--white)', fontSize:'0.93rem', outline:'none', WebkitAppearance:'none' },
  uploadBox: { border:'2px dashed rgba(255,208,0,0.25)', borderRadius:'12px', padding:'40px', textAlign:'center', cursor:'pointer', transition:'all 0.2s', marginBottom:'18px' },
  btn: { background:'var(--yellow)', color:'var(--black)', fontFamily:'Syne', fontSize:'0.95rem', fontWeight:800, letterSpacing:'0.05em', padding:'14px 28px', border:'none', borderRadius:'8px', cursor:'pointer', display:'flex', alignItems:'center', gap:'8px' },
  emptyState: { textAlign:'center', padding:'60px 20px', color:'rgba(245,240,232,0.3)' },
  sectionTitle: { fontFamily:'Syne', fontWeight:800, fontSize:'1.1rem', marginBottom:'16px' },
}

function CampaignAnalytics({ campaign }) {
  const [proofs, setProofs] = useState([])
  const [assignedDrivers, setAssignedDrivers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchAnalytics() }, [campaign.id])

  async function fetchAnalytics() {
    const { data: jobs } = await supabase
      .from('driver_jobs')
      .select('id, status, driver_id')
      .eq('campaign_id', campaign.id)
      .neq('status', 'rejected')
    setAssignedDrivers(jobs || [])

    const jobIds = (jobs || []).map(j => j.id)
    if (jobIds.length > 0) {
      const { data: proofData } = await supabase
        .from('daily_proofs')
        .select('proof_date, status, driver_job_id')
        .in('driver_job_id', jobIds)
        .order('proof_date', { ascending: false })
      setProofs(proofData || [])
    } else {
      setProofs([])
    }
    setLoading(false)
  }

  const createdAt = new Date(campaign.created_at)
  const today = new Date()
  const daysActive = Math.floor((today - createdAt) / (1000 * 60 * 60 * 24))
  const daysRemaining = Math.max(0, 30 - daysActive)
  const approvedProofs = proofs.filter(p => p.status === 'approved')
  const pendingProofs = proofs.filter(p => p.status === 'pending')
  const activeDrivers = assignedDrivers.filter(d => d.status === 'active').length
  const totalDrivers = assignedDrivers.length

  const last14 = []
  for (let i = 13; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    const count = approvedProofs.filter(p => p.proof_date === dateStr).length
    last14.push({ date: dateStr, count, label: d.toLocaleDateString('en-IN', { day:'numeric', month:'short' }) })
  }
  const maxCount = Math.max(...last14.map(d => d.count), 1)

  if (loading) return <div style={{padding:'20px', color:'rgba(245,240,232,0.3)', textAlign:'center'}}>Loading analytics...</div>

  return (
    <div>
      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(140px, 1fr))', gap:'12px', marginBottom:'24px'}}>
        {[
          { num: daysActive, label: 'Days Active', color: 'var(--yellow)' },
          { num: daysRemaining, label: 'Days Left', color: 'var(--orange)' },
          { num: `${activeDrivers}/${totalDrivers}`, label: 'Active Drivers', color: 'var(--green)' },
          { num: approvedProofs.length, label: 'Days Ad Shown', color: '#6af' },
          { num: pendingProofs.length, label: 'Proofs Pending', color: 'rgba(245,240,232,0.5)' },
        ].map(stat => (
          <div key={stat.label} style={{background:'rgba(245,240,232,0.03)', border:'1px solid var(--border)', borderRadius:'10px', padding:'16px', textAlign:'center'}}>
            <div style={{fontFamily:'Bebas Neue', fontSize:'2rem', color:stat.color, lineHeight:1}}>{stat.num}</div>
            <div style={{fontSize:'0.72rem', color:'rgba(245,240,232,0.4)', textTransform:'uppercase', letterSpacing:'0.06em', marginTop:'4px'}}>{stat.label}</div>
          </div>
        ))}
      </div>

      <div style={{marginBottom:'24px'}}>
        <div style={{display:'flex', justifyContent:'space-between', fontSize:'0.78rem', color:'rgba(245,240,232,0.4)', marginBottom:'6px'}}>
          <span>Campaign Progress</span>
          <span>{Math.min(daysActive, 30)}/30 days</span>
        </div>
        <div style={{background:'rgba(245,240,232,0.06)', borderRadius:'100px', height:'8px', overflow:'hidden'}}>
          <div style={{width:`${Math.min((daysActive/30)*100, 100)}%`, height:'100%', background:'linear-gradient(90deg, var(--yellow), var(--orange))', borderRadius:'100px'}}/>
        </div>
      </div>

      <div style={{marginBottom:'24px'}}>
        <div style={{display:'flex', justifyContent:'space-between', fontSize:'0.78rem', color:'rgba(245,240,232,0.4)', marginBottom:'6px'}}>
          <span>Ad Shown Rate</span>
          <span style={{color:'var(--green)', fontWeight:700}}>{daysActive > 0 ? Math.round((approvedProofs.length / Math.max(daysActive * Math.max(totalDrivers,1), 1)) * 100) : 0}%</span>
        </div>
        <div style={{background:'rgba(245,240,232,0.06)', borderRadius:'100px', height:'8px', overflow:'hidden'}}>
          <div style={{width:`${daysActive > 0 ? Math.min((approvedProofs.length / Math.max(daysActive * Math.max(totalDrivers,1), 1)) * 100, 100) : 0}%`, height:'100%', background:'var(--green)', borderRadius:'100px'}}/>
        </div>
      </div>

      <div style={{marginBottom:'24px'}}>
        <div style={{fontSize:'0.78rem', fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:'rgba(245,240,232,0.4)', marginBottom:'12px'}}>Daily Activity — Last 14 Days</div>
        <div style={{display:'flex', alignItems:'flex-end', gap:'4px', height:'80px'}}>
          {last14.map(day => (
            <div key={day.date} style={{flex:1, display:'flex', flexDirection:'column', alignItems:'center', height:'100%', justifyContent:'flex-end'}}>
              <div title={`${day.label}: ${day.count} proof${day.count !== 1 ? 's' : ''}`} style={{width:'100%', height: day.count > 0 ? `${Math.max((day.count / maxCount) * 64, 8)}px` : '4px', background: day.count > 0 ? 'var(--green)' : 'rgba(245,240,232,0.06)', borderRadius:'3px 3px 0 0'}}/>
            </div>
          ))}
        </div>
        <div style={{display:'flex', justifyContent:'space-between', fontSize:'0.65rem', color:'rgba(245,240,232,0.25)', marginTop:'4px'}}>
          <span>{last14[0]?.label}</span><span>Today</span>
        </div>
      </div>

      {assignedDrivers.length > 0 && (
        <div>
          <div style={{fontSize:'0.78rem', fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:'rgba(245,240,232,0.4)', marginBottom:'10px'}}>Your Drivers</div>
          <div style={{display:'flex', flexDirection:'column', gap:'8px'}}>
            {assignedDrivers.map((d, i) => {
              const driverProofs = approvedProofs.filter(p => p.driver_job_id === d.id).length
              return (
                <div key={d.id} style={{display:'flex', justifyContent:'space-between', alignItems:'center', background:'rgba(245,240,232,0.03)', border:'1px solid var(--border)', borderRadius:'8px', padding:'12px 16px'}}>
                  <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                    <span style={{fontSize:'1.2rem'}}>🛺</span>
                    <div>
                      <div style={{fontSize:'0.88rem', fontWeight:600}}>Driver #{i + 1}</div>
                      <div style={{fontSize:'0.75rem', color:'rgba(245,240,232,0.4)'}}>Active on your campaign</div>
                    </div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div style={{fontSize:'0.82rem', fontWeight:700, color:'var(--green)'}}>{driverProofs} days shown</div>
                    <span style={s.badge(d.status)}>{d.status}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default function AdvertiserDashboard({ profile }) {
  const [tab, setTab] = useState('dashboard')
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [bannerFile, setBannerFile] = useState(null)
  const [bannerPreview, setBannerPreview] = useState(null)
  const [form, setForm] = useState({ company_name:'', city:'', area:'' })
  const [submitting, setSubmitting] = useState(false)
  const [analyticsFor, setAnalyticsFor] = useState(null)
  const [payingId, setPayingId] = useState(null)

  useEffect(() => { fetchCampaigns() }, [])

  async function fetchCampaigns() {
    const { data } = await supabase
      .from('campaigns')
      .select('*, plans(name, price, rickshaw_count)')
      .eq('advertiser_id', profile.id)
      .order('created_at', { ascending: false })
    setCampaigns(data || [])
    setLoading(false)
  }

  function loadRazorpay() {
    return new Promise(resolve => {
      if (window.Razorpay) { resolve(true); return }
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.onload = () => resolve(true)
      script.onerror = () => resolve(false)
      document.body.appendChild(script)
    })
  }

  async function handlePayment(campaign) {
    const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID
    if (!razorpayKey) {
      toast.error('Payment gateway not configured. Please contact support.')
      return
    }
    setPayingId(campaign.id)
    const loaded = await loadRazorpay()
    if (!loaded) {
      toast.error('Payment gateway failed to load. Please try again.')
      setPayingId(null)
      return
    }

    const options = {
      key: razorpayKey,
      amount: campaign.plans.price * 100,
      currency: 'INR',
      name: 'AdWheels',
      description: `${campaign.plans.name} Plan — ${campaign.city}`,
      handler: async function (response) {
        const { error } = await supabase
          .from('campaigns')
          .update({ status: 'paid', razorpay_payment_id: response.razorpay_payment_id })
          .eq('id', campaign.id)
        if (error) {
          toast.error(`Payment received (ID: ${response.razorpay_payment_id}) but campaign update failed. Please contact support.`)
          setPayingId(null)
          return
        }
        const { error: assignError } = await supabase.rpc('auto_assign_drivers', { campaign_id: campaign.id })
        if (assignError) {
          toast.error('Payment successful but driver assignment failed — our team will assign drivers shortly.')
        } else {
          toast.success('Payment successful! 🎉 Drivers are being assigned — go live in 90 min.')
        }
        fetchCampaigns()
        setTab('campaigns')
        setPayingId(null)
      },
      prefill: { name: profile.full_name, contact: profile.phone },
      theme: { color: '#FFD000' },
      modal: { ondismiss: () => setPayingId(null) },
    }

    const rzp = new window.Razorpay(options)
    rzp.on('payment.failed', function (response) {
      toast.error('Payment failed: ' + response.error.description)
      setPayingId(null)
    })
    rzp.open()
  }

  function handleBannerSelect(e) {
    const file = e.target.files[0]
    if (!file) return
    setBannerFile(file)
    setBannerPreview(URL.createObjectURL(file))
  }

  async function handleCreateCampaign() {
    if (!selectedPlan) return toast.error('Please select a plan')
    if (!form.company_name) return toast.error('Please enter your business name')
    if (!bannerFile) return toast.error('Please upload your banner')
    if (!form.city) return toast.error('Please select a city')
    if (!form.area) return toast.error('Please enter target area')
    setSubmitting(true)

    const fileName = `${profile.id}_${Date.now()}.${bannerFile.name.split('.').pop()}`
    const { error: uploadError } = await supabase.storage.from('banners').upload(fileName, bannerFile)
    if (uploadError) { toast.error('Banner upload failed: ' + uploadError.message); setSubmitting(false); return }

    const { data: { publicUrl } } = supabase.storage.from('banners').getPublicUrl(fileName)

    const { error } = await supabase.from('campaigns').insert({
      advertiser_id: profile.id,
      plan_id: selectedPlan.id,
      banner_url: publicUrl,
      city: form.city,
      area: form.area,
      company_name: form.company_name,
      status: 'pending',
    })

    if (error) { toast.error(error.message); setSubmitting(false); return }

    toast.success('Campaign created! 🎉 Complete payment to go live.')
    setTab('campaigns')
    fetchCampaigns()
    setSelectedPlan(null); setBannerFile(null); setBannerPreview(null)
    setForm({ company_name:'', city:'', area:'' })
    setSubmitting(false)
  }

  // Helper to show campaign name nicely
  function campaignTitle(c) {
    return c.company_name ? `${c.company_name} — ${c.plans?.name} Plan` : `${c.plans?.name} Plan`
  }

  const activeCampaigns = campaigns.filter(c => c.status === 'active').length
  const pendingCampaigns = campaigns.filter(c => c.status === 'pending').length

  return (
    <div style={s.app}>
      <nav style={s.nav}>
        <div style={s.logo}>AdWheels</div>
        <div style={s.navRight}>
          <span style={s.greeting}>👋 {profile.full_name}</span>
          <button style={s.logoutBtn} onClick={() => supabase.auth.signOut()}><LogOut size={14}/> Logout</button>
        </div>
      </nav>

      <div style={s.content}>
        <div style={s.pageTitle}>Advertiser Dashboard</div>
        <div style={s.pageSub}>Manage your campaigns and reach thousands daily 🚀</div>

        <div style={s.tabs}>
          {[
            { key:'dashboard', label:'Dashboard' },
            { key:'campaigns', label:'Campaigns' },
            { key:'analytics', label:'📊 Analytics' },
            { key:'new campaign', label:'+ New Campaign' },
          ].map(t => (
            <button key={t.key} style={s.tab(tab===t.key)} onClick={() => setTab(t.key)}>{t.label}</button>
          ))}
        </div>

        {/* ── DASHBOARD ── */}
        {tab === 'dashboard' && <>
          <div style={s.statsRow}>
            <div style={s.statCard}><div style={s.statNum}>{campaigns.length}</div><div style={s.statLabel}>Total Campaigns</div></div>
            <div style={s.statCard}><div style={{...s.statNum,color:'var(--green)'}}>{activeCampaigns}</div><div style={s.statLabel}>Active Right Now</div></div>
            <div style={s.statCard}><div style={{...s.statNum,color:'var(--yellow)'}}>{pendingCampaigns}</div><div style={s.statLabel}>Pending Payment</div></div>
            <div style={s.statCard}><div style={{...s.statNum,color:'var(--orange)'}}>90</div><div style={s.statLabel}>Min. to Go Live</div></div>
          </div>

          <div style={s.sectionTitle}>Recent Campaigns</div>
          {loading ? <div style={s.emptyState}>Loading...</div>
           : campaigns.length === 0
            ? <div style={s.emptyState}>
                <div style={{fontSize:'3rem',marginBottom:'12px'}}>📢</div>
                <div style={{fontFamily:'Syne',fontWeight:700,fontSize:'1.1rem',marginBottom:'8px'}}>No campaigns yet</div>
                <div style={{fontSize:'0.88rem',marginBottom:'20px'}}>Create your first campaign and go live in 90 minutes!</div>
                <button style={s.btn} onClick={() => setTab('new campaign')}><Plus size={16}/> Create Campaign</button>
              </div>
            : campaigns.slice(0,3).map(c => (
              <div key={c.id} style={s.card}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                  <div>
                    <div style={{fontFamily:'Syne',fontWeight:700,fontSize:'1rem',marginBottom:'6px'}}>{campaignTitle(c)}</div>
                    <div style={{fontSize:'0.82rem',color:'rgba(245,240,232,0.4)',marginBottom:'8px'}}>📍 {c.city} — {c.area}</div>
                    <span style={s.badge(c.status)}>{c.status}</span>
                  </div>
                  {c.banner_url && <img src={c.banner_url} alt="banner" style={{width:'80px',height:'50px',objectFit:'cover',borderRadius:'6px',border:'1px solid var(--border)'}}/>}
                </div>
              </div>
            ))
          }
        </>}

        {/* ── CAMPAIGNS ── */}
        {tab === 'campaigns' && <>
          <div style={s.sectionTitle}>All Campaigns</div>
          {loading ? <div style={s.emptyState}>Loading...</div>
           : campaigns.length === 0
            ? <div style={s.emptyState}><div style={{fontSize:'3rem',marginBottom:'12px'}}>📢</div><div>No campaigns yet</div></div>
            : campaigns.map(c => (
              <div key={c.id} style={s.card}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:'12px'}}>
                  <div style={{flex:1}}>
                    <div style={{fontFamily:'Syne',fontWeight:700,marginBottom:'4px'}}>{campaignTitle(c)}</div>
                    <div style={{fontSize:'0.82rem',color:'rgba(245,240,232,0.45)',marginBottom:'8px'}}>📍 {c.city} — {c.area}</div>
                    <div style={{display:'flex',gap:'8px',flexWrap:'wrap',alignItems:'center',marginBottom:'10px'}}>
                      <span style={s.badge(c.status)}>{c.status}</span>
                      <span style={{fontSize:'0.8rem',color:'rgba(245,240,232,0.35)'}}>₹{c.plans?.price?.toLocaleString()}/mo · {c.plans?.rickshaw_count} rickshaw{c.plans?.rickshaw_count>1?'s':''}</span>
                    </div>
                    {c.status === 'pending' && (
                      <div style={{padding:'12px',background:'rgba(255,208,0,0.08)',borderRadius:'8px',border:'1px solid rgba(255,208,0,0.2)'}}>
                        <div style={{fontSize:'0.82rem',color:'var(--yellow)',fontWeight:600,marginBottom:'10px'}}>
                          ⚠️ Payment pending — complete payment to go live in 90 minutes
                        </div>
                        <button
                          style={{background:'var(--yellow)',color:'var(--black)',fontFamily:'Syne',fontSize:'0.85rem',fontWeight:800,padding:'10px 20px',border:'none',borderRadius:'6px',cursor:'pointer',display:'inline-flex',alignItems:'center',gap:'6px'}}
                          onClick={() => handlePayment(c)}
                          disabled={payingId === c.id}
                        >
                          {payingId === c.id ? '⏳ Loading...' : `💳 Pay ₹${c.plans?.price?.toLocaleString()}`}
                        </button>
                      </div>
                    )}
                    {(c.status === 'active' || c.status === 'paid') && (
                      <button
                        style={{background:'rgba(0,230,118,0.1)',border:'1px solid rgba(0,230,118,0.2)',color:'var(--green)',fontFamily:'Syne',fontWeight:700,fontSize:'0.82rem',padding:'8px 14px',borderRadius:'6px',cursor:'pointer',display:'flex',alignItems:'center',gap:'6px'}}
                        onClick={() => { setAnalyticsFor(c.id); setTab('analytics') }}
                      >
                        <BarChart2 size={14}/> View Analytics
                      </button>
                    )}
                  </div>
                  {c.banner_url && <img src={c.banner_url} alt="banner" style={{width:'100px',height:'64px',objectFit:'cover',borderRadius:'8px',border:'1px solid var(--border)'}}/>}
                </div>
              </div>
            ))
          }
        </>}

        {/* ── ANALYTICS ── */}
        {tab === 'analytics' && <>
          <div style={s.sectionTitle}>Campaign Analytics</div>
          {campaigns.filter(c => c.status === 'active' || c.status === 'paid').length === 0
            ? <div style={s.emptyState}>
                <div style={{fontSize:'3rem',marginBottom:'12px'}}>📊</div>
                <div style={{fontFamily:'Syne',fontWeight:700,marginBottom:'8px'}}>No active campaigns</div>
                <div style={{fontSize:'0.88rem'}}>Analytics will appear once your campaign is live</div>
              </div>
            : <>
                {campaigns.filter(c => c.status === 'active' || c.status === 'paid').length > 1 && (
                  <div style={{marginBottom:'24px'}}>
                    <label style={s.label}>Select Campaign</label>
                    <select style={s.select} value={analyticsFor || ''} onChange={e => setAnalyticsFor(e.target.value)}>
                      {campaigns.filter(c => c.status === 'active' || c.status === 'paid').map(c => (
                        <option key={c.id} value={c.id}>{campaignTitle(c)} — {c.city} — {c.area}</option>
                      ))}
                    </select>
                  </div>
                )}
                {(() => {
                  const activeCampaign = campaigns.find(c => c.id === analyticsFor) || campaigns.find(c => c.status === 'active' || c.status === 'paid')
                  if (!activeCampaign) return null
                  return (
                    <div style={s.card}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px',flexWrap:'wrap',gap:'12px'}}>
                        <div>
                          <div style={{fontFamily:'Syne',fontWeight:800,fontSize:'1.1rem'}}>{campaignTitle(activeCampaign)}</div>
                          <div style={{fontSize:'0.82rem',color:'rgba(245,240,232,0.45)',marginTop:'2px'}}>📍 {activeCampaign.city} — {activeCampaign.area}</div>
                        </div>
                        <div style={{display:'flex',gap:'8px',alignItems:'center'}}>
                          <span style={s.badge(activeCampaign.status)}>{activeCampaign.status}</span>
                          <span style={{fontFamily:'Bebas Neue',fontSize:'1.4rem',color:'var(--yellow)'}}>₹{activeCampaign.plans?.price?.toLocaleString()}/mo</span>
                        </div>
                      </div>
                      <CampaignAnalytics campaign={activeCampaign} />
                    </div>
                  )
                })()}
              </>
          }
        </>}

        {/* ── NEW CAMPAIGN ── */}
        {tab === 'new campaign' && <>
          <div style={s.sectionTitle}>Step 1 — Choose Your Plan</div>
          <div style={s.planGrid}>
            {PLANS.map(plan => (
              <div key={plan.id} style={s.planCard(selectedPlan?.id===plan.id, plan.color)} onClick={() => setSelectedPlan(plan)}>
                <div style={{...s.planName, color: selectedPlan?.id===plan.id ? plan.color : 'var(--white)'}}>{plan.name}</div>
                <div style={{...s.planPrice, color: plan.color}}>₹{plan.price.toLocaleString()}<span style={{fontFamily:'DM Sans',fontSize:'0.85rem',color:'rgba(245,240,232,0.4)'}}>/mo</span></div>
                <div style={{fontSize:'0.78rem',color:'rgba(245,240,232,0.4)',marginBottom:'12px'}}>{plan.rickshaws} rickshaw{plan.rickshaws>1?'s':''} · Live in 90 minutes</div>
                {plan.features.map(f => <div key={f} style={s.planFeature}><span style={{color:'var(--green)'}}>✓</span>{f}</div>)}
              </div>
            ))}
          </div>

          <div style={{...s.sectionTitle, marginTop:'28px'}}>Step 2 — Business Details</div>
          <div style={{marginBottom:'18px'}}>
            <label style={s.label}>Business / Brand Name *</label>
            <input style={s.input} placeholder="e.g. Sharma Electronics, Café Coffee Day..." value={form.company_name} onChange={e => setForm(f=>({...f,company_name:e.target.value}))}/>
          </div>

          <div style={{...s.sectionTitle, marginTop:'28px'}}>Step 3 — Upload Your Banner</div>
          <label htmlFor="bannerInput">
            <div style={{...s.uploadBox, borderColor: bannerPreview ? 'var(--yellow)' : 'rgba(255,208,0,0.25)'}}>
              {bannerPreview
                ? <img src={bannerPreview} alt="preview" style={{maxHeight:'160px',maxWidth:'100%',borderRadius:'6px'}}/>
                : <><div style={{fontSize:'2.5rem',marginBottom:'8px'}}>🖼️</div><div style={{fontFamily:'Syne',fontWeight:700,marginBottom:'4px'}}>Click to upload banner</div><div style={{fontSize:'0.8rem',color:'rgba(245,240,232,0.4)'}}>PNG, JPG, WEBP · Max 5MB</div></>
              }
            </div>
          </label>
          <input id="bannerInput" type="file" accept="image/*" style={{display:'none'}} onChange={handleBannerSelect}/>

          <div style={{...s.sectionTitle, marginTop:'28px'}}>Step 4 — Target Location</div>
          <div style={{marginBottom:'18px'}}>
            <label style={s.label}>City *</label>
            <select style={s.select} value={form.city} onChange={e => setForm(f=>({...f,city:e.target.value}))}>
              <option value="">Select city</option>
              <option value="indore">Indore</option>
              <option value="bhopal">Bhopal</option>
              <option value="both">Both Cities</option>
            </select>
          </div>
          <div style={{marginBottom:'18px'}}>
            <label style={s.label}>Target Area / Colony *</label>
            <input style={s.input} placeholder="e.g. Vijay Nagar, MG Road, Palasia..." value={form.area} onChange={e => setForm(f=>({...f,area:e.target.value}))}/>
          </div>

          <div style={{padding:'16px',background:'rgba(0,230,118,0.06)',border:'1px solid rgba(0,230,118,0.15)',borderRadius:'10px',fontSize:'0.85rem',color:'rgba(245,240,232,0.6)',marginBottom:'24px'}}>
            💡 After submitting, our team will assign drivers and your ad can be live within 90 minutes.
          </div>

          <button style={s.btn} onClick={handleCreateCampaign} disabled={submitting}>
            {submitting ? 'Creating...' : <><Plus size={16}/> Create Campaign</>}
          </button>
        </>}
      </div>
    </div>
  )
}