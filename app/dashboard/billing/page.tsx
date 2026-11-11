"use client"

import Link from "next/link"
import { useEffect, useMemo, useState, type FormEvent } from "react"
import { billingApi, companiesApi } from "@/lib/api"
import { useCurrentUserRole } from "@/lib/use-current-user-role"

type Company = { id: string; company_name?: string; name?: string }
type PlanPrice = {
  billing_interval: "MONTHLY" | "QUARTERLY" | "ANNUAL" | "ONE_TIME"
  amount_bdt: string | number
  tax_bdt: string | number
  tax_policy_reference: string
  currency?: string
}
type Plan = {
  plan_code: string
  plan_name: string
  description?: string | null
  grace_days: number
  prices: PlanPrice[]
  features: Array<{ feature_code: string; enabled: boolean }>
}
type Subscription = {
  subscription_id: string
  company_id: string
  plan_code: string
  plan_name: string
  billing_interval: string
  amount_bdt: string | number
  tax_bdt: string | number
  status: string
  starts_at?: string | null
  ends_at?: string | null
  renews_at?: string | null
  grace_ends_at?: string | null
  invoice_id?: string | null
  cancel_at_period_end: boolean
}

const money = (value: string | number | null | undefined) =>
  new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 2,
  }).format(Number(value || 0))

const dateLabel = (value?: string | null) => {
  if (!value) return "Not set"
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? "Not set"
    : date.toLocaleDateString("en-BD", { dateStyle: "medium" })
}

export default function BillingPage() {
  const { role, loaded: roleLoaded } = useCurrentUserRole()
  const [companies, setCompanies] = useState<Company[]>([])
  const [companyId, setCompanyId] = useState("")
  const [plans, setPlans] = useState<Plan[]>([])
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [history, setHistory] = useState<Subscription[]>([])
  const [planCode, setPlanCode] = useState("")
  const [billingInterval, setBillingInterval] = useState<PlanPrice["billing_interval"]>("MONTHLY")
  const [cancelReason, setCancelReason] = useState("")
  const [loading, setLoading] = useState(true)
  const [loadingSubscription, setLoadingSubscription] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")

  const isDirector = role === "CLIENT_DIRECTOR"
  const selectedPlan = useMemo(
    () => plans.find((plan) => plan.plan_code === planCode) ?? null,
    [plans, planCode],
  )
  const availablePrices = selectedPlan?.prices ?? []
  const selectedPrice = availablePrices.find((price) => price.billing_interval === billingInterval)
    ?? availablePrices[0]
  const companyName = companies.find((company) => company.id === companyId)?.company_name
    ?? companies.find((company) => company.id === companyId)?.name
    ?? "Selected company"

  useEffect(() => {
    if (!roleLoaded || !role) return
    let active = true
    const load = async () => {
      setLoading(true)
      setError("")
      try {
        const [companyRows, planRows] = await Promise.all([
          companiesApi.list(),
          billingApi.plans(),
        ])
        if (!active) return
        const companyList = Array.isArray(companyRows) ? companyRows : []
        const planList = Array.isArray(planRows) ? planRows as Plan[] : []
        setCompanies(companyList)
        setPlans(planList)
        setCompanyId((current) => current || String(companyList[0]?.id ?? ""))
        setPlanCode((current) => current || planList[0]?.plan_code || "")
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Unable to load billing information.")
      } finally {
        if (active) setLoading(false)
      }
    }
    void load()
    return () => { active = false }
  }, [role, roleLoaded])

  useEffect(() => {
    if (!companyId || !roleLoaded) return
    let active = true
    const load = async () => {
      setLoadingSubscription(true)
      setError("")
      try {
        const [current, previous] = await Promise.all([
          billingApi.current(companyId),
          billingApi.history(companyId),
        ])
        if (!active) return
        setSubscription(current ?? null)
        setHistory(Array.isArray(previous) ? previous : [])
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Unable to load this company's subscription.")
      } finally {
        if (active) setLoadingSubscription(false)
      }
    }
    void load()
    return () => { active = false }
  }, [companyId, roleLoaded])

  const refreshSubscription = async (requestedCompanyId: string) => {
    const [current, previous] = await Promise.all([
      billingApi.current(requestedCompanyId),
      billingApi.history(requestedCompanyId),
    ])
    if (companyId !== requestedCompanyId) return
    setSubscription(current ?? null)
    setHistory(Array.isArray(previous) ? previous : [])
  }

  const requestPlan = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!companyId || !selectedPlan || !selectedPrice || !isDirector) return
    setBusy(true)
    setError("")
    setNotice("")
    try {
      await billingApi.requestSubscription(companyId, selectedPlan.plan_code, selectedPrice.billing_interval)
      await refreshSubscription(companyId)
      setNotice("Subscription request received. NLC finance staff will issue the invoice. Access is activated only after the payment is verified and allocated.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to submit the subscription request.")
    } finally {
      setBusy(false)
    }
  }

  const requestCancellation = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!companyId || !subscription || !cancelReason.trim() || !isDirector) return
    setBusy(true)
    setError("")
    setNotice("")
    try {
      await billingApi.cancelAtPeriodEnd(companyId, subscription.subscription_id, cancelReason.trim())
      await refreshSubscription(companyId)
      setCancelReason("")
      setNotice("Cancellation request recorded for the end of the current subscription period.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to submit the cancellation request.")
    } finally {
      setBusy(false)
    }
  }

  if (!roleLoaded) {
    return <main className="mx-auto max-w-5xl p-6 sm:p-10"><section className="nlc-card" role="status">Loading billing workspace…</section></main>
  }

  if (!role) {
    return <main className="mx-auto max-w-5xl p-6 sm:p-10"><section className="nlc-card" role="status">Sign in to view company billing.</section></main>
  }

  if (loading) {
    return <main className="mx-auto max-w-5xl p-6 sm:p-10"><section className="nlc-card" role="status">Loading billing workspace…</section></main>
  }

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-6 sm:p-10">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--text2)" }}>Customer workspace</p>
        <h1 className="mt-2 font-garamond text-3xl">Billing & subscriptions</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6" style={{ color: "var(--text2)" }}>
          Review the subscription attached to your company and request a plan. Use the finance workspace to review invoices and payment status.
        </p>
      </header>

      {error && <p className="rounded-lg border border-red-300 p-3 text-sm" role="alert">{error}</p>}
      {notice && <p className="rounded-lg border border-green-300 p-3 text-sm" role="status">{notice}</p>}

      <section className="nlc-card space-y-3">
        <label htmlFor="billing-company" className="text-sm font-semibold">Company</label>
        <select id="billing-company" className="w-full rounded-lg border p-3" value={companyId} onChange={(event) => setCompanyId(event.target.value)}>
          {companies.map((company) => (
            <option key={company.id} value={company.id}>{company.company_name ?? company.name ?? company.id}</option>
          ))}
        </select>
        {!companies.length && <p className="text-sm" style={{ color: "var(--text2)" }}>No companies are available to this account.</p>}
      </section>

      <section className="nlc-card space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-garamond text-2xl">Current subscription</h2>
            <p className="mt-1 text-sm" style={{ color: "var(--text2)" }}>{companyName}</p>
          </div>
          {subscription && <span className="rounded-full border px-3 py-1 text-xs font-semibold">{subscription.status.replaceAll("_", " ")}</span>}
        </div>
        {loadingSubscription ? <p className="text-sm">Loading subscription…</p> : subscription ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <div><p className="text-xs" style={{ color: "var(--text2)" }}>Plan</p><p className="font-semibold">{subscription.plan_name}</p></div>
            <div><p className="text-xs" style={{ color: "var(--text2)" }}>Billing interval</p><p className="font-semibold">{subscription.billing_interval}</p></div>
            <div><p className="text-xs" style={{ color: "var(--text2)" }}>Fee before tax</p><p className="font-semibold">{money(subscription.amount_bdt)}</p></div>
            <div><p className="text-xs" style={{ color: "var(--text2)" }}>Tax amount</p><p className="font-semibold">{money(subscription.tax_bdt)}</p></div>
            <div><p className="text-xs" style={{ color: "var(--text2)" }}>Starts</p><p>{dateLabel(subscription.starts_at)}</p></div>
            <div><p className="text-xs" style={{ color: "var(--text2)" }}>Renews / ends</p><p>{dateLabel(subscription.renews_at ?? subscription.ends_at)}</p></div>
            {subscription.cancel_at_period_end && <p className="text-sm sm:col-span-2">Cancellation is scheduled for the end of this period.</p>}
          </div>
        ) : <p className="text-sm" style={{ color: "var(--text2)" }}>No current subscription is recorded for this company.</p>}
        {subscription && isDirector && !subscription.cancel_at_period_end && (
          <form onSubmit={requestCancellation} className="space-y-2 border-t pt-4">
            <label htmlFor="cancel-reason" className="text-sm font-semibold">Request cancellation at period end</label>
            <input id="cancel-reason" className="w-full rounded-lg border p-3" minLength={3} maxLength={2000} value={cancelReason} onChange={(event) => setCancelReason(event.target.value)} placeholder="Reason for cancellation" required />
            <button className="rounded-lg border px-4 py-2 text-sm font-semibold disabled:opacity-50" type="submit" disabled={busy || !cancelReason.trim()}>{busy ? "Submitting…" : "Request cancellation"}</button>
          </form>
        )}
      </section>

      <section className="nlc-card space-y-4">
        <div>
          <h2 className="font-garamond text-2xl">Available plans</h2>
          <p className="mt-1 text-sm" style={{ color: "var(--text2)" }}>Prices and tax amounts are configured by NLC finance staff. The tax reference is displayed as supplied; it is not a tax opinion.</p>
        </div>
        {!plans.length ? <p className="text-sm" style={{ color: "var(--text2)" }}>No active subscription plans are currently published.</p> : (
          <form onSubmit={requestPlan} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              {plans.map((plan) => (
                <button key={plan.plan_code} type="button" onClick={() => setPlanCode(plan.plan_code)} className={`rounded-xl border p-4 text-left ${planCode === plan.plan_code ? "border-current" : ""}`} aria-pressed={planCode === plan.plan_code}>
                  <span className="block font-semibold">{plan.plan_name}</span>
                  <span className="mt-1 block text-xs" style={{ color: "var(--text2)" }}>{plan.description || plan.plan_code}</span>
                  <span className="mt-2 block text-xs">{plan.features.filter((feature) => feature.enabled).map((feature) => feature.feature_code.replaceAll("_", " ")).join(" · ")}</span>
                </button>
              ))}
            </div>
            {selectedPlan && (
              <div className="space-y-3">
                <label htmlFor="billing-interval" className="block text-sm font-semibold">Billing interval</label>
                <select id="billing-interval" className="w-full rounded-lg border p-3" value={selectedPrice?.billing_interval ?? billingInterval} onChange={(event) => setBillingInterval(event.target.value as PlanPrice["billing_interval"])}>
                  {availablePrices.map((price) => <option key={price.billing_interval} value={price.billing_interval}>{price.billing_interval}</option>)}
                </select>
                {selectedPrice && (
                  <div className="rounded-lg border p-3 text-sm">
                    <p>Fee: <strong>{money(selectedPrice.amount_bdt)}</strong></p>
                    <p>Tax: <strong>{money(selectedPrice.tax_bdt)}</strong></p>
                    <p>Total: <strong>{money(Number(selectedPrice.amount_bdt) + Number(selectedPrice.tax_bdt))}</strong></p>
                    <p className="mt-2 text-xs" style={{ color: "var(--text2)" }}>Tax reference: {selectedPrice.tax_policy_reference}</p>
                  </div>
                )}
              </div>
            )}
            {isDirector ? (
              <button type="submit" disabled={busy || !companyId || !selectedPrice} className="rounded-lg px-5 py-3 text-sm font-semibold text-white disabled:opacity-50" style={{ background: "var(--accent)" }}>
                {busy ? "Submitting…" : "Request this plan"}
              </button>
            ) : <p className="text-sm" style={{ color: "var(--text2)" }}>Only a company director can request or cancel a subscription. Contact NLC staff if you need assistance.</p>}
          </form>
        )}
      </section>

      <section className="nlc-card space-y-3">
        <h2 className="font-garamond text-2xl">Subscription history</h2>
        {history.length ? history.map((item) => (
          <div key={item.subscription_id} className="flex flex-wrap justify-between gap-2 border-b py-3 last:border-0">
            <div><p className="font-semibold">{item.plan_name}</p><p className="text-xs" style={{ color: "var(--text2)" }}>{item.billing_interval} · {dateLabel(item.starts_at)} – {dateLabel(item.ends_at)}</p></div>
            <span className="text-sm">{item.status.replaceAll("_", " ")}</span>
          </div>
        )) : <p className="text-sm" style={{ color: "var(--text2)" }}>No previous subscriptions.</p>}
      </section>

      <section className="nlc-card space-y-2">
        <h2 className="font-garamond text-xl">Invoices and payments</h2>
        <p className="text-sm leading-6" style={{ color: "var(--text2)" }}>NLC finance staff issue subscription invoices. You can review invoices, submit bank transfer, cash, cheque or manual mobile-wallet payment claims, and track verification in the finance workspace. A claim is not a settled payment until finance verifies it.</p>
        <p className="text-sm font-semibold">Online bKash, Nagad and SSLCommerz checkout is not enabled.</p>
        <Link className="inline-flex rounded-lg border px-4 py-2 text-sm font-semibold" href="/dashboard/finance">Open finance workspace</Link>
      </section>
    </main>
  )
}
