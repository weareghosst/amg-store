import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { orderItems, orders } from "@/db/schema";
import { requireUser } from "@/lib/auth/guards";
import { formatBRL } from "@/lib/money";
import { formatCep } from "@/lib/cep";
import {
  ORDER_STATUS_BADGE,
  ORDER_STATUS_LABEL,
  SHIPPING_METHOD_LABEL,
} from "@/lib/order-status";

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const user = await requireUser();
  const { code } = await params;

  const db = getDb();
  // Escopo por usuário: o pedido só aparece para o dono (admin usa /admin/pedidos)
  const rows = await db
    .select()
    .from(orders)
    .where(and(eq(orders.code, code.toUpperCase()), eq(orders.userId, user.id)))
    .limit(1);
  const order = rows[0];
  if (!order) notFound();

  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, order.id));

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link href="/conta/pedidos" className="text-sm text-slate-500 hover:text-brand-blue">
        ← Meus pedidos
      </Link>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-800">Pedido {order.code}</h1>
        <span
          className={`rounded-full px-3 py-1 text-sm font-semibold ${ORDER_STATUS_BADGE[order.status]}`}
        >
          {ORDER_STATUS_LABEL[order.status]}
        </span>
      </div>
      <p className="mt-1 text-sm text-slate-400">
        Realizado em{" "}
        {order.createdAt.toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </p>

      {order.status === "pending_payment" && order.paymentUrl && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="font-semibold text-amber-800">
            Aguardando pagamento
          </p>
          <p className="mt-1 text-sm text-amber-700">
            Conclua o pagamento na página segura do Asaas — Pix, boleto ou
            cartão. O pedido é confirmado automaticamente.
          </p>
          <a
            href={order.paymentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block rounded-lg bg-amber-600 px-5 py-2.5 font-semibold text-white transition hover:bg-amber-700"
          >
            Pagar agora →
          </a>
        </div>
      )}

      {order.trackingCode && (
        <div className="mt-4 rounded-xl border border-brand-blue/30 bg-brand-blue/5 p-4 text-sm">
          <p className="font-semibold text-brand-blue-dark">Código de rastreio</p>
          <p className="mt-1 font-mono text-brand-blue">{order.trackingCode}</p>
        </div>
      )}

      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="font-bold text-slate-800">Itens</h2>
        <ul className="mt-3 flex flex-col gap-2 text-sm">
          {items.map((item) => (
            <li key={item.id} className="flex justify-between gap-2">
              <span className="text-slate-600">
                {item.quantity}× {item.name}
              </span>
              <span className="font-medium text-slate-800">
                {formatBRL(item.unitPriceCents * item.quantity)}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-4 border-t border-slate-100 pt-3 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Subtotal</span>
            <span>{formatBRL(order.subtotalCents)}</span>
          </div>
          <div className="mt-1 flex justify-between">
            <span className="text-slate-500">
              Frete ({order.shippingLabel})
            </span>
            <span>
              {order.shippingCents === 0 ? "Grátis" : formatBRL(order.shippingCents)}
            </span>
          </div>
          <div className="mt-2 flex justify-between border-t border-slate-100 pt-2 text-base font-bold">
            <span>Total</span>
            <span className="text-brand-blue">{formatBRL(order.totalCents)}</span>
          </div>
        </div>
      </section>

      <section className="mt-4 rounded-xl border border-slate-200 bg-white p-5 text-sm">
        <h2 className="font-bold text-slate-800">Entrega</h2>
        <p className="mt-2 text-slate-600">
          {SHIPPING_METHOD_LABEL[order.shippingMethod]}
          {order.shippingDeliveryDays
            ? ` — até ${order.shippingDeliveryDays} dia(s) útil(eis)`
            : ""}
        </p>
        <p className="mt-1 text-slate-600">
          {order.address.street}, {order.address.number}
          {order.address.complement ? ` — ${order.address.complement}` : ""}
          <br />
          {order.address.district} — {order.address.city}/{order.address.state}
          <br />
          CEP {formatCep(order.address.cep)}
        </p>
      </section>
    </div>
  );
}
