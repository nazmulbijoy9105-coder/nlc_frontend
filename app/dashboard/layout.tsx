'use client'
import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { isAuthenticated, clearAuth, getUser } from '@/lib/auth'
import { authApi } from '@/lib/api'

const NAV = [
  { group: 'Overview', items: [{ href: '/dashboard', label: 'Dashboard', icon: 'grid' }] },
  { group: 'Compliance', items: [
    { href: '/dashboard/companies', label: 'Companies', icon: 'home' },
    { href: '/dashboard/filings', label: 'Filings', icon: 'file' },
    { href: '/dashboard/rescue', label: 'Rescue Pipeline', icon: 'alert' },
  ]},
  { group: 'Operations', items: [
    { href: '/dashboard/documents', label: 'Documents', icon: 'inbox' },
    { href: '/dashboard/commercial', label: 'Commercial', icon: 'users' },
  ]},
  { group: 'Admin', items: [
    { href: '/dashboard/rules', label: 'Rules Engine', icon: 'sun' },
    { href: '/dashboard/profile', label: 'My Profile', icon: 'user' },
  ]},
]

function Icon({ name }: { name: string }) {
  const s = { width: 15, height: 15, stroke: 'currentColor', fill: 'none' as const, strokeWidth: 1.5, flexShrink: 0 as const, opacity: 0.7 }
  if (name === 'grid') return <svg viewBox="0 0 24 24" style={s}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
  if (name === 'home') return <svg viewBox="0 0 24 24" style={s}><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
  if (name === 'file') return <svg viewBox="0 0 24 24" style={s}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
  if (name === 'alert') return <svg viewBox="0 0 24 24" style={s}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
  if (name === 'inbox') return <svg viewBox="0 0 24 24" style={s}><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z"/></svg>
  if (name === 'users') return <svg viewBox="0 0 24 24" style={s}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
  if (name === 'sun') return <svg viewBox="0 0 24 24" style={s}><circle cx="12" cy="12" r="3"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>
  if (name === 'user') return <svg viewBox="0 0 24 24" style={s}><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
  return null
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const user = getUser()

  useEffect(() => {
    if (!isAuthenticated()) router.push('/')
  }, [router])

  const handleLogout = async () => {
    try { await authApi.logout() } catch {}
    clearAuth()
    router.push('/')
  }

  const initials = user?.full_name
    ? user.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'MN'

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <div style={{
        width: 220, background: 'var(--navy-2)', borderRight: '1px solid var(--navy-border)',
        display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh', overflowY: 'auto', flexShrink: 0
      }}>
        {/* Logo */}
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--navy-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, border: '1.5px solid var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '"Cormorant Garamond",serif', fontSize: 15, fontWeight: 700, color: 'var(--gold)', flexShrink: 0 }}>N</div>
            <div>
              <div className="font-garamond" style={{ fontSize: 13, fontWeight: 600, letterSpacing: '.8px', textTransform: 'uppercase', lineHeight: 1.3 }}>Neum Lex<br/>Counsel</div>
              <div style={{ fontSize: 9, color: 'var(--white-3)', letterSpacing: '.8px', textTransform: 'uppercase', marginTop: 1 }}>NLC Platform v1.0</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <div style={{ padding: '16px 0', flex: 1 }}>
          {NAV.map(group => (
            <div key={group.group}>
              <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--white-3)', padding: '8px 20px 4px' }}>{group.group}</div>
              {group.items.map(item => {
                const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
                return (
                  <Link key={item.href} href={item.href} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '9px 20px',
                    fontSize: 13, color: active ? 'var(--gold)' : 'var(--white-2)',
                    textDecoration: 'none', borderLeft: `2px solid ${active ? 'var(--gold)' : 'transparent'}`,
                    background: active ? 'var(--gold-dim)' : 'transparent', transition: 'all .15s'
                  }}>
                    <Icon name={item.icon} />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--navy-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 30, height: 30, background: 'var(--gold-dim)', border: '1px solid var(--gold-line)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, color: 'var(--gold)', flexShrink: 0 }}>{initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.full_name || 'Md Nazmul Islam'}</div>
              <div style={{ fontSize: 10, color: 'var(--white-3)' }}>{user?.role?.replace(/_/g, ' ') || 'Super Admin'}</div>
            </div>
            <button onClick={handleLogout} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }} title="Sign out">
              <svg width="14" height="14" viewBox="0 0 24 24" stroke="var(--white-3)" fill="none" strokeWidth="1.5"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </button>
          </div>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, minHeight: '100vh', overflow: 'auto', background: 'var(--navy)' }}>
        {children}
      </div>
    </div>
  )
}
