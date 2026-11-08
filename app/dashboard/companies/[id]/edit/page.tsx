"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ApiError, companiesApi } from "@/lib/api";
import { useCurrentUserRole } from "@/lib/use-current-user-role";

const tiers = ["COMPLIANCE_PACKAGE","STRUCTURED_REGULARIZATION","CORPORATE_RESCUE"];

export default function EditCompanyPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { role, loaded: roleLoaded } = useCurrentUserRole();
  const authorised = roleLoaded && ["ADMIN_STAFF","SUPER_ADMIN"].includes(String(role));
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState("");
  const [form,setForm]=useState({company_name:"",registered_address:"",financial_year_end:"",revenue_tier:""});
  const [registrationNumber,setRegistrationNumber]=useState("");
  const [companyType,setCompanyType]=useState("");

  useEffect(()=>{
    if(!roleLoaded)return;
    if(!authorised)return;
    if(!id)return;
    let active=true;
    companiesApi.get(id).then((company:any)=>{
      if(!active)return;
      setForm({
        company_name:company.name||"",
        registered_address:company.registered_address||"",
        financial_year_end:company.financial_year_end||"",
        revenue_tier:company.revenue_tier||"",
      });
      setRegistrationNumber(company.registration_number||"");
      setCompanyType(company.company_type||"");
    }).catch((err)=>{
      if(active)setError(err instanceof ApiError?err.message:err instanceof Error?err.message:"Could not load company.");
    }).finally(()=>{if(active)setLoading(false);});
    return ()=>{active=false;};
  },[roleLoaded,authorised,id]);

  const submit=async(event:React.FormEvent<HTMLFormElement>)=>{
    event.preventDefault();setSaving(true);setError("");
    try{
      const update: Record<string, string> = {
        company_name: form.company_name.trim(),
        registered_address: form.registered_address.trim(),
      };
      if (form.financial_year_end) update.financial_year_end = form.financial_year_end;
      if (form.revenue_tier) update.revenue_tier = form.revenue_tier;
      await companiesApi.update(id, update);
      router.push("/dashboard/companies");
    }catch(err){
      setError(err instanceof ApiError?err.message:err instanceof Error?err.message:"Could not update company.");
    }finally{setSaving(false);}
  };

  if(!roleLoaded)return <div role="status" style={{padding:40}}>Checking access…</div>;
  if(!authorised)return <div role="alert" style={{padding:48,color:"#B91C1C"}}>Access denied — company editing is restricted to authorised staff.</div>;
  if(loading)return <div role="status" style={{padding:40,textAlign:"center"}}>Loading company…</div>;

  return <div style={{maxWidth:680,margin:"0 auto",padding:32}}>
    <h1 className="font-garamond" style={{fontSize:24,marginBottom:8}}>Edit Company</h1>
    <p style={{fontSize:12,color:"var(--text3)",marginBottom:20}}>Only fields supported by the current company-update API are editable here. Blank financial-year or service-tier values are omitted because this API does not currently support clearing those fields.</p>
    {error&&<div role="alert" style={{color:"#e07070",padding:12,marginBottom:16,borderRadius:4,background:"rgba(224,112,112,0.1)"}}>{error}</div>}
    <form onSubmit={submit} className="nlc-card" style={{display:"grid",gap:16}}>
      <label style={{display:"grid",gap:5,fontSize:12}}>Company name
        <input className="nlc-input" value={form.company_name} onChange={e=>setForm({...form,company_name:e.target.value})} required minLength={2} maxLength={255}/>
      </label>
      <label style={{display:"grid",gap:5,fontSize:12}}>Registration number
        <input className="nlc-input" value={registrationNumber} disabled/>
      </label>
      <label style={{display:"grid",gap:5,fontSize:12}}>Company type
        <input className="nlc-input" value={companyType} disabled/>
      </label>
      <label style={{display:"grid",gap:5,fontSize:12}}>Registered address
        <textarea className="nlc-input" value={form.registered_address} onChange={e=>setForm({...form,registered_address:e.target.value})} rows={3}/>
      </label>
      <label style={{display:"grid",gap:5,fontSize:12}}>Financial year end
        <input className="nlc-input" type="date" value={form.financial_year_end} onChange={e=>setForm({...form,financial_year_end:e.target.value})}/>
      </label>
      <label style={{display:"grid",gap:5,fontSize:12}}>Service tier
        <select className="nlc-input" value={form.revenue_tier} onChange={e=>setForm({...form,revenue_tier:e.target.value})}>
          <option value="">Not assigned</option>
          {tiers.map(tier=><option key={tier} value={tier}>{tier.replaceAll("_"," ")}</option>)}
        </select>
      </label>
      <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
        <button type="submit" className="nlc-btn-gold" disabled={saving}>{saving?"Saving…":"Save changes"}</button>
        <button type="button" className="nlc-btn-ghost" onClick={()=>router.push("/dashboard/companies")} disabled={saving}>Cancel</button>
      </div>
    </form>
  </div>;
}
