"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { createSession, destroySession, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { DEFAULT_LANG, LANG_COOKIE, LANGS, type Lang } from "@/lib/i18n";

export type LoginState = { error?: string };

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) return { error: "MISSING_CREDENTIALS" };

  const user = await prisma.user.findUnique({
    where: { email },
    include: { tenant: true, branch: true },
  });

  if (!user || !user.isActive) return { error: "INVALID_CREDENTIALS" };

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return { error: "INVALID_CREDENTIALS" };

  if (user.role !== "SUPER_ADMIN") {
    if (!user.tenant) return { error: "NO_TENANT" };
    if (user.tenant.subscriptionStatus !== "active") return { error: "TENANT_FROZEN" };
  }

  await createSession({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as "SUPER_ADMIN" | "OWNER" | "MANAGER" | "CASHIER" | "KITCHEN",
    tenantId: user.tenantId,
    branchId: user.branchId,
  });

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

  if (user.role === "SUPER_ADMIN") redirect("/admin");
  if (!user.tenant) redirect("/");
  redirect(`/${user.tenant.slug}/pos`);
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/");
}

/** Persists the UI language choice in a cookie (Arabic default, English optional). */
export async function setLangAction(lang: string): Promise<void> {
  const value: Lang = (LANGS as string[]).includes(lang) ? (lang as Lang) : DEFAULT_LANG;
  const jar = await cookies();
  jar.set(LANG_COOKIE, value, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}
