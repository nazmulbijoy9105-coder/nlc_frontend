"use client"
import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ApiError, companiesApi, rescueApi } from '@/lib/api'
import { useCurrentUserRole } from '@/lib/use-current-user-role'

export default function CompanyProfilePage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const { role, loaded: roleLoaded } = useCurrentUserRole()
  const isClient = role === 'CLIENT_DIRECTOR' || role === 'CLIENT_VIEW_ONLY'
  const [loadError, setLoadError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [company, setCompany] = useState<any>(null)
  const [flags, setFlags] = useState<any[]>([])
  const [compliance, setCompliance] = useState<any>(null)
  const [rescuePlan, setRescuePlan] = useState<any>(null)
  const [scoreHistory, setScoreHistory] = useState<any[]>([])
  const [activity, setActivity] = useState<any[]>([])
  const [activityError, setActivityError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const loadRequest = useRef(0)

  const load = useCallback(async () => {
    if (!roleLoaded || !id) return;
    const requestId = ++loadRequest.current;
    setLoading(true);
    setLoadError(null);
    setActionError(null);
    setCompany(null);
    setFlags([]);
    setCompliance(null);
    setRescuePlan(null);
    setScoreHistory([]);
    setActivity([]);
    setActivityError(null);
    const results = await Promise.allSettled([
      companiesApi.get(id), companiesApi.violations(id), companiesApi.modules(id),
      rescueApi.getActive(id), companiesApi.scoreHistory(id), companiesApi.activity(id),
    ]);
    if (requestId !== loadRequest.current) return;
    const [companyResult, flagsResult, complianceResult, rescueResult, historyResult, activityResult] = results;
    if (companyResult.status === "rejected") {
      const error = companyResult.reason;
      setLoadError(error instanceof ApiError && error.status === 403
        ? "You do not have permission to view this company."
        : error instanceof Error ? error.message : "Could not load company details.");
      setLoading(false);
      return;
    }
    setCompany(companyResult.value);
    if (flagsResult.status === "fulfilled" && Array.isArray(flagsResult.value)) setFlags(flagsResult.value);
    else setLoadError("Company details loaded, but compliance flags could not be retrieved.");
    if (complianceResult.status === "fulfilled") setCompliance(complianceResult.value);
    else setLoadError((current) => current || "Compliance summary is temporarily unavailable.");
    if (rescueResult.status === "fulfilled") setRescuePlan(rescueResult.value);
    else {
      const expectedLegalGate = rescueResult.reason instanceof ApiError
        && rescueResult.reason.status === 503
        && rescueResult.reason.message.startsWith("Rescue plans are withheld until the underlying legal rules");
      const notFound = rescueResult.reason instanceof ApiError && rescueResult.reason.status === 404;
      if (!expectedLegalGate && !notFound) {
        setLoadError((current) => current || "Rescue plan status could not be verified.");
      }
    }
    if (historyResult.status === "fulfilled" && Array.isArray(historyResult.value)) setScoreHistory(historyResult.value);
    else setLoadError((current) => current || "Score history could not be retrieved.");
    if (activityResult.status === "fulfilled" && Array.isArray(activityResult.value)) setActivity(activityResult.value);
    else setActivityError("Company activity is temporarily unavailable.");
    setLoading(false);
  }, [id, roleLoaded])

  useEffect(() => {
    void Promise.resolve().then(load);
    return () => { loadRequest.current += 1; };
  }, [load])

  if (loading || !roleLoaded) return <div role="status" style={{padding:40,color:'var(--white-3)'}}>Loading company…</div>
  if (!company) {
    return (
      <div
        role="alert"
        style={{
          padding: 40,
          color: "var(--white-3)",
        }}
      >
        {loadError || "Company not found or access is unavailable."}
      </div>
    )
  }

  const band = compliance?.risk_band || company.band || 'NOT_EVALUATED'
  const score: number | null = band === 'NOT_EVALUATED'
    ? null
    : (compliance ? (compliance.current_score ?? null) : (company.compliance_score ?? null))
  const bandColor = band==='GREEN'?'#1a7a52':band==='YELLOW'?'#D97706':band==='RED'?'#B91C1C':band==='NOT_EVALUATED'?'#6B7280':'#A855F7'

  const _v = (val: any) => val === null || val === undefined ? '—' : String(val)
  const _b = (val: any) => val === true ? '✅' : val === false ? '❌' : '❓'
  const _d = (val: any) => val ? new Date(val).toLocaleDateString('en-GB', {day:'2-digit',month:'short',year:'numeric'}) : '—'

  const sevColor = (s: string) => s==='BLACK'?'#A855F7':s==='RED'?'#B91C1C':s==='YELLOW'?'#D97706':'#6B7280'
  const evaluationLabel = (flag: any) => {
    const state = flag.evaluation_state || flag.state || 'LEGACY_UNCLASSIFIED'
    if (state === 'REQUIRES_LAWYER_JUDGMENT') return 'LAWYER REVIEW REQUIRED'
    if (state === 'CONTRADICTORY') return 'CONTRADICTORY EVIDENCE'
    if (state === 'UNKNOWN' || flag.severity === 'NOT_EVALUATED') return 'NOT EVALUATED'
    return state.replaceAll('_', ' ')
  }

  const blackFlags = flags.filter((f:any) => f.severity === 'BLACK')
  const redFlags = flags.filter((f:any) => f.severity === 'RED')
  const yellowFlags = flags.filter((f:any) => f.severity === 'YELLOW')
  const rescueSteps = rescuePlan?.steps || []
  const releasedScoreHistory = scoreHistory.filter((entry: any) =>
    entry.risk_band !== 'NOT_EVALUATED'
    && !String(entry.evaluation_status || '').startsWith('NOT_EVALUATED')
    && typeof entry.score === 'number'
  )

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%'}}>
      {/* Header */}
      <div className="nlc-company-profile-header" style={{background:'var(--surface2)',borderBottom:'1px solid var(--border)',padding:'20px 28px'}}>
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
              <span>SCORE <strong style={{color:bandColor}}>{score === null ? (band === 'NOT_EVALUATED' ? 'Not released' : 'Not evaluated') : `${score}/100`}</strong>{compliance?.pre_override_score != null && compliance.pre_override_score !== score && score === 0 && <span style={{fontSize:10,color:'var(--text3)'}}> (underlying: {compliance.pre_override_score})</span>}</span>
              <span>EVALUATED <strong style={{color:'var(--navy)'}}>{_d(company.last_evaluated_at || compliance?.last_evaluated_at)}</strong></span>
            </div>
          </div>
          <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
            <button className="nlc-btn-secondary" onClick={()=>router.push('/dashboard/companies/' + id + '/articles')}>Articles Review</button>
            {!isClient && <button className="nlc-btn-danger" onClick={()=>router.push('/dashboard/rescue?company_id=' + id)}>Rescue Plan</button>}
            <button style={{background:'#0f233c',color:'#C9A84C',border:'1px solid rgba(201,168,76,.3)',padding:'8px 14px',borderRadius:7,fontSize:12,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}} onClick={async()=>{setActionError(null);try{await companiesApi.downloadPDF(id)}catch(e){setActionError(e instanceof Error?e.message:'PDF download failed.')}}}>Download PDF</button>
            {!isClient && <button className="nlc-btn-primary" onClick={async()=>{setActionError(null);try{await companiesApi.evaluate(id);await load()}catch(e){setActionError(e instanceof Error?e.message:'Re-evaluation failed.')}}}>Re-evaluate</button>}
          </div>
        </div>
      </div>

      {loadError && <div role="alert" style={{margin:'12px 20px',padding:'12px 16px',border:'1px solid #A94442',borderRadius:8,color:'#FCA5A5',fontSize:12}}>{loadError}</div>}
      {actionError && <div role="alert" style={{margin:'12px 20px',padding:'12px 16px',border:'1px solid #A94442',borderRadius:8,color:'#FCA5A5',fontSize:12}}>{actionError}</div>}
      {band === 'NOT_EVALUATED' && (
        <div role="status" style={{margin:'12px 20px',padding:'12px 16px',border:'1px solid #D6B65A',borderRadius:10,background:'rgba(214,182,90,0.08)',color:'var(--text)',fontSize:12,lineHeight:1.6}}>
          <strong>Authoritative compliance score not released.</strong> Product scoring is not currently released for this evaluation. Review signals remain separate from a published score and must not be treated as a legal opinion or compliance certificate.
        </div>
      )}

      {/* 3-column layout */}
      <div className="nlc-company-profile-grid" style={{display:'grid',gridTemplateColumns:'280px 1fr 300px',flex:1,overflow:'hidden'}}>

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
            {[['BLACK', band === 'NOT_EVALUATED' ? '—' : (blackFlags.length || company.black_flags || 0), '#A855F7'],
              ['RED', band === 'NOT_EVALUATED' ? '—' : (redFlags.length || company.red_flags || 0), '#B91C1C'],
              ['YELLOW', band === 'NOT_EVALUATED' ? '—' : (yellowFlags.length || company.yellow_flags || 0), '#D97706'],
              ['TOTAL', band === 'NOT_EVALUATED' ? '—' : (flags.length || company.active_flags || company.violation_count || 0), '#6B7280'],
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
              <div style={{padding:20,textAlign:'center',color:'var(--text3)',fontSize:12}}>No active review findings were returned. This does not establish compliance.</div>
            ) : (
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                {flags.map((f,i) => (
                  <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',background:'var(--surface)',borderRadius:6,borderLeft:`3px solid ${sevColor(f.severity)}`}}>
                    <span style={{fontSize:10,fontWeight:700,color:sevColor(f.severity),minWidth:82}}>{f.severity === 'NOT_EVALUATED' ? 'UNASSESSED' : f.severity}</span>
                    <div style={{flex:1}}>
                      <div style={{fontSize:12,fontWeight:600,color:'var(--navy)'}}>{f.rule_name || f.rule_id}</div>
                      <div style={{fontSize:10,color:'var(--text3)'}}>{f.rule_id || 'Compliance finding'} • {evaluationLabel(f)}</div>
                    </div>
                    {f.evaluation_state === 'REQUIRES_LAWYER_JUDGMENT' && <span style={{fontSize:9,color:'#9A6700',fontWeight:700}}>LAWYER REVIEW</span>}
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
                <div style={{height:'100%',width:`${(rescueSteps.filter((s:any)=>s.status==="COMPLETED").length/rescueSteps.length)*100}%`,background:'var(--teal)',borderRadius:3}} />
              </div>
              {rescueSteps.map((step:any, i:number) => (
                <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 0',borderBottom:'1px solid var(--border)'}}>
                  <div
  style={{
    width: 22,
    height: 22,
    borderRadius: '50%',
    border: `2px solid ${step.is_completed ? 'var(--teal)' : 'var(--border)'}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 10,
    color: step.is_completed ? 'var(--teal)' : 'var(--text3)',
  }}
>
  {step.is_completed ? '✓' : i + 1}
</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:12,fontWeight:600,color:'var(--navy)'}}>{step.step_name || step.title}</div>
                    <div style={{fontSize:10,color:'var(--text3)'}}>
                      {step.priority} • {step.estimated_days_min != null && step.estimated_days_max != null ? `${step.estimated_days_min}-${step.estimated_days_max} days` : 'N/A'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Score History */}
          {scoreHistory.length > 0 && (
            <div className="nlc-card" style={{marginBottom:14}}>
              <div className="sec-lbl">Score History</div>
              {releasedScoreHistory.length > 0 ? (
                <div style={{display:'flex',alignItems:'flex-end',gap:4,height:60,padding:'8px 0'}}>
                  {releasedScoreHistory.slice(-12).map((h:any,i:number) => {
                    const value = h.score as number
                    return (
                      <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'flex-end'}}>
                        <div style={{width:'100%',height:`${Math.max(value,2)}%`,background:value>=70?'#1a7a52':value>=40?'#D97706':'#B91C1C',borderRadius:2,minHeight:2}} title={`${value}/100`} />
                        {i === releasedScoreHistory.slice(-12).length-1 && <div style={{fontSize:9,color:'var(--text3)',marginTop:2}}>{value}</div>}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div style={{fontSize:12,color:'var(--text3)',padding:'12px 0',lineHeight:1.6}}>
                  Numerical history is withheld because independent legal approval is pending. Historical snapshots remain preserved but are not presented as current authoritative scores.
                </div>
              )}
            </div>
          )}

          {/* Disclaimer */}
          {compliance?.disclaimer && (
            <div style={{fontSize:10,color:'var(--text3)',fontStyle:'italic',padding:'8px 0'}}>
              {compliance.disclaimer}
            </div>
          )}
        </div>

        {/* ═══ RIGHT: Activity + Tax + Governance + Services ═══ */}
        <div style={{borderLeft:'1px solid var(--border)',padding:20,background:'var(--surface)',overflowY:'auto'}}>

          {/* Event-driven company activity */}
          <div className="nlc-card" style={{marginBottom:12}}>
            <div className="sec-lbl">Company Activity</div>
            {activityError ? (
              <div role="status" style={{fontSize:11,color:'var(--text3)',lineHeight:1.6}}>{activityError}</div>
            ) : activity.length === 0 ? (
              <div style={{fontSize:11,color:'var(--text3)',padding:'8px 0'}}>No recent lifecycle activity.</div>
            ) : (
              <div style={{display:'flex',flexDirection:'column',gap:10}}>
                {activity.map((item:any) => {
                  const needsAttention = item.status === 'attention_required'
                  const statusLabel = needsAttention ? 'Needs attention' : item.status === 'dispatched' ? 'Dispatched' : 'Pending'
                  const statusColor = needsAttention ? '#B91C1C' : item.status === 'dispatched' ? 'var(--teal)' : '#D97706'
                  return (
                    <div key={item.event_id} style={{paddingBottom:9,borderBottom:'1px solid var(--border)'}}>
                      <div style={{fontSize:11,fontWeight:600,color:'var(--navy)',lineHeight:1.45}}>{item.title}</div>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:8,marginTop:4}}>
                        <span style={{fontSize:9,color:'var(--text3)'}}>{_d(item.occurred_at)}</span>
                        <span style={{fontSize:9,fontWeight:700,color:statusColor}}>{statusLabel}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

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
