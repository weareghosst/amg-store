"use client";

import { useSyncExternalStore } from "react";

const STORAGE_KEY = "amg:orcamento:v1";
const EMPTY_CART: QuoteCart = {};

export type QuoteProduct = {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  imageUrl: string | null;
  priceCents: number;
  stock: number;
};

export type QuoteCartItem = {
  product: QuoteProduct;
  quantity: number;
};

type QuoteCart = Record<string, QuoteCartItem>;

let cartCache: QuoteCart | null = null;
const listeners = new Set<() => void>();

function readCart(): QuoteCart {
  if (typeof window === "undefined") return EMPTY_CART;
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved ? (JSON.parse(saved) as QuoteCart) : {};
  } catch {
    return {};
  }
}

function getSnapshot(): QuoteCart {
  if (cartCache === null) cartCache = readCart();
  return cartCache;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      cartCache = readCart();
      listeners.forEach((notify) => notify());
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function updateCart(update: (cart: QuoteCart) => QuoteCart) {
  cartCache = update(getSnapshot());
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cartCache));
  listeners.forEach((listener) => listener());
}

export function useQuoteCart() {
  const cart = useSyncExternalStore(subscribe, getSnapshot, () => EMPTY_CART);

  const add = (product: QuoteProduct) => {
    updateCart((current) => ({
      ...current,
      [product.id]: {
        product,
        quantity: Math.min((current[product.id]?.quantity ?? 0) + 1, 99),
      },
    }));
  };

  const changeQuantity = (productId: string, quantity: number) => {
    updateCart((current) => {
      const next = { ...current };
      const safeQuantity = Math.min(Math.max(Math.trunc(quantity), 0), 99);
      if (!safeQuantity) delete next[productId];
      else if (next[productId]) next[productId] = { ...next[productId], quantity: safeQuantity };
      return next;
    });
  };

  const remove = (productId: string) => changeQuantity(productId, 0);
  const clear = () => updateCart(() => ({}));
  const count = Object.values(cart).reduce((total, item) => total + item.quantity, 0);

  return { cart, count, add, changeQuantity, remove, clear };
}
