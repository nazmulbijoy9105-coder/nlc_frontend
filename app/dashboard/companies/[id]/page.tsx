"use client"
import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { companiesApi, rescueApi } from '@/lib/api'

export default function CompanyProfilePage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [company, setCompany] = useState<any>(null)
  const [flags, setFlags] = useState<any[]>([])
  const [compliance, setCompliance] = useState<any>(null)
  const [rescuePlan, setRescuePlan] = useState<any>(null)
  const [scoreHistory, setScoreHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!id) return
    try {
      const [c, f, comp, rp, sh] = await Promise.all([
        companiesApi.get(id).catch(()=>null),
        companiesApi.violations(id).catch(()=>[]),
        companiesApi.modules(id).catch(()=>null),
        rescueApi.getActive(id).catch(()=>null),
        companiesApi.scoreHistory(id).catch(()=>[]),
      ])
      setCompany(c)
      setFlags(Array.isArray(f) ? f : [])
      setCompliance(comp)
      setRescuePlan(rp)
      setScoreHistory(Array.isArray(sh) ? sh : [])
    } catch(e) { console.error(e) }
    finally { setLoading(false) }
  }, [id])

  useEffect(() => { load() }, [load])

  if (loading) return <div style={{padding:40,color:'var(--white-3)'}}>Loading company...</div>
  if (!company) return <div style={{padding:40,color:'var(--white-3)'}}>Company not found</div>

  const score: number | null = compliance
    ? (compliance.current_score ?? null)
    : (company.compliance_score ?? null)
  const band = compliance?.risk_band || company.band || 'NOT_EVALUATED'
  const bandColor = band==='GREEN'?'#1a7a52':band==='YELLOW'?'#D97706':band==='RED'?'#B91C1C':band==='NOT_EVALUATED'?'#6B7280':'#A855F7'

  const _v = (val: any) => val === null || val === undefined ? '—' : String(val)
  const _b = (val: any) => val === true ? '✅' : val === false ? '❌' : '—'
  const _d = (val: any) => val ? new Date(val).toLocaleDateString('en-GB', {day:'2-digit',month:'short',year:'numeric'}) : '—'

  const sevColor = (s: string) => s==='BLACK'?'#A855F7':s==='RED'?'#B91C1C':s==='YELLOW'?'#D97706':'#6B7280'

  const blackFlags = flags.filter((f:any) => f.severity === 'BLACK')
  const redFlags = flags.filter((f:any) => f.severity === 'RED')
  const yellowFlags = flags.filter((f:any) => f.severity === 'YELLOW')
  const rescueSteps = rescuePlan?.steps || []

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%'}}>
      {/* Header */}
      <div style={{background:'var(--surface2)',borderBottom:'1px solid var(--border)',padding:'20px 28px'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
          <div>
            <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:8}}>
              <div className="font-garamond" style={{fontSize:22,color:'var(--navy)'}}>{company.name || company.company_name}</div>
              <span className={`badge badge-${band.toLowerCase()}`}>{band}</span>
              {company.is_dormant && <span className="badge badge-neutral">DORMANT</span>}
              {company.is_fdi_registered && <span className="badge badge-neutral">FDI</span>}
            </div>
            <div style={{display:'flex',gap:20,fontSize:11.5,color:'var(--text3)',fontFamily:"'JetBrains Mono', monospace"}}>
              <span>REG <strong style={{color:'var(--navy)'}}>{_v(company.registration_number)}</strong></span>
              <span>SCORE <strong style={{color:bandColor}}>{score === null ? 'Not evaluated' : `${score}/100`}</strong></span>
              <span>EVALUATED <strong style={{color:'var(--navy)'}}>{_d(company.last_evaluated_at || compliance?.last_evaluated_at)}</strong></span>
            </div>
          </div>
          <div style={{display:'flex',gap:10}}>
            <button className="nlc-btn-danger" onClick={()=>router.push('/dashboard/rescue')}>Rescue Plan</button>
            <button className="nlc-btn-primary" onClick={async()=>{try{await companiesApi.evaluate(id);load()}catch(e){alert('Re-evaluation failed: '+(e as Error).message)}}}>Re-evaluate</button>
          </div>
        </div>
      </div>

      {/* 3-column layout */}
      <div style={{display:'grid',gridTemplateColumns:'280px 1fr 300px',flex:1,overflow:'hidden'}}>

        {/* ═══ LEFT: Score + Company Info ═══ */}
        <div style={{borderRight:'1px solid var(--border)',padding:20,background:'var(--surface)',overflowY:'auto'}}>
          {/* Score Gauge */}
          <div style={{textAlign:'center',marginBottom:16}}>
            <svg width="160" height="100" viewBox="0 0 160 100">
              <path d="M 13 90 A 67 67 0 0 1 147 90" fill="none" stroke="#E4E8EF" strokeWidth="8" strokeLinecap="round"/>
              <path d="M 13 90 A 67 67 0 0 1 147 90" fill="none" stroke={bandColor} strokeWidth="8" strokeLinecap="round" strokeDasharray={`${((score ?? 0)/100)*105} 105`}/>
              <text x="80" y="80" textAnchor="middle" fontSize="32" fontWeight="700" fill={bandColor} fontFamily="'DM Serif Display',serif">{score === null ? '—' : score}</text>
              <text x="80" y="95" textAnchor="middle" fontSize="9" fill="#9CA3AF">/ 100</text>
            </svg>
          </div>

          {/* Flag Counts */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:16}}>
            {[['BLACK', blackFlags.length || company.black_flags || 0, '#A855F7'],
              ['RED', redFlags.length || company.red_flags || 0, '#B91C1C'],
              ['YELLOW', yellowFlags.length || company.yellow_flags || 0, '#D97706'],
              ['TOTAL', flags.length || company.active_flags || company.violation_count || 0, '#6B7280'],
            ].map(([label,count,color]) => (
              <div key={label as string} className="nlc-card" style={{padding:'10px 12px',textAlign:'center'}}>
                <div style={{fontSize:20,fontWeight:700,color:color as string,fontFamily:"'DM Serif Display',serif"}}>{count}</div>
                <div style={{fontSize:9,color:'var(--text3)',letterSpacing:'.1em'}}>{label}</div>
              </div>
            ))}
          </div>

          {/* Company Info — ALL fields from CompanyResponse */}
          <div className="nlc-card" style={{marginBottom:12}}>
            <div className="sec-lbl">Company Info</div>
            {[
              ['Type', _v(company.company_type)],
              ['Status', _v(company.company_status)],
              ['Incorporated', _d(company.incorporation_date)],
              ['FY End', company.financial_year_end ? _d(company.financial_year_end) : '—'],
              ['Reg. Number', _v(company.registration_number)],
              ['Address', _v(company.registered_address)],
              ['Revenue Tier', _v(company.revenue_tier)],
              ['FDI Registered', _b(company.is_fdi_registered)],
              ['Dormant', _b(company.is_dormant)],
              ['Directors', company.director_count != null ? String(company.director_count) : '—'],
              ['Created', _d(company.created_at)],
            ].map(([k,v]) => (
              <div key={k} style={{display:'flex',justifyContent:'space-between',padding:'7px 0',borderBottom:'1px solid var(--border)'}}>
                <span style={{fontSize:11.5,color:'var(--text3)'}}>{k}</span>
                <span style={{fontSize:11.5,fontWeight:600,color:'var(--navy)',textAlign:'right',maxWidth:160,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ═══ CENTER: Flags + Rescue Plan + Score History ═══ */}
        <div style={{padding:20,overflowY:'auto',background:'var(--surface2)'}}>
          {/* Compliance Flags */}
          <div className="nlc-card" style={{marginBottom:14}}>
            <div className="sec-lbl">Compliance Flags ({flags.length})</div>
            {flags.length === 0 ? (
              <div style={{padding:20,textAlign:'center',color:'var(--text3)',fontSize:12}}>No active flags — company is compliant ✅</div>
            ) : (
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                {flags.map((f,i) => (
                  <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',background:'var(--surface)',borderRadius:6,borderLeft:`3px solid ${sevColor(f.severity)}`}}>
                    <span style={{fontSize:10,fontWeight:700,color:sevColor(f.severity),minWidth:50}}>{f.severity}</span>
                    <div style={{flex:1}}>
                      <div style={{fontSize:12,fontWeight:600,color:'var(--navy)'}}>{f.rule_name || f.rule_id}</div>
                      <div style={{fontSize:10,color:'var(--text3)'}}>Impact: -{f.score_impact} pts • {f.rule_id}</div>
                    </div>
                    {f.is_black_override && <span style={{fontSize:9,color:'#A855F7',fontWeight:700}}>BLACK OVERRIDE</span>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Rescue Plan */}
          {rescuePlan && rescueSteps.length > 0 && (
            <div className="nlc-card" style={{marginBottom:14}}>
              <div className="sec-lbl">Rescue Plan — {rescueSteps.length} Steps</div>
              <div style={{height:6,background:'#E4E8EF',borderRadius:3,marginBottom:12,overflow:'hidden'}}>
                <div style={{height:'100%',width:`${(rescueSteps.filter((s:any)=>s.is_completed).length/rescueSteps.length)*100}%`,background:'var(--teal)',borderRadius:3}} />
              </div>
              {rescueSteps.map((step:any,i:number) => (
                <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 0',borderBottom:'1px solid var(--border)'}}>
                  <div style={{width:22,height:22,borderRadius:'50%',border:`2px solid ${step.is_completed?'var(--teal)':'var(--border)'}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,color:step.is_completed?'var(--teal)':'var(--text3)'}}>
                    {step.is_completed ? '✓' : i+1}
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:12,fontWeight:600,color:'var(--navy)'}}>{step.step_name || step.title}</div>
                    <div style={{fontSize:10,color:'var(--text3)'}}>{step.priority} • {step.min_days}-{step.max_days} days</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Score History */}
          {scoreHistory.length > 0 && (
            <div className="nlc-card" style={{marginBottom:14}}>
              <div className="sec-lbl">Score History</div>
              <div style={{display:'flex',alignItems:'flex-end',gap:4,height:60,padding:'8px 0'}}>
                {scoreHistory.slice(-12).map((h,i) => {
                  const s = h.score ?? h.compliance_score ?? 0
                  return (
                    <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'flex-end'}}>
                      <div style={{width:'100%',height:`${Math.max(s,2)}%`,background:s>=70?'#1a7a52':s>=40?'#D97706':'#B91C1C',borderRadius:2,minHeight:2}} title={`${s}/100`} />
                      {i === scoreHistory.slice(-12).length-1 && <div style={{fontSize:9,color:'var(--text3)',marginTop:2}}>{s}</div>}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Disclaimer */}
          {compliance?.disclaimer && (
            <div style={{fontSize:10,color:'var(--text3)',fontStyle:'italic',padding:'8px 0'}}>
              {compliance.disclaimer}
            </div>
          )}
        </div>

        {/* ═══ RIGHT: Tax + Governance + Services ═══ */}
        <div style={{borderLeft:'1px solid var(--border)',padding:20,background:'var(--surface)',overflowY:'auto'}}>

          {/* Tax & Regulatory */}
          <div className="nlc-card" style={{marginBottom:12}}>
            <div className="sec-lbl">Tax & Regulatory</div>
            {[
              ['Tax Return Filed', _b(company.tax_return_filed_for_current_fy)],
              ['Adv Tax Q1', _b(company.advance_tax_q1_paid)],
              ['Adv Tax Q2', _b(company.advance_tax_q2_paid)],
              ['Adv Tax Q3', _b(company.advance_tax_q3_paid)],
              ['Adv Tax Q4', _b(company.advance_tax_q4_paid)],
              ['Trade License', _b(company.trade_license_obtained)],
              ['License Expiry', company.trade_license_expiry ? _d(company.trade_license_expiry) : '—'],
            ].map(([k,v]) => (
              <div key={k} style={{display:'flex',justifyContent:'space-between',padding:'7px 0',borderBottom:'1px solid var(--border)'}}>
                <span style={{fontSize:11,color:'var(--text3)'}}>{k}</span>
                <span style={{fontSize:11,fontWeight:600,color: String(v).includes('✅')?'var(--teal)':String(v).includes('❌')?'#B91C1C':'var(--navy)'}}>{v}</span>
              </div>
            ))}
          </div>

          {/* Governance */}
          <div className="nlc-card" style={{marginBottom:12}}>
            <div className="sec-lbl">Governance</div>
            {[
              ['Directors', company.director_count != null ? String(company.director_count) : '—'],
              ['Disqualified', _b(company.any_director_disqualified)],
              ['Penalty Notices', _v(company.penalty_notices_received)],
              ['Penalties Resolved', _v(company.penalty_notices_resolved)],
            ].map(([k,v]) => (
              <div key={k} style={{display:'flex',justifyContent:'space-between',padding:'7px 0',borderBottom:'1px solid var(--border)'}}>
                <span style={{fontSize:11,color:'var(--text3)'}}>{k}</span>
                <span style={{fontSize:11,fontWeight:600,color:'var(--navy)'}}>{v}</span>
              </div>
            ))}
          </div>

          {/* Service Assessment */}
          <div className="nlc-card" style={{marginBottom:12,borderTop: band==='BLACK'||band==='RED' ? '3px solid #B91C1C' : band==='YELLOW' ? '3px solid #D97706' : '3px solid var(--teal)'}}>
            <div className="sec-lbl">Recommended Services</div>
            {(band === 'BLACK' || band === 'RED') && (
              <>
                <div style={{fontSize:11,color:'var(--navy)',fontWeight:600,paddingBottom:4}}>Corporate Rescue</div>
                <div style={{fontSize:10,color:'var(--text3)',marginBottom:8}}>Full remediation: directors, AGM, audit, tax, legal defense</div>
              </>
            )}
            {band === 'YELLOW' && (
              <>
                <div style={{fontSize:11,color:'var(--navy)',fontWeight:600,paddingBottom:4}}>Structured Regularization</div>
                <div style={{fontSize:10,color:'var(--text3)',marginBottom:8}}>Retrospective audit, filing remediation, compliance restoration</div>
              </>
            )}
            {band === 'GREEN' && (
              <>
                <div style={{fontSize:11,color:'var(--navy)',fontWeight:600,paddingBottom:4}}>Compliance Package</div>
                <div style={{fontSize:10,color:'var(--text3)',marginBottom:8}}>Annual monitoring, statutory filings, document generation</div>
              </>
            )}
            <div style={{fontSize:10,color:'var(--text3)',paddingTop:4,borderTop:'1px solid var(--border)'}}>
              Revenue Tier: <strong style={{color:'var(--navy)'}}>{_v(company.revenue_tier)}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
