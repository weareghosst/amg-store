import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { categories, products } from "@/db/schema";
import { formatBRL } from "@/lib/money";
import { WhatsAppBuy } from "@/components/whatsapp-buy";
import { AddToQuote } from "@/components/add-to-quote";
import {
  combinarCategorias,
  combinarProdutos,
} from "@/data/produtos-recebidos";
import { absoluteSiteUrl } from "@/lib/site-url";
import { ProductGallery } from "@/components/product-gallery";
import { FavoriteButton } from "@/components/favorite-button";
import { getProductGalleries } from "@/lib/product-gallery";

export const dynamic = "force-dynamic";

const carregarProduto = cache(async (slug: string) => {
  let productList: (typeof products.$inferSelect)[] = [];
  let categoryList: (typeof categories.$inferSelect)[] = [];
  try {
    const db = getDb();
    [productList, categoryList] = await Promise.all([
      db
        .select()
        .from(products)
        .where(and(eq(products.slug, slug), eq(products.active, true)))
        .limit(1),
      db.select().from(categories).orderBy(categories.position),
    ]);
  } catch (err) {
    console.error(`[produtos/${slug}] banco indisponível:`, err);
  }

  categoryList = combinarCategorias(categoryList);
  const product = combinarProdutos(productList, categoryList).find(
    (item) => item.slug === slug,
  );
  const category = product
    ? categoryList.find((item) => item.id === product.categoryId) ?? null
    : null;

  return { product, category };
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { product } = await carregarProduto(slug);
  if (!product) return { title: "Produto não encontrado" };

  const description = product.description.slice(0, 160) ||
    `Consulte informações e disponibilidade de ${product.name} na AMG.`;
  const images = product.imageUrl && !product.imageUrl.startsWith("data:")
    ? [{ url: product.imageUrl, alt: product.name }]
    : undefined;

  return {
    title: product.name,
    description,
    alternates: { canonical: `/produtos/${product.slug}` },
    openGraph: {
      type: "website",
      title: product.name,
      description,
      url: `/produtos/${product.slug}`,
      images,
    },
    twitter: {
      card: images ? "summary_large_image" : "summary",
      title: product.name,
      description,
      images,
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { product, category } = await carregarProduto(slug);
  if (!product) notFound();
  const gallery = (await getProductGalleries([product])).get(product.id) ?? [];
  const priceOnRequest = product.priceCents <= 0;
  const productUrl = absoluteSiteUrl(`/produtos/${product.slug}`);
  const imageUrl = product.imageUrl && !product.imageUrl.startsWith("data:")
    ? absoluteSiteUrl(product.imageUrl)
    : undefined;
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || undefined,
    image: imageUrl,
    sku: product.sku || undefined,
    category: category?.name,
    url: productUrl,
    ...(product.priceCents > 0
      ? {
          offers: {
            "@type": "Offer",
            url: productUrl,
            priceCurrency: "BRL",
            price: (product.priceCents / 100).toFixed(2),
            availability: product.stock > 0
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
          },
        }
      : {}),
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />
      <nav className="mb-4 text-sm text-slate-500">
        <Link href="/produtos" className="hover:text-brand-blue">
          Produtos
        </Link>
        {category && (
          <>
            {" / "}
            <Link
              href={`/produtos?categoria=${category.slug}`}
              className="hover:text-brand-blue"
            >
              {category.name}
            </Link>
          </>
        )}
        {" / "}
        <span className="text-slate-700">{product.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        <ProductGallery key={product.id} images={gallery} name={product.name} />

        <div className="flex flex-col gap-4">
          <div>
            {product.sku && (
              <p className="text-xs uppercase tracking-wide text-slate-400">
                SKU: {product.sku}
              </p>
            )}
            <h1 className="mt-1 text-3xl font-bold text-slate-900">{product.name}</h1>
          </div>
          <FavoriteButton id={product.id} name={product.name} full />

          <div className="flex items-baseline gap-3">
            {!priceOnRequest && product.comparePriceCents &&
              product.comparePriceCents > product.priceCents && (
                <span className="text-lg text-slate-400 line-through">
                  {formatBRL(product.comparePriceCents)}
                </span>
              )}
            <span className={`${priceOnRequest ? "text-2xl" : "text-4xl"} font-black text-brand-blue`}>
              {priceOnRequest ? "Consulte o preço pelo WhatsApp" : formatBRL(product.priceCents)}
            </span>
          </div>

          <WhatsAppBuy
            product={{
              slug: product.slug,
              name: product.name,
              sku: product.sku,
              priceCents: product.priceCents,
              stock: product.stock,
            }}
          />

          <AddToQuote
            full
            product={{
              id: product.id,
              slug: product.slug,
              name: product.name,
              sku: product.sku,
              imageUrl: product.imageUrl,
              priceCents: product.priceCents,
              stock: product.stock,
            }}
          />

          <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
            <p className="font-semibold text-slate-800">Entrega</p>
            <p className="mt-1">
              🚚 Entrega própria em São Paulo e retirada na loja.
            </p>
            <p>
              📦 Para os demais estados, combinamos o envio com você pelo
              WhatsApp.
            </p>
          </div>

          {product.description && (
            <div className="prose prose-slate max-w-none whitespace-pre-line text-slate-600">
              <h2 className="text-lg font-bold text-slate-800">Descrição</h2>
              <p>{product.description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
