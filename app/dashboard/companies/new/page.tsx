'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { companiesApi } from '@/lib/api'
import Topbar from '@/components/Topbar'

export default function AddCompanyPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    company_name: '',
    registration_number: '',
    company_type: 'PRIVATE_LIMITED',
    incorporation_date: '',
    financial_year_end: '',
    registered_address: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await companiesApi.create({
        ...form,
        company_name: form.company_name.trim(),
        registration_number: form.registration_number.trim(),
        registered_address: form.registered_address.trim(),
        financial_year_end: form.financial_year_end || undefined,
      })
      router.push('/dashboard/companies')
    } catch (err: any) {
      setError(err.message || 'Failed to add company')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = { width: '100%', padding: '10px 14px', background: 'var(--navy-bg)', border: '1px solid var(--navy-border)', color: 'white', borderRadius: 4, fontSize: 13 }
  const labelStyle = { fontSize: 12, color: 'var(--white-2)', display: 'block', marginBottom: 6 }

  return (
    <>
      <Topbar title="Add New Company" />
      <div style={{ padding: 28, maxWidth: 900 }}>
        <div className="nlc-card" style={{ padding: 32 }}>
          {error && <div style={{ color: '#e07070', marginBottom: 16, fontSize: 14 }}>{error}</div>}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div>
                <label style={labelStyle}>Company Name *</label>
                <input required value={form.company_name} onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>RJSC Registration Number *</label>
                <input required value={form.registration_number} onChange={e => setForm(f => ({ ...f, registration_number: e.target.value }))} placeholder="C-XXXXX" style={inputStyle} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
              <div>
                <label style={labelStyle}>Company Type *</label>
                <select value={form.company_type} onChange={e => setForm(f => ({ ...f, company_type: e.target.value }))} style={inputStyle}>
                  <option value="PRIVATE_LIMITED">Private Limited</option>
                  <option value="PUBLIC_LIMITED">Public Limited</option>
                  <option value="ONE_PERSON">One Person</option>
                  <option value="FOREIGN_BRANCH">Foreign Branch</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Incorporation Date *</label>
                <input required type="date" value={form.incorporation_date} onChange={e => setForm(f => ({ ...f, incorporation_date: e.target.value }))} style={inputStyle} />
              </div>
                <div>
                <label style={labelStyle}>Financial Year End</label>
                <input type="date" value={form.financial_year_end} onChange={e => setForm(f => ({ ...f, financial_year_end: e.target.value }))} style={inputStyle} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Registered Address *</label>
              <input required value={form.registered_address} onChange={e => setForm(f => ({ ...f, registered_address: e.target.value }))} style={inputStyle} />
            </div>
            <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
              <button type="submit" disabled={loading} className="nlc-btn-sm" style={{ padding: '10px 28px', fontSize: 14, background: 'var(--gold)', color: '#0a0e1a', fontWeight: 600, border: 'none', borderRadius: 4, cursor: 'pointer' }}>
                {loading ? 'Saving...' : 'Add Company'}
              </button>
              <button type="button" onClick={() => router.back()} style={{ padding: '10px 28px', fontSize: 14, background: 'transparent', border: '1px solid var(--navy-border)', color: 'var(--white-2)', borderRadius: 4, cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}