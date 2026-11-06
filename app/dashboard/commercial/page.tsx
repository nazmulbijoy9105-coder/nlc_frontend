"use client"

import { useEffect, useState } from "react"
import { commercialApi } from "@/lib/api"
import { getUser } from "@/lib/auth"

const tierLabels: Record<string, string> = {
  COMPLIANCE_PACKAGE: "Compliance package",
  STRUCTURED_REGULARIZATION: "Structured regularization",
  CORPORATE_RESCUE: "Corporate rescue",
}

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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    setUser(getUser())
    let active = true
    Promise.all([commercialApi.pipeline(), commercialApi.funnel()])
      .then(([pipelineData, funnelData]) => {
        if (!active) return
        setPipeline(pipelineData)
        setFunnel(funnelData)
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : "Revenue data could not be loaded.")
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [])

  if (!user || loading) {
    return <div style={{ padding: 32, color: "var(--white-3)" }}>Loading commercial intelligence…</div>
  }

  if (!["ADMIN_STAFF", "SUPER_ADMIN"].includes(user.role || "")) {
    return <div style={{ padding: 48, textAlign: "center", color: "#FCA5A5" }}>Access denied — revenue intelligence is restricted to authorised finance staff.</div>
  }

  const byTier = pipeline?.by_tier || {}
  const stages = funnel?.stages || {}
  const hasPipeline = Object.values(byTier).some((tier: any) => Object.values(tier?.stages || {}).some((stage: any) => Number(stage?.count || 0) > 0))

  return (
    <div style={{ padding: 24, maxWidth: 1440, margin: "0 auto" }}>
      <div style={{ marginBottom: 22 }}>
        <div className="font-garamond" style={{ fontSize: 25, color: "var(--nlc-white)" }}>Commercial Pipeline</div>
        <div style={{ fontSize: 12, color: "var(--white-3)", marginTop: 5 }}>Live engagement value, confirmed work and collected revenue from the commercial records.</div>
      </div>

      {error && <div role="alert" style={{ padding: 12, borderRadius: 8, background: "rgba(185,28,28,.12)", color: "#FCA5A5", marginBottom: 16 }}>{error}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 12, marginBottom: 18 }}>
        {[
          ["Estimated pipeline", money(pipeline?.grand_total_estimated_bdt), "Active engagement estimates"],
          ["Confirmed value", money(pipeline?.grand_total_confirmed_bdt), "Confirmed engagement value"],
          ["Collected", money(pipeline?.grand_total_collected_bdt), "Recorded collections in pipeline view"],
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
                <div style={{ fontSize: 10, color: "var(--text3)", letterSpacing: ".08em", textTransform: "uppercase" }}>{tierLabels[tier] || tier.replaceAll("_", " ")}</div>
                <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 12 }}><span>Estimated</span><strong>{money(data.total_estimated)}</strong></div>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 12 }}><span>Confirmed</span><strong>{money(data.total_confirmed)}</strong></div>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 12 }}><span>Collected</span><strong>{money(data.total_collected)}</strong></div>
                </div>
                <div style={{ borderTop: "1px solid var(--border)", marginTop: 12, paddingTop: 10 }}>
                  {Object.entries(data.stages || {}).map(([stage, value]: [string, any]) => (
                    <div key={stage} style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 10, color: "var(--text3)", marginTop: 5 }}>
                      <span>{stage.replaceAll("_", " ")}</span>
                      <span>{Number(value.count || 0)} · {money(value.collected_bdt)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="nlc-card">
        <div className="sec-lbl gold">Engagement conversion funnel</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12, marginBottom: 14 }}>
          {Object.entries(stages).map(([stage, data]: [string, any]) => (
            <div key={stage} style={{ background: "var(--surface)", borderRadius: 8, padding: 14 }}>
              <div style={{ fontSize: 10, color: "var(--text3)", textTransform: "uppercase" }}>{stage.replaceAll("_", " ")}</div>
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

      <div style={{ fontSize: 10, color: "var(--white-3)", marginTop: 14 }}>
        Values are sourced from recorded commercial engagements and the backend revenue view. They are not forecasts or guarantees of future collections.
      </div>
    </div>
  )
}
