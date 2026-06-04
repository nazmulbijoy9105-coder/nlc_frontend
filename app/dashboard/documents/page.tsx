'use client'
import { useEffect, useState } from 'react'
import { documentsApi, companiesApi } from '@/lib/api'
import { SectionHeader } from '@/components/ui'
import Topbar from '@/components/Topbar'

interface Doc {
  id: string; company_name?: string; company_id?: string; title?: string
  template_name?: string; document_type?: string; status?: string
  human_approved?: boolean; created_at?: string; _status?: string
}
interface Template {
  template_name: string; document_type: string; description?: string
  required_placeholders: string[]; optional_placeholders?: string[]
}

const docStatus = (d: Doc) => {
  if (d.status) return d.status
  if (d.human_approved) return 'APPROVED'
  return 'DRAFT'
}

const STATUS_META: Record<string, { color: string; bg: string; border: string; dot: string }> = {
  APPROVED:        { color: '#5dd4a0', bg: 'rgba(93,212,160,.08)',  border: 'rgba(93,212,160,.25)',  dot: '#5dd4a0' },
  PENDING_REVIEW:  { color: '#c8a84b', bg: 'rgba(200,168,75,.08)',  border: 'rgba(200,168,75,.25)',  dot: '#c8a84b' },
  IN_REVIEW_QUEUE: { color: '#7eb8f7', bg: 'rgba(126,184,247,.08)', border: 'rgba(126,184,247,.25)', dot: '#7eb8f7' },
  DRAFT:           { color: '#8a9bb5', bg: 'rgba(138,155,181,.06)', border: 'rgba(138,155,181,.2)',  dot: '#4a5568' },
}

function StatusChip({ status }: { status: string }) {
  const m = STATUS_META[status] || STATUS_META.DRAFT
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 9, fontWeight: 700,
      letterSpacing: '1.2px', textTransform: 'uppercase', color: m.color,
      background: m.bg, border: `1px solid ${m.border}`, padding: '3px 8px' }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: m.dot, display: 'inline-block', flexShrink: 0 }} />
      {status.replace(/_/g, ' ')}
    </span>
  )
}

const FILTERS = ['ALL', 'DRAFT', 'PENDING_REVIEW', 'APPROVED']

export default function DocumentsPage() {
  const [docs, setDocs]       = useState<Doc[]>([])
  const [filter, setFilter]   = useState('ALL')
  const [loading, setLoading] = useState(true)
  const [showGenerate, setShowGenerate] = useState(false)
  const [templates, setTemplates] = useState<Template[]>([])
  const [companies, setCompanies] = useState<any[]>([])
  const [selTpl, setSelTpl]   = useState<Template | null>(null)
  const [genForm, setGenForm] = useState({ company_id: '', template_name: '', notes: '', params: {} as Record<string, string> })
  const [generating, setGenerating] = useState(false)
  const [genError, setGenError]     = useState('')
  const [genSuccess, setGenSuccess] = useState('')

  useEffect(() => { loadDocs() }, [])

  function loadDocs() {
    setLoading(true)
    documentsApi.list()
      .then((r: any) => setDocs(r?.items || r || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  function openGenerate() {
    setShowGenerate(true); setGenError(''); setGenSuccess('')
    if (!templates.length) documentsApi.templates().then((r: any) => setTemplates(Array.isArray(r) ? r : [])).catch(() => setGenError('Failed to load templates'))
    if (!companies.length) companiesApi.list().then((r: any) => setCompanies(Array.isArray(r) ? r : r?.items || [])).catch(() => {})
  }

  function selectTemplate(name: string) {
    const t = templates.find(t => t.template_name === name) || null
    setSelTpl(t)
    setGenForm(p => ({ ...p, template_name: name, params: {} }))
  }

  async function handleGenerate() {
    setGenError('')
    if (!genForm.company_id || !genForm.template_name) { setGenError('Company and template are required'); return }
    if (selTpl) {
      const missing = selTpl.required_placeholders.filter(p => !genForm.params[p]?.trim())
      if (missing.length) { setGenError(`Required: ${missing.map(p => p.replace(/_/g, ' ')).join(', ')}`); return }
    }
    setGenerating(true)
    try {
      await documentsApi.generate({
        company_id: genForm.company_id,
        document_type: selTpl?.document_type,
        template_name: genForm.template_name,
        template_params: genForm.params,
        notes: genForm.notes || undefined,
      })
      setGenSuccess('Document queued. AI generation is asynchronous — it will appear in the list within moments.')
      setGenForm({ company_id: '', template_name: '', notes: '', params: {} })
      setSelTpl(null)
      setTimeout(loadDocs, 4000)
    } catch (e: any) { setGenError(e.message || 'Generation request failed') }
    finally { setGenerating(false) }
  }

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

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: 'var(--gold-dim)', border: '1px solid var(--gold-line)', padding: '12px 16px', marginBottom: 24 }}>
          <span style={{ color: 'var(--gold)', fontSize: 14, flexShrink: 0, marginTop: 1 }}>⚖</span>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 2 }}>AI Constitution — Article 3</div>
            <div style={{ fontSize: 11, color: 'var(--white-2)', lineHeight: 1.6 }}>All AI-generated documents require mandatory human legal review and approval before release to clients. Documents in <span style={{ color: '#c8a84b' }}>Pending Review</span> status must be approved by LEGAL_STAFF.</div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {FILTERS.map(s => {
              const count = s === 'ALL' ? docs.length : docs.filter(d => docStatus(d) === s).length
              const active = filter === s
              return (
                <button key={s} onClick={() => setFilter(s)} style={{
                  padding: '6px 14px', fontSize: 10, fontWeight: 600, letterSpacing: '.8px', textTransform: 'uppercase',
                  cursor: 'pointer', transition: 'all .15s',
                  background: active ? 'var(--gold-dim)' : 'transparent',
                  border: `1px solid ${active ? 'var(--gold-line)' : 'var(--navy-border)'}`,
                  color: active ? 'var(--gold)' : 'var(--white-3)',
                }}>
                  {s.replace(/_/g, ' ')} <span style={{ opacity: 0.6, marginLeft: 2 }}>{count}</span>
                </button>
              )
            })}
          </div>
          <button onClick={openGenerate} className="nlc-btn-gold"
            style={{ padding: '9px 20px', fontSize: 11, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
            + Generate Document
          </button>
        </div>

        {showGenerate && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(5,10,20,.85)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(2px)' }}>
            <div className="nlc-card" style={{ width: 580, maxHeight: '88vh', overflowY: 'auto', padding: 0, borderColor: 'var(--gold-line)', position: 'relative' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--navy-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 3, height: 18, background: 'var(--gold)' }} />
                  <span className="font-cormorant" style={{ fontSize: 20, fontWeight: 600, letterSpacing: '.5px' }}>Generate AI Document</span>
                </div>
                <button onClick={() => setShowGenerate(false)} style={{ background: 'none', border: 'none', color: 'var(--white-3)', fontSize: 20, cursor: 'pointer', lineHeight: 1, padding: 4 }}>✕</button>
              </div>

              <div style={{ padding: 24 }}>
                {genError   && <div style={{ color: '#e07070', fontSize: 11, marginBottom: 14, background: 'rgba(224,112,112,.07)', border: '1px solid rgba(224,112,112,.2)', padding: '9px 12px' }}>{genError}</div>}
                {genSuccess && (
                  <div style={{ color: '#5dd4a0', fontSize: 12, background: 'rgba(93,212,160,.07)', border: '1px solid rgba(93,212,160,.2)', padding: '14px 16px', lineHeight: 1.6 }}>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>✓ Queued successfully</div>
                    {genSuccess}
                    <div style={{ marginTop: 12 }}>
                      <button onClick={() => setShowGenerate(false)} className="nlc-btn-sm" style={{ padding: '6px 16px', fontSize: 10 }}>Close</button>
                    </div>
                  </div>
                )}

                {!genSuccess && (
                  <>
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ fontSize: 9, color: 'var(--white-3)', display: 'block', marginBottom: 6, letterSpacing: '1.2px', textTransform: 'uppercase' }}>Company *</label>
                      <select value={genForm.company_id} onChange={e => setGenForm(p => ({ ...p, company_id: e.target.value }))}
                        className="nlc-input" style={{ width: '100%', padding: '9px 12px', fontSize: 13 }}>
                        <option value=''>Select company…</option>
                        {companies.map((c: any) => <option key={c.id} value={c.id}>{c.company_name || c.name}</option>)}
                      </select>
                    </div>

                    <div style={{ marginBottom: 16 }}>
                      <label style={{ fontSize: 9, color: 'var(--white-3)', display: 'block', marginBottom: 6, letterSpacing: '1.2px', textTransform: 'uppercase' }}>Template *</label>
                      <select value={genForm.template_name} onChange={e => selectTemplate(e.target.value)}
                        className="nlc-input" style={{ width: '100%', padding: '9px 12px', fontSize: 13 }}>
                        <option value=''>Select template…</option>
                        {templates.map(t => (
                          <option key={t.template_name} value={t.template_name}>
                            {t.template_name.replace(/_/g, ' ')} — {t.document_type.replace(/_/g, ' ')}
                          </option>
                        ))}
                      </select>
                      {selTpl?.description && (
                        <div style={{ fontSize: 11, color: 'var(--white-3)', marginTop: 6, lineHeight: 1.5, padding: '6px 10px', background: 'var(--white-4)', borderLeft: '2px solid var(--navy-border)' }}>
                          {selTpl.description}
                        </div>
                      )}
                    </div>

                    {selTpl && selTpl.required_placeholders.length > 0 && (
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ fontSize: 9, color: 'var(--white-3)', marginBottom: 10, letterSpacing: '1.2px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 8 }}>
                          Required Fields <span style={{ color: '#e07070', fontSize: 9 }}>* all mandatory</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                          {selTpl.required_placeholders.map(p => (
                            <div key={p}>
                              <label style={{ fontSize: 9, color: 'var(--gold)', display: 'block', marginBottom: 5, letterSpacing: '.8px', textTransform: 'uppercase' }}>
                                {p.replace(/_/g, ' ')}
                              </label>
                              <input type='text' value={genForm.params[p] || ''}
                                onChange={e => setGenForm(prev => ({ ...prev, params: { ...prev.params, [p]: e.target.value } }))}
                                className="nlc-input" style={{ width: '100%', padding: '8px 10px', fontSize: 12 }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div style={{ marginBottom: 20 }}>
                      <label style={{ fontSize: 9, color: 'var(--white-3)', display: 'block', marginBottom: 6, letterSpacing: '1.2px', textTransform: 'uppercase' }}>Notes (optional)</label>
                      <textarea value={genForm.notes} onChange={e => setGenForm(p => ({ ...p, notes: e.target.value }))}
                        rows={2} className="nlc-input"
                        style={{ width: '100%', padding: '9px 12px', fontSize: 12, resize: 'vertical' }}
                        placeholder="Any additional context for the AI generator…"
                      />
                    </div>

                    <button onClick={handleGenerate} disabled={generating} className="nlc-btn-gold"
                      style={{ width: '100%', padding: '11px', fontSize: 11, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>
                      {generating ? 'Queuing generation…' : 'Generate Document'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--white-3)', fontSize: 13 }}>
            <div className="font-cormorant" style={{ fontSize: 28, color: 'var(--gold)', opacity: 0.3, marginBottom: 10 }}>◌</div>
            Loading documents…
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div className="font-cormorant" style={{ fontSize: 32, color: 'var(--gold)', opacity: 0.2, marginBottom: 12 }}>§</div>
            <div style={{ color: 'var(--white-3)', fontSize: 13 }}>
              {docs.length === 0 ? 'No documents yet — use Generate Document to create the first one.' : 'No documents match this filter.'}
            </div>
          </div>
        ) : (
          <div className="nlc-card" style={{ overflow: 'hidden' }}>
            <table className="nlc-table" style={{ tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: '30%' }} /><col style={{ width: '22%' }} />
                <col style={{ width: '18%' }} /><col style={{ width: '14%' }} /><col style={{ width: '16%' }} />
              </colgroup>
              <thead>
                <tr><th>Document</th><th>Company</th><th>Status</th><th>Created</th><th></th></tr>
              </thead>
              <tbody>
                {filtered.map(d => (
                  <tr key={d.id}>
                    <td>
                      <div style={{ fontWeight: 500, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {d.title || d.document_type?.replace(/_/g, ' ')}
                      </div>
                      {d.template_name && (
                        <div style={{ fontSize: 10, color: 'var(--white-3)', marginTop: 2 }}>{d.template_name.replace(/_/g, ' ')}</div>
                      )}
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--white-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {d.company_name || d.company_id}
                    </td>
                    <td><StatusChip status={d._status || 'DRAFT'} /></td>
                    <td style={{ fontSize: 11, color: 'var(--white-3)' }}>
                      {d.created_at ? new Date(d.created_at).toLocaleDateString('en-GB') : '—'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {d._status === 'PENDING_REVIEW' && (
                          <button onClick={() => handleApprove(d.id)} style={{
                            padding: '4px 10px', fontSize: 9, fontWeight: 600, letterSpacing: '.6px', textTransform: 'uppercase',
                            background: 'var(--green-bg)', border: '1px solid rgba(26,122,82,.3)', color: '#5dd4a0', cursor: 'pointer',
                          }}>Approve</button>
                        )}
                        <button style={{
                          padding: '4px 10px', fontSize: 9, fontWeight: 600, letterSpacing: '.6px', textTransform: 'uppercase',
                          background: 'transparent', border: '1px solid var(--navy-border)', color: 'var(--white-2)', cursor: 'pointer',
                        }}>{d._status === 'APPROVED' ? 'Download' : 'View'}</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
