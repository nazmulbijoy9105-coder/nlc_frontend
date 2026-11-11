"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { ApiError, legalProvenanceApi, rulesApi } from "@/lib/api";
import { useCurrentUserRole } from "@/lib/use-current-user-role";

const EVENT_TYPES = [
  "FIRST_AGM", "SUBSEQUENT_AGM", "ANNUAL_RETURN", "AUDITOR_APPOINTMENT",
  "FORM_XII", "BOARD_MEETING", "FINANCIAL_STATEMENTS", "TRADE_LICENSE",
  "TAX_RETURN", "OTHER",
];

function messageOf(error: unknown): string {
  return error instanceof ApiError ? error.message : error instanceof Error ? error.message : "Request failed.";
}

export default function LegalProvenanceAdminPage() {
  const { role, loaded } = useCurrentUserRole();
  const [sources, setSources] = useState<any[]>([]);
  const [rules, setRules] = useState<any[]>([]);
  const [mappings, setMappings] = useState<any[]>([]);
  const [definitions, setDefinitions] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [sourceForm, setSourceForm] = useState({
    source_key: "", jurisdiction: "BD", instrument_title: "", issuing_authority: "Government of Bangladesh",
    instrument_type: "ACT", official_url: "", citation: "", version_label: "",
    publication_date: "", effective_from: "", effective_to: "",
  });
  const [mappingForm, setMappingForm] = useState({
    rule_id: "", source_id: "", mapping_kind: "RULE_BASIS",
    provision_citation: "", rationale: "",
  });
  const [deadlineForm, setDeadlineForm] = useState({
    mapping_id: "", event_type: "FIRST_AGM", title: "", trigger_fact_key: "",
    period_label: "", offset: "30", unit: "DAYS", adjustment: "NONE",
    exclude_trigger_day: false, effective_from: "", effective_to: "",
    holiday_calendar_version: "", holiday_source_citation: "",
  });
  const [decisionForm, setDecisionForm] = useState({
    rule_id: "", mapping_id: "", release_scope: "SCORING",
    decision: "APPROVED", reason: "", deadline_definition_id: "",
  });

  const load = useCallback(async () => {
    if (role !== "SUPER_ADMIN") return;
    setLoading(true);
    setError(null);
    try {
      const [sourceRows, ruleRows, mappingRows, deadlineRows, eventRows] = await Promise.all([
        legalProvenanceApi.listSources(),
        rulesApi.list(),
        legalProvenanceApi.listMappings(),
        legalProvenanceApi.listDeadlineDefinitions(),
        legalProvenanceApi.listEvents(),
      ]);
      setSources(Array.isArray(sourceRows) ? sourceRows : []);
      setRules(Array.isArray(ruleRows) ? ruleRows : []);
      setMappings(Array.isArray(mappingRows) ? mappingRows : []);
      setDefinitions(Array.isArray(deadlineRows) ? deadlineRows : []);
      setEvents(Array.isArray(eventRows) ? eventRows : []);
      setMappingForm((old) => ({
        ...old,
        rule_id: old.rule_id || ruleRows?.[0]?.rule_id || "",
        source_id: old.source_id || sourceRows?.[0]?.source_id || "",
      }));
      setDecisionForm((old) => ({
        ...old,
        rule_id: old.rule_id || ruleRows?.[0]?.rule_id || "",
        mapping_id: old.mapping_id || mappingRows?.[0]?.mapping_id || "",
      }));
      setDeadlineForm((old) => ({
        ...old,
        mapping_id: old.mapping_id || mappingRows?.find((row: any) => row.mapping_kind === "DEADLINE_BASIS")?.mapping_id || "",
      }));
    } catch (err) {
      setError(messageOf(err));
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    if (loaded && role === "SUPER_ADMIN") {
      void Promise.resolve().then(load);
    }
  }, [loaded, role, load]);

  const submitSource = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setSaving("source"); setError(null); setNotice(null);
    try {
      const body = {
        ...sourceForm,
        publication_date: sourceForm.publication_date || null,
        effective_from: sourceForm.effective_from || null,
        effective_to: sourceForm.effective_to || null,
      };
      const result = await legalProvenanceApi.registerSource(body);
      setNotice(`Source registered: ${result.source_state}. Event ${result.event_id}.`);
      setSourceForm({
        source_key: "", jurisdiction: "BD", instrument_title: "", issuing_authority: "Government of Bangladesh",
        instrument_type: "ACT", official_url: "", citation: "", version_label: "",
        publication_date: "", effective_from: "", effective_to: "",
      });
      await load();
    } catch (err) { setError(messageOf(err)); }
    finally { setSaving(""); }
  };

  const submitMapping = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setSaving("mapping"); setError(null); setNotice(null);
    try {
      const result = await legalProvenanceApi.createMapping(mappingForm);
      setNotice(`Rule/source mapping registered for ${result.rule_id}. Event ${result.event_id}.`);
      setMappingForm((old) => ({ ...old, provision_citation: "", rationale: "" }));
      await load();
    } catch (err) { setError(messageOf(err)); }
    finally { setSaving(""); }
  };

  const submitDeadline = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setSaving("deadline"); setError(null); setNotice(null);
    try {
      const result = await legalProvenanceApi.createDeadlineDefinition({
        ...deadlineForm,
        offset: Number(deadlineForm.offset),
        effective_to: deadlineForm.effective_to || null,
        holiday_calendar_version: deadlineForm.holiday_calendar_version || null,
        holiday_source_citation: deadlineForm.holiday_source_citation || null,
        holidays: [],
      });
      setNotice(`Deadline definition registered in PENDING state: ${result.definition_id}. It is not active until an owner decision and verified trigger fact exist.`);
      setDeadlineForm((old) => ({ ...old, title: "", trigger_fact_key: "", period_label: "" }));
      await load();
    } catch (err) { setError(messageOf(err)); }
    finally { setSaving(""); }
  };

  const submitDecision = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setSaving("decision"); setError(null); setNotice(null);
    try {
      const result = await legalProvenanceApi.recordDecision({
        ...decisionForm,
        deadline_definition_id: decisionForm.release_scope === "DEADLINE" ? decisionForm.deadline_definition_id : null,
      });
      setNotice(`Product-owner ${result.decision} recorded for ${result.release_scope} / ${result.rule_id}. Legal verification was not changed.`);
      setDecisionForm((old) => ({ ...old, reason: "" }));
      await load();
    } catch (err) { setError(messageOf(err)); }
    finally { setSaving(""); }
  };

  if (!loaded) return <div role="status" style={{ padding: 32 }}>Checking access…</div>;
  if (role !== "SUPER_ADMIN") return <div role="alert" style={{ padding: 60, color: "var(--red)" }}>Access denied — source registration and release decisions require SUPER_ADMIN.</div>;

  const fieldStyle = { display: "grid", gap: 5, fontSize: 11, color: "var(--text2)" } as const;
  const inputStyle = { width: "100%" } as const;
  const ruleOptions = rules.map((rule) => (
    <option key={rule.rule_id} value={rule.rule_id}>{rule.rule_id} — {rule.rule_name}</option>
  ));
  const mappingOptions = mappings.map((mapping) => (
    <option key={mapping.mapping_id} value={mapping.mapping_id}>
      {mapping.rule_id} · {mapping.mapping_kind} · {mapping.provision_citation}
    </option>
  ));

  return (
    <div style={{ padding: 24, maxWidth: 1480, margin: "0 auto" }}>
      <header style={{ marginBottom: 18 }}>
        <div className="font-garamond" style={{ fontSize: 24, color: "var(--nlc-white)" }}>Legal Source & Release Governance</div>
        <p style={{ fontSize: 12, color: "var(--text3)", lineHeight: 1.6, maxWidth: 950 }}>
          Record official source versions, map exact rule propositions to provisions, define deterministic deadlines and record authenticated product-owner release decisions. All writes use your signed SUPER_ADMIN identity and are append-only.
        </p>
      </header>

      <div role="note" style={{ padding: 13, marginBottom: 16, border: "1px solid #D6B66A55", borderLeft: "3px solid #C9A84C", borderRadius: 7, background: "#C9A84C10", color: "var(--text2)", fontSize: 12, lineHeight: 1.6 }}>
        **Product-owner approval releases product operations only.** It does not set the separate legal-verification field to VERIFIED. Source URLs registered here are references; this screen does not fetch or archive bytes. Do not claim an immutable source artifact unless the artifact capture pipeline has verified its bytes.
      </div>
      {error && <div role="alert" className="nlc-card" style={{ marginBottom: 12, color: "var(--red)" }}>{error}</div>}
      {notice && <div role="status" className="nlc-card" style={{ marginBottom: 12, color: "var(--teal)" }}>{notice}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 14 }}>
        <form className="nlc-card" onSubmit={submitSource} style={{ display: "grid", gap: 10 }}>
          <div className="sec-lbl gold">1 · Register authoritative source</div>
          <label style={fieldStyle}>Stable source key<input className="nlc-input" style={inputStyle} value={sourceForm.source_key} onChange={(e)=>setSourceForm({...sourceForm,source_key:e.target.value})} required minLength={3} /></label>
          <label style={fieldStyle}>Instrument title<input className="nlc-input" style={inputStyle} value={sourceForm.instrument_title} onChange={(e)=>setSourceForm({...sourceForm,instrument_title:e.target.value})} required /></label>
          <label style={fieldStyle}>Issuing authority<input className="nlc-input" style={inputStyle} value={sourceForm.issuing_authority} onChange={(e)=>setSourceForm({...sourceForm,issuing_authority:e.target.value})} required /></label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <label style={fieldStyle}>Instrument type<select className="nlc-input" value={sourceForm.instrument_type} onChange={(e)=>setSourceForm({...sourceForm,instrument_type:e.target.value})}><option>ACT</option><option>ORDINANCE</option><option>RULES</option><option>REGULATION</option><option>CODE</option><option>GAZETTE</option><option>SRO</option><option>DIRECTIVE</option><option>OTHER</option></select></label>
            <label style={fieldStyle}>Jurisdiction<input className="nlc-input" value={sourceForm.jurisdiction} onChange={(e)=>setSourceForm({...sourceForm,jurisdiction:e.target.value.toUpperCase()})} required /></label>
          </div>
          <label style={fieldStyle}>Official HTTPS URL<input className="nlc-input" type="url" style={inputStyle} value={sourceForm.official_url} onChange={(e)=>setSourceForm({...sourceForm,official_url:e.target.value})} required /></label>
          <label style={fieldStyle}>Citation / instrument number<input className="nlc-input" style={inputStyle} value={sourceForm.citation} onChange={(e)=>setSourceForm({...sourceForm,citation:e.target.value})} required /></label>
          <label style={fieldStyle}>Version label (date or amendment chain)<input className="nlc-input" style={inputStyle} value={sourceForm.version_label} onChange={(e)=>setSourceForm({...sourceForm,version_label:e.target.value})} required /></label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
            <label style={fieldStyle}>Published<input className="nlc-input" type="date" value={sourceForm.publication_date} onChange={(e)=>setSourceForm({...sourceForm,publication_date:e.target.value})} /></label>
            <label style={fieldStyle}>Effective from<input className="nlc-input" type="date" value={sourceForm.effective_from} onChange={(e)=>setSourceForm({...sourceForm,effective_from:e.target.value})} /></label>
            <label style={fieldStyle}>Effective to<input className="nlc-input" type="date" value={sourceForm.effective_to} onChange={(e)=>setSourceForm({...sourceForm,effective_to:e.target.value})} /></label>
          </div>
          <p style={{ fontSize: 10, color: "var(--text3)" }}>No artifact upload is performed by this form. Registration is recorded as REFERENCE_ONLY until a real capture/hash pipeline is used.</p>
          <button className="nlc-btn-gold" type="submit" disabled={saving !== ""}>{saving === "source" ? "Registering…" : "Register source reference"}</button>
        </form>

        <form className="nlc-card" onSubmit={submitMapping} style={{ display: "grid", gap: 10 }}>
          <div className="sec-lbl gold">2 · Map rule to exact provision</div>
          <label style={fieldStyle}>Rule<select className="nlc-input" value={mappingForm.rule_id} onChange={(e)=>setMappingForm({...mappingForm,rule_id:e.target.value})} required>{ruleOptions}</select></label>
          <label style={fieldStyle}>Source version<select className="nlc-input" value={mappingForm.source_id} onChange={(e)=>setMappingForm({...mappingForm,source_id:e.target.value})} required>{sources.map((source)=><option key={source.source_id} value={source.source_id}>{source.instrument_title} · {source.version_label}</option>)}</select></label>
          <label style={fieldStyle}>Mapping purpose<select className="nlc-input" value={mappingForm.mapping_kind} onChange={(e)=>setMappingForm({...mappingForm,mapping_kind:e.target.value})}><option value="RULE_BASIS">Rule basis</option><option value="DEADLINE_BASIS">Deadline basis</option><option value="PENALTY_BASIS">Penalty basis</option></select></label>
          <label style={fieldStyle}>Exact provision / paragraph / condition<textarea className="nlc-input" rows={3} value={mappingForm.provision_citation} onChange={(e)=>setMappingForm({...mappingForm,provision_citation:e.target.value})} required minLength={3} /></label>
          <label style={fieldStyle}>Mapping rationale / proposition<textarea className="nlc-input" rows={4} value={mappingForm.rationale} onChange={(e)=>setMappingForm({...mappingForm,rationale:e.target.value})} required minLength={10} /></label>
          <button className="nlc-btn-gold" type="submit" disabled={saving !== "" || sources.length === 0 || rules.length === 0}>{saving === "mapping" ? "Mapping…" : "Register rule/source mapping"}</button>
        </form>

        <form className="nlc-card" onSubmit={submitDeadline} style={{ display: "grid", gap: 10 }}>
          <div className="sec-lbl gold">3 · Define deterministic deadline</div>
          <label style={fieldStyle}>Deadline-basis mapping<select className="nlc-input" value={deadlineForm.mapping_id} onChange={(e)=>setDeadlineForm({...deadlineForm,mapping_id:e.target.value})} required>{mappings.filter((m)=>m.mapping_kind==="DEADLINE_BASIS").map((m)=><option key={m.mapping_id} value={m.mapping_id}>{m.rule_id} · {m.provision_citation}</option>)}</select></label>
          <label style={fieldStyle}>Event type<select className="nlc-input" value={deadlineForm.event_type} onChange={(e)=>setDeadlineForm({...deadlineForm,event_type:e.target.value})}>{EVENT_TYPES.map((value)=><option key={value}>{value}</option>)}</select></label>
          <label style={fieldStyle}>Deadline title<input className="nlc-input" value={deadlineForm.title} onChange={(e)=>setDeadlineForm({...deadlineForm,title:e.target.value})} required /></label>
          <label style={fieldStyle}>Trigger fact key<input className="nlc-input" value={deadlineForm.trigger_fact_key} onChange={(e)=>setDeadlineForm({...deadlineForm,trigger_fact_key:e.target.value})} placeholder="e.g. incorporation_date" required /></label>
          <label style={fieldStyle}>Period label<input className="nlc-input" value={deadlineForm.period_label} onChange={(e)=>setDeadlineForm({...deadlineForm,period_label:e.target.value})} placeholder="e.g. FIRST_AGM_AFTER_INCORPORATION" required /></label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
            <label style={fieldStyle}>Offset<input className="nlc-input" type="number" min="0" value={deadlineForm.offset} onChange={(e)=>setDeadlineForm({...deadlineForm,offset:e.target.value})} required /></label>
            <label style={fieldStyle}>Unit<select className="nlc-input" value={deadlineForm.unit} onChange={(e)=>setDeadlineForm({...deadlineForm,unit:e.target.value})}><option>DAYS</option><option>CLEAR_DAYS</option><option>MONTHS</option><option>YEARS</option></select></label>
            <label style={fieldStyle}>Adjustment<select className="nlc-input" value={deadlineForm.adjustment} onChange={(e)=>setDeadlineForm({...deadlineForm,adjustment:e.target.value})}><option>NONE</option><option>FOLLOWING</option><option>PRECEDING</option></select></label>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <label style={fieldStyle}>Rule effective from<input className="nlc-input" type="date" value={deadlineForm.effective_from} onChange={(e)=>setDeadlineForm({...deadlineForm,effective_from:e.target.value})} required /></label>
            <label style={fieldStyle}>Rule effective to<input className="nlc-input" type="date" value={deadlineForm.effective_to} onChange={(e)=>setDeadlineForm({...deadlineForm,effective_to:e.target.value})} /></label>
          </div>
          <label style={{ ...fieldStyle, display: "flex", alignItems: "center", gap: 8 }}>
            <input type="checkbox" checked={deadlineForm.exclude_trigger_day} onChange={(e)=>setDeadlineForm({...deadlineForm,exclude_trigger_day:e.target.checked})} /> Exclude trigger day
          </label>
          <p style={{ fontSize: 10, color: "var(--text3)" }}>Deadline definitions start as REGISTERED_NOT_RELEASED. Holidays are not inferred; add a versioned holiday source before using holiday adjustments.</p>
          <button className="nlc-btn-gold" type="submit" disabled={saving !== "" || !deadlineForm.mapping_id}>{saving === "deadline" ? "Registering…" : "Register deadline definition"}</button>
        </form>

        <form className="nlc-card" onSubmit={submitDecision} style={{ display: "grid", gap: 10 }}>
          <div className="sec-lbl gold">4 · Product-owner release decision</div>
          <label style={fieldStyle}>Rule<select className="nlc-input" value={decisionForm.rule_id} onChange={(e)=>setDecisionForm({...decisionForm,rule_id:e.target.value})} required>{ruleOptions}</select></label>
          <label style={fieldStyle}>Rule/source mapping<select className="nlc-input" value={decisionForm.mapping_id} onChange={(e)=>setDecisionForm({...decisionForm,mapping_id:e.target.value})} required>{mappings.filter((m)=>m.rule_id===decisionForm.rule_id).map((m)=><option key={m.mapping_id} value={m.mapping_id}>{m.mapping_kind} · {m.provision_citation}</option>)}</select></label>
          <label style={fieldStyle}>Release scope<select className="nlc-input" value={decisionForm.release_scope} onChange={(e)=>setDecisionForm({...decisionForm,release_scope:e.target.value,deadline_definition_id:""})}><option value="SCORING">Scoring</option><option value="DEADLINE">Deadline</option></select></label>
          {decisionForm.release_scope==="DEADLINE" && <label style={fieldStyle}>Deadline definition<select className="nlc-input" value={decisionForm.deadline_definition_id} onChange={(e)=>setDecisionForm({...decisionForm,deadline_definition_id:e.target.value})} required>{definitions.filter((d)=>d.rule_id===decisionForm.rule_id).map((d)=><option key={d.definition_id} value={d.definition_id}>{d.title} · {d.period_label}</option>)}</select></label>}
          <label style={fieldStyle}>Decision<select className="nlc-input" value={decisionForm.decision} onChange={(e)=>setDecisionForm({...decisionForm,decision:e.target.value})}><option value="APPROVED">Approve product workflow</option><option value="REVOKED">Revoke product workflow</option></select></label>
          <label style={fieldStyle}>Reason — this is part of the permanent audit ledger<textarea className="nlc-input" rows={4} value={decisionForm.reason} onChange={(e)=>setDecisionForm({...decisionForm,reason:e.target.value})} required minLength={10} /></label>
          <p style={{ fontSize: 10, color: "var(--text3)" }}>This creates PRODUCT_OWNER_APPROVED / REVOKED. It never changes legal_rules.verification_status to VERIFIED.</p>
          <button className="nlc-btn-gold" type="submit" disabled={saving !== "" || !decisionForm.mapping_id || (decisionForm.release_scope==="DEADLINE" && !decisionForm.deadline_definition_id)}>{saving === "decision" ? "Recording…" : "Record product-owner decision"}</button>
        </form>
      </div>

      <section className="nlc-card" style={{ marginTop: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div className="sec-lbl gold" style={{ border: "none", padding: 0, margin: 0 }}>Registered source and deadline inventory</div>
          <button type="button" className="nlc-btn-ghost" onClick={()=>void load()} disabled={loading}>{loading ? "Refreshing…" : "Refresh"}</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 8, marginBottom: 14 }}>
          {[[ "Sources", sources.length ],[ "Mappings", mappings.length ],[ "Deadline definitions", definitions.length ],[ "Release events", events.length ]].map(([label,value])=>(
            <div key={String(label)} style={{ padding: 10, border: "1px solid var(--border)", borderRadius: 7 }}>
              <div className="font-garamond" style={{ fontSize: 22, color: "var(--teal)" }}>{value}</div>
              <div style={{ fontSize: 10, color: "var(--text3)" }}>{label}</div>
            </div>
          ))}
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="nlc-table" style={{ minWidth: 1000 }}>
            <thead><tr><th>Sequence</th><th>Event</th><th>Rule</th><th>Scope / Decision</th><th>Actor</th><th>Recorded</th><th>Hash</th></tr></thead>
            <tbody>{events.slice(0,100).map((event)=>(
              <tr key={event.event_id}>
                <td className="font-mono">{event.sequence_no}</td>
                <td>{event.event_type}</td>
                <td className="font-mono">{event.rule_id || "—"}</td>
                <td>{[event.release_scope,event.decision].filter(Boolean).join(" / ") || "—"}</td>
                <td className="font-mono">{event.actor_id?.slice(0,8) || "—"}</td>
                <td className="font-mono">{event.created_at}</td>
                <td className="font-mono">{event.event_hash?.slice(0,12)}…</td>
              </tr>
            ))}</tbody>
          </table>
          {events.length===0 && <p style={{ padding: 14, color: "var(--text3)", fontSize: 12 }}>No provenance or release events recorded yet.</p>}
        </div>
      </section>
    </div>
  );
}
