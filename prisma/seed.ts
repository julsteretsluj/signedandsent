import "dotenv/config";
import { SHARED_ACCESS_CODE } from "../src/lib/access-code";
import { createPrismaClient } from "../src/lib/db-client";
import { OFFICIAL_CONSENT_DOCUMENT } from "../src/lib/consent-form";
import { assertOfficialConsentPdfExists } from "../src/lib/pdf";

const prisma = createPrismaClient();

async function main() {
  await assertOfficialConsentPdfExists();

  await prisma.accessCode.updateMany({
    data: { documentPath: OFFICIAL_CONSENT_DOCUMENT },
  });

  await prisma.accessCode.upsert({
    where: { code: SHARED_ACCESS_CODE },
    update: {
      label: "",
      documentPath: OFFICIAL_CONSENT_DOCUMENT,
    },
    create: {
      code: SHARED_ACCESS_CODE,
      label: "",
      documentPath: OFFICIAL_CONSENT_DOCUMENT,
    },
  });

  console.log(`\nShared access code: ${SHARED_ACCESS_CODE}`);
  console.log(`Official form: public/${OFFICIAL_CONSENT_DOCUMENT}`);
  console.log(`Sign URL: http://localhost:3000/sign/${SHARED_ACCESS_CODE}`);
  console.log("\nThis code accepts unlimited submissions (one per parent).");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
