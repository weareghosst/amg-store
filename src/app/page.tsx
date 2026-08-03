import { existsSync } from "fs";
import path from "path";
import Image from "next/image";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { categories, products } from "@/db/schema";
import { ProductCard } from "@/components/product-card";
import { categoryHref } from "@/lib/category-pages";

const DEMO_PRODUCTS = [
  {
    id: "demo-kit-limpeza",
    name: "Kit Limpeza Premium",
    slug: "kit-limpeza-premium",
    description: "Conjunto elegante para limpeza diária com fragrância suave e alta performance.",
    sku: "KIT-001",
    priceCents: 12990,
    comparePriceCents: 15990,
    stock: 18,
    categoryId: null,
    imageUrl:
      "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=900&q=80",
    active: true,
    weightGrams: 800,
    widthCm: 20,
    heightCm: 15,
    lengthCm: 25,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "demo-dispensador",
    name: "Dispensador de Alvejante",
    slug: "dispensador-de-alvejante",
    description: "Prático, resistente e com ótimo rendimento para ambientes comerciais.",
    sku: "DISP-002",
    priceCents: 8990,
    comparePriceCents: 10990,
    stock: 12,
    categoryId: null,
    imageUrl:
      "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=900&q=80",
    active: true,
    weightGrams: 650,
    widthCm: 12,
    heightCm: 28,
    lengthCm: 10,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "demo-luvas",
    name: "Luvas de Proteção Nitrílica",
    slug: "luvas-de-protecao-nitrilica",
    description: "Proteção confortável para uso profissional com excelente aderência.",
    sku: "EPI-003",
    priceCents: 15990,
    comparePriceCents: 18990,
    stock: 24,
    categoryId: null,
    imageUrl:
      "https://images.unsplash.com/photo-1612817159899-1f62b7c4f746?auto=format&fit=crop&w=900&q=80",
    active: true,
    weightGrams: 300,
    widthCm: 10,
    heightCm: 3,
    lengthCm: 20,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "demo-oculos",
    name: "Óculos de Segurança Premium",
    slug: "oculos-de-seguranca-premium",
    description: "Design moderno, proteção confiável e conforto ideal para o dia todo.",
    sku: "EPI-004",
    priceCents: 24990,
    comparePriceCents: 28990,
    stock: 10,
    categoryId: null,
    imageUrl:
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80",
    active: true,
    weightGrams: 220,
    widthCm: 16,
    heightCm: 5,
    lengthCm: 16,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export const dynamic = "force-dynamic";

const hasTopoBg = existsSync(path.join(process.cwd(), "public", "background-topo.png"));
const hasOldLogo = existsSync(path.join(process.cwd(), "public", "logo-old.png"));

export default async function HomePage() {
  let featured: (typeof products.$inferSelect)[] = [];
  let categoryList: (typeof categories.$inferSelect)[] = [];
  try {
    const db = getDb();
    [featured, categoryList] = await Promise.all([
      db
        .select()
        .from(products)
        .where(eq(products.active, true))
        .orderBy(desc(products.createdAt))
        .limit(8),
      db.select().from(categories).orderBy(categories.position).limit(8),
    ]);
  } catch (err) {
    console.error("[home] banco indisponível:", err);
  }

  const shouldUseDemoProducts = featured.length === 0;
  const visibleFeatured = shouldUseDemoProducts ? DEMO_PRODUCTS : featured;

  return (
    <div className="overflow-x-hidden">
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-navy via-brand-blue-dark to-brand-blue text-white">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="animate-float absolute -left-8 top-10 h-28 w-28 rounded-full bg-white/10 blur-3xl" />
          <div className="animate-float-delayed absolute bottom-10 right-8 h-36 w-36 rounded-full bg-brand-green/25 blur-3xl" />
          <div className="animate-pulse-soft absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10" />
        </div>
        {hasTopoBg && (
          <>
            <Image
              src="/background-topo.png"
              alt=""
              aria-hidden
              fill
              sizes="100vw"
              className="object-cover object-right opacity-40"
            />
            {/* Degradês que fundem a foto no azul marinho do topo */}
            <div className="absolute inset-0 bg-gradient-to-r from-brand-navy via-brand-navy/70 to-brand-navy/20" />
            <div className="absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-brand-navy to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-brand-blue to-transparent" />
          </>
        )}
        <div className="relative mx-auto grid max-w-6xl gap-8 px-4 py-16 sm:py-24 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          {hasOldLogo && (
            <Image
              src="/logo-old.png"
              alt="AMG — Produtos de Limpeza e Variedades"
              width={176}
              height={176}
              className="h-36 w-36 shrink-0 object-contain drop-shadow-[0_10px_30px_rgba(0,0,0,0.55)] sm:h-44 sm:w-44"
              priority
            />
          )}
          <div className="animate-fade-up text-center lg:text-left">
            <div className="mb-5 inline-flex overflow-hidden rounded-full text-xs font-black uppercase tracking-widest">
              <span className="bg-white/15 px-4 py-1.5 backdrop-blur">
                🛒 Atacado
              </span>
              <span className="bg-brand-green px-4 py-1.5">🚚 Varejo</span>
            </div>
            <h1 className="max-w-2xl text-4xl font-black leading-tight sm:text-5xl">
              Produtos de limpeza e variedades{" "}
              <span className="text-brand-green brightness-150">
                para sua casa e sua empresa
              </span>
            </h1>
            <p className="mt-4 max-w-xl text-lg text-white/85">
              Mais praticidade, mais economia, mais qualidade pra você! Entrega
              própria em São Paulo e envio para todo o Brasil.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
              <Link
                href="/produtos"
                className="rounded-lg bg-brand-green px-6 py-3 font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-green-dark hover:shadow-lg"
              >
                Ver produtos
              </Link>
              <Link
                href="/cadastro"
                className="rounded-lg border border-white/50 px-6 py-3 font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/10"
              >
                Criar conta
              </Link>
            </div>

            <form
              action="/produtos"
              method="GET"
              className="mx-auto mt-6 flex max-w-md gap-2 lg:mx-0"
            >
              <input
                type="search"
                name="q"
                placeholder="Buscar produtos..."
                aria-label="Buscar produtos"
                className="w-full rounded-lg border border-white/30 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/60 backdrop-blur focus:border-white focus:outline-none"
              />
              <button
                type="submit"
                className="shrink-0 rounded-lg bg-brand-green px-5 py-3 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-green-dark"
              >
                Buscar
              </button>
            </form>
          </div>

          <div className="animate-fade-up mx-auto flex w-full max-w-md flex-col gap-3">
            <div className="glass-card rounded-[1.5rem] border border-white/20 p-4 shadow-[0_20px_60px_rgba(2,6,23,0.25)] backdrop-blur-xl">
              <div className="rounded-[1.2rem] border border-white/20 bg-slate-950/20 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-white/85">
                    Destaques
                  </span>
                  <span className="text-sm font-medium text-white/80">Entrega rápida</span>
                </div>
                <div className="space-y-3">
                  <div className="rounded-2xl bg-white/10 p-3">
                    <p className="text-sm font-semibold text-white">Catálogo com produtos para atacado e varejo</p>
                    <p className="mt-1 text-sm text-white/70">Tudo em um só lugar, com preços competitivos e praticidade.</p>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="rounded-2xl bg-brand-green/20 p-3">
                      <p className="text-2xl font-black text-white">500+</p>
                      <p className="text-sm text-white/80">itens disponíveis</p>
                    </div>
                    <div className="rounded-2xl bg-white/10 p-3">
                      <p className="text-2xl font-black text-white">24h</p>
                      <p className="text-sm text-white/80">para pronta entrega</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {categoryList.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-10">
          <div className="glass-card mb-4 rounded-[1.25rem] border border-slate-200/70 p-4 shadow-sm">
            <h2 className="text-xl font-bold text-slate-800">Categorias</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {categoryList.map((c) => (
              <Link
                key={c.id}
                href={categoryHref(c.slug)}
                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-blue hover:text-brand-blue"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-6xl px-4 pb-16 pt-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-[1.25rem] border border-slate-200/70 bg-white/70 px-4 py-3 shadow-sm backdrop-blur">
          <h2 className="text-xl font-bold text-slate-800">Novidades</h2>
          <Link
            href={categoryHref("todos-produtos")}
            className="text-sm font-medium text-brand-blue hover:underline"
          >
            Ver todos →
          </Link>
        </div>
        {visibleFeatured.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
            Nenhum produto cadastrado ainda. Acesse o painel admin para começar.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {visibleFeatured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      <section className="border-t border-slate-200 bg-white/70 backdrop-blur">
        <div className="mx-auto grid max-w-6xl gap-4 px-4 py-12 sm:grid-cols-3">
          <div className="card-hover rounded-[1.2rem] border border-slate-200 bg-white/80 p-4 shadow-sm">
            <div className="flex gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-blue/10 text-xl">
                🧼
              </span>
              <div>
                <h3 className="font-bold text-brand-navy">Qualidade que limpa</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Produtos de limpeza profissional e EPIs das melhores marcas.
                </p>
              </div>
            </div>
          </div>
          <div className="card-hover rounded-[1.2rem] border border-slate-200 bg-white/80 p-4 shadow-sm">
            <div className="flex gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-green/10 text-xl">
                📦
              </span>
              <div>
                <h3 className="font-bold text-brand-navy">Variedade que atende</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Atacado e varejo para empresas (CNPJ) e consumidor final.
                </p>
              </div>
            </div>
          </div>
          <div className="card-hover rounded-[1.2rem] border border-slate-200 bg-white/80 p-4 shadow-sm">
            <div className="flex gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-blue/10 text-xl">
                🚚
              </span>
              <div>
                <h3 className="font-bold text-brand-navy">Agilidade que entrega</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Entrega própria em SP e envio para todo o Brasil via Melhor
                  Envio, com pagamento seguro pelo Asaas.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
