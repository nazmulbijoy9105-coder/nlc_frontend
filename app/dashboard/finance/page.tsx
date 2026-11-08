"use client"

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react"
import { companiesApi, commercialApi, financeApi } from "@/lib/api"
import { getUser } from "@/lib/auth"

type Company = {
  id: string
  company_name?: string
  name?: string
  rjsc_registration_number?: string
  registration_number?: string
}

type Engagement = {
  engagement_id: string
  description?: string | null
  status?: string
  revenue_tier?: string
}

type Invoice = {
  invoice_id: string
  company_id: string
  invoice_number: string
  total_bdt: string | number
  paid_bdt: string | number
  balance_bdt: string | number
  status: string
  due_at?: string | null
  lines?: Array<{ description: string; quantity: string | number; line_total_bdt: string | number }>
}

type Submission = {
  submission_id: string
  invoice_id: string
  method: string
  amount_bdt: string | number
  payer_reference?: string | null
  paid_at?: string | null
  status: string
  review_note?: string | null
}

type Payment = {
  payment_id: string
  payment_number: string
  method: string
  channel: string
  amount_bdt: string | number
  status: string
  received_at: string
  verified_at?: string | null
}

const methods = [
  ["BANK_TRANSFER", "Bank transfer"],
  ["CASH", "Cash"],
  ["CHEQUE", "Cheque"],
  ["BKASH_MANUAL", "bKash (manual verification)"],
  ["NAGAD_MANUAL", "Nagad (manual verification)"],
] as const

const money = (value: string | number | null | undefined) =>
  new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 2,
  }).format(Number(value || 0))

const dateLabel = (value?: string | null) => {
  if (!value) return "—"
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString("en-BD", { dateStyle: "medium", timeStyle: "short" })
}

const localDateTimeToIso = (value: string) => {
  if (!value) return null
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) throw new Error("Enter a valid date and time.")
  return parsed.toISOString()
}

const statusTone = (status: string) => {
  if (["PAID", "APPROVED", "SETTLED", "ISSUED"].includes(status)) return "badge-green"
  if (["PENDING_REVIEW", "DRAFT", "PARTIALLY_PAID", "OVERDUE"].includes(status)) return "badge-yellow"
  if (["REJECTED", "FAILED", "CANCELLED"].includes(status)) return "badge-red"
  return "badge-neutral"
}

export default function FinancePage() {
  const [user, setUser] = useState<any>(null)
  const [companies, setCompanies] = useState<Company[]>([])
  const [companyId, setCompanyId] = useState("")
  const companyIdRef = useRef(companyId)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [engagements, setEngagements] = useState<Engagement[]>([])
  const [engagementId, setEngagementId] = useState("")
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [loadingCompanies, setLoadingCompanies] = useState(true)
  const [loadingFinance, setLoadingFinance] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")

  const [invoiceDescription, setInvoiceDescription] = useState("")
  const [invoiceAmount, setInvoiceAmount] = useState("")
  const [invoiceTax, setInvoiceTax] = useState("0.00")
  const [invoiceDueDate, setInvoiceDueDate] = useState("")

  const [paymentInvoiceId, setPaymentInvoiceId] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<(typeof methods)[number][0]>("BANK_TRANSFER")
  const [paymentAmount, setPaymentAmount] = useState("")
  const [payerReference, setPayerReference] = useState("")
  const [paidAt, setPaidAt] = useState("")
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({})
  const [chequeClearance, setChequeClearance] = useState<Record<string, string>>({})

  const role = user?.role || ""
  const isFinanceStaff = role === "ADMIN_STAFF" || role === "SUPER_ADMIN"
  const isClient = role === "CLIENT_DIRECTOR" || role === "CLIENT_VIEW_ONLY"
  const canSubmitPayment = role === "CLIENT_DIRECTOR"

  useEffect(() => { companyIdRef.current = companyId }, [companyId])

  useEffect(() => {
    const currentUser = getUser()
    setUser(currentUser)
    if (!["ADMIN_STAFF", "SUPER_ADMIN", "CLIENT_DIRECTOR", "CLIENT_VIEW_ONLY"].includes(currentUser?.role || "")) {
      setLoadingCompanies(false)
      return
    }
    const loadCompanies = async () => {
      try {
        const data = await companiesApi.list()
        const rows = Array.isArray(data) ? data : []
        setCompanies(rows)
        if (rows.length) setCompanyId(String(rows[0].id))
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load companies.")
      } finally {
        setLoadingCompanies(false)
      }
    }
    void loadCompanies()
  }, [])

  useEffect(() => {
    if (!companyId) {
      setInvoices([])
      setSubmissions([])
      setPayments([])
      setLoadingFinance(false)
      return
    }
    let active = true
    setLoadingFinance(true)
    setError("")
    // Never leave the previous company's financial records visible during a tenant switch.
    setInvoices([])
    setSubmissions([])
    setPayments([])
    Promise.all([
      financeApi.invoices(companyId),
      financeApi.paymentSubmissions(companyId),
      financeApi.payments(companyId),
    ])
      .then(([invoiceRows, submissionRows, paymentRows]) => {
        if (!active) return
        setInvoices(Array.isArray(invoiceRows) ? invoiceRows : [])
        setSubmissions(Array.isArray(submissionRows) ? submissionRows : [])
        setPayments(Array.isArray(paymentRows) ? paymentRows : [])
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : "Unable to load billing records.")
      })
      .finally(() => {
        if (active) setLoadingFinance(false)
      })
    return () => { active = false }
  }, [companyId])

  useEffect(() => {
    setPaymentInvoiceId("")
    setEngagementId("")
    if (!companyId || !isFinanceStaff) {
      setEngagements([])
      return
    }
    let active = true
    commercialApi.engagements(companyId)
      .then((rows) => {
        if (active) setEngagements(Array.isArray(rows) ? rows : [])
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : "Engagements could not be loaded.")
      })
    return () => { active = false }
  }, [companyId, isFinanceStaff])

  const selectedCompany = companies.find((company) => String(company.id) === companyId)
  const openInvoices = useMemo(
    () => invoices.filter((invoice) => ["ISSUED", "PARTIALLY_PAID", "OVERDUE"].includes(invoice.status)),
    [invoices],
  )
  const outstanding = useMemo(
    () => invoices
      .filter((invoice) => ["ISSUED", "PARTIALLY_PAID", "OVERDUE"].includes(invoice.status))
      .reduce((sum, invoice) => sum + Number(invoice.balance_bdt || 0), 0),
    [invoices],
  )
  const paidTotal = useMemo(
    () => payments
      .filter((payment) => payment.status === "SETTLED")
      .reduce((sum, payment) => sum + Number(payment.amount_bdt || 0), 0),
    [payments],
  )
  const pendingCount = submissions.filter((item) => item.status === "PENDING_REVIEW").length

  const refreshFinance = async () => {
    const requestedCompanyId = companyId
    if (!requestedCompanyId) return
    const [invoiceRows, submissionRows, paymentRows] = await Promise.all([
      financeApi.invoices(requestedCompanyId),
      financeApi.paymentSubmissions(requestedCompanyId),
      financeApi.payments(requestedCompanyId),
    ])
    if (companyIdRef.current !== requestedCompanyId) return
    setInvoices(Array.isArray(invoiceRows) ? invoiceRows : [])
    setSubmissions(Array.isArray(submissionRows) ? submissionRows : [])
    setPayments(Array.isArray(paymentRows) ? paymentRows : [])
  }

  const createInvoice = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!companyId) return
    setBusy(true)
    setError("")
    setNotice("")
    try {
      await financeApi.createInvoice({
        company_id: companyId,
        engagement_id: engagementId || null,
        lines: [{ description: invoiceDescription.trim(), quantity: "1.00", unit_price_bdt: invoiceAmount }],
        tax_bdt: invoiceTax || "0.00",
        due_at: invoiceDueDate || null,
      })
      setInvoiceDescription("")
      setInvoiceAmount("")
      setInvoiceTax("0.00")
      setInvoiceDueDate("")
      await refreshFinance()
      setNotice("Draft invoice created. Issue it after checking the line items and amount.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invoice could not be created.")
    } finally {
      setBusy(false)
    }
  }

  const issueInvoice = async (invoiceId: string) => {
    setBusy(true)
    setError("")
    setNotice("")
    try {
      await financeApi.issueInvoice(invoiceId)
      await refreshFinance()
      setNotice("Invoice issued successfully.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invoice could not be issued.")
    } finally {
      setBusy(false)
    }
  }

  const submitPayment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!companyId || !paymentInvoiceId) return
    setBusy(true)
    setError("")
    setNotice("")
    try {
      await financeApi.submitOfflinePayment(companyId, {
        invoice_id: paymentInvoiceId,
        method: paymentMethod,
        amount_bdt: paymentAmount,
        payer_reference: payerReference.trim() || null,
        paid_at: localDateTimeToIso(paidAt),
      })
      setPaymentAmount("")
      setPayerReference("")
      setPaidAt("")
      await refreshFinance()
      setNotice("Payment claim submitted. It remains pending until finance staff verify it.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment claim could not be submitted.")
    } finally {
      setBusy(false)
    }
  }

  const approveSubmission = async (submission: Submission) => {
    setBusy(true)
    setError("")
    setNotice("")
    try {
      const chequeDate = submission.method === "CHEQUE"
        ? localDateTimeToIso(chequeClearance[submission.submission_id] || "")
        : null
      if (submission.method === "CHEQUE" && !chequeDate) {
        throw new Error("Record the cheque clearance date and time before approval.")
      }
      await financeApi.approvePaymentSubmission(submission.submission_id, {
        review_note: reviewNotes[submission.submission_id]?.trim() || null,
        cheque_cleared_at: chequeDate,
      })
      await refreshFinance()
      setNotice("Payment verified and posted to the ledger.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment could not be approved.")
    } finally {
      setBusy(false)
    }
  }

  const rejectSubmission = async (submission: Submission) => {
    const reason = window.prompt("Enter the reason for rejecting this payment claim:")
    if (reason === null) return
    if (reason.trim().length < 3) {
      setError("Rejection reason must contain at least three characters.")
      return
    }
    setBusy(true)
    setError("")
    setNotice("")
    try {
      await financeApi.rejectPaymentSubmission(submission.submission_id, reason.trim())
      await refreshFinance()
      setNotice("Payment claim rejected and the decision recorded.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment claim could not be rejected.")
    } finally {
      setBusy(false)
    }
  }

  if (!user || loadingCompanies) {
    return <div style={{ padding: 32, color: "var(--white-3)" }}>Loading billing workspace…</div>
  }

  if (!isFinanceStaff && !isClient) {
    return <div style={{ padding: 48, color: "#B91C1C", textAlign: "center" }}>Access denied — billing is limited to company clients and authorised finance staff.</div>
  }

  const requiresReference = ["BANK_TRANSFER", "CHEQUE", "BKASH_MANUAL", "NAGAD_MANUAL"].includes(paymentMethod)

  return (
    <div style={{ padding: 24, maxWidth: 1440, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16, flexWrap: "wrap", marginBottom: 22 }}>
        <div>
          <div className="font-garamond" style={{ fontSize: 25, color: "var(--nlc-white)" }}>Billing & Collections</div>
          <div style={{ fontSize: 12, color: "var(--white-3)", marginTop: 5 }}>
            {isFinanceStaff ? "Internal finance workspace · invoices, payment review and ledger" : "Company workspace · invoices, payment claims and receipts"}
          </div>
        </div>
        <label style={{ display: "grid", gap: 6, minWidth: 260, color: "var(--white-3)", fontSize: 11 }}>
          Company
          <select value={companyId} onChange={(event) => setCompanyId(event.target.value)} className="nlc-input" style={{ minHeight: 40 }}>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.company_name || company.name || company.id}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && <div role="alert" style={{ padding: 12, borderRadius: 8, background: "rgba(185,28,28,.12)", color: "#FCA5A5", marginBottom: 14 }}>{error}</div>}
      {notice && <div role="status" style={{ padding: 12, borderRadius: 8, background: "rgba(26,122,82,.14)", color: "#86EFAC", marginBottom: 14 }}>{notice}</div>}

      {!companies.length ? (
        <div className="nlc-card" style={{ color: "var(--text3)" }}>No company is available to this account. A company must be linked before billing can be used.</div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12, marginBottom: 18 }}>
            {[
              ["Outstanding", money(outstanding), "Issued invoice balance"],
              ["Payments received", money(paidTotal), "Verified ledger receipts"],
              ["Invoices", String(invoices.length), "Draft and issued"],
              ["Claims awaiting review", String(pendingCount), "Manual payment submissions"],
            ].map(([label, value, caption]) => (
              <div className="nlc-card" key={label} style={{ padding: 16 }}>
                <div style={{ fontSize: 10, color: "var(--text3)", letterSpacing: ".1em", textTransform: "uppercase" }}>{label}</div>
                <div className="font-garamond" style={{ fontSize: 23, color: "var(--nlc-white)", marginTop: 8 }}>{value}</div>
                <div style={{ fontSize: 10, color: "var(--white-3)", marginTop: 4 }}>{caption}</div>
              </div>
            ))}
          </div>

          {isFinanceStaff && (
            <section className="nlc-card" style={{ marginBottom: 18 }}>
              <div className="sec-lbl gold">Create invoice · {selectedCompany?.company_name || selectedCompany?.name || "Selected company"}</div>
              <form onSubmit={createInvoice} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 12, alignItems: "end" }}>
                <label style={{ display: "grid", gap: 6, fontSize: 11, color: "var(--text3)" }}>
                  Link to engagement (recommended)
                  <select className="nlc-input" value={engagementId} onChange={(event) => setEngagementId(event.target.value)}>
                    <option value="">Unlinked invoice</option>
                    {engagements.map((engagement) => (
                      <option key={engagement.engagement_id} value={engagement.engagement_id}>
                        {engagement.description || engagement.engagement_id} · {engagement.status || "—"}
                      </option>
                    ))}
                  </select>
                </label>
                <label style={{ display: "grid", gap: 6, fontSize: 11, color: "var(--text3)" }}>
                  Service / line description
                  <input className="nlc-input" value={invoiceDescription} onChange={(event) => setInvoiceDescription(event.target.value)} maxLength={500} required placeholder="e.g. Annual compliance retainer" />
                </label>
                <label style={{ display: "grid", gap: 6, fontSize: 11, color: "var(--text3)" }}>
                  Amount (BDT)
                  <input className="nlc-input" type="number" min="0" step="0.01" value={invoiceAmount} onChange={(event) => setInvoiceAmount(event.target.value)} required />
                </label>
                <label style={{ display: "grid", gap: 6, fontSize: 11, color: "var(--text3)" }}>
                  Tax (BDT)
                  <input className="nlc-input" type="number" min="0" step="0.01" value={invoiceTax} onChange={(event) => setInvoiceTax(event.target.value)} />
                </label>
                <label style={{ display: "grid", gap: 6, fontSize: 11, color: "var(--text3)" }}>
                  Due date
                  <input className="nlc-input" type="date" value={invoiceDueDate} onChange={(event) => setInvoiceDueDate(event.target.value)} />
                </label>
                <button className="nlc-btn-gold" type="submit" disabled={busy || !companyId} style={{ minHeight: 40 }}>
                  {busy ? "Saving…" : "Create draft"}
                </button>
              </form>
              <div style={{ fontSize: 10, color: "var(--white-3)", marginTop: 10 }}>
                Unlinked invoices remain billable but are excluded from engagement-level revenue pipeline totals.
              </div>
            </section>
          )}

          {role === "CLIENT_VIEW_ONLY" && (
            <div className="nlc-card" style={{ marginBottom: 18, color: "var(--white-3)", fontSize: 12 }}>
              This account has view-only billing access. A company director or authorised finance contact must submit payment claims.
            </div>
          )}

          {canSubmitPayment && (
            <section className="nlc-card" style={{ marginBottom: 18 }}>
              <div className="sec-lbl gold">Submit payment claim</div>
              <div style={{ fontSize: 11, color: "var(--white-3)", marginBottom: 12 }}>
                Claims are not treated as received funds until authorised finance staff verify them.
              </div>
              <form onSubmit={submitPayment} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(165px,1fr))", gap: 12, alignItems: "end" }}>
                <label style={{ display: "grid", gap: 6, fontSize: 11, color: "var(--text3)" }}>
                  Invoice
                  <select className="nlc-input" value={paymentInvoiceId} onChange={(event) => setPaymentInvoiceId(event.target.value)} required>
                    <option value="">Select an invoice</option>
                    {openInvoices.map((invoice) => (
                      <option key={invoice.invoice_id} value={invoice.invoice_id}>
                        {invoice.invoice_number} · balance {money(invoice.balance_bdt)}
                      </option>
                    ))}
                  </select>
                </label>
                <label style={{ display: "grid", gap: 6, fontSize: 11, color: "var(--text3)" }}>
                  Payment method
                  <select className="nlc-input" value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value as (typeof methods)[number][0])}>
                    {methods.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </label>
                <label style={{ display: "grid", gap: 6, fontSize: 11, color: "var(--text3)" }}>
                  Amount (BDT)
                  <input className="nlc-input" type="number" min="0.01" step="0.01" value={paymentAmount} onChange={(event) => setPaymentAmount(event.target.value)} required />
                </label>
                <label style={{ display: "grid", gap: 6, fontSize: 11, color: "var(--text3)" }}>
                  {requiresReference ? "Transaction / instrument reference" : "Payer reference (optional)"}
                  <input className="nlc-input" value={payerReference} onChange={(event) => setPayerReference(event.target.value)} maxLength={160} required={requiresReference} />
                </label>
                <label style={{ display: "grid", gap: 6, fontSize: 11, color: "var(--text3)" }}>
                  Payment date & time (optional)
                  <input className="nlc-input" type="datetime-local" value={paidAt} onChange={(event) => setPaidAt(event.target.value)} />
                </label>
                <button className="nlc-btn-gold" type="submit" disabled={busy || !openInvoices.length} style={{ minHeight: 40 }}>
                  {busy ? "Submitting…" : "Submit for verification"}
                </button>
              </form>
              <div style={{ fontSize: 10, color: "var(--white-3)", marginTop: 12 }}>
                bKash and Nagad are manual payment claims only. Live gateway checkout, automatic callback verification, refunds and recurring subscription billing are not enabled. All claims remain pending until finance staff verify them.
              </div>
            </section>
          )}

          <section className="nlc-card" style={{ marginBottom: 18 }}>
            <div className="sec-lbl gold">Invoices</div>
            {loadingFinance ? <div style={{ color: "var(--text3)", padding: 18 }}>Loading invoices…</div> : (
              <div style={{ overflowX: "auto" }}>
                <table className="nlc-table">
                  <thead><tr><th>Invoice</th><th>Service</th><th>Total</th><th>Paid</th><th>Balance</th><th>Due</th><th>Status</th>{isFinanceStaff && <th>Action</th>}</tr></thead>
                  <tbody>
                    {invoices.length === 0 ? <tr><td colSpan={isFinanceStaff ? 8 : 7} style={{ textAlign: "center", padding: 24, color: "var(--text3)" }}>No invoices recorded for this company.</td></tr> :
                      invoices.map((invoice) => (
                        <tr key={invoice.invoice_id}>
                          <td className="font-mono">{invoice.invoice_number}</td>
                          <td>{invoice.lines?.[0]?.description || "Service invoice"}</td>
                          <td>{money(invoice.total_bdt)}</td>
                          <td>{money(invoice.paid_bdt)}</td>
                          <td style={{ fontWeight: 700 }}>{money(invoice.balance_bdt)}</td>
                          <td>{invoice.due_at || "—"}</td>
                          <td><span className={`badge ${statusTone(invoice.status)}`}>{invoice.status}</span></td>
                          {isFinanceStaff && <td>{invoice.status === "DRAFT" ? <button className="nlc-btn-gold" disabled={busy} onClick={() => void issueInvoice(invoice.invoice_id)}>Issue</button> : "—"}</td>}
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {isFinanceStaff && (
            <section className="nlc-card" style={{ marginBottom: 18 }}>
              <div className="sec-lbl gold">Payment claims · review queue</div>
              <div style={{ overflowX: "auto" }}>
                <table className="nlc-table">
                  <thead><tr><th>Invoice</th><th>Method</th><th>Amount</th><th>Reference</th><th>Paid at</th><th>Status</th><th>Review</th></tr></thead>
                  <tbody>
                    {submissions.length === 0 ? <tr><td colSpan={7} style={{ textAlign: "center", padding: 24, color: "var(--text3)" }}>No payment claims for this company.</td></tr> :
                      submissions.map((submission) => (
                        <tr key={submission.submission_id}>
                          <td className="font-mono">{invoices.find((invoice) => invoice.invoice_id === submission.invoice_id)?.invoice_number || submission.invoice_id.slice(0, 8)}</td>
                          <td>{submission.method}</td>
                          <td>{money(submission.amount_bdt)}</td>
                          <td>{submission.payer_reference || "—"}</td>
                          <td>{dateLabel(submission.paid_at)}</td>
                          <td><span className={`badge ${statusTone(submission.status)}`}>{submission.status}</span></td>
                          <td>
                            {submission.status === "PENDING_REVIEW" ? (
                              <div style={{ minWidth: 220, display: "grid", gap: 6 }}>
                                {submission.method === "CHEQUE" && (
                                  <input
                                    className="nlc-input"
                                    type="datetime-local"
                                    aria-label="Cheque clearance date and time"
                                    value={chequeClearance[submission.submission_id] || ""}
                                    onChange={(event) => setChequeClearance((old) => ({ ...old, [submission.submission_id]: event.target.value }))}
                                  />
                                )}
                                <input
                                  className="nlc-input"
                                  placeholder="Review note (optional)"
                                  value={reviewNotes[submission.submission_id] || ""}
                                  onChange={(event) => setReviewNotes((old) => ({ ...old, [submission.submission_id]: event.target.value }))}
                                />
                                <div style={{ display: "flex", gap: 6 }}>
                                  <button className="nlc-btn-gold" disabled={busy || (submission.method === "CHEQUE" && !chequeClearance[submission.submission_id])} onClick={() => void approveSubmission(submission)}>Approve</button>
                                  <button disabled={busy} onClick={() => void rejectSubmission(submission)} style={{ border: "1px solid rgba(220,80,80,.4)", color: "#FCA5A5", background: "transparent", borderRadius: 6, padding: "7px 10px", cursor: "pointer" }}>Reject</button>
                                </div>
                              </div>
                            ) : "—"}
                          </td>
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              </div>
            </section>
          )}

          <section className="nlc-card">
            <div className="sec-lbl gold">Verified payment ledger</div>
            <div style={{ overflowX: "auto" }}>
              <table className="nlc-table">
                <thead><tr><th>Payment</th><th>Method</th><th>Channel</th><th>Amount</th><th>Received</th><th>Verified</th><th>Status</th></tr></thead>
                <tbody>
                  {payments.length === 0 ? <tr><td colSpan={7} style={{ textAlign: "center", padding: 24, color: "var(--text3)" }}>No verified payments recorded.</td></tr> :
                    payments.map((payment) => (
                      <tr key={payment.payment_id}>
                        <td className="font-mono">{payment.payment_number}</td>
                        <td>{payment.method}</td>
                        <td>{payment.channel}</td>
                        <td>{money(payment.amount_bdt)}</td>
                        <td>{dateLabel(payment.received_at)}</td>
                        <td>{dateLabel(payment.verified_at)}</td>
                        <td><span className={`badge ${statusTone(payment.status)}`}>{payment.status}</span></td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  )
}
}
