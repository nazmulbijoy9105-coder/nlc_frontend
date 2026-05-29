"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { companiesApi } from "@/lib/api";
import { Company } from "@/types";

export default function CompaniesPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filter, setFilter] = useState<string>("ALL");
  const [selected, setSelected] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [evaluatingId, setEvaluatingId] = useState<string | null>(null);

  const loadCompanies = useCallback(async () => {
    setFetchError("");
    try {
      const data = await companiesApi.list();
      const nextCompanies = Array.isArray(data) ? data : data?.items || [];
      setCompanies(nextCompanies);
      setSelected((current) => current ? nextCompanies.find((c: Company) => c.id === current.id) || current : current);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load companies.";
      console.error("companies list:", err);
      setFetchError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCompanies();
  }, [loadCompanies]);

  const handleEvaluate = async (companyId: string) => {
    setEvaluatingId(companyId);
    setFetchError("");
    try {
      await companiesApi.evaluate(companyId);
      await loadCompanies();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Evaluation failed.";
      console.error("companies evaluate:", err);
      setFetchError(message);
    } finally {
      setEvaluatingId(null);
    }
  };

  const filtered = filter === "ALL"
    ? companies
    : companies.filter((c) => getRiskBand(c) === filter);

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Companies</h1>
        <button
          onClick={() => router.push("/dashboard/companies/new")}
          style={{ padding: "8px 20px", background: "var(--gold, #c8a84b)", color: "#0a0e1a", border: "none", borderRadius: 4, fontWeight: 600, cursor: "pointer", fontSize: 13 }}
        >
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
      {fetchError && <div style={{ color: "#e07070", padding: 20 }}>{fetchError}</div>}

      <div style={{ display: "flex", gap: 24 }}>
        <div style={{ flex: 1 }}>
          {filtered.map((c) => (
            <div key={c.id} onClick={() => setSelected(c)}
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
              <span style={{ color: "#c8a84b", cursor: "pointer" }} onClick={() => router.push("/dashboard/companies/new")}>
                Add one →
              </span>
            </div>
          )}
        </div>

        {selected && (
          <div style={{ width: 320, padding: 20, borderRadius: 8, border: "1px solid #e5e7eb" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 600 }}>{getCompanyName(selected)}</h2>
                <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>{selected.registration_number}</div>
              </div>
              <BandBadge band={getRiskBand(selected)} />
            </div>
            <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8, fontSize: 12 }}>
              <Row label="Type" value={selected.company_type} />
              <Row label="Status" value={selected.company_status} />
              <Row label="Score" value={getComplianceScore(selected)?.toString() ?? "Not evaluated"} />
              <Row label="Incorporated" value={selected.incorporation_date} />
              <Row label="FYE" value={selected.financial_year_end ?? "—"} />
              <Row label="Last Evaluated" value={selected.last_evaluated_at ?? "Never"} />
              <Row label="Revenue Tier" value={selected.revenue_tier ?? "—"} />
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button
                onClick={() => handleEvaluate(selected.id)}
                disabled={evaluatingId === selected.id}
                style={{ flex: 1, padding: "8px 0", background: "#1e3a5f", color: "#fff", border: "none", borderRadius: 4, fontSize: 12, cursor: "pointer" }}>
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
    <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 4, fontSize: 11,
      fontWeight: 600, color: "#fff", background: colors[band] || "#6b7280" }}>
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
