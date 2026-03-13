import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { openRazorpayCheckout } from '../../lib/razorpay'
import toast from 'react-hot-toast'
import AppLayout from '../../components/AppLayout'

const NAV = [
  { path: '/advertiser', icon: '📊', label: 'Dashboard' },
  { path: '/advertiser/create', icon: '🚀', label: 'New Campaign' },
  { path: '/advertiser/campaigns', icon: '📋', label: 'My Campaigns' },
]

const PLAN_COLORS = ['var(--muted)', 'var(--blue)', 'var(--yellow)', 'var(--orange)', 'var(--red)']

export default function CreateCampaign() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)    // Step 1: Plan, Step 2: Details, Step 3: Upload, Step 4: Review
  const [plans, setPlans] = useState([])
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [city, setCity] = useState('')
  const [area, setArea] = useState('')
  const [bannerFile, setBannerFile] = useState(null)
  const [bannerPreview, setBannerPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.from('plans').select('*').order('price').then(({ data }) => setPlans(data || []))
  }, [])

  function handleBannerChange(e) {
    const file = e.target.files[0]
    if (!file) return
    setBannerFile(file)
    setBannerPreview(URL.createObjectURL(file))
  }

  async function handleSubmit() {
    setLoading(true); setError('')
    try {
      let bannerUrl = null

      // 🎓 LESSON: Upload banner image to Supabase Storage
      // Storage = like Google Drive but for our app
      if (bannerFile) {
        const fileName = `${profile.id}-${Date.now()}.${bannerFile.name.split('.').pop()}`
        const { error: uploadError } = await supabase.storage
          .from('banners')
          .upload(fileName, bannerFile)
        if (uploadError) throw uploadError

        // Get public URL of the uploaded image
        const { data: urlData } = supabase.storage.from('banners').getPublicUrl(fileName)
        bannerUrl = urlData.publicUrl
      }

      // Insert campaign into DB and get its ID
      const { data: campaignData, error: campaignError } = await supabase.from('campaigns').insert({
        advertiser_id: profile.id,
        plan_id: selectedPlan.id,
        banner_url: bannerUrl,
        city,
        area,
        status: 'pending',
      }).select().single()

      if (campaignError) throw campaignError

      setLoading(false)

      // Trigger Razorpay checkout immediately after campaign creation
      openRazorpayCheckout({
        amount: selectedPlan.price,
        campaignId: campaignData.id,
        planName: selectedPlan.name,
        profile,
        onSuccess: () => {
          toast.success('Payment successful! Drivers being assigned 🎉')
          navigate('/advertiser/campaigns')
        },
        onFailure: (msg) => {
          if (msg === 'Payment cancelled.') {
            toast('Campaign saved. Complete payment anytime from My Campaigns.', { icon: 'ℹ️' })
            navigate('/advertiser/campaigns')
          } else {
            toast.error(msg || 'Payment failed.')
          }
        },
      })
    } catch (err) {
      setLoading(false)
      setError(err.message)
    }
  }

  return (
    <AppLayout navItems={NAV}>
      <div style={{ maxWidth: 640 }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 className="syne" style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 4 }}>Create Campaign</h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Your ad live in 90 minutes ⚡</p>
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 32, alignItems: 'center' }}>
          {['Choose Plan', 'Details', 'Banner', 'Review'].map((s, i) => (
            <React.Fragment key={s}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: step > i + 1 ? 'var(--green)' : step === i + 1 ? 'var(--yellow)' : 'rgba(255,255,255,0.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.75rem', fontWeight: 800, color: step >= i + 1 ? 'var(--black)' : 'var(--muted)',
                  flexShrink: 0
                }}>
                  {step > i + 1 ? '✓' : i + 1}
                </div>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: step === i + 1 ? 'var(--white)' : 'var(--muted)', whiteSpace: 'nowrap' }}>{s}</span>
              </div>
              {i < 3 && <div style={{ flex: 1, height: 1, background: step > i + 1 ? 'var(--green)' : 'var(--border)', minWidth: 12 }} />}
            </React.Fragment>
          ))}
        </div>

        {/* STEP 1: Choose Plan */}
        {step === 1 && (
          <div>
            <h2 className="syne" style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 20 }}>Select a Plan</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {plans.map((plan, i) => (
                <div key={plan.id} onClick={() => setSelectedPlan(plan)}
                  className="card card-hover"
                  style={{
                    cursor: 'pointer',
                    border: `1.5px solid ${selectedPlan?.id === plan.id ? PLAN_COLORS[i] : 'var(--border)'}`,
                    background: selectedPlan?.id === plan.id ? `rgba(255,208,0,0.05)` : 'var(--card)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12
                  }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                      <span className="syne" style={{ fontWeight: 800, fontSize: '1.05rem' }}>{plan.name}</span>
                      {plan.is_urgent && <span className="badge badge-red">⚡ Urgent Priority</span>}
                      {plan.has_live_tracking && <span className="badge badge-blue">📍 Live Tracking</span>}
                      {plan.has_account_manager && <span className="badge badge-yellow">👤 Account Manager</span>}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                      {plan.rickshaw_count} Rickshaw{plan.rickshaw_count > 1 ? 's' : ''} · Driver earns ₹{plan.driver_payout}/month each
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="bebas" style={{ fontSize: '1.8rem', color: plan.price === 0 ? 'var(--muted)' : PLAN_COLORS[i], lineHeight: 1 }}>
                      {plan.price === 0 ? 'Custom' : `₹${plan.price.toLocaleString()}`}
                    </div>
                    {plan.price > 0 && <div style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>/month</div>}
                  </div>
                </div>
              ))}
            </div>
            <button className="btn btn-yellow btn-lg" style={{ marginTop: 24 }}
              disabled={!selectedPlan} onClick={() => setStep(2)}>
              Continue with {selectedPlan?.name || '...'} →
            </button>
          </div>
        )}

        {/* STEP 2: Campaign Details */}
        {step === 2 && (
          <div>
            <h2 className="syne" style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 20 }}>Campaign Details</h2>
            <div className="input-group">
              <label>Target City</label>
              <select className="input" value={city} onChange={e => setCity(e.target.value)}>
                <option value="">Select city</option>
                <option value="indore">Indore</option>
                <option value="bhopal">Bhopal</option>
                {selectedPlan?.rickshaw_count >= 7 && <option value="both">Both Cities</option>}
              </select>
            </div>
            <div className="input-group">
              <label>Target Area / Colony</label>
              <input className="input" placeholder="e.g. Vijay Nagar, Palasia, MG Road"
                value={area} onChange={e => setArea(e.target.value)} />
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: -8, marginBottom: 24, lineHeight: 1.6 }}>
              💡 Tip: The more specific you are, the better we match you with drivers in that area.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-outline" onClick={() => setStep(1)}>← Back</button>
              <button className="btn btn-yellow" disabled={!city} onClick={() => setStep(3)}>Continue →</button>
            </div>
          </div>
        )}

        {/* STEP 3: Upload Banner */}
        {step === 3 && (
          <div>
            <h2 className="syne" style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 8 }}>Upload Your Banner</h2>
            <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: 20 }}>
              Upload the image you want printed and displayed. Recommended: 3ft × 1.5ft, JPG/PNG.
            </p>

            <label style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              border: `2px dashed ${bannerPreview ? 'var(--green)' : 'var(--border)'}`,
              borderRadius: 12, padding: '32px 24px', cursor: 'pointer',
              background: bannerPreview ? 'rgba(0,230,118,0.04)' : 'rgba(255,255,255,0.02)',
              transition: 'all 0.2s', marginBottom: 20
            }}>
              <input type="file" accept="image/*" onChange={handleBannerChange} style={{ display: 'none' }} />
              {bannerPreview
                ? <img src={bannerPreview} style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8, objectFit: 'contain' }} />
                : <>
                    <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🖼️</div>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>Click to upload banner</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>JPG, PNG up to 10MB</div>
                  </>
              }
            </label>

            {bannerPreview && (
              <p style={{ fontSize: '0.82rem', color: 'var(--green)', marginBottom: 20 }}>
                ✅ Banner uploaded! Looks good.
              </p>
            )}

            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-outline" onClick={() => setStep(2)}>← Back</button>
              <button className="btn btn-yellow" onClick={() => setStep(4)}>
                {bannerPreview ? 'Continue →' : 'Skip for now →'}
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Review & Submit */}
        {step === 4 && (
          <div>
            <h2 className="syne" style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 20 }}>Review & Launch</h2>

            <div className="card" style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { label: 'Plan', value: selectedPlan?.name },
                  { label: 'Rickshaws', value: selectedPlan?.rickshaw_count },
                  { label: 'City', value: city },
                  { label: 'Area', value: area || 'Not specified' },
                  { label: 'Monthly Cost', value: `₹${selectedPlan?.price?.toLocaleString()}` },
                  { label: 'Driver Payout (each)', value: `₹${selectedPlan?.driver_payout}/month` },
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ color: 'var(--muted)', fontSize: '0.88rem' }}>{row.label}</span>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {bannerPreview && (
              <div className="card" style={{ marginBottom: 20 }}>
                <p style={{ fontSize: '0.78rem', color: 'var(--muted)', marginBottom: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Your Banner</p>
                <img src={bannerPreview} style={{ width: '100%', maxHeight: 160, objectFit: 'contain', borderRadius: 8 }} />
              </div>
            )}

            <div style={{ background: 'rgba(255,208,0,0.07)', border: '1px solid rgba(255,208,0,0.2)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: '0.85rem', color: 'var(--yellow)' }}>
              ⚡ After submission, complete payment and your ad goes live within 90 minutes!
            </div>

            {error && (
              <div style={{ background: 'rgba(255,45,45,0.1)', border: '1px solid rgba(255,45,45,0.3)', borderRadius: 8, padding: '10px 14px', fontSize: '0.85rem', color: 'var(--red)', marginBottom: 16 }}>
                ⚠️ {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-outline" onClick={() => setStep(3)}>← Back</button>
              <button className="btn btn-yellow btn-lg" onClick={handleSubmit} disabled={loading}>
                {loading ? <><div className="spinner"></div> Submitting...</> : '🚀 Submit Campaign'}
              </button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
