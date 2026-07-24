import "server-only";
import { eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { settings } from "@/db/schema";
import { z } from "zod";

export const storeSettingsSchema = z.object({
  /** CEP de origem da loja (para cotação Melhor Envio) — somente dígitos */
  originCep: z.string().regex(/^\d{8}$/),
  /** Taxa da entrega própria dentro de SP, em centavos */
  ownDeliveryFeeCents: z.number().int().min(0),
  /** Frete grátis na entrega própria a partir deste subtotal (centavos). 0 = nunca */
  ownDeliveryFreeAboveCents: z.number().int().min(0),
  /** Prazo estimado da entrega própria, em dias úteis */
  ownDeliveryDays: z.number().int().min(1).max(30),
  /** Escopo da entrega própria: estado inteiro de SP ou só a capital */
  ownDeliveryScope: z.enum(["state", "capital"]),
  /** Telefone/WhatsApp exibido no site */
  storePhone: z.string().max(30),
  /** E-mail de contato exibido no site */
  storeEmail: z.string().max(120),
});

export type StoreSettings = z.infer<typeof storeSettingsSchema>;

export const DEFAULT_SETTINGS: StoreSettings = {
  originCep: "01001000",
  ownDeliveryFeeCents: 1500,
  ownDeliveryFreeAboveCents: 30000,
  ownDeliveryDays: 3,
  ownDeliveryScope: "state",
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
