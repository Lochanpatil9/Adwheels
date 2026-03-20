import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { LogOut, Plus, BarChart2 } from 'lucide-react'
import { createRazorpayOrder, verifyPayment } from '../lib/api'

const PLANS = [
  { id:1, name:'Starter',  price:1500,  rickshaws:1,  driver_payout:600, accent:'#666', features:['1 Rickshaw','1 City','Basic Analytics'] },
  { id:2, name:'Basic',    price:5500,  rickshaws:3,  driver_payout:600, accent:'#2A9D5C', features:['3 Rickshaws','1–2 Cities','Weekly Reports'] },
  { id:3, name:'Growth',   price:11000, rickshaws:7,  driver_payout:650, accent:'#D49800', features:['7 Rickshaws','Both Cities','Live Tracking'], popular:true },
  { id:4, name:'Pro',      price:21000, rickshaws:15, driver_payout:700, accent:'#E53935', features:['15 Rickshaws','Both Cities','Daily Reports','90-min Guarantee'] },
]

const card  = { background:'#fff', border:'1px solid #E8E8E8', borderRadius:'16px', padding:'20px', marginBottom:'14px', boxShadow:'0 2px 8px rgba(0,0,0,0.05)' }
const btn   = (bg='#FFBF00', col='#111') => ({ background:bg, color:col, border:'none', borderRadius:'10px', padding:'13px 20px', fontWeight:800, fontSize:'0.92rem', cursor:'pointer', display:'inline-flex', alignItems:'center', gap:'7px', transition:'opacity .18s' })
const inp   = { width:'100%', padding:'14px 15px', fontSize:'0.95rem', border:'1.5px solid #D8D8D8', borderRadius:'12px', background:'#fff', color:'#111', outline:'none', fontFamily:'inherit', marginBottom:'14px' }
const badge = (s) => {
  const m = { pending:['#FFF8E6','#7A5900'], paid:['#EFF6FF','#1565C0'], active:['#E6F9EE','#0A6B30'], completed:['#F5F5F5','#666'], cancelled:['#FDECEA','#C62828'] }
  const [bg,c] = m[s]||['#F5F5F5','#666']
  return { display:'inline-block', background:bg, color:c, fontSize:'0.7rem', fontWeight:800, letterSpacing:'0.06em', textTransform:'uppercase', padding:'4px 10px', borderRadius:'100px' }
}

function loadRazorpayScript() {
  return new Promise(resolve => {
    if (window.Razorpay) return resolve()
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = resolve
    document.body.appendChild(script)
  })
}

function CampaignAnalytics({ campaign }) {
  const [proofs, setProofs]           = useState([])
  const [assignedDrivers, setDrivers] = useState([])
  const [loading, setLoading]         = useState(true)

  useEffect(() => { fetchAnalytics() }, [campaign.id])

  async function fetchAnalytics() {
    const { data: jobs } = await supabase.from('driver_jobs').select('id,status,driver_id').eq('campaign_id', campaign.id).neq('status','rejected')
    setDrivers(jobs || [])
    const ids = (jobs||[]).map(j=>j.id)
    if (ids.length) {
      const { data } = await supabase.from('daily_proofs').select('proof_date,status,driver_job_id').in('driver_job_id', ids).order('proof_date',{ascending:false})
      setProofs(data||[])
    }
    setLoading(false)
  }

  const daysActive    = Math.floor((new Date() - new Date(campaign.created_at)) / 86400000)
  const daysLeft      = Math.max(0, 30 - daysActive)
  const approved      = proofs.filter(p=>p.status==='approved')
  const pending       = proofs.filter(p=>p.status==='pending')
  const activeDrivers = assignedDrivers.filter(d=>d.status==='active').length

  if (loading) return <div style={{ padding:'20px', color:'#888', textAlign:'center' }}>Loading…</div>

  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(110px,1fr))', gap:'10px', marginBottom:'18px' }}>
        {[{n:daysActive,l:'Days Active',c:'#D49800'},{n:daysLeft,l:'Days Left',c:'#E53935'},{n:`${activeDrivers}/${assignedDrivers.length}`,l:'Drivers Active',c:'#1DB954'},{n:approved.length,l:'Days Shown',c:'#1565C0'},{n:pending.length,l:'Pending Review',c:'#888'}].map(x=>(
          <div key={x.l} style={{ background:'#F8F8F8', border:'1px solid #E8E8E8', borderRadius:'12px', padding:'14px', textAlign:'center' }}>
            <div style={{ fontFamily:'Bebas Neue,sans-serif', fontSize:'1.7rem', color:x.c, lineHeight:1 }}>{x.n}</div>
            <div style={{ fontSize:'0.68rem', fontWeight:700, color:'#888', textTransform:'uppercase', letterSpacing:'0.05em', marginTop:'4px' }}>{x.l}</div>
          </div>
        ))}
      </div>
      <div style={{ marginBottom:'14px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.8rem', color:'#888', marginBottom:'5px' }}>
          <span>Campaign Progress</span><span>{Math.min(daysActive,30)}/30 days</span>
        </div>
        <div style={{ background:'#F0F0F0', borderRadius:'100px', height:'8px', overflow:'hidden' }}>
          <div style={{ width:`${Math.min((daysActive/30)*100,100)}%`, height:'100%', background:'linear-gradient(90deg,#FFBF00,#FF8C00)', borderRadius:'100px' }}/>
        </div>
      </div>
    </div>
  )
}

export default function AdvertiserDashboard({ profile }) {
  const { signOut }  = useAuth()
  const [tab, setTab]           = useState('home')
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading]   = useState(true)
  const [selectedPlan, setPlan] = useState(null)
  const [bannerFile, setBannerFile]     = useState(null)
  const [bannerPreview, setBannerPreview] = useState(null)
  const [form, setForm]         = useState({ company_name:'', city:'', area:'' })
  const [submitting, setSubmitting] = useState(false)
  const [analyticsFor, setAnalyticsFor] = useState(null)
  const [payingFor, setPayingFor] = useState(null) // campaign being paid

  useEffect(() => { fetchCampaigns() }, [])

  async function fetchCampaigns() {
    const { data } = await supabase.from('campaigns').select('*, plans(name,price,rickshaw_count)')
      .eq('advertiser_id', profile.id).order('created_at',{ascending:false})
    const all = data || []
    setCampaigns(all); setLoading(false)
    if (!analyticsFor) {
      const first = all.find(c=>c.status==='active'||c.status==='paid')
      if (first) setAnalyticsFor(first.id)
    }
  }

  function handleBannerSelect(e) {
    const file = e.target.files[0]; if (!file) return
    if (bannerPreview) URL.revokeObjectURL(bannerPreview)
    setBannerFile(file); setBannerPreview(URL.createObjectURL(file))
  }

  async function handleCreateCampaign() {
    if (!selectedPlan)        return toast.error('Please choose a plan')
    if (!form.company_name)   return toast.error('Enter your business name')
    if (!bannerFile)          return toast.error('Upload your ad banner')
    if (!form.city)           return toast.error('Select a city')
    if (!form.area)           return toast.error('Enter your target area')
    setSubmitting(true)

    const fileName = `${profile.id}_${Date.now()}.${bannerFile.name.split('.').pop()}`
    const { error: upErr } = await supabase.storage.from('banners').upload(fileName, bannerFile)
    if (upErr) { toast.error('Banner upload failed: ' + upErr.message); setSubmitting(false); return }

    const { data: { publicUrl } } = supabase.storage.from('banners').getPublicUrl(fileName)

    const { data: newCampaign, error } = await supabase
      .from('campaigns')
      .insert({
        advertiser_id: profile.id,
        plan_id: selectedPlan.id,
        banner_url: publicUrl,
        city: form.city,
        area: form.area,
        company_name: form.company_name,
        status: 'pending'
      })
      .select()
      .single()

    if (error) { toast.error(error.message); setSubmitting(false); return }

    // Reset form
    setPlan(null); setBannerFile(null)
    if (bannerPreview) URL.revokeObjectURL(bannerPreview)
    setBannerPreview(null); setForm({ company_name:'', city:'', area:'' }); setSubmitting(false)

    // Immediately open payment for this campaign
    await fetchCampaigns()
    setTab('campaigns')
    toast.success('Campaign created! Opening payment… 💳')

    // Small delay so campaigns list loads first
    setTimeout(() => handlePayment(newCampaign), 800)
  }

  async function handlePayment(campaign) {
    if (payingFor) return // prevent double click
    setPayingFor(campaign.id)

    try {
      // Step 1 — Load Razorpay script
      await loadRazorpayScript()

      // Step 2 — Create order from backend
      const order = await createRazorpayOrder(campaign.id, campaign.plans?.price * 100 || selectedPlan?.price * 100)

      // Step 3 — Open Razorpay checkout
      const options = {
        key: order.key,
        amount: order.amount,
        currency: order.currency,
        order_id: order.orderId,
        name: 'AdWheels',
        description: `${campaign.company_name} — ${campaign.plans?.name || ''} Plan`,
        handler: async function(response) {
          try {
            // Step 4 — Verify on backend → updates campaign + assigns drivers
            const result = await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              campaignId: campaign.id,
            })

            if (result.success) {
              await fetchCampaigns()
              toast.success('Payment successful! Drivers are being assigned 🎉')
              setTab('campaigns')
            } else {
              toast.error('Payment verification failed. Please contact support.')
            }
          } catch (err) {
            console.error('Verify error:', err)
            toast.error('Payment done but verification failed. Contact support.')
          }
        },
        modal: {
          ondismiss: () => setPayingFor(null)
        },
        prefill: {
          name: profile.full_name,
          contact: profile.phone || '',
        },
        theme: { color: '#FFBF00' },
      }

      const rzp = new window.Razorpay(options)
      rzp.open()

    } catch (err) {
      console.error('Payment error:', err)
      toast.error('Could not open payment. Please try again.')
      setPayingFor(null)
    }
  }

  const activeCampaigns  = campaigns.filter(c=>c.status==='active').length
  const pendingCampaigns = campaigns.filter(c=>c.status==='pending').length

  const TABS = [
    { key:'home',          label:'🏠 Home' },
    { key:'campaigns',     label:'📢 My Ads' },
    { key:'analytics',     label:'📊 Stats' },
    { key:'new campaign',  label:'➕ New Ad' },
  ]

  return (
    <div style={{ minHeight:'100vh', background:'#F5F5F5', color:'#111', fontFamily:"'DM Sans',sans-serif" }}>

      {/* NAV */}
      <div style={{ background:'#fff', borderBottom:'1px solid #EBEBEB', padding:'0 18px', height:'58px', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:100, boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
        <div style={{ fontFamily:'Bebas Neue,sans-serif', fontSize:'1.7rem', color:'#FFBF00', letterSpacing:'0.05em' }}>AdWheels</div>
        <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
          <span style={{ fontSize:'0.84rem', color:'#666' }}>👋 {profile.full_name}</span>
          <button onClick={signOut} style={{ background:'none', border:'1.5px solid #E8E8E8', borderRadius:'8px', padding:'6px 12px', fontSize:'0.82rem', color:'#888', cursor:'pointer', display:'flex', alignItems:'center', gap:'5px' }}>
            <LogOut size={13}/> Logout
          </button>
        </div>
      </div>

      {/* GREETING */}
      <div style={{ background:'linear-gradient(135deg,#FFBF00,#FF8C00)', padding:'20px 18px 18px', color:'#111' }}>
        <div style={{ fontSize:'0.83rem', opacity:0.65, marginBottom:'2px' }}>Welcome back,</div>
        <div style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.25rem' }}>{profile.full_name} 👋</div>
        <div style={{ fontSize:'0.82rem', marginTop:'3px', opacity:0.7 }}>🏢 Advertiser · {profile.city}</div>
      </div>

      {/* TABS */}
      <div style={{ background:'#fff', borderBottom:'1px solid #EBEBEB', display:'flex', overflowX:'auto', scrollbarWidth:'none', padding:'0 6px' }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{ padding:'13px 14px', border:'none', background:'none', fontSize:'0.82rem', fontWeight:700, cursor:'pointer', whiteSpace:'nowrap', color:tab===t.key?'#D49800':'#999', borderBottom:tab===t.key?'2.5px solid #FFBF00':'2.5px solid transparent', flexShrink:0 }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding:'16px', maxWidth:'720px', margin:'0 auto' }}>

        {/* HOME */}
        {tab==='home' && <>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))', gap:'12px', marginBottom:'14px' }}>
            {[{n:campaigns.length,l:'Total Ads',c:'#D49800'},{n:activeCampaigns,l:'Running Now',c:'#1DB954'},{n:pendingCampaigns,l:'Waiting',c:'#E53935'},{n:'90',l:'Min to Live',c:'#1565C0'}].map(x=>(
              <div key={x.l} style={card}>
                <div style={{ fontFamily:'Bebas Neue,sans-serif', fontSize:'2rem', color:x.c, lineHeight:1 }}>{x.n}</div>
                <div style={{ fontSize:'0.7rem', fontWeight:700, color:'#888', textTransform:'uppercase', letterSpacing:'0.05em', marginTop:'4px' }}>{x.l}</div>
              </div>
            ))}
          </div>
          {campaigns.length===0
            ? <div style={{ textAlign:'center', padding:'48px 16px', color:'#bbb' }}>
                <div style={{ fontSize:'3rem', marginBottom:'10px' }}>📢</div>
                <div style={{ fontWeight:700, fontSize:'1rem', color:'#999', marginBottom:'8px' }}>No ads yet</div>
                <button onClick={()=>setTab('new campaign')} style={{ ...btn(), marginTop:'4px' }}><Plus size={15}/> Create First Ad</button>
              </div>
            : campaigns.slice(0,3).map(c=>(
              <div key={c.id} style={card}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                  <div>
                    <div style={{ fontWeight:700, fontSize:'0.95rem', marginBottom:'4px' }}>{c.company_name || 'My Campaign'} — {c.plans?.name}</div>
                    <div style={{ fontSize:'0.84rem', color:'#888', marginBottom:'8px' }}>📍 {c.city} — {c.area}</div>
                    <span style={badge(c.status)}>{c.status}</span>
                  </div>
                  {c.banner_url && <img src={c.banner_url} alt="banner" style={{ width:'70px', height:'44px', objectFit:'cover', borderRadius:'8px', border:'1px solid #E8E8E8' }}/>}
                </div>
              </div>
            ))
          }
          <button onClick={()=>setTab('new campaign')} style={{ ...btn(), width:'100%', justifyContent:'center' }}><Plus size={16}/> Create New Ad Campaign</button>
        </>}

        {/* MY ADS */}
        {tab==='campaigns' && <>
          {loading ? <div style={{ textAlign:'center', padding:'40px', color:'#888' }}>Loading…</div>
           : campaigns.length===0
            ? <div style={{ textAlign:'center', padding:'48px 16px', color:'#bbb' }}><div style={{ fontSize:'3rem', marginBottom:'10px' }}>📢</div><div>No ads yet</div></div>
            : campaigns.map(c=>(
              <div key={c.id} style={card}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:'10px' }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700, marginBottom:'4px' }}>{c.company_name || 'My Campaign'} — {c.plans?.name}</div>
                    <div style={{ fontSize:'0.84rem', color:'#888', marginBottom:'8px' }}>📍 {c.city} — {c.area}</div>
                    <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', alignItems:'center', marginBottom:'10px' }}>
                      <span style={badge(c.status)}>{c.status}</span>
                      <span style={{ fontSize:'0.8rem', color:'#888' }}>₹{c.plans?.price?.toLocaleString()}/mo · {c.plans?.rickshaw_count} rickshaw{c.plans?.rickshaw_count>1?'s':''}</span>
                    </div>

                    {/* Pay Now button for pending campaigns */}
                    {c.status==='pending' && (
                      <button
                        onClick={() => handlePayment(c)}
                        disabled={payingFor === c.id}
                        style={{ ...btn('#FFBF00','#111'), fontSize:'0.85rem', padding:'10px 16px', opacity: payingFor===c.id ? 0.6 : 1 }}
                      >
                        💳 {payingFor===c.id ? 'Opening Payment…' : 'Pay Now to Go Live'}
                      </button>
                    )}

                    {(c.status==='active'||c.status==='paid') && (
                      <button onClick={()=>{setAnalyticsFor(c.id);setTab('analytics')}} style={{ background:'#E6F9EE', border:'1px solid #A3E4BE', color:'#0A6B30', borderRadius:'8px', padding:'8px 13px', fontWeight:700, fontSize:'0.82rem', cursor:'pointer', display:'inline-flex', alignItems:'center', gap:'5px', marginTop:'4px' }}>
                        <BarChart2 size={13}/> View Stats
                      </button>
                    )}
                  </div>
                  {c.banner_url && <img src={c.banner_url} alt="banner" style={{ width:'90px', height:'58px', objectFit:'cover', borderRadius:'8px', border:'1px solid #E8E8E8', flexShrink:0 }}/>}
                </div>
              </div>
            ))
          }
        </>}

        {/* ANALYTICS */}
        {tab==='analytics' && <>
          {campaigns.filter(c=>c.status==='active'||c.status==='paid').length===0
            ? <div style={{ textAlign:'center', padding:'48px 16px', color:'#bbb' }}>
                <div style={{ fontSize:'3rem', marginBottom:'10px' }}>📊</div>
                <div style={{ fontWeight:700, fontSize:'1rem', color:'#999', marginBottom:'4px' }}>No active ads</div>
                <div style={{ fontSize:'0.84rem' }}>Stats will appear once your ad is live</div>
              </div>
            : <>
                {campaigns.filter(c=>c.status==='active'||c.status==='paid').length>1 && (
                  <div style={{ marginBottom:'16px' }}>
                    <label style={{ display:'block', fontWeight:600, fontSize:'0.88rem', marginBottom:'6px', color:'#444' }}>Select Ad Campaign</label>
                    <select style={{ ...inp, appearance:'none', WebkitAppearance:'none' }} value={analyticsFor||''} onChange={e=>setAnalyticsFor(e.target.value)}>
                      {campaigns.filter(c=>c.status==='active'||c.status==='paid').map(c=>(
                        <option key={c.id} value={c.id}>{c.company_name||'My Campaign'} — {c.plans?.name} — {c.city}</option>
                      ))}
                    </select>
                  </div>
                )}
                {(()=>{
                  const ac = campaigns.find(c=>c.id===analyticsFor)||campaigns.find(c=>c.status==='active'||c.status==='paid')
                  if (!ac) return null
                  return (
                    <div style={card}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px', flexWrap:'wrap', gap:'10px' }}>
                        <div>
                          <div style={{ fontWeight:800, fontSize:'1rem' }}>{ac.company_name||'My Campaign'} — {ac.plans?.name}</div>
                          <div style={{ fontSize:'0.82rem', color:'#888', marginTop:'2px' }}>📍 {ac.city} — {ac.area}</div>
                        </div>
                        <span style={badge(ac.status)}>{ac.status}</span>
                      </div>
                      <CampaignAnalytics campaign={ac}/>
                    </div>
                  )
                })()}
              </>
          }
        </>}

        {/* NEW AD */}
        {tab==='new campaign' && <>
          <div style={{ fontWeight:800, fontSize:'1rem', marginBottom:'14px', color:'#111' }}>Step 1 — Choose a Plan</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:'12px', marginBottom:'24px' }}>
            {PLANS.map(plan=>(
              <div key={plan.id} onClick={()=>setPlan(plan)}
                style={{ border:`2px solid ${selectedPlan?.id===plan.id?plan.accent:'#E8E8E8'}`, borderRadius:'14px', padding:'18px 14px', background:selectedPlan?.id===plan.id?`${plan.accent}10`:'#fff', cursor:'pointer', position:'relative', transition:'all .18s' }}>
                {plan.popular && <div style={{ position:'absolute', top:'-10px', left:'50%', transform:'translateX(-50%)', background:'#FFBF00', color:'#111', fontSize:'0.62rem', fontWeight:800, letterSpacing:'0.08em', textTransform:'uppercase', padding:'3px 10px', borderRadius:'100px', whiteSpace:'nowrap' }}>Most Popular</div>}
                <div style={{ fontWeight:800, fontSize:'1rem', color:selectedPlan?.id===plan.id?plan.accent:'#111', marginBottom:'4px' }}>{plan.name}</div>
                <div style={{ fontFamily:'Bebas Neue,sans-serif', fontSize:'1.6rem', color:plan.accent, lineHeight:1, marginBottom:'6px' }}>₹{plan.price.toLocaleString()}<span style={{ fontFamily:'DM Sans,sans-serif', fontSize:'0.75rem', color:'#888' }}>/mo</span></div>
                <div style={{ fontSize:'0.78rem', color:'#888', marginBottom:'8px' }}>{plan.rickshaws} rickshaw{plan.rickshaws>1?'s':''}</div>
                {plan.features.map(f=><div key={f} style={{ fontSize:'0.78rem', color:'#555', padding:'2px 0', display:'flex', gap:'5px', alignItems:'center' }}><span style={{ color:'#1DB954', fontWeight:700 }}>✓</span>{f}</div>)}
              </div>
            ))}
          </div>

          <div style={{ fontWeight:800, fontSize:'1rem', marginBottom:'10px', color:'#111' }}>Step 2 — Business Name</div>
          <input style={inp} placeholder="e.g. Sharma Electronics, My Café…" value={form.company_name} onChange={e=>setForm(f=>({...f,company_name:e.target.value}))}/>

          <div style={{ fontWeight:800, fontSize:'1rem', marginBottom:'10px', color:'#111' }}>Step 3 — Upload Your Ad Banner</div>
          <label htmlFor="bannerInput" style={{ display:'block', cursor:'pointer' }}>
            <div style={{ border:`2px dashed ${bannerPreview?'#FFBF00':'#D8D8D8'}`, borderRadius:'14px', padding:'30px 20px', textAlign:'center', background:bannerPreview?'#FFFBEB':'#fafafa', marginBottom:'14px' }}>
              {bannerPreview
                ? <img src={bannerPreview} alt="preview" style={{ maxHeight:'140px', maxWidth:'100%', borderRadius:'8px' }}/>
                : <><div style={{ fontSize:'2.5rem', marginBottom:'8px' }}>🖼️</div><div style={{ fontWeight:700, marginBottom:'4px' }}>Tap to upload banner image</div><div style={{ fontSize:'0.8rem', color:'#888' }}>PNG, JPG · Max 5MB</div></>
              }
            </div>
          </label>
          <input id="bannerInput" type="file" accept="image/*" style={{ display:'none' }} onChange={handleBannerSelect}/>

          <div style={{ fontWeight:800, fontSize:'1rem', marginBottom:'10px', color:'#111' }}>Step 4 — Where to Show Your Ad</div>
          <select style={{ ...inp, appearance:'none', WebkitAppearance:'none' }} value={form.city} onChange={e=>setForm(f=>({...f,city:e.target.value}))}>
            <option value="">Select city</option>
            <option value="indore">📍 Indore</option>
            <option value="bhopal">📍 Bhopal</option>
            <option value="both">📍 Both Cities</option>
          </select>
          <input style={inp} placeholder="Target area / colony (e.g. Vijay Nagar, MG Road…)" value={form.area} onChange={e=>setForm(f=>({...f,area:e.target.value}))}/>

          <div style={{ background:'#E6F9EE', border:'1px solid #A3E4BE', borderRadius:'12px', padding:'13px 16px', fontSize:'0.84rem', color:'#0A6B30', marginBottom:'18px' }}>
            💳 After submitting, Razorpay payment will open automatically. Your ad goes live within 90 minutes of payment!
          </div>
          <button onClick={handleCreateCampaign} disabled={submitting} style={{ ...btn(), width:'100%', justifyContent:'center', fontSize:'1rem', padding:'15px', opacity:submitting?.6:1 }}>
            {submitting ? 'Submitting…' : <><Plus size={16}/> Submit & Pay</>}
          </button>
        </>}

      </div>
    </div>
  )
}
