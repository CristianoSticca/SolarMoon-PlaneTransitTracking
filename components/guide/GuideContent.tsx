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
    <div className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-3">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <h2 className="text-base font-semibold">{title}</h2>
      </div>
      {visual && (
        <div className="rounded-lg bg-black/20 p-3 flex justify-center">{visual}</div>
      )}
      <p className="text-sm text-white/60 leading-relaxed">{desc}</p>
    </div>
  )
}

function RadarDiagram() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120">
      <circle cx="60" cy="60" r="55" fill="none" stroke="rgba(139,92,246,0.2)" strokeWidth="1" />
      <circle cx="60" cy="60" r="36" fill="none" stroke="rgba(139,92,246,0.3)" strokeWidth="1" />
      <circle cx="60" cy="60" r="18" fill="none" stroke="rgba(139,92,246,0.4)" strokeWidth="1" />
      <line x1="5" y1="60" x2="115" y2="60" stroke="rgba(139,92,246,0.15)" strokeWidth="1" />
      <line x1="60" y1="5" x2="60" y2="115" stroke="rgba(139,92,246,0.15)" strokeWidth="1" />
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
          <span className="text-white/30 text-xs">Scarto ±0.12°</span>
          <span className="text-white font-mono text-sm font-bold">2:34</span>
        </div>
      </div>
      {/* Nearby separator */}
      <div className="text-white/20 text-xs px-1 pt-1">Aerei vicini (nessun transito previsto)</div>
      {/* Nearby row */}
      <div className="rounded-lg px-3 py-2 border border-white/5 bg-white/2 opacity-60">
        <div className="text-xs text-white/50">✈ RYR456 · 🌙 Luna</div>
        <div className="flex justify-between items-center mt-0.5">
          <span className="text-white/25 text-xs">min 2.34° · ora 4.12°</span>
          <span className="text-white/25 text-xs font-mono">no transit</span>
        </div>
      </div>
    </div>
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
        icon="📋"
        title={t('listReading.title')}
        desc={t('listReading.desc')}
        visual={<ListExampleDiagram />}
      />
    </div>
  )
}
