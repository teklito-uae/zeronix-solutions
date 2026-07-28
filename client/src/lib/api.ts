import type {
  CatalogItem,
  Client,
  Company,
  DashboardStats,
  Enquiry,
  Quote,
  User,
} from "./types";

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

const STATE_CHANGING = new Set(["POST", "PUT", "PATCH", "DELETE"]);

async function ensureCsrfCookie() {
  if (getCookie("XSRF-TOKEN")) return;
  await fetch("/sanctum/csrf-cookie", { credentials: "include" });
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const method = (init?.method ?? "GET").toUpperCase();
  if (STATE_CHANGING.has(method)) {
    await ensureCsrfCookie();
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(init?.headers as Record<string, string> | undefined),
  };
  const xsrfToken = getCookie("XSRF-TOKEN");
  if (xsrfToken && STATE_CHANGING.has(method)) {
    headers["X-XSRF-TOKEN"] = xsrfToken;
  }

  const res = await fetch(`/api${path}`, {
    credentials: "include",
    ...init,
    headers,
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  auth: {
    me: () => req<User>("/me"),
    login: async (email: string, password: string) => {
      await ensureCsrfCookie();
      const { user } = await req<{ user: User }>("/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      return user;
    },
    logout: () => req<void>("/logout", { method: "POST" }),
  },
  company: {
    get: () => req<Company>("/company"),
    update: (data: Partial<Company>) =>
      req<Company>("/company", { method: "PUT", body: JSON.stringify(data) }),
  },
  clients: {
    list: (q = "") => req<Client[]>(`/clients?q=${encodeURIComponent(q)}`),
    create: (data: Partial<Client>) =>
      req<Client>("/clients", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: Partial<Client>) =>
      req<Client>(`/clients/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    remove: (id: number) => req<void>(`/clients/${id}`, { method: "DELETE" }),
  },
  catalog: {
    list: () => req<CatalogItem[]>("/catalog"),
    create: (data: Partial<CatalogItem>) =>
      req<CatalogItem>("/catalog", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: Partial<CatalogItem>) =>
      req<CatalogItem>(`/catalog/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    remove: (id: number) => req<void>(`/catalog/${id}`, { method: "DELETE" }),
  },
  quotes: {
    list: (q = "") => req<Quote[]>(`/quotes?q=${encodeURIComponent(q)}`),
    get: (id: number) => req<Quote>(`/quotes/${id}`),
    create: (data: { title?: string; client_id?: number | null; fromTemplate?: boolean }) =>
      req<Quote>("/quotes", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: Partial<Quote>) =>
      req<Quote>(`/quotes/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    remove: (id: number) => req<void>(`/quotes/${id}`, { method: "DELETE" }),
    duplicate: (id: number) => req<Quote>(`/quotes/${id}/duplicate`, { method: "POST" }),
    pdfUrl: (id: number, download = false) => `/api/quotes/${id}/pdf${download ? "?download=1" : ""}`,
    previewUrl: (id: number) => `/api/quotes/${id}/html`,
    share: (id: number) =>
      req<{ share_token: string; share_url: string }>(`/quotes/${id}/share`, { method: "POST" }),
    unshare: (id: number) => req<{ ok: true }>(`/quotes/${id}/share`, { method: "DELETE" }),
  },
  enquiries: {
    list: (q = "", status = "") =>
      req<Enquiry[]>(`/enquiries?q=${encodeURIComponent(q)}&status=${encodeURIComponent(status)}`),
    get: (id: number) => req<Enquiry>(`/enquiries/${id}`),
    create: (data: Partial<Enquiry>) =>
      req<Enquiry>("/enquiries", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: Partial<Enquiry>) =>
      req<Enquiry>(`/enquiries/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    remove: (id: number) => req<void>(`/enquiries/${id}`, { method: "DELETE" }),
    convertToQuote: (id: number) => req<Quote>(`/enquiries/${id}/convert-to-quote`, { method: "POST" }),
  },
  dashboard: {
    stats: () => req<DashboardStats>("/dashboard/stats"),
  },
};
