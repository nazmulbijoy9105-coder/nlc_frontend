'use client'
import { useEffect, useState } from 'react'
import { documentsApi } from '@/lib/api'
import { BandBadge, SectionHeader } from '@/components/ui'
import Topbar from '@/components/Topbar'

const MOCK = [
  { id: '1', company_name: 'Global Academy Hub Ltd.', title: 'Annual Return Cover Letter', template_code: 'AR-COVER-01', ai_model: 'Claude Sonnet', status: 'APPROVED', created_at: '10 Mar 2026' },
  { id: '2', company_name: 'Purba Bangla Commerce', title: 'Rescue Notice — RJSC', template_code: 'RESCUE-01', ai_model: 'Claude Sonnet', status: 'PENDING_REVIEW', created_at: '22 Mar 2026' },
  { id: '3', company_name: 'Sahara Crafts Partnership', title: 'AGM Notice', template_code: 'AGM-NOTICE-01', ai_model: 'Claude Sonnet', status: 'DRAFT', created_at: '23 Mar 2026' },
  { id: '4', company_name: 'Dhaka Trade House Ltd.', title: 'Violation Remediation Notice', template_code: 'REMEDY-01', ai_model: 'Claude Sonnet', status: 'DRAFT', created_at: '23 Mar 2026' },
]

export default function DocumentsPage() {
  const [docs, setDocs] = useState(MOCK)
  const [filter, setFilter] = useState('ALL')

  useEffect(() => {
    documentsApi.list().then(r => setDocs(r.data?.items || r.data)).catch(() => {})
  }, [])

  const filtered = filter === 'ALL' ? docs : docs.filter(d => d.status === filter)

  const handleApprove = async (id: string) => {
    try {
      await documentsApi.approve(id)
      setDocs(prev => prev.map(d => d.id === id ? { ...d, status: 'APPROVED' } : d))
    } catch {}
  }

  return (
    <>
      <Topbar title="Documents" />
      <div style={{ padding: 28 }}>

        {/* Warning banner */}
        <div style={{ background: 'var(--gold-dim)', border: '1px solid var(--gold-line)', padding: '12px 16px', marginBottom: 20, fontSize: 12, color: 'var(--gold)' }}>
          ⚠ All AI-generated documents require mandatory human legal review and approval before release to clients.
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {['ALL','DRAFT','PENDING_REVIEW','APPROVED'].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              style={{
                padding: '7px 16px', fontSize: 11, fontWeight: 600, letterSpacing: '.8px', textTransform: 'uppercase',
                background: filter === s ? 'var(--gold-dim)' : 'transparent',
                border: `1px solid ${filter === s ? 'var(--gold-line)' : 'var(--navy-border)'}`,
                color: filter === s ? 'var(--gold)' : 'var(--white-3)', cursor: 'pointer'
              }}>
              {s.replace(/_/g, ' ')} ({(s === 'ALL' ? docs : docs.filter(d => d.status === s)).length})
            </button>
          ))}
          <div style={{ flex: 1 }} />
          <button className="nlc-btn-sm">+ Draft New</button>
        </div>

        <SectionHeader title="AI-Drafted Documents" />

        <table className="nlc-table">
          <thead>
            <tr><th>Document</th><th>Company</th><th>AI Model</th><th>Status</th><th>Created</th><th></th></tr>
          </thead>
          <tbody>
            {filtered.map(d => (
              <tr key={d.id}>
                <td>
                  <div style={{ fontWeight: 500, fontSize: 13 }}>{d.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--white-3)', marginTop: 2 }}>{d.template_code}</div>
                </td>
                <td style={{ fontSize: 13 }}>{d.company_name}</td>
                <td style={{ fontSize: 11, color: 'var(--white-3)' }}>{d.ai_model}</td>
                <td><BandBadge band={d.status} /></td>
                <td style={{ fontSize: 11, color: 'var(--white-3)' }}>{d.created_at}</td>
                <td style={{ display: 'flex', gap: 6 }}>
                  {d.status === 'PENDING_REVIEW' && (
                    <button onClick={() => handleApprove(d.id)} style={{ padding: '4px 10px', fontSize: 10, background: 'var(--green-bg)', border: '1px solid rgba(26,122,82,.3)', color: '#5dd4a0', cursor: 'pointer' }}>
                      Approve
                    </button>
                  )}
                  <button style={{ padding: '4px 10px', fontSize: 10, background: 'transparent', border: '1px solid var(--navy-border)', color: 'var(--white-2)', cursor: 'pointer' }}>
                    {d.status === 'APPROVED' ? 'Download' : 'View'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--white-3)', fontSize: 13 }}>No documents found.</div>
        )}
      </div>
    </>
  )
}
