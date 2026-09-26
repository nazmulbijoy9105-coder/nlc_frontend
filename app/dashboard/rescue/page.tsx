"use client";
import { useEffect, useState } from "react";
import { rescueApi } from "@/lib/api";
import Topbar from "@/components/Topbar";

const BAND_STYLES: Record<string, { bg: string; border: string; color: string }> = {
  RED: { bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.3)", color: "#ef4444" },
  BLACK: { bg: "rgba(17,24,39,0.5)", border: "rgba(255,255,255,0.1)", color: "#e5e7eb" },
};

export default function RescuePage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    rescueApi.list()
      .then((data: any[]) => setPlans(Array.isArray(data) ? data : []))
      .catch(() => setPlans([]))
      .finally(() => setLoading(false));
  }, []);

  const red = plans.filter((p) => p.band === "RED");
  const black = plans.filter((p) => p.band === "BLACK");

  return (
    <>
      <Topbar title="Corporate Rescue Pipeline" />
      <div style={{ padding: 28 }}>
        {loading && <div style={{ color: "var(--white-3)", padding: 20 }}>Loading...</div>}
        {!loading && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 28 }}>
              <div className="nlc-card" style={{ padding: "18px 20px" }}>
                <div style={{ fontSize: 11, color: "var(--white-2)", letterSpacing: "1px", textTransform: "uppercase", marginBottom: 6 }}>Total Cases</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: "var(--gold)" }}>{plans.length}</div>
              </div>
              <div className="nlc-card" style={{ padding: "18px 20px", borderTop: "3px solid #ef4444" }}>
                <div style={{ fontSize: 11, color: "var(--white-2)", letterSpacing: "1px", textTransform: "uppercase", marginBottom: 6 }}>RED - Critical</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: "#ef4444" }}>{red.length}</div>
                <div style={{ fontSize: 11, color: "var(--white-3)", marginTop: 4 }}>Immediate intervention required</div>
              </div>
              <div className="nlc-card" style={{ padding: "18px 20px", borderTop: "3px solid #6b7280" }}>
                <div style={{ fontSize: 11, color: "var(--white-2)", letterSpacing: "1px", textTransform: "uppercase", marginBottom: 6 }}>BLACK - Severe</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: "#e5e7eb" }}>{black.length}</div>
                <div style={{ fontSize: 11, color: "var(--white-3)", marginTop: 4 }}>Active rescue plans</div>
              </div>
            </div>
            {plans.length === 0 ? (
              <div className="nlc-card" style={{ padding: 60, textAlign: "center" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>No active rescue cases</div>
                <div style={{ fontSize: 13, color: "var(--white-3)" }}>Companies in good standing will appear here if flagged.</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {plans.map((p) => {
                  const bs = BAND_STYLES[p.band] || BAND_STYLES.BLACK;
                  return (
                    <div key={p.id} className="nlc-card" style={{ padding: "16px 20px", borderLeft: "4px solid " + bs.color }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{p.company_name || p.company_id || "Unknown Company"}</div>
                          <div style={{ fontSize: 12, color: "var(--white-2)" }}>{p.key_issue || "No key issue specified"}</div>
                        </div>
                        <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase", padding: "4px 10px", borderRadius: 4, background: bs.bg, border: "1px solid " + bs.border, color: bs.color }}>{p.band}</span>
                      </div>
                      <div style={{ display: "flex", gap: 24, marginTop: 12, fontSize: 12, color: "var(--white-3)" }}>
                        <span>Score: <b style={{ color: "var(--white-1)" }}>{p.score || 0}</b></span>
                        <span>Violations: <b style={{ color: "var(--white-1)" }}>{p.violation_count || 0}</b></span>
                        {p.rescue_day && <span>Day <b style={{ color: "var(--white-1)" }}>{p.rescue_day}</b></span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
