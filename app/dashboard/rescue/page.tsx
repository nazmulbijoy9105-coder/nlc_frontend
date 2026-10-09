"use client"
import { useState, useEffect } from 'react'
import { rescueApi } from '@/lib/api'

export default function RescuePage() {
  const [plans, setPlans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])
  const load = async () => {
    try { const data = await rescueApi.list(); setPlans(Array.isArray(data)?data:[]) }
    catch(e) { console.error(e) }
    finally { setLoading(false) }
  }

  if (loading) return <div style={{padding:40,color:'var(--white-3)'}}>Loading rescue cases...</div>

  // Extract steps from the most recent plan (finding-driven rescue per R-014)
  const latestPlan = plans[0]
  const steps: any[] = latestPlan?.steps || []

  return (
    <div style={{padding:24}}>
      <div style={{marginBottom:22}}>
        <div className="font-garamond" style={{fontSize:22,color:'var(--nlc-white)',marginBottom:4}}>Default Rescue Roadmap</div>
        <div style={{fontSize:12,color:'var(--white-3)'}}>Structured remediation for companies in default</div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14,marginBottom:20}}>
        {[
          ['Rescue Cases', plans.length, 'var(--red)'],
          ['Total Steps', steps.length, 'var(--navy-3)'],
          ['High Priority', steps.filter((s: any) => s.complexity === 'HIGH' || s.complexity === 'CRITICAL').length, 'var(--red)'],
          ['Est. Timeline', steps.length > 0 ? `${steps.reduce((a: number, s: any) => a + (s.estimated_days_max || 0), 0)} days` : 'N/A', 'var(--yellow)']
        ].map(([l,v,c])=>(
          <div key={l as string} className="nlc-card" style={{borderTop:`3px solid ${String(c)}`,textAlign:'center'}}>
            <div className="font-garamond" style={{fontSize:26,color:String(c),lineHeight:1}}>{v}</div>
            <div className="font-mono" style={{fontSize:9,color:'var(--text3)',marginTop:4,letterSpacing:'.1em',textTransform:'uppercase'}}>{l}</div>
          </div>
        ))}
      </div>
      <div className="nlc-card">
        <div className="sec-lbl gold">Mandatory Rescue Sequence</div>
        {steps.map((s: any, i: number) => (
          <div key={i} style={{border:'1px solid var(--border)',borderRadius:9,borderLeft:'4px solid var(--navy)',marginBottom:8,overflow:'hidden'}}>
            <div style={{display:'grid',gridTemplateColumns:'44px 1fr auto auto',gap:14,padding:'14px 18px',alignItems:'center'}}>
              <div style={{width:34,height:34,borderRadius:'50%',background:'linear-gradient(135deg,var(--navy-3),var(--navy))',display:'flex',alignItems:'center',justifyContent:'center'}}>
                <span style={{color:'var(--gold)',fontWeight:700,fontFamily:"'DM Serif Display',serif"}}>{s.step_number || i + 1}</span>
              </div>
              <div>
                <div style={{fontSize:13,fontWeight:600,color:'var(--navy)'}}>{s.step_title || s.title}</div>
                <div style={{fontSize:11,color:'var(--text2)',marginTop:3}}>{s.step_description || s.desc}</div>
              </div>
              <span className="font-mono" style={{fontSize:9.5,fontWeight:700,padding:'3px 9px',borderRadius:4,background:(s.complexity||'').includes('HIGH')?'var(--redl)':s.complexity==='MEDIUM'?'var(--yellowl)':'var(--greenl)',color:(s.complexity||'').includes('HIGH')?'var(--red)':s.complexity==='MEDIUM'?'var(--yellow)':'var(--green)'}}>{s.complexity || s.comp}</span>
              <span className="font-mono" style={{fontSize:11,color:'var(--text2)',minWidth:80,textAlign:'right'}}>{s.estimated_days_min && s.estimated_days_max ? `${s.estimated_days_min}-${s.estimated_days_max}d` : (s.est || 'N/A')}</span>
            </div>
            <div style={{padding:'10px 18px 14px 76px',background:'var(--surface)',borderTop:'1px solid var(--border)'}}>
              <span style={{fontSize:11,color:'var(--text2)'}}>Basis: </span><span className="font-mono" style={{fontSize:11,color:'var(--teal)'}}>{s.statutory_basis || s.rule || 'N/A'}</span>
              <span style={{fontSize:11,color:'var(--text2)',marginLeft:20}}>Status: </span><strong style={{fontSize:11}}>{s.step_status || 'PENDING'}</strong>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
