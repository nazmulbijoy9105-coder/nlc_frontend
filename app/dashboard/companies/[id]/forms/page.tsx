"use client";

import { useState, useEffect } from 'react';
import { getValidAccessToken } from '@/lib/auth';

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

export default function CompanyFormsPage({ params }: { params: { id: string } }) {
  const [forms, setForms] = useState<RJSCForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const companyId = params.id;
  const API_URL = process.env.NEXT_PUBLIC_API_BASE_PATH || "https://nlc-platform.onrender.com";

  const fetchForms = async () => {
    setLoading(true);
    try {
      const token = await getValidAccessToken();
      if (!token) throw new Error("Not authenticated");
      
      // Fetch pending forms to show what needs to be done
      const res = await fetch(`${API_URL}/api/v1/rjsc-forms/${companyId}/pending`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to fetch forms");
      const data = await res.json();
      setForms(data || []);
    } catch (err) {
      setError("Could not load RJSC forms.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (companyId) fetchForms();
  }, [companyId]);

  const handleMarkFiled = async (formId: string) => {
    // In a real app, you might open a modal here to input the receipt number.
    // For this sprint, we'll just mark it filed with today's date.
    try {
      const token = await getValidAccessToken();
      if (!token) throw new Error("Not authenticated");
      
      const res = await fetch(`${API_URL}/api/v1/rjsc-forms/${formId}/filed`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          filed_date: new Date().toISOString().split('T')[0], // today's date YYYY-MM-DD
          notes: "Marked as filed via dashboard"
        })
      });
      
      if (!res.ok) throw new Error("Failed to mark as filed");
      
      // Remove the filed form from the list
      setForms(forms.filter(f => f.id !== formId));
    } catch (err) {
      alert("Error marking form as filed. Make sure you have admin privileges.");
    }
  };

  if (loading) return <div className="p-6 text-gray-500">Loading RJSC forms...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">RJSC Statutory Forms</h1>
      
      {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-4">{error}</div>}

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Form</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Section</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {forms.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  No pending forms. All RJSC filings are up to date!
                </td>
              </tr>
            ) : (
              forms.map((form) => (
                <tr key={form.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">Form {form.form_number}</div>
                    <div className="text-sm text-gray-500">{form.form_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {form.section_reference}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {form.due_date ? new Date(form.due_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      form.filing_status === 'OVERDUE' ? 'bg-red-100 text-red-800' : 
                      form.filing_status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {form.filing_status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      onClick={() => handleMarkFiled(form.id)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Mark as Filed
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
