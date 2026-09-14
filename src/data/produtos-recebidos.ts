import type { Category, Product } from "@/db/schema";

const DATA_RECEBIMENTO = new Date("2026-09-14T12:00:00.000Z");

export const categoriasRecebidas: Category[] = [
  {
    id: "20000000-0000-4000-8000-000000000001",
    name: "Limpadores perfumados",
    slug: "limpadores-perfumados",
    position: 10,
    createdAt: DATA_RECEBIMENTO,
  },
  {
    id: "20000000-0000-4000-8000-000000000002",
    name: "Limpadores multiuso",
    slug: "limpadores-multiuso",
    position: 20,
    createdAt: DATA_RECEBIMENTO,
  },
  {
    id: "20000000-0000-4000-8000-000000000003",
    name: "Desinfetantes",
    slug: "desinfetantes",
    position: 30,
    createdAt: DATA_RECEBIMENTO,
  },
];

export interface ProdutoRecebido {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  categoriaSlug: string;
}

export const produtosRecebidos: ProdutoRecebido[] = [
  {
    id: "10000000-0000-4000-8000-000000000001",
    name: "Zulu Perfumes Limpador Perfumado Chá Branco 500 ml",
    slug: "zulu-limpador-perfumado-cha-branco-500ml",
    description:
      "Limpador perfumado indicado para pisos e outras superfícies laváveis. Auxilia na limpeza do dia a dia e deixa uma fragrância agradável no ambiente.",
    imageUrl: "/produtos/zulu-cha-branco.webp",
    categoriaSlug: "limpadores-perfumados",
  },
  {
    id: "10000000-0000-4000-8000-000000000002",
    name: "Zulu Perfumes Limpador Perfumado Algodão 500 ml",
    slug: "zulu-limpador-perfumado-algodao-500ml",
    description:
      "Limpador perfumado desenvolvido para a limpeza diária de pisos e superfícies laváveis, deixando o ambiente com fragrância de algodão.",
    imageUrl: "/produtos/zulu-algodao.webp",
    categoriaSlug: "limpadores-perfumados",
  },
  {
    id: "10000000-0000-4000-8000-000000000003",
    name: "Zulu Perfumes Limpador Perfumado Cereja 500 ml",
    slug: "zulu-limpador-perfumado-cereja-500ml",
    description:
      "Limpador perfumado para a limpeza geral de pisos e superfícies laváveis, ajudando a remover sujeiras e deixando fragrância de cereja.",
    imageUrl: "/produtos/zulu-cereja.webp",
    categoriaSlug: "limpadores-perfumados",
  },
  {
    id: "10000000-0000-4000-8000-000000000004",
    name: "Zulu Perfumes Limpador Perfumado Verde 500 ml",
    slug: "zulu-limpador-perfumado-verde-500ml",
    description:
      "Limpador perfumado para a limpeza de pisos e superfícies laváveis, proporcionando praticidade e perfume agradável após o uso.",
    imageUrl: "/produtos/zulu-verde.webp",
    categoriaSlug: "limpadores-perfumados",
  },
  {
    id: "10000000-0000-4000-8000-000000000005",
    name: "UAU Perfumes Limpador Perfumado Chá Branco",
    slug: "uau-limpador-perfumado-cha-branco",
    description:
      "Limpador perfumado indicado para pisos e superfícies laváveis, auxiliando na limpeza e deixando fragrância de chá branco no ambiente.",
    imageUrl: "/produtos/uau-cha-branco.webp",
    categoriaSlug: "limpadores-perfumados",
  },
  {
    id: "10000000-0000-4000-8000-000000000006",
    name: "UAU Perfumes Limpador Perfumado Brisa e Frescor",
    slug: "uau-limpador-perfumado-brisa-e-frescor",
    description:
      "Limpador perfumado indicado para a limpeza diária de pisos e outras superfícies laváveis, deixando uma agradável sensação de frescor.",
    imageUrl: "/produtos/uau-brisa-e-frescor.jpg",
    categoriaSlug: "limpadores-perfumados",
  },
  {
    id: "10000000-0000-4000-8000-000000000007",
    name: "UAU Perfumes Limpador Perfumado Flores e Sonhos",
    slug: "uau-limpador-perfumado-flores-e-sonhos",
    description:
      "Limpador perfumado para pisos e superfícies laváveis, combinando limpeza prática com a fragrância Flores e Sonhos.",
    imageUrl: "/produtos/uau-flores-e-sonhos.webp",
    categoriaSlug: "limpadores-perfumados",
  },
  {
    id: "10000000-0000-4000-8000-000000000008",
    name: "UAU Perfumes Limpador Perfumado Lavanda e Conforto",
    slug: "uau-limpador-perfumado-lavanda-e-conforto",
    description:
      "Limpador perfumado para a rotina de limpeza de pisos e superfícies laváveis, com fragrância de lavanda e sensação de conforto.",
    imageUrl: "/produtos/uau-lavanda-e-conforto.webp",
    categoriaSlug: "limpadores-perfumados",
  },
  {
    id: "10000000-0000-4000-8000-000000000009",
    name: "UAU Perfumes Limpador Perfumado Requinte",
    slug: "uau-limpador-perfumado-requinte",
    description:
      "Limpador perfumado indicado para diferentes ambientes, auxiliando na limpeza de superfícies laváveis e deixando uma fragrância marcante.",
    imageUrl: "/produtos/uau-requinte.jpg",
    categoriaSlug: "limpadores-perfumados",
  },
  {
    id: "10000000-0000-4000-8000-000000000010",
    name: "Veja Gold Multiuso Azul",
    slug: "veja-gold-multiuso-azul",
    description:
      "Limpador multiuso indicado para a limpeza diária de diferentes superfícies laváveis, auxiliando na remoção de gordura, poeira e sujeiras do cotidiano.",
    imageUrl: "/produtos/veja-gold-azul.webp",
    categoriaSlug: "limpadores-multiuso",
  },
  {
    id: "10000000-0000-4000-8000-000000000011",
    name: "Veja Gold Multiuso Verde",
    slug: "veja-gold-multiuso-verde",
    description:
      "Limpador multiuso para diferentes ambientes da casa, desenvolvido para proporcionar praticidade e eficiência na limpeza de superfícies laváveis.",
    imageUrl: "/produtos/veja-gold-verde.webp",
    categoriaSlug: "limpadores-multiuso",
  },
  {
    id: "10000000-0000-4000-8000-000000000012",
    name: "Veja Gold Multiuso Roxo",
    slug: "veja-gold-multiuso-roxo",
    description:
      "Limpador multiuso indicado para a remoção de sujeiras em diferentes superfícies, proporcionando uma limpeza prática no dia a dia.",
    imageUrl: "/produtos/veja-gold-roxo.webp",
    categoriaSlug: "limpadores-multiuso",
  },
  {
    id: "10000000-0000-4000-8000-000000000013",
    name: "Pinho Sol Original",
    slug: "pinho-sol-original",
    description:
      "Desinfetante indicado para limpeza e higienização de pisos, banheiros e diversas superfícies laváveis, com a tradicional fragrância de pinho.",
    imageUrl: "/produtos/pinho-sol-original.webp",
    categoriaSlug: "desinfetantes",
  },
  {
    id: "10000000-0000-4000-8000-000000000014",
    name: "Ypê Bak Floral",
    slug: "ype-bak-floral",
    description:
      "Desinfetante indicado para a limpeza e higienização de pisos e superfícies laváveis, com fragrância floral agradável.",
    imageUrl: "/produtos/ype-bak-variantes.jpg",
    categoriaSlug: "desinfetantes",
  },
  {
    id: "10000000-0000-4000-8000-000000000015",
    name: "Ypê Bak Lavanda",
    slug: "ype-bak-lavanda",
    description:
      "Desinfetante para a limpeza e higienização de diferentes ambientes, indicado para pisos e outras superfícies laváveis.",
    imageUrl: "/produtos/ype-bak-variantes.jpg",
    categoriaSlug: "desinfetantes",
  },
  {
    id: "10000000-0000-4000-8000-000000000016",
    name: "Ypê Bak Eucalipto",
    slug: "ype-bak-eucalipto",
    description:
      "Desinfetante indicado para a rotina de limpeza de pisos e superfícies laváveis, com fragrância de eucalipto.",
    imageUrl: "/produtos/ype-bak-variantes.jpg",
    categoriaSlug: "desinfetantes",
  },
  {
    id: "10000000-0000-4000-8000-000000000017",
    name: "Ypê Bak Branco",
    slug: "ype-bak-branco",
    description:
      "Desinfetante indicado para limpeza e higienização de pisos e superfícies laváveis, ajudando a manter os ambientes limpos e agradáveis.",
    imageUrl: "/produtos/ype-bak-variantes.jpg",
    categoriaSlug: "desinfetantes",
  },
];

export function combinarCategorias(categoriasDoBanco: Category[]): Category[] {
  const porSlug = new Map(categoriasRecebidas.map((categoria) => [categoria.slug, categoria]));
  for (const categoria of categoriasDoBanco) porSlug.set(categoria.slug, categoria);
  return [...porSlug.values()].sort(
    (a, b) => a.position - b.position || a.name.localeCompare(b.name, "pt-BR"),
  );
}

export function montarProdutosRecebidos(categorias: Category[]): Product[] {
  const categoriaPorSlug = new Map(categorias.map((categoria) => [categoria.slug, categoria]));

  return produtosRecebidos.map((produto) => ({
    id: produto.id,
    name: produto.name,
    slug: produto.slug,
    description: produto.description,
    sku: null,
    priceCents: 0,
    comparePriceCents: null,
    stock: 0,
    categoryId: categoriaPorSlug.get(produto.categoriaSlug)?.id ?? null,
    imageUrl: produto.imageUrl,
    active: true,
    createdAt: DATA_RECEBIMENTO,
    updatedAt: DATA_RECEBIMENTO,
  }));
}

export function combinarProdutos(
  produtosDoBanco: Product[],
  categorias: Category[],
): Product[] {
  const porSlug = new Map(
    montarProdutosRecebidos(categorias).map((produto) => [produto.slug, produto]),
  );
  for (const produto of produtosDoBanco) porSlug.set(produto.slug, produto);
  return [...porSlug.values()];
}
