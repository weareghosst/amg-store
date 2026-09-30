import type { MetadataRoute } from "next";
import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { categories, products } from "@/db/schema";
import {
  combinarCategorias,
  combinarProdutos,
} from "@/data/produtos-recebidos";
import { categoryHref } from "@/lib/category-pages";
import { absoluteSiteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let categoryList: (typeof categories.$inferSelect)[] = [];
  let productList: (typeof products.$inferSelect)[] = [];

  try {
    const db = getDb();
    [categoryList, productList] = await Promise.all([
      db.select().from(categories).orderBy(categories.position),
      db
        .select()
        .from(products)
        .where(eq(products.active, true))
        .orderBy(desc(products.updatedAt)),
    ]);
  } catch (error) {
    console.error("[sitemap] banco indisponível:", error);
  }

  categoryList = combinarCategorias(categoryList);
  productList = combinarProdutos(productList, categoryList);

  const now = new Date();
  const staticPages: MetadataRoute.Sitemap = [
    ["/", 1],
    ["/produtos", 0.9],
    ["/sobre", 0.6],
    ["/como-comprar", 0.6],
    ["/privacidade", 0.3],
  ].map(([pathname, priority]) => ({
    url: absoluteSiteUrl(pathname as string),
    lastModified: now,
    changeFrequency: pathname === "/" || pathname === "/produtos" ? "daily" : "monthly",
    priority: priority as number,
  }));

  const categoryUrls = [...new Set(categoryList.map((category) => categoryHref(category.slug)))];
  const categoryPages: MetadataRoute.Sitemap = categoryUrls.map((pathname) => ({
    url: absoluteSiteUrl(pathname),
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const productPages: MetadataRoute.Sitemap = productList.map((product) => ({
    url: absoluteSiteUrl(`/produtos/${product.slug}`),
    lastModified: product.updatedAt,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticPages, ...categoryPages, ...productPages];
}
