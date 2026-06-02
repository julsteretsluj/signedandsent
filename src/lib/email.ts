import { CONSENT_CHECKBOX_CONFIG } from "./consent-checkboxes";
import { formatDelegateDisplayName } from "./consent-form-fields";
import { isEmailConfigured, sendMail } from "./email-send";

/** Central inbox for all signed consent PDFs (always notified on submit). */
export const CENTRAL_INBOX_EMAIL = "information@seamun.com";

function getReplyToAddress(): string {
  return process.env.EMAIL_REPLY_TO?.trim() || CENTRAL_INBOX_EMAIL;
}

function getNotifyAddresses(): string[] {
  const raw = process.env.NOTIFY_EMAIL ?? "";
  const extra = raw
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
  return [...new Set([CENTRAL_INBOX_EMAIL, ...extra])];
}

export function canSendParentCopy(): boolean {
  return isEmailConfigured();
}

export function canSendOrganiserNotification(): boolean {
  return Boolean(canSendParentCopy() && getNotifyAddresses().length > 0);
}

export type SubmissionEmailParams = {
  code: string;
  parentEmail: string;
  signatureMethod: string;
  signedPdf: Buffer;
  filename: string;
  delegateFirstName: string;
  delegateMiddleName?: string;
  delegateLastName: string;
  preferredName?: string;
  school: string;
  parentName: string;
  emergencyContact: string;
  dataConsent: boolean;
  mediaConsent: boolean;
};

export type SubmissionEmailResult = {
  parentCopySent: boolean;
  organiserNotified: boolean;
};

const SIGNATURE_METHOD_LABELS: Record<string, string> = {
  drawn: "Drawn on signature pad",
  typed: "Typed signature",
  uploaded: "Uploaded signature image",
};

export async function sendSubmissionEmails(
  params: SubmissionEmailParams
): Promise<SubmissionEmailResult> {
  const result: SubmissionEmailResult = {
    parentCopySent: false,
    organiserNotified: false,
  };

  if (!isEmailConfigured()) {
    return result;
  }

  const replyTo = getReplyToAddress();
  const notifyTo = getNotifyAddresses();
  const submittedAt = new Date().toLocaleString("en-GB", {
    dateStyle: "full",
    timeStyle: "short",
  });

  const attachment = {
    filename: params.filename,
    content: params.signedPdf,
  };

  const organiserHtml = buildOrganiserEmailHtml(params, submittedAt);
  const parentHtml = buildParentEmailHtml(params, submittedAt);
  const delegateDisplayName = formatDelegateDisplayName(params);

  const sends: Promise<void>[] = [];

  if (canSendParentCopy()) {
    sends.push(
      sendMail({
        to: params.parentEmail,
        replyTo,
        subject: `Your signed SEAMUN consent for ${delegateDisplayName}`,
        html: parentHtml,
        attachments: [attachment],
      })
        .then(() => {
          result.parentCopySent = true;
        })
        .catch((err) => {
          console.error(
            "Parent copy email failed:",
            err instanceof Error ? err.message : err
          );
        })
    );
  }

  if (canSendOrganiserNotification()) {
    sends.push(
      sendMail({
        to: notifyTo,
        replyTo,
        subject: `SEAMUN consent: ${delegateDisplayName} (code ${params.code})`,
        html: organiserHtml,
        attachments: [attachment],
      })
        .then(() => {
          result.organiserNotified = true;
        })
        .catch((err) => {
          console.error(
            "Organiser email failed:",
            err instanceof Error ? err.message : err
          );
        })
    );
  }

  await Promise.all(sends);
  return result;
}

function buildOrganiserEmailHtml(
  params: SubmissionEmailParams,
  submittedAt: string
): string {
  const signatureLabel =
    SIGNATURE_METHOD_LABELS[params.signatureMethod] ?? params.signatureMethod;

  const delegateDisplayName = formatDelegateDisplayName(params);

  const section1Rows = [
    row("Delegate name (on PDF)", delegateDisplayName),
    row("First name", params.delegateFirstName),
    row("Middle name", params.delegateMiddleName || "—"),
    row("Last name", params.delegateLastName),
    row("Preferred name", params.preferredName || "—"),
    row("School / institution", params.school),
    row("Parent / guardian", params.parentName),
    row("Emergency contact", params.emergencyContact),
  ].join("");

  const consentRows = CONSENT_CHECKBOX_CONFIG.flatMap((group) =>
    group.items.map((item) => {
      const agreed =
        params[item.key as keyof Pick<
          SubmissionEmailParams,
          "dataConsent" | "mediaConsent"
        >];
      return row(
        item.label,
        agreed ? "Yes — agreed" : "No",
        item.description
      );
    })
  ).join("");

  const submissionRows = [
    row("Access code", params.code),
    row("Parent email", params.parentEmail),
    row("Signature method", signatureLabel),
    row("Submitted", submittedAt),
    row("PDF filename", params.filename),
  ].join("");

  return emailShell(`
    <h2 style="margin:0 0 8px;color:#0c2340;font-size:20px">New parental consent submitted</h2>
    <p style="margin:0 0 20px;color:#475569;font-size:15px;line-height:1.5">
      A signed SEAMUN I 2027 consent form has been received via Signed &amp; Sent.
      Full response details are below; the signed PDF is attached.
    </p>

    ${sectionHeading("Section 1 — Delegate &amp; parent information")}
    <table style="${tableStyle}">${section1Rows}</table>

    ${sectionHeading("Section 3 — Consent statement")}
    <table style="${tableStyle}">${consentRows}</table>

    ${sectionHeading("Submission details")}
    <table style="${tableStyle}">${submissionRows}</table>

    ${secretariatSignatureBlock()}
  `);
}

function buildParentEmailHtml(
  params: SubmissionEmailParams,
  submittedAt: string
): string {
  const delegateDisplayName = formatDelegateDisplayName(params);

  return emailShell(`
    <h2 style="margin:0 0 8px;color:#0c2340;font-size:20px">Your signed SEAMUN I 2027 consent form</h2>
    <p style="margin:0 0 12px;color:#334155;font-size:15px;line-height:1.5">
      Dear ${escapeHtml(params.parentName)},
    </p>
    <p style="margin:0 0 12px;color:#334155;font-size:15px;line-height:1.5">
      Thank you for submitting the parental consent and data privacy form for
      <strong>${escapeHtml(delegateDisplayName)}</strong>
      (${escapeHtml(params.school)}).
    </p>
    <p style="margin:0 0 20px;color:#334155;font-size:15px;line-height:1.5">
      Submitted on ${escapeHtml(submittedAt)}.
      <strong>Your signed PDF is attached</strong> — please save it for your records.
    </p>
    <p style="margin:0 0 20px;color:#334155;font-size:15px;line-height:1.5">
      If you have questions, contact the organisers at
      <a href="mailto:information@seamun.com" style="color:#1e5aa0">information@seamun.com</a>.
    </p>
    ${secretariatSignatureBlock()}
  `);
}

function secretariatSignatureBlock(): string {
  const signatoryName =
    process.env.SECRETARIAT_SIGNATORY_NAME?.trim() ||
    "SEAMUN I 2027 Secretariat";
  const signatoryTitle =
    process.env.SECRETARIAT_SIGNATORY_TITLE?.trim() ||
    "On behalf of the Secretariat · Signed & Sent";

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  const logoHtml = appUrl
    ? `<img src="${escapeHtml(appUrl)}/logo.png" alt="Signed &amp; Sent" width="160" height="42" style="display:block;margin-bottom:12px;height:36px;width:auto" />`
    : "";

  return `
    <div style="margin-top:28px;padding-top:20px;border-top:1px solid #e2e8f0">
      ${logoHtml}
      <p style="margin:0 0 16px;color:#334155;font-size:15px;line-height:1.5">Yours sincerely,</p>
      <p style="margin:0 0 4px;color:#0c2340;font-size:17px;font-weight:600;font-family:Georgia,'Times New Roman',serif">
        ${escapeHtml(signatoryName)}
      </p>
      <p style="margin:0 0 12px;color:#1e5aa0;font-size:14px">
        ${escapeHtml(signatoryTitle)}
      </p>
      <p style="margin:0;color:#64748b;font-size:13px;line-height:1.5">
        SEAMUN I 2027 · Parental consent &amp; data privacy<br />
        <a href="mailto:information@seamun.com" style="color:#1e5aa0;text-decoration:none">information@seamun.com</a>
      </p>
    </div>
  `;
}

const tableStyle =
  "border-collapse:collapse;width:100%;margin:0 0 4px;font-size:14px";

function sectionHeading(title: string): string {
  return `<h3 style="margin:24px 0 8px;color:#0c2340;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.04em">${title}</h3>`;
}

function row(label: string, value: string, detail?: string): string {
  const detailHtml = detail
    ? `<div style="margin-top:4px;color:#64748b;font-size:12px;line-height:1.4">${escapeHtml(detail)}</div>`
    : "";
  return `<tr>
    <td style="padding:8px 16px 8px 0;vertical-align:top;font-weight:600;color:#475569;white-space:nowrap;width:1%">${escapeHtml(label)}</td>
    <td style="padding:8px 0;vertical-align:top;color:#0f172a;line-height:1.4">${escapeHtml(value)}${detailHtml}</td>
  </tr>`;
}

function emailShell(body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:24px 16px;background:#f7f9fc;font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:28px 24px">
    ${body}
  </div>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
