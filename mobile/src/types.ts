export type Category = {
  id: string;
  name: string;
  slug: string;
  position: number;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  sku: string | null;
  priceCents: number;
  comparePriceCents: number | null;
  stock: number;
  categoryId: string | null;
  imageUrl: string | null;
};

export type CatalogResponse = {
  categories: Category[];
  products: Product[];
  whatsappPhone: string;
};
