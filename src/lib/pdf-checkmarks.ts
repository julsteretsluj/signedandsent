import { PDFPage, rgb } from "pdf-lib";
import type { PdfCheckboxPlacement } from "./consent-checkboxes";

const FILL_COLOR = rgb(0.05, 0.25, 0.45);

/** Fill centred in the line-1 checkbox square. */
function fillCheckbox(
  page: PDFPage,
  bounds: { left: number; bottom: number; right: number; top: number }
) {
  const width = bounds.right - bounds.left;
  const height = bounds.top - bounds.bottom;
  page.drawRectangle({
    x: bounds.left,
    y: bounds.bottom,
    width,
    height,
    color: FILL_COLOR,
    borderWidth: 0,
  });
}

export function drawConsentCheckmarks(
  pages: PDFPage[],
  placements: PdfCheckboxPlacement[]
) {
  for (const placement of placements) {
    const page = pages[placement.page];
    if (!page) continue;

    const { outline } = placement;
    page.drawRectangle({
      x: outline.left - 1,
      y: outline.top - 11,
      width: outline.right - outline.left + 2,
      height: 12,
      color: rgb(1, 1, 1),
      borderWidth: 0,
    });

    fillCheckbox(page, placement);
  }
}
