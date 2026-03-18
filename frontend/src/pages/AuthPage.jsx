import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const INP = {width:'100%',padding:'13px 15px',fontSize:'.95rem',border:'1.5px solid #E2E8F0',borderRadius:'10px',background:'#fff',color:'#0F172A',outline:'none',fontFamily:'inherit',marginBottom:'14px',transition:'border-color .2s,box-shadow .2s'}
const LBL = {display:'block',fontSize:'.74rem',fontWeight:700,letterSpacing:'.06em',textTransform:'uppercase',color:'#64748B',marginBottom:'6px'}
const BTN = {width:'100%',padding:'14px',background:'linear-gradient(135deg,#FFBF00,#FF8C00)',color:'#111',fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:'1rem',border:'none',borderRadius:'12px',cursor:'pointer',boxShadow:'0 4px 14px rgba(255,191,0,.4)',transition:'all .2s',display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',letterSpacing:'-.01em'}

export default function AuthPage({ setupMode = false, userId = null } = {}) {
  const [screen, setScreen] = useState(setupMode ? 'role' : 'login')
  const [role,   setRole]   = useState(null)
  const [busy,   setBusy]   = useState(false)
  const [form,   setForm]   = useState({ email:'',password:'',full_name:'',phone:'',city:'',vehicle_number:'',upi_id:'' })
  const { fetchProfile } = useAuth()
  const up = (k,v) => setForm(f=>({...f,[k]:v}))

  async function doLogin() {
    if (!form.email||!form.password) return toast.error('Enter your email and password')
    setBusy(true)
    const {error} = await supabase.auth.signInWithPassword({email:form.email,password:form.password})
    if (error) toast.error(error.message)
    setBusy(false)
  }

  async function doForgot() {
    if (!form.email) return toast.error('Enter your email first')
    const {error} = await supabase.auth.resetPasswordForEmail(form.email,{redirectTo:`${window.location.origin}/reset-password`})
    if (error) toast.error(error.message)
    else toast.success('Reset link sent to your email 📧')
  }

  async function doSignup() {
    if (!form.full_name||!form.phone||!form.city) return toast.error('Please fill all required fields')
    if (!setupMode&&(!form.email||!form.password)) return toast.error('Enter email and password')
    if (!setupMode&&form.password.length<6) return toast.error('Password must be at least 6 characters')
    setBusy(true)
    if (setupMode&&userId) {
      const {error} = await supabase.from('users').upsert({id:userId,full_name:form.full_name,phone:form.phone,city:form.city,role,upi_id:form.upi_id||null,vehicle_number:form.vehicle_number||null})
      if (error) toast.error(error.message)
      else { toast.success('Setup complete! Welcome 🎉'); await fetchProfile(userId) }
      setBusy(false); return
    }
    const {data,error} = await supabase.auth.signUp({email:form.email,password:form.password})
    if (error) { toast.error(error.message); setBusy(false); return }
    const {error:pe} = await supabase.from('users').insert({id:data.user.id,full_name:form.full_name,phone:form.phone,city:form.city,role,upi_id:form.upi_id||null,vehicle_number:form.vehicle_number||null})
    if (pe) toast.error(pe.message)
    else toast.success('Account created! Welcome to AdWheels 🎉')
    setBusy(false)
  }

  const STEPS = ['role','details','account']
  const stepIdx = STEPS.indexOf(screen)

  return (
    <div style={{minHeight:'100vh',display:'flex',fontFamily:"'DM Sans',sans-serif"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=Bebas+Neue&family=DM+Sans:wght@400;500;600&display=swap');
      .auth-inp:focus{border-color:#FFBF00!important;box-shadow:0 0 0 3px rgba(255,191,0,.12)!important}
      .auth-btn:hover{transform:translateY(-1px);box-shadow:0 8px 20px rgba(255,140,0,.45)!important}
      .role-card:hover{transform:translateY(-3px);box-shadow:0 10px 28px rgba(0,0,0,.1)!important}
      @media(max-width:768px){.auth-left{display:none!important}}`}
      </style>

      {/* ── Left panel (decorative) ── */}
      <div className="auth-left" style={{flex:'0 0 42%',background:'linear-gradient(160deg,#0F172A 0%,#1E293B 60%,#0F172A 100%)',display:'flex',flexDirection:'column',justifyContent:'space-between',padding:'48px',position:'relative',overflow:'hidden'}}>
        {/* bg decoration */}
        <div style={{position:'absolute',top:'-80px',right:'-80px',width:'380px',height:'380px',background:'radial-gradient(circle,rgba(255,191,0,.18) 0%,transparent 65%)',pointerEvents:'none'}}/>
        <div style={{position:'absolute',bottom:'-60px',left:'-60px',width:'300px',height:'300px',background:'radial-gradient(circle,rgba(124,58,237,.15) 0%,transparent 65%)',pointerEvents:'none'}}/>

        <div style={{position:'relative',zIndex:1}}>
          <div style={{fontFamily:'Bebas Neue',fontSize:'2.2rem',color:'#FFBF00',letterSpacing:'.06em',marginBottom:'4px'}}>AdWheels</div>
          <div style={{fontSize:'.83rem',color:'rgba(255,255,255,.45)'}}>Your ad on roads in 90 minutes</div>
        </div>

        <div style={{position:'relative',zIndex:1}}>
          <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:'1.9rem',fontWeight:800,color:'#fff',lineHeight:1.2,marginBottom:'24px'}}>
            Reach thousands<br/>of people daily<br/>
            <span style={{background:'linear-gradient(135deg,#FFBF00,#FF8C00)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text'}}>in your city.</span>
          </div>

          <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>
            {[['🛺','Live in 90 minutes','Upload and your ad is on the road today'],['📍','Indore & Bhopal','Hyperlocal targeting in both cities'],['💰','Starting at ₹1,500','The most affordable ad channel in the city']].map(([icon,title,sub])=>(
              <div key={title} style={{display:'flex',gap:'14px',alignItems:'flex-start',background:'rgba(255,255,255,.05)',border:'1px solid rgba(255,255,255,.08)',borderRadius:'14px',padding:'14px 16px'}}>
                <span style={{fontSize:'1.3rem',flexShrink:0}}>{icon}</span>
                <div>
                  <div style={{fontWeight:700,fontSize:'.9rem',color:'#fff',marginBottom:'2px'}}>{title}</div>
                  <div style={{fontSize:'.8rem',color:'rgba(255,255,255,.45)'}}>{sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{position:'relative',zIndex:1,fontSize:'.78rem',color:'rgba(255,255,255,.25)'}}>© 2024 AdWheels. All rights reserved.</div>
      </div>

      {/* ── Right panel (form) ── */}
      <div style={{flex:1,background:'#F8FAFC',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'32px 24px',overflowY:'auto'}}>
        <div style={{width:'100%',maxWidth:'420px'}}>

          {/* ── LOGIN ── */}
          {screen==='login' && (
            <div style={{background:'#fff',borderRadius:'24px',padding:'40px 36px',boxShadow:'0 8px 40px rgba(0,0,0,.08)',border:'1px solid #F1F5F9'}}>
              <div style={{marginBottom:'28px'}}>
                <h1 style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:'1.7rem',color:'#0F172A',marginBottom:'6px'}}>Welcome back 👋</h1>
                <p style={{color:'#64748B',fontSize:'.92rem'}}>Login to your AdWheels account</p>
              </div>

              <label style={LBL}>Email Address</label>
              <input style={INP} className="auth-inp" type="email" placeholder="you@email.com" value={form.email} onChange={e=>up('email',e.target.value)} onKeyDown={e=>e.key==='Enter'&&doLogin()}/>

              <label style={LBL}>Password</label>
              <input style={INP} className="auth-inp" type="password" placeholder="Your password" value={form.password} onChange={e=>up('password',e.target.value)} onKeyDown={e=>e.key==='Enter'&&doLogin()}/>

              <button style={BTN} className="auth-btn" onClick={doLogin} disabled={busy}>{busy?'Logging in…':'Login to AdWheels →'}</button>

              <button onClick={doForgot} style={{display:'block',width:'100%',marginTop:'14px',background:'none',border:'none',color:'#64748B',fontSize:'.87rem',cursor:'pointer',textAlign:'center',textDecoration:'underline',fontFamily:'DM Sans,sans-serif'}}>
                Forgot password?
              </button>

              <div style={{borderTop:'1px solid #F1F5F9',marginTop:'24px',paddingTop:'20px',textAlign:'center',fontSize:'.9rem',color:'#64748B'}}>
                Don't have an account?{' '}
                <button onClick={()=>setScreen('role')} style={{background:'none',border:'none',color:'#D97706',fontWeight:700,cursor:'pointer',fontSize:'.9rem',fontFamily:'DM Sans,sans-serif'}}>Sign up free</button>
              </div>
            </div>
          )}

          {/* ── ROLE STEP ── */}
          {(screen==='role'||setupMode) && screen!=='details' && screen!=='account' && (
            <div style={{background:'#fff',borderRadius:'24px',padding:'40px 36px',boxShadow:'0 8px 40px rgba(0,0,0,.08)',border:'1px solid #F1F5F9'}}>
              <div style={{marginBottom:'28px'}}>
                <h1 style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:'1.7rem',color:'#0F172A',marginBottom:'6px'}}>I am a…</h1>
                <p style={{color:'#64748B',fontSize:'.92rem'}}>Select what best describes you</p>
              </div>

              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px',marginBottom:'28px'}}>
                {[{r:'advertiser',emoji:'🏢',title:'Business Owner',sub:'I want to run ads',bg:'#FFFBEB',border:'#FFBF00',selBg:'#FEF3C7'},{r:'driver',emoji:'🛺',title:'Rickshaw Driver',sub:'I want to earn extra',bg:'#F0FDF4',border:'#10B981',selBg:'#D1FAE5'}].map(({r,emoji,title,sub,bg,border,selBg})=>(
                  <div key={r} className="role-card" onClick={()=>setRole(r)} style={{border:`2px solid ${role===r?border:'#E2E8F0'}`,borderRadius:'16px',padding:'24px 16px',textAlign:'center',cursor:'pointer',background:role===r?selBg:'#FAFAFA',transition:'all .18s',boxShadow:role===r?`0 6px 20px ${border}30`:'none'}}>
                    <div style={{fontSize:'2.4rem',marginBottom:'10px'}}>{emoji}</div>
                    <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:'1rem',color:role===r?'#0F172A':'#374151',marginBottom:'4px'}}>{title}</div>
                    <div style={{fontSize:'.78rem',color:'#94A3B8'}}>{sub}</div>
                  </div>
                ))}
              </div>

              <button style={{...BTN,background:role?'linear-gradient(135deg,#FFBF00,#FF8C00)':'#E2E8F0',color:role?'#111':'#94A3B8',boxShadow:role?'0 4px 14px rgba(255,191,0,.4)':'none',cursor:role?'pointer':'default'}} onClick={()=>{if(!role)return toast.error('Please select one');setScreen('details')}}>
                Continue →
              </button>

              {!setupMode && (
                <div style={{textAlign:'center',marginTop:'18px',fontSize:'.9rem',color:'#64748B'}}>
                  Already have an account?{' '}
                  <button onClick={()=>setScreen('login')} style={{background:'none',border:'none',color:'#D97706',fontWeight:700,cursor:'pointer',fontSize:'.9rem',fontFamily:'DM Sans,sans-serif'}}>Login</button>
                </div>
              )}
            </div>
          )}

          {/* ── DETAILS STEP ── */}
          {screen==='details' && (
            <div style={{background:'#fff',borderRadius:'24px',padding:'40px 36px',boxShadow:'0 8px 40px rgba(0,0,0,.08)',border:'1px solid #F1F5F9'}}>
              {/* Progress */}
              <div style={{display:'flex',gap:'6px',marginBottom:'28px'}}>
                {['role','details','account'].map((_,i)=>(
                  <div key={i} style={{flex:1,height:'4px',borderRadius:'4px',background: i<=1?'#FFBF00':'#E2E8F0',transition:'background .3s'}}/>
                ))}
              </div>

              <div style={{marginBottom:'24px'}}>
                <h1 style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:'1.6rem',color:'#0F172A',marginBottom:'6px'}}>{role==='driver'?'Driver Details':'Your Details'}</h1>
                <p style={{color:'#64748B',fontSize:'.9rem'}}>Just a few quick fields to get you started</p>
              </div>

              {[{k:'full_name',l:'Full Name',ph:'e.g. Rahul Sharma',type:'text'},{k:'phone',l:'Mobile Number',ph:'e.g. 98765 43210',type:'tel'}].map(f=>(
                <div key={f.k}>
                  <label style={LBL}>{f.l}</label>
                  <input style={INP} className="auth-inp" type={f.type} placeholder={f.ph} value={form[f.k]} onChange={e=>up(f.k,e.target.value)}/>
                </div>
              ))}

              <label style={LBL}>City</label>
              <select style={{...INP,appearance:'none',WebkitAppearance:'none',cursor:'pointer'}} className="auth-inp" value={form.city} onChange={e=>up('city',e.target.value)}>
                <option value="">Select your city</option>
                <option value="indore">📍 Indore</option>
                <option value="bhopal">📍 Bhopal</option>
              </select>

              {role==='driver' && <>
                <label style={LBL}>Rickshaw Number <span style={{color:'#94A3B8',fontWeight:400,textTransform:'none',letterSpacing:0}}>(optional)</span></label>
                <input style={INP} className="auth-inp" placeholder="e.g. MP09 AB 1234" value={form.vehicle_number} onChange={e=>up('vehicle_number',e.target.value)}/>
                <label style={LBL}>UPI ID <span style={{color:'#94A3B8',fontWeight:400,textTransform:'none',letterSpacing:0}}>(for payouts)</span></label>
                <input style={INP} className="auth-inp" placeholder="e.g. rahul@paytm" value={form.upi_id} onChange={e=>up('upi_id',e.target.value)}/>
              </>}

              <button style={BTN} className="auth-btn" onClick={()=>setScreen('account')}>Next →</button>
              <button onClick={()=>setScreen('role')} style={{display:'block',width:'100%',marginTop:'12px',background:'none',border:'none',color:'#94A3B8',fontSize:'.87rem',cursor:'pointer',textAlign:'center',fontFamily:'DM Sans,sans-serif'}}>← Go back</button>
            </div>
          )}

          {/* ── ACCOUNT STEP ── */}
          {screen==='account' && !setupMode && (
            <div style={{background:'#fff',borderRadius:'24px',padding:'40px 36px',boxShadow:'0 8px 40px rgba(0,0,0,.08)',border:'1px solid #F1F5F9'}}>
              <div style={{display:'flex',gap:'6px',marginBottom:'28px'}}>
                {['role','details','account'].map((_,i)=>(
                  <div key={i} style={{flex:1,height:'4px',borderRadius:'4px',background:'#FFBF00'}}/>
                ))}
              </div>

              <div style={{marginBottom:'24px'}}>
                <h1 style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:'1.6rem',color:'#0F172A',marginBottom:'6px'}}>Create Login</h1>
                <p style={{color:'#64748B',fontSize:'.9rem'}}>Set your email & password to secure your account</p>
              </div>

              <label style={LBL}>Email Address</label>
              <input style={INP} className="auth-inp" type="email" placeholder="you@email.com" value={form.email} onChange={e=>up('email',e.target.value)}/>

              <label style={LBL}>Password</label>
              <input style={INP} className="auth-inp" type="password" placeholder="Min. 6 characters" value={form.password} onChange={e=>up('password',e.target.value)}/>

              <div style={{background:'#F0FDF4',border:'1px solid #A7F3D0',borderRadius:'10px',padding:'12px 14px',marginBottom:'18px',fontSize:'.84rem',color:'#065F46',display:'flex',gap:'8px',alignItems:'flex-start'}}>
                <span style={{flexShrink:0}}>🔒</span> Your data is safe and private. We never share it with anyone.
              </div>

              <button style={BTN} className="auth-btn" onClick={doSignup} disabled={busy}>{busy?'Creating Account…':'✅ Create My Account'}</button>
              <button onClick={()=>setScreen('details')} style={{display:'block',width:'100%',marginTop:'12px',background:'none',border:'none',color:'#94A3B8',fontSize:'.87rem',cursor:'pointer',textAlign:'center',fontFamily:'DM Sans,sans-serif'}}>← Go back</button>
            </div>
          )}

          {/* setupMode confirm */}
          {screen==='account' && setupMode && (
            <div style={{background:'#fff',borderRadius:'24px',padding:'40px 36px',boxShadow:'0 8px 40px rgba(0,0,0,.08)',border:'1px solid #F1F5F9'}}>
              <h1 style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:'1.6rem',color:'#0F172A',marginBottom:'16px'}}>Almost done! 🎉</h1>
              <div style={{background:'#F0FDF4',border:'1px solid #A7F3D0',borderRadius:'14px',padding:'20px',marginBottom:'22px',fontSize:'.9rem',color:'#065F46',lineHeight:1.7}}>
                ✅ Name: <b>{form.full_name}</b><br/>📞 Phone: <b>{form.phone}</b><br/>📍 City: <b>{form.city}</b><br/>👤 Role: <b>{role==='driver'?'Rickshaw Driver':'Advertiser'}</b>
              </div>
              <button style={BTN} className="auth-btn" onClick={doSignup} disabled={busy}>{busy?'Saving…':'✅ Confirm & Continue'}</button>
              <button onClick={()=>setScreen('details')} style={{display:'block',width:'100%',marginTop:'12px',background:'none',border:'none',color:'#94A3B8',fontSize:'.87rem',cursor:'pointer',textAlign:'center',fontFamily:'DM Sans,sans-serif'}}>← Edit details</button>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}