import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().min(3, "email").max(160),
  password: z.string().min(4, "password").max(120),
});

export const createOrderSchema = z.object({
  branchId: z.string().min(1, "branchId"),
  number: z.coerce.number().int().min(1, "number").max(9999),
  tableNumber: z.string().max(20).optional().nullable(),
  itemsNote: z.string().max(500).optional().nullable(),
  totalAmount: z.coerce.number().int().min(0).max(100_000_000).optional(),
});

export const statusSchema = z.object({
  status: z.enum(["PREPARING", "READY", "COMPLETED", "CANCELLED"]),
});

export const ratingSchema = z.object({
  stars: z.coerce.number().int().min(1).max(5),
  note: z.string().max(500).optional().nullable(),
});

export const restaurantSchema = z.object({
  slug: z
    .string()
    .min(2)
    .max(40)
    .regex(/^[a-z0-9-]+$/, "slug")
    .optional(),
  name: z.string().min(1).max(120).optional(),
  nameEn: z.string().max(120).optional().nullable(),
  tagline: z.string().max(200).optional().nullable(),
  taglineEn: z.string().max(200).optional().nullable(),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  secondaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  phone: z.string().max(40).optional().nullable(),
  whatsapp: z.string().max(40).optional().nullable(),
  address: z.string().max(240).optional().nullable(),
  instagram: z.string().max(120).optional().nullable(),
  facebook: z.string().max(120).optional().nullable(),
  tiktok: z.string().max(120).optional().nullable(),
  plan: z.enum(["trial", "pro", "enterprise"]).optional(),
  subscriptionStatus: z.enum(["active", "frozen"]).optional(),
  logoBase64: z.string().max(4_000_000).optional().nullable(),
  logoMime: z.string().max(80).optional().nullable(),
});

export const menuCategorySchema = z.object({
  name: z.string().min(1).max(80),
  nameEn: z.string().max(80).optional().nullable(),
  sortOrder: z.coerce.number().int().min(0).max(999).optional(),
});

export const menuItemSchema = z.object({
  categoryId: z.string().optional().nullable(),
  name: z.string().min(1).max(120),
  nameEn: z.string().max(120).optional().nullable(),
  description: z.string().max(400).optional().nullable(),
  descriptionEn: z.string().max(400).optional().nullable(),
  price: z.coerce.number().int().min(0).max(100_000_000),
  imageUrl: z.string().max(600).optional().nullable(),
  isAvailable: z.boolean().optional(),
  sortOrder: z.coerce.number().int().min(0).max(999).optional(),
});

export const promoSchema = z.object({
  title: z.string().min(1).max(120),
  titleEn: z.string().max(120).optional().nullable(),
  body: z.string().max(400).optional().nullable(),
  bodyEn: z.string().max(400).optional().nullable(),
  imageUrl: z.string().max(600).optional().nullable(),
  linkUrl: z.string().max(600).optional().nullable(),
  sortOrder: z.coerce.number().int().min(0).max(999).optional(),
});

export const branchSchema = z.object({
  name: z.string().min(1).max(80),
  nameEn: z.string().max(80).optional().nullable(),
});

export const userSchema = z.object({
  name: z.string().min(1).max(80),
  email: z.string().email(),
  password: z.string().min(6).max(120),
  role: z.enum(["OWNER", "MANAGER", "CASHIER", "KITCHEN"]).optional(),
  branchId: z.string().optional().nullable(),
});

/** Flattens Zod issues into a single human readable message. */
export function firstError(error: z.ZodError): string {
  const issue = error.issues[0];
  if (!issue) return "INVALID_INPUT";
  const path = issue.path.join(".");
  return path ? `${path}: ${issue.message}` : issue.message;
}
