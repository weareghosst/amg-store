/**
 * Seed inicial: cria o primeiro administrador, as categorias base e a
 * configuração padrão da loja. Roda com: npm run db:seed
 *
 * O e-mail/senha do admin vêm de SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD no .env.
 */
import "dotenv/config";
import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { categories, settings, users } from "./schema";

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

  const pool = new Pool({ connectionString: url });
  const db = drizzle(pool);

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
  ];
  for (const category of baseCategories) {
    const found = await db
      .select()
      .from(categories)
      .where(eq(categories.slug, category.slug))
      .limit(1);
    if (found.length === 0) {
      await db.insert(categories).values(category);
      console.log(`✅ Categoria criada: ${category.name}`);
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
        originCep: "01001000",
        ownDeliveryFeeCents: 1500,
        ownDeliveryFreeAboveCents: 30000,
        ownDeliveryDays: 3,
        ownDeliveryScope: "state",
        storePhone: "",
        storeEmail: "",
      },
    });
    console.log("✅ Configurações padrão criadas (edite no painel admin).");
  }

  await pool.end();
  console.log("\n🎉 Seed concluído.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
