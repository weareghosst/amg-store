import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { categories, products } from "@/db/schema";
import { formatBRL } from "@/lib/money";
import { AddToCart } from "@/components/add-to-cart";

export const dynamic = "force-dynamic";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const db = getDb();
  const rows = await db
    .select({ product: products, category: categories })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(and(eq(products.slug, slug), eq(products.active, true)))
    .limit(1);

  const row = rows[0];
  if (!row) notFound();
  const { product, category } = row;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
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
        <div className="relative aspect-square overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-contain"
              priority
            />
          ) : (
            <div className="flex h-full items-center justify-center text-slate-300">
              <svg className="h-24 w-24" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
              </svg>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div>
            {product.sku && (
              <p className="text-xs uppercase tracking-wide text-slate-400">
                SKU: {product.sku}
              </p>
            )}
            <h1 className="mt-1 text-3xl font-bold text-slate-900">{product.name}</h1>
          </div>

          <div className="flex items-baseline gap-3">
            {product.comparePriceCents &&
              product.comparePriceCents > product.priceCents && (
                <span className="text-lg text-slate-400 line-through">
                  {formatBRL(product.comparePriceCents)}
                </span>
              )}
            <span className="text-4xl font-black text-brand-blue">
              {formatBRL(product.priceCents)}
            </span>
          </div>

          <AddToCart
            product={{
              id: product.id,
              slug: product.slug,
              name: product.name,
              priceCents: product.priceCents,
              imageUrl: product.imageUrl,
              stock: product.stock,
            }}
          />

          <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
            <p className="font-semibold text-slate-800">Entrega</p>
            <p className="mt-1">
              🚚 <strong>São Paulo:</strong> entrega própria AMG
            </p>
            <p>
              📦 <strong>Demais estados:</strong> envio via Melhor Envio (calcule no
              carrinho)
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
