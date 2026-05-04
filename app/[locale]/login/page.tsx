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
        <div className="rounded-2xl border border-white/15 bg-white/8 p-8 backdrop-blur-xl shadow-2xl">
          <div className="mb-8 text-center">
            <div className="text-5xl mb-3">🌙</div>
            <h1 className="text-2xl font-bold">{tApp('name')}</h1>
            <p className="text-white/50 text-sm mt-1">{tApp('tagline')}</p>
          </div>

          {status === 'sent' ? (
            <p className="text-center text-green-400">{t('sent')}</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={t('emailPlaceholder')}
                className="w-full rounded-xl border border-white/20 bg-white/8 px-4 py-3 text-sm placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-violet-400"
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full rounded-xl bg-violet-600 py-3 text-sm font-semibold hover:bg-violet-500 disabled:opacity-50 transition-colors"
              >
                {status === 'loading' ? '...' : t('submit')}
              </button>
              {status === 'error' && (
                <p className="text-center text-red-400 text-xs">{t('error')}</p>
              )}
            </form>
          )}

          <p className="mt-6 text-center text-white/30 text-xs">{t('hint')}</p>

          <div className="mt-4 flex justify-center gap-2">
            {['it', 'en'].map(l => (
              <a
                key={l}
                href={`/${l}/login`}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  l === locale ? 'bg-violet-600 text-white' : 'text-white/40 hover:text-white/70'
                }`}
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
