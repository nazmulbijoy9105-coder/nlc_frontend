"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, dashboardApi, companiesApi } from "@/lib/api";
import { useCurrentUserRole } from "@/lib/use-current-user-role";
import LegalDisclaimer from "@/components/LegalDisclaimer";

type Kpis = {
  total_companies?: number;
  green_count?: number | null;
  yellow_count?: number | null;
  red_black_count?: number | null;
  not_evaluated_count?: number;
  upcoming_deadlines?: number | null;
  dashboard_mode?: "EVIDENCE_REVIEW" | "STATUTORY_RISK";
  statutory_risk_aggregates_available?: boolean;
  companies_with_review_items?: number;
  active_review_items?: number;
};

function asArray(value: any): any[] {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.data)) return value.data;
  throw new Error("Dashboard service returned an unexpected list response.");
}

function dateLabel(value: unknown): string {
  if (!value) return "Date unavailable";
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime())
    ? "Date unavailable"
    : parsed.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function activityDate(value: unknown): string {
  if (!value) return "Date unavailable";
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime())
    ? "Date unavailable"
    : parsed.toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function DashboardPage() {
  const router = useRouter();
  const { role, loaded: roleLoaded } = useCurrentUserRole();
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
    const accessibleCompanies = companiesResult.status === "fulfilled" ? companiesResult.value : [];
    if (companiesResult.status === "fulfilled") setCompanyList(accessibleCompanies);
    else setLoadError(companiesResult.reason instanceof Error ? companiesResult.reason.message : "Could not load company portfolio.");

    if (canViewPortfolioKpis && kpisResult.status === "fulfilled" && kpisResult.value !== null) {
      const value = kpisResult.value;
      setKpis(value);
      const scopeMatches = companiesResult.status === "fulfilled" && value.total_companies === accessibleCompanies.length;
      setKpiScopeWarning(scopeMatches ? null : "The KPI endpoint scope does not match the accessible company list. Portfolio metrics are withheld rather than displaying inconsistent totals.");
      setScoreReleasePending(!scopeMatches);
    } else if (canViewPortfolioKpis && kpisResult.status === "rejected") {
      setScoreReleasePending(true);
      const expectedProductGate = kpisResult.reason instanceof ApiError
        && kpisResult.reason.status === 503
        && kpisResult.reason.message.startsWith("Compliance risk aggregates are unavailable while product scoring is disabled.");
      if (!expectedProductGate) setLoadError(current => current || (kpisResult.reason instanceof Error ? kpisResult.reason.message : "Could not load portfolio KPIs."));
    } else if (canViewPortfolioKpis) {
      setScoreReleasePending(true);
      setLoadError(current => current || "Could not load portfolio KPIs.");
    }

    if (deadlinesResult.status === "fulfilled") {
      setDeadlines(deadlinesResult.value);
      setCalendarReleasePending(false);
    } else {
      setCalendarReleasePending(true);
      const expectedCalendarGate = deadlinesResult.reason instanceof ApiError
        && deadlinesResult.reason.status === 503
        && deadlinesResult.reason.message.startsWith("Statutory deadlines are unavailable pending rule-level legal validation");
      if (!expectedCalendarGate) setLoadError(current => current || (deadlinesResult.reason instanceof Error ? deadlinesResult.reason.message : "Could not load statutory deadlines."));
    }
    if (activityResult.status === "fulfilled") setActivity(activityResult.value);
    else if (canViewActivity) setLoadError(current => current || "Could not load recent activity.");
    if (isClient) {
      setScoreReleasePending(true);
      setCalendarReleasePending(true);
    }
    setLoading(false);
  }, [canViewActivity, canViewPortfolioKpis, isClient]);

  useEffect(() => { if (roleLoaded) void Promise.resolve().then(loadData); }, [roleLoaded, loadData]);

  const evaluatedCompanies = useMemo(() => companyList.filter(company =>
    company.band !== "NOT_EVALUATED" && typeof company.compliance_score === "number"
  ), [companyList]);
  const averageScore = evaluatedCompanies.length
    ? Math.round(evaluatedCompanies.reduce((sum, company) => sum + company.compliance_score, 0) / evaluatedCompanies.length)
    : null;
  const statutoryScoreAvailable = !scoreReleasePending
    && kpis?.dashboard_mode === "STATUTORY_RISK"
    && kpis.statutory_risk_aggregates_available === true;
  const overdueDeadlines = deadlines.filter(item => typeof item.days_remaining === "number" && item.days_remaining < 0);
  const totalRiskItems = Math.max(0, Number(kpis?.green_count || 0)) +
    Math.max(0, Number(kpis?.yellow_count || 0)) + Math.max(0, Number(kpis?.red_black_count || 0));
  const green = kpiScopeWarning ? null : kpis?.green_count ?? null;
  const yellow = kpiScopeWarning ? null : kpis?.yellow_count ?? null;
  const redBlack = kpiScopeWarning ? null : kpis?.red_black_count ?? null;
  const distribution = totalRiskItems > 0
    ? `conic-gradient(#199765 0 ${(Number(green || 0) / totalRiskItems) * 100}%, #D99A18 ${(Number(green || 0) / totalRiskItems) * 100}% ${((Number(green || 0) + Number(yellow || 0)) / totalRiskItems) * 100}%, #C84646 ${((Number(green || 0) + Number(yellow || 0)) / totalRiskItems) * 100}% 100%)`
    : "conic-gradient(#E5E7EB 0 100%)";

  if (loading || !roleLoaded) return <div role="status" style={{ padding: 40, color: "var(--text2)" }}>Loading dashboard…</div>;

  const portfolioName = companyList.length === 1
    ? companyList[0].name || companyList[0].company_name || "Your company"
    : "Your authorised portfolio";
  const topDeadlines = [...deadlines].sort((a, b) =>
    (Number(a.days_remaining ?? Number.MAX_SAFE_INTEGER) - Number(b.days_remaining ?? Number.MAX_SAFE_INTEGER))
  ).slice(0, 5);

  return (
    <div className="nlc-compliance-dashboard">
      <div className="nlc-dashboard-heading">
        <div>
          <div className="nlc-dashboard-eyebrow">NLC · LEGAL INTELLIGENCE PLATFORM</div>
          <h1>{portfolioName}</h1>
          <p>Compliance overview · {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>
        </div>
        <button type="button" className="nlc-dashboard-primary" onClick={() => router.push("/dashboard/companies")}>View companies <span aria-hidden="true">↗</span></button>
      </div>

      {kpiScopeWarning && <div role="status" className="nlc-dashboard-notice">{kpiScopeWarning}</div>}
      {loadError && <div role="alert" className="nlc-dashboard-error"><span>{loadError}</span><button type="button" onClick={() => void loadData()}>Retry</button></div>}

      <section className="nlc-dashboard-metrics" aria-label="Compliance overview metrics">
        <article className="nlc-dashboard-metric nlc-dashboard-metric-score">
          <div className="nlc-dashboard-metric-label">Average released score</div>
          <div className="nlc-dashboard-metric-value">{!statutoryScoreAvailable || averageScore === null ? "—" : <>{averageScore}<small> / 100</small></>}</div>
          <div className="nlc-dashboard-metric-foot">{!statutoryScoreAvailable ? "Statutory score not released" : `${evaluatedCompanies.length} evaluated compan${evaluatedCompanies.length === 1 ? "y" : "ies"}`}</div>
        </article>
        <article className="nlc-dashboard-metric">
          <div className="nlc-dashboard-metric-label">Accessible companies</div>
          <div className="nlc-dashboard-metric-value">{companyList.length}</div>
          <div className="nlc-dashboard-metric-foot">Within your authorised scope</div>
        </article>
        <article className="nlc-dashboard-metric nlc-dashboard-metric-alert">
          <div className="nlc-dashboard-metric-label">Overdue deadlines</div>
          <div className="nlc-dashboard-metric-value">{calendarReleasePending ? "—" : overdueDeadlines.length}</div>
          <div className="nlc-dashboard-metric-foot">{calendarReleasePending ? "Statutory dates withheld" : "From accessible deadline records"}</div>
        </article>
        <article className="nlc-dashboard-metric">
          <div className="nlc-dashboard-metric-label">{canViewPortfolioKpis ? "Open review signals" : "Upcoming deadlines"}</div>
          <div className="nlc-dashboard-metric-value">{canViewPortfolioKpis ? (kpis?.active_review_items ?? "—") : (calendarReleasePending ? "—" : deadlines.length)}</div>
          <div className="nlc-dashboard-metric-foot">{canViewPortfolioKpis ? "Evidence and rule-state items requiring review" : "Accessible deadline records"}</div>
        </article>
      </section>

      <section className="nlc-dashboard-overview-grid">
        <article className="nlc-dashboard-panel nlc-dashboard-health">
          <div className="nlc-dashboard-panel-heading"><div><h2>Compliance health</h2><p>Released company scores only</p></div><span className="nlc-dashboard-panel-icon">◉</span></div>
          <div className="nlc-dashboard-health-content">
            <div className="nlc-dashboard-score-ring" style={{ background: averageScore === null || scoreReleasePending ? "conic-gradient(#E5E7EB 0 100%)" : `conic-gradient(#D99A18 0 ${averageScore}%, #E8EDF3 ${averageScore}% 100%)` }}>
              <div><strong>{!statutoryScoreAvailable || averageScore === null ? "—" : averageScore}</strong><span>{!statutoryScoreAvailable || averageScore === null ? "not released" : "of 100"}</span></div>
            </div>
            <div className="nlc-dashboard-health-details">
              <div><span>GREEN</span><strong>{!statutoryScoreAvailable ? "—" : green ?? "—"}</strong></div>
              <div><span>YELLOW</span><strong>{!statutoryScoreAvailable ? "—" : yellow ?? "—"}</strong></div>
              <div><span>RED / BLACK</span><strong>{!statutoryScoreAvailable ? "—" : redBlack ?? "—"}</strong></div>
              <div><span>Not evaluated</span><strong>{kpiScopeWarning ? "—" : kpis?.not_evaluated_count ?? "—"}</strong></div>
            </div>
          </div>
          <p className="nlc-dashboard-panel-note">{!statutoryScoreAvailable ? "Statutory scores and risk bands are not released. Evidence review signals do not establish default, breach or liability." : "Portfolio score is the mean of accessible company scores that have been evaluated and released. It is not a legal certification."}</p>
        </article>

        <article className="nlc-dashboard-panel nlc-dashboard-risk">
          <div className="nlc-dashboard-panel-heading"><div><h2>Risk distribution</h2><p>{!statutoryScoreAvailable ? "Statutory risk aggregates not released" : `${totalRiskItems} companies with evaluated bands`}</p></div><span className="nlc-dashboard-panel-icon">◌</span></div>
          {!statutoryScoreAvailable ? <div className="nlc-dashboard-empty">Statutory risk distribution is not released. {kpis?.active_review_items ?? 0} active review signals across {kpis?.companies_with_review_items ?? 0} companies are tracked separately and are not statutory risk bands.</div> : (
            <div className="nlc-dashboard-risk-content">
              <div className="nlc-dashboard-donut" style={{ background: distribution }}><div><strong>{totalRiskItems}</strong><span>evaluated</span></div></div>
              <div className="nlc-dashboard-legend">
                {[["GREEN", green, "#199765"], ["YELLOW", yellow, "#D99A18"], ["RED / BLACK", redBlack, "#C84646"]].map(([label, count, color]) => <div key={String(label)}><span><i style={{ background: String(color) }} />{label}</span><strong>{count ?? "—"}</strong></div>)}
              </div>
            </div>
          )}
        </article>
      </section>

      <section className="nlc-dashboard-panel nlc-dashboard-priority">
        <div className="nlc-dashboard-panel-heading"><div><h2>Priority action queue</h2><p>Upcoming and overdue records returned for your authorised scope</p></div><button type="button" className="nlc-dashboard-text-button" onClick={() => router.push("/dashboard/filings")}>View obligations ↗</button></div>
        {calendarReleasePending ? <div className="nlc-dashboard-empty">Statutory deadline data is unavailable or restricted. This does not mean the company has no filing obligations.</div> :
          topDeadlines.length === 0 ? <div className="nlc-dashboard-empty">No deadline records were returned by the service.</div> :
          <div className="nlc-dashboard-action-list">{topDeadlines.map((item, index) => {
            const days = typeof item.days_remaining === "number" ? item.days_remaining : null;
            const label = item.title || item.event_type || item.description || item.filing_type || "Statutory event";
            const company = item.company_name || item.company?.name;
            return <button type="button" key={item.id || item.event_id || `${label}-${index}`} className="nlc-dashboard-action-row" onClick={() => router.push("/dashboard/filings")}>
              <span className="nlc-dashboard-action-copy"><strong>{label}</strong><small>{company ? `${company} · ` : ""}{item.due_date ? `Due ${dateLabel(item.due_date)}` : "Due date not supplied"}</small></span>
              <span className={`nlc-dashboard-due ${days !== null && days < 0 ? "is-overdue" : ""}`}>{days === null ? "Date unavailable" : days < 0 ? `${Math.abs(days)} days overdue` : days === 0 ? "Due today" : `Due in ${days} days`}</span>
            </button>;
          })}</div>
        }
      </section>

      {canViewActivity && <section className="nlc-dashboard-panel nlc-dashboard-activity">
        <div className="nlc-dashboard-panel-heading"><div><h2>Recent activity</h2><p>Latest events available to your staff role</p></div></div>
        {activity.length === 0 ? <div className="nlc-dashboard-empty">No recent activity records were returned.</div> :
          activity.slice(0, 6).map((item, index) => <div className="nlc-dashboard-activity-row" key={item.id || index}><span className="nlc-dashboard-activity-dot" /><div><strong>{item.message || item.description || "Activity event"}</strong><small>{item.actor || "System"} · {activityDate(item.created_at)}</small></div></div>)
        }
      </section>}

      {isClient && <div className="nlc-dashboard-client-note">Your dashboard is limited to companies accessible to your account. Portfolio-wide KPIs, staff activity and restricted statutory analytics are not requested for client roles.</div>}
      <div className="nlc-dashboard-footer-note"><strong>Deterministic evaluation. Human oversight. Fail-closed design.</strong><span>Product-owner release is separate from independent legal verification.</span></div>
      <LegalDisclaimer />
    </div>
  );
}
