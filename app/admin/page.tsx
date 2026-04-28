"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface User { id: number; email: string; first_name: string; last_name: string; role: string; }

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const API_BASE = "https://nlc-platform.onrender.com";

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) { router.push("/login"); return; }
    const parsed = JSON.parse(storedUser);
    if (parsed.role !== "admin") { router.push("/login"); return; }
    setUser(parsed);
    
    const token = localStorage.getItem("access_token");
    fetch(`${API_BASE}/api/v1/admin/users`, { headers: { "Authorization": `Bearer ${token}` } })
      .then(res => res.json()).then(setUsers).catch(() => {}).finally(() => setLoading(false));
  }, [router]);

  const logout = () => { localStorage.clear(); router.push("/login"); };

  if (loading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center"><div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="min-h-screen bg-slate-900">
      <header className="bg-slate-900/80 backdrop-blur-xl border-b border-white/5 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-white font-bold text-lg">Admin Panel</h1>
          <div className="flex items-center gap-4">
            <span className="text-white text-sm">{user?.email}</span>
            <button onClick={logout} className="px-4 py-2 text-sm text-slate-400 hover:text-white border border-white/10 rounded-lg">Logout</button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5"><h2 className="text-white font-semibold text-lg">Users ({users.length})</h2></div>
          <table className="w-full">
            <thead><tr className="border-b border-white/5"><th className="text-left text-xs font-medium text-slate-500 uppercase px-6 py-3">User</th><th className="text-left text-xs font-medium text-slate-500 uppercase px-6 py-3">Role</th></tr></thead>
            <tbody className="divide-y divide-white/5">
              {users.map((u) => (<tr key={u.id} className="hover:bg-white/5"><td className="px-6 py-4"><p className="text-white text-sm">{u.email}</p></td><td className="px-6 py-4"><span className={`text-xs px-2.5 py-1 rounded-full ${u.role === "admin" ? "bg-purple-500/20 text-purple-400" : "bg-slate-500/20 text-slate-400"}`}>{u.role}</span></td></tr>))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
