import "server-only";
import { getDb } from "@/db";
import { auditLogs } from "@/db/schema";

/** Registra ações sensíveis. Nunca deixa a operação principal falhar por causa do log. */
export async function audit(entry: {
  userId?: string | null;
  action: string;
  entity?: string;
  entityId?: string;
  detail?: unknown;
  ip?: string;
}): Promise<void> {
  try {
    const db = getDb();
    await db.insert(auditLogs).values({
      userId: entry.userId ?? null,
      action: entry.action,
      entity: entry.entity ?? null,
      entityId: entry.entityId ?? null,
      detail: entry.detail ?? null,
      ip: entry.ip ?? null,
    });
  } catch (err) {
    console.error("[audit] falha ao registrar log:", err);
  }
}
