import { NextResponse } from "next/server";
import { ZodError } from "zod";
import path from "path";
import { findAccessCode } from "@/lib/access-codes";
import { createDownloadToken } from "@/lib/download-token";
import { sendSubmissionEmails } from "@/lib/email";
import { getPrisma, isDatabaseConfigured } from "@/lib/db-client";
import type { ConsentFormFields } from "@/lib/consent-form-fields";
import { fillAndSignConsentPdf } from "@/lib/pdf";
import { dataUrlToPngBuffer } from "@/lib/signature";
import { persistSignedPdf } from "@/lib/submission-storage";
import { copyPdfToGoogleDrive } from "@/lib/google-drive";
import { submitSchema } from "@/lib/validation";

const ENV_FALLBACK_ACCESS_CODE_ID = "env-fallback";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      code,
      email,
      signatureMethod,
      signatureImage,
      delegateFirstName,
      delegateMiddleName,
      delegateLastName,
      preferredName,
      school,
      parentName,
      emergencyContact,
      dataConsent,
      mediaConsent,
    } = submitSchema.parse(body);

    const accessCode = await findAccessCode(code);

    if (!accessCode) {
      return NextResponse.json({ error: "Invalid code." }, { status: 404 });
    }

    const signaturePng = dataUrlToPngBuffer(signatureImage);
    const formFields: ConsentFormFields = {
      delegateFirstName,
      delegateMiddleName,
      delegateLastName,
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

    const { signedPdfPath, signedPdfData } = await persistSignedPdf(
      code,
      email,
      signedPdf
    );

    let submissionId: string | undefined;
    if (
      isDatabaseConfigured() &&
      accessCode.id !== ENV_FALLBACK_ACCESS_CODE_ID
    ) {
      const submission = await getPrisma().submission.create({
        data: {
          accessCodeId: accessCode.id,
          parentEmail: email,
          signatureType: signatureMethod,
          signedPdfPath,
          signedPdfData: signedPdfData ? new Uint8Array(signedPdfData) : undefined,
        },
      });
      submissionId = submission.id;
    }

    const filename = path.basename(signedPdfPath);

    try {
      await copyPdfToGoogleDrive(filename, signedPdf);
    } catch (driveError) {
      console.error(
        "Google Drive copy error:",
        driveError instanceof Error ? driveError.message : driveError
      );
    }

    let parentCopySent = false;
    let organiserNotified = false;
    try {
      const emailResult = await sendSubmissionEmails({
        code,
        parentEmail: email,
        signatureMethod,
        signedPdf,
        filename,
        delegateFirstName,
        delegateMiddleName,
        delegateLastName,
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
      if (submissionId) {
        const token = createDownloadToken(submissionId);
        downloadUrl = `/api/submissions/${submissionId}/download?token=${token}`;
      }
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
