import "server-only";
import { and, eq, sql } from "drizzle-orm";
import type { DbTransaction } from "@/db";
import { orderItems, orders, products, type Order } from "@/db/schema";

export type OrderStatus = Order["status"];

/**
 * Transição condicional de status: só aplica se o status atual ainda for
 * `from`. Devolve `true` se ESTA chamada efetuou a transição — chamadores
 * concorrentes (admin x webhook, duplo clique) recebem `false` e não devem
 * executar efeitos colaterais (ex.: devolver estoque).
 */
export async function transitionOrderStatus(
  tx: DbTransaction,
  opts: {
    orderId: string;
    from: OrderStatus;
    to: OrderStatus;
    extra?: { trackingCode?: string | null; paymentMethod?: string | null };
  },
): Promise<boolean> {
  const updated = await tx
    .update(orders)
    .set({
      status: opts.to,
      updatedAt: new Date(),
      ...(opts.extra ?? {}),
    })
    .where(and(eq(orders.id, opts.orderId), eq(orders.status, opts.from)))
    .returning({ id: orders.id });
  return updated.length > 0;
}

/**
 * Devolve ao estoque os itens de um pedido. Chame SOMENTE depois de
 * `transitionOrderStatus` confirmar que este chamador "ganhou" o
 * cancelamento — senão o estoque volta em dobro.
 */
export async function restoreOrderStock(
  tx: DbTransaction,
  orderId: string,
): Promise<void> {
  const items = await tx
    .select({ productId: orderItems.productId, quantity: orderItems.quantity })
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId));
  for (const item of items) {
    await tx
      .update(products)
      .set({ stock: sql`${products.stock} + ${item.quantity}` })
      .where(eq(products.id, item.productId));
  }
}
