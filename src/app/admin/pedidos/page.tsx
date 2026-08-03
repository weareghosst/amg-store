import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { orders, users } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/guards";
import { formatBRL } from "@/lib/money";
import { ORDER_STATUS_BADGE, ORDER_STATUS_LABEL } from "@/lib/order-status";

export const metadata = { title: "Pedidos — Admin" };

const FILTERS = [
  { value: "", label: "Todos" },
  { value: "pending_payment", label: "Aguardando pagamento" },
  { value: "paid", label: "Pagos" },
  { value: "processing", label: "Em separação" },
  { value: "shipped", label: "Enviados" },
  { value: "delivered", label: "Entregues" },
  { value: "canceled", label: "Cancelados" },
] as const;

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireAdmin();
  const { status } = await searchParams;
  const validStatus = FILTERS.some((f) => f.value === status) ? status : "";

  let rows: Array<{ order: (typeof orders.$inferSelect); customer: (typeof users.$inferSelect) }> = [];
  let usingFallback = false;

  try {
    const db = getDb();
    const statusFilter = validStatus
      ? eq(orders.status, validStatus as "pending_payment")
      : undefined;
    rows = await db
      .select({ order: orders, customer: users })
      .from(orders)
      .innerJoin(users, eq(orders.userId, users.id))
      .where(statusFilter)
      .orderBy(desc(orders.createdAt))
      .limit(200);
  } catch (error) {
    usingFallback = true;
    console.warn("[admin/orders] usando fallback:", error);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800">Pedidos</h1>

      <div className="mt-3 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.value}
            href={f.value ? `/admin/pedidos?status=${f.value}` : "/admin/pedidos"}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              validStatus === f.value
                ? "bg-slate-900 text-white"
                : "border border-slate-300 bg-white text-slate-600 hover:border-slate-500"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {usingFallback && (
        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          Banco ainda não conectado. Os pedidos serão exibidos em modo de visualização.
        </div>
      )}

      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Pedido</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                  Nenhum pedido encontrado.
                </td>
              </tr>
            )}
            {rows.map(({ order, customer }) => (
              <tr key={order.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/pedidos/${order.id}`}
                    className="font-medium text-brand-blue hover:underline"
                  >
                    {order.code}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <span className="block">{customer.name}</span>
                  <span className="text-xs text-slate-400">{customer.email}</span>
                </td>
                <td className="px-4 py-3 text-slate-500">
                  {order.createdAt.toLocaleDateString("pt-BR")}
                </td>
                <td className="px-4 py-3 font-medium">{formatBRL(order.totalCents)}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${ORDER_STATUS_BADGE[order.status]}`}
                  >
                    {ORDER_STATUS_LABEL[order.status]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
