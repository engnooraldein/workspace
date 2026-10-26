import { prisma } from "./db";

export type TenantWithBranches = NonNullable<Awaited<ReturnType<typeof getTenantBySlug>>>;

export async function getTenantBySlug(slug: string) {
  return prisma.tenant.findUnique({
    where: { slug: slug.toLowerCase() },
    include: { branches: { where: { isActive: true }, orderBy: { name: "asc" } } },
  });
}

export async function getTenantById(id: string) {
  return prisma.tenant.findUnique({
    where: { id },
    include: { branches: { where: { isActive: true }, orderBy: { name: "asc" } } },
  });
}

export function isTenantActive(tenant: { subscriptionStatus: string } | null): boolean {
  return !!tenant && tenant.subscriptionStatus === "active";
}

/** CSS custom properties applied to every customer-facing screen of a tenant. */
export function brandingVars(tenant: {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
}) {
  return {
    "--brand-primary": tenant.primaryColor,
    "--brand-secondary": tenant.secondaryColor,
    "--brand-accent": tenant.accentColor,
  } as React.CSSProperties;
}

export function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
