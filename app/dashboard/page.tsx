"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { dashboardApi, companiesApi } from "@/lib/api";
import { getUser } from "@/lib/auth";
import LegalDisclaimer from "@/components/LegalDisclaimer";

type Kpis = {
  total_companies?: number;
  green_count?: number;
  yellow_count?: number;
  red_black_count?: number;
  not_evaluated_count?: number;
  upcoming_deadlines?: number;
};

function asArray(value: any): any[] {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.data)) return value.data;
  throw new Error("Dashboard service returned an unexpected list response.");
}

export default function DashboardPage() {
  const router = useRouter();
  const [role] = useState(() => typeof window === "undefined" ? null : getUser()?.role ?? null);
  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [companyList, setCompanyList] = useState<any[]>([]);
  const [deadlines, setDeadlines] = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [scoreReleasePending, setScoreReleasePending] = useState(false);
  const [kpiScopeWarning, setKpiScopeWarning] = useState<string | null>(null);
  const [calendarReleasePending, setCalendarReleasePending] = useState(false);

  const isClient = role === "CLIENT_DIRECTOR" || role === "CLIENT_VIEW_ONLY";
  const canViewPortfolioKpis = ["ADMIN_STAFF", "SUPER_ADMIN", "LEGAL_STAFF"].includes(String(role));
  const canViewActivity = ["ADMIN_STAFF", "SUPER_ADMIN"].includes(String(role));

  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    setKpis(null);
    setKpiScopeWarning(null);
    setCalendarReleasePending(false);
    setDeadlines([]);
    setActivity([]);
    const companiesPromise = companiesApi.list().then(asArray);
    const kpisPromise = canViewPortfolioKpis
      ? dashboardApi.getStats().then((data: Kpis) => {
          if (!data || typeof data !== "object" || typeof data.total_companies !== "number") {
            throw new Error("The KPI endpoint returned an unexpected response contract.");
          }
          return data;
        })
      : Promise.resolve(null);
    const deadlinesPromise = canViewPortfolioKpis
      ? dashboardApi.upcomingDeadlines().then(asArray)
      : Promise.resolve([]);
    const activityPromise = canViewActivity
      ? dashboardApi.recentActivity().then(asArray)
      : Promise.resolve([]);

    const results = await Promise.allSettled([companiesPromise, kpisPromise, deadlinesPromise, activityPromise]);
    const [companiesResult, kpisResult, deadlinesResult, activityResult] = results;
    const accessibleCompanies = companiesResult.status === "fulfilled" ? companiesResult.value : null;
    if (accessibleCompanies) setCompanyList(accessibleCompanies);
    else setLoadError(companiesResult.reason instanceof Error ? companiesResult.reason.message : "Could not load company portfolio.");

    if (kpisResult.status === "fulfilled") {
      setKpis(kpisResult.value);
      const value = kpisResult.value;
      const scopeMatches = !!accessibleCompanies && value.total_companies === accessibleCompanies.length;
      setKpiScopeWarning(scopeMatches ? null : "The KPI endpoint scope does not match the accessible company list. Portfolio metrics are withheld rather than displaying inconsistent totals.");
      setScoreReleasePending(!scopeMatches || Number(value.not_evaluated_count || 0) > 0);
    } else if (canViewPortfolioKpis) {
      setScoreReleasePending(true);
      setLoadError((current) => current || (kpisResult.reason instanceof Error ? kpisResult.reason.message : "Could not load portfolio KPIs."));
    }

    if (deadlinesResult.status === "fulfilled") { setDeadlines(deadlinesResult.value); setCalendarReleasePending(false); }
    else {
      setCalendarReleasePending(true);
      setLoadError((current) => current || (deadlinesResult.reason instanceof Error ? deadlinesResult.reason.message : "Could not load statutory deadlines."));
    }
    if (activityResult.status === "fulfilled") setActivity(activityResult.value);
    else if (canViewActivity) setLoadError((current) => current || "Could not load recent activity.");
    if (isClient) {
      setScoreReleasePending(true);
      setCalendarReleasePending(true);
    }
    setLoading(false);
  }, [canViewActivity, canViewPortfolioKpis, isClient]);

  useEffect(() => { void loadData(); }, [loadData]);

  if (loading) return <div role="status" style={{padding:40,color:"var(--white-3)"}}>Loading dashboard…</div>;

  const total = companyList.length;
  const notEvaluated = kpiScopeWarning ? null : kpis?.not_evaluated_count ?? null;
  const redBlack = kpiScopeWarning ? null : kpis?.red_black_count ?? null;
  const green = kpiScopeWarning ? null : kpis?.green_count ?? null;
  const yellow = kpiScopeWarning ? null : kpis?.yellow_count ?? null;

  return (
    <div style={{padding:24}}>
      {kpiScopeWarning && <div role="status" className="nlc-card" style={{marginBottom:16,fontSize:12,color:"var(--text2)"}}>{kpiScopeWarning}</div>}
      {loadError && <div role="alert" className="nlc-card" style={{marginBottom:16}}>
        <p style={{color:"var(--red)",fontSize:12}}>{loadError}</p>
        <button type="button" className="nlc-btn-ghost" onClick={() => void loadData()}>Retry dashboard</button>
      </div>}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:14,marginBottom:20}}>
        <div className="nlc-card" role="button" tabIndex={0} onClick={()=>router.push("/dashboard/companies")} onKeyDown={(event)=>{if(event.key==="Enter"||event.key===" ")router.push("/dashboard/companies")}}>
          <div className="sec-lbl">Accessible Companies</div>
          <div className="font-garamond" style={{fontSize:34,color:"var(--navy-3)"}}>{total}</div>
          <div style={{fontSize:11,color:"var(--text2)"}}>Companies in your authorised portfolio</div>
        </div>
        {canViewPortfolioKpis && <>
          <div className="nlc-card">
            <div className="sec-lbl">Not Evaluated</div>
            <div className="font-garamond" style={{fontSize:34,color:"var(--yellow)"}}>{notEvaluated ?? "—"}</div>
            <div style={{fontSize:11,color:"var(--text2)"}}>Not a finding of compliance or breach</div>
          </div>
          <div className="nlc-card">
            <div className="sec-lbl">RED / BLACK</div>
            <div className="font-garamond" style={{fontSize:34,color:"var(--red)"}}>{scoreReleasePending ? "—" : redBlack ?? "—"}</div>
            <div style={{fontSize:11,color:"var(--text2)"}}>Combined count only where scoring is released</div>
          </div>
          <div className="nlc-card">
            <div className="sec-lbl">Upcoming Deadlines</div>
            <div className="font-garamond" style={{fontSize:34,color:"var(--navy-3)"}}>{calendarReleasePending ? "—" : deadlines.length}</div>
            <div style={{fontSize:11,color:"var(--text2)"}}>Accessible deadline records</div>
          </div>
        </>}
      </div>

      {canViewPortfolioKpis && <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:14,marginBottom:20}}>
        <section className="nlc-card">
          <div className="sec-lbl">Risk Distribution</div>
          {scoreReleasePending ? (
            <p style={{fontSize:12,lineHeight:1.7,color:"var(--text2)",padding:"16px 4px"}}>
              Statutory scoring is not released or all relevant companies remain not evaluated. This dashboard makes no company default, breach or liability determination.
            </p>
          ) : <>
            {[["GREEN","Green",green],["YELLOW","Yellow",yellow],["RED / BLACK","RED / BLACK",redBlack]].map(([key,label,count])=>(
              <div key={String(key)} style={{display:"flex",justifyContent:"space-between",padding:"9px 0",borderBottom:"1px solid var(--border)",fontSize:12}}>
                <span>{label}</span><strong>{count ?? "—"}</strong>
              </div>
            ))}
          </>}
        </section>
        <section className="nlc-card">
          <div className="sec-lbl">Upcoming Deadlines</div>
          {calendarReleasePending ? <p style={{fontSize:12,color:"var(--text2)",padding:16}}>Deadline data is unavailable or restricted.</p> :
            deadlines.length === 0 ? <p style={{fontSize:12,color:"var(--text3)",padding:16}}>No deadline records available.</p> :
            deadlines.slice(0,8).map((item,index)=>(
              <div key={item.id || item.event_id || index} style={{display:"flex",justifyContent:"space-between",gap:12,padding:"9px 0",borderBottom:"1px solid var(--border)"}}>
                <div>
                  <div style={{fontSize:12,fontWeight:600,color:"var(--navy)"}}>{item.company_name || item.title || "Company"}</div>
                  <div style={{fontSize:10,color:"var(--text3)"}}>{item.event_type || item.description || item.filing_type || "Statutory event"}</div>
                  {item.due_date && <div style={{fontSize:10,color:"var(--text3)"}}>Due: {item.due_date}</div>}
                </div>
                <span style={{fontSize:10,fontWeight:700,whiteSpace:"nowrap"}}>{typeof item.days_remaining === "number" ? `${item.days_remaining}d` : "—"}</span>
              </div>
            ))}
        </section>
        {canViewActivity && <section className="nlc-card">
          <div className="sec-lbl gold">Recent Activity</div>
          {activity.length === 0 ? <p style={{fontSize:12,color:"var(--text3)",padding:16}}>No recent activity.</p> :
            activity.slice(0,8).map((item,index)=>(
              <div key={item.id || index} style={{padding:"8px 0",borderBottom:"1px solid var(--border)"}}>
                <div style={{fontSize:12,fontWeight:500,color:"var(--navy)"}}>{item.message || item.description || "Activity"}</div>
                <div style={{fontSize:10,color:"var(--text3)"}}>{item.actor || "System"} · {item.created_at ? new Date(item.created_at).toLocaleString() : ""}</div>
              </div>
            ))}
        </section>}
      </div>}

      {isClient && <div className="nlc-card" style={{marginBottom:20}}>
        <p style={{fontSize:12,lineHeight:1.7,color:"var(--text2)"}}>Your dashboard shows only companies accessible to your account. Portfolio-wide KPIs, staff activity and restricted statutory analytics are not requested for client roles.</p>
      </div>}
      <LegalDisclaimer />
    </div>
  );
}
