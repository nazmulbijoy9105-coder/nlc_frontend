"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { authApi, setTokens, setUser } from '@/lib/api'

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState('LEGAL_STAFF')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSignup = async () => {
    if (!email || !password || !fullName) { setError('Please fill all fields.'); return }
    setLoading(true); setError('')
    try {
      const res = await authApi.signup(email, password, fullName, role)
      if (res.access_token && res.refresh_token) {
        setTokens(res.access_token, res.refresh_token)
        if (res.user) setUser(res.user)
        router.push('/dashboard')
      }
    } catch (e: any) {
      setError(e instanceof Error ? e.message : 'Signup failed.')
    } finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div className="nlc-card" style={{ width: 420, padding: 36 }}>
        <div style={{ textAlign: 'center', marginBottom: 26 }}>
          <div className="font-garamond" style={{ fontSize: 22, color: 'var(--navy)', marginBottom: 6 }}>Create Account</div>
          <div style={{ fontSize: 12, color: 'var(--text3)' }}>Register a new account</div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <label className="f-label">Full Name</label>
          <input className="nlc-input" placeholder="John Doe" value={fullName} onChange={e => setFullName(e.target.value)} />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label className="f-label">Email Address</label>
          <input className="nlc-input" type="email" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label className="f-label">Password</label>
          <input className="nlc-input" type="password" placeholder="Min 8 chars, 1 upper, 1 digit, 1 special" value={password} onChange={e => setPassword(e.target.value)} />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label className="f-label">Role</label>
          <select className="nlc-input" value={role} onChange={e => setRole(e.target.value)}>
            <option value="LEGAL_STAFF">Legal Staff</option>
            <option value="ADMIN_STAFF">Admin Staff</option>
            <option value="CLIENT_DIRECTOR">Client Director</option>
            <option value="CLIENT_VIEW_ONLY">Client View Only</option>
          </select>
        </div>
        {error && (
          <div style={{ background: 'var(--red-bg)', border: '1px solid rgba(160,48,48,.3)', color: '#e07070', padding: '10px 14px', fontSize: 12, marginBottom: 16, borderRadius: 7 }}>{error}</div>
        )}
        <button className="nlc-btn-gold" onClick={handleSignup} disabled={loading} style={{ opacity: loading ? .6 : 1 }}>
          {loading ? 'Creating Account…' : 'Create Account →'}
        </button>
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <button onClick={() => router.push('/')} style={{ background: 'transparent', border: 'none', color: 'var(--text3)', fontSize: 12, cursor: 'pointer' }}>← Back to Login</button>
        </div>
      </div>
    </div>
  )
}
