import { PDFDocument } from "pdf-lib";
import fs from "fs/promises";
import path from "path";
import type { ConsentCheckboxes } from "./consent-checkboxes";
import { PDF_CHECKBOX_PLACEMENTS } from "./consent-checkboxes";
import { drawConsentCheckmarks } from "./pdf-checkmarks";
import { OFFICIAL_CONSENT_DOCUMENT } from "./consent-form";

/** Rebuild page 2 from the blank template + signature block from a signed PDF. */
export async function regenerateSignedPdf(
  signedPdfBytes: Buffer,
  consents: ConsentCheckboxes
): Promise<Buffer> {
  const blankBytes = await fs.readFile(
    path.join(process.cwd(), "public", OFFICIAL_CONSENT_DOCUMENT)
  );

  const signed = await PDFDocument.load(signedPdfBytes);
  const blank = await PDFDocument.load(blankBytes);
  const out = await PDFDocument.create();

  const [page0] = await out.copyPages(signed, [0]);
  const [page2] = await out.copyPages(blank, [1]);
  out.addPage(page0);
  out.addPage(page2);

  const pages = out.getPages();
  const signedPage2 = signed.getPages()[1];

  const checkPlacements = PDF_CHECKBOX_PLACEMENTS.filter(
    (p) => consents[p.key as keyof ConsentCheckboxes]
  );
  drawConsentCheckmarks(pages, checkPlacements);

  // Stamp signature, date, and audit line from the prior signed page 2
  const signatureBlock = await out.embedPage(signedPage2, {
    left: 70,
    bottom: 32,
    right: 520,
    top: 210,
  });
  pages[1].drawPage(signatureBlock, {
    x: 70,
    y: 32,
    width: 450,
    height: 178,
  });

  return Buffer.from(await out.save());
}
