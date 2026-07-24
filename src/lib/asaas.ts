import "server-only";

/**
 * Cliente da API do Asaas (v3).
 * Docs: https://docs.asaas.com
 *
 * Segurança: usamos o checkout hospedado do Asaas (invoiceUrl). Dados de
 * cartão NUNCA passam pelo nosso servidor ou front-end — o cliente paga na
 * página segura do próprio Asaas (Pix, boleto ou cartão).
 */

function getConfig() {
  const apiKey = process.env.ASAAS_API_KEY;
  if (!apiKey) throw new Error("ASAAS_API_KEY não configurada.");
  const baseUrl = process.env.ASAAS_BASE_URL ?? "https://api-sandbox.asaas.com/v3";
  return { apiKey, baseUrl };
}

export function isAsaasConfigured(): boolean {
  return Boolean(process.env.ASAAS_API_KEY);
}

async function asaasFetch<T>(
  path: string,
  init?: { method?: string; body?: unknown },
): Promise<T> {
  const { apiKey, baseUrl } = getConfig();
  const res = await fetch(`${baseUrl}${path}`, {
    method: init?.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      access_token: apiKey,
      "User-Agent": "AMG-Store",
    },
    body: init?.body ? JSON.stringify(init.body) : undefined,
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error("[asaas] erro:", res.status, body.slice(0, 500));
    throw new Error("Falha na comunicação com o provedor de pagamento.");
  }
  return (await res.json()) as T;
}

export async function createAsaasCustomer(opts: {
  name: string;
  email: string;
  cpfCnpj: string;
  phone?: string;
}): Promise<{ id: string }> {
  return asaasFetch<{ id: string }>("/customers", {
    method: "POST",
    body: {
      name: opts.name,
      email: opts.email,
      cpfCnpj: opts.cpfCnpj,
      mobilePhone: opts.phone,
    },
  });
}

export interface AsaasPayment {
  id: string;
  status: string;
  invoiceUrl: string;
  value: number;
}

export async function createAsaasPayment(opts: {
  customerId: string;
  valueReais: number;
  description: string;
  externalReference: string;
  dueDate: string; // YYYY-MM-DD
}): Promise<AsaasPayment> {
  return asaasFetch<AsaasPayment>("/payments", {
    method: "POST",
    body: {
      customer: opts.customerId,
      // UNDEFINED = o cliente escolhe Pix, boleto ou cartão na página do Asaas
      billingType: "UNDEFINED",
      value: opts.valueReais,
      description: opts.description,
      externalReference: opts.externalReference,
      dueDate: opts.dueDate,
    },
  });
}

export async function getAsaasPayment(paymentId: string): Promise<{
  id: string;
  status: string;
  externalReference: string | null;
  billingType: string;
}> {
  return asaasFetch(`/payments/${paymentId}`);
}
