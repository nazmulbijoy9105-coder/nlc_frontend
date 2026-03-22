'use client'
import { useEffect, useState } from 'react'
import { documentsApi } from '@/lib/api'
import { BandBadge, SectionHeader } from '@/components/ui'
import Topbar from '@/components/Topbar'

interface Doc {
  id: string
  company_name?: string
  company_id?: string
  title?: string
  template_name?: string
  document_type?: string
  status?: string
  human_approved?: boolean
  created_at?: string
  is_client_visible?: boolean
}

const docStatus = (d: Doc) => {
  if (d.status) return d.status
  if (d.human_approved) return 'APPROVED'
  return 'DRAFT'
}

export default function DocumentsPage() {
  const [docs, setDocs] = useState<Doc[]>([])
  const [filter, setFilter] = useState('ALL')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    documentsApi.list()
      .then(r => setDocs(r.data?.items || r.data || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleApprove = async (id: string) => {
    try {
      await documentsApi.approve(id)
      setDocs(prev => prev.map(d => d.id === id ? { ...d, human_approved: true, status: 'APPROVED' } : d))
    } catch (e) { console.error(e) }
  }

  const withStatus = docs.map(d => ({ ...d, _status: docStatus(d) }))
  const filtered = filter === 'ALL' ? withStatus : withStatus.filter(d => d._status === filter)

  return (
    <>
      <Topbar title="Documents" />
      <div style={{ padding: 28 }}>
        <div style={{ background: 'var(--gold-dim)', border: '1px solid var(--gold-line)', padding: '12px 16px', marginBottom: 20, fontSize: 12, color: 'var(--gold)' }}>
          ⚠ AI Constitution Article 3 — All AI-generated documents require mandatory human legal review and approval before release to clients.
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          {['ALL','DRAFT','PENDING_REVIEW','APPROVED'].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              style={{
                padding: '7px 16px', fontSize: 11, fontWeight: 600, letterSpacing: '.8px', textTransform: 'uppercase',
                background: filter === s ? 'var(--gold-dim)' : 'transparent',
                border: `1px solid ${filter === s ? 'var(--gold-line)' : 'var(--navy-border)'}`,
                color: filter === s ? 'var(--gold)' : 'var(--white-3)', cursor: 'pointer'
              }}>
              {s.replace(/_/g,' ')} ({(s === 'ALL' ? docs : docs.filter(d => docStatus(d) === s)).length})
            </button>
          ))}
        </div>

        <SectionHeader title="AI-Drafted Documents" />

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--white-3)', fontSize: 13 }}>Loading documents...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--white-3)', fontSize: 13 }}>
            {docs.length === 0 ? 'No documents yet. Generate a document from the Companies page.' : 'No documents match this filter.'}
          </div>
        ) : (
          <table className="nlc-table">
            <thead>
              <tr><th>Document</th><th>Company</th><th>Status</th><th>Created</th><th></th></tr>
            </thead>
            <tbody>
              {filtered.map(d => (
                <tr key={d.id}>
                  <td>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>{d.title || d.document_type}</div>
                    <div style={{ fontSize: 11, color: 'var(--white-3)', marginTop: 2 }}>{d.template_name}</div>
                  </td>
                  <td style={{ fontSize: 13 }}>{d.company_name || d.company_id}</td>
                  <td><BandBadge band={d._status} /></td>
                  <td style={{ fontSize: 11, color: 'var(--white-3)' }}>
                    {d.created_at ? new Date(d.created_at).toLocaleDateString('en-GB') : '—'}
                  </td>
                  <td style={{ display: 'flex', gap: 6 }}>
                    {d._status === 'PENDING_REVIEW' && (
                      <button onClick={() => handleApprove(d.id)}
                        style={{ padding: '4px 10px', fontSize: 10, background: 'var(--green-bg)', border: '1px solid rgba(26,122,82,.3)', color: '#5dd4a0', cursor: 'pointer' }}>
                        Approve
                      </button>
                    )}
                    <button style={{ padding: '4px 10px', fontSize: 10, background: 'transparent', border: '1px solid var(--navy-border)', color: 'var(--white-2)', cursor: 'pointer' }}>
                      {d._status === 'APPROVED' ? 'Download' : 'View'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}
