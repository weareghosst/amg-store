import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { orders } from "@/db/schema";
import { requireUser } from "@/lib/auth/guards";
import { formatBRL } from "@/lib/money";
import { ORDER_STATUS_BADGE, ORDER_STATUS_LABEL } from "@/lib/order-status";

export const dynamic = "force-dynamic";

export const metadata = { title: "Meus pedidos" };

export default async function OrdersPage() {
  const user = await requireUser();
  const db = getDb();
  const orderList = await db
    .select()
    .from(orders)
    .where(eq(orders.userId, user.id))
    .orderBy(desc(orders.createdAt))
    .limit(100);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-800">Meus pedidos</h1>

      {orderList.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
          Você ainda não fez nenhum pedido.
        </p>
      ) : (
        <div className="mt-6 flex flex-col gap-2">
          {orderList.map((order) => (
            <Link
              key={order.id}
              href={`/conta/pedidos/${order.code}`}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 transition hover:border-brand-blue/40"
            >
              <div>
                <p className="font-semibold text-slate-800">{order.code}</p>
                <p className="text-xs text-slate-400">
                  {order.createdAt.toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${ORDER_STATUS_BADGE[order.status]}`}
              >
                {ORDER_STATUS_LABEL[order.status]}
              </span>
              <span className="font-bold text-slate-900">
                {formatBRL(order.totalCents)}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
