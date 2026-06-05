import {
  OFFICIAL_CONSENT_DOCUMENT,
  OFFICIAL_VISA_LETTER_DOCUMENT,
} from "./consent-form";

export type FormKind = "consent" | "visaLetter";

export function getFormKindFromCode(code: string): FormKind {
  const normalized = code.trim().toUpperCase();
  if (normalized.includes("VISA")) return "visaLetter";
  return "consent";
}

export function getFormKindFromDocumentPath(
  documentPath: string | undefined
): FormKind | null {
  if (!documentPath) return null;
  if (documentPath === OFFICIAL_VISA_LETTER_DOCUMENT) return "visaLetter";
  if (documentPath === OFFICIAL_CONSENT_DOCUMENT) return "consent";
  return null;
}

export function getFormKind(params: {
  code: string;
  documentPath?: string;
}): FormKind {
  return (
    getFormKindFromDocumentPath(params.documentPath) ??
    getFormKindFromCode(params.code)
  );
}

export function getFormKindLabel(formKind: FormKind): string {
  return formKind === "visaLetter" ? "Visa letter" : "Parental consent";
}

