export function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

/** Converte centavos para o formato decimal em reais. */
export function centsToReais(cents: number): number {
  return Math.round(cents) / 100;
}

/**
 * Converte um preço em reais para centavos. Aceita "19,90" (formato BR,
 * pontos são separador de milhar) e "19.90" (ponto decimal, sem vírgula).
 */
export function parseReaisToCents(input: string): number | null {
  const trimmed = input.trim();
  if (trimmed === "") return null;
  const normalized = trimmed.includes(",")
    ? trimmed.replace(/\./g, "").replace(",", ".")
    : trimmed;
  const value = Number(normalized);
  if (!Number.isFinite(value) || value < 0) return null;
  return Math.round(value * 100);
}
