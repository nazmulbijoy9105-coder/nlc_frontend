"use client"

import { useCallback, useEffect, useState, type FormEvent } from "react"
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react"
import { commercialApi, companiesApi } from "@/lib/api"
import { getUser } from "@/lib/auth"

const tierLabels: Record<string, string> = {
  COMPLIANCE_PACKAGE: "Compliance package",
  STRUCTURED_REGULARIZATION: "Structured regularization",
  CORPORATE_RESCUE: "Corporate rescue",
}
const statuses = ["IDENTIFIED", "QUOTED", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]

const money = (value: number | string | null | undefined) =>
  new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(Number(value || 0))

export default function CommercialPage() {
  const [user, setUser] = useState<any>(null)
  const [pipeline, setPipeline] = useState<any>(null)
  const [funnel, setFunnel] = useState<any>(null)
  const [companies, setCompanies] = useState<any[]>([])
  const [companyId, setCompanyId] = useState("")
  const companyIdRef = useRef(companyId)
  const [engagements, setEngagements] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [statusDrafts, setStatusDrafts] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [loadingCompany, setLoadingCompany] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")

  const [engagementType, setEngagementType] = useState("COMPLIANCE_PACKAGE")
  const [revenueTier, setRevenueTier] = useState("COMPLIANCE_PACKAGE")
  const [engagementDescription, setEngagementDescription] = useState("")
  const [estimatedFee, setEstimatedFee] = useState("")
  const [engagementNotes, setEngagementNotes] = useState("")

  const [taskTitle, setTaskTitle] = useState("")
  const [taskDescription, setTaskDescription] = useState("")
  const [taskDueDate, setTaskDueDate] = useState("")
  const [taskPriority, setTaskPriority] = useState("MEDIUM")

  const authorised = ["ADMIN_STAFF", "SUPER_ADMIN"].includes(user?.role || "")

  const refreshPipeline = useCallback(async () => {
    const [pipelineData, funnelData] = await Promise.all([
      commercialApi.pipeline(),
      commercialApi.funnel(),
    ])
    setPipeline(pipelineData)
    setFunnel(funnelData)
  }, [])

  const refreshCompanyWork = useCallback(async (id: string) => {
  const refreshCompanyWork = useCallback(async (id: string, isCurrent: () => boolean = () => companyIdRef.current === id) => {
    if (!id) return
    const [engagementRows, taskRows] = await Promise.all([
      commercialApi.engagements(id),
      commercialApi.tasks(id),
    ])
    if (!isCurrent()) return
    setEngagements(Array.isArray(engagementRows) ? engagementRows : [])
    setTasks(Array.isArray(taskRows) ? taskRows : [])
    setStatusDrafts(
      Object.fromEntries(
        (Array.isArray(engagementRows) ? engagementRows : []).map((item: any) => [
          item.engagement_id,
          item.status,
        ]),
      ),
    )
  }, [])

  useEffect(() => { companyIdRef.current = companyId }, [companyId])

  useEffect(() => { companyIdRef.current = companyId }, [companyId])

  useEffect(() => {
    const currentUser = getUser()
    setUser(currentUser)
    if (!["ADMIN_STAFF", "SUPER_ADMIN"].includes(currentUser?.role || "")) {
      setLoading(false)
      return
    }
    let active = true
    Promise.all([commercialApi.pipeline(), commercialApi.funnel(), companiesApi.list()])
      .then(([pipelineData, funnelData, companyRows]) => {
        if (!active) return
        setPipeline(pipelineData)
        setFunnel(funnelData)
        const rows = Array.isArray(companyRows) ? companyRows : []
        setCompanies(rows)
        if (rows.length) setCompanyId(String(rows[0].id))
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : "Commercial data could not be loaded.")
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!companyId || !authorised) {
      setEngagements([])
      setTasks([])
      return
    }
    let active = true
    setLoadingCompany(true)
    refreshCompanyWork(companyId)
    refreshCompanyWork(companyId, () => active && companyIdRef.current === companyId)
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : "Company work could not be loaded.")
      })
      .finally(() => {
        if (active) setLoadingCompany(false)
      })
    return () => { active = false }
  }, [companyId, authorised, refreshCompanyWork])

  const createEngagement = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!companyId) return
    setBusy(true)
    setError("")
    setNotice("")
    try {
      await commercialApi.createEngagement({
        company_id: companyId,
        engagement_type: engagementType,
        revenue_tier: revenueTier,
        description: engagementDescription.trim(),
        estimated_fee_bdt: estimatedFee ? Number(estimatedFee) : null,
        notes: engagementNotes.trim() || null,
      })
      setEngagementDescription("")
      setEstimatedFee("")
      setEngagementNotes("")
      await Promise.all([refreshCompanyWork(companyId), refreshPipeline()])
      setNotice("Engagement created and added to the commercial pipeline.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Engagement could not be created.")
    } finally {
      setBusy(false)
    }
  }

  const saveEngagementStatus = async (engagementId: string) => {
    setBusy(true)
    setError("")
    setNotice("")
    try {
      await commercialApi.advanceStatus(engagementId, {
        new_status: statusDrafts[engagementId],
        note: "Status updated from commercial workspace",
      })
      await Promise.all([refreshCompanyWork(companyId), refreshPipeline()])
      setNotice("Engagement status updated.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Engagement status could not be updated.")
    } finally {
      setBusy(false)
    }
  }

  const createTask = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!companyId) return
    setBusy(true)
    setError("")
    setNotice("")
    try {
      await commercialApi.createTask({
        company_id: companyId,
        title: taskTitle.trim(),
        description: taskDescription.trim() || null,
        due_date: taskDueDate || null,
        priority: taskPriority,
      })
      setTaskTitle("")
      setTaskDescription("")
      setTaskDueDate("")
      setTaskPriority("MEDIUM")
      await refreshCompanyWork(companyId)
      setNotice("Service-delivery task created.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Task could not be created.")
    } finally {
      setBusy(false)
    }
  }

  const completeTask = async (taskId: string) => {
    setBusy(true)
    setError("")
    setNotice("")
    try {
      await commercialApi.completeTask(taskId, { completion_note: "Completed from commercial workspace" })
      await refreshCompanyWork(companyId)
      setNotice("Task marked complete.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Task could not be completed.")
    } finally {
      setBusy(false)
    }
  }

  if (!user || loading) {
    return <div style={{ padding: 32, color: "var(--white-3)" }}>Loading commercial intelligence…</div>
  }

  if (!authorised) {
    return <div style={{ padding: 48, textAlign: "center", color: "#FCA5A5" }}>Access denied — revenue and commercial operations are restricted to authorised finance staff.</div>
  }

  }

  if (!user || loading) {
    return <div style={{ padding: 32, color: "var(--white-3)" }}>Loading commercial intelligence…</div>
  }

  if (!authorised) {
    return <div style={{ padding: 48, textAlign: "center", color: "#FCA5A5" }}>Access denied — revenue and commercial operations are restricted to authorised finance staff.</div>
  }

  const byTier = pipeline?.by_tier || {}
  const stages = funnel?.stages || {}
  const hasPipeline = Object.values(byTier).some((tier: any) => Object.values(tier?.stages || {}).some((stage: any) => Number(stage?.count || 0) > 0))
  const selectedCompany = companies.find((company) => String(company.id) === companyId)

  return (
    <div style={{ padding: 24, maxWidth: 1440, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16, flexWrap: "wrap", marginBottom: 22 }}>
        <div>
          <div className="font-garamond" style={{ fontSize: 25, color: "var(--nlc-white)" }}>Commercial Pipeline</div>
          <div style={{ fontSize: 12, color: "var(--white-3)", marginTop: 5 }}>Engagement value, confirmed work and verified collections reconciled to the finance ledger.</div>
        </div>
        <label style={{ display: "grid", gap: 6, minWidth: 260, color: "var(--white-3)", fontSize: 11 }}>
          Company for operations
          <select className="nlc-input" value={companyId} onChange={(event) => setCompanyId(event.target.value)}>
            {companies.map((company) => <option key={company.id} value={company.id}>{company.company_name || company.name || company.id}</option>)}
          </select>
        </label>
      </div>

      {error && <div role="alert" style={{ padding: 12, borderRadius: 8, background: "rgba(185,28,28,.12)", color: "#FCA5A5", marginBottom: 16 }}>{error}</div>}
      {notice && <div role="status" style={{ padding: 12, borderRadius: 8, background: "rgba(26,122,82,.14)", color: "#86EFAC", marginBottom: 16 }}>{notice}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 12, marginBottom: 18 }}>
        {[
          ["Estimated pipeline", money(pipeline?.grand_total_estimated_bdt), "Active engagement estimates"],
          ["Confirmed value", money(pipeline?.grand_total_confirmed_bdt), "Confirmed engagement value"],
          ["Invoiced", money(pipeline?.grand_total_invoiced_bdt), "Issued invoices linked to engagements"],
          ["Collected", money(pipeline?.grand_total_collected_bdt), "Verified allocations from settled payments"],
          ["Collection rate", `${Number(pipeline?.collection_rate || 0).toFixed(1)}%`, "Collected ÷ confirmed value"],
        ].map(([label, value, caption]) => (
          <div className="nlc-card" key={label} style={{ padding: 16 }}>
            <div style={{ fontSize: 10, color: "var(--text3)", letterSpacing: ".1em", textTransform: "uppercase" }}>{label}</div>
            <div className="font-garamond" style={{ fontSize: 23, color: "var(--nlc-white)", marginTop: 8 }}>{value}</div>
            <div style={{ fontSize: 10, color: "var(--white-3)", marginTop: 4 }}>{caption}</div>
          </div>
        ))}
      </div>

      <section className="nlc-card" style={{ marginBottom: 18 }}>
        <div className="sec-lbl gold">Revenue by service tier</div>
        {!hasPipeline ? (
          <div style={{ padding: 20, color: "var(--text3)" }}>No active engagement pipeline records are available yet. Figures will appear here when real engagements are entered.</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 12 }}>
            {Object.entries(byTier).map(([tier, data]: [string, any]) => (
              <div key={tier} style={{ border: "1px solid var(--border)", borderRadius: 9, padding: 15 }}>
                <div style={{ fontSize: 10, color: "var(--text3)", letterSpacing: ".08em", textTransform: "uppercase" }}>{tierLabels[tier] || tier.replace(/_/g, " ")}</div>
                <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 12 }}><span>Estimated</span><strong>{money(data.total_estimated)}</strong></div>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 12 }}><span>Confirmed</span><strong>{money(data.total_confirmed)}</strong></div>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 12 }}><span>Invoiced</span><strong>{money(data.total_invoiced)}</strong></div>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 12 }}><span>Collected</span><strong>{money(data.total_collected)}</strong></div>
                </div>
                <div style={{ borderTop: "1px solid var(--border)", marginTop: 12, paddingTop: 10 }}>
                  {Object.entries(data.stages || {}).map(([stage, value]: [string, any]) => (
                    <div key={stage} style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 10, color: "var(--text3)", marginTop: 5 }}>
                      <span>{stage.replace(/_/g, " ")}</span>
                      <span>{Number(value.count || 0)} · {money(value.collected_bdt)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="nlc-card" style={{ marginBottom: 18 }}>
        <div className="sec-lbl gold">Engagement conversion funnel</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12, marginBottom: 14 }}>
          {Object.entries(stages).map(([stage, data]: [string, any]) => (
            <div key={stage} style={{ background: "var(--surface)", borderRadius: 8, padding: 14 }}>
              <div style={{ fontSize: 10, color: "var(--text3)", textTransform: "uppercase" }}>{stage.replace(/_/g, " ")}</div>
              <div className="font-garamond" style={{ fontSize: 24, color: "var(--nlc-white)", marginTop: 6 }}>{Number(data.count || 0)}</div>
              <div style={{ fontSize: 11, color: "var(--white-3)" }}>{money(data.value)} estimated</div>
            </div>
          ))}
          {!Object.keys(stages).length && <div style={{ color: "var(--text3)", fontSize: 12 }}>No funnel activity has been recorded.</div>}
        </div>
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap", fontSize: 11, color: "var(--white-3)" }}>
          <span>Identified → Confirmed: <strong style={{ color: "var(--nlc-white)" }}>{Number(funnel?.conversion_identified_to_confirmed || 0).toFixed(1)}%</strong></span>
          <span>Confirmed → Completed: <strong style={{ color: "var(--nlc-white)" }}>{Number(funnel?.conversion_confirmed_to_completed || 0).toFixed(1)}%</strong></span>
        </div>
      </section>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 16, marginBottom: 18 }}>
        <section className="nlc-card">
          <div className="sec-lbl gold">Create engagement · {selectedCompany?.company_name || selectedCompany?.name || "Select company"}</div>
          <form onSubmit={createEngagement} style={{ display: "grid", gap: 10 }}>
            <label style={{ display: "grid", gap: 5, fontSize: 11, color: "var(--text3)" }}>
              Engagement type
              <select className="nlc-input" value={engagementType} onChange={(event) => setEngagementType(event.target.value)}>
                <option value="COMPLIANCE_PACKAGE">Compliance package</option>
                <option value="STRUCTURED_REGULARIZATION">Structured regularization</option>
                <option value="CORPORATE_RESCUE">Corporate rescue</option>
              </select>
            </label>
            <label style={{ display: "grid", gap: 5, fontSize: 11, color: "var(--text3)" }}>
              Revenue tier
              <select className="nlc-input" value={revenueTier} onChange={(event) => setRevenueTier(event.target.value)}>
                <option value="COMPLIANCE_PACKAGE">Compliance package</option>
                <option value="STRUCTURED_REGULARIZATION">Structured regularization</option>
                <option value="CORPORATE_RESCUE">Corporate rescue</option>
              </select>
            </label>
            <label style={{ display: "grid", gap: 5, fontSize: 11, color: "var(--text3)" }}>
              Engagement description
              <input className="nlc-input" value={engagementDescription} onChange={(event) => setEngagementDescription(event.target.value)} minLength={3} maxLength={500} required />
            </label>
            <label style={{ display: "grid", gap: 5, fontSize: 11, color: "var(--text3)" }}>
              Estimated fee (BDT)
              <input className="nlc-input" type="number" min="0.01" step="0.01" value={estimatedFee} onChange={(event) => setEstimatedFee(event.target.value)} />
            </label>
            <label style={{ display: "grid", gap: 5, fontSize: 11, color: "var(--text3)" }}>
              Internal notes
              <textarea className="nlc-input" value={engagementNotes} onChange={(event) => setEngagementNotes(event.target.value)} rows={2} maxLength={3000} />
            </label>
            <button className="nlc-btn-gold" type="submit" disabled={busy || !companyId}>{busy ? "Saving…" : "Create engagement"}</button>
          </form>
        </section>

        <section className="nlc-card">
          <div className="sec-lbl gold">Create service task</div>
          <form onSubmit={createTask} style={{ display: "grid", gap: 10 }}>
            <label style={{ display: "grid", gap: 5, fontSize: 11, color: "var(--text3)" }}>
              Task title
              <input className="nlc-input" value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} minLength={3} maxLength={255} required />
            </label>
            <label style={{ display: "grid", gap: 5, fontSize: 11, color: "var(--text3)" }}>
              Description
              <textarea className="nlc-input" value={taskDescription} onChange={(event) => setTaskDescription(event.target.value)} rows={2} />
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <label style={{ display: "grid", gap: 5, fontSize: 11, color: "var(--text3)" }}>
                Due date
                <input className="nlc-input" type="date" value={taskDueDate} onChange={(event) => setTaskDueDate(event.target.value)} />
              </label>
              <label style={{ display: "grid", gap: 5, fontSize: 11, color: "var(--text3)" }}>
                Priority
                <select className="nlc-input" value={taskPriority} onChange={(event) => setTaskPriority(event.target.value)}>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </label>
            </div>
            <button className="nlc-btn-gold" type="submit" disabled={busy || !companyId}>{busy ? "Saving…" : "Create task"}</button>
          </form>
        </section>
      </div>

      <section className="nlc-card" style={{ marginBottom: 18 }}>
        <div className="sec-lbl gold">Company engagements</div>
        {loadingCompany ? <div style={{ color: "var(--text3)", padding: 16 }}>Loading engagements…</div> : (
          <div style={{ overflowX: "auto" }}>
            <table className="nlc-table">
              <thead><tr><th>Engagement</th><th>Type</th><th>Tier</th><th>Estimate</th><th>Confirmed</th><th>Status</th><th>Update</th></tr></thead>
              <tbody>
                {engagements.length === 0 ? <tr><td colSpan={7} style={{ textAlign: "center", padding: 22, color: "var(--text3)" }}>No engagements for this company yet.</td></tr> :
                  engagements.map((item) => (
                    <tr key={item.engagement_id}>
                      <td>{item.description || item.engagement_id}</td>
                      <td>{item.engagement_type}</td>
                      <td>{tierLabels[item.revenue_tier] || item.revenue_tier}</td>
                      <td>{money(item.estimated_fee_bdt)}</td>
                      <td>{money(item.confirmed_fee_bdt)}</td>
                      <td>{item.status}</td>
                      <td>
                        <div style={{ display: "flex", gap: 6, minWidth: 190 }}>
                          <select className="nlc-input" value={statusDrafts[item.engagement_id] || item.status} onChange={(event) => setStatusDrafts((old) => ({ ...old, [item.engagement_id]: event.target.value }))}>
                            {statuses.map((status) => <option key={status} value={status}>{status.replace(/_/g, " ")}</option>)}
                          </select>
                          <button className="nlc-btn-gold" disabled={busy || (statusDrafts[item.engagement_id] || item.status) === item.status} onClick={() => void saveEngagementStatus(item.engagement_id)}>Save</button>
                        </div>
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="nlc-card">
        <div className="sec-lbl gold">Service delivery tasks</div>
        <div style={{ overflowX: "auto" }}>
          <table className="nlc-table">
            <thead><tr><th>Task</th><th>Priority</th><th>Due</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {tasks.length === 0 ? <tr><td colSpan={5} style={{ textAlign: "center", padding: 22, color: "var(--text3)" }}>No service tasks recorded for this company.</td></tr> :
                tasks.map((task) => (
                  <tr key={task.task_id}>
                    <td><strong>{task.title}</strong>{task.description && <div style={{ color: "var(--text3)", fontSize: 10, marginTop: 4 }}>{task.description}</div>}</td>
                    <td>{task.priority}</td>
                    <td>{task.due_date || "—"}</td>
                    <td>{task.status}</td>
                    <td>{task.status !== "COMPLETED" ? <button className="nlc-btn-gold" disabled={busy} onClick={() => void completeTask(task.task_id)}>Complete</button> : "—"}</td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </section>

      <div style={{ fontSize: 10, color: "var(--white-3)", marginTop: 14 }}>
        Estimated and quoted values come from commercial engagements. Invoiced values and collections are derived from issued invoices and settled payment allocations. These figures are not forecasts or guarantees of future collections.
      </div>
    </div>
  )
}
