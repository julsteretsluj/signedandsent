/** Section 3 consent statement checkboxes (required to submit). */
export const CONSENT_CHECKBOX_CONFIG = [
  {
    section: "Section 3 — Consent statement",
    page: 2 as const,
    items: [
      {
        key: "dataConsent",
        label: "Personal data consent",
        description:
          "I consent to the collection and use of my child's personal data for the academic and disclosed administrative purposes of SEAMUN I 2027.",
        pdf: {
          page: 1,
          outline: {
            left: 90,
            bottom: 478.71387,
            right: 109,
            top: 496.71387,
          },
        },
      },
      {
        key: "mediaConsent",
        label: "Image / likeness consent",
        description:
          "I consent to the use of my child's image/likeness in official conference media and photography.",
        pdf: {
          page: 1,
          outline: {
            left: 90,
            bottom: 445.66992,
            right: 109,
            top: 463.66992,
          },
        },
      },
    ],
  },
] as const;

export type ConsentCheckboxKey =
  (typeof CONSENT_CHECKBOX_CONFIG)[number]["items"][number]["key"];

export type ConsentCheckboxes = Record<ConsentCheckboxKey, boolean>;

export type PdfCheckboxBounds = {
  page: number;
  left: number;
  bottom: number;
  right: number;
  top: number;
};

/** Blue fill size (pt). */
const FILL_SIZE = 7;
/**
 * Calibrated fill centre inside the line-1 hollow square (template page 2).
 * Bracketed between bottom-left (cx 95) and bottom-right (cx 99.5) attempts.
 */
const FILL_CENTER_X_OFFSET = 7.25;
const FILL_CENTER_Y_BELOW_TOP = -5.42;

export function fillBoundsFromOutline(
  page: number,
  outline: { left: number; bottom: number; right: number; top: number }
): PdfCheckboxBounds {
  const cx = outline.left + FILL_CENTER_X_OFFSET;
  const cy = outline.top - FILL_CENTER_Y_BELOW_TOP;
  const half = FILL_SIZE / 2;

  return {
    page,
    left: cx - half,
    bottom: cy - half,
    right: cx + half,
    top: cy + half,
  };
}

export type PdfCheckboxPlacement = PdfCheckboxBounds & {
  key: ConsentCheckboxKey;
  outline: { left: number; bottom: number; right: number; top: number };
};

export const PDF_CHECKBOX_PLACEMENTS: PdfCheckboxPlacement[] = [];

for (const group of CONSENT_CHECKBOX_CONFIG) {
  for (const item of group.items) {
    if (item.pdf?.outline) {
      PDF_CHECKBOX_PLACEMENTS.push({
        key: item.key,
        outline: item.pdf.outline,
        ...fillBoundsFromOutline(item.pdf.page, item.pdf.outline),
      });
    }
  }
}

/** @deprecated Use PDF_CHECKBOX_PLACEMENTS */
export const PDF_CHECKMARK_PLACEMENTS = PDF_CHECKBOX_PLACEMENTS;

export function emptyConsentCheckboxes(): Record<ConsentCheckboxKey, boolean> {
  const initial = {} as Record<ConsentCheckboxKey, boolean>;
  for (const group of CONSENT_CHECKBOX_CONFIG) {
    for (const item of group.items) {
      initial[item.key] = false;
    }
  }
  return initial;
}
