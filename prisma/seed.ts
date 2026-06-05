import "dotenv/config";
import {
  SHARED_CONSENT_ACCESS_CODE,
  SHARED_VISA_LETTER_ACCESS_CODE,
} from "../src/lib/access-code";
import { createPrismaClient } from "../src/lib/db-client";
import {
  OFFICIAL_CONSENT_DOCUMENT,
  OFFICIAL_VISA_LETTER_DOCUMENT,
} from "../src/lib/consent-form";
import {
  assertOfficialConsentPdfExists,
  assertOfficialVisaLetterPdfExists,
} from "../src/lib/pdf";

const prisma = createPrismaClient();

async function main() {
  await assertOfficialConsentPdfExists();

  await prisma.accessCode.updateMany({
    data: { documentPath: OFFICIAL_CONSENT_DOCUMENT },
  });

  // Consent shared access code (always created).
  await prisma.accessCode.upsert({
    where: { code: SHARED_CONSENT_ACCESS_CODE },
    update: { label: "", documentPath: OFFICIAL_CONSENT_DOCUMENT },
    create: {
      code: SHARED_CONSENT_ACCESS_CODE,
      label: "",
      documentPath: OFFICIAL_CONSENT_DOCUMENT,
    },
  });

  console.log(`\nShared consent access code: ${SHARED_CONSENT_ACCESS_CODE}`);
  console.log(`Official consent form: public/${OFFICIAL_CONSENT_DOCUMENT}`);
  console.log(
    `Consent sign URL: http://localhost:3000/sign/${SHARED_CONSENT_ACCESS_CODE}`
  );
  console.log("\nThis consent code accepts unlimited submissions (one per parent).");

  // Visa letter shared access code (optional; skipped if template missing).
  try {
    await assertOfficialVisaLetterPdfExists();
    await prisma.accessCode.upsert({
      where: { code: SHARED_VISA_LETTER_ACCESS_CODE },
      update: { label: "", documentPath: OFFICIAL_VISA_LETTER_DOCUMENT },
      create: {
        code: SHARED_VISA_LETTER_ACCESS_CODE,
        label: "",
        documentPath: OFFICIAL_VISA_LETTER_DOCUMENT,
      },
    });

    console.log(
      `\nShared visa access code: ${SHARED_VISA_LETTER_ACCESS_CODE}`
    );
    console.log(`Official visa form: public/${OFFICIAL_VISA_LETTER_DOCUMENT}`);
    console.log(
      `Visa sign URL: http://localhost:3000/sign/${SHARED_VISA_LETTER_ACCESS_CODE}`
    );
    console.log("\nThis visa code accepts unlimited submissions (one per parent).");
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn(
      `\nSkipping visa-letter shared code (template missing): ${msg}`
    );
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
