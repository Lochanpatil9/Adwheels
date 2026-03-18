/**
 * RickshawLoader — animated SVG rickshaw with ad-banner on the back.
 *
 * Props
 * adBannerUrl  — optional image URL to display on the rickshaw banner slot.
 * If omitted, shows the "AdWheels" text fallback.
 * size         — 'sm' | 'md' (default) | 'lg'
 * label        — loading label below rickshaw (default "Loading…")
 */
export default function RickshawLoader({
  adBannerUrl = null,
  size = 'md',
  label = 'Loading…',
}) {
  const scale = { sm: 0.55, md: 0.8, lg: 1.1 }[size] ?? 0.8

  return (
    <div
      className="rickshaw-loader-wrap"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '18px',
      }}
    >
      <style>{`
        /* ── wheel roll ── */
        @keyframes wheelRoll {
          to { transform: rotate(360deg); }
        }
        /* ── chassis bounce ── */
        @keyframes chassisBounce {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-2px); }
        }
        /* ── road scroll ── */
        @keyframes roadScroll {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        /* ── banner shimmer ── */
        @keyframes bannerShimmer {
          0%,100% { opacity: 1; }
          50%      { opacity: 0.8; }
        }
        /* ── headlight flicker ── */
        @keyframes headlightFlicker {
          0%, 100% { opacity: 0.8; }
          50%      { opacity: 0.6; }
        }
      `}</style>

      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 280 130"
        width={280 * scale}
        height={130 * scale}
        style={{ overflow: 'visible' }}
      >
        {/* ── road ── */}
        <g style={{ animation: 'roadScroll 1.2s linear infinite' }}>
          {[0, 56, 112, 168, 224, 280, 336, 392, 448, 504].map((x) => (
            <rect key={x} x={x} y={122} width={36} height={4} rx={2} fill="rgba(255,208,0,0.35)" />
          ))}
        </g>
        <rect x={0} y={126} width={560} height={2} fill="rgba(255,208,0,0.15)" />

        {/* ── whole vehicle bounces ── */}
        <g style={{ animation: 'chassisBounce 0.55s ease-in-out infinite' }}>

          {/* ── AD BANNER STRUTS ── */}
          <rect x={86} y={42} width={14} height={3} fill="#444" />
          <rect x={86} y={66} width={14} height={3} fill="#444" />

          {/* ── AD BANNER PANEL ── */}
          <g transform="translate(0, 22)">
            {/* panel shadow */}
            <rect x={1} y={2} width={90} height={52} rx={5} fill="rgba(0,0,0,0.4)" />
            {/* panel body */}
            <rect width={90} height={52} rx={5} fill="#1a1a1a" stroke="rgba(255,208,0,0.6)" strokeWidth={1.5} />

            {adBannerUrl ? (
              <image
                href={adBannerUrl}
                x={2} y={2}
                width={86} height={48}
                preserveAspectRatio="xMidYMid slice"
                clipPath="url(#bannerClip)"
                style={{ animation: 'bannerShimmer 2.5s ease-in-out infinite' }}
              />
            ) : (
              <g>
                <rect x={2} y={2} width={86} height={48} rx={4} fill="rgba(255,208,0,0.07)" />
                <text
                  x={45} y={22}
                  textAnchor="middle"
                  fill="#FFD000"
                  fontSize={13}
                  fontWeight="bold"
                  fontFamily="Bebas Neue, sans-serif"
                  letterSpacing={1}
                  style={{ animation: 'bannerShimmer 2.5s ease-in-out infinite' }}
                >AdWheels</text>
                <text x={45} y={34} textAnchor="middle" fill="rgba(245,240,232,0.5)" fontSize={7} fontFamily="DM Sans, sans-serif">YOUR AD ON ROADS</text>
                <text x={45} y={44} textAnchor="middle" fill="rgba(245,240,232,0.3)" fontSize={7} fontFamily="DM Sans, sans-serif">IN 90 MINUTES</text>
                
                <rect x={4} y={4} width={6} height={1.5} fill="rgba(255,208,0,0.4)" />
                <rect x={4} y={4} width={1.5} height={6} fill="rgba(255,208,0,0.4)" />
                <rect x={80} y={4} width={6} height={1.5} fill="rgba(255,208,0,0.4)" />
                <rect x={84.5} y={4} width={1.5} height={6} fill="rgba(255,208,0,0.4)" />
              </g>
            )}
            <rect width={90} height={52} rx={5} fill="url(#panelSheen)" />
          </g>

          {/* ── WHEELS (Drawn behind the chassis) ── */}
          {/* Rear wheel */}
          <g transform="translate(130, 112)">
            <circle r={12} fill="#222" stroke="#111" strokeWidth={1} />
            <g style={{ transformOrigin: '0 0', animation: 'wheelRoll 0.5s linear infinite' }}>
              <circle r={8} fill="#bbb" />
              {[0, 120, 240].map(a => (
                <circle key={a} cx={0} cy={-4.5} r={2} fill="#222" transform={`rotate(${a})`} />
              ))}
              <circle r={2.5} fill="#444" />
            </g>
          </g>

          {/* Front wheel */}
          <g transform="translate(220, 112)">
            <circle r={12} fill="#222" stroke="#111" strokeWidth={1} />
            <g style={{ transformOrigin: '0 0', animation: 'wheelRoll 0.5s linear infinite' }}>
              <circle r={8} fill="#bbb" />
              {[0, 120, 240].map(a => (
                <circle key={a} cx={0} cy={-4.5} r={2} fill="#222" transform={`rotate(${a})`} />
              ))}
              <circle r={2.5} fill="#444" />
            </g>
          </g>


          {/* ── CHASSIS & BODY ── */}
          
          {/* Main Lower Body (Black) */}
          <path
            d="M 100,65 L 165,65 L 165,85 L 185,85 L 185,65 L 210,65 L 225,80 C 225,95 220,105 210,105 L 100,105 Z"
            fill="#1a1a1a"
          />

          {/* Yellow Front Cowl */}
          <path
            d="M 185,65 L 210,65 L 225,80 C 225,85 223,90 220,95 L 185,95 Z"
            fill="#FFD000"
          />
          {/* Cowl vents */}
          <line x1={195} y1={75} x2={205} y2={75} stroke="rgba(0,0,0,0.2)" strokeWidth={2} strokeLinecap="round" />
          <line x1={192} y1={82} x2={208} y2={82} stroke="rgba(0,0,0,0.2)" strokeWidth={2} strokeLinecap="round" />

          {/* Canvas Roof (Yellow) */}
          <path
            d="M 98,30 C 98,20 115,20 140,20 L 180,20 C 195,20 205,25 210,35 L 210,40 L 98,40 Z"
            fill="#FFD000"
          />
          {/* Roof canvas folds */}
          <path d="M 120,22 L 120,40 M 150,21 L 150,40 M 180,22 L 180,40" stroke="rgba(0,0,0,0.1)" strokeWidth={1.5} />

          {/* Roof Pillars */}
          <rect x={100} y={40} width={4} height={25} fill="#222" />
          <rect x={163} y={40} width={4} height={25} fill="#222" />

          {/* Windshield & Pillar */}
          <line x1={208} y1={40} x2={220} y2={65} stroke="#222" strokeWidth={4} strokeLinecap="round" />
          <line x1={206} y1={42} x2={216} y2={63} stroke="rgba(100,180,255,0.3)" strokeWidth={3} strokeLinecap="round" />

          {/* Seats */}
          <rect x={104} y={65} width={8} height={25} rx={2} fill="#5c3a21" /> {/* Passenger backrest */}
          <rect x={104} y={90} width={35} height={8} rx={2} fill="#5c3a21" />  {/* Passenger cushion */}
          <rect x={160} y={65} width={6} height={20} rx={2} fill="#5c3a21" />  {/* Driver backrest */}
          <rect x={160} y={85} width={20} height={8} rx={2} fill="#5c3a21" />  {/* Driver cushion */}

          {/* Passenger Silhouette */}
          <circle cx={125} cy={55} r={8} fill="#333" />
          <path d="M 112,90 L 112,70 C 112,65 128,65 132,70 L 135,90 Z" fill="#333" />

          {/* Driver Silhouette */}
          <circle cx={175} cy={52} r={8} fill="#2a2a2a" />
          <path d="M 166,85 L 166,66 C 166,60 178,60 182,66 L 202,60 L 205,63 L 185,73 L 182,85 Z" fill="#2a2a2a" />

          {/* Steering Column & Handlebars */}
          <line x1={212} y1={65} x2={220} y2={112} stroke="#222" strokeWidth={3.5} />
          <line x1={202} y1={60} x2={212} y2={65} stroke="#222" strokeWidth={3.5} strokeLinecap="round" />

          {/* Front Mudguard (Yellow) */}
          <path d="M 206,112 C 206,96 234,96 234,112" fill="none" stroke="#FFD000" strokeWidth={4} strokeLinecap="round" />

          {/* Headlight & Taillight */}
          <rect x={98} y={88} width={4} height={10} rx={2} fill="#FF3333" />
          <circle cx={225} cy={80} r={4} fill="#FFF" stroke="#CCC" strokeWidth={1} />
          {/* Headlight Beam */}
          <path 
            d="M 228,80 L 255,68 C 265,75 265,85 255,92 Z" 
            fill="rgba(255,220,100,0.25)" 
            style={{ animation: 'headlightFlicker 3s infinite' }}
          />

        </g>

        {/* ── defs ── */}
        <defs>
          <clipPath id="bannerClip">
            <rect x={2} y={22} width={86} height={48} rx={4} />
          </clipPath>
          <linearGradient id="panelSheen" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.07)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.1)" />
          </linearGradient>
        </defs>
      </svg>

      {label && (
        <div
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: `${0.82 * scale + 0.1}rem`,
            color: 'rgba(255,208,0,0.6)',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            fontWeight: 600,
          }}
        >
          {label}
        </div>
      )}
    </div>
  )
}
