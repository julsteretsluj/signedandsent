import fs from "fs/promises";
import path from "path";

const USE_DATABASE_PDF_STORAGE =
  !!process.env.VERCEL || process.env.STORE_PDFS_IN_DATABASE === "true";

export function shouldStorePdfInDatabase(): boolean {
  return USE_DATABASE_PDF_STORAGE;
}

export async function persistSignedPdf(
  code: string,
  email: string,
  signedPdf: Buffer
): Promise<{ signedPdfPath: string; signedPdfData?: Buffer }> {
  const emailSlug = email
    .split("@")[0]
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .slice(0, 40);
  const filename = `${code}-${emailSlug}-${Date.now()}.pdf`;
  const signedPdfPath = path.join("uploads", "submissions", filename);

  if (shouldStorePdfInDatabase()) {
    return { signedPdfPath, signedPdfData: signedPdf };
  }

  const submissionsDir = path.join(process.cwd(), "uploads", "submissions");
  await fs.mkdir(submissionsDir, { recursive: true });
  await fs.writeFile(path.join(process.cwd(), signedPdfPath), signedPdf);
  return { signedPdfPath };
}

export async function readSignedPdf(submission: {
  signedPdfPath: string;
  signedPdfData: Buffer | Uint8Array | null;
}): Promise<Buffer | null> {
  if (submission.signedPdfData) {
    return Buffer.from(submission.signedPdfData);
  }

  const absolutePath = path.join(process.cwd(), submission.signedPdfPath);
  try {
    return await fs.readFile(absolutePath);
  } catch {
    return null;
  }
}
