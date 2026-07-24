import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import * as schema from "./schema";

// Pool via WebSocket (driver Neon) — suporta transações interativas,
// necessárias para o checkout (baixa de estoque + criação do pedido de forma atômica).
// Em dev, reutiliza o pool entre hot-reloads para não esgotar conexões.

function createDb() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL não definida. Configure o arquivo .env (veja .env.example).",
    );
  }
  const pool = new Pool({ connectionString: url });
  return drizzle(pool, { schema });
}

export type Db = ReturnType<typeof createDb>;

/** Tipo do `tx` recebido pelo callback de `db.transaction()`. */
export type DbTransaction = Parameters<Parameters<Db["transaction"]>[0]>[0];

const globalForDb = globalThis as unknown as { __amgDb?: Db };

export function getDb(): Db {
  if (!globalForDb.__amgDb) {
    globalForDb.__amgDb = createDb();
  }
  return globalForDb.__amgDb;
}

export { schema };
