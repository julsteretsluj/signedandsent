import nodemailer from "nodemailer";
import { Resend } from "resend";

export type MailAttachment = {
  filename: string;
  content: Buffer;
};

export type SendMailInput = {
  to: string | string[];
  subject: string;
  html: string;
  attachments?: MailAttachment[];
  replyTo?: string;
};

/** SMTP if SMTP_HOST is set; otherwise Resend when RESEND_API_KEY is set. */
export function getEmailProvider(): "smtp" | "resend" | null {
  if (process.env.SMTP_HOST?.trim()) {
    return "smtp";
  }
  if (process.env.RESEND_API_KEY?.trim()) {
    return "resend";
  }
  return null;
}

export function isEmailConfigured(): boolean {
  return getEmailProvider() !== null && Boolean(process.env.EMAIL_FROM?.trim());
}

function getFromAddress(): string {
  const from = process.env.EMAIL_FROM?.trim();
  if (!from) {
    throw new Error("EMAIL_FROM is not set");
  }
  return from;
}

async function sendViaSmtp(input: SendMailInput): Promise<void> {
  const host = process.env.SMTP_HOST!.trim();
  const port = Number(process.env.SMTP_PORT ?? "587");
  const secure =
    process.env.SMTP_SECURE === "true" || String(port) === "465";
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();

  const transport = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: user && pass ? { user, pass } : undefined,
  });

  await transport.verify();

  await transport.sendMail({
    from: getFromAddress(),
    to: input.to,
    replyTo: input.replyTo,
    subject: input.subject,
    html: input.html,
    attachments: input.attachments?.map((a) => ({
      filename: a.filename,
      content: a.content,
      contentType: "application/pdf",
    })),
  });
}

async function sendViaResend(input: SendMailInput): Promise<void> {
  const resend = new Resend(process.env.RESEND_API_KEY!);
  const headers = input.replyTo
    ? { "Reply-To": input.replyTo }
    : undefined;

  const res = await resend.emails.send({
    from: getFromAddress(),
    to: Array.isArray(input.to) ? input.to : [input.to],
    subject: input.subject,
    html: input.html,
    headers,
    attachments: input.attachments?.map((a) => ({
      filename: a.filename,
      content: a.content,
    })),
  });

  if (res.error) {
    throw new Error(res.error.message);
  }
}

export async function sendMail(input: SendMailInput): Promise<void> {
  const provider = getEmailProvider();
  if (!provider) {
    throw new Error("Email is not configured (set SMTP_HOST or RESEND_API_KEY)");
  }

  if (provider === "smtp") {
    await sendViaSmtp(input);
    return;
  }

  await sendViaResend(input);
}
