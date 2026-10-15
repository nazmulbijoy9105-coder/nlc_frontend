"use client";

import { useState, useEffect } from 'react';
import { getValidAccessToken } from '@/lib/auth';

interface CalendarEvent {
  id: string;
  title: string;
  event_type: string;
  due_date: string;
  status: string;
  statutory_basis: string;
}

export default function CompanyCalendarPage({ params }: { params: { id: string } }) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const companyId = params.id;
  const API_URL = process.env.NEXT_PUBLIC_API_BASE_PATH || "https://nlc-platform.onrender.com";

  const fetchCalendar = async () => {
    setLoading(true);
    try {
      const token = await getValidAccessToken();
      if (!token) throw new Error("Not authenticated");
      
      const res = await fetch(`${API_URL}/api/v1/calendar/companies/${companyId}?days_ahead=365`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to fetch calendar");
      const data = await res.json();
      setEvents(data.events || []);
    } catch (err) {
      setError("Could not load calendar.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (companyId) fetchCalendar();
  }, [companyId]);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const token = await getValidAccessToken();
      if (!token) throw new Error("Not authenticated");
      
      const res = await fetch(`${API_URL}/api/v1/calendar/companies/${companyId}/generate?years_ahead=3`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Generation failed");
      await fetchCalendar();
    } catch (err) {
      setError("Failed to generate calendar. Make sure you have admin privileges.");
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return <div className="p-6 text-gray-500">Loading compliance calendar...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Proactive Compliance Calendar</h1>
        <button 
          onClick={handleGenerate}
          disabled={generating}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {generating ? 'Generating...' : 'Generate Next 3 Years'}
        </button>
      </div>

      {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-4">{error}</div>}

      <div className="space-y-4">
        {events.length === 0 ? (
          <div className="bg-white p-4 rounded-lg shadow text-gray-500">
            No upcoming deadlines found. Click "Generate" to calculate the next 3 years of compliance deadlines based on the Companies Act 1994.
          </div>
        ) : (
          events.map((event) => (
            <div key={event.id} className="bg-white shadow rounded-lg p-4 border-l-4 border-blue-500">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Due: {new Date(event.due_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  event.status === 'OVERDUE' ? 'bg-red-100 text-red-800' : 
                  event.status === 'DUE_SOON' ? 'bg-yellow-100 text-yellow-800' : 
                  'bg-blue-100 text-blue-800'
                }`}>
                  {event.status.replace('_', ' ')}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-3"><span className="font-bold">Statutory Basis:</span> {event.statutory_basis}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
