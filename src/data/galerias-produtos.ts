/** Fotos adicionais recebidas; a primeira foto continua sendo a capa do produto. */
export const galeriasRecebidas: Record<string, string[]> = {
  "coala-home-odorizante-de-ambientes-e-tecidos-cha-branco-260-ml": ["/produtos/coala-home-odorizante-de-ambientes-e-tecidos-cha-branco-260-ml-2.webp"],
  "coala-home-odorizante-de-ambientes-e-tecidos-lavanda-260-ml": ["/produtos/coala-home-odorizante-de-ambientes-e-tecidos-lavanda-260-ml-2.webp"],
  "coala-home-odorizante-de-ambientes-e-tecidos-orquidea-negra-260-ml": ["/produtos/coala-home-odorizante-de-ambientes-e-tecidos-orquidea-negra-260-ml-2.webp"],
  "coala-home-odorizante-de-ambientes-e-tecidos-the-queen-260-ml": ["/produtos/coala-home-odorizante-de-ambientes-e-tecidos-the-queen-260-ml-2.webp"],
  "coala-home-sabonete-liquido-bambu-500-ml": ["/produtos/coala-home-sabonete-liquido-bambu-500-ml-2.webp"],
  "coala-home-sabonete-liquido-cha-branco-500-ml": ["/produtos/coala-home-sabonete-liquido-cha-branco-500-ml-2.webp"],
  "coala-home-sabonete-liquido-flor-de-cacto-500-ml": ["/produtos/coala-home-sabonete-liquido-flor-de-cacto-500-ml-2.webp"],
  "coala-home-sabonete-liquido-lavanda-500-ml": ["/produtos/coala-home-sabonete-liquido-lavanda-500-ml-2.webp"],
  "coala-home-sabonete-liquido-orquidea-negra-500-ml": ["/produtos/coala-home-sabonete-liquido-orquidea-negra-500-ml-2.webp"],
  "coala-home-sabonete-liquido-sol-do-brasil-500-ml": ["/produtos/coala-home-sabonete-liquido-sol-do-brasil-500-ml-2.webp"],
  "coala-home-sabonete-liquido-the-queen-500-ml": ["/produtos/coala-home-sabonete-liquido-the-queen-500-ml-2.webp"],
  "coala-odorizante-de-ambientes-aerossol-cha-branco-400-ml": ["/produtos/coala-odorizante-de-ambientes-aerossol-cha-branco-400-ml-2.webp"],
  "coala-odorizante-de-ambientes-aerossol-flor-de-cacto-400-ml": ["/produtos/coala-odorizante-de-ambientes-aerossol-flor-de-cacto-400-ml-2.webp"],
};

export function imagensRecebidas(slug: string): string[] {
  return galeriasRecebidas[slug] ?? [];
}
