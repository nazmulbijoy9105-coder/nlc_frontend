"use client";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ApiError, api } from "@/lib/api";
import { getUser } from "@/lib/auth";

interface RJSCForm {
  id: string;
  form_code: string;
  form_number: string;
  form_name: string;
  section_reference: string;
  filing_status: string;
  due_date: string | null;
  filed_date: string | null;
  rjsc_receipt_number: string | null;
}

export default function CompanyFormsPage() {
  const params = useParams<{ id: string }>();
  const companyId = params.id;
  const [role] = useState(() => typeof window === "undefined" ? null : getUser()?.role ?? null);
  const canRecordFiling = ["ADMIN_STAFF","SUPER_ADMIN","LEGAL_STAFF"].includes(String(role));
  const [forms, setForms] = useState<RJSCForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [filedDates, setFiledDates] = useState<Record<string,string>>({});
  const [receipts, setReceipts] = useState<Record<string,string>>({});

  const fetchForms = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<RJSCForm[]>(`/api/v1/rjsc-forms/${encodeURIComponent(companyId)}/pending`);
      if (!Array.isArray(data)) throw new Error("RJSC filing service returned an unexpected response.");
      setForms(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Could not load RJSC forms.");
    } finally { setLoading(false); }
  }, [companyId]);

  useEffect(() => { void fetchForms(); }, [fetchForms]);

  const handleMarkFiled = async (formId: string) => {
    const filedDate = filedDates[formId];
    const receipt = receipts[formId]?.trim();
    if (!filedDate || !receipt) {
      setError("Enter the actual filing date and RJSC receipt/reference number before recording filing evidence.");
      return;
    }
    setBusyId(formId);
    setError(null);
    try {
      await api.patch(`/api/v1/rjsc-forms/${encodeURIComponent(formId)}/filed`, {
        filed_date: filedDate,
        rjsc_receipt_number: receipt,
        notes: "Receipt reference recorded by authorised NLC staff; receipt verification remains a separate step.",
      });
      await fetchForms();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Could not record filing evidence.");
    } finally { setBusyId(null); }
  };

  return (
    <div className="p-6">
      <h1 className="mb-2 text-2xl font-bold text-gray-800">RJSC Statutory Forms</h1>
      <p className="mb-6 text-sm text-gray-600">Recording a receipt reference is not independent verification that RJSC accepted or registered a filing.</p>
      {error && <div role="alert" className="mb-4 rounded bg-red-50 p-3 text-red-700">{error}</div>}
      {loading ? <p role="status" className="text-gray-500">Loading RJSC forms…</p> : (
        <div className="overflow-x-auto rounded-lg bg-white shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50"><tr>
              {["Form","Section","Due Date","Status",...(canRecordFiling?["Filing evidence"]:[])].map((heading)=><th key={heading} className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{heading}</th>)}
            </tr></thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {forms.length === 0 ? <tr><td colSpan={canRecordFiling?5:4} className="px-6 py-5 text-center text-gray-500">No pending RJSC forms were returned for this company.</td></tr> :
                forms.map((form)=>(
                  <tr key={form.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4"><div className="text-sm font-medium text-gray-900">Form {form.form_number}</div><div className="text-sm text-gray-500">{form.form_name}</div></td>
                    <td className="px-6 py-4 text-sm text-gray-500">{form.section_reference}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{form.due_date ? new Date(form.due_date).toLocaleDateString("en-GB") : "Not recorded"}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{form.filing_status}</td>
                    {canRecordFiling && <td className="min-w-64 px-6 py-4">
                      <div className="grid gap-2">
                        <label className="text-xs text-gray-600">Actual filed date
                          <input type="date" value={filedDates[form.id] || ""} onChange={(event)=>setFiledDates((old)=>({...old,[form.id]:event.target.value}))} className="mt-1 block w-full rounded border p-2 text-sm"/>
                        </label>
                        <label className="text-xs text-gray-600">RJSC receipt/reference number
                          <input value={receipts[form.id] || ""} onChange={(event)=>setReceipts((old)=>({...old,[form.id]:event.target.value}))} maxLength={100} className="mt-1 block w-full rounded border p-2 text-sm"/>
                        </label>
                        <button type="button" disabled={busyId===form.id} onClick={()=>void handleMarkFiled(form.id)} className="rounded bg-indigo-600 px-3 py-2 text-xs font-medium text-white disabled:opacity-50">
                          {busyId===form.id?"Saving…":"Record filing evidence"}
                        </button>
                      </div>
                    </td>}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
