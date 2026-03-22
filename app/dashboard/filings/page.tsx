'use client'
import { useEffect, useState } from 'react'
import { filingsApi } from '@/lib/api'
import { BandBadge, SectionHeader } from '@/components/ui'
import Topbar from '@/components/Topbar'

const MOCK = [
  { id: '1', company_name: 'Global Academy Hub Ltd.', filing_type: 'Annual Return', form_number: 'RJSC Form IX', due_date: '15 Apr 2026', filed_date: '10 Mar 2026', status: 'FILED' },
  { id: '2', company_name: 'Dhaka Trade House Ltd.', filing_type: 'Annual Return', form_number: 'RJSC Form IX', due_date: '26 Mar 2026', filed_date: undefined, status: 'OVERDUE' },
  { id: '3', company_name: 'Sahara Crafts Partnership', filing_type: 'AGM Minutes', form_number: 'CA 1994 § 85', due_date: '04 Apr 2026', filed_date: undefined, status: 'PENDING' },
  { id: '4', company_name: 'Global Academy Hub Ltd.', filing_type: 'Form XII', form_number: 'Director Change', due_date: '20 Apr 2026', filed_date: undefined, status: 'IN_PROGRESS' },
  { id: '5', company_name: 'NB Tech Solutions Ltd.', filing_type: 'Annual Return', form_number: 'RJSC Form IX', due_date: '30 Apr 2026', filed_date: undefined, status: 'PENDING' },
]

export default function FilingsPage() {
  const [filings, setFilings] = useState(MOCK)
  const [filter, setFilter] = useState('ALL')

  useEffect(() => {
    filingsApi.list().then(r => setFilings(r.data?.items || r.data)).catch(() => {})
  }, [])

  const filtered = filter === 'ALL' ? filings : filings.filter(f => f.status === filter)
  const counts = { ALL: filings.length, FILED: filings.filter(f => f.status === 'FILED').length, PENDING: filings.filter(f => f.status === 'PENDING').length, OVERDUE: filings.filter(f => f.status === 'OVERDUE').length, IN_PROGRESS: filings.filter(f => f.status === 'IN_PROGRESS').length }

  return (
    <>
      <Topbar title="Filings" />
      <div style={{ padding: 28 }}>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {Object.entries(counts).map(([k, v]) => (
            <button key={k} onClick={() => setFilter(k)}
              style={{
                padding: '7px 16px', fontSize: 11, fontWeight: 600, letterSpacing: '.8px', textTransform: 'uppercase',
                background: filter === k ? 'var(--gold-dim)' : 'transparent',
                border: `1px solid ${filter === k ? 'var(--gold-line)' : 'var(--navy-border)'}`,
                color: filter === k ? 'var(--gold)' : 'var(--white-3)', cursor: 'pointer', transition: 'all .2s'
              }}>
              {k} ({v})
            </button>
          ))}
          <div style={{ flex: 1 }} />
          <button className="nlc-btn-sm">+ New Filing</button>
        </div>

        <SectionHeader title={`${filter === 'ALL' ? 'All' : filter} Filings`} />

        <table className="nlc-table">
          <thead>
            <tr>
              <th>Filing Type</th>
              <th>Company</th>
              <th>Due Date</th>
              <th>Status</th>
              <th>Filed Date</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(f => {
              const overdue = f.status === 'OVERDUE'
              return (
                <tr key={f.id}>
                  <td>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>{f.filing_type}</div>
                    <div style={{ fontSize: 11, color: 'var(--white-3)', marginTop: 2 }}>{f.form_number}</div>
                  </td>
                  <td style={{ fontSize: 13 }}>{f.company_name}</td>
                  <td style={{ fontSize: 12, color: overdue ? '#e07070' : '#5dd4a0' }}>{f.due_date}</td>
                  <td><BandBadge band={f.status} /></td>
                  <td style={{ fontSize: 11, color: 'var(--white-3)' }}>{f.filed_date || '—'}</td>
                  <td>
                    <button style={{
                      padding: '4px 10px', fontSize: 10, fontWeight: 500, background: 'transparent',
                      border: '1px solid var(--navy-border)', color: 'var(--white-2)', cursor: 'pointer'
                    }}>
                      {f.status === 'OVERDUE' ? 'File Now' : f.status === 'FILED' ? 'View' : 'Prepare'}
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--white-3)', fontSize: 13 }}>
            No filings found for this filter.
          </div>
        )}
      </div>
    </>
  )
}
