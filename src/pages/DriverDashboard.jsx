import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { LogOut, Upload, CheckCircle, XCircle, Wallet, Camera } from 'lucide-react'

const s = {
  app: { minHeight:'100vh', background:'var(--black)', color:'var(--white)' },
  nav: { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 32px', borderBottom:'1px solid var(--border)', background:'rgba(8,8,8,0.95)', position:'sticky', top:0, zIndex:100 },
  logo: { fontFamily:'Bebas Neue', fontSize:'1.8rem', color:'var(--yellow)', letterSpacing:'0.05em' },
  navRight: { display:'flex', alignItems:'center', gap:'16px' },
  logoutBtn: { background:'transparent', border:'1px solid var(--border)', color:'rgba(245,240,232,0.5)', padding:'8px 14px', borderRadius:'6px', cursor:'pointer', display:'flex', alignItems:'center', gap:'6px', fontSize:'0.82rem' },
  content: { padding:'32px', maxWidth:'900px', margin:'0 auto' },
  pageTitle: { fontFamily:'Syne', fontSize:'1.6rem', fontWeight:800, marginBottom:'6px' },
  pageSub: { fontSize:'0.88rem', color:'rgba(245,240,232,0.4)', marginBottom:'32px' },
  tabs: { display:'flex', gap:'4px', background:'rgba(245,240,232,0.04)', borderRadius:'10px', padding:'4px', marginBottom:'32px', flexWrap:'wrap' },
  tab: (active) => ({ padding:'10px 20px', border:'none', borderRadius:'7px', fontFamily:'Syne', fontSize:'0.85rem', fontWeight:700, cursor:'pointer', transition:'all 0.2s', background: active ? 'var(--green)' : 'transparent', color: active ? 'var(--black)' : 'rgba(245,240,232,0.45)' }),
  statsRow: { display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:'16px', marginBottom:'32px' },
  statCard: { background:'var(--card)', border:'1px solid var(--border)', borderRadius:'12px', padding:'24px' },
  statNum: { fontFamily:'Bebas Neue', fontSize:'2.5rem', color:'var(--green)', lineHeight:1 },
  statLabel: { fontSize:'0.76rem', color:'rgba(245,240,232,0.4)', letterSpacing:'0.06em', textTransform:'uppercase', marginTop:'4px' },
  card: { background:'var(--card)', border:'1px solid var(--border)', borderRadius:'12px', padding:'24px', marginBottom:'16px' },
  badge: (status) => {
    const map = {
      offered: ['rgba(255,208,0,0.12)', 'var(--yellow)'],
      accepted: ['rgba(0,100,255,0.12)', '#6af'],
      active: ['rgba(0,230,118,0.12)', 'var(--green)'],
      completed: ['rgba(128,128,128,0.12)', '#888'],
      rejected: ['rgba(255,45,45,0.12)', 'var(--red)'],
      pending: ['rgba(255,208,0,0.12)', 'var(--yellow)'],
      approved: ['rgba(0,230,118,0.12)', 'var(--green)'],
    }
    const [bg, col] = map[status] || ['rgba(128,128,128,0.1)', '#888']
    return { display:'inline-block', background:bg, color:col, fontSize:'0.72rem', fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', padding:'4px 12px', borderRadius:'100px' }
  },
  actionBtn: (color) => ({
    background: color==='green' ? 'var(--green)' : color==='red' ? 'rgba(255,45,45,0.15)' : 'rgba(245,240,232,0.08)',
    color: color==='green' ? 'var(--black)' : color==='red' ? 'var(--red)' : 'var(--white)',
    fontFamily:'Syne', fontWeight:700, fontSize:'0.85rem', padding:'10px 20px',
    border: color==='red' ? '1px solid rgba(255,45,45,0.3)' : 'none',
    borderRadius:'8px', cursor:'pointer', display:'flex', alignItems:'center', gap:'6px', transition:'all 0.2s'
  }),
  uploadBox: { border:'2px dashed rgba(0,230,118,0.3)', borderRadius:'12px', padding:'32px', textAlign:'center', cursor:'pointer', transition:'all 0.2s', marginTop:'16px', background:'rgba(0,230,118,0.03)' },
  btn: { background:'var(--green)', color:'var(--black)', fontFamily:'Syne', fontSize:'0.95rem', fontWeight:800, padding:'14px 28px', border:'none', borderRadius:'8px', cursor:'pointer', display:'flex', alignItems:'center', gap:'8px', width:'100%', justifyContent:'center', marginTop:'16px' },
  emptyState: { textAlign:'center', padding:'60px 20px', color:'rgba(245,240,232,0.3)' },
  earningRow: { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 0', borderBottom:'1px solid var(--border)' },
}

export default function DriverDashboard({ profile }) {
  const [tab, setTab] = useState('dashboard')
  const [jobs, setJobs] = useState([])
  const [earnings, setEarnings] = useState([])
  const [totalEarnings, setTotalEarnings] = useState(0)
  const [monthEarnings, setMonthEarnings] = useState(0)
  const [proofFile, setProofFile] = useState(null)
  const [proofPreview, setProofPreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [activeJob, setActiveJob] = useState(null)
  const [todayProof, setTodayProof] = useState(null)
  const [payoutAmount, setPayoutAmount] = useState('')
  const [payoutLoading, setPayoutLoading] = useState(false)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    await fetchJobs()
    await fetchEarnings()
  }

  async function fetchJobs() {
    const { data, error } = await supabase
      .from('driver_jobs')
      .select('*, campaigns(city, area, banner_url, status, plans(name, price, rickshaw_count, driver_payout, is_urgent))')
      .eq('driver_id', profile.id)
      .order('offered_at', { ascending: false })

    if (error) { console.error(error); return }

    const allJobs = data || []
    setJobs(allJobs)

    // Find active job
    const active = allJobs.find(j => j.status === 'active')
    setActiveJob(active || null)

    // Check today's proof for active job
    if (active) {
      const today = new Date().toISOString().split('T')[0]
      const { data: proofData } = await supabase
        .from('daily_proofs')
        .select('*')
        .eq('driver_job_id', active.id)
        .eq('proof_date', today)
        .maybeSingle()
      setTodayProof(proofData || null)
    } else {
      setTodayProof(null)
    }
  }

  async function fetchEarnings() {
    const { data } = await supabase
      .from('earnings')
      .select('*')
      .eq('driver_id', profile.id)
      .order('earning_date', { ascending: false })

    const all = data || []
    setEarnings(all)
    setTotalEarnings(all.reduce((sum, e) => sum + e.amount, 0))
    const thisMonth = new Date().toISOString().slice(0, 7)
    setMonthEarnings(all.filter(e => e.earning_date?.startsWith(thisMonth)).reduce((sum, e) => sum + e.amount, 0))
  }

  async function handleAcceptJob(jobId) {
  const { error } = await supabase
    .from('driver_jobs')
    .update({ status: 'active', accepted_at: new Date().toISOString() })
    .eq('id', jobId)
    .eq('driver_id', profile.id)

  if (error) { toast.error(error.message); console.error(error); return }
  toast.success('Job accepted! 🎉 Print the banner and install it.')
  
  // Force refresh jobs from DB
  await fetchJobs()
  await fetchEarnings()
  setTab('proof')
}

  async function handleRejectJob(jobId) {
    const { error } = await supabase
      .from('driver_jobs')
      .update({ status: 'rejected' })
      .eq('id', jobId)

    if (error) { toast.error(error.message); return }
    toast.success('Job rejected')
    await fetchAll()
  }

  function handleProofSelect(e) {
    const file = e.target.files[0]
    if (!file) return
    setProofFile(file)
    setProofPreview(URL.createObjectURL(file))
  }

  async function handleUploadProof() {
    if (!proofFile || !activeJob) return
    setUploading(true)

    const today = new Date().toISOString().split('T')[0]
    const ext = proofFile.name.split('.').pop()
    const fileName = `proof_${profile.id}_${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('proofs')
      .upload(fileName, proofFile, { upsert: true })

    if (uploadError) {
      toast.error('Upload failed: ' + uploadError.message)
      setUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage.from('proofs').getPublicUrl(fileName)

    const { error } = await supabase.from('daily_proofs').upsert({
      driver_job_id: activeJob.id,
      driver_id: profile.id,
      photo_url: publicUrl,
      proof_date: today,
      status: 'pending'
    }, { onConflict: 'driver_job_id,proof_date' })

    if (error) {
      toast.error(error.message)
      setUploading(false)
      return
    }

    toast.success("Proof submitted! ✅ Admin will review and credit your earning.")
    setProofFile(null)
    setProofPreview(null)
    await fetchAll()
    setUploading(false)
  }

  async function handleRequestPayout() {
    const amount = parseInt(payoutAmount)
    if (!amount || amount < 500) return toast.error('Minimum payout is ₹500')
    if (amount > totalEarnings) return toast.error('Amount exceeds your balance')
    if (!profile.upi_id) return toast.error('Please add your UPI ID — contact admin')
    setPayoutLoading(true)
    const { error } = await supabase.from('payouts').insert({
      driver_id: profile.id,
      amount,
      upi_id: profile.upi_id,
      status: 'requested'
    })
    if (error) toast.error(error.message)
    else { toast.success('Payout requested! 💸 Will be processed in 1-2 days.'); setPayoutAmount('') }
    setPayoutLoading(false)
  }

  const offeredJobs = jobs.filter(j => j.status === 'offered')
  const historyJobs = jobs.filter(j => !['offered'].includes(j.status))

  return (
    <div style={s.app}>
      <nav style={s.nav}>
        <div style={s.logo}>AdWheels</div>
        <div style={s.navRight}>
          <span style={{fontSize:'0.85rem', color:'rgba(245,240,232,0.45)'}}>👋 {profile.full_name}</span>
          <button style={s.logoutBtn} onClick={() => supabase.auth.signOut()}><LogOut size={14}/> Logout</button>
        </div>
      </nav>

      <div style={s.content}>
        <div style={s.pageTitle}>Driver Dashboard</div>
        <div style={s.pageSub}>Accept jobs, upload daily proof, earn every day 💰</div>

        <div style={s.tabs}>
          {[
            { key:'dashboard', label:'Dashboard' },
            { key:'jobs', label: offeredJobs.length > 0 ? `Jobs 🔴${offeredJobs.length}` : 'Jobs' },
            { key:'proof', label: activeJob && !todayProof ? 'Proof ⚠️' : 'Proof' },
            { key:'earnings', label:'Earnings' },
            { key:'payout', label:'Payout' },
          ].map(t => (
            <button key={t.key} style={s.tab(tab===t.key)} onClick={() => setTab(t.key)}>{t.label}</button>
          ))}
        </div>

        {/* ── DASHBOARD ── */}
        {tab === 'dashboard' && <>
          <div style={s.statsRow}>
            <div style={s.statCard}><div style={s.statNum}>₹{monthEarnings}</div><div style={s.statLabel}>This Month</div></div>
            <div style={s.statCard}><div style={{...s.statNum, color:'var(--yellow)'}}>₹{totalEarnings}</div><div style={s.statLabel}>Total Earned</div></div>
            <div style={s.statCard}><div style={{...s.statNum, color:'var(--orange)'}}>{offeredJobs.length}</div><div style={s.statLabel}>New Job Offers</div></div>
            <div style={s.statCard}><div style={{...s.statNum, color:'#6af'}}>{activeJob ? '1' : '0'}</div><div style={s.statLabel}>Active Job</div></div>
          </div>

          {/* Active job banner */}
          {activeJob && (
            <div style={{background:'linear-gradient(135deg,#001a0a,#002a10)', border:'1.5px solid rgba(0,230,118,0.25)', borderRadius:'14px', padding:'24px', marginBottom:'20px'}}>
              <div style={{fontFamily:'Syne', fontWeight:800, color:'var(--green)', marginBottom:'8px'}}>🟢 Active Job — {activeJob.campaigns?.plans?.name} Plan</div>
              <div style={{fontSize:'0.88rem', color:'rgba(245,240,232,0.55)', marginBottom:'4px'}}>📍 {activeJob.campaigns?.city} — {activeJob.campaigns?.area}</div>
              <div style={{fontSize:'0.88rem', color:'rgba(245,240,232,0.55)', marginBottom:'16px'}}>💰 ₹{activeJob.campaigns?.plans?.driver_payout}/month + ₹175 print reimbursement</div>
              {todayProof
                ? <div style={{padding:'10px 16px', background:'rgba(0,230,118,0.1)', borderRadius:'8px', fontSize:'0.85rem', color:'var(--green)', fontWeight:600}}>
                    ✅ Today's proof uploaded — Status: {todayProof.status}
                  </div>
                : <div style={{padding:'10px 16px', background:'rgba(255,208,0,0.08)', borderRadius:'8px', fontSize:'0.85rem', color:'var(--yellow)', fontWeight:600, cursor:'pointer'}} onClick={() => setTab('proof')}>
                    ⚠️ Upload today's proof to unlock daily earning →
                  </div>
              }
            </div>
          )}

          {offeredJobs.length > 0 && (
            <div style={{padding:'14px 18px', background:'rgba(255,208,0,0.06)', border:'1px solid rgba(255,208,0,0.2)', borderRadius:'10px', fontSize:'0.88rem', color:'var(--yellow)', fontWeight:600, cursor:'pointer', marginBottom:'16px'}} onClick={() => setTab('jobs')}>
              🔔 You have {offeredJobs.length} new job offer{offeredJobs.length > 1 ? 's' : ''}! Tap to view →
            </div>
          )}

          {!activeJob && offeredJobs.length === 0 && (
            <div style={s.emptyState}>
              <div style={{fontSize:'3rem', marginBottom:'12px'}}>🛺</div>
              <div style={{fontFamily:'Syne', fontWeight:700, fontSize:'1.1rem', marginBottom:'8px'}}>No jobs yet</div>
              <div style={{fontSize:'0.88rem'}}>Our team will assign jobs as campaigns come in. Stay tuned!</div>
            </div>
          )}
        </>}

        {/* ── JOBS ── */}
        {tab === 'jobs' && <>
          {offeredJobs.length > 0 && <>
            <div style={{fontFamily:'Syne', fontWeight:800, fontSize:'1.1rem', marginBottom:'16px'}}>New Job Offers</div>
            {offeredJobs.map(job => (
              <div key={job.id} style={{...s.card, borderColor:'rgba(255,208,0,0.25)'}}>
                {job.campaigns?.plans?.is_urgent && (
                  <div style={{fontSize:'0.75rem', fontWeight:800, color:'var(--red)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:'10px'}}>⚡ URGENT — Higher Pay</div>
                )}
                <div style={{fontFamily:'Syne', fontWeight:700, fontSize:'1rem', marginBottom:'6px'}}>{job.campaigns?.plans?.name} Plan</div>
                <div style={{fontSize:'0.85rem', color:'rgba(245,240,232,0.5)', marginBottom:'12px'}}>📍 {job.campaigns?.city} — {job.campaigns?.area}</div>
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'16px'}}>
                  <div style={{background:'rgba(0,230,118,0.06)', borderRadius:'8px', padding:'12px', textAlign:'center'}}>
                    <div style={{fontFamily:'Bebas Neue', fontSize:'1.6rem', color:'var(--green)'}}>₹{job.campaigns?.plans?.driver_payout}</div>
                    <div style={{fontSize:'0.72rem', color:'rgba(245,240,232,0.4)', textTransform:'uppercase', letterSpacing:'0.06em'}}>Per Month</div>
                  </div>
                  <div style={{background:'rgba(255,208,0,0.06)', borderRadius:'8px', padding:'12px', textAlign:'center'}}>
                    <div style={{fontFamily:'Bebas Neue', fontSize:'1.6rem', color:'var(--yellow)'}}>+₹175</div>
                    <div style={{fontSize:'0.72rem', color:'rgba(245,240,232,0.4)', textTransform:'uppercase', letterSpacing:'0.06em'}}>Print Cost</div>
                  </div>
                </div>
                {job.campaigns?.banner_url && (
                  <img src={job.campaigns.banner_url} alt="banner" style={{width:'100%', maxHeight:'120px', objectFit:'contain', borderRadius:'8px', border:'1px solid var(--border)', marginBottom:'16px', background:'#1a1a1a'}}/>
                )}
                <div style={{display:'flex', gap:'10px'}}>
                  <button style={s.actionBtn('green')} onClick={() => handleAcceptJob(job.id)}><CheckCircle size={16}/> Accept Job</button>
                  <button style={s.actionBtn('red')} onClick={() => handleRejectJob(job.id)}><XCircle size={16}/> Reject</button>
                </div>
              </div>
            ))}
          </>}

          {historyJobs.length > 0 && <>
            <div style={{fontFamily:'Syne', fontWeight:800, fontSize:'1.1rem', margin:'28px 0 16px'}}>Job History</div>
            {historyJobs.map(job => (
              <div key={job.id} style={s.card}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                  <div>
                    <div style={{fontFamily:'Syne', fontWeight:700, fontSize:'0.95rem', marginBottom:'4px'}}>{job.campaigns?.plans?.name} · {job.campaigns?.city}</div>
                    <div style={{fontSize:'0.82rem', color:'rgba(245,240,232,0.4)'}}>{job.campaigns?.area}</div>
                  </div>
                  <span style={s.badge(job.status)}>{job.status}</span>
                </div>
              </div>
            ))}
          </>}

          {jobs.length === 0 && (
            <div style={s.emptyState}>
              <div style={{fontSize:'3rem', marginBottom:'12px'}}>📭</div>
              <div>No jobs yet — admin will assign one soon!</div>
            </div>
          )}
        </>}

        {/* ── PROOF ── */}
        {tab === 'proof' && <>
          {!activeJob
            ? <div style={s.emptyState}>
                <div style={{fontSize:'3rem', marginBottom:'12px'}}>📷</div>
                <div style={{fontFamily:'Syne', fontWeight:700, marginBottom:'8px'}}>No active job</div>
                <div style={{fontSize:'0.88rem'}}>Accept a job first to start uploading daily proof</div>
              </div>
            : <div style={s.card}>
                <div style={{fontFamily:'Syne', fontWeight:800, fontSize:'1.1rem', marginBottom:'8px'}}>Today's Proof</div>
                <div style={{fontSize:'0.85rem', color:'rgba(245,240,232,0.45)', marginBottom:'16px', lineHeight:1.7}}>
                  Upload a clear photo of the banner installed on your rickshaw.<br/>
                  <strong style={{color:'var(--white)'}}>Without daily proof, today's earning won't be added.</strong>
                </div>

                {todayProof
                  ? <div style={{padding:'16px', background:'rgba(0,230,118,0.08)', border:'1px solid rgba(0,230,118,0.2)', borderRadius:'10px'}}>
                      <div style={{color:'var(--green)', fontWeight:700, marginBottom:'12px'}}>✅ Today's proof submitted — Status: <span style={s.badge(todayProof.status)}>{todayProof.status}</span></div>
                      <img src={todayProof.photo_url} alt="proof" style={{maxWidth:'100%', maxHeight:'250px', objectFit:'contain', borderRadius:'8px', border:'1px solid var(--border)'}}/>
                    </div>
                  : <>
                      <label htmlFor="proofInput" style={{cursor:'pointer'}}>
                        <div style={{...s.uploadBox, borderColor: proofPreview ? 'var(--green)' : 'rgba(0,230,118,0.3)'}}>
                          {proofPreview
                            ? <img src={proofPreview} alt="preview" style={{maxHeight:'200px', maxWidth:'100%', borderRadius:'8px'}}/>
                            : <>
                                <Camera size={36} style={{color:'var(--green)', marginBottom:'12px'}}/>
                                <div style={{fontFamily:'Syne', fontWeight:700, marginBottom:'6px', fontSize:'1rem'}}>Tap to upload photo</div>
                                <div style={{fontSize:'0.82rem', color:'rgba(245,240,232,0.4)'}}>Take a photo or choose from gallery</div>
                                <div style={{fontSize:'0.78rem', color:'rgba(245,240,232,0.3)', marginTop:'4px'}}>Show the banner clearly on your rickshaw</div>
                              </>
                          }
                        </div>
                      </label>
                      <input
                        id="proofInput"
                        type="file"
                        accept="image/*"
                        capture="environment"
                        style={{display:'none'}}
                        onChange={handleProofSelect}
                      />
                      {proofPreview && (
                        <button style={s.btn} onClick={handleUploadProof} disabled={uploading}>
                          {uploading ? 'Uploading...' : <><Upload size={16}/> Submit Today's Proof</>}
                        </button>
                      )}
                    </>
                }
              </div>
          }
        </>}

        {/* ── EARNINGS ── */}
        {tab === 'earnings' && <>
          <div style={s.statsRow}>
            <div style={s.statCard}><div style={s.statNum}>₹{monthEarnings}</div><div style={s.statLabel}>This Month</div></div>
            <div style={s.statCard}><div style={{...s.statNum, color:'var(--yellow)'}}>₹{totalEarnings}</div><div style={s.statLabel}>All Time</div></div>
            <div style={s.statCard}><div style={{...s.statNum, color:'#6af'}}>{earnings.length}</div><div style={s.statLabel}>Total Entries</div></div>
          </div>

          {earnings.length === 0
            ? <div style={s.emptyState}>
                <div style={{fontSize:'3rem', marginBottom:'12px'}}>💸</div>
                <div>No earnings yet — accept a job and upload daily proofs!</div>
              </div>
            : <>
                <div style={{fontFamily:'Syne', fontWeight:800, fontSize:'1rem', marginBottom:'12px'}}>By Company</div>
                {Object.entries(
                  earnings.reduce((acc, e) => {
                    const key = e.company_name || 'AdWheels'
                    acc[key] = (acc[key] || 0) + e.amount
                    return acc
                  }, {})
                ).map(([company, amount]) => (
                  <div key={company} style={{background:'rgba(0,230,118,0.05)', border:'1px solid rgba(0,230,118,0.12)', borderRadius:'10px', padding:'16px 20px', marginBottom:'10px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <div style={{fontFamily:'Syne', fontWeight:700}}>{company}</div>
                    <div style={{fontFamily:'Bebas Neue', fontSize:'1.5rem', color:'var(--green)'}}>₹{amount}</div>
                  </div>
                ))}

                <div style={{fontFamily:'Syne', fontWeight:800, fontSize:'1rem', margin:'24px 0 12px'}}>Daily Log</div>
                {earnings.slice(0, 30).map(e => (
                  <div key={e.id} style={s.earningRow}>
                    <div>
                      <div style={{fontSize:'0.88rem', fontWeight:600}}>
                        {e.type === 'daily' ? '📅 Daily earning' : e.type === 'print_reimbursement' ? '🖨️ Print reimbursement' : '🎁 Bonus'}
                      </div>
                      <div style={{fontSize:'0.78rem', color:'rgba(245,240,232,0.35)', marginTop:'2px'}}>{e.earning_date}</div>
                    </div>
                    <div style={{fontFamily:'Bebas Neue', fontSize:'1.4rem', color:'var(--green)'}}>+₹{e.amount}</div>
                  </div>
                ))}
              </>
          }
        </>}

        {/* ── PAYOUT ── */}
        {tab === 'payout' && <>
          <div style={{background:'linear-gradient(135deg,#001a0a,#002d12)', border:'1.5px solid rgba(0,230,118,0.2)', borderRadius:'16px', padding:'28px', marginBottom:'24px'}}>
            <div style={{fontSize:'0.78rem', fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'rgba(0,230,118,0.6)', marginBottom:'6px'}}>Available Balance</div>
            <div style={{fontFamily:'Bebas Neue', fontSize:'3.5rem', color:'var(--green)', lineHeight:1, marginBottom:'4px'}}>₹{totalEarnings}</div>
            <div style={{fontSize:'0.82rem', color:'rgba(245,240,232,0.4)'}}>UPI: {profile.upi_id || 'Not set — contact admin to update'}</div>
          </div>

          <div style={s.card}>
            <div style={{fontFamily:'Syne', fontWeight:800, fontSize:'1.1rem', marginBottom:'6px'}}>Request Payout</div>
            <div style={{fontSize:'0.85rem', color:'rgba(245,240,232,0.4)', marginBottom:'20px'}}>Minimum ₹500 · Processed in 1–2 business days to your UPI</div>
            <label style={{display:'block', fontSize:'0.74rem', fontWeight:700, letterSpacing:'0.07em', textTransform:'uppercase', color:'rgba(245,240,232,0.45)', marginBottom:'7px'}}>Amount (₹)</label>
            <input
              type="number"
              placeholder="Enter amount (min ₹500)"
              value={payoutAmount}
              onChange={e => setPayoutAmount(e.target.value)}
              style={{width:'100%', background:'rgba(245,240,232,0.04)', border:'1.5px solid rgba(245,240,232,0.09)', borderRadius:'8px', padding:'13px 15px', color:'var(--white)', fontSize:'0.93rem', outline:'none', marginBottom:'16px'}}
            />
            <button style={s.btn} onClick={handleRequestPayout} disabled={payoutLoading}>
              {payoutLoading ? 'Requesting...' : <><Wallet size={16}/> Request Payout</>}
            </button>
          </div>

          <div style={{fontSize:'0.82rem', color:'rgba(245,240,232,0.35)', padding:'14px', background:'rgba(245,240,232,0.03)', borderRadius:'8px'}}>
            💡 Earnings are added only after admin approves your daily proof photo. Upload proof every day to maximize earnings!
          </div>
        </>}
      </div>
    </div>
  )
}
