"use client"
import { useState, useEffect } from 'react'
import { rulesApi } from '@/lib/api'

export default function RulesPage() {
  const _user = typeof window !== 'undefined' ? getUser() : null
  if (_user && !_user.role?.includes('ADMIN') && !_user.role?.includes('SUPER')) {
    return <div style={{padding:60,textAlign:'center',color:'#B91C1C'}}>⛔ Access Denied — Rules Engine is admin only</div>
  }

  const [rules, setRules] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')

  useEffect(() => { load() }, [])
  const load = async () => {
    try { const data = await rulesApi.list(); setRules(data) }
    catch(e) { console.error(e) }
    finally { setLoading(false) }
  }

  if (loading) return <div style={{padding:40,color:'var(--white-3)'}}>Loading rules...</div>

  const filtered = filter==='ALL' ? rules : rules.filter(r=>r.rule_id.startsWith(filter))
  const blackCount = rules.filter(r=>r.is_black_override).length
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

      <div className="nlc-card">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
          <div className="sec-lbl gold" style={{margin:0,border:'none',padding:0}}>ILRMF Rule Registry — {filtered.length} Rules</div>
          <select style={{padding:'6px 12px',borderRadius:6,border:'1px solid var(--border2)',fontSize:11,background:'var(--surface)'}} value={filter} onChange={e=>setFilter(e.target.value)}>
            <option value="ALL">All Modules</option>
            {modules.map(m=><option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div style={{overflowX:'auto'}}>
          <table className="nlc-table" style={{minWidth:700}}>
            <thead><tr><th>Rule ID</th><th>Name</th><th>Statutory Basis</th><th>Score</th><th>Severity</th><th>BLACK</th></tr></thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.rule_id}>
                  <td className="font-mono" style={{fontWeight:700,color:'var(--teal)',fontSize:11}}>{r.rule_id}</td>
                  <td style={{fontWeight:600,color:'var(--navy)'}}>{r.rule_name}</td>
                  <td style={{fontSize:10,color:'var(--text3)',maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.statutory_basis}</td>
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
