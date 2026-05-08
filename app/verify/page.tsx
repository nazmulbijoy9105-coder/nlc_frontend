'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { authApi } from '@/lib/api'
import { getTempToken, setTokens, setUser } from '@/lib/auth'
import axios from 'axios'

export default function VerifyPage() {
  const router = useRouter()
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const inputs = useRef<(HTMLInputElement | null)[]>([])

  const handleChange = (i: number, val: string) => {
    if (!/^\d*$/.test(val)) return
    const next = [...code]
    next[i] = val.slice(-1)
    setCode(next)
    if (val && i < 5) inputs.current[i + 1]?.focus()
  }

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[i] && i > 0) inputs.current[i - 1]?.focus()
  }

  const handleVerify = async () => {
    const totp_code = code.join('')
    if (totp_code.length < 6) { setError('Enter the full 6-digit code.'); return }
    const temp_token = getTempToken()
    if (!temp_token) { router.push('/'); return }
    setLoading(true); setError('')
    try {
      const res = await authApi.verify2FA(temp_token, totp_code)
      const { access_token, refresh_token, user } = res
      setTokens(access_token, refresh_token)
      setUser(user)
      router.push('/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid code. Please try again.')
      setCode(['', '', '', '', '', ''])
      inputs.current[0]?.focus()
    } finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--navy)' }}>
      <div style={{ width: 380, padding: 16 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 52, height: 52, margin: '0 auto 14px', border: '1px solid var(--gold-line)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" stroke="var(--gold)" fill="none" strokeWidth="1.5">
              <rect x="5" y="11" width="14" height="10" rx="1"/><path d="M8 11V7a4 4 0 018 0v4"/>
            </svg>
          </div>
          <div className="font-garamond" style={{ fontSize: 22, fontWeight: 600 }}>Two-Factor Authentication</div>
          <div style={{ fontSize: 12, color: 'var(--white-2)', marginTop: 6, lineHeight: 1.5 }}>
            Enter the 6-digit code from your authenticator app.<br />
            Issuer: <b style={{ color: 'var(--gold)' }}>Neum Lex Counsel</b>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
          {code.map((digit, i) => (
            <input
              key={i}
              ref={el => { inputs.current[i] = el }}
              type="text" inputMode="numeric" maxLength={1} value={digit}
              onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              style={{
                flex: 1, height: 52, textAlign: 'center',
                background: 'var(--navy-2)', border: `1px solid ${digit ? 'var(--gold)' : 'var(--navy-border)'}`,
                color: 'var(--nlc-white)', fontSize: 22, fontWeight: 600,
                fontFamily: '"Cormorant Garamond", serif', outline: 'none', transition: 'border .2s'
              }}
            />
          ))}
        </div>

        {error && (
          <div style={{ background: 'var(--red-bg)', border: '1px solid rgba(160,48,48,.3)', color: '#e07070', padding: '10px 14px', fontSize: 12, marginBottom: 16 }}>
            {error}
          </div>
        )}

        <button className="nlc-btn-gold" onClick={handleVerify} disabled={loading}>
          {loading ? 'Verifying…' : 'Verify & Enter →'}
        </button>
        <div style={{ marginTop: 12 }}>
          <button className="nlc-btn-sm" style={{ width: '100%' }} onClick={() => router.push('/')}>
            ← Back to Login
          </button>
        </div>
        <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--white-3)', marginTop: 16 }}>
          Didn&apos;t receive a code? <span style={{ color: 'var(--gold)', cursor: 'pointer' }}>Resend</span>
        </div>
      </div>
    </div>
  )
}
