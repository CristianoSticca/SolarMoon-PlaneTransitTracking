'use client'

import { useTranslations } from 'next-intl'

function Section({
  icon,
  title,
  desc,
  visual,
}: {
  icon: string
  title: string
  desc: string
  visual?: React.ReactNode
}) {
  return (
    <div
      className="rounded-xl p-5 space-y-3"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <h2 className="text-base font-semibold" style={{ color: '#e8eaf0' }}>{title}</h2>
      </div>
      {visual && (
        <div className="rounded-lg p-3 flex justify-center" style={{ background: 'rgba(0,0,0,0.20)' }}>{visual}</div>
      )}
      <p className="text-sm leading-relaxed" style={{ color: '#8892a4' }}>{desc}</p>
    </div>
  )
}

function RadarDiagram() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120">
      <circle cx="60" cy="60" r="55" fill="none" stroke="rgba(232,200,72,0.2)" strokeWidth="1" />
      <circle cx="60" cy="60" r="36" fill="none" stroke="rgba(232,200,72,0.3)" strokeWidth="1" />
      <circle cx="60" cy="60" r="18" fill="none" stroke="rgba(232,200,72,0.4)" strokeWidth="1" />
      <line x1="5" y1="60" x2="115" y2="60" stroke="rgba(232,200,72,0.15)" strokeWidth="1" />
      <line x1="60" y1="5" x2="60" y2="115" stroke="rgba(232,200,72,0.15)" strokeWidth="1" />
      {/* Observer */}
      <circle cx="60" cy="60" r="4" fill="white" opacity="0.9" />
      {/* Moon */}
      <circle cx="80" cy="35" r="7" fill="#ffd700" opacity="0.9" />
      {/* Transit aircraft */}
      <circle cx="76" cy="38" r="4" fill="#4ade80" />
      <circle cx="76" cy="38" r="7" fill="none" stroke="#4ade80" strokeWidth="1" opacity="0.5" />
      {/* Other aircraft */}
      <circle cx="38" cy="75" r="3" fill="#64748b" opacity="0.6" />
      <text x="60" y="116" textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="7" fontFamily="monospace">tu al centro</text>
    </svg>
  )
}

function MarginDiagram() {
  return (
    <svg width="140" height="90" viewBox="0 0 140 90">
      {/* Wide margin */}
      <circle cx="70" cy="45" r="38" fill="none" stroke="rgba(251,191,36,0.15)" strokeDasharray="4" strokeWidth="1" />
      {/* Disc margin */}
      <circle cx="70" cy="45" r="22" fill="none" stroke="rgba(251,191,36,0.5)" strokeWidth="1.5" />
      {/* Moon disc */}
      <circle cx="70" cy="45" r="9" fill="rgba(255,215,0,0.3)" />
      <circle cx="70" cy="45" r="6" fill="#ffd700" />
      {/* Aircraft path through disc */}
      <line x1="10" y1="47" x2="130" y2="43" stroke="#4ade80" strokeWidth="1" strokeDasharray="3" />
      <circle cx="54" cy="46" r="3" fill="#4ade80" />
      <text x="8" y="82" fill="rgba(255,255,255,0.4)" fontSize="8">±0.5° = transito vero</text>
    </svg>
  )
}

function ListExampleDiagram() {
  return (
    <div className="w-full space-y-2 text-left">
      {/* Transit row */}
      <div className="rounded-lg px-3 py-2 border border-green-400/40 bg-green-400/8">
        <div className="text-xs font-semibold text-green-400">✈ AZA123 → 🌙 Luna</div>
        <div className="flex justify-between items-center mt-0.5">
          <span className="text-xs" style={{ color: '#8892a4' }}>Scarto ±0.12°</span>
          <span className="text-sm font-bold font-mono" style={{ color: '#e8eaf0' }}>2:34</span>
        </div>
      </div>
      {/* Nearby separator */}
      <div className="text-xs px-1 pt-1" style={{ color: 'rgba(255,255,255,0.2)' }}>Aerei vicini (nessun transito previsto)</div>
      {/* Nearby row */}
      <div className="rounded-lg px-3 py-2 opacity-60" style={{ border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' }}>
        <div className="text-xs" style={{ color: '#8892a4' }}>✈ RYR456 · 🌙 Luna</div>
        <div className="flex justify-between items-center mt-0.5">
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>min 2.34° · ora 4.12°</span>
          <span className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.25)' }}>no transit</span>
        </div>
      </div>
    </div>
  )
}

function PhotoWindowExamples({ t }: { t: ReturnType<typeof useTranslations<'guide'>> }) {
  const examples = [
    { text: t('photoWindow.moonExample1'), good: true },
    { text: t('photoWindow.moonExample2'), good: false },
    { text: t('photoWindow.sunExample1'), good: true },
    { text: t('photoWindow.sunExample2'), good: false },
  ]
  return (
    <div className="w-full space-y-2 text-left">
      {examples.map((ex, i) => (
        <div key={i} className="flex items-start gap-2 text-xs" style={{ color: ex.good ? '#4ade80' : '#8892a4' }}>
          <span style={{ flexShrink: 0, marginTop: 1 }}>{ex.good ? '✓' : '✗'}</span>
          <span>{ex.text}</span>
        </div>
      ))}
      <div className="mt-3 text-xs leading-relaxed" style={{ color: '#8892a4', borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 8 }}>
        💡 {t('photoWindow.tip')}
      </div>
    </div>
  )
}

function FovSimulatorDiagram() {
  return (
    <svg width="160" height="100" viewBox="0 0 160 100">
      {/* Dark sky background */}
      <rect x="0" y="0" width="160" height="100" fill="#07070f" rx="8" />
      {/* Stars */}
      {[[20,15],[50,8],[90,20],[130,12],[145,35],[15,55],[140,70],[35,80],[110,85]].map(([x,y],i) => (
        <circle key={i} cx={x} cy={y} r="0.8" fill="white" opacity={0.4 + (i % 3) * 0.2} />
      ))}
      {/* Rule-of-thirds grid */}
      <line x1="0" y1="33" x2="160" y2="33" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
      <line x1="0" y1="66" x2="160" y2="66" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
      <line x1="53" y1="0" x2="53" y2="100" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
      <line x1="106" y1="0" x2="106" y2="100" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
      {/* Moon */}
      <circle cx="80" cy="50" r="22" fill="#2a2420" />
      <circle cx="80" cy="50" r="22" fill="none" stroke="rgba(255,220,150,0.8)" strokeWidth="1.5" />
      <circle cx="80" cy="50" r="22" fill="rgba(255,220,130,0.12)" />
      {/* Moon craters */}
      <circle cx="73" cy="44" r="3" fill="none" stroke="rgba(200,180,120,0.3)" strokeWidth="1" />
      <circle cx="86" cy="57" r="2" fill="none" stroke="rgba(200,180,120,0.25)" strokeWidth="0.8" />
      {/* Aircraft trajectory */}
      <line x1="15" y1="52" x2="145" y2="48" stroke="rgba(100,200,100,0.4)" strokeWidth="0.8" strokeDasharray="4,3" />
      {/* Aircraft silhouette */}
      <ellipse cx="58" cy="50" rx="9" ry="2" fill="#78e0a0" opacity="0.9" />
      <polygon points="67,50 72,48 67,51" fill="#78e0a0" opacity="0.9" />
      <line x1="58" y1="50" x2="58" y2="43" stroke="#78e0a0" strokeWidth="1.5" opacity="0.9" />
      <line x1="53" y1="50" x2="63" y2="50" stroke="#78e0a0" strokeWidth="2.5" opacity="0.9" />
      {/* FOV angle lines */}
      <line x1="80" y1="50" x2="0" y2="10" stroke="rgba(200,184,112,0.25)" strokeWidth="0.7" />
      <line x1="80" y1="50" x2="160" y2="10" stroke="rgba(200,184,112,0.25)" strokeWidth="0.7" />
      <line x1="80" y1="50" x2="0" y2="90" stroke="rgba(200,184,112,0.25)" strokeWidth="0.7" />
      <line x1="80" y1="50" x2="160" y2="90" stroke="rgba(200,184,112,0.25)" strokeWidth="0.7" />
      {/* Labels */}
      <text x="80" y="8" textAnchor="middle" fill="rgba(200,184,112,0.6)" fontSize="7" fontFamily="monospace">FOV</text>
      <text x="61" y="40" textAnchor="middle" fill="rgba(120,224,160,0.8)" fontSize="6" fontFamily="monospace">✈</text>
    </svg>
  )
}

export function GuideContent() {
  const t = useTranslations('guide')

  return (
    <div className="space-y-4">
      <Section
        icon="📡"
        title={t('radar.title')}
        desc={t('radar.desc')}
        visual={<RadarDiagram />}
      />
      <Section
        icon="🗺️"
        title={t('radius.title')}
        desc={t('radius.desc')}
      />
      <Section
        icon="🎯"
        title={t('margin.title')}
        desc={t('margin.desc')}
        visual={<MarginDiagram />}
      />
      <Section
        icon="🔔"
        title={t('notifications.title')}
        desc={t('notifications.desc')}
      />
      <Section
        icon="�"
        title={t('bgPush.title')}
        desc={t('bgPush.desc')}
      />
      <Section
        icon="�📋"
        title={t('listReading.title')}
        desc={t('listReading.desc')}
        visual={<ListExampleDiagram />}
      />
      <Section
        icon="🗺️"
        title={t('mapView.title')}
        desc={t('mapView.desc')}
      />
      <Section
        icon="📷"
        title={t('arView.title')}
        desc={t('arView.desc')}
      />
      <Section
        icon="✈"
        title={t('flightDetails.title')}
        desc={t('flightDetails.desc')}
      />
      <Section
        icon="🌅"
        title={t('photoWindow.title')}
        desc={t('photoWindow.desc')}
        visual={<PhotoWindowExamples t={t} />}
      />
      <Section
        icon="🔭"
        title={t('simulator.title')}
        desc={t('simulator.desc')}
        visual={<FovSimulatorDiagram />}
      />
    </div>
  )
}
