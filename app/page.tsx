'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { authApi } from '@/lib/api'
import { setTempToken } from '@/lib/auth'
import axios from 'axios'

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
      const { temp_token } = res
      setTempToken(temp_token)
      router.push('/verify')
    } catch (err: unknown) {
      if (axios.isAxiosError(err))
        setError(err instanceof Error ? err.message : "Login failed" || 'Login failed. Check credentials.')
      else setError('Network error. Please try again.')
    } finally { setLoading(false) }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(ellipse 70% 60% at 50% -10%, rgba(200,168,75,0.07) 0%, transparent 65%), var(--navy)'
    }}>
      <div style={{ width: 400, padding: 16 }}>
        {/* Crest */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            width: 68, height: 68, margin: '0 auto 14px',
            border: '2px solid var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: '"Cormorant Garamond", serif', fontSize: 28, fontWeight: 700, color: 'var(--gold)',
            position: 'relative'
          }}>
            N
            <span style={{ position: 'absolute', inset: -6, border: '1px solid var(--gold-line)' }} />
          </div>
          <div className="font-garamond" style={{ fontSize: 28, fontWeight: 600, letterSpacing: '.3px' }}>
            Neum Lex Counsel
          </div>
          <div style={{ fontSize: 11, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--white-2)', marginTop: 4 }}>
            RJSC Compliance Platform
          </div>
        </div>

        {/* Card */}
        <div className="nlc-card" style={{ padding: 32 }}>
          <label className="f-label" style={{ display: 'block', fontSize: 10, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 8 }}>
            Email Address
          </label>
          <input
            className="nlc-input" type="email" placeholder="you@neumlexcounsel.com"
            value={email} onChange={e => setEmail(e.target.value)}
            style={{ marginBottom: 20 }}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
          />
          <label style={{ display: 'block', fontSize: 10, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 8 }}>
            Password
          </label>
          <input
            className="nlc-input" type="password" placeholder="••••••••••"
            value={password} onChange={e => setPassword(e.target.value)}
            style={{ marginBottom: 20 }}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
          />
          {error && (
            <div style={{ background: 'var(--red-bg)', border: '1px solid rgba(160,48,48,.3)', color: '#e07070', padding: '10px 14px', fontSize: 12, marginBottom: 16 }}>
              {error}
            </div>
          )}
          <button className="nlc-btn-gold" onClick={handleLogin} disabled={loading}>
            {loading ? 'Signing In…' : 'Sign In →'}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
            <span style={{ flex: 1, height: 1, background: 'var(--navy-border)' }} />
            <span style={{ fontSize: 10, color: 'var(--white-3)', letterSpacing: '1px', textTransform: 'uppercase' }}>Access Roles</span>
            <span style={{ flex: 1, height: 1, background: 'var(--navy-border)' }} />
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span className="badge-pill badge-green" style={{ padding: '4px 10px', fontSize: 10, fontWeight: 600, letterSpacing: '.8px', textTransform: 'uppercase' }}>Super Admin</span>
            <span className="badge-pill badge-yellow" style={{ padding: '4px 10px', fontSize: 10, fontWeight: 600, letterSpacing: '.8px', textTransform: 'uppercase' }}>Legal Staff</span>
            <span className="badge-pill badge-neutral" style={{ padding: '4px 10px', fontSize: 10, fontWeight: 600, letterSpacing: '.8px', textTransform: 'uppercase' }}>Client View</span>
          </div>
        </div>
        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 11, color: 'var(--white-3)', letterSpacing: '.5px' }}>
          Neum Lex Counsel · Bangladesh Companies Act 1994
        </div>
      </div>
    </div>
  )
}
