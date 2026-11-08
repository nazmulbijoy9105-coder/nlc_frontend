'use client'

interface Props { title: string }

export default function Topbar({ title }: Props) {
  const date = new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <div style={{
      height: 52, background: 'var(--navy-2)', borderBottom: '1px solid var(--navy-border)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 28px', position: 'sticky', top: 0, zIndex: 10
    }}>
      <div className="font-garamond" style={{ fontSize: 18, fontWeight: 600 }}>{title}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span suppressHydrationWarning style={{ fontSize: 11, color: 'var(--white-3)' }}>{date}</span>
      </div>
    </div>
  )
}
