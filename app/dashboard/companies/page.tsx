'use client'
import { useEffect, useState } from 'react'
import { companiesApi } from '@/lib/api'
import { BandBadge, ScoreBar, SectionHeader, ActionBtn } from '@/components/ui'
import Topbar from '@/components/Topbar'

const MOCK = [
  { id: '1', name: 'Global Academy Hub Ltd.', registration_number: 'C-87654/2019', incorporation_date: '12 Mar 2019', compliance_score: 88, band: 'GREEN', last_evaluated_at: '22 Mar 2026', director_count: 2, violation_count: 2 },
  { id: '2', name: 'Sahara Crafts Partnership', registration_number: 'P-32110/2021', incorporation_date: '07 Jun 2021', compliance_score: 62, band: 'YELLOW', last_evaluated_at: '21 Mar 2026', director_count: 2, violation_count: 3 },
  { id: '3', name: 'NB Tech Solutions Ltd.', registration_number: 'C-11204/2025', incorporation_date: '15 Jan 2025', compliance_score: 91, band: 'GREEN', last_evaluated_at: '23 Mar 2026', director_count: 3, violation_count: 0 },
  { id: '4', name: 'Dhaka Trade House Ltd.', registration_number: 'C-44320/2017', incorporation_date: '03 Sep 2017', compliance_score: 34, band: 'RED', last_evaluated_at: '20 Mar 2026', director_count: 1, violation_count: 4 },
  { id: '5', name: 'Purba Bangla Commerce', registration_number: 'C-20880/2016', incorporation_date: '22 Feb 2016', compliance_score: 12, band: 'BLACK', last_evaluated_at: '19 Mar 2026', director_count: 1, violation_count: 8 },
]

const MOCK_MODULES = [
  { module_name: 'Incorporation', score: 100, max_score: 100 },
  { module_name: 'Annual Returns', score: 90, max_score: 100 },
  { module_name: 'AGM Compliance', score: 70, max_score: 100 },
  { module_name: 'Director Records', score: 100, max_score: 100 },
  { module_name: 'Share Capital', score: 85, max_score: 100 },
  { module_name: 'Registered Office', score: 100, max_score: 100 },
  { module_name: 'Statutory Books', score: 90, max_score: 100 },
  { module_name: 'Charges & Mortgages', score: 100, max_score: 100 },
  { module_name: 'Winding Up Risk', score: 100, max_score: 100 },
]

const MOCK_VIOLATIONS = [
  { id: 'v1', rule_code: 'AGM-003', rule_name: 'AGM Notice Period — Marginally Short', description: 'Notice issued 18 days prior. Companies Act 1994 § 85 requires minimum 21 days.', score_impact: 10, statute_reference: 'CA 1994 § 85', detected_at: '18 Mar 2026', severity: 'MINOR' },
  { id: 'v2', rule_code: 'CAP-002', rule_name: 'Paid-Up Capital Verification Pending', description: 'Bank certificate confirming paid-up capital injection not uploaded. Required under CA 1994 § 155.', score_impact: 5, statute_reference: 'CA 1994 § 155', detected_at: '15 Mar 2026', severity: 'MINOR' },
]

export default function CompaniesPage() {
  const [companies, setCompanies] = useState(MOCK)
  const [selected, setSelected] = useState(MOCK[0])
  const [modules, setModules] = useState(MOCK_MODULES)
  const [violations, setViolations] = useState(MOCK_VIOLATIONS)
  const [filter, setFilter] = useState('ALL')
  const [activeTab, setActiveTab] = useState('modules')

  useEffect(() => {
    companiesApi.list().then(r => setCompanies(r.data?.items || r.data)).catch(() => {})
  }, [])

  useEffect(() => {
    companiesApi.modules(selected.id).then(r => setModules(r.data)).catch(() => {})
    companiesApi.violations(selected.id).then(r => setViolations(r.data)).catch(() => {})
  }, [selected.id])

  const filtered = filter === 'ALL' ? companies : companies.filter(c => c.band === filter)
  const bandColor: Record<string, string> = { GREEN: '#5dd4a0', YELLOW: '#e0b84a', RED: '#e07070', BLACK: '#cc9999' }
  const circleColor: Record<string, string> = { GREEN: 'var(--green)', YELLOW: '#b8860b', RED: '#a03030', BLACK: '#550000' }

  return (
    <>
      <Topbar title="Companies" />
      <div style={{ padding: 28 }}>

        {/* Score Hero */}
        <div className="nlc-card" style={{ padding: 28, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 32 }}>
          <div style={{ width: 90, height: 90, flexShrink: 0, border: `3px solid ${circleColor[selected.band]}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div className="font-cormorant" style={{ fontSize: 38, fontWeight: 700, color: bandColor[selected.band], lineHeight: 1 }}>{selected.compliance_score}</div>
            <div style={{ fontSize: 9, color: 'var(--white-3)', letterSpacing: 1, textTransform: 'uppercase' }}>/ 100</div>
          </div>
          <div style={{ flex: 1 }}>
            <h2 className="font-garamond" style={{ fontSize: 22, fontWeight: 600 }}>{selected.name}</h2>
            <p style={{ fontSize: 12, color: 'var(--white-2)', marginTop: 4 }}>
              Incorporated: {selected.incorporation_date} · Reg No: {selected.registration_number}
            </p>
            <div style={{ display: 'flex', gap: 20, marginTop: 12, flexWrap: 'wrap' }}>
              {[['Band', <span key="b" style={{ color: bandColor[selected.band] }}>{selected.band}</span>],
                ['Violations', selected.violation_count],
                ['Directors', selected.director_count],
                ['Last Eval', selected.last_evaluated_at]
              ].map(([k, v]) => (
                <div key={String(k)} style={{ fontSize: 11, color: 'var(--white-3)' }}>
                  {k}: <b style={{ color: 'var(--nlc-white)', fontWeight: 500 }}>{v}</b>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button className="nlc-btn-sm" onClick={() => companiesApi.evaluate(selected.id).catch(() => {})}>Run Evaluation</button>
            <button className="nlc-btn-sm">Draft Document</button>
            <button className="nlc-btn-sm">View Filings</button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20 }}>
          {/* List */}
          <div>
            <SectionHeader title="All Companies">
              <select value={filter} onChange={e => setFilter(e.target.value)}
                style={{ background: 'var(--navy)', border: '1px solid var(--navy-border)', color: 'var(--white-2)', fontSize: 11, padding: '4px 8px', outline: 'none' }}>
                {['ALL','GREEN','YELLOW','RED','BLACK'].map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </SectionHeader>
            <div className="nlc-card">
              {filtered.map((c, i) => (
                <div key={c.id} onClick={() => setSelected(c as typeof MOCK[0])}
                  style={{
                    padding: '14px 16px', cursor: 'pointer',
                    borderBottom: i < filtered.length - 1 ? '1px solid rgba(42,63,107,.4)' : 'none',
                    background: selected.id === c.id ? 'var(--gold-dim)' : 'transparent',
                    borderLeft: `2px solid ${selected.id === c.id ? 'var(--gold)' : 'transparent'}`,
                    transition: 'all .15s'
                  }}>
                  <div style={{ fontWeight: 500, fontSize: 13 }}>{c.name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
                    <span style={{ fontSize: 11, color: 'var(--white-3)' }}>{c.registration_number}</span>
                    <BandBadge band={c.band} />
                  </div>
                  <div style={{ marginTop: 8 }}><ScoreBar score={c.compliance_score} band={c.band} /></div>
                </div>
              ))}
            </div>
          </div>

          {/* Detail */}
          <div>
            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--navy-border)', marginBottom: 20 }}>
              {[['modules','Module Scores'],['violations','Violations'],['directors','Directors']].map(([k,v]) => (
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
                {modules.map(m => {
                  const pct = Math.round((m.score / m.max_score) * 100)
                  const band = pct >= 75 ? 'GREEN' : pct >= 50 ? 'YELLOW' : 'RED'
                  const c = band === 'GREEN' ? '#5dd4a0' : band === 'YELLOW' ? '#e0b84a' : '#e07070'
                  const fill = band === 'GREEN' ? 'var(--green)' : band === 'YELLOW' ? '#b8860b' : '#a03030'
                  return (
                    <div key={m.module_name} className="nlc-card" style={{ padding: 16 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.5px', color: 'var(--white-2)', marginBottom: 10 }}>{m.module_name}</div>
                      <div style={{ height: 6, background: 'var(--navy-border)' }}>
                        <div style={{ height: 6, background: fill, width: `${pct}%` }} />
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600, marginTop: 6, color: c }}>{m.score} / {m.max_score}</div>
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
                      <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1, color: 'var(--gold)' }}>{v.rule_code}</span>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{v.rule_name}</span>
                      <span className="badge-pill badge-yellow" style={{ marginLeft: 'auto', padding: '4px 10px', fontSize: 10, fontWeight: 600, letterSpacing: '.8px', textTransform: 'uppercase' }}>−{v.score_impact} pts</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--white-2)', lineHeight: 1.5 }}>{v.description}</div>
                    <div style={{ fontSize: 10, color: '#e07070', marginTop: 4 }}>Statute: {v.statute_reference} · Detected: {v.detected_at}</div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'directors' && (
              <div className="nlc-card" style={{ padding: 20 }}>
                <div style={{ fontSize: 13, color: 'var(--white-2)' }}>Director records are fetched from the RJSC database. Connect RJSC API to populate live data.</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
