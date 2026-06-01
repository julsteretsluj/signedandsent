/**
 * Regenerate the latest submission PDF (clean page 2) and resend by email.
 * Usage: npx tsx scripts/resend-last-pdf.ts [--delegate "Name"] [--parent "Name"]
 */
import "dotenv/config";
import fs from "fs/promises";
import path from "path";
import { sendSubmissionEmails } from "../src/lib/email";
import { regenerateSignedPdf } from "../src/lib/regenerate-pdf";
import { prisma } from "../src/lib/prisma";

function argValue(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function main() {
  const submission = await prisma.submission.findFirst({
    orderBy: { submittedAt: "desc" },
    include: { accessCode: true },
  });

  if (!submission) {
    console.error("No submissions found.");
    process.exit(1);
  }

  const pdfPath = path.join(process.cwd(), submission.signedPdfPath);
  const existing = await fs.readFile(pdfPath);
  const updated = await regenerateSignedPdf(existing, {
    dataConsent: true,
    mediaConsent: true,
  });

  const filename = path.basename(submission.signedPdfPath).replace(
    /\.pdf$/,
    "-v2.pdf"
  );
  await fs.writeFile(pdfPath, updated);

  const delegateName =
    argValue("--delegate") ?? process.env.RESEND_DELEGATE_NAME ?? "Delegate";
  const parentName =
    argValue("--parent") ?? process.env.RESEND_PARENT_NAME ?? "Parent/Guardian";

  const result = await sendSubmissionEmails({
    code: submission.accessCode.code,
    parentEmail: submission.parentEmail,
    signatureMethod: submission.signatureType,
    signedPdf: updated,
    filename,
    delegateName,
    school: "—",
    parentName,
    emergencyContact: "—",
    dataConsent: true,
    mediaConsent: true,
  });

  console.log("Updated PDF:", pdfPath);
  console.log("Resent to:", submission.parentEmail);
  console.log("Parent copy:", result.parentCopySent ? "sent" : "not sent");
  console.log(
    "Organiser notify:",
    result.organiserNotified ? "sent" : "not sent"
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
