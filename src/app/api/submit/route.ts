import { NextResponse } from "next/server";
import { ZodError } from "zod";
import fs from "fs/promises";
import path from "path";
import { createDownloadToken } from "@/lib/download-token";
import { sendSubmissionEmails } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { fillAndSignConsentPdf } from "@/lib/pdf";
import { dataUrlToPngBuffer } from "@/lib/signature";
import { submitSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      code,
      email,
      signatureMethod,
      signatureImage,
      delegateName,
      preferredName,
      school,
      parentName,
      emergencyContact,
      dataConsent,
      mediaConsent,
    } = submitSchema.parse(body);

    const accessCode = await prisma.accessCode.findUnique({
      where: { code },
    });

    if (!accessCode) {
      return NextResponse.json({ error: "Invalid code." }, { status: 404 });
    }

    const signaturePng = dataUrlToPngBuffer(signatureImage);
    const formFields = {
      delegateName,
      preferredName,
      school,
      parentName,
      emergencyContact,
    };
    const consents = { dataConsent, mediaConsent };
    const signedPdf = await fillAndSignConsentPdf(
      accessCode.documentPath,
      formFields,
      consents,
      signaturePng,
      email
    );

    const submissionsDir = path.join(process.cwd(), "uploads", "submissions");
    await fs.mkdir(submissionsDir, { recursive: true });

    const emailSlug = email
      .split("@")[0]
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .slice(0, 40);
    const filename = `${code}-${emailSlug}-${Date.now()}.pdf`;
    const signedPdfPath = path.join("uploads", "submissions", filename);
    await fs.writeFile(path.join(process.cwd(), signedPdfPath), signedPdf);

    const submission = await prisma.submission.create({
      data: {
        accessCodeId: accessCode.id,
        parentEmail: email,
        signatureType: signatureMethod,
        signedPdfPath,
      },
    });

    let parentCopySent = false;
    let organiserNotified = false;
    try {
      const emailResult = await sendSubmissionEmails({
        code,
        parentEmail: email,
        signatureMethod,
        signedPdf,
        filename,
        delegateName,
        preferredName,
        school,
        parentName,
        emergencyContact,
        dataConsent,
        mediaConsent,
      });
      parentCopySent = emailResult.parentCopySent;
      organiserNotified = emailResult.organiserNotified;
    } catch (emailError) {
      console.error(
        "Email notification error:",
        emailError instanceof Error ? emailError.message : emailError
      );
    }

    let downloadUrl: string | undefined;
    try {
      const token = createDownloadToken(submission.id);
      downloadUrl = `/api/submissions/${submission.id}/download?token=${token}`;
    } catch {
      // ADMIN_SECRET not set — skip download link
    }

    return NextResponse.json({
      success: true,
      parentCopySent,
      organiserNotified,
      downloadUrl,
      message:
        "Your signed parental consent form has been submitted successfully. Thank you!",
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error:
            error.issues[0]?.message ??
            "Please complete all fields, consent checkboxes, and your signature.",
        },
        { status: 400 }
      );
    }
    console.error("Submit error:", error);
    return NextResponse.json(
      { error: "Failed to submit. Please try again." },
      { status: 500 }
    );
  }
}
