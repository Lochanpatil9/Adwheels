import { useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import { submitEnterpriseLead, submitRegistration } from '../lib/api'

/* ── scroll reveal ── */
function useReveal() {
  useEffect(() => {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e, i) => {
        if (e.isIntersecting) {
          setTimeout(() => e.target.classList.add('rv'), i * 60)
          obs.unobserve(e.target)
        }
      })
    }, { threshold: 0.08 })
    document.querySelectorAll('.reveal').forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [])
}

const scrollTo = id => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })

const PLANS = [
  { name:'Starter',  price:'₹1,500',  mo:'mo', rickshaws:1,  tag:null,           accent:'#6B7280', bg:'#F9FAFB', features:['1 Rickshaw','1 City','Standard Priority','Basic Analytics'] },
  { name:'Basic',    price:'₹5,500',  mo:'mo', rickshaws:3,  tag:null,           accent:'#059669', bg:'#F0FDF4', features:['3 Rickshaws','1–2 Cities','Standard Priority','Weekly Reports'] },
  { name:'Growth',   price:'₹11,000', mo:'mo', rickshaws:7,  tag:'Most Popular', accent:'#D97706', bg:'#FFFBEB', features:['7 Rickshaws','Both Cities','High Priority','Live Tracking','Weekly Reports'] },
  { name:'Pro',      price:'₹21,000', mo:'mo', rickshaws:15, tag:'Best Value',   accent:'#DC2626', bg:'#FFF5F5', features:['15 Rickshaws','Both Cities','TOP Priority','90-min Guarantee','Live Tracking','Daily Reports'] },
]

const STEPS = [
  { n:'01', icon:'🎨', title:'Upload Your Banner', sub:'Upload your ad image and pick a plan. Done in 2 minutes.' },
  { n:'02', icon:'🔔', title:'Driver Gets Notified', sub:'Our verified driver in your area accepts the campaign.' },
  { n:'03', icon:'🖨️', title:'Banner Gets Printed', sub:'Driver prints at nearest shop — we reimburse the cost.' },
  { n:'04', icon:'🛺', title:'Your Ad Goes Live', sub:'Banner installed. Your brand rolling through the city.' },
]

const LOGOS = ['Local Kirana','City Hospital','Tech Startup','Real Estate Co','Event Agency','Fashion Store','Food Chain','School / College']

export default function LandingPage({ onGetStarted }) {
  useReveal()
  const [mobileOpen, setMobileOpen]   = useState(false)
  const [scrolled,   setScrolled]     = useState(false)
  const [activeTab,  setActiveTab]    = useState('advertiser')
  const [regForm,    setRegForm]      = useState({ name:'',phone:'',city:'',business:'',budget:'',area:'' })
  const [regDone,    setRegDone]      = useState(false)
  const [entForm,    setEntForm]      = useState({ company:'',name:'',phone:'',email:'',city:'',message:'' })
  const [entDone,    setEntDone]      = useState(false)
  const [entBusy,    setEntBusy]      = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  async function submitEnt() {
    if (!entForm.company||!entForm.name||!entForm.phone) { toast.error('Fill company, name & phone'); return }
    setEntBusy(true)
    try { await submitEnterpriseLead(entForm); setEntDone(true); toast.success("Request sent! We'll call you within 2 hours 🎉") }
    catch { toast.error('Something went wrong. Call us directly!') }
    setEntBusy(false)
  }

  async function submitReg() {
    if (!regForm.name||!regForm.phone||!regForm.city) { toast.error('Fill name, phone and city'); return }
    try { await submitRegistration({...regForm, role:activeTab}); setRegDone(true); toast.success('Registered! Our team calls you within 24 hours 🎉') }
    catch { toast.error('Something went wrong. Please try again!') }
  }

  return (
    <div style={{fontFamily:"'DM Sans',sans-serif",background:'#FFFFFF',color:'#0F172A',overflowX:'hidden'}}>
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;600&display=swap');
      *{box-sizing:border-box;margin:0;padding:0}
      html{scroll-behavior:smooth}
      body{font-family:'DM Sans',sans-serif}

      /* Reveal */
      .reveal{opacity:0;transform:translateY(28px);transition:opacity .6s ease,transform .6s ease}
      .rv{opacity:1;transform:translateY(0)}

      /* Nav */
      .lp-nav{transition:all .3s}
      .lp-nav.stuck{box-shadow:0 4px 24px rgba(0,0,0,0.08);background:rgba(255,255,255,0.98)!important}

      /* Gradient text */
      .grad-text{background:linear-gradient(135deg,#FFBF00 0%,#FF6B00 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}

      /* Buttons */
      .btn-pri{background:linear-gradient(135deg,#FFBF00,#FF8C00);color:#111;font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:.95rem;padding:14px 28px;border:none;border-radius:12px;cursor:pointer;transition:all .2s;display:inline-flex;align-items:center;gap:8px;letter-spacing:-.01em;box-shadow:0 4px 14px rgba(255,191,0,0.4)}
      .btn-pri:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(255,140,0,0.45)}
      .btn-sec{background:transparent;color:#0F172A;font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:.95rem;padding:13px 26px;border:2px solid #E2E8F0;border-radius:12px;cursor:pointer;transition:all .2s;display:inline-flex;align-items:center;gap:8px}
      .btn-sec:hover{border-color:#0F172A;background:#0F172A;color:#fff}
      .btn-ghost{background:none;border:none;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:.9rem;font-weight:500;color:#475569;transition:color .2s;padding:0}
      .btn-ghost:hover{color:#0F172A}

      /* Input */
      .lp-inp{width:100%;padding:13px 15px;font-size:.93rem;font-family:'DM Sans',sans-serif;border:1.5px solid #E2E8F0;border-radius:10px;background:#fff;color:#0F172A;outline:none;transition:border-color .2s,box-shadow .2s;margin-bottom:14px}
      .lp-inp:focus{border-color:#FFBF00;box-shadow:0 0 0 3px rgba(255,191,0,.12)}
      .lp-lbl{display:block;font-size:.75rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#64748B;margin-bottom:6px}

      /* Card */
      .lp-card{background:#fff;border:1px solid #F1F5F9;border-radius:20px;padding:28px;box-shadow:0 4px 20px rgba(0,0,0,.05)}
      .lp-card:hover{box-shadow:0 8px 32px rgba(0,0,0,.09);transform:translateY(-2px);transition:all .2s}

      /* Step number */
      .step-num{font-family:'Bebas Neue',sans-serif;font-size:4rem;line-height:1;color:#F1F5F9;position:absolute;top:16px;right:20px;pointer-events:none}

      /* Ticker */
      .ticker{display:flex;animation:tick 30s linear infinite;width:max-content}
      @keyframes tick{from{transform:translateX(0)}to{transform:translateX(-50%)}}

      /* Mobile nav */
      .mob-nav{display:none;position:fixed;top:62px;left:0;right:0;background:#fff;border-bottom:1px solid #F1F5F9;flex-direction:column;padding:12px 20px 20px;gap:4px;z-index:99;box-shadow:0 8px 32px rgba(0,0,0,.12);animation:slideD .2s ease}
      @keyframes slideD{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
      .mob-nav.open{display:flex}
      .mob-item{background:none;border:none;color:#374151;font-size:1rem;font-weight:600;padding:14px 0;border-bottom:1px solid #F8FAFC;text-align:left;width:100%;cursor:pointer;font-family:'DM Sans',sans-serif;transition:color .2s}
      .mob-item:hover{color:#D97706}
      .mob-item:last-of-type{border-bottom:none}

      /* Responsive */
      @media(max-width:768px){
        .hide-mob{display:none!important}
        .show-mob{display:flex!important}
        .two-col{grid-template-columns:1fr!important;gap:24px!important}
        .four-col{grid-template-columns:1fr 1fr!important}
        section,.lp-sec{padding:60px 18px!important}
      }
      @media(max-width:480px){
        .four-col{grid-template-columns:1fr!important}
        section,.lp-sec{padding:48px 16px!important}
      }
      .show-mob{display:none}

      /* Trust badges */
      .trust-badge{display:inline-flex;align-items:center;gap:7px;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:100px;padding:8px 16px;font-size:.82rem;font-weight:600;color:#374151}

      /* Stat card */
      .stat-card{background:linear-gradient(135deg,#FFFBEB,#FFF3C4);border:1px solid #FDE68A;border-radius:16px;padding:24px 20px;text-align:center}

      /* Feature check */
      .feat-check{color:#10B981;font-weight:700;flex-shrink:0}

      /* Plan card hover */
      .plan-card{border-radius:18px;padding:28px 22px;position:relative;cursor:default;transition:all .25s}
      .plan-card:hover{transform:translateY(-4px);box-shadow:0 16px 40px rgba(0,0,0,.1)!important}
    `}</style>

    {/* ═══════════════════════════ NAV ═══════════════════════════ */}
    <nav className={`lp-nav${scrolled?' stuck':''}`} style={{position:'sticky',top:0,zIndex:100,background:scrolled?'rgba(255,255,255,.98)':'#fff',borderBottom:'1px solid #F1F5F9',padding:'0 32px',display:'flex',alignItems:'center',justifyContent:'space-between',height:'62px'}}>
      <div style={{fontFamily:'Bebas Neue',fontSize:'1.9rem',color:'#FFBF00',letterSpacing:'.06em',cursor:'pointer'}} onClick={()=>scrollTo('hero')}>AdWheels</div>

      <div className="hide-mob" style={{display:'flex',alignItems:'center',gap:'32px'}}>
        {[['How It Works','how'],['Pricing','pricing'],['Enterprise','enterprise'],['For Drivers','register']].map(([l,id])=>(
          <button key={id} className="btn-ghost" onClick={()=>scrollTo(id)}>{l}</button>
        ))}
      </div>

      <div className="hide-mob" style={{display:'flex',alignItems:'center',gap:'12px'}}>
        <button onClick={onGetStarted} style={{background:'none',border:'1.5px solid #E2E8F0',borderRadius:'10px',padding:'9px 18px',fontWeight:600,fontSize:'.88rem',cursor:'pointer',color:'#374151',fontFamily:'DM Sans,sans-serif',transition:'all .2s'}}
          onMouseEnter={e=>{e.target.style.borderColor='#0F172A';e.target.style.color='#0F172A'}}
          onMouseLeave={e=>{e.target.style.borderColor='#E2E8F0';e.target.style.color='#374151'}}>
          Login
        </button>
        <button className="btn-pri" style={{padding:'9px 20px',fontSize:'.88rem'}} onClick={onGetStarted}>Get Started Free →</button>
      </div>

      <button className="show-mob" onClick={()=>setMobileOpen(o=>!o)}
        style={{background:'none',border:'1.5px solid #E2E8F0',borderRadius:'8px',padding:'8px 12px',cursor:'pointer',color:'#374151',fontSize:'1.1rem'}}>
        {mobileOpen?'✕':'☰'}
      </button>
    </nav>

    {/* Mobile Menu */}
    <div className={`mob-nav${mobileOpen?' open':''}`}>
      {[['How It Works','how'],['Pricing','pricing'],['Enterprise','enterprise'],['For Drivers','register']].map(([l,id])=>(
        <button key={id} className="mob-item" onClick={()=>{scrollTo(id);setMobileOpen(false)}}>{l}</button>
      ))}
      <button className="btn-pri" style={{marginTop:'10px',width:'100%',justifyContent:'center'}} onClick={()=>{setMobileOpen(false);onGetStarted()}}>Get Started Free →</button>
    </div>

    {/* ═══════════════════════════ HERO ═══════════════════════════ */}
    <div id="hero" style={{background:'#FFFFFF',position:'relative',overflow:'hidden'}}>
      {/* Background decoration */}
      <div style={{position:'absolute',top:'-80px',right:'-120px',width:'600px',height:'600px',background:'radial-gradient(circle,rgba(255,191,0,.12) 0%,transparent 65%)',pointerEvents:'none'}}/>
      <div style={{position:'absolute',bottom:'-40px',left:'-80px',width:'400px',height:'400px',background:'radial-gradient(circle,rgba(255,140,0,.07) 0%,transparent 65%)',pointerEvents:'none'}}/>

      <div style={{maxWidth:'1140px',margin:'0 auto',padding:'90px 32px 80px',display:'grid',gridTemplateColumns:'1fr 1fr',gap:'60px',alignItems:'center'}} className="two-col">

        {/* Left */}
        <div>
          {/* Pill badge */}
          <div style={{display:'inline-flex',alignItems:'center',gap:'8px',background:'#FFFBEB',border:'1px solid #FDE68A',borderRadius:'100px',padding:'7px 16px',fontSize:'.8rem',fontWeight:700,color:'#92400E',marginBottom:'28px',letterSpacing:'.02em'}}>
            <span style={{width:'7px',height:'7px',background:'#F59E0B',borderRadius:'50%',display:'inline-block',animation:'pulse 2s infinite'}}/>
            🛺 Live in Indore & Bhopal
          </div>
          <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>

          <h1 style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:'clamp(2.4rem,5vw,3.8rem)',fontWeight:800,lineHeight:1.08,letterSpacing:'-.03em',marginBottom:'22px',color:'#0F172A'}}>
            Get Your Ad on<br/>
            <span className="grad-text">1000+ Rickshaws</span><br/>
            in 90 Minutes
          </h1>

          <p style={{fontSize:'1.08rem',color:'#64748B',lineHeight:1.7,marginBottom:'36px',maxWidth:'440px'}}>
            The fastest, most affordable way to advertise in Indore & Bhopal. No agencies. No waiting. Just upload, assign, and go live.
          </p>

          <div style={{display:'flex',gap:'12px',flexWrap:'wrap',marginBottom:'40px'}}>
            <button className="btn-pri" onClick={onGetStarted}>Launch My Ad Now →</button>
            <button className="btn-sec" onClick={()=>scrollTo('how')}>See How It Works</button>
          </div>

          {/* Trust row */}
          <div style={{display:'flex',gap:'10px',flexWrap:'wrap'}}>
            {['✅ Verified Drivers','📸 Daily Photo Proof','💰 From ₹1,500/mo'].map(t=>(
              <span key={t} className="trust-badge">{t}</span>
            ))}
          </div>
        </div>

        {/* Right — visual card */}
        <div style={{position:'relative'}}>
          {/* Main card */}
          <div style={{background:'linear-gradient(135deg,#0F172A 0%,#1E293B 100%)',borderRadius:'24px',padding:'32px',boxShadow:'0 24px 60px rgba(15,23,42,.25)',color:'#fff',position:'relative',overflow:'hidden'}}>
            <div style={{position:'absolute',top:'-30px',right:'-30px',width:'160px',height:'160px',background:'radial-gradient(circle,rgba(255,191,0,.2),transparent)',borderRadius:'50%'}}/>
            {/* Mock campaign card */}
            <div style={{background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.1)',borderRadius:'16px',padding:'20px',marginBottom:'16px'}}>
              <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'14px'}}>
                <div style={{width:'40px',height:'40px',background:'linear-gradient(135deg,#FFBF00,#FF8C00)',borderRadius:'10px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.2rem',flexShrink:0}}>🛺</div>
                <div>
                  <div style={{fontWeight:700,fontSize:'.95rem'}}>Growth Campaign</div>
                  <div style={{fontSize:'.78rem',color:'rgba(255,255,255,.5)',marginTop:'2px'}}>Vijay Nagar, Indore</div>
                </div>
                <div style={{marginLeft:'auto',background:'rgba(16,185,129,.15)',border:'1px solid rgba(16,185,129,.3)',borderRadius:'100px',padding:'4px 12px',fontSize:'.72rem',fontWeight:800,color:'#34D399',letterSpacing:'.06em',textTransform:'uppercase'}}>Live</div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'10px'}}>
                {[['7','Rickshaws'],['₹11K','Monthly'],['90m','Go Live']].map(([n,l])=>(
                  <div key={l} style={{background:'rgba(255,255,255,.05)',borderRadius:'10px',padding:'12px',textAlign:'center'}}>
                    <div style={{fontFamily:'Bebas Neue',fontSize:'1.5rem',color:'#FFBF00',lineHeight:1}}>{n}</div>
                    <div style={{fontSize:'.65rem',color:'rgba(255,255,255,.45)',textTransform:'uppercase',letterSpacing:'.05em',marginTop:'3px',fontWeight:700}}>{l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Progress bar */}
            <div style={{marginBottom:'14px'}}>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:'.78rem',color:'rgba(255,255,255,.5)',marginBottom:'6px'}}>
                <span>Campaign Progress</span><span>Day 14 of 30</span>
              </div>
              <div style={{background:'rgba(255,255,255,.1)',borderRadius:'100px',height:'6px',overflow:'hidden'}}>
                <div style={{width:'47%',height:'100%',background:'linear-gradient(90deg,#FFBF00,#FF8C00)',borderRadius:'100px'}}/>
              </div>
            </div>

            {/* Activity dots */}
            <div style={{display:'flex',alignItems:'center',gap:'8px',fontSize:'.8rem',color:'rgba(255,255,255,.5)'}}>
              <div style={{display:'flex',gap:'4px'}}>
                {[1,2,3,4,5].map(i=><div key={i} style={{width:'6px',height:'6px',borderRadius:'50%',background:i<=4?'#10B981':'rgba(255,255,255,.15)'}}/>)}
              </div>
              <span>4 drivers active today</span>
            </div>
          </div>

          {/* Floating stat bubbles */}
          <div style={{position:'absolute',top:'-18px',left:'-18px',background:'#fff',border:'1px solid #F1F5F9',borderRadius:'14px',padding:'12px 16px',boxShadow:'0 8px 24px rgba(0,0,0,.1)',display:'flex',alignItems:'center',gap:'10px'}}>
            <span style={{fontSize:'1.4rem'}}>📸</span>
            <div><div style={{fontWeight:800,fontSize:'.9rem',color:'#0F172A'}}>Daily Proof</div><div style={{fontSize:'.75rem',color:'#64748B'}}>Photo uploaded ✅</div></div>
          </div>
          <div style={{position:'absolute',bottom:'-16px',right:'-16px',background:'#fff',border:'1px solid #F1F5F9',borderRadius:'14px',padding:'12px 16px',boxShadow:'0 8px 24px rgba(0,0,0,.1)',display:'flex',alignItems:'center',gap:'10px'}}>
            <span style={{fontSize:'1.4rem'}}>💰</span>
            <div><div style={{fontWeight:800,fontSize:'.9rem',color:'#0F172A'}}>₹175 Credited</div><div style={{fontSize:'.75rem',color:'#64748B'}}>Driver payout</div></div>
          </div>
        </div>
      </div>
    </div>

    {/* ── Social proof ticker ── */}
    <div style={{background:'#FFFBEB',borderTop:'1px solid #FDE68A',borderBottom:'1px solid #FDE68A',padding:'12px 0',overflow:'hidden'}}>
      <div className="ticker">
        {[...Array(2)].map((_,i)=>(
          <div key={i} style={{display:'flex',flexShrink:0}}>
            {['🛺 Live in 90 Minutes','⭐ 100+ Happy Advertisers','📍 Indore & Bhopal','💰 From ₹1,500/mo','📸 Daily Photo Proof','✅ Verified Drivers','🎯 Hyperlocal Targeting','🚀 Launch Today'].map((t,j)=>(
              <span key={j} style={{padding:'0 32px',fontSize:'.8rem',fontWeight:700,letterSpacing:'.08em',textTransform:'uppercase',color:'#92400E',whiteSpace:'nowrap'}}>{t}</span>
            ))}
          </div>
        ))}
      </div>
    </div>

    {/* ── Logos / social proof ── */}
    <div style={{background:'#FAFAFA',borderBottom:'1px solid #F1F5F9',padding:'28px 32px'}}>
      <p style={{textAlign:'center',fontSize:'.8rem',fontWeight:700,letterSpacing:'.1em',textTransform:'uppercase',color:'#94A3B8',marginBottom:'20px'}}>Trusted by businesses across Indore & Bhopal</p>
      <div style={{display:'flex',flexWrap:'wrap',justifyContent:'center',gap:'12px'}}>
        {LOGOS.map(l=>(
          <div key={l} style={{background:'#fff',border:'1px solid #E2E8F0',borderRadius:'10px',padding:'10px 18px',fontSize:'.82rem',fontWeight:600,color:'#64748B'}}>{l}</div>
        ))}
      </div>
    </div>

    {/* ═══════════════════════════ HOW IT WORKS ═══════════════════════════ */}
    <div id="how" style={{background:'#FFFFFF'}}>
      <div style={{maxWidth:'1100px',margin:'0 auto',padding:'96px 32px'}} className="lp-sec">
        <div style={{textAlign:'center',maxWidth:'560px',margin:'0 auto 64px'}}>
          <div className="reveal" style={{display:'inline-block',background:'#FFF7ED',border:'1px solid #FED7AA',borderRadius:'100px',padding:'5px 14px',fontSize:'.75rem',fontWeight:800,color:'#C2410C',letterSpacing:'.08em',textTransform:'uppercase',marginBottom:'16px'}}>The Process</div>
          <h2 className="reveal" style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:'clamp(1.8rem,4vw,2.8rem)',fontWeight:800,letterSpacing:'-.02em',color:'#0F172A',lineHeight:1.15,marginBottom:'16px'}}>
            From Upload to <span className="grad-text">On the Road</span>
          </h2>
          <p className="reveal" style={{color:'#64748B',fontSize:'1.05rem',lineHeight:1.65}}>No agencies. No waiting weeks. Just upload, assign, print, and roll.</p>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:'24px'}}>
          {STEPS.map((step,i)=>(
            <div key={step.n} className="reveal lp-card" style={{position:'relative',overflow:'hidden',borderLeft:`4px solid ${['#FFBF00','#F59E0B','#D97706','#B45309'][i]}`}}>
              <div className="step-num">{step.n}</div>
              <div style={{fontSize:'2rem',marginBottom:'14px'}}>{step.icon}</div>
              <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:'1rem',color:'#0F172A',marginBottom:'8px'}}>{step.title}</div>
              <div style={{fontSize:'.87rem',color:'#64748B',lineHeight:1.65}}>{step.sub}</div>
              {i < STEPS.length-1 && (
                <div className="hide-mob" style={{position:'absolute',top:'50%',right:'-18px',transform:'translateY(-50%)',zIndex:2,fontSize:'1.1rem',color:'#CBD5E1'}}>→</div>
              )}
            </div>
          ))}
        </div>

        <div style={{display:'flex',justifyContent:'center',marginTop:'48px'}}>
          <button className="btn-pri" onClick={onGetStarted} style={{fontSize:'1rem',padding:'15px 36px'}}>Start My Campaign →</button>
        </div>
      </div>
    </div>

    {/* ═══════════════════════════ BUILT FOR BOTH ═══════════════════════════ */}
    <div style={{background:'#F8FAFC'}}>
      <div style={{maxWidth:'1100px',margin:'0 auto',padding:'96px 32px'}} className="lp-sec">
        <div style={{textAlign:'center',maxWidth:'520px',margin:'0 auto 56px'}}>
          <div className="reveal" style={{display:'inline-block',background:'#EFF6FF',border:'1px solid #BFDBFE',borderRadius:'100px',padding:'5px 14px',fontSize:'.75rem',fontWeight:800,color:'#1D4ED8',letterSpacing:'.08em',textTransform:'uppercase',marginBottom:'16px'}}>Who It's For</div>
          <h2 className="reveal" style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:'clamp(1.8rem,4vw,2.8rem)',fontWeight:800,letterSpacing:'-.02em',color:'#0F172A',lineHeight:1.15}}>
            Built for <span className="grad-text">Both Sides</span>
          </h2>
        </div>

        <div className="two-col" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'24px'}}>
          {/* Advertiser */}
          <div className="reveal" style={{background:'linear-gradient(135deg,#FFFBEB 0%,#FEF3C7 100%)',border:'1.5px solid #FDE68A',borderRadius:'24px',padding:'40px 32px'}}>
            <div style={{width:'56px',height:'56px',background:'linear-gradient(135deg,#FFBF00,#FF8C00)',borderRadius:'16px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.6rem',marginBottom:'20px',boxShadow:'0 8px 20px rgba(255,191,0,.35)'}}>🏢</div>
            <h3 style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:'1.5rem',color:'#0F172A',marginBottom:'8px'}}>For Advertisers</h3>
            <p style={{color:'#64748B',fontSize:'.92rem',lineHeight:1.65,marginBottom:'24px'}}>Reach thousands of people daily in your target area — faster and cheaper than any other channel.</p>
            <div style={{display:'flex',flexDirection:'column',gap:'10px',marginBottom:'28px'}}>
              {['Local shops & restaurants','Growing brands & startups','Event & political campaigns','Real estate & builders'].map(p=>(
                <div key={p} style={{display:'flex',alignItems:'center',gap:'10px',fontSize:'.88rem',color:'#374151'}}>
                  <div style={{width:'20px',height:'20px',background:'#FEF3C7',border:'1px solid #FDE68A',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontSize:'.75rem'}}>✓</div>
                  {p}
                </div>
              ))}
            </div>
            <button className="btn-pri" onClick={onGetStarted} style={{width:'100%',justifyContent:'center'}}>Launch My Ad Now →</button>
          </div>

          {/* Driver */}
          <div className="reveal" style={{background:'linear-gradient(135deg,#F0FDF4 0%,#DCFCE7 100%)',border:'1.5px solid #A7F3D0',borderRadius:'24px',padding:'40px 32px'}}>
            <div style={{width:'56px',height:'56px',background:'linear-gradient(135deg,#10B981,#059669)',borderRadius:'16px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.6rem',marginBottom:'20px',boxShadow:'0 8px 20px rgba(16,185,129,.3)'}}>🛺</div>
            <h3 style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:'1.5rem',color:'#0F172A',marginBottom:'8px'}}>For Drivers</h3>
            <p style={{color:'#64748B',fontSize:'.92rem',lineHeight:1.65,marginBottom:'24px'}}>Earn extra income every month — just by carrying a banner on your rickshaw. No extra work needed.</p>
            <div style={{display:'flex',flexDirection:'column',gap:'10px',marginBottom:'28px'}}>
              {['Earn ₹600–₹750 extra per month','No fixed hours or targets','We handle everything for you','Weekly payouts to your UPI'].map(p=>(
                <div key={p} style={{display:'flex',alignItems:'center',gap:'10px',fontSize:'.88rem',color:'#374151'}}>
                  <div style={{width:'20px',height:'20px',background:'#D1FAE5',border:'1px solid #A7F3D0',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontSize:'.75rem',color:'#059669'}}>✓</div>
                  {p}
                </div>
              ))}
            </div>
            <button onClick={()=>scrollTo('register')} style={{width:'100%',justifyContent:'center',background:'linear-gradient(135deg,#10B981,#059669)',color:'#fff',fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:'.95rem',padding:'14px',border:'none',borderRadius:'12px',cursor:'pointer',display:'flex',alignItems:'center',gap:'8px',boxShadow:'0 4px 14px rgba(16,185,129,.35)',transition:'all .2s'}}>
              Join as a Driver →
            </button>
          </div>
        </div>
      </div>
    </div>

    {/* ═══════════════════════════ STATS BAND ═══════════════════════════ */}
    <div style={{background:'linear-gradient(135deg,#0F172A 0%,#1E293B 100%)',padding:'64px 32px'}}>
      <div style={{maxWidth:'900px',margin:'0 auto',display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:'32px',textAlign:'center'}}>
        {[['90','min','Avg. Time to Go Live'],['₹1,500','/mo','Starting Price'],['100+','brands','Trust AdWheels'],['2','cities','Indore & Bhopal']].map(([n,u,l])=>(
          <div key={l} className="reveal">
            <div style={{fontFamily:'Bebas Neue',fontSize:'3.2rem',color:'#FFBF00',lineHeight:1}}>{n}<span style={{fontFamily:'DM Sans',fontSize:'1rem',color:'rgba(255,255,255,.4)'}}> {u}</span></div>
            <div style={{fontSize:'.8rem',color:'rgba(255,255,255,.55)',textTransform:'uppercase',letterSpacing:'.08em',marginTop:'6px',fontWeight:700}}>{l}</div>
          </div>
        ))}
      </div>
    </div>

    {/* ═══════════════════════════ PRICING ═══════════════════════════ */}
    <div id="pricing" style={{background:'#FFFFFF'}}>
      <div style={{maxWidth:'1100px',margin:'0 auto',padding:'96px 32px'}} className="lp-sec">
        <div style={{textAlign:'center',maxWidth:'560px',margin:'0 auto 60px'}}>
          <div className="reveal" style={{display:'inline-block',background:'#F0FDF4',border:'1px solid #A7F3D0',borderRadius:'100px',padding:'5px 14px',fontSize:'.75rem',fontWeight:800,color:'#065F46',letterSpacing:'.08em',textTransform:'uppercase',marginBottom:'16px'}}>Simple Pricing</div>
          <h2 className="reveal" style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:'clamp(1.8rem,4vw,2.8rem)',fontWeight:800,letterSpacing:'-.02em',color:'#0F172A',lineHeight:1.15,marginBottom:'14px'}}>
            Honest Pricing, <span className="grad-text">No Surprises</span>
          </h2>
          <p className="reveal" style={{color:'#64748B',fontSize:'1.05rem',lineHeight:1.65}}>No setup fees. No hidden charges. Cancel any time.</p>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(230px,1fr))',gap:'20px'}}>
          {PLANS.map(plan=>(
            <div key={plan.name} className="reveal plan-card" style={{background:plan.bg,border:plan.tag?`2px solid ${plan.accent}`:'1.5px solid #F1F5F9',boxShadow:plan.tag?`0 8px 32px ${plan.accent}20`:'0 2px 12px rgba(0,0,0,.04)'}}>
              {plan.tag && <div style={{position:'absolute',top:'-13px',left:'50%',transform:'translateX(-50%)',background:plan.accent,color:'#fff',fontSize:'.63rem',fontWeight:800,letterSpacing:'.1em',textTransform:'uppercase',padding:'5px 16px',borderRadius:'100px',whiteSpace:'nowrap'}}>{plan.tag}</div>}
              <div style={{fontSize:'.72rem',fontWeight:700,letterSpacing:'.12em',textTransform:'uppercase',color:'#94A3B8',marginBottom:'10px'}}>{plan.name}</div>
              <div style={{fontFamily:'Bebas Neue',fontSize:'2.8rem',color:plan.accent,lineHeight:1,marginBottom:'4px'}}>{plan.price}<span style={{fontFamily:'DM Sans',fontSize:'.9rem',color:'#94A3B8'}}> / {plan.mo}</span></div>
              <div style={{fontSize:'.83rem',color:'#64748B',marginBottom:'20px'}}>{plan.rickshaws} rickshaw{plan.rickshaws>1?'s':''}</div>
              <div style={{display:'flex',flexDirection:'column',gap:'8px',marginBottom:'24px'}}>
                {plan.features.map(f=>(
                  <div key={f} style={{display:'flex',gap:'8px',fontSize:'.85rem',color:'#374151',alignItems:'flex-start'}}>
                    <span className="feat-check">✓</span>{f}
                  </div>
                ))}
              </div>
              <button onClick={onGetStarted} style={{width:'100%',justifyContent:'center',background:plan.tag?plan.accent:'#0F172A',color:'#fff',fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:'.9rem',padding:'13px',border:'none',borderRadius:'10px',cursor:'pointer',display:'flex',alignItems:'center',transition:'all .2s'}}>
                Get Started →
              </button>
            </div>
          ))}

          {/* Enterprise */}
          <div className="reveal plan-card" style={{background:'linear-gradient(135deg,#FAF5FF,#EDE9FE)',border:'1.5px solid #C4B5FD'}}>
            <div style={{fontSize:'.72rem',fontWeight:700,letterSpacing:'.12em',textTransform:'uppercase',color:'#7C3AED',marginBottom:'10px'}}>Enterprise</div>
            <div style={{fontFamily:'Bebas Neue',fontSize:'2.8rem',color:'#7C3AED',lineHeight:1,marginBottom:'4px'}}>Custom</div>
            <div style={{fontSize:'.83rem',color:'#64748B',marginBottom:'20px'}}>25+ rickshaws · All cities</div>
            <div style={{display:'flex',flexDirection:'column',gap:'8px',marginBottom:'24px'}}>
              {['25+ Rickshaws','All Cities','Dedicated Manager','Custom Pricing','Custom Reports'].map(f=>(
                <div key={f} style={{display:'flex',gap:'8px',fontSize:'.85rem',color:'#374151',alignItems:'flex-start'}}>
                  <span style={{color:'#7C3AED',fontWeight:700,flexShrink:0}}>✓</span>{f}
                </div>
              ))}
            </div>
            <button onClick={()=>scrollTo('enterprise')} style={{width:'100%',justifyContent:'center',background:'transparent',color:'#7C3AED',fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:'.9rem',padding:'13px',border:'2px solid #7C3AED',borderRadius:'10px',cursor:'pointer',display:'flex',alignItems:'center',transition:'all .2s'}}>
              Get Custom Quote →
            </button>
          </div>
        </div>
      </div>
    </div>

    {/* ═══════════════════════════ ENTERPRISE ═══════════════════════════ */}
    <div id="enterprise" style={{background:'#F8FAFC',borderTop:'1px solid #EDE9FE',borderBottom:'1px solid #EDE9FE'}}>
      <div style={{maxWidth:'1100px',margin:'0 auto',padding:'96px 32px'}} className="lp-sec">
        <div className="two-col" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'64px',alignItems:'start'}}>
          <div>
            <div className="reveal" style={{display:'inline-block',background:'#FAF5FF',border:'1px solid #DDD6FE',borderRadius:'100px',padding:'5px 14px',fontSize:'.75rem',fontWeight:800,color:'#6D28D9',letterSpacing:'.08em',textTransform:'uppercase',marginBottom:'16px'}}>Enterprise</div>
            <h2 className="reveal" style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:'clamp(1.8rem,4vw,2.6rem)',fontWeight:800,letterSpacing:'-.02em',color:'#0F172A',lineHeight:1.15,marginBottom:'16px'}}>
              Big Brand?<br/><span style={{color:'#7C3AED'}}>Let's Build Something Big.</span>
            </h2>
            <p className="reveal" style={{color:'#64748B',fontSize:'1rem',lineHeight:1.7,marginBottom:'40px',maxWidth:'420px'}}>
              25+ rickshaws, both cities, dedicated account manager. We'll design a custom plan around your goals and call you within 2 hours.
            </p>

            <div className="reveal" style={{display:'flex',flexDirection:'column',gap:'20px'}}>
              {[['🛺','Fleet Scale','25+ rickshaws blanketing both cities with your brand'],['👔','Dedicated Manager','A real human who owns your campaign from start to finish'],['📊','Custom Reports','Daily photo proofs, route maps and impression data'],['⚡','90-Min Activation','Same fast launch — even at massive fleet scale'],['💰','Volume Pricing','Best rates in the market for high-volume campaigns']].map(([icon,title,desc])=>(
                <div key={title} style={{display:'flex',gap:'16px',alignItems:'flex-start'}}>
                  <div style={{width:'44px',height:'44px',background:'#EDE9FE',border:'1px solid #DDD6FE',borderRadius:'12px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.2rem',flexShrink:0}}>{icon}</div>
                  <div>
                    <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:700,fontSize:'.95rem',color:'#0F172A',marginBottom:'3px'}}>{title}</div>
                    <div style={{fontSize:'.84rem',color:'#64748B',lineHeight:1.55}}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="reveal lp-card" style={{border:'1.5px solid #DDD6FE',background:'#fff'}}>
            {entDone ? (
              <div style={{textAlign:'center',padding:'32px 0'}}>
                <div style={{fontSize:'3rem',marginBottom:'16px'}}>🎉</div>
                <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:'1.2rem',color:'#7C3AED',marginBottom:'8px'}}>We'll Call You!</div>
                <p style={{color:'#64748B',fontSize:'.9rem',lineHeight:1.65}}>Our enterprise team will call you within 2 hours with a custom proposal.</p>
              </div>
            ) : (
              <>
                <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:'1.2rem',color:'#7C3AED',marginBottom:'4px'}}>Request Enterprise Quote</div>
                <div style={{fontSize:'.83rem',color:'#94A3B8',marginBottom:'24px'}}>We call back within 2 hours</div>

                {[{l:'Company / Brand Name *',k:'company',ph:'e.g. Big Bazaar, Dominos…'},{l:'Your Name *',k:'name',ph:'Full name'},{l:'Phone *',k:'phone',ph:'+91 XXXXX XXXXX'},{l:'Email',k:'email',ph:'you@company.com',type:'email'}].map(f=>(
                  <div key={f.k}>
                    <label className="lp-lbl">{f.l}</label>
                    <input className="lp-inp" placeholder={f.ph} type={f.type||'text'} value={entForm[f.k]} onChange={e=>setEntForm(p=>({...p,[f.k]:e.target.value}))}/>
                  </div>
                ))}

                <label className="lp-lbl">City</label>
                <select className="lp-inp" style={{appearance:'none',WebkitAppearance:'none',cursor:'pointer'}} value={entForm.city} onChange={e=>setEntForm(p=>({...p,city:e.target.value}))}>
                  <option value="">Select city</option>
                  <option value="indore">Indore</option><option value="bhopal">Bhopal</option><option value="both">Both Cities</option>
                </select>

                <label className="lp-lbl">Message</label>
                <textarea className="lp-inp" placeholder="Campaign goals, timeline, budget range…" value={entForm.message} onChange={e=>setEntForm(p=>({...p,message:e.target.value}))} style={{minHeight:'80px',resize:'vertical'}}/>

                <button onClick={submitEnt} disabled={entBusy} style={{width:'100%',justifyContent:'center',background:'linear-gradient(135deg,#7C3AED,#6D28D9)',color:'#fff',fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:'1rem',padding:'15px',border:'none',borderRadius:'12px',cursor:'pointer',display:'flex',alignItems:'center',gap:'8px',boxShadow:'0 4px 16px rgba(124,58,237,.35)',opacity:entBusy?.6:1,transition:'all .2s'}}>
                  {entBusy?'Sending…':'🚀 Request Enterprise Quote'}
                </button>
                <p style={{fontSize:'.76rem',color:'#94A3B8',textAlign:'center',marginTop:'10px'}}>Your data is private & secure. We never spam.</p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>

    {/* ═══════════════════════════ REGISTER ═══════════════════════════ */}
    <div id="register" style={{background:'#FFFFFF'}}>
      <div style={{maxWidth:'1100px',margin:'0 auto',padding:'96px 32px'}} className="lp-sec">
        <div className="two-col" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'64px',alignItems:'start'}}>
          <div>
            <div className="reveal" style={{display:'inline-block',background:'#FFFBEB',border:'1px solid #FDE68A',borderRadius:'100px',padding:'5px 14px',fontSize:'.75rem',fontWeight:800,color:'#92400E',letterSpacing:'.08em',textTransform:'uppercase',marginBottom:'16px'}}>Join AdWheels</div>
            <h2 className="reveal" style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:'clamp(1.8rem,4vw,2.6rem)',fontWeight:800,letterSpacing:'-.02em',color:'#0F172A',lineHeight:1.15,marginBottom:'16px'}}>
              Register <span className="grad-text">Right Now</span>
            </h2>
            <p className="reveal" style={{color:'#64748B',fontSize:'1rem',lineHeight:1.7,marginBottom:'36px',maxWidth:'400px'}}>
              We're onboarding our first batch of advertisers and drivers in Indore & Bhopal. Early registrants get exclusive benefits.
            </p>

            <div className="reveal" style={{display:'flex',flexDirection:'column',gap:'18px'}}>
              {[['⚡','Early Bird Discount','First 20 advertisers get 20% off their first month — no code needed.'],['🛺','Driver Signup Bonus','First 50 drivers get ₹200 extra on their first payout.'],['📞','Personal Onboarding','Our team personally calls every registrant within 24 hours.']].map(([icon,title,desc])=>(
                <div key={title} style={{display:'flex',gap:'16px',alignItems:'flex-start',background:'#FAFAFA',border:'1px solid #F1F5F9',borderRadius:'14px',padding:'16px 18px'}}>
                  <div style={{width:'40px',height:'40px',background:'#FFFBEB',border:'1px solid #FDE68A',borderRadius:'12px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.2rem',flexShrink:0}}>{icon}</div>
                  <div>
                    <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:700,fontSize:'.93rem',color:'#0F172A',marginBottom:'3px'}}>{title}</div>
                    <div style={{fontSize:'.83rem',color:'#64748B',lineHeight:1.55}}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="reveal lp-card">
            {regDone ? (
              <div style={{textAlign:'center',padding:'28px 0'}}>
                <div style={{fontSize:'3rem',marginBottom:'14px'}}>🎉</div>
                <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:'1.2rem',color:'#0F172A',marginBottom:'8px'}}>You're In!</div>
                <p style={{color:'#64748B',fontSize:'.9rem',lineHeight:1.65}}>Our team will call you within <b>24 hours</b>. Get ready to go live! 🚀</p>
                <button className="btn-pri" onClick={onGetStarted} style={{marginTop:'22px',width:'100%',justifyContent:'center'}}>Create Your Account →</button>
              </div>
            ) : (
              <>
                <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:'1.15rem',color:'#0F172A',marginBottom:'4px'}}>Register Interest</div>
                <div style={{fontSize:'.83rem',color:'#94A3B8',marginBottom:'22px'}}>60 seconds. We'll handle the rest.</div>

                {/* Toggle */}
                <div style={{display:'flex',gap:'4px',background:'#F1F5F9',borderRadius:'10px',padding:'4px',marginBottom:'20px'}}>
                  {['advertiser','driver'].map(t=>(
                    <button key={t} onClick={()=>setActiveTab(t)} style={{flex:1,padding:'10px',border:'none',borderRadius:'7px',fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:'.85rem',fontWeight:700,cursor:'pointer',background:activeTab===t?'#fff':'transparent',color:activeTab===t?'#0F172A':'#64748B',boxShadow:activeTab===t?'0 2px 8px rgba(0,0,0,.08)':'none',transition:'all .18s'}}>
                      {t==='advertiser'?'🏢 Advertiser':'🛺 Driver'}
                    </button>
                  ))}
                </div>

                {[{l:'Full Name',k:'name',ph:'Your full name'},{l:'Mobile Number',k:'phone',ph:'+91 XXXXX XXXXX'}].map(f=>(
                  <div key={f.k}>
                    <label className="lp-lbl">{f.l}</label>
                    <input className="lp-inp" placeholder={f.ph} value={regForm[f.k]} onChange={e=>setRegForm(p=>({...p,[f.k]:e.target.value}))}/>
                  </div>
                ))}

                <label className="lp-lbl">City</label>
                <select className="lp-inp" style={{appearance:'none',WebkitAppearance:'none',cursor:'pointer'}} value={regForm.city} onChange={e=>setRegForm(p=>({...p,city:e.target.value}))}>
                  <option value="">Select city</option>
                  <option value="indore">Indore</option><option value="bhopal">Bhopal</option>
                </select>

                {activeTab==='advertiser' && <>
                  <label className="lp-lbl">Business / Brand Name</label>
                  <input className="lp-inp" placeholder="e.g. Sharma Electronics" value={regForm.business} onChange={e=>setRegForm(p=>({...p,business:e.target.value}))}/>
                  <label className="lp-lbl">Monthly Budget</label>
                  <select className="lp-inp" style={{appearance:'none',WebkitAppearance:'none',cursor:'pointer'}} value={regForm.budget} onChange={e=>setRegForm(p=>({...p,budget:e.target.value}))}>
                    <option value="">Select budget</option>
                    <option>Under ₹3,000</option><option>₹3,000 – ₹7,000</option>
                    <option>₹7,000 – ₹15,000</option><option>₹15,000+</option>
                  </select>
                </>}

                {activeTab==='driver' && <>
                  <label className="lp-lbl">Main Route / Area</label>
                  <input className="lp-inp" placeholder="e.g. Vijay Nagar to Palasia" value={regForm.area} onChange={e=>setRegForm(p=>({...p,area:e.target.value}))}/>
                </>}

                <button className="btn-pri" onClick={submitReg} style={{width:'100%',justifyContent:'center',marginTop:'4px',fontSize:'1rem',padding:'15px'}}>
                  Register Now — It's Free →
                </button>
                <p style={{fontSize:'.76rem',color:'#94A3B8',textAlign:'center',marginTop:'10px'}}>🔒 Your data is private. We never spam.</p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>

    {/* ═══════════════════════════ FOOTER ═══════════════════════════ */}
    <footer style={{background:'#0F172A',color:'#fff',padding:'56px 32px 36px'}}>
      <div style={{maxWidth:'1100px',margin:'0 auto'}}>
        <div className="two-col" style={{display:'grid',gridTemplateColumns:'1.5fr 1fr 1fr',gap:'48px',marginBottom:'48px'}}>
          <div>
            <div style={{fontFamily:'Bebas Neue',fontSize:'2rem',color:'#FFBF00',letterSpacing:'.06em',marginBottom:'10px'}}>AdWheels</div>
            <p style={{color:'rgba(255,255,255,.5)',fontSize:'.88rem',lineHeight:1.7,maxWidth:'280px'}}>India's fastest rickshaw advertising platform. Get your ad on roads in 90 minutes.</p>
            <div style={{display:'flex',gap:'10px',marginTop:'20px'}}>
              {['📍 Indore','📍 Bhopal'].map(c=>(
                <span key={c} style={{background:'rgba(255,255,255,.07)',border:'1px solid rgba(255,255,255,.1)',borderRadius:'8px',padding:'6px 12px',fontSize:'.78rem',color:'rgba(255,255,255,.6)',fontWeight:600}}>{c}</span>
              ))}
            </div>
          </div>
          <div>
            <div style={{fontWeight:700,fontSize:'.8rem',letterSpacing:'.08em',textTransform:'uppercase',color:'rgba(255,255,255,.4)',marginBottom:'16px'}}>Platform</div>
            {[['How It Works','how'],['Pricing','pricing'],['Enterprise','enterprise'],['For Drivers','register']].map(([l,id])=>(
              <button key={id} onClick={()=>scrollTo(id)} style={{display:'block',background:'none',border:'none',color:'rgba(255,255,255,.6)',fontSize:'.88rem',cursor:'pointer',padding:'5px 0',textAlign:'left',fontFamily:'DM Sans,sans-serif',transition:'color .2s',marginBottom:'2px'}}
                onMouseEnter={e=>e.target.style.color='#fff'} onMouseLeave={e=>e.target.style.color='rgba(255,255,255,.6)'}>
                {l}
              </button>
            ))}
          </div>
          <div>
            <div style={{fontWeight:700,fontSize:'.8rem',letterSpacing:'.08em',textTransform:'uppercase',color:'rgba(255,255,255,.4)',marginBottom:'16px'}}>Get Started</div>
            <button className="btn-pri" onClick={onGetStarted} style={{width:'100%',justifyContent:'center',marginBottom:'10px'}}>Launch My Ad →</button>
            <button onClick={()=>scrollTo('register')} style={{width:'100%',justifyContent:'center',background:'rgba(255,255,255,.07)',border:'1px solid rgba(255,255,255,.12)',color:'rgba(255,255,255,.8)',fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:700,fontSize:'.9rem',padding:'13px',borderRadius:'12px',cursor:'pointer',display:'flex',alignItems:'center',transition:'all .2s'}}>
              Join as Driver
            </button>
          </div>
        </div>
        <div style={{borderTop:'1px solid rgba(255,255,255,.08)',paddingTop:'24px',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:'12px'}}>
          <div style={{fontSize:'.82rem',color:'rgba(255,255,255,.35)'}}>© 2024 AdWheels. All rights reserved.</div>
          <div style={{fontSize:'.82rem',color:'rgba(255,255,255,.35)'}}>Made with ❤️ for Indore & Bhopal</div>
        </div>
      </div>
    </footer>

    </div>
  )
}