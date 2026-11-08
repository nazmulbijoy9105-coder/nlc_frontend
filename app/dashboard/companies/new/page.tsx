'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { companiesApi } from '@/lib/api'
import { useCurrentUserRole } from '@/lib/use-current-user-role'
import Topbar from '@/components/Topbar'
import { Building2, FileText, Shield, AlertCircle } from 'lucide-react'

export default function AddCompanyPage() {
  const router = useRouter()
  const { role, loaded: roleLoaded } = useCurrentUserRole()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeSection, setActiveSection] = useState<'basic' | 'tax' | 'enforcement'>('basic')
  
  const [evidenceReviewed, setEvidenceReviewed] = useState(false)
  const [form, setForm] = useState<Record<string, any>>({
    company_name: '',
    registration_number: '',
    company_type: 'PRIVATE_LIMITED',
    incorporation_date: '',
    financial_year_end: '',
    registered_address: '',
    // Tax fields
    trade_license_obtained: null,
    trade_license_expiry: '',
    tax_return_filed_for_current_fy: null,
    advance_tax_q1_paid: null,
    advance_tax_q2_paid: null,
    advance_tax_q3_paid: null,
    advance_tax_q4_paid: null,
    tds_deposited_up_to_date: null,
    last_tds_deposit_date: '',
    last_vat_return_filed: '',
    vat_annual_return_filed_for_fy: null,
    minimum_tax_paid: null,
    tax_clearance_obtained: null,
    tax_return_deadline_extended: null,
    // Enforcement
    any_director_disqualified: null,
    penalty_notices_received: null,
    penalty_notices_resolved: null,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const taxEvidenceFields = ['trade_license_obtained','tax_return_filed_for_current_fy','advance_tax_q1_paid','advance_tax_q2_paid','advance_tax_q3_paid','advance_tax_q4_paid','tds_deposited_up_to_date','vat_annual_return_filed_for_fy','minimum_tax_paid','tax_clearance_obtained','tax_return_deadline_extended']
    const enforcementEvidenceFields = ['any_director_disqualified']
    if (taxEvidenceFields.some((field) => typeof form[field] !== 'boolean')) {
      setActiveSection('tax')
      setError('Complete the tax evidence section using confirmed source-backed Yes/No answers. If a fact is unknown, do not guess; this backend contract must first support UNKNOWN.')
      return
    }
    if (enforcementEvidenceFields.some((field) => typeof form[field] !== 'boolean')) {
      setActiveSection('enforcement')
      setError('Complete the enforcement evidence section using confirmed source-backed Yes/No answers.')
      return
    }
    if (form.penalty_notices_received === null || form.penalty_notices_resolved === null) { setActiveSection('enforcement'); setError('Enter confirmed counts for received and resolved penalty notices.'); return }
    if (form.penalty_notices_resolved > form.penalty_notices_received) { setError('Resolved penalty notices cannot exceed the number of notices received.'); return }
    if (!evidenceReviewed) { setError('Confirm that the entered facts were checked against source records.'); return }
    setLoading(true)
    setError('')
    try {
      await companiesApi.create({
        ...form,
        company_name: form.company_name.trim(),
        registration_number: form.registration_number.trim(),
        registered_address: form.registered_address.trim(),
        financial_year_end: form.financial_year_end || undefined,
        trade_license_expiry: form.trade_license_expiry || undefined,
        last_tds_deposit_date: form.last_tds_deposit_date || undefined,
        last_vat_return_filed: form.last_vat_return_filed || undefined,
      })
      router.push('/dashboard/companies')
    } catch (err: any) {
      setError(err.message || 'Failed to add company')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = { 
    width: '100%', 
    padding: '12px 16px', 
    background: 'rgba(30, 58, 95, 0.3)', 
    border: '1px solid rgba(200, 168, 75, 0.2)', 
    color: '#e5e7eb', 
    borderRadius: 12, 
    fontSize: 14,
    outline: 'none',
    transition: 'all 0.2s'
  }
  
  const labelStyle = { 
    fontSize: 12, 
    color: '#9ca3af', 
    display: 'block', 
    marginBottom: 8,
    fontWeight: 500 
  }

  const sectionButton = (section: 'basic' | 'tax' | 'enforcement', icon: React.ReactNode, label: string) => (
    <button
      type="button"
      onClick={() => setActiveSection(section)}
      style={{
        padding: '12px 20px',
        borderRadius: 12,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: 13,
        fontWeight: 600,
        background: activeSection === section ? 'rgba(200, 168, 75, 0.2)' : 'rgba(255, 255, 255, 0.03)',
        color: activeSection === section ? '#c8a84b' : '#6b7280',
        border: activeSection === section ? '1px solid rgba(200, 168, 75, 0.3)' : '1px solid transparent',
        transition: 'all 0.2s'
      }}
    >
      {icon}
      {label}
    </button>
  )

  const booleanInputValue = (value: boolean | null) => value === null ? '' : value ? 'true' : 'false'
  const parseBooleanInput = (value: string): boolean | null => value === '' ? null : value === 'true'

  const toggleStyle = (value: boolean | null) => ({
    ...inputStyle,
    cursor: 'pointer',
    background: value === true ? 'rgba(16, 185, 129, 0.2)' : value === false ? 'rgba(239, 68, 68, 0.1)' : 'rgba(148, 163, 184, 0.08)',
    border: value === true ? '1px solid rgba(16, 185, 129, 0.3)' : value === false ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid rgba(148, 163, 184, 0.25)',
    color: value === true ? '#10b981' : value === false ? '#ef4444' : '#94a3b8',
    textAlign: 'center' as const,
    fontWeight: 600
  })

  if (!roleLoaded) return <div role="status" style={{ padding: 48, color: '#9CA3AF' }}>Checking access…</div>
  if (!['ADMIN_STAFF', 'SUPER_ADMIN'].includes(String(role))) return <div role="alert" style={{ padding: 48, color: '#B91C1C' }}>Access denied — company creation is restricted to authorised staff.</div>

  return (
    <>
      <Topbar title="Add New Company" />
      <div style={{ padding: 28, maxWidth: 1000 }}>
        <div style={{
          padding: 32,
          borderRadius: 24,
          background: 'linear-gradient(135deg, rgba(30, 58, 95, 0.3) 0%, rgba(15, 23, 42, 0.5) 100%)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(200, 168, 75, 0.1)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
        }}>
          {error && (
            <div style={{ 
              color: '#ef4444', 
              marginBottom: 20, 
              fontSize: 14, 
              padding: '12px 16px',
              borderRadius: 12,
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div role="note" style={{padding:12,marginBottom:18,border:'1px solid rgba(201,168,76,.25)',borderRadius:10,color:'#cbd5e1',fontSize:11,lineHeight:1.6}}>Tax and enforcement facts must be entered from source records. The current backend requires explicit Yes/No values and cannot persist UNKNOWN for these fields. If you cannot substantiate a value, stop and obtain the missing evidence rather than guessing.</div>

          {/* Section Tabs */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 28 }}>
            {sectionButton('basic', <Building2 size={16} />, 'Basic Info')}
            {sectionButton('tax', <FileText size={16} />, 'Tax Compliance')}
            {sectionButton('enforcement', <Shield size={16} />, 'Enforcement')}
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {activeSection === 'basic' && (
              <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  <div>
                    <label style={labelStyle}>Company Name *</label>
                    <input required value={form.company_name} onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))} style={inputStyle} placeholder="Enter company name" />
                  </div>
                  <div>
                    <label style={labelStyle}>RJSC Registration Number *</label>
                    <input required value={form.registration_number} onChange={e => setForm(f => ({ ...f, registration_number: e.target.value }))} placeholder="C-XXXXX" style={inputStyle} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginTop: 20 }}>
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
                <div style={{ marginTop: 20 }}>
                  <label style={labelStyle}>Registered Address *</label>
                  <input required value={form.registered_address} onChange={e => setForm(f => ({ ...f, registered_address: e.target.value }))} style={inputStyle} placeholder="Full registered address" />
                </div>
              </div>
            )}

            {activeSection === 'tax' && (
              <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  <div>
                    <label style={labelStyle}>Trade License Obtained</label>
                    <select required value={booleanInputValue(form.trade_license_obtained)} onChange={e => setForm((f: any) => ({ ...f, trade_license_obtained: parseBooleanInput(e.target.value) }))} style={toggleStyle(form.trade_license_obtained)}>
                      <option value="">Select confirmed status</option>
                      <option value="false">❌ Not Obtained</option>
                      <option value="true">✅ Obtained</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Trade License Expiry</label>
                    <input type="date" value={form.trade_license_expiry} onChange={e => setForm(f => ({ ...f, trade_license_expiry: e.target.value }))} style={inputStyle} />
                  </div>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 20 }}>
                  <div>
                    <label style={labelStyle}>Tax Return Filed (Current FY)</label>
                    <select required value={booleanInputValue(form.tax_return_filed_for_current_fy)} onChange={e => setForm((f: any) => ({ ...f, tax_return_filed_for_current_fy: parseBooleanInput(e.target.value) }))} style={toggleStyle(form.tax_return_filed_for_current_fy)}>
                      <option value="">Select confirmed status</option>
                      <option value="">Select confirmed status</option>
                      <option value="false">❌ Not Filed</option>
                      <option value="true">✅ Filed</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Tax Deadline Extended</label>
                    <select required value={booleanInputValue(form.tax_return_deadline_extended)} onChange={e => setForm((f: any) => ({ ...f, tax_return_deadline_extended: parseBooleanInput(e.target.value) }))} style={toggleStyle(form.tax_return_deadline_extended)}>
                      <option value="">Select confirmed status</option>
                      <option value="false">No</option>
                      <option value="true">Yes</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginTop: 24, marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#c8a84b', marginBottom: 12 }}>Advance Tax Payments</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 }}>
                    {['q1', 'q2', 'q3', 'q4'].map((q, i) => (
                      <div key={q}>
                        <label style={labelStyle}>Q{i + 1} Paid</label>
                        <select 
                          required value={booleanInputValue(form[`advance_tax_${q}_paid`])} 
                          onChange={e => setForm((f: any) => ({ ...f, [`advance_tax_${q}_paid`]: parseBooleanInput(e.target.value) }))} 
                          style={toggleStyle(form[`advance_tax_${q}_paid`])}
                        >
                          <option value="">Select</option>
                          <option value="false">❌</option>
                          <option value="true">✅</option>
                        </select>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginTop: 20 }}>
                  <div>
                    <label style={labelStyle}>TDS Deposited</label>
                    <select required value={booleanInputValue(form.tds_deposited_up_to_date)} onChange={e => setForm((f: any) => ({ ...f, tds_deposited_up_to_date: parseBooleanInput(e.target.value) }))} style={toggleStyle(form.tds_deposited_up_to_date)}>
                      <option value="">Select confirmed status</option>
                      <option value="false">❌ Not Deposited</option>
                      <option value="true">✅ Deposited</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Last TDS Deposit</label>
                    <input type="date" value={form.last_tds_deposit_date} onChange={e => setForm(f => ({ ...f, last_tds_deposit_date: e.target.value }))} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>VAT Annual Return</label>
                    <select required value={booleanInputValue(form.vat_annual_return_filed_for_fy)} onChange={e => setForm((f: any) => ({ ...f, vat_annual_return_filed_for_fy: parseBooleanInput(e.target.value) }))} style={toggleStyle(form.vat_annual_return_filed_for_fy)}>
                      <option value="">Select confirmed status</option>
                      <option value="false">❌ Not Filed</option>
                      <option value="true">✅ Filed</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'enforcement' && (
              <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  <div>
                    <label style={labelStyle}>Director Disqualified</label>
                    <select required value={booleanInputValue(form.any_director_disqualified)} onChange={e => setForm((f: any) => ({ ...f, any_director_disqualified: parseBooleanInput(e.target.value) }))} style={toggleStyle(form.any_director_disqualified)}>
                      <option value="">Select confirmed status</option>
                      <option value="false">✅ No</option>
                      <option value="true">❌ Yes</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Tax Clearance Obtained</label>
                    <select required value={booleanInputValue(form.tax_clearance_obtained)} onChange={e => setForm((f: any) => ({ ...f, tax_clearance_obtained: parseBooleanInput(e.target.value) }))} style={toggleStyle(form.tax_clearance_obtained)}>
                      <option value="">Select confirmed status</option>
                      <option value="false">❌ Not Obtained</option>
                      <option value="true">✅ Obtained</option>
                    </select>
                  </div>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 20 }}>
                  <div>
                    <label style={labelStyle}>Minimum Tax Paid</label>
                    <select required value={booleanInputValue(form.minimum_tax_paid)} onChange={e => setForm((f: any) => ({ ...f, minimum_tax_paid: parseBooleanInput(e.target.value) }))} style={toggleStyle(form.minimum_tax_paid)}>
                      <option value="">Select confirmed status</option>
                      <option value="false">❌ Not Paid</option>
                      <option value="true">✅ Paid</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 20 }}>
                  <div>
                    <label style={labelStyle}>Penalty Notices Received</label>
                    <input required type="number" min="0" value={form.penalty_notices_received ?? ""} onChange={e => setForm((f: any) => ({ ...f, penalty_notices_received: e.target.value === "" ? null : Number.parseInt(e.target.value, 10) }))} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Penalty Notices Resolved</label>
                    <input required type="number" min="0" value={form.penalty_notices_resolved ?? ""} onChange={e => setForm((f: any) => ({ ...f, penalty_notices_resolved: e.target.value === "" ? null : Number.parseInt(e.target.value, 10) }))} style={inputStyle} />
                  </div>
                </div>
              </div>
            )}

            <label style={{display:'flex',alignItems:'flex-start',gap:10,fontSize:12,lineHeight:1.6,color:'#9ca3af'}}>
              <input type="checkbox" required checked={evidenceReviewed} onChange={event=>setEvidenceReviewed(event.target.checked)} />
              I checked the tax and enforcement answers against source records available to me. These are user-supplied facts and have not been independently verified by NLC.
            </label>
            <div style={{ display: 'flex', gap: 16, marginTop: 32, paddingTop: 24, borderTop: '1px solid rgba(200, 168, 75, 0.1)' }}>
              <button 
                type="submit" 
                disabled={loading} 
                style={{ 
                  padding: '14px 32px', 
                  fontSize: 14, 
                  background: 'linear-gradient(135deg, #c8a84b, #a88a3a)', 
                  color: '#0a0e1a', 
                  fontWeight: 700, 
                  border: 'none', 
                  borderRadius: 12, 
                  cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(200, 168, 75, 0.3)',
                  transition: 'all 0.2s'
                }}
              >
                {loading ? '⏳ Saving...' : '✨ Add Company'}
              </button>
              <button 
                type="button" 
                onClick={() => router.back()} 
                style={{ 
                  padding: '14px 32px', 
                  fontSize: 14, 
                  background: 'transparent', 
                  border: '1px solid rgba(200, 168, 75, 0.2)', 
                  color: '#9ca3af', 
                  borderRadius: 12, 
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
