"use client";
import { useCallback, useEffect, useState } from "react";
import { ApiError, documentsApi } from "@/lib/api";

function toArray(value: unknown, key: string): any[] {
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object" && Array.isArray((value as Record<string, unknown>)[key])) {
    return (value as Record<string, any>)[key];
  }
  throw new Error("Document service returned an unexpected response.");
}

export default function DocumentsPage() {
  const [docs, setDocs] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [documentResponse, templateResponse] = await Promise.all([
        documentsApi.list(),
        documentsApi.templates(),
      ]);
      setDocs(toArray(documentResponse, "items"));
      setTemplates(toArray(templateResponse, "templates"));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Could not load documents.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load, retry]);

  return (
    <div style={{padding:24}}>
      <div className="font-garamond" style={{fontSize:22,color:"var(--nlc-white)",marginBottom:6}}>Document Engine</div>
      <div style={{fontSize:12,color:"var(--white-3)",marginBottom:18}}>Document records and available templates. Drafts require authorised human review before release.</div>
      <div role="note" className="nlc-card" style={{marginBottom:18,borderLeft:"4px solid var(--yellow)"}}>
        <strong>Workflow limitation:</strong> This screen does not offer document generation, approval or filing until the complete backend workflow, permissions, audit trail and export integrity have been verified. No prototype controls are presented as working functionality.
      </div>
      {error && <div role="alert" className="nlc-card" style={{marginBottom:16}}>
        <p style={{color:"var(--red)"}}>{error}</p>
        <button type="button" className="nlc-btn-ghost" onClick={() => setRetry((value)=>value+1)}>Retry</button>
      </div>}
      {loading ? <p role="status" style={{color:"var(--white-3)"}}>Loading documents and templates…</p> : (
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:14}}>
          <section className="nlc-card">
            <h2 className="sec-lbl gold">Stored documents ({docs.length})</h2>
            {docs.length === 0 ? <p style={{fontSize:12,color:"var(--text3)"}}>No documents are currently available.</p> : (
              <div style={{display:"grid",gap:10}}>
                {docs.map((doc,index)=>(
                  <article key={doc.id || doc.document_id || index} style={{borderBottom:"1px solid var(--border)",paddingBottom:10}}>
                    <div style={{fontSize:13,fontWeight:600,color:"var(--navy)"}}>{doc.title || doc.document_name || doc.template_code || "Untitled document"}</div>
                    <div style={{fontSize:11,color:"var(--text3)",marginTop:4}}>Status: {doc.status || "Not supplied"} · {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : "Date unavailable"}</div>
                  </article>
                ))}
              </div>
            )}
          </section>
          <section className="nlc-card">
            <h2 className="sec-lbl gold">Available templates ({templates.length})</h2>
            {templates.length === 0 ? <p style={{fontSize:12,color:"var(--text3)"}}>No document templates are currently available.</p> : (
              <ul style={{display:"grid",gap:10}}>
                {templates.map((template,index)=>(
                  <li key={template.template_code || template.id || index} style={{borderBottom:"1px solid var(--border)",paddingBottom:10}}>
                    <div style={{fontSize:13,fontWeight:600,color:"var(--navy)"}}>{template.template_name || template.name || template.title || template.template_code || "Unnamed template"}</div>
                    {template.description && <p style={{fontSize:11,color:"var(--text3)",marginTop:4}}>{template.description}</p>}
                    <span style={{fontSize:10,color:"var(--text3)"}}>{template.status || "Template metadata only"}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
