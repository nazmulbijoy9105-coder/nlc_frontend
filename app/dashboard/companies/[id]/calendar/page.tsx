"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { ApiError, calendarApi } from "@/lib/api";

interface CalendarEvent {
  id: string;
  title: string;
  event_type: string;
  due_date: string;
  status: string;
  period_label: string;
  description: string | null;
  statutory_basis: string | null;
  legal_rule_id: string | null;
  legal_source_version: string | null;
}

export default function CompanyCalendarPage() {
  const params = useParams<{ id: string }>();
  const companyId = params.id;
  const activeCompanyId = useRef(companyId);
  const requestVersion = useRef(0);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [legalReviewPending, setLegalReviewPending] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => { activeCompanyId.current = companyId; }, [companyId]);

  const fetchCalendar = useCallback(async () => {
    if (!companyId) return;
    const version = ++requestVersion.current;
    setLoading(true);
    setError(null);
    try {
      const data = await calendarApi.list(companyId, 365);
      if (!data || !Array.isArray(data.events)) throw new Error("Calendar service returned an unexpected response.");
      if (version !== requestVersion.current || activeCompanyId.current !== companyId) return;
      setEvents(data.events);
      setLegalReviewPending(false);
    } catch (err) {
      if (version === requestVersion.current && activeCompanyId.current === companyId) {
        const expectedLegalGate = err instanceof ApiError
          && err.status === 503
          && err.message.startsWith("Statutory calendar is unavailable pending rule-level legal validation");
        if (expectedLegalGate) {
          setLegalReviewPending(true);
          setEvents([]);
        } else {
          setError(err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Could not load calendar.");
        }
      }
    } finally { if (version === requestVersion.current && activeCompanyId.current === companyId) setLoading(false); }
  }, [companyId]);

  useEffect(() => { void Promise.resolve().then(fetchCalendar); }, [fetchCalendar, retry]);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      await calendarApi.generate(companyId, 3);
      await fetchCalendar();
    } catch (err) {
      const expectedLegalGate = err instanceof ApiError
        && err.status === 503
        && err.message.startsWith("Statutory calendar is unavailable pending rule-level legal validation");
      if (expectedLegalGate) setLegalReviewPending(true);
      else setError(err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Could not generate calendar.");
    } finally { setGenerating(false); }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-800">Proactive Compliance Calendar</h1>
        {!legalReviewPending && <button type="button" onClick={() => void handleGenerate()} disabled={generating || loading}
          className="rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:opacity-50">
          {generating ? "Generating…" : "Generate Next 3 Years"}
        </button>}
      </div>
      {legalReviewPending && <div role="status" className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-950">
        <h2 className="font-semibold">Statutory calendar is withheld pending legal approval</h2>
        <p className="mt-2 text-sm">NLC has not released the approved event catalogue. No statutory dates are generated or displayed here. This does not mean the company has no filing obligations; obtain advice from qualified Bangladesh counsel and use verified source documents.</p>
      </div>}
      {error && <div role="alert" className="mb-4 rounded bg-red-50 p-3 text-red-700">
        <p>{error}</p><button type="button" onClick={() => setRetry((value)=>value+1)} className="mt-2 underline">Retry loading</button>
      </div>}
      {loading ? <p role="status" className="text-gray-500">Loading compliance calendar…</p> : (
        <div className="space-y-4">
          {events.length === 0 ? <div className="rounded-lg bg-white p-4 text-gray-500 shadow">
            {legalReviewPending ? "Calendar entries are withheld until the legal release gate is satisfied." : "No approved calendar events are currently available."}
          </div> : events.map((event)=>(
            <article key={`${event.event_type}:${event.due_date}:${event.title}`} className="rounded-lg border-l-4 border-blue-500 bg-white p-4 shadow">
              <div className="flex items-start justify-between gap-4">
                <div><h2 className="font-semibold text-gray-900">{event.title}</h2>
                  <p className="mt-1 text-sm text-gray-600">Due: {new Date(event.due_date).toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"})}</p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium">{event.status || "Scheduled"}</span>
              </div>
              <p className="mt-2 text-xs text-gray-600">{event.description}</p><p className="mt-3 text-xs text-gray-500"><strong>Statutory basis:</strong> {event.statutory_basis || "Not recorded"}</p>
              {(event.legal_rule_id || event.legal_source_version) && <p className="mt-2 text-xs text-gray-500">Rule: {event.legal_rule_id || "Not recorded"} · Source version: {event.legal_source_version || "Not recorded"}</p>}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
