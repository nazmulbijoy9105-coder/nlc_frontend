"use client";

import { useEffect, useState } from "react";
import { companiesApi } from "@/lib/api";
import { Company } from "@/types";  // Use the types/index.ts interface

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filter, setFilter] = useState<string>("ALL");
  const [selected, setSelected] = useState<Company | null>(null);

  useEffect(() => {
    companiesApi.list().then((data: Company[]) => setCompanies(data));
  }, []);

  // FIX: Use frontend field names from types/index.ts
  const filtered = filter === "ALL"
    ? companies
    : companies.filter((c) => c.band === filter);  // was: band

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>Companies</h1>

      {/* Filter buttons */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {["ALL", "GREEN", "YELLOW", "RED", "BLACK"].map((b) => (
          <button
            key={b}
            onClick={() => setFilter(b)}
            style={{
              padding: "6px 14px",
              borderRadius: 6,
              border: "none",
              cursor: "pointer",
              background: filter === b ? "#1e3a5f" : "#e5e7eb",
              color: filter === b ? "#fff" : "#374151",
            }}
          >
            {b}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 24 }}>
        {/* Company list */}
        <div style={{ flex: 1 }}>
          {filtered.map((c) => (
            <div
              key={c.id}
              onClick={() => setSelected(c)}
              style={{
                padding: 14,
                marginBottom: 8,
                borderRadius: 8,
                border: "1px solid #e5e7eb",
                cursor: "pointer",
                background: selected?.id === c.id ? "#f3f4f6" : "#fff",
              }}
            >
              {/* FIX: Use c.name (was c.name) */}
              <div style={{ fontWeight: 500, fontSize: 13 }}>{c.name}</div>
              <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>
                {c.registration_number}
              </div>
              <div style={{ marginTop: 8 }}>
                {/* FIX: Use c.band (was c.band) */}
                <BandBadge band={c.band} />
              </div>
              <div style={{ marginTop: 8 }}>
                {/* FIX: Use c.compliance_score (was c.compliance_score) */}
                <ScoreBar score={c.compliance_score} band={c.band} />
              </div>
            </div>
          ))}
        </div>

        {/* Detail panel */}
        {selected && (
          <div style={{ width: 320, padding: 16, borderRadius: 8, border: "1px solid #e5e7eb" }}>
            {/* FIX: Use selected.name (was selected.name) */}
            <h2 style={{ fontSize: 18, fontWeight: 600 }}>{selected.name}</h2>
            <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
              {selected.registration_number}
            </div>
            <div style={{ marginTop: 12 }}>
              {/* FIX: Use selected.compliance_score (was selected.compliance_score) */}
              <ScoreBar score={selected.compliance_score} band={selected.band} />
            </div>
            <div style={{ marginTop: 12, fontSize: 12 }}>
              <div>Director Count: {selected.director_count}</div>
              <div>Violation Count: {selected.violation_count}</div>
              <div>Last Evaluated: {selected.last_evaluated_at}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function BandBadge({ band }: { band: string }) {
  const colors: Record<string, string> = {
    GREEN: "#10b981",
    YELLOW: "#f59e0b",
    RED: "#ef4444",
    BLACK: "#111827",
  };
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: 4,
        fontSize: 11,
        fontWeight: 600,
        color: "#fff",
        background: colors[band] || "#6b7280",
      }}
    >
      {band}
    </span>
  );
}

function ScoreBar({ score, band }: { score: number; band: string }) {
  const colors: Record<string, string> = {
    GREEN: "#10b981",
    YELLOW: "#f59e0b",
    RED: "#ef4444",
    BLACK: "#111827",
  };
  const pct = Math.min(100, Math.max(0, score || 0));
  return (
    <div>
      <div
        style={{
          height: 6,
          borderRadius: 3,
          background: "#e5e7eb",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: colors[band] || "#6b7280",
            transition: "width 0.3s",
          }}
        />
      </div>
      <div style={{ fontSize: 11, marginTop: 4, color: "#6b7280" }}>
        {score}/100
      </div>
    </div>
  );
}
