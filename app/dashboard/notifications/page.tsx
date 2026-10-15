"use client";

import { useState, useEffect } from 'react';
import { getValidAccessToken } from '@/lib/auth';

interface Notification {
  id: string;
  title: string;
  body: string;
  notification_type: string;
  status: string;
  days_until_deadline: number | null;
  created_at: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const API_URL = process.env.NEXT_PUBLIC_API_BASE_PATH || "https://nlc-platform.onrender.com";

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const token = await getValidAccessToken();
      if (!token) throw new Error("Not authenticated");
      
      const res = await fetch(`${API_URL}/api/v1/notifications/?limit=50`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to fetch notifications");
      const data = await res.json();
      setNotifications(data || []);
    } catch (err) {
      setError("Could not load notifications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleAcknowledge = async (id: string) => {
    try {
      const token = await getValidAccessToken();
      if (!token) throw new Error("Not authenticated");
      
      const res = await fetch(`${API_URL}/api/v1/notifications/${id}/acknowledge`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error("Failed to acknowledge");
      
      // Update UI to mark as acknowledged
      setNotifications(notifications.map(n => n.id === id ? { ...n, status: 'ACKNOWLEDGED' } : n));
    } catch (err) {
      alert("Error acknowledging notification.");
    }
  };

  if (loading) return <div className="p-6 text-gray-500">Loading notifications...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Compliance Notifications</h1>
      
      {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-4">{error}</div>}

      <div className="space-y-4">
        {notifications.length === 0 ? (
          <div className="bg-white p-4 rounded-lg shadow text-gray-500 text-center">
            You're all caught up! No pending notifications.
          </div>
        ) : (
          notifications.map((notif) => (
            <div key={notif.id} className={`bg-white shadow rounded-lg p-4 border-l-4 ${
              notif.status === 'ACKNOWLEDGED' ? 'border-gray-300 opacity-60' : 
              notif.days_until_deadline !== null && notif.days_until_deadline <= 7 ? 'border-red-500' : 'border-blue-500'
            }`}>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{notif.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{notif.body}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-xs text-gray-500">
                      {new Date(notif.created_at).toLocaleString()}
                    </span>
                    {notif.days_until_deadline !== null && (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                        notif.days_until_deadline <= 7 ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {notif.days_until_deadline} days left
                      </span>
                    )}
                  </div>
                </div>
                {notif.status !== 'ACKNOWLEDGED' && (
                  <button 
                    onClick={() => handleAcknowledge(notif.id)}
                    className="ml-4 px-3 py-1 text-xs font-medium text-blue-600 border border-blue-600 rounded hover:bg-blue-50"
                  >
                    Acknowledge
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
