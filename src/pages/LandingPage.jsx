import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

/* ─── Reveal on scroll hook ─── */
function useReveal() {
  useEffect(() => {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e, i) => {
        if (e.isIntersecting) {
          setTimeout(() => e.target.classList.add('aw-visible'), i * 80)
          obs.unobserve(e.target)
        }
      })
    }, { threshold: 0.1 })
    document.querySelectorAll('.aw-reveal').forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [])
}

/* ─── Smooth scroll ─── */
function scrollTo(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
}

/* ─── Pricing data ─── */
const PLANS = [
  { name: 'Starter', price: '₹1,500', rickshaws: 1, desc: 'Perfect for local shops', color: '#888', features: ['1 Rickshaw', '1 City', 'Standard Priority', 'Basic Analytics'] },
  { name: 'Basic', price: '₹5,500', rickshaws: 3, desc: 'Multi-rickshaw coverage', color: '#2a9d5c', features: ['3 Rickshaws', '1–2 Cities', 'Standard Priority', 'Weekly Reports'] },
  { name: 'Growth', price: '₹11,000', rickshaws: 7, desc: 'Serious street presence', color: '#FFD000', featured: true, features: ['7 Rickshaws', 'Both Cities', 'High Priority', 'Live Tracking', 'Weekly Reports'] },
  { name: 'Pro', price: '₹21,000', rickshaws: 15, desc: 'Maximum city coverage', color: '#FF4500', features: ['15 Rickshaws', 'Both Cities', 'TOP Priority', '90-min Guarantee', 'Live Tracking', 'Daily Reports'] },
]

/* ─── HOW IT WORKS steps ─── */
const STEPS = [
  { icon: '📋', time: '0 min', title: 'Submit Your Ad', desc: 'Upload your banner and choose your plan. Takes 2 minutes.' },
  { icon: '🔔', time: '5 min', title: 'Driver Gets Notified', desc: 'Nearby verified driver accepts your campaign instantly.' },
  { icon: '🖨️', time: '30 min', title: 'Banner Gets Printed', desc: 'Driver prints at nearest shop. We reimburse the cost.' },
  { icon: '🛺', time: '90 min', title: 'Ad Goes Live', desc: 'Banner installed. Your brand is rolling through the city.' },
]

export default function LandingPage({ onGetStarted }) {
  useReveal()
  const [activeTab, setActiveTab] = useState('advertiser')
  const [regForm, setRegForm] = useState({ name:'', phone:'', city:'', business:'', budget:'', area:'' })
  const [regDone, setRegDone] = useState(false)
  const [entForm, setEntForm] = useState({ company:'', name:'', phone:'', email:'', city:'', message:'' })
  const [entDone, setEntDone] = useState(false)
  const [entSubmitting, setEntSubmitting] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  async function submitEnterprise() {
    if (!entForm.company || !entForm.name || !entForm.phone) {
      toast.error('Please fill company name, your name, and phone')
      return
    }
    setEntSubmitting(true)
    try {
      const { error } = await supabase.from('enterprise_leads').insert({
        full_name: entForm.name,
        phone: entForm.phone,
        email: entForm.email,
        company_name: entForm.company,
        city: entForm.city,
        message: entForm.message,
      })
      if (error) throw error
      setEntDone(true)
      toast.success('Request sent! We\'ll call you within 2 hours 🎉')
    } catch {
      toast.error('Something went wrong. Please call us directly!')
    }
    setEntSubmitting(false)
  }

  function submitRegister() {
    const { name, phone, city } = regForm
    if (!name || !phone || !city) { toast.error('Please fill name, phone, and city'); return }
    setRegDone(true)
    toast.success('Registered! Our team will call you within 24 hours 🎉')
  }

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: '#080808', color: '#F5F0E8', overflowX: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --yellow: #FFD000;
          --orange: #FF4500;
          --green: #00E676;
          --black: #080808;
          --card: #111111;
          --border: rgba(245,240,232,0.08);
          --purple: #a855f7;
        }
        html { scroll-behavior: smooth; }
        .aw-reveal { opacity: 0; transform: translateY(24px); transition: opacity 0.6s ease, transform 0.6s ease; }
        .aw-visible { opacity: 1; transform: translateY(0); }
        section { padding: 96px 24px; max-width: 1100px; margin: 0 auto; }
        .aw-section-wrap { padding: 0; }
        .aw-section-wrap > section { padding: 96px 24px; }
        h2.aw-title { font-family: 'Syne', sans-serif; font-size: clamp(2rem, 5vw, 3.2rem); font-weight: 800; line-height: 1.1; margin-bottom: 16px; }
        h2.aw-title span { color: var(--yellow); }
        .aw-label { font-size: 0.72rem; font-weight: 800; letter-spacing: 0.18em; text-transform: uppercase; color: var(--orange); margin-bottom: 14px; }
        .aw-btn-primary { background: var(--yellow); color: var(--black); font-family: 'Syne', sans-serif; font-size: 0.95rem; font-weight: 800; letter-spacing: 0.04em; padding: 15px 32px; border: none; border-radius: 8px; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; display: inline-flex; align-items: center; gap: 8px; }
        .aw-btn-primary:hover { transform: translateY(-3px); box-shadow: 0 14px 40px rgba(255,208,0,0.3); }
        .aw-btn-secondary { background: transparent; color: var(--yellow); font-family: 'Syne', sans-serif; font-size: 0.95rem; font-weight: 700; padding: 14px 28px; border: 1.5px solid rgba(255,208,0,0.4); border-radius: 8px; cursor: pointer; transition: all 0.2s; display: inline-flex; align-items: center; gap: 8px; text-decoration: none; }
        .aw-btn-secondary:hover { border-color: var(--yellow); background: rgba(255,208,0,0.06); transform: translateY(-2px); }
        .aw-input { width: 100%; background: rgba(245,240,232,0.04); border: 1.5px solid rgba(245,240,232,0.09); border-radius: 8px; padding: 13px 15px; color: #F5F0E8; font-size: 0.93rem; font-family: 'DM Sans', sans-serif; outline: none; transition: border-color 0.2s; }
        .aw-input:focus { border-color: rgba(255,208,0,0.4); }
        .aw-label-sm { display: block; font-size: 0.74rem; font-weight: 700; letter-spacing: 0.07em; text-transform: uppercase; color: rgba(245,240,232,0.45); margin-bottom: 7px; }
        .aw-form-group { margin-bottom: 16px; }
        .aw-nav-link { color: rgba(245,240,232,0.55); font-size: 0.88rem; font-weight: 500; text-decoration: none; transition: color 0.2s; cursor: pointer; background: none; border: none; font-family: 'DM Sans', sans-serif; }
        .aw-nav-link:hover { color: #F5F0E8; }
        .marquee-track { display: flex; animation: marquee 24s linear infinite; width: max-content; }
        @keyframes marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }
        .aw-check { color: var(--green); flex-shrink: 0; }
        @media (max-width: 768px) {
          section { padding: 64px 20px; }
          .aw-hide-mobile { display: none !important; }
          .aw-mobile-menu-btn { display: flex !important; }
          .aw-grid-2 { grid-template-columns: 1fr !important; }
          .aw-grid-2-gap { gap: 40px !important; }
          .aw-mobile-menu-open { display: flex !important; }
        }
      `}</style>

      {/* ─── NAV ─── */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(8,8,8,0.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border)', padding: '0 24px 0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px' }}>
        <div style={{ fontFamily: 'Bebas Neue', fontSize: '1.8rem', color: 'var(--yellow)', letterSpacing: '0.05em', cursor: 'pointer' }} onClick={() => scrollTo('hero')}>AdWheels</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }} className="aw-hide-mobile">
          <button className="aw-nav-link" onClick={() => scrollTo('how')}>How It Works</button>
          <button className="aw-nav-link" onClick={() => scrollTo('pricing')}>Pricing</button>
          <button className="aw-nav-link" onClick={() => scrollTo('enterprise')} style={{ color: 'var(--purple)' }}>Enterprise</button>
          <button className="aw-nav-link" onClick={() => scrollTo('register')}>Drivers</button>
          <button className="aw-btn-primary" style={{ padding: '10px 22px', fontSize: '0.85rem' }} onClick={onGetStarted}>Login / Sign Up</button>
        </div>
        {/* Hamburger button — visible only on mobile */}
        <button
          className="aw-mobile-menu-btn"
          onClick={() => setMobileMenuOpen(o => !o)}
          style={{ display: 'none', alignItems: 'center', justifyContent: 'center', background: 'none', border: '1px solid var(--border)', borderRadius: '8px', color: '#F5F0E8', cursor: 'pointer', fontSize: '1.25rem', width: '40px', height: '40px', flexShrink: 0 }}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? '✕' : '☰'}
        </button>
      </nav>

      {/* ─── MOBILE MENU ─── */}
      {mobileMenuOpen && (
        <div
          style={{ position: 'fixed', top: '64px', left: 0, right: 0, zIndex: 99, background: 'rgba(8,8,8,0.97)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column', padding: '24px 32px', gap: '20px' }}
        >
          {[['How It Works', 'how'], ['Pricing', 'pricing'], ['Drivers', 'register']].map(([label, id]) => (
            <button key={id} className="aw-nav-link" onClick={() => { scrollTo(id); setMobileMenuOpen(false) }} style={{ fontSize: '1rem', padding: '4px 0', textAlign: 'left' }}>{label}</button>
          ))}
          <button className="aw-nav-link" onClick={() => { scrollTo('enterprise'); setMobileMenuOpen(false) }} style={{ fontSize: '1rem', padding: '4px 0', textAlign: 'left', color: 'var(--purple)' }}>Enterprise</button>
          <button className="aw-btn-primary" onClick={() => { onGetStarted(); setMobileMenuOpen(false) }} style={{ width: '100%', justifyContent: 'center', marginTop: '4px' }}>Login / Sign Up →</button>
        </div>
      )}
      {mobileMenuOpen && <div onClick={() => setMobileMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 98 }} />}

      {/* ─── HERO ─── */}
      <div id="hero" style={{ background: 'var(--black)', borderBottom: '1px solid var(--border)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(255,208,0,0.08), transparent)', pointerEvents: 'none' }} />
        <section style={{ textAlign: 'center', paddingTop: '120px', paddingBottom: '80px', position: 'relative' }}>
          <div className="aw-label" style={{ marginBottom: '20px' }}>🛺 Indore & Bhopal's #1 Rickshaw Ad Network</div>
          <h1 style={{ fontFamily: 'Bebas Neue', fontSize: 'clamp(3.5rem, 10vw, 7rem)', lineHeight: 0.92, letterSpacing: '0.02em', marginBottom: '28px' }}>
            Your Ad Live<br />
            <span style={{ color: 'var(--yellow)', WebkitTextStroke: '2px var(--yellow)', WebkitTextFillColor: 'transparent' }}>on Roads</span><br />
            in 90 Minutes
          </h1>
          <p style={{ fontSize: 'clamp(1rem, 2.5vw, 1.2rem)', color: 'rgba(245,240,232,0.5)', maxWidth: '520px', margin: '0 auto 40px', lineHeight: 1.6 }}>
            Connect with thousands of people daily. Rickshaw advertising that's fast, affordable, and impossible to ignore.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="aw-btn-primary" onClick={onGetStarted}>Launch My Ad Now →</button>
            <button className="aw-btn-secondary" onClick={() => scrollTo('register')}>Join as a Driver</button>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', maxWidth: '500px', margin: '64px auto 0' }}>
            {[['90', 'min', 'To Go Live'], ['₹1,500', '/mo', 'Starting At'], ['2', 'cities', 'Indore & Bhopal']].map(([num, unit, label]) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'Bebas Neue', fontSize: '2.8rem', color: 'var(--yellow)', lineHeight: 1 }}>{num}<span style={{ fontFamily: 'DM Sans', fontSize: '0.9rem', color: 'rgba(245,240,232,0.35)' }}> {unit}</span></div>
                <div style={{ fontSize: '0.72rem', color: 'rgba(245,240,232,0.38)', letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: '4px' }}>{label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Scrolling ticker */}
        <div style={{ overflow: 'hidden', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '12px 0', background: 'rgba(255,208,0,0.04)' }}>
          <div className="marquee-track">
            {[...Array(2)].map((_, i) => (
              <div key={i} style={{ display: 'flex', gap: '0', flexShrink: 0 }}>
                {['🛺 Live in 90 Minutes', '📍 Indore & Bhopal', '💰 From ₹1,500/mo', '📸 Daily Proof Photos', '✅ Verified Drivers', '🎯 Hyperlocal Targeting', '🛺 Live in 90 Minutes', '📍 Indore & Bhopal', '💰 From ₹1,500/mo', '📸 Daily Proof Photos', '✅ Verified Drivers', '🎯 Hyperlocal Targeting'].map(t => (
                  <span key={t} style={{ padding: '0 32px', fontSize: '0.82rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(245,240,232,0.4)', whiteSpace: 'nowrap' }}>{t}</span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── HOW IT WORKS ─── */}
      <div id="how" style={{ background: '#0d0d0d' }}>
        <section>
          <div className="aw-label aw-reveal">The Process</div>
          <h2 className="aw-title aw-reveal">From Upload to <span>On the Road</span></h2>
          <p className="aw-reveal" style={{ color: 'rgba(245,240,232,0.4)', marginBottom: '56px', maxWidth: '480px', lineHeight: 1.6 }}>No agencies. No weeks of waiting. Just upload, assign, print, and roll.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px' }}>
            {STEPS.map((step, i) => (
              <div key={step.title} className="aw-reveal" style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '32px 24px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: '16px', right: '20px', fontFamily: 'Bebas Neue', fontSize: '3.5rem', color: 'rgba(245,240,232,0.04)', lineHeight: 1 }}>{i + 1}</div>
                <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>{step.icon}</div>
                <div style={{ background: 'rgba(255,208,0,0.1)', border: '1px solid rgba(255,208,0,0.2)', borderRadius: '100px', display: 'inline-block', padding: '3px 12px', fontSize: '0.72rem', fontWeight: 700, color: 'var(--yellow)', letterSpacing: '0.08em', marginBottom: '14px' }}>{step.time}</div>
                <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '1rem', marginBottom: '8px' }}>{step.title}</div>
                <div style={{ fontSize: '0.85rem', color: 'rgba(245,240,232,0.45)', lineHeight: 1.6 }}>{step.desc}</div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* ─── WHO IS IT FOR ─── */}
      <div style={{ background: 'var(--black)' }}>
        <section>
          <div className="aw-label aw-reveal">Who It's For</div>
          <h2 className="aw-title aw-reveal">Built for <span>Both Sides</span></h2>
          <div className="aw-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '40px' }}>
            {[
              {
                emoji: '🏢', title: 'Advertisers', color: 'rgba(255,208,0,0.08)', border: 'rgba(255,208,0,0.15)',
                points: ['Local shops & restaurants', 'Growing brands & startups', 'Event & political campaigns', 'Real estate & builders'],
                cta: 'Launch My Ad', action: onGetStarted
              },
              {
                emoji: '🛺', title: 'Rickshaw Drivers', color: 'rgba(0,230,118,0.06)', border: 'rgba(0,230,118,0.15)',
                points: ['Earn ₹600–₹750/month extra', 'No fixed hours or targets', 'We handle everything for you', 'Get paid every week'],
                cta: 'Register as Driver', action: () => scrollTo('register')
              }
            ].map(card => (
              <div key={card.title} className="aw-reveal" style={{ background: card.color, border: `1.5px solid ${card.border}`, borderRadius: '20px', padding: '40px 36px' }}>
                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>{card.emoji}</div>
                <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: '1.4rem', marginBottom: '20px' }}>{card.title}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '28px' }}>
                  {card.points.map(p => (
                    <div key={p} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.88rem', color: 'rgba(245,240,232,0.65)' }}>
                      <span className="aw-check">✓</span>{p}
                    </div>
                  ))}
                </div>
                <button className="aw-btn-primary" onClick={card.action} style={{ fontSize: '0.88rem', padding: '12px 22px' }}>{card.cta} →</button>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* ─── PRICING ─── */}
      <div id="pricing" style={{ background: '#0d0d0d' }}>
        <section>
          <div className="aw-label aw-reveal">Pricing</div>
          <h2 className="aw-title aw-reveal">Simple, <span>Honest Pricing</span></h2>
          <p className="aw-reveal" style={{ color: 'rgba(245,240,232,0.4)', marginBottom: '48px', lineHeight: 1.6 }}>No setup fees. No hidden charges. Cancel any time.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '16px' }}>
            {PLANS.map(plan => (
              <div key={plan.name} className="aw-reveal" style={{ background: plan.featured ? 'linear-gradient(160deg,#1c1500,#0f0f0f)' : 'var(--card)', border: plan.featured ? `2px solid var(--yellow)` : '1.5px solid var(--border)', borderRadius: '16px', padding: '36px 28px', position: 'relative', transition: 'transform 0.3s' }}>
                {plan.featured && <div style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', background: 'var(--yellow)', color: 'var(--black)', fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '5px 16px', borderRadius: '100px', whiteSpace: 'nowrap' }}>Most Popular</div>}
                <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(245,240,232,0.33)', marginBottom: '10px' }}>{plan.name}</div>
                <div style={{ fontFamily: 'Bebas Neue', fontSize: '2.8rem', color: plan.color, lineHeight: 1, marginBottom: '4px' }}>{plan.price}<span style={{ fontFamily: 'DM Sans', fontSize: '0.95rem', color: 'rgba(245,240,232,0.32)' }}> / month</span></div>
                <div style={{ fontSize: '0.83rem', color: 'rgba(245,240,232,0.38)', marginBottom: '20px' }}>{plan.rickshaws} rickshaw{plan.rickshaws > 1 ? 's' : ''} · {plan.desc}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
                  {plan.features.map(f => (
                    <div key={f} style={{ display: 'flex', gap: '8px', fontSize: '0.85rem', color: 'rgba(245,240,232,0.65)', alignItems: 'flex-start' }}>
                      <span className="aw-check">✓</span>{f}
                    </div>
                  ))}
                </div>
                <button className="aw-btn-primary" onClick={onGetStarted} style={{ width: '100%', justifyContent: 'center', fontSize: '0.88rem', padding: '13px', background: plan.featured ? 'var(--yellow)' : 'rgba(245,240,232,0.07)', color: plan.featured ? 'var(--black)' : '#F5F0E8', border: plan.featured ? 'none' : '1px solid var(--border)' }}>
                  Launch My Ad →
                </button>
              </div>
            ))}
            {/* Enterprise card */}
            <div className="aw-reveal" style={{ background: 'rgba(168,85,247,0.05)', border: '1.5px solid rgba(168,85,247,0.25)', borderRadius: '16px', padding: '36px 28px' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(168,85,247,0.6)', marginBottom: '10px' }}>Enterprise</div>
              <div style={{ fontFamily: 'Bebas Neue', fontSize: '2.8rem', color: 'var(--purple)', lineHeight: 1, marginBottom: '4px' }}>Custom</div>
              <div style={{ fontSize: '0.83rem', color: 'rgba(245,240,232,0.38)', marginBottom: '20px' }}>25+ rickshaws · All cities</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
                {['25+ Rickshaws', 'All Cities', 'Dedicated Manager', 'Custom Pricing', 'Custom Reports'].map(f => (
                  <div key={f} style={{ display: 'flex', gap: '8px', fontSize: '0.85rem', color: 'rgba(245,240,232,0.65)', alignItems: 'flex-start' }}>
                    <span style={{ color: 'var(--purple)' }}>✓</span>{f}
                  </div>
                ))}
              </div>
              <button className="aw-btn-secondary" onClick={() => scrollTo('enterprise')} style={{ width: '100%', justifyContent: 'center', fontSize: '0.88rem', padding: '13px', borderColor: 'rgba(168,85,247,0.4)', color: 'var(--purple)' }}>
                Get Custom Quote →
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* ─── ENTERPRISE ─── */}
      <div id="enterprise" style={{ background: 'var(--black)', borderTop: '1px solid rgba(168,85,247,0.1)', borderBottom: '1px solid rgba(168,85,247,0.1)' }}>
        <section>
          <div className="aw-label aw-reveal" style={{ color: 'var(--purple)' }}>Enterprise</div>
          <h2 className="aw-title aw-reveal">Big Brand? <span style={{ color: 'var(--purple)' }}>Let's Talk.</span></h2>
          <p className="aw-reveal" style={{ color: 'rgba(245,240,232,0.4)', marginBottom: '56px', maxWidth: '500px', lineHeight: 1.6 }}>25+ rickshaws, both cities, dedicated account manager. We'll build a custom plan around your goals and call you within 2 hours.</p>

          <div className="aw-grid-2 aw-grid-2-gap" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '56px', alignItems: 'start' }}>
            {/* Perks */}
            <div className="aw-reveal" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {[
                ['🛺', '25+ Rickshaws', 'Blanket both cities with your brand at scale'],
                ['👔', 'Dedicated Manager', 'A real human who owns your campaign end-to-end'],
                ['📊', 'Custom Reports', 'Daily proofs, routes, and impressions in your inbox'],
                ['⚡', '90-Min Launch', 'Same fast activation — at massive scale'],
                ['💰', 'Bulk Pricing', 'Best rates in the market for high-volume runs'],
              ].map(([icon, title, desc]) => (
                <div key={title} style={{ display: 'flex', gap: '18px', alignItems: 'flex-start' }}>
                  <div style={{ width: '48px', height: '48px', background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.2)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0 }}>{icon}</div>
                  <div>
                    <div style={{ fontFamily: 'Syne', fontWeight: 700, marginBottom: '4px' }}>{title}</div>
                    <div style={{ fontSize: '0.84rem', color: 'rgba(245,240,232,0.4)', lineHeight: 1.5 }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Form */}
            <div className="aw-reveal" style={{ background: 'var(--card)', border: '1.5px solid rgba(168,85,247,0.25)', borderRadius: '20px', padding: '40px 36px' }}>
              {entDone ? (
                <div style={{ textAlign: 'center', padding: '32px 0' }}>
                  <div style={{ fontSize: '3.5rem', marginBottom: '16px' }}>🎉</div>
                  <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: '1.3rem', marginBottom: '8px', color: 'var(--purple)' }}>Request Received!</div>
                  <p style={{ color: 'rgba(245,240,232,0.5)', fontSize: '0.88rem', lineHeight: 1.6 }}>Our team will call you within 2 hours with a custom proposal. Get ready to go big! 🚀</p>
                </div>
              ) : (
                <>
                  <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: '1.2rem', marginBottom: '4px', color: 'var(--purple)' }}>Get a Custom Quote</div>
                  <div style={{ fontSize: '0.83rem', color: 'rgba(245,240,232,0.38)', marginBottom: '24px' }}>We call you within 2 hours</div>

                  <div className="aw-form-group">
                    <label className="aw-label-sm">Company / Brand Name *</label>
                    <input className="aw-input" placeholder="e.g. Big Bazaar, Dominos..." value={entForm.company} onChange={e => setEntForm(f => ({ ...f, company: e.target.value }))} />
                  </div>
                  <div className="aw-form-group">
                    <label className="aw-label-sm">Your Name *</label>
                    <input className="aw-input" placeholder="Full name" value={entForm.name} onChange={e => setEntForm(f => ({ ...f, name: e.target.value }))} />
                  </div>
                  <div className="aw-form-group">
                    <label className="aw-label-sm">Phone Number *</label>
                    <input className="aw-input" placeholder="+91 XXXXX XXXXX" value={entForm.phone} onChange={e => setEntForm(f => ({ ...f, phone: e.target.value }))} />
                  </div>
                  <div className="aw-form-group">
                    <label className="aw-label-sm">Email</label>
                    <input className="aw-input" placeholder="you@company.com" type="email" value={entForm.email} onChange={e => setEntForm(f => ({ ...f, email: e.target.value }))} />
                  </div>
                  <div className="aw-form-group">
                    <label className="aw-label-sm">City</label>
                    <select className="aw-input" value={entForm.city} onChange={e => setEntForm(f => ({ ...f, city: e.target.value }))} style={{ WebkitAppearance: 'none' }}>
                      <option value="">Select city</option>
                      <option value="indore">Indore</option>
                      <option value="bhopal">Bhopal</option>
                      <option value="both">Both Cities</option>
                    </select>
                  </div>
                  <div className="aw-form-group">
                    <label className="aw-label-sm">Message (optional)</label>
                    <textarea className="aw-input" placeholder="Campaign goals, timeline, budget range..." value={entForm.message} onChange={e => setEntForm(f => ({ ...f, message: e.target.value }))} style={{ minHeight: '80px', resize: 'vertical' }} />
                  </div>
                  <button className="aw-btn-primary" onClick={submitEnterprise} disabled={entSubmitting} style={{ width: '100%', justifyContent: 'center', background: 'var(--purple)', color: 'white' }}>
                    {entSubmitting ? 'Sending...' : '🚀 Request Enterprise Quote'}
                  </button>
                  <p style={{ fontSize: '0.76rem', color: 'rgba(245,240,232,0.3)', textAlign: 'center', marginTop: '12px' }}>We never spam. Your data is private & secure.</p>
                </>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* ─── REGISTER ─── */}
      <div id="register" style={{ background: '#0d0d0d' }}>
        <section>
          <div className="aw-label aw-reveal">Join AdWheels</div>
          <h2 className="aw-title aw-reveal">Register <span>Right Now</span></h2>
          <div className="aw-grid-2 aw-grid-2-gap" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '72px', alignItems: 'start', marginTop: '48px' }}>
            {/* Info */}
            <div className="aw-reveal">
              <h3 style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '1.3rem', marginBottom: '16px' }}>Be a Founding Member 🚀</h3>
              <p style={{ color: 'rgba(245,240,232,0.45)', marginBottom: '32px', lineHeight: 1.7, fontSize: '0.93rem' }}>We're onboarding our first batch of advertisers and drivers in Indore & Bhopal. Register now for early access, launch pricing, and personal onboarding.</p>
              {[
                ['⚡', 'Early Bird Discount', 'First 20 advertisers get 20% off their first month — no code needed.'],
                ['🛺', 'Driver Signup Bonus', 'First 50 drivers registered get ₹200 extra on first payout.'],
                ['📞', 'Personal Call Within 24 Hours', 'Our team calls every registrant personally. You\'re not a ticket number.'],
              ].map(([icon, title, desc]) => (
                <div key={title} style={{ display: 'flex', gap: '16px', marginBottom: '24px', alignItems: 'flex-start' }}>
                  <div style={{ width: '40px', height: '40px', background: 'rgba(255,208,0,0.08)', border: '1px solid rgba(255,208,0,0.15)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>{icon}</div>
                  <div>
                    <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '0.95rem', marginBottom: '3px' }}>{title}</div>
                    <div style={{ fontSize: '0.83rem', color: 'rgba(245,240,232,0.4)', lineHeight: 1.5 }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Form */}
            <div className="aw-reveal" style={{ background: 'var(--card)', border: '1.5px solid var(--border)', borderRadius: '20px', padding: '40px 36px' }}>
              {regDone ? (
                <div style={{ textAlign: 'center', padding: '32px 0' }}>
                  <div style={{ fontSize: '3.5rem', marginBottom: '16px' }}>🎉</div>
                  <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: '1.3rem', marginBottom: '8px' }}>You're In!</div>
                  <p style={{ color: 'rgba(245,240,232,0.5)', fontSize: '0.88rem', lineHeight: 1.6 }}>Welcome to AdWheels. Our team will call you within <strong>24 hours</strong>. Get ready to go live! 🚀</p>
                  <button className="aw-btn-primary" onClick={onGetStarted} style={{ marginTop: '24px' }}>Create Your Account →</button>
                </div>
              ) : (
                <>
                  <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: '1.2rem', marginBottom: '4px' }}>Register Interest</div>
                  <div style={{ fontSize: '0.83rem', color: 'rgba(245,240,232,0.38)', marginBottom: '22px' }}>60 seconds. We'll handle the rest.</div>

                  {/* Tab switch */}
                  <div style={{ display: 'flex', gap: '4px', background: 'rgba(245,240,232,0.04)', borderRadius: '8px', padding: '4px', marginBottom: '20px' }}>
                    {['advertiser', 'driver'].map(t => (
                      <button key={t} onClick={() => setActiveTab(t)} style={{ flex: 1, padding: '9px', border: 'none', borderRadius: '5px', fontFamily: 'Syne', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', background: activeTab === t ? 'var(--yellow)' : 'transparent', color: activeTab === t ? 'var(--black)' : 'rgba(245,240,232,0.45)', transition: 'all 0.2s' }}>
                        {t === 'advertiser' ? '🏢 Advertiser' : '🛺 Driver'}
                      </button>
                    ))}
                  </div>

                  <div className="aw-form-group">
                    <label className="aw-label-sm">Full Name</label>
                    <input className="aw-input" placeholder="Your name" value={regForm.name} onChange={e => setRegForm(f => ({ ...f, name: e.target.value }))} />
                  </div>
                  <div className="aw-form-group">
                    <label className="aw-label-sm">Phone Number</label>
                    <input className="aw-input" placeholder="+91 XXXXX XXXXX" value={regForm.phone} onChange={e => setRegForm(f => ({ ...f, phone: e.target.value }))} />
                  </div>
                  <div className="aw-form-group">
                    <label className="aw-label-sm">City</label>
                    <select className="aw-input" value={regForm.city} onChange={e => setRegForm(f => ({ ...f, city: e.target.value }))} style={{ WebkitAppearance: 'none' }}>
                      <option value="">Select city</option>
                      <option value="indore">Indore</option>
                      <option value="bhopal">Bhopal</option>
                    </select>
                  </div>

                  {activeTab === 'advertiser' && (
                    <>
                      <div className="aw-form-group">
                        <label className="aw-label-sm">Business / Brand Name</label>
                        <input className="aw-input" placeholder="e.g. Sharma Electronics" value={regForm.business} onChange={e => setRegForm(f => ({ ...f, business: e.target.value }))} />
                      </div>
                      <div className="aw-form-group">
                        <label className="aw-label-sm">Monthly Budget</label>
                        <select className="aw-input" value={regForm.budget} onChange={e => setRegForm(f => ({ ...f, budget: e.target.value }))} style={{ WebkitAppearance: 'none' }}>
                          <option value="">Select budget</option>
                          <option>Under ₹3,000</option>
                          <option>₹3,000 – ₹7,000</option>
                          <option>₹7,000 – ₹15,000</option>
                          <option>₹15,000+</option>
                        </select>
                      </div>
                    </>
                  )}

                  {activeTab === 'driver' && (
                    <div className="aw-form-group">
                      <label className="aw-label-sm">Main Route / Area</label>
                      <input className="aw-input" placeholder="e.g. Vijay Nagar to Palasia" value={regForm.area} onChange={e => setRegForm(f => ({ ...f, area: e.target.value }))} />
                    </div>
                  )}

                  <button className="aw-btn-primary" onClick={submitRegister} style={{ width: '100%', justifyContent: 'center', marginTop: '4px' }}>
                    Register Now — It's Free →
                  </button>
                  <p style={{ fontSize: '0.76rem', color: 'rgba(245,240,232,0.3)', textAlign: 'center', marginTop: '12px' }}>We never spam. Your data is private & secure.</p>
                </>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* ─── FOOTER ─── */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '48px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', background: 'var(--black)' }}>
        <div>
          <div style={{ fontFamily: 'Bebas Neue', fontSize: '1.8rem', color: 'var(--yellow)', letterSpacing: '0.05em', marginBottom: '4px' }}>AdWheels</div>
          <div style={{ fontSize: '0.82rem', color: 'rgba(245,240,232,0.3)' }}>Your Ad on Roads in 90 Minutes — Indore & Bhopal</div>
        </div>
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          {[['How It Works', 'how'], ['Pricing', 'pricing'], ['Enterprise', 'enterprise'], ['Register', 'register']].map(([label, id]) => (
            <button key={id} onClick={() => scrollTo(id)} style={{ background: 'none', border: 'none', color: 'rgba(245,240,232,0.4)', fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'DM Sans' }}>{label}</button>
          ))}
        </div>
        <button className="aw-btn-primary" onClick={onGetStarted} style={{ fontSize: '0.88rem', padding: '12px 22px' }}>
          Launch My Ad →
        </button>
      </footer>
    </div>
  )
}
