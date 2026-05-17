'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'

export default function LoginPage() {
  const t = useTranslations('login')
  const tApp = useTranslations('app')
  const params = useParams()
  const locale = params.locale as string
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOtp({ email })
    if (error) {
      setError(t('error'))
    } else {
      setStep('code')
    }
    setLoading(false)
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code.trim(),
      type: 'email',
    })
    if (error) {
      setError(t('errorCode'))
    } else {
      router.push(`/${locale}/monitor`)
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo centrato */}
        <div className="flex flex-col items-center gap-2 mb-8">
          <Image src="/astrotransit-logo.png" alt="AstroTransit" width={64} height={64} />
          <span style={{ fontSize: 14, letterSpacing: '0.22em', fontWeight: 600, color: '#e8eaf0', textTransform: 'uppercase' }}>
            {tApp('name')}
          </span>
          <span style={{ fontSize: 11, color: '#8892a4' }}>{tApp('tagline')}</span>
        </div>

        <div
          className="rounded-2xl p-8"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          {step === 'email' ? (
            <form onSubmit={handleSendCode} className="space-y-4">
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={t('emailPlaceholder')}
                className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#e8eaf0',
                }}
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl py-3 text-sm font-semibold transition-colors disabled:opacity-50"
                style={{
                  background: 'rgba(232,200,72,0.15)',
                  border: '1px solid rgba(232,200,72,0.4)',
                  color: '#e8c848',
                }}
              >
                {loading ? '...' : t('submit')}
              </button>
              {error && (
                <p className="text-center text-xs" style={{ color: '#f87171' }}>{error}</p>
              )}
            </form>
          ) : (
            <form onSubmit={handleVerify} className="space-y-4">
              <p className="text-center text-xs mb-2" style={{ color: '#4ade80' }}>
                {t('sent')} <strong style={{ color: '#e8eaf0' }}>{email}</strong>
              </p>
              <input
                type="text"
                inputMode="numeric"
                required
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
                placeholder="00000000"
                className="w-full rounded-xl px-4 py-3 text-center text-2xl tracking-[0.4em] font-semibold focus:outline-none"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#e8eaf0',
                }}
              />
              <button
                type="submit"
                disabled={loading || code.length < 8}
                className="w-full rounded-xl py-3 text-sm font-semibold transition-colors disabled:opacity-50"
                style={{
                  background: 'rgba(232,200,72,0.15)',
                  border: '1px solid rgba(232,200,72,0.4)',
                  color: '#e8c848',
                }}
              >
                {loading ? '...' : t('verify')}
              </button>
              {error && (
                <p className="text-center text-xs" style={{ color: '#f87171' }}>{error}</p>
              )}
              <button
                type="button"
                onClick={() => { setStep('email'); setCode(''); setError('') }}
                className="w-full text-center text-xs"
                style={{ color: '#8892a4' }}
              >
                {t('changeEmail')}
              </button>
            </form>
          )}

          <p className="mt-6 text-center text-xs" style={{ color: '#8892a4' }}>{t('hint')}</p>

          <div className="mt-4 flex justify-center gap-2">
            {['it', 'en'].map(l => (
              <a
                key={l}
                href={`/${l}/login`}
                className="px-3 py-1 rounded-full text-xs font-medium transition-colors"
                style={l === locale
                  ? { background: 'rgba(232,200,72,0.15)', border: '1px solid #e8c848', color: '#e8c848' }
                  : { color: '#8892a4' }
                }
              >
                {l.toUpperCase()}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
