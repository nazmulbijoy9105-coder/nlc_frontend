"use client"
import { useEffect, useState } from "react"
import { filingsApi } from "@/lib/api"
import Topbar from "@/components/Topbar"

type FilingRow = {
  id: string
  type: "AGM" | "AUDIT" | "RETURN"
  company_id: string
  financial_year: number
  due_date: string | null
  filed_date: string | null
  status: string
  detail: string
}

function deriveStatus(f: any, type: string): string {
  if (type === "AGM") {
    if (f.is_default) return "OVERDUE"
    if (f.filed_date) return "FILED"
    if (f.held_date) return "HELD"
    const due = f.agm_due_date
    if (due && new Date(due) < new Date()) return "OVERDUE"
    return "PENDING"
  }
  if (type === "AUDIT") {
    if (f.is_complete) return "FILED"
    return "PENDING"
  }
  if (type === "RETURN") {
    if (f.is_filed) return "FILED"
    if (f.is_default) return "OVERDUE"
    return "PENDING"
  }
  return "PENDING"
}

function statusColor(s: string) {
  if (s === "FILED") return "#10b981"
  if (s === "OVERDUE") return "#ef4444"
  if (s === "HELD") return "#3b82f6"
  return "#6b7280"
}

export default function FilingsPage() {
  const [rows, setRows] = useState<FilingRow[]>([])
  const [filter, setFilter] = useState("ALL")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    filingsApi.list()
      .then((r: any) => {
        const out: FilingRow[] = []
        ;(r?.agms || []).forEach((f: any) => out.push({
          id: f.agm_id || f.id, type: "AGM", company_id: f.company_id,
          financial_year: f.financial_year,
          due_date: f.agm_due_date || null,
          filed_date: f.filed_date || f.held_date || null,
          status: deriveStatus(f, "AGM"),
          detail: "Schedule X + Balance Sheet"
        }))
        ;(r?.audits || []).forEach((f: any) => out.push({
          id: f.audit_id || f.id, type: "AUDIT", company_id: f.company_id,
          financial_year: f.financial_year,
          due_date: null,
          filed_date: f.signed_date || null,
          status: deriveStatus(f, "AUDIT"),
          detail: f.auditor_firm || "Statutory Audit"
        }))
        ;(r?.annual_returns || []).forEach((f: any) => out.push({
          id: f.return_id || f.id, type: "RETURN", company_id: f.company_id,
          financial_year: f.financial_year,
          due_date: null,
          filed_date: f.filed_date || null,
          status: deriveStatus(f, "RETURN"),
          detail: f.rjsc_acknowledgment_number ? "ACK: " + f.rjsc_acknowledgment_number : "Annual Return"
        }))
        out.sort((a, b) => b.financial_year - a.financial_year)
        setRows(out)
      })
      .catch((e: any) => setError(e.message || "Failed to load filings"))
      .finally(() => setLoading(false))
  }, [])

  const counts: Record<string, number> = { ALL: rows.length }
  rows.forEach(r => { counts[r.status] = (counts[r.status] || 0) + 1 })
  const filtered = filter === "ALL" ? rows : rows.filter(r => r.status === filter)

  const typeColors: Record<string, string> = { AGM: "#8b5cf6", AUDIT: "#3b82f6", RETURN: "#f59e0b" }

  return (
    <>
      <Topbar title="Filings" />
      <div style={{ padding: 28 }}>
        {error && <div style={{ color: "#e07070", marginBottom: 16, fontSize: 13 }}>{error}</div>}

        <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
          {["ALL", "FILED", "PENDING", "OVERDUE", "HELD"].map(k => (
            <button key={k} onClick={() => setFilter(k)} style={{
              padding: "7px 16px", fontSize: 11, fontWeight: 600, letterSpacing: ".8px",
              textTransform: "uppercase", cursor: "pointer",
              background: filter === k ? "rgba(201,168,75,0.15)" : "transparent",
              border: "1px solid " + (filter === k ? "var(--gold-line, #c9a84c)" : "var(--navy-border, #1e2d4a)"),
              color: filter === k ? "var(--gold, #c9a84c)" : "var(--white-3, #8899aa)"
            }}>
              {k} ({counts[k] || 0})
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "#6b7280", fontSize: 13 }}>Loading filings...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, color: "#6b7280", fontSize: 13 }}>
            {rows.length === 0 ? "No filings found. Add a company and run evaluation to generate filing records." : "No filings match this filter."}
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--navy-border, #1e2d4a)" }}>
                {["Type", "Company", "FY", "Due Date", "Filed Date", "Status", "Detail"].map(h => (
                  <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontSize: 11, fontWeight: 600,
                    letterSpacing: "1px", textTransform: "uppercase", color: "var(--white-3, #8899aa)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(f => (
                <tr key={f.id} style={{ borderBottom: "1px solid var(--navy-border, #1e2d4a)" }}>
                  <td style={{ padding: "12px" }}>
                    <span style={{ padding: "3px 8px", borderRadius: 4, fontSize: 10, fontWeight: 700,
                      background: typeColors[f.type] + "22", color: typeColors[f.type] }}>
                      {f.type}
                    </span>
                  </td>
                  <td style={{ padding: "12px", fontSize: 11, color: "var(--white-2, #b0bec5)" }}>{f.company_id?.slice(0, 8)}…</td>
                  <td style={{ padding: "12px", fontWeight: 600 }}>FY {f.financial_year}</td>
                  <td style={{ padding: "12px", fontSize: 12, color: f.status === "OVERDUE" ? "#ef4444" : "var(--white-2, #b0bec5)" }}>
                    {f.due_date ? new Date(f.due_date).toLocaleDateString("en-GB") : "—"}
                  </td>
                  <td style={{ padding: "12px", fontSize: 12, color: "#10b981" }}>
                    {f.filed_date ? new Date(f.filed_date).toLocaleDateString("en-GB") : "—"}
                  </td>
                  <td style={{ padding: "12px" }}>
                    <span style={{ padding: "3px 10px", borderRadius: 4, fontSize: 10, fontWeight: 700,
                      background: statusColor(f.status) + "22", color: statusColor(f.status) }}>
                      {f.status}
                    </span>
                  </td>
                  <td style={{ padding: "12px", fontSize: 11, color: "var(--white-3, #8899aa)" }}>{f.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}
