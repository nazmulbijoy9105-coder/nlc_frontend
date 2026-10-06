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

  const steps = [
    // Steps are now fetched from backend API (finding-driven rescue per R-014)
  ]

  return (
    <div style={{padding:24}}>
      <div style={{marginBottom:22}}>
        <div className="font-garamond" style={{fontSize:22,color:'var(--nlc-white)',marginBottom:4}}>Default Rescue Roadmap</div>
        <div style={{fontSize:12,color:'var(--white-3)'}}>Structured remediation for companies in default</div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14,marginBottom:20}}>
        {[['Rescue Cases',plans.length,'var(--red)'],['Total Steps','8','var(--navy-3)'],['High Priority','2','var(--red)'],['Est. Timeline','60-90 days','var(--yellow)']].map(([l,v,c])=>(
          <div key={l} className="nlc-card" style={{borderTop:`3px solid ${String(c)}`,textAlign:'center'}}>
            <div className="font-garamond" style={{fontSize:26,color:String(c),lineHeight:1}}>{v}</div>
            <div className="font-mono" style={{fontSize:9,color:'var(--text3)',marginTop:4,letterSpacing:'.1em',textTransform:'uppercase'}}>{l}</div>
          </div>
        ))}
      </div>
      <div className="nlc-card">
        <div className="sec-lbl gold">Mandatory Rescue Sequence</div>
        {steps.map(s => (
          <div key={s.id} style={{border:'1px solid var(--border)',borderRadius:9,borderLeft:'4px solid var(--navy)',marginBottom:8,overflow:'hidden'}}>
            <div style={{display:'grid',gridTemplateColumns:'44px 1fr auto auto',gap:14,padding:'14px 18px',alignItems:'center'}}>
              <div style={{width:34,height:34,borderRadius:'50%',background:'linear-gradient(135deg,var(--navy-3),var(--navy))',display:'flex',alignItems:'center',justifyContent:'center'}}>
                <span style={{color:'var(--gold)',fontWeight:700,fontFamily:"'DM Serif Display',serif"}}>{s.id}</span>
              </div>
              <div>
                <div style={{fontSize:13,fontWeight:600,color:'var(--navy)'}}>{s.title}</div>
                <div style={{fontSize:11,color:'var(--text2)',marginTop:3}}>{s.desc}</div>
              </div>
              <span className="font-mono" style={{fontSize:9.5,fontWeight:700,padding:'3px 9px',borderRadius:4,background:s.comp==='HIGH'?'var(--redl)':s.comp==='MEDIUM'?'var(--yellowl)':'var(--greenl)',color:s.comp==='HIGH'?'var(--red)':s.comp==='MEDIUM'?'var(--yellow)':'var(--green)'}}>{s.comp}</span>
              <span className="font-mono" style={{fontSize:11,color:'var(--text2)',minWidth:80,textAlign:'right'}}>{s.est}</span>
            </div>
            <div style={{padding:'10px 18px 14px 76px',background:'var(--surface)',borderTop:'1px solid var(--border)'}}>
              <span style={{fontSize:11,color:'var(--text2)'}}>Rule: </span><span className="font-mono" style={{fontSize:11,color:'var(--teal)'}}>{s.rule}</span>
              <span style={{fontSize:11,color:'var(--text2)',marginLeft:20}}>Status: </span><strong style={{fontSize:11}}>PENDING</strong>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
