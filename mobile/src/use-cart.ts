import { useMemo, useState } from "react";

const CART_KEY = "amg:cart:v1";
const MAX_QUANTITY = 99;

type CartState = Record<string, number>;

function loadCart(): CartState {
  try {
    const saved = localStorage.getItem(CART_KEY);
    return saved ? (JSON.parse(saved) as CartState) : {};
  } catch {
    return {};
  }
}

function saveCart(cart: CartState) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

export function useCart() {
  const [cart, setCart] = useState<CartState>(loadCart);

  const changeQuantity = (productId: string, quantity: number) => {
    setCart((current) => {
      const next = { ...current };
      const safeQuantity = Math.min(Math.max(Math.trunc(quantity), 0), MAX_QUANTITY);
      if (safeQuantity === 0) delete next[productId];
      else next[productId] = safeQuantity;
      saveCart(next);
      return next;
    });
  };

  const add = (productId: string) => {
    setCart((current) => {
      const next = {
        ...current,
        [productId]: Math.min((current[productId] ?? 0) + 1, MAX_QUANTITY),
      };
      saveCart(next);
      return next;
    });
  };

  const remove = (productId: string) => changeQuantity(productId, 0);

  const clear = () => {
    localStorage.removeItem(CART_KEY);
    setCart({});
  };

  const itemCount = useMemo(
    () => Object.values(cart).reduce((total, quantity) => total + quantity, 0),
    [cart],
  );

  return { cart, itemCount, add, changeQuantity, remove, clear };
}
