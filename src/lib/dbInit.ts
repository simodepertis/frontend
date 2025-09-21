import { prisma } from "./prisma";

// Minimal bootstrap for SQLite in environments without migrations applied.
// In production move to Prisma migrations (prisma migrate deploy) with Postgres.
export async function ensureUserTable() {
  // Works only with SQLite provider
  // Check if table User exists by inspecting sqlite_master
  try {
    // @ts-ignore - $queryRaw tagged template
    const rows: Array<{ name: string }> = await prisma.$queryRaw`SELECT name FROM sqlite_master WHERE type='table' AND name='User'`;
    if (rows.length === 0) {
      // Create table compatible with prisma schema
      await prisma.$executeRawUnsafe(
        `CREATE TABLE "User" (
          "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
          "nome" TEXT NOT NULL,
          "email" TEXT NOT NULL UNIQUE,
          "password" TEXT NOT NULL,
          "ruolo" TEXT NOT NULL,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        );`
      );
    }
  } catch (e) {
    // ignore bootstrap errors; real errors will surface during queries
    console.error("DB bootstrap error:", e);
  }
}
