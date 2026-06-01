/**
 * Create a new access code.
 * Usage: npx tsx scripts/create-code.ts [CUSTOM_CODE]
 * Optional organiser-only label: npx tsx scripts/create-code.ts [CODE] --label "Batch A"
 */
import "dotenv/config";

const args = process.argv.slice(2);
const labelFlag = args.indexOf("--label");
const label =
  labelFlag >= 0 ? args[labelFlag + 1] : undefined;
const positional = args.filter((a, i) => a !== "--label" && i !== labelFlag + 1);
const customCode = positional[0];

const adminSecret = process.env.ADMIN_SECRET;
if (!adminSecret) {
  console.error("ADMIN_SECRET is not set in .env");
  process.exit(1);
}
const secret: string = adminSecret;

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

async function main() {
  const res = await fetch(`${baseUrl}/api/admin/codes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-admin-secret": secret,
    },
    body: JSON.stringify({
      ...(label ? { label } : {}),
      ...(customCode ? { code: customCode } : {}),
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    console.error("Failed:", data.error);
    process.exit(1);
  }

  console.log("\nAccess code created:");
  console.log(`  Code:     ${data.code}`);
  if (data.label) console.log(`  Label:    ${data.label} (organisers only)`);
  console.log(`  Sign URL: ${baseUrl}${data.signUrl}`);
}

main().catch(console.error);
