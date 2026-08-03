import { and, desc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getDb } from "@/db";
import { categories, products } from "@/db/schema";
import { ProductCard } from "@/components/product-card";
import { CategoryHero } from "@/components/category-hero";
import { CATEGORY_PAGES } from "@/lib/category-pages";

const DEMO_CATEGORY_PRODUCTS: Record<string, Array<{ id: string; name: string; slug: string; description: string; sku: string; priceCents: number; comparePriceCents: number; stock: number; categoryId: string | null; imageUrl: string | null; active: boolean; weightGrams: number; widthCm: number; heightCm: number; lengthCm: number; createdAt: Date; updatedAt: Date; }>> = {
  "limpeza-higiene": [
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
      imageUrl: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=900&q=80",
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
      imageUrl: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=900&q=80",
      active: true,
      weightGrams: 650,
      widthCm: 12,
      heightCm: 28,
      lengthCm: 10,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
  epi: [
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
      imageUrl: "https://images.unsplash.com/photo-1612817159899-1f62b7c4f746?auto=format&fit=crop&w=900&q=80",
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
      imageUrl: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80",
      active: true,
      weightGrams: 220,
      widthCm: 16,
      heightCm: 5,
      lengthCm: 16,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
  piscina: [
    {
      id: "demo-piscina",
      name: "Kit de Manutenção para Piscina",
      slug: "kit-de-manutencao-para-piscina",
      description: "Linha completa para limpeza, tratamento e cuidado diário da piscina.",
      sku: "PISC-001",
      priceCents: 32990,
      comparePriceCents: 37990,
      stock: 8,
      categoryId: null,
      imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80",
      active: true,
      weightGrams: 900,
      widthCm: 18,
      heightCm: 20,
      lengthCm: 25,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
  infantil: [
    {
      id: "demo-cesta-infantil",
      name: "Cesta Organizadora Infantil",
      slug: "cesta-organizadora-infantil",
      description: "Estilo divertido e funcional para organizar brinquedos e objetos do dia a dia.",
      sku: "INF-001",
      priceCents: 15990,
      comparePriceCents: 18990,
      stock: 16,
      categoryId: null,
      imageUrl: "https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=900&q=80",
      active: true,
      weightGrams: 700,
      widthCm: 16,
      heightCm: 14,
      lengthCm: 20,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "demo-higiene-infantil",
      name: "Kit de Higiene Infantil",
      slug: "kit-de-higiene-infantil",
      description: "Produtos suaves e práticos para cuidar da rotina da família com carinho.",
      sku: "INF-002",
      priceCents: 13990,
      comparePriceCents: 16990,
      stock: 20,
      categoryId: null,
      imageUrl: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80",
      active: true,
      weightGrams: 500,
      widthCm: 12,
      heightCm: 10,
      lengthCm: 18,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
  "todos-produtos": [
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
      imageUrl: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=900&q=80",
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
      imageUrl: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=900&q=80",
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
      imageUrl: "https://images.unsplash.com/photo-1612817159899-1f62b7c4f746?auto=format&fit=crop&w=900&q=80",
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
      imageUrl: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80",
      active: true,
      weightGrams: 220,
      widthCm: 16,
      heightCm: 5,
      lengthCm: 16,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
};

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return { title: CATEGORY_PAGES[slug]?.title ?? "Categoria" };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = CATEGORY_PAGES[slug];
  if (!page) notFound();

  let productList: (typeof products.$inferSelect)[] = [];
  try {
    const db = getDb();
    if (slug === "todos-produtos") {
      productList = await db
        .select()
        .from(products)
        .where(eq(products.active, true))
        .orderBy(desc(products.createdAt))
        .limit(60);
    } else {
      const [category] = await db
        .select()
        .from(categories)
        .where(eq(categories.slug, slug))
        .limit(1);
      if (category) {
        productList = await db
          .select()
          .from(products)
          .where(and(eq(products.active, true), eq(products.categoryId, category.id)))
          .orderBy(desc(products.createdAt))
          .limit(60);
      }
    }
  } catch (err) {
    console.error(`[categorias/${slug}] banco indisponível:`, err);
  }

  const visibleProductList = productList.length > 0 ? productList : DEMO_CATEGORY_PRODUCTS[slug] ?? [];

  return (
    <div>
      <CategoryHero
        title={page.title}
        tagline={page.tagline}
        background={page.background}
        accent={page.accent}
      />

      <div className="mx-auto max-w-6xl px-4 py-10">
        {visibleProductList.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
            Nenhum produto cadastrado nesta categoria ainda.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {visibleProductList.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
