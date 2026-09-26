'use client'
import { useEffect, useState } from 'react'
import { filingsApi, companiesApi } from '@/lib/api'
import Topbar from '@/components/Topbar'

type Tab = 'agm' | 'audit' | 'return'

export default function FilingsPage() {
  const [tab, setTab] = useState<Tab>('agm')
  const [companies, setCompanies] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  // AGM form
  const [agm, setAgm] = useState({ company_id: '', financial_year: new Date().getFullYear(), agm_due_date: '', scheduled_date: '', notice_sent_date: '' })
  // Audit form
  const [audit, setAudit] = useState({ company_id: '', financial_year: new Date().getFullYear(), auditor_firm: '', auditor_icab_number: '' })
  // Annual Return form
  const [ret, setRet] = useState({ company_id: '', financial_year: new Date().getFullYear(), agm_date: '' })

  useEffect(() => {
    companiesApi.list().then((d: any) => setCompanies(Array.isArray(d) ? d : d?.items || [])).catch(() => {})
  }, [])

  const submit = async () => {
    setLoading(true); setSuccess(''); setError('')
    try {
      if (tab === 'agm') {
        if (!agm.company_id || !agm.agm_due_date) { setError('Company and AGM Due Date are required.'); setLoading(false); return }
        const body: any = { company_id: agm.company_id, financial_year: agm.financial_year, agm_due_date: agm.agm_due_date }
        if (agm.scheduled_date) body.scheduled_date = agm.scheduled_date
        if (agm.notice_sent_date) body.notice_sent_date = agm.notice_sent_date
        await filingsApi.createAGM(body)
        setSuccess('AGM record created successfully.')
      } else if (tab === 'audit') {
        if (!audit.company_id) { setError('Company is required.'); setLoading(false); return }
        const body: any = { company_id: audit.company_id, financial_year: audit.financial_year }
        if (audit.auditor_firm) body.auditor_firm = audit.auditor_firm
        if (audit.auditor_icab_number) body.auditor_icab_number = audit.auditor_icab_number
        await filingsApi.createAudit(body)
        setSuccess('Audit record created successfully.')
      } else {
        if (!ret.company_id) { setError('Company is required.'); setLoading(false); return }
        const body: any = { company_id: ret.company_id, financial_year: ret.financial_year }
        if (ret.agm_date) body.agm_date = ret.agm_date
        await filingsApi.createReturn(body)
        setSuccess('Annual Return record created successfully.')
      }
    } catch (e: any) {
      setError(e.message || 'Failed to create record.')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = { width: '100%', background: 'var(--navy-2)', border: '1px solid var(--navy-border)', color: 'var(--nlc-white)', padding: '10px 12px', fontSize: 13, outline: 'none', marginBottom: 16, boxSizing: 'border-box' as const }
  const labelStyle = { display: 'block', fontSize: 10, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase' as const, color: 'var(--gold)', marginBottom: 6 }

  return (
    <>
      <Topbar title="Filings" />
      <div style={{ padding: 28, maxWidth: 600 }}>
        <div style={{ display: 'flex', borderBottom: '1px solid var(--navy-border)', marginBottom: 28 }}>
          {(['agm', 'audit', 'return'] as Tab[]).map(t => (
            <div key={t} onClick={() => { setTab(t); setSuccess(''); setError('') }}
              style={{ padding: '10px 20px', fontSize: 12, fontWeight: 500, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: 1,
                color: tab === t ? 'var(--gold)' : 'var(--white-3)',
                borderBottom: `2px solid ${tab === t ? 'var(--gold)' : 'transparent'}` }}>
              {t === 'agm' ? 'AGM' : t === 'audit' ? 'Audit' : 'Annual Return'}
            </div>
          ))}
        </div>

        <div className="nlc-card" style={{ padding: 28 }}>
          <label style={labelStyle}>Company</label>
          <select style={inputStyle} value={tab === 'agm' ? agm.company_id : tab === 'audit' ? audit.company_id : ret.company_id}
            onChange={e => {
              if (tab === 'agm') setAgm({...agm, company_id: e.target.value})
              else if (tab === 'audit') setAudit({...audit, company_id: e.target.value})
              else setRet({...ret, company_id: e.target.value})
            }}>
            <option value="">Select company...</option>
            {companies.map((c: any) => <option key={c.id} value={c.id}>{c.name || c.company_name}</option>)}
          </select>

          <label style={labelStyle}>Financial Year</label>
          <input type="number" style={inputStyle} min={2000} max={2100}
            value={tab === 'agm' ? agm.financial_year : tab === 'audit' ? audit.financial_year : ret.financial_year}
            onChange={e => {
              const v = parseInt(e.target.value)
              if (tab === 'agm') setAgm({...agm, financial_year: v})
              else if (tab === 'audit') setAudit({...audit, financial_year: v})
              else setRet({...ret, financial_year: v})
            }} />

          {tab === 'agm' && <>
            <label style={labelStyle}>AGM Due Date *</label>
            <input type="date" style={inputStyle} value={agm.agm_due_date} onChange={e => setAgm({...agm, agm_due_date: e.target.value})} />
            <label style={labelStyle}>Scheduled Date</label>
            <input type="date" style={inputStyle} value={agm.scheduled_date} onChange={e => setAgm({...agm, scheduled_date: e.target.value})} />
            <label style={labelStyle}>Notice Sent Date</label>
            <input type="date" style={inputStyle} value={agm.notice_sent_date} onChange={e => setAgm({...agm, notice_sent_date: e.target.value})} />
          </>}

          {tab === 'audit' && <>
            <label style={labelStyle}>Auditor Firm</label>
            <input type="text" style={inputStyle} placeholder="e.g. Rahman & Associates" value={audit.auditor_firm} onChange={e => setAudit({...audit, auditor_firm: e.target.value})} />
            <label style={labelStyle}>ICAB Number</label>
            <input type="text" style={inputStyle} placeholder="e.g. ICAB-1234" value={audit.auditor_icab_number} onChange={e => setAudit({...audit, auditor_icab_number: e.target.value})} />
          </>}

          {tab === 'return' && <>
            <label style={labelStyle}>AGM Date</label>
            <input type="date" style={inputStyle} value={ret.agm_date} onChange={e => setRet({...ret, agm_date: e.target.value})} />
          </>}

          {error && <div style={{ background: 'var(--red-bg)', border: '1px solid rgba(160,48,48,.3)', color: '#e07070', padding: '10px 14px', fontSize: 12, marginBottom: 16 }}>{error}</div>}
          {success && <div style={{ background: 'rgba(93,212,160,0.08)', border: '1px solid rgba(93,212,160,0.3)', color: '#5dd4a0', padding: '10px 14px', fontSize: 12, marginBottom: 16 }}>{success}</div>}

          <button className="nlc-btn-gold" onClick={submit} disabled={loading}>
            {loading ? 'Creating...' : `Create ${tab === 'agm' ? 'AGM' : tab === 'audit' ? 'Audit' : 'Annual Return'} Record`}
          </button>
        </div>
      </div>
    </>
  )
}
