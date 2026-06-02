import { z } from "zod";

const namePart = (label: string, max = 60) =>
  z.string().trim().min(1, `${label} is required`).max(max);

const optionalNamePart = z
  .string()
  .max(60)
  .optional()
  .transform((v) => v?.trim() || undefined);

/** Section 1 fields — typed on the website and drawn onto page 1 of the PDF. */
export const consentFormFieldsSchema = z.object({
  delegateFirstName: namePart("First name"),
  delegateMiddleName: optionalNamePart,
  delegateLastName: namePart("Last name"),
  preferredName: optionalNamePart,
  school: z.string().min(1, "School / institution is required").max(120),
  parentName: z.string().min(1, "Parent / guardian name is required").max(120),
  emergencyContact: z
    .string()
    .min(5, "Emergency contact number is required")
    .max(40),
});

export type ConsentFormFields = {
  delegateFirstName: string;
  delegateMiddleName?: string;
  delegateLastName: string;
  preferredName?: string;
  school: string;
  parentName: string;
  emergencyContact: string;
};

export type DelegateNameFieldConfig = {
  key:
    | "delegateFirstName"
    | "delegateMiddleName"
    | "delegateLastName"
    | "preferredName";
  label: string;
  placeholder: string;
  guide: string;
  optional?: boolean;
};

export const DELEGATE_NAME_FIELDS: DelegateNameFieldConfig[] = [
  {
    key: "delegateFirstName",
    label: "First name",
    placeholder: "e.g. Jordan",
    guide: "Your child's legal first name (as on passport or school records).",
  },
  {
    key: "delegateMiddleName",
    label: "Middle name (optional)",
    placeholder: "e.g. Kai",
    optional: true,
    guide: "Middle name or initial, if applicable.",
  },
  {
    key: "delegateLastName",
    label: "Last name",
    placeholder: "e.g. Rivers",
    guide: "Your child's legal surname or family name.",
  },
  {
    key: "preferredName",
    label: "Preferred name (optional)",
    placeholder: "e.g. J.K.",
    optional: true,
    guide:
      "If provided, appears in brackets after the first and middle names on the PDF (e.g. Jordan Kai (J.K.) Rivers).",
  },
];

export type ConsentFieldConfig = {
  key: "school" | "parentName" | "emergencyContact";
  label: string;
  placeholder: string;
  guide: string;
  optional?: boolean;
  inputMode?: "text" | "tel";
};

export const CONSENT_FORM_FIELDS: ConsentFieldConfig[] = [
  {
    key: "school",
    label: "School / institution",
    placeholder: "e.g. Northbridge Model United Nations Academy",
    guide: "The school or organisation your child represents.",
  },
  {
    key: "parentName",
    label: "Parent / guardian name",
    placeholder: "e.g. Ms. Taylor Morgan",
    guide: "Full name of the parent or legal guardian signing this form.",
  },
  {
    key: "emergencyContact",
    label: "Emergency contact number",
    placeholder: "e.g. +1 555 010 2847",
    guide:
      "Phone number reachable during the conference (16–17 Jan 2027). Include country code.",
    inputMode: "tel",
  },
];

/** First [Middle] (Preferred) Last — used on the PDF and in emails. */
export function formatDelegateDisplayName(fields: {
  delegateFirstName: string;
  delegateMiddleName?: string;
  delegateLastName: string;
  preferredName?: string;
}): string {
  const first = fields.delegateFirstName.trim();
  const middle = fields.delegateMiddleName?.trim() ?? "";
  const last = fields.delegateLastName.trim();
  const preferred = fields.preferredName?.trim() ?? "";

  let leading = first;
  if (middle) {
    leading = `${leading} ${middle}`;
  }
  if (preferred) {
    leading = `${leading} (${preferred})`;
  }
  return `${leading} ${last}`.replace(/\s+/g, " ").trim();
}

/** PDF coordinates (origin bottom-left), aligned to underscore lines on page 1. */
export const PDF_TEXT_FIELDS: {
  key: "school" | "parentName" | "emergencyContact";
  page: number;
  x: number;
  y: number;
  size: number;
  maxChars: number;
}[] = [
  { key: "school", page: 0, x: 220, y: 634, size: 10, maxChars: 52 },
  { key: "parentName", page: 0, x: 248, y: 607, size: 10, maxChars: 44 },
  { key: "emergencyContact", page: 0, x: 280, y: 579, size: 10, maxChars: 28 },
];

export const PDF_DELEGATE_NAME = {
  page: 0,
  x: 228,
  y: 662,
  size: 10,
  maxChars: 48,
};
