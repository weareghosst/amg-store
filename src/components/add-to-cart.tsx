"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "./cart/cart-context";

export function AddToCart({
  product,
}: {
  product: {
    id: string;
    slug: string;
    name: string;
    priceCents: number;
    imageUrl: string | null;
    stock: number;
  };
}) {
  const { addItem } = useCart();
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  if (product.stock <= 0) {
    return (
      <div className="rounded-lg bg-slate-100 px-4 py-3 text-center font-medium text-slate-500">
        Produto esgotado
      </div>
    );
  }

  const add = () => {
    addItem(
      {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        priceCents: product.priceCents,
        imageUrl: product.imageUrl,
        maxStock: product.stock,
      },
      quantity,
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className="flex items-center rounded-lg border border-slate-300">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="px-3 py-2 text-slate-600 hover:bg-slate-100"
            aria-label="Diminuir quantidade"
          >
            −
          </button>
          <span className="min-w-10 text-center font-semibold">{quantity}</span>
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
            className="px-3 py-2 text-slate-600 hover:bg-slate-100"
            aria-label="Aumentar quantidade"
          >
            +
          </button>
        </div>
        <span className="text-sm text-slate-500">
          {product.stock} em estoque
        </span>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={add}
          className="flex-1 rounded-lg border border-brand-blue px-4 py-3 font-semibold text-brand-blue transition hover:bg-brand-blue/5"
        >
          {added ? "Adicionado ✓" : "Adicionar ao carrinho"}
        </button>
        <button
          type="button"
          onClick={() => {
            add();
            router.push("/carrinho");
          }}
          className="flex-1 rounded-lg bg-brand-green px-4 py-3 font-semibold text-white transition hover:bg-brand-green-dark"
        >
          Comprar agora
        </button>
      </div>
    </div>
  );
}
