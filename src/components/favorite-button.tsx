"use client";
import { useFavorites } from "@/components/favorites-store";

export function FavoriteButton({ id, name, full = false }: { id: string; name: string; full?: boolean }) {
  const { favorites, toggle } = useFavorites();
  const active = favorites.includes(id);
  return <button type="button" aria-label={`${active ? "Remover" : "Adicionar"} ${name} ${active ? "dos" : "aos"} favoritos`} aria-pressed={active} onClick={() => toggle(id)}
    className={full ? "flex items-center gap-2 self-start rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-brand-blue" : "absolute right-2 top-2 z-10 grid h-9 w-9 place-items-center rounded-full border border-slate-200 bg-white/95 text-brand-blue shadow-sm"}>
    <svg viewBox="0 0 24 24" className="h-5 w-5 stroke-current" fill={active ? "currentColor" : "none"} strokeWidth="1.8" aria-hidden><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/></svg>
    {full && (active ? "Salvo nos favoritos" : "Adicionar aos favoritos")}
  </button>;
}
