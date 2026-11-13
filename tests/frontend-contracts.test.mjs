import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("all browser API consumers share the canonical API base configuration", () => {
  const config = read("lib/api-config.ts");
  const api = read("lib/api.ts");
  const auth = read("lib/auth.ts");
  assert.match(config, /export const API_BASE/);
  assert.match(api, /new ApiClient\(API_BASE\)/);
  assert.match(auth, /fetch\(API_BASE \+ '\/api\/v1\/auth\/refresh'/);
  assert.doesNotMatch(read("app/dashboard/companies/[id]/calendar/page.tsx"), /NEXT_PUBLIC_API_BASE_PATH|fetch\(/);
  assert.doesNotMatch(read("app/dashboard/companies/[id]/forms/page.tsx"), /NEXT_PUBLIC_API_BASE_PATH|fetch\(/);
  assert.doesNotMatch(read("app/dashboard/notifications/page.tsx"), /NEXT_PUBLIC_API_BASE_PATH|fetch\(/);
});

test("binary downloads and multipart uploads use the shared authenticated transport", () => {
  const api = read("lib/api.ts");
  const transport = read("lib/api-transport.ts");
  assert.match(api, /downloadAuthenticatedFile/);
  assert.match(api, /uploadAuthenticatedFile/);
  assert.match(transport, /getValidAccessToken/);
  assert.match(transport, /credentials: "include"/);
  assert.match(transport, /AbortController/);
  assert.match(transport, /Content-Disposition|content-disposition/);
});

test("staff-only screens check role before invoking protected list APIs", () => {
  for (const [path, guard, call] of [
    ["app/dashboard/rules/page.tsx", 'role !== "SUPER_ADMIN"', "rulesApi.list()"],
    ["app/dashboard/rjsc/page.tsx", "!isSuperAdmin", "api.get<RJSCReferenceResponse>"],
    ["app/dashboard/admin/page.tsx", "!allowed", "adminApi.listUsers(1)"],
    ["app/dashboard/rescue/page.tsx", "!authorised", "rescueApi.list("],
  ]) {
    const source = read(path);
    assert.ok(source.indexOf(guard) >= 0, `${path} must contain its role guard`);
    assert.ok(source.indexOf(guard) < source.indexOf(call), `${path} must guard before protected fetch`);
  }
});

test("finance workspace exposes manual billing only through role-gated backend contracts", () => {
  const layout = read("app/dashboard/layout.tsx");
  const clientNav = layout.slice(layout.indexOf("const clientNav"), layout.indexOf("export default function"));
  assert.match(clientNav, /href: '\/dashboard\/finance'/);
  assert.doesNotMatch(clientNav, /href: '\/dashboard\/rescue'|Rescue Plan/);
  assert.match(layout, /i\.href !== '\/dashboard\/finance' \|\| \['ADMIN_STAFF', 'SUPER_ADMIN'\]\.includes\(user\.role\)/);

  const page = read("app/dashboard/finance/page.tsx");
  assert.match(page, /financeApi\.invoices\(companyId\)/);
  assert.match(page, /financeApi\.paymentSubmissions\(companyId\)/);
  assert.match(page, /financeApi\.payments\(companyId\)/);
  assert.match(page, /isFinanceStaff/);
  assert.match(page, /canSubmitPayment/);
  assert.match(page, /manual payment claims only/i);
  assert.doesNotMatch(page, /temporarily unavailable/);
  assert.equal((page.match(/const refreshFinance = async/g) || []).length, 1);
  assert.match(page, /const requestedCompanyId = companyId/);
  assert.match(page, /companyIdRef\.current !== requestedCompanyId/);
  assert.equal((page.match(/const requiresReference =/g) || []).length, 1);
  assert.doesNotMatch(page, /Only bank transfer, cash and cheque evidence is accepted/);
  assert.match(page, /const currentInvoices = useMemo\(/);
  assert.match(page, /financeDataCompanyId === companyId \? invoices : \[\]/);
  assert.match(page, /financeDataCompanyId === companyId \? submissions : \[\]/);
  assert.match(page, /financeDataCompanyId === companyId \? payments : \[\]/);
  assert.match(page, /engagementsCompanyId === companyId \? engagements : \[\]/);
  assert.match(page, /setFinanceDataCompanyId\(requestedCompanyId\)/);
  assert.doesNotMatch(page, /setLoadingFinance/);

  const api = read("lib/api.ts");
  assert.match(api, /BKASH_MANUAL/);
  assert.match(api, /NAGAD_MANUAL/);
  assert.match(api, /\/api\/v1\/finance\/invoices/);
  assert.match(api, /\/api\/v1\/finance\/payment-submissions/);
  assert.match(api, /cancelAtPeriodEnd: \(companyId: string, subscriptionId: string, reason: string\)/);
  assert.match(api, /completeTask: \(id: string, companyId: string, data: any\)/);
  assert.match(api, /complete\?company_id=/);
});

test("filings page consumes the registered portfolio endpoint contract", () => {
  const page = read("app/dashboard/filings/page.tsx");
  assert.match(page, /\/api\/v1\/filings/);
  assert.match(page, /data\.agms/);
  assert.match(page, /data\.audits/);
  assert.match(page, /data\.annual_returns/);
  assert.doesNotMatch(page, /listAGM\(\)\.catch|listAnnualReturn\(\)\.catch/);
});

test("public signup does not offer backend-ignored privilege selection", () => {
  const page = read("app/signup/page.tsx");
  assert.doesNotMatch(page, /setRole|<select[^>]*Role/);
  assert.match(page, /Client View Only/);
});

test("company editing submits only fields supported by CompanyUpdateRequest", () => {
  const page = read("app/dashboard/companies/[id]/edit/page.tsx");
  assert.match(page, /company\.name/);
  assert.match(page, /revenue_tier/);
  assert.doesNotMatch(page, /industry_sector|tin_number|authorized_capital_bdt|paid_up_capital_bdt/);
});

test("static dashboard deadline badge is not fabricated", () => {
  assert.doesNotMatch(read("components/Topbar.tsx"), /3 Deadlines/);
});

test("JSON, multipart and binary requests share one transport implementation", () => {
  const api = read("lib/api.ts");
  const transport = read("lib/api-transport.ts");
  assert.match(api, /requestApiResponse\(/);
  assert.doesNotMatch(api, /\bfetch\s*\(/);
  assert.equal((transport.match(/\bfetch\s*\(/g) || []).length, 1);
  assert.match(transport, /requestApiResponse\(API_BASE, path, \{ method: "POST", body: form \}\)/);
  assert.match(transport, /requestApiResponse\(API_BASE, path, \{ method: "GET" \}/);
  assert.match(transport, /credentials: "include"/);
  assert.match(transport, /auth\?: boolean/);
  assert.match(api, /headers\.set\("Content-Type", "application\/json"\)/);
});

test("privileged client pages use the shared hydration-safe role store", () => {
  const hook = read("lib/use-current-user-role.ts");
  const auth = read("lib/auth.ts");
  assert.match(hook, /useSyncExternalStore/);
  assert.match(hook, /AUTH_STATE_CHANGE_EVENT/);
  assert.match(hook, /addEventListener\("storage"/);
  assert.match(auth, /dispatchEvent\(new Event\(AUTH_STATE_CHANGE_EVENT\)\)/);
  for (const path of [
    "app/dashboard/rules/page.tsx",
    "app/dashboard/rjsc/page.tsx",
    "app/dashboard/admin/page.tsx",
    "app/dashboard/rescue/page.tsx",
    "app/dashboard/companies/[id]/edit/page.tsx",
    "app/dashboard/companies/[id]/forms/page.tsx",
    "app/dashboard/companies/[id]/page.tsx",
    "app/dashboard/companies/new/page.tsx",
    "app/dashboard/companies/page.tsx",
    "app/dashboard/page.tsx",
  ]) {
    const source = read(path);
    assert.match(source, /roleLoaded/);
    assert.match(source, /useCurrentUserRole/);
    assert.doesNotMatch(source, /getUser\(\)/);
    assert.doesNotMatch(source, /useState\(\(\) => typeof window === "undefined"/);
    if (path === "app/dashboard/companies/[id]/page.tsx") {
      assert.match(source, /if \(!roleLoaded \|\| !id\) return;/);
      assert.match(source, /\}, \[id, roleLoaded\]\)/);
    }
  }
});

test("finance workspace refreshes are scoped to the currently selected company", () => {
  const page = read("app/dashboard/finance/page.tsx");
  assert.equal((page.match(/const refreshFinance = async/g) || []).length, 1);
  assert.match(page, /const requestedCompanyId = companyId/);
  assert.match(page, /companyIdRef\.current !== requestedCompanyId/);
  assert.equal((page.match(/const requiresReference =/g) || []).length, 1);
  assert.doesNotMatch(page, /Only bank transfer, cash and cheque evidence is accepted/);
});


test("calendar UI reflects the backend legal-release gate and exact event response contract", () => {
  const page = read("app/dashboard/companies/[id]/calendar/page.tsx");
  const api = read("lib/api.ts");
  assert.match(api, /export const calendarApi =/);
  assert.match(api, /calendarApi/);
  assert.match(page, /calendarApi\.list\(companyId, 365\)/);
  assert.match(page, /calendarApi\.generate\(companyId, 3\)/);
  assert.match(page, /err\.status === 503/);
  assert.match(page, /Statutory calendar is unavailable pending rule-level legal validation/);
  assert.match(page, /Statutory calendar is withheld pending legal approval/);
  assert.match(page, /This does not mean the company has no filing obligations/);
  assert.match(page, /legal_rule_id/);
  assert.match(page, /legal_source_version/);
});

test("legal staff rescue list requires a company scope", () => {
  const page = read("app/dashboard/rescue/page.tsx");
  assert.match(page, /role === "LEGAL_STAFF" && !companyId/);
  assert.match(page, /Legal staff cannot access the portfolio-wide rescue list/);
  assert.match(page, /if \(!authorised \|\| legalStaffNeedsCompanyScope\)/);
});


test("rule manager displays the active 85-rule catalogue separately from scoring eligibility", () => {
  const page = read("app/dashboard/rules/page.tsx");
  assert.match(page, /rule\.is_active/);
  assert.match(page, /rule\.product_scoring_enabled/);
  assert.match(page, /82 score-bearing rules enabled/);
  assert.match(page, /UNKNOWN facts do not reduce scores/);
});

test("dashboard does not withhold released risk metrics because some companies remain not evaluated", () => {
  const page = read("app/dashboard/page.tsx");
  assert.match(page, /setScoreReleasePending\(!scopeMatches\)/);
  assert.doesNotMatch(page, /setScoreReleasePending\(!scopeMatches \|\| Number\(value\.not_evaluated_count/);
});

test("rule manager does not equate product-owner attestation with independent legal verification", () => {
  const page = read("app/dashboard/rules/page.tsx");
  assert.match(page, /Product-owner attestation authorizes product release but does not constitute independent legal verification/);
  assert.match(page, /Independent Legal Review/);
  assert.doesNotMatch(page, /All catalogue entries are marked VERIFIED under the product-owner attestation/);
});


test("billing workspace uses registered subscription APIs and does not claim gateway checkout", () => {
  const page = read("app/dashboard/billing/page.tsx");
  const api = read("lib/api.ts");
  assert.match(page, /billingApi\.plans\(\)/);
  assert.match(page, /billingApi\.current\(companyId\)/);
  assert.match(page, /billingApi\.history\(companyId\)/);
  assert.match(page, /billingApi\.requestSubscription\(/);
  assert.match(page, /billingApi\.cancelAtPeriodEnd\(/);
  assert.match(page, /Only a company director can request or cancel a subscription/);
  assert.match(page, /activated only after the payment is verified and allocated/);
  assert.match(page, /Open finance workspace/);
  assert.match(page, /Online bKash, Nagad and SSLCommerz checkout is not enabled/);
  assert.doesNotMatch(page, /temporarily unavailable|backend currently does not register/);
  assert.match(api, /export const billingApi =/);
  assert.match(api, /\/api\/v1\/subscriptions\/companies/);
});


test("billing workspace waits for authenticated role before protected API calls", () => {
  const page = read("app/dashboard/billing/page.tsx");
  const guard = page.indexOf("if (!roleLoaded || !role) return");
  const companyFetch = page.indexOf("companiesApi.list()");
  const planFetch = page.indexOf("billingApi.plans()");
  assert.ok(guard >= 0 && guard < companyFetch && guard < planFetch);
  assert.ok(page.indexOf("if (!role)") < page.indexOf("if (loading)"));
});


test("released product score is disclosed separately from independent legal verification", () => {
  const card = read("components/ScoreBreakdownCard.tsx");
  const disclaimer = read("components/LegalDisclaimer.tsx");
  assert.match(card, /Product risk score/);
  assert.match(card, /underlying statutory rules have been independently verified/);
  assert.match(card, /compliance certificate/);
  assert.match(disclaimer, /Product-owner release is separate from independent Bangladesh company-law counsel verification/);
});


test("company score UI distinguishes product release from independent legal review", () => {
  const page = read("app/dashboard/companies/[id]/page.tsx");
  assert.match(page, /Product scoring is not currently released for this evaluation/);
  assert.match(page, /No active review findings were returned\. This does not establish compliance\./);
  assert.match(page, /band === 'NOT_EVALUATED' \? '—'/);
  assert.doesNotMatch(page, /Pending legal approval/);
  assert.doesNotMatch(page, /pending independent legal approval/);
});

test("rescue UI handles the product scoring release gate without implying counsel approval controls it", () => {
  const page = read("app/dashboard/rescue/page.tsx");
  assert.match(page, /PRODUCT_SCORE_RELEASE_DISABLED/);
  assert.match(page, /Product scoring release is disabled/);
  assert.doesNotMatch(page, /withheld pending independent legal validation/);
});


test("dashboard treats the backend product-scoring-disabled KPI response as an expected withheld state", () => {
  const page = read("app/dashboard/page.tsx");
  assert.match(page, /Compliance risk aggregates are unavailable while product scoring is disabled\./);
  assert.match(page, /setScoreReleasePending\(true\)/);
});


test("compliance dashboard uses live scoped services and the responsive overview layout", () => {
  const page = read("app/dashboard/page.tsx");
  const styles = read("app/globals.css");
  assert.match(page, /dashboardApi\.getStats\(\)/);
  assert.match(page, /dashboardApi\.upcomingDeadlines\(\)/);
  assert.match(page, /dashboardApi\.recentActivity\(\)/);
  assert.match(page, /companiesApi\.list\(page,\s*pageSize\)/);
  assert.match(page, /loadAllAccessibleCompanies/);
  assert.match(page, /Priority action queue/);
  assert.match(page, /Recent activity/);
  assert.match(styles, /\.nlc-dashboard-metrics/);
  assert.match(styles, /@media \(max-width: 700px\)/);
  assert.doesNotMatch(page, /Padma Textiles Ltd|82 \/ 100|13 days overdue/);
});

test("dashboard never renders statutory risk distribution from evidence-review-only KPIs", () => {
  const page = read("app/dashboard/page.tsx");
  assert.match(page, /kpis\?\.dashboard_mode === "STATUTORY_RISK"/);
  assert.match(page, /kpis\.statutory_risk_aggregates_available === true/);
  assert.match(page, /Statutory risk distribution is not released/);
  assert.match(page, /Evidence review signals do not establish default, breach or liability/);
});


test("SUPER_ADMIN portfolio console reactivates records, tracks per-company progress and withholds unreconciled PDFs", () => {
  const page = read("app/dashboard/admin/portfolio-compliance/page.tsx");
  const api = read("lib/api.ts");
  assert.match(page, /role !== "SUPER_ADMIN"/);
  assert.match(page, /portfolioComplianceApi\.reactivate\(selected, reason\.trim\(\)\)/);
  assert.match(page, /portfolioComplianceApi\.evaluateOne\(companyId\)/);
  assert.match(page, /setProgress\(\{ done: results\.length, total: companies\.length \}\)/);
  assert.match(page, /row\.pdf_eligible/);
  assert.match(page, /Download PDF/);
  assert.match(page, /Statutory status and evidence are to remain unchanged/);
  assert.match(api, /\/api\/v1\/portfolio\/compliance\/evaluate/);
});



test("dashboard loads every authorised company page before reconciling portfolio KPIs", () => {
  const page = read("app/dashboard/page.tsx");
  const api = read("lib/api.ts");
  assert.match(page, /async function loadAllAccessibleCompanies\(\): Promise<any\[]>/);
  assert.match(page, /const pageSize = 100/);
  assert.match(page, /companiesApi\.list\(page, pageSize\)/);
  assert.match(page, /if \(batch\.length < pageSize\) return companies/);
  assert.match(page, /const companiesPromise = loadAllAccessibleCompanies\(\)/);
  assert.match(page, /value\.total_companies === accessibleCompanies\.length/);
  assert.match(api, /list: \(page = 1, pageSize = 25\)/);
});
