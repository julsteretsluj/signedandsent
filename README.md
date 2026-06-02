# Signed & Sent

Digital parental consent signing for **SEAMUN I 2027**. Parents enter an access code, review the official consent form, sign (draw, type, or upload), and submit with their email.

## Quick start

```bash
npm install
npm run db:migrate   # if not already applied (development)
npm run db:seed      # creates the shared access code
npm run dev
```

For production (`npm start`), migrations and seed run automatically via `prestart` (`npm run db:deploy`). Locally the SQLite file lives at `prisma/dev.db` (gitignored).

### Deploying on Vercel

Vercel’s serverless runtime cannot use a local SQLite file. Use [Turso](https://turso.tech) (SQLite-compatible):

1. Create a Turso database and copy its URL + auth token.
2. In Vercel → **Settings → Environment Variables**, set:
   - `TURSO_DATABASE_URL` — e.g. `libsql://your-db.turso.io`
   - `TURSO_AUTH_TOKEN` — from `turso db tokens create`
   - `SHARED_ACCESS_CODE` — `SEAMUN2027` (optional; used as fallback if the DB is empty)
3. Apply migrations to Turso (once per schema change):

```bash
turso db shell your-db-name < prisma/migrations/20260526033355_init/migration.sql
# …repeat for each migration in prisma/migrations/, newest last
npm run db:seed   # with TURSO_* env vars set locally
```

Signed PDFs are stored in the database on Vercel (not on disk). Submissions still email organisers and parents when SMTP/Resend is configured.

Without Turso, the shared access code from `SHARED_ACCESS_CODE` still loads the sign form, but submissions are not persisted.

Open [http://localhost:3000](http://localhost:3000) and use the shared code **`SEAMUN2027`** (or whatever you set in `SHARED_ACCESS_CODE`).

## How it works

1. **Organisers** distribute one shared access code (e.g. in a Google Form) — unlimited parents can submit with the same code.
2. **Parents** visit the site, enter the code, read the form, add a signature, and submit with their email.
3. **Submissions** are stored as signed PDFs in `uploads/submissions/` and linked in the database.
4. **Email** (optional) — organisers and the parent each receive a confirmation with the signed PDF attached.

## Creating access codes

With the dev server running:

```bash
npm run create-code
# optional custom code:
npm run create-code -- SEAMUN2027
# optional organiser-only label (never shown to parents):
npm run create-code -- SEAMUN2027 --label "Batch A"
```

Requires `ADMIN_SECRET` in `.env` (sent as `x-admin-secret` header).

Or via API:

```bash
curl -X POST http://localhost:3000/api/admin/codes \
  -H "Content-Type: application/json" \
  -H "x-admin-secret: your-secret" \
  -d '{"code": "SEAMUN2027"}'
```

List all codes:

```bash
curl http://localhost:3000/api/admin/codes \
  -H "x-admin-secret: your-secret"
```

## Environment variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Local SQLite path, e.g. `file:./prisma/dev.db` (development only) |
| `TURSO_DATABASE_URL` | Turso/libSQL URL for Vercel production |
| `TURSO_AUTH_TOKEN` | Turso auth token (required with `TURSO_DATABASE_URL`) |
| `ADMIN_SECRET` | Secret for admin API routes |
| `NEXT_PUBLIC_APP_URL` | Base URL for `create-code` script (default `http://localhost:3000`) |
| `SHARED_ACCESS_CODE` | Single code all parents use (default `SEAMUN2027`; run `npm run db:seed`) |
| `SMTP_HOST` | SMTP server (if set, SMTP is used instead of Resend) |
| `SMTP_PORT` | Usually `587` (STARTTLS) or `465` (SSL) |
| `SMTP_USER` / `SMTP_PASS` | Mailbox login (often an app password) |
| `RESEND_API_KEY` | [Resend](https://resend.com) API key (optional alternative) |
| `EMAIL_FROM` | Sender address, e.g. `Signed & Sent <information@seamun.com>` |
| `EMAIL_REPLY_TO` | Reply address for parent emails (default `information@seamun.com`) |
| `NOTIFY_EMAIL` | Optional extra organiser inbox(es); comma-separated |
| `GOOGLE_OAUTH_CLIENT_ID` | OAuth client ID (**required** for Drive backup) |
| `GOOGLE_OAUTH_CLIENT_SECRET` | OAuth client secret |
| `GOOGLE_OAUTH_REFRESH_TOKEN` | Refresh token for the account that owns the Drive folder |
| `GOOGLE_DRIVE_FOLDER_ID` | Folder ID from the Drive URL (`…/folders/FOLDER_ID`) |
| `GOOGLE_DRIVE_ORGANISER_EMAIL` | Also grant access to this inbox (default `information@seamun.com`) |

## Google Drive backup (organisers only)

Each signed PDF is copied to a **private** Google Drive folder on submit. Parents never see a Drive link.

**You do not need a service account or service account key.** Google often blocks key creation, and service accounts cannot access personal Gmail folders anyway. Use OAuth below.

### Setup with OAuth (personal Gmail folder)

The folder can live in **`juleskittoastrop@gmail.com`** (or any Google account that owns the folder). The app uploads as that account — no sharing with robots or service accounts.

1. Open [Google Cloud Console](https://console.cloud.google.com/) → select or create a project.
2. **APIs & Services → Library** → enable **Google Drive API**.
3. **APIs & Services → OAuth consent screen** → configure (External is fine for personal use) → add your Gmail as a test user if the app is in “Testing”.
4. **APIs & Services → Credentials** → **Create credentials** → **OAuth client ID**:
   - Application type: **Desktop app** (simplest), **or**
   - Web application with redirect URI: `http://localhost:3000/oauth2callback`
5. Add to `.env`:
   ```env
   GOOGLE_OAUTH_CLIENT_ID=…apps.googleusercontent.com
   GOOGLE_OAUTH_CLIENT_SECRET=…
   GOOGLE_DRIVE_FOLDER_ID=1kO3j1QfOJvaEkf-1rb-8Pz_Ro642Og41
   ```
6. Run once and sign in as the **folder owner** (`juleskittoastrop@gmail.com`):
   ```bash
   npm run google-drive-auth
   ```
   After approving access, paste the redirect URL from your browser into the script. Copy the printed `GOOGLE_OAUTH_REFRESH_TOKEN` into `.env` and Vercel.

Each uploaded file stays private; `information@seamun.com` gets writer access automatically. You can also share the Drive folder manually with `information@seamun.com` so both accounts see all files in the folder view.

Upload failures do not block parent submission. To backfill existing PDFs:

```bash
npx tsx scripts/backfill-google-drive.ts
```

## Email notifications

Configure **SMTP** (recommended, no Resend) **or** **Resend**. If `SMTP_HOST` is set, the app uses your normal mail server; otherwise it uses Resend when `RESEND_API_KEY` is set.

When email is configured and `EMAIL_FROM` is set, each submission emails the **parent** a copy of the signed PDF. Every submission also emails **information@seamun.com** with the full response and PDF attached.

Parents always get a **Download your signed PDF** button on the success page (link valid 1 hour). If email is not configured, submissions still work.

### Email without Resend (SMTP + Google Workspace)

Use the same mailbox you read (`information@seamun.com`) to **send** mail via SMTP.

**1. Google Workspace inbox**  
Create `information@seamun.com` in Google Admin if needed.

**2. App password** (required if 2-Step Verification is on)  
Google Account → **Security** → **2-Step Verification** → **App passwords** → create one for “Mail” / “Signed and Sent”.

**3. Add to `.env`**

```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="information@seamun.com"
SMTP_PASS="xxxx xxxx xxxx xxxx"
EMAIL_FROM="Signed & Sent <information@seamun.com>"
EMAIL_REPLY_TO="information@seamun.com"
NOTIFY_EMAIL="information@seamun.com"
```

Do **not** set `RESEND_API_KEY` unless you want Resend instead (SMTP takes priority when `SMTP_HOST` is set).

**4. Microsoft 365** (alternative)

```env
SMTP_HOST="smtp.office365.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="information@seamun.com"
SMTP_PASS="your-password-or-app-password"
```

**5. Restart** the app and submit a test form.

### Email with Resend (optional)

If you prefer Resend: verify `seamun.com` in the Resend dashboard, set `RESEND_API_KEY`, and leave `SMTP_HOST` unset. See [resend.com](https://resend.com) for DNS setup.

## Consent form PDF

All access codes use the official SEAMUN form at `public/documents/parentconsent-seamun.pdf`. To replace it, overwrite that file (keep the same filename) and run `npm run db:seed` so existing codes point to it.

On submit, the app fills in **signature** and **date** (page 2), plus a small e-sign audit line. Parents complete delegate details on the form itself.

## Production notes

- Change `ADMIN_SECRET` to a strong random value.
- Consider PostgreSQL for production (`@prisma/adapter-pg`).
- Verify your domain in Resend and set `EMAIL_FROM` to a real address.
- Back up `uploads/submissions/` regularly.
