"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/components/cart/cart-context";
import { formatBRL } from "@/lib/money";

export default function CartPage() {
  const { items, ready, removeItem, setQuantity, subtotalCents } = useCart();

  if (!ready) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center text-slate-400">
        Carregando carrinho...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-slate-800">Seu carrinho está vazio</h1>
        <p className="mt-2 text-slate-500">
          Explore nossos produtos de limpeza e EPIs.
        </p>
        <Link
          href="/produtos"
          className="mt-6 inline-block rounded-lg bg-brand-blue px-6 py-3 font-semibold text-white transition hover:bg-brand-blue-dark"
        >
          Ver produtos
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-800">Carrinho</h1>

      <div className="mt-6 flex flex-col gap-3">
        {items.map((item) => (
          <div
            key={item.productId}
            className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-3"
          >
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-100">
              {item.imageUrl ? (
                <Image
                  src={item.imageUrl}
                  alt={item.name}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-slate-300 text-xs">
                  sem foto
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <Link
                href={`/produtos/${item.slug}`}
                className="line-clamp-2 text-sm font-medium text-slate-800 hover:text-brand-blue"
              >
                {item.name}
              </Link>
              <p className="mt-1 text-sm font-bold text-brand-blue">
                {formatBRL(item.priceCents)}
              </p>
            </div>
            <div className="flex items-center rounded-lg border border-slate-300">
              <button
                type="button"
                onClick={() => setQuantity(item.productId, item.quantity - 1)}
                className="px-2.5 py-1.5 text-slate-600 hover:bg-slate-100"
                aria-label="Diminuir"
              >
                −
              </button>
              <span className="min-w-8 text-center text-sm font-semibold">
                {item.quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity(item.productId, item.quantity + 1)}
                className="px-2.5 py-1.5 text-slate-600 hover:bg-slate-100"
                aria-label="Aumentar"
              >
                +
              </button>
            </div>
            <button
              type="button"
              onClick={() => removeItem(item.productId)}
              className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
              aria-label={`Remover ${item.name}`}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between text-lg">
          <span className="font-medium text-slate-600">Subtotal</span>
          <span className="font-bold text-slate-900">{formatBRL(subtotalCents)}</span>
        </div>
        <p className="mt-1 text-sm text-slate-400">
          Frete calculado no checkout a partir do seu CEP.
        </p>
        <Link
          href="/checkout"
          className="mt-4 block w-full rounded-lg bg-brand-green px-6 py-3 text-center font-semibold text-white transition hover:bg-brand-green-dark"
        >
          Finalizar compra
        </Link>
        <Link
          href="/produtos"
          className="mt-2 block w-full rounded-lg px-6 py-2 text-center text-sm font-medium text-slate-500 hover:text-brand-blue"
        >
          Continuar comprando
        </Link>
      </div>
    </div>
  );
}
