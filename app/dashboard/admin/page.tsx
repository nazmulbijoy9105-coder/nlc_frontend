"use client"
import { getUser } from '@/lib/auth'
import { useState, useEffect } from 'react'
import { adminApi } from '@/lib/api'

export default function AdminPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try { const data = await adminApi.listUsers(1); setUsers(Array.isArray(data)?data:[]) }
      catch(e) { console.error(e) }
      finally { setLoading(false) }
    }
    load()
  }, [])

  const _user = typeof window !== 'undefined' ? getUser() : null
  if (_user && !_user.role?.includes('ADMIN') && !_user.role?.includes('SUPER')) {
    return <div style={{padding:60,textAlign:'center',color:'#B91C1C'}}>⛔ Access Denied — Admin is staff only</div>
  }

  if (loading) return <div style={{padding:40,color:'rgba(255,255,255,.35)'}}>Loading users...</div>

  return (
    <div style={{padding:24}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
        <div className="font-garamond" style={{fontSize:22,color:'#f4f1ea'}}>User Management</div>
        <button className="nlc-btn-gold" style={{width:'auto',padding:'8px 20px'}} onClick={()=>alert('User creation form')}>+ Add User</button>
      </div>
      <div className="nlc-card">
        <div className="sec-lbl gold">Active Users ({users.length})</div>
        <table className="nlc-table">
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th></tr></thead>
          <tbody>
            {users.length === 0 ? (
              <tr><td colSpan={4} style={{textAlign:'center',padding:30,color:'#9CA3AF'}}>No users found</td></tr>
            ) : users.map(u => (
              <tr key={u.id}>
                <td style={{fontWeight:600,color:'#07172B'}}>{u.full_name}</td>
                <td style={{color:'#4B5563'}}>{u.email}</td>
                <td><span className="badge badge-neutral">{u.role}</span></td>
                <td>{u.is_active ? <span className="badge badge-green">Active</span> : <span className="badge badge-red">Inactive</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
