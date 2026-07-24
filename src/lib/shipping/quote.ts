import "server-only";
import { inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { products, shippingQuotes } from "@/db/schema";
import { isSaoPauloCapital, isSaoPauloState } from "@/lib/cep";
import { getStoreSettings } from "@/lib/settings";
import { centsToReais } from "@/lib/money";
import {
  calculateMelhorEnvio,
  isMelhorEnvioConfigured,
} from "./melhor-envio";

export interface QuoteOption {
  method: "own_delivery" | "melhor_envio";
  serviceId: number | null;
  label: string;
  priceCents: number;
  deliveryDays: number;
}

export interface QuoteResult {
  quoteId: string;
  options: QuoteOption[];
}

const QUOTE_TTL_MS = 1000 * 60 * 30; // cotação vale por 30 minutos

/**
 * Gera as opções de frete NO SERVIDOR e as persiste. O checkout só aceita
 * uma opção que exista em uma cotação persistida e não expirada — o valor
 * do frete jamais é aceito vindo do navegador.
 *
 * Regra de negócio:
 *  - CEP dentro de SP  -> entrega própria AMG (taxa configurável no admin)
 *  - CEP fora de SP    -> serviços cotados via Melhor Envio
 */
export async function createShippingQuote(opts: {
  userId: string | null;
  cep: string; // já normalizado (8 dígitos)
  items: { productId: string; quantity: number }[];
}): Promise<QuoteResult> {
  const db = getDb();
  const settings = await getStoreSettings();

  const ids = opts.items.map((i) => i.productId);
  const rows = await db.select().from(products).where(inArray(products.id, ids));

  const options: QuoteOption[] = [];
  const inOwnDeliveryArea =
    settings.ownDeliveryScope === "capital"
      ? isSaoPauloCapital(opts.cep)
      : isSaoPauloState(opts.cep);

  let subtotalCents = 0;
  for (const item of opts.items) {
    const product = rows.find((p) => p.id === item.productId);
    if (!product || !product.active) {
      throw new Error("Um dos produtos do carrinho não está mais disponível.");
    }
    subtotalCents += product.priceCents * item.quantity;
  }

  if (inOwnDeliveryArea) {
    const free =
      settings.ownDeliveryFreeAboveCents > 0 &&
      subtotalCents >= settings.ownDeliveryFreeAboveCents;
    options.push({
      method: "own_delivery",
      serviceId: null,
      label: "Entrega própria AMG",
      priceCents: free ? 0 : settings.ownDeliveryFeeCents,
      deliveryDays: settings.ownDeliveryDays,
    });
  } else {
    if (!isMelhorEnvioConfigured()) {
      throw new Error(
        "No momento não conseguimos calcular o frete para fora de SP. Tente novamente mais tarde.",
      );
    }
    const meProducts = opts.items.map((item) => {
      const product = rows.find((p) => p.id === item.productId)!;
      return {
        id: product.id,
        width: product.widthCm,
        height: product.heightCm,
        length: product.lengthCm,
        weight: product.weightGrams / 1000,
        insurance_value: centsToReais(product.priceCents),
        quantity: item.quantity,
      };
    });
    const meOptions = await calculateMelhorEnvio({
      fromCep: settings.originCep,
      toCep: opts.cep,
      products: meProducts,
    });
    if (meOptions.length === 0) {
      throw new Error("Nenhuma transportadora atende este CEP no momento.");
    }
    for (const o of meOptions.slice(0, 5)) {
      options.push({
        method: "melhor_envio",
        serviceId: o.serviceId,
        label: o.label,
        priceCents: o.priceCents,
        deliveryDays: o.deliveryDays,
      });
    }
  }

  const [quote] = await db
    .insert(shippingQuotes)
    .values({
      userId: opts.userId,
      cep: opts.cep,
      items: opts.items,
      options,
      expiresAt: new Date(Date.now() + QUOTE_TTL_MS),
    })
    .returning({ id: shippingQuotes.id });

  return { quoteId: quote.id, options };
}
