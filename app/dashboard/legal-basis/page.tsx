"use client";

import { useEffect, useMemo, useState } from "react";
import { ApiError, rulesApi } from "@/lib/api";

type RuleRow = {
  rule_id: string;
  rule_name: string;
  is_active: boolean;
  product_scoring_enabled: boolean;
  verification_status: string;
};

type ProvenanceResponse = {
  rule_id: string;
  legal_verification_status: string;
  product_owner_source_mappings: Array<{
    mapping_id: string;
    mapping_kind: string;
    provision_citation: string;
    rationale: string;
    source: {
      source_id: string;
      title: string;
      authority: string;
      official_url: string;
      citation: string;
      version_label: string;
      state: string;
      artifact_bytes_checked: boolean;
    };
    product_owner_decisions: Record<string, string | null>;
  }>;
  independent_legal_verification_claimed: boolean;
};

export default function LegalBasisPage() {
  const [rules, setRules] = useState<RuleRow[]>([]);
  const [selectedRuleId, setSelectedRuleId] = useState("");
  const [query, setQuery] = useState("");
  const [provenance, setProvenance] = useState<ProvenanceResponse | null>(null);
  const [loadingRules, setLoadingRules] = useState(true);
  const [loadingSource, setLoadingSource] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sourceError, setSourceError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void rulesApi.list()
      .then((rows) => {
        if (cancelled) return;
        if (!Array.isArray(rows)) throw new Error("The rule catalogue returned an unexpected response.");
        setRules(rows);
        setSelectedRuleId(rows[0]?.rule_id || "");
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Could not load the rule catalogue.");
      })
      .finally(() => {
        if (!cancelled) setLoadingRules(false);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!selectedRuleId) {
      setProvenance(null);
      return;
    }
    let cancelled = false;
    setLoadingSource(true);
    setSourceError(null);
    setProvenance(null);
    void rulesApi.provenance(selectedRuleId)
      .then((value) => {
        if (!cancelled) setProvenance(value as ProvenanceResponse);
      })
      .catch((err) => {
        if (!cancelled) setSourceError(err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Could not load this rule's source record.");
      })
      .finally(() => {
        if (!cancelled) setLoadingSource(false);
      });
    return () => { cancelled = true; };
  }, [selectedRuleId]);

  const filteredRules = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return rules;
    return rules.filter((rule) =>
      rule.rule_id.toLowerCase().includes(value) ||
      rule.rule_name.toLowerCase().includes(value)
    );
  }, [rules, query]);

  const selected = rules.find((rule) => rule.rule_id === selectedRuleId);
  const mappings = provenance?.product_owner_source_mappings || [];

  if (loadingRules) return <div role="status" style={{ padding: 32, color: "var(--text3)" }}>Loading legal basis register…</div>;

  return (
    <div style={{ padding: 24, maxWidth: 1440, margin: "0 auto" }}>
      <header style={{ marginBottom: 20 }}>
        <div className="font-garamond" style={{ fontSize: 24, color: "var(--nlc-white)", marginBottom: 4 }}>Legal Basis & Source Register</div>
        <p style={{ color: "var(--text3)", fontSize: 12, lineHeight: 1.6, maxWidth: 820 }}>
          Inspect the registered instrument version and exact provision mapped to each NLC rule. A catalogue citation is not presented as a verified source unless a source mapping has actually been registered.
        </p>
      </header>

      <div role="note" style={{ padding: 14, marginBottom: 18, border: "1px solid #D6B66A55", borderLeft: "3px solid #C9A84C", borderRadius: 8, background: "#C9A84C10", color: "var(--text2)", fontSize: 12, lineHeight: 1.6 }}>
        **Important:** NLC's compliance score is a product risk indicator, not legal advice or a legal certification. Product-owner release and independent legal verification are separate records. A PENDING legal-verification status does not erase a product-owner scoring decision.
      </div>

      {error && <div role="alert" className="nlc-card" style={{ marginBottom: 16, color: "var(--red)" }}>{error}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "minmax(250px, 340px) minmax(0, 1fr)", gap: 16, alignItems: "start" }}>
        <section className="nlc-card" aria-label="Rule catalogue">
          <div className="sec-lbl gold">Rule catalogue · {rules.length}</div>
          <input
            className="nlc-input"
            aria-label="Search rules"
            placeholder="Search rule ID or name"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            style={{ width: "100%", marginBottom: 10 }}
          />
          <div style={{ display: "grid", gap: 5, maxHeight: "68vh", overflowY: "auto" }}>
            {filteredRules.map((rule) => {
              const active = selectedRuleId === rule.rule_id;
              return (
                <button
                  type="button"
                  key={rule.rule_id}
                  onClick={() => setSelectedRuleId(rule.rule_id)}
                  aria-pressed={active}
                  style={{
                    textAlign: "left", border: active ? "1px solid #C9A84C" : "1px solid var(--border)",
                    borderRadius: 7, padding: "10px 11px", cursor: "pointer",
                    background: active ? "#C9A84C16" : "transparent", color: "var(--text)",
                  }}
                >
                  <span className="font-mono" style={{ color: "var(--teal)", fontSize: 10, fontWeight: 700 }}>{rule.rule_id}</span>
                  <span style={{ display: "block", fontSize: 12, marginTop: 3 }}>{rule.rule_name}</span>
                  <span style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 7 }}>
                    <span className="badge badge-neutral">{rule.product_scoring_enabled ? "Scoring rule" : "Informational"}</span>
                    <span className="badge badge-yellow">Legal verification pending</span>
                  </span>
                </button>
              );
            })}
            {filteredRules.length === 0 && <p style={{ fontSize: 12, color: "var(--text3)", padding: 12 }}>No matching rules.</p>}
          </div>
        </section>

        <section className="nlc-card" aria-label="Selected rule legal source">
          {!selected ? <p style={{ color: "var(--text3)" }}>Select a rule to inspect its source register.</p> : (
            <>
              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
                <div>
                  <div className="font-mono" style={{ fontSize: 11, color: "var(--teal)", fontWeight: 700 }}>{selected.rule_id}</div>
                  <h2 className="font-garamond" style={{ fontSize: 20, color: "var(--nlc-white)", marginTop: 4 }}>{selected.rule_name}</h2>
                </div>
                <div style={{ display: "grid", gap: 5, alignContent: "start" }}>
                  <span className="badge badge-yellow">Legal status: {provenance?.legal_verification_status || "PENDING"}</span>
                  <span className={selected.product_scoring_enabled ? "badge badge-green" : "badge badge-neutral"}>
                    {selected.product_scoring_enabled ? "Product scoring enabled" : "Informational / non-scoring"}
                  </span>
                </div>
              </div>

              {loadingSource && <p role="status" style={{ color: "var(--text3)", fontSize: 12 }}>Loading registered source mapping…</p>}
              {sourceError && <div role="alert" style={{ color: "var(--red)", fontSize: 12, marginBottom: 12 }}>{sourceError}</div>}

              {!loadingSource && !sourceError && mappings.length === 0 && (
                <div role="status" style={{ padding: 18, border: "1px dashed var(--border2)", borderRadius: 8, color: "var(--text2)", fontSize: 13, lineHeight: 1.7 }}>
                  **No source/provision mapping is registered for this rule yet.**
                  <p style={{ marginTop: 6, color: "var(--text3)", fontSize: 12 }}>
                    The rule's legacy catalogue text is not treated as independently verified legal authority. NLC will show the instrument and section here after the source version and exact provision mapping are registered.
                  </p>
                </div>
              )}

              <div style={{ display: "grid", gap: 12 }}>
                {mappings.map((mapping) => (
                  <article key={mapping.mapping_id} style={{ padding: 15, border: "1px solid var(--border)", borderRadius: 8, background: "var(--surface2)" }}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 10 }}>
                      <span className="badge badge-neutral">{mapping.mapping_kind}</span>
                      <span className="badge badge-neutral">Source reference registered</span>
                    </div>
                    <h3 style={{ color: "var(--nlc-white)", fontSize: 15, fontWeight: 700 }}>{mapping.source.title}</h3>
                    <p style={{ color: "var(--text3)", fontSize: 11, marginTop: 3 }}>{mapping.source.authority} · {mapping.source.version_label}</p>
                    <div style={{ marginTop: 12 }}>
                      <div className="font-mono" style={{ color: "var(--text3)", fontSize: 9, textTransform: "uppercase", letterSpacing: ".12em" }}>Exact mapped provision</div>
                      <p style={{ fontSize: 13, color: "var(--text)", marginTop: 4 }}>{mapping.provision_citation}</p>
                    </div>
                    <p style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.6, marginTop: 10 }}>{mapping.rationale}</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12, fontSize: 11 }}>
                      <span>Artifact: {mapping.source.state}</span>
                      <span>· Byte integrity checked: {mapping.source.artifact_bytes_checked ? "Yes" : "No"}</span>
                    </div>
                    <p style={{ fontSize: 11, color: "var(--text3)", marginTop: 6 }}>Product-owner scoring: {mapping.product_owner_decisions?.SCORING || "Not approved"} · Deadline: {mapping.product_owner_decisions?.DEADLINE || "Not approved"}</p>
                    <a href={mapping.source.official_url} target="_blank" rel="noreferrer" style={{ display: "inline-block", marginTop: 12, color: "var(--teal)", textDecoration: "underline", fontSize: 12 }}>Open official source record ↗</a>
                  </article>
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
