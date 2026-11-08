"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, companiesApi } from "@/lib/api";
import { getUser } from "@/lib/auth";

export default function CompaniesPage() {
  const router=useRouter();
  const [role,setRole]=useState<string|null>(null);
  const [roleLoaded,setRoleLoaded]=useState(false);
  useEffect(()=>{setRole(getUser()?.role??null);setRoleLoaded(true);},[]);
  const [companies,setCompanies]=useState<any[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState<string|null>(null);
  const canCreate=roleLoaded && ["ADMIN_STAFF","SUPER_ADMIN"].includes(String(role));

  const load=useCallback(async()=>{
    setLoading(true);setError(null);
    try{
      const data=await companiesApi.list();
      if(!Array.isArray(data))throw new Error("Company service returned an unexpected response.");
      setCompanies(data);
    }catch(err){
      setError(err instanceof ApiError?err.message:err instanceof Error?err.message:"Could not load companies.");
    }finally{setLoading(false);}
  },[]);
  useEffect(()=>{void load();},[load]);

  const bandColor=(band:string)=>band==="GREEN"?"#1a7a52":band==="YELLOW"?"#D97706":band==="RED"?"#B91C1C":band==="BLACK"?"#A855F7":"#6B7280";

  return <div style={{padding:24}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,marginBottom:20,flexWrap:"wrap"}}>
      <div className="font-garamond" style={{fontSize:22,color:"var(--nlc-white)"}}>Companies</div>
      {canCreate&&<button type="button" className="nlc-btn-gold" style={{width:"auto",padding:"8px 20px"}} onClick={()=>router.push("/dashboard/companies/new")}>+ New Company</button>}
    </div>
    {error&&<div role="alert" className="nlc-card" style={{marginBottom:16}}>
      <p style={{fontSize:12,color:"var(--red)"}}>{error}</p><button type="button" className="nlc-btn-ghost" onClick={()=>void load()}>Retry</button>
    </div>}
    {loading?<p role="status" style={{padding:40,color:"var(--white-3)"}}>Loading companies…</p>:<div className="nlc-card">
      <div className="sec-lbl gold">Authorised portfolio — {companies.length} companies</div>
      <div style={{overflowX:"auto"}}><table className="nlc-table" style={{minWidth:600}}>
        <thead><tr><th>Company</th><th>Reg. No.</th><th>Score</th><th>Band</th><th>Flags</th></tr></thead>
        <tbody>{companies.length===0?<tr><td colSpan={5} style={{textAlign:"center",padding:30,color:"var(--text3)"}}>No accessible companies were returned.</td></tr>:
          companies.map((company)=> {
            const band=company.band??"NOT_EVALUATED";
            const score=band==="NOT_EVALUATED"||company.compliance_score==null?"Not evaluated":company.compliance_score;
            return <tr key={company.id}>
              <td><button type="button" onClick={()=>router.push(`/dashboard/companies/${company.id}`)} className="text-left font-semibold text-blue-700 underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2">{company.name||"Unknown"}</button></td>
              <td className="font-mono" style={{fontSize:11,color:"var(--text3)"}}>{company.registration_number||"—"}</td>
              <td className="font-mono" style={{fontWeight:700,color:bandColor(band)}}>{score}</td>
              <td><span className={`badge badge-${String(band).toLowerCase()}`}>{band}</span></td>
              <td className="font-mono" style={{color:"var(--text3)"}}>{company.violation_count??0}</td>
            </tr>;
          })}
        </tbody>
      </table></div>
    </div>}
  </div>;
}
