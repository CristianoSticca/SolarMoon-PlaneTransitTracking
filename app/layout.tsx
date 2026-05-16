import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AstroTransit',
  description: 'AstroTransit — rileva aerei in transito davanti a Luna e Sole per l\'astrofotografia',
  icons: {
    icon: '/astrotransit-logo.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
