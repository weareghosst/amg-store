import Link from "next/link";
import { and, count, desc, eq, lte, sum } from "drizzle-orm";
import { getDb } from "@/db";
import { orders, products } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/guards";
import { formatBRL } from "@/lib/money";
import { ORDER_STATUS_BADGE, ORDER_STATUS_LABEL } from "@/lib/order-status";

export const metadata = { title: "Admin" };

export default async function AdminDashboard() {
  await requireAdmin();

  let pendingCount = 0;
  let paidQty = 0;
  let paidTotal = 0;
  let lowStock: (typeof products.$inferSelect)[] = [];
  let recentOrders: (typeof orders.$inferSelect)[] = [];
  let usingFallback = false;

  try {
    const db = getDb();

    const [pendingResult, paidStats, lowStockResult, recentOrdersResult] = await Promise.all([
      db
        .select({ value: count() })
        .from(orders)
        .where(eq(orders.status, "pending_payment")),
      db
        .select({ qty: count(), total: sum(orders.totalCents) })
        .from(orders)
        .where(eq(orders.status, "paid")),
      db
        .select()
        .from(products)
        .where(and(eq(products.active, true), lte(products.stock, 5)))
        .limit(10),
      db.select().from(orders).orderBy(desc(orders.createdAt)).limit(8),
    ]);

    pendingCount = pendingResult[0]?.value ?? 0;
    paidQty = paidStats[0]?.qty ?? 0;
    paidTotal = Number(paidStats[0]?.total ?? 0);
    lowStock = lowStockResult;
    recentOrders = recentOrdersResult;
  } catch (error) {
    usingFallback = true;
    console.warn("[admin] usando dados de fallback porque o banco não está disponível:", error);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800">Visão geral</h1>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Aguardando pagamento</p>
          <p className="mt-1 text-3xl font-black text-amber-600">{pendingCount}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Pedidos pagos (a processar)</p>
          <p className="mt-1 text-3xl font-black text-emerald-600">{paidQty}</p>
          <p className="text-xs text-slate-400">
            {formatBRL(paidTotal)} em vendas
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Produtos com estoque baixo</p>
          <p className="mt-1 text-3xl font-black text-red-600">{lowStock.length}</p>
        </div>
      </div>

      {usingFallback && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          Banco ainda não conectado. A página do admin está abrindo em modo de visualização de desenvolvimento.
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="font-bold text-slate-800">Pedidos recentes</h2>
          {recentOrders.length === 0 ? (
            <p className="mt-3 text-sm text-slate-400">Nenhum pedido ainda.</p>
          ) : (
            <ul className="mt-3 flex flex-col gap-2">
              {recentOrders.map((order) => (
                <li key={order.id}>
                  <Link
                    href={`/admin/pedidos/${order.id}`}
                    className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 px-3 py-2 text-sm transition hover:border-brand-blue/40"
                  >
                    <span className="font-medium">{order.code}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${ORDER_STATUS_BADGE[order.status]}`}
                    >
                      {ORDER_STATUS_LABEL[order.status]}
                    </span>
                    <span className="font-bold">{formatBRL(order.totalCents)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="font-bold text-slate-800">Estoque baixo (≤ 5 unidades)</h2>
          {lowStock.length === 0 ? (
            <p className="mt-3 text-sm text-slate-400">Tudo certo por aqui. ✅</p>
          ) : (
            <ul className="mt-3 flex flex-col gap-2">
              {lowStock.map((product) => (
                <li key={product.id}>
                  <Link
                    href={`/admin/produtos/${product.id}`}
                    className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 px-3 py-2 text-sm transition hover:border-brand-blue/40"
                  >
                    <span className="line-clamp-1">{product.name}</span>
                    <span className="shrink-0 font-bold text-red-600">
                      {product.stock} un.
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
