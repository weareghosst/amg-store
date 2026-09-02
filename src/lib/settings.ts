import "server-only";
import { eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { settings } from "@/db/schema";
import { z } from "zod";

export const storeSettingsSchema = z.object({
  /** Telefone/WhatsApp exibido no site e usado nos botões de contato */
  storePhone: z.string().max(30),
  /** E-mail de contato exibido no site */
  storeEmail: z.string().max(120),
});

export type StoreSettings = z.infer<typeof storeSettingsSchema>;

export const DEFAULT_SETTINGS: StoreSettings = {
  storePhone: "",
  storeEmail: "",
};

const SETTINGS_KEY = "store";

export async function getStoreSettings(): Promise<StoreSettings> {
  const db = getDb();
  const rows = await db
    .select()
    .from(settings)
    .where(eq(settings.key, SETTINGS_KEY))
    .limit(1);
  if (!rows[0]) return DEFAULT_SETTINGS;
  const parsed = storeSettingsSchema.safeParse(rows[0].value);
  return parsed.success ? parsed.data : DEFAULT_SETTINGS;
}

export async function saveStoreSettings(value: StoreSettings): Promise<void> {
  const db = getDb();
  await db
    .insert(settings)
    .values({ key: SETTINGS_KEY, value })
    .onConflictDoUpdate({
      target: settings.key,
      set: { value, updatedAt: sql`now()` },
    });
}
