import { useState, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import {
  User, Mail, Phone, MapPin, Calendar, Truck, Fuel, Maximize, Camera,
  CreditCard, Building2, Edit3, Save, X, LogOut, Shield, ChevronRight,
  CheckCircle, Zap, Bike, Clock, IndianRupee, Image
} from 'lucide-react'

const VEHICLE_TYPE_LABELS = {
  auto_rickshaw: 'Auto Rickshaw',
  e_rickshaw: 'E-Rickshaw',
  cycle_rickshaw: 'Cycle Rickshaw'
}
const FUEL_LABELS = { petrol: 'Petrol', cng: 'CNG', electric: 'Electric', manual: 'Manual/Pedal' }
const SIZE_LABELS = { small: 'Small', medium: 'Medium', large: 'Large' }

const VEHICLE_COLORS = {
  auto_rickshaw: '#FFBF00',
  e_rickshaw: '#10B981',
  cycle_rickshaw: '#8B5CF6'
}

const VEHICLE_ICONS = {
  auto_rickshaw: Truck,
  e_rickshaw: Zap,
  cycle_rickshaw: Bike
}

function InfoRow({ icon: Icon, label, value, iconColor = '#94A3B8' }) {
  return (
    <div style={{display:'flex',alignItems:'center',gap:'12px',padding:'12px 0',borderBottom:'1px solid #F1F5F9'}}>
      <div style={{width:'36px',height:'36px',borderRadius:'10px',background:'#F8FAFC',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
        <Icon size={16} style={{color:iconColor}}/>
      </div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:'.72rem',fontWeight:700,letterSpacing:'.06em',textTransform:'uppercase',color:'#94A3B8',marginBottom:'2px'}}>{label}</div>
        <div style={{fontSize:'.92rem',fontWeight:600,color:'#1E293B',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{value || 'Not set'}</div>
      </div>
    </div>
  )
}

function SectionCard({ title, icon: Icon, children, iconColor = '#64748B' }) {
  return (
    <div style={{background:'#fff',border:'1px solid #E8E8E8',borderRadius:'16px',padding:'20px',marginBottom:'14px',boxShadow:'0 2px 8px rgba(0,0,0,0.04)'}}>
      <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'14px'}}>
        <Icon size={16} style={{color:iconColor}}/>
        <span style={{fontWeight:800,fontSize:'.92rem',color:'#1E293B'}}>{title}</span>
      </div>
      {children}
    </div>
  )
}

export default function AccountSection({ profile, role }) {
  const { signOut, fetchProfile, user } = useAuth()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadingVehicle, setUploadingVehicle] = useState(false)
  const avatarInputRef = useRef(null)
  const vehicleInputRef = useRef(null)

  const [form, setForm] = useState({
    full_name: profile.full_name || '',
    phone: profile.phone || '',
    city: profile.city || '',
    date_of_birth: profile.date_of_birth || '',
    upi_id: profile.upi_id || '',
    vehicle_number: profile.vehicle_number || '',
    vehicle_make: profile.vehicle_make || '',
    vehicle_model: profile.vehicle_model || ''
  })

  const up = (k,v) => setForm(f => ({...f,[k]:v}))

  async function handleSave() {
    if (!form.full_name || !form.phone) return toast.error('Name and phone are required')
    setSaving(true)
    const updateData = {
      full_name: form.full_name,
      phone: form.phone,
      city: form.city,
      date_of_birth: form.date_of_birth || null
    }
    if (role === 'driver') {
      updateData.upi_id = form.upi_id || null
      updateData.vehicle_number = form.vehicle_number || null
      updateData.vehicle_make = form.vehicle_make || null
      updateData.vehicle_model = form.vehicle_model || null
    }
    const { error } = await supabase.from('users').update(updateData).eq('id', profile.id)
    if (error) { toast.error(error.message); setSaving(false); return }
    toast.success('Profile updated successfully')
    await fetchProfile(profile.id)
    setEditing(false)
    setSaving(false)
  }

  async function handleAvatarUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    setUploadingAvatar(true)
    const ext = file.name.split('.').pop()
    const fileName = `avatar_${profile.id}_${Date.now()}.${ext}`
    const { error: upErr } = await supabase.storage.from('avatars').upload(fileName, file, { upsert: true })
    if (upErr) { toast.error('Upload failed'); setUploadingAvatar(false); return }
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName)
    const { error } = await supabase.from('users').update({ avatar_url: publicUrl }).eq('id', profile.id)
    if (error) { toast.error(error.message); setUploadingAvatar(false); return }
    toast.success('Profile photo updated')
    await fetchProfile(profile.id)
    setUploadingAvatar(false)
  }

  async function handleVehiclePhotoUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    setUploadingVehicle(true)
    const ext = file.name.split('.').pop()
    const fileName = `vehicle_${profile.id}_${Date.now()}.${ext}`
    const { error: upErr } = await supabase.storage.from('vehicle_photos').upload(fileName, file, { upsert: true })
    if (upErr) { toast.error('Upload failed'); setUploadingVehicle(false); return }
    const { data: { publicUrl } } = supabase.storage.from('vehicle_photos').getPublicUrl(fileName)
    const { error } = await supabase.from('users').update({ vehicle_photo_url: publicUrl }).eq('id', profile.id)
    if (error) { toast.error(error.message); setUploadingVehicle(false); return }
    toast.success('Vehicle photo updated')
    await fetchProfile(profile.id)
    setUploadingVehicle(false)
  }

  const VehicleIcon = profile.vehicle_type ? (VEHICLE_ICONS[profile.vehicle_type] || Truck) : Truck
  const vehicleColor = profile.vehicle_type ? (VEHICLE_COLORS[profile.vehicle_type] || '#FFBF00') : '#FFBF00'
  const memberSince = profile.created_at ? new Date(profile.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : 'N/A'

  const roleLabel = role === 'driver' ? 'Driver' : role === 'advertiser' ? 'Advertiser' : 'Admin'
  const roleBadgeBg = role === 'driver' ? '#E6F9EE' : role === 'advertiser' ? '#FFF0EB' : '#FDECEA'
  const roleBadgeColor = role === 'driver' ? '#0A6B30' : role === 'advertiser' ? '#8B2500' : '#C62828'

  const inputStyle = {
    width:'100%', padding:'11px 14px', fontSize:'.92rem',
    border:'1.5px solid #E2E8F0', borderRadius:'10px',
    background:'#fff', color:'#0F172A', outline:'none',
    fontFamily:'inherit', marginBottom:'10px',
    transition:'border-color .2s'
  }

  return (
    <div style={{animation:'tabFadeIn .25s ease-out'}}>
      {/* Profile Header */}
      <div style={{
        background:'linear-gradient(135deg,#FFBF00 0%,#FF8C00 100%)',
        borderRadius:'20px', padding:'28px 24px', marginBottom:'16px',
        position:'relative', overflow:'hidden'
      }}>
        {/* Background decoration */}
        <div style={{position:'absolute',top:'-40px',right:'-40px',width:'200px',height:'200px',background:'rgba(255,255,255,.1)',borderRadius:'50%'}}/>
        <div style={{position:'absolute',bottom:'-30px',left:'-30px',width:'150px',height:'150px',background:'rgba(255,255,255,.06)',borderRadius:'50%'}}/>

        <div style={{display:'flex',alignItems:'center',gap:'18px',position:'relative',zIndex:1}}>
          {/* Avatar */}
          <div style={{position:'relative'}}>
            <div style={{
              width:'72px',height:'72px',borderRadius:'20px',
              background: profile.avatar_url ? 'transparent' : 'rgba(0,0,0,.15)',
              display:'flex',alignItems:'center',justifyContent:'center',
              overflow:'hidden', border:'3px solid rgba(255,255,255,.3)',
              cursor:'pointer'
            }} onClick={() => avatarInputRef.current?.click()}>
              {profile.avatar_url
                ? <img src={profile.avatar_url} alt="avatar" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                : <User size={28} style={{color:'rgba(255,255,255,.7)'}}/>
              }
            </div>
            <div style={{
              position:'absolute',bottom:'-2px',right:'-2px',
              width:'24px',height:'24px',borderRadius:'50%',
              background:'#fff',display:'flex',alignItems:'center',justifyContent:'center',
              boxShadow:'0 2px 8px rgba(0,0,0,.15)',cursor:'pointer'
            }} onClick={() => avatarInputRef.current?.click()}>
              <Camera size={12} style={{color:'#FF8C00'}}/>
            </div>
            <input ref={avatarInputRef} type="file" accept="image/*" style={{display:'none'}} onChange={handleAvatarUpload}/>
            {uploadingAvatar && <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,.4)',borderRadius:'20px',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <div style={{width:'20px',height:'20px',border:'2px solid #fff',borderTopColor:'transparent',borderRadius:'50%',animation:'spin .6s linear infinite'}}/>
            </div>}
          </div>

          {/* Name & Role */}
          <div>
            <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:'1.3rem',color:'#111',marginBottom:'4px'}}>{profile.full_name}</div>
            <div style={{display:'flex',alignItems:'center',gap:'8px',flexWrap:'wrap'}}>
              <span style={{
                background:'rgba(0,0,0,.12)', color:'#111',
                fontSize:'.7rem',fontWeight:800,letterSpacing:'.06em',textTransform:'uppercase',
                padding:'4px 10px',borderRadius:'100px'
              }}>{roleLabel}</span>
              {profile.is_verified && (
                <span style={{display:'flex',alignItems:'center',gap:'3px',fontSize:'.75rem',color:'rgba(0,0,0,.7)',fontWeight:700}}>
                  <Shield size={12}/> Verified
                </span>
              )}
            </div>
            <div style={{fontSize:'.78rem',color:'rgba(0,0,0,.5)',marginTop:'4px',display:'flex',alignItems:'center',gap:'4px'}}>
              <Clock size={12}/> Member since {memberSince}
            </div>
          </div>
        </div>
      </div>

      {/* Edit/Save Toggle */}
      <div style={{display:'flex',justifyContent:'flex-end',marginBottom:'10px'}}>
        {editing ? (
          <div style={{display:'flex',gap:'8px'}}>
            <button onClick={()=>{setEditing(false);setForm({full_name:profile.full_name||'',phone:profile.phone||'',city:profile.city||'',date_of_birth:profile.date_of_birth||'',upi_id:profile.upi_id||'',vehicle_number:profile.vehicle_number||'',vehicle_make:profile.vehicle_make||'',vehicle_model:profile.vehicle_model||''})}} style={{background:'#F5F5F5',border:'1px solid #E8E8E8',borderRadius:'10px',padding:'8px 16px',fontSize:'.84rem',fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',gap:'5px',color:'#666'}}>
              <X size={14}/> Cancel
            </button>
            <button onClick={handleSave} disabled={saving} style={{background:'#1DB954',color:'#fff',border:'none',borderRadius:'10px',padding:'8px 16px',fontSize:'.84rem',fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',gap:'5px',opacity:saving?.6:1}}>
              <Save size={14}/> {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        ) : (
          <button onClick={()=>setEditing(true)} style={{background:'#fff',border:'1.5px solid #E8E8E8',borderRadius:'10px',padding:'8px 16px',fontSize:'.84rem',fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',gap:'5px',color:'#555',transition:'all .18s'}} onMouseEnter={e=>{e.currentTarget.style.borderColor='#FFBF00';e.currentTarget.style.color='#D49800'}} onMouseLeave={e=>{e.currentTarget.style.borderColor='#E8E8E8';e.currentTarget.style.color='#555'}}>
            <Edit3 size={14}/> Edit Profile
          </button>
        )}
      </div>

      {/* Personal Information */}
      <SectionCard title="Personal Information" icon={User} iconColor="#1565C0">
        {editing ? (
          <>
            <label style={{fontSize:'.72rem',fontWeight:700,letterSpacing:'.05em',textTransform:'uppercase',color:'#94A3B8',display:'block',marginBottom:'5px'}}>Full Name</label>
            <input style={inputStyle} value={form.full_name} onChange={e=>up('full_name',e.target.value)} placeholder="Your name"/>
            <label style={{fontSize:'.72rem',fontWeight:700,letterSpacing:'.05em',textTransform:'uppercase',color:'#94A3B8',display:'block',marginBottom:'5px'}}>Phone</label>
            <input style={inputStyle} value={form.phone} onChange={e=>up('phone',e.target.value)} placeholder="Phone number"/>
            <label style={{fontSize:'.72rem',fontWeight:700,letterSpacing:'.05em',textTransform:'uppercase',color:'#94A3B8',display:'block',marginBottom:'5px'}}>Email</label>
            <input style={{...inputStyle,background:'#F8FAFC',color:'#94A3B8',cursor:'not-allowed'}} type="email" value={user?.email || ''} disabled title="Email is managed by your login account"/>
            <label style={{fontSize:'.72rem',fontWeight:700,letterSpacing:'.05em',textTransform:'uppercase',color:'#94A3B8',display:'block',marginBottom:'5px'}}>Date of Birth</label>
            <input style={inputStyle} type="date" value={form.date_of_birth} onChange={e=>up('date_of_birth',e.target.value)}/>
            <label style={{fontSize:'.72rem',fontWeight:700,letterSpacing:'.05em',textTransform:'uppercase',color:'#94A3B8',display:'block',marginBottom:'5px'}}>City</label>
            <select style={{...inputStyle,cursor:'pointer'}} value={form.city} onChange={e=>up('city',e.target.value)}>
              <option value="indore">Indore</option>
              <option value="bhopal">Bhopal</option>
            </select>
          </>
        ) : (
          <>
            <InfoRow icon={User} label="Full Name" value={profile.full_name} iconColor="#1565C0"/>
            <InfoRow icon={Phone} label="Phone" value={profile.phone} iconColor="#10B981"/>
            <InfoRow icon={Mail} label="Email" value={user?.email} iconColor="#D97706"/>
            <InfoRow icon={Calendar} label="Date of Birth" value={profile.date_of_birth ? new Date(profile.date_of_birth).toLocaleDateString('en-IN') : null} iconColor="#8B5CF6"/>
            <InfoRow icon={MapPin} label="City" value={profile.city ? profile.city.charAt(0).toUpperCase() + profile.city.slice(1) : null} iconColor="#E53935"/>
          </>
        )}
      </SectionCard>

      {/* Vehicle Information (drivers only) */}
      {role === 'driver' && (
        <SectionCard title="Vehicle Information" icon={VehicleIcon} iconColor={vehicleColor}>
          {/* Vehicle type badge */}
          {profile.vehicle_type && (
            <div style={{
              display:'inline-flex',alignItems:'center',gap:'8px',
              background:vehicleColor+'15',border:`1.5px solid ${vehicleColor}30`,
              borderRadius:'12px',padding:'10px 16px',marginBottom:'14px'
            }}>
              <VehicleIcon size={18} style={{color:vehicleColor}}/>
              <div>
                <div style={{fontWeight:800,fontSize:'.88rem',color:'#1E293B'}}>{VEHICLE_TYPE_LABELS[profile.vehicle_type]}</div>
                <div style={{fontSize:'.72rem',color:'#64748B'}}>{FUEL_LABELS[profile.fuel_type]} · {SIZE_LABELS[profile.vehicle_size]}</div>
              </div>
            </div>
          )}

          {/* Vehicle Photo */}
          <div style={{marginBottom:'14px'}}>
            <div style={{fontSize:'.72rem',fontWeight:700,letterSpacing:'.05em',textTransform:'uppercase',color:'#94A3B8',marginBottom:'8px'}}>Vehicle Photo</div>
            {profile.vehicle_photo_url ? (
              <div style={{position:'relative',display:'inline-block'}}>
                <img src={profile.vehicle_photo_url} alt="vehicle" style={{width:'100%',maxHeight:'160px',objectFit:'cover',borderRadius:'12px',border:'1px solid #E8E8E8'}}/>
                <button onClick={()=>vehicleInputRef.current?.click()} style={{
                  position:'absolute',bottom:'8px',right:'8px',background:'rgba(0,0,0,.6)',color:'#fff',
                  border:'none',borderRadius:'8px',padding:'6px 12px',fontSize:'.75rem',fontWeight:700,
                  cursor:'pointer',display:'flex',alignItems:'center',gap:'4px'
                }}>
                  <Camera size={12}/> Change
                </button>
              </div>
            ) : (
              <div onClick={()=>vehicleInputRef.current?.click()} style={{
                border:'2px dashed #D1D5DB',borderRadius:'12px',padding:'28px 16px',
                textAlign:'center',cursor:'pointer',background:'#FAFAFA',transition:'all .2s'
              }}>
                <Image size={28} style={{color:'#D1D5DB',marginBottom:'8px'}}/>
                <div style={{fontWeight:600,fontSize:'.88rem',color:'#94A3B8',marginBottom:'2px'}}>Upload vehicle photo</div>
                <div style={{fontSize:'.75rem',color:'#CBD5E1'}}>Helps verify your vehicle for ad placement</div>
              </div>
            )}
            <input ref={vehicleInputRef} type="file" accept="image/*" style={{display:'none'}} onChange={handleVehiclePhotoUpload}/>
            {uploadingVehicle && <div style={{textAlign:'center',padding:'8px',fontSize:'.82rem',color:'#D49800',fontWeight:600}}>Uploading...</div>}
          </div>

          {editing ? (
            <>
              <label style={{fontSize:'.72rem',fontWeight:700,letterSpacing:'.05em',textTransform:'uppercase',color:'#94A3B8',display:'block',marginBottom:'5px'}}>Vehicle Number</label>
              <input style={inputStyle} value={form.vehicle_number} onChange={e=>up('vehicle_number',e.target.value)} placeholder="e.g. MP09 AB 1234"/>
              <label style={{fontSize:'.72rem',fontWeight:700,letterSpacing:'.05em',textTransform:'uppercase',color:'#94A3B8',display:'block',marginBottom:'5px'}}>UPI ID (for payouts)</label>
              <input style={inputStyle} value={form.upi_id} onChange={e=>up('upi_id',e.target.value)} placeholder="e.g. rahul@paytm"/>
              <label style={{fontSize:'.72rem',fontWeight:700,letterSpacing:'.05em',textTransform:'uppercase',color:'#94A3B8',display:'block',marginBottom:'5px'}}>Vehicle Make</label>
              <input style={inputStyle} value={form.vehicle_make} onChange={e=>up('vehicle_make',e.target.value)} placeholder="e.g. Bajaj"/>
              <label style={{fontSize:'.72rem',fontWeight:700,letterSpacing:'.05em',textTransform:'uppercase',color:'#94A3B8',display:'block',marginBottom:'5px'}}>Vehicle Model</label>
              <input style={inputStyle} value={form.vehicle_model} onChange={e=>up('vehicle_model',e.target.value)} placeholder="e.g. RE Compact"/>
            </>
          ) : (
            <>
              <InfoRow icon={Truck} label="Vehicle Number" value={profile.vehicle_number} iconColor={vehicleColor}/>
              <InfoRow icon={Fuel} label="Fuel Type" value={FUEL_LABELS[profile.fuel_type]} iconColor="#D49800"/>
              <InfoRow icon={Maximize} label="Size" value={SIZE_LABELS[profile.vehicle_size]} iconColor="#1565C0"/>
              {profile.vehicle_make && <InfoRow icon={Truck} label="Make" value={profile.vehicle_make} iconColor="#666"/>}
              {profile.vehicle_model && <InfoRow icon={Truck} label="Model" value={profile.vehicle_model} iconColor="#666"/>}
              {profile.has_back_panel !== undefined && (
                <InfoRow icon={Image} label="Ad Panels" value={
                  [profile.has_back_panel && 'Back Panel', profile.has_side_panels && 'Side Panels'].filter(Boolean).join(' + ') || 'None'
                } iconColor="#8B5CF6"/>
              )}
            </>
          )}
        </SectionCard>
      )}

      {/* Payment Information */}
      {role === 'driver' && (
        <SectionCard title="Payment Information" icon={CreditCard} iconColor="#1DB954">
          {editing ? (
            <>
              <label style={{fontSize:'.72rem',fontWeight:700,letterSpacing:'.05em',textTransform:'uppercase',color:'#94A3B8',display:'block',marginBottom:'5px'}}>UPI ID</label>
              <input style={inputStyle} value={form.upi_id} onChange={e=>up('upi_id',e.target.value)} placeholder="e.g. rahul@paytm"/>
            </>
          ) : (
            <InfoRow icon={IndianRupee} label="UPI ID" value={profile.upi_id} iconColor="#1DB954"/>
          )}
        </SectionCard>
      )}

      {/* Business Information (advertisers only) */}
      {role === 'advertiser' && (
        <SectionCard title="Business Information" icon={Building2} iconColor="#D97706">
          <InfoRow icon={Building2} label="Company" value={profile.company_name || profile.full_name} iconColor="#D97706"/>
          <InfoRow icon={Mail} label="Business Email" value={user?.email} iconColor="#1565C0"/>
          <InfoRow icon={Phone} label="Contact" value={profile.phone} iconColor="#10B981"/>
        </SectionCard>
      )}

      {/* Account Actions */}
      <SectionCard title="Account" icon={Shield} iconColor="#E53935">
        <button onClick={signOut} style={{
          width:'100%',background:'#FDECEA',border:'1.5px solid #FFAAAA',
          borderRadius:'12px',padding:'14px 16px',
          display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',
          fontWeight:700,fontSize:'.9rem',color:'#C62828',cursor:'pointer',
          transition:'all .18s',fontFamily:'inherit'
        }}>
          <LogOut size={16}/> Sign Out
        </button>
      </SectionCard>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
