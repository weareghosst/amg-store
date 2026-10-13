"use client";
import { useSyncExternalStore } from "react";

const KEY = "amg:favorites:v1";
const EMPTY: string[] = [];
let cache: string[] | null = null;
const listeners = new Set<() => void>();

function read(): string[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(value) ? [...new Set(value.filter((id): id is string => typeof id === "string"))] : [];
  } catch { return []; }
}
function snapshot() { return cache ?? (cache = read()); }
function notify() { listeners.forEach((listener) => listener()); }
function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === KEY || event.key === null) { cache = read(); notify(); }
  };
  window.addEventListener("storage", onStorage);
  return () => { listeners.delete(listener); window.removeEventListener("storage", onStorage); };
}
export function useFavorites() {
  const favorites = useSyncExternalStore(subscribe, snapshot, () => EMPTY);
  const toggle = (id: string) => {
    const current = snapshot();
    cache = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
    try { localStorage.setItem(KEY, JSON.stringify(cache)); } catch { /* Mantém a seleção nesta sessão. */ }
    notify();
  };
  return { favorites, toggle };
}
