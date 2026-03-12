import React, { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import AppLayout from '../../components/AppLayout'

const NAV = [
  { path: '/driver', icon: '📊', label: 'Dashboard' },
  { path: '/driver/jobs', icon: '💼', label: 'Available Jobs' },
  { path: '/driver/earnings', icon: '💰', label: 'My Earnings' },
]

export default function MyEarnings() {
  const { profile } = useAuth()
  const [earnings, setEarnings] = useState([])
  const [payouts, setPayouts] = useState([])
  const [totalBalance, setTotalBalance] = useState(0)
  const [view, setView] = useState('overview') // 'overview' | 'history' | 'payout'
  const [upiId, setUpiId] = useState(profile?.upi_id || '')
  const [payoutAmount, setPayoutAmount] = useState('')
  const [requesting, setRequesting] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (profile) fetchData() }, [profile])

  async function fetchData() {
    const [{ data: earnData }, { data: payoutData }] = await Promise.all([
      supabase.from('earnings').select('*').eq('driver_id', profile.id).order('created_at', { ascending: false }),
      supabase.from('payouts').select('*').eq('driver_id', profile.id).order('requested_at', { ascending: false })
    ])
    setEarnings(earnData || [])
    setPayouts(payoutData || [])

    const totalEarned = (earnData || []).reduce((s, e) => s + e.amount, 0)
    const totalPaid = (payoutData || []).filter(p => ['paid','processing'].includes(p.status)).reduce((s, p) => s + p.amount, 0)
    setTotalBalance(totalEarned - totalPaid)
    setLoading(false)
  }

  // Group earnings by company
  const byCompany = earnings.reduce((acc, e) => {
    const key = e.company_name || 'Unknown'
    acc[key] = (acc[key] || 0) + e.amount
    return acc
  }, {})

  // Today / This week / This month
  const today = new Date().toISOString().split('T')[0]
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString()
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()

  const todayTotal = earnings.filter(e => e.earning_date === today).reduce((s, e) => s + e.amount, 0)
  const weekTotal = earnings.filter(e => new Date(e.created_at) >= new Date(weekAgo)).reduce((s, e) => s + e.amount, 0)
  const monthTotal = earnings.filter(e => new Date(e.created_at) >= new Date(monthStart)).reduce((s, e) => s + e.amount, 0)

  async function requestPayout() {
    if (!upiId || !payoutAmount) return
    const amount = parseInt(payoutAmount)
    if (amount < 500) { alert('Minimum payout is ₹500'); return }
    if (amount > totalBalance) { alert('Not enough balance'); return }
    setRequesting(true)

    const { error } = await supabase.from('payouts').insert({
      driver_id: profile.id,
      amount,
      upi_id: upiId,
      status: 'requested'
    })

    if (!error) {
      setView('overview')
      setPayoutAmount('')
      fetchData()
    }
    setRequesting(false)
  }

  const TYPE_LABEL = { daily: 'Daily Earning', print_reimbursement: 'Print Reimbursement', bonus: 'Bonus' }
  const TYPE_COLOR = { daily: 'var(--green)', print_reimbursement: 'var(--blue)', bonus: 'var(--yellow)' }

  return (
    <AppLayout navItems={NAV}>
      <div style={{ marginBottom: 28 }}>
        <h1 className="syne" style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 4 }}>My Earnings</h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Track every rupee you've earned</p>
      </div>

      {/* Tab switch */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
        {[['overview','📊 Overview'],['history','📋 History'],['payout','💸 Payout']].map(([v, label]) => (
          <button key={v} onClick={() => setView(v)} className="btn btn-sm"
            style={{ background: view === v ? 'var(--yellow)' : 'rgba(255,255,255,0.05)', color: view === v ? 'var(--black)' : 'var(--muted)', border: 'none' }}>
            {label}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {view === 'overview' && (
        <>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px,1fr))', gap: 16, marginBottom: 28 }}>
            {[
              { num: `₹${todayTotal}`, label: "Today" },
              { num: `₹${weekTotal}`, label: "This Week" },
              { num: `₹${monthTotal}`, label: "This Month" },
              { num: `₹${totalBalance}`, label: "Available Balance", highlight: true },
            ].map(s => (
              <div key={s.label} className="stat-card" style={{ borderColor: s.highlight && totalBalance >= 500 ? 'rgba(0,230,118,0.3)' : 'var(--border)' }}>
                <div className="stat-num" style={{ color: s.highlight ? 'var(--green)' : 'var(--yellow)' }}>{s.num}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>

          {/* By company */}
          {Object.keys(byCompany).length > 0 && (
            <>
              <h2 className="syne" style={{ fontSize: '1rem', fontWeight: 800, marginBottom: 14 }}>Earnings by Company</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
                {Object.entries(byCompany).map(([company, amount]) => (
                  <div key={company} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '12px 16px', border: '1px solid var(--border)' }}>
                    <div style={{ fontWeight: 600 }}>🏢 {company}</div>
                    <div style={{ color: 'var(--yellow)', fontWeight: 700 }}>₹{amount}</div>
                  </div>
                ))}
              </div>
            </>
          )}

          {totalBalance >= 500 && (
            <button className="btn btn-green" onClick={() => setView('payout')}>
              💸 Request Payout (₹{totalBalance} available)
            </button>
          )}
          {totalBalance < 500 && totalBalance > 0 && (
            <div style={{ fontSize: '0.85rem', color: 'var(--muted)', padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: '1px solid var(--border)' }}>
              💡 Minimum payout is ₹500. You have ₹{totalBalance}. Need ₹{500 - totalBalance} more.
            </div>
          )}
        </>
      )}

      {/* HISTORY */}
      {view === 'history' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {earnings.length === 0 && <div style={{ color: 'var(--muted)', textAlign: 'center', padding: 40 }}>No earnings yet</div>}
          {earnings.map(e => (
            <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '12px 16px', border: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontSize: '0.88rem', fontWeight: 600, color: TYPE_COLOR[e.type] || 'var(--white)' }}>
                  {TYPE_LABEL[e.type] || e.type}
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--muted)', marginTop: 2 }}>
                  {e.company_name} · {new Date(e.created_at).toLocaleDateString('en-IN')}
                </div>
              </div>
              <div style={{ fontWeight: 700, color: 'var(--green)', fontSize: '1rem' }}>+₹{e.amount}</div>
            </div>
          ))}
        </div>
      )}

      {/* PAYOUT REQUEST */}
      {view === 'payout' && (
        <div style={{ maxWidth: 420 }}>
          <div className="card" style={{ marginBottom: 20 }}>
            <div style={{ fontWeight: 700, color: 'var(--green)', fontSize: '1.1rem', marginBottom: 4 }}>Available: ₹{totalBalance}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Minimum withdrawal: ₹500</div>
          </div>

          <div className="input-group">
            <label>UPI ID</label>
            <input className="input" placeholder="yourname@upi" value={upiId} onChange={e => setUpiId(e.target.value)} />
          </div>
          <div className="input-group">
            <label>Amount (₹)</label>
            <input className="input" type="number" placeholder="Min ₹500" value={payoutAmount} onChange={e => setPayoutAmount(e.target.value)} min={500} max={totalBalance} />
          </div>

          <div style={{ background: 'rgba(255,208,0,0.07)', border: '1px solid rgba(255,208,0,0.2)', borderRadius: 8, padding: '10px 14px', fontSize: '0.82rem', color: 'var(--yellow)', marginBottom: 16 }}>
            💡 Payouts are processed within 24-48 hours by AdWheels team.
          </div>

          {/* Recent payouts */}
          {payouts.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: '0.78rem', color: 'var(--muted)', marginBottom: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Recent Requests</p>
              {payouts.slice(0, 3).map(p => (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: '0.85rem' }}>
                  <span>₹{p.amount} → {p.upi_id}</span>
                  <span className={`badge ${p.status === 'paid' ? 'badge-green' : p.status === 'requested' ? 'badge-yellow' : 'badge-muted'}`}>{p.status}</span>
                </div>
              ))}
            </div>
          )}

          <button className="btn btn-green btn-full" onClick={requestPayout} disabled={requesting || !upiId || !payoutAmount}>
            {requesting ? <><div className="spinner"/>Processing...</> : '💸 Request Payout'}
          </button>
        </div>
      )}
    </AppLayout>
  )
}
