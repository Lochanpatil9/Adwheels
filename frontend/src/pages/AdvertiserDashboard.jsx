import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { LogOut, Upload, ChevronRight, RefreshCw, CheckCircle } from 'lucide-react'
import { createRazorpayOrder, verifyPayment, cancelCampaign, getCampaignStats, sendNotification } from '../lib/api'
import NotificationBell from '../components/NotificationBell'

const card = { background: '#fff', border: '1px solid #E8E8E8', borderRadius: '16px', padding: '20px', marginBottom: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }
const btn = (bg = '#FFBF00', col = '#111') => ({ background: bg, color: col, border: 'none', borderRadius: '12px', padding: '14px 20px', fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all .18s' })
const badge = (s) => {
  const m = { pending: ['#FFF8E6', '#7A5900'], paid: ['#EFF6FF', '#1565C0'], active: ['#E6F9EE', '#0A6B30'], completed: ['#F5F5F5', '#666'], cancelled: ['#FDECEA', '#C62828'] }
  const [bg, c] = m[s] || ['#F5F5F5', '#666']
  return { display: 'inline-block', background: bg, color: c, fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '4px 10px', borderRadius: '100px' }
}

/* ═══════════ Status Timeline ═══════════ */
function StatusTimeline({ status }) {
  const steps = ['pending', 'paid', 'active', 'completed']
  const idx = steps.indexOf(status)
  const labels = { pending: 'Created', paid: 'Paid', active: 'Live', completed: 'Done' }
  if (status === 'cancelled') return <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#FDECEA', color: '#C62828', padding: '8px 14px', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 700, border: '1px solid #FFAAAA' }}>✖ Cancelled</div>
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
      {steps.map((step, i) => {
        const isDone = i <= idx, isCurr = i === idx
        return (
          <div key={step} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <div style={{
                width: isCurr ? '28px' : '22px', height: isCurr ? '28px' : '22px', borderRadius: '50%',
                background: isDone ? '#1DB954' : '#E8E8E8',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all .2s',
                boxShadow: isCurr ? '0 0 0 4px rgba(29,185,84,.2)' : 'none'
              }}>
                {isDone ? <CheckCircle size={isCurr ? 16 : 12} color="#fff" /> : <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#bbb' }} />}
              </div>
              <div style={{ fontSize: '0.6rem', fontWeight: 700, color: isDone ? '#0A6B30' : '#bbb', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{labels[step]}</div>
            </div>
            {i < steps.length - 1 && (
              <div style={{ width: '24px', height: '2px', background: i < idx ? '#1DB954' : '#ddd', margin: '0 2px', marginBottom: '16px' }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ═══════════ Campaign Creation Stepper ═══════════ */
function CreateCampaignStepper({ profile, plans, onDone }) {
  const [step, setStep] = useState(1)
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [city, setCity] = useState(profile.city || 'indore')
  const [area, setArea] = useState('')
  const [bannerFile, setBannerFile] = useState(null)
  const [bannerPreview, setBannerPreview] = useState(null)
  const [loading, setLoading] = useState(false)

  function handleBannerSelect(e) {
    const file = e.target.files[0]; if (!file) return
    if (bannerPreview) URL.revokeObjectURL(bannerPreview)
    setBannerFile(file); setBannerPreview(URL.createObjectURL(file))
  }

  async function handleSubmit() {
    if (!selectedPlan) return toast.error('Select a plan')
    if (!area) return toast.error('Fill in the area')
    if (!bannerFile) return toast.error('Upload your banner')
    setLoading(true)
    const ext = bannerFile.name.split('.').pop()
    const fileName = `banner_${profile.id}_${Date.now()}.${ext}`
    const { error: upErr } = await supabase.storage.from('banners').upload(fileName, bannerFile, { upsert: true })
    if (upErr) { toast.error('Upload failed'); setLoading(false); return }
    const { data: { publicUrl } } = supabase.storage.from('banners').getPublicUrl(fileName)

    const { error, data: created } = await supabase.from('campaigns').insert({
      advertiser_id: profile.id, plan_id: selectedPlan.id, city, area,
      banner_url: publicUrl, company_name: area, status: 'pending'
    }).select('*, plans(name,price)').single()
    if (error) { toast.error(error.message); setLoading(false); return }
    toast.success('Campaign created! 🎉 Proceed to payment.')
    onDone(created)
    setLoading(false)
  }

  const STEPS = ['Choose Plan', 'Details', 'Banner', 'Confirm']

  return (
    <div style={card}>
      {/* Stepper indicator */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0', marginBottom: '28px' }}>
        {STEPS.map((s, i) => (
          <div key={s} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%',
                background: i + 1 <= step ? '#FFBF00' : '#F0F0F0',
                color: i + 1 <= step ? '#111' : '#bbb',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: '0.82rem',
                boxShadow: i + 1 === step ? '0 0 0 4px rgba(255,191,0,.2)' : 'none',
                transition: 'all .2s'
              }}>
                {i + 1 < step ? '✓' : i + 1}
              </div>
              <div style={{ fontSize: '0.6rem', fontWeight: 700, color: i + 1 <= step ? '#D49800' : '#bbb', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{s}</div>
            </div>
            {i < STEPS.length - 1 && <div style={{ width: '28px', height: '2px', background: i + 1 < step ? '#FFBF00' : '#E8E8E8', margin: '0 4px', marginBottom: '16px' }} />}
          </div>
        ))}
      </div>

      {/* Step 1: Choose Plan */}
      {step === 1 && (
        <div>
          <div style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '16px', textAlign: 'center' }}>Select Your Plan</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '12px' }}>
            {plans.map(p => {
              const isSelected = selectedPlan?.id === p.id
              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedPlan(p)}
                  style={{
                    border: isSelected ? '2px solid #FFBF00' : '1.5px solid #E8E8E8',
                    borderRadius: '14px',
                    padding: '20px',
                    cursor: 'pointer',
                    background: isSelected ? '#FFF8E6' : '#fff',
                    transition: 'all .2s',
                    textAlign: 'center',
                    transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                    boxShadow: isSelected ? '0 4px 16px rgba(255,191,0,.2)' : '0 2px 8px rgba(0,0,0,.04)'
                  }}
                >
                  {p.is_urgent && <div style={{ background: '#FDECEA', color: '#C62828', fontSize: '0.65rem', fontWeight: 800, padding: '3px 8px', borderRadius: '6px', display: 'inline-block', marginBottom: '8px' }}>⚡ URGENT</div>}
                  <div style={{ fontFamily: 'Bebas Neue,sans-serif', fontSize: '1.5rem', color: '#111', marginBottom: '2px' }}>{p.name}</div>
                  <div style={{ fontFamily: 'Bebas Neue,sans-serif', fontSize: '2rem', color: '#D49800', lineHeight: 1, marginBottom: '8px' }}>₹{p.price.toLocaleString()}<span style={{ fontSize: '0.8rem', color: '#888' }}>/mo</span></div>
                  <div style={{ fontSize: '0.82rem', color: '#666', lineHeight: 1.6 }}>
                    {p.rickshaw_count} rickshaw{p.rickshaw_count > 1 ? 's' : ''}<br />
                    ≈₹{Math.round(p.price / 30).toLocaleString()}/day
                  </div>
                  {isSelected && <div style={{ marginTop: '10px', color: '#D49800', fontWeight: 800, fontSize: '0.85rem' }}>✓ Selected</div>}
                </div>
              )
            })}
          </div>
          <button
            className="action-btn"
            onClick={() => { if (!selectedPlan) return toast.error('Pick a plan'); setStep(2) }}
            style={{ ...btn('#FFBF00', '#111'), width: '100%', justifyContent: 'center', marginTop: '20px' }}
          >
            Continue <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Step 2: Details */}
      {step === 2 && (
        <div>
          <div style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '16px' }}>Campaign Details</div>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#888', marginBottom: '6px' }}>City</label>
          <select value={city} onChange={e => setCity(e.target.value)} style={{ width: '100%', padding: '14px 15px', fontSize: '0.95rem', border: '1.5px solid #D8D8D8', borderRadius: '12px', background: '#fff', color: '#111', outline: 'none', fontFamily: 'inherit', marginBottom: '14px', cursor: 'pointer' }}>
            <option value="indore">Indore</option><option value="bhopal">Bhopal</option><option value="both">Both Cities</option>
          </select>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#888', marginBottom: '6px' }}>Target Area / Business Name</label>
          <input type="text" placeholder="e.g. Vijay Nagar, Subway Franchise…" value={area} onChange={e => setArea(e.target.value)} style={{ width: '100%', padding: '14px 15px', fontSize: '0.95rem', border: '1.5px solid #D8D8D8', borderRadius: '12px', background: '#fff', color: '#111', outline: 'none', fontFamily: 'inherit', marginBottom: '14px' }} />
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="action-btn" onClick={() => setStep(1)} style={{ ...btn('#F5F5F5', '#666'), flex: 1, justifyContent: 'center' }}>← Back</button>
            <button className="action-btn" onClick={() => { if (!area) return toast.error('Fill area'); setStep(3) }} style={{ ...btn('#FFBF00', '#111'), flex: 2, justifyContent: 'center' }}>Continue <ChevronRight size={16} /></button>
          </div>
        </div>
      )}

      {/* Step 3: Banner */}
      {step === 3 && (
        <div>
          <div style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '6px' }}>Upload Banner</div>
          <div style={{ fontSize: '0.84rem', color: '#888', marginBottom: '16px' }}>This ad image will be printed and placed on the rickshaw</div>
          <label htmlFor="bannerInput" style={{ cursor: 'pointer', display: 'block' }}>
            <div style={{ border: '2px dashed #FFBF00', borderRadius: '14px', padding: '36px 20px', textAlign: 'center', background: '#FFF8E6', transition: 'background .2s' }}>
              {bannerPreview
                ? <img src={bannerPreview} alt="preview" style={{ maxHeight: '140px', maxWidth: '100%', borderRadius: '8px' }} />
                : <>
                  <Upload size={40} style={{ color: '#D49800', marginBottom: '12px' }} />
                  <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '6px' }}>Tap to upload banner image</div>
                  <div style={{ fontSize: '0.82rem', color: '#888' }}>PNG, JPG — landscape recommended</div>
                </>
              }
            </div>
          </label>
          <input id="bannerInput" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleBannerSelect} />
          <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
            <button className="action-btn" onClick={() => setStep(2)} style={{ ...btn('#F5F5F5', '#666'), flex: 1, justifyContent: 'center' }}>← Back</button>
            <button className="action-btn" onClick={() => { if (!bannerFile) return toast.error('Upload banner'); setStep(4) }} style={{ ...btn('#FFBF00', '#111'), flex: 2, justifyContent: 'center' }}>Continue <ChevronRight size={16} /></button>
          </div>
        </div>
      )}

      {/* Step 4: Confirm */}
      {step === 4 && (
        <div>
          <div style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '14px', textAlign: 'center' }}>Confirm & Create</div>
          <div style={{ background: '#F8F8F8', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
            <div style={{ display: 'grid', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#888' }}>Plan</span><span style={{ fontWeight: 700 }}>{selectedPlan?.name}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#888' }}>City</span><span style={{ fontWeight: 700 }}>{city}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#888' }}>Area</span><span style={{ fontWeight: 700 }}>{area}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#888' }}>Price</span><span style={{ fontWeight: 800, color: '#D49800', fontSize: '1.1rem' }}>₹{selectedPlan?.price.toLocaleString()}/mo</span></div>
              {bannerPreview && <img src={bannerPreview} alt="banner" style={{ maxHeight: '80px', objectFit: 'contain', borderRadius: '8px', marginTop: '8px' }} />}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="action-btn" onClick={() => setStep(3)} style={{ ...btn('#F5F5F5', '#666'), flex: 1, justifyContent: 'center' }}>← Back</button>
            <button className="action-btn" onClick={handleSubmit} disabled={loading} style={{ ...btn('#1DB954', '#fff'), flex: 2, justifyContent: 'center', opacity: loading ? .6 : 1 }}>
              {loading ? 'Creating…' : '✅ Create Campaign'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AdvertiserDashboard({ profile }) {
  const { signOut } = useAuth()
  const [tab, setTab] = useState('home')
  const [campaigns, setCampaigns] = useState([])
  const [plans, setPlans] = useState([])
  const [creating, setCreating] = useState(false)
  const [stats, setStats] = useState(null)
  const [selectedCampaign, setSelectedCampaign] = useState(null)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => { fetchAll() }, [])
  async function fetchAll() { await fetchCampaigns(); await fetchPlans() }
  async function handleRefresh() { setRefreshing(true); await fetchAll(); setTimeout(() => setRefreshing(false), 600); toast.success('Data refreshed') }

  async function fetchCampaigns() {
    const { data } = await supabase.from('campaigns').select('*, plans(name,price,rickshaw_count,driver_payout)').eq('advertiser_id', profile.id).order('created_at', { ascending: false })
    setCampaigns(data || [])
  }
  async function fetchPlans() {
    const { data } = await supabase.from('plans').select('*').eq('is_active', true).order('price', { ascending: true })
    setPlans(data || [])
  }

  async function handlePayment(campaign) {
    try {
      const order = await createRazorpayOrder(campaign.id, campaign.plans?.price || 0)
      const opts = {
        key: import.meta.env.VITE_RAZORPAY_KEY,
        amount: order.amount, currency: 'INR', order_id: order.orderId,
        name: 'AdWheels', description: `Campaign: ${campaign.plans?.name}`,
        handler: async (response) => {
          try {
            await verifyPayment({ campaignId: campaign.id, razorpay_order_id: response.razorpay_order_id, razorpay_payment_id: response.razorpay_payment_id, razorpay_signature: response.razorpay_signature })
            toast.success('Payment verified! ✅ Your campaign is now paid.')
            fetchCampaigns()
          } catch { toast.error('Payment verification failed. Contact support.') }
        },
        prefill: { name: profile.full_name, contact: profile.phone },
        theme: { color: '#FFBF00' }
      }
      new window.Razorpay(opts).open()
    } catch { toast.error('Payment init failed. Try again.') }
  }

  async function handleCancel(campaignId) {
    if (!window.confirm('Cancel this campaign? This action cannot be undone.')) return
    try { await cancelCampaign(campaignId); toast.success('Campaign cancelled'); fetchCampaigns() }
    catch (err) { toast.error(err.message) }
  }

  async function loadStats(campaign) {
    setSelectedCampaign(campaign); setStats(null); setTab('stats')
    try {
      const s = await getCampaignStats(campaign.id)
      setStats(s)
    } catch { setStats({ drivers: 0, proofs: [], totalProofs: 0, approvedProofs: 0 }) }
  }

  const activeCampaigns = campaigns.filter(c => c.status === 'active').length
  const totalSpend = campaigns.filter(c => !['pending', 'cancelled'].includes(c.status)).reduce((s, c) => s + (c.plans?.price || 0), 0)
  const totalRickshaws = campaigns.filter(c => c.status === 'active').reduce((s, c) => s + (c.plans?.rickshaw_count || 0), 0)

  const TABS = [
    { key: 'home', icon: '🏠', label: 'Home' },
    { key: 'campaigns', icon: '📢', label: `Campaigns (${campaigns.length})` },
    { key: 'create', icon: '➕', label: 'New Ad' },
    { key: 'stats', icon: '📊', label: 'Stats' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#F5F5F5', color: '#111', fontFamily: "'DM Sans',sans-serif" }} className="mobile-padded">

      {/* NAV */}
      <div style={{ background: '#fff', borderBottom: '1px solid #EBEBEB', padding: '0 18px', height: '58px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ fontFamily: 'Bebas Neue,sans-serif', fontSize: '1.7rem', color: '#FFBF00', letterSpacing: '0.05em' }}>AdWheels</div>
          <span style={{ background: '#FFF0EB', color: '#8B2500', border: '1px solid #FFBDA3', fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '3px 9px', borderRadius: '100px' }}>Advertiser</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button onClick={handleRefresh} style={{ background: 'none', border: '1.5px solid #E8E8E8', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#888' }} title="Refresh data">
            <RefreshCw size={14} className={refreshing ? 'refresh-spin' : ''} />
          </button>
          <NotificationBell userId={profile.id} />
          <span style={{ fontSize: '0.84rem', color: '#666' }}>💼 {profile.full_name}</span>
          <button onClick={signOut} style={{ background: 'none', border: '1.5px solid #E8E8E8', borderRadius: '8px', padding: '6px 12px', fontSize: '0.82rem', color: '#888', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <LogOut size={13} /> Logout
          </button>
        </div>
      </div>

      {/* TOP TABS */}
      <div className="hide-on-mobile-nav" style={{ background: '#fff', borderBottom: '1px solid #EBEBEB', display: 'flex', overflowX: 'auto', scrollbarWidth: 'none', padding: '0 6px' }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{ padding: '13px 14px', border: 'none', background: 'none', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', color: tab === t.key ? '#D49800' : '#999', borderBottom: tab === t.key ? '2.5px solid #FFBF00' : '2.5px solid transparent', flexShrink: 0, transition: 'all .18s' }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* MOBILE BOTTOM NAV */}
      <div className="bottom-nav">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`bottom-nav-item${tab === t.key ? ' bottom-nav-item--active' : ''}`}>
            <span className="nav-icon">{t.icon}</span>
            <span className="nav-label" style={{ color: tab === t.key ? '#D49800' : '#999' }}>{t.label}</span>
          </button>
        ))}
      </div>

      <div style={{ padding: '16px', maxWidth: '720px', margin: '0 auto' }}>

        {/* ── HOME ── */}
        {tab === 'home' && <div className="tab-content">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: '12px', marginBottom: '14px' }}>
            <div style={card}>
              <div style={{ fontFamily: 'Bebas Neue,sans-serif', fontSize: '2rem', color: '#D49800', lineHeight: 1 }}>{activeCampaigns}</div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '4px' }}>Active Campaigns</div>
            </div>
            <div style={card}>
              <div style={{ fontFamily: 'Bebas Neue,sans-serif', fontSize: '2rem', color: '#1DB954', lineHeight: 1 }}>{totalRickshaws}</div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '4px' }}>Rickshaws</div>
            </div>
            <div style={card}>
              <div style={{ fontFamily: 'Bebas Neue,sans-serif', fontSize: '2rem', color: '#1565C0', lineHeight: 1 }}>₹{totalSpend.toLocaleString()}</div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '4px' }}>Total Invested</div>
            </div>
          </div>

          {/* Quick action */}
          <div onClick={() => setTab('create')} style={{ background: 'linear-gradient(135deg,#FFBF00,#FF8C00)', borderRadius: '14px', padding: '20px', marginBottom: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#111', transition: 'transform .15s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.01)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>Start a New Campaign 🚀</div>
              <div style={{ fontSize: '0.85rem', opacity: 0.7, marginTop: '3px' }}>Get your ad on the road in hours</div>
            </div>
            <span style={{ fontSize: '1.4rem' }}>→</span>
          </div>

          {/* Recent campaigns */}
          {campaigns.slice(0, 4).map(c => {
            const daysActive = c.activated_at ? Math.floor((Date.now() - new Date(c.activated_at).getTime()) / 86400000) : 0
            const daysLeft = c.activated_at && c.status === 'active' ? Math.max(0, 30 - daysActive) : null
            return (
              <div key={c.id} style={card} onClick={() => loadStats(c)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '3px' }}>{c.plans?.name}</div>
                    <div style={{ fontSize: '0.82rem', color: '#888', marginBottom: '10px' }}>📍 {c.city} — {c.area}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <StatusTimeline status={c.status} />
                      {daysLeft !== null && <span style={{ fontSize: '0.75rem', color: '#D49800', fontWeight: 700, marginLeft: '4px' }}>⏰ {daysLeft}d left</span>}
                    </div>
                  </div>
                  {c.banner_url && <img src={c.banner_url} alt="banner" style={{ width: '60px', height: '40px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #E8E8E8', flexShrink: 0 }} />}
                </div>
              </div>
            )
          })}
        </div>}

        {/* ── CAMPAIGNS ── */}
        {tab === 'campaigns' && <div className="tab-content">
          {campaigns.length === 0
            ? <div style={{ textAlign: 'center', padding: '48px 16px', color: '#bbb' }}>
              <div style={{ fontSize: '3rem', marginBottom: '10px' }}>📢</div>
              <div style={{ fontWeight: 700, color: '#999', fontSize: '1rem', marginBottom: '8px' }}>No campaigns yet</div>
              <button className="action-btn" onClick={() => setTab('create')} style={{ ...btn('#FFBF00', '#111'), margin: '0 auto' }}>+ Create Your First Ad</button>
            </div>
            : campaigns.map(c => (
              <div key={c.id} style={card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '3px' }}>{c.plans?.name}</div>
                    <div style={{ fontSize: '0.82rem', color: '#888', marginBottom: '3px' }}>📍 {c.city} — {c.area}</div>
                    <div style={{ fontSize: '0.82rem', color: '#888', marginBottom: '10px' }}>₹{c.plans?.price?.toLocaleString()}/mo · {c.plans?.rickshaw_count} rickshaw{c.plans?.rickshaw_count > 1 ? 's' : ''}</div>
                    <StatusTimeline status={c.status} />
                  </div>
                  {c.banner_url && <img src={c.banner_url} alt="banner" style={{ width: '80px', height: '55px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #E8E8E8', flexShrink: 0 }} />}
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '14px', flexWrap: 'wrap' }}>
                  {c.status === 'pending' && <button className="action-btn" onClick={() => handlePayment(c)} style={btn('#1DB954', '#fff')}>💳 Pay ₹{c.plans?.price?.toLocaleString()}</button>}
                  {c.status === 'active' && <button className="action-btn" onClick={() => loadStats(c)} style={btn('#FFBF00', '#111')}>📊 View Stats</button>}
                  {!['completed', 'cancelled'].includes(c.status) && <button className="action-btn" onClick={() => handleCancel(c.id)} style={{ background: '#FDECEA', color: '#C62828', border: '1px solid #FFAAAA', borderRadius: '10px', padding: '10px 16px', fontWeight: 700, fontSize: '0.84rem', cursor: 'pointer' }}>Cancel</button>}
                </div>
              </div>
            ))
          }
        </div>}

        {/* ── CREATE ── */}
        {tab === 'create' && <div className="tab-content">
          <div style={{ fontWeight: 800, fontSize: '1.15rem', marginBottom: '16px', textAlign: 'center' }}>🚀 Create New Campaign</div>
          <CreateCampaignStepper
            profile={profile}
            plans={plans}
            onDone={(created) => {
              setCreating(false)
              fetchCampaigns()
              setTab('campaigns')
            }}
          />
        </div>}

        {/* ── STATS — Enhanced Campaign Dashboard ── */}
        {tab === 'stats' && <div className="tab-content">
          {!selectedCampaign
            ? <div style={{ textAlign: 'center', padding: '48px 16px', color: '#bbb' }}>
              <div style={{ fontSize: '3rem', marginBottom: '10px' }}>📊</div>
              <div style={{ fontWeight: 700, color: '#999', marginBottom: '10px' }}>Select a campaign to view stats</div>
              {campaigns.filter(c => ['active','paid','completed'].includes(c.status)).map(c => (
                <button key={c.id} className="action-btn" onClick={() => loadStats(c)} style={{ ...btn('#FFBF00', '#111'), marginBottom: '8px', width: '100%', justifyContent: 'space-between' }}>
                  <span>{c.plans?.name} — {c.city} <span style={badge(c.status)}>{c.status}</span></span>
                  <ChevronRight size={16} />
                </button>
              ))}
            </div>
            : <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <button onClick={() => { setSelectedCampaign(null); setStats(null) }} style={{ background: '#F5F5F5', border: '1px solid #E8E8E8', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontWeight: 600, fontSize: '0.84rem', color: '#666' }}>← Back</button>
                <div style={{ fontWeight: 800, fontSize: '1rem' }}>{selectedCampaign.plans?.name} — {selectedCampaign.city}</div>
              </div>
              {selectedCampaign.banner_url && (
                <img src={selectedCampaign.banner_url} alt="banner" style={{ width: '100%', maxHeight: '160px', objectFit: 'cover', borderRadius: '12px', marginBottom: '14px', border: '1px solid #E8E8E8' }} />
              )}
              <StatusTimeline status={selectedCampaign.status} />

              {/* Campaign Progress Bar */}
              {selectedCampaign.activated_at && (() => {
                const daysActive = Math.floor((Date.now() - new Date(selectedCampaign.activated_at).getTime()) / 86400000)
                const daysLeft = Math.max(0, 30 - daysActive)
                const progress = Math.min(100, Math.round(daysActive / 30 * 100))
                return (
                  <div style={{ ...card, marginTop: '14px', padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>📅 Campaign Progress</span>
                      <span style={{ fontFamily: 'Bebas Neue,sans-serif', fontSize: '1.2rem', color: daysLeft <= 5 ? '#E53935' : '#D49800' }}>{daysLeft} days left</span>
                    </div>
                    <div style={{ height: '8px', borderRadius: '6px', background: '#F0F0F0', overflow: 'hidden', marginBottom: '8px' }}>
                      <div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(90deg,#FFBF00,#FF8C00)', borderRadius: '6px', transition: 'width .5s' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#aaa' }}>
                      <span>Day {daysActive} of 30</span>
                      <span>{progress}% complete</span>
                    </div>
                  </div>
                )
              })()}

              {!stats
                ? <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>Loading stats…</div>
                : <>
                  {/* Enhanced stat cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(100px,1fr))', gap: '10px', marginTop: '16px', marginBottom: '14px' }}>
                    {[
                      { n: stats.drivers || 0, l: 'Drivers', c: '#1565C0', icon: '🛺' },
                      { n: stats.totalProofs || 0, l: 'Total Proofs', c: '#D49800', icon: '📸' },
                      { n: stats.approvedProofs || 0, l: 'Approved', c: '#1DB954', icon: '✅' },
                      { n: `${stats.totalProofs && stats.approvedProofs ? Math.round((stats.approvedProofs / stats.totalProofs) * 100) : 0}%`, l: 'Rate', c: '#666', icon: '📊' },
                      { n: ((selectedCampaign.plans?.rickshaw_count || 1) * 200).toLocaleString(), l: 'Est. Daily Views', c: '#a855f7', icon: '👀' },
                      { n: `₹${Math.round((selectedCampaign.plans?.price || 0) / 30)}`, l: 'Cost/Day', c: '#FF8C00', icon: '💸' },
                    ].map(x => (
                      <div key={x.l} style={{ ...card, padding: '14px', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', top: '8px', right: '10px', fontSize: '1.1rem', opacity: 0.12 }}>{x.icon}</div>
                        <div style={{ fontFamily: 'Bebas Neue,sans-serif', fontSize: '1.5rem', color: x.c, lineHeight: 1 }}>{x.n}</div>
                        <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '4px' }}>{x.l}</div>
                      </div>
                    ))}
                  </div>

                  {/* Proof Approval Progress Ring */}
                  {stats.totalProofs > 0 && (
                    <div style={{ ...card, padding: '20px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                      {(() => {
                        const pct = Math.round((stats.approvedProofs / stats.totalProofs) * 100)
                        const r = 36, c = 2 * Math.PI * r
                        return <svg width="90" height="90" viewBox="0 0 90 90" style={{ flexShrink: 0 }}>
                          <circle cx="45" cy="45" r={r} fill="none" stroke="#F0F0F0" strokeWidth="8" />
                          <circle cx="45" cy="45" r={r} fill="none" stroke="#1DB954" strokeWidth="8" strokeDasharray={`${pct / 100 * c} ${c}`} strokeLinecap="round" transform="rotate(-90 45 45)" style={{ transition: 'stroke-dasharray .5s' }} />
                          <text x="45" y="43" textAnchor="middle" fontSize="16" fontWeight="800" fontFamily="Bebas Neue" fill="#1DB954">{pct}%</text>
                          <text x="45" y="56" textAnchor="middle" fontSize="7" fontWeight="700" fill="#888">APPROVED</text>
                        </svg>
                      })()}
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.92rem', marginBottom: '6px' }}>Proof Approval Status</div>
                        <div style={{ fontSize: '0.82rem', color: '#888', lineHeight: 1.6 }}>
                          ✅ {stats.approvedProofs} approved<br />
                          ⏳ {(stats.totalProofs || 0) - (stats.approvedProofs || 0)} pending/rejected<br />
                          📸 {stats.totalProofs} total submissions
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Proof Photo Gallery */}
                  {stats.proofs && stats.proofs.length > 0 && (
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.95rem', marginBottom: '12px' }}>📸 Proof Photos</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: '10px' }}>
                        {stats.proofs.slice(0, 15).map((p, i) => (
                          <div key={i} style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '1px solid #E8E8E8', aspectRatio: '4/3' }}>
                            <img src={p.photo_url} alt="proof" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent,rgba(0,0,0,.7))', padding: '6px 8px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={badge(p.status)}>{p.status}</span>
                                <span style={{ fontSize: '0.6rem', color: '#ddd', fontWeight: 600 }}>{p.proof_date || ''}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              }
            </div>
          }
        </div>}

      </div>
    </div>
  )
}
