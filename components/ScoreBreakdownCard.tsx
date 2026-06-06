"use client";

import { ScoreBreakdown } from "@/types";
import { TrendingUp, AlertTriangle, Shield } from "lucide-react";

interface ScoreBreakdownCardProps {
  breakdown: ScoreBreakdown | null;
}

export default function ScoreBreakdownCard({ breakdown }: ScoreBreakdownCardProps) {
  if (!breakdown) {
    return (
      <div style={{
        padding: "24px",
        borderRadius: "16px",
        background: "linear-gradient(135deg, rgba(30, 58, 95, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(200, 168, 75, 0.1)",
        textAlign: "center",
        color: "#6b7280",
        fontSize: "14px"
      }}>
        <Shield size={32} style={{ margin: "0 auto 12px", opacity: 0.3 }} />
        Run evaluation to see score breakdown
      </div>
    );
  }

  const scores = [
    { label: "AGM", value: breakdown.agm_score, max: 20, icon: "📋" },
    { label: "Audit", value: breakdown.audit_score, max: 20, icon: "🔍" },
    { label: "Annual Return", value: breakdown.annual_return_score, max: 20, icon: "📄" },
    { label: "Director", value: breakdown.director_score, max: 10, icon: "👤" },
    { label: "Shareholding", value: breakdown.shareholding_score, max: 10, icon: "📊" },
    { label: "Capital", value: breakdown.capital_score, max: 5, icon: "💰" },
    { label: "Office", value: breakdown.office_score, max: 5, icon: "🏢" },
    { label: "Registers", value: breakdown.register_score, max: 5, icon: "📚" },
    { label: "Tax", value: breakdown.tax_score, max: 5, icon: "🧾" },
  ];

  const getScoreColor = (value: number, max: number) => {
    const ratio = value / max;
    if (ratio >= 0.8) return "#10b981";
    if (ratio >= 0.5) return "#f59e0b";
    return "#ef4444";
  };

  const getScoreGradient = (value: number, max: number) => {
    const ratio = value / max;
    if (ratio >= 0.8) return "linear-gradient(90deg, #10b981, #34d399)";
    if (ratio >= 0.5) return "linear-gradient(90deg, #f59e0b, #fbbf24)";
    return "linear-gradient(90deg, #ef4444, #f87171)";
  };

  return (
    <div style={{
      padding: "24px",
      borderRadius: "16px",
      background: "linear-gradient(135deg, rgba(30, 58, 95, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%)",
      backdropFilter: "blur(20px)",
      border: "1px solid rgba(200, 168, 75, 0.15)",
      boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <TrendingUp size={18} color="#c8a84b" />
          <span style={{ fontSize: "14px", fontWeight: 600, color: "#e5e7eb" }}>Score Breakdown</span>
        </div>
        <div style={{
          padding: "4px 12px",
          borderRadius: "20px",
          background: breakdown.final_score >= 85 ? "rgba(16, 185, 129, 0.2)" : 
                      breakdown.final_score >= 50 ? "rgba(245, 158, 11, 0.2)" : "rgba(239, 68, 68, 0.2)",
          color: breakdown.final_score >= 85 ? "#10b981" : 
                 breakdown.final_score >= 50 ? "#f59e0b" : "#ef4444",
          fontSize: "12px",
          fontWeight: 700
        }}>
          {breakdown.final_score}/100
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        {scores.map((s) => (
          <div key={s.label} style={{
            padding: "12px",
            borderRadius: "12px",
            background: "rgba(255, 255, 255, 0.03)",
            border: "1px solid rgba(255, 255, 255, 0.05)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <span style={{ fontSize: "11px", color: "#9ca3af", display: "flex", alignItems: "center", gap: "4px" }}>
                {s.icon} {s.label}
              </span>
              <span style={{ fontSize: "12px", fontWeight: 700, color: getScoreColor(s.value, s.max) }}>
                {s.value}/{s.max}
              </span>
            </div>
            <div style={{
              width: "100%",
              height: "4px",
              borderRadius: "2px",
              background: "rgba(255, 255, 255, 0.1)",
              overflow: "hidden"
            }}>
              <div style={{
                width: `${(s.value / s.max) * 100}%`,
                height: "100%",
                borderRadius: "2px",
                background: getScoreGradient(s.value, s.max),
                transition: "width 0.6s ease-out"
              }} />
            </div>
          </div>
        ))}
      </div>

      {breakdown.override_applied && (
        <div style={{
          marginTop: "16px",
          padding: "12px 16px",
          borderRadius: "12px",
          background: "rgba(239, 68, 68, 0.1)",
          border: "1px solid rgba(239, 68, 68, 0.2)",
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }}>
          <AlertTriangle size={16} color="#ef4444" />
          <span style={{ fontSize: "11px", color: "#ef4444", fontWeight: 500 }}>
            BLACK Override: {breakdown.override_reason}
          </span>
        </div>
      )}

      <div style={{
        marginTop: "16px",
        display: "flex",
        gap: "8px",
        justifyContent: "center"
      }}>
        {[
          { count: breakdown.green_flag_count, color: "#10b981", label: "Green" },
          { count: breakdown.yellow_flag_count, color: "#f59e0b", label: "Yellow" },
          { count: breakdown.red_flag_count, color: "#ef4444", label: "Red" },
          { count: breakdown.black_flag_count, color: "#111827", label: "Black" },
        ].map((f) => (
          <div key={f.label} style={{
            padding: "6px 12px",
            borderRadius: "8px",
            background: "rgba(255, 255, 255, 0.03)",
            textAlign: "center"
          }}>
            <div style={{ fontSize: "14px", fontWeight: 700, color: f.color }}>{f.count}</div>
            <div style={{ fontSize: "9px", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px" }}>{f.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
