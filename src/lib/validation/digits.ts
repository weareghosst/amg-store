/** Mantém apenas os dígitos de uma string (usado p/ telefone e docs). */
export function onlyDigits(v: string): string {
  return v.replace(/\D/g, "");
}
