import { z } from "zod";
import { isValidCpfCnpj, onlyDigits } from "./cpf-cnpj";

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

export const cpfCnpjSchema = z
  .string()
  .transform(onlyDigits)
  .refine(isValidCpfCnpj, "CPF/CNPJ inválido.");

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
  cpfCnpj: cpfCnpjSchema.optional().or(z.literal("")),
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

export const addressSchema = z.object({
  label: z.string().trim().max(40).optional().or(z.literal("")),
  cep: z
    .string()
    .transform(onlyDigits)
    .refine((v) => v.length === 8, "CEP inválido."),
  street: z.string().trim().min(1, "Informe a rua.").max(160),
  number: z.string().trim().min(1, "Informe o número.").max(20),
  complement: z.string().trim().max(80).optional().or(z.literal("")),
  district: z.string().trim().min(1, "Informe o bairro.").max(80),
  city: z.string().trim().min(1, "Informe a cidade.").max(80),
  state: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{2}$/, "UF inválida."),
});

export const cartItemsSchema = z
  .array(
    z.object({
      productId: z.uuid(),
      quantity: z.number().int().min(1).max(999),
    }),
  )
  .min(1, "O carrinho está vazio.")
  .max(50, "Carrinho muito grande.");

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
  weightGrams: z.number().int().min(1).max(150000),
  widthCm: z.number().int().min(1).max(200),
  heightCm: z.number().int().min(1).max(200),
  lengthCm: z.number().int().min(1).max(200),
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
