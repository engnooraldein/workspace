import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";

// On Vercel serverless environments using SQLite, ensure the writable /tmp database exists.
if (process.env.VERCEL) {
  const tmpDb = "/tmp/dev.db";
  const candidates = [
    path.join(process.cwd(), "prisma", "seed.db"),
    path.join(process.cwd(), "prisma", "dev.db"),
  ];
  if (!fs.existsSync(tmpDb)) {
    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) {
        try {
          fs.copyFileSync(candidate, tmpDb);
          break;
        } catch (e) {
          console.error("[db] Error seeding /tmp/dev.db:", e);
        }
      }
    }
  }
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
