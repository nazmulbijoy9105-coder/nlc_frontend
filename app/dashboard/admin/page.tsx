'use client'
import { useEffect, useState } from 'react'
import { adminApi } from '@/lib/api'
import Topbar from '@/components/Topbar'

const ROLES = ['SUPER_ADMIN', 'ADMIN_STAFF', 'LEGAL_STAFF', 'CLIENT_DIRECTOR', 'CLIENT_VIEW_ONLY']

const ROLE_META: Record<string, { color: string; bg: string; border: string; label: string }> = {
  SUPER_ADMIN:      { color: '#e07070', bg: 'rgba(224,112,112,.08)', border: 'rgba(224,112,112,.25)', label: 'Super Admin' },
  ADMIN_STAFF:      { color: '#c8a84b', bg: 'rgba(200,168,75,.08)',  border: 'rgba(200,168,75,.25)',  label: 'Admin Staff' },
  LEGAL_STAFF:      { color: '#7eb8f7', bg: 'rgba(126,184,247,.08)', border: 'rgba(126,184,247,.25)', label: 'Legal Staff' },
  CLIENT_DIRECTOR:  { color: '#b48ef7', bg: 'rgba(180,142,247,.08)', border: 'rgba(180,142,247,.25)', label: 'Client Director' },
  CLIENT_VIEW_ONLY: { color: '#8a9bb5', bg: 'rgba(138,155,181,.08)', border: 'rgba(138,155,181,.25)', label: 'View Only' },
}

interface User { id: string; email: string; full_name: string; role: string; is_active: boolean }

const EMPTY = { email: '', full_name: '', role: 'LEGAL_STAFF', password: '' }

function RoleBadge({ role }: { role: string }) {
  const m = ROLE_META[role] || { color: 'var(--white-3)', bg: 'var(--white-4)', border: 'var(--navy-border)', label: role }
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase',
      color: m.color, background: m.bg, border: `1px solid ${m.border}`,
      padding: '3px 8px', display: 'inline-block',
    }}>{m.label}</span>
  )
}

function Initials({ name }: { name: string }) {
  const i = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div style={{
      width: 32, height: 32, flexShrink: 0,
      background: 'var(--navy-3)', border: '1px solid var(--navy-border)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: '"Cormorant Garamond", Georgia, serif', fontSize: 13, fontWeight: 600,
      color: 'var(--gold)',
    }}>{i}</div>
  )
}

export default function UsersPage() {
  const [users, setUsers]     = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm]       = useState(EMPTY)
  const [creating, setCreating] = useState(false)
  const [actionId, setActionId] = useState<string | null>(null)
  const [error, setError]     = useState('')
  const [formError, setFormError] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')

  useEffect(() => { load() }, [])

  function load() {
    setLoading(true)
    adminApi.listUsers()
      .then((r: any) => setUsers(Array.isArray(r) ? r : r?.items || []))
      .catch(e => setError(e.message || 'Failed to load users'))
      .finally(() => setLoading(false))
  }

  async function handleCreate() {
    setFormError('')
    if (!form.email || !form.full_name || !form.password) { setFormError('All fields are required'); return }
    if (form.password.length < 8) { setFormError('Password must be at least 8 characters'); return }
    setCreating(true)
    try {
      const u = await adminApi.createUser(form)
      setUsers(prev => [u, ...prev])
      setForm(EMPTY)
      setShowCreate(false)
    } catch (e: any) {
      setFormError(e.message || 'Create failed')
    } finally { setCreating(false) }
  }

  async function handleToggle(user: User) {
    setActionId(user.id)
    try {
      user.is_active ? await adminApi.deactivateUser(user.id) : await adminApi.reactivateUser(user.id)
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_active: !u.is_active } : u))
    } catch (e: any) { setError(e.message || 'Action failed') }
    finally { setActionId(null) }
  }

  const visible = roleFilter === 'ALL' ? users : users.filter(u => u.role === roleFilter)
  const active  = users.filter(u => u.is_active).length

  return (
    <>
      <Topbar title="User Management" />
      <div style={{ padding: 28 }}>

        {/* Header strip */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
          <div style={{ display: 'flex', gap: 16 }}>
            {[
              { label: 'Total Users',   value: users.length, color: 'var(--gold)' },
              { label: 'Active',        value: active,       color: '#5dd4a0' },
              { label: 'Inactive',      value: users.length - active, color: '#e07070' },
            ].map(s => (
              <div key={s.label} className="nlc-card" style={{ padding: '14px 20px', minWidth: 100, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: s.color, opacity: 0.6 }} />
                <div className="font-cormorant" style={{ fontSize: 30, fontWeight: 600, color: s.color, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 10, color: 'var(--white-3)', marginTop: 4, letterSpacing: '.8px', textTransform: 'uppercase' }}>{s.label}</div>
              </div>
            ))}
          </div>
          <button
            onClick={() => { setShowCreate(v => !v); setFormError('') }}
            className="nlc-btn-gold"
            style={{ padding: '9px 20px', fontSize: 11, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>
            {showCreate ? '✕  Cancel' : '+ New User'}
          </button>
        </div>

        {error && (
          <div style={{ color: '#e07070', background: 'rgba(224,112,112,.07)', border: '1px solid rgba(224,112,112,.2)', padding: '10px 14px', marginBottom: 16, fontSize: 12 }}>
            {error}
          </div>
        )}

        {/* Create form */}
        {showCreate && (
          <div className="nlc-card" style={{ padding: 24, marginBottom: 24, borderColor: 'var(--gold-line)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid var(--navy-border)' }}>
              <div style={{ width: 3, height: 16, background: 'var(--gold)' }} />
              <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--white-2)' }}>Create New User</span>
            </div>

            {formError && (
              <div style={{ color: '#e07070', fontSize: 11, marginBottom: 14, padding: '8px 12px', background: 'rgba(224,112,112,.07)', border: '1px solid rgba(224,112,112,.2)' }}>
                {formError}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              {[
                { key: 'full_name', label: 'Full Name',  type: 'text' },
                { key: 'email',     label: 'Email Address', type: 'email' },
                { key: 'password',  label: 'Password',   type: 'password' },
              ].map(f => (
                <div key={f.key}>
                  <div style={{ fontSize: 9, color: 'var(--white-3)', marginBottom: 6, letterSpacing: '1.2px', textTransform: 'uppercase' }}>{f.label}</div>
                  <input
                    type={f.type}
                    value={(form as any)[f.key]}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    className="nlc-input"
                    style={{ width: '100%', padding: '9px 12px', fontSize: 13 }}
                  />
                </div>
              ))}
              <div>
                <div style={{ fontSize: 9, color: 'var(--white-3)', marginBottom: 6, letterSpacing: '1.2px', textTransform: 'uppercase' }}>Role</div>
                <select
                  value={form.role}
                  onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
                  className="nlc-input"
                  style={{ width: '100%', padding: '9px 12px', fontSize: 13 }}>
                  {ROLES.map(r => <option key={r} value={r}>{ROLE_META[r]?.label || r}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={handleCreate} disabled={creating} className="nlc-btn-gold"
                style={{ padding: '9px 28px', fontSize: 11, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>
                {creating ? 'Creating…' : 'Create User'}
              </button>
            </div>
          </div>
        )}

        {/* Role filter pills */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
          {['ALL', ...ROLES].map(r => {
            const active = roleFilter === r
            const m = ROLE_META[r]
            return (
              <button key={r} onClick={() => setRoleFilter(r)} style={{
                padding: '5px 14px', fontSize: 10, fontWeight: 600, letterSpacing: '.8px', textTransform: 'uppercase',
                cursor: 'pointer', transition: 'all .15s',
                background: active ? (m?.bg || 'var(--gold-dim)') : 'transparent',
                border: `1px solid ${active ? (m?.border || 'var(--gold-line)') : 'var(--navy-border)'}`,
                color: active ? (m?.color || 'var(--gold)') : 'var(--white-3)',
              }}>
                {m?.label || 'All'} ({r === 'ALL' ? users.length : users.filter(u => u.role === r).length})
              </button>
            )
          })}
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--white-3)', fontSize: 13 }}>
            <div style={{ fontFamily: '"Cormorant Garamond",serif', fontSize: 28, color: 'var(--gold)', opacity: 0.4, marginBottom: 10 }}>◌</div>
            Loading users…
          </div>
        ) : visible.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--white-3)', fontSize: 13 }}>No users match this filter.</div>
        ) : (
          <div className="nlc-card" style={{ overflow: 'hidden' }}>
            <table className="nlc-table" style={{ tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: '28%' }} />
                <col style={{ width: '28%' }} />
                <col style={{ width: '20%' }} />
                <col style={{ width: '12%' }} />
                <col style={{ width: '12%' }} />
              </colgroup>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {visible.map(u => (
                  <tr key={u.id} style={{ opacity: u.is_active ? 1 : 0.45, transition: 'opacity .2s' }}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Initials name={u.full_name} />
                        <div style={{ fontWeight: 500, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {u.full_name}
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--white-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {u.email}
                    </td>
                    <td><RoleBadge role={u.role} /></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: u.is_active ? '#5dd4a0' : '#4a5568', flexShrink: 0 }} />
                        <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.8px', textTransform: 'uppercase', color: u.is_active ? '#5dd4a0' : '#6b7280' }}>
                          {u.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <button
                        onClick={() => handleToggle(u)}
                        disabled={actionId === u.id}
                        style={{
                          padding: '4px 10px', fontSize: 10, fontWeight: 600, letterSpacing: '.6px',
                          textTransform: 'uppercase', cursor: actionId === u.id ? 'not-allowed' : 'pointer',
                          background: 'transparent', transition: 'all .15s',
                          border: `1px solid ${u.is_active ? 'rgba(224,112,112,.3)' : 'rgba(93,212,160,.3)'}`,
                          color: u.is_active ? '#e07070' : '#5dd4a0',
                          opacity: actionId === u.id ? 0.5 : 1,
                        }}>
                        {actionId === u.id ? '…' : u.is_active ? 'Deactivate' : 'Reactivate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
