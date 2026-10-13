"use client";
import Link from "next/link";
import { useFavorites } from "@/components/favorites-store";
export function FavoritesLink() {
  const { favorites } = useFavorites();
  return <Link href="/favoritos" className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100" aria-label={`Favoritos, ${favorites.length} produtos`}>♡ Favoritos{favorites.length ? ` (${favorites.length})` : ""}</Link>;
}
