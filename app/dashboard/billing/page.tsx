"use client"

import { useEffect, useMemo, useState } from "react"
import { billingApi, companiesApi } from "@/lib/api"
import { getUser } from "@/lib/auth"

const billingIntervals = ["MONTHLY", "QUARTERLY", "ANNUAL", "ONE_TIME"]\nconst featureLabels: Record<string, string> = {
  compliance_package: "Compliance intelligence",
  document_management: "Document management",
  corporate_rescue: "Corporate rescue",
}
const money = (value: any) => {
  const amount = Number(value ?? 0)
  return Number.isFinite(amount) ? "৳" + amount.toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—"
}
const dateLabel = (value?: string | null) => value ? new Date(value).toLocaleString() : "—"
const panel: React.CSSProperties = { background: "#0E2340", border: "1px solid rgba(255,255,255,.08)", borderRadius: 10, padding: 20 }
const field: React.CSSProperties = { width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid #344968", background: "#07172B", color: "#F4F1EA", fontSize: 13 }
const button: React.CSSProperties = { padding: "9px 14px", border: "1px solid rgba(201,168,76,.55)", borderRadius: 6, background: "rgba(201,168,76,.12)", color: "#E2C46A", cursor: "pointer", fontWeight: 600, fontSize: 12 }

export default function BillingPage() {
  const [user, setUser] = useState<any>(null)
  const [companies, setCompanies] = useState<any[]>([])
  const [companyId, setCompanyId] = useState("")
  const [plans, setPlans] = useState<any[]>([])
  const [current, setCurrent] = useState<any>(null)
  const [history, setHistory] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [submissions, setSubmissions] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [selectedPlan, setSelectedPlan] = useState("")
  const [selectedInterval, setSelectedInterval] = useState("MONTHLY")
  const [paymentInvoice, setPaymentInvoice] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<"BANK_TRANSFER" | "CASH" | "CHEQUE">("BANK_TRANSFER")
  const [paymentAmount, setPaymentAmount] = useState("")
  const [paymentReference, setPaymentReference] = useState("")
  const [financeQueue, setFinanceQueue] = useState<any[]>([])
  const [planCode, setPlanCode] = useState("")
  const [planName, setPlanName] = useState("")
  const [planDescription, setPlanDescription] = useState("")
  const [planGraceDays, setPlanGraceDays] = useState("0")
  const [planActive, setPlanActive] = useState(true)
  const [planPrices, setPlanPrices] = useState<Record<string, { enabled: boolean; amount: string; tax: string; reference: string }>>({
    MONTHLY: { enabled: true, amount: "", tax: "0.00", reference: "" },
    QUARTERLY: { enabled: false, amount: "", tax: "0.00", reference: "" },
    ANNUAL: { enabled: false, amount: "", tax: "0.00", reference: "" },
    ONE_TIME: { enabled: false, amount: "", tax: "0.00", reference: "" },
  })
  const [planFeatures, setPlanFeatures] = useState<string[]>(["compliance_package"])

  const role = String(user?.role || "")
  const canRequest = role === "CLIENT_DIRECTOR"
  const canSubmitPayment = role === "CLIENT_DIRECTOR"\n  const canFinance = role === "ADMIN_STAFF" || role === "SUPER_ADMIN"
  const selectedCompany = useMemo(() => companies.find(c => String(c.id) === companyId), [companies, companyId])

  useEffect(() => {
    const sessionUser = getUser()
    setUser(sessionUser)
    void loadInitial(sessionUser)
  }, [])

  async function loadInitial(sessionUser?: any) {
    setLoading(true)
    setError("")
    try {
      const finance = ["ADMIN_STAFF", "SUPER_ADMIN"].includes(String(sessionUser?.role || ""))
      const [companyResult, planResult, queueResult] = await Promise.all([
        companiesApi.list(),
        billingApi.plans(finance).catch(() => []),
        finance ? billingApi.financeQueue("PENDING").catch(() => []) : Promise.resolve([]),
      ])
      const rows = Array.isArray(companyResult) ? companyResult : (companyResult?.items || companyResult?.data || [])
      setCompanies(rows)
      setPlans(Array.isArray(planResult) ? planResult : [])
      setFinanceQueue(Array.isArray(queueResult) ? queueResult : [])
      if (rows.length) setCompanyId(String(rows[0].id))
    } catch (e: any) {
      setError(e?.message || "Unable to load billing information.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (companyId) void loadCompany(companyId)
    else {
      setCurrent(null); setHistory([]); setInvoices([]); setSubmissions([]); setPayments([])
    }
  }, [companyId])

  async function loadCompany(id: string) {
    setLoading(true)
    setError("")
    try {
      const [active, past, invoiceRows, claimRows, paymentRows] = await Promise.all([
        billingApi.current(id),
        billingApi.history(id),
        billingApi.invoices(id),
        billingApi.paymentSubmissions(id),
        billingApi.payments(id),
      ])
      setCurrent(active || null)
      setHistory(Array.isArray(past) ? past : [])
      setInvoices(Array.isArray(invoiceRows) ? invoiceRows : [])
      setSubmissions(Array.isArray(claimRows) ? claimRows : [])
      setPayments(Array.isArray(paymentRows) ? paymentRows : [])
      const firstUnpaid = (Array.isArray(invoiceRows) ? invoiceRows : []).find((x: any) => Number(x.balance_bdt) > 0 && x.status !== "DRAFT")
      if (firstUnpaid) {
        setPaymentInvoice(firstUnpaid.invoice_id)
        setPaymentAmount(String(firstUnpaid.balance_bdt))
      } else {
        setPaymentInvoice("")
        setPaymentAmount("")
      }
    } catch (e: any) {
      setError(e?.message || "Unable to load this company's billing records.")
    } finally {
      setLoading(false)
    }
  }

  async function refresh() {
    if (companyId) await loadCompany(companyId)
    const [freshPlans, freshQueue] = await Promise.all([
      billingApi.plans(canFinance).catch(() => []),
      canFinance ? billingApi.financeQueue("PENDING").catch(() => []) : Promise.resolve([]),
    ])
    setPlans(Array.isArray(freshPlans) ? freshPlans : [])
    setFinanceQueue(Array.isArray(freshQueue) ? freshQueue : [])
  }

  function editPlan(plan: any) {
    setPlanCode(plan.plan_code || "")
    setPlanName(plan.plan_name || "")
    setPlanDescription(plan.description || "")
    setPlanGraceDays(String(plan.grace_days ?? 0))
    setPlanActive(Boolean(plan.is_active))
    const nextPrices: Record<string, { enabled: boolean; amount: string; tax: string; reference: string }> = {
      MONTHLY: { enabled: false, amount: "", tax: "0.00", reference: "" },
      QUARTERLY: { enabled: false, amount: "", tax: "0.00", reference: "" },
      ANNUAL: { enabled: false, amount: "", tax: "0.00", reference: "" },
      ONE_TIME: { enabled: false, amount: "", tax: "0.00", reference: "" },
    }
    for (const price of plan.prices || []) {
      nextPrices[price.billing_interval] = {
        enabled: Boolean(price.is_active),
        amount: String(price.amount_bdt ?? ""),
        tax: String(price.tax_bdt ?? "0.00"),
        reference: String(price.tax_policy_reference ?? ""),
      }
    }
    setPlanPrices(nextPrices)
    setPlanFeatures((plan.features || []).filter((item: any) => item.enabled).map((item: any) => item.feature_code))
  }

  function resetPlanDraft() {
    setPlanCode(""); setPlanName(""); setPlanDescription(""); setPlanGraceDays("0"); setPlanActive(true)
    setPlanPrices({
      MONTHLY: { enabled: true, amount: "", tax: "0.00", reference: "" },
      QUARTERLY: { enabled: false, amount: "", tax: "0.00", reference: "" },
      ANNUAL: { enabled: false, amount: "", tax: "0.00", reference: "" },
      ONE_TIME: { enabled: false, amount: "", tax: "0.00", reference: "" },
    })
    setPlanFeatures(["compliance_package"])
  }

  function updatePlanPrice(interval: string, key: "enabled" | "amount" | "tax" | "reference", value: any) {
    setPlanPrices(previous => ({
      ...previous,
      [interval]: { ...previous[interval], [key]: value },
    }))
  }

  async function savePlan(event: React.FormEvent) {
    event.preventDefault()
    const prices = billingIntervals.filter(interval => planPrices[interval]?.enabled).map(interval => ({
      billing_interval: interval,
      amount_bdt: planPrices[interval].amount,
      tax_bdt: planPrices[interval].tax,
      tax_policy_reference: planPrices[interval].reference,
    }))
    if (!planCode.trim() || !planName.trim() || !prices.length || !planFeatures.length) {
      setError("Enter a plan code, name, at least one complete price interval and one feature mapping.")
      return
    }
    if (prices.some(price => !price.amount || !price.tax || price.tax_policy_reference.trim().length < 3)) {
      setError("Every enabled interval needs a positive price, a tax amount and a tax-policy reference.")
      return
    }
    setBusy(true); setError(""); setNotice("")
    try {
      await billingApi.upsertPlan(planCode.trim().toUpperCase(), {
        plan_name: planName.trim(),
        description: planDescription.trim() || null,
        grace_days: Number(planGraceDays),
        is_active: planActive,
        prices,
        features: planFeatures.map(feature_code => ({ feature_code })),
      })
      setNotice("Plan configuration saved. Finance must independently verify the commercial prices and legal tax treatment before offering it to customers.")
      await refresh()
      resetPlanDraft()
    } catch (e: any) { setError(e?.message || "Plan configuration failed.") }
    finally { setBusy(false) }
  }

  async function issueInvoice(subscriptionId: string) {
    setBusy(true); setError(""); setNotice("")
    try {
      const result = await billingApi.issueSubscriptionInvoice(subscriptionId)
      setNotice("Invoice " + result.invoice_number + " issued for the pending subscription.")
      await refresh()
    } catch (e: any) { setError(e?.message || "Invoice issuance failed.") }
    finally { setBusy(false) }
  }

  async function requestPlan() {
    if (!companyId || !selectedPlan) return
    setBusy(true); setError(""); setNotice("")
    try {
      await billingApi.requestSubscription(companyId, selectedPlan, selectedInterval)
      setNotice("Subscription request submitted. Finance must issue the invoice; access remains gated until the invoice is fully settled.")
      await refresh()
    } catch (e: any) {
      setError(e?.message || "Subscription request failed.")
    } finally { setBusy(false) }
  }

  async function cancelSubscription() {
    if (!companyId || !current?.subscription_id) return
    if (!window.confirm("Schedule this subscription to cancel at the end of its paid term?")) return
    setBusy(true); setError(""); setNotice("")
    try {
      await billingApi.cancelAtPeriodEnd(companyId, current.subscription_id)
      setNotice("Cancellation scheduled for the end of the current paid term.")
      await refresh()
    } catch (e: any) { setError(e?.message || "Cancellation request failed.") }
    finally { setBusy(false) }
  }

  async function submitPayment(event: React.FormEvent) {
    event.preventDefault()
    if (!companyId || !paymentInvoice || !paymentAmount) return
    setBusy(true); setError(""); setNotice("")
    try {
      await billingApi.submitOfflinePayment(companyId, {
        invoice_id: paymentInvoice,
        method: paymentMethod,
        amount_bdt: paymentAmount,
        payer_reference: paymentReference.trim() || undefined,
      })
      setNotice("Payment claim submitted for finance review. The subscription is not activated until finance verifies settlement.")
      setPaymentReference("")
      await refresh()
    } catch (e: any) { setError(e?.message || "Payment submission failed.") }
    finally { setBusy(false) }
  }

  if (loading && !companies.length) return <div style={{ padding: 28, color: "#F4F1EA" }}>Loading billing portal…</div>

  return (
    <div style={{ padding: 26, color: "#F4F1EA", maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap", marginBottom: 22 }}>
        <div>
          <div style={{ color: "#C9A84C", fontSize: 10, letterSpacing: ".16em", textTransform: "uppercase" }}>Account & payments</div>
          <h1 className="font-garamond" style={{ fontSize: 28, fontWeight: 600, margin: "5px 0" }}>Subscription & Billing</h1>
          <p style={{ color: "rgba(255,255,255,.52)", fontSize: 12, margin: 0 }}>View subscription status, invoices, payment claims and service entitlements.</p>
        </div>
        <button style={button} onClick={() => void refresh()} disabled={busy || loading}>Refresh records</button>
      </div>

      {error && <div role="alert" style={{ ...panel, borderColor: "#A94442", color: "#F5B7B1", marginBottom: 16 }}>{error}</div>}
      {notice && <div role="status" style={{ ...panel, borderColor: "#2D8063", color: "#9FE0C4", marginBottom: 16 }}>{notice}</div>}

      <section style={{ ...panel, marginBottom: 18 }}>
        <label style={{ display: "block", color: "#C9A84C", fontSize: 10, marginBottom: 8, textTransform: "uppercase", letterSpacing: ".12em" }}>Company account</label>
        <select value={companyId} onChange={e => setCompanyId(e.target.value)} style={{ ...field, maxWidth: 480 }} aria-label="Select company">
          <option value="">Select a company</option>
          {companies.map(c => <option key={c.id} value={c.id}>{c.company_name || c.name || c.registration_number || c.id}</option>)}
        </select>
        {selectedCompany && <div style={{ color: "rgba(255,255,255,.4)", fontSize: 11, marginTop: 8 }}>Registration: {selectedCompany.registration_number || selectedCompany.rjsc_registration_number || "Not supplied"}</div>}
      </section>

      {canFinance && (
        <>
          <section style={{ ...panel, marginBottom: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <h2 className="font-garamond" style={{ fontSize: 20, margin: 0 }}>Finance plan configuration</h2>
              <button type="button" style={button} onClick={resetPlanDraft}>New plan</button>
            </div>
            <p style={{ color: "rgba(255,255,255,.45)", fontSize: 11 }}>Enter prices and tax references supplied and approved by Finance. This screen stores the reference; it does not determine or validate VAT law.</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
              {plans.map(plan => <button key={plan.plan_code} type="button" style={button} onClick={() => editPlan(plan)}>{plan.plan_code} · {plan.is_active ? "Active" : "Inactive"}</button>)}
            </div>
            <form onSubmit={savePlan}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 10 }}>
                <input required value={planCode} onChange={e => setPlanCode(e.target.value.toUpperCase())} placeholder="Plan code (e.g. BASIC)" style={field} />
                <input required value={planName} onChange={e => setPlanName(e.target.value)} placeholder="Plan name" style={field} />
                <input type="number" min="0" max="30" value={planGraceDays} onChange={e => setPlanGraceDays(e.target.value)} placeholder="Grace days" style={field} />
                <input value={planDescription} onChange={e => setPlanDescription(e.target.value)} placeholder="Description" style={field} />
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 8, margin: "12px 0", fontSize: 12 }}>
                <input type="checkbox" checked={planActive} onChange={e => setPlanActive(e.target.checked)} /> Plan available to customers
              </label>
              <div style={{ color: "#C9A84C", fontSize: 10, textTransform: "uppercase", letterSpacing: ".12em", margin: "14px 0 8px" }}>Price intervals · BDT</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 10 }}>
                {billingIntervals.map(interval => (
                  <div key={interval} style={{ border: "1px solid rgba(255,255,255,.1)", borderRadius: 8, padding: 12 }}>
                    <label style={{ display: "flex", gap: 8, fontSize: 12, marginBottom: 10 }}><input type="checkbox" checked={planPrices[interval]?.enabled || false} onChange={e => updatePlanPrice(interval, "enabled", e.target.checked)} /> {interval}</label>
                    {planPrices[interval]?.enabled && (
                      <div style={{ display: "grid", gap: 8 }}>
                        <input required type="number" min="0.01" step="0.01" value={planPrices[interval].amount} onChange={e => updatePlanPrice(interval, "amount", e.target.value)} placeholder="Fee before tax" style={field} />
                        <input required type="number" min="0" step="0.01" value={planPrices[interval].tax} onChange={e => updatePlanPrice(interval, "tax", e.target.value)} placeholder="Tax amount" style={field} />
                        <input required minLength={3} maxLength={500} value={planPrices[interval].reference} onChange={e => updatePlanPrice(interval, "reference", e.target.value)} placeholder="Approved tax-policy reference" style={field} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div style={{ color: "#C9A84C", fontSize: 10, textTransform: "uppercase", letterSpacing: ".12em", margin: "14px 0 8px" }}>Feature mapping</div>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 12 }}>
                {Object.entries(featureLabels).map(([code, label]) => <label key={code} style={{ display: "flex", gap: 7, alignItems: "center" }}><input type="checkbox" checked={planFeatures.includes(code)} onChange={e => setPlanFeatures(previous => e.target.checked ? [...previous, code] : previous.filter(item => item !== code))} />{label}</label>)}
              </div>
              <button type="submit" style={{ ...button, marginTop: 16 }} disabled={busy}>{busy ? "Saving…" : "Save plan configuration"}</button>
            </form>
          </section>
          <section style={{ ...panel, marginBottom: 18 }}>
            <h2 className="font-garamond" style={{ fontSize: 20, margin: "0 0 12px" }}>Pending subscription requests</h2>
            {financeQueue.length ? financeQueue.map(item => <div key={item.subscription_id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", borderBottom: "1px solid rgba(255,255,255,.08)", padding: "10px 0", fontSize: 12 }}>
              <span>{item.plan_name} · {item.billing_interval} · {money(Number(item.amount_bdt) + Number(item.tax_bdt))}</span>
              <span style={{ color: "rgba(255,255,255,.45)" }}>Company {item.company_id}</span>
              <button type="button" style={button} disabled={busy || Boolean(item.invoice_id)} onClick={() => void issueInvoice(item.subscription_id)}>{item.invoice_id ? "Invoice issued" : "Issue invoice"}</button>
            </div>) : <div style={{ color: "rgba(255,255,255,.4)", fontSize: 12 }}>No pending subscription requests.</div>}
          </section>
        </>
      )}

      {!companyId ? (
        <section style={panel}>No company account is available for this login. A company director or administrator must grant company access before billing can be viewed.</section>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 14, marginBottom: 18 }}>
            <section style={panel}>
              <div style={{ color: "#C9A84C", fontSize: 10, textTransform: "uppercase", letterSpacing: ".12em" }}>Current subscription</div>
              <div style={{ fontSize: 21, margin: "12px 0 5px", fontWeight: 600 }}>{current?.plan_name || "No subscription"}</div>
              <div style={{ color: "rgba(255,255,255,.6)", fontSize: 12 }}>Status: <strong style={{ color: current?.status === "ACTIVE" ? "#9FE0C4" : "#E2C46A" }}>{current?.status || "NOT SUBSCRIBED"}</strong></div>
              <div style={{ color: "rgba(255,255,255,.45)", fontSize: 11, marginTop: 8 }}>Term ends: {dateLabel(current?.ends_at)}</div>
              <div style={{ color: "rgba(255,255,255,.45)", fontSize: 11 }}>Grace ends: {dateLabel(current?.grace_ends_at)}</div>
              {current?.cancel_at_period_end && <div style={{ color: "#E2C46A", fontSize: 11, marginTop: 8 }}>Cancellation scheduled at period end.</div>}
              {canRequest && current?.status === "ACTIVE" && !current?.cancel_at_period_end && <button style={{ ...button, marginTop: 14 }} disabled={busy} onClick={() => void cancelSubscription()}>Schedule cancellation</button>}
            </section>
            <section style={panel}>
              <div style={{ color: "#C9A84C", fontSize: 10, textTransform: "uppercase", letterSpacing: ".12em" }}>Current term price</div>
              <div style={{ fontSize: 23, margin: "12px 0 5px", fontWeight: 600 }}>{current ? money(Number(current.amount_bdt) + Number(current.tax_bdt)) : "—"}</div>
              <div style={{ color: "rgba(255,255,255,.5)", fontSize: 11 }}>Fee: {current ? money(current.amount_bdt) : "—"} · Tax: {current ? money(current.tax_bdt) : "—"}</div>
              <div style={{ color: "rgba(255,255,255,.38)", fontSize: 10, marginTop: 10 }}>Tax reference is stored as a finance record; it is not independent legal validation of VAT treatment.</div>
            </section>
          </div>

          {canRequest && (
            <section style={{ ...panel, marginBottom: 18 }}>
              <h2 className="font-garamond" style={{ fontSize: 20, margin: "0 0 14px" }}>Available subscription plans</h2>
              {plans.length === 0 ? <p style={{ color: "rgba(255,255,255,.5)", fontSize: 12 }}>No active plans are configured yet. Contact NLC Finance.</p> : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 12 }}>
                  {plans.map(plan => (
                    <label key={plan.plan_code} style={{ display: "block", border: selectedPlan === plan.plan_code ? "1px solid #C9A84C" : "1px solid rgba(255,255,255,.1)", borderRadius: 8, padding: 14, cursor: "pointer", background: selectedPlan === plan.plan_code ? "rgba(201,168,76,.07)" : "rgba(255,255,255,.02)" }}>
                      <input type="radio" name="subscription-plan" value={plan.plan_code} checked={selectedPlan === plan.plan_code} onChange={() => { setSelectedPlan(plan.plan_code); setSelectedInterval(plan.prices?.[0]?.billing_interval || "MONTHLY") }} />
                      <strong style={{ display: "block", margin: "8px 0 4px" }}>{plan.plan_name}</strong>
                      <span style={{ color: "rgba(255,255,255,.5)", fontSize: 11 }}>{plan.description || "Subscription plan"}</span>
                      <div style={{ marginTop: 10, fontSize: 12 }}>{(plan.prices || []).map((p: any) => <div key={p.billing_interval} style={{ marginTop: 4 }}>{p.billing_interval}: <strong>{money(Number(p.amount_bdt) + Number(p.tax_bdt))}</strong></div>)}</div>
                      <div style={{ marginTop: 10, color: "rgba(255,255,255,.5)", fontSize: 10 }}>{(plan.features || []).map((f: any) => featureLabels[f.feature_code] || f.feature_code).join(" · ")}</div>
                    </label>
                  ))}
                </div>
              )}
              {selectedPlan && (
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
                  <select value={selectedInterval} onChange={e => setSelectedInterval(e.target.value)} style={{ ...field, maxWidth: 220 }}>
                    {(plans.find(p => p.plan_code === selectedPlan)?.prices || []).map((p: any) => <option key={p.billing_interval} value={p.billing_interval}>{p.billing_interval}</option>)}
                  </select>
                  <button style={button} disabled={busy} onClick={() => void requestPlan()}>{busy ? "Submitting…" : "Request subscription"}</button>
                </div>
              )}
              <p style={{ color: "rgba(255,255,255,.38)", fontSize: 10, marginTop: 14 }}>A request does not activate paid features. Finance issues an invoice and verifies payment settlement before activation.</p>
            </section>
          )}

          <section style={{ ...panel, marginBottom: 18 }}>
            <h2 className="font-garamond" style={{ fontSize: 20, margin: "0 0 14px" }}>Invoices</h2>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead><tr style={{ color: "#C9A84C", textAlign: "left" }}>{["Invoice", "Status", "Total", "Paid", "Balance", "Due"].map(x => <th key={x} style={{ padding: "9px 8px", borderBottom: "1px solid rgba(255,255,255,.1)" }}>{x}</th>)}</tr></thead>
                <tbody>{invoices.length ? invoices.map(inv => <tr key={inv.invoice_id}>
                  <td style={{ padding: "10px 8px" }}>{inv.invoice_number}</td><td style={{ padding: "10px 8px" }}>{inv.status}</td>
                  <td style={{ padding: "10px 8px" }}>{money(inv.total_bdt)}</td><td style={{ padding: "10px 8px" }}>{money(inv.paid_bdt)}</td>
                  <td style={{ padding: "10px 8px" }}>{money(inv.balance_bdt)}</td><td style={{ padding: "10px 8px" }}>{inv.due_at || "—"}</td>
                </tr>) : <tr><td colSpan={6} style={{ padding: 16, color: "rgba(255,255,255,.4)" }}>No invoices available.</td></tr>}</tbody>
              </table>
            </div>
          </section>

          {canSubmitPayment && (
            <section style={{ ...panel, marginBottom: 18 }}>
              <h2 className="font-garamond" style={{ fontSize: 20, margin: "0 0 6px" }}>Submit payment evidence</h2>
              <p style={{ color: "rgba(255,255,255,.48)", fontSize: 11, margin: "0 0 14px" }}>Record a bank transfer, cash or cheque payment for finance review. This portal does not collect or verify online payments.</p>
              <form onSubmit={submitPayment} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 10 }}>
                <select required value={paymentInvoice} onChange={e => { setPaymentInvoice(e.target.value); const inv = invoices.find((x: any) => x.invoice_id === e.target.value); setPaymentAmount(inv ? String(inv.balance_bdt) : "") }} style={field}>
                  <option value="">Select unpaid invoice</option>
                  {invoices.filter(inv => Number(inv.balance_bdt) > 0 && inv.status !== "DRAFT").map(inv => <option key={inv.invoice_id} value={inv.invoice_id}>{inv.invoice_number} · balance {money(inv.balance_bdt)}</option>)}
                </select>
                <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as any)} style={field}>
                  <option value="BANK_TRANSFER">Bank transfer</option><option value="CASH">Cash</option><option value="CHEQUE">Cheque</option>
                </select>
                <input required type="number" min="0.01" step="0.01" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} placeholder="Amount (BDT)" style={field} />
                <input value={paymentReference} onChange={e => setPaymentReference(e.target.value)} placeholder={paymentMethod === "CASH" ? "Optional receipt reference" : "Required bank / instrument reference"} required={paymentMethod !== "CASH"} style={field} />
                <button type="submit" style={button} disabled={busy || !paymentInvoice}>{busy ? "Submitting…" : "Submit for review"}</button>
              </form>
            </section>
          )}

          <section style={{ ...panel, marginBottom: 18 }}>
            <h2 className="font-garamond" style={{ fontSize: 20, margin: "0 0 12px" }}>Payment claims & receipts</h2>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead><tr style={{ color: "#C9A84C", textAlign: "left" }}>{["Method", "Reference", "Amount", "Status", "Submitted"].map(x => <th key={x} style={{ padding: "9px 8px", borderBottom: "1px solid rgba(255,255,255,.1)" }}>{x}</th>)}</tr></thead>
                <tbody>{submissions.length ? submissions.map(s => <tr key={s.submission_id}>
                  <td style={{ padding: "10px 8px" }}>{s.method}</td><td style={{ padding: "10px 8px" }}>{s.payer_reference || "—"}</td><td style={{ padding: "10px 8px" }}>{money(s.amount_bdt)}</td><td style={{ padding: "10px 8px" }}>{s.status}</td><td style={{ padding: "10px 8px" }}>{dateLabel(s.paid_at)}</td>
                </tr>) : <tr><td colSpan={5} style={{ padding: 16, color: "rgba(255,255,255,.4)" }}>No payment claims submitted.</td></tr>}</tbody>
              </table>
            </div>
            <div style={{ color: "rgba(255,255,255,.42)", fontSize: 10, marginTop: 12 }}>Verified receipts: {payments.length}. A pending claim is not a settled payment and does not unlock subscription features.</div>
          </section>

          <section style={{ ...panel, marginBottom: 18 }}>
            <h2 className="font-garamond" style={{ fontSize: 20, margin: "0 0 12px" }}>Subscription history</h2>
            {history.length ? history.map(item => <div key={item.subscription_id} style={{ padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,.07)", display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", fontSize: 12 }}>
              <span>{item.plan_name} · {item.billing_interval}</span><span style={{ color: "#C9A84C" }}>{item.status}</span><span style={{ color: "rgba(255,255,255,.45)" }}>{dateLabel(item.starts_at)} – {dateLabel(item.ends_at)}</span>
            </div>) : <div style={{ color: "rgba(255,255,255,.4)", fontSize: 12 }}>No subscription history.</div>}
          </section>
        </>
      )}
      <div style={{ color: "rgba(255,255,255,.28)", fontSize: 10, textAlign: "center", marginTop: 18 }}>Billing records are informational. Subscription activation depends on finance verification and reconciled settlement. Contact NLC Finance for invoice disputes or tax/VAT questions.</div>
    </div>
  )
}
