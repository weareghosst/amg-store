import type { Category, Product } from "@/db/schema";

export type MobileCategory = Pick<Category, "id" | "name" | "slug" | "position">;

export type MobileProduct = Pick<
  Product,
  | "id"
  | "name"
  | "slug"
  | "description"
  | "sku"
  | "priceCents"
  | "comparePriceCents"
  | "stock"
  | "categoryId"
  | "imageUrl"
>;

export function toMobileCategory(category: Category): MobileCategory {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    position: category.position,
  };
}

export function toMobileProduct(product: Product): MobileProduct {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    sku: product.sku,
    priceCents: product.priceCents,
    comparePriceCents: product.comparePriceCents,
    stock: product.stock,
    categoryId: product.categoryId,
    imageUrl: product.imageUrl,
  };
}

/**
 * O catálogo é público e não usa cookies, então pode ser consultado pelo app
 * instalado (https://localhost no Android) sem afrouxar a CSP do site.
 */
export const mobilePublicHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
  Vary: "Origin",
} as const;

export function mobileOptionsResponse(): Response {
  return new Response(null, { status: 204, headers: mobilePublicHeaders });
}
