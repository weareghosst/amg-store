import type { CatalogResponse } from "./types";

export const API_URL = (
  import.meta.env.VITE_API_URL || "https://amg-store-ruby.vercel.app"
).replace(/\/$/, "");

const CATALOG_CACHE_KEY = "amg:catalog:v1";

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
