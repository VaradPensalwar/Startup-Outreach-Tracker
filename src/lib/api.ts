import { auth } from "@/lib/firebase";
import { Company } from "@/data/companies";

const apiBase = import.meta.env.VITE_API_URL || "";

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const user = auth?.currentUser;
  if (!user) throw new Error("Please sign in before changing your tracker.");

  const token = await user.getIdToken();
  const response = await fetch(`${apiBase}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || "Something went wrong. Please try again.");
  return body as T;
}

export const companyApi = {
  list: () => request<{ companies: Company[] }>("/api/companies"),
  bootstrap: (companies: Company[]) => request<{ companies: Company[] }>("/api/companies/bootstrap", {
    method: "POST",
    body: JSON.stringify({ companies }),
  }),
  create: (name: string) => request<{ company: Company }>("/api/companies", {
    method: "POST",
    body: JSON.stringify({ name }),
  }),
  update: (id: number, updates: Partial<Company>) => request<{ company: Company }>(`/api/companies/${id}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  }),
  markContacted: (ids: number[], lastContactDate: string) => request<{ ok: boolean }>("/api/companies/mark-contacted", {
    method: "POST",
    body: JSON.stringify({ ids, lastContactDate }),
  }),
  reset: (companies: Company[]) => request<{ companies: Company[] }>("/api/companies/reset", {
    method: "POST",
    body: JSON.stringify({ companies }),
  }),
};
