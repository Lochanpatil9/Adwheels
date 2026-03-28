import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { LogOut, Upload, CheckCircle, XCircle, Wallet, Camera, RefreshCw } from 'lucide-react'
import { sendNotification } from '../lib/api'
import NotificationBell from '../components/NotificationBell'

/* ── Shared light-theme style helpers ── */
const card = { background: '#fff', border: '1px solid #E8E8E8', borderRadius: '16px', padding: '20px', marginBottom: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }
const btn = (bg = '#FFBF00', col = '#111') => ({ background: bg, color: col, border: 'none', borderRadius: '12px', padding: '14px 20px', fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all .18s' })
const inp = { width: '100%', padding: '14px 15px', fontSize: '0.95rem', border: '1.5px solid #D8D8D8', borderRadius: '12px', background: '#fff', color: '#111', outline: 'none', fontFamily: 'inherit', marginBottom: '14px' }
const badge = (s) => {
  const m = { offered: ['#FFF8E6', '#7A5900'], active: ['#E6F9EE', '#0A6B30'], completed: ['#F5F5F5', '#666'], rejected: ['#FDECEA', '#C62828'], pending: ['#FFF8E6', '#7A5900'], approved: ['#E6F9EE', '#0A6B30'] }
  const [bg, c] = m[s] || ['#F5F5F5', '#666']
  return { display: 'inline-block', background: bg, color: c, fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '4px 10px', borderRadius: '100px' }
}

export default function DriverDashboard({ profile }) {
  const { signOut } = useAuth()
  const [tab, setTab] = useState('home')
  const [jobs, setJobs] = useState([])
  const [earnings, setEarnings] = useState([])
  const [totalEarnings, setTotal] = useState(0)
  const [monthEarnings, setMonth] = useState(0)
  const [totalPaidOut, setPaidOut] = useState(0)
  const [activeJob, setActiveJob] = useState(null)
  const [todayProof, setTodayProof] = useState(null)
  const [proofFile, setProofFile] = useState(null)
  const [proofPreview, setProofPreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [payoutAmount, setPayoutAmount] = useState('')
  const [payoutLoading, setPayoutLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() { await fetchJobs(); await fetchEarnings(); await fetchPayouts() }

  async function handleRefresh() {
    setRefreshing(true)
    await fetchAll()
    setTimeout(() => setRefreshing(false), 600)
    toast.success('Data refreshed')
  }

  async function fetchJobs() {
    const { data } = await supabase.from('driver_jobs')
      .select('*, campaigns(city, area, banner_url, status, plans(name, price, rickshaw_count, driver_payout, is_urgent))')
      .eq('driver_id', profile.id).order('offered_at', { ascending: false })
    const all = data || []
    setJobs(all)
    const active = all.find(j => j.status === 'active')
    setActiveJob(active || null)
    if (active) {
      const today = new Date().toISOString().split('T')[0]
      const { data: p } = await supabase.from('daily_proofs').select('*')
        .eq('driver_job_id', active.id).eq('proof_date', today).maybeSingle()
      setTodayProof(p || null)
    } else { setTodayProof(null) }
  }

  async function fetchEarnings() {
    const { data } = await supabase.from('earnings').select('*')
      .eq('driver_id', profile.id).order('earning_date', { ascending: false })
    const all = data || []
    setEarnings(all)
    setTotal(all.reduce((s, e) => s + e.amount, 0))
    const m = new Date().toISOString().slice(0, 7)
    setMonth(all.filter(e => e.earning_date?.startsWith(m)).reduce((s, e) => s + e.amount, 0))
  }

  async function fetchPayouts() {
    const { data } = await supabase.from('payouts').select('amount,status')
      .eq('driver_id', profile.id).in('status', ['paid', 'requested'])
    setPaidOut((data || []).reduce((s, p) => s + p.amount, 0))
  }

  async function handleAcceptJob(jobId) {
    const { error } = await supabase.from('driver_jobs')
      .update({ status: 'active', accepted_at: new Date().toISOString() })
      .eq('id', jobId).eq('driver_id', profile.id)
    if (error) return toast.error(error.message)
    toast.success('Job accepted! 🎉 Print the banner and install it.')
    await fetchAll(); setTab('proof')
  }

  async function handleRejectJob(jobId) {
    if (!window.confirm('Pass on this job? You can always accept future offers.')) return
    const { error } = await supabase.from('driver_jobs').update({ status: 'rejected' }).eq('id', jobId)
    if (error) return toast.error(error.message)
    toast.success('Job passed'); await fetchAll()
  }

  function handleProofSelect(e) {
    const file = e.target.files[0]; if (!file) return
    if (proofPreview) URL.revokeObjectURL(proofPreview)
    setProofFile(file); setProofPreview(URL.createObjectURL(file))
  }

  async function handleUploadProof() {
    if (!proofFile || !activeJob) return
    setUploading(true)
    const today = new Date().toISOString().split('T')[0]
    const ext = proofFile.name.split('.').pop()
    const fileName = `proof_${profile.id}_${Date.now()}.${ext}`
    const { error: upErr } = await supabase.storage.from('proofs').upload(fileName, proofFile, { upsert: true })
    if (upErr) { toast.error('Upload failed: ' + upErr.message); setUploading(false); return }
    const { data: { publicUrl } } = supabase.storage.from('proofs').getPublicUrl(fileName)
    const { error } = await supabase.from('daily_proofs').upsert({
      driver_job_id: activeJob.id, driver_id: profile.id,
      photo_url: publicUrl, proof_date: today, status: 'pending'
    }, { onConflict: 'driver_job_id,proof_date' })
    if (error) { toast.error(error.message); setUploading(false); return }
    toast.success('Photo submitted! ✅ Admin will review it.')

    try {
      const { data: campaign } = await supabase
        .from('campaigns')
        .select('advertiser_id, company_name')
        .eq('id', activeJob.campaign_id)
        .single()
      if (campaign) {
        await sendNotification({
          userId: campaign.advertiser_id,
          type: 'proof_uploaded',
          title: '📸 New Proof Photo',
          message: `Your driver submitted today\'s proof photo for "${campaign.company_name}". Check the Stats tab for details.`
        })
      }
    } catch (notifErr) {
      console.error('Proof notification error:', notifErr)
    }

    if (proofPreview) URL.revokeObjectURL(proofPreview)
    setProofFile(null); setProofPreview(null)
    await fetchAll(); setUploading(false)
  }

  async function handleRequestPayout() {
    const amount = parseInt(payoutAmount)
    if (!amount || amount < 500) return toast.error('Minimum payout is ₹500')
    if (amount > totalEarnings - totalPaidOut) return toast.error('Amount exceeds your balance')
    if (!profile.upi_id) return toast.error('Please add your UPI ID — contact admin')
    setPayoutLoading(true)
    const { error } = await supabase.from('payouts').insert({ driver_id: profile.id, amount, upi_id: profile.upi_id, status: 'requested' })
    if (error) toast.error(error.message)
    else { toast.success('Payout requested! 💸 Will be processed in 1–2 days.'); setPayoutAmount(''); fetchPayouts() }
    setPayoutLoading(false)
  }

  const offeredJobs = jobs.filter(j => j.status === 'offered')
  const historyJobs = jobs.filter(j => !['offered', 'active'].includes(j.status))
  const balance = totalEarnings - totalPaidOut

  // Calculate streak
  const streak = (() => {
    if (!earnings.length) return 0
    let count = 0
    const today = new Date()
    for (let i = 0; i < Math.min(earnings.length, 60); i++) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      if (earnings.some(e => e.earning_date === dateStr)) count++
      else break
    }
    return count
  })()

  const TABS = [
    { key: 'home', icon: '🏠', label: 'Home' },
    { key: 'jobs', icon: '💼', label: offeredJobs.length ? `Jobs (${offeredJobs.length})` : 'Jobs' },
    { key: 'proof', icon: '📸', label: activeJob && !todayProof ? 'Proof ⚠️' : 'Proof' },
    { key: 'earning', icon: '💰', label: 'Earnings' },
    { key: 'payout', icon: '💳', label: 'Payout' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#F5F5F5', color: '#111', fontFamily: "'DM Sans',sans-serif" }} className="mobile-padded">

      {/* NAV */}
      <div style={{ background: '#fff', borderBottom: '1px solid #EBEBEB', padding: '0 18px', height: '58px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div style={{ fontFamily: 'Bebas Neue,sans-serif', fontSize: '1.7rem', color: '#FFBF00', letterSpacing: '0.05em' }}>AdWheels</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button onClick={handleRefresh} style={{ background: 'none', border: '1.5px solid #E8E8E8', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#888' }} title="Refresh data">
            <RefreshCw size={14} className={refreshing ? 'refresh-spin' : ''} />
          </button>
          <NotificationBell userId={profile.id} />
          <span style={{ fontSize: '0.84rem', color: '#666' }}>👋 {profile.full_name}</span>
          <button onClick={signOut} style={{ background: 'none', border: '1.5px solid #E8E8E8', borderRadius: '8px', padding: '6px 12px', fontSize: '0.82rem', color: '#888', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <LogOut size={13} /> Logout
          </button>
        </div>
      </div>

      {/* GREETING BANNER */}
      <div style={{ background: 'linear-gradient(135deg,#FFBF00,#FF8C00)', padding: '20px 18px 18px', color: '#111' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '0.83rem', opacity: 0.65, marginBottom: '2px' }}>Welcome back,</div>
            <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: '1.25rem' }}>{profile.full_name} 👋</div>
            <div style={{ fontSize: '0.82rem', marginTop: '3px', opacity: 0.7 }}>🛺 Driver · {profile.city}</div>
          </div>
          {streak > 0 && (
            <div style={{ background: 'rgba(0,0,0,0.15)', borderRadius: '12px', padding: '8px 14px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'Bebas Neue,sans-serif', fontSize: '1.5rem', lineHeight: 1, color: '#111' }}>{streak}</div>
              <div style={{ fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', opacity: 0.7 }}>Day Streak 🔥</div>
            </div>
          )}
        </div>
      </div>

      {/* TOP TABS — hidden on mobile when bottom nav is visible */}
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
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`bottom-nav-item${tab === t.key ? ' bottom-nav-item--active' : ''}`}
          >
            <span className="nav-icon">{t.icon}</span>
            <span className="nav-label" style={{ color: tab === t.key ? '#D49800' : '#999' }}>{t.label}</span>
          </button>
        ))}
      </div>

      <div style={{ padding: '16px', maxWidth: '640px', margin: '0 auto' }}>

        {/* ── HOME ── */}
        {tab === 'home' && <div className="tab-content">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
            <div style={card}>
              <div style={{ fontFamily: 'Bebas Neue,sans-serif', fontSize: '2rem', color: '#1DB954', lineHeight: 1 }}>₹{monthEarnings}</div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '4px' }}>This Month</div>
            </div>
            <div style={card}>
              <div style={{ fontFamily: 'Bebas Neue,sans-serif', fontSize: '2rem', color: '#D49800', lineHeight: 1 }}>₹{totalEarnings}</div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '4px' }}>Total Earned</div>
            </div>
          </div>

          {offeredJobs.length > 0 && (
            <div onClick={() => setTab('jobs')} style={{ background: '#FFF8E6', border: '1.5px solid #FFE08A', borderRadius: '14px', padding: '16px 18px', marginBottom: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'transform .15s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.01)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#7A5900' }}>🔔 New Job Available!</div>
                <div style={{ fontSize: '0.83rem', color: '#999', marginTop: '2px' }}>Tap to see details and earn money</div>
              </div>
              <span style={{ fontSize: '1.4rem', color: '#D49800' }}>→</span>
            </div>
          )}

          {activeJob ? (
            <div style={{ ...card, border: '1.5px solid #A3E4BE' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <span style={{ width: '9px', height: '9px', background: '#1DB954', borderRadius: '50%', display: 'inline-block' }} />
                <span style={{ fontWeight: 800, color: '#0A6B30', fontSize: '0.93rem' }}>Active Job Running</span>
              </div>
              <div style={{ fontSize: '0.87rem', color: '#555', marginBottom: '4px' }}>📍 {activeJob.campaigns?.city} — {activeJob.campaigns?.area}</div>
              <div style={{ fontSize: '0.87rem', color: '#555', marginBottom: '14px' }}>💰 ₹{activeJob.campaigns?.plans?.driver_payout}/month + ₹175 for printing</div>

              {/* Banner preview */}
              {activeJob.campaigns?.banner_url && (
                <div style={{ marginBottom: '14px' }}>
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>Your Ad Banner</div>
                  <img src={activeJob.campaigns.banner_url} alt="campaign banner" style={{ width: '100%', maxHeight: '100px', objectFit: 'contain', borderRadius: '10px', border: '1px solid #E8E8E8', background: '#fafafa' }} />
                </div>
              )}

              {todayProof
                ? <div style={{ background: '#E6F9EE', borderRadius: '10px', padding: '10px 14px', fontSize: '0.87rem', color: '#0A6B30', fontWeight: 700 }}>✅ Today's photo submitted — {todayProof.status}</div>
                : <div onClick={() => setTab('proof')} style={{ background: '#FFF8E6', borderRadius: '10px', padding: '12px 14px', fontSize: '0.87rem', color: '#7A5900', fontWeight: 700, cursor: 'pointer', textAlign: 'center', transition: 'transform .15s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.01)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                  📸 Upload today's photo to earn today →
                </div>
              }
            </div>
          ) : !offeredJobs.length && (
            <div style={{ textAlign: 'center', padding: '48px 16px', color: '#bbb' }}>
              <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🛺</div>
              <div style={{ fontWeight: 700, color: '#999', fontSize: '1rem', marginBottom: '4px' }}>No jobs yet</div>
              <div style={{ fontSize: '0.84rem' }}>We'll notify you when a job is available!</div>
            </div>
          )}

          <div style={{ background: '#EFF6FF', border: '1px solid #BBDEFB', borderRadius: '12px', padding: '13px 16px', fontSize: '0.84rem', color: '#1565C0', marginTop: '10px' }}>
            💡 <b>Remember:</b> Upload your rickshaw photo every day to get paid. No photo = no earning for that day.
          </div>
        </div>}

        {/* ── JOBS ── */}
        {tab === 'jobs' && <div className="tab-content">
          {offeredJobs.length > 0 && <>
            <div style={{ fontWeight: 800, fontSize: '1rem', marginBottom: '14px', color: '#111' }}>New Job Offers</div>
            {offeredJobs.map(job => (
              <div key={job.id} style={{ ...card, border: '1.5px solid #FFE08A' }}>
                {job.campaigns?.plans?.is_urgent && (
                  <div style={{ background: '#FDECEA', color: '#C62828', fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.07em', textTransform: 'uppercase', padding: '4px 10px', borderRadius: '6px', display: 'inline-block', marginBottom: '10px' }}>⚡ Urgent</div>
                )}
                <div style={{ fontWeight: 800, fontSize: '0.95rem', marginBottom: '4px', color: '#111' }}>{job.campaigns?.plans?.name} Plan</div>
                <div style={{ fontSize: '0.87rem', color: '#666', marginBottom: '14px' }}>📍 {job.campaigns?.city} — {job.campaigns?.area}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                  <div style={{ background: '#E6F9EE', borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
                    <div style={{ fontFamily: 'Bebas Neue,sans-serif', fontSize: '1.6rem', color: '#0A6B30' }}>₹{job.campaigns?.plans?.driver_payout}</div>
                    <div style={{ fontSize: '0.7rem', color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Per Month</div>
                  </div>
                  <div style={{ background: '#FFF8E6', borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
                    <div style={{ fontFamily: 'Bebas Neue,sans-serif', fontSize: '1.6rem', color: '#7A5900' }}>+₹175</div>
                    <div style={{ fontSize: '0.7rem', color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Print Money</div>
                  </div>
                </div>
                {job.campaigns?.banner_url && <img src={job.campaigns.banner_url} alt="banner" style={{ width: '100%', maxHeight: '90px', objectFit: 'contain', borderRadius: '8px', border: '1px solid #E8E8E8', marginBottom: '14px', background: '#fafafa' }} />}
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button className="action-btn" onClick={() => handleAcceptJob(job.id)} style={{ ...btn('#1DB954', '#fff'), flex: 1, justifyContent: 'center' }}><CheckCircle size={16} /> Accept Job</button>
                  <button className="action-btn" onClick={() => handleRejectJob(job.id)} style={{ background: '#FDECEA', color: '#C62828', border: '1.5px solid #FFAAAA', borderRadius: '12px', padding: '12px 16px', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}><XCircle size={15} /> Pass</button>
                </div>
              </div>
            ))}
          </>}

          {historyJobs.length > 0 && <>
            <div style={{ fontWeight: 800, fontSize: '1rem', margin: '20px 0 12px', color: '#111' }}>Past Jobs</div>
            {historyJobs.map(job => (
              <div key={job.id} style={card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.93rem', marginBottom: '3px' }}>{job.campaigns?.plans?.name} · {job.campaigns?.city}</div>
                    <div style={{ fontSize: '0.82rem', color: '#999' }}>{job.campaigns?.area}</div>
                  </div>
                  <span style={badge(job.status)}>{job.status}</span>
                </div>
              </div>
            ))}
          </>}

          {jobs.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px 16px', color: '#bbb' }}>
              <div style={{ fontSize: '3rem', marginBottom: '10px' }}>📭</div>
              <div>No jobs yet — we'll assign one soon!</div>
            </div>
          )}
        </div>}

        {/* ── PROOF ── */}
        {tab === 'proof' && <div className="tab-content">
          {!activeJob
            ? <div style={{ textAlign: 'center', padding: '48px 16px', color: '#bbb' }}>
              <div style={{ fontSize: '3rem', marginBottom: '10px' }}>📷</div>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: '#999', marginBottom: '6px' }}>No active job</div>
              <div style={{ fontSize: '0.84rem', marginBottom: '16px' }}>Accept a job first, then upload your photo here</div>
              {offeredJobs.length > 0 && (
                <button className="action-btn" onClick={() => setTab('jobs')} style={{ ...btn('#FFBF00', '#111'), margin: '0 auto' }}>View Job Offers →</button>
              )}
            </div>
            : <div style={card}>
              <div style={{ fontWeight: 800, fontSize: '1rem', marginBottom: '6px' }}>📸 Today's Photo</div>
              <div style={{ fontSize: '0.87rem', color: '#666', marginBottom: '16px', lineHeight: 1.6 }}>
                Take a clear photo of the ad banner on your rickshaw.<br />
                <b style={{ color: '#111' }}>No photo = no earning today.</b>
              </div>
              {todayProof
                ? <div style={{ background: '#E6F9EE', border: '1px solid #A3E4BE', borderRadius: '12px', padding: '16px' }}>
                  <div style={{ color: '#0A6B30', fontWeight: 800, marginBottom: '10px' }}>✅ Photo submitted — {todayProof.status}</div>
                  <img src={todayProof.photo_url} alt="proof" style={{ maxWidth: '100%', maxHeight: '220px', objectFit: 'contain', borderRadius: '8px' }} />
                </div>
                : <>
                  <label htmlFor="proofInput" style={{ cursor: 'pointer', display: 'block' }}>
                    <div style={{ border: '2px dashed #1DB954', borderRadius: '14px', padding: '36px 20px', textAlign: 'center', background: '#F0FFF6', transition: 'background .2s' }}>
                      {proofPreview
                        ? <img src={proofPreview} alt="preview" style={{ maxHeight: '180px', maxWidth: '100%', borderRadius: '8px' }} />
                        : <>
                          <Camera size={40} style={{ color: '#1DB954', marginBottom: '12px' }} />
                          <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '6px' }}>Tap to take / upload photo</div>
                          <div style={{ fontSize: '0.82rem', color: '#888' }}>Show the banner on your rickshaw clearly</div>
                        </>
                      }
                    </div>
                  </label>
                  <input id="proofInput" type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handleProofSelect} />
                  {proofPreview && (
                    <button className="action-btn" onClick={handleUploadProof} disabled={uploading} style={{ ...btn('#1DB954', '#fff'), width: '100%', justifyContent: 'center', marginTop: '14px', opacity: uploading ? .6 : 1 }}>
                      {uploading ? 'Uploading…' : <><Upload size={16} /> Submit Photo</>}
                    </button>
                  )}
                </>
              }
            </div>
          }
        </div>}

        {/* ── EARNINGS — Enhanced ── */}
        {tab === 'earning' && <div className="tab-content">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '16px' }}>
            {[{ n: `₹${monthEarnings}`, l: 'This Month', c: '#1DB954' }, { n: `₹${totalEarnings}`, l: 'All Time', c: '#D49800' }, { n: earnings.length, l: 'Days Earned', c: '#555' }].map(x => (
              <div key={x.l} style={card}>
                <div style={{ fontFamily: 'Bebas Neue,sans-serif', fontSize: '1.7rem', color: x.c, lineHeight: 1 }}>{x.n}</div>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '4px' }}>{x.l}</div>
              </div>
            ))}
          </div>

          {/* Streak + Milestone badges */}
          {streak > 0 && (
            <div style={{ background: 'linear-gradient(135deg,#FFF8E6,#FFF0D0)', border: '1.5px solid #FFE08A', borderRadius: '14px', padding: '16px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '10px' }}>
                <div style={{ fontFamily: 'Bebas Neue,sans-serif', fontSize: '2.2rem', color: '#D49800', lineHeight: 1 }}>{streak}</div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#7A5900' }}>Day Streak 🔥</div>
                  <div style={{ fontSize: '0.78rem', color: '#999' }}>Keep uploading daily!</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {[{ d: 7, e: '🥉', l: '7 Days' }, { d: 14, e: '🥈', l: '14 Days' }, { d: 30, e: '🥇', l: '30 Days' }].map(m => (
                  <div key={m.d} style={{ background: streak >= m.d ? '#1DB954' : '#E8E8E8', color: streak >= m.d ? '#fff' : '#bbb', borderRadius: '100px', padding: '5px 12px', fontSize: '0.72rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {m.e} {m.l} {streak >= m.d ? '✓' : ''}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Earning Calendar — last 30 days */}
          <div style={{ ...card, padding: '16px', marginBottom: '14px' }}>
            <div style={{ fontWeight: 800, fontSize: '0.88rem', marginBottom: '10px' }}>📅 Last 30 Days</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '4px' }}>
              {Array.from({ length: 30 }, (_, i) => {
                const d = new Date(); d.setDate(d.getDate() - (29 - i))
                const dateStr = d.toISOString().split('T')[0]
                const earned = earnings.find(e => e.earning_date === dateStr)
                const isToday = dateStr === new Date().toISOString().split('T')[0]
                return (
                  <div key={dateStr} title={`${dateStr}${earned ? ` — ₹${earned.amount}` : ''}`} style={{
                    aspectRatio: '1', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: earned ? '#1DB954' : isToday ? '#FFF8E6' : '#F5F5F5',
                    color: earned ? '#fff' : isToday ? '#D49800' : '#ccc',
                    fontSize: '0.6rem', fontWeight: 700, border: isToday ? '2px solid #FFBF00' : '1px solid transparent',
                    cursor: 'default'
                  }}>
                    {d.getDate()}
                  </div>
                )
              })}
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px', fontSize: '0.68rem', color: '#888' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '8px', height: '8px', borderRadius: '3px', background: '#1DB954', display: 'inline-block' }} /> Earned</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '8px', height: '8px', borderRadius: '3px', background: '#F5F5F5', border: '1px solid #E8E8E8', display: 'inline-block' }} /> Missed</span>
            </div>
          </div>

          {earnings.length === 0
            ? <div style={{ textAlign: 'center', padding: '48px 16px', color: '#bbb' }}><div style={{ fontSize: '3rem', marginBottom: '10px' }}>💸</div><div>No earnings yet — accept a job and upload daily photos!</div></div>
            : <div style={{ background: '#fff', borderRadius: '16px', overflow: 'hidden', border: '1px solid #E8E8E8' }}>
              {earnings.slice(0, 40).map((e, i) => (
                <div key={e.id} style={{ padding: '14px 16px', borderBottom: i < earnings.length - 1 ? '1px solid #F0F0F0' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>{e.type === 'daily' ? '📅 Daily earning' : e.type === 'print_reimbursement' ? '🖨️ Print money' : '🎁 Bonus'}</div>
                    <div style={{ fontSize: '0.78rem', color: '#aaa', marginTop: '2px' }}>{e.earning_date}</div>
                  </div>
                  <div style={{ fontFamily: 'Bebas Neue,sans-serif', fontSize: '1.3rem', color: '#1DB954' }}>+₹{e.amount}</div>
                </div>
              ))}
            </div>
          }
        </div>}

        {/* ── PAYOUT ── */}
        {tab === 'payout' && <div className="tab-content">
          <div style={{ background: 'linear-gradient(135deg,#1DB954,#0E9E42)', borderRadius: '16px', padding: '22px', marginBottom: '14px', color: '#fff' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', opacity: .8, marginBottom: '6px' }}>Available Balance</div>
            <div style={{ fontFamily: 'Bebas Neue,sans-serif', fontSize: '2.8rem', lineHeight: 1, marginBottom: '4px' }}>₹{balance}</div>
            <div style={{ fontSize: '0.82rem', opacity: .75 }}>UPI: {profile.upi_id || 'Not set — contact admin'}</div>
          </div>
          <div style={card}>
            <div style={{ fontWeight: 800, fontSize: '1rem', marginBottom: '4px' }}>Request Payout</div>
            <div style={{ fontSize: '0.85rem', color: '#888', marginBottom: '16px' }}>Minimum ₹500 · Paid to your UPI in 1–2 days</div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.88rem', marginBottom: '6px', color: '#444' }}>Amount (₹)</label>
            <input type="number" placeholder="Enter amount (min ₹500)" value={payoutAmount} onChange={e => setPayoutAmount(e.target.value)} style={inp} />
            <button className="action-btn" onClick={handleRequestPayout} disabled={payoutLoading} style={{ ...btn('#1DB954', '#fff'), width: '100%', justifyContent: 'center', opacity: payoutLoading ? .6 : 1 }}>
              {payoutLoading ? 'Requesting…' : <><Wallet size={16} /> Request Payout</>}
            </button>
          </div>
          <div style={{ background: '#FFF8E6', border: '1px solid #FFE08A', borderRadius: '12px', padding: '13px 16px', fontSize: '0.84rem', color: '#7A5900' }}>
            💡 Earnings are credited only after admin approves your daily photo. Upload every day!
          </div>
        </div>}

      </div>
    </div>
  )
}