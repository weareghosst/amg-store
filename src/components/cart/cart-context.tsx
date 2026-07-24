"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

/**
 * Carrinho no navegador (localStorage). IMPORTANTE: os preços aqui são apenas
 * para EXIBIÇÃO. No checkout o servidor recalcula tudo a partir do banco —
 * alterar o localStorage não muda o valor cobrado.
 */

export interface CartItem {
  productId: string;
  slug: string;
  name: string;
  priceCents: number;
  imageUrl: string | null;
  quantity: number;
  maxStock: number;
}

interface CartContextValue {
  items: CartItem[];
  ready: boolean;
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeItem: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
  count: number;
  subtotalCents: number;
}

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "amg_cart_v1";
const MAX_QTY = 999;

function sanitize(raw: unknown): CartItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (i): i is CartItem =>
        typeof i === "object" &&
        i !== null &&
        typeof (i as CartItem).productId === "string" &&
        typeof (i as CartItem).quantity === "number",
    )
    .map((i) => ({
      ...i,
      maxStock: typeof i.maxStock === "number" ? i.maxStock : MAX_QTY,
      quantity: Math.max(1, Math.min(MAX_QTY, Math.floor(i.quantity))),
    }))
    .slice(0, 50);
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setItems(sanitize(JSON.parse(stored)));
    } catch {
      // carrinho corrompido: começa vazio
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // storage cheio/indisponível: ignora
    }
  }, [items, ready]);

  const addItem = useCallback(
    (item: Omit<CartItem, "quantity">, quantity = 1) => {
      setItems((prev) => {
        const existing = prev.find((i) => i.productId === item.productId);
        if (existing) {
          return prev.map((i) =>
            i.productId === item.productId
              ? {
                  ...i,
                  ...item,
                  quantity: Math.min(i.quantity + quantity, i.maxStock, MAX_QTY),
                }
              : i,
          );
        }
        return [
          ...prev,
          { ...item, quantity: Math.min(quantity, item.maxStock, MAX_QTY) },
        ];
      });
    },
    [],
  );

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  const setQuantity = useCallback((productId: string, quantity: number) => {
    setItems((prev) =>
      prev
        .map((i) =>
          i.productId === productId
            ? {
                ...i,
                quantity: Math.max(1, Math.min(quantity, i.maxStock, MAX_QTY)),
              }
            : i,
        )
        .filter((i) => i.quantity > 0),
    );
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      ready,
      addItem,
      removeItem,
      setQuantity,
      clear,
      count: items.reduce((acc, i) => acc + i.quantity, 0),
      subtotalCents: items.reduce((acc, i) => acc + i.priceCents * i.quantity, 0),
    }),
    [items, ready, addItem, removeItem, setQuantity, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart deve ser usado dentro de <CartProvider>");
  return ctx;
}
