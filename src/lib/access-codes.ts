import type { AccessCode } from "@/generated/prisma/client";
import { SHARED_ACCESS_CODE } from "@/lib/access-code";
import { getPrisma, isDatabaseConfigured } from "@/lib/db-client";
import { OFFICIAL_CONSENT_DOCUMENT } from "@/lib/consent-form";

function envFallbackAccessCode(code: string): AccessCode | null {
  if (code !== SHARED_ACCESS_CODE) {
    return null;
  }

  return {
    id: "env-fallback",
    code,
    label: "",
    documentPath: OFFICIAL_CONSENT_DOCUMENT,
    createdAt: new Date(0),
  };
}

/** Look up an access code, falling back to env config when the DB is unavailable. */
export async function findAccessCode(code: string): Promise<AccessCode | null> {
  const normalized = code.trim().toUpperCase();

  if (isDatabaseConfigured()) {
    try {
      const row = await getPrisma().accessCode.findUnique({
        where: { code: normalized },
      });
      if (row) {
        return row;
      }
    } catch (error) {
      console.error("Access code lookup failed:", error);
    }
  }

  return envFallbackAccessCode(normalized);
}
