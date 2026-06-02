import path from "path";

/** Resolve SQLite `file:` URLs to an absolute path (stable across Next.js cwd). */
export function resolveSqliteDatabaseUrl(raw?: string): string {
  const url = raw ?? process.env.DATABASE_URL ?? "file:./prisma/dev.db";
  if (!url.startsWith("file:")) {
    return url;
  }

  const filePath = url.slice("file:".length);
  if (path.isAbsolute(filePath)) {
    return url;
  }

  const absolute = path.resolve(process.cwd(), filePath);
  return `file:${absolute}`;
}
