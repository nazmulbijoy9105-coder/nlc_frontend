const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://nlc-platform.onrender.com";

class ApiClient {
  private baseUrl: string;
  constructor(baseUrl: string) { this.baseUrl = baseUrl; }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("access_token");
      if (token) headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
  }

  async get<T>(path: string): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, { method: "GET", headers: this.getHeaders(), credentials: "include" });
    if (!res.ok) { const err = await res.json().catch(() => ({ detail: "Request failed" })); throw new Error(err.detail || `HTTP ${res.status}`); }
    return res.json();
  }
}
export const api = new ApiClient(process.env.NEXT_PUBLIC_API_URL || "https://nlc-platform.onrender.com");
