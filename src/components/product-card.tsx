import Image from "next/image";
import Link from "next/link";
import { formatBRL } from "@/lib/money";
import type { Product } from "@/db/schema";

export function ProductCard({ product }: { product: Product }) {
  const outOfStock = product.stock <= 0;
  return (
    <Link
      href={`/produtos/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:border-brand-blue/40 hover:shadow-md"
    >
      <div className="relative aspect-square bg-slate-100">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, 25vw"
            className="object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-300">
            <svg className="h-16 w-16" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
            </svg>
          </div>
        )}
        {outOfStock && (
          <span className="absolute left-2 top-2 rounded-full bg-slate-900/80 px-2.5 py-1 text-xs font-semibold text-white">
            Esgotado
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="line-clamp-2 text-sm font-medium text-slate-800">
          {product.name}
        </h3>
        <div className="mt-auto pt-1">
          {product.comparePriceCents && product.comparePriceCents > product.priceCents && (
            <span className="mr-2 text-xs text-slate-400 line-through">
              {formatBRL(product.comparePriceCents)}
            </span>
          )}
          <span className="text-lg font-bold text-brand-blue">
            {formatBRL(product.priceCents)}
          </span>
        </div>
      </div>
    </Link>
  );
}
