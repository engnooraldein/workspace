import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

import { prisma } from "./db";

export const SESSION_COOKIE = "sb_session";
const MAX_AGE_SECONDS = 60 * 60 * 12; // 12 hours — one working shift

export type Role = "SUPER_ADMIN" | "OWNER" | "MANAGER" | "CASHIER" | "KITCHEN";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  tenantId: string | null;
  branchId: string | null;
};

function secretKey(): Uint8Array {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 16) {
    throw new Error("SESSION_SECRET is missing or too short (min 16 chars)");
  }
  return new TextEncoder().encode(value);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSession(user: SessionUser): Promise<void> {
  const token = await new SignJWT({
    name: user.name,
    email: user.email,
    role: user.role,
    tenantId: user.tenantId,
    branchId: user.branchId,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(secretKey());

  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

/** Reads and validates the session cookie. Returns null when absent/expired/inactive. */
export async function getSession(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secretKey());
    const userId = payload.sub;
    if (!userId) return null;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.isActive) return null;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as Role,
      tenantId: user.tenantId,
      branchId: user.branchId,
    };
  } catch {
    return null;
  }
}

/** Throws when there is no valid session. Use inside Server Actions / route handlers. */
export async function requireSession(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHORIZED");
  return session;
}

/** Throws unless the session belongs to a super admin. */
export async function requireSuperAdmin(): Promise<SessionUser> {
  const session = await requireSession();
  if (session.role !== "SUPER_ADMIN") throw new Error("FORBIDDEN");
  return session;
}

/**
 * Throws unless the session may operate on the given tenant.
 * Super admins may act on any tenant; everyone else only on their own.
 */
export async function requireTenantAccess(tenantId: string): Promise<SessionUser> {
  const session = await requireSession();
  if (session.role === "SUPER_ADMIN") return session;
  if (session.tenantId !== tenantId) throw new Error("FORBIDDEN");
  return session;
}

/** Staff roles allowed to reach the POS / kitchen dashboard. */
export function isStaffRole(role: Role): boolean {
  return role === "SUPER_ADMIN" || role === "OWNER" || role === "MANAGER" || role === "CASHIER" || role === "KITCHEN";
}
