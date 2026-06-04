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
  version: string
}

const FALLBACK_RULES: Rule[] = [
  { rule_id: "INC-001", rule_name: "Certificate of Incorporation", rule_type: "INCORPORATION", statutory_basis: "CA 1994 s 9", description: "", default_severity: "CRITICAL", score_impact: 10, revenue_tier: "ALL", is_black_override: false, is_active: true, version: "2.0" },
  { rule_id: "INC-002", rule_name: "Memorandum & Articles Filed", rule_type: "INCORPORATION", statutory_basis: "CA 1994 s 11", description: "", default_severity: "MAJOR", score_impact: 8, revenue_tier: "ALL", is_black_override: false, is_active: true, version: "2.0" },
  { rule_id: "AGM-001", rule_name: "AGM Held Within 15 Months", rule_type: "AGM", statutory_basis: "CA 1994 s 81", description: "", default_severity: "CRITICAL", score_impact: 10, revenue_tier: "ALL", is_black_override: false, is_active: true, version: "2.0" },
  { rule_id: "AGM-002", rule_name: "AGM Quorum Met", rule_type: "AGM", statutory_basis: "CA 1994 s 83", description: "", default_severity: "MINOR", score_impact: 5, revenue_tier: "ALL", is_black_override: false, is_active: true, version: "2.0" },
  { rule_id: "AGM-003", rule_name: "AGM Notice Period 21 Days", rule_type: "AGM", statutory_basis: "CA 1994 s 85", description: "", default_severity: "MAJOR", score_impact: 8, revenue_tier: "ALL", is_black_override: false, is_active: true, version: "2.0" },
  { rule_id: "AR-001", rule_name: "Annual Return Filed On Time", rule_type: "ANNUAL_RETURN", statutory_basis: "CA 1994 s 119", description: "", default_severity: "CRITICAL", score_impact: 12, revenue_tier: "ALL", is_black_override: false, is_active: true, version: "2.0" },
  { rule_id: "AR-002", rule_name: "Annual Return Contents Complete", rule_type: "ANNUAL_RETURN", statutory_basis: "CA 1994 s 120", description: "", default_severity: "MINOR", score_impact: 6, revenue_tier: "ALL", is_black_override: false, is_active: true, version: "2.0" },
  { rule_id: "DIR-001", rule_name: "Minimum 2 Directors", rule_type: "DIRECTORS", statutory_basis: "CA 1994 s 90", description: "", default_severity: "CRITICAL", score_impact: 10, revenue_tier: "ALL", is_black_override: false, is_active: true, version: "2.0" },
  { rule_id: "DIR-002", rule_name: "Director Consent Filed (Form XII)", rule_type: "DIRECTORS", statutory_basis: "CA 1994 s 92", description: "", default_severity: "MINOR", score_impact: 6, revenue_tier: "ALL", is_black_override: false, is_active: true, version: "2.0" },
  { rule_id: "CAP-001", rule_name: "Paid-Up Capital >= Authorised Minimum", rule_type: "CAPITAL", statutory_basis: "CA 1994 s 150", description: "", default_severity: "MAJOR", score_impact: 8, revenue_tier: "ALL", is_black_override: false, is_active: true, version: "2.0" },
  { rule_id: "CAP-002", rule_name: "Capital Bank Certificate Uploaded", rule_type: "CAPITAL", statutory_basis: "CA 1994 s 155", description: "", default_severity: "MINOR", score_impact: 5, revenue_tier: "ALL", is_black_override: false, is_active: true, version: "2.0" },
  { rule_id: "OFF-001", rule_name: "Registered Office Address Notified", rule_type: "REGISTERED_OFFICE", statutory_basis: "CA 1994 s 77", description: "", default_severity: "MINOR", score_impact: 6, revenue_tier: "ALL", is_black_override: false, is_active: true, version: "2.0" },
]

const SEVERITY_COLOR: Record<string, string> = { CRITICAL: "#e07070", MAJOR: "#e0b84a", MINOR: "#5dd4a0" }

export default function RulesPage() {
  const [rules, setRules] = useState<Rule[]>(FALLBACK_RULES)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    rulesApi.list().then((data: any) => {
      if (Array.isArray(data) && data.length > 0) setRules(data)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const activeRules = rules.filter(r => r.is_active !== false)
  const modules = Array.from(new Set(activeRules.map(r => r.rule_type)))
  const totalScore = activeRules.reduce((s, r) => s + (r.score_impact || 0), 0)

  return (
    <>
      <Topbar title="Rules Engine" />
      <div style={{ padding: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <div style={{ fontSize: 12, color: "var(--white-2)" }}>
            ILRMF v1.0 - {activeRules.length} deterministic rules across {modules.length} compliance modules.
          </div>
          <div style={{ flex: 1 }} />
          <span className="badge-pill badge-green" style={{ padding: "4px 10px", fontSize: 10, fontWeight: 600, letterSpacing: ".8px", textTransform: "uppercase" }}>
            {activeRules.length} Rules Active
          </span>
          <span style={{ fontSize: 11, color: "var(--white-3)" }}>
            Max Score: <b style={{ color: "var(--gold)" }}>{totalScore}</b>
          </span>
        </div>

        {loading && <div style={{ color: "var(--white-3)", padding: 20 }}>Loading rules...</div>}

        {!loading && modules.map(mod => {
          const modRules = activeRules.filter(r => r.rule_type === mod)
          const modScore = modRules.reduce((s, r) => s + (r.score_impact || 0), 0)
          return (
            <div key={mod} style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--gold)" }}>
                  {mod.replace(/_/g, " ")}
                </div>
                <div style={{ fontSize: 10, color: "var(--white-3)" }}>{modRules.length} rules</div>
                <div style={{ fontSize: 10, color: "var(--white-3)" }}>Max: {modScore} pts</div>
              </div>
              <div className="nlc-card">
                {modRules.map((r, i, arr) => (
                  <div key={r.rule_id} style={{ display: "flex", alignItems: "center", gap: 16, padding: "12px 16px", borderBottom: i < arr.length - 1 ? "1px solid rgba(42,63,107,.4)" : "none" }}>
                    <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1, color: "var(--gold)", minWidth: 70 }}>{r.rule_id}</span>
                    <span style={{ fontSize: 13, flex: 1 }}>{r.rule_name}</span>
                    <span style={{ fontSize: 11, color: "var(--white-3)", minWidth: 120 }}>{r.statutory_basis}</span>
                    {r.is_black_override && <span style={{ fontSize: 9, fontWeight: 600, color: "#e07070", letterSpacing: 1, textTransform: "uppercase", border: "1px solid rgba(224,112,112,.3)", padding: "2px 6px", borderRadius: 3 }}>BLACK</span>}
                    <span style={{ fontSize: 11, color: SEVERITY_COLOR[r.default_severity] || "#5dd4a0", minWidth: 60, textAlign: "right" }}>+{r.score_impact} pts</span>
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
