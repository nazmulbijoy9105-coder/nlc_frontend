'use client'
import { useEffect, useState } from 'react'
import { authApi } from '@/lib/api'
import { getUser, setUser } from '@/lib/auth'
import Topbar from '@/components/Topbar'

export default function ProfilePage() {
  const [user, setUserState] = useState(getUser() || {
    full_name: 'Md Nazmul Islam (Bijoy)',
    email: 'nazmulbijoy9105@gmail.com',
    role: 'SUPER_ADMIN',
    totp_enabled: true,
  })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    authApi.me().then(r => {
      setUserState(r.data)
      setUser(r.data)
    }).catch(() => {})
  }, [])

  const fields = [
    ['Organisation', 'Neum Lex Counsel (NLC)'],
    ['Role', user.role?.replace(/_/g, ' ') || 'Super Admin'],
    ['Bar Enrollment', 'Supreme Court of Bangladesh'],
    ['Platform Version', 'NLC v1.0 · ILRMF 1.0'],
    ['AI Provider', 'Anthropic Claude Sonnet'],
    ['Framework', 'ILRMF v1.0 — 32 Rules'],
  ]

  return (
    <>
      <Topbar title="My Profile" />
      <div style={{ padding: 28, maxWidth: 720 }}>
        <div className="nlc-card" style={{ padding: 24, marginBottom: 20 }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 24 }}>
            <div style={{ width: 52, height: 52, background: 'var(--gold-dim)', border: '1px solid var(--gold-line)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '"Cormorant Garamond",serif', fontSize: 20, fontWeight: 700, color: 'var(--gold)', flexShrink: 0 }}>
              {(user.full_name || 'MN').split(' ').map((n: string) => n[0]).join('').slice(0,2).toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <div className="font-garamond" style={{ fontSize: 20, fontWeight: 600 }}>{user.full_name}</div>
              <div style={{ fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--gold)', marginTop: 3 }}>
                {user.role?.replace(/_/g, ' ')} · Advocate, Supreme Court of Bangladesh
              </div>
              <div style={{ fontSize: 12, color: 'var(--white-2)', marginTop: 4 }}>{user.email}</div>
            </div>
            <span className="badge-pill badge-green" style={{ padding: '4px 10px', fontSize: 10, fontWeight: 600, letterSpacing: '.8px', textTransform: 'uppercase' }}>
              {user.totp_enabled ? '2FA Active' : '2FA Inactive'}
            </span>
          </div>

          {/* Fields */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
            {fields.map(([k, v]) => (
              <div key={k} style={{ background: 'var(--navy)', border: '1px solid var(--navy-border)', padding: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 6 }}>{k}</div>
                <div style={{ fontSize: 13 }}>{v}</div>
              </div>
            ))}
          </div>

          {saved && (
            <div style={{ background: 'var(--green-bg)', border: '1px solid rgba(26,122,82,.3)', color: '#5dd4a0', padding: '10px 14px', fontSize: 12, marginBottom: 16 }}>
              ✓ Changes saved successfully.
            </div>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <button className="nlc-btn-sm">Change Password</button>
            <button className="nlc-btn-sm">Regenerate 2FA</button>
            <button className="nlc-btn-sm">Export Activity Log</button>
          </div>
        </div>

        {/* API Info */}
        <div className="nlc-card" style={{ padding: 20 }}>
          <div className="font-garamond" style={{ fontSize: 15, fontWeight: 600, marginBottom: 14 }}>API Connection</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--navy)', border: '1px solid var(--navy-border)', fontSize: 12 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#5dd4a0', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 500 }}>NLC Backend API</div>
              <div style={{ fontSize: 11, color: 'var(--white-3)', marginTop: 2 }}>{process.env.NEXT_PUBLIC_API_URL || 'https://nlc-backend.vercel.app'}/api/v1</div>
            </div>
            <span className="badge-pill badge-green" style={{ padding: '4px 10px', fontSize: 10, fontWeight: 600, letterSpacing: '.8px', textTransform: 'uppercase' }}>Connected</span>
          </div>
        </div>
      </div>
    </>
  )
}
