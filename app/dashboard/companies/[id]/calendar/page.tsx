"use client";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ApiError, api } from "@/lib/api";

interface CalendarEvent {
  id: string;
  title: string;
  event_type: string;
  due_date: string;
  status: string;
  statutory_basis: string;
}

export default function CompanyCalendarPage() {
  const params = useParams<{ id: string }>();
  const companyId = params.id;
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);

  const fetchCalendar = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<{ company_id: string; events: CalendarEvent[] }>(
        `/api/v1/calendar/companies/${encodeURIComponent(companyId)}?days_ahead=365`
      );
      if (!data || !Array.isArray(data.events)) throw new Error("Calendar service returned an unexpected response.");
      setEvents(data.events);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Could not load calendar.");
    } finally { setLoading(false); }
  }, [companyId]);

  useEffect(() => { void fetchCalendar(); }, [fetchCalendar, retry]);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      await api.post(`/api/v1/calendar/companies/${encodeURIComponent(companyId)}/generate?years_ahead=3`);
      await fetchCalendar();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Could not generate calendar.");
    } finally { setGenerating(false); }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-800">Proactive Compliance Calendar</h1>
        <button type="button" onClick={() => void handleGenerate()} disabled={generating || loading}
          className="rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:opacity-50">
          {generating ? "Generating…" : "Generate Next 3 Years"}
        </button>
      </div>
      {error && <div role="alert" className="mb-4 rounded bg-red-50 p-3 text-red-700">
        <p>{error}</p><button type="button" onClick={() => setRetry((value)=>value+1)} className="mt-2 underline">Retry loading</button>
      </div>}
      {loading ? <p role="status" className="text-gray-500">Loading compliance calendar…</p> : (
        <div className="space-y-4">
          {events.length === 0 ? <div className="rounded-lg bg-white p-4 text-gray-500 shadow">
            No calendar events are currently available. Use Generate to request the next three years of calendar events.
          </div> : events.map((event)=>(
            <article key={event.id} className="rounded-lg border-l-4 border-blue-500 bg-white p-4 shadow">
              <div className="flex items-start justify-between gap-4">
                <div><h2 className="font-semibold text-gray-900">{event.title}</h2>
                  <p className="mt-1 text-sm text-gray-600">Due: {new Date(event.due_date).toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"})}</p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium">{event.status.replace(/_/g," ")}</span>
              </div>
              <p className="mt-3 text-xs text-gray-500"><strong>Statutory basis:</strong> {event.statutory_basis || "Not recorded"}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
