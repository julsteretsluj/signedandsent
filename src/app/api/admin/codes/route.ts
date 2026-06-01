import { NextResponse } from "next/server";
import { z } from "zod";
import { OFFICIAL_CONSENT_DOCUMENT } from "@/lib/consent-form";
import { assertOfficialConsentPdfExists } from "@/lib/pdf";
import { prisma } from "@/lib/prisma";

const createCodeSchema = z.object({
  label: z.string().max(120).optional(),
  code: z
    .string()
    .min(4)
    .max(32)
    .optional()
    .transform((c) => c?.trim().toUpperCase()),
});

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

export async function POST(request: Request) {
  const adminSecret = process.env.ADMIN_SECRET;
  const auth = request.headers.get("x-admin-secret");

  if (!adminSecret || auth !== adminSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { label, code: providedCode } = createCodeSchema.parse(body);
    const code = providedCode ?? generateCode();

    const existing = await prisma.accessCode.findUnique({ where: { code } });
    if (existing) {
      return NextResponse.json(
        { error: "Code already exists." },
        { status: 409 }
      );
    }

    await assertOfficialConsentPdfExists();

    const accessCode = await prisma.accessCode.create({
      data: {
        code,
        label: label?.trim() ?? "",
        documentPath: OFFICIAL_CONSENT_DOCUMENT,
      },
    });

    return NextResponse.json({
      code: accessCode.code,
      label: accessCode.label,
      documentPath: accessCode.documentPath,
      signUrl: `/sign/${accessCode.code}`,
    });
  } catch (error) {
    console.error("Create code error:", error);
    return NextResponse.json(
      { error: "Failed to create access code." },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const adminSecret = process.env.ADMIN_SECRET;
  const auth = request.headers.get("x-admin-secret");

  if (!adminSecret || auth !== adminSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const codes = await prisma.accessCode.findMany({
    orderBy: { createdAt: "desc" },
    include: { submissions: { select: { id: true, submittedAt: true } } },
  });

  return NextResponse.json({ codes });
}
