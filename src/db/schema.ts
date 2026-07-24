import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["customer", "admin"]);
export const personTypeEnum = pgEnum("person_type", ["PF", "PJ"]);
export const orderStatusEnum = pgEnum("order_status", [
  "pending_payment",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "canceled",
]);
export const shippingMethodEnum = pgEnum("shipping_method", [
  "own_delivery",
  "melhor_envio",
]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    name: text("name").notNull(),
    phone: text("phone"),
    cpfCnpj: text("cpf_cnpj"),
    personType: personTypeEnum("person_type").notNull().default("PF"),
    role: roleEnum("role").notNull().default("customer"),
    asaasCustomerId: text("asaas_customer_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("users_role_idx").on(t.role)],
);

// Sessões opacas: guardamos apenas o hash SHA-256 do token.
// Mesmo com acesso de leitura ao banco, um atacante não consegue forjar sessão.
export const sessions = pgTable(
  "sessions",
  {
    tokenHash: text("token_hash").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    ip: text("ip"),
    userAgent: text("user_agent"),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description").notNull().default(""),
    sku: text("sku"),
    priceCents: integer("price_cents").notNull(),
    comparePriceCents: integer("compare_price_cents"),
    stock: integer("stock").notNull().default(0),
    categoryId: uuid("category_id").references(() => categories.id, {
      onDelete: "set null",
    }),
    imageUrl: text("image_url"),
    active: boolean("active").notNull().default(true),
    // Dimensões para cotação de frete (Melhor Envio)
    weightGrams: integer("weight_grams").notNull().default(500),
    widthCm: integer("width_cm").notNull().default(15),
    heightCm: integer("height_cm").notNull().default(15),
    lengthCm: integer("length_cm").notNull().default(20),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("products_category_idx").on(t.categoryId),
    index("products_active_idx").on(t.active),
  ],
);

export const addresses = pgTable(
  "addresses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    label: text("label").notNull().default("Principal"),
    cep: text("cep").notNull(), // somente dígitos, 8 caracteres
    street: text("street").notNull(),
    number: text("number").notNull(),
    complement: text("complement"),
    district: text("district").notNull(),
    city: text("city").notNull(),
    state: text("state").notNull(), // UF, 2 letras
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("addresses_user_idx").on(t.userId)],
);

// Cotações de frete geradas no servidor. O checkout só aceita preços de frete
// que existam aqui — o cliente nunca envia valor de frete.
export const shippingQuotes = pgTable(
  "shipping_quotes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    cep: text("cep").notNull(),
    items: jsonb("items").notNull().$type<{ productId: string; quantity: number }[]>(),
    options: jsonb("options")
      .notNull()
      .$type<
        {
          method: "own_delivery" | "melhor_envio";
          serviceId: number | null;
          label: string;
          priceCents: number;
          deliveryDays: number;
        }[]
      >(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (t) => [index("shipping_quotes_user_idx").on(t.userId)],
);

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: text("code").notNull().unique(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    status: orderStatusEnum("status").notNull().default("pending_payment"),
    subtotalCents: integer("subtotal_cents").notNull(),
    shippingCents: integer("shipping_cents").notNull(),
    totalCents: integer("total_cents").notNull(),
    shippingMethod: shippingMethodEnum("shipping_method").notNull(),
    shippingLabel: text("shipping_label").notNull(),
    shippingDeliveryDays: integer("shipping_delivery_days"),
    // Snapshot do endereço no momento da compra
    address: jsonb("address").notNull().$type<{
      cep: string;
      street: string;
      number: string;
      complement: string | null;
      district: string;
      city: string;
      state: string;
    }>(),
    asaasPaymentId: text("asaas_payment_id"),
    paymentUrl: text("payment_url"),
    paymentMethod: text("payment_method"),
    trackingCode: text("tracking_code"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("orders_user_idx").on(t.userId),
    index("orders_status_idx").on(t.status),
    index("orders_asaas_idx").on(t.asaasPaymentId),
  ],
);

export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "restrict" }),
    name: text("name").notNull(), // snapshot do nome
    unitPriceCents: integer("unit_price_cents").notNull(), // snapshot do preço
    quantity: integer("quantity").notNull(),
  },
  (t) => [index("order_items_order_idx").on(t.orderId)],
);

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    entity: text("entity"),
    entityId: text("entity_id"),
    detail: jsonb("detail"),
    ip: text("ip"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("audit_logs_created_idx").on(t.createdAt)],
);

// Idempotência de webhooks: cada evento do Asaas é processado uma única vez.
export const webhookEvents = pgTable("webhook_events", {
  id: text("id").primaryKey(),
  provider: text("provider").notNull().default("asaas"),
  eventType: text("event_type"),
  payload: jsonb("payload"),
  receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
});

export const rateLimits = pgTable("rate_limits", {
  key: text("key").primaryKey(),
  count: integer("count").notNull().default(1),
  resetAt: timestamp("reset_at", { withTimezone: true }).notNull(),
});

export type User = typeof users.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Address = typeof addresses.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type ShippingQuote = typeof shippingQuotes.$inferSelect;
