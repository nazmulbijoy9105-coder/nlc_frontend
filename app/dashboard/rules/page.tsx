"use client";
import { useEffect, useState } from "react";
import { ApiError, rulesApi } from "@/lib/api";
import { useCurrentUserRole } from "@/lib/use-current-user-role";

const verificationStyles: Record<string, { label: string; color: string; background: string; border: string }> = {
  VERIFIED: { label: "Owner verified", color: "#166534", background: "#F0FDF4", border: "#BBF7D0" },
  PENDING: { label: "Pending review", color: "#92400E", background: "#FFFBEB", border: "#FDE68A" },
  DISPUTED: { label: "Disputed", color: "#991B1B", background: "#FEF2F2", border: "#FECACA" },
};

export default function RulesPage() {
  const { role, loaded: roleLoaded } = useCurrentUserRole();
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(role === "SUPER_ADMIN");
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("ALL");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (!roleLoaded) return;
    if (role !== "SUPER_ADMIN") return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await rulesApi.list();
        if (!Array.isArray(data)) throw new Error("Rules service returned an unexpected response.");
        if (!cancelled) setRules(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Could not load legal rules.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void Promise.resolve().then(load);
    return () => { cancelled = true; };
  }, [roleLoaded, role, retry]);

  if (!roleLoaded) return <div role="status" style={{padding:40}}>Checking access…</div>;
  if (role !== "SUPER_ADMIN") return (
    <div role="alert" style={{padding:60,textAlign:"center",color:"#B91C1C"}}>
      Access denied — Rules Engine is restricted to Super Administrators.
    </div>
  );
  if (loading) return <div role="status" style={{padding:40,color:"var(--white-3)"}}>Loading rules…</div>;

  const filtered = filter === "ALL" ? rules : rules.filter((rule) => String(rule.rule_id || "").startsWith(filter));
  const blackCount = rules.filter((rule) => rule.is_black_override).length;
  const activeCount = rules.filter((rule) => rule.is_active === true).length;
  const scoringCount = rules.filter((rule) => rule.product_scoring_enabled === true).length;
  const pendingCount = rules.filter((rule) => (rule.verification_status || "PENDING").toUpperCase() !== "VERIFIED").length;
  const modules = [...new Set(rules.map((rule) => String(rule.rule_id || "").split("-")[0]).filter(Boolean))].sort();

  return (
    <div style={{padding:24}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
        <div>
          <div className="font-garamond" style={{fontSize:22,color:"var(--nlc-white)",marginBottom:4}}>Legal Rule Manager</div>
          <div style={{fontSize:12,color:"var(--red)",fontWeight:600}}>SUPER ADMIN ONLY — Every modification logged</div>
        </div>
        <div style={{padding:"8px 14px",background:"var(--red-bg)",border:"1px solid rgba(160,48,48,.3)",borderRadius:7,fontSize:11,color:"var(--red)",fontWeight:700}}>AI CANNOT MODIFY RULES</div>
      </div>
      {error && <div role="alert" className="nlc-card" style={{marginBottom:16}}>
        <p style={{color:"var(--red)"}}>{error}</p>
        <button type="button" className="nlc-btn-ghost" onClick={() => setRetry((value) => value + 1)}>Retry</button>
      </div>}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:14,marginBottom:18}}>
        {[["Total Rules",rules.length,"var(--navy-3)"],["Active Rules",activeCount,"var(--teal)"],["Scoring Rules",scoringCount,"var(--red)"],["Black Overrides",blackCount,"#0A0A0A"],["Modules",modules.length,"var(--teal)"]].map(([label,value,color])=>(
          <div key={String(label)} className="nlc-card" style={{borderTop:`3px solid ${String(color)}`,textAlign:"center"}}>
            <div className="font-garamond" style={{fontSize:26,color:String(color),lineHeight:1}}>{value}</div>
            <div className="font-mono" style={{fontSize:9,color:"var(--text3)",marginTop:4,letterSpacing:".1em",textTransform:"uppercase"}}>{label}</div>
          </div>
        ))}
      </div>
      <div role="note" style={{padding:"12px 14px",marginBottom:16,border:"1px solid #FDE68A",borderLeft:"3px solid #D97706",borderRadius:8,background:"#FFFBEB",color:"#78350F",fontSize:12,lineHeight:1.55}}>
        <strong>ILRMF release status:</strong> {activeCount}/85 catalogue entries active; {scoringCount}/82 score-bearing rules enabled. The three informational entries are excluded from deductions. Runtime deductions require a confirmed, applicable violation; UNKNOWN facts do not reduce scores. {pendingCount > 0 ? `${pendingCount} rule(s) still have a pending API status.` : "All catalogue entries are marked VERIFIED under the product-owner attestation."}
      </div>
      <div className="nlc-card">
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <div className="sec-lbl gold" style={{margin:0,border:"none",padding:0}}>ILRMF Rule Registry — {filtered.length} Rules</div>
          <select aria-label="Filter rules by module" value={filter} onChange={(event)=>setFilter(event.target.value)} style={{padding:"6px 12px",borderRadius:6,border:"1px solid var(--border2)",fontSize:11,background:"var(--surface)"}}>
            <option value="ALL">All Modules</option>
            {modules.map((module)=><option key={module} value={module}>{module}</option>)}
          </select>
        </div>
        <div style={{overflowX:"auto"}}>
          <table className="nlc-table" style={{minWidth:1400}}>
            <thead><tr><th>Rule ID</th><th>Name</th><th>Catalogue</th><th>Statutory Basis</th><th>Effective Date</th><th>Legal Verification</th><th>Product Scoring</th><th>Default Impact</th><th>Default Severity</th><th>BLACK</th></tr></thead>
            <tbody>{filtered.map((rule)=>(
              <tr key={rule.rule_id}>
                <td className="font-mono" style={{fontWeight:700,color:"var(--teal)",fontSize:11}}>{rule.rule_id}</td>
                <td style={{fontWeight:600,color:"var(--navy)"}}>{rule.rule_name}</td>
                <td><span className={`badge ${rule.is_active ? "badge-green" : "badge-yellow"}`}>{rule.is_active ? "ACTIVE" : "INACTIVE"}</span></td>
                <td style={{fontSize:10,color:"var(--text3)",maxWidth:200,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{rule.statutory_basis}</td>
                <td className="font-mono" style={{fontSize:10,color:"var(--text3)",whiteSpace:"nowrap"}}>{rule.statutory_effective_date || "Not recorded"}</td>
                <td>{(() => {
                  const status = (rule.verification_status || "PENDING").toUpperCase();
                  const meta = verificationStyles[status] || verificationStyles.PENDING;
                  return <span title={rule.verified_at ? `Verification recorded on ${rule.verified_at}` : "Marked VERIFIED under product-owner attestation; no signed-document upload is required"} style={{display:"inline-flex",padding:"4px 8px",borderRadius:999,border:`1px solid ${meta.border}`,background:meta.background,color:meta.color,fontSize:10,fontWeight:700,whiteSpace:"nowrap"}}>{meta.label}</span>;
                })()}</td>
                <td><span className={`badge ${rule.product_scoring_enabled ? "badge-green" : "badge-yellow"}`}>{rule.product_scoring_enabled ? "ENABLED" : "INFORMATIONAL"}</span></td>
                <td className="font-mono" style={{fontWeight:700,color:"var(--navy)",textAlign:"center"}}>{Number(rule.score_impact)||0}</td>
                <td><span className={`badge badge-${String(rule.default_severity||"YELLOW").toLowerCase()}`}>{rule.default_severity}</span></td>
                <td style={{textAlign:"center"}}>{rule.is_black_override ? "⚫" : "—"}</td>
              </tr>
            ))}</tbody>
          </table>
          {filtered.length === 0 && <p className="p-5 text-center text-sm text-gray-500">No rules match this filter.</p>}
        </div>
      </div>
    </div>
  );
}
