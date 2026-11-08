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

test("privileged client pages resolve roles after hydration instead of locking in the SSR role", () => {
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
    assert.match(source, /getUser\(\)/);
    assert.doesNotMatch(source, /useState\(\(\) => typeof window === "undefined"/);
    if (path === "app/dashboard/companies/[id]/page.tsx") {
      assert.match(source, /if \(!roleLoaded \|\| !id\) return;/);
      assert.match(source, /\}, \[id, roleLoaded\]\)/);
    }
  }
});
