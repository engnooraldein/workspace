"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { hashPassword, requireSuperAdmin, requireTenantAccess } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/tenant";
import {
  branchSchema,
  firstError,
  menuCategorySchema,
  menuItemSchema,
  promoSchema,
  restaurantSchema,
  userSchema,
} from "@/lib/validation";

export type ActionState = { ok?: boolean; error?: string; message?: string };

const MAX_LOGO_BYTES = 1_500_000;
const ALLOWED_LOGO_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/svg+xml"];

function revalidateTenant(tenantId: string, slug?: string | null) {
  revalidatePath("/admin");
  revalidatePath("/admin/restaurants");
  revalidatePath("/admin/reports");
  if (slug) {
    revalidatePath(`/${slug}`);
    revalidatePath(`/${slug}/track`);
    revalidatePath(`/${slug}/pos`);
  }
  revalidatePath(`/api/tenant/${tenantId}/logo`);
}

/** Reads an uploaded logo into a Buffer, rejecting oversized or unsupported files. */
async function readLogo(formData: FormData): Promise<{ bytes: Buffer; mime: string } | { error: string }> {
  const file = formData.get("logo");
  if (!(file instanceof File) || file.size === 0) return { error: "NO_FILE" };

  const mime = file.type || "image/png";
  if (!ALLOWED_LOGO_TYPES.includes(mime)) return { error: "UNSUPPORTED_LOGO_TYPE" };
  if (file.size > MAX_LOGO_BYTES) return { error: "LOGO_TOO_LARGE" };

  const arrayBuffer = await file.arrayBuffer();
  return { bytes: Buffer.from(arrayBuffer), mime };
}

export async function createRestaurantAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireSuperAdmin();

  const parsed = restaurantSchema.safeParse({
    slug: formData.get("slug") || undefined,
    name: formData.get("name") || undefined,
    nameEn: formData.get("nameEn") || undefined,
    primaryColor: formData.get("primaryColor") || undefined,
    secondaryColor: formData.get("secondaryColor") || undefined,
    accentColor: formData.get("accentColor") || undefined,
    phone: formData.get("phone") || undefined,
    whatsapp: formData.get("whatsapp") || undefined,
    address: formData.get("address") || undefined,
    plan: formData.get("plan") || undefined,
    subscriptionStatus: formData.get("subscriptionStatus") || undefined,
  });

  if (!parsed.success) return { error: firstError(parsed.error) };
  if (!parsed.data.name) return { error: "name: required" };

  const slug = slugify(parsed.data.slug || parsed.data.name);
  if (!slug) return { error: "slug: invalid" };

  const existing = await prisma.tenant.findUnique({ where: { slug } });
  if (existing) return { error: "slug: already used" };

  const logo = await readLogo(formData);
  const logoBytes = "bytes" in logo ? new Uint8Array(logo.bytes) : null;
  const logoMime = "bytes" in logo ? logo.mime : null;

  const tenant = await prisma.tenant.create({
    data: {
      slug,
      name: parsed.data.name,
      nameEn: parsed.data.nameEn ?? null,
      primaryColor: parsed.data.primaryColor ?? "#06b6d4",
      secondaryColor: parsed.data.secondaryColor ?? "#f59e0b",
      accentColor: parsed.data.accentColor ?? "#0ea5e9",
      phone: parsed.data.phone ?? null,
      whatsapp: parsed.data.whatsapp ?? null,
      address: parsed.data.address ?? null,
      plan: parsed.data.plan ?? "trial",
      subscriptionStatus: parsed.data.subscriptionStatus ?? "active",
      logoBytes,
      logoMime,
      branches: { create: { name: "الفرع الرئيسي" } },
    },
  });

  revalidateTenant(tenant.id, tenant.slug);
  return { ok: true, message: tenant.id };
}

export async function updateRestaurantAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireSuperAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "id: required" };

  const parsed = restaurantSchema.safeParse({
    name: formData.get("name") || undefined,
    nameEn: formData.get("nameEn") || undefined,
    tagline: formData.get("tagline") || undefined,
    taglineEn: formData.get("taglineEn") || undefined,
    primaryColor: formData.get("primaryColor") || undefined,
    secondaryColor: formData.get("secondaryColor") || undefined,
    accentColor: formData.get("accentColor") || undefined,
    phone: formData.get("phone") || undefined,
    whatsapp: formData.get("whatsapp") || undefined,
    address: formData.get("address") || undefined,
    instagram: formData.get("instagram") || undefined,
    facebook: formData.get("facebook") || undefined,
    tiktok: formData.get("tiktok") || undefined,
    plan: formData.get("plan") || undefined,
    subscriptionStatus: formData.get("subscriptionStatus") || undefined,
  });

  if (!parsed.success) return { error: firstError(parsed.error) };

  const existing = await prisma.tenant.findUnique({ where: { id } });
  if (!existing) return { error: "NOT_FOUND" };

  const logo = await readLogo(formData);
  const data: Record<string, unknown> = { ...parsed.data };
  delete data.logoBase64;
  delete data.logoMime;
  delete data.slug;
  for (const key of Object.keys(data)) {
    if (data[key] === undefined) delete data[key];
  }
  if ("bytes" in logo) {
    data.logoBytes = new Uint8Array(logo.bytes);
    data.logoMime = logo.mime;
  }

  const tenant = await prisma.tenant.update({ where: { id }, data });

  revalidateTenant(tenant.id, tenant.slug);
  return { ok: true };
}

export async function setSubscriptionAction(tenantId: string, status: "active" | "frozen"): Promise<ActionState> {
  await requireSuperAdmin();

  const tenant = await prisma.tenant.update({
    where: { id: tenantId },
    data: { subscriptionStatus: status },
  });

  revalidateTenant(tenant.id, tenant.slug);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Menu
// ---------------------------------------------------------------------------

export async function createCategoryAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const tenantId = String(formData.get("tenantId") ?? "");
  await requireTenantAccess(tenantId);

  const parsed = menuCategorySchema.safeParse({
    name: formData.get("name") || undefined,
    nameEn: formData.get("nameEn") || undefined,
    sortOrder: formData.get("sortOrder") || undefined,
  });
  if (!parsed.success) return { error: firstError(parsed.error) };

  await prisma.menuCategory.create({
    data: {
      tenantId,
      name: parsed.data.name,
      nameEn: parsed.data.nameEn ?? null,
      sortOrder: parsed.data.sortOrder ?? 0,
    },
  });

  revalidateTenant(tenantId);
  return { ok: true };
}

export async function deleteCategoryAction(categoryId: string): Promise<ActionState> {
  const category = await prisma.menuCategory.findUnique({ where: { id: categoryId } });
  if (!category) return { error: "NOT_FOUND" };
  await requireTenantAccess(category.tenantId);

  await prisma.menuCategory.delete({ where: { id: categoryId } });
  revalidateTenant(category.tenantId);
  return { ok: true };
}

export async function createMenuItemAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const tenantId = String(formData.get("tenantId") ?? "");
  await requireTenantAccess(tenantId);

  const parsed = menuItemSchema.safeParse({
    categoryId: formData.get("categoryId") || undefined,
    name: formData.get("name") || undefined,
    nameEn: formData.get("nameEn") || undefined,
    description: formData.get("description") || undefined,
    descriptionEn: formData.get("descriptionEn") || undefined,
    price: formData.get("price") || undefined,
    imageUrl: formData.get("imageUrl") || undefined,
    sortOrder: formData.get("sortOrder") || undefined,
  });
  if (!parsed.success) return { error: firstError(parsed.error) };

  await prisma.menuItem.create({
    data: {
      tenantId,
      categoryId: parsed.data.categoryId ?? null,
      name: parsed.data.name,
      nameEn: parsed.data.nameEn ?? null,
      description: parsed.data.description ?? null,
      descriptionEn: parsed.data.descriptionEn ?? null,
      price: parsed.data.price,
      imageUrl: parsed.data.imageUrl ?? null,
      sortOrder: parsed.data.sortOrder ?? 0,
    },
  });

  revalidateTenant(tenantId);
  return { ok: true };
}

export async function updateMenuItemAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const id = String(formData.get("id") ?? "");
  const item = await prisma.menuItem.findUnique({ where: { id } });
  if (!item) return { error: "NOT_FOUND" };
  await requireTenantAccess(item.tenantId);

  const parsed = menuItemSchema.safeParse({
    categoryId: formData.get("categoryId") || undefined,
    name: formData.get("name") || undefined,
    nameEn: formData.get("nameEn") || undefined,
    description: formData.get("description") || undefined,
    descriptionEn: formData.get("descriptionEn") || undefined,
    price: formData.get("price") || undefined,
    imageUrl: formData.get("imageUrl") || undefined,
    sortOrder: formData.get("sortOrder") || undefined,
  });
  if (!parsed.success) return { error: firstError(parsed.error) };

  await prisma.menuItem.update({
    where: { id },
    data: {
      categoryId: parsed.data.categoryId ?? null,
      name: parsed.data.name,
      nameEn: parsed.data.nameEn ?? null,
      description: parsed.data.description ?? null,
      descriptionEn: parsed.data.descriptionEn ?? null,
      price: parsed.data.price,
      imageUrl: parsed.data.imageUrl ?? null,
      sortOrder: parsed.data.sortOrder ?? 0,
    },
  });

  revalidateTenant(item.tenantId);
  return { ok: true };
}

/** Quick toggle for "temporarily out of stock". */
export async function toggleMenuItemAction(itemId: string): Promise<ActionState> {
  const item = await prisma.menuItem.findUnique({ where: { id: itemId } });
  if (!item) return { error: "NOT_FOUND" };
  await requireTenantAccess(item.tenantId);

  await prisma.menuItem.update({ where: { id: itemId }, data: { isAvailable: !item.isAvailable } });
  revalidateTenant(item.tenantId);
  return { ok: true };
}

export async function deleteMenuItemAction(itemId: string): Promise<ActionState> {
  const item = await prisma.menuItem.findUnique({ where: { id: itemId } });
  if (!item) return { error: "NOT_FOUND" };
  await requireTenantAccess(item.tenantId);

  await prisma.menuItem.delete({ where: { id: itemId } });
  revalidateTenant(item.tenantId);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Promotions
// ---------------------------------------------------------------------------

export async function createPromoAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const tenantId = String(formData.get("tenantId") ?? "");
  await requireTenantAccess(tenantId);

  const parsed = promoSchema.safeParse({
    title: formData.get("title") || undefined,
    titleEn: formData.get("titleEn") || undefined,
    body: formData.get("body") || undefined,
    bodyEn: formData.get("bodyEn") || undefined,
    imageUrl: formData.get("imageUrl") || undefined,
    linkUrl: formData.get("linkUrl") || undefined,
    sortOrder: formData.get("sortOrder") || undefined,
  });
  if (!parsed.success) return { error: firstError(parsed.error) };

  await prisma.promo.create({
    data: {
      tenantId,
      title: parsed.data.title,
      titleEn: parsed.data.titleEn ?? null,
      body: parsed.data.body ?? null,
      bodyEn: parsed.data.bodyEn ?? null,
      imageUrl: parsed.data.imageUrl ?? null,
      linkUrl: parsed.data.linkUrl ?? null,
      sortOrder: parsed.data.sortOrder ?? 0,
    },
  });

  revalidateTenant(tenantId);
  return { ok: true };
}

export async function togglePromoAction(promoId: string, isActive: boolean): Promise<ActionState> {
  const promo = await prisma.promo.findUnique({ where: { id: promoId } });
  if (!promo) return { error: "NOT_FOUND" };
  await requireTenantAccess(promo.tenantId);

  await prisma.promo.update({ where: { id: promoId }, data: { isActive } });
  revalidateTenant(promo.tenantId);
  return { ok: true };
}

export async function deletePromoAction(promoId: string): Promise<ActionState> {
  const promo = await prisma.promo.findUnique({ where: { id: promoId } });
  if (!promo) return { error: "NOT_FOUND" };
  await requireTenantAccess(promo.tenantId);

  await prisma.promo.delete({ where: { id: promoId } });
  revalidateTenant(promo.tenantId);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Branches & staff
// ---------------------------------------------------------------------------

export async function createBranchAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const tenantId = String(formData.get("tenantId") ?? "");
  await requireTenantAccess(tenantId);

  const parsed = branchSchema.safeParse({
    name: formData.get("name") || undefined,
    nameEn: formData.get("nameEn") || undefined,
  });
  if (!parsed.success) return { error: firstError(parsed.error) };

  await prisma.branch.create({
    data: {
      tenantId,
      name: parsed.data.name,
      nameEn: parsed.data.nameEn ?? null,
    },
  });

  revalidateTenant(tenantId);
  return { ok: true };
}

export async function createUserAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const tenantId = String(formData.get("tenantId") ?? "");
  await requireTenantAccess(tenantId);

  const parsed = userSchema.safeParse({
    name: formData.get("name") || undefined,
    email: formData.get("email") || undefined,
    password: formData.get("password") || undefined,
    role: formData.get("role") || undefined,
    branchId: formData.get("branchId") || undefined,
  });
  if (!parsed.success) return { error: firstError(parsed.error) };

  const email = parsed.data.email!.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "email: already used" };

  await prisma.user.create({
    data: {
      tenantId,
      branchId: parsed.data.branchId ?? null,
      name: parsed.data.name!,
      email,
      passwordHash: await hashPassword(parsed.data.password!),
      role: parsed.data.role ?? "CASHIER",
    },
  });

  revalidateTenant(tenantId);
  return { ok: true };
}
