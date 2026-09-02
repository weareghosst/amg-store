import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

// Conexão via postgres.js — funciona com Supabase, Neon ou qualquer Postgres.
// `prepare: false` é exigido pelo pooler do Supabase no modo "transaction"
// e também é o mais seguro em ambientes serverless (Vercel), onde conexões
// não são reaproveitadas entre invocações.

function createDb() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL não definida. Configure o arquivo .env (veja .env.example).",
    );
  }
  const client = postgres(url, { prepare: false });
  return drizzle(client, { schema });
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
