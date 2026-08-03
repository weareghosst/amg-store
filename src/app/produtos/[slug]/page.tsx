import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { categories, products } from "@/db/schema";
import { formatBRL } from "@/lib/money";
import { AddToCart } from "@/components/add-to-cart";

const DEMO_PRODUCT_DETAILS: Record<
  string,
  {
    name: string;
    description: string;
    priceCents: number;
    comparePriceCents?: number;
    sku: string;
    highlight: string;
  }
> = {
  "kit-limpeza-premium": {
    name: "Kit Limpeza Premium",
    description: "Conjunto elegante para limpeza diária com fragrância suave, alto rendimento e acabamento profissional em cada detalhe.",
    priceCents: 12990,
    comparePriceCents: 15990,
    sku: "KIT-001",
    highlight: "Visual para apresentação da loja",
  },
  "dispensador-de-alvejante": {
    name: "Dispensador de Alvejante",
    description: "Prático, resistente e pensado para ambientes comerciais com ótimo rendimento e facilidade de uso.",
    priceCents: 8990,
    comparePriceCents: 10990,
    sku: "DISP-002",
    highlight: "Modelo de destaque",
  },
  "luvas-de-protecao-nitrilica": {
    name: "Luvas de Proteção Nitrílica",
    description: "Proteção confortável para trabalho profissional com excelente aderência, resistência e sensação leve.",
    priceCents: 15990,
    comparePriceCents: 18990,
    sku: "EPI-003",
    highlight: "Ideal para uso diário",
  },
  "oculos-de-seguranca-premium": {
    name: "Óculos de Segurança Premium",
    description: "Design moderno, conforto prolongado e proteção confiável para rotina profissional e industrial.",
    priceCents: 24990,
    comparePriceCents: 28990,
    sku: "EPI-004",
    highlight: "Proteção premium",
  },
  "kit-de-manutencao-para-piscina": {
    name: "Kit de Manutenção para Piscina",
    description: "Linha completa para limpeza, manutenção e tratamento diário da piscina com praticidade e cuidado.",
    priceCents: 32990,
    comparePriceCents: 37990,
    sku: "PISC-001",
    highlight: "Para piscina com alto padrão",
  },
  "cesta-organizadora-infantil": {
    name: "Cesta Organizadora Infantil",
    description: "Estilo divertido e funcional para organizar brinquedos, materiais e objetos do dia a dia com carinho.",
    priceCents: 15990,
    comparePriceCents: 18990,
    sku: "INF-001",
    highlight: "Estilo acolhedor e moderno",
  },
  "kit-de-higiene-infantil": {
    name: "Kit de Higiene Infantil",
    description: "Produtos suaves e práticos para cuidar da rotina da família com mais conforto e praticidade.",
    priceCents: 13990,
    comparePriceCents: 16990,
    sku: "INF-002",
    highlight: "Linha pensada para o dia a dia",
  },
};

export const dynamic = "force-dynamic";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const demoProduct = DEMO_PRODUCT_DETAILS[slug];
  if (demoProduct) {
    return (
      <div className="relative mx-auto flex min-h-[70vh] max-w-6xl items-center justify-center overflow-hidden px-4 py-16">
        <div className="absolute inset-0">
          <Image
            src="/WEAREGHOST.png"
            alt=""
            fill
            priority
            className="object-contain opacity-15"
          />
        </div>
        <div className="relative w-full overflow-hidden rounded-[2rem] border border-slate-200 bg-white/90 p-8 shadow-[0_20px_60px_rgba(2,6,23,0.12)] backdrop-blur md:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-blue">
                Pré-visualização do produto
              </p>
              <h1 className="mt-4 text-3xl font-black text-slate-900">
                {demoProduct.name}
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
                {demoProduct.description}
              </p>
              <div className="mt-6 flex flex-wrap items-baseline gap-3">
                {demoProduct.comparePriceCents && demoProduct.comparePriceCents > demoProduct.priceCents && (
                  <span className="text-lg text-slate-400 line-through">
                    {formatBRL(demoProduct.comparePriceCents)}
                  </span>
                )}
                <span className="text-4xl font-black text-brand-blue">
                  {formatBRL(demoProduct.priceCents)}
                </span>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/produtos"
                  className="inline-flex rounded-full bg-brand-blue px-5 py-3 font-semibold text-white transition hover:-translate-y-0.5"
                >
                  Ver mais produtos
                </Link>
                <Link
                  href="/"
                  className="inline-flex rounded-full border border-slate-300 px-5 py-3 font-semibold text-slate-700 transition hover:border-brand-blue hover:text-brand-blue"
                >
                  Voltar ao início
                </Link>
              </div>
            </div>
            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
                SKU
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{demoProduct.sku}</p>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                {demoProduct.highlight}
              </p>
              <div className="mt-6 rounded-2xl border border-brand-blue/20 bg-brand-blue/10 p-4 text-sm text-slate-700">
                Esta é uma demonstração visual da página de produtos para a apresentação da loja.
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
