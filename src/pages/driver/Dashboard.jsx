import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import AppLayout from '../../components/AppLayout'

const NAV = [
  { path: '/driver', icon: '📊', label: 'Dashboard' },
  { path: '/driver/jobs', icon: '💼', label: 'Available Jobs' },
  { path: '/driver/earnings', icon: '💰', label: 'My Earnings' },
]

export default function DriverDashboard() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [activeJob, setActiveJob] = useState(null)
  const [todayEarning, setTodayEarning] = useState(0)
  const [monthEarning, setMonthEarning] = useState(0)
  const [totalBalance, setTotalBalance] = useState(0)
  const [proofUploaded, setProofUploaded] = useState(false)
  const [proofFile, setProofFile] = useState(null)
  const [proofPreview, setProofPreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (profile) fetchData() }, [profile])

  async function fetchData() {
    const today = new Date().toISOString().split('T')[0]
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()

    // Get active job
    const { data: jobData } = await supabase
      .from('driver_jobs')
      .select('*, campaigns(*, plans(name, price, driver_payout))')
      .eq('driver_id', profile.id)
      .eq('status', 'active')
      .single()
    setActiveJob(jobData)

    // Check if proof uploaded today
    if (jobData) {
      const { data: proofData } = await supabase
        .from('daily_proofs')
        .select('id')
        .eq('driver_job_id', jobData.id)
        .eq('proof_date', today)
        .single()
      setProofUploaded(!!proofData)
    }

    // Today's earnings
    const { data: todayData } = await supabase
      .from('earnings')
      .select('amount')
      .eq('driver_id', profile.id)
      .eq('earning_date', today)
    setTodayEarning(todayData?.reduce((s, e) => s + e.amount, 0) || 0)

    // Month earnings
    const { data: monthData } = await supabase
      .from('earnings')
      .select('amount')
      .eq('driver_id', profile.id)
      .gte('created_at', monthStart)
    setMonthEarning(monthData?.reduce((s, e) => s + e.amount, 0) || 0)

    // Total unpaid balance (not yet requested for payout)
    const { data: allEarnings } = await supabase
      .from('earnings')
      .select('amount')
      .eq('driver_id', profile.id)
    const totalEarned = allEarnings?.reduce((s, e) => s + e.amount, 0) || 0

    const { data: paidOut } = await supabase
      .from('payouts')
      .select('amount')
      .eq('driver_id', profile.id)
      .in('status', ['paid', 'processing'])
    const totalPaid = paidOut?.reduce((s, p) => s + p.amount, 0) || 0

    setTotalBalance(totalEarned - totalPaid)
    setLoading(false)
  }

  function handleProofChange(e) {
    const file = e.target.files[0]
    if (!file) return
    setProofFile(file)
    setProofPreview(URL.createObjectURL(file))
  }

  async function uploadProof() {
    if (!proofFile || !activeJob) return
    setUploading(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      const fileName = `proof-${profile.id}-${today}.${proofFile.name.split('.').pop()}`

      // Upload to Supabase storage
      const { error: uploadErr } = await supabase.storage.from('proofs').upload(fileName, proofFile)
      if (uploadErr) throw uploadErr

      const { data: urlData } = supabase.storage.from('proofs').getPublicUrl(fileName)

      // Save proof record
      await supabase.from('daily_proofs').insert({
        driver_job_id: activeJob.id,
        driver_id: profile.id,
        photo_url: urlData.publicUrl,
        proof_date: today,
        status: 'pending'
      })

      // 🎓 NOTE: Admin approves proof → then daily earning is added
      // For now we auto-add earning on proof upload
      const dailyRate = Math.round(activeJob.campaigns.plans.driver_payout / 30)
      await supabase.from('earnings').insert({
        driver_id: profile.id,
        driver_job_id: activeJob.id,
        campaign_id: activeJob.campaign_id,
        company_name: 'Advertiser',
        amount: dailyRate,
        type: 'daily'
      })

      setProofUploaded(true)
      setProofPreview(null)
      fetchData()
    } catch (err) { alert(err.message) }
    setUploading(false)
  }

  return (
    <AppLayout navItems={NAV}>
      <div style={{ marginBottom: 32 }}>
        <h1 className="syne" style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 4 }}>
          Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'} 👋
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>{profile?.full_name}</p>
      </div>

      {/* Earnings Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px,1fr))', gap: 16, marginBottom: 32 }}>
        <div className="stat-card">
          <div className="stat-num">₹{todayEarning}</div>
          <div className="stat-label">Today's Earnings</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">₹{monthEarning}</div>
          <div className="stat-label">This Month</div>
        </div>
        <div className="stat-card" style={{ borderColor: totalBalance >= 500 ? 'rgba(0,230,118,0.3)' : 'var(--border)' }}>
          <div className="stat-num" style={{ color: totalBalance >= 500 ? 'var(--green)' : 'var(--yellow)' }}>₹{totalBalance}</div>
          <div className="stat-label">Available Balance</div>
        </div>
      </div>

      {/* Payout CTA */}
      {totalBalance >= 500 && (
        <div style={{ background: 'rgba(0,230,118,0.07)', border: '1px solid rgba(0,230,118,0.2)', borderRadius: 12, padding: '16px 20px', marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontWeight: 700, color: 'var(--green)', marginBottom: 2 }}>💰 You can request a payout!</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>₹{totalBalance} available · Minimum ₹500</div>
          </div>
          <button className="btn btn-green btn-sm" onClick={() => navigate('/driver/earnings')}>
            Request Payout →
          </button>
        </div>
      )}

      {/* Active Job */}
      {activeJob ? (
        <div>
          <h2 className="syne" style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 16 }}>Active Job 🟢</h2>
          <div className="card" style={{ marginBottom: 24, borderColor: 'rgba(0,230,118,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>
                  {activeJob.campaigns?.plans?.name} Plan Campaign
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>
                  Earn ₹{activeJob.campaigns?.plans?.driver_payout}/month · ~₹{Math.round(activeJob.campaigns?.plans?.driver_payout / 30)}/day
                </div>
              </div>
              <span className="badge badge-green">Active</span>
            </div>

            {/* Daily Proof Upload */}
            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '16px', border: '1px solid var(--border)' }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 4 }}>
                📸 Daily Proof — {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: 12 }}>
                Upload a photo of your rickshaw with the banner to unlock today's earnings
              </div>

              {proofUploaded ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--green)', fontWeight: 600, fontSize: '0.88rem' }}>
                  ✅ Proof submitted for today! Earnings being processed.
                </div>
              ) : (
                <>
                  {proofPreview && (
                    <img src={proofPreview} style={{ width: '100%', maxHeight: 160, objectFit: 'cover', borderRadius: 8, marginBottom: 12 }} />
                  )}
                  <div style={{ display: 'flex', gap: 10 }}>
                    <label className="btn btn-outline btn-sm" style={{ cursor: 'pointer' }}>
                      <input type="file" accept="image/*" capture="camera" onChange={handleProofChange} style={{ display: 'none' }} />
                      📷 {proofFile ? 'Change Photo' : 'Take Photo'}
                    </label>
                    {proofFile && (
                      <button className="btn btn-green btn-sm" onClick={uploadProof} disabled={uploading}>
                        {uploading ? <><div className="spinner" />Uploading...</> : '✅ Submit Proof'}
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      ) : (
        !loading && (
          <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>💼</div>
            <h2 className="syne" style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: 8 }}>No Active Job</h2>
            <p style={{ color: 'var(--muted)', fontSize: '0.88rem', marginBottom: 24 }}>
              Browse available jobs and start earning today
            </p>
            <button className="btn btn-yellow" onClick={() => navigate('/driver/jobs')}>
              See Available Jobs →
            </button>
          </div>
        )
      )}
    </AppLayout>
  )
}
