"use client"
import { useState, useEffect } from 'react'
import { rulesApi } from '@/lib/api'
import { getUser } from '@/lib/auth'

const verificationStyles: Record<string, { label: string; color: string; background: string; border: string }> = {
  VERIFIED: { label: 'Citation verified', color: '#166534', background: '#F0FDF4', border: '#BBF7D0' },
  PENDING: { label: 'Pending review', color: '#92400E', background: '#FFFBEB', border: '#FDE68A' },
  DISPUTED: { label: 'Disputed', color: '#991B1B', background: '#FEF2F2', border: '#FECACA' },
}

export default function RulesPage() {
  const [rules, setRules] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')

  useEffect(() => {
    const load = async () => {
      try { const data = await rulesApi.list(); setRules(data) }
      catch(e) { console.error(e) }
      finally { setLoading(false) }
    }
    load()
  }, [])

  const _user = typeof window !== 'undefined' ? getUser() : null
  if (_user && _user.role !== 'SUPER_ADMIN') {
    return <div style={{padding:60,textAlign:'center',color:'#B91C1C'}}>⛔ Access Denied — Rules Engine is admin only</div>
  }

  if (loading) return <div style={{padding:40,color:'var(--white-3)'}}>Loading rules...</div>

  const filtered = filter==='ALL' ? rules : rules.filter(r=>r.rule_id.startsWith(filter))
  const blackCount = rules.filter(r=>r.is_black_override).length
  const pendingCount = rules.filter(r=>(r.verification_status || 'PENDING').toUpperCase() !== 'VERIFIED').length
  const modules = [...new Set(rules.map(r=>r.rule_id.split('-')[0]))].sort()

  return (
    <div style={{padding:24}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:20}}>
        <div>
          <div className="font-garamond" style={{fontSize:22,color:'var(--nlc-white)',marginBottom:4}}>Legal Rule Manager</div>
          <div style={{fontSize:12,color:'var(--red)',fontWeight:600}}>SUPER ADMIN ONLY — Every modification logged</div>
        </div>
        <div style={{padding:'8px 14px',background:'var(--red-bg)',border:'1px solid rgba(160,48,48,.3)',borderRadius:7,fontSize:11,color:'var(--red)',fontWeight:700,fontFamily:"'JetBrains Mono',monospace"}}>AI CANNOT MODIFY RULES</div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14,marginBottom:18}}>
        {[['Total Rules',rules.length,'var(--navy-3)'],['Black Overrides',blackCount,'#0A0A0A'],['Modules',modules.length,'var(--teal)'],['Max Score',rules.reduce((s,r)=>s+(r.score_impact||0),0),'var(--red)']].map(([l,v,c])=>(
          <div key={l} className="nlc-card" style={{borderTop:`3px solid ${String(c)}`,textAlign:'center'}}>
            <div className="font-garamond" style={{fontSize:26,color:c,lineHeight:1}}>{v}</div>
            <div className="font-mono" style={{fontSize:9,color:'var(--text3)',marginTop:4,letterSpacing:'.1em',textTransform:'uppercase'}}>{l}</div>
          </div>
        ))}
      </div>

      <div style={{padding:'12px 14px',marginBottom:16,border:'1px solid #FDE68A',borderLeft:'3px solid #D97706',borderRadius:8,background:'#FFFBEB',color:'#78350F',fontSize:12,lineHeight:1.55}}>
        <strong>Citation and legal release gate:</strong> {pendingCount} rule(s) are pending or disputed. “Active” means present in the rule catalogue; it does not mean counsel-approved or released for statutory scoring. Even a verified citation is not a legal opinion or proof of company-specific applicability.
      </div>

      <div className="nlc-card">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
          <div className="sec-lbl gold" style={{margin:0,border:'none',padding:0}}>ILRMF Rule Registry — {filtered.length} Rules</div>
          <select style={{padding:'6px 12px',borderRadius:6,border:'1px solid var(--border2)',fontSize:11,background:'var(--surface)'}} value={filter} onChange={e=>setFilter(e.target.value)}>
            <option value="ALL">All Modules</option>
            {modules.map(m=><option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div style={{overflowX:'auto'}}>
          <table className="nlc-table" style={{minWidth:1050}}>
            <thead><tr><th>Rule ID</th><th>Name</th><th>Statutory Basis</th><th>Effective Date</th><th>Citation Verification</th><th>Score</th><th>Severity</th><th>BLACK</th></tr></thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.rule_id}>
                  <td className="font-mono" style={{fontWeight:700,color:'var(--teal)',fontSize:11}}>{r.rule_id}</td>
                  <td style={{fontWeight:600,color:'var(--navy)'}}>{r.rule_name}</td>
                  <td style={{fontSize:10,color:'var(--text3)',maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.statutory_basis}</td>
                  <td className="font-mono" style={{fontSize:10,color:'var(--text3)',whiteSpace:'nowrap'}}>{r.statutory_effective_date || 'Not recorded'}</td>
                  <td>
                    {(() => {
                      const status = (r.verification_status || 'PENDING').toUpperCase()
                      const meta = verificationStyles[status] || verificationStyles.PENDING
                      return <div>
                        <span title={r.verified_at ? `Citation verification recorded on ${r.verified_at}` : 'No completed legal verification recorded'} style={{display:'inline-flex',alignItems:'center',padding:'4px 8px',borderRadius:999,border:`1px solid ${meta.border}`,background:meta.background,color:meta.color,fontSize:10,fontWeight:700,whiteSpace:'nowrap'}}>{meta.label}</span>
                        {r.verified_at && <div style={{fontSize:9,color:'var(--text3)',marginTop:3,whiteSpace:'nowrap'}}>Citation checked {r.verified_at}</div>}
                      </div>
                    })()}
                  </td>
                  <td className="font-mono" style={{fontWeight:700,color:'var(--navy)',textAlign:'center'}}>-{r.score_impact||0}</td>
                  <td><span className={`badge badge-${(r.default_severity||'YELLOW').toLowerCase()}`}>{r.default_severity}</span></td>
                  <td style={{textAlign:'center'}}>{r.is_black_override?'⚫':'—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
