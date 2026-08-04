import { PrismaClient } from "@prisma/client";

// ─────────────────────────────────────────────────────────────────────────────
// Prisma Client Singleton
//
// WHY: Next.js hot-reloading in development creates a new module instance on
// every file change. Without this singleton pattern, each reload would create
// a new PrismaClient and exhaust the PostgreSQL connection pool within minutes.
//
// The global object persists across hot-reloads; production gets exactly one
// instance per process naturally (no global needed there).
// ─────────────────────────────────────────────────────────────────────────────

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
