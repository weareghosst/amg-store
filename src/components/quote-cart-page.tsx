"use client";

import Image from "next/image";
import Link from "next/link";
import { formatBRL } from "@/lib/money";
import { useQuoteCart } from "@/components/quote-cart-store";

export function QuoteCartPage({ phone }: { phone: string }) {
  const { cart, count, changeQuantity, remove, clear } = useQuoteCart();
  const items = Object.values(cart);
  const total = items.reduce(
    (sum, item) => sum + (item.product.priceCents > 0 ? item.product.priceCents * item.quantity : 0),
    0,
  );
  const hasPriceOnRequest = items.some((item) => item.product.priceCents <= 0);

  const sendQuote = () => {
    if (!phone || !items.length) return;
    const productLines = items.map(({ product, quantity }) =>
      `• ${quantity}x ${product.name}${product.sku ? ` (cód. ${product.sku})` : ""}`,
    );
    const totalLine = total > 0
      ? `\n\n${hasPriceOnRequest ? "Total parcial dos itens com preço" : "Total estimado"}: ${formatBRL(total)}`
      : "";
    const note = hasPriceOnRequest ? "\nAlguns valores precisam ser confirmados." : "";
    const message = `Olá! Vim pelo site da AMG e gostaria de solicitar um orçamento:\n\n${productLines.join("\n")}${totalLine}${note}\n\nPode confirmar os valores, a disponibilidade e a entrega?`;
    window.open(`https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  };

  if (!items.length) {
    return (
      <div className="mx-auto flex min-h-[55vh] max-w-md flex-col items-center justify-center px-4 py-16 text-center">
        <div className="grid h-20 w-20 place-items-center rounded-3xl bg-brand-blue/10 text-brand-blue">
          <svg viewBox="0 0 24 24" className="h-9 w-9 fill-none stroke-current" strokeWidth="2" aria-hidden><circle cx="9" cy="20" r="1"/><circle cx="18" cy="20" r="1"/><path d="M3 4h2l2.4 10.2a2 2 0 0 0 2 1.5h7.7a2 2 0 0 0 2-1.6L21 7H6"/></svg>
        </div>
        <h1 className="mt-5 text-2xl font-black text-brand-navy">Seu orçamento está vazio</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">Adicione os produtos desejados e envie a lista completa para a equipe da AMG.</p>
        <Link href="/produtos" className="mt-6 rounded-xl bg-brand-blue px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-blue-dark">Ver produtos</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div><p className="text-xs font-black uppercase tracking-[0.2em] text-brand-green">Sua lista</p><h1 className="mt-1 text-3xl font-black text-brand-navy">Orçamento</h1><p className="mt-1 text-sm text-slate-500">{count} {count === 1 ? "item" : "itens"}</p></div>
        <button type="button" onClick={clear} className="rounded-lg px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50">Limpar lista</button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-3">
          {items.map(({ product, quantity }) => (
            <article key={product.id} className="grid grid-cols-[88px_1fr] gap-4 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:grid-cols-[110px_1fr]">
              <Link href={`/produtos/${product.slug}`} className="relative aspect-square overflow-hidden rounded-xl bg-slate-100">
                {product.imageUrl ? <Image src={product.imageUrl} alt={product.name} fill sizes="110px" className="object-cover" /> : <div className="grid h-full place-items-center text-slate-300">Sem foto</div>}
              </Link>
              <div className="min-w-0">
                <Link href={`/produtos/${product.slug}`} className="font-bold text-slate-800 hover:text-brand-blue">{product.name}</Link>
                <p className="mt-1 text-sm font-bold text-brand-blue">{product.priceCents > 0 ? formatBRL(product.priceCents) : "Preço sob consulta"}</p>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <div className="grid grid-cols-[36px_42px_36px] overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                    <button type="button" aria-label="Diminuir quantidade" onClick={() => changeQuantity(product.id, quantity - 1)} className="h-9 text-lg font-bold text-brand-blue hover:bg-white">−</button>
                    <span className="grid place-items-center border-x border-slate-200 text-sm font-bold">{quantity}</span>
                    <button type="button" aria-label="Aumentar quantidade" onClick={() => changeQuantity(product.id, quantity + 1)} className="h-9 text-lg font-bold text-brand-blue hover:bg-white">+</button>
                  </div>
                  <button type="button" onClick={() => remove(product.id)} className="rounded-lg px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50">Remover</button>
                </div>
              </div>
            </article>
          ))}
        </div>

        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.07)] lg:sticky lg:top-32">
          <h2 className="text-lg font-black text-brand-navy">Resumo do orçamento</h2>
          <div className="mt-4 flex items-baseline justify-between border-t border-slate-100 pt-4"><span className="text-sm text-slate-500">{hasPriceOnRequest ? "Total parcial" : "Total estimado"}</span><strong className="text-xl text-brand-blue">{total > 0 ? formatBRL(total) : "Sob consulta"}</strong></div>
          {hasPriceOnRequest && <p className="mt-2 text-xs leading-relaxed text-slate-500">Os itens sem preço serão confirmados durante o atendimento.</p>}
          <button type="button" disabled={!phone} onClick={sendQuote} className="mt-5 w-full rounded-xl bg-whatsapp px-4 py-3.5 text-sm font-black text-white shadow-lg shadow-green-500/15 transition hover:bg-whatsapp-dark disabled:bg-slate-400">Solicitar pelo WhatsApp</button>
          <p className="mt-3 text-center text-[11px] leading-relaxed text-slate-400">A solicitação não confirma o pedido. A AMG verificará os valores, o estoque e a entrega.</p>
        </aside>
      </div>
    </div>
  );
}
