"use server";

import { randomInt } from "crypto";
import { and, eq, gte, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import {
  addresses,
  orders,
  orderItems,
  products,
  shippingQuotes,
  users,
} from "@/db/schema";
import { assertUser } from "@/lib/auth/guards";
import { getRequestIp } from "@/lib/auth/session";
import { rateLimit } from "@/lib/rate-limit";
import { audit } from "@/lib/audit";
import { centsToReais } from "@/lib/money";
import { restoreOrderStock, transitionOrderStatus } from "@/lib/orders";
import {
  createAsaasCustomer,
  createAsaasPayment,
  isAsaasConfigured,
} from "@/lib/asaas";
import {
  addressSchema,
  cartItemsSchema,
  cpfCnpjSchema,
  firstZodError,
} from "@/lib/validation/schemas";

const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function generateOrderCode(): string {
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  }
  return `AMG-${code}`;
}

const placeOrderSchema = z.object({
  quoteId: z.uuid(),
  optionIndex: z.number().int().min(0).max(9),
  items: cartItemsSchema,
  address: addressSchema,
  saveAddress: z.boolean().optional().default(false),
  cpfCnpj: z.string().optional().default(""),
});

export interface PlaceOrderResult {
  error?: string;
  orderCode?: string;
}

function sameItems(
  a: { productId: string; quantity: number }[],
  b: { productId: string; quantity: number }[],
): boolean {
  if (a.length !== b.length) return false;
  const sort = (arr: typeof a) =>
    [...arr].sort((x, y) => x.productId.localeCompare(y.productId));
  const sa = sort(a);
  const sb = sort(b);
  return sa.every(
    (item, i) => item.productId === sb[i].productId && item.quantity === sb[i].quantity,
  );
}

/**
 * Cria o pedido. Princípios de segurança aplicados aqui:
 *  - Preço dos produtos: relido do banco DENTRO da transação (nunca do cliente).
 *  - Preço do frete: lido da cotação persistida no servidor (nunca do cliente).
 *  - Estoque: baixado com UPDATE condicional atômico (sem corrida/oversell).
 *  - Pagamento: criado no Asaas pelo servidor; confirmação só via webhook.
 */
export async function placeOrderAction(input: unknown): Promise<PlaceOrderResult> {
  let user;
  try {
    user = await assertUser();
  } catch {
    return { error: "Faça login para finalizar a compra." };
  }

  const ip = await getRequestIp();
  const rl = await rateLimit({
    key: `checkout:${user.id}`,
    limit: 10,
    windowSeconds: 600,
  });
  if (!rl.allowed) {
    return { error: "Muitas tentativas de checkout. Aguarde alguns minutos." };
  }

  const parsed = placeOrderSchema.safeParse(input);
  if (!parsed.success) return { error: firstZodError(parsed.error) };
  const data = parsed.data;

  if (!isAsaasConfigured()) {
    return {
      error:
        "O pagamento online está temporariamente indisponível. Tente novamente em instantes.",
    };
  }

  const db = getDb();

  // 1) Valida a cotação de frete persistida
  const quoteRows = await db
    .select()
    .from(shippingQuotes)
    .where(
      and(
        eq(shippingQuotes.id, data.quoteId),
        eq(shippingQuotes.userId, user.id),
        gte(shippingQuotes.expiresAt, new Date()),
      ),
    )
    .limit(1);
  const quote = quoteRows[0];
  if (!quote) {
    return { error: "Cotação de frete expirada. Recalcule o frete." };
  }
  const option = quote.options[data.optionIndex];
  if (!option) return { error: "Opção de frete inválida." };
  if (quote.cep !== data.address.cep) {
    return { error: "O CEP do endereço difere do CEP da cotação. Recalcule o frete." };
  }
  if (!sameItems(quote.items, data.items)) {
    return { error: "O carrinho mudou desde a cotação. Recalcule o frete." };
  }

  // 2) CPF/CNPJ obrigatório para emitir a cobrança
  let cpfCnpj = user.cpfCnpj;
  if (!cpfCnpj) {
    const docParsed = cpfCnpjSchema.safeParse(data.cpfCnpj);
    if (!docParsed.success) {
      return { error: "Informe um CPF ou CNPJ válido para gerar a cobrança." };
    }
    cpfCnpj = docParsed.data;
    await db
      .update(users)
      .set({
        cpfCnpj,
        personType: cpfCnpj.length === 14 ? "PJ" : "PF",
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));
  }

  // 3) Garante o cliente no Asaas ANTES de mexer no estoque
  let asaasCustomerId = user.asaasCustomerId;
  if (!asaasCustomerId) {
    try {
      const customer = await createAsaasCustomer({
        name: user.name,
        email: user.email,
        cpfCnpj,
        phone: user.phone ?? undefined,
      });
      asaasCustomerId = customer.id;
      await db
        .update(users)
        .set({ asaasCustomerId, updatedAt: new Date() })
        .where(eq(users.id, user.id));
    } catch {
      return { error: "Não foi possível iniciar o pagamento. Verifique seu CPF/CNPJ." };
    }
  }

  // 4) Transação: consumo da cotação + baixa de estoque + criação do pedido
  const code = generateOrderCode();
  let orderId: string;
  let totalCents: number;
  try {
    const result = await db.transaction(async (tx) => {
      // Consome a cotação atomicamente: o DELETE ... RETURNING garante que
      // apenas UMA requisição concorrente (duplo clique/replay) prossegue —
      // a outra recebe 0 linhas e aborta antes de criar pedido ou cobrança.
      const consumed = await tx
        .delete(shippingQuotes)
        .where(
          and(
            eq(shippingQuotes.id, data.quoteId),
            eq(shippingQuotes.userId, user.id),
            gte(shippingQuotes.expiresAt, new Date()),
          ),
        )
        .returning({ id: shippingQuotes.id });
      if (consumed.length === 0) {
        throw new Error("QUOTE_ALREADY_USED");
      }

      let subtotalCents = 0;
      const itemsSnapshot: {
        productId: string;
        name: string;
        unitPriceCents: number;
        quantity: number;
      }[] = [];

      for (const item of data.items) {
        const updated = await tx
          .update(products)
          .set({
            stock: sql`${products.stock} - ${item.quantity}`,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(products.id, item.productId),
              eq(products.active, true),
              gte(products.stock, item.quantity),
            ),
          )
          .returning({
            name: products.name,
            priceCents: products.priceCents,
          });
        if (updated.length === 0) {
          throw new Error("OUT_OF_STOCK");
        }
        subtotalCents += updated[0].priceCents * item.quantity;
        itemsSnapshot.push({
          productId: item.productId,
          name: updated[0].name,
          unitPriceCents: updated[0].priceCents,
          quantity: item.quantity,
        });
      }

      const total = subtotalCents + option.priceCents;
      const [order] = await tx
        .insert(orders)
        .values({
          code,
          userId: user.id,
          status: "pending_payment",
          subtotalCents,
          shippingCents: option.priceCents,
          totalCents: total,
          shippingMethod: option.method,
          shippingLabel: option.label,
          shippingDeliveryDays: option.deliveryDays,
          address: {
            cep: data.address.cep,
            street: data.address.street,
            number: data.address.number,
            complement: data.address.complement || null,
            district: data.address.district,
            city: data.address.city,
            state: data.address.state,
          },
        })
        .returning({ id: orders.id });

      await tx.insert(orderItems).values(
        itemsSnapshot.map((item) => ({
          orderId: order.id,
          productId: item.productId,
          name: item.name,
          unitPriceCents: item.unitPriceCents,
          quantity: item.quantity,
        })),
      );

      return { orderId: order.id, totalCents: total };
    });
    orderId = result.orderId;
    totalCents = result.totalCents;
  } catch (err) {
    if (err instanceof Error && err.message === "OUT_OF_STOCK") {
      return {
        error:
          "Um dos produtos não tem estoque suficiente. Revise o carrinho e tente novamente.",
      };
    }
    if (err instanceof Error && err.message === "QUOTE_ALREADY_USED") {
      return {
        error: "Esta cotação de frete já foi utilizada ou expirou. Recalcule o frete.",
      };
    }
    console.error("[checkout] erro na transação:", err);
    return { error: "Erro ao criar o pedido. Tente novamente." };
  }

  // 5) Cria a cobrança no Asaas; se falhar, desfaz o pedido (compensação)
  try {
    const dueDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    const payment = await createAsaasPayment({
      customerId: asaasCustomerId,
      valueReais: centsToReais(totalCents),
      description: `Pedido ${code} — AMG`,
      externalReference: orderId,
      dueDate,
    });
    await db
      .update(orders)
      .set({
        asaasPaymentId: payment.id,
        paymentUrl: payment.invoiceUrl,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId));
  } catch (err) {
    console.error("[checkout] falha ao criar cobrança, desfazendo pedido:", err);
    await db.transaction(async (tx) => {
      // Transição condicional: se alguém já cancelou este pedido em paralelo,
      // não devolve o estoque uma segunda vez.
      const moved = await transitionOrderStatus(tx, {
        orderId,
        from: "pending_payment",
        to: "canceled",
      });
      if (moved) {
        await restoreOrderStock(tx, orderId);
      }
    });
    return { error: "Não foi possível gerar a cobrança. Nenhum valor foi reservado." };
  }

  // 6) Extras não-críticos
  if (data.saveAddress) {
    try {
      await db.insert(addresses).values({
        userId: user.id,
        label: data.address.label || "Principal",
        cep: data.address.cep,
        street: data.address.street,
        number: data.address.number,
        complement: data.address.complement || null,
        district: data.address.district,
        city: data.address.city,
        state: data.address.state,
      });
    } catch (err) {
      console.error("[checkout] falha ao salvar endereço:", err);
    }
  }

  await audit({
    userId: user.id,
    action: "order.create",
    entity: "order",
    entityId: orderId,
    detail: { code, totalCents },
    ip,
  });

  return { orderCode: code };
}
