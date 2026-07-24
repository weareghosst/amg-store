import { existsSync } from "fs";
import path from "path";
import Image from "next/image";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { categories, products } from "@/db/schema";
import { ProductCard } from "@/components/product-card";
import { categoryHref } from "@/lib/category-pages";

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
    // Banco ainda não configurado (ex.: primeiro run sem .env) — a home
    // continua no ar com o aviso de catálogo vazio em vez de derrubar o site.
    console.error("[home] banco indisponível:", err);
  }

  return (
    <div>
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-navy via-brand-blue-dark to-brand-blue text-white">
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
        <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-16 sm:flex-row sm:gap-10 sm:py-24">
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
          <div className="text-center sm:text-left">
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
            <div className="mt-8 flex flex-wrap justify-center gap-3 sm:justify-start">
              <Link
                href="/produtos"
                className="rounded-lg bg-brand-green px-6 py-3 font-semibold text-white transition hover:bg-brand-green-dark"
              >
                Ver produtos
              </Link>
              <Link
                href="/cadastro"
                className="rounded-lg border border-white/50 px-6 py-3 font-semibold text-white transition hover:bg-white/10"
              >
                Criar conta
              </Link>
            </div>

            <form
              action="/produtos"
              method="GET"
              className="mx-auto mt-6 flex max-w-md gap-2"
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
                className="shrink-0 rounded-lg bg-brand-green px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-green-dark"
              >
                Buscar
              </button>
            </form>
          </div>
        </div>
      </section>

      {categoryList.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-10">
          <h2 className="mb-4 text-xl font-bold text-slate-800">Categorias</h2>
          <div className="flex flex-wrap gap-2">
            {categoryList.map((c) => (
              <Link
                key={c.id}
                href={categoryHref(c.slug)}
                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-brand-blue hover:text-brand-blue"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-6xl px-4 pb-16 pt-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800">Novidades</h2>
          <Link
            href={categoryHref("todos-produtos")}
            className="text-sm font-medium text-brand-blue hover:underline"
          >
            Ver todos →
          </Link>
        </div>
        {featured.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
            Nenhum produto cadastrado ainda. Acesse o painel admin para começar.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-12 sm:grid-cols-3">
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
      </section>
    </div>
  );
}
