/**
 * Upload all stored submission PDFs to the organiser Drive folder (one-time backfill).
 * Usage: npx tsx scripts/backfill-google-drive.ts
 */
import "dotenv/config";
import path from "path";
import { getPrisma } from "../src/lib/db-client";
import {
  copyPdfToGoogleDrive,
  isGoogleDriveConfigured,
} from "../src/lib/google-drive";
import { readSignedPdf } from "../src/lib/submission-storage";

async function main() {
  if (!isGoogleDriveConfigured()) {
    console.error(
      "Set GOOGLE_SERVICE_ACCOUNT_JSON in .env before running backfill."
    );
    process.exit(1);
  }

  const submissions = await getPrisma().submission.findMany({
    orderBy: { submittedAt: "asc" },
  });

  if (submissions.length === 0) {
    console.log("No submissions to upload.");
    return;
  }

  let uploaded = 0;
  let skipped = 0;

  for (const submission of submissions) {
    const pdf = await readSignedPdf(submission);
    if (!pdf) {
      console.warn("Skipping (no PDF data):", submission.id);
      skipped += 1;
      continue;
    }

    const filename = path.basename(submission.signedPdfPath);
    const ok = await copyPdfToGoogleDrive(filename, pdf);
    if (ok) {
      uploaded += 1;
      console.log("Uploaded:", filename);
    } else {
      skipped += 1;
    }
  }

  console.log(`Done. Uploaded ${uploaded}, skipped ${skipped}.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await getPrisma().$disconnect();
  });
