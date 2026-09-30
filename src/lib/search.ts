/** Normaliza textos para que a busca ignore acentos, pontuação e maiúsculas. */
export function normalizarBusca(valor: string): string {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Aceita palavras em qualquer ordem, facilitando buscas como "alcool 70". */
export function correspondeBusca(texto: string, consulta: string): boolean {
  const termos = normalizarBusca(consulta).split(" ").filter(Boolean);
  if (termos.length === 0) return true;

  const conteudo = normalizarBusca(texto);
  return termos.every((termo) => conteudo.includes(termo));
}
