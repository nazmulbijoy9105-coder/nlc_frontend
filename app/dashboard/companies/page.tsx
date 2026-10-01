"use client"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { companiesApi } from '@/lib/api'

export default function CompaniesPage() {
  const router = useRouter()
  const [companies, setCompanies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])
  const load = async () => {
    try { const data = await companiesApi.list(); setCompanies(data) }
    catch(e) { console.error(e) }
    finally { setLoading(false) }
  }

  if (loading) return <div style={{padding:40,color:'var(--white-3)'}}>Loading companies...</div>

  const bandColor = (b: any) => b==='GREEN'?'#1a7a52':b==='YELLOW'?'#D97706':b==='RED'?'#B91C1C':'#A855F7'
  const bandBg = (b: any) => b==='GREEN'?'rgba(26,122,82,.15)':b==='YELLOW'?'rgba(160,120,32,.15)':b==='RED'?'rgba(160,48,48,.15)':'rgba(168,85,247,.15)'

  return (
    <div style={{padding:24}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
        <div className="font-garamond" style={{fontSize:22,color:'var(--nlc-white)'}}>Companies</div>
        <button className="nlc-btn-gold" style={{width:'auto',padding:'8px 20px'}} onClick={()=>router.push('/dashboard/companies/new')}>+ New Company</button>
      </div>
      <div className="nlc-card">
        <div className="sec-lbl gold">Portfolio — {companies.length} Companies</div>
        <table className="nlc-table">
          <thead><tr><th>Company</th><th>Reg. No.</th><th>Score</th><th>Band</th><th>Flags</th></tr></thead>
          <tbody>
            {companies.length === 0 ? (
              <tr><td colSpan={5} style={{textAlign:'center',padding:30,color:'var(--text3)'}}>No companies yet. Create one to get started.</td></tr>
            ) : companies.map((c) => (
              <tr key={c.id} onClick={()=>router.push(`/dashboard/companies/${c.id}`)} style={{cursor:'pointer'}}>
                <td style={{fontWeight:600,color:'var(--navy)'}}>{c.company_name || c.name || 'Unknown'}</td>
                <td className="font-mono" style={{fontSize:11,color:'var(--text3)'}}>{c.rjsc_registration_number || c.registration_number || '—'}</td>
                <td className="font-mono" style={{fontWeight:700,color:bandColor(c.current_risk_band)}}>{c.current_compliance_score ?? '—'}</td>
                <td><span className={`badge badge-${(c.current_risk_band||'neutral').toLowerCase()}`}>{c.current_risk_band || '—'}</span></td>
                <td className="font-mono" style={{color:'var(--text3)'}}>{c.active_flags ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Disclaimer
export function Disclaimer() {
  return (
    <div style={{
      padding: "12px 20px",
      marginTop: 20,
      background: "rgba(201,168,76,0.08)",
      borderTop: "1px solid var(--border)",
      fontSize: 11,
      color: "var(--text3)",
      textAlign: "center",
      fontFamily: "'JetBrains Mono', monospace"
    }}>
      Automated compliance screening. Not legal advice. Consult your legal counsel.
    </div>
  )
}
