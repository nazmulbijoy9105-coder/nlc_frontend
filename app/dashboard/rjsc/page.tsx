"use client";

import { useEffect, useState } from "react";
import { ApiError, api } from "@/lib/api";
import { getUser } from "@/lib/auth";

interface RJSCFormRef {
  form_code: string;
  form_number: string;
  form_name: string;
  section_reference: string;
  related_rule_id: string | null;
  deadline_days?: number | null;
}

interface RJSCReferenceResponse {
  forms: RJSCFormRef[];
  total: number;
}

export default function RJSCPage() {
  const [isSuperAdmin] = useState(() => {
    if (typeof window === "undefined") return false;
    return getUser()?.role === "SUPER_ADMIN";
  });
  const [forms, setForms] = useState<RJSCFormRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (!isSuperAdmin) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    const controller = new AbortController();
    async function fetchRjscForms() {
      setLoading(true);
      setError(null);
      try {
        const data = await api.get<RJSCReferenceResponse>("/api/v1/rjsc-forms/reference");
        if (!data || !Array.isArray(data.forms)) throw new Error("RJSC service returned an invalid forms response.");
        if (!cancelled) setForms(data.forms);
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Could not load RJSC references.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void fetchRjscForms();
    return () => { cancelled = true; controller.abort(); };
  }, [isSuperAdmin, retry]);

  if (!isSuperAdmin) return (
    <div className="p-8" role="alert">
      <h1 className="text-xl font-semibold">Access restricted</h1>
      <p className="mt-2 text-sm text-gray-600">RJSC form reference administration is restricted to Super Administrators.</p>
    </div>
  );

  return (
    <div className="p-6">
      <h1 className="mb-4 text-xl font-bold">RJSC Statutory Forms ({forms.length})</h1>
      {error && <div role="alert" className="mb-4 rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        <p>{error}</p>
        <button type="button" onClick={() => setRetry((value) => value + 1)} className="mt-2 underline">Retry</button>
      </div>}
      {loading ? <p role="status">Loading RJSC forms…</p> : forms.length === 0 ? (
        <p className="rounded border p-4 text-sm text-gray-600">No RJSC reference forms are currently available.</p>
      ) : (
        <div className="grid gap-4">
          {forms.map((form) => (
            <article key={form.form_code} className="rounded border p-4 shadow-sm">
              <h2 className="font-semibold">Form {form.form_number} — {form.form_name}</h2>
              <p className="mt-1 text-sm text-gray-600">
                {form.section_reference || "Statutory section not recorded"}
                {form.related_rule_id ? ` | Rule: ${form.related_rule_id}` : ""}
                {typeof form.deadline_days === "number" ? ` | Deadline: ${form.deadline_days} days` : ""}
              </p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
