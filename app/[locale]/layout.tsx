import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'

const locales = ['it', 'en']

export const metadata: Metadata = {
  manifest: '/manifest.json',
  themeColor: '#302b63',
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
    <html lang={locale}>
      <body>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
        <script dangerouslySetInnerHTML={{ __html: `
          window.addEventListener('beforeinstallprompt', function(e) {
            e.preventDefault();
            window.__a2hsEvent = e;
          });
        ` }} />
      </body>
    </html>
  )
}
