"use client";
import { useEffect, useState } from "react";
import { getValidAccessToken } from "@/lib/auth";

interface RJSCFormRef {
  form_code: string;
  form_number: string;
  form_name: string;
  section: string;
  rule_id: string;
  deadline_days: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://nlc-platform.onrender.com";

export default function RJSCPage() {
  const [forms, setForms] = useState<RJSCFormRef[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRjscForms() {
      try {
        const token = await getValidAccessToken();
        if (!token) throw new Error("Not authenticated");
        const res = await fetch(`${API_URL}/api/v1/rjsc-forms/reference`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch RJSC forms");
        const data = await res.json();
        setForms(data.forms || []);
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
      <h2 className="text-xl font-bold mb-4">RJSC Statutory Forms ({forms.length})</h2>
      <div className="grid gap-4">
        {forms.map((form, index) => (
          <div key={index} className="border p-4 rounded shadow-sm">
            <h3 className="font-semibold">Form {form.form_number} — {form.form_name}</h3>
            <p className="text-sm text-gray-600">
              {form.section} | Rule: {form.rule_id} | Deadline: {form.deadline_days} days
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
