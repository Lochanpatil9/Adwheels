import { useEffect, useRef } from 'react'
import streetImg from '../assets/rickshaw/street.jpg'
import rickshawImg from '../assets/rickshaw/rickshaw.webp'
import forkImg from '../assets/rickshaw/fork.jpg'
import highwayImg from '../assets/rickshaw/highway.jpg'
import trailerImg from '../assets/rickshaw/trailer.webp'
import gantryImg from '../assets/rickshaw/gantry.webp'

export default function RickshawHero({ onGetStarted, onExplore }) {
  const pinRef = useRef(null)
  const canvasRef = useRef(null)
  const rkRef = useRef(null)
  const duskRef = useRef(null)
  const cueRef = useRef(null)
  const introRef = useRef(null)
  const trailerBannerRef = useRef(null)

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const g = cv.getContext('2d')
    const rk = rkRef.current
    const pin = pinRef.current
    const dusk = duskRef.current
    const cue = cueRef.current
    const intro = introRef.current
    const bn = trailerBannerRef.current

    const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v))
    const cover = (w, h, W, H) => {
      const sc = Math.max(W / w, H / h)
      return { sc, ox: (W - w * sc) / 2, oy: (H - h * sc) / 2 }
    }

    let W = 0, H = 0, VX = 0, HY = 0, Y0 = 0, bw0 = 0, XD = 0, GW = 0, GH = 0, GX = 0, GY = 0
    let cA = null, cB = null, cC = null, Q = [0, 0], PATH = []
    const Z0 = 1.7

    // Load assets
    const bg = new Image()
    bg.src = streetImg

    const bg2 = new Image()
    bg2.src = forkImg

    const bg3 = new Image()
    bg3.src = highwayImg

    const bg4 = new Image()
    bg4.src = trailerImg

    const gi = new Image()
    gi.src = gantryImg

    // Gantry texts for AdWheels
    const GM = [
      ['EVERY ROAD', 'IS A STAGE.'],
      ['IT RIDES WHERE', 'YOUR CUSTOMERS ARE.'],
      ['SEEN AGAIN', 'AND AGAIN.'],
    ]
    const GD = 'ADWHEELS.IN'

    let GAN = null
    let GP = []
    let GRC = null

    gi.onload = () => {
      const buildGantry = () => {
        const c = document.createElement('canvas')
        c.width = gi.naturalWidth || 1774
        c.height = gi.naturalHeight || 679
        const x = c.getContext('2d')
        x.drawImage(gi, 0, 0)

        const k = c.width / 1774
        const px = Math.round(303 * k + 5)
        const py = Math.round(128 * k + 5)
        const pw = Math.round(1167 * k - 10)
        const ph = Math.round(308 * k - 10)
        const cx = pw / 2
        const F = (s) => `700 ${s}px "Plus Jakarta Sans", "DM Sans", system-ui, sans-serif`
        const LS = (ctx, v) => {
          if ('letterSpacing' in ctx) ctx.letterSpacing = v + 'px'
        }

        // AdWheels Sleek Dark billboard face
        x.globalAlpha = 0.96
        const gr = x.createLinearGradient(px, py, px + pw, py + ph)
        gr.addColorStop(0, '#0F172A')
        gr.addColorStop(1, '#020617')
        x.fillStyle = gr
        x.fillRect(px, py, pw, ph)
        x.globalAlpha = 1.0

        // Amber decorative accent line
        x.fillStyle = '#FFBF00'
        x.fillRect(px + cx - pw * 0.05, py + ph * 0.78, pw * 0.1, Math.max(2, ph * 0.01))

        // AdWheels site header
        const f2 = ph * 0.075
        x.font = F(f2)
        LS(x, f2 * 0.3)
        x.fillStyle = 'rgba(255, 191, 0, 0.9)'
        x.textAlign = 'center'
        x.textBaseline = 'middle'
        x.fillText(GD, px + cx, py + ph * 0.89)

        GRC = { x: px, y: py, w: pw, h: ph }
        GAN = c

        GP = GM.map((m) => {
          const t = document.createElement('canvas')
          t.width = pw
          t.height = ph
          const y = t.getContext('2d')
          y.textAlign = 'center'
          y.textBaseline = 'middle'
          let fs = ph * 0.28
          y.font = F(fs)
          const wide = Math.max(y.measureText(m[0]).width, y.measureText(m[1]).width)
          if (wide > pw * 0.92) {
            fs *= (pw * 0.92) / wide
            y.font = F(fs)
          }
          LS(y, fs * 0.03)
          y.fillStyle = '#FFFFFF'
          y.fillText(m[0], cx, ph * 0.36)
          y.fillStyle = '#FFBF00'
          y.fillText(m[1], cx, ph * 0.62)
          return t
        })
        requestFrame()
      }

      if (document.fonts && document.fonts.load) {
        document.fonts.load('700 40px "Plus Jakarta Sans"').catch(() => {}).then(buildGantry)
      } else {
        buildGantry()
      }
    }

    const cr = (a, b, c, d, t) =>
      0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (-a + 3 * b - 3 * c + d) * t * t * t)

    function pathAt(u) {
      const n = PATH.length - 1
      const f = clamp(u) * n
      const i = Math.min(n - 1, Math.floor(f))
      const t = f - i
      const P = (j) => PATH[clamp(j, 0, n)]
      return [0, 1].map((a) => cr(P(i - 1)[a], P(i)[a], P(i + 1)[a], P(i + 2)[a], t))
    }

    function size() {
      if (!cv) return
      const d = Math.min(window.devicePixelRatio || 1, 2)
      W = cv.clientWidth
      H = cv.clientHeight
      cv.width = W * d
      cv.height = H * d
      g.setTransform(d, 0, 0, d, 0, 0)

      cA = cover(1821, 864, W, H)
      cB = cover(1821, 864, W, H)
      cC = cover(1942, 809, W, H)

      VX = cA.ox + 0.486 * 1821 * cA.sc
      HY = cA.oy + 0.555 * 864 * cA.sc
      Y0 = H * 0.98
      XD = VX
      GW = Math.min(680 * cA.sc, W * 0.9)
      GH = GW * 0.5
      GX = VX - GW / 2
      GY = HY + 60 * cA.sc - GH * 0.97

      bw0 = Math.min(W * (W < 800 ? 0.78 : 0.36), ((Y0 - HY) * 1.45) / 1.053)
      if (rk) {
        rk.style.width = bw0 + 'px'
        rk.style.left = '0'
        rk.style.top = '0'
      }

      const py0 = 465 + bw0 / (cB.sc * Z0)
      const nx = cB.ox + 800 * cB.sc
      const ny = cB.oy + py0 * cB.sc
      Q = [(XD - nx * Z0) / (1 - Z0), (Y0 - ny * Z0) / (1 - Z0)]

      PATH = [
        [800, py0],
        [800, (py0 + 680) / 2],
        [795, 680],
        [770, 625],
        [690, 585],
        [600, 545],
        [560, 522],
      ]
      renderFrame()
    }

    bg.onload = size
    bg2.onload = size
    bg3.onload = size
    bg4.onload = () => requestFrame()

    let cur = null
    let lp = 0
    let scheduled = false

    function requestFrame() {
      if (!scheduled) {
        scheduled = true
        requestAnimationFrame(() => {
          scheduled = false
          renderFrame()
        })
      }
    }

    function renderFrame() {
      if (!pin || !cv) return
      const r = pin.getBoundingClientRect()
      const scrollRange = r.height - window.innerHeight
      const tgt = scrollRange > 0 ? clamp(-r.top / scrollRange) : 0

      if (cur === null) cur = tgt
      const diff = Math.abs(tgt - cur)
      if (diff > 0.0003) {
        cur += (tgt - cur) * 0.1
        if (!lp) {
          lp = 1
          requestAnimationFrame(() => {
            lp = 0
            renderFrame()
          })
        }
      } else {
        cur = tgt
      }

      const P = cur
      const p = clamp(P / 0.5)
      const p1 = clamp((P - 0.5) / 0.5)

      const ta = clamp(p / 0.36)
      const zA = 1 + 1.6 * ta * ta
      const fa = clamp((p - 0.28) / 0.12)
      const fc = clamp(p1 / 0.12)
      const ec = fc * fc * (3 - 2 * fc)

      g.clearRect(0, 0, W, H)

      // 1. Street scene
      if (fa < 1 && bg.complete && bg.naturalWidth) {
        g.save()
        g.translate(VX, HY)
        g.scale(zA, zA)
        g.translate(-VX, -HY)
        g.drawImage(bg, cA.ox, cA.oy, 1821 * cA.sc, 864 * cA.sc)

        if (GAN && GP.length) {
          const T = 5.6 * p
          ;[[1, 1.8], [0, 1]].forEach(([n, D]) => {
            if (D - T < 0.12) return
            const s = 1 / (D - T)
            const w = GW * s
            const h = GH * s
            const x = VX - w / 2
            const y = HY + (GY - HY) * s
            if (y + h < 0) return
            const f = w / GAN.width
            g.drawImage(GAN, x, y, w, h)
            g.drawImage(GP[n], x + GRC.x * f, y + GRC.y * f, GRC.w * f, GRC.h * f)
          })
        }
        g.restore()
      }

      // 2. Fork road scene
      const sb = clamp((p - 0.34) / 0.34)
      const z = 1 + (Z0 - 1) * (1 - sb) * (1 - sb)
      const N = (x, y) => [cB.ox + x * cB.sc, cB.oy + y * cB.sc]
      const S = (x, y) => {
        const n = N(x, y)
        return [Q[0] + (n[0] - Q[0]) * z, Q[1] + (n[1] - Q[1]) * z]
      }
      const mm = clamp((clamp((p - 0.38) / 0.62) - 0.25) / 0.6)
      const pn = W < 800 ? Math.max(0, 0.4 * W - N(PATH[PATH.length - 1][0], 0)[0]) * mm * mm * (3 - 2 * mm) : 0

      if (fa > 0 && bg2.complete && bg2.naturalWidth) {
        g.save()
        g.globalAlpha = fa
        g.translate(pn, H * 0.6 * ec)
        g.translate(Q[0], Q[1])
        g.scale(z, z)
        g.translate(-Q[0], -Q[1])
        g.drawImage(bg2, cB.ox, cB.oy, 1821 * cB.sc, 864 * cB.sc)

        if (GAN && GP[2]) {
          const k = cB.sc
          const w = 780 * k
          const f = w / GAN.width
          const E = 70 * k
          const x = cB.ox + 555 * k - w / 2
          const y = cB.oy + 590 * k - 679 * f - E
          const A = 400
          const B = 600
          const C = GAN.height

          g.drawImage(GAN, 0, 80, GAN.width, A - 80, x, y + 80 * f, w, (A - 80) * f)
          g.drawImage(GAN, 0, A, GAN.width, B - A, x, y + A * f, w, (B - A) * f + E)
          g.drawImage(GAN, 0, B, GAN.width, C - B, x, y + B * f + E, w, (C - B) * f)
          g.drawImage(GP[2], x + GRC.x * f, y + GRC.y * f, GRC.w * f, GRC.h * f)
        }
        g.restore()
      }

      // 3. Highway scene + moving trailer
      if (fc > 0 && bg3.complete && bg3.naturalWidth) {
        g.save()
        g.globalAlpha = ec
        const bx = cC.ox + 100 - 200 * p1
        const by = cC.oy - H * 0.35 * (1 - ec)
        const k = cC.sc
        g.drawImage(bg3, bx, by, 1942 * k, 809 * k)

        const tt = clamp((p1 - 0.12) / 0.74)
        if (tt > 0 && tt < 1 && bg4.complete && bg4.naturalWidth) {
          const tw = Math.min(W * (W < 800 ? 1.25 : 0.8), 1180)
          const th = tw * 0.2445
          const f = tt + (0.85 * Math.sin(2 * Math.PI * tt)) / (2 * Math.PI)
          const kx = -tw + (W + tw) * f
          const fy = by + 398 * k
          const jy = Math.sin(P * 900) * 1.2

          g.fillStyle = 'rgba(0,0,0,.28)'
          g.beginPath()
          g.ellipse(kx + tw * 0.5, fy - 2, tw * 0.46, 5, 0, 0, 7)
          g.fill()

          g.drawImage(bg4, kx, fy - th + jy, tw, th)

          // Trailer frame border
          const px = kx + tw * 0.0303
          const py = fy - th + th * 0.1555 + jy
          const pw = tw * 0.6617
          const ph = th * 0.492
          const r = Math.max(2, ph * 0.025)
          const bw = Math.max(2, ph * 0.022)

          const rr = (x, y, w, h, q) => {
            g.beginPath()
            g.moveTo(x + q, y)
            g.arcTo(x + w, y, x + w, y + h, q)
            g.arcTo(x + w, y + h, x, y + h, q)
            g.arcTo(x, y, x, y, q)
            g.arcTo(x, y, x + w, y, q)
            g.closePath()
          }

          rr(px, py, pw, ph, r)
          g.fillStyle = '#1E293B'
          g.fill()

          const grTrailer = g.createLinearGradient(px, py, px + pw, py + ph)
          grTrailer.addColorStop(0, '#0F172A')
          grTrailer.addColorStop(1, '#020617')
          rr(px + bw, py + bw, pw - 2 * bw, ph - 2 * bw, r * 0.6)
          g.fillStyle = grTrailer
          g.fill()

          rr(px + bw * 2.2, py + bw * 2.2, pw - 4.4 * bw, ph - 4.4 * bw, r * 0.4)
          g.strokeStyle = 'rgba(255, 191, 0, 0.4)'
          g.lineWidth = Math.max(1, bw * 0.35)
          g.stroke()

          g.drawImage(bg3, 0, 400, 1942, 48, bx, by + 400 * k, 1942 * k, 48 * k)
        }
        g.restore()
      }

      // 4. Rickshaw positioning & smooth 3D rotation
      let x = 0, y = 0, s = 1, rot = 0
      if (p < 0.34) {
        const m = Math.sin((Math.PI * p) / 0.34)
        x = XD + Math.sin(p * 20) * 0.012 * W
        y = Y0 - m * 0.05 * H + Math.sin(p * 240) * 1.4
        s = 1 - 0.12 * m
      } else {
        const u = clamp((p - 0.38) / 0.62)
        const q = pathAt(u)
        const c = S(q[0], q[1])
        x = c[0] + pn
        y = c[1]
        s = ((q[1] - 465) * cB.sc * z * (1 + 0.8 * u)) / bw0
        rot = -7 * clamp((u - 0.35) / 0.3)
        if (p1 > 0) y += H * 0.6 * ec
      }

      if (rk) {
        rk.style.transform = `translate(${x - bw0 / 2}px, ${y - bw0 * 1.053}px) rotate(${rot}deg) scale(${s})`
      }

      // Dusk lighting overlay
      if (dusk) {
        dusk.style.opacity = `${p * 0.35 * (1 - fc)}`
      }

      // Scroll Cue indicator
      if (cue) {
        cue.style.opacity = P < 0.02 ? '1' : '0'
      }

      // First screen hero card fade out smoothly on initial scroll (fades completely in 2-3 scrolls)
      if (intro) {
        const introAlpha = clamp(1 - P / 0.025)
        intro.style.opacity = `${introAlpha}`
        intro.style.pointerEvents = introAlpha > 0.05 ? 'auto' : 'none'
        intro.style.transform = `translate(-50%, ${-P * 350}px)`
      }

      // Closing billboard on the trailer
      if (bn && cC) {
        const tt = clamp((p1 - 0.12) / 0.74)
        const f = tt + (0.85 * Math.sin(2 * Math.PI * tt)) / (2 * Math.PI)
        const tw = Math.min(W * (W < 800 ? 1.25 : 0.8), 1180)
        const th = tw * 0.2445
        const kx = -tw + (W + tw) * f
        const fy = cC.oy - H * 0.35 * (1 - ec) + 398 * cC.sc
        const PW = tw * 0.6617

        bn.style.left = `${kx + tw * 0.0303}px`
        bn.style.top = `${fy - th + th * 0.1555}px`
        bn.style.width = `${PW}px`
        bn.style.height = `${th * 0.492}px`
        bn.style.setProperty('--pw', `${PW}px`)
        bn.classList.toggle('sm', PW < 520)
        bn.style.opacity = p1 >= 0.1 && p1 < 1.01 ? '1' : '0'
        bn.style.pointerEvents = p1 >= 0.15 ? 'auto' : 'none'
      }
    }

    let tk = 0
    let lw = window.innerWidth
    let lh = window.innerHeight

    const onScroll = () => {
      if (!tk) {
        tk = 1
        requestAnimationFrame(() => {
          tk = 0
          renderFrame()
        })
      }
    }

    const onResize = () => {
      if (window.innerWidth !== lw || (window.innerWidth >= 800 && window.innerHeight !== lh)) {
        lw = window.innerWidth
        lh = window.innerHeight
        size()
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)

    // Initial setup
    size()

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return (
    <section className="pin" id="ride" ref={pinRef} style={{ height: '1400vh', position: 'relative', padding: 0, margin: 0, width: '100%', maxWidth: '100vw' }}>
      <style>{`
        #ride, #ride.pin { padding: 0 !important; margin: 0 !important; width: 100% !important; max-width: 100vw !important; box-sizing: border-box !important; }
        .stick { position: sticky; top: 0; left: 0; right: 0; height: 100vh; height: 100dvh; overflow: hidden; background: #0F172A; width: 100%; padding: 0 !important; margin: 0 !important; }
        #w { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
        #rk { position: absolute; transform-origin: 50% 100%; will-change: transform; isolation: isolate; }
        #rk img { filter: drop-shadow(0 8px 18px rgba(0,0,0,.6)); display: block; width: 100%; height: auto; }
        #rk .sh { position: absolute; left: 2%; right: 2%; bottom: -3%; height: 8%; background: radial-gradient(closest-side, rgba(0,0,0,.7), transparent); z-index: -1; }
        .stick::after {
          content: "";
          position: absolute;
          inset: 0;
          background:
            linear-gradient(180deg, rgba(10, 15, 30, 0.72) 0%, rgba(10, 15, 30, 0.35) 26%, transparent 52%),
            radial-gradient(ellipse at 50% 55%, transparent 45%, rgba(15, 23, 42, 0.45) 100%);
          z-index: 1;
          pointer-events: none;
        }
        
        /* Initial Hero Overlay */
        .intro-hero {
          position: absolute;
          left: 50%;
          top: max(68px, 9vh);
          transform: translateX(-50%);
          z-index: 5;
          text-align: center;
          width: 92%;
          max-width: 760px;
          transition: opacity .3s ease;
          pointer-events: auto;
        }

        /* Professional Trust Ribbon */
        .trust-strip {
          display: inline-flex;
          align-items: center;
          gap: 20px;
          background: rgba(15, 23, 42, 0.58);
          border: 1px solid rgba(255, 255, 255, 0.18);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          padding: 8px 22px;
          border-radius: 12px;
          margin-top: 4px;
        }
        .trust-strip-item {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .trust-strip-divider {
          width: 1px;
          height: 16px;
          background: rgba(255, 255, 255, 0.2);
        }
        @media (max-width: 640px) {
          .intro-hero { top: max(64px, 8vh); width: 94%; }
          .trust-strip {
            gap: 10px;
            padding: 7px 14px;
            font-size: 0.75rem;
          }
          .trust-strip-item span {
            font-size: 0.72rem !important;
          }
        }
        @media (max-width: 768px) {
          .cue { display: none !important; }
        }

        /* Animated Scroll Indicator */
        .cue {
          z-index: 5;
          color: #FFBF00;
          position: absolute;
          left: 50%;
          bottom: 3vh;
          transform: translateX(-50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 700;
          font-size: 11px;
          letter-spacing: .25em;
          text-transform: uppercase;
          transition: opacity .4s ease;
          pointer-events: none;
          text-shadow: 0 2px 10px rgba(0,0,0,.9);
        }
        .cue i {
          width: 2px;
          height: 38px;
          background: linear-gradient(#FFBF00, transparent);
          animation: cueLine 2s ease-in-out infinite;
          transform-origin: top;
          border-radius: 2px;
        }
        @keyframes cueLine {
          0% { transform: scaleY(0); }
          50% { transform: scaleY(1); opacity: 1; }
          100% { transform: scaleY(1); opacity: 0; }
        }

        /* Trailer Closing Billboard (04 — The Road Ahead) */
        .tx-trl {
          position: absolute;
          z-index: 4;
          box-sizing: border-box;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 4%;
          padding: 0 5%;
          color: #F8FAFC;
          text-align: left;
          opacity: 0;
          transition: opacity .4s ease;
        }
        .tx-trl .k {
          display: block;
          margin-bottom: .4em;
          font-weight: 800;
          font-size: max(9px, calc(var(--pw, 800px) * 0.015));
          letter-spacing: .25em;
          text-transform: uppercase;
          color: #FFBF00;
        }
        .tx-trl h2 {
          margin: 0;
          color: #FFFFFF;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 800;
          font-size: calc(var(--pw, 800px) * 0.052);
          line-height: 1.1;
          letter-spacing: -.02em;
        }
        .tx-trl p {
          margin: .4em 0 0;
          color: rgba(248, 250, 252, 0.85);
          font-size: calc(var(--pw, 800px) * 0.021);
          line-height: 1.35;
        }
        .tx-trl .btn-trailer {
          flex: none;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 800;
          font-size: max(10px, calc(var(--pw, 800px) * 0.017));
          padding: .9em 1.5em;
          background: linear-gradient(135deg, #FFBF00, #FF8C00);
          color: #0F172A;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          white-space: nowrap;
          box-shadow: 0 4px 14px rgba(255, 191, 0, 0.4);
          transition: transform .2s ease;
        }
        .tx-trl .btn-trailer:hover {
          transform: translateY(-2px) scale(1.02);
        }
        .tx-trl.sm .k, .tx-trl.sm p {
          display: none;
        }
      `}</style>

      <div className="stick">
        <canvas id="w" ref={canvasRef} aria-hidden="true" />
        <div id="dusk" ref={duskRef} style={{ position: 'absolute', inset: 0, background: '#0F172A', pointerEvents: 'none', zIndex: 1 }} />
        
        {/* Animated Rickshaw */}
        <div id="rk" ref={rkRef}>
          <i className="sh" />
          <img src={rickshawImg} alt="AdWheels Auto-rickshaw" />
        </div>

        {/* Milestone 01 / Opening Hero Overlay */}
        <div className="intro-hero" ref={introRef}>
          {/* Verified Drivers Trust Strip at Top */}
          <div className="trust-strip" style={{ marginBottom: '14px' }}>
            <div className="trust-strip-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFBF00" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                <path d="m9 12 2 2 4-4"/>
              </svg>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#F8FAFC', letterSpacing: '0.01em' }}>
                Verified Drivers
              </span>
            </div>

            <div className="trust-strip-divider" />

            <div className="trust-strip-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFBF00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#F8FAFC', letterSpacing: '0.01em' }}>
                Daily Photo Proof
              </span>
            </div>

            <div className="trust-strip-divider" />

            <div className="trust-strip-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFBF00" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="1" x2="12" y2="23"/>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#F8FAFC', letterSpacing: '0.01em' }}>
                From ₹1,500 / mo
              </span>
            </div>
          </div>

          <h1 style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 'clamp(2rem, 4.2vw, 3.4rem)',
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: '-.03em',
            marginBottom: '16px',
            color: '#FFFFFF',
            textShadow: '0 2px 14px rgba(0, 0, 0, 0.9), 0 4px 28px rgba(0, 0, 0, 0.65)'
          }}>
            Get Your Ad on{' '}
            <span style={{
              color: '#FFBF00',
              fontWeight: 900,
              textShadow: '0 0 24px rgba(255,191,0,0.5), 0 2px 12px rgba(0, 0, 0, 0.95)'
            }}>
              1000+ Rickshaws
            </span><br />
            in 90 Minutes
          </h1>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn-pri" onClick={onGetStarted} style={{ padding: '13px 26px', fontSize: '.92rem', fontWeight: 800, boxShadow: '0 6px 20px rgba(255,191,0,0.45)' }}>
              Launch My Ad Now →
            </button>
            <button
              onClick={onExplore}
              style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1.5px solid rgba(255, 255, 255, 0.35)',
                backdropFilter: 'blur(8px)',
                color: '#FFFFFF',
                padding: '13px 22px',
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '.92rem',
                cursor: 'pointer',
                transition: 'all .2s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#FFBF00'; e.currentTarget.style.color = '#FFBF00' }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.35)'; e.currentTarget.style.color = '#FFFFFF' }}
            >
              See How It Works ↓
            </button>
          </div>
        </div>

        {/* Closing Trailer Billboard (Mounted on Truck) */}
        <div className="tx-trl" ref={trailerBannerRef}>
          <div>
            <span className="k">04 — The Road Ahead</span>
            <h2>Ready to hit the road?</h2>
            <p>Launch your brand campaign across Indore & Bhopal today.</p>
          </div>
          <button className="btn-trailer" onClick={onGetStarted}>
            Get Started Free →
          </button>
        </div>

        {/* Scroll Cue */}
        <div className="cue" ref={cueRef}>
          <span>Scroll to explore</span>
          <i />
        </div>
      </div>
    </section>
  )
}
