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

export const productImageSchema = z.string().trim().max(3 * 1024 * 1024)
  .refine((value) => value === "" || /^https:\/\/.+/i.test(value) ||
    /^\/produtos\/[a-z0-9][a-z0-9._-]*$/i.test(value) ||
    /^data:image\/(?:png|jpe?g|webp);base64,[a-z0-9+/]+=*$/i.test(value), {
    message: "Use uma URL https:// ou uma foto PNG, JPG ou WebP.",
  });

export const galleryImagesSchema = z.array(productImageSchema).max(7, "Use até 7 fotos adicionais.")
  .refine((images) => images.reduce((total, image) => total + (image.startsWith("data:") ? image.length : 0), 0) <= 2 * 1024 * 1024 * 1.37, {
    message: "As fotos adicionais juntas devem ter no máximo 2 MB.",
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
  priceCents: z
    .number()
    .int()
    .min(0, "Preço não pode ser negativo."),
  comparePriceCents: z.number().int().min(0).nullable(),
  stock: z.number().int().min(0, "Estoque não pode ser negativo."),
  categoryId: z.uuid().nullable(),
  imageUrl: productImageSchema.optional(),
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
