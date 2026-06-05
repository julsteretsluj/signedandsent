import fs from "fs/promises";
import path from "path";
import { PDFDocument, StandardFonts, rgb, type PDFPage, type PDFFont } from "pdf-lib";
import { OFFICIAL_VISA_LETTER_DOCUMENT } from "./consent-form";
import type { VisaLetterFields } from "./visa-letter-fields";

/** Handwritten Secretary-General signature (served from /public). */
export const SECRETARIAT_SIGNATURE_DOCUMENT =
  "documents/secretariat-signature.png";

const VALUE_FONT_SIZE = 11;
const RECT_PADDING_X = 2;
const RECT_PADDING_Y = 1.5;

// Coordinates derived from pdfjs text-item transforms on the template.
// Origin is bottom-left (pdf-lib drawText / drawRectangle space).
const COORDS = {
  email: { x: 180.3566972851373, y: 647.7322215511562 },
  fullName: { x: 212.99065094138115, y: 391.60896502295896 },
  passportNumber: { x: 328.7757746642584, y: 391.60896502295896 },
  nationality: { x: 407.37107216724945, y: 391.60896502295896 },
  conferenceRole: { x: 523.321832824392, y: 391.60896502295896 },
  /** Between "Sincerely," (y≈211) and typed name (y≈163). */
  signature: { x: 72, y: 168, maxWidth: 175, maxHeight: 40 },
};

function drawValue({
  page,
  font,
  x,
  y,
  text,
  fontSize,
  maxBoxWidth,
}: {
  page: PDFPage;
  font: PDFFont;
  x: number;
  y: number;
  text: string;
  fontSize: number;
  maxBoxWidth?: number;
}) {
  const safeText = text ?? "";
  const width =
    typeof font.widthOfTextAtSize === "function"
      ? font.widthOfTextAtSize(safeText, fontSize)
      : safeText.length * (fontSize * 0.55);
  const boxWidth = Math.min(width + RECT_PADDING_X * 2, maxBoxWidth ?? 1000);
  const boxHeight = fontSize + RECT_PADDING_Y * 2;

  // Cover any existing template placeholder/sample text behind.
  page.drawRectangle({
    x,
    y: y - fontSize - RECT_PADDING_Y,
    width: boxWidth,
    height: boxHeight,
    color: rgb(1, 1, 1),
  });

  page.drawText(safeText, {
    x,
    y,
    size: fontSize,
    font,
    color: rgb(0, 0, 0),
  });
}

async function drawSecretariatSignature(page: PDFPage, pdfDoc: PDFDocument) {
  const signaturePath = path.join(
    process.cwd(),
    "public",
    SECRETARIAT_SIGNATURE_DOCUMENT
  );
  const signatureBytes = await fs.readFile(signaturePath);
  const signatureImage = await pdfDoc.embedPng(signatureBytes);

  const { x, y, maxWidth, maxHeight } = COORDS.signature;
  const aspect = signatureImage.height / signatureImage.width;

  let sigWidth = maxWidth;
  let sigHeight = sigWidth * aspect;
  if (sigHeight > maxHeight) {
    sigHeight = maxHeight;
    sigWidth = sigHeight / aspect;
  }

  // Clear the signature gap on the template before drawing.
  page.drawRectangle({
    x,
    y,
    width: maxWidth + 8,
    height: maxHeight + 6,
    color: rgb(1, 1, 1),
  });

  page.drawImage(signatureImage, {
    x,
    y,
    width: sigWidth,
    height: sigHeight,
  });
}

export async function fillVisaLetterPdf(
  fields: VisaLetterFields & { email: string }
): Promise<Buffer> {
  const absolutePath = path.join(
    process.cwd(),
    "public",
    OFFICIAL_VISA_LETTER_DOCUMENT
  );

  const pdfBytes = await fs.readFile(absolutePath);
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pages = pdfDoc.getPages();
  const page = pages[0];
  if (!page) throw new Error("Visa letter template has no pages.");

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Participant info row.
  drawValue({
    page,
    font,
    x: COORDS.fullName.x,
    y: COORDS.fullName.y,
    text: fields.fullName,
    fontSize: VALUE_FONT_SIZE,
    maxBoxWidth: 220,
  });
  drawValue({
    page,
    font,
    x: COORDS.passportNumber.x,
    y: COORDS.passportNumber.y,
    text: fields.passportNumber,
    fontSize: VALUE_FONT_SIZE,
    maxBoxWidth: 160,
  });
  drawValue({
    page,
    font,
    x: COORDS.nationality.x,
    y: COORDS.nationality.y,
    text: fields.nationality,
    fontSize: VALUE_FONT_SIZE,
    maxBoxWidth: 140,
  });
  drawValue({
    page,
    font,
    x: COORDS.conferenceRole.x,
    y: COORDS.conferenceRole.y,
    text:
      fields.conferenceRole === "delegate"
        ? "Delegate"
        : fields.conferenceRole === "chair"
          ? "Chair"
          : "Advisor",
    fontSize: VALUE_FONT_SIZE,
    maxBoxWidth: 120,
  });

  // Email line — overwrite the "provided email" segment while leaving the rest of template intact.
  drawValue({
    page,
    font,
    x: COORDS.email.x,
    y: COORDS.email.y,
    text: fields.email,
    fontSize: VALUE_FONT_SIZE,
    maxBoxWidth: 200,
  });

  await drawSecretariatSignature(page, pdfDoc);

  return Buffer.from(await pdfDoc.save());
}

