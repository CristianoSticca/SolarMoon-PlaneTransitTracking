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
        <svg width="20" height="20" viewBox="0 0 20 20">
          <circle cx="10" cy="10" r="9" fill="none" stroke="#e8c848" strokeWidth="1.5" />
          <circle cx="10" cy="10" r="3" fill="#e8c848" />
        </svg>
        <span style={{
          fontSize: 12,
          letterSpacing: '0.2em',
          fontWeight: 600,
          color: '#e8eaf0',
          textTransform: 'uppercase',
        }}>
          SolarMoon
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
