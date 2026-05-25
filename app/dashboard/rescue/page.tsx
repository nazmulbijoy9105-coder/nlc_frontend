"use client";

import { useEffect, useState } from "react";
import { rescueApi } from "@/lib/api";
import { RescueCase } from "@/types";

export default function RescuePage() {
  const [plans, setPlans] = useState<RescueCase[]>([]);

  useEffect(() => {
    rescueApi.list().then((data: RescueCase[]) => setPlans(data));
  }, []);

  // FIX: Use frontend field names from types/index.ts
  const red = plans.filter((p) => p.band === "RED");    // was: current_risk_band
  const black = plans.filter((p) => p.band === "BLACK"); // was: current_risk_band

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>
        Corporate Rescue
      </h1>

      <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
        <div
          style={{
            padding: 16,
            borderRadius: 8,
            border: "1px solid #e5e7eb",
            background: "#fef2f2",
          }}
        >
          <div style={{ fontSize: 12, color: "#6b7280" }}>RED Cases</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#ef4444" }}>
            {red.length}
          </div>
        </div>
        <div
          style={{
            padding: 16,
            borderRadius: 8,
            border: "1px solid #e5e7eb",
            background: "#f3f4f6",
          }}
        >
          <div style={{ fontSize: 12, color: "#6b7280" }}>BLACK Cases</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#111827" }}>
            {black.length}
          </div>
        </div>
      </div>

      <div>
        {plans.map((p) => (
          <div
            key={p.id}
            style={{
              padding: 14,
              marginBottom: 8,
              borderRadius: 8,
              border: "1px solid #e5e7eb",
            }}
          >
            {/* FIX: Use p.company_name (already correct) */}
            <div style={{ fontWeight: 500, fontSize: 13 }}>
              {p.company_name || p.company_id}
            </div>
            <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>
              {/* FIX: Use p.band (was p.current_risk_band) */}
              Band: {p.band} | Score: {p.score} | Violations: {p.violation_count}
            </div>
            {p.rescue_day && (
              <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>
                Day {p.rescue_day} — {p.key_issue}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
