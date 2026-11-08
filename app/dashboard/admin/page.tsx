"use client";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { getUser } from "@/lib/auth";
import { ApiError, adminApi } from "@/lib/api";

export default function AdminPage() {
  const [user] = useState(() => typeof window === "undefined" ? null : getUser());
  const allowed = ["ADMIN_STAFF", "SUPER_ADMIN"].includes(String(user?.role || ""));
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(allowed);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ email: "", full_name: "", role: "CLIENT_DIRECTOR", password: "" });

  const load = useCallback(async () => {
    if (!allowed) return;
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.listUsers(1);
      if (!Array.isArray(data)) throw new Error("User management returned an unexpected response.");
      setUsers(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Could not load users.");
    } finally {
      setLoading(false);
    }
  }, [allowed]);

  useEffect(() => { if (allowed) void load(); }, [allowed, load]);

  const createUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await adminApi.createUser({
        ...form,
        email: form.email.trim().toLowerCase(),
        full_name: form.full_name.trim(),
      });
      setForm({ email: "", full_name: "", role: "CLIENT_DIRECTOR", password: "" });
      setShowCreate(false);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Could not create user.");
    } finally {
      setSaving(false);
    }
  };

  if (!allowed) return <div role="alert" style={{padding:60,textAlign:"center",color:"#B91C1C"}}>Access denied — user management is restricted to authorised administrators.</div>;

  return <div style={{padding:24}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,marginBottom:20}}>
      <div className="font-garamond" style={{fontSize:22,color:"#f4f1ea"}}>User Management</div>
      <button type="button" className="nlc-btn-gold" style={{width:"auto",padding:"8px 20px"}} onClick={()=>setShowCreate(value=>!value)}>{showCreate?"Close":"＋ Add User"}</button>
    </div>
    {error&&<div role="alert" className="nlc-card" style={{marginBottom:16,color:"#FCA5A5"}}>{error}</div>}
    {showCreate&&<form onSubmit={createUser} className="nlc-card" style={{display:"grid",gap:12,marginBottom:18,maxWidth:680}}>
      <h2 className="sec-lbl gold">Create user account</h2>
      <label style={{display:"grid",gap:5,fontSize:12}}>Full name
        <input className="nlc-input" value={form.full_name} onChange={event=>setForm({...form,full_name:event.target.value})} required minLength={2} maxLength={255}/>
      </label>
      <label style={{display:"grid",gap:5,fontSize:12}}>Email
        <input className="nlc-input" type="email" value={form.email} onChange={event=>setForm({...form,email:event.target.value})} required/>
      </label>
      <label style={{display:"grid",gap:5,fontSize:12}}>Role
        <select className="nlc-input" value={form.role} onChange={event=>setForm({...form,role:event.target.value})}>
          <option value="CLIENT_DIRECTOR">Client director</option>
          <option value="CLIENT_VIEW_ONLY">Client view only</option>
          <option value="LEGAL_STAFF">Legal staff</option>
          {user?.role==="SUPER_ADMIN"&&<option value="ADMIN_STAFF">Admin staff</option>}
        </select>
      </label>
      <label style={{display:"grid",gap:5,fontSize:12}}>Temporary password
        <input className="nlc-input" type="password" autoComplete="new-password" value={form.password} onChange={event=>setForm({...form,password:event.target.value})} required minLength={12}/>
      </label>
      <p style={{fontSize:11,color:"var(--text3)"}}>The backend enforces its password policy. SUPER_ADMIN accounts cannot be created through this form.</p>
      <button type="submit" className="nlc-btn-gold" disabled={saving}>{saving?"Creating…":"Create account"}</button>
    </form>}
    {loading?<p role="status" style={{padding:40,color:"rgba(255,255,255,.35)"}}>Loading users…</p>:<div className="nlc-card">
      <div className="sec-lbl gold">Users ({users.length})</div>
      <div style={{overflowX:"auto"}}><table className="nlc-table">
        <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th></tr></thead>
        <tbody>{users.length===0?<tr><td colSpan={4} style={{textAlign:"center",padding:30,color:"#9CA3AF"}}>No users found.</td></tr>:users.map(row=>(
          <tr key={row.id}>
            <td style={{fontWeight:600,color:"#07172B"}}>{row.full_name}</td>
            <td style={{color:"#4B5563"}}>{row.email}</td>
            <td><span className="badge badge-neutral">{row.role}</span></td>
            <td>{row.is_active?<span className="badge badge-green">Active</span>:<span className="badge badge-red">Inactive</span>}</td>
          </tr>
        ))}</tbody>
      </table></div>
    </div>}
  </div>;
}
