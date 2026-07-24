"use server";

import { z } from "zod";
import { getCurrentUser, getRequestIp } from "@/lib/auth/session";
import { rateLimit } from "@/lib/rate-limit";
import { lookupCep, normalizeCep, type CepInfo } from "@/lib/cep";
import { createShippingQuote, type QuoteOption } from "@/lib/shipping/quote";
import { cartItemsSchema, firstZodError } from "@/lib/validation/schemas";

/** Consulta ViaCEP pelo servidor (autopreenchimento de endereço). */
export async function lookupCepAction(cep: string): Promise<CepInfo | null> {
  const ip = await getRequestIp();
  const rl = await rateLimit({ key: `cep:${ip}`, limit: 30, windowSeconds: 300 });
  if (!rl.allowed) return null;
  const normalized = normalizeCep(String(cep ?? ""));
  if (!normalized) return null;
  return lookupCep(normalized);
}

export interface QuoteShippingResult {
  error?: string;
  quoteId?: string;
  options?: QuoteOption[];
}

const quoteInputSchema = z.object({
  cep: z.string(),
  items: cartItemsSchema,
});

export async function quoteShippingAction(input: {
  cep: string;
  items: { productId: string; quantity: number }[];
}): Promise<QuoteShippingResult> {
  const ip = await getRequestIp();
  // Cotações chamam API externa — limite mais apertado por IP.
  const rl = await rateLimit({ key: `quote:${ip}`, limit: 30, windowSeconds: 600 });
  if (!rl.allowed) {
    return { error: "Muitas cotações seguidas. Aguarde um instante." };
  }

  const parsed = quoteInputSchema.safeParse(input);
  if (!parsed.success) return { error: firstZodError(parsed.error) };

  const cep = normalizeCep(parsed.data.cep);
  if (!cep) return { error: "CEP inválido." };

  const user = await getCurrentUser();

  try {
    const result = await createShippingQuote({
      userId: user?.id ?? null,
      cep,
      items: parsed.data.items,
    });
    return { quoteId: result.quoteId, options: result.options };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Não foi possível calcular o frete.";
    return { error: message };
  }
}
