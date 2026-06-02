"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { companiesApi } from "@/lib/api";
import { Company } from "@/types";

interface Flag {
  flag_id: string;
  rule_id: string;
  rule_name: string;
  severity: string;
  score_impact: number;
  status: string;
  triggered_at: string;
  resolution_note: string | null;
}

export default function CompaniesPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("ALL");
  const [selected, setSelected] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [evaluatingId, setEvaluatingId] = useState<string | null>(null);
  const [flags, setFlags] = useState<Flag[]>([]);
  const [flagsLoading, setFlagsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"info" | "flags" | "history">("info")
  const [history, setHistory] = useState<any[]>([]);

  const loadCompanies = useCallback(async () => {
    setFetchError("");
    try {
      const data = await companiesApi.list();
      const nextCompanies = Array.isArray(data) ? data : data?.items || [];
      setCompanies(nextCompanies);
      setSelected((current) => current ? nextCompanies.find((c: Company) => c.id === current.id) || current : current);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load companies.";
      setFetchError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadFlags = useCallback(async (companyId: string) => {
    setFlagsLoading(true);
    try {
      const data = await companiesApi.violations(companyId);
      setFlags(Array.isArray(data) ? data : []);
    } catch {
      setFlags([]);
    } finally {
      setFlagsLoading(false);
    }
  }, []);

  useEffect(() => { loadCompanies(); }, [loadCompanies]);

  const handleSelect = (c: Company) => {
    setSelected(c);
    setActiveTab("info");
    loadFlags(c.id);
    companiesApi.scoreHistory(c.id).then((d: any) => setHistory(Array.isArray(d) ? d.slice(0,12).reverse() : [])).catch(() => setHistory([]))
  };

  const handleEvaluate = async (companyId: string) => {
    setEvaluatingId(companyId);
    setFetchError("");
    try {
      await companiesApi.evaluate(companyId);
      await loadCompanies();
      await loadFlags(companyId);
      setActiveTab("flags");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Evaluation failed.";
      setFetchError(message);
    } finally {
      setEvaluatingId(null);
    }
  };

  async function handleDelete(id: string) {
    if (!confirm('Delete this company? This cannot be undone.')) return
    setDeleting(id)
    try {
      await companiesApi.delete(id)
      setCompanies(prev => prev.filter(x => x.id !== id))
      if (selected?.id === id) setSelected(null)
    } catch { alert('Delete failed — check console') }
    finally { setDeleting(null) }
  }

  const filtered = filter === "ALL" ? companies : companies.filter((c) => getRiskBand(c) === filter);

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Companies</h1>
        <button onClick={() => router.push("/dashboard/companies/new")}
          style={{ padding: "8px 20px", background: "var(--gold, #c8a84b)", color: "#0a0e1a", border: "none", borderRadius: 4, fontWeight: 600, cursor: "pointer", fontSize: 13 }}>
          + Add Company
        </button>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {["ALL", "GREEN", "YELLOW", "RED", "BLACK"].map((b) => (
          <button key={b} onClick={() => setFilter(b)}
            style={{ padding: "6px 14px", borderRadius: 6, border: "none", cursor: "pointer",
              background: filter === b ? "#1e3a5f" : "#e5e7eb", color: filter === b ? "#fff" : "#374151" }}>
            {b}
          </button>
        ))}
      </div>

      {loading && <div style={{ color: "#6b7280", padding: 20 }}>Loading...</div>}
      {fetchError && <div style={{ color: "#e07070", padding: "10px 20px", marginBottom: 12, borderRadius: 4, background: "rgba(224,112,112,0.1)" }}>{fetchError}</div>}

      <div style={{ display: "flex", gap: 24 }}>
        <div style={{ flex: 1 }}>
          {filtered.map((c) => (
            <div key={c.id} onClick={() => handleSelect(c)}
              style={{ padding: 14, marginBottom: 8, borderRadius: 8, border: "1px solid #e5e7eb",
                cursor: "pointer", background: selected?.id === c.id ? "#f3f4f6" : "#fff" }}>
              <div style={{ fontWeight: 500, fontSize: 13 }}>{getCompanyName(c)}</div>
              <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>{c.registration_number}</div>
              <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center" }}>
                <BandBadge band={getRiskBand(c)} />
                <span style={{ fontSize: 11, color: "#6b7280" }}>Score: {getComplianceScore(c) ?? "N/A"}</span>
                <span style={{ fontSize: 11, color: "#6b7280" }}>{c.company_status}</span>
              </div>
            </div>
          ))}
          {!loading && filtered.length === 0 && (
            <div style={{ color: "#6b7280", padding: 20, textAlign: "center" }}>
              No companies found.{" "}
              <span style={{ color: "#c8a84b", cursor: "pointer" }} onClick={() => router.push("/dashboard/companies/new")}>Add one →</span>
            </div>
          )}
        </div>

        {selected && (
          <div style={{ width: 360, borderRadius: 8, border: "1px solid #e5e7eb", overflow: "hidden", alignSelf: "flex-start" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #e5e7eb" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <h2 style={{ fontSize: 15, fontWeight: 600 }}>{getCompanyName(selected)}</h2>
                  <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>{selected.registration_number}</div>
                </div>
                <BandBadge band={getRiskBand(selected)} />
              </div>
              <div style={{ display: "flex", gap: 6, marginTop: 14 }}>
                {(["info", "flags", "history"] as const).map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    style={{ padding: "5px 14px", borderRadius: 4, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600,
                      background: activeTab === tab ? "#1e3a5f" : "#f3f4f6",
                      color: activeTab === tab ? "#fff" : "#374151" }}>
                    {tab === "info" ? "Details" : tab === "history" ? "Score History" : "Violations " + (flags.length > 0 ? "(" + flags.length + ")" : "")}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ padding: 20 }}>
              {activeTab === "info" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 12 }}>
                  <Row label="Type" value={selected.company_type} />
                  <Row label="Status" value={selected.company_status} />
                  <Row label="Score" value={getComplianceScore(selected)?.toString() ?? "Not evaluated"} />
                  <Row label="Incorporated" value={selected.incorporation_date} />
                  <Row label="FYE" value={selected.financial_year_end ?? "—"} />
                  <Row label="Last Evaluated" value={selected.last_evaluated_at ?? "Never"} />
                  <Row label="Revenue Tier" value={selected.revenue_tier ?? "—"} />
                </div>
              )}

              {activeTab === "flags" && (
                <div>
                  {flagsLoading && <div style={{ color: "#6b7280", fontSize: 12, padding: "8px 0" }}>Loading violations...</div>}
                  {!flagsLoading && flags.length === 0 && (
                    <div style={{ color: "#6b7280", fontSize: 12, textAlign: "center", padding: "20px 0" }}>
                      No active violations. Run evaluation to check compliance.
                    </div>
                  )}
                  {!flagsLoading && flags.map((f) => (
                    <div key={f.flag_id} style={{ marginBottom: 10, padding: "10px 12px", borderRadius: 6,
                      background: f.severity === "BLACK" ? "#1a0a0a" : f.severity === "RED" ? "#1a0d0d" : "#1a1500",
                      borderLeft: "3px solid " + (f.severity === "BLACK" ? "#111" : f.severity === "RED" ? "#ef4444" : "#f59e0b") }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.5px",
                          color: f.severity === "BLACK" ? "#9ca3af" : f.severity === "RED" ? "#ef4444" : "#f59e0b" }}>
                          {f.rule_id}
                        </span>
                        <span style={{ fontSize: 10, color: "#6b7280" }}>-{f.score_impact} pts</span>
                      </div>
                      <div style={{ fontSize: 11, color: "#e5e7eb", lineHeight: 1.4 }}>{f.rule_name}</div>
                      <div style={{ fontSize: 10, color: "#6b7280", marginTop: 4 }}>
                        Triggered: {f.triggered_at} · {f.status}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "history" && (
                <div>
                  {history.length === 0 ? (
                    <div style={{ color: "#6b7280", fontSize: 12, textAlign: "center", padding: "20px 0" }}>No score history yet. Run evaluation first.</div>
                  ) : (
                    <div>
                      <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 80, marginBottom: 12 }}>
                        {history.map((h: any, i: number) => {
                          const score = h.score || 0
                          const band = h.risk_band || "GREEN"
                          const colors: Record<string,string> = { GREEN: "#10b981", YELLOW: "#f59e0b", RED: "#ef4444", BLACK: "#374151" }
                          return (
                            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                              <div style={{ fontSize: 8, color: "#6b7280" }}>{score}</div>
                              <div style={{ width: "100%", background: colors[band] || "#6b7280", borderRadius: "2px 2px 0 0",
                                height: Math.max(4, (score / 100) * 60) + "px", transition: "height 0.3s" }} />
                            </div>
                          )
                        })}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {history.slice(-4).reverse().map((h: any, i: number) => (
                          <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                            <span style={{ color: "#6b7280" }}>{h.month ? h.month.slice(0,7) : "—"}</span>
                            <span style={{ fontWeight: 600 }}>{h.score}</span>
                            <span style={{ color: h.risk_band === "GREEN" ? "#10b981" : h.risk_band === "YELLOW" ? "#f59e0b" : h.risk_band === "RED" ? "#ef4444" : "#9ca3af" }}>{h.risk_band}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <button onClick={() => handleEvaluate(selected.id)} disabled={evaluatingId === selected.id}
                style={{ width: "100%", marginTop: 16, padding: "9px 0", background: "#1e3a5f", color: "#fff",
                  border: "none", borderRadius: 4, fontSize: 12, fontWeight: 600, cursor: evaluatingId === selected.id ? "not-allowed" : "pointer",
                  opacity: evaluatingId === selected.id ? 0.7 : 1 }}>
                {evaluatingId === selected.id ? "Evaluating..." : "Run Evaluation"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function getCompanyName(company: Company) {
  return company.company_name || company.name || "Unnamed company";
}
function getRiskBand(company: Company) {
  return company.current_risk_band ?? company.band ?? null;
}
function getComplianceScore(company: Company) {
  return company.current_compliance_score ?? company.compliance_score ?? null;
}
function BandBadge({ band }: { band: string | null }) {
  const colors: Record<string, string> = { GREEN: "#10b981", YELLOW: "#f59e0b", RED: "#ef4444", BLACK: "#111827" };
  if (!band) return <span style={{ fontSize: 11, color: "#6b7280" }}>Unrated</span>;
  return (
    <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600, color: "#fff", background: colors[band] || "#6b7280" }}>
      {band}
    </span>
  );
}
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between" }}>
      <span style={{ color: "#6b7280" }}>{label}</span>
      <span style={{ fontWeight: 500 }}>{value}</span>
    </div>
  );
}
