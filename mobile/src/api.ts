import type { AppUser, AuthSession, CatalogResponse } from "./types";

export const API_URL = (
  import.meta.env.VITE_API_URL || "https://amg-store-ruby.vercel.app"
).replace(/\/$/, "");

const CATALOG_CACHE_KEY = "amg:catalog:v1";
const AUTH_SESSION_KEY = "amg:auth:v1";

async function authRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, init);
  } catch {
    throw new Error("Não foi possível conectar. Verifique sua internet e tente novamente.");
  }
  const data = (await response.json().catch(() => ({}))) as { error?: string } & T;
  if (!response.ok) throw new Error(data.error || "Não foi possível concluir a operação.");
  return data;
}

export async function getCatalog(signal?: AbortSignal): Promise<CatalogResponse> {
  const response = await fetch(`${API_URL}/api/mobile/catalog?limite=100`, { signal });
  if (!response.ok) throw new Error("Não foi possível carregar o catálogo.");
  const catalog = (await response.json()) as CatalogResponse;
  localStorage.setItem(CATALOG_CACHE_KEY, JSON.stringify(catalog));
  return catalog;
}

export function getCachedCatalog(): CatalogResponse | null {
  try {
    const value = localStorage.getItem(CATALOG_CACHE_KEY);
    return value ? (JSON.parse(value) as CatalogResponse) : null;
  } catch {
    return null;
  }
}

export function productImageUrl(imageUrl: string | null): string | null {
  if (!imageUrl) return null;
  if (/^https?:\/\//i.test(imageUrl)) return imageUrl;
  return `${API_URL}${imageUrl.startsWith("/") ? "" : "/"}${imageUrl}`;
}

export function getStoredSession(): AuthSession | null {
  try {
    const value = localStorage.getItem(AUTH_SESSION_KEY);
    return value ? (JSON.parse(value) as AuthSession) : null;
  } catch {
    return null;
  }
}

export async function login(email: string, password: string): Promise<AuthSession> {
  const session = await authRequest<AuthSession>("/api/mobile/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
  return session;
}

export async function refreshSession(session: AuthSession): Promise<AuthSession> {
  const data = await authRequest<{ user: AppUser }>("/api/mobile/auth/me", {
    headers: { Authorization: `Bearer ${session.token}` },
  });
  const refreshed = { token: session.token, user: data.user };
  localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(refreshed));
  return refreshed;
}

export async function logout(session: AuthSession): Promise<void> {
  try {
    await authRequest<{ ok: boolean }>("/api/mobile/auth/logout", {
      method: "POST",
      headers: { Authorization: `Bearer ${session.token}` },
    });
  } finally {
    localStorage.removeItem(AUTH_SESSION_KEY);
  }
}

export function clearStoredSession(): void {
  localStorage.removeItem(AUTH_SESSION_KEY);
}
