"use client"
import { useState } from 'react'
import { getUser } from '@/lib/auth'

export default function ProfilePage() {
  const user = getUser()
  if (!user) return <div style={{padding:40,color:'rgba(255,255,255,.35)'}}>Not logged in</div>

  return (
    <div style={{padding:24,maxWidth:600}}>
      <div className="font-garamond" style={{fontSize:22,color:'#f4f1ea',marginBottom:20}}>My Profile</div>
      <div className="nlc-card">
        <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:24}}>
          <div style={{width:64,height:64,borderRadius:'50%',background:'linear-gradient(135deg,#16325A,#07172B)',display:'flex',alignItems:'center',justifyContent:'center',border:'3px solid #C9A84C'}}>
            <span style={{color:'#C9A84C',fontSize:20,fontWeight:700,fontFamily:"'JetBrains Mono',monospace"}}>{user.full_name?.split(' ').map((n:string)=>n[0]).join('').slice(0,2).toUpperCase()}</span>
          </div>
          <div>
            <div className="font-garamond" style={{fontSize:18,color:'#07172B'}}>{user.full_name}</div>
            <div style={{fontSize:12,color:'#9CA3AF'}}>{user.email}</div>
          </div>
        </div>
        <div style={{display:'flex',justifyContent:'space-between',padding:'12px 0',borderBottom:'1px solid #E4E8EF'}}>
          <span style={{fontSize:12,color:'#9CA3AF'}}>Role</span>
          <span className="badge badge-neutral">{user.role?.replace('_',' ')}</span>
        </div>
        <div style={{display:'flex',justifyContent:'space-between',padding:'12px 0',borderBottom:'1px solid #E4E8EF'}}>
          <span style={{fontSize:12,color:'#9CA3AF'}}>2FA Enabled</span>
          <span style={{fontSize:12,fontWeight:600,color:'#9CA3AF'}}>{user.requires_2fa?'Yes':'No'}</span>
        </div>
        <div style={{display:'flex',justifyContent:'space-between',padding:'12px 0'}}>
          <span style={{fontSize:12,color:'#9CA3AF'}}>Account Status</span>
          <span className="badge badge-green">Active</span>
        </div>
      </div>
      <div style={{marginTop:14,display:'flex',gap:8}}>
        <button className="nlc-btn-ghost" style={{flex:1}}>Change Password</button>
        <button className="nlc-btn-ghost" style={{flex:1}}>Setup 2FA</button>
      </div>
    </div>
  )
}
