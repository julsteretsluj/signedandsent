import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";
import { SHARED_ACCESS_CODE } from "../src/lib/access-code";
import { OFFICIAL_CONSENT_DOCUMENT } from "../src/lib/consent-form";
import { assertOfficialConsentPdfExists } from "../src/lib/pdf";

const url = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
const adapter = new PrismaBetterSqlite3({ url });
const prisma = new PrismaClient({ adapter });

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
