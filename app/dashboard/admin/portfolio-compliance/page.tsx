"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { companiesApi, portfolioComplianceApi } from "@/lib/api";
import { useCurrentUserRole } from "@/lib/use-current-user-role";

type InactiveCompany = {
  company_id: string;
  company_name: string;
  registration_number: string;
  company_status: string;
  is_dormant: boolean | null;
  is_active: boolean;
};

type Outcome = {
  company_id: string;
  company_name: string;
  status: string;
  pdf_eligible: boolean;
  evaluation_run_id?: string;
  score?: number | null;
  risk_band?: string | null;
  score_hash?: string | null;
  engine_version?: string | null;
  scoring_spec_version?: string | null;
  problems?: string[];
  error?: string;
};

export default function PortfolioCompliancePage() {
  const { role, loaded } = useCurrentUserRole();
  const [inactive, setInactive] = useState<InactiveCompany[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [reason, setReason] = useState("Restore platform access for the six previously deactivated company records. Statutory status and evidence are to remain unchanged.");
  const [outcomes, setOutcomes] = useState<Outcome[]>([]);
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState<"idle" | "reactivating" | "evaluating" | "complete">("idle");
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<{total:number;validated:number;not_released:number;failed:number;pdf_eligible:number} | null>(null);
  const [pdfBusy, setPdfBusy] = useState<string | null>(null);
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  const refreshInactive = useCallback(async () => {
    const rows = await portfolioComplianceApi.inactiveCompanies();
    setInactive(rows);
    setSelected(rows.map((row) => row.company_id));
  }, []);

  useEffect(() => {
    if (loaded && role === "SUPER_ADMIN") {
      void refreshInactive().catch((e) => setError(e instanceof Error ? e.message : "Could not load inactive companies."));
    }
  }, [loaded, role, refreshInactive]);

  const toggle = (id: string) => setSelected((current) =>
    current.includes(id) ? current.filter((value) => value !== id) : [...current, id]
  );

  const runPortfolio = async () => {
    setError(null);
    setLoading(true);
    setOutcomes([]);
    setSummary(null);
    setProgress({ done: 0, total: 0 });
    const results: Outcome[] = [];
    try {
      if (selected.length) {
        if (reason.trim().length < 10) throw new Error("Enter an audit reason of at least 10 characters.");
        setStage("reactivating");
        await portfolioComplianceApi.reactivate(selected, reason.trim());
        await refreshInactive();
      }
      setStage("evaluating");
      const companies = await companiesApi.list();
      if (!Array.isArray(companies)) throw new Error("The authenticated company list was not returned.");
      setProgress({ done: 0, total: companies.length });
      for (const company of companies) {
        const companyId = String(company.id || company.company_id || "");
        const companyName = String(company.name || company.company_name || companyId);
        if (!companyId) {
          results.push({ company_id: companyName, company_name: companyName, status: "FAILED", pdf_eligible: false, error: "Company identifier missing." });
        } else {
          try {
            const outcome = await portfolioComplianceApi.evaluateOne(companyId);
            results.push(outcome);
          } catch (e) {
            results.push({
              company_id: companyId,
              company_name: companyName,
              status: "FAILED",
              pdf_eligible: false,
              error: e instanceof Error ? e.message : "Evaluation request failed.",
            });
          }
        }
        setOutcomes([...results]);
        setProgress({ done: results.length, total: companies.length });
      }
      setSummary({
        total: results.length,
        validated: results.filter((item) => item.status === "VALIDATED").length,
        not_released: results.filter((item) => item.status === "NOT_RELEASED").length,
        failed: results.filter((item) => ["FAILED", "VALIDATION_FAILED"].includes(item.status)).length,
        pdf_eligible: results.filter((item) => item.pdf_eligible).length,
      });
      setStage("complete");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Portfolio operation failed.");
      setStage("idle");
    } finally {
      setLoading(false);
    }
  };

  const downloadPdf = async (row: Outcome) => {
    if (!row.pdf_eligible) return;
    setPdfBusy(row.company_id);
    try {
      await companiesApi.downloadPDF(row.company_id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "PDF download failed.");
    } finally {
      setPdfBusy(null);
    }
  };

  if (!loaded) return <div style={{padding:32,color:"#e5e7eb"}}>Loading authorization…</div>;
  if (role !== "SUPER_ADMIN") return <div role="alert" style={{padding:32,color:"#fecaca"}}>SUPER_ADMIN access is required for portfolio reactivation and evaluation.</div>;

  return (
    <div style={{padding:24,maxWidth:1180,margin:"0 auto",color:"#e5e7eb"}}>
      <header style={{marginBottom:24}}>
        <p style={{fontSize:11,letterSpacing:2,color:"#C9A84C"}}>SUPER_ADMIN · RELEASE OPERATIONS</p>
        <h1 style={{fontSize:28,fontWeight:700,margin:"8px 0"}}>Portfolio compliance evaluation</h1>
        <p style={{color:"#9ca3af",lineHeight:1.6}}>Reactivate selected platform records without changing statutory status or evidence, then evaluate every active company and validate its authoritative run before enabling PDF access.</p>
      </header>

      <section style={{background:"#10243d",border:"1px solid #29415f",borderRadius:12,padding:20,marginBottom:20}}>
        <h2 style={{fontSize:17,fontWeight:650,marginBottom:8}}>Inactive platform records ({inactive.length})</h2>
        <p style={{fontSize:12,color:"#aab7c8",marginBottom:12}}>Only the platform is_active flag is changed. company_status, dormant status, statutory facts, evidence and historical runs are preserved.</p>
        {inactive.length === 0 ? <p style={{color:"#aab7c8"}}>No inactive records found.</p> : inactive.map((row) => (
          <label key={row.company_id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderTop:"1px solid #29415f",fontSize:13}}>
            <input type="checkbox" checked={selected.includes(row.company_id)} onChange={() => toggle(row.company_id)} />
            <span style={{flex:1}}><strong>{row.company_name}</strong><small style={{display:"block",color:"#9ca3af"}}>{row.registration_number}</small></span>
            <span style={{fontSize:11,color:"#aab7c8"}}>Statutory: {row.company_status}{row.is_dormant ? " · Dormant" : ""}</span>
          </label>
        ))}
        <label style={{display:"block",fontSize:12,color:"#aab7c8",marginTop:14}}>Audit reason</label>
        <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} style={{width:"100%",marginTop:6,padding:10,borderRadius:7,background:"#07172b",color:"#e5e7eb",border:"1px solid #39516f"}} />
      </section>

      <section style={{background:"#10243d",border:"1px solid #29415f",borderRadius:12,padding:20,marginBottom:20}}>
        <h2 style={{fontSize:17,fontWeight:650,marginBottom:8}}>Evaluation workflow</h2>
        <p style={{fontSize:12,color:"#aab7c8",lineHeight:1.6}}>The backend processes active company records independently. A PDF is eligible only when the latest run is COMPLETED, has a score hash and current engine/spec versions, and its score reconciles with the company state.</p>
        <button type="button" disabled={loading} onClick={() => void runPortfolio()} style={{marginTop:14,padding:"11px 18px",borderRadius:8,background:loading?"#46566b":"#C9A84C",color:"#07172b",fontWeight:700,border:0,cursor:loading?"wait":"pointer"}}>
          {loading ? "Processing portfolio…" : "Reactivate selected & evaluate all active companies"}
        </button>
        {loading && <div role="status" style={{marginTop:14,color:"#e2c46a",fontSize:13}}>{stage === "reactivating" ? "Writing audited reactivation events…" : `Evaluating companies and validating authoritative runs… ${progress.done}/${progress.total}`} This operation is in progress; keep this page open.
          {stage === "evaluating" && <div style={{height:7,background:"#29415f",borderRadius:8,marginTop:9,overflow:"hidden"}}><div style={{height:"100%",width:progress.total ? `${(progress.done/progress.total)*100}%` : "0%",background:"#C9A84C",transition:"width .2s"}} /></div>}
        </div>}
      </section>

      {error && <div role="alert" style={{padding:12,background:"#421f2a",border:"1px solid #9f3d4c",borderRadius:8,marginBottom:16}}>{error}</div>}
      {summary && <section style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:10,marginBottom:18}}>
        {[
          ["Processed",summary.total],["Validated",summary.validated],["Not released",summary.not_released],["Failed",summary.failed],["PDF eligible",summary.pdf_eligible],
        ].map(([label,value]) => <div key={String(label)} style={{background:"#10243d",border:"1px solid #29415f",borderRadius:9,padding:14}}><div style={{fontSize:11,color:"#9ca3af"}}>{label}</div><strong style={{fontSize:24}}>{value}</strong></div>)}
      </section>}

      {outcomes.length > 0 && <section style={{background:"#10243d",border:"1px solid #29415f",borderRadius:12,padding:20}}>
        <h2 style={{fontSize:17,fontWeight:650,marginBottom:12}}>Company-by-company outcomes</h2>
        {outcomes.map((row) => <div key={row.company_id} style={{display:"flex",gap:12,alignItems:"center",padding:"12px 0",borderTop:"1px solid #29415f",flexWrap:"wrap"}}>
          <div style={{flex:1,minWidth:220}}>
            <strong>{row.company_name}</strong>
            <div style={{fontSize:11,color:"#9ca3af",marginTop:3}}>{row.status} · {row.engine_version || "No engine"} · {row.scoring_spec_version || "No spec"}</div>
            {row.problems?.length ? <div style={{fontSize:11,color:"#fca5a5"}}>{row.problems.join(", ")}</div> : null}
            {row.error ? <div style={{fontSize:11,color:"#fca5a5"}}>{row.error}</div> : null}
            {row.score_hash && <div style={{fontSize:10,color:"#7f91a8",fontFamily:"monospace"}}>Hash: {row.score_hash.slice(0,18)}… · Run {row.evaluation_run_id}</div>}
          </div>
          <span style={{fontSize:12,color:row.pdf_eligible?"#86efac":"#fbbf24"}}>{row.pdf_eligible ? "Reconciled" : "PDF withheld"}</span>
          <button type="button" disabled={!row.pdf_eligible || pdfBusy===row.company_id} onClick={() => void downloadPdf(row)} style={{padding:"8px 12px",borderRadius:7,border:"1px solid #53677f",background:"transparent",color:row.pdf_eligible?"#e5e7eb":"#718096",cursor:row.pdf_eligible?"pointer":"not-allowed"}}>{pdfBusy===row.company_id?"Preparing…":"Download PDF"}</button>
        </div>)}
      </section>}
      <p style={{fontSize:11,color:"#9ca3af",marginTop:18,lineHeight:1.6}}>PDFs remain unsigned and for counsel review only. Product scoring release is not independent legal verification, legal advice or certification. Not every company is guaranteed to produce a releasable score.</p>
    </div>
  );
}
