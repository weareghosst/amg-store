"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { MobileProduct } from "@/lib/mobile-api";
import { ProductCard } from "@/components/product-card";
import { useFavorites } from "@/components/favorites-store";

export function FavoritesPage() {
  const { favorites } = useFavorites();
  const [products, setProducts] = useState<MobileProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/mobile/catalog?limite=1000", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Não foi possível carregar seus produtos.");
        const data = await response.json() as { products: MobileProduct[] };
        setProducts(data.products); setError("");
      })
      .catch(() => { if (!controller.signal.aborted) setError("Não foi possível carregar seus produtos. Tente novamente."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [attempt]);
  const selected = products.filter((product) => favorites.includes(product.id));
  return <div className="mx-auto max-w-6xl px-4 py-8">
    <h1 className="text-2xl font-bold text-slate-800">Meus favoritos</h1>
    <p className="mt-2 text-sm text-slate-500">Guarde aqui os produtos que você quer encontrar mais rápido.</p>
    {loading ? <p className="mt-8 text-slate-500" role="status">Carregando produtos...</p> :
      error ? <div className="mt-8 text-slate-600" role="alert"><p>{error}</p><button className="mt-3 rounded-lg bg-brand-blue px-4 py-2 text-white" type="button" onClick={() => { setLoading(true); setAttempt((value) => value + 1); }}>Tentar novamente</button></div> :
      selected.length ? <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">{selected.map((product) => <ProductCard key={product.id} product={product} />)}</div> :
      <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500"><p>{favorites.length ? "Os produtos salvos não estão disponíveis no catálogo agora." : "Você ainda não favoritou nenhum produto."}</p><Link href="/produtos" className="mt-4 inline-block text-brand-blue hover:underline">Ver produtos</Link></div>}
  </div>;
}
