"use client";

import Link from "next/link";
import { useQuoteCart } from "@/components/quote-cart-store";

export function QuoteCartLink() {
  const { count } = useQuoteCart();
  return (
    <Link
      href="/orcamento"
      className="relative flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-brand-blue transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-blue/5"
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth="2" aria-hidden>
        <circle cx="9" cy="20" r="1"/><circle cx="18" cy="20" r="1"/><path d="M3 4h2l2.4 10.2a2 2 0 0 0 2 1.5h7.7a2 2 0 0 0 2-1.6L21 7H6"/>
      </svg>
      <span className="hidden sm:inline">Orçamento</span>
      {count > 0 && <span className="grid min-w-5 place-items-center rounded-full bg-rose-600 px-1.5 py-0.5 text-[10px] font-bold text-white">{count > 99 ? "99+" : count}</span>}
    </Link>
  );
}
