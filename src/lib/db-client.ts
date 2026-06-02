import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "@/generated/prisma/client";
import { resolveSqliteDatabaseUrl } from "@/lib/db-url";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function tursoConfig(): { url: string; authToken: string } | null {
  const url = process.env.TURSO_DATABASE_URL?.trim();
  const authToken = process.env.TURSO_AUTH_TOKEN?.trim();
  if (!url || !authToken) {
    return null;
  }
  return { url, authToken };
}

function shouldUseLocalSqlite(): boolean {
  if (tursoConfig()) {
    return false;
  }
  if (process.env.VERCEL) {
    return false;
  }
  return true;
}

export function createPrismaClient(): PrismaClient {
  const turso = tursoConfig();
  if (turso) {
    const adapter = new PrismaLibSql({
      url: turso.url,
      authToken: turso.authToken,
    });
    return new PrismaClient({ adapter });
  }

  if (!shouldUseLocalSqlite()) {
    throw new Error(
      "Database not configured for Vercel. Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN."
    );
  }

  const url = resolveSqliteDatabaseUrl();
  const adapter = new PrismaBetterSqlite3({ url });
  return new PrismaClient({ adapter });
}

export function getPrisma(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  return globalForPrisma.prisma;
}

export function isDatabaseConfigured(): boolean {
  return !!tursoConfig() || shouldUseLocalSqlite();
}
