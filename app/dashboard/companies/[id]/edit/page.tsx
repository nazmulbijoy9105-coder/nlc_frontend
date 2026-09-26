"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { companiesApi } from "@/lib/api";

export default function EditCompanyPage() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<any>({});

  useEffect(() => {
    if (!id) return;
    companiesApi.get(id as string)
      .then((c: any) => {
        setForm({
          company_name: c.company_name || "",
          registration_number: c.registration_number || "",
          registered_address: c.registered_address || "",
          company_type: c.company_type || "",
          financial_year_end: c.financial_year_end || "",
          industry_sector: c.industry_sector || "",
          tin_number: c.tin_number || "",
          authorized_capital_bdt: c.authorized_capital_bdt || "",
          paid_up_capital_bdt: c.paid_up_capital_bdt || "",
        });
        setLoading(false);
      })
      .catch((err: any) => {
        setError(err.message || "Failed to load company");
        setLoading(false);
      });
  }, [id]);

  const handleChange = (field: string, value: string) => {
    setForm((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await companiesApi.update(id as string, form);
      router.push("/dashboard/companies");
    } catch (err: any) {
      setError(err.message || "Failed to update company");
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: 40, textAlign: "center" }}>Loading...</div>;

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 40 }}>
      <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 24 }}>Edit Company</h1>
      {error && <div style={{ color: "#e07070", padding: 12, marginBottom: 16, borderRadius: 4, background: "rgba(224,112,112,0.1)" }}>{error}</div>}
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 500, color: "#374151" }}>Company Name</label>
          <input value={form.company_name || ""} onChange={(e) => handleChange("company_name", e.target.value)}
            style={{ width: "100%", padding: 8, marginTop: 4, borderRadius: 4, border: "1px solid #d1d5db", fontSize: 13 }} />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 500, color: "#374151" }}>Registration Number</label>
          <input value={form.registration_number || ""} onChange={(e) => handleChange("registration_number", e.target.value)}
            style={{ width: "100%", padding: 8, marginTop: 4, borderRadius: 4, border: "1px solid #d1d5db", fontSize: 13 }} disabled />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 500, color: "#374151" }}>Registered Address</label>
          <input value={form.registered_address || ""} onChange={(e) => handleChange("registered_address", e.target.value)}
            style={{ width: "100%", padding: 8, marginTop: 4, borderRadius: 4, border: "1px solid #d1d5db", fontSize: 13 }} />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 500, color: "#374151" }}>Company Type</label>
          <input value={form.company_type || ""} onChange={(e) => handleChange("company_type", e.target.value)}
            style={{ width: "100%", padding: 8, marginTop: 4, borderRadius: 4, border: "1px solid #d1d5db", fontSize: 13 }} />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 500, color: "#374151" }}>Financial Year End</label>
          <input type="date" value={form.financial_year_end || ""} onChange={(e) => handleChange("financial_year_end", e.target.value)}
            style={{ width: "100%", padding: 8, marginTop: 4, borderRadius: 4, border: "1px solid #d1d5db", fontSize: 13 }} />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 500, color: "#374151" }}>Industry Sector</label>
          <input value={form.industry_sector || ""} onChange={(e) => handleChange("industry_sector", e.target.value)}
            style={{ width: "100%", padding: 8, marginTop: 4, borderRadius: 4, border: "1px solid #d1d5db", fontSize: 13 }} />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 500, color: "#374151" }}>TIN Number</label>
          <input value={form.tin_number || ""} onChange={(e) => handleChange("tin_number", e.target.value)}
            style={{ width: "100%", padding: 8, marginTop: 4, borderRadius: 4, border: "1px solid #d1d5db", fontSize: 13 }} />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 500, color: "#374151" }}>Authorized Capital (BDT)</label>
          <input type="number" value={form.authorized_capital_bdt || ""} onChange={(e) => handleChange("authorized_capital_bdt", e.target.value)}
            style={{ width: "100%", padding: 8, marginTop: 4, borderRadius: 4, border: "1px solid #d1d5db", fontSize: 13 }} />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 500, color: "#374151" }}>Paid-up Capital (BDT)</label>
          <input type="number" value={form.paid_up_capital_bdt || ""} onChange={(e) => handleChange("paid_up_capital_bdt", e.target.value)}
            style={{ width: "100%", padding: 8, marginTop: 4, borderRadius: 4, border: "1px solid #d1d5db", fontSize: 13 }} />
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
          <button type="submit" disabled={saving}
            style={{ padding: "10px 24px", borderRadius: 4, border: "none", background: saving ? "#9ca3af" : "#1e3a5f", color: "#fff", fontSize: 13, cursor: saving ? "not-allowed" : "pointer" }}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
          <button type="button" onClick={() => router.push("/dashboard/companies")}
            style={{ padding: "10px 24px", borderRadius: 4, border: "1px solid #d1d5db", background: "#fff", color: "#374151", fontSize: 13, cursor: "pointer" }}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
