/**
 * One-time OAuth setup for Google Drive uploads from a personal Gmail folder.
 *
 * Prerequisites:
 * - Google Cloud project with Drive API enabled
 * - OAuth client (Desktop app) with GOOGLE_OAUTH_CLIENT_ID + GOOGLE_OAUTH_CLIENT_SECRET in .env
 *
 * Usage:
 *   npx tsx scripts/google-drive-auth.ts
 *
 * Sign in as the Google account that OWNS the Drive folder (e.g. juleskittoastrop@gmail.com).
 * Copy the refresh token into GOOGLE_OAUTH_REFRESH_TOKEN in .env / Vercel.
 */
import "dotenv/config";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { google } from "googleapis";
import { DRIVE_FILE_SCOPE } from "../src/lib/google-drive";

const REDIRECT_URI = "http://localhost:3000/oauth2callback";

async function main() {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret) {
    console.error(
      "Set GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET in .env first."
    );
    console.error(
      "Create an OAuth client at https://console.cloud.google.com/apis/credentials"
    );
    console.error('Application type: Desktop app (or Web with redirect URI below).');
    process.exit(1);
  }

  const oauth2 = new google.auth.OAuth2(clientId, clientSecret, REDIRECT_URI);

  const authUrl = oauth2.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [DRIVE_FILE_SCOPE],
  });

  console.log("\n1. Open this URL and sign in as the account that OWNS the Drive folder:\n");
  console.log(authUrl);
  console.log(
    "\n2. After approving, you will be redirected to localhost (page may not load)."
  );
  console.log(
    "   Copy the full redirect URL from your browser address bar.\n"
  );

  const rl = readline.createInterface({ input, output });
  const redirectUrl = await rl.question("Paste redirect URL here: ");
  rl.close();

  const codeMatch = redirectUrl.match(/[?&]code=([^&]+)/);
  if (!codeMatch?.[1]) {
    console.error("Could not find ?code= in that URL.");
    process.exit(1);
  }

  const { tokens } = await oauth2.getToken(codeMatch[1]);

  if (!tokens.refresh_token) {
    console.error(
      "No refresh token returned. Revoke app access at https://myaccount.google.com/permissions and run again with prompt=consent."
    );
    process.exit(1);
  }

  console.log("\nAdd to .env and Vercel:\n");
  console.log(`GOOGLE_OAUTH_REFRESH_TOKEN=${tokens.refresh_token}`);
  console.log("\nAlso set GOOGLE_DRIVE_FOLDER_ID to your folder ID.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
