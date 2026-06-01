# Signed & Sent

Digital parental consent signing for **SEAMUN I 2027**. Parents enter an access code, review the official consent form, sign (draw, type, or upload), and submit with their email.

## Quick start

```bash
npm install
npm run db:migrate   # if not already applied
npm run db:seed      # creates demo codes
npm run dev
```

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
| `DATABASE_URL` | SQLite path, e.g. `file:./prisma/dev.db` |
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
