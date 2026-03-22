export type Band = 'GREEN' | 'YELLOW' | 'RED' | 'BLACK'

export function BandBadge({ band }: { band: string }) {
  const map: Record<string, string> = {
    GREEN: 'badge-green', YELLOW: 'badge-yellow',
    RED: 'badge-red', BLACK: 'badge-red',
    Filed: 'badge-green', FILED: 'badge-green',
    Pending: 'badge-yellow', PENDING: 'badge-yellow',
    Overdue: 'badge-red', OVERDUE: 'badge-red',
    'In Progress': 'badge-yellow', IN_PROGRESS: 'badge-yellow',
    DRAFT: 'badge-neutral', Draft: 'badge-neutral',
    APPROVED: 'badge-green', Approved: 'badge-green',
    'Pending Review': 'badge-yellow', PENDING_REVIEW: 'badge-yellow',
  }
  return (
    <span className={`badge-pill ${map[band] || 'badge-neutral'}`}
      style={{ padding: '4px 10px', fontSize: 10, fontWeight: 600, letterSpacing: '.8px', textTransform: 'uppercase' }}>
      {band.replace(/_/g, ' ')}
    </span>
  )
}

export function ScoreBar({ score, band }: { score: number; band: string }) {
  const fill = band === 'GREEN' ? 'var(--green)' : band === 'YELLOW' ? '#b8860b' : '#a03030'
  const text = band === 'GREEN' ? '#5dd4a0' : band === 'YELLOW' ? '#e0b84a' : '#e07070'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ flex: 1, height: 4, background: 'var(--navy-border)' }}>
        <div style={{ height: 4, background: fill, width: `${score}%` }} />
      </div>
      <div style={{ fontSize: 12, fontWeight: 600, minWidth: 28, textAlign: 'right', color: text }}>{score}</div>
    </div>
  )
}

export function ActionBtn({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button onClick={onClick} style={{
      padding: '4px 10px', fontSize: 10, fontWeight: 500,
      background: 'transparent', border: '1px solid var(--navy-border)',
      color: 'var(--white-2)', cursor: 'pointer', transition: 'all .15s'
    }}
      onMouseEnter={e => { (e.target as HTMLButtonElement).style.borderColor = 'var(--gold-line)'; (e.target as HTMLButtonElement).style.color = 'var(--gold)' }}
      onMouseLeave={e => { (e.target as HTMLButtonElement).style.borderColor = 'var(--navy-border)'; (e.target as HTMLButtonElement).style.color = 'var(--white-2)' }}
    >{children}</button>
  )
}

export function SectionHeader({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16, gap: 16 }}>
      <div className="font-garamond" style={{ fontSize: 17, fontWeight: 600, whiteSpace: 'nowrap' }}>{title}</div>
      <div style={{ flex: 1, height: 1, background: 'var(--navy-border)' }} />
      {children}
    </div>
  )
}
