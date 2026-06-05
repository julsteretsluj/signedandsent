import { NextResponse } from "next/server";
import { ZodError } from "zod";
import path from "path";
import { findAccessCode } from "@/lib/access-codes";
import { createDownloadToken } from "@/lib/download-token";
import { sendSubmissionEmails, sendVisaLetterEmails } from "@/lib/email";
import { getPrisma, isDatabaseConfigured } from "@/lib/db-client";
import type { ConsentFormFields } from "@/lib/consent-form-fields";
import { fillAndSignConsentPdf } from "@/lib/pdf";
import { dataUrlToPngBuffer } from "@/lib/signature";
import { persistSignedPdf } from "@/lib/submission-storage";
import { copyConsentPdfToGoogleDrive } from "@/lib/google-drive";
import { lookupSchema, consentSubmitSchema, visaLetterSubmitSchema } from "@/lib/validation";
import { getFormKind } from "@/lib/form-kind";
import { fillVisaLetterPdf } from "@/lib/visa-letter";

const ENV_FALLBACK_ACCESS_CODE_ID = "env-fallback";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code } = lookupSchema.parse(body);

    const accessCode = await findAccessCode(code);

    if (!accessCode) {
      return NextResponse.json({ error: "Invalid code." }, { status: 404 });
    }

    const formKind = getFormKind({
      code,
      documentPath: accessCode.documentPath,
    });

    const {
      signedPdf,
      signedPdfPath,
      signedPdfData,
      filename,
      email,
      signatureType,
    } =
      await (async () => {
        if (formKind === "visaLetter") {
          const parsed = visaLetterSubmitSchema.parse(body);
          const { fullName, passportNumber, nationality, conferenceRole } =
            parsed;

          const generatedPdf = await fillVisaLetterPdf({
            fullName,
            passportNumber,
            nationality,
            conferenceRole,
            email: parsed.email,
          });

          const { signedPdfPath, signedPdfData } = await persistSignedPdf(
            code,
            parsed.email,
            generatedPdf
          );

          // Keep signedPdfData for DB persistence below.
          return {
            signedPdf: generatedPdf,
            signedPdfPath,
            signedPdfData,
            filename: path.basename(signedPdfPath),
            email: parsed.email,
            signatureType: "visaLetter",
          };
        }

        const parsed = consentSubmitSchema.parse(body);
        const {
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
        } = parsed;

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
        const generatedPdf = await fillAndSignConsentPdf(
          accessCode.documentPath,
          formFields,
          consents,
          signaturePng,
          email
        );

        const { signedPdfPath, signedPdfData } = await persistSignedPdf(
          code,
          email,
          generatedPdf
        );

        return {
          signedPdf: generatedPdf,
          signedPdfPath,
          signedPdfData,
          filename: path.basename(signedPdfPath),
          email,
          signatureType: signatureMethod,
        };
      })();

    let submissionId: string | undefined;
    if (
      isDatabaseConfigured() &&
      accessCode.id !== ENV_FALLBACK_ACCESS_CODE_ID
    ) {
      const submission = await getPrisma().submission.create({
        data: {
          accessCodeId: accessCode.id,
          parentEmail: email,
          signatureType,
          signedPdfPath,
          signedPdfData: signedPdfData
            ? new Uint8Array(signedPdfData)
            : undefined,
        },
      });
      submissionId = submission.id;
    }

    if (formKind === "consent") {
      try {
        const driveUploaded = await copyConsentPdfToGoogleDrive(
          filename,
          signedPdf
        );
        if (!driveUploaded) {
          console.error(
            `Google Drive: parental consent NOT saved (${filename}). Check GOOGLE_OAUTH_* and GOOGLE_DRIVE_FOLDER_ID in production env.`
          );
        }
      } catch (driveError) {
        console.error(
          "Google Drive consent upload error:",
          driveError instanceof Error ? driveError.message : driveError
        );
      }
    }

    let parentCopySent = false;
    let organiserNotified = false;
    try {
      const emailResult =
        formKind === "visaLetter"
          ? await sendVisaLetterEmails({
              signedPdf,
              filename,
              ...visaLetterSubmitSchema.parse(body),
            })
          : await sendSubmissionEmails({
              code,
              parentEmail: email,
              signatureMethod: signatureType,
              signedPdf,
              filename,
              ...(() => {
                const parsed = consentSubmitSchema.parse(body);
                return {
                  delegateFirstName: parsed.delegateFirstName,
                  delegateMiddleName: parsed.delegateMiddleName,
                  delegateLastName: parsed.delegateLastName,
                  preferredName: parsed.preferredName,
                  school: parsed.school,
                  parentName: parsed.parentName,
                  emergencyContact: parsed.emergencyContact,
                  dataConsent: parsed.dataConsent,
                  mediaConsent: parsed.mediaConsent,
                };
              })(),
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
        formKind === "visaLetter"
          ? "Your visa letter has been submitted successfully. Thank you!"
          : "Your signed parental consent form has been submitted successfully. Thank you!",
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error:
            error.issues[0]?.message ??
            "Please complete all required fields for your form.",
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
