"use client"
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { companiesApi } from '@/lib/api'

export default function CompanyProfilePage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [company, setCompany] = useState<any>(null)
  const [flags, setFlags] = useState<any[]>([])
  const [compliance, setCompliance] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { if(id) load() }, [id])
  const load = async () => {
    try {
      const [c, f, comp] = await Promise.all([
        companiesApi.get(id).catch(()=>null),
        companiesApi.violations(id).catch(()=>[]),
        companiesApi.modules(id).catch(()=>null),
      ])
      setCompany(c); setFlags(f||[]); setCompliance(comp)
    } catch(e) { console.error(e) }
    finally { setLoading(false) }
  }

  if (loading) return <div style={{padding:40,color:'var(--white-3)'}}>Loading company...</div>
  if (!company) return <div style={{padding:40,color:'var(--white-3)'}}>Company not found</div>

  const score = compliance?.current_score || compliance?.compliance_score || 0 ?? company.compliance_score || company.current_compliance_score ?? 0
  const band = compliance?.risk_band || compliance?.band ?? company.band || company.current_risk_band ?? 'GREEN'
  const bandColor = band==='GREEN'?'#1a7a52':band==='YELLOW'?'#D97706':band==='RED'?'#B91C1C':'#0A0A0A'

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%'}}>
      {/* Header */}
      <div style={{background:'var(--surface2)',borderBottom:'1px solid var(--border)',padding:'20px 28px'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
          <div>
            <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:8}}>
              <div className="font-garamond" style={{fontSize:22,color:'var(--navy)'}}>{company.company_name || company.name || company.name}</div>
              <span className={`badge badge-${band.toLowerCase()}`}>{band}</span>
            </div>
            <div style={{display:'flex',gap:20,fontSize:11.5,color:'var(--text3)',fontFamily:"'JetBrains Mono', monospace"}}>
              <span>REG <strong style={{color:'var(--navy)'}}>{company.rjsc_registration_number || '—'}</strong></span>
              <span>SCORE <strong style={{color:bandColor}}>{score}/100</strong></span>
            </div>
          </div>
          <div style={{display:'flex',gap:10}}>
            <button className="nlc-btn-danger" onClick={()=>router.push('/dashboard/rescue')}>Rescue Plan</button>
            <button className="nlc-btn-primary" onClick={async()=>{await companiesApi.evaluate(id);load()}}>Re-evaluate</button>
          </div>
        </div>
      </div>

      {/* 3-column layout */}
      <div style={{display:'grid',gridTemplateColumns:'252px 1fr 272px',flex:1,overflow:'hidden'}}>
        {/* Left: Score gauge + info */}
        <div style={{borderRight:'1px solid var(--border)',padding:20,background:'var(--surface)',overflowY:'auto'}}>
          <div style={{textAlign:'center',marginBottom:16}}>
            <svg width="160" height="100" viewBox="0 0 160 100">
              <path d="M 13 90 A 67 67 0 0 1 147 90" fill="none" stroke="#E4E8EF" strokeWidth="8" strokeLinecap="round"/>
              <path d="M 13 90 A 67 67 0 0 1 147 90" fill="none" stroke={bandColor} strokeWidth="8" strokeLinecap="round" strokeDasharray={`${(score/100)*105} 105`}/>
              <text x="80" y="80" textAnchor="middle" fontSize="32" fontWeight="700" fill={bandColor} fontFamily="'DM Serif Display',serif">{score}</text>
            </svg>
          </div>
          <div className="nlc-card" style={{marginBottom:12}}>
            <div className="sec-lbl">Company Info</div>
            {[['Type',company.company_type||'Private Ltd'],['Auth Capital',company.authorized_capital_bdt?`BDT ${company.authorized_capital_bdt}`:'—'],['Paid-up',company.paid_up_capital_bdt?`BDT ${company.paid_up_capital_bdt}`:'—']].map(([k,v])=>(
              <div key={k} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid var(--border)'}}>
                <span style={{fontSize:11.5,color:'var(--text3)'}}>{k}</span><span style={{fontSize:11.5,fontWeight:600,color:'var(--navy)'}}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Center: Flags */}
        <div style={{padding:20,overflowY:'auto'}}>
          <div className="sec-lbl gold">Active Compliance Flags ({flags.length})</div>
          {flags.length === 0 ? (
            <div className="nlc-card" style={{textAlign:'center',padding:30}}>
              <div style={{fontSize:14,color:'var(--green)',fontWeight:600}}>✓ No active violations</div>
              <div style={{fontSize:12,color:'var(--text3)',marginTop:4}}>Company is compliant</div>
            </div>
          ) : flags.map((f,i)=>(
            <div key={i} className="nlc-card" style={{marginBottom:8,borderLeft:`4px solid ${f.severity==='BLACK'?'#0A0A0A':f.severity==='RED'?'#B91C1C':f.severity==='YELLOW'?'#D97706':'var(--green)'}`}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                <span className="font-mono" style={{fontSize:11,fontWeight:700,color:'var(--teal)'}}>{f.rule_id}</span>
                <span className={`badge badge-${(f.severity||'YELLOW').toLowerCase()}`}>{f.severity}</span>
              </div>
              <div style={{fontSize:12,color:'var(--navy)',fontWeight:500}}>{f.rule_name || f.description || f.flag_code}</div>
              <div style={{fontSize:10,color:'var(--text3)',marginTop:2}}>{f.statutory_basis || ''}</div>
              {f.score_impact ? <div style={{fontSize:10,color:'var(--red)',marginTop:2,fontFamily:"'JetBrains Mono',monospace"}}>-{f.score_impact} pts</div> : null}
            </div>
          ))}
        </div>

        {/* Right: Actions */}
        <div style={{borderLeft:'1px solid var(--border)',padding:20,background:'var(--surface)',overflowY:'auto'}}>
          <div className="nlc-card" style={{marginBottom:12}}>
            <div className="sec-lbl">Quick Actions</div>
            <button className="nlc-btn-danger" style={{width:'100%',marginBottom:8}} onClick={()=>router.push('/dashboard/rescue')}>Initiate Rescue</button>
            <button className="nlc-btn-ghost" style={{width:'100%',marginBottom:8}} onClick={()=>router.push('/dashboard/documents')}>Generate Document</button>
            <button className="nlc-btn-ghost" style={{width:'100%'}} onClick={()=>router.push('/dashboard/companies/'+id+'/edit')}>Edit Company</button>
          </div>
        </div>
      </div>
    </div>
  )
}
