/**
 * Seed inicial: cria o primeiro administrador, as categorias base e a
 * configuração padrão da loja. Roda com: npm run db:seed
 *
 * O e-mail/senha do admin vêm de SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD no .env.
 */
import "dotenv/config";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { categories, products, settings, users } from "./schema";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL não definida no .env");

  const email = (process.env.SEED_ADMIN_EMAIL ?? "").toLowerCase().trim();
  const password = process.env.SEED_ADMIN_PASSWORD ?? "";
  const name = process.env.SEED_ADMIN_NAME ?? "Administrador AMG";
  if (!email || password.length < 8) {
    throw new Error(
      "Defina SEED_ADMIN_EMAIL e SEED_ADMIN_PASSWORD (mínimo 8 caracteres) no .env",
    );
  }

  const client = postgres(url, { prepare: false });
  const db = drizzle(client);

  // Admin
  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing.length === 0) {
    const passwordHash = await bcrypt.hash(password, 12);
    await db.insert(users).values({ email, passwordHash, name, role: "admin" });
    console.log(`✅ Admin criado: ${email}`);
  } else {
    await db.update(users).set({ role: "admin" }).where(eq(users.email, email));
    console.log(`ℹ️  Usuário ${email} já existia — papel garantido como admin.`);
  }

  // Categorias base — os slugs devem bater com CATEGORY_LINKS em
  // src/components/header.tsx (barra de categorias do topo do site)
  const baseCategories = [
    { name: "Limpeza & Higiene", slug: "limpeza-higiene", position: 1 },
    { name: "EPI", slug: "epi", position: 2 },
    { name: "Piscina", slug: "piscina", position: 3 },
    { name: "Infantil", slug: "infantil", position: 4 },
  ];

  const categoryIds = new Map<string, string>();
  for (const category of baseCategories) {
    const found = await db
      .select()
      .from(categories)
      .where(eq(categories.slug, category.slug))
      .limit(1);
    if (found.length === 0) {
      const [created] = await db.insert(categories).values(category).returning({ id: categories.id });
      categoryIds.set(category.slug, created.id);
      console.log(`✅ Categoria criada: ${category.name}`);
    } else {
      categoryIds.set(category.slug, found[0].id);
    }
  }

  const sampleProducts = [
    {
      name: "Kit Limpeza Premium",
      slug: "kit-limpeza-premium",
      description: "Conjunto elegante para limpeza diária com fragrância suave e alta performance.",
      priceCents: 12990,
      comparePriceCents: 15990,
      stock: 18,
      categorySlug: "limpeza-higiene",
      imageUrl:
        "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=900&q=80",
    },
    {
      name: "Dispensador de Alvejante",
      slug: "dispensador-de-alvejante",
      description: "Prático, resistente e com ótimo rendimento para ambientes comerciais.",
      priceCents: 8990,
      comparePriceCents: 10990,
      stock: 12,
      categorySlug: "limpeza-higiene",
      imageUrl:
        "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=900&q=80",
    },
    {
      name: "Luvas de Proteção Nitrílica",
      slug: "luvas-de-protecao-nitrilica",
      description: "Proteção confortável para uso profissional com excelente aderência.",
      priceCents: 15990,
      comparePriceCents: 18990,
      stock: 24,
      categorySlug: "epi",
      imageUrl:
        "https://images.unsplash.com/photo-1612817159899-1f62b7c4f746?auto=format&fit=crop&w=900&q=80",
    },
    {
      name: "Óculos de Segurança Premium",
      slug: "oculos-de-seguranca-premium",
      description: "Design moderno, proteção confiável e conforto ideal para o dia todo.",
      priceCents: 24990,
      comparePriceCents: 28990,
      stock: 10,
      categorySlug: "epi",
      imageUrl:
        "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80",
    },
    {
      name: "Kit de Manutenção para Piscina",
      slug: "kit-de-manutencao-para-piscina",
      description: "Linha completa para limpeza, tratamento e cuidado diário da piscina.",
      priceCents: 32990,
      comparePriceCents: 37990,
      stock: 8,
      categorySlug: "piscina",
      imageUrl:
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80",
    },
    {
      name: "Cloro Granulado Rápido",
      slug: "cloro-granulado-rapido",
      description: "Formulação eficiente para manutenção segura e prática da piscina.",
      priceCents: 18990,
      comparePriceCents: 21990,
      stock: 14,
      categorySlug: "piscina",
      imageUrl:
        "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=900&q=80",
    },
    {
      name: "Cesta Organizadora Infantil",
      slug: "cesta-organizadora-infantil",
      description: "Estilo divertido e funcional para organizar brinquedos e objetos do dia a dia.",
      priceCents: 15990,
      comparePriceCents: 18990,
      stock: 16,
      categorySlug: "infantil",
      imageUrl:
        "https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=900&q=80",
    },
    {
      name: "Kit de Higiene Infantil",
      slug: "kit-de-higiene-infantil",
      description: "Produtos suaves e práticos para cuidar da rotina da família com carinho.",
      priceCents: 13990,
      comparePriceCents: 16990,
      stock: 20,
      categorySlug: "infantil",
      imageUrl:
        "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80",
    },
  ];

  for (const product of sampleProducts) {
    const existing = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.slug, product.slug))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(products).values({
        ...product,
        categoryId: categoryIds.get(product.categorySlug) ?? null,
      });
      console.log(`✅ Produto criado: ${product.name}`);
    }
  }

  // Configuração padrão da loja
  const settingsRow = await db
    .select()
    .from(settings)
    .where(eq(settings.key, "store"))
    .limit(1);
  if (settingsRow.length === 0) {
    await db.insert(settings).values({
      key: "store",
      value: {
        storePhone: "",
        storeEmail: "",
      },
    });
    console.log("✅ Configurações padrão criadas (edite no painel admin).");
  }

  await client.end();
  console.log("\n🎉 Seed concluído.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
