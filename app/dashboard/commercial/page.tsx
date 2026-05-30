"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { commercialApi } from "@/lib/api"
import Topbar from "@/components/Topbar"

const TIERS = [
  { key: "COMPLIANCE_PACKAGE", label: "Compliance Package", color: "#10b981" },
  { key: "STRUCTURED_REGULARIZATION", label: "Structured Regularization", color: "#f59e0b" },
  { key: "CORPORATE_RESCUE", label: "Corporate Rescue", color: "#ef4444" },
]

const STAGES = ["IDENTIFIED", "QUOTED", "CONFIRMED", "IN_PROGRESS", "COMPLETED"]

const STAGE_COLORS: Record<string, string> = {
  IDENTIFIED: "#6b7280",
  QUOTED: "#3b82f6",
  CONFIRMED: "#8b5cf6",
  IN_PROGRESS: "#f59e0b",
  COMPLETED: "#10b981",
}

function fmt(n: number) {
  if (!n) return "0"
  if (n >= 10000000) return "BDT " + (n / 10000000).toFixed(1) + " Cr"
  if (n >= 100000) return "BDT " + (n / 100000).toFixed(1) + " L"
  return "BDT " + n.toLocaleString()
}

export default function CommercialPage() {
  const router = useRouter()
  const [pipeline, setPipeline] = useState<any>(null)
  const [funnel, setFunnel] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState<"pipeline" | "funnel">("pipeline")

  useEffect(() => {
    Promise.all([
      commercialApi.pipeline().catch(() => null),
      commercialApi.funnel().catch(() => null),
    ]).then(([p, f]) => {
      setPipeline(p)
      setFunnel(f)
    }).catch(err => setError(err.message))
    .finally(() => setLoading(false))
  }, [])

  const totalEstimated = pipeline ? TIERS.reduce((sum, t) => sum + (pipeline[t.key]?.total_estimated || 0), 0) : 0
  const totalConfirmed = pipeline ? TIERS.reduce((sum, t) => sum + (pipeline[t.key]?.total_confirmed || 0), 0) : 0
  const totalCollected = pipeline ? TIERS.reduce((sum, t) => sum + (pipeline[t.key]?.total_collected || 0), 0) : 0

  return (
    <>
      <Topbar title="Commercial Pipeline" />
      <div style={{ padding: 28 }}>

        {error && <div style={{ color: "#e07070", marginBottom: 16, fontSize: 13 }}>{error}</div>}
        {loading && <div style={{ color: "#6b7280", padding: 20 }}>Loading...</div>}

        {!loading && (
          <>
            {/* KPI Row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 16, marginBottom: 28 }}>
              {[
                { label: "Total Pipeline", value: fmt(totalEstimated), sub: "Estimated" },
                { label: "Confirmed Revenue", value: fmt(totalConfirmed), sub: "Signed engagements" },
                { label: "Collected", value: fmt(totalCollected), sub: "Cash received" },
                { label: "Collection Rate", value: totalConfirmed > 0 ? Math.round((totalCollected / totalConfirmed) * 100) + "%" : "—", sub: "Collected / Confirmed" },
              ].map(kpi => (
                <div key={kpi.label} className="nlc-card" style={{ padding: "18px 20px" }}>
                  <div style={{ fontSize: 11, color: "var(--white-2)", letterSpacing: "1px", textTransform: "uppercase", marginBottom: 6 }}>{kpi.label}</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: "var(--gold)" }}>{kpi.value}</div>
                  <div style={{ fontSize: 11, color: "var(--white-3)", marginTop: 4 }}>{kpi.sub}</div>
                </div>
              ))}
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              {(["pipeline", "funnel"] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  style={{ padding: "7px 18px", borderRadius: 4, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600,
                    background: activeTab === tab ? "var(--gold)" : "var(--navy-card)",
                    color: activeTab === tab ? "#0a1628" : "var(--white-2)" }}>
                  {tab === "pipeline" ? "Revenue Pipeline" : "Conversion Funnel"}
                </button>
              ))}
            </div>

            {activeTab === "pipeline" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {TIERS.map(tier => {
                  const tierData = pipeline?.[tier.key] || { stages: {}, total_estimated: 0, total_confirmed: 0, total_collected: 0 }
                  return (
                    <div key={tier.key} className="nlc-card" style={{ padding: 20 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 10, height: 10, borderRadius: "50%", background: tier.color }} />
                          <span style={{ fontWeight: 600, fontSize: 14 }}>{tier.label}</span>
                        </div>
                        <div style={{ display: "flex", gap: 20, fontSize: 12, color: "var(--white-2)" }}>
                          <span>Est: <b style={{ color: "var(--white-1)" }}>{fmt(tierData.total_estimated)}</b></span>
                          <span>Confirmed: <b style={{ color: "#10b981" }}>{fmt(tierData.total_confirmed)}</b></span>
                          <span>Collected: <b style={{ color: "var(--gold)" }}>{fmt(tierData.total_collected)}</b></span>
                        </div>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 }}>
                        {STAGES.map(stage => {
                          const stageData = tierData.stages?.[stage] || { count: 0, estimated_bdt: 0, confirmed_bdt: 0 }
                          return (
                            <div key={stage} style={{ background: "var(--navy-bg)", borderRadius: 6, padding: "12px 14px",
                              borderTop: "3px solid " + (STAGE_COLORS[stage] || "#6b7280") }}>
                              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "1px", color: STAGE_COLORS[stage], marginBottom: 8 }}>{stage}</div>
                              <div style={{ fontSize: 22, fontWeight: 700 }}>{stageData.count || 0}</div>
                              <div style={{ fontSize: 11, color: "var(--white-3)", marginTop: 4 }}>
                                {stageData.confirmed_bdt > 0 ? fmt(stageData.confirmed_bdt) : stageData.estimated_bdt > 0 ? fmt(stageData.estimated_bdt) : "—"}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {activeTab === "funnel" && (
              <div className="nlc-card" style={{ padding: 28 }}>
                {funnel ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {Object.entries(funnel).map(([stage, data]: [string, any]) => {
                      const total = funnel[Object.keys(funnel)[0]]?.count || 1
                      const pct = Math.round(((data?.count || 0) / total) * 100)
                      return (
                        <div key={stage}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
                            <span style={{ fontWeight: 500 }}>{stage}</span>
                            <span style={{ color: "var(--white-2)" }}>{data?.count || 0} engagements · {fmt(data?.total_bdt || 0)}</span>
                          </div>
                          <div style={{ height: 8, background: "var(--navy-bg)", borderRadius: 4, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: pct + "%", background: "var(--gold)", borderRadius: 4, transition: "width 0.3s" }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div style={{ color: "var(--white-3)", textAlign: "center", padding: 40 }}>
                    No funnel data available.
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}