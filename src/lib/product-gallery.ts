import "server-only";
import { inArray } from "drizzle-orm";
import { getDb } from "@/db";
import type { Db, DbTransaction } from "@/db";
import { settings } from "@/db/schema";
import { imagensRecebidas } from "@/data/galerias-produtos";
import { galleryImagesSchema } from "@/lib/validation/schemas";

type GalleryProduct = { id: string; slug: string; imageUrl: string | null };
const galleryKey = (id: string) => `product_gallery:${id}`;

export async function getProductGalleries(products: GalleryProduct[]): Promise<Map<string, string[]>> {
  const galleries = new Map(products.map((product) => [
    product.id,
    [...new Set([product.imageUrl, ...imagensRecebidas(product.slug)].filter((url): url is string => Boolean(url)))],
  ]));
  if (!products.length) return galleries;
  try {
    const rows = await getDb().select().from(settings)
      .where(inArray(settings.key, products.map((product) => galleryKey(product.id))));
    for (const product of products) {
      const row = rows.find((item) => item.key === galleryKey(product.id));
      if (!row) continue;
      const parsed = galleryImagesSchema.safeParse(row.value);
      if (parsed.success) {
        galleries.set(product.id, [...new Set([product.imageUrl, ...parsed.data].filter((url): url is string => Boolean(url)))]);
      }
    }
  } catch (error) {
    console.error("[galeria] Não foi possível ler as fotos adicionais:", error);
  }
  return galleries;
}

export async function saveProductGallery(id: string, images: string[], db: Db | DbTransaction = getDb()): Promise<void> {
  await db.insert(settings).values({ key: galleryKey(id), value: images })
    .onConflictDoUpdate({ target: settings.key, set: { value: images, updatedAt: new Date() } });
}
