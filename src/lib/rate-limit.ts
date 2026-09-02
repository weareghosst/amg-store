import "server-only";
import { sql } from "drizzle-orm";
import { getDb } from "@/db";

/**
 * Rate limiting persistido no Postgres (funciona em serverless sem Redis).
 * Upsert atômico: incrementa dentro da janela ou reinicia se a janela venceu.
 */
export async function rateLimit(opts: {
  key: string;
  limit: number;
  windowSeconds: number;
}): Promise<{ allowed: boolean; remaining: number }> {
  const db = getDb();
  const result = await db.execute(sql`
    INSERT INTO rate_limits (key, count, reset_at)
    VALUES (${opts.key}, 1, now() + make_interval(secs => ${opts.windowSeconds}))
    ON CONFLICT (key) DO UPDATE SET
      count = CASE
        WHEN rate_limits.reset_at < now() THEN 1
        ELSE rate_limits.count + 1
      END,
      reset_at = CASE
        WHEN rate_limits.reset_at < now() THEN excluded.reset_at
        ELSE rate_limits.reset_at
      END
    RETURNING count
  `);
  const rows = result as unknown as { count: number }[];
  const count = Number(rows[0]?.count ?? 0);
  return { allowed: count <= opts.limit, remaining: Math.max(0, opts.limit - count) };
}
