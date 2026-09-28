"use client"
import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { isAuthenticated, getUser, clearAuth } from '@/lib/auth'

const adminNav = [
  { section: 'Main', items: [
    { label: 'Dashboard', icon: '◈', href: '/dashboard' },
    { label: 'Companies', icon: '⊞', href: '/dashboard/companies' },
    { label: 'Filings', icon: '📋', href: '/dashboard/filings' },
    { label: 'Rescue Cases', icon: '⚑', href: '/dashboard/rescue' },
  ]},
  { section: 'Intelligence', items: [
    { label: 'Revenue Intel', icon: '◎', href: '/dashboard/commercial' },
    { label: 'Documents', icon: '◻', href: '/dashboard/documents' },
  ]},
  { section: 'System', items: [
    { label: 'Admin', icon: '⚙', href: '/dashboard/admin' },
    { label: 'Rules Engine', icon: '⚖', href: '/dashboard/rules' },
    { label: 'My Profile', icon: '◆', href: '/dashboard/profile' },
  ]},
]

const clientNav = [
  { section: 'My Company', items: [
    { label: 'Dashboard', icon: '◈', href: '/dashboard' },
    { label: 'My Company', icon: '⊞', href: '/dashboard/companies' },
    { label: 'Filings', icon: '📋', href: '/dashboard/filings' },
    { label: 'Rescue Plan', icon: '⚑', href: '/dashboard/rescue' },
  ]},
  { section: 'Documents', items: [
    { label: 'Documents', icon: '◻', href: '/dashboard/documents' },
    { label: 'My Profile', icon: '◆', href: '/dashboard/profile' },
  ]},
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    if (!isAuthenticated()) { router.push('/'); return }
    setUser(getUser())
  }, [router])

  if (!user) return <div style={{padding:40,color:'#9CA3AF'}}>Loading...</div>

  const isClient = user.role?.includes('CLIENT')
  const nav = isClient ? clientNav : adminNav
  const handleLogout = () => { clearAuth(); router.push('/') }
  const initials = user?.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || 'U'

  return (
    <div style={{display:'flex',minHeight:'100vh',overflow:'hidden'}}>
      <aside style={{width:232,minHeight:'100vh',background:'#07172B',display:'flex',flexDirection:'column',flexShrink:0,borderRight:'1px solid rgba(255,255,255,.04)'}}>
        <div style={{padding:'24px 20px 20px',borderBottom:'1px solid rgba(255,255,255,.06)'}}>
          <div className="font-garamond" style={{fontSize:18,color:'#C9A84C',letterSpacing:'.02em',lineHeight:1.15}}>
            Neum Lex
            <span style={{display:'block',fontSize:10,color:'#E2C46A',letterSpacing:'.18em',fontFamily:"'JetBrains Mono',monospace",marginTop:3,opacity:.7}}>COUNSEL</span>
          </div>
          <div style={{fontSize:9,color:'rgba(255,255,255,.22)',letterSpacing:'.12em',fontFamily:"'JetBrains Mono',monospace",textTransform:'uppercase',marginTop:6}}>
            {isClient ? 'Client Portal' : 'RJSC Intelligence'}
          </div>
        </div>
        <nav style={{flex:1,padding:'12px 8px'}}>
          {nav.map(group => (
            <div key={group.section}>
              <div style={{fontSize:8.5,color:'rgba(255,255,255,.2)',letterSpacing:'.14em',fontFamily:"'JetBrains Mono',monospace",textTransform:'uppercase',padding:'14px 12px 6px'}}>{group.section}</div>
              {group.items.map(item => {
                const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
                return (
                  <button key={item.href} onClick={() => router.push(item.href)} style={{width:'100%',padding:'9px 12px',display:'flex',alignItems:'center',gap:10,background:active?'rgba(201,168,76,.12)':'transparent',border:'none',borderRadius:7,color:active?'#E2C46A':'rgba(255,255,255,.45)',cursor:'pointer',textAlign:'left',fontSize:12.5,fontFamily:"'DM Sans',sans-serif",fontWeight:active?600:500,marginBottom:1,transition:'all .15s'}}>
                    <span style={{fontSize:13,width:16,textAlign:'center',opacity:active?1:.8}}>{item.icon}</span>{item.label}
                  </button>
                )
              })}
            </div>
          ))}
        </nav>
        <div style={{padding:'14px 16px',borderTop:'1px solid rgba(255,255,255,.06)'}}>
          <div style={{color:'rgba(255,255,255,.28)',fontSize:10,marginTop:10,fontFamily:"'JetBrains Mono',monospace",lineHeight:1.6}}>
            <span style={{color:'#C9A84C'}}>●</span> {user.role?.replace('_',' ')}<br/>{user.email}
          </div>
          <button onClick={handleLogout} style={{width:'100%',padding:'8px 12px',marginTop:10,background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.08)',borderRadius:6,color:'rgba(255,255,255,.4)',fontSize:11,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",transition:'all .15s'}}>← Sign Out</button>
        </div>
      </aside>
      <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
        <header style={{height:58,background:'#0E2340',borderBottom:'1px solid #2a3f6b',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 28px',flexShrink:0}}>
          <div className="font-garamond" style={{fontSize:15,fontWeight:600,color:'#f4f1ea',letterSpacing:'.02em'}}>
            {nav.flatMap(g=>g.items).find(i=>pathname===i.href||(i.href!=='/dashboard'&&pathname.startsWith(i.href)))?.label||'Dashboard'}
          </div>
          <div style={{display:'flex',alignItems:'center',gap:16}}>
            <div style={{width:32,height:32,borderRadius:'50%',background:'linear-gradient(135deg,#16325A,#07172B)',display:'flex',alignItems:'center',justifyContent:'center',border:'2px solid #C9A84C',boxShadow:'0 0 0 2px rgba(201,168,76,.2)'}}>
              <span style={{color:'#C9A84C',fontSize:10,fontWeight:700,fontFamily:"'JetBrains Mono',monospace"}}>{initials}</span>
            </div>
          </div>
        </header>
        <main style={{flex:1,overflow:'auto',background:'#07172B'}}>{children}</main>
        <footer style={{padding:'9px 24px',borderTop:'1px solid #2a3f6b',background:'#0E2340',fontSize:10,color:'rgba(255,255,255,.25)',display:'flex',justifyContent:'space-between',fontFamily:"'JetBrains Mono',monospace"}}>
          <span>NEUM LEX COUNSEL ∙ RJSC Compliance Intelligence ∙ v1.0</span>
          <span>Intelligence only — not legal advice ∙ CONFIDENTIAL</span>
        </footer>
      </div>
    </div>
  )
}
