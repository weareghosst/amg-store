/**
 * Páginas de categoria com hero próprio (imagem de fundo + parallax).
 * Adicionar uma categoria aqui é o único passo pra ela ganhar página em
 * /categorias/[slug] — sem entrada, ela continua usando a listagem genérica
 * em /produtos?categoria=slug.
 */
export type CategoryPageConfig = {
  title: string;
  tagline: string;
  background: string;
  accent?: {
    from: string;
    via: string;
    to: string;
    textClass: string;
    mutedTextClass: string;
  };
};

export const CATEGORY_PAGES: Record<string, CategoryPageConfig> = {
  "limpeza-higiene": {
    title: "Limpeza & Higiene",
    tagline:
      "Produtos para manter ambientes limpos, organizados e bem cuidados: químicos, descartáveis e itens para sua rotina.",
    background: "/background-limpeza&higiene.png",
  },
  epi: {
    title: "EPI",
    tagline:
      "Equipamentos de Proteção Individual para o dia a dia da sua empresa: luvas, botas, capacetes, óculos e muito mais.",
    background: "/background-epi.png",
  },
  piscina: {
    title: "Piscina",
    tagline:
      "Tudo para o tratamento e a manutenção da sua piscina: cloro, algicidas, clarificantes e acessórios.",
    background: "/background-piscina.png",
  },
  infantil: {
    title: "Infantil",
    tagline:
      "Produtos divertidos e práticos para o dia a dia das crianças, com qualidade e conforto para a família.",
    background: "/background-infantil.png",
    accent: {
      from: "#f472b6",
      via: "#f9a8d4",
      to: "#fdf2f8",
      textClass: "text-pink-50",
      mutedTextClass: "text-pink-100/90",
    },
  },
  "todos-produtos": {
    title: "Todos os produtos",
    tagline:
      "Encontre tudo o que sua empresa precisa em um só lugar: limpeza, higiene, EPIs, piscina e muito mais.",
    background: "/background-todosprodutos.png",
  },
};

export function categoryHref(slug: string): string {
  return CATEGORY_PAGES[slug] ? `/categorias/${slug}` : `/produtos?categoria=${slug}`;
}
