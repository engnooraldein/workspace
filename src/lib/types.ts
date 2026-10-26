import type { OrderStatus } from "./realtime";

export type TenantBrand = {
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
  logoUrl: string | null;
  subscriptionStatus: string;
};

export type PublicMenuItem = {
  id: string;
  name: string;
  nameEn: string | null;
  description: string | null;
  descriptionEn: string | null;
  price: number;
  imageUrl: string | null;
  isAvailable: boolean;
};

export type PublicMenuCategory = {
  id: string;
  name: string;
  nameEn: string | null;
  items: PublicMenuItem[];
};

export type PublicPromo = {
  id: string;
  title: string;
  titleEn: string | null;
  body: string | null;
  bodyEn: string | null;
  imageUrl: string | null;
  linkUrl: string | null;
};

export type PublicRestaurant = TenantBrand & {
  menu: PublicMenuCategory[];
  promos: PublicPromo[];
};

export type PublicOrder = {
  token: string;
  number: number;
  status: OrderStatus;
  tableNumber: string | null;
  itemsNote: string | null;
  totalAmount: number;
  createdAt: string;
  readyAt: string | null;
  completedAt: string | null;
  rating: { stars: number; note: string | null } | null;
  restaurant: TenantBrand;
};

export type ApiError = { error: string; fields?: Record<string, string> };

export type PosOrder = {
  id: string;
  token: string;
  number: number;
  status: OrderStatus;
  tableNumber: string | null;
  itemsNote: string | null;
  totalAmount: number;
  createdAt: string;
  readyAt: string | null;
  completedAt: string | null;
  branchId: string;
  pushCount?: number;
};
