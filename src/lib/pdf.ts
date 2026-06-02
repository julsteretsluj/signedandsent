import { PDFDocument, PDFFont, rgb, StandardFonts } from "pdf-lib";
import fs from "fs/promises";
import path from "path";
import type { ConsentCheckboxes } from "./consent-checkboxes";
import { PDF_CHECKBOX_PLACEMENTS } from "./consent-checkboxes";
import type { ConsentFormFields } from "./consent-form-fields";
import {
  formatDelegateDisplayName,
  PDF_DELEGATE_NAME,
  PDF_TEXT_FIELDS,
} from "./consent-form-fields";
import { drawConsentCheckmarks } from "./pdf-checkmarks";
import { OFFICIAL_CONSENT_DOCUMENT } from "./consent-form";

/**
 * Signature placement on page 2 (PDF coords, origin bottom-left).
 * Aligned to the printed “Parent/Guardian Signature” / “Date” lines in Section 5.
 */
const SIGNATURE_PAGE_INDEX = 1;
/** Printed underscore: x=231, baseline y=132 (page 2) */
const SIGNATURE_LINE = { x: 231, y: 126, maxWidth: 200, maxHeight: 28 };
/** Printed underscore: x=105, baseline y=104 */
const DATE = { x: 105, y: 104, size: 10 };
const AUDIT = { x: 72, y: 36, size: 7 };

function truncateForPdf(text: string, maxChars: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxChars) return trimmed;
  return `${trimmed.slice(0, maxChars - 1)}…`;
}

function drawFormFields(
  pages: ReturnType<PDFDocument["getPages"]>,
  font: PDFFont,
  fields: ConsentFormFields
) {
  const delegateName = formatDelegateDisplayName(fields);
  const delegatePage = pages[PDF_DELEGATE_NAME.page];
  if (delegatePage) {
    delegatePage.drawText(
      truncateForPdf(delegateName, PDF_DELEGATE_NAME.maxChars),
      {
        x: PDF_DELEGATE_NAME.x,
        y: PDF_DELEGATE_NAME.y,
        size: PDF_DELEGATE_NAME.size,
        font,
        color: rgb(0.05, 0.05, 0.05),
      }
    );
  }

  for (const placement of PDF_TEXT_FIELDS) {
    const page = pages[placement.page];
    if (!page) continue;
    const value = truncateForPdf(
      fields[placement.key],
      placement.maxChars
    );
    page.drawText(value, {
      x: placement.x,
      y: placement.y,
      size: placement.size,
      font,
      color: rgb(0.05, 0.05, 0.05),
    });
  }
}

export async function fillAndSignConsentPdf(
  documentPath: string,
  fields: ConsentFormFields,
  consents: ConsentCheckboxes,
  signaturePng: Buffer,
  signerEmail: string
): Promise<Buffer> {
  const absolutePath = path.join(process.cwd(), "public", documentPath);
  const pdfBytes = await fs.readFile(absolutePath);
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pages = pdfDoc.getPages();
  const signPage = pages[SIGNATURE_PAGE_INDEX] ?? pages[pages.length - 1];

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  drawFormFields(pages, font, fields);

  const checkPlacements = PDF_CHECKBOX_PLACEMENTS.filter(
    (p) => consents[p.key as keyof ConsentCheckboxes]
  );
  drawConsentCheckmarks(pages, checkPlacements);

  const pngImage = await pdfDoc.embedPng(signaturePng);
  const aspect = pngImage.height / pngImage.width;
  let sigWidth = SIGNATURE_LINE.maxWidth;
  let sigHeight = sigWidth * aspect;
  if (sigHeight > SIGNATURE_LINE.maxHeight) {
    sigHeight = SIGNATURE_LINE.maxHeight;
    sigWidth = sigHeight / aspect;
  }

  // Anchor signature so it sits on the underscore (y = bottom edge of image)
  const sigY = SIGNATURE_LINE.y;
  signPage.drawImage(pngImage, {
    x: SIGNATURE_LINE.x,
    y: sigY,
    width: sigWidth,
    height: sigHeight,
  });

  const dateStr = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  signPage.drawText(dateStr, {
    x: DATE.x,
    y: DATE.y,
    size: DATE.size,
    font,
    color: rgb(0.1, 0.1, 0.1),
  });

  signPage.drawText(`E-signed: ${signerEmail}`, {
    x: AUDIT.x,
    y: AUDIT.y,
    size: AUDIT.size,
    font,
    color: rgb(0.45, 0.45, 0.45),
  });

  return Buffer.from(await pdfDoc.save());
}

/** Re-apply filled consent boxes on an existing signed PDF (e.g. to replace ticks). */
export async function refreshConsentCheckboxFills(
  signedPdfBytes: Buffer,
  consents: ConsentCheckboxes
): Promise<Buffer> {
  const pdfDoc = await PDFDocument.load(signedPdfBytes);
  const pages = pdfDoc.getPages();
  const checkPlacements = PDF_CHECKBOX_PLACEMENTS.filter(
    (p) => consents[p.key as keyof ConsentCheckboxes]
  );
  drawConsentCheckmarks(pages, checkPlacements);
  return Buffer.from(await pdfDoc.save());
}

/** @deprecated Use fillAndSignConsentPdf */
export async function embedSignatureOnPdf(
  documentPath: string,
  signaturePng: Buffer,
  signerEmail: string
): Promise<Buffer> {
  return fillAndSignConsentPdf(
    documentPath,
    {
      delegateFirstName: "",
      delegateLastName: "",
      school: "",
      parentName: "",
      emergencyContact: "",
    },
    { dataConsent: true, mediaConsent: true },
    signaturePng,
    signerEmail
  );
}

export async function assertOfficialConsentPdfExists(): Promise<void> {
  const absolutePath = path.join(
    process.cwd(),
    "public",
    OFFICIAL_CONSENT_DOCUMENT
  );
  try {
    await fs.access(absolutePath);
  } catch {
    throw new Error(
      `Official consent PDF not found at public/${OFFICIAL_CONSENT_DOCUMENT}`
    );
  }
}
