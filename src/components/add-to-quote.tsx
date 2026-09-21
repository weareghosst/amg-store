"use client";

import { useQuoteCart, type QuoteProduct } from "@/components/quote-cart-store";

export function AddToQuote({
  product,
  full = false,
}: {
  product: QuoteProduct;
  full?: boolean;
}) {
  const { cart, add } = useQuoteCart();
  const quantity = cart[product.id]?.quantity ?? 0;
  const unavailable = product.stock <= 0;

  return (
    <button
      type="button"
      disabled={unavailable}
      onClick={() => add(product)}
      className={full
        ? "flex w-full items-center justify-center gap-2 rounded-xl bg-brand-blue px-4 py-3.5 font-bold text-white shadow-lg shadow-brand-blue/15 transition hover:bg-brand-blue-dark disabled:bg-slate-400"
        : `mt-3 flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-bold transition ${quantity ? "border-brand-green/30 bg-brand-green/10 text-brand-green-dark" : "border-brand-blue/20 bg-brand-blue/5 text-brand-blue hover:bg-brand-blue/10"} disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400`}
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth="2" aria-hidden>
        <circle cx="9" cy="20" r="1"/><circle cx="18" cy="20" r="1"/><path d="M3 4h2l2.4 10.2a2 2 0 0 0 2 1.5h7.7a2 2 0 0 0 2-1.6L21 7H6"/>
      </svg>
      {unavailable ? "Produto esgotado" : quantity ? `Adicionar mais — ${quantity} no carrinho` : "Adicionar ao carrinho"}
    </button>
  );
}
