import { prisma } from "./db";
import type { PublicMenuCategory, PublicOrder, PublicPromo, PublicRestaurant, TenantBrand } from "./types";

type TenantRow = {
  id: string;
  slug: string;
  name: string;
  nameEn: string | null;
  tagline: string | null;
  taglineEn: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  currency: string;
  phone: string | null;
  whatsapp: string | null;
  address: string | null;
  instagram: string | null;
  facebook: string | null;
  tiktok: string | null;
  logoBytes: Uint8Array | null;
  subscriptionStatus: string;
};

export function logoUrl(tenant: { id: string; logoBytes: Uint8Array | null }): string | null {
  return tenant.logoBytes ? `/api/tenant/${tenant.id}/logo` : null;
}

export function brandOf(tenant: TenantRow): TenantBrand {
  return {
    slug: tenant.slug,
    name: tenant.name,
    nameEn: tenant.nameEn,
    tagline: tenant.tagline,
    taglineEn: tenant.taglineEn,
    primaryColor: tenant.primaryColor,
    secondaryColor: tenant.secondaryColor,
    accentColor: tenant.accentColor,
    currency: tenant.currency,
    phone: tenant.phone,
    whatsapp: tenant.whatsapp,
    address: tenant.address,
    instagram: tenant.instagram,
    facebook: tenant.facebook,
    tiktok: tenant.tiktok,
    logoUrl: logoUrl(tenant),
    subscriptionStatus: tenant.subscriptionStatus,
  };
}

export async function loadPublicRestaurant(slug: string): Promise<PublicRestaurant | null> {
  const tenant = await prisma.tenant.findUnique({
    where: { slug: slug.toLowerCase() },
    include: {
      menuCategories: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        include: {
          items: {
            orderBy: { sortOrder: "asc" },
          },
        },
      },
      promos: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
    },
  });

  if (!tenant) return null;

  const menu: PublicMenuCategory[] = tenant.menuCategories.map((category) => ({
    id: category.id,
    name: category.name,
    nameEn: category.nameEn,
    items: category.items.map((item) => ({
      id: item.id,
      name: item.name,
      nameEn: item.nameEn,
      description: item.description,
      descriptionEn: item.descriptionEn,
      price: item.price,
      imageUrl: item.imageUrl,
      isAvailable: item.isAvailable,
    })),
  }));

  const promos: PublicPromo[] = tenant.promos.map((promo) => ({
    id: promo.id,
    title: promo.title,
    titleEn: promo.titleEn,
    body: promo.body,
    bodyEn: promo.bodyEn,
    imageUrl: promo.imageUrl,
    linkUrl: promo.linkUrl,
  }));

  return { ...brandOf(tenant), menu, promos };
}

/** Loads a public order with its restaurant branding attached. */
export async function loadPublicOrder(token: string): Promise<PublicOrder | null> {
  const order = await prisma.order.findUnique({
    where: { publicToken: token },
    include: { tenant: true, rating: true },
  });

  if (!order) return null;

  return {
    token: order.publicToken,
    number: order.number,
    status: order.status as PublicOrder["status"],
    tableNumber: order.tableNumber,
    itemsNote: order.itemsNote,
    totalAmount: order.totalAmount,
    createdAt: order.createdAt.toISOString(),
    readyAt: order.readyAt?.toISOString() ?? null,
    completedAt: order.completedAt?.toISOString() ?? null,
    rating: order.rating ? { stars: order.rating.stars, note: order.rating.note } : null,
    restaurant: brandOf(order.tenant),
  };
}
