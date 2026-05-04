import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SolarMoon',
  description: 'Track aircraft transits across Moon and Sun',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
