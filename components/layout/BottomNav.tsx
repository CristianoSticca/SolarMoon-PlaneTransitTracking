'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface Props {
  locale: string
}

const tabs = [
  { key: 'monitor', label: 'Monitor', icon: '◎', path: (l: string) => `/${l}/monitor` },
  { key: 'settings', label: 'Settings', icon: '⚙', path: (l: string) => `/${l}/settings` },
  { key: 'guide', label: 'Guida', icon: '📖', path: (l: string) => `/${l}/guide` },
]

export function BottomNav({ locale }: Props) {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 flex"
      style={{
        background: '#060e1a',
        borderTop: '1px solid rgba(255,255,255,0.07)',
        zIndex: 50,
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {tabs.map(tab => {
        const href = tab.path(locale)
        const active = pathname === href || pathname.startsWith(href + '/')
        return (
          <Link
            key={tab.key}
            href={href}
            className="flex flex-1 flex-col items-center gap-1 py-2.5 text-center"
            style={{ color: active ? '#e8c848' : '#8892a4', textDecoration: 'none' }}
          >
            <span style={{ fontSize: 18, lineHeight: 1 }}>{tab.icon}</span>
            <span style={{ fontSize: 9, letterSpacing: '0.07em', textTransform: 'uppercase' }}>
              {tab.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
