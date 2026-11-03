"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { articlesApi, authApi } from "@/lib/api"

type Verification = {
  id: string
  document_id: string
  source_checksum_sha256: string
  source_document_version: number
  status: string
  submitted_by: string
  submitted_at: string
  reviewed_by?: string | null
  reviewed_at?: string | null
  effective_from?: string | null
  quorum_variation_exists: boolean
  quorum_required?: number | null
  clause_reference?: string | null
  quorum_clause_text?: string | null
  reviewer_note?: string | null
  revoked_at?: string | null
  revocation_reason?: string | null
}

export default function ArticlesVerificationPage() {
  const params = useParams()
  const router = useRouter()
  const companyId = params.id as string
  const [items, setItems] = useState<Verification[]>([])
  const [events, setEvents] = useState<Record<string, any[]>>({})
  const [role, setRole] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [reviewForms, setReviewForms] = useState<Record<string, any>>({})
  const [revokeReasons, setRevokeReasons] = useState<Record<string, string>>({})

  const load = useCallback(async () => {
    if (!companyId) return
    try {
      const rows = await articlesApi.list(companyId)
      setItems(Array.isArray(rows) ? rows : [])
    } catch (err) {
      setError((err as Error).message || "Could not load Articles verification history")
    }
  }, [companyId])

  useEffect(() => {
    load()
    authApi.me().then((user: any) => setRole(String(user?.role || ""))).catch(() => setRole(""))
  }, [load])

  const uploadAndSubmit = async () => {
    if (!file) return
    setBusy(true); setError(""); setNotice("")
    try {
      const uploaded = await articlesApi.upload(companyId, file)
      const submitted = await articlesApi.submit(companyId, uploaded.document_id)
      setNotice("Source PDF uploaded and submitted for separate legal review. SHA-256: " + uploaded.checksum_sha256)
      setFile(null)
      await load()
      if (submitted?.id) await loadEvents(submitted.id)
    } catch (err) {
      setError((err as Error).message || "Upload or submission failed")
    } finally {
      setBusy(false)
    }
  }

  const updateReviewForm = (id: string, patch: Record<string, any>) => {
    setReviewForms((current) => ({
      ...current,
      [id]: { decision: "VERIFIED", effective_from: "", quorum_variation_exists: false, quorum_required: "", clause_reference: "", quorum_clause_text: "", reviewer_note: "", ...(current[id] || {}), ...patch },
    }))
  }

  const review = async (item: Verification) => {
    const form = reviewForms[item.id] || {}
    setBusy(true); setError(""); setNotice("")
    try {
      const body: any = {
        decision: form.decision || "VERIFIED",
        reviewer_note: form.reviewer_note || null,
      }
      if (body.decision === "VERIFIED") {
        body.effective_from = form.effective_from
        body.quorum_variation_exists = Boolean(form.quorum_variation_exists)
        body.quorum_required = form.quorum_variation_exists ? Number(form.quorum_required) : null
        body.clause_reference = form.clause_reference
        body.quorum_clause_text = form.quorum_variation_exists ? form.quorum_clause_text : null
      }
      const result = await articlesApi.review(companyId, item.id, body)
      setNotice("Review decision recorded: " + result.status)
      await load()
      await loadEvents(item.id)
    } catch (err) {
      setError((err as Error).message || "Review failed")
    } finally {
      setBusy(false)
    }
  }

  const revoke = async (item: Verification) => {
    setBusy(true); setError(""); setNotice("")
    try {
      await articlesApi.revoke(companyId, item.id, revokeReasons[item.id] || "")
      setNotice("Articles verification revoked. Historical decision and reason retained.")
      await load()
      await loadEvents(item.id)
    } catch (err) {
      setError((err as Error).message || "Revocation failed")
    } finally {
      setBusy(false)
    }
  }

  const loadEvents = async (verificationId: string) => {
    try {
      const rows = await articlesApi.events(companyId, verificationId)
      setEvents((current) => ({ ...current, [verificationId]: rows }))
    } catch (err) {
      setError((err as Error).message || "Could not load audit events")
    }
  }

  const card: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: 18, marginBottom: 14 }
  const field: React.CSSProperties = { width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 6, padding: "9px 10px", color: "var(--navy)", fontSize: 12 }
  const label: React.CSSProperties = { display: "block", fontSize: 10, color: "var(--text3)", marginBottom: 5, letterSpacing: ".06em", textTransform: "uppercase" }

  return (
    <div style={{ minHeight: "100%", padding: 24, background: "var(--surface2)", color: "var(--navy)", overflowY: "auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <div>
          <button className="nlc-btn-secondary" onClick={() => router.push("/dashboard/companies/" + companyId)}>← Company profile</button>
          <h1 style={{ fontFamily: "'DM Serif Display',serif", fontSize: 26, margin: "14px 0 4px" }}>Articles of Association</h1>
          <p style={{ color: "var(--text3)", fontSize: 12, margin: 0 }}>Source upload, version-pinned legal review, quorum clause record and revocation history.</p>
        </div>
        <span style={{ fontSize: 10, fontWeight: 700, border: "1px solid var(--border)", borderRadius: 6, padding: "7px 10px" }}>{role || "AUTHENTICATED USER"}</span>
      </div>

      {error && <div role="alert" style={{ ...card, borderColor: "#b91c1c", color: "#b91c1c" }}>{error}</div>}
      {notice && <div role="status" style={{ ...card, borderColor: "#1a7a52", color: "#1a7a52" }}>{notice}</div>}

      <section style={card}>
        <h2 style={{ fontSize: 15, margin: "0 0 8px" }}>Upload executed Articles PDF</h2>
        <p style={{ fontSize: 11, color: "var(--text3)", lineHeight: 1.6 }}>PDF only, maximum 20 MB. The server computes the SHA-256 checksum and stores the source privately. Uploading does not verify the document or its legal effect.</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
          <input type="file" accept="application/pdf,.pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} style={{ fontSize: 12, maxWidth: 360 }} />
          <button className="nlc-btn-primary" disabled={!file || busy} onClick={uploadAndSubmit}>{busy ? "Working…" : "Upload and submit for review"}</button>
        </div>
        {file && <div style={{ marginTop: 8, fontSize: 11, color: "var(--text3)" }}>{file.name} · {(file.size / 1024 / 1024).toFixed(2)} MB</div>}
      </section>

      <section style={card}>
        <h2 style={{ fontSize: 15, margin: "0 0 8px" }}>Legal review controls</h2>
        <p style={{ fontSize: 11, color: "var(--text3)", lineHeight: 1.6, margin: 0 }}>Only users with the LEGAL_STAFF role can verify or reject. The submitter cannot review their own submission. SUPER_ADMIN can revoke an active verification, but cannot approve it.</p>
      </section>

      {items.length === 0 ? <section style={card}><p style={{ color: "var(--text3)", fontSize: 12, margin: 0 }}>No Articles documents have been submitted for review.</p></section> : items.map((item) => {
        const form = reviewForms[item.id] || { decision: "VERIFIED", effective_from: "", quorum_variation_exists: false }
        const canReview = role === "LEGAL_STAFF" && item.status === "PENDING"
        const canRevoke = (role === "LEGAL_STAFF" || role === "SUPER_ADMIN") && item.status === "VERIFIED" && item.reviewed_by !== undefined
        return (
          <section key={item.id} style={card}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <div>
                <strong style={{ fontSize: 14 }}>Articles source · v{item.source_document_version}</strong>
                <div style={{ color: "var(--text3)", fontSize: 10, marginTop: 4 }}>Submitted {new Date(item.submitted_at).toLocaleString()} · {item.document_id}</div>
              </div>
              <span style={{ border: "1px solid var(--border)", borderRadius: 20, padding: "5px 10px", fontSize: 10, fontWeight: 800 }}>{item.status}</span>
            </div>
            <div style={{ marginTop: 12, fontSize: 10, color: "var(--text3)", overflowWrap: "anywhere" }}>SHA-256: {item.source_checksum_sha256}</div>
            {item.status !== "PENDING" && (
              <div style={{ marginTop: 12, padding: 12, background: "var(--surface2)", borderRadius: 7, fontSize: 11, lineHeight: 1.7 }}>
                <div>Effective from: <strong>{item.effective_from || "—"}</strong></div>
                <div>Quorum variation: <strong>{item.quorum_variation_exists ? "Yes" : "No / statutory default after review"}</strong></div>
                <div>Quorum required: <strong>{item.quorum_required ?? "Statutory default based on members at AGM"}</strong></div>
                <div>Clause: <strong>{item.clause_reference || "—"}</strong></div>
                {item.quorum_clause_text && <div style={{ marginTop: 6 }}>Clause text: {item.quorum_clause_text}</div>}
                {item.reviewer_note && <div style={{ marginTop: 6 }}>Reviewer note: {item.reviewer_note}</div>}
                {item.revocation_reason && <div style={{ marginTop: 6, color: "#b91c1c" }}>Revocation: {item.revocation_reason}</div>}
              </div>
            )}

            {canReview && (
              <div style={{ marginTop: 16, borderTop: "1px solid var(--border)", paddingTop: 14 }}>
                <h3 style={{ fontSize: 12, margin: "0 0 10px" }}>Review this submission</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 10 }}>
                  <label><span style={label}>Decision</span><select style={field} value={form.decision || "VERIFIED"} onChange={(e) => updateReviewForm(item.id, { decision: e.target.value })}><option value="VERIFIED">Verify</option><option value="REJECTED">Reject</option></select></label>
                  {form.decision !== "REJECTED" && <>
                    <label><span style={label}>Effective from</span><input type="date" style={field} value={form.effective_from || ""} onChange={(e) => updateReviewForm(item.id, { effective_from: e.target.value })} /></label>
                    <label><span style={label}>Quorum variation in Articles?</span><select style={field} value={form.quorum_variation_exists ? "yes" : "no"} onChange={(e) => updateReviewForm(item.id, { quorum_variation_exists: e.target.value === "yes" })}><option value="no">No — Section 85 default applies</option><option value="yes">Yes — alternative quorum clause</option></select></label>
                    {form.quorum_variation_exists && <>
                      <label><span style={label}>Alternative quorum number</span><input type="number" min="1" max="100" style={field} value={form.quorum_required || ""} onChange={(e) => updateReviewForm(item.id, { quorum_required: e.target.value })} /></label>
                      <label style={{ gridColumn: "1 / -1" }}><span style={label}>Exact quorum clause text</span><textarea style={{ ...field, minHeight: 90 }} value={form.quorum_clause_text || ""} onChange={(e) => updateReviewForm(item.id, { quorum_clause_text: e.target.value })} /></label>
                    </>}
                    <label><span style={label}>Clause reference</span><input style={field} value={form.clause_reference || ""} onChange={(e) => updateReviewForm(item.id, { clause_reference: e.target.value })} placeholder="e.g. Article 21(3)" /></label>
                  </>}
                  <label style={{ gridColumn: "1 / -1" }}><span style={label}>{form.decision === "REJECTED" ? "Reason for rejection (required)" : "Reviewer note"}</span><textarea style={{ ...field, minHeight: 70 }} value={form.reviewer_note || ""} onChange={(e) => updateReviewForm(item.id, { reviewer_note: e.target.value })} /></label>
                </div>
                <button className="nlc-btn-primary" disabled={busy} style={{ marginTop: 12 }} onClick={() => review(item)}>{busy ? "Saving…" : "Record legal review decision"}</button>
              </div>
            )}

            {canRevoke && (
              <div style={{ marginTop: 14, borderTop: "1px solid var(--border)", paddingTop: 12 }}>
                <label><span style={label}>Reason to revoke current verification</span><textarea style={{ ...field, minHeight: 65 }} value={revokeReasons[item.id] || ""} onChange={(e) => setRevokeReasons((v) => ({ ...v, [item.id]: e.target.value }))} /></label>
                <button className="nlc-btn-danger" disabled={busy || (revokeReasons[item.id] || "").trim().length < 10} onClick={() => revoke(item)} style={{ marginTop: 8 }}>Revoke verification</button>
              </div>
            )}

            <div style={{ marginTop: 12 }}>
              <button className="nlc-btn-secondary" onClick={() => loadEvents(item.id)}> {events[item.id] ? "Refresh audit history" : "Show audit history"} </button>
              {events[item.id] && <div style={{ marginTop: 8, background: "var(--surface2)", borderRadius: 7, padding: 10 }}>
                {events[item.id].map((event: any) => <div key={event.id} style={{ borderBottom: "1px solid var(--border)", padding: "7px 0", fontSize: 10 }}>
                  <strong>{event.action}</strong> · {event.previous_status || "—"} → {event.new_status} · {new Date(event.created_at).toLocaleString()}
                  {event.note && <div style={{ color: "var(--text3)", marginTop: 3 }}>{event.note}</div>}
                </div>)}
              </div>}
            </div>
          </section>
        )
      })}
    </div>
  )
}
