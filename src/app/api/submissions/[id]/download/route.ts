import { NextResponse } from "next/server";
import path from "path";
import { verifyDownloadToken } from "@/lib/download-token";
import { getPrisma } from "@/lib/db-client";
import { readSignedPdf } from "@/lib/submission-storage";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const token = new URL(request.url).searchParams.get("token");

  if (!token || !verifyDownloadToken(id, token)) {
    return NextResponse.json({ error: "Invalid or expired link." }, { status: 403 });
  }

  const submission = await getPrisma().submission.findUnique({
    where: { id },
  });

  if (!submission) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const pdf = await readSignedPdf(submission);
  if (!pdf) {
    return NextResponse.json({ error: "File not found." }, { status: 404 });
  }

  const filename = path.basename(submission.signedPdfPath);
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
