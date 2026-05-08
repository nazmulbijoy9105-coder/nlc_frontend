'use client'
import { useEffect, useState } from 'react'
import { companiesApi } from '@/lib/api'
import { BandBadge, ScoreBar, SectionHeader } from '@/components/ui'
import Topbar from '@/components/Topbar'

interface Company {
  id: string
  company_name: string
  registration_number: string
  incorporation_date: string
  current_compliance_score: number
  current_risk_band: string
  last_evaluated_at: string
}
interface Module { module_name: string; score: number; max_score: number }
interface Violation {
  id: string; rule_id: string; rule_name: string
  description: string; score_impact: number
  statute_reference: string; detected_at: string; severity: string
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [selected, setSelected] = useState<Company | null>(null)
  const [modules, setModules] = useState<Module[]>([])
  const [violations, setViolations] = useState<Violation[]>([])
  const [filter, setFilter] = useState('ALL')
  const [activeTab, setActiveTab] = useState('modules')
  const [loading, setLoading] = useState(true)
  const [evaluating, setEvaluating] = useState(false)

  useEffect(() => {
    setLoading(true)
    companiesApi.list()
      .then((r: any) => {
        const data = r?.items || r || []
        setCompanies(data)
        if (data.length > 0) setSelected(data[0])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!selected) return
    companiesApi.modules(selected.id).then((r: any) => setModules(r || [])).catch(() => setModules([]))
    companiesApi.violations(selected.id).then((r: any) => {
      const d = r
      setViolations(d?.active_flags || d || [])
    }).catch(() => setViolations([]))
  }, [selected?.id])

  const handleEvaluate = async () => {
    if (!selected) return
    setEvaluating(true)
    try {
      await companiesApi.evaluate(selected.id)
      const r = await companiesApi.list()
      const data = r?.items || r || []
      setCompanies(data)
      const updated = data.find((c: Company) => c.id === selected.id)
      if (updated) setSelected(updated)
    } catch (e) { console.error(e) }
    finally { setEvaluating(false) }
  }

  const filtered = filter === 'ALL' ? companies : companies.filter(c => c.current_risk_band === filter)
  const bandColor: Record<string, string> = { GREEN: '#5dd4a0', YELLOW: '#e0b84a', RED: '#e07070', BLACK: '#cc9999' }

  if (loading) return (
    <>
      <Topbar title="Companies" />
      <div style={{ padding: 60, textAlign: 'center', color: 'var(--white-3)', fontSize: 13 }}>
        Loading companies...
      </div>
    </>
  )

  if (!selected) return (
    <>
      <Topbar title="Companies" />
      <div style={{ padding: 60, textAlign: 'center', color: 'var(--white-3)', fontSize: 13 }}>
        No companies found. Add a company to get started.
      </div>
    </>
  )

  const score = selected.current_compliance_score || 0
  const band = selected.current_risk_band || 'GREEN'

  return (
    <>
      <Topbar title="Companies" />
      <div style={{ padding: 28 }}>
        {/* Score Hero */}
        <div className="nlc-card" style={{ padding: 28, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 32 }}>
          <div style={{ width: 90, height: 90, flexShrink: 0, border: `3px solid ${bandColor[band]}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div className="font-cormorant" style={{ fontSize: 38, fontWeight: 700, color: bandColor[band], lineHeight: 1 }}>{score}</div>
            <div style={{ fontSize: 9, color: 'var(--white-3)', letterSpacing: 1, textTransform: 'uppercase' }}>/ 100</div>
          </div>
          <div style={{ flex: 1 }}>
            <h2 className="font-garamond" style={{ fontSize: 22, fontWeight: 600 }}>{selected.company_name}</h2>
            <p style={{ fontSize: 12, color: 'var(--white-2)', marginTop: 4 }}>
              Incorporated: {selected.incorporation_date} · Reg: {selected.registration_number}
            </p>
            <div style={{ display: 'flex', gap: 20, marginTop: 12, flexWrap: 'wrap' }}>
              {[['Band', <span key="b" style={{ color: bandColor[band] }}>{band}</span>],
                ['Violations', violations.length],
                ['Last Eval', selected.last_evaluated_at ? new Date(selected.last_evaluated_at).toLocaleDateString('en-GB') : '—']
              ].map(([k, v]) => (
                <div key={String(k)} style={{ fontSize: 11, color: 'var(--white-3)' }}>
                  {k}: <b style={{ color: 'var(--nlc-white)', fontWeight: 500 }}>{v}</b>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button className="nlc-btn-sm" onClick={handleEvaluate} disabled={evaluating}>
              {evaluating ? 'Running...' : 'Run Evaluation'}
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20 }}>
          {/* Company List */}
          <div>
            <SectionHeader title="All Companies">
              <select value={filter} onChange={e => setFilter(e.target.value)}
                style={{ background: 'var(--navy)', border: '1px solid var(--navy-border)', color: 'var(--white-2)', fontSize: 11, padding: '4px 8px', outline: 'none' }}>
                {['ALL','GREEN','YELLOW','RED','BLACK'].map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </SectionHeader>
            <div className="nlc-card">
              {filtered.length === 0 && (
                <div style={{ padding: 20, color: 'var(--white-3)', fontSize: 12, textAlign: 'center' }}>No companies in this band.</div>
              )}
              {filtered.map((c, i) => (
                <div key={c.id} onClick={() => setSelected(c)}
                  style={{
                    padding: '14px 16px', cursor: 'pointer',
                    borderBottom: i < filtered.length - 1 ? '1px solid rgba(42,63,107,.4)' : 'none',
                    background: selected?.id === c.id ? 'var(--gold-dim)' : 'transparent',
                    borderLeft: `2px solid ${selected?.id === c.id ? 'var(--gold)' : 'transparent'}`,
                    transition: 'all .15s'
                  }}>
                  <div style={{ fontWeight: 500, fontSize: 13 }}>{c.company_name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
                    <span style={{ fontSize: 11, color: 'var(--white-3)' }}>{c.registration_number}</span>
                    <BandBadge band={c.current_risk_band} />
                  </div>
                  <div style={{ marginTop: 8 }}><ScoreBar score={c.current_compliance_score} band={c.current_risk_band} /></div>
                </div>
              ))}
            </div>
          </div>

          {/* Detail Panel */}
          <div>
            <div style={{ display: 'flex', borderBottom: '1px solid var(--navy-border)', marginBottom: 20 }}>
              {[['modules','Module Scores'],['violations','Violations']].map(([k,v]) => (
                <div key={k} onClick={() => setActiveTab(k)}
                  style={{ padding: '10px 18px', fontSize: 12, fontWeight: 500, cursor: 'pointer',
                    color: activeTab === k ? 'var(--gold)' : 'var(--white-3)',
                    borderBottom: `2px solid ${activeTab === k ? 'var(--gold)' : 'transparent'}`, transition: 'all .15s' }}>
                  {v}
                </div>
              ))}
            </div>

            {activeTab === 'modules' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
                {modules.length === 0 && (
                  <div style={{ gridColumn: '1/-1', padding: 24, color: 'var(--white-3)', fontSize: 12, textAlign: 'center' }}>
                    Run an evaluation to see module scores.
                  </div>
                )}
                {modules.map(m => {
                  const pct = Math.round((m.score / m.max_score) * 100)
                  const fill = pct >= 75 ? 'var(--green)' : pct >= 50 ? '#b8860b' : '#a03030'
                  const col = pct >= 75 ? '#5dd4a0' : pct >= 50 ? '#e0b84a' : '#e07070'
                  return (
                    <div key={m.module_name} className="nlc-card" style={{ padding: 16 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.5px', color: 'var(--white-2)', marginBottom: 10 }}>{m.module_name}</div>
                      <div style={{ height: 6, background: 'var(--navy-border)' }}>
                        <div style={{ height: 6, background: fill, width: `${pct}%` }} />
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600, marginTop: 6, color: col }}>{m.score} / {m.max_score}</div>
                    </div>
                  )
                })}
              </div>
            )}

            {activeTab === 'violations' && (
              <div className="nlc-card">
                {violations.length === 0 && (
                  <div style={{ padding: 24, textAlign: 'center', color: '#5dd4a0', fontSize: 13 }}>✓ No active violations</div>
                )}
                {violations.map((v, i) => (
                  <div key={v.id} style={{ padding: '16px 20px', borderBottom: i < violations.length - 1 ? '1px solid rgba(42,63,107,.4)' : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                      <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1, color: 'var(--gold)' }}>{v.rule_id}</span>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{v.rule_name}</span>
                      <span style={{ marginLeft: 'auto', fontSize: 10, color: '#e07070' }}>−{v.score_impact} pts</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--white-2)', lineHeight: 1.5 }}>{v.description}</div>
                    <div style={{ fontSize: 10, color: '#e07070', marginTop: 4 }}>Statute: {v.statute_reference}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
