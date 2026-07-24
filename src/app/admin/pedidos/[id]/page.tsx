import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { orderItems, orders, users } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/guards";
import { formatBRL } from "@/lib/money";
import { formatCep } from "@/lib/cep";
import {
  ORDER_STATUS_BADGE,
  ORDER_STATUS_LABEL,
  SHIPPING_METHOD_LABEL,
} from "@/lib/order-status";
import { OrderStatusForm } from "./order-status-form";

export const metadata = { title: "Pedido — Admin" };

const NEXT_ACTIONS: Record<string, { status: string; label: string }[]> = {
  pending_payment: [
    { status: "paid", label: "Marcar como pago (manual)" },
    { status: "canceled", label: "Cancelar pedido" },
  ],
  paid: [
    { status: "processing", label: "Iniciar separação" },
    { status: "canceled", label: "Cancelar pedido" },
  ],
  processing: [
    { status: "shipped", label: "Marcar como enviado" },
    { status: "canceled", label: "Cancelar pedido" },
  ],
  shipped: [{ status: "delivered", label: "Marcar como entregue" }],
  delivered: [],
  canceled: [],
};

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();

  const db = getDb();
  const rows = await db
    .select({ order: orders, customer: users })
    .from(orders)
    .innerJoin(users, eq(orders.userId, users.id))
    .where(eq(orders.id, id))
    .limit(1);
  const row = rows[0];
  if (!row) notFound();
  const { order, customer } = row;

  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, order.id));

  return (
    <div>
      <Link href="/admin/pedidos" className="text-sm text-slate-500 hover:text-brand-blue">
        ← Pedidos
      </Link>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-800">{order.code}</h1>
        <span
          className={`rounded-full px-3 py-1 text-sm font-semibold ${ORDER_STATUS_BADGE[order.status]}`}
        >
          {ORDER_STATUS_LABEL[order.status]}
        </span>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-5 text-sm">
          <h2 className="font-bold text-slate-800">Cliente</h2>
          <p className="mt-2 font-medium text-slate-700">{customer.name}</p>
          <p className="text-slate-500">{customer.email}</p>
          {customer.phone && <p className="text-slate-500">Tel: {customer.phone}</p>}
          {customer.cpfCnpj && (
            <p className="text-slate-500">
              {customer.cpfCnpj.length === 14 ? "CNPJ" : "CPF"}: {customer.cpfCnpj}
            </p>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 text-sm">
          <h2 className="font-bold text-slate-800">Entrega</h2>
          <p className="mt-2 text-slate-600">
            {SHIPPING_METHOD_LABEL[order.shippingMethod]} — {order.shippingLabel}
          </p>
          <p className="mt-1 text-slate-600">
            {order.address.street}, {order.address.number}
            {order.address.complement ? ` — ${order.address.complement}` : ""}
            <br />
            {order.address.district} — {order.address.city}/{order.address.state}
            <br />
            CEP {formatCep(order.address.cep)}
          </p>
          {order.trackingCode && (
            <p className="mt-2 font-mono text-brand-blue">
              Rastreio: {order.trackingCode}
            </p>
          )}
        </section>
      </div>

      <section className="mt-4 rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="font-bold text-slate-800">Itens</h2>
        <ul className="mt-3 flex flex-col gap-2 text-sm">
          {items.map((item) => (
            <li key={item.id} className="flex justify-between gap-2">
              <span className="text-slate-600">
                {item.quantity}× {item.name}{" "}
                <span className="text-xs text-slate-400">
                  ({formatBRL(item.unitPriceCents)} un.)
                </span>
              </span>
              <span className="font-medium">
                {formatBRL(item.unitPriceCents * item.quantity)}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex flex-col gap-1 border-t border-slate-100 pt-3 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Subtotal</span>
            <span>{formatBRL(order.subtotalCents)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Frete</span>
            <span>{formatBRL(order.shippingCents)}</span>
          </div>
          <div className="flex justify-between text-base font-bold">
            <span>Total</span>
            <span className="text-brand-blue">{formatBRL(order.totalCents)}</span>
          </div>
          {order.paymentMethod && (
            <p className="text-xs text-slate-400">
              Pago via {order.paymentMethod} · Asaas {order.asaasPaymentId}
            </p>
          )}
        </div>
      </section>

      {NEXT_ACTIONS[order.status].length > 0 && (
        <section className="mt-4 rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="font-bold text-slate-800">Ações</h2>
          <OrderStatusForm
            orderId={order.id}
            actions={NEXT_ACTIONS[order.status]}
            askTracking={order.status === "processing"}
          />
          <p className="mt-3 text-xs text-slate-400">
            O pagamento é confirmado automaticamente pelo webhook do Asaas.
            &quot;Marcar como pago&quot; é apenas para pagamentos combinados fora do site.
            Cancelamentos devolvem os itens ao estoque.
          </p>
        </section>
      )}
    </div>
  );
}
