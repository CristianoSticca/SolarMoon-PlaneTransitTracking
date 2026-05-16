'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { useParams } from 'next/navigation'

export default function LoginPage() {
  const t = useTranslations('login')
  const tApp = useTranslations('app')
  const params = useParams()
  const locale = params.locale as string
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle')
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/${locale}/monitor` },
    })
    setStatus(error ? 'error' : 'sent')
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo centrato */}
        <div className="flex flex-col items-center gap-2 mb-8">
          <svg width="36" height="36" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="16" fill="none" stroke="#e8c848" strokeWidth="2" />
            <circle cx="18" cy="18" r="5" fill="#e8c848" />
          </svg>
          <span style={{ fontSize: 14, letterSpacing: '0.22em', fontWeight: 600, color: '#e8eaf0', textTransform: 'uppercase' }}>
            {tApp('name')}
          </span>
          <span style={{ fontSize: 11, color: '#8892a4' }}>{tApp('tagline')}</span>
        </div>

        <div
          className="rounded-2xl p-8"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          {status === 'sent' ? (
            <p className="text-center" style={{ color: '#4ade80' }}>{t('sent')}</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
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
                disabled={status === 'loading'}
                className="w-full rounded-xl py-3 text-sm font-semibold transition-colors disabled:opacity-50"
                style={{
                  background: 'rgba(232,200,72,0.15)',
                  border: '1px solid rgba(232,200,72,0.4)',
                  color: '#e8c848',
                }}
              >
                {status === 'loading' ? '...' : t('submit')}
              </button>
              {status === 'error' && (
                <p className="text-center text-xs" style={{ color: '#f87171' }}>{t('error')}</p>
              )}
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
