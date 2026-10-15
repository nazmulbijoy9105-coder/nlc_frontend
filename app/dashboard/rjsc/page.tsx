"use client";

import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function RJSCPage() {
  const [forms, setForms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRjscForms() {
      try {
        const res = await fetch(`${API_URL}/api/v1/rjsc_forms`);
        if (!res.ok) throw new Error("Failed to fetch RJSC forms");
        const data = await res.json();
        setForms(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchRjscForms();
  }, []);

  if (loading) return <div className="p-4">Loading RJSC Forms...</div>;

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">RJSC Forms</h2>
      <div className="grid gap-4">
        {forms.length === 0 ? (
          <p>No RJSC forms found.</p>
        ) : (
          forms.map((form, index) => (
            <div key={index} className="border p-4 rounded shadow-sm">
              <h3 className="font-semibold">{form.name || form.title || `Form ${index + 1}`}</h3>
              <p className="text-sm text-gray-600">{form.description || "No description available"}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
