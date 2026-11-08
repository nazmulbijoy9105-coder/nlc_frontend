"use client";
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ApiError, rescueApi } from "@/lib/api";

export default function RescuePage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [legalReviewPending, setLegalReviewPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const companyId = searchParams.get("company_id");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setLegalReviewPending(false);
    try {
      const data = await rescueApi.list(companyId || undefined);
      if (!Array.isArray(data)) throw new Error("The rescue service returned an unexpected response.");
      setPlans(data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 503) setLegalReviewPending(true);
      else setError(err instanceof Error ? err.message : "Could not load rescue plans.");
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => { void load(); }, [load]);

  if (loading) return <div role="status" style={{padding:40,color:"var(--white-3)"}}>Loading rescue cases…</div>;

  if (legalReviewPending) return (
    <div style={{padding:24}}>
      <div className="nlc-card" role="status" style={{maxWidth:760,margin:"24px auto"}}>
        <div className="font-garamond" style={{fontSize:22,color:"var(--nlc-white)",marginBottom:8}}>Rescue assessment unavailable</div>
        <p style={{fontSize:13,lineHeight:1.7,color:"var(--text2)"}}>
          NLC has withheld RED/BLACK-based rescue plans pending independent legal validation.
          No company default or legal liability is determined by this screen.
        </p>
      </div>
    </div>
  );

  const latestPlan = plans[0];
  const rawSteps: any[] = Array.isArray(latestPlan?.steps) ? latestPlan.steps : [];
  const complexityRank = (value: string) => {
    const level = (value || "").toUpperCase();
    return level === "CRITICAL" || level === "HIGH" ? 0 : level === "MEDIUM" ? 1 : 2;
  };
  const steps = [...rawSteps].sort((a, b) => complexityRank(a.complexity) - complexityRank(b.complexity));

  return (
    <div style={{padding:24}}>
      {error && <div role="alert" className="nlc-card" style={{marginBottom:16}}>
        <p style={{color:"var(--red)"}}>{error}</p>
        <button type="button" className="nlc-btn-ghost" onClick={() => void load()}>Retry</button>
      </div>}
      <div style={{marginBottom:22}}>
        <div className="font-garamond" style={{fontSize:22,color:"var(--nlc-white)",marginBottom:4}}>{companyId ? "Company Rescue Plan" : "Default Rescue Roadmap"}</div>
        <div style={{fontSize:12,color:"var(--white-3)"}}>Structured remediation for companies in default</div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:14,marginBottom:20}}>
        {[
          ["Rescue Cases", plans.length, "var(--red)"],
          ["Total Steps", steps.length, "var(--navy-3)"],
          ["High Priority", steps.filter((s: any) => ["HIGH","CRITICAL"].includes(String(s.complexity).toUpperCase())).length, "var(--red)"],
          ["Est. Timeline", steps.length ? `${steps.reduce((sum: number, s: any) => sum + (Number(s.estimated_days_max) || 0), 0)} days` : "N/A", "var(--yellow)"]
        ].map(([label,value,color]) => (
          <div key={String(label)} className="nlc-card" style={{borderTop:`3px solid ${String(color)}`,textAlign:"center"}}>
            <div className="font-garamond" style={{fontSize:26,color:String(color),lineHeight:1}}>{value}</div>
            <div className="font-mono" style={{fontSize:9,color:"var(--text3)",marginTop:4,letterSpacing:".1em",textTransform:"uppercase"}}>{label}</div>
          </div>
        ))}
      </div>
      <div className="nlc-card">
        <div className="sec-lbl gold">Mandatory Rescue Sequence</div>
        {steps.length === 0 ? <p style={{padding:16,color:"var(--text3)"}}>No rescue steps are available for this plan.</p> : steps.map((step: any,index: number) => (
          <article key={step.step_id || step.step_number || index} style={{border:"1px solid var(--border)",borderRadius:9,borderLeft:"4px solid var(--navy)",marginBottom:8,overflow:"hidden"}}>
            <div style={{display:"grid",gridTemplateColumns:"44px 1fr auto auto",gap:14,padding:"14px 18px",alignItems:"center"}}>
              <div style={{width:34,height:34,borderRadius:"50%",background:"linear-gradient(135deg,var(--navy-3),var(--navy))",display:"flex",alignItems:"center",justifyContent:"center"}}>
                <span style={{color:"var(--gold)",fontWeight:700}}>{step.step_number || index + 1}</span>
              </div>
              <div>
                <div style={{fontSize:13,fontWeight:600,color:"var(--navy)"}}>{step.step_title || step.title || "Untitled step"}</div>
                <div style={{fontSize:11,color:"var(--text2)",marginTop:3}}>{step.step_description || step.desc || "No description supplied."}</div>
              </div>
              <span>{step.complexity || "UNSPECIFIED"}</span>
              <span style={{fontSize:11,color:"var(--text2)",minWidth:80,textAlign:"right"}}>{step.estimated_days_min != null && step.estimated_days_max != null ? `${step.estimated_days_min}-${step.estimated_days_max}d` : "N/A"}</span>
            </div>
            <div style={{padding:"10px 18px 14px 76px",background:"var(--surface)",borderTop:"1px solid var(--border)"}}>
              <span style={{fontSize:11,color:"var(--text2)"}}>Basis: </span><span style={{fontSize:11,color:"var(--teal)"}}>{step.statutory_basis || step.rule || "Not recorded"}</span>
              <span style={{fontSize:11,color:"var(--text2)",marginLeft:20}}>Status: </span><strong style={{fontSize:11}}>{step.step_status || "PENDING"}</strong>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
