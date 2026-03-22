'use client'
import { useEffect, useState } from 'react'
import { filingsApi } from '@/lib/api'
import { BandBadge, SectionHeader } from '@/components/ui'
import Topbar from '@/components/Topbar'

interface Filing {
  id: string
  company_name?: string
  company_id?: string
  filing_type?: string
  form_number?: string
  agm_due_date?: string
  due_date?: string
  held_date?: string
  filed_date?: string
  status?: string
  financial_year?: number
  is_held?: boolean
  is_filed?: boolean
}

const statusLabel = (f: Filing) => {
  if (f.status) return f.status
  if (f.is_filed || f.held_date) return 'FILED'
  const due = f.agm_due_date || f.due_date
  if (due && new Date(due) < new Date()) return 'OVERDUE'
  return 'PENDING'
}

export default function FilingsPage() {
  const [filings, setFilings] = useState<Filing[]>([])
  const [filter, setFilter] = useState('ALL')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    filingsApi.list()
      .then(r => setFilings(r.data?.items || r.data || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const withStatus = filings.map(f => ({ ...f, _status: statusLabel(f) }))
  const filtered = filter === 'ALL' ? withStatus : withStatus.filter(f => f._status === filter)
  const counts: Record<string, number> = { ALL: filings.length }
  withStatus.forEach(f => { counts[f._status] = (counts[f._status] || 0) + 1 })

  return (
    <>
      <Topbar title="Filings" />
      <div style={{ padding: 28 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          {['ALL','FILED','PENDING','OVERDUE','IN_PROGRESS'].map(k => (
            <button key={k} onClick={() => setFilter(k)}
              style={{
                padding: '7px 16px', fontSize: 11, fontWeight: 600, letterSpacing: '.8px', textTransform: 'uppercase',
                background: filter === k ? 'var(--gold-dim)' : 'transparent',
                border: `1px solid ${filter === k ? 'var(--gold-line)' : 'var(--navy-border)'}`,
                color: filter === k ? 'var(--gold)' : 'var(--white-3)', cursor: 'pointer', transition: 'all .2s'
              }}>
              {k} ({counts[k] || 0})
            </button>
          ))}
        </div>

        <SectionHeader title={`${filter === 'ALL' ? 'All' : filter} Filings`} />

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--white-3)', fontSize: 13 }}>Loading filings...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--white-3)', fontSize: 13 }}>
            {filings.length === 0 ? 'No filings found. Create an AGM record to get started.' : 'No filings match this filter.'}
          </div>
        ) : (
          <table className="nlc-table">
            <thead>
              <tr>
                <th>Filing</th>
                <th>Company</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Filed Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(f => {
                const overdue = f._status === 'OVERDUE'
                const due = f.agm_due_date || f.due_date
                const filed = f.held_date || f.filed_date
                return (
                  <tr key={f.id}>
                    <td>
                      <div style={{ fontWeight: 500, fontSize: 13 }}>{f.filing_type || `AGM FY ${f.financial_year}`}</div>
                      <div style={{ fontSize: 11, color: 'var(--white-3)', marginTop: 2 }}>{f.form_number || 'Companies Act 1994'}</div>
                    </td>
                    <td style={{ fontSize: 13 }}>{f.company_name || f.company_id || '—'}</td>
                    <td style={{ fontSize: 12, color: overdue ? '#e07070' : '#5dd4a0' }}>
                      {due ? new Date(due).toLocaleDateString('en-GB') : '—'}
                    </td>
                    <td><BandBadge band={f._status} /></td>
                    <td style={{ fontSize: 11, color: 'var(--white-3)' }}>
                      {filed ? new Date(filed).toLocaleDateString('en-GB') : '—'}
                    </td>
                    <td>
                      <button style={{
                        padding: '4px 10px', fontSize: 10, fontWeight: 500, background: 'transparent',
                        border: '1px solid var(--navy-border)', color: 'var(--white-2)', cursor: 'pointer'
                      }}>
                        {overdue ? 'File Now' : f._status === 'FILED' ? 'View' : 'Prepare'}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}
