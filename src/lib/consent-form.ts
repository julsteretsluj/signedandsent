/** Official SEAMUN I 2027 parental consent PDF (served from /public). */
export const OFFICIAL_CONSENT_DOCUMENT =
  "documents/parentconsent-seamun.pdf";

/**
 * Official visa letter PDF (served from /public).
 *
 * You must place the PDF at this path (or override via env) for the
 * visa-letter shared access code to work.
 */
export const OFFICIAL_VISA_LETTER_DOCUMENT =
  process.env.VISA_LETTER_DOCUMENT_PATH?.trim() ||
  "documents/visa-letter.pdf";
