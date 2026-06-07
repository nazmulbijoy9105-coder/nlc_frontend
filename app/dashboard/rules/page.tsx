"use client"
import { useEffect, useState } from "react"
import { rulesApi } from "@/lib/api"
import Topbar from "@/components/Topbar"

interface Rule {
  rule_id: string
  rule_name: string
  rule_type: string
  statutory_basis: string
  description: string
  default_severity: string
  score_impact: number
  revenue_tier: string
  is_black_override: boolean
  is_active: boolean
  rule_version?: string
}

const SEVERITY_COLOR: Record<string, string> = {
  BLACK: "#e07070",
  RED: "#e07070",
  YELLOW: "#e0b84a",
  GREEN: "#5dd4a0",
}

const MODULE_LABEL: Record<string, string> = {
  DEADLINE: "Deadline",
  THRESHOLD: "Threshold",
  DEPENDENCY: "Dependency",
  CONDITIONAL: "Conditional",
  ESCALATION: "Escalation",
  CASCADE: "Cascade",
}

export default function RulesPage() {
  const [rules, setRules] = useState<Rule[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    rulesApi.list().then((data: any) => {
      if (Array.isArray(data) && data.length > 0) setRules(data)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const activeRules = rules.filter(r => r.is_active !== false)
  const moduleGroups = Array.from(new Set(activeRules.map(r => r.rule_type)))
  const totalScore = activeRules.reduce((s, r) => s + (r.score_impact || 0), 0)
  const blackCount = activeRules.filter(r => r.is_black_override).length

  return (
    <>
      <Topbar title="Rules Engine" />
      <div style={{ padding: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
          <div style={{ fontSize: 12, color: "var(--white-2)" }}>
            ILRMF v2.0 — {activeRules.length} actionable rules across {moduleGroups.length} compliance modules.
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <span className="badge-green" style={{ padding: "4px 10px", fontSize: 10, fontWeight: 600, letterSpacing: ".8px", textTransform: "uppercase" }}>
            {activeRules.length} Rules Active
          </span>
          {blackCount > 0 && (
            <span style={{ fontSize: 10, fontWeight: 600, color: "#e07070", letterSpacing: 1, textTransform: "uppercase", border: "1px solid rgba(224,112,112,.3)", padding: "3px 8px", borderRadius: 3 }}>
              {blackCount} Black Override{blackCount > 1 ? "s" : ""}
            </span>
          )}
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: 11, color: "var(--white-3)" }}>
            Max Score: <b style={{ color: "var(--gold)" }}>{totalScore}</b>
          </span>
        </div>

        {loading && <div style={{ color: "var(--white-3)", padding: 20 }}>Loading rules from engine...</div>}

        {!loading && activeRules.length === 0 && (
          <div style={{ color: "var(--white-3)", padding: 20 }}>No rules loaded. Check backend connection.</div>
        )}

        {!loading && moduleGroups.map(mod => {
          const modRules = activeRules.filter(r => r.rule_type === mod)
          const modScore = modRules.reduce((s, r) => s + (r.score_impact || 0), 0)
          return (
            <div key={mod} style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--gold)" }}>
                  {MODULE_LABEL[mod] || mod.replace(/_/g, " ")}
                </div>
                <div style={{ fontSize: 10, color: "var(--white-3)" }}>{modRules.length} rule{modRules.length > 1 ? "s" : ""}</div>
                <div style={{ fontSize: 10, color: "var(--white-3)" }}>Max: {modScore} pts</div>
              </div>
              <div className="nlc-card">
                {modRules.map((r, i, arr) => (
                  <div key={r.rule_id} style={{ display: "flex", alignItems: "center", gap: 16, padding: "12px 16px", borderBottom: i < arr.length - 1 ? "1px solid rgba(42,63,107,.4)" : "none" }}>
                    <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1, color: "var(--gold)", minWidth: 70 }}>{r.rule_id}</span>
                    <span style={{ fontSize: 13, flex: 1 }}>{r.rule_name}</span>
                    <span style={{ fontSize: 11, color: "var(--white-3)", minWidth: 140 }}>{r.statutory_basis}</span>
                    {r.is_black_override && (
                      <span style={{ fontSize: 9, fontWeight: 600, color: "#e07070", letterSpacing: 1, textTransform: "uppercase", border: "1px solid rgba(224,112,112,.3)", padding: "2px 6px", borderRadius: 3, whiteSpace: "nowrap" }}>BLACK</span>
                    )}
                    <span className={"badge-" + (r.default_severity?.toLowerCase() || "neutral")} style={{ padding: "2px 8px", fontSize: 9, fontWeight: 600, letterSpacing: ".5px", textTransform: "uppercase", minWidth: 50, textAlign: "center", borderRadius: 3 }}>
                      {r.default_severity}
                    </span>
                    <span style={{ fontSize: 11, color: SEVERITY_COLOR[r.default_severity] || "var(--white-2)", minWidth: 60, textAlign: "right" }}>+{r.score_impact} pts</span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}