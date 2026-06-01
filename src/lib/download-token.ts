import crypto from "crypto";

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

function getSecret(): string {
  const secret =
    process.env.DOWNLOAD_TOKEN_SECRET ?? process.env.ADMIN_SECRET ?? "";
  if (!secret) {
    throw new Error("DOWNLOAD_TOKEN_SECRET or ADMIN_SECRET must be set");
  }
  return secret;
}

export function createDownloadToken(submissionId: string): string {
  const issuedAt = Date.now();
  const payload = `${submissionId}:${issuedAt}`;
  const sig = crypto
    .createHmac("sha256", getSecret())
    .update(payload)
    .digest("hex");
  return Buffer.from(`${payload}:${sig}`).toString("base64url");
}

export function verifyDownloadToken(
  submissionId: string,
  token: string
): boolean {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const lastColon = decoded.lastIndexOf(":");
    if (lastColon === -1) return false;
    const payload = decoded.slice(0, lastColon);
    const sig = decoded.slice(lastColon + 1);
    const [id, issuedAtStr] = payload.split(":");
    if (id !== submissionId) return false;
    const issuedAt = Number(issuedAtStr);
    if (!Number.isFinite(issuedAt) || Date.now() - issuedAt > TOKEN_TTL_MS) {
      return false;
    }
    const expected = crypto
      .createHmac("sha256", getSecret())
      .update(payload)
      .digest("hex");
    const sigBuf = Buffer.from(sig, "hex");
    const expectedBuf = Buffer.from(expected, "hex");
    if (sigBuf.length !== expectedBuf.length) return false;
    return crypto.timingSafeEqual(sigBuf, expectedBuf);
  } catch {
    return false;
  }
}
