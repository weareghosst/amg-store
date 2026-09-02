import { z } from "zod";
import { onlyDigits } from "./digits";

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(255)
  .pipe(z.email({ message: "E-mail inválido." }));

export const passwordSchema = z
  .string()
  .min(8, "A senha deve ter pelo menos 8 caracteres.")
  .max(128, "Senha muito longa.");

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome.").max(120),
  email: emailSchema,
  password: passwordSchema,
  phone: z
    .string()
    .transform(onlyDigits)
    .refine((v) => v.length === 0 || (v.length >= 10 && v.length <= 11), {
      message: "Telefone inválido.",
    })
    .optional()
    .or(z.literal("")),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Informe a senha.").max(128),
});

export const requestPasswordResetSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token ausente.").max(256),
  password: passwordSchema,
});

export const productFormSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome.").max(160),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug inválido (use letras, números e hífens)."),
  description: z.string().trim().max(8000).default(""),
  sku: z.string().trim().max(60).optional().or(z.literal("")),
  priceCents: z.number().int().min(1, "Preço deve ser maior que zero."),
  comparePriceCents: z.number().int().min(0).nullable(),
  stock: z.number().int().min(0, "Estoque não pode ser negativo."),
  categoryId: z.uuid().nullable(),
  imageUrl: z
    .string()
    .trim()
    .refine((v) => v === "" || /^https:\/\/.+/i.test(v), {
      message: "A URL da imagem deve começar com https://",
    })
    .optional()
    .or(z.literal("")),
  active: z.boolean(),
});

export const categoryFormSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome.").max(80),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug inválido."),
  position: z.number().int().min(0).max(9999),
});

/** Extrai a primeira mensagem de erro de um resultado Zod. */
export function firstZodError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Dados inválidos.";
}
