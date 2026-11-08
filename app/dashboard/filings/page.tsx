"use client";
import { useCallback, useEffect, useState } from "react";
import { ApiError, api } from "@/lib/api";

interface FilingPortfolio {
  agms: any[];
  audits: any[];
  annual_returns: any[];
}

export default function FilingsPage() {
  const [agms,setAgms]=useState<any[]>([]);
  const [audits,setAudits]=useState<any[]>([]);
  const [returns,setReturns]=useState<any[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState<string|null>(null);

  const load=useCallback(async()=>{
    setLoading(true);setError(null);
    try{
      const data=await api.get<FilingPortfolio>("/api/v1/filings");
      if(!data||!Array.isArray(data.agms)||!Array.isArray(data.audits)||!Array.isArray(data.annual_returns)){
        throw new Error("Filings service returned an unexpected portfolio response.");
      }
      setAgms(data.agms);setAudits(data.audits);setReturns(data.annual_returns);
    }catch(err){
      setError(err instanceof ApiError?err.message:err instanceof Error?err.message:"Could not load filings.");
    }finally{setLoading(false);}
  },[]);
  useEffect(()=>{void load();},[load]);

  const section=(title:string,items:any[],kind:"agm"|"audit"|"return")=>(
    <section className="nlc-card">
      <div className="sec-lbl gold">{title} ({items.length})</div>
      {items.length===0?<div style={{fontSize:12,color:"#9CA3AF",textAlign:"center",padding:20}}>No records returned.</div>:
        items.map((item,index)=>(
          <article key={item.id||item.agm_id||item.audit_id||item.return_id||item.annual_return_id||index} style={{padding:"10px 0",borderBottom:"1px solid #E4E8EF"}}>
            <div style={{display:"flex",justifyContent:"space-between",gap:10,flexWrap:"wrap"}}>
              <span style={{fontSize:12,fontWeight:600,color:"#07172B"}}>{item.company_name || item.company_id || "Company"} · FY {item.financial_year ?? "Not recorded"}</span>
              <span className="badge badge-neutral">
                {kind==="agm"
                  ? item.is_default===null?"Legal review pending":item.is_default?"Potential default":item.filed_date?"Filing date recorded":item.held_date?"Held — filing evidence pending":"No filing evidence"
                  : kind==="return"
                    ? item.filing_evidence_status==="RECEIPT_REFERENCE_RECORDED_UNVERIFIED"?"Receipt reference recorded — unverified":item.filing_evidence_status==="DATE_RECORDED_UNVERIFIED"?"Filing date recorded — unverified":"No filing evidence recorded"
                    : item.status || item.audit_status || "Status not supplied"}
              </span>
            </div>
            <div style={{fontSize:10,color:"#9CA3AF",marginTop:4}}>
              {kind==="agm"?`Due: ${item.agm_due_date||"Not evaluated"} | Held: ${item.held_date||"Not recorded"}`:
               kind==="return"?`Filing date: ${item.filed_date||"Not recorded"} | RJSC acknowledgement: ${item.rjsc_acknowledgment_number||"Not recorded"} | Late fee paid: ${item.late_fee_paid?"Yes":"Not recorded"}`:
               `Signed date: ${item.signed_date||"Not recorded"} | Auditor: ${item.auditor_firm||"Not recorded"} | Opinion: ${item.audit_opinion||"Not recorded"}`}
            </div>
          </article>
        ))}
    </section>
  );

  return <div style={{padding:24}}>
    <div className="font-garamond" style={{fontSize:22,color:"#f4f1ea",marginBottom:20}}>Filings</div>
    {error&&<div role="alert" className="nlc-card" style={{marginBottom:16}}>
      <p style={{fontSize:12,color:"var(--red)"}}>{error}</p><button type="button" className="nlc-btn-ghost" onClick={()=>void load()}>Retry</button>
    </div>}
    {loading?<p role="status" style={{color:"rgba(255,255,255,.45)"}}>Loading filings…</p>:
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:14}}>
        {section("AGM Records",agms,"agm")}
        {section("Audit Records",audits,"audit")}
        {section("Annual Returns",returns,"return")}
      </div>}
  </div>;
}
