'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'

const copy = {
  it: {
    tagline: 'Astrophotography Transit Tracker',
    hero: 'Fotografa il momento perfetto',
    heroSub: 'Rileva in tempo reale gli aerei in transito davanti alla Luna e al Sole. Notifiche push, filtro luce, vista AR. Per i fotografi del cielo.',
    cta: "Apri l'app",
    ctaSub: 'Scopri di più ↓',
    howTitle: 'Come funziona',
    steps: [
      { title: 'Abilita il GPS', desc: "L'app calcola le posizioni di Luna e Sole dalla tua posizione esatta." },
      { title: 'Monitora in tempo reale', desc: 'Gli aerei ADS-B vengono confrontati con le traiettorie celesti ogni 3 secondi.' },
      { title: 'Scatta la foto perfetta', desc: 'Ricevi la notifica in anticipo e prepara la camera. Nessun transito perso.' },
    ],
    featuresTitle: 'Funzionalità',
    features: [
      { icon: '📡', title: 'Radar & Lista live', desc: 'Tutti gli aerei nel raggio, aggiornati ogni 3 secondi con dati ADS-B.' },
      { icon: '🔔', title: 'Notifiche anticipate', desc: 'Push anche con app chiusa, configurabile da 3 a 5 minuti prima del transito.' },
      { icon: '🗺️', title: 'Mappa & Vista AR', desc: 'Mappa geografica live e aerei sovraimpressi nel cielo reale via fotocamera.' },
      { icon: '🌅', title: 'Finestra fotografica', desc: 'Filtra i transiti per luce ideale: imposta soglia di elevazione lunare e solare.' },
    ],
    photoTitle: '🌅 Finestra fotografica',
    photoDesc: 'Ricevi notifiche solo quando la luce è quella giusta. Imposta la soglia di elevazione della Luna (per transiti notturni) e del Sole (per golden hour e alba/tramonto). Nessun avviso inutile.',
    waitlistTitle: 'Accesso anticipato',
    waitlistDesc: `Lascia la tua email — ti avviseremo quando l'accesso sarà aperto.`,
    waitlistPlaceholder: 'la-tua@email.com',
    waitlistCta: 'Iscriviti',
    waitlistLoading: 'Invio...',
    waitlistSuccess: `Iscritto! Ti avviseremo quando l'app sarà disponibile.`,
    waitlistDuplicate: `Sei già in lista. Ti avviseremo a breve.`,
    waitlistError: `Errore nell'iscrizione. Riprova tra qualche istante.`,
    footerSub: 'Gratuito · Nessun account richiesto',
    footerCta: 'Inizia ora',
  },
  en: {
    tagline: 'Astrophotography Transit Tracker',
    hero: 'Photograph the perfect moment',
    heroSub: 'Detect aircraft transiting the Moon and Sun in real time. Push notifications, light filter, AR view. For sky photographers.',
    cta: 'Open the app',
    ctaSub: 'Learn more ↓',
    howTitle: 'How it works',
    steps: [
      { title: 'Enable GPS', desc: 'The app calculates Moon and Sun positions from your exact location.' },
      { title: 'Monitor in real time', desc: 'ADS-B aircraft are matched against celestial trajectories every 3 seconds.' },
      { title: 'Take the perfect shot', desc: 'Receive the notification early and get your camera ready. Never miss a transit.' },
    ],
    featuresTitle: 'Features',
    features: [
      { icon: '📡', title: 'Live Radar & List', desc: 'All aircraft in range, updated every 3 seconds with live ADS-B data.' },
      { icon: '🔔', title: 'Early notifications', desc: 'Push alerts even with the app closed, configurable 3–5 minutes before transit.' },
      { icon: '🗺️', title: 'Map & AR View', desc: 'Live geographic map and aircraft overlaid on the real sky via camera.' },
      { icon: '🌅', title: 'Photo window', desc: 'Filter transits by ideal light: set lunar and solar elevation thresholds.' },
    ],
    photoTitle: '🌅 Photo window',
    photoDesc: 'Get notified only when the light is right. Set the Moon elevation threshold (for night transits) and Sun elevation (for golden hour and sunrise/sunset). No useless alerts.',
    waitlistTitle: 'Early access',
    waitlistDesc: 'Leave your email — we\'ll notify you when access opens.',
    waitlistPlaceholder: 'your@email.com',
    waitlistCta: 'Join waitlist',
    waitlistLoading: 'Sending...',
    waitlistSuccess: 'You\'re on the list! We\'ll reach out when the app is available.',
    waitlistDuplicate: 'You\'re already on the list. We\'ll be in touch soon.',
    waitlistError: 'Something went wrong. Please try again in a moment.',
    footerSub: 'Free · No account required',
    footerCta: 'Get started',
  },
}

function StarCanvas() {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    for (let i = 0; i < 90; i++) {
      const x = Math.random() * canvas.width
      const y = Math.random() * canvas.height
      const r = Math.random() < 0.12 ? 1.2 : 0.6
      const alpha = 0.2 + Math.random() * 0.5
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(255,255,255,${alpha})`
      ctx.fill()
    }
  }, [])
  return <canvas ref={ref} style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }} />
}

export default function LandingPage() {
  const [locale, setLocale] = useState<'it' | 'en'>('it')
  const t = copy[locale]

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
      if (res.status === 201) {
        setWaitlistState('success')
        setWaitlistEmail('')
      } else if (res.status === 200) {
        setWaitlistState('duplicate')
      } else {
        setWaitlistState('error')
      }
    } catch {
      setWaitlistState('error')
    }
  }

  return (
    <div style={{ background: '#060e1a', color: '#e8eaf0', minHeight: '100dvh', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>
      <StarCanvas />

      {/* NAV */}
      <nav style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Image src="/astrotransit-logo.png" alt="AstroTransit" width={32} height={32} />
          <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase' }}>AstroTransit</span>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['it', 'en'] as const).map(l => (
            <button key={l} onClick={() => setLocale(l)} style={{ fontSize: 10, padding: '3px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', background: locale === l ? 'rgba(232,200,72,0.15)' : 'transparent', color: locale === l ? '#e8c848' : '#8892a4', letterSpacing: '0.06em' }}>
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </nav>

      {/* HERO */}
      <section style={{ position: 'relative', zIndex: 1, padding: '56px 24px 48px', maxWidth: 640, margin: '0 auto' }}>
        <div style={{ marginBottom: 20 }}>
          <span style={{ display: 'inline-block', padding: '3px 12px', borderRadius: 999, background: 'rgba(232,200,72,0.1)', border: '1px solid rgba(232,200,72,0.25)', color: '#e8c848', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            ✈ {t.tagline}
          </span>
        </div>
        <h1 style={{ fontSize: 'clamp(28px, 8vw, 48px)', fontWeight: 800, lineHeight: 1.15, marginBottom: 16 }}>
          {t.hero.split(' ').map((word, i) => {
            const gold = ['perfetto', 'perfect', 'momento', 'moment'].includes(word.replace(/[^a-z]/gi, '').toLowerCase())
            return <span key={i} style={{ color: gold ? '#e8c848' : 'inherit' }}>{word}{' '}</span>
          })}
        </h1>
        <p style={{ fontSize: 15, color: '#8892a4', lineHeight: 1.7, marginBottom: 32, maxWidth: 480 }}>{t.heroSub}</p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link href={`/${locale}/monitor`} style={{ display: 'inline-block', padding: '13px 28px', borderRadius: 999, background: '#e8c848', color: '#060e1a', fontWeight: 700, fontSize: 14, textDecoration: 'none', letterSpacing: '0.03em' }}>
            {t.cta}
          </Link>
          <a href="#how" style={{ display: 'inline-block', padding: '12px 28px', borderRadius: 999, border: '1px solid rgba(232,200,72,0.4)', color: '#e8c848', fontSize: 14, textDecoration: 'none' }}>
            {t.ctaSub}
          </a>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" style={{ position: 'relative', zIndex: 1, padding: '40px 24px', borderTop: '1px solid rgba(255,255,255,0.05)', maxWidth: 640, margin: '0 auto' }}>
        <div style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#8892a4', marginBottom: 24 }}>{t.howTitle}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {t.steps.map((step, i) => (
            <div key={i} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(232,200,72,0.12)', border: '1px solid rgba(232,200,72,0.3)', color: '#e8c848', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                {i + 1}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#e8eaf0', marginBottom: 4 }}>{step.title}</div>
                <div style={{ fontSize: 13, color: '#8892a4', lineHeight: 1.5 }}>{step.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ position: 'relative', zIndex: 1, padding: '40px 24px', borderTop: '1px solid rgba(255,255,255,0.05)', maxWidth: 640, margin: '0 auto' }}>
        <div style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#8892a4', marginBottom: 20 }}>{t.featuresTitle}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {t.features.map((f, i) => (
            <div key={i} style={{ display: 'flex', gap: 14, padding: '14px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12 }}>
              <span style={{ fontSize: 22, flexShrink: 0 }}>{f.icon}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#e8eaf0', marginBottom: 4 }}>{f.title}</div>
                <div style={{ fontSize: 12, color: '#8892a4', lineHeight: 1.5 }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PHOTO WINDOW */}
      <section style={{ position: 'relative', zIndex: 1, padding: '32px 24px', borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(232,200,72,0.03)', maxWidth: 640, margin: '0 auto' }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#e8c848', marginBottom: 10 }}>{t.photoTitle}</div>
        <p style={{ fontSize: 13, color: '#8892a4', lineHeight: 1.7 }}>{t.photoDesc}</p>
      </section>

      {/* WAITLIST */}
      <section style={{ position: 'relative', zIndex: 1, padding: '40px 24px', borderTop: '1px solid rgba(255,255,255,0.05)', maxWidth: 640, margin: '0 auto' }}>
        <div style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#8892a4', marginBottom: 10 }}>{t.waitlistTitle}</div>
        <p style={{ fontSize: 13, color: '#8892a4', lineHeight: 1.6, marginBottom: 20 }}>{t.waitlistDesc}</p>
        <form
          onSubmit={handleWaitlist}
          action="/api/waitlist"
          method="POST"
          style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}
        >
          <input
            type="email"
            required
            value={waitlistEmail}
            onChange={e => setWaitlistEmail(e.target.value)}
            placeholder={t.waitlistPlaceholder}
            disabled={waitlistState === 'loading' || waitlistState === 'success' || waitlistState === 'duplicate'}
            style={{
              flex: '1 1 220px',
              padding: '11px 16px',
              borderRadius: 999,
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(255,255,255,0.05)',
              color: '#e8eaf0',
              fontSize: 14,
              outline: 'none',
            }}
          />
          <button
            type="submit"
            disabled={waitlistState === 'loading' || waitlistState === 'success' || waitlistState === 'duplicate'}
            style={{
              padding: '11px 24px',
              borderRadius: 999,
              border: 'none',
              background: waitlistState === 'success' || waitlistState === 'duplicate' ? 'rgba(232,200,72,0.25)' : '#e8c848',
              color: waitlistState === 'success' || waitlistState === 'duplicate' ? '#e8c848' : '#060e1a',
              fontWeight: 700,
              fontSize: 14,
              cursor: waitlistState === 'loading' || waitlistState === 'success' || waitlistState === 'duplicate' ? 'default' : 'pointer',
              letterSpacing: '0.03em',
            }}
          >
            {waitlistState === 'loading' ? t.waitlistLoading : t.waitlistCta}
          </button>
        </form>
        {waitlistState === 'success' && (
          <p style={{ marginTop: 12, fontSize: 13, color: '#6fcf97' }}>{t.waitlistSuccess}</p>
        )}
        {waitlistState === 'duplicate' && (
          <p style={{ marginTop: 12, fontSize: 13, color: '#e8c848' }}>{t.waitlistDuplicate}</p>
        )}
        {waitlistState === 'error' && (
          <p style={{ marginTop: 12, fontSize: 13, color: '#eb5757' }}>{t.waitlistError}</p>
        )}
      </section>

      {/* FOOTER CTA */}
      <section style={{ position: 'relative', zIndex: 1, padding: '48px 24px 56px', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center', maxWidth: 640, margin: '0 auto' }}>
        <p style={{ fontSize: 12, color: '#8892a4', marginBottom: 20 }}>{t.footerSub}</p>
        <Link href={`/${locale}/monitor`} style={{ display: 'inline-block', padding: '14px 36px', borderRadius: 999, background: '#e8c848', color: '#060e1a', fontWeight: 700, fontSize: 15, textDecoration: 'none', letterSpacing: '0.03em' }}>
          {t.footerCta}
        </Link>
      </section>
    </div>
  )
}
