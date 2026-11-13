"use client";

import { ScoreBreakdown } from "@/types";
import { Shield } from "lucide-react";

interface ScoreBreakdownCardProps {
  breakdown: ScoreBreakdown | null;
}

function bandColor(band: string | undefined): string {
  switch ((band || "").toUpperCase()) {
    case "GREEN":
      return "#10b981";
    case "YELLOW":
      return "#f59e0b";
    case "RED":
      return "#ef4444";
    case "BLACK":
      return "#111827";
    default:
      return "#6b7280";
  }
}

export default function ScoreBreakdownCard({ breakdown }: ScoreBreakdownCardProps) {
  const withheld =
    !breakdown ||
    breakdown.risk_band === "NOT_EVALUATED" ||
    breakdown.final_score == null;

  if (withheld) {
    return (
      <div
        style={{
          padding: "24px",
          borderRadius: "16px",
          background:
            "linear-gradient(135deg, rgba(30, 58, 95, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(200, 168, 75, 0.1)",
          textAlign: "center",
          color: "#9ca3af",
          fontSize: "14px",
        }}
      >
        <Shield size={32} style={{ margin: "0 auto 12px", opacity: 0.3 }} />
        Score not published for this company. Missing evidence stays UNKNOWN and
        does not count as a violation. High scores with low input coverage mean
        incomplete data, not full compliance.
      </div>
    );
  }

  const deductions = breakdown.category_deductions || {};
  const deductionEntries = Object.entries(deductions).sort((a, b) => b[1] - a[1]);
  const totalDeduction =
    breakdown.total_applied_category_deduction ??
    deductionEntries.reduce((sum, [, v]) => sum + (Number(v) || 0), 0);
  const coverage =
    typeof breakdown.input_coverage === "number"
      ? Math.round(breakdown.input_coverage * 100)
      : null;

  return (
    <div
      style={{
        padding: "24px",
        borderRadius: "16px",
        background:
          "linear-gradient(135deg, rgba(30, 58, 95, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(200, 168, 75, 0.15)",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 20,
          gap: 16,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 12,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#9ca3af",
              marginBottom: 6,
            }}
          >
            Product risk score
          </div>
          <div
            className="font-garamond"
            style={{ fontSize: 42, lineHeight: 1, color: "#f9fafb" }}
          >
            {breakdown.final_score}
            <span style={{ fontSize: 16, color: "#9ca3af" }}> / 100</span>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div
            style={{
              display: "inline-block",
              padding: "6px 12px",
              borderRadius: 999,
              background: bandColor(breakdown.risk_band),
              color: "#fff",
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            {breakdown.risk_band}
          </div>
          {coverage != null && (
            <div style={{ marginTop: 8, fontSize: 12, color: "#9ca3af" }}>
              Input coverage {coverage}%
            </div>
          )}
        </div>
      </div>

      <div style={{ fontSize: 12, color: "#d1d5db", marginBottom: 12 }}>
        Headline score uses <strong>category deductions</strong> only (capped).
        Module rows below are diagnostics and are not added together.
      </div>
      <div
        role="note"
        style={{
          fontSize: 11,
          lineHeight: 1.55,
          color: "#fcd9a5",
          border: "1px solid rgba(245, 158, 11, 0.35)",
          borderRadius: 8,
          padding: "9px 11px",
          marginBottom: 14,
          background: "rgba(120, 53, 15, 0.18)",
        }}
      >
        Product-owner release enables this deterministic score only. It does not
        mean the underlying statutory rules have been independently verified or
        approved by Bangladesh company-law counsel. Treat findings as decision
        support pending professional review, not as a legal opinion or
        compliance certificate.
      </div>

      {deductionEntries.length > 0 ? (
        <div style={{ display: "grid", gap: 10, marginBottom: 16 }}>
          {deductionEntries.map(([name, points]) => (
            <div
              key={name}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "8px 10px",
                borderRadius: 8,
                background: "rgba(15, 23, 42, 0.45)",
                border: "1px solid rgba(148, 163, 184, 0.15)",
              }}
            >
              <span style={{ color: "#e5e7eb", fontSize: 13 }}>{name}</span>
              <span style={{ color: "#fca5a5", fontFamily: "monospace", fontSize: 13 }}>
                −{points}
              </span>
            </div>
          ))}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              paddingTop: 4,
              color: "#9ca3af",
              fontSize: 12,
            }}
          >
            <span>Total applied category deduction</span>
            <span style={{ fontFamily: "monospace" }}>−{totalDeduction}</span>
          </div>
        </div>
      ) : (
        <div style={{ fontSize: 13, color: "#9ca3af", marginBottom: 12 }}>
          No category deductions on the current evaluation.
        </div>
      )}

      {breakdown.override_applied && (
        <div
          style={{
            marginTop: 8,
            padding: 10,
            borderRadius: 8,
            background: "rgba(127, 29, 29, 0.35)",
            color: "#fecaca",
            fontSize: 12,
          }}
        >
          BLACK override applied
          {breakdown.override_reason ? `: ${breakdown.override_reason}` : ""}
        </div>
      )}
    </div>
  );
}
