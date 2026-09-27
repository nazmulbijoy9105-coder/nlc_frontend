"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { authApi } from '@/lib/api'
import { setTokens, setUser, setTempToken } from '@/lib/auth'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async () => {
    if (!email || !password) { setError('Please enter email and password.'); return }
    setLoading(true); setError('')
    try {
      const res = await authApi.login(email, password)
      if (res.requires_2fa && res.temp_token) {
        setTempToken(res.temp_token)
        router.push('/verify')
      } else if (res.access_token && res.refresh_token) {
        setTokens(res.access_token, res.refresh_token)
        if (res.user) setUser(res.user)
        router.push('/dashboard')
      } else {
        setError('Unexpected response from server.')
      }
    } catch (e: any) {
      setError(e instanceof Error ? e.message : 'Login failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--navy)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ height: 3, background: 'linear-gradient(90deg, transparent, var(--gold), var(--gold-2), var(--gold), transparent)' }} />
      <div style={{ flex: 1, display: 'flex', minHeight: 'calc(100vh - 3px)' }}>
        {/* Left panel */}
        <div style={{ width: '48%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '64px 72px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -80, right: -80, width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(201,168,76,.06) 0%, transparent 70%)' }} />
          <div style={{ marginBottom: 52 }}>
            <div className="font-garamond" style={{ fontSize: 38, color: 'var(--gold)', lineHeight: 1.1, letterSpacing: '.01em' }}>
              Neum Lex<br />Counsel
            </div>
            <div style={{ width: 44, height: 2, background: 'linear-gradient(90deg, var(--gold), var(--gold-2))', margin: '18px 0', borderRadius: 2 }} />
            <div style={{ color: 'rgba(255,255,255,.35)', fontSize: 11, letterSpacing: '.16em', fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase' }}>
              RJSC Compliance Intelligence
            </div>
          </div>
          <div style={{ borderLeft: '2px solid rgba(201,168,76,.25)', paddingLeft: 22 }}>
            <div className="font-garamond" style={{ color: 'rgba(255,255,255,.85)', fontSize: 19, marginBottom: 20, fontStyle: 'italic', lineHeight: 1.5 }}>
              "Corporate Governance.<br />Structured. Defensible."
            </div>
            {['Legal Rule Engine', 'Compliance Scoring', 'Default Rescue System', 'Revenue Intelligence'].map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, fontSize: 12, color: 'rgba(255,255,255,.38)' }}>
                <span style={{ color: 'var(--gold)', fontSize: 9 }}>◆</span>{f}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 52, fontSize: 9.5, color: 'rgba(255,255,255,.14)', letterSpacing: '.1em', fontFamily: "'JetBrains Mono', monospace" }}>
            CONFIDENTIAL ∙ ENTERPRISE ACCESS ∙ TLS 1.3
          </div>
        </div>
        {/* Right panel — login form */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, background: 'rgba(255,255,255,.02)', borderLeft: '1px solid rgba(255,255,255,.06)' }}>
          <div className="nlc-card" style={{ width: 400, padding: 36 }}>
            <div style={{ marginBottom: 26 }}>
              <div className="font-garamond" style={{ fontSize: 22, color: 'var(--navy)', marginBottom: 6 }}>Secure Login</div>
              <div style={{ fontSize: 12, color: 'var(--text3)' }}>Enter your credentials to continue</div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label className="f-label">Email Address</label>
              <input className="nlc-input" type="email" placeholder="admin@neumlexcounsel.com" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label className="f-label">Password</label>
              <input className="nlc-input" type="password" placeholder="••••••••••" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} />
            </div>
            {error && (
              <div style={{ background: 'var(--red-bg)', border: '1px solid rgba(160,48,48,.3)', color: '#e07070', padding: '10px 14px', fontSize: 12, marginBottom: 16, borderRadius: 7 }}>
                {error}
              </div>
            )}
            <button className="nlc-btn-gold" onClick={handleLogin} disabled={loading} style={{ opacity: loading ? .6 : 1 }}>
              {loading ? 'Signing In…' : 'Sign In →'}
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '20px 0' }}>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              <span style={{ fontSize: 10, color: 'var(--text3)', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '.06em' }}>ACCESS ROLES</span>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span className="badge-pill badge-green">Super Admin</span>
              <span className="badge-pill badge-yellow">Legal Staff</span>
              <span className="badge-pill badge-neutral">Client View</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
