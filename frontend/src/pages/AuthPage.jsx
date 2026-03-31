import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { Truck, Building2, ChevronRight, ChevronLeft, Lock, Mail, User, Phone, MapPin, Calendar, Fuel, Maximize, Camera, CheckCircle, Zap, Bike, Eye, EyeOff } from 'lucide-react'

const INP = {width:'100%',padding:'13px 15px',fontSize:'.95rem',border:'1.5px solid #E2E8F0',borderRadius:'10px',background:'#fff',color:'#0F172A',outline:'none',fontFamily:'inherit',marginBottom:'14px',transition:'border-color .2s,box-shadow .2s'}
const LBL = {display:'block',fontSize:'.74rem',fontWeight:700,letterSpacing:'.06em',textTransform:'uppercase',color:'#64748B',marginBottom:'6px'}
const BTN = {width:'100%',padding:'14px',background:'linear-gradient(135deg,#FFBF00,#FF8C00)',color:'#111',fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:'1rem',border:'none',borderRadius:'12px',cursor:'pointer',boxShadow:'0 4px 14px rgba(255,191,0,.4)',transition:'all .2s',display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',letterSpacing:'-.01em'}

// Vehicle category definitions
const VEHICLE_TYPES = [
  {
    id: 'auto_rickshaw',
    title: 'Auto Rickshaw',
    subtitle: 'Standard 3-wheeler',
    icon: Truck,
    fuelOptions: ['petrol', 'cng'],
    defaultFuel: 'cng',
    sizes: ['small', 'medium', 'large'],
    makes: ['Bajaj', 'Piaggio', 'TVS', 'Mahindra', 'Other'],
    adPanels: { back: true, sides: true },
    bannerSpec: 'Back: 3×2 ft, Side: 4×1.5 ft',
    color: '#FFBF00',
    bgColor: '#FFFBEB',
    selBg: '#FEF3C7',
    borderColor: '#FFBF00'
  },
  {
    id: 'e_rickshaw',
    title: 'E-Rickshaw',
    subtitle: 'Battery-powered',
    icon: Zap,
    fuelOptions: ['electric'],
    defaultFuel: 'electric',
    sizes: ['small', 'medium', 'large'],
    makes: ['Mahindra', 'Lohia', 'Kinetic', 'YC Electric', 'Other'],
    adPanels: { back: true, sides: true },
    bannerSpec: 'Back: 2.5×2 ft, Side: 3×1.5 ft',
    color: '#10B981',
    bgColor: '#F0FDF4',
    selBg: '#D1FAE5',
    borderColor: '#10B981'
  },
  {
    id: 'cycle_rickshaw',
    title: 'Cycle Rickshaw',
    subtitle: 'Pedal-powered',
    icon: Bike,
    fuelOptions: ['manual'],
    defaultFuel: 'manual',
    sizes: ['small', 'medium'],
    makes: ['Local', 'Custom Built', 'Other'],
    adPanels: { back: true, sides: false },
    bannerSpec: 'Back: 2×1.5 ft',
    color: '#8B5CF6',
    bgColor: '#F5F3FF',
    selBg: '#EDE9FE',
    borderColor: '#8B5CF6'
  }
]

const FUEL_LABELS = { petrol: 'Petrol', cng: 'CNG', electric: 'Electric', manual: 'Manual/Pedal' }
const SIZE_LABELS = { small: 'Small', medium: 'Medium', large: 'Large' }
const SIZE_DESC = { small: 'Compact · Less ad space', medium: 'Standard · Regular ad space', large: 'Full-size · Maximum ad space' }

export default function AuthPage({ setupMode = false, userId = null } = {}) {
  const [screen, setScreen] = useState(setupMode ? 'role' : 'login')
  const [role,   setRole]   = useState(null)
  const [busy,   setBusy]   = useState(false)
  const [showPwd, setShowPwd] = useState(false)
  const [form,   setForm]   = useState({
    email:'', password:'', full_name:'', phone:'', city:'', dob:'',
    vehicle_number:'', vehicle_type:'', fuel_type:'', vehicle_size:'',
    vehicle_make:'', vehicle_model:''
  })
  const { fetchProfile, signOut } = useAuth()
  const up = (k,v) => setForm(f=>({...f,[k]:v}))

  // Get selected vehicle config
  const selectedVehicle = VEHICLE_TYPES.find(v => v.id === form.vehicle_type)

  async function doLogin() {
    if (!form.email||!form.password) return toast.error('Enter your email and password')
    setBusy(true)
    const {error} = await supabase.auth.signInWithPassword({email:form.email,password:form.password})
    if (error) {
      // Map Supabase errors to friendly messages
      const msg = error.message?.toLowerCase() || ''
      if (msg.includes('invalid login')) toast.error('Wrong email or password. Please try again.')
      else if (msg.includes('email not confirmed')) toast.error('Please verify your email first. Check your inbox.')
      else if (msg.includes('too many requests')) toast.error('Too many attempts. Wait a moment and try again.')
      else toast.error(error.message)
    }
    setBusy(false)
  }

  async function doForgot() {
    if (!form.email) return toast.error('Enter your email first')
    const {error} = await supabase.auth.resetPasswordForEmail(form.email,{redirectTo:`${window.location.origin}/reset-password`})
    if (error) toast.error(error.message)
    else toast.success('Reset link sent to your email')
  }

  async function doSignup() {
    if (!form.full_name||!form.phone||!form.city) return toast.error('Please fill all required fields')
    if (!setupMode&&(!form.email||!form.password)) return toast.error('Enter email and password')
    if (!setupMode&&form.password.length<6) return toast.error('Password must be at least 6 characters')

    // Driver-specific validations
    if (role === 'driver') {
      if (!form.vehicle_type) return toast.error('Please select your vehicle type')
      if (!form.fuel_type) return toast.error('Please select fuel type')
      if (!form.vehicle_size) return toast.error('Please select vehicle size')
    }

    setBusy(true)
    if (setupMode&&userId) {
      const profileData = {
        id: userId, full_name: form.full_name, phone: form.phone,
        city: form.city, role, email: form.email || null,
        date_of_birth: form.dob || null
      }
      if (role === 'driver') {
        Object.assign(profileData, {
          vehicle_number: form.vehicle_number || null,
          vehicle_type: form.vehicle_type, fuel_type: form.fuel_type,
          vehicle_size: form.vehicle_size, vehicle_make: form.vehicle_make || null,
          vehicle_model: form.vehicle_model || null,
          has_back_panel: selectedVehicle?.adPanels.back ?? true,
          has_side_panels: selectedVehicle?.adPanels.sides ?? true
        })
      }
      const {error} = await supabase.from('users').upsert(profileData)
      if (error) toast.error(error.message)
      else { toast.success('Setup complete! Welcome to AdWheels'); await fetchProfile(userId) }
      setBusy(false); return
    }

    const {data,error} = await supabase.auth.signUp({email:form.email,password:form.password,options:{data:{full_name:form.full_name,role}}})
    if (error) { toast.error(error.message); setBusy(false); return }

    const profileData = {
      id: data.user.id, full_name: form.full_name, phone: form.phone,
      city: form.city, role, email: form.email,
      date_of_birth: form.dob || null
    }
    if (role === 'driver') {
      Object.assign(profileData, {
        vehicle_number: form.vehicle_number || null,
        vehicle_type: form.vehicle_type, fuel_type: form.fuel_type,
        vehicle_size: form.vehicle_size, vehicle_make: form.vehicle_make || null,
        vehicle_model: form.vehicle_model || null,
        has_back_panel: selectedVehicle?.adPanels.back ?? true,
        has_side_panels: selectedVehicle?.adPanels.sides ?? true
      })
    }

    const {error:pe} = await supabase.from('users').upsert(profileData, {onConflict:'id'})
    if (pe) { console.error('Profile save error:', pe); toast.error('Profile save failed: ' + pe.message) }

    try {
      const {error:loginErr} = await supabase.auth.signInWithPassword({email:form.email,password:form.password})
      if (loginErr) toast.error('Account created but auto-login failed: ' + loginErr.message)
      else toast.success('Account created! Welcome to AdWheels')
    } catch(e) { toast.error('Account created! Please login manually.') }
    setBusy(false)
  }

  // When vehicle type is selected, auto-set fuel if only one option
  function selectVehicleType(vType) {
    const config = VEHICLE_TYPES.find(v => v.id === vType)
    up('vehicle_type', vType)
    if (config) {
      up('fuel_type', config.defaultFuel)
      // Reset size
      up('vehicle_size', '')
    }
  }

  const driverSteps = ['role','details','vehicle','account']
  const advertiserSteps = ['role','details','account']
  const STEPS = role === 'driver' ? driverSteps : advertiserSteps

  // Progress bar
  const stepIdx = STEPS.indexOf(screen)
  const progress = stepIdx >= 0 ? ((stepIdx + 1) / STEPS.length * 100) : 0

  return (
    <div style={{minHeight:'100vh',display:'flex',fontFamily:"'DM Sans',sans-serif"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=Bebas+Neue&family=DM+Sans:wght@400;500;600&display=swap');
      .auth-inp:focus{border-color:#FFBF00!important;box-shadow:0 0 0 3px rgba(255,191,0,.12)!important}
      .auth-btn:hover{transform:translateY(-1px);box-shadow:0 8px 20px rgba(255,140,0,.45)!important}
      .role-card:hover{transform:translateY(-3px);box-shadow:0 10px 28px rgba(0,0,0,.1)!important}
      .vehicle-card:hover{transform:translateY(-3px);box-shadow:0 10px 28px rgba(0,0,0,.1)!important}
      .size-card:hover{transform:translateY(-2px);box-shadow:0 6px 16px rgba(0,0,0,.08)!important}
      @media(max-width:768px){.auth-left{display:none!important}}
      @keyframes slideUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
      .auth-step{animation:slideUp .3s ease-out}`}</style>

      {/* Left panel (decorative) */}
      <div className="auth-left" style={{flex:'0 0 42%',background:'linear-gradient(160deg,#0F172A 0%,#1E293B 60%,#0F172A 100%)',display:'flex',flexDirection:'column',justifyContent:'space-between',padding:'48px',position:'relative',overflow:'hidden'}}>
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
            {[
              [Truck, 'Live in 90 minutes', 'Upload and your ad is on the road today'],
              [MapPin, 'Indore & Bhopal', 'Hyperlocal targeting in both cities'],
              [CheckCircle, 'Starting at ₹1,500', 'The most affordable ad channel in the city']
            ].map(([Icon,title,sub])=>(
              <div key={title} style={{display:'flex',gap:'14px',alignItems:'flex-start',background:'rgba(255,255,255,.05)',border:'1px solid rgba(255,255,255,.08)',borderRadius:'14px',padding:'14px 16px'}}>
                <Icon size={20} style={{color:'#FFBF00',flexShrink:0,marginTop:'2px'}} />
                <div>
                  <div style={{fontWeight:700,fontSize:'.9rem',color:'#fff',marginBottom:'2px'}}>{title}</div>
                  <div style={{fontSize:'.8rem',color:'rgba(255,255,255,.45)'}}>{sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{position:'relative',zIndex:1,fontSize:'.78rem',color:'rgba(255,255,255,.25)'}}>© {new Date().getFullYear()} AdWheels. All rights reserved.</div>
      </div>

      {/* Right panel (form) */}
      <div style={{flex:1,background:'#F8FAFC',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'32px 24px',overflowY:'auto'}}>
        <div style={{width:'100%',maxWidth:'420px'}}>

          {/* LOGIN */}
          {screen==='login' && (
            <div className="auth-step" style={{background:'#fff',borderRadius:'24px',padding:'40px 36px',boxShadow:'0 8px 40px rgba(0,0,0,.08)',border:'1px solid #F1F5F9'}}>
              <div style={{marginBottom:'28px'}}>
                <h1 style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:'1.7rem',color:'#0F172A',marginBottom:'6px'}}>Welcome back</h1>
                <p style={{color:'#64748B',fontSize:'.92rem'}}>Login to your AdWheels account</p>
              </div>

              <label style={LBL}>Email Address</label>
              <input style={INP} className="auth-inp" type="email" placeholder="you@email.com" value={form.email} onChange={e=>up('email',e.target.value)} onKeyDown={e=>e.key==='Enter'&&doLogin()}/>

              <label style={LBL}>Password</label>
              <div style={{position:'relative'}}>
                <input style={{...INP,paddingRight:'44px'}} className="auth-inp" type={showPwd?'text':'password'} placeholder="Your password" value={form.password} onChange={e=>up('password',e.target.value)} onKeyDown={e=>e.key==='Enter'&&doLogin()}/>
                <button type="button" onClick={()=>setShowPwd(!showPwd)} style={{position:'absolute',right:'12px',top:'13px',background:'none',border:'none',cursor:'pointer',color:'#94A3B8',padding:'4px',display:'flex',alignItems:'center'}} title={showPwd?'Hide password':'Show password'}>
                  {showPwd ? <EyeOff size={18}/> : <Eye size={18}/>}
                </button>
              </div>

              <button style={BTN} className="auth-btn" onClick={doLogin} disabled={busy}>{busy?'Logging in...':'Login to AdWheels'}<ChevronRight size={16}/></button>

              <button onClick={doForgot} style={{display:'block',width:'100%',marginTop:'14px',background:'none',border:'none',color:'#64748B',fontSize:'.87rem',cursor:'pointer',textAlign:'center',textDecoration:'underline',fontFamily:'DM Sans,sans-serif'}}>
                Forgot password?
              </button>

              <div style={{borderTop:'1px solid #F1F5F9',marginTop:'24px',paddingTop:'20px',textAlign:'center',fontSize:'.9rem',color:'#64748B'}}>
                Don't have an account?{' '}
                <button onClick={()=>setScreen('role')} style={{background:'none',border:'none',color:'#D97706',fontWeight:700,cursor:'pointer',fontSize:'.9rem',fontFamily:'DM Sans,sans-serif'}}>Sign up free</button>
              </div>
            </div>
          )}

          {/* ROLE STEP */}
          {(screen==='role'||setupMode) && screen!=='details' && screen!=='vehicle' && screen!=='account' && (
            <div className="auth-step" style={{background:'#fff',borderRadius:'24px',padding:'40px 36px',boxShadow:'0 8px 40px rgba(0,0,0,.08)',border:'1px solid #F1F5F9'}}>
              {/* Setup mode banner */}
              {setupMode && (
                <div style={{background:'#FFF8E6',border:'1px solid #FFE08A',borderRadius:'12px',padding:'14px 16px',marginBottom:'20px',fontSize:'.88rem',color:'#7A5900',lineHeight:1.5}}>
                  <div style={{fontWeight:700,marginBottom:'4px'}}>Complete your profile</div>
                  We need a few details to set up your dashboard. This only takes a minute.
                </div>
              )}
              <div style={{marginBottom:'28px'}}>
                <h1 style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:'1.7rem',color:'#0F172A',marginBottom:'6px'}}>I am a...</h1>
                <p style={{color:'#64748B',fontSize:'.92rem'}}>Select what best describes you</p>
              </div>

              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px',marginBottom:'28px'}}>
                {[
                  {r:'advertiser',Icon:Building2,title:'Business Owner',sub:'I want to run ads',bg:'#FFFBEB',border:'#FFBF00',selBg:'#FEF3C7'},
                  {r:'driver',Icon:Truck,title:'Rickshaw Driver',sub:'I want to earn extra',bg:'#F0FDF4',border:'#10B981',selBg:'#D1FAE5'}
                ].map(({r,Icon,title,sub,bg,border,selBg})=>(
                  <div key={r} className="role-card" onClick={()=>setRole(r)} style={{border:`2px solid ${role===r?border:'#E2E8F0'}`,borderRadius:'16px',padding:'24px 16px',textAlign:'center',cursor:'pointer',background:role===r?selBg:'#FAFAFA',transition:'all .18s',boxShadow:role===r?`0 6px 20px ${border}30`:'none'}}>
                    <div style={{width:'48px',height:'48px',borderRadius:'14px',background:role===r?border+'20':'#F1F5F9',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 12px'}}>
                      <Icon size={24} style={{color:role===r?border:'#94A3B8'}} />
                    </div>
                    <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:'1rem',color:role===r?'#0F172A':'#374151',marginBottom:'4px'}}>{title}</div>
                    <div style={{fontSize:'.78rem',color:'#94A3B8'}}>{sub}</div>
                  </div>
                ))}
              </div>

              <button style={{...BTN,background:role?'linear-gradient(135deg,#FFBF00,#FF8C00)':'#E2E8F0',color:role?'#111':'#94A3B8',boxShadow:role?'0 4px 14px rgba(255,191,0,.4)':'none',cursor:role?'pointer':'default'}} onClick={()=>{if(!role)return toast.error('Please select one');setScreen('details')}}>
                Continue <ChevronRight size={16}/>
              </button>

              {!setupMode && (
                <div style={{textAlign:'center',marginTop:'18px',fontSize:'.9rem',color:'#64748B'}}>
                  Already have an account?{' '}
                  <button onClick={()=>setScreen('login')} style={{background:'none',border:'none',color:'#D97706',fontWeight:700,cursor:'pointer',fontSize:'.9rem',fontFamily:'DM Sans,sans-serif'}}>Login</button>
                </div>
              )}

              {/* Logout option in setup mode */}
              {setupMode && (
                <div style={{textAlign:'center',marginTop:'18px'}}>
                  <button onClick={signOut} style={{background:'none',border:'none',color:'#94A3B8',fontSize:'.87rem',cursor:'pointer',fontFamily:'DM Sans,sans-serif',textDecoration:'underline'}}>
                    Sign out and use a different account
                  </button>
                </div>
              )}
            </div>
          )}

          {/* DETAILS STEP */}
          {screen==='details' && (
            <div className="auth-step" style={{background:'#fff',borderRadius:'24px',padding:'40px 36px',boxShadow:'0 8px 40px rgba(0,0,0,.08)',border:'1px solid #F1F5F9'}}>
              {/* Progress */}
              <div style={{display:'flex',gap:'6px',marginBottom:'28px'}}>
                {STEPS.map((_,i)=>(
                  <div key={i} style={{flex:1,height:'4px',borderRadius:'4px',background: i<=STEPS.indexOf('details')?'#FFBF00':'#E2E8F0',transition:'background .3s'}}/>
                ))}
              </div>

              <div style={{marginBottom:'24px'}}>
                <h1 style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:'1.6rem',color:'#0F172A',marginBottom:'6px'}}>{role==='driver'?'Driver Details':'Your Details'}</h1>
                <p style={{color:'#64748B',fontSize:'.9rem'}}>Just a few quick fields to get you started</p>
              </div>

              <label style={LBL}><User size={12} style={{display:'inline',marginRight:'4px',verticalAlign:'middle'}}/> Full Name</label>
              <input style={INP} className="auth-inp" type="text" placeholder="e.g. Rahul Sharma" value={form.full_name} onChange={e=>up('full_name',e.target.value)}/>

              <label style={LBL}><Phone size={12} style={{display:'inline',marginRight:'4px',verticalAlign:'middle'}}/> Mobile Number</label>
              <input style={INP} className="auth-inp" type="tel" placeholder="e.g. 98765 43210" value={form.phone} onChange={e=>up('phone',e.target.value)}/>

              <label style={LBL}><Mail size={12} style={{display:'inline',marginRight:'4px',verticalAlign:'middle'}}/> Email Address</label>
              <input style={INP} className="auth-inp" type="email" placeholder="e.g. rahul@email.com" value={form.email} onChange={e=>up('email',e.target.value)}/>

              <label style={LBL}><Calendar size={12} style={{display:'inline',marginRight:'4px',verticalAlign:'middle'}}/> Date of Birth</label>
              <input style={INP} className="auth-inp" type="date" value={form.dob} onChange={e=>up('dob',e.target.value)}/>

              <label style={LBL}><MapPin size={12} style={{display:'inline',marginRight:'4px',verticalAlign:'middle'}}/> City</label>
              <select style={{...INP,appearance:'none',WebkitAppearance:'none',cursor:'pointer'}} className="auth-inp" value={form.city} onChange={e=>up('city',e.target.value)}>
                <option value="">Select your city</option>
                <option value="indore">Indore</option>
                <option value="bhopal">Bhopal</option>
              </select>

              <div style={{display:'flex',gap:'10px'}}>
                <button onClick={()=>setScreen('role')} style={{...BTN,flex:'0 0 auto',width:'auto',padding:'14px 20px',background:'#F1F5F9',color:'#64748B',boxShadow:'none'}}><ChevronLeft size={16}/></button>
                <button style={BTN} className="auth-btn" onClick={()=>{
                  if(!form.full_name||!form.phone||!form.city) return toast.error('Fill all required fields')
                  setScreen(role==='driver'?'vehicle':'account')
                }}>Continue <ChevronRight size={16}/></button>
              </div>
            </div>
          )}

          {/* VEHICLE STEP (drivers only) */}
          {screen==='vehicle' && role==='driver' && (
            <div className="auth-step" style={{background:'#fff',borderRadius:'24px',padding:'40px 36px',boxShadow:'0 8px 40px rgba(0,0,0,.08)',border:'1px solid #F1F5F9'}}>
              {/* Progress */}
              <div style={{display:'flex',gap:'6px',marginBottom:'28px'}}>
                {STEPS.map((_,i)=>(
                  <div key={i} style={{flex:1,height:'4px',borderRadius:'4px',background: i<=STEPS.indexOf('vehicle')?'#FFBF00':'#E2E8F0',transition:'background .3s'}}/>
                ))}
              </div>

              <div style={{marginBottom:'24px'}}>
                <h1 style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:'1.6rem',color:'#0F172A',marginBottom:'6px'}}>Vehicle Information</h1>
                <p style={{color:'#64748B',fontSize:'.9rem'}}>Tell us about your rickshaw to match you with the right ads</p>
              </div>

              {/* Vehicle Type Selection */}
              <label style={{...LBL,marginBottom:'12px'}}>Vehicle Type</label>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'10px',marginBottom:'20px'}}>
                {VEHICLE_TYPES.map(vt => {
                  const isSelected = form.vehicle_type === vt.id
                  const VIcon = vt.icon
                  return (
                    <div key={vt.id} className="vehicle-card" onClick={()=>selectVehicleType(vt.id)} style={{
                      border:`2px solid ${isSelected?vt.borderColor:'#E2E8F0'}`,
                      borderRadius:'14px', padding:'16px 10px', textAlign:'center', cursor:'pointer',
                      background: isSelected ? vt.selBg : '#FAFAFA',
                      transition:'all .18s',
                      boxShadow: isSelected ? `0 4px 14px ${vt.color}25` : 'none'
                    }}>
                      <div style={{width:'40px',height:'40px',borderRadius:'12px',background:isSelected?vt.color+'20':'#F1F5F9',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 8px'}}>
                        <VIcon size={20} style={{color:isSelected?vt.color:'#94A3B8'}}/>
                      </div>
                      <div style={{fontWeight:800,fontSize:'.82rem',color:isSelected?'#0F172A':'#374151',marginBottom:'2px'}}>{vt.title}</div>
                      <div style={{fontSize:'.68rem',color:'#94A3B8'}}>{vt.subtitle}</div>
                    </div>
                  )
                })}
              </div>

              {/* Fuel Type (only if vehicle selected) */}
              {selectedVehicle && selectedVehicle.fuelOptions.length > 1 && (
                <>
                  <label style={{...LBL,marginBottom:'10px'}}><Fuel size={12} style={{display:'inline',marginRight:'4px',verticalAlign:'middle'}}/> Fuel Type</label>
                  <div style={{display:'flex',gap:'10px',marginBottom:'20px',flexWrap:'wrap'}}>
                    {selectedVehicle.fuelOptions.map(fuel => (
                      <button key={fuel} onClick={()=>up('fuel_type',fuel)} style={{
                        padding:'10px 20px', borderRadius:'100px', fontWeight:700, fontSize:'.85rem',
                        cursor:'pointer', transition:'all .18s',
                        border: form.fuel_type===fuel ? `2px solid ${selectedVehicle.color}` : '2px solid #E2E8F0',
                        background: form.fuel_type===fuel ? selectedVehicle.selBg : '#fff',
                        color: form.fuel_type===fuel ? '#0F172A' : '#64748B'
                      }}>
                        {FUEL_LABELS[fuel]}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* Vehicle Size */}
              {selectedVehicle && (
                <>
                  <label style={{...LBL,marginBottom:'10px'}}><Maximize size={12} style={{display:'inline',marginRight:'4px',verticalAlign:'middle'}}/> Vehicle Size</label>
                  <div style={{display:'grid',gridTemplateColumns:selectedVehicle.sizes.length===2?'1fr 1fr':'1fr 1fr 1fr',gap:'10px',marginBottom:'20px'}}>
                    {selectedVehicle.sizes.map(size => {
                      const isSelected = form.vehicle_size === size
                      return (
                        <div key={size} className="size-card" onClick={()=>up('vehicle_size',size)} style={{
                          border:`2px solid ${isSelected?selectedVehicle.color:'#E2E8F0'}`,
                          borderRadius:'12px', padding:'14px 12px', textAlign:'center', cursor:'pointer',
                          background: isSelected ? selectedVehicle.selBg : '#FAFAFA',
                          transition:'all .18s'
                        }}>
                          {/* Visual size indicator */}
                          <div style={{display:'flex',justifyContent:'center',marginBottom:'8px',gap:'3px'}}>
                            {['small','medium','large'].slice(0, ['small','medium','large'].indexOf(size)+1).map((_,i) => (
                              <div key={i} style={{
                                width: 8 + i*4, height: 8 + i*4,
                                borderRadius:'3px',
                                background: isSelected ? selectedVehicle.color : '#D1D5DB'
                              }}/>
                            ))}
                          </div>
                          <div style={{fontWeight:700,fontSize:'.88rem',color:isSelected?'#0F172A':'#374151'}}>{SIZE_LABELS[size]}</div>
                          <div style={{fontSize:'.65rem',color:'#94A3B8',marginTop:'2px'}}>{SIZE_DESC[size]}</div>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}

              {/* Vehicle Make */}
              {selectedVehicle && (
                <>
                  <label style={LBL}>Vehicle Make</label>
                  <select style={{...INP,appearance:'none',WebkitAppearance:'none',cursor:'pointer'}} className="auth-inp" value={form.vehicle_make} onChange={e=>up('vehicle_make',e.target.value)}>
                    <option value="">Select manufacturer</option>
                    {selectedVehicle.makes.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </>
              )}

              {/* Vehicle Number */}
              <label style={LBL}>Vehicle Number <span style={{color:'#94A3B8',fontWeight:400,textTransform:'none',letterSpacing:0}}>(optional)</span></label>
              <input style={INP} className="auth-inp" placeholder="e.g. MP09 AB 1234" value={form.vehicle_number} onChange={e=>up('vehicle_number',e.target.value)}/>

              {/* Ad Space Info */}
              {selectedVehicle && (
                <div style={{background:selectedVehicle.bgColor,border:`1px solid ${selectedVehicle.color}30`,borderRadius:'12px',padding:'14px 16px',marginBottom:'18px'}}>
                  <div style={{fontWeight:700,fontSize:'.82rem',color:'#374151',marginBottom:'6px',display:'flex',alignItems:'center',gap:'6px'}}>
                    <Camera size={14} style={{color:selectedVehicle.color}}/> Ad Placement for {selectedVehicle.title}
                  </div>
                  <div style={{fontSize:'.82rem',color:'#64748B',lineHeight:1.6}}>
                    {selectedVehicle.bannerSpec}<br/>
                    Panels: {selectedVehicle.adPanels.back ? 'Back' : ''}{selectedVehicle.adPanels.back && selectedVehicle.adPanels.sides ? ' + ' : ''}{selectedVehicle.adPanels.sides ? '2 Side Panels' : ''}
                  </div>
                </div>
              )}

              <div style={{display:'flex',gap:'10px'}}>
                <button onClick={()=>setScreen('details')} style={{...BTN,flex:'0 0 auto',width:'auto',padding:'14px 20px',background:'#F1F5F9',color:'#64748B',boxShadow:'none'}}><ChevronLeft size={16}/></button>
                <button style={BTN} className="auth-btn" onClick={()=>{
                  if(!form.vehicle_type) return toast.error('Select a vehicle type')
                  if(!form.fuel_type) return toast.error('Select fuel type')
                  if(!form.vehicle_size) return toast.error('Select vehicle size')
                  setScreen('account')
                }}>Continue <ChevronRight size={16}/></button>
              </div>
            </div>
          )}

          {/* ACCOUNT STEP */}
          {screen==='account' && !setupMode && (
            <div className="auth-step" style={{background:'#fff',borderRadius:'24px',padding:'40px 36px',boxShadow:'0 8px 40px rgba(0,0,0,.08)',border:'1px solid #F1F5F9'}}>
              <div style={{display:'flex',gap:'6px',marginBottom:'28px'}}>
                {STEPS.map((_,i)=>(
                  <div key={i} style={{flex:1,height:'4px',borderRadius:'4px',background:'#FFBF00'}}/>
                ))}
              </div>

              <div style={{marginBottom:'24px'}}>
                <h1 style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:'1.6rem',color:'#0F172A',marginBottom:'6px'}}>Create Your Account</h1>
                <p style={{color:'#64748B',fontSize:'.9rem'}}>Set your email & password to secure your account</p>
              </div>

              {/* Pre-filled email from details step */}
              {!form.email && (
                <>
                  <label style={LBL}>Email Address</label>
                  <input style={INP} className="auth-inp" type="email" placeholder="you@email.com" value={form.email} onChange={e=>up('email',e.target.value)}/>
                </>
              )}

              <label style={LBL}><Lock size={12} style={{display:'inline',marginRight:'4px',verticalAlign:'middle'}}/> Password</label>
              <div style={{position:'relative'}}>
                <input style={{...INP,paddingRight:'44px'}} className="auth-inp" type={showPwd?'text':'password'} placeholder="Min. 6 characters" value={form.password} onChange={e=>up('password',e.target.value)}/>
                <button type="button" onClick={()=>setShowPwd(!showPwd)} style={{position:'absolute',right:'12px',top:'13px',background:'none',border:'none',cursor:'pointer',color:'#94A3B8',padding:'4px',display:'flex',alignItems:'center'}} title={showPwd?'Hide password':'Show password'}>
                  {showPwd ? <EyeOff size={18}/> : <Eye size={18}/>}
                </button>
              </div>

              <div style={{background:'#F0FDF4',border:'1px solid #A7F3D0',borderRadius:'10px',padding:'12px 14px',marginBottom:'18px',fontSize:'.84rem',color:'#065F46',display:'flex',gap:'8px',alignItems:'flex-start'}}>
                <Lock size={14} style={{flexShrink:0,marginTop:'1px'}}/> Your data is safe and private. We never share it with anyone.
              </div>

              {/* Summary */}
              <div style={{background:'#F8FAFC',border:'1px solid #E2E8F0',borderRadius:'12px',padding:'14px 16px',marginBottom:'18px',fontSize:'.84rem',color:'#374151',lineHeight:1.8}}>
                <div style={{fontWeight:700,marginBottom:'6px',fontSize:'.88rem'}}>Account Summary</div>
                <div><strong>Name:</strong> {form.full_name}</div>
                <div><strong>Phone:</strong> {form.phone}</div>
                <div><strong>City:</strong> {form.city}</div>
                <div><strong>Role:</strong> {role==='driver'?'Rickshaw Driver':'Advertiser'}</div>
                {role==='driver' && form.vehicle_type && (
                  <>
                    <div style={{borderTop:'1px solid #E2E8F0',margin:'8px 0',paddingTop:'8px'}}/>
                    <div><strong>Vehicle:</strong> {VEHICLE_TYPES.find(v=>v.id===form.vehicle_type)?.title}</div>
                    <div><strong>Fuel:</strong> {FUEL_LABELS[form.fuel_type]}</div>
                    <div><strong>Size:</strong> {SIZE_LABELS[form.vehicle_size]}</div>
                    {form.vehicle_make && <div><strong>Make:</strong> {form.vehicle_make}</div>}
                    {form.vehicle_number && <div><strong>Number:</strong> {form.vehicle_number}</div>}
                  </>
                )}
              </div>

              <div style={{display:'flex',gap:'10px'}}>
                <button onClick={()=>setScreen(role==='driver'?'vehicle':'details')} style={{...BTN,flex:'0 0 auto',width:'auto',padding:'14px 20px',background:'#F1F5F9',color:'#64748B',boxShadow:'none'}}><ChevronLeft size={16}/></button>
                <button style={BTN} className="auth-btn" onClick={doSignup} disabled={busy}>{busy?'Creating Account...':'Create My Account'}</button>
              </div>
            </div>
          )}

          {/* setupMode confirm */}
          {screen==='account' && setupMode && (
            <div className="auth-step" style={{background:'#fff',borderRadius:'24px',padding:'40px 36px',boxShadow:'0 8px 40px rgba(0,0,0,.08)',border:'1px solid #F1F5F9'}}>
              <h1 style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:'1.6rem',color:'#0F172A',marginBottom:'16px'}}>Almost done!</h1>
              <div style={{background:'#F0FDF4',border:'1px solid #A7F3D0',borderRadius:'14px',padding:'20px',marginBottom:'22px',fontSize:'.9rem',color:'#065F46',lineHeight:1.7}}>
                <div style={{display:'flex',alignItems:'center',gap:'6px',marginBottom:'4px'}}><CheckCircle size={14}/> Name: <b>{form.full_name}</b></div>
                <div style={{display:'flex',alignItems:'center',gap:'6px',marginBottom:'4px'}}><Phone size={14}/> Phone: <b>{form.phone}</b></div>
                <div style={{display:'flex',alignItems:'center',gap:'6px',marginBottom:'4px'}}><MapPin size={14}/> City: <b>{form.city}</b></div>
                <div style={{display:'flex',alignItems:'center',gap:'6px'}}><User size={14}/> Role: <b>{role==='driver'?'Rickshaw Driver':'Advertiser'}</b></div>
                {role==='driver' && form.vehicle_type && (
                  <>
                    <div style={{borderTop:'1px solid #A7F3D0',margin:'8px 0',paddingTop:'8px'}}/>
                    <div style={{display:'flex',alignItems:'center',gap:'6px',marginBottom:'4px'}}><Truck size={14}/> Vehicle: <b>{VEHICLE_TYPES.find(v=>v.id===form.vehicle_type)?.title}</b></div>
                    <div style={{display:'flex',alignItems:'center',gap:'6px'}}><Fuel size={14}/> {FUEL_LABELS[form.fuel_type]} · {SIZE_LABELS[form.vehicle_size]}</div>
                  </>
                )}
              </div>
              <button style={BTN} className="auth-btn" onClick={doSignup} disabled={busy}>{busy?'Saving...':'Confirm & Continue'}</button>
              <button onClick={()=>setScreen(role==='driver'?'vehicle':'details')} style={{display:'block',width:'100%',marginTop:'12px',background:'none',border:'none',color:'#94A3B8',fontSize:'.87rem',cursor:'pointer',textAlign:'center',fontFamily:'DM Sans,sans-serif'}}>Edit details</button>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}