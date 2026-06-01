import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { verifyDownloadToken } from "@/lib/download-token";
import { prisma } from "@/lib/prisma";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const token = new URL(request.url).searchParams.get("token");

  if (!token || !verifyDownloadToken(id, token)) {
    return NextResponse.json({ error: "Invalid or expired link." }, { status: 403 });
  }

  const submission = await prisma.submission.findUnique({
    where: { id },
  });

  if (!submission) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const absolutePath = path.join(process.cwd(), submission.signedPdfPath);
  try {
    const pdf = await fs.readFile(absolutePath);
    const filename = path.basename(submission.signedPdfPath);
    return new NextResponse(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found." }, { status: 404 });
  }
}
