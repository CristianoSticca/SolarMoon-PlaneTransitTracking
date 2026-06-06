import type { Metadata, Viewport } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import Script from 'next/script'
import { StarBackground } from '@/components/layout/StarBackground'
import { BottomNav } from '@/components/layout/BottomNav'

const locales = ['it', 'en']

export const metadata: Metadata = {
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  themeColor: '#060e1a',
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!locales.includes(locale)) notFound()
  const messages = await getMessages()

  return (
    <NextIntlClientProvider messages={messages}>
      <StarBackground />
      <div style={{ background: '#060e1a', color: '#e8eaf0', minHeight: '100dvh', position: 'relative' }}>
        <div style={{ position: 'relative', zIndex: 1, paddingBottom: 'calc(56px + env(safe-area-inset-bottom))' }}>
          {children}
        </div>
        <BottomNav locale={locale} />
      </div>
      <Script id="sw-register" strategy="afterInteractive">{`
        if ('serviceWorker' in navigator) {
          window.addEventListener('load', function() {
            navigator.serviceWorker.register('/sw.js').catch(function(err) {
              console.error('SW registration failed:', err);
            });
          });
        }
        window.addEventListener('beforeinstallprompt', function(e) {
          e.preventDefault();
          window.__a2hsEvent = e;
        });
      `}</Script>
    </NextIntlClientProvider>
  )
}
