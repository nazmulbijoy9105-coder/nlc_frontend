"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError, api } from "@/lib/api";

interface Notification {
  id: string;
  title: string;
  body: string;
  notification_type: string;
  status: string;
  days_until_deadline: number | null;
  created_at: string | null;
}

function asNotifications(value: unknown): Notification[] {
  if (!Array.isArray(value)) throw new Error("The notifications service returned an unexpected response.");
  return value.filter((item): item is Notification =>
    !!item && typeof item === "object" &&
    typeof (item as Notification).id === "string" &&
    typeof (item as Notification).title === "string"
  );
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<unknown>("/api/v1/notifications/?limit=50");
      setNotifications(asNotifications(data));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load notifications.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void Promise.resolve().then(fetchNotifications); }, [fetchNotifications]);

  const handleAcknowledge = async (id: string) => {
    setBusyId(id);
    setError(null);
    try {
      const result = await api.post<{ id: string; status: string }>(
        `/api/v1/notifications/${encodeURIComponent(id)}/acknowledge`
      );
      setNotifications((current) => current.map((item) =>
        item.id === id ? { ...item, status: result.status || "ACKNOWLEDGED" } : item
      ));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Could not acknowledge this notification.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-800">Compliance Notifications</h1>
        <button type="button" onClick={() => void fetchNotifications()} disabled={loading}
          className="rounded border border-gray-300 px-3 py-2 text-sm disabled:opacity-50">
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>
      {error && <div role="alert" className="mb-4 rounded bg-red-50 p-3 text-red-700">{error}</div>}
      {loading ? <p role="status" className="text-gray-500">Loading notifications…</p> : (
        <div className="space-y-4">
          {notifications.length === 0 ? (
            <div className="rounded-lg bg-white p-4 text-center text-gray-500 shadow">No notifications are available.</div>
          ) : notifications.map((notif) => (
            <article key={notif.id} className={`rounded-lg border-l-4 bg-white p-4 shadow ${notif.status === "ACKNOWLEDGED" ? "border-gray-300 opacity-70" : notif.days_until_deadline !== null && notif.days_until_deadline <= 7 ? "border-red-500" : "border-blue-500"}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h2 className="font-semibold text-gray-900">{notif.title}</h2>
                  <p className="mt-1 text-sm text-gray-600">{notif.body}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-gray-500">
                    <span>{notif.created_at ? new Date(notif.created_at).toLocaleString() : "Date unavailable"}</span>
                    {notif.days_until_deadline !== null && <span>{notif.days_until_deadline} days remaining</span>}
                  </div>
                </div>
                {notif.status !== "ACKNOWLEDGED" && (
                  <button type="button" onClick={() => void handleAcknowledge(notif.id)} disabled={busyId === notif.id}
                    className="shrink-0 rounded border border-blue-600 px-3 py-1 text-xs font-medium text-blue-700 disabled:opacity-50">
                    {busyId === notif.id ? "Saving…" : "Acknowledge"}
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
