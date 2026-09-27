"use client"
import { companiesApi } from '@/lib/api'

export default function CommercialPage() {
  return (
    <div style={{padding:24}}>
      <div className="font-garamond" style={{fontSize:22,color:'var(--nlc-white)',marginBottom:6}}>Revenue Intelligence</div>
      <div style={{fontSize:12,color:'var(--white-3)',marginBottom:22}}>Compliance risk to billable engagement conversion</div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14,marginBottom:18}}>
        {[['Active Rescue','Corporate Rescue','#0A0A0A'],['Regularization','Structured Package','var(--red)'],['Compliance','Compliance Package','var(--yellow)']].map(([l,t,c])=>(
          <div key={l} className="nlc-card" style={{borderTop:`4px solid ${c}`}}>
            <div className="font-mono" style={{fontSize:9.5,color:'var(--text3)',letterSpacing:'.1em',marginBottom:8}}>{l.toUpperCase()}</div>
            <div className="font-garamond" style={{fontSize:16,color:c}}>{t}</div>
          </div>
        ))}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
        <div className="nlc-card">
          <div className="sec-lbl gold">Conversion Pipeline</div>
          {[['Default Detected',46,'var(--red)'],['Rescue Plan',19,'var(--yellow)'],['Quotation Sent',12,'var(--teal)'],['Engagement',8,'var(--navy)'],['Payment',6,'var(--green)']].map(([s,n,c])=>(
            <div key={s} style={{marginBottom:14}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:5}}>
                <span style={{fontSize:12}}>{s}</span>
                <span className="font-mono" style={{fontSize:12,fontWeight:700,color:c}}>{n}</span>
              </div>
              <div className="pbar"><div className="pbar-fill" style={{width:`${(n/46)*100}%`,background:c}}/></div>
            </div>
          ))}
        </div>
        <div className="nlc-card">
          <div className="sec-lbl">90-Day Forecast</div>
          {[['Corporate Rescue','22-28L','#0A0A0A'],['Regularization','14-18L','var(--red)'],['Compliance Pkg','8-12L','var(--yellow)']].map(([t,e,c])=>(
            <div key={t} style={{padding:14,marginBottom:10,background:'var(--surface)',borderRadius:8,borderLeft:`4px solid ${c}`,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div style={{fontSize:12,fontWeight:600,color:'var(--navy)'}}>{t}</div>
              <div className="font-garamond" style={{fontSize:18,color:c}}>BDT {e}</div>
            </div>
          ))}
          <div style={{padding:14,background:'var(--navy)',borderRadius:9,textAlign:'center'}}>
            <div className="font-mono" style={{fontSize:9,color:'rgba(255,255,255,.4)',letterSpacing:'.1em',marginBottom:4}}>TOTAL PROJECTED</div>
            <div className="font-garamond" style={{fontSize:26,color:'var(--gold)'}}>BDT 44-58 L</div>
          </div>
        </div>
      </div>
    </div>
  )
}
