"use client"
import { useState, useEffect } from 'react'
import { filingsApi } from '@/lib/api'

export default function FilingsPage() {
  const [agms, setAgms] = useState<any[]>([])
  const [returns, setReturns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])
  const load = async () => {
    try {
      const [a, r] = await Promise.all([
        filingsApi.listAGM().catch(()=>[]),
        filingsApi.listAnnualReturn().catch(()=>[]),
      ])
      setAgms(Array.isArray(a)?a:[]); setReturns(Array.isArray(r)?r:[])
    } catch(e) { console.error(e) }
    finally { setLoading(false) }
  }

  if (loading) return <div style={{padding:40,color:'rgba(255,255,255,.35)'}}>Loading filings...</div>

  return (
    <div style={{padding:24}}>
      <div className="font-garamond" style={{fontSize:22,color:'#f4f1ea',marginBottom:20}}>Filings</div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
        <div className="nlc-card">
          <div className="sec-lbl gold">AGM Records ({agms.length})</div>
          {agms.length === 0 ? (
            <div style={{fontSize:12,color:'#9CA3AF',textAlign:'center',padding:20}}>No AGM records</div>
          ) : agms.map((a,i) => (
            <div key={i} style={{padding:'10px 0',borderBottom:'1px solid #E4E8EF'}}>
              <div style={{display:'flex',justifyContent:'space-between'}}>
                <span style={{fontSize:12,fontWeight:600,color:'#07172B'}}>FY {a.financial_year}</span>
                <span className={`badge badge-${a.is_default?'red':'green'}`}>{a.is_default?'Default':'Filed'}</span>
              </div>
              <div style={{fontSize:10,color:'#9CA3AF',marginTop:2}}>Due: {a.agm_due_date || '—'} | Held: {a.agm_date || 'Not held'}</div>
            </div>
          ))}
        </div>
        <div className="nlc-card">
          <div className="sec-lbl gold">Annual Returns ({returns.length})</div>
          {returns.length === 0 ? (
            <div style={{fontSize:12,color:'#9CA3AF',textAlign:'center',padding:20}}>No return records</div>
          ) : returns.map((r,i) => (
            <div key={i} style={{padding:'10px 0',borderBottom:'1px solid #E4E8EF'}}>
              <div style={{display:'flex',justifyContent:'space-between'}}>
                <span style={{fontSize:12,fontWeight:600,color:'#07172B'}}>FY {r.financial_year}</span>
                <span className={`badge badge-${r.is_default?'red':'green'}`}>{r.is_default?'Default':'Filed'}</span>
              </div>
              <div style={{fontSize:10,color:'#9CA3AF',marginTop:2}}>Filed: {r.filed_date || '—'}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
