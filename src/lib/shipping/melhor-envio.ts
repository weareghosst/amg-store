import "server-only";

/**
 * Cliente da API do Melhor Envio (cálculo de frete).
 * Docs: https://docs.melhorenvio.com.br
 */

interface MeCalculateProduct {
  id: string;
  width: number; // cm
  height: number; // cm
  length: number; // cm
  weight: number; // kg
  insurance_value: number; // reais
  quantity: number;
}

export interface MeShippingOption {
  serviceId: number;
  label: string;
  priceCents: number;
  deliveryDays: number;
}

export function isMelhorEnvioConfigured(): boolean {
  return Boolean(process.env.MELHOR_ENVIO_TOKEN);
}

export async function calculateMelhorEnvio(opts: {
  fromCep: string;
  toCep: string;
  products: MeCalculateProduct[];
}): Promise<MeShippingOption[]> {
  const token = process.env.MELHOR_ENVIO_TOKEN;
  if (!token) {
    throw new Error("MELHOR_ENVIO_TOKEN não configurado.");
  }
  const baseUrl =
    process.env.MELHOR_ENVIO_BASE_URL ?? "https://sandbox.melhorenvio.com.br";
  const contactEmail =
    process.env.MELHOR_ENVIO_CONTACT_EMAIL ?? "contato@amg.com.br";

  const res = await fetch(`${baseUrl}/api/v2/me/shipment/calculate`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "User-Agent": `AMG Store (${contactEmail})`,
    },
    body: JSON.stringify({
      from: { postal_code: opts.fromCep },
      to: { postal_code: opts.toCep },
      products: opts.products,
    }),
    signal: AbortSignal.timeout(12000),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error("[melhor-envio] erro na cotação:", res.status, body.slice(0, 500));
    throw new Error("Falha ao cotar frete no Melhor Envio.");
  }

  const data = (await res.json()) as Array<{
    id: number;
    name: string;
    price?: string;
    delivery_time?: number;
    error?: string;
    company?: { name?: string };
  }>;

  return data
    .filter((s) => !s.error && s.price)
    .map((s) => ({
      serviceId: s.id,
      label: `${s.company?.name ?? ""} ${s.name}`.trim(),
      priceCents: Math.round(Number(s.price) * 100),
      deliveryDays: s.delivery_time ?? 10,
    }))
    .filter((s) => Number.isFinite(s.priceCents) && s.priceCents > 0)
    .sort((a, b) => a.priceCents - b.priceCents);
}
