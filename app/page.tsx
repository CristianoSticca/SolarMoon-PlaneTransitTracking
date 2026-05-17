'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'

// ─── Copy ────────────────────────────────────────────────────────────────────

const copy = {
  it: {
    tagline: 'Astrophotography Transit Tracker',
    hero: 'Fotografa il momento che non si ripete',
    heroSub: 'Un aereo attraversa il disco della Luna in meno di un secondo. AstroTransit lo prevede con minuti di anticipo — così hai il tempo di inquadrare e scattare.',
    cta: "Apri l'app",
    ctaSub: 'Scopri come funziona ↓',
    howTitle: 'Come funziona',
    steps: [
      { n: '01', title: 'GPS on, una volta sola', desc: "Azimut ed elevazione di Luna e Sole sono calcolati in locale dalla tua posizione. Zero server esterni, zero batteria sprecata." },
      { n: '02', title: 'Monitoraggio ADS-B ogni 3s', desc: 'Ogni traiettoria è proiettata in avanti di 10 minuti e confrontata con la posizione celeste. Due provider, failover automatico.' },
      { n: '03', title: 'Notifica → inquadra → scatta', desc: 'Arriva una push con countdown preciso. Anche a app chiusa, via cron server-side ogni 60 secondi. Nessun transito perso.' },
    ],
    featuresTitle: 'Funzionalità',
    listTitle: 'Lista transiti live',
    listDesc: 'Countdown verde per i transiti imminenti. Tutti gli altri aerei con separazione minima prevista nei prossimi 10 minuti.',
    notifTitle: 'Push anticipate',
    notifDesc: 'Notifiche fino a 5 min prima, anche a app chiusa. Il server controlla ogni 60 secondi.',
    radarTitle: 'Radar bussola',
    radarDesc: 'Tu al centro. Luna e Sole posizionati al loro azimut reale. Aerei come silhouette FR24 — verdi se in transito.',
    mapArTitle: 'Mappa & Vista AR',
    mapArDesc: 'Mappa geografica con aerei live fino a 450 km. AR: sovraimpressi nel cielo reale via fotocamera + bussola + giroscopio.',
    photoTitle: 'Finestra fotografica',
    photoDesc: 'Ricevi notifiche solo quando la luce è quella giusta. Soglia di elevazione lunare (transiti notturni) e solare (golden hour).',
    photoExamples: [
      { ok: true,  text: '🌙 Luna a 40° alle 23:00 — ottima luce, cielo scuro' },
      { ok: false, text: '🌙 Luna a 5° alle 20:30 — troppo bassa, oscurata dalla foschia' },
      { ok: true,  text: '☀️ Sole a 8° alle 07:15 — golden hour, luce radente' },
      { ok: false, text: '☀️ Sole a 35° alle 10:00 — luce piatta, foto poco suggestiva' },
    ],
    simulatorTitle: 'Simulatore FOV',
    simulatorDesc: 'Prima di uscire, scopri esattamente quanto grande sarà la Luna nel mirino e quanto spazio occuperà l\'aereo sul disco. Canvas animato con proporzioni reali.',
    simulatorCta: 'Prova il simulatore →',
    waitlistTitle: 'Accesso anticipato',
    waitlistDesc: "Lascia la tua email — ti avviseremo quando l'accesso sarà aperto.",
    waitlistPlaceholder: 'la-tua@email.com',
    waitlistCta: 'Iscriviti',
    waitlistLoading: 'Invio...',
    waitlistSuccess: "Iscritto! Ti avviseremo quando l'app sarà disponibile.",
    waitlistDuplicate: 'Sei già in lista. Ti avviseremo a breve.',
    waitlistError: "Errore nell'iscrizione. Riprova tra qualche istante.",
    footerSub: 'Gratuito · PWA installabile · iOS e Android',
    footerCta: 'Inizia ora',
  },
  en: {
    tagline: 'Astrophotography Transit Tracker',
    hero: 'Photograph the moment that never repeats',
    heroSub: 'An aircraft crosses the Moon\'s disk in under one second. AstroTransit predicts it minutes ahead — so you have time to frame and shoot.',
    cta: 'Open the app',
    ctaSub: 'See how it works ↓',
    howTitle: 'How it works',
    steps: [
      { n: '01', title: 'GPS on, once', desc: 'Moon and Sun azimuth/elevation are computed locally from your position. No external servers, no battery drain.' },
      { n: '02', title: 'ADS-B monitoring every 3s', desc: 'Every trajectory is projected 10 minutes ahead and matched against the celestial position. Two providers, automatic failover.' },
      { n: '03', title: 'Notification → frame → shoot', desc: 'A push arrives with a precise countdown. Even with the app closed, via server-side cron every 60 seconds. Never miss a transit.' },
    ],
    featuresTitle: 'Features',
    listTitle: 'Live transit list',
    listDesc: 'Green countdown for imminent transits. All other aircraft with minimum predicted separation over the next 10 minutes.',
    notifTitle: 'Early push alerts',
    notifDesc: 'Notifications up to 5 min ahead, even with the app closed. The server checks every 60 seconds.',
    radarTitle: 'Compass radar',
    radarDesc: 'You at the centre. Moon and Sun at their real sky azimuth. FR24-style aircraft silhouettes — green if transiting.',
    mapArTitle: 'Map & AR View',
    mapArDesc: 'Live geographic map up to 450 km. AR: overlaid on the real sky via camera + compass + gyroscope.',
    photoTitle: 'Photo window',
    photoDesc: 'Get notified only when the light is right. Set Moon elevation threshold (night transits) and Sun elevation threshold (golden hour).',
    photoExamples: [
      { ok: true,  text: '🌙 Moon at 40° at 11 PM — dark sky, perfect light' },
      { ok: false, text: '🌙 Moon at 5° at 8:30 PM — too low, obscured by haze' },
      { ok: true,  text: '☀️ Sun at 8° at 7:15 AM — golden hour, raking light' },
      { ok: false, text: '☀️ Sun at 35° at 10 AM — flat harsh light, less dramatic' },
    ],
    simulatorTitle: 'FOV Simulator',
    simulatorDesc: 'Before heading out, see exactly how large the Moon will fill your frame and how much space the aircraft will occupy on the disk. Animated canvas with true angular proportions.',
    simulatorCta: 'Try the simulator →',
    waitlistTitle: 'Early access',
    waitlistDesc: "Leave your email — we'll notify you when access opens.",
    waitlistPlaceholder: 'your@email.com',
    waitlistCta: 'Join waitlist',
    waitlistLoading: 'Sending...',
    waitlistSuccess: "You're on the list! We'll reach out when the app is available.",
    waitlistDuplicate: "You're already on the list. We'll be in touch soon.",
    waitlistError: 'Something went wrong. Please try again in a moment.',
    footerSub: 'Free · Installable PWA · iOS & Android',
    footerCta: 'Get started',
  },
}

// ─── Star canvas ─────────────────────────────────────────────────────────────

function StarCanvas() {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const draw = () => {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
      // radial gradient
      const grad = ctx.createRadialGradient(canvas.width / 2, canvas.height * 0.3, 0, canvas.width / 2, canvas.height * 0.3, canvas.width * 0.8)
      grad.addColorStop(0, '#0a0818')
      grad.addColorStop(1, '#030308')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      // subtle moon glow top-right
      const mg = ctx.createRadialGradient(canvas.width * 0.82, 90, 0, canvas.width * 0.82, 90, 260)
      mg.addColorStop(0, 'rgba(255,215,0,0.07)')
      mg.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = mg
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      // stars
      for (let i = 0; i < 130; i++) {
        const x = Math.random() * canvas.width
        const y = Math.random() * canvas.height
        const r = Math.random() < 0.12 ? 1.3 : 0.65
        ctx.beginPath()
        ctx.arc(x, y, r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,255,255,${0.15 + Math.random() * 0.55})`
        ctx.fill()
      }
    }
    draw()
    window.addEventListener('resize', draw)
    return () => window.removeEventListener('resize', draw)
  }, [])
  return <canvas ref={ref} style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }} />
}

// ─── iPhone mockup ────────────────────────────────────────────────────────────

function PhoneMockup({ countdown }: { countdown: string }) {
  return (
    <div style={{
      width: 220, height: 440, borderRadius: 36,
      background: '#080812',
      border: '1.5px solid rgba(255,255,255,0.13)',
      boxShadow: '0 0 80px rgba(232,200,72,0.1), 0 40px 100px rgba(0,0,0,0.7)',
      overflow: 'hidden', position: 'relative', flexShrink: 0,
    }}>
      <svg width="220" height="440" viewBox="0 0 220 440" style={{ display: 'block' }}>
        <rect width="220" height="440" fill="#07070f"/>
        {/* status bar */}
        <rect x="0" y="0" width="220" height="38" fill="rgba(0,0,0,0.5)"/>
        <text x="110" y="25" textAnchor="middle" fill="#8892a4" fontSize="11" fontFamily="-apple-system,sans-serif">22:47</text>
        {/* tab bar */}
        <rect x="20" y="46" width="180" height="30" rx="9" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.07)" strokeWidth="1"/>
        <text x="48"  y="65" fill="#e8c848" fontSize="9.5" fontFamily="-apple-system,sans-serif" fontWeight="700">Radar</text>
        <text x="88"  y="65" fill="#4a5060" fontSize="9.5" fontFamily="-apple-system,sans-serif">Lista</text>
        <text x="128" y="65" fill="#4a5060" fontSize="9.5" fontFamily="-apple-system,sans-serif">Mappa</text>
        <text x="169" y="65" fill="#4a5060" fontSize="9.5" fontFamily="-apple-system,sans-serif">AR</text>
        {/* radar rings */}
        <circle cx="110" cy="222" r="88" fill="none" stroke="rgba(232,200,72,0.10)" strokeWidth="1"/>
        <circle cx="110" cy="222" r="58" fill="none" stroke="rgba(232,200,72,0.16)" strokeWidth="1"/>
        <circle cx="110" cy="222" r="28" fill="none" stroke="rgba(232,200,72,0.25)" strokeWidth="1"/>
        {/* crosshair */}
        <line x1="22" y1="222" x2="198" y2="222" stroke="rgba(232,200,72,0.07)" strokeWidth="1"/>
        <line x1="110" y1="134" x2="110" y2="310" stroke="rgba(232,200,72,0.07)" strokeWidth="1"/>
        {/* compass labels */}
        <text x="110" y="128" textAnchor="middle" fill="rgba(232,200,72,0.3)" fontSize="8">N</text>
        <text x="110" y="316" textAnchor="middle" fill="rgba(232,200,72,0.3)" fontSize="8">S</text>
        <text x="19"  y="225" textAnchor="middle" fill="rgba(232,200,72,0.3)" fontSize="8">W</text>
        <text x="201" y="225" textAnchor="middle" fill="rgba(232,200,72,0.3)" fontSize="8">E</text>
        {/* observer dot */}
        <circle cx="110" cy="222" r="5" fill="white" opacity="0.9"/>
        {/* Moon */}
        <circle cx="150" cy="168" r="11" fill="rgba(255,215,0,0.12)"/>
        <circle cx="150" cy="168" r="7.5" fill="#ffd700" opacity="0.92"/>
        {/* transiting aircraft (green) */}
        <circle cx="146" cy="173" r="5.5" fill="#4ade80"/>
        <circle cx="146" cy="173" r="10" fill="none" stroke="#4ade80" strokeWidth="1" opacity="0.45"/>
        <line x1="146" y1="163" x2="150" y2="160" stroke="#4ade80" strokeWidth="1" strokeDasharray="2,2"/>
        {/* other aircraft */}
        <circle cx="72"  cy="268" r="3.5" fill="#3a4455" opacity="0.8"/>
        <circle cx="158" cy="270" r="3"   fill="#3a4455" opacity="0.6"/>
        <circle cx="85"  cy="185" r="2.5" fill="#3a4455" opacity="0.5"/>
        {/* alert card */}
        <rect x="14" y="336" width="192" height="54" rx="12" fill="rgba(74,222,128,0.07)" stroke="rgba(74,222,128,0.28)" strokeWidth="1"/>
        <text x="26" y="356" fill="#4ade80" fontSize="10" fontFamily="-apple-system,sans-serif" fontWeight="700">✈ AZA123 → 🌙 Luna</text>
        <text x="26" y="370" fill="#6a7a5a" fontSize="9" fontFamily="-apple-system,sans-serif">Scarto ±0.08° · guarda 142° SE 38°</text>
        <text x="170" y="367" fill="#e8eaf0" fontSize="16" fontFamily="'SF Mono',monospace" fontWeight="700" textAnchor="middle">{countdown}</text>
        {/* bottom nav */}
        <rect x="0" y="400" width="220" height="40" fill="rgba(0,0,0,0.65)"/>
        <text x="55"  y="426" fill="#e8c848" fontSize="17" textAnchor="middle">◎</text>
        <text x="110" y="426" fill="#3a4455" fontSize="15" textAnchor="middle">🔭</text>
        <text x="165" y="426" fill="#3a4455" fontSize="15" textAnchor="middle">⚙</text>
      </svg>
    </div>
  )
}

// ─── Shared divider ───────────────────────────────────────────────────────────

const Divider = () => (
  <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', maxWidth: 780, margin: '0 auto' }} />
)

// ─── Section wrapper ─────────────────────────────────────────────────────────

const S = ({ children, id, style }: { children: React.ReactNode; id?: string; style?: React.CSSProperties }) => (
  <section id={id} style={{ position: 'relative', zIndex: 1, padding: '52px 24px', maxWidth: 780, margin: '0 auto', ...style }}>
    {children}
  </section>
)

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <div style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: '#6a7285', marginBottom: 28 }}>
    {children}
  </div>
)

// ─── Demo card ────────────────────────────────────────────────────────────────

function DemoCard({
  icon, title, children, accent = 'rgba(255,255,255,0.06)', style,
}: {
  icon: string; title: string; children: React.ReactNode; accent?: string; style?: React.CSSProperties
}) {
  return (
    <div style={{
      borderRadius: 20, overflow: 'hidden',
      background: 'rgba(255,255,255,0.025)',
      border: '1px solid rgba(255,255,255,0.07)',
      transition: 'border-color .2s, transform .2s',
      ...style,
    }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = accent; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.07)'; (e.currentTarget as HTMLDivElement).style.transform = 'none' }}
    >
      <div style={{ padding: '16px 18px 10px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#d8dce8' }}>{title}</span>
      </div>
      <div style={{ padding: '14px 18px 18px' }}>{children}</div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const [locale, setLocale] = useState<'it' | 'en'>('it')
  const t = copy[locale]

  // live countdown for mockup + demo card
  const [secs, setSecs] = useState(102)
  useEffect(() => {
    const id = setInterval(() => setSecs(s => s > 0 ? s - 1 : 120), 1000)
    return () => clearInterval(id)
  }, [])
  const countdown = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`

  const [waitlistEmail, setWaitlistEmail] = useState('')
  const [waitlistState, setWaitlistState] = useState<'idle' | 'loading' | 'success' | 'duplicate' | 'error'>('idle')

  async function handleWaitlist(e: React.FormEvent) {
    e.preventDefault()
    setWaitlistState('loading')
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: waitlistEmail }),
      })
      if (res.status === 201) { setWaitlistState('success'); setWaitlistEmail('') }
      else if (res.status === 200) setWaitlistState('duplicate')
      else setWaitlistState('error')
    } catch { setWaitlistState('error') }
  }

  return (
    <div style={{ background: '#030308', color: '#e8eaf0', minHeight: '100dvh', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>
      <StarCanvas />

      {/* ── NAV ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '14px 24px',
        background: 'rgba(3,3,8,0.82)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Image src="/astrotransit-logo.png" alt="AstroTransit" width={28} height={28} />
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase' }}>AstroTransit</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', gap: 2 }}>
            {(['it', 'en'] as const).map(l => (
              <button key={l} onClick={() => setLocale(l)} style={{
                fontSize: 10, padding: '3px 9px', borderRadius: 6, border: 'none', cursor: 'pointer',
                background: locale === l ? 'rgba(232,200,72,0.15)' : 'transparent',
                color: locale === l ? '#e8c848' : '#6a7285',
                letterSpacing: '0.06em',
              }}>{l.toUpperCase()}</button>
            ))}
          </div>
          <Link href={`/${locale}/monitor`} style={{
            padding: '7px 18px', borderRadius: 999, background: '#e8c848',
            color: '#060e1a', fontSize: 12, fontWeight: 700, textDecoration: 'none', letterSpacing: '0.04em',
          }}>{t.cta}</Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <S style={{ paddingTop: 120, paddingBottom: 56 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 40, alignItems: 'center' }}>
          <div>
            <div style={{ marginBottom: 18 }}>
              <span style={{
                display: 'inline-block', padding: '4px 14px', borderRadius: 999,
                background: 'rgba(232,200,72,0.1)', border: '1px solid rgba(232,200,72,0.28)',
                color: '#e8c848', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase',
              }}>✈ {t.tagline}</span>
            </div>
            <h1 style={{ fontSize: 'clamp(28px,6vw,50px)', fontWeight: 900, lineHeight: 1.1, marginBottom: 18 }}>
              {locale === 'it'
                ? <>Fotografa il <em style={{ fontStyle: 'normal', color: '#e8c848' }}>momento</em><br />che non si ripete</>
                : <>Photograph the <em style={{ fontStyle: 'normal', color: '#e8c848' }}>moment</em><br />that never repeats</>
              }
            </h1>
            <p style={{ fontSize: 15, color: '#7a8294', lineHeight: 1.75, marginBottom: 32, maxWidth: 460 }}>{t.heroSub}</p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link href={`/${locale}/monitor`} style={{
                display: 'inline-block', padding: '13px 30px', borderRadius: 999,
                background: '#e8c848', color: '#060e1a', fontWeight: 700, fontSize: 14,
                textDecoration: 'none', letterSpacing: '0.03em',
              }}>{t.cta}</Link>
              <a href="#how" style={{
                display: 'inline-block', padding: '12px 26px', borderRadius: 999,
                border: '1px solid rgba(232,200,72,0.35)', color: '#e8c848', fontSize: 14, textDecoration: 'none',
              }}>{t.ctaSub}</a>
            </div>
          </div>
          {/* iPhone mockup — hidden on narrow screens via inline media query workaround */}
          <div style={{ display: 'flex', justifyContent: 'center' }} className="hero-phone">
            <PhoneMockup countdown={countdown} />
          </div>
        </div>
      </S>

      <Divider />

      {/* ── STAT CHIPS ── */}
      <S style={{ paddingTop: 32, paddingBottom: 32 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {[
            { val: '2 provider', lbl: 'DATI ADS-B' },
            { val: '<1 sec',     lbl: 'DURATA TRANSITO' },
            { val: '3 min',      lbl: 'ANTICIPO NOTIFICA' },
            { val: 'gratuito',   lbl: 'NESSUN ACCOUNT' },
          ].map(c => (
            <div key={c.lbl} style={{
              padding: '10px 18px', borderRadius: 14,
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
            }}>
              <span style={{ display: 'block', fontSize: 20, fontWeight: 800, color: '#e8c848' }}>{c.val}</span>
              <span style={{ fontSize: 9, letterSpacing: '0.08em', color: '#4a5060' }}>{c.lbl}</span>
            </div>
          ))}
        </div>
      </S>

      <Divider />

      {/* ── HOW IT WORKS ── */}
      <S id="how">
        <SectionLabel>{t.howTitle}</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
          {t.steps.map(step => (
            <div key={step.n} style={{
              padding: '22px 20px', borderRadius: 18,
              background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)',
            }}>
              <div style={{ fontSize: 36, fontWeight: 900, color: 'rgba(232,200,72,0.18)', lineHeight: 1, marginBottom: 12 }}>{step.n}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#d8dce8', marginBottom: 8 }}>{step.title}</div>
              <div style={{ fontSize: 12, color: '#6a7285', lineHeight: 1.65 }}>{step.desc}</div>
            </div>
          ))}
        </div>
      </S>

      <Divider />

      {/* ── FEATURE DEMO CARDS ── */}
      <S>
        <SectionLabel>{t.featuresTitle}</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>

          {/* Lista transiti — tall card, spans 1 col */}
          <DemoCard icon="☰" title={t.listTitle} accent="rgba(74,222,128,0.4)" style={{ gridRow: 'span 2' }}>
            <p style={{ fontSize: 12, color: '#6a7285', lineHeight: 1.6, marginBottom: 14 }}>{t.listDesc}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[{ cs: '✈ AZA123 → 🌙', cd: countdown }, { cs: '✈ RYR881 → ☀️', cd: '3:15' }].map(r => (
                <div key={r.cs} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '8px 12px', borderRadius: 10,
                  background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.2)',
                }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#4ade80' }}>{r.cs}</span>
                  <span style={{ fontSize: 14, fontWeight: 800, fontFamily: 'monospace', color: '#e8eaf0' }}>{r.cd}</span>
                </div>
              ))}
              <div style={{ fontSize: 10, color: '#3a4050', padding: '6px 2px' }}>
                {locale === 'it' ? 'Aerei vicini (nessun transito)' : 'Nearby aircraft (no transit)'}
              </div>
              {['✈ EJU456 · min 1.8°', '✈ VLG220 · min 3.2°', '✈ IBE034 · min 5.7°'].map(r => (
                <div key={r} style={{
                  display: 'flex', justifyContent: 'space-between', padding: '6px 12px', borderRadius: 9,
                  background: 'rgba(255,255,255,0.018)', border: '1px solid rgba(255,255,255,0.05)', opacity: 0.65,
                }}>
                  <span style={{ fontSize: 11, color: '#5a6275' }}>{r}</span>
                </div>
              ))}
            </div>
          </DemoCard>

          {/* Notifica push */}
          <DemoCard icon="🔔" title={t.notifTitle} accent="rgba(232,200,72,0.4)">
            <p style={{ fontSize: 12, color: '#6a7285', lineHeight: 1.6, marginBottom: 14 }}>{t.notifDesc}</p>
            <div style={{
              padding: '12px 14px', borderRadius: 14,
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              display: 'flex', gap: 12, alignItems: 'flex-start',
            }}>
              <span style={{ fontSize: 22, flexShrink: 0 }}>🌙</span>
              <div>
                <div style={{ fontSize: 10, color: '#5a6275', letterSpacing: '0.06em', marginBottom: 2 }}>ASTROTRANSIT</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#e8eaf0' }}>
                  {locale === 'it' ? 'Transito tra 2 minuti' : 'Transit in 2 minutes'}
                </div>
                <div style={{ fontSize: 11, color: '#8892a4', marginTop: 3, lineHeight: 1.4 }}>
                  AZA123 → Luna · ±0.08° · 142° SE 38°
                </div>
              </div>
            </div>
          </DemoCard>

          {/* Radar */}
          <DemoCard icon="📡" title={t.radarTitle} accent="rgba(232,200,72,0.35)">
            <p style={{ fontSize: 12, color: '#6a7285', lineHeight: 1.6, marginBottom: 12 }}>{t.radarDesc}</p>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <svg width="120" height="120" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="56" fill="none" stroke="rgba(232,200,72,0.1)"  strokeWidth="1"/>
                <circle cx="60" cy="60" r="36" fill="none" stroke="rgba(232,200,72,0.16)" strokeWidth="1"/>
                <circle cx="60" cy="60" r="18" fill="none" stroke="rgba(232,200,72,0.24)" strokeWidth="1"/>
                <line x1="4"  y1="60" x2="116" y2="60" stroke="rgba(232,200,72,0.07)" strokeWidth="1"/>
                <line x1="60" y1="4"  x2="60"  y2="116" stroke="rgba(232,200,72,0.07)" strokeWidth="1"/>
                <circle cx="60" cy="60" r="4" fill="white" opacity="0.9"/>
                <circle cx="84" cy="28" r="8" fill="rgba(255,215,0,0.15)"/>
                <circle cx="84" cy="28" r="5.5" fill="#ffd700" opacity="0.9"/>
                <circle cx="80" cy="32" r="4" fill="#4ade80"/>
                <circle cx="80" cy="32" r="8" fill="none" stroke="#4ade80" strokeWidth="1" opacity="0.45"/>
                <circle cx="32" cy="80" r="3" fill="#3a4455" opacity="0.7"/>
                <circle cx="96" cy="78" r="2.5" fill="#3a4455" opacity="0.55"/>
              </svg>
            </div>
          </DemoCard>

          {/* Mappa & AR */}
          <DemoCard icon="🗺️" title={t.mapArTitle} accent="rgba(100,120,255,0.4)" style={{ gridColumn: 'span 2' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}>
              <p style={{ fontSize: 12, color: '#6a7285', lineHeight: 1.65 }}>{t.mapArDesc}</p>
              <div style={{ display: 'flex', gap: 8 }}>
                {/* Mini map preview */}
                <svg width="90" height="70" viewBox="0 0 90 70" style={{ borderRadius: 8, overflow: 'hidden' }}>
                  <rect width="90" height="70" fill="#0a1020"/>
                  <rect x="0" y="28" width="90" height="2" fill="rgba(100,130,200,0.2)"/>
                  <rect x="44" y="0"  width="2"  height="70" fill="rgba(100,130,200,0.2)"/>
                  <circle cx="45" cy="35" r="28" fill="none" stroke="rgba(232,200,72,0.2)" strokeDasharray="4,3" strokeWidth="1"/>
                  <circle cx="45" cy="35" r="3" fill="white" opacity="0.9"/>
                  <circle cx="62" cy="22" r="3.5" fill="#e8c848" opacity="0.85"/>
                  <circle cx="30" cy="48" r="3"   fill="#e8c848" opacity="0.7"/>
                  <circle cx="70" cy="50" r="2.5" fill="#4ade80"/>
                </svg>
                {/* Mini AR preview */}
                <svg width="90" height="70" viewBox="0 0 90 70" style={{ borderRadius: 8, overflow: 'hidden' }}>
                  <rect width="90" height="70" fill="#060a0e"/>
                  <line x1="0" y1="35" x2="90" y2="35" stroke="rgba(255,255,255,0.06)" strokeWidth="1"/>
                  <line x1="45" y1="0"  x2="45" y2="70"  stroke="rgba(255,255,255,0.06)" strokeWidth="1"/>
                  <circle cx="45" cy="32" r="10" fill="rgba(255,215,0,0.2)" stroke="rgba(255,215,0,0.6)" strokeWidth="1"/>
                  <circle cx="28" cy="38" r="4" fill="#4ade80" opacity="0.8"/>
                  <line x1="28" y1="34" x2="43" y2="30" stroke="#4ade80" strokeWidth="1" strokeDasharray="2,2" opacity="0.6"/>
                </svg>
              </div>
            </div>
          </DemoCard>

          {/* Finestra fotografica */}
          <DemoCard icon="🌅" title={t.photoTitle} accent="rgba(232,200,72,0.3)" style={{ gridColumn: 'span 2' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}>
              <p style={{ fontSize: 12, color: '#6a7285', lineHeight: 1.65 }}>{t.photoDesc}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {t.photoExamples.map((ex, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 11, color: ex.ok ? '#4ade80' : '#4a5468', lineHeight: 1.45 }}>
                    <span style={{ flexShrink: 0, marginTop: 1 }}>{ex.ok ? '✓' : '✗'}</span>
                    <span>{ex.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </DemoCard>

          {/* Simulatore FOV */}
          <DemoCard icon="🔭" title={t.simulatorTitle} accent="rgba(160,144,224,0.4)" style={{ gridColumn: 'span 2' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}>
              <div>
                <p style={{ fontSize: 12, color: '#6a7285', lineHeight: 1.65, marginBottom: 14 }}>{t.simulatorDesc}</p>
                <Link href={`/${locale}/simulator`} style={{
                  display: 'inline-block', padding: '9px 20px', borderRadius: 999,
                  border: '1px solid rgba(160,144,224,0.4)', color: '#a090e0',
                  fontSize: 12, fontWeight: 600, textDecoration: 'none', letterSpacing: '0.03em',
                }}>{t.simulatorCta}</Link>
              </div>
              <div>
                {/* mini FOV canvas preview */}
                <svg width="100%" height="90" viewBox="0 0 200 90" style={{ borderRadius: 10 }}>
                  <rect width="200" height="90" fill="#07070f" rx="8"/>
                  <line x1="66" y1="0" x2="66" y2="90" stroke="rgba(255,255,255,0.04)" strokeWidth=".5"/>
                  <line x1="133" y1="0" x2="133" y2="90" stroke="rgba(255,255,255,0.04)" strokeWidth=".5"/>
                  <line x1="0" y1="30" x2="200" y2="30" stroke="rgba(255,255,255,0.04)" strokeWidth=".5"/>
                  <line x1="0" y1="60" x2="200" y2="60" stroke="rgba(255,255,255,0.04)" strokeWidth=".5"/>
                  <circle cx="100" cy="45" r="24" fill="rgba(255,220,130,0.1)" stroke="rgba(255,220,150,0.7)" strokeWidth="1.5"/>
                  <line x1="18" y1="46" x2="182" y2="44" stroke="rgba(120,224,160,0.35)" strokeWidth=".8" strokeDasharray="4,3"/>
                  <ellipse cx="68" cy="45" rx="12" ry="3" fill="#78e0a0" opacity=".8"/>
                  <line x1="68" y1="45" x2="68" y2="38" stroke="#78e0a0" strokeWidth="1.5"/>
                  <line x1="60" y1="45" x2="76" y2="45" stroke="#78e0a0" strokeWidth="2.5"/>
                  <text x="6"   y="84" fill="rgba(200,184,112,0.45)" fontSize="7" fontFamily="monospace">600mm · FF</text>
                  <text x="194" y="84" fill="rgba(200,184,112,0.45)" fontSize="7" fontFamily="monospace" textAnchor="end">FOV 3.4°</text>
                </svg>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 10 }}>
                  {[
                    { label: locale === 'it' ? 'Campo visivo' : 'Field of view', val: '3.4° · Super-tele', color: '#c8b870' },
                    { label: locale === 'it' ? 'Luna nel frame' : 'Moon in frame',  val: '226px · 32%',   color: '#c8b870' },
                    { label: locale === 'it' ? 'Aereo vs luna' : 'Aircraft vs moon', val: '28% ✓',        color: '#4ade80' },
                  ].map(row => (
                    <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                      <span style={{ color: '#5a6275' }}>{row.label}</span>
                      <span style={{ color: row.color, fontWeight: 600 }}>{row.val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </DemoCard>

        </div>
      </S>

      <Divider />

      {/* ── WAITLIST ── */}
      <S>
        <SectionLabel>{t.waitlistTitle}</SectionLabel>
        <p style={{ fontSize: 14, color: '#6a7285', lineHeight: 1.7, marginBottom: 24, maxWidth: 480 }}>{t.waitlistDesc}</p>
        <form onSubmit={handleWaitlist} action="/api/waitlist" method="POST" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input
            type="email" required value={waitlistEmail}
            onChange={e => setWaitlistEmail(e.target.value)}
            placeholder={t.waitlistPlaceholder}
            disabled={waitlistState === 'loading' || waitlistState === 'success' || waitlistState === 'duplicate'}
            style={{
              flex: '1 1 220px', padding: '12px 18px', borderRadius: 999,
              border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)',
              color: '#e8eaf0', fontSize: 14, outline: 'none',
            }}
          />
          <button
            type="submit"
            disabled={waitlistState === 'loading' || waitlistState === 'success' || waitlistState === 'duplicate'}
            style={{
              padding: '12px 26px', borderRadius: 999, border: 'none',
              background: waitlistState === 'success' || waitlistState === 'duplicate' ? 'rgba(232,200,72,0.2)' : '#e8c848',
              color: waitlistState === 'success' || waitlistState === 'duplicate' ? '#e8c848' : '#060e1a',
              fontWeight: 700, fontSize: 14,
              cursor: waitlistState === 'loading' || waitlistState === 'success' || waitlistState === 'duplicate' ? 'default' : 'pointer',
            }}
          >{waitlistState === 'loading' ? t.waitlistLoading : t.waitlistCta}</button>
        </form>
        {waitlistState === 'success'   && <p style={{ marginTop: 12, fontSize: 13, color: '#6fcf97' }}>{t.waitlistSuccess}</p>}
        {waitlistState === 'duplicate' && <p style={{ marginTop: 12, fontSize: 13, color: '#e8c848' }}>{t.waitlistDuplicate}</p>}
        {waitlistState === 'error'     && <p style={{ marginTop: 12, fontSize: 13, color: '#eb5757' }}>{t.waitlistError}</p>}
      </S>

      <Divider />

      {/* ── FOOTER CTA ── */}
      <S style={{ textAlign: 'center', paddingBottom: 72 }}>
        <h2 style={{ fontSize: 'clamp(22px,5vw,36px)', fontWeight: 900, marginBottom: 12 }}>
          {locale === 'it'
            ? <>Pronto a non perdere <em style={{ fontStyle: 'normal', color: '#e8c848' }}>nessun</em> transito?</>
            : <>Ready to never miss <em style={{ fontStyle: 'normal', color: '#e8c848' }}>any</em> transit?</>
          }
        </h2>
        <p style={{ fontSize: 13, color: '#5a6275', marginBottom: 28 }}>{t.footerSub}</p>
        <Link href={`/${locale}/monitor`} style={{
          display: 'inline-block', padding: '15px 40px', borderRadius: 999,
          background: '#e8c848', color: '#060e1a', fontWeight: 700, fontSize: 15,
          textDecoration: 'none', letterSpacing: '0.04em',
        }}>{t.footerCta}</Link>
      </S>

      {/* hide phone mockup on narrow screens */}
      <style>{`.hero-phone { display: flex } @media (max-width: 600px) { .hero-phone { display: none } }`}</style>
    </div>
  )
}
