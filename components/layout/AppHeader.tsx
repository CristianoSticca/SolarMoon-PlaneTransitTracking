interface Props {
  pageLabel: string
  right?: React.ReactNode
}

export function AppHeader({ pageLabel, right }: Props) {
  return (
    <header
      className="flex items-center justify-between px-4 pt-4 pb-2"
      style={{ position: 'relative', zIndex: 1 }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/astrotransit-logo.png" alt="AstroTransit" width={28} height={28} style={{ display: 'block' }} />
        <span style={{
          fontSize: 12,
          letterSpacing: '0.2em',
          fontWeight: 600,
          color: '#e8eaf0',
          textTransform: 'uppercase',
        }}>
          AstroTransit
        </span>
      </div>

      {/* Page label + optional right slot */}
      <div className="flex items-center gap-3">
        {right}
        <span style={{
          fontSize: 10,
          letterSpacing: '0.12em',
          color: '#8892a4',
          textTransform: 'uppercase',
        }}>
          {pageLabel}
        </span>
      </div>
    </header>
  )
}
