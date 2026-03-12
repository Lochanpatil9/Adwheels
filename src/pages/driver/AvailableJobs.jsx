import React, { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import AppLayout from '../../components/AppLayout'

const NAV = [
  { path: '/driver', icon: '📊', label: 'Dashboard' },
  { path: '/driver/jobs', icon: '💼', label: 'Available Jobs' },
  { path: '/driver/earnings', icon: '💰', label: 'My Earnings' },
]

export default function AvailableJobs() {
  const { profile } = useAuth()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(null)

  useEffect(() => { if (profile) fetchJobs() }, [profile])

  async function fetchJobs() {
    // 🎓 LESSON: We only show jobs that:
    // 1. Are offered (not taken by someone else)
    // 2. Match the driver's city
    const { data } = await supabase
      .from('driver_jobs')
      .select('*, campaigns(*, plans(name, price, driver_payout, rickshaw_count, is_urgent))')
      .eq('status', 'offered')
      .eq('campaigns.city', profile.city)
      .order('offered_at', { ascending: false })
    setJobs(data?.filter(j => j.campaigns) || [])
    setLoading(false)
  }

  async function acceptJob(job) {
    setAccepting(job.id)
    const now = new Date().toISOString()

    const { error } = await supabase
      .from('driver_jobs')
      .update({ status: 'accepted', driver_id: profile.id, accepted_at: now })
      .eq('id', job.id)

    if (!error) {
      // Add print reimbursement to earnings
      await supabase.from('earnings').insert({
        driver_id: profile.id,
        driver_job_id: job.id,
        campaign_id: job.campaign_id,
        company_name: 'AdWheels',
        amount: job.campaigns.plans.print_reimbursement || 175,
        type: 'print_reimbursement'
      })
      fetchJobs()
    }
    setAccepting(null)
  }

  async function rejectJob(jobId) {
    await supabase.from('driver_jobs').update({ status: 'rejected' }).eq('id', jobId)
    fetchJobs()
  }

  return (
    <AppLayout navItems={NAV}>
      <div style={{ marginBottom: 28 }}>
        <h1 className="syne" style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 4 }}>Available Jobs</h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Jobs near you in {profile?.city} 📍</p>
      </div>

      {loading && <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" style={{ width: 36, height: 36 }}/></div>}

      {!loading && jobs.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '56px 24px' }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>📭</div>
          <h2 className="syne" style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: 8 }}>No Jobs Right Now</h2>
          <p style={{ color: 'var(--muted)', fontSize: '0.88rem' }}>Check back soon — new campaigns are added daily!</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {jobs.map(job => {
          const plan = job.campaigns?.plans
          const dailyEarning = plan ? Math.round(plan.driver_payout / 30) : 0
          return (
            <div key={job.id} className="card" style={{ borderColor: plan?.is_urgent ? 'rgba(255,69,0,0.3)' : 'var(--border)' }}>
              {plan?.is_urgent && (
                <div style={{ background: 'rgba(255,69,0,0.1)', borderRadius: 8, padding: '6px 12px', marginBottom: 14, fontSize: '0.8rem', color: 'var(--orange)', fontWeight: 700 }}>
                  ⚡ URGENT JOB — Higher Pay
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
                <div>
                  <div className="syne" style={{ fontWeight: 800, fontSize: '1.05rem', marginBottom: 4 }}>
                    {plan?.name} Plan Ad Job
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>
                    📍 {job.campaigns?.city} · {job.campaigns?.area || 'City-wide'}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="bebas" style={{ fontSize: '1.6rem', color: 'var(--green)', lineHeight: 1 }}>₹{plan?.driver_payout}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>/month</div>
                </div>
              </div>

              {/* Earnings breakdown */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 16 }}>
                {[
                  { label: 'Daily Earning', value: `₹${dailyEarning}` },
                  { label: 'Print Bonus', value: '₹175' },
                  { label: 'Monthly Total', value: `₹${plan?.driver_payout}` },
                ].map(s => (
                  <div key={s.label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '10px', textAlign: 'center', border: '1px solid var(--border)' }}>
                    <div style={{ fontWeight: 700, color: 'var(--yellow)', fontSize: '0.95rem' }}>{s.value}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--muted)', marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              <div style={{ fontSize: '0.82rem', color: 'var(--muted)', marginBottom: 16, lineHeight: 1.6 }}>
                📋 <strong style={{ color: 'var(--white)' }}>What you do:</strong> Print the banner at a nearby shop (cost reimbursed), put it on your vehicle, upload a daily photo. That's it.
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-green" onClick={() => acceptJob(job)} disabled={accepting === job.id}>
                  {accepting === job.id ? <><div className="spinner"/>Accepting...</> : '✅ Accept Job'}
                </button>
                <button className="btn btn-danger btn-sm" onClick={() => rejectJob(job.id)}>
                  ✕ Skip
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </AppLayout>
  )
}
