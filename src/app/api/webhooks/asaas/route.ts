import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { orders, webhookEvents } from "@/db/schema";
import { audit } from "@/lib/audit";
import { restoreOrderStock, transitionOrderStatus } from "@/lib/orders";

export const runtime = "nodejs";

/**
 * Webhook do Asaas — ÚNICO caminho que confirma pagamento de pedido.
 * O front-end jamais muda status de pagamento.
 *
 * Segurança:
 *  1. Autenticação: header `asaas-access-token` comparado em tempo constante
 *     com o token configurado (definido por nós no painel do Asaas).
 *  2. Idempotência: o registro do evento e o efeito no pedido acontecem na
 *     MESMA transação — ou ambos são commitados, ou nenhum. Se o processo
 *     cair no meio, o retry do Asaas reprocessa do zero; repetições de um
 *     evento já commitado são ignoradas.
 *  3. Transições condicionais: o UPDATE só aplica se o status atual ainda
 *     for o esperado (nada de devolver estoque em dobro numa corrida).
 */

function isAuthorized(req: NextRequest): boolean {
  const expected = process.env.ASAAS_WEBHOOK_TOKEN;
  if (!expected) return false; // sem token configurado, rejeita tudo
  const received = req.headers.get("asaas-access-token") ?? "";
  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

interface AsaasWebhookBody {
  id?: string;
  event?: string;
  payment?: {
    id?: string;
    status?: string;
    externalReference?: string | null;
    billingType?: string;
  };
}

const PAID_EVENTS = ["PAYMENT_CONFIRMED", "PAYMENT_RECEIVED"];
const CANCEL_EVENTS = ["PAYMENT_OVERDUE", "PAYMENT_DELETED", "PAYMENT_REFUNDED"];

type Outcome =
  | { kind: "duplicate" }
  | { kind: "no_order" }
  | { kind: "ignored" }
  | { kind: "paid"; orderId: string }
  // Pagamento chegou com o pedido fora de pending_payment (ex.: boleto vencido
  // pago depois que PAYMENT_OVERDUE cancelou o pedido). Exige ação manual.
  | { kind: "paid_out_of_band"; orderId: string; orderStatus: string }
  | { kind: "canceled"; orderId: string }
  | { kind: "refund_notice"; orderId: string; orderStatus: string };

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: AsaasWebhookBody;
  try {
    body = (await req.json()) as AsaasWebhookBody;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const eventId = body.id;
  const eventType = body.event;
  const paymentId = body.payment?.id;
  if (!eventId || !eventType || !paymentId) {
    // Evento que não interessa (ou malformado): responde 200 para o Asaas não reenviar.
    return NextResponse.json({ received: true });
  }

  const db = getDb();

  // Se a transação falhar, nada é commitado (nem o registro do evento) e o
  // handler devolve 500 — o Asaas reenvia e o evento é reprocessado inteiro.
  const outcome = await db.transaction(async (tx): Promise<Outcome> => {
    const inserted = await tx
      .insert(webhookEvents)
      .values({ id: eventId, provider: "asaas", eventType, payload: body })
      .onConflictDoNothing()
      .returning({ id: webhookEvents.id });
    if (inserted.length === 0) return { kind: "duplicate" };

    const orderRows = await tx
      .select()
      .from(orders)
      .where(eq(orders.asaasPaymentId, paymentId))
      .limit(1);
    const order = orderRows[0];
    if (!order) return { kind: "no_order" };

    if (PAID_EVENTS.includes(eventType)) {
      const moved = await transitionOrderStatus(tx, {
        orderId: order.id,
        from: "pending_payment",
        to: "paid",
        extra: { paymentMethod: body.payment?.billingType ?? null },
      });
      if (moved) return { kind: "paid", orderId: order.id };
      if (order.status === "paid") return { kind: "ignored" };
      return { kind: "paid_out_of_band", orderId: order.id, orderStatus: order.status };
    }

    if (CANCEL_EVENTS.includes(eventType)) {
      const moved = await transitionOrderStatus(tx, {
        orderId: order.id,
        from: "pending_payment",
        to: "canceled",
      });
      if (moved) {
        // Cobrança vencida/cancelada antes do pagamento: devolve o estoque.
        await restoreOrderStock(tx, order.id);
        return { kind: "canceled", orderId: order.id };
      }
      if (eventType === "PAYMENT_REFUNDED") {
        // Reembolso após pagamento: registra para tratamento manual pelo admin.
        return { kind: "refund_notice", orderId: order.id, orderStatus: order.status };
      }
      return { kind: "ignored" };
    }

    return { kind: "ignored" };
  });

  // Auditoria fora da transação: é best-effort e não pode derrubar o commit.
  switch (outcome.kind) {
    case "duplicate":
      return NextResponse.json({ received: true, duplicate: true });
    case "no_order":
      console.warn("[webhook asaas] pagamento sem pedido correspondente:", paymentId);
      break;
    case "paid":
      await audit({
        action: "order.paid_via_webhook",
        entity: "order",
        entityId: outcome.orderId,
        detail: { eventType, paymentId },
      });
      break;
    case "paid_out_of_band":
      // Dinheiro entrou mas o pedido não estava mais aguardando pagamento
      // (provável boleto pago após vencimento). Precisa de estorno/tratamento manual.
      console.error(
        "[webhook asaas] ATENÇÃO: pagamento recebido para pedido em status",
        outcome.orderStatus,
        "— pedido:",
        outcome.orderId,
        "pagamento:",
        paymentId,
      );
      await audit({
        action: "order.payment_on_nonpending",
        entity: "order",
        entityId: outcome.orderId,
        detail: { eventType, paymentId, status: outcome.orderStatus },
      });
      break;
    case "canceled":
      await audit({
        action: "order.canceled_via_webhook",
        entity: "order",
        entityId: outcome.orderId,
        detail: { eventType, paymentId },
      });
      break;
    case "refund_notice":
      await audit({
        action: "order.refund_notice",
        entity: "order",
        entityId: outcome.orderId,
        detail: { eventType, paymentId, status: outcome.orderStatus },
      });
      break;
  }

  return NextResponse.json({ received: true });
}
