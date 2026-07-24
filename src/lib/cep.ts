/**
 * Utilidades de CEP. A decisão "é SP ou não" é feita NO SERVIDOR a partir
 * da faixa oficial de CEPs (SP: 01000-000 a 19999-999), nunca a partir de
 * um campo de estado enviado pelo navegador.
 */

export function normalizeCep(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  return digits.length === 8 ? digits : null;
}

export function formatCep(cep: string): string {
  return cep.length === 8 ? `${cep.slice(0, 5)}-${cep.slice(5)}` : cep;
}

/** Faixa de CEP do estado de São Paulo. */
export function isSaoPauloState(cep: string): boolean {
  const n = Number(cep);
  return n >= 1000000 && n <= 19999999;
}

/** Faixa de CEP da capital (município de São Paulo): 01000-000 a 05999-999 e 08000-000 a 08499-999. */
export function isSaoPauloCapital(cep: string): boolean {
  const n = Number(cep);
  return (n >= 1000000 && n <= 5999999) || (n >= 8000000 && n <= 8499999);
}

export interface CepInfo {
  cep: string;
  street: string;
  district: string;
  city: string;
  state: string;
}

/** Consulta ViaCEP (usada para autopreencher endereço e validar cidade/UF). */
export async function lookupCep(cep: string): Promise<CepInfo | null> {
  const normalized = normalizeCep(cep);
  if (!normalized) return null;
  try {
    const res = await fetch(`https://viacep.com.br/ws/${normalized}/json/`, {
      signal: AbortSignal.timeout(6000),
      cache: "force-cache",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      erro?: boolean;
      logradouro?: string;
      bairro?: string;
      localidade?: string;
      uf?: string;
    };
    if (data.erro) return null;
    return {
      cep: normalized,
      street: data.logradouro ?? "",
      district: data.bairro ?? "",
      city: data.localidade ?? "",
      state: data.uf ?? "",
    };
  } catch {
    return null;
  }
}
